import type { Metadata, Viewport } from "next";
import SystemMapCanvasClient from "./SystemMapCanvasClient";

type MapPageProps = {
  params: Promise<{ mapId: string }>;
  searchParams: Promise<{
    welcome?: string;
    templateEditor?: string;
    templateId?: string;
    templateName?: string;
    templateGlobal?: string;
    templateVisibility?: string;
    from?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Management System Map",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function SystemMapPage({ params, searchParams }: MapPageProps) {
  const { mapId } = await params;
  const { welcome, templateEditor, templateId, templateName, templateGlobal, templateVisibility, from } = await searchParams;
  const resolvedTemplateVisibility =
    templateVisibility === "organisation" || templateVisibility === "global" || templateVisibility === "private"
      ? templateVisibility
      : templateGlobal === "1"
        ? "global"
        : "private";

  return (
    <SystemMapCanvasClient
      mapId={mapId}
      showWelcomeOnLoad={welcome === "1"}
      templateEditorTemplateId={templateEditor === "1" ? templateId ?? null : null}
      templateEditorTemplateName={templateEditor === "1" ? templateName ?? null : null}
      templateEditorIsGlobal={templateEditor === "1" ? templateGlobal === "1" : false}
      templateEditorVisibility={templateEditor === "1" ? resolvedTemplateVisibility : "private"}
      entrySource={from === "templates" ? "templates" : "dashboard"}
    />
  );
}
