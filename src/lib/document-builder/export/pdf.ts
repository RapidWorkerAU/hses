import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { DocumentExportPayload } from "./service";

type ThemeReader = {
  colour: (key: string, fallback: string) => string;
  typography: (key: string, fallback: number) => number;
};

const hexToRgb = (value: string) => {
  const normalized = value.replace("#", "").trim();
  if (normalized.length !== 6) return rgb(0, 0, 0);

  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return rgb(red, green, blue);
};

const createThemeReader = (themeConfig: Record<string, unknown>): ThemeReader => ({
  colour: (key, fallback) => {
    const colours = themeConfig.colours;
    if (!colours || typeof colours !== "object") return fallback;
    const value = (colours as Record<string, unknown>)[key];
    return typeof value === "string" && value.trim().length > 0 ? value : fallback;
  },
  typography: (key, fallback) => {
    const typography = themeConfig.typography;
    if (!typography || typeof typography !== "object") return fallback;
    const value = (typography as Record<string, unknown>)[key];
    return typeof value === "number" ? value : fallback;
  },
});

const drawWrappedText = ({
  page,
  text,
  font,
  size,
  x,
  y,
  maxWidth,
  lineHeight,
  color,
}: {
  page: PDFPage;
  text: string;
  font: PDFFont;
  size: number;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight: number;
  color: ReturnType<typeof rgb>;
}) => {
  const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  let cursorY = y;

  for (const paragraph of paragraphs) {
    const words = paragraph.replace(/\n/g, " ").split(/\s+/).filter(Boolean);
    let currentLine = "";

    for (const word of words) {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;
      const nextWidth = font.widthOfTextAtSize(nextLine, size);

      if (nextWidth > maxWidth && currentLine) {
        page.drawText(currentLine, { x, y: cursorY, size, font, color });
        cursorY -= lineHeight;
        currentLine = word;
      } else {
        currentLine = nextLine;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, { x, y: cursorY, size, font, color });
      cursorY -= lineHeight;
    }

    cursorY -= lineHeight * 0.45;
  }

  return cursorY;
};

const addFooter = ({
  page,
  pageNumber,
  totalPages,
  font,
  mutedColour,
}: {
  page: PDFPage;
  pageNumber: number;
  totalPages: number;
  font: PDFFont;
  mutedColour: ReturnType<typeof rgb>;
}) => {
  const { width } = page.getSize();
  page.drawLine({
    start: { x: 50, y: 36 },
    end: { x: width - 50, y: 36 },
    thickness: 1,
    color: mutedColour,
  });
  page.drawText(`Page ${pageNumber} of ${totalPages}`, {
    x: width - 110,
    y: 20,
    size: 9,
    font,
    color: mutedColour,
  });
};

export async function buildStyledDocumentPdf(payload: DocumentExportPayload) {
  const pdfDoc = await PDFDocument.create();
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const theme = createThemeReader(payload.themeConfig);
  const primaryColour = hexToRgb(theme.colour("primary", "#003776"));
  const borderColour = hexToRgb(theme.colour("border", "#000000"));
  const mutedColour = hexToRgb(theme.colour("muted", "#5D6C7C"));
  const blueWash = hexToRgb(theme.colour("blueWash", "#DDEDFB"));
  const coverTitleSize = theme.typography("coverTitleSizePt", 28);
  const headingSize = theme.typography("heading2SizePt", 14);
  const bodySize = theme.typography("bodyFontSizePt", 10);
  const bodyLineHeight = Math.max(14, bodySize * 1.55);
  const margin = 50;

  const cover = pdfDoc.addPage([595.28, 841.89]);
  const coverSize = cover.getSize();
  cover.drawRectangle({ x: 0, y: coverSize.height - 42, width: coverSize.width, height: 42, color: primaryColour });
  cover.drawText(payload.documentTypeTitle.toUpperCase(), {
    x: margin,
    y: coverSize.height - 88,
    size: 12,
    font: boldFont,
    color: primaryColour,
  });
  cover.drawText(payload.projectTitle, {
    x: margin,
    y: coverSize.height - 142,
    size: coverTitleSize,
    font: boldFont,
    color: borderColour,
    maxWidth: coverSize.width - margin * 2,
  });

  if (payload.projectDescription) {
    drawWrappedText({
      page: cover,
      text: payload.projectDescription,
      font: bodyFont,
      size: bodySize + 1,
      x: margin,
      y: coverSize.height - 190,
      maxWidth: coverSize.width - margin * 2,
      lineHeight: bodyLineHeight + 1,
      color: mutedColour,
    });
  }

  cover.drawRectangle({
    x: margin,
    y: 96,
    width: coverSize.width - margin * 2,
    height: 108,
    color: blueWash,
    borderColor: borderColour,
    borderWidth: 1,
  });
  const metaEntries = [
    ["Style profile", payload.styleProfileTitle],
    ["Project status", payload.projectStatus],
    ["Sections", String(payload.sections.filter((section) => section.content.trim().length > 0).length)],
    ["Updated", new Date(payload.updatedAt).toLocaleDateString("en-AU")],
  ] as const;

  metaEntries.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const entryX = margin + 18 + column * 220;
    const entryY = 170 - row * 42;
    cover.drawText(label.toUpperCase(), {
      x: entryX,
      y: entryY,
      size: 9,
      font: boldFont,
      color: primaryColour,
    });
    cover.drawText(value, {
      x: entryX,
      y: entryY - 16,
      size: 11,
      font: bodyFont,
      color: borderColour,
      maxWidth: 190,
    });
  });

  const printableSections = payload.sections.filter((section) => section.content.trim().length > 0);

  for (const section of printableSections) {
    let page = pdfDoc.addPage([595.28, 841.89]);
    let { width, height } = page.getSize();
    let cursorY = height - margin;

    page.drawText(`${section.key}. ${section.title}`, {
      x: margin,
      y: cursorY,
      size: headingSize,
      font: boldFont,
      color: borderColour,
    });
    cursorY -= 12;
    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: width - margin, y: cursorY },
      thickness: 2,
      color: primaryColour,
    });
    cursorY -= 22;

    if (section.objective) {
      cursorY = drawWrappedText({
        page,
        text: section.objective,
        font: bodyFont,
        size: bodySize,
        x: margin,
        y: cursorY,
        maxWidth: width - margin * 2,
        lineHeight: bodyLineHeight,
        color: mutedColour,
      });
      cursorY -= 6;
    }

    const paragraphs = section.content.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);

    for (const paragraph of paragraphs) {
      const estimatedHeight = Math.ceil(paragraph.length / 90) * bodyLineHeight + bodyLineHeight;
      if (cursorY - estimatedHeight < 60) {
        page = pdfDoc.addPage([595.28, 841.89]);
        ({ width, height } = page.getSize());
        cursorY = height - margin;
      }

      cursorY = drawWrappedText({
        page,
        text: paragraph,
        font: bodyFont,
        size: bodySize,
        x: margin,
        y: cursorY,
        maxWidth: width - margin * 2,
        lineHeight: bodyLineHeight,
        color: borderColour,
      });
    }
  }

  const pages = pdfDoc.getPages();
  pages.forEach((page, index) => {
    addFooter({
      page,
      pageNumber: index + 1,
      totalPages: pages.length,
      font: bodyFont,
      mutedColour,
    });
  });

  return pdfDoc.save();
}
