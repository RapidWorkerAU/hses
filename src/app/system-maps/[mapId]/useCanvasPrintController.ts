"use client";

import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import { clamp } from "./canvasShared";
import {
  buildPrintPreviewHtml,
  cropDataUrl,
  loadHtml2Canvas,
  loadHtmlToImage,
} from "./canvasPrintUtils";

type PrintSelectionDraft = {
  active: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

type PrintSelectionRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type UseCanvasPrintControllerParams = {
  canvasRef: RefObject<HTMLDivElement | null>;
  mapTitle: string;
  setError: (message: string | null) => void;
};

export function useCanvasPrintController({ canvasRef, mapTitle, setError }: UseCanvasPrintControllerParams) {
  const printPreviewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printPreviewImageDataUrl, setPrintPreviewImageDataUrl] = useState<string | null>(null);
  const [printOrientation, setPrintOrientation] = useState<"portrait" | "landscape">("portrait");
  const [printSelectionMode, setPrintSelectionMode] = useState(false);
  const [isCopyingPrintImage, setIsCopyingPrintImage] = useState(false);
  const [printSelectionCopyMessage, setPrintSelectionCopyMessage] = useState<string | null>(null);
  const [printSelectionDraft, setPrintSelectionDraft] = useState<PrintSelectionDraft | null>(null);
  const [printSelectionRect, setPrintSelectionRect] = useState<PrintSelectionRect | null>(null);
  const [showPrintSelectionConfirm, setShowPrintSelectionConfirm] = useState(false);

  const printPreviewHtml = useMemo(
    () =>
      printPreviewImageDataUrl
        ? buildPrintPreviewHtml({
            mapTitle: mapTitle || "System Map",
            imageDataUrl: printPreviewImageDataUrl,
            orientation: printOrientation,
          })
        : null,
    [mapTitle, printOrientation, printPreviewImageDataUrl]
  );

  const activePrintSelectionRect = useMemo(() => {
    if (printSelectionDraft) {
      const left = Math.min(printSelectionDraft.startX, printSelectionDraft.currentX);
      const top = Math.min(printSelectionDraft.startY, printSelectionDraft.currentY);
      const width = Math.abs(printSelectionDraft.currentX - printSelectionDraft.startX);
      const height = Math.abs(printSelectionDraft.currentY - printSelectionDraft.startY);
      return { left, top, width, height };
    }
    return printSelectionRect;
  }, [printSelectionDraft, printSelectionRect]);

  const exitPrintSelectionMode = useCallback(() => {
    setPrintSelectionMode(false);
    setPrintSelectionDraft(null);
    setPrintSelectionRect(null);
    setShowPrintSelectionConfirm(false);
    setPrintSelectionCopyMessage(null);
  }, []);

  const openPrintPreviewFromDataUrl = useCallback((imageDataUrl: string) => {
    setPrintPreviewImageDataUrl(imageDataUrl);
    setShowPrintPreview(true);
  }, []);

  const capturePrintImage = useCallback(
    async (mode: "current" | "area", options?: { openPreview?: boolean }) => {
      const root = canvasRef.current as HTMLElement | null;
      if (!root) {
        setError("Unable to capture canvas for print.");
        return null;
      }
      const target = (root.querySelector(".react-flow") as HTMLElement | null) ?? root;
      const targetBounds = target.getBoundingClientRect();
      const captureWidth = Math.max(1, Math.floor(target.clientWidth || targetBounds.width));
      const captureHeight = Math.max(1, Math.floor(target.clientHeight || targetBounds.height));
      let crop: { x: number; y: number; width: number; height: number } | null = null;
      if (mode === "area") {
        if (!printSelectionRect || printSelectionRect.width < 12 || printSelectionRect.height < 12) {
          setError("Please select a larger area to print.");
          return null;
        }
        const x = clamp(printSelectionRect.left - targetBounds.left, 0, targetBounds.width);
        const y = clamp(printSelectionRect.top - targetBounds.top, 0, targetBounds.height);
        const width = clamp(printSelectionRect.width, 1, targetBounds.width - x);
        const height = clamp(printSelectionRect.height, 1, targetBounds.height - y);
        crop = { x, y, width, height };
      } else {
        crop = { x: 0, y: 0, width: captureWidth, height: captureHeight };
      }
      setIsPreparingPrint(true);
      const previousTargetBackgroundColor = target.style.backgroundColor;
      target.style.backgroundColor = "#ffffff";
      try {
        let dataUrl = "";
        try {
          const htmlToImage = await loadHtmlToImage();
          const fullDataUrl = await htmlToImage.toPng(target, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: "#ffffff",
            width: captureWidth,
            height: captureHeight,
            filter: (node: globalThis.Node) => {
              const el = node as unknown as HTMLElement;
              if (!el?.classList) return true;
              return !(
                el.classList.contains("react-flow__background") ||
                el.classList.contains("print-hidden") ||
                el.dataset?.printIgnore === "true"
              );
            },
          });
          dataUrl = crop
            ? await cropDataUrl({
                dataUrl: fullDataUrl,
                crop,
                sourceWidth: captureWidth,
                sourceHeight: captureHeight,
              })
            : fullDataUrl;
        } catch {
          const html2canvas = await loadHtml2Canvas();
          const canvas = await html2canvas(target, {
            backgroundColor: "#ffffff",
            useCORS: true,
            logging: false,
            scale: 2,
            x: crop?.x ?? 0,
            y: crop?.y ?? 0,
            width: crop?.width ?? captureWidth,
            height: crop?.height ?? captureHeight,
            ignoreElements: (element: Element) => {
              const el = element as HTMLElement;
              return (
                el.classList.contains("react-flow__background") ||
                el.classList.contains("print-hidden") ||
                el.dataset.printIgnore === "true"
              );
            },
          });
          dataUrl = canvas.toDataURL("image/png");
        }
        if (options?.openPreview !== false) {
          openPrintPreviewFromDataUrl(dataUrl);
        }
        return dataUrl;
      } catch (e) {
        setError((e as Error)?.message || "Unable to prepare print preview.");
        return null;
      } finally {
        target.style.backgroundColor = previousTargetBackgroundColor;
        setIsPreparingPrint(false);
      }
    },
    [canvasRef, openPrintPreviewFromDataUrl, printSelectionRect, setError]
  );

  const handlePrintCurrentView = useCallback(async () => {
    setShowPrintMenu(false);
    setShowPrintSelectionConfirm(false);
    setPrintSelectionMode(false);
    setPrintSelectionDraft(null);
    setPrintSelectionRect(null);
    await capturePrintImage("current");
  }, [capturePrintImage]);

  const handlePrintSelectArea = useCallback(() => {
    setShowPrintMenu(false);
    setShowPrintSelectionConfirm(false);
    setPrintSelectionDraft(null);
    setPrintSelectionRect(null);
    setPrintSelectionCopyMessage(null);
    setPrintSelectionMode(true);
  }, []);

  const handleConfirmPrintArea = useCallback(async () => {
    setPrintSelectionCopyMessage(null);
    setShowPrintSelectionConfirm(false);
    await capturePrintImage("area");
    setPrintSelectionMode(false);
  }, [capturePrintImage]);

  const handleCopyPrintAreaImageToClipboard = useCallback(async () => {
    setPrintSelectionCopyMessage(null);
    const dataUrl = await capturePrintImage("area", { openPreview: false });
    if (!dataUrl) return;
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      setPrintSelectionCopyMessage("Clipboard image copy is not supported in this browser.");
      return;
    }
    setIsCopyingPrintImage(true);
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
      setPrintSelectionCopyMessage("Image copied to clipboard. You can paste it elsewhere.");
    } catch (e) {
      const message = (e as Error)?.message?.trim();
      setPrintSelectionCopyMessage(message ? `Unable to copy image: ${message}` : "Unable to copy image to clipboard.");
    } finally {
      setIsCopyingPrintImage(false);
    }
  }, [capturePrintImage]);

  const handlePrintOverlayPointerDown = useCallback(
    (event: { clientX: number; clientY: number }) => {
      if (showPrintSelectionConfirm) return;
      setPrintSelectionCopyMessage(null);
      setPrintSelectionDraft({
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
      });
    },
    [showPrintSelectionConfirm]
  );

  const handlePrintOverlayPointerMove = useCallback((event: { clientX: number; clientY: number }) => {
    setPrintSelectionDraft((prev) =>
      prev
        ? {
            ...prev,
            currentX: event.clientX,
            currentY: event.clientY,
          }
        : prev
    );
  }, []);

  const handlePrintOverlayPointerUp = useCallback(() => {
    setPrintSelectionDraft((prev) => {
      if (!prev) return prev;
      const left = Math.min(prev.startX, prev.currentX);
      const top = Math.min(prev.startY, prev.currentY);
      const width = Math.abs(prev.currentX - prev.startX);
      const height = Math.abs(prev.currentY - prev.startY);
      if (width < 12 || height < 12) {
        setPrintSelectionRect(null);
        return null;
      }
      setPrintSelectionRect({ left, top, width, height });
      setShowPrintSelectionConfirm(true);
      return null;
    });
  }, []);

  return {
    printPreviewFrameRef,
    showPrintMenu,
    setShowPrintMenu,
    isPreparingPrint,
    showPrintPreview,
    printPreviewHtml,
    printOrientation,
    setPrintOrientation,
    printSelectionMode,
    isCopyingPrintImage,
    printSelectionCopyMessage,
    activePrintSelectionRect,
    showPrintSelectionConfirm,
    setShowPrintPreview,
    exitPrintSelectionMode,
    handlePrintCurrentView,
    handlePrintSelectArea,
    handleConfirmPrintArea,
    handleCopyPrintAreaImageToClipboard,
    handlePrintOverlayPointerDown,
    handlePrintOverlayPointerMove,
    handlePrintOverlayPointerUp,
  };
}
