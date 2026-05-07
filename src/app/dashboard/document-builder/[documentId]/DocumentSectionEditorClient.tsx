"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/loading/HsesLoaders";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import { supabaseBrowser } from "@/lib/supabase/client";
import styles from "./DocumentSectionEditorClient.module.css";

type ProjectRecord = {
  id: string;
  title: string;
  status: string;
  document_type_version_id: string;
};

type SectionDefinitionRecord = {
  id: string;
  key: string;
  title: string;
  objective: string | null;
  instructions: string | null;
  order_index: number;
  default_content: string | null;
};

type ProjectSectionRecord = {
  id: string;
  section_id: string;
  generated_content: string | null;
  edited_content: string | null;
  final_content: string | null;
  status: string;
  last_generated_at: string | null;
  metadata: Record<string, unknown> | null;
  updated_at: string;
};

type SectionEditorRecord = {
  id: string;
  key: string;
  title: string;
  objective: string | null;
  instructions: string | null;
  order_index: number;
  default_content: string | null;
  projectSectionId: string | null;
  generatedContent: string | null;
  editedContent: string | null;
  finalContent: string | null;
  status: string;
  lastGeneratedAt: string | null;
  updatedAt: string | null;
  metadata: Record<string, unknown>;
};

type TableArtifact = {
  title?: string;
  caption?: string;
  headers?: string[];
  rows?: unknown[];
};

type GraphicArtifact = {
  title?: string;
  type?: string;
  description?: string;
  items?: unknown[];
  steps?: unknown[];
};

const formatSavedAt = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not saved yet";

const stringifyValue = (value: unknown) => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => stringifyValue(item)).filter((item) => item.trim().length > 0) : [];

const readTableArtifacts = (metadata: Record<string, unknown>): TableArtifact[] =>
  Array.isArray(metadata.tables)
    ? (metadata.tables.filter((item) => item && typeof item === "object") as TableArtifact[])
    : [];

const readGraphicArtifacts = (metadata: Record<string, unknown>): GraphicArtifact[] =>
  Array.isArray(metadata.graphics)
    ? (metadata.graphics.filter((item) => item && typeof item === "object") as GraphicArtifact[])
    : [];

const buildSectionRecords = (
  sections: SectionDefinitionRecord[],
  projectSections: ProjectSectionRecord[],
): SectionEditorRecord[] =>
  sections.map((section) => {
    const projectSection = projectSections.find((item) => item.section_id === section.id);

    return {
      id: section.id,
      key: section.key,
      title: section.title,
      objective: section.objective,
      instructions: section.instructions,
      order_index: section.order_index,
      default_content: section.default_content,
      projectSectionId: projectSection?.id ?? null,
      generatedContent: projectSection?.generated_content ?? null,
      editedContent: projectSection?.edited_content ?? null,
      finalContent: projectSection?.final_content ?? null,
      status: projectSection?.status ?? "pending",
      lastGeneratedAt: projectSection?.last_generated_at ?? null,
      updatedAt: projectSection?.updated_at ?? null,
      metadata: (projectSection?.metadata as Record<string, unknown> | null) ?? {},
    };
  });

