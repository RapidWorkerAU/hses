"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CanvasElementRow,
  AnchorLinkRow,
  DocumentNodeRow,
  DocumentTypeRow,
  NodeRelationRow,
  OutlineItemRow,
  SystemMap,
} from "./canvasShared";
import { restoreMapSessionHistorySnapshot } from "./mapSessionHistoryApi";
import { buildMapSessionHistorySnapshot, type MapSessionHistorySnapshot } from "./mapSnapshotUtils";

type MapSessionHistoryEntry = {
  snapshotHash: string;
  snapshot: MapSessionHistorySnapshot;
};

const MAX_SESSION_HISTORY_ENTRIES = 40;
const HISTORY_CAPTURE_DEBOUNCE_MS = 180;

const buildSnapshotHash = (snapshot: MapSessionHistorySnapshot) => {
  const serialized = JSON.stringify(snapshot);
  let hashA = 0x811c9dc5;
  let hashB = 0x9e3779b9;
  for (let index = 0; index < serialized.length; index += 1) {
    const code = serialized.charCodeAt(index);
    hashA = Math.imul(hashA ^ code, 16777619);
    hashB = Math.imul(hashB + code, 1597334677);
  }
  return `${serialized.length}:${(hashA >>> 0).toString(36)}:${(hashB >>> 0).toString(36)}`;
};

type UseMapSessionHistoryParams = {
  canWriteMap: boolean;
  loading: boolean;
  mapId: string;
  userId: string | null;
  map: SystemMap | null;
  types: DocumentTypeRow[];
  nodes: DocumentNodeRow[];
  elements: CanvasElementRow[];
  relations: NodeRelationRow[];
  anchorLinks: AnchorLinkRow[];
  outlineItems: OutlineItemRow[];
  applyHistorySnapshotLocally: (snapshot: MapSessionHistorySnapshot) => void;
  setError: (message: string | null) => void;
};

