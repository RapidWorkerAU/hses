"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listInvestigationTemplates,
  type InvestigationTemplateVisibility,
} from "@/lib/investigationTemplates";
import { supabaseBrowser } from "@/lib/supabase/client";
import type {
  CanvasElementRow,
  AnchorLinkRow,
  DocumentNodeRow,
  DocumentTypeRow,
  NodeRelationRow,
  OutlineItemRow,
  SystemMap,
} from "./canvasShared";
import { buildInvestigationTemplateSnapshot } from "./mapSnapshotUtils";

export type TemplateResult = {
  id: string;
  name: string;
  updatedAt: string;
  isGlobal: boolean;
  visibility: InvestigationTemplateVisibility;
};

type UseInvestigationTemplatesParams = {
  canSaveTemplate: boolean;
  formatStickyDate: (value: string | null | undefined) => string | null;
  setError: (message: string | null) => void;
  initialTemplateVisibility: InvestigationTemplateVisibility;
  isTemplateEditor: boolean;
  templateEditorTemplateId: string | null;
  templateEditorTemplateName: string | null;
  templateEditorVisibility: InvestigationTemplateVisibility;
  loading: boolean;
  map: SystemMap | null;
  types: DocumentTypeRow[];
  nodes: DocumentNodeRow[];
  elements: CanvasElementRow[];
  relations: NodeRelationRow[];
  anchorLinks: AnchorLinkRow[];
  outlineItems: OutlineItemRow[];
};

