"use client";

import { useEffect, useState, type RefObject } from "react";
import type { SelectionMarquee } from "./canvasShared";

type RelationshipPopupData = {
  x: number;
  y: number;
  fromLabel: string;
  toLabel: string;
  relationLabel: string;
  relationshipType: string;
  disciplines: string;
  description: string;
};

type CanvasFloatingOverlaysProps = {
  selectionMarquee: SelectionMarquee;
  showDeleteSelectionConfirm: boolean;
  selectedFlowIdsSize: number;
  onDeleteSelected: () => void;
  onCancelDeleteSelected: () => void;
  showImageUploadModal: boolean;
  onCancelImageUpload: () => void;
  onSelectImageUploadFile: (file: File | null) => void;
  imageUploadPreviewUrl: string | null;
  imageUploadDescription: string;
  setImageUploadDescription: (value: string) => void;
  onConfirmImageUpload: () => void;
  imageUploadFile: File | null;
  imageUploadSaving: boolean;
  evidenceMediaOverlay: {
    fileName: string;
    description: string;
    mediaUrl: string;
    mediaMime: string;
    rotationDeg: 0 | 90 | 180 | 270;
  } | null;
  onCancelEvidenceMediaOverlay: () => void;
  onSaveEvidenceMediaOverlay: () => void;
  onRotateEvidenceMediaOverlay: () => void;
  onChangeEvidenceMediaOverlayFileName: (value: string) => void;
  onChangeEvidenceMediaOverlayDescription: (value: string) => void;
  relationshipPopup: RelationshipPopupData | null;
  relationshipPopupRef: RefObject<HTMLDivElement | null>;
};

