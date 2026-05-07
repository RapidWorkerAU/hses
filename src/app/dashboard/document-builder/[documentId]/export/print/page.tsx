import PrintOnLoad from "./PrintOnLoad";
import { loadDocumentExportPayload } from "@/lib/document-builder/export/service";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderContentHtml = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");

const readThemeString = (root: Record<string, unknown>, branch: string, key: string, fallback: string) => {
  const node = root[branch];
  if (!node || typeof node !== "object") return fallback;
  const value = (node as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
};

export default async function DocumentExportPrintPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const payload = await loadDocumentExportPayload(documentId);
  const sections = payload.sections.filter((section) => section.content.trim().length > 0);
  const theme = payload.themeConfig;
  const bodyFont = readThemeString(theme, "typography", "bodyFontFamily", "Arial, Helvetica, sans-serif");
  const headingFont = readThemeString(theme, "typography", "headingFontFamily", "Arial, Helvetica, sans-serif");
  const primaryColour = readThemeString(theme, "colours", "primary", "#003776");
  const borderColour = readThemeString(theme, "colours", "border", "#000000");
  const mutedColour = readThemeString(theme, "colours", "muted", "#5D6C7C");
  const blueWash = readThemeString(theme, "colours", "blueWash", "#DDEDFB");

  return (
    <html lang="en">
      <body>
        <PrintOnLoad />
        <main
          style={{
            fontFamily: bodyFont,
            color: "#000000",
            background: "#ffffff",
            margin: "0 auto",
            maxWidth: "210mm",
            padding: "18mm",
          }}
        >
          <section
            style={{
              borderTop: `10px solid ${primaryColour}`,
              borderBottom: `2px solid ${borderColour}`,
              paddingBottom: "18px",
              marginBottom: "26px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "24px",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: primaryColour,
                    marginBottom: "14px",
                  }}
                >
                  {payload.documentTypeTitle}
                </div>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: headingFont,
                    fontSize: "28px",
                    lineHeight: 1.1,
                  }}
                >
                  {payload.projectTitle}
                </h1>
                {payload.projectDescription ? (
                  <p style={{ margin: "14px 0 0", color: mutedColour, maxWidth: "120mm", lineHeight: 1.6 }}>
                    {payload.projectDescription}
                  </p>
                ) : null}
              </div>

              <div
                style={{
                  minWidth: "56mm",
                  background: blueWash,
                  border: `1px solid ${borderColour}`,
                  padding: "12px 14px",
                  fontSize: "12px",
                  lineHeight: 1.6,
                }}
              >
                <div><strong>Style:</strong> {payload.styleProfileTitle}</div>
                <div><strong>Status:</strong> {payload.projectStatus}</div>
                <div><strong>Sections:</strong> {sections.length}</div>
                <div><strong>Updated:</strong> {new Date(payload.updatedAt).toLocaleDateString("en-AU")}</div>
              </div>
            </div>
          </section>

          {sections.map((section, index) => (
            <section
              key={section.id}
              style={{
                marginBottom: "24px",
                pageBreakInside: "avoid",
              }}
            >
              <div
                style={{
                  borderBottom: `2px solid ${primaryColour}`,
                  paddingBottom: "8px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: mutedColour,
                    marginBottom: "4px",
                  }}
                >
                  Section {index + 1}
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: headingFont,
                    fontSize: "18px",
                    lineHeight: 1.2,
                  }}
                >
                  {section.key}. {section.title}
                </h2>
              </div>

              {section.objective ? (
                <p
                  style={{
                    margin: "0 0 12px",
                    color: mutedColour,
                    fontStyle: "italic",
                    lineHeight: 1.5,
                  }}
                >
                  {section.objective}
                </p>
              ) : null}

              <div
                style={{ lineHeight: 1.65, fontSize: "10.5pt" }}
                dangerouslySetInnerHTML={{ __html: renderContentHtml(section.content) }}
              />
            </section>
          ))}
        </main>

        <style>{`
          @page {
            size: A4;
            margin: 18mm;
          }

          body {
            margin: 0;
            background: #ffffff;
          }

          p {
            margin: 0 0 10px;
          }

          @media print {
            main {
              max-width: none;
              padding: 0;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