export function useInvestigationTemplates({
  canSaveTemplate,
  formatStickyDate,
  setError,
  initialTemplateVisibility,
  isTemplateEditor,
  templateEditorTemplateId,
  templateEditorTemplateName,
  templateEditorVisibility,
  loading,
  map,
  types,
  nodes,
  elements,
  relations,
  anchorLinks,
  outlineItems,
}: UseInvestigationTemplatesParams) {
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [templateQuery, setTemplateQuery] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateResults, setTemplateResults] = useState<TemplateResult[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateSaveMessage, setTemplateSaveMessage] = useState<string | null>(null);
  const [templateVisibility, setTemplateVisibility] =
    useState<InvestigationTemplateVisibility>(initialTemplateVisibility);
  const [, setTemplateEditorStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const loadTemplateResults = useCallback(
    async (query: string) => {
      if (!canSaveTemplate) return;

      try {
        setIsLoadingTemplates(true);
        const results = await listInvestigationTemplates(supabaseBrowser, query, 24);
        setTemplateResults(
          results
            .filter((item) => item.can_edit)
            .map((item) => ({
              id: item.id,
              name: item.name,
              updatedAt: formatStickyDate(item.updated_at) || "Recently saved",
              isGlobal: item.is_global,
              visibility: item.visibility ?? (item.is_global ? "global" : "private"),
            }))
        );
      } catch (templateError) {
        setError(templateError instanceof Error ? templateError.message : "Unable to load templates.");
      } finally {
        setIsLoadingTemplates(false);
      }
    },
    [canSaveTemplate, formatStickyDate, setError]
  );

  const handleTemplateQueryChange = useCallback(
    (value: string) => {
      setTemplateQuery(value);
      setSelectedTemplateId(null);
      setTemplateSaveMessage(null);
      if (!canSaveTemplate) return;
      if (value.trim().length >= 4) {
        setShowTemplateMenu(true);
        void loadTemplateResults(value);
      }
    },
    [canSaveTemplate, loadTemplateResults]
  );

  const handleSelectTemplateResult = useCallback(
    (id: string, name: string, visibility: InvestigationTemplateVisibility) => {
      setSelectedTemplateId(id);
      setTemplateQuery(name);
      setTemplateSaveMessage(null);
      setTemplateVisibility(visibility);
    },
    []
  );

  const handleSetTemplateVisibility = useCallback((visibility: InvestigationTemplateVisibility) => {
    setSelectedTemplateId(null);
    setTemplateSaveMessage(null);
    setTemplateVisibility(visibility);
  }, []);

  const buildTemplateSnapshot = useCallback(async () => {
    return buildInvestigationTemplateSnapshot({ types, nodes, elements, relations, anchorLinks, outlineItems });
  }, [anchorLinks, elements, nodes, outlineItems, relations, types]);

  const handleSaveTemplate = useCallback(async () => {
    if (!canSaveTemplate) return;

    const normalizedName = templateQuery.trim();
    if (!normalizedName) {
      setError("Enter a template name before saving.");
      return;
    }

    try {
      setIsSavingTemplate(true);
      setTemplateSaveMessage(null);
      setError(null);
      const snapshot = await buildTemplateSnapshot();

      const { data, error: saveError } = await supabaseBrowser.rpc("save_investigation_template", {
        p_name: normalizedName,
        p_snapshot: snapshot,
        p_template_id: selectedTemplateId,
        p_is_global: templateVisibility === "global",
        p_visibility: templateVisibility,
      });

      if (saveError) throw saveError;

      const savedRow = Array.isArray(data) ? data[0] : data;
      if (savedRow?.id) {
        setSelectedTemplateId(savedRow.id as string);
      }
      if (savedRow?.name) {
        setTemplateQuery(savedRow.name as string);
      }
      const savedIsGlobal = Boolean(savedRow?.is_global);
      setTemplateSaveMessage(
        savedRow?.was_overwritten
          ? savedIsGlobal
            ? "Global template updated."
            : savedRow?.visibility === "organisation"
              ? "Organisation template updated."
              : "Template updated."
          : savedIsGlobal
            ? "Global template saved."
            : savedRow?.visibility === "organisation"
              ? "Organisation template saved."
              : "Template saved."
      );
      await loadTemplateResults(normalizedName.length >= 4 ? normalizedName : "");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save template.");
    } finally {
      setIsSavingTemplate(false);
    }
  }, [
    buildTemplateSnapshot,
    canSaveTemplate,
    loadTemplateResults,
    selectedTemplateId,
    setError,
    templateQuery,
    templateVisibility,
  ]);

  useEffect(() => {
    if (!canSaveTemplate) {
      setShowTemplateMenu(false);
      setTemplateResults([]);
      setSelectedTemplateId(null);
      setTemplateSaveMessage(null);
    }
  }, [canSaveTemplate]);

  useEffect(() => {
    if (!showTemplateMenu || !canSaveTemplate) return;
    void loadTemplateResults(templateQuery.trim().length >= 4 ? templateQuery : "");
  }, [showTemplateMenu, canSaveTemplate, templateQuery, loadTemplateResults]);

  useEffect(() => {
    if (!isTemplateEditor || !templateEditorTemplateId || loading || !canSaveTemplate) return;

    setTemplateEditorStatus("saving");
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const snapshot = await buildTemplateSnapshot();
          const { error: saveError } = await supabaseBrowser.rpc("save_investigation_template", {
            p_name: templateEditorTemplateName?.trim() || map?.title || "Untitled Template",
            p_snapshot: snapshot,
            p_template_id: templateEditorTemplateId,
            p_is_global: templateEditorVisibility === "global",
            p_visibility: templateEditorVisibility,
          });

          if (saveError) throw saveError;
          setTemplateEditorStatus("saved");
        } catch (templateSyncError) {
          setTemplateEditorStatus("error");
          setError(templateSyncError instanceof Error ? templateSyncError.message : "Unable to sync template changes.");
        }
      })();
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    buildTemplateSnapshot,
    canSaveTemplate,
    isTemplateEditor,
    loading,
    map?.title,
    setError,
    templateEditorTemplateId,
    templateEditorTemplateName,
    templateEditorVisibility,
  ]);

  return {
    showTemplateMenu,
    setShowTemplateMenu,
    templateQuery,
    templateResults,
    isLoadingTemplates,
    isSavingTemplate,
    templateSaveMessage,
    templateVisibility,
    handleTemplateQueryChange,
    handleSelectTemplateResult,
    handleSetTemplateVisibility,
    handleSaveTemplate,
  };
}
