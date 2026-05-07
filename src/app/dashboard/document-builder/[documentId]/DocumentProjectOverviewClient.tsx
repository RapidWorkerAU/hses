"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TableSkeleton } from "@/components/loading/HsesLoaders";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import { supabaseBrowser } from "@/lib/supabase/client";

type ProjectRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  updated_at: string;
  created_at: string;
  country_code: string | null;
  document_type_version_id: string;
  document_types: { title: string | null } | Array<{ title: string | null }> | null;
};

type QuestionGroupSummary = {
  id: string;
  key: string;
  title: string;
  document_questions: Array<{ id: string }> | null;
};

type SectionSummary = {
  id: string;
  title: string;
  key: string;
  order_index: number;
};

type ProjectSectionSummary = {
  id: string;
  status: string;
  section_id: string;
};

const formatStatus = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const resolveNestedTitle = (value: ProjectRecord["document_types"]) => {
  if (Array.isArray(value)) return value[0]?.title ?? null;
  return value?.title ?? null;
};

export default function DocumentProjectOverviewClient({ documentId }: { documentId: string }) {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [groups, setGroups] = useState<QuestionGroupSummary[]>([]);
  const [answersCount, setAnswersCount] = useState(0);
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [projectSections, setProjectSections] = useState<ProjectSectionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const user = await ensurePortalSupabaseUser();
        if (!user) {
          window.location.assign(`/login?returnTo=${encodeURIComponent(`/dashboard/document-builder/${documentId}`)}`);
          return;
        }

        const projectResult = await supabaseBrowser
          .schema("docbuilder")
          .from("document_projects")
          .select("id,title,description,status,updated_at,created_at,country_code,document_type_version_id,document_types(title)")
          .eq("id", documentId)
          .single();

        if (projectResult.error) {
          setError(projectResult.error.message || "Unable to load this document project.");
          return;
        }

        const resolvedProject = projectResult.data as ProjectRecord;
        setProject(resolvedProject);

        const [groupsResult, answersResult, sectionsResult, projectSectionsResult] = await Promise.all([
          supabaseBrowser
            .schema("docbuilder")
            .from("document_question_groups")
            .select("id,key,title,document_questions(id)")
            .eq("document_type_version_id", resolvedProject.document_type_version_id)
            .order("order_index", { ascending: true }),
          supabaseBrowser
            .schema("docbuilder")
            .from("document_answers")
            .select("id", { count: "exact", head: true })
            .eq("document_project_id", documentId),
          supabaseBrowser
            .schema("docbuilder")
            .from("document_sections")
            .select("id,title,key,order_index")
            .eq("document_type_version_id", resolvedProject.document_type_version_id)
            .order("order_index", { ascending: true }),
          supabaseBrowser
            .schema("docbuilder")
            .from("document_project_sections")
            .select("id,status,section_id")
            .eq("document_project_id", documentId),
        ]);

        if (groupsResult.error || answersResult.error || sectionsResult.error || projectSectionsResult.error) {
          setError(
            groupsResult.error?.message ||
              answersResult.error?.message ||
              sectionsResult.error?.message ||
              projectSectionsResult.error?.message ||
              "Unable to load the document project details."
          );
          return;
        }

        setGroups((groupsResult.data ?? []) as QuestionGroupSummary[]);
        setAnswersCount(answersResult.count ?? 0);
        setSections((sectionsResult.data ?? []) as SectionSummary[]);
        setProjectSections((projectSectionsResult.data ?? []) as ProjectSectionSummary[]);
      } catch {
        setError("Unable to load this document project.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [documentId]);

  const totalQuestions = useMemo(
    () => groups.reduce((sum, group) => sum + (group.document_questions?.length ?? 0), 0),
    [groups]
  );

  const progressedSectionCount = useMemo(
    () => projectSections.filter((section) => section.status !== "pending").length,
    [projectSections]
  );

  if (isLoading) {
    return <TableSkeleton rows={6} columns="100%" showToolbar />;
  }

  if (error || !project) {
    return <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error ?? "Unable to load this document project."}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="dashboard-metric-row">
        <article className="dashboard-metric">
          <span>Document Type</span>
          <strong>{resolveNestedTitle(project.document_types) ?? "-"}</strong>
        </article>
        <article className="dashboard-metric">
          <span>Status</span>
          <strong>{formatStatus(project.status)}</strong>
        </article>
        <article className="dashboard-metric">
          <span>Questionnaire</span>
          <strong>{answersCount}/{totalQuestions}</strong>
        </article>
        <article className="dashboard-metric">
          <span>Sections Seeded</span>
          <strong>{projectSections.length}/{sections.length}</strong>
        </article>
        <article className="dashboard-metric">
          <span>Sections Progressed</span>
          <strong>{progressedSectionCount}</strong>
        </article>
        <article className="dashboard-metric">
          <span>Updated</span>
          <strong>{formatDateTime(project.updated_at)}</strong>
        </article>
      </section>

      <div className="dashboard-actions-row">
        <Link href={`/dashboard/document-builder/${documentId}/questions`} className="btn">
          Open Questionnaire
        </Link>
        <Link href={`/dashboard/document-builder/${documentId}/edit`} className="btn btn-secondary">
          Open Editor
        </Link>
        <Link href={`/dashboard/document-builder/${documentId}/generate`} className="btn btn-secondary">
          Generation Stage
        </Link>
      </div>

      <div className="dashboard-split">
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2>{project.title}</h2>
            <p>
              {project.description ||
                "This document project tracks the Permit to Work procedure through questionnaire intake, section preparation, generation, editing, review, and export."}
            </p>
          </div>

          <div className="portal-table-shell">
            <table className="portal-table w-full text-left text-sm">
              <colgroup>
                <col style={{ width: "16%" }} />
                <col style={{ width: "34%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "32%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="px-4 py-3">Workflow Step</th>
                  <th className="px-4 py-3">What It Does</th>
                  <th className="px-4 py-3">Current State</th>
                  <th className="px-4 py-3">Route</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Questions</td>
                  <td className="px-4 py-3 text-slate-600">Collects project, jurisdiction, role, control, and document-control inputs.</td>
                  <td className="px-4 py-3 text-slate-600">{answersCount > 0 ? `${answersCount} answer(s) saved` : "Not started"}</td>
                  <td className="px-4 py-3 text-slate-600">/questions</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Generate</td>
                  <td className="px-4 py-3 text-slate-600">Will run section-based AI localisation using template content, answers, and requirements.</td>
                  <td className="px-4 py-3 text-slate-600">Scaffolded</td>
                  <td className="px-4 py-3 text-slate-600">/generate</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Edit</td>
                  <td className="px-4 py-3 text-slate-600">Will host the tabbed section editor and manual overrides.</td>
                  <td className="px-4 py-3 text-slate-600">
                    {projectSections.length > 0 ? `${projectSections.length} section shell(s) prepared` : "Not prepared"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">/edit</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Export</td>
                  <td className="px-4 py-3 text-slate-600">Will render the final document using the permit procedure PDF style profile.</td>
                  <td className="px-4 py-3 text-slate-600">Pending renderer</td>
                  <td className="px-4 py-3 text-slate-600">/export</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside className="dashboard-panel dashboard-panel--aside">
          <div className="dashboard-panel-header">
            <h2>Question Groups</h2>
            <p>These groups were seeded from the Permit to Work question block you supplied.</p>
          </div>
          <div className="space-y-3">
            {groups.map((group) => (
              <article key={group.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-slate-900">{group.key}. {group.title}</strong>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {group.document_questions?.length ?? 0} question(s)
                  </span>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h2>Section Backbone</h2>
          <p>The published Permit to Work template already has section definitions ready for generation and editing.</p>
        </div>

        <div className="portal-table-shell">
          <table className="portal-table w-full text-left text-sm">
            <colgroup>
              <col style={{ width: "12%" }} />
              <col style={{ width: "38%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "26%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Project Status</th>
              </tr>
            </thead>
            <tbody>
              {sections.length === 0 ? (
                <tr className="portal-table-empty-row">
                  <td colSpan={4}>No published sections were found for this template version.</td>
                </tr>
              ) : (
                sections.map((section) => {
                  const projectSection = projectSections.find((item) => item.section_id === section.id);
                  return (
                    <tr key={section.id}>
                      <td className="px-4 py-3 text-slate-600">{section.order_index}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{section.title}</td>
                      <td className="px-4 py-3 text-slate-600">{section.key}</td>
                      <td className="px-4 py-3 text-slate-600">{projectSection ? formatStatus(projectSection.status) : "Not yet seeded"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
