"use client";

import type { RefObject } from "react";

type CanvasPrintOverlayProps = {
  printSelectionMode: boolean;
  printHeaderHeightPx: number;
  activePrintSelectionRect: { left: number; top: number; width: number; height: number } | null;
  onOverlayPointerDown: (event: { clientX: number; clientY: number }) => void;
  onOverlayPointerMove: (event: { clientX: number; clientY: number }) => void;
  onOverlayPointerUp: () => void;
  showPrintSelectionConfirm: boolean;
  onCancelPrintSelection: () => void;
  onConfirmPrintArea: () => void;
  isPreparingPrint: boolean;
  showPrintPreview: boolean;
  printPreviewHtml: string | null;
  printOrientation: "portrait" | "landscape";
  onSetPortrait: () => void;
  onSetLandscape: () => void;
  onSavePrint: () => void;
  onClosePreview: () => void;
  printPreviewFrameRef: RefObject<HTMLIFrameElement | null>;
};

export function CanvasPrintOverlay({
  printSelectionMode,
  printHeaderHeightPx,
  activePrintSelectionRect,
  onOverlayPointerDown,
  onOverlayPointerMove,
  onOverlayPointerUp,
  showPrintSelectionConfirm,
  onCancelPrintSelection,
  onConfirmPrintArea,
  isPreparingPrint,
  showPrintPreview,
  printPreviewHtml,
  printOrientation,
  onSetPortrait,
  onSetLandscape,
  onSavePrint,
  onClosePreview,
  printPreviewFrameRef,
}: CanvasPrintOverlayProps) {
  return (
    <>
      {printSelectionMode ? (
        <div
          className="print-hidden fixed inset-x-0 bottom-0 z-[90]"
          style={{ top: `${printHeaderHeightPx}px` }}
          onPointerDown={onOverlayPointerDown}
          onPointerMove={onOverlayPointerMove}
          onPointerUp={onOverlayPointerUp}
        >
          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-none border border-black bg-white px-3 py-2 text-xs text-slate-800 shadow-lg">
            Drag to select area for print
          </div>
          {activePrintSelectionRect ? (
            <>
              <div className="absolute bg-slate-800/45" style={{ left: 0, top: 0, right: 0, height: Math.max(0, activePrintSelectionRect.top - printHeaderHeightPx) }} />
              <div className="absolute bg-slate-800/45" style={{ left: 0, top: activePrintSelectionRect.top - printHeaderHeightPx, width: activePrintSelectionRect.left, height: activePrintSelectionRect.height }} />
              <div
                className="absolute bg-slate-800/45"
                style={{
                  left: activePrintSelectionRect.left + activePrintSelectionRect.width,
                  top: activePrintSelectionRect.top - printHeaderHeightPx,
                  right: 0,
                  height: activePrintSelectionRect.height,
                }}
              />
              <div
                className="absolute bg-slate-800/45"
                style={{
                  left: 0,
                  top: activePrintSelectionRect.top - printHeaderHeightPx + activePrintSelectionRect.height,
                  right: 0,
                  bottom: 0,
                }}
              />
              <div
                className="absolute border-2 border-black bg-transparent"
                style={{
                  left: activePrintSelectionRect.left,
                  top: activePrintSelectionRect.top - printHeaderHeightPx,
                  width: activePrintSelectionRect.width,
                  height: activePrintSelectionRect.height,
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-slate-800/35" />
          )}
        </div>
      ) : null}

      {showPrintSelectionConfirm ? (
        <div className="fixed inset-0 z-[91] flex items-center justify-center bg-slate-900/45 p-4 print-hidden">
          <div className="w-full max-w-md rounded-none border border-slate-300 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Print selected area?</h2>
            <p className="mt-2 text-sm text-slate-700">Use this selected area for the PDF export.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                onClick={onCancelPrintSelection}
              >
                Cancel Print Selection
              </button>
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onConfirmPrintArea}
                disabled={isPreparingPrint}
              >
                <span className="inline-flex items-center gap-2">
                  {isPreparingPrint ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-black border-r-transparent" /> : null}
                  {isPreparingPrint ? "Preparing..." : "Print This Area"}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPrintPreview && printPreviewHtml ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/60 p-4 print-hidden">
          <div className="flex h-[92vh] w-[92vw] max-w-[1280px] flex-col rounded-none border border-slate-300 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-semibold text-slate-900">PDF Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  className={`rounded-none border border-black px-3 py-2 text-sm hover:bg-slate-100 ${
                    printOrientation === "portrait" ? "bg-black text-white hover:bg-black" : "bg-white text-black"
                  }`}
                  onClick={onSetPortrait}
                >
                  Vertical
                </button>
                <button
                  className={`rounded-none border border-black px-3 py-2 text-sm hover:bg-slate-100 ${
                    printOrientation === "landscape" ? "bg-black text-white hover:bg-black" : "bg-white text-black"
                  }`}
                  onClick={onSetLandscape}
                >
                  Horizontal
                </button>
                <button
                  className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                  onClick={onSavePrint}
                >
                  Save / Print
                </button>
                <button
                  className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                  onClick={onClosePreview}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-slate-100 p-4">
              <iframe
                ref={printPreviewFrameRef}
                title="Print Preview"
                srcDoc={printPreviewHtml}
                className="h-full w-full border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

