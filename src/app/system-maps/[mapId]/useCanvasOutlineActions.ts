import { useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { OutlineItemRow } from "./canvasShared";

type Params = {
  mapId: string;
  outlineNodeId: string | null;
  outlineItems: OutlineItemRow[];
  headingItems: OutlineItemRow[];
  newHeadingTitle: string;
  newHeadingLevel: 1 | 2 | 3;
  newHeadingParentId: string;
  newContentHeadingId: string;
  newContentText: string;
  outlineEditItem: OutlineItemRow | null;
  editHeadingTitle: string;
  editHeadingLevel: 1 | 2 | 3;
  editHeadingParentId: string;
  editContentHeadingId: string;
  editContentText: string;
  confirmDeleteOutlineItemId: string | null;
  outlineEditItemId: string | null;
  setError: (value: string | null) => void;
  setOutlineCreateMode: (value: "heading" | "content" | null) => void;
  setNewHeadingTitle: (value: string) => void;
  setNewHeadingLevel: (value: 1 | 2 | 3) => void;
  setNewHeadingParentId: (value: string) => void;
  setNewContentHeadingId: (value: string) => void;
  setNewContentText: (value: string) => void;
  setOutlineEditItemId: (value: string | null) => void;
  setEditHeadingTitle: (value: string) => void;
  setEditHeadingLevel: (value: 1 | 2 | 3) => void;
  setEditHeadingParentId: (value: string) => void;
  setEditContentHeadingId: (value: string) => void;
  setEditContentText: (value: string) => void;
  setCollapsedHeadingIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setConfirmDeleteOutlineItemId: (value: string | null) => void;
  loadOutline: (nodeId: string) => Promise<void>;
};

export function useCanvasOutlineActions({
  mapId,
  outlineNodeId,
  outlineItems,
  headingItems,
  newHeadingTitle,
  newHeadingLevel,
  newHeadingParentId,
  newContentHeadingId,
  newContentText,
  outlineEditItem,
  editHeadingTitle,
  editHeadingLevel,
  editHeadingParentId,
  editContentHeadingId,
  editContentText,
  confirmDeleteOutlineItemId,
  outlineEditItemId,
  setError,
  setOutlineCreateMode,
  setNewHeadingTitle,
  setNewHeadingLevel,
  setNewHeadingParentId,
  setNewContentHeadingId,
  setNewContentText,
  setOutlineEditItemId,
  setEditHeadingTitle,
  setEditHeadingLevel,
  setEditHeadingParentId,
  setEditContentHeadingId,
  setEditContentText,
  setCollapsedHeadingIds,
  setConfirmDeleteOutlineItemId,
  loadOutline,
}: Params) {
  const handleCreateHeading = useCallback(async () => {
    if (!outlineNodeId) return;
    const titleInput = newHeadingTitle.trim();
    if (!titleInput) return;
    const levelInput = newHeadingLevel;
    let parentHeadingId: string | null = null;
    if (levelInput === 2 || levelInput === 3) {
      if (!newHeadingParentId) return;
      parentHeadingId = newHeadingParentId;
    }

    const maxSort = outlineItems.reduce((m, i) => Math.max(m, i.sort_order), 0);
    const { error: e } = await supabaseBrowser.schema("ms").from("document_outline_items").insert({
      map_id: mapId,
      node_id: outlineNodeId,
      kind: "heading",
      heading_level: levelInput,
      parent_heading_id: parentHeadingId,
      title: titleInput,
      sort_order: maxSort + 10,
    });
    if (e) {
      setError(e.message || "Unable to add heading.");
      return;
    }
    setOutlineCreateMode(null);
    setNewHeadingTitle("");
    setNewHeadingLevel(1);
    setNewHeadingParentId("");
    await loadOutline(outlineNodeId);
  }, [
    outlineNodeId,
    newHeadingTitle,
    newHeadingLevel,
    newHeadingParentId,
    outlineItems,
    mapId,
    setError,
    setOutlineCreateMode,
    setNewHeadingTitle,
    setNewHeadingLevel,
    setNewHeadingParentId,
    loadOutline,
  ]);

  const handleCreateContent = useCallback(async () => {
    if (!outlineNodeId) return;
    if (!headingItems.length) return;
    const headingId = newContentHeadingId;
    if (!headingId) return;
    const text = newContentText.trim();
    if (!text) return;

    const ordered = [...outlineItems].sort(
      (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
    );
    const headingIndex = ordered.findIndex((i) => i.id === headingId);
    const insertIndex = headingIndex < 0 ? ordered.length : headingIndex + 1;

    let cursor = 10;
    for (let i = 0; i <= ordered.length; i += 1) {
      if (i === insertIndex) {
        cursor += 10;
        continue;
      }
      const item = ordered[i > insertIndex ? i - 1 : i];
      if (!item) continue;
      if (item.sort_order !== cursor) {
        await supabaseBrowser
          .schema("ms")
          .from("document_outline_items")
          .update({ sort_order: cursor })
          .eq("id", item.id);
      }
      cursor += 10;
    }

    const insertSort = (insertIndex + 1) * 10;
    const { error: e } = await supabaseBrowser.schema("ms").from("document_outline_items").insert({
      map_id: mapId,
      node_id: outlineNodeId,
      kind: "content",
      content_text: text,
      heading_id: headingId,
      sort_order: insertSort,
    });
    if (e) {
      setError(e.message || "Unable to add content.");
      return;
    }
    setOutlineCreateMode(null);
    setNewContentHeadingId("");
    setNewContentText("");
    await loadOutline(outlineNodeId);
  }, [
    outlineNodeId,
    headingItems.length,
    newContentHeadingId,
    newContentText,
    outlineItems,
    mapId,
    setError,
    setOutlineCreateMode,
    setNewContentHeadingId,
    setNewContentText,
    loadOutline,
  ]);

  const openOutlineEditor = useCallback(
    (item: OutlineItemRow) => {
      setOutlineCreateMode(null);
      setOutlineEditItemId(item.id);
      if (item.kind === "heading") {
        setEditHeadingTitle(item.title ?? "");
        const level = item.heading_level ?? 1;
        setEditHeadingLevel(level);
        setEditHeadingParentId(item.parent_heading_id ?? "");
      } else {
        setEditContentHeadingId(item.heading_id ?? "");
        setEditContentText(item.content_text ?? "");
      }
    },
    [
      setOutlineCreateMode,
      setOutlineEditItemId,
      setEditHeadingTitle,
      setEditHeadingLevel,
      setEditHeadingParentId,
      setEditContentHeadingId,
      setEditContentText,
    ]
  );

  const closeOutlineEditor = useCallback(() => {
    setOutlineEditItemId(null);
    setEditHeadingTitle("");
    setEditHeadingLevel(1);
    setEditHeadingParentId("");
    setEditContentHeadingId("");
    setEditContentText("");
  }, [
    setOutlineEditItemId,
    setEditHeadingTitle,
    setEditHeadingLevel,
    setEditHeadingParentId,
    setEditContentHeadingId,
    setEditContentText,
  ]);

  const handleSaveOutlineEdit = useCallback(async () => {
    if (!outlineNodeId || !outlineEditItem) return;
    if (outlineEditItem.kind === "heading") {
      const title = editHeadingTitle.trim();
      if (!title) return;
      const parentId = editHeadingLevel === 1 ? null : editHeadingParentId || null;
      if (editHeadingLevel !== 1 && !parentId) return;
      const { error: e } = await supabaseBrowser
        .schema("ms")
        .from("document_outline_items")
        .update({ title, heading_level: editHeadingLevel, parent_heading_id: parentId })
        .eq("id", outlineEditItem.id);
      if (e) {
        setError(e.message || "Unable to update heading.");
        return;
      }
    } else {
      const text = editContentText.trim();
      if (!text || !editContentHeadingId) return;
      const { error: e } = await supabaseBrowser
        .schema("ms")
        .from("document_outline_items")
        .update({ content_text: text, heading_id: editContentHeadingId })
        .eq("id", outlineEditItem.id);
      if (e) {
        setError(e.message || "Unable to update content.");
        return;
      }
    }
    closeOutlineEditor();
    await loadOutline(outlineNodeId);
  }, [
    outlineNodeId,
    outlineEditItem,
    editHeadingTitle,
    editHeadingLevel,
    editHeadingParentId,
    editContentText,
    editContentHeadingId,
    setError,
    closeOutlineEditor,
    loadOutline,
  ]);

  const handleDeleteOutlineItem = useCallback(async () => {
    if (!outlineNodeId || !confirmDeleteOutlineItemId) return;
    const { error: e } = await supabaseBrowser
      .schema("ms")
      .from("document_outline_items")
      .delete()
      .eq("id", confirmDeleteOutlineItemId);
    if (e) {
      setError(e.message || "Unable to delete outline item.");
      return;
    }
    setCollapsedHeadingIds((prev) => {
      const next = new Set(prev);
      next.delete(confirmDeleteOutlineItemId);
      return next;
    });
    setConfirmDeleteOutlineItemId(null);
    if (outlineEditItemId === confirmDeleteOutlineItemId) {
      closeOutlineEditor();
    }
    await loadOutline(outlineNodeId);
  }, [
    outlineNodeId,
    confirmDeleteOutlineItemId,
    setError,
    setCollapsedHeadingIds,
    setConfirmDeleteOutlineItemId,
    outlineEditItemId,
    closeOutlineEditor,
    loadOutline,
  ]);

  return {
    handleCreateHeading,
    handleCreateContent,
    openOutlineEditor,
    closeOutlineEditor,
    handleSaveOutlineEdit,
    handleDeleteOutlineItem,
  };
}
