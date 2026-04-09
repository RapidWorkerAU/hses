const extensionLabels: Record<string, string> = {
  pdf: "PDF",
  doc: "Microsoft Word",
  docx: "Microsoft Word",
  dot: "Microsoft Word",
  dotx: "Microsoft Word",
  xls: "Microsoft Excel",
  xlsx: "Microsoft Excel",
  xlsm: "Microsoft Excel",
  csv: "CSV",
  ppt: "Microsoft PowerPoint",
  pptx: "Microsoft PowerPoint",
  pps: "Microsoft PowerPoint",
  ppsx: "Microsoft PowerPoint",
  png: "PNG Image",
  jpg: "JPG Image",
  jpeg: "JPG Image",
  gif: "GIF Image",
  webp: "WEBP Image",
  svg: "SVG Image",
  heic: "HEIC Image",
  heif: "HEIF Image",
  txt: "Text File",
  rtf: "Rich Text",
  zip: "ZIP Archive",
  rar: "RAR Archive",
  "7z": "7-Zip Archive",
};

const mimeLabels: Array<[prefix: string, label: string]> = [
  ["application/pdf", "PDF"],
  ["application/msword", "Microsoft Word"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml", "Microsoft Word"],
  ["application/vnd.ms-excel", "Microsoft Excel"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml", "Microsoft Excel"],
  ["text/csv", "CSV"],
  ["application/vnd.ms-powerpoint", "Microsoft PowerPoint"],
  ["application/vnd.openxmlformats-officedocument.presentationml", "Microsoft PowerPoint"],
  ["image/png", "PNG Image"],
  ["image/jpeg", "JPG Image"],
  ["image/jpg", "JPG Image"],
  ["image/gif", "GIF Image"],
  ["image/webp", "WEBP Image"],
  ["image/svg+xml", "SVG Image"],
  ["image/heic", "HEIC Image"],
  ["image/heif", "HEIF Image"],
  ["text/plain", "Text File"],
  ["application/rtf", "Rich Text"],
  ["application/zip", "ZIP Archive"],
  ["application/x-zip-compressed", "ZIP Archive"],
  ["application/vnd.rar", "RAR Archive"],
  ["application/x-7z-compressed", "7-Zip Archive"],
];

export const getQuoteFileTypeLabel = (contentType?: string | null, fileName?: string | null) => {
  const normalizedType = contentType?.trim().toLowerCase() ?? "";
  if (normalizedType) {
    const mimeMatch = mimeLabels.find(([prefix]) => normalizedType.startsWith(prefix));
    if (mimeMatch) return mimeMatch[1];
  }

  const extension = fileName?.split(".").pop()?.trim().toLowerCase() ?? "";
  if (extension && extensionLabels[extension]) {
    return extensionLabels[extension];
  }

  return "Document";
};