export function CanvasFloatingOverlays({
  selectionMarquee,
  showDeleteSelectionConfirm,
  selectedFlowIdsSize,
  onDeleteSelected,
  onCancelDeleteSelected,
  showImageUploadModal,
  onCancelImageUpload,
  onSelectImageUploadFile,
  imageUploadPreviewUrl,
  imageUploadDescription,
  setImageUploadDescription,
  onConfirmImageUpload,
  imageUploadFile,
  imageUploadSaving,
  evidenceMediaOverlay,
  onCancelEvidenceMediaOverlay,
  onSaveEvidenceMediaOverlay,
  onRotateEvidenceMediaOverlay,
  onChangeEvidenceMediaOverlayFileName,
  onChangeEvidenceMediaOverlayDescription,
  relationshipPopup,
  relationshipPopupRef,
}: CanvasFloatingOverlaysProps) {
  const isEvidencePdf = (evidenceMediaOverlay?.mediaMime || "").toLowerCase().includes("pdf");
  const overlayIsQuarterTurn = evidenceMediaOverlay?.rotationDeg === 90 || evidenceMediaOverlay?.rotationDeg === 270;
  const overlayTransform = `rotate(${evidenceMediaOverlay?.rotationDeg ?? 0}deg) scale(${overlayIsQuarterTurn ? 0.82 : 1})`;
  const [overlayImageErrored, setOverlayImageErrored] = useState(false);
  useEffect(() => {
    setOverlayImageErrored(false);
  }, [evidenceMediaOverlay?.mediaUrl]);

  return (
    <>
      {selectionMarquee.active && (
        <div
          className="pointer-events-none fixed z-[66] border border-[#0f172a] bg-[#0f172a]/10"
          style={{
            left: Math.min(selectionMarquee.startClientX, selectionMarquee.currentClientX),
            top: Math.min(selectionMarquee.startClientY, selectionMarquee.currentClientY),
            width: Math.abs(selectionMarquee.currentClientX - selectionMarquee.startClientX),
            height: Math.abs(selectionMarquee.currentClientY - selectionMarquee.startClientY),
          }}
        />
      )}

      {showDeleteSelectionConfirm && (
        <div className="fixed inset-0 z-[92] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-none border border-slate-300 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Delete selected components?</h2>
            <p className="mt-2 text-sm text-slate-700">
              You are about to permanently delete {selectedFlowIdsSize} selected component{selectedFlowIdsSize === 1 ? "" : "s"} and associated data.
              This action cannot be recovered.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                onClick={onDeleteSelected}
              >
                Delete selected
              </button>
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                onClick={onCancelDeleteSelected}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageUploadModal && (
        <div className="fixed inset-0 z-[93] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-xl rounded-none border border-slate-300 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Upload Image</h2>
              <button className="text-slate-500 hover:text-slate-800" onClick={onCancelImageUpload}>x</button>
            </div>
            <div className="mt-4 rounded-none border border-dashed border-slate-300 p-6">
              <label className="flex cursor-pointer flex-col items-center justify-center text-center">
                <div className="text-sm text-slate-700">Drag and drop image or click to browse</div>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-3 block text-sm text-slate-700"
                  onChange={(e) => onSelectImageUploadFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {imageUploadPreviewUrl ? (
                <div className="mt-4 overflow-hidden rounded border border-slate-200 bg-slate-50 p-2">
                  <img src={imageUploadPreviewUrl} alt="Upload preview" className="max-h-64 w-full object-contain" />
                </div>
              ) : null}
            </div>
            <label className="mt-4 block text-sm text-slate-700">
              Image Description
              <textarea
                rows={3}
                className="mt-1 w-full rounded-none border border-slate-300 px-3 py-2 text-black"
                value={imageUploadDescription}
                onChange={(e) => setImageUploadDescription(e.target.value)}
                placeholder="Describe this image"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100" onClick={onCancelImageUpload}>
                Cancel image upload
              </button>
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onConfirmImageUpload}
                disabled={!imageUploadFile || imageUploadSaving}
              >
                {imageUploadSaving ? "Uploading..." : "Save and close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {evidenceMediaOverlay ? (
        <div
          className="fixed bottom-0 left-0 right-0 top-[70px] z-[120]"
          style={{ backgroundColor: "rgba(15, 15, 15, 0.80)" }}
          onMouseDown={(event) => {
            if (event.target !== event.currentTarget) return;
            onCancelEvidenceMediaOverlay();
          }}
        >
          <div className="grid h-full min-h-0 w-full grid-cols-1 gap-0 md:grid-cols-[minmax(0,1fr)_360px]">
            <div className="relative min-h-0 overflow-auto p-6">
              {isEvidencePdf ? (
                <div className="mx-auto flex h-full max-h-full w-full max-w-6xl items-center justify-center overflow-hidden rounded border border-slate-300 bg-white shadow-2xl">
                  <iframe
                    title={evidenceMediaOverlay.fileName || "PDF Evidence"}
                    src={`${evidenceMediaOverlay.mediaUrl}#page=1&zoom=page-fit`}
                    className="h-full min-h-[520px] w-full border-0 bg-white"
                  />
                </div>
              ) : (
                <div className="mx-auto flex h-full max-h-full w-full max-w-6xl items-center justify-center">
                  {overlayImageErrored ? (
                    <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-white">
                      Preview unavailable for this attachment.
                    </div>
                  ) : (
                    <img
                      src={evidenceMediaOverlay.mediaUrl}
                      alt={evidenceMediaOverlay.fileName || "Evidence image"}
                      className="max-h-[82vh] w-auto max-w-full rounded-md object-contain shadow-2xl"
                      style={{ transform: overlayTransform, transformOrigin: "center center" }}
                      onError={() => setOverlayImageErrored(true)}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="border-l border-slate-300 bg-white p-5 shadow-[-8px_0_24px_rgba(15,23,42,0.16)]">
              <div className="text-base font-semibold text-slate-900">Evidence Viewer</div>
              <div className="mt-1 text-xs text-slate-600">{isEvidencePdf ? "PDF preview" : "Image preview"}</div>
              <label className="mt-4 block text-sm font-semibold text-slate-700">
                File Name
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-black"
                  value={evidenceMediaOverlay.fileName}
                  onChange={(e) => onChangeEvidenceMediaOverlayFileName(e.target.value)}
                />
              </label>
              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Description
                <textarea
                  rows={7}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-black"
                  value={evidenceMediaOverlay.description}
                  onChange={(e) => onChangeEvidenceMediaOverlayDescription(e.target.value)}
                />
              </label>
              {!isEvidencePdf ? (
                <div className="mt-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Rotation: {evidenceMediaOverlay.rotationDeg}°
                </div>
              ) : null}
              <div className="mt-5 flex items-center justify-end gap-2">
                {!isEvidencePdf ? (
                  <button
                    type="button"
                    className="rounded border border-black bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-slate-100"
                    onClick={onRotateEvidenceMediaOverlay}
                  >
                    Rotate
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded border border-black bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-slate-100"
                  onClick={onCancelEvidenceMediaOverlay}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  onClick={onSaveEvidenceMediaOverlay}
                >
                  Save and Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {relationshipPopup && (
        <div
          ref={relationshipPopupRef}
          className="fixed z-[65] w-[320px] max-w-[90vw] rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg"
          style={{ left: relationshipPopup.x, top: relationshipPopup.y + 14, transform: "translateX(-50%)" }}
        >
          <div className="space-y-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">From</div>
              <div className="text-xs text-slate-800">{relationshipPopup.fromLabel}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">To</div>
              <div className="text-xs text-slate-800">{relationshipPopup.toLabel}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Mode</div>
              <div className="text-xs text-slate-800">{relationshipPopup.relationLabel}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Type</div>
              <div className="text-xs text-slate-800">{relationshipPopup.relationshipType}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Disciplines</div>
              <div className="text-xs text-slate-800">{relationshipPopup.disciplines}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Relationship Definition</div>
              <div className="text-xs text-slate-800">{relationshipPopup.description}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
