"use client";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export type Html2CanvasFn = (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
export type HtmlToImageApi = {
  toPng: (element: HTMLElement, options?: Record<string, unknown>) => Promise<string>;
};

export const PRINT_HEADER_HEIGHT_PX = 82;

export const loadHtml2Canvas = async (): Promise<Html2CanvasFn> => {
  if (typeof window === "undefined") throw new Error("Window is unavailable.");
  const existing = (window as unknown as { html2canvas?: Html2CanvasFn }).html2canvas;
  if (existing) return existing;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load print renderer."));
    document.head.appendChild(script);
  });
  const loaded = (window as unknown as { html2canvas?: Html2CanvasFn }).html2canvas;
  if (!loaded) throw new Error("Print renderer is unavailable.");
  return loaded;
};

export const loadHtmlToImage = async (): Promise<HtmlToImageApi> => {
  if (typeof window === "undefined") throw new Error("Window is unavailable.");
  const existing = (window as unknown as { htmlToImage?: HtmlToImageApi }).htmlToImage;
  if (existing?.toPng) return existing;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load image export engine."));
    document.head.appendChild(script);
  });
  const loaded = (window as unknown as { htmlToImage?: HtmlToImageApi }).htmlToImage;
  if (!loaded?.toPng) throw new Error("Image export engine is unavailable.");
  return loaded;
};

export const cropDataUrl = async (params: {
  dataUrl: string;
  crop: { x: number; y: number; width: number; height: number };
  sourceWidth: number;
  sourceHeight: number;
}) => {
  const { dataUrl, crop, sourceWidth, sourceHeight } = params;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to process print image."));
    image.src = dataUrl;
  });
  const scaleX = img.width / Math.max(1, sourceWidth);
  const scaleY = img.height / Math.max(1, sourceHeight);
  const srcX = Math.floor(crop.x * scaleX);
  const srcY = Math.floor(crop.y * scaleY);
  const srcW = Math.max(1, Math.floor(crop.width * scaleX));
  const srcH = Math.max(1, Math.floor(crop.height * scaleY));
  const canvas = document.createElement("canvas");
  canvas.width = srcW;
  canvas.height = srcH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to prepare print crop.");
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
  return canvas.toDataURL("image/png");
};

export const buildPrintPreviewHtml = (params: {
  mapTitle: string;
  imageDataUrl: string;
  orientation: "portrait" | "landscape";
}) => {
  const title = escapeHtml(params.mapTitle || "System Map");
  const image = params.imageDataUrl;
  const orientation = params.orientation;
  const pageWidth = orientation === "landscape" ? "297mm" : "210mm";
  const pageHeight = orientation === "landscape" ? "210mm" : "297mm";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const logoSrc = `${origin}/images/logo-black.png`;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Print Preview</title>
    <style>
      @page { size: A4 ${orientation}; margin: 12mm; }
      html, body { margin: 0; padding: 0; background: #f3f4f6; font-family: Arial, sans-serif; }
      .page {
        box-sizing: border-box;
        width: ${pageWidth};
        height: ${pageHeight};
        margin: 0 auto;
        background: #fff;
        padding: 0;
      }
      .header {
        height: 18mm;
        background: #fff;
        color: #111827;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 10px;
        border-bottom: 1px solid #d1d5db;
      }
      .header img {
        height: 12mm;
        width: auto;
        object-fit: contain;
      }
      .header .map-text {
        color: #60a5fa;
        font-weight: 700;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .header .doc-name {
        margin-left: auto;
        font-size: 13px;
        font-weight: 600;
        color: #111827;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .content {
        box-sizing: border-box;
        height: calc(${pageHeight} - 18mm);
        padding: 8mm 10mm 10mm 10mm;
        display: flex;
        align-items: flex-start;
        justify-content: center;
      }
      .content img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border: 1px solid #cbd5e1;
      }
      @media print {
        html, body { background: #fff; }
        .page { margin: 0; width: auto; height: auto; }
      }
    </style>
  </head>
  <body>
    <section class="page">
      <header class="header">
        <img src="${logoSrc}" alt="HSES" />
        <div class="map-text">System Map</div>
        <div class="doc-name">Document Name: ${title}</div>
      </header>
      <div class="content">
        <img src="${image}" alt="Print Capture" />
      </div>
    </section>
  </body>
</html>`;
};

