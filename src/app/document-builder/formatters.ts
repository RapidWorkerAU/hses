export const formatDocumentBuilderLabel = (value: string) =>
  decodeURIComponent(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