export default function DocumentSectionEditorClient({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [sections, setSections] = useState<SectionEditorRecord[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentPaneHeight, setContentPaneHeight] = useState<number | null>(null);
  const menuPaneRef = useRef<HTMLElement | null>(null);

  const loadEditor = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await ensurePortalSupabaseUser();
      if (!user) {
        window.location.assign(`/login?returnTo=${encodeURIComponent(`/dashboard/document-builder/${documentId}/edit`)}`);
        return;
      }

      const projectResult = await supabaseBrowser
        .schema("docbuilder")
        .from("document_projects")
        .select("id,title,status,document_type_version_id")
        .eq("id", documentId)
        .single();

      if (projectResult.error) {
        throw new Error(projectResult.error.message || "Unable to load this document project.");
      }

      const resolvedProject = projectResult.data as ProjectRecord;
      setProject(resolvedProject);

      const [sectionsResult, projectSectionsResult] = await Promise.all([
        supabaseBrowser
          .schema("docbuilder")
          .from("document_sections")
          .select("id,key,title,objective,instructions,order_index,default_content")
          .eq("document_type_version_id", resolvedProject.document_type_version_id)
          .order("order_index", { ascending: true }),
        supabaseBrowser
          .schema("docbuilder")
          .from("document_project_sections")
          .select("id,section_id,generated_content,edited_content,final_content,status,last_generated_at,metadata,updated_at")
          .eq("document_project_id", documentId),
      ]);

      if (sectionsResult.error || projectSectionsResult.error) {
        throw new Error(
          sectionsResult.error?.message ||
            projectSectionsResult.error?.message ||
            "Unable to load document sections.",
        );
      }

      const mergedSections = buildSectionRecords(
        (sectionsResult.data ?? []) as SectionDefinitionRecord[],
        (projectSectionsResult.data ?? []) as ProjectSectionRecord[],
      );

      setSections(mergedSections);
      setActiveSectionId((current) => current ?? mergedSections[0]?.id ?? null);
      setDrafts((current) => {
        if (Object.keys(current).length > 0) return current;

        return Object.fromEntries(
          mergedSections.map((section) => [
            section.id,
            section.editedContent ?? section.finalContent ?? section.generatedContent ?? section.default_content ?? "",
          ]),
        );
      });
    } catch (loadFailure) {
      setError(loadFailure instanceof Error ? loadFailure.message : "Unable to load document sections.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEditor();
  }, [documentId]);

  useLayoutEffect(() => {
    const syncContentPaneHeight = () => {
      const nextHeight = menuPaneRef.current?.offsetHeight ?? null;
      setContentPaneHeight(nextHeight);
    };

    syncContentPaneHeight();

    const observer =
      typeof ResizeObserver !== "undefined" && menuPaneRef.current
        ? new ResizeObserver(() => syncContentPaneHeight())
        : null;

    if (observer && menuPaneRef.current) {
      observer.observe(menuPaneRef.current);
    }

    window.addEventListener("resize", syncContentPaneHeight);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncContentPaneHeight);
    };
  }, [sections, activeSectionId]);

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) ?? sections[0] ?? null,
    [activeSectionId, sections],
  );

  const activeDraft = activeSection ? drafts[activeSection.id] ?? "" : "";
  const generatedBaseline = activeSection?.generatedContent ?? activeSection?.default_content ?? "";
  const isDirty = activeSection
    ? activeDraft !==
      (activeSection.editedContent ??
        activeSection.finalContent ??
        activeSection.generatedContent ??
        activeSection.default_content ??
        "")
    : false;
  const assumptionItems = activeSection ? readStringArray(activeSection.metadata.assumptions) : [];
  const followUpItems = activeSection ? readStringArray(activeSection.metadata.follow_up_items) : [];
  const tableArtifacts = activeSection ? readTableArtifacts(activeSection.metadata) : [];
  const graphicArtifacts = activeSection ? readGraphicArtifacts(activeSection.metadata) : [];

  const updateActiveDraft = (value: string) => {
    if (!activeSection) return;
    setDrafts((current) => ({
      ...current,
      [activeSection.id]: value,
    }));
  };

  const saveActiveSection = async () => {
    if (!activeSection) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const nextDraft = activeDraft;
      const nextStatus =
        nextDraft.trim().length === 0
          ? activeSection.generatedContent
            ? "generated"
            : "pending"
          : nextDraft === generatedBaseline
            ? "generated"
            : "edited";

      const { data, error: upsertError } = await supabaseBrowser
        .schema("docbuilder")
        .from("document_project_sections")
        .upsert(
          {
            document_project_id: documentId,
            section_id: activeSection.id,
            edited_content: nextDraft === generatedBaseline ? null : nextDraft,
            status: nextStatus,
          },
          { onConflict: "document_project_id,section_id" },
        )
        .select("id,updated_at")
        .single();

      if (upsertError) {
        throw new Error(upsertError.message || "Unable to save this section.");
      }

      const { error: projectStatusError } = await supabaseBrowser
        .schema("docbuilder")
        .from("document_projects")
        .update({ status: "editing" })
        .eq("id", documentId);

      if (projectStatusError) {
        throw new Error(projectStatusError.message || "Unable to update document status.");
      }

      setSections((current) =>
        current.map((section) =>
          section.id === activeSection.id
            ? {
                ...section,
                projectSectionId: (data as { id: string; updated_at: string }).id,
                editedContent: nextDraft === generatedBaseline ? null : nextDraft,
                status: nextStatus,
                updatedAt: (data as { id: string; updated_at: string }).updated_at,
              }
            : section,
        ),
      );
    } catch (saveFailure) {
      setSaveError(saveFailure instanceof Error ? saveFailure.message : "Unable to save this section.");
    } finally {
      setIsSaving(false);
    }
  };

  const regenerateActiveSection = async () => {
    if (!activeSection) return;

    if (isDirty) {
      const shouldContinue = window.confirm(
        "Regenerating this section will replace the unsaved text in the editor. Continue?",
      );
      if (!shouldContinue) return;
    }

    setIsGenerating(true);
    setSaveError(null);

    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your session has expired. Refresh and try again.");
      }

      const { error: projectStatusError } = await supabaseBrowser
        .schema("docbuilder")
        .from("document_projects")
        .update({ status: "generating" })
        .eq("id", documentId);

      if (projectStatusError) {
        throw new Error(projectStatusError.message || "Unable to update document status.");
      }

      const response = await fetch(`/api/portal/document-builder/projects/${documentId}/generation/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sectionId: activeSection.id }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to regenerate this section.");
      }

      const refreshedSectionResult = await supabaseBrowser
        .schema("docbuilder")
        .from("document_project_sections")
        .select("id,section_id,generated_content,edited_content,final_content,status,last_generated_at,metadata,updated_at")
        .eq("document_project_id", documentId)
        .eq("section_id", activeSection.id)
        .single();

      if (refreshedSectionResult.error) {
        throw new Error(refreshedSectionResult.error.message || "Unable to reload regenerated section.");
      }

      const refreshedSection = refreshedSectionResult.data as ProjectSectionRecord;

      setSections((current) =>
        current.map((section) =>
          section.id === activeSection.id
            ? {
                ...section,
                projectSectionId: refreshedSection.id,
                generatedContent: refreshedSection.generated_content,
                editedContent: refreshedSection.edited_content,
                finalContent: refreshedSection.final_content,
                status: refreshedSection.status,
                lastGeneratedAt: refreshedSection.last_generated_at,
                updatedAt: refreshedSection.updated_at,
                metadata: (refreshedSection.metadata as Record<string, unknown> | null) ?? {},
              }
            : section,
        ),
      );

      setDrafts((current) => ({
        ...current,
        [activeSection.id]:
          refreshedSection.edited_content ??
          refreshedSection.final_content ??
          refreshedSection.generated_content ??
          activeSection.default_content ??
          "",
      }));

      await supabaseBrowser
        .schema("docbuilder")
        .from("document_projects")
        .update({ status: "editing" })
        .eq("id", documentId);
    } catch (generationFailure) {
      setSaveError(generationFailure instanceof Error ? generationFailure.message : "Unable to regenerate this section.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={8} columns="100%" showToolbar />;
  }

  if (error || !project) {
    return <div className={styles.noticeError}>{error ?? "Unable to load this editor."}</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.workspace}>
        <aside ref={menuPaneRef} className={styles.menuPane}>
          <div className={styles.menuHeader}>
            <h3>Document Sections</h3>
            <p>Open a section to review the draft content generated from the questionnaire.</p>
          </div>

          <div className={styles.menuList}>
            {sections.map((section) => {
              const sectionDraft = drafts[section.id] ?? "";
              const sourceContent =
                section.editedContent ?? section.finalContent ?? section.generatedContent ?? section.default_content ?? "";
              const sectionDirty = sectionDraft !== sourceContent;
              const isComplete = section.status !== "pending";

              return (
                <button
                  key={section.id}
                  type="button"
                  className={`${styles.menuItem} ${activeSection?.id === section.id ? styles.menuItemActive : ""}`}
                  onClick={() => setActiveSectionId(section.id)}
                >
                  <div className={styles.menuItemMain}>
                    <span className={styles.menuKey}>{section.key}</span>
                    <span className={styles.menuText}>{section.title}</span>
                  </div>
                  <div className={styles.menuItemMeta}>
                    <span className={`${styles.menuState} ${isComplete ? styles.menuStateReady : ""}`}>
                      {section.status}
                    </span>
                    {sectionDirty ? <span className={styles.menuDirty}>Unsaved</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className={styles.contentColumn}>
          <section className={styles.contentPane} style={contentPaneHeight ? { height: `${contentPaneHeight}px` } : undefined}>
            {activeSection ? (
              <>
                <div className={styles.contentHeader}>
                  <div>
                    <span className={styles.sectionEyebrow}>
                      {activeSection.key} · {activeSection.status}
                    </span>
                    <h3>{activeSection.title}</h3>
                    <p>{activeSection.objective || activeSection.instructions || "Edit the generated content for this section."}</p>
                  </div>
                  <div className={styles.headerMeta}>
                    <span>Generated: {formatSavedAt(activeSection.lastGeneratedAt)}</span>
                    <span>Saved: {formatSavedAt(activeSection.updatedAt)}</span>
                  </div>
                </div>

                <div className={styles.editorCard}>
                  <label className={styles.editorLabel} htmlFor="section-content-editor">
                    Section content
                  </label>
                  <textarea
                    id="section-content-editor"
                    className={styles.editorField}
                    value={activeDraft}
                    onChange={(event) => updateActiveDraft(event.target.value)}
                    placeholder="Generated section content will appear here."
                  />
                </div>

                {assumptionItems.length > 0 || followUpItems.length > 0 ? (
                  <div className={styles.artifactGrid}>
                    {assumptionItems.length > 0 ? (
                      <article className={styles.artifactCard}>
                        <h4>Assumptions</h4>
                        <ul className={styles.artifactList}>
                          {assumptionItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    ) : null}

                    {followUpItems.length > 0 ? (
                      <article className={styles.artifactCard}>
                        <h4>Follow-up items</h4>
                        <ul className={styles.artifactList}>
                          {followUpItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    ) : null}
                  </div>
                ) : null}

                {tableArtifacts.length > 0 ? (
                  <div className={styles.artifactStack}>
                    {tableArtifacts.map((table, index) => {
                      const headers = Array.isArray(table.headers) ? table.headers.map((item) => stringifyValue(item)) : [];
                      const rows = Array.isArray(table.rows)
                        ? table.rows.map((row) =>
                            Array.isArray(row)
                              ? row.map((cell) => stringifyValue(cell))
                              : [stringifyValue(row)],
                          )
                        : [];

                      return (
                        <article key={`table-${index}`} className={styles.artifactCard}>
                          <h4>{table.title || `Generated table ${index + 1}`}</h4>
                          {table.caption ? <p className={styles.artifactText}>{table.caption}</p> : null}
                          <div className={`${styles.tableWrap} portal-table-shell`}>
                            <table className={`${styles.table} portal-table`}>
                              {headers.length > 0 ? (
                                <thead>
                                  <tr>
                                    {headers.map((header, headerIndex) => (
                                      <th key={`${index}-header-${headerIndex}`}>{header}</th>
                                    ))}
                                  </tr>
                                </thead>
                              ) : null}
                              <tbody>
                                {rows.length > 0 ? (
                                  rows.map((row, rowIndex) => (
                                    <tr key={`${index}-row-${rowIndex}`}>
                                      {row.map((cell, cellIndex) => (
                                        <td key={`${index}-row-${rowIndex}-cell-${cellIndex}`}>{cell}</td>
                                      ))}
                                    </tr>
                                  ))
                                ) : (
                                  <tr className="portal-table-empty-row">
                                    <td colSpan={Math.max(headers.length, 1)}>No table rows were generated for this section.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}

                {graphicArtifacts.length > 0 ? (
                  <div className={styles.artifactStack}>
                    {graphicArtifacts.map((graphic, index) => {
                      const graphicItems = Array.isArray(graphic.items)
                        ? graphic.items
                        : Array.isArray(graphic.steps)
                          ? graphic.steps
                          : [];

                      return (
                        <article key={`graphic-${index}`} className={styles.artifactCard}>
                          <h4>{graphic.title || `Generated graphic ${index + 1}`}</h4>
                          {graphic.type ? <span className={styles.graphicType}>{graphic.type}</span> : null}
                          {graphic.description ? <p className={styles.artifactText}>{graphic.description}</p> : null}
                          {graphicItems.length > 0 ? (
                            <ul className={styles.artifactList}>
                              {graphicItems.map((item, itemIndex) => (
                                <li key={`graphic-${index}-item-${itemIndex}`}>{stringifyValue(item)}</li>
                              ))}
                            </ul>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </>
            ) : (
              <div className={styles.emptyState}>No document sections are available for this editor.</div>
            )}
          </section>

          <div className={styles.footerActions}>
            <div className={styles.footerButtons}>
              <button
                type="button"
                className={styles.exportButton}
                onClick={() => router.push(`/dashboard/document-builder/${documentId}/export`)}
                disabled={isSaving || isGenerating}
              >
                Export to PDF
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => void regenerateActiveSection()}
                disabled={!activeSection || isGenerating || isSaving}
              >
                {isGenerating ? "Regenerating..." : "Regenerate section"}
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => void saveActiveSection()}
                disabled={!activeSection || isSaving || isGenerating}
              >
                {isSaving ? "Saving..." : "Save section"}
              </button>
            </div>
            <div className={styles.saveMeta}>
              <span>{activeSection ? `Last saved: ${formatSavedAt(activeSection.updatedAt)}` : "No section selected"}</span>
              {isDirty ? <span className={styles.unsavedState}>Unsaved changes</span> : null}
              {saveError ? <span className={styles.saveError}>{saveError}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