export function useMapSessionHistory({
  canWriteMap,
  loading,
  mapId,
  userId,
  map,
  types,
  nodes,
  elements,
  relations,
  anchorLinks,
  outlineItems,
  applyHistorySnapshotLocally,
  setError,
}: UseMapSessionHistoryParams) {
  const historyPersistTimerRef = useRef<number | null>(null);
  const historyApplyingRef = useRef(false);
  const historyInitializedRef = useRef(false);
  const historyEntriesRef = useRef<MapSessionHistoryEntry[]>([]);
  const historyCursorRef = useRef(-1);

  const [historyEntries, setHistoryEntries] = useState<MapSessionHistoryEntry[]>([]);
  const [historyCursor, setHistoryCursor] = useState(-1);
  const [isApplyingHistory, setIsApplyingHistory] = useState(false);

  useEffect(() => {
    historyEntriesRef.current = historyEntries;
  }, [historyEntries]);

  useEffect(() => {
    historyCursorRef.current = historyCursor;
  }, [historyCursor]);

  const canUndoSessionMapChanges = canWriteMap && historyCursor > 0 && !isApplyingHistory;
  const canRedoSessionMapChanges =
    canWriteMap && historyCursor >= 0 && historyCursor < historyEntries.length - 1 && !isApplyingHistory;

  const buildCurrentHistorySnapshot = useCallback(
    () => buildMapSessionHistorySnapshot(map, { types, nodes, elements, relations, anchorLinks, outlineItems }),
    [anchorLinks, elements, map, nodes, outlineItems, relations, types]
  );

  const clearPendingHistoryCapture = useCallback(() => {
    if (!historyPersistTimerRef.current) return;
    window.clearTimeout(historyPersistTimerRef.current);
    historyPersistTimerRef.current = null;
  }, []);

  const recordHistorySnapshot = useCallback(
    (snapshot: MapSessionHistorySnapshot, forceInitial = false) => {
      if (!canWriteMap || !userId) return;
      if (forceInitial && historyInitializedRef.current) return;

      const snapshotHash = buildSnapshotHash(snapshot);
      const latestEntries = historyEntriesRef.current;
      const latestCursor = historyCursorRef.current;
      const activeEntries = latestEntries.slice(0, latestCursor + 1);
      const currentEntry = latestCursor >= 0 ? latestEntries[latestCursor] : null;

      if (!forceInitial && currentEntry?.snapshotHash === snapshotHash) return;

      const nextEntry: MapSessionHistoryEntry = { snapshotHash, snapshot };
      const uncappedEntries = forceInitial ? [nextEntry] : [...activeEntries, nextEntry];
      const nextEntries = uncappedEntries.slice(-MAX_SESSION_HISTORY_ENTRIES);

      historyInitializedRef.current = true;
      historyEntriesRef.current = nextEntries;
      historyCursorRef.current = nextEntries.length - 1;
      setHistoryEntries(nextEntries);
      setHistoryCursor(nextEntries.length - 1);
    },
    [canWriteMap, userId]
  );

  const handleUndoSessionChanges = useCallback(async () => {
    if (!canUndoSessionMapChanges) return;
    const currentEntry = historyEntries[historyCursor];
    const targetEntry = historyEntries[historyCursor - 1];
    if (!targetEntry) return;
    const nextCursor = Math.max(0, historyCursor - 1);

    try {
      setIsApplyingHistory(true);
      historyApplyingRef.current = true;
      clearPendingHistoryCapture();
      applyHistorySnapshotLocally(targetEntry.snapshot);
      historyCursorRef.current = nextCursor;
      setHistoryCursor(nextCursor);
      await restoreMapSessionHistorySnapshot({ mapId, snapshot: targetEntry.snapshot });
    } catch (undoError) {
      if (currentEntry) {
        applyHistorySnapshotLocally(currentEntry.snapshot);
        historyCursorRef.current = historyCursor;
        setHistoryCursor(historyCursor);
      }
      setError(undoError instanceof Error ? undoError.message : "Unable to undo the last change.");
    } finally {
      window.setTimeout(() => {
        historyApplyingRef.current = false;
        setIsApplyingHistory(false);
      }, 60);
    }
  }, [
    applyHistorySnapshotLocally,
    canUndoSessionMapChanges,
    clearPendingHistoryCapture,
    historyCursor,
    historyEntries,
    mapId,
    setError,
  ]);

  const handleRedoSessionChanges = useCallback(async () => {
    if (!canRedoSessionMapChanges) return;
    const currentEntry = historyEntries[historyCursor];
    const targetEntry = historyEntries[historyCursor + 1];
    if (!targetEntry) return;
    const nextCursor = Math.min(historyEntries.length - 1, historyCursor + 1);

    try {
      setIsApplyingHistory(true);
      historyApplyingRef.current = true;
      clearPendingHistoryCapture();
      applyHistorySnapshotLocally(targetEntry.snapshot);
      historyCursorRef.current = nextCursor;
      setHistoryCursor(nextCursor);
      await restoreMapSessionHistorySnapshot({ mapId, snapshot: targetEntry.snapshot });
    } catch (redoError) {
      if (currentEntry) {
        applyHistorySnapshotLocally(currentEntry.snapshot);
        historyCursorRef.current = historyCursor;
        setHistoryCursor(historyCursor);
      }
      setError(redoError instanceof Error ? redoError.message : "Unable to redo the change.");
    } finally {
      window.setTimeout(() => {
        historyApplyingRef.current = false;
        setIsApplyingHistory(false);
      }, 60);
    }
  }, [
    applyHistorySnapshotLocally,
    canRedoSessionMapChanges,
    clearPendingHistoryCapture,
    historyCursor,
    historyEntries,
    mapId,
    setError,
  ]);

  useEffect(() => {
    if (!canWriteMap || loading || historyInitializedRef.current || !userId) return;
    const snapshot = buildCurrentHistorySnapshot();
    if (!snapshot) return;
    recordHistorySnapshot(snapshot, true);
  }, [buildCurrentHistorySnapshot, canWriteMap, loading, recordHistorySnapshot, userId]);

  useEffect(() => {
    if (!canWriteMap || loading || !historyInitializedRef.current || historyApplyingRef.current) return;
    const snapshot = buildCurrentHistorySnapshot();
    if (!snapshot) return;

    if (historyPersistTimerRef.current) {
      window.clearTimeout(historyPersistTimerRef.current);
    }

    historyPersistTimerRef.current = window.setTimeout(() => {
      historyPersistTimerRef.current = null;
      if (historyApplyingRef.current) return;
      recordHistorySnapshot(snapshot);
    }, HISTORY_CAPTURE_DEBOUNCE_MS);

    return () => {
      if (historyPersistTimerRef.current) {
        window.clearTimeout(historyPersistTimerRef.current);
        historyPersistTimerRef.current = null;
      }
    };
  }, [
    buildCurrentHistorySnapshot,
    canWriteMap,
    loading,
    recordHistorySnapshot,
  ]);

  return {
    canUndoSessionMapChanges,
    canRedoSessionMapChanges,
    handleUndoSessionChanges,
    handleRedoSessionChanges,
  };
}
