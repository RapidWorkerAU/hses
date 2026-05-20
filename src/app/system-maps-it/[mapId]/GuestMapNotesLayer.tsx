"use client";

import { useCallback, useEffect, useMemo, useState, type RefObject, type SyntheticEvent } from "react";
import { useViewport } from "@xyflow/react";
import { createPortal } from "react-dom";
import { minorGridSize } from "./canvasShared";

type GuestMapNoteStatus = "pending" | "approved" | "hidden";

type GuestMapNote = {
  id: string;
  displayName: string;
  body: string;
  posX: number;
  posY: number;
  targetFlowId: string | null;
  status: GuestMapNoteStatus;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
};

type GuestMapNotesLayerProps = {
  enabled: boolean;
  campaignSlug: string | null;
  guestSessionEmail: string | null;
  canvasRef: RefObject<HTMLDivElement | null>;
  screenToFlowPosition: ((point: { x: number; y: number }) => { x: number; y: number }) | null;
};

type EditorState =
  | {
      mode: "create";
      note: null;
      posX: number;
      posY: number;
      displayName: string;
      body: string;
    }
  | {
      mode: "edit";
      note: GuestMapNote;
      posX: number;
      posY: number;
      displayName: string;
      body: string;
    };

type NotesApiResponse = {
  notes?: GuestMapNote[];
  note?: GuestMapNote;
  error?: string;
};

const displayNameStorageKey = "lead-map-note-display-name";
const noteMarkerFlowSize = minorGridSize * 3;

function statusLabel(status: GuestMapNoteStatus) {
  if (status === "approved") return "Approved";
  if (status === "pending") return "Pending review";
  return "Hidden";
}

function formatNoteDate(value: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMarkerTimestamp(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours();
  const displayHours = String(hours % 12 || 12).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${day}/${month}/${year} ${displayHours}:${minutes} ${suffix}`;
}

export function GuestMapNotesLayer({
  enabled,
  campaignSlug,
  guestSessionEmail,
  canvasRef,
  screenToFlowPosition,
}: GuestMapNotesLayerProps) {
  const viewport = useViewport();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [notes, setNotes] = useState<GuestMapNote[]>([]);
  const [placementMode, setPlacementMode] = useState(false);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stopMapInteraction = (event: SyntheticEvent) => {
    event.stopPropagation();
  };

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  const savedDisplayName = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(displayNameStorageKey) || "";
  }, []);

  const loadNotes = useCallback(async () => {
    if (!enabled || !campaignSlug) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/lead-map-notes?slug=${encodeURIComponent(campaignSlug)}`);
      const payload = (await response.json()) as NotesApiResponse;
      if (!response.ok) throw new Error(payload.error || "Unable to load map notes.");
      setNotes(payload.notes ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load map notes.");
    } finally {
      setLoading(false);
    }
  }, [campaignSlug, enabled]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  if (!enabled || !campaignSlug) return null;

  const openNote = openNoteId ? notes.find((note) => note.id === openNoteId) ?? null : null;
  const confirmingDelete = !!openNote && confirmDeleteNoteId === openNote.id;
  const canvasRect = canvasRef.current?.getBoundingClientRect();
  const getNoteScreenPosition = (note: Pick<GuestMapNote, "posX" | "posY">) => ({
    left: canvasRect ? canvasRect.left + note.posX * viewport.zoom + viewport.x : 0,
    top: canvasRect ? canvasRect.top + note.posY * viewport.zoom + viewport.y : 0,
  });
  const openNotePosition = openNote ? getNoteScreenPosition(openNote) : null;
  const noteMarkerScreenSize = noteMarkerFlowSize * viewport.zoom;
  const popupLeft =
    openNotePosition && typeof window !== "undefined"
      ? Math.min(Math.max(openNotePosition.left + noteMarkerScreenSize / 2 + 8, 12), window.innerWidth - 292)
      : 12;
  const popupTop =
    openNotePosition && typeof window !== "undefined"
      ? Math.min(Math.max(openNotePosition.top + noteMarkerScreenSize / 2 + 8, 12), window.innerHeight - 240)
      : 12;

  const openCreateEditor = (posX: number, posY: number) => {
    setEditor({
      mode: "create",
      note: null,
      posX,
      posY,
      displayName: savedDisplayName,
      body: "",
    });
    setPlacementMode(false);
    setOpenNoteId(null);
    setConfirmDeleteNoteId(null);
  };

  const handlePlacementClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!screenToFlowPosition) {
      setError("The map is still loading. Try again in a moment.");
      return;
    }
    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    openCreateEditor(Math.round(point.x), Math.round(point.y));
  };

  const handleSubmitEditor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    setSubmitting(true);
    setError(null);

    try {
      const displayName = editor.displayName.trim();
      const body = editor.body.trim();
      const response = await fetch("/api/lead-map-notes", {
        method: editor.mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: campaignSlug,
          noteId: editor.mode === "edit" ? editor.note.id : undefined,
          displayName,
          body,
          posX: editor.posX,
          posY: editor.posY,
        }),
      });
      const payload = (await response.json()) as NotesApiResponse;
      if (!response.ok || !payload.note) throw new Error(payload.error || "Unable to save note.");

      window.localStorage.setItem(displayNameStorageKey, displayName);
      setNotes((current) => {
        const exists = current.some((note) => note.id === payload.note?.id);
        if (!exists) return [...current, payload.note as GuestMapNote];
        return current.map((note) => (note.id === payload.note?.id ? (payload.note as GuestMapNote) : note));
      });
      setEditor(null);
      setOpenNoteId(payload.note.id);
      setConfirmDeleteNoteId(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save note.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (note: GuestMapNote) => {
    if (!note.canEdit) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/lead-map-notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: campaignSlug, noteId: note.id }),
      });
      const payload = (await response.json()) as NotesApiResponse;
      if (!response.ok) throw new Error(payload.error || "Unable to delete note.");
      setNotes((current) => current.filter((item) => item.id !== note.id));
      setOpenNoteId(null);
      setConfirmDeleteNoteId(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete note.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {portalRoot && canvasRect ? createPortal(
        <>
          {notes.map((note) => {
          const pending = note.status === "pending";
          const position = getNoteScreenPosition(note);
          const markerTitleFontSize = noteMarkerScreenSize * 0.15;
          const markerNameFontSize = noteMarkerScreenSize * 0.12;
          const markerTimestampFontSize = noteMarkerScreenSize * 0.075;
          const markerHintFontSize = noteMarkerScreenSize * 0.095;
          const foldSize = noteMarkerScreenSize * 0.18;
          return (
            <div key={note.id}>
              <button
                type="button"
                className={`nodrag nopan fixed z-[160] flex -translate-x-1/2 -translate-y-1/2 flex-col items-start justify-start overflow-hidden rounded-[2px] border p-1 text-left leading-tight shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition ${
                  pending
                    ? "border-pink-700 bg-pink-200 text-pink-950 ring-2 ring-pink-400/40"
                    : "border-pink-600 bg-pink-200 text-pink-950"
                }`}
                style={{
                  left: position.left,
                  top: position.top,
                  width: noteMarkerScreenSize,
                  height: noteMarkerScreenSize,
                  padding: noteMarkerScreenSize * 0.1,
                  pointerEvents: "auto",
                }}
                aria-label={`Open note from ${note.displayName}`}
                title={`${note.displayName}: ${statusLabel(note.status)}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setConfirmDeleteNoteId(null);
                  setOpenNoteId((current) => (current === note.id ? null : note.id));
                }}
                onMouseDown={stopMapInteraction}
                onClick={stopMapInteraction}
                onDoubleClick={stopMapInteraction}
              >
                <span aria-hidden="true" className="relative z-10 block max-w-full truncate font-bold uppercase" style={{ fontSize: markerTitleFontSize }}>
                  Note
                </span>
                <span aria-hidden="true" className="relative z-10 mt-0.5 block max-w-full truncate font-normal normal-case opacity-90" style={{ fontSize: markerNameFontSize }}>
                  {note.displayName}
                </span>
                <span
                  aria-hidden="true"
                  className="relative z-10 mt-auto block max-w-[88%] truncate font-normal opacity-80"
                  style={{ fontSize: markerTimestampFontSize }}
                >
                  {formatMarkerTimestamp(note.createdAt)}
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 right-0 h-0 w-0"
                  style={{
                    borderBottom: `${foldSize}px solid rgba(255, 255, 255, 0.72)`,
                    borderLeft: `${foldSize}px solid #f9a8d4`,
                  }}
                />
              </button>
              <div
                className="pointer-events-none fixed z-[160] truncate text-right font-semibold uppercase tracking-[0.04em] text-pink-950/75"
                style={{
                  left: position.left - noteMarkerScreenSize / 2,
                  top: position.top + noteMarkerScreenSize / 2 + noteMarkerScreenSize * 0.05,
                  width: noteMarkerScreenSize,
                  fontSize: markerHintFontSize,
                }}
              >
                Click to view
              </div>
            </div>
          );
        })}
        </>,
        portalRoot
      ) : null}

      {portalRoot && openNote ? createPortal(
        <div
          className="nodrag nopan nowheel fixed z-[165] w-[280px] rounded border border-slate-300 bg-white p-3 text-left text-sm text-slate-900 shadow-2xl"
          style={{ left: popupLeft, top: popupTop }}
          onPointerDown={stopMapInteraction}
          onMouseDown={stopMapInteraction}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          {confirmingDelete ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-rose-800">Delete note?</div>
                  <div className="text-[11px] uppercase tracking-[0.06em] text-slate-500">
                    {openNote.displayName} - {formatNoteDate(openNote.updatedAt)}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-700 hover:bg-slate-50"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setConfirmDeleteNoteId(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-700">
                This will remove the note from the map. This action cannot be undone.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setConfirmDeleteNoteId(null);
                  }}
                  disabled={submitting}
                >
                  Keep note
                </button>
                <button
                  type="button"
                  className="rounded border border-rose-600 bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDeleteNote(openNote);
                  }}
                  disabled={submitting}
                >
                  {submitting ? "Deleting..." : "Delete note"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{openNote.displayName}</div>
                  <div className="text-[11px] uppercase tracking-[0.06em] text-slate-500">
                    {statusLabel(openNote.status)} - {formatNoteDate(openNote.updatedAt)}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-700 hover:bg-slate-50"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenNoteId(null);
                    setConfirmDeleteNoteId(null);
                  }}
                >
                  Close
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-slate-700">{openNote.body}</p>
              {openNote.canEdit ? (
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      setConfirmDeleteNoteId(null);
                      setEditor({
                        mode: "edit",
                        note: openNote,
                        posX: openNote.posX,
                        posY: openNote.posY,
                        displayName: openNote.displayName,
                        body: openNote.body,
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      setConfirmDeleteNoteId(openNote.id);
                    }}
                    disabled={submitting}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>,
        portalRoot
      ) : null}

      <div className="pointer-events-none absolute right-4 top-4 z-[95] flex flex-col items-end gap-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded border border-slate-300 bg-white/95 px-2 py-2 shadow-lg">
          <button
            type="button"
            className={`inline-flex h-10 items-center gap-2 rounded border px-3 text-sm font-semibold shadow-sm ${
              placementMode
                ? "border-amber-500 bg-amber-100 text-amber-950"
                : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            }`}
            onClick={() => {
              setPlacementMode((current) => !current);
              setEditor(null);
              setOpenNoteId(null);
              setConfirmDeleteNoteId(null);
            }}
          >
            <span
              aria-hidden="true"
              className="h-4 w-4 bg-current"
              style={{
                WebkitMaskImage: "url('/icons/comments.svg')",
                maskImage: "url('/icons/comments.svg')",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
            {placementMode ? "Click map" : "Add note"}
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center rounded border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            onClick={() => void loadNotes()}
            disabled={loading}
          >
            {loading ? "Loading" : "Refresh"}
          </button>
        </div>
        {error ? (
          <div className="pointer-events-auto max-w-[320px] rounded border border-rose-300 bg-white px-3 py-2 text-sm text-rose-700 shadow-lg">
            {error}
          </div>
        ) : null}
      </div>

      {placementMode ? (
        <div
          className="nodrag nopan absolute inset-0 z-[90] cursor-crosshair bg-sky-950/10"
          onClick={handlePlacementClick}
        >
          <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-lg">
            Click the map where this note should appear.
          </div>
        </div>
      ) : null}

      {portalRoot && editor ? createPortal(
        <div className="nodrag nopan fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/45 px-4">
          <form
            className="w-full max-w-[480px] rounded border border-slate-300 bg-white p-5 text-slate-900 shadow-2xl"
            onSubmit={handleSubmitEditor}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{editor.mode === "create" ? "Add map note" : "Edit map note"}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Your name or username is visible to all map viewers. Your email ({guestSessionEmail || "your redeemed email"}) is only visible to Investigation Tool admin.
                </p>
              </div>
              <button
                type="button"
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                onClick={() => setEditor(null)}
                disabled={submitting}
              >
                Close
              </button>
            </div>

            <label className="mt-4 block text-sm font-semibold">
              Visible name or username
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal text-slate-900"
                value={editor.displayName}
                onChange={(event) => setEditor((current) => (current ? { ...current, displayName: event.target.value } : current))}
                placeholder="e.g. Safety reviewer"
                minLength={2}
                maxLength={60}
                required
              />
            </label>

            <label className="mt-4 block text-sm font-semibold">
              Note
              <textarea
                className="mt-1 min-h-[120px] w-full resize-y rounded border border-slate-300 px-3 py-2 font-normal text-slate-900"
                value={editor.body}
                onChange={(event) => setEditor((current) => (current ? { ...current, body: event.target.value } : current))}
                placeholder="Add a comment or question about this part of the map."
                maxLength={1200}
                required
              />
            </label>

            {editor.mode === "edit" && editor.note.status === "approved" ? (
              <p className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Editing an approved note will move it back to pending review.
              </p>
            ) : (
              <p className="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                New notes are visible to you immediately and become visible to all map viewers after admin approval.
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => setEditor(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded border border-[#102a43] bg-[#102a43] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save note"}
              </button>
            </div>
          </form>
        </div>,
        portalRoot
      ) : null}
    </>
  );
}
