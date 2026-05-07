import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/server";

type ProjectRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  document_type_version_id: string;
  created_at: string;
  updated_at: string;
  document_types:
    | {
        title: string | null;
        slug: string | null;
      }
    | Array<{
        title: string | null;
        slug: string | null;
      }>
    | null;
  document_style_profiles:
    | {
        title: string | null;
        theme_config: Record<string, unknown> | null;
      }
    | Array<{
        title: string | null;
        theme_config: Record<string, unknown> | null;
      }>
    | null;
};

type SectionRow = {
  id: string;
  key: string;
  title: string;
  order_index: number;
  objective: string | null;
};

type ProjectSectionRow = {
  section_id: string;
  generated_content: string | null;
  edited_content: string | null;
  final_content: string | null;
  status: string;
  updated_at: string;
};

export type ExportSection = {
  id: string;
  key: string;
  title: string;
  orderIndex: number;
  objective: string | null;
  content: string;
  status: string;
  updatedAt: string | null;
};

export type DocumentExportPayload = {
  projectId: string;
  projectTitle: string;
  projectDescription: string | null;
  projectStatus: string;
  documentTypeTitle: string;
  documentTypeSlug: string;
  styleProfileTitle: string;
  themeConfig: Record<string, unknown>;
  sections: ExportSection[];
  createdAt: string;
  updatedAt: string;
};

const resolveNestedSingle = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

export async function loadDocumentExportPayload(documentId: string): Promise<DocumentExportPayload> {
  const supabase = createServiceRoleClient();

  const { data: projectData, error: projectError } = await supabase
    .schema("docbuilder")
    .from("document_projects")
    .select(
      "id,title,description,status,document_type_version_id,created_at,updated_at,document_types(title,slug),document_style_profiles(title,theme_config)",
    )
    .eq("id", documentId)
    .maybeSingle();

  if (projectError) {
    throw new Error(projectError.message || "Unable to load the document project for export.");
  }

  const project = projectData as ProjectRow | null;
  if (!project) {
    throw new Error("Document project not found.");
  }

  const [{ data: sectionsData, error: sectionsError }, { data: projectSectionsData, error: projectSectionsError }] = await Promise.all([
    supabase
    .schema("docbuilder")
    .from("document_sections")
    .select("id,key,title,order_index,objective")
    .eq("document_type_version_id", project.document_type_version_id)
    .order("order_index", { ascending: true }),
    supabase
      .schema("docbuilder")
      .from("document_project_sections")
      .select("section_id,generated_content,edited_content,final_content,status,updated_at")
      .eq("document_project_id", documentId),
  ]);

  if (sectionsError || projectSectionsError) {
    throw new Error(
      sectionsError?.message ||
        projectSectionsError?.message ||
        "Unable to load document sections for export.",
    );
  }

  const documentType = resolveNestedSingle(project.document_types);
  const styleProfile = resolveNestedSingle(project.document_style_profiles);

  const projectSections = (projectSectionsData ?? []) as ProjectSectionRow[];

  const sections = ((sectionsData ?? []) as SectionRow[]).map((section) => {
    const projectSection = projectSections.find((item) => item.section_id === section.id);
    const content =
      projectSection?.final_content ??
      projectSection?.edited_content ??
      projectSection?.generated_content ??
      "";

    return {
      id: section.id,
      key: section.key,
      title: section.title,
      orderIndex: section.order_index,
      objective: section.objective,
      content,
      status: projectSection?.status ?? "pending",
      updatedAt: projectSection?.updated_at ?? null,
    } satisfies ExportSection;
  });

  return {
    projectId: project.id,
    projectTitle: project.title,
    projectDescription: project.description,
    projectStatus: project.status,
    documentTypeTitle: documentType?.title ?? "Document",
    documentTypeSlug: documentType?.slug ?? "document",
    styleProfileTitle: styleProfile?.title ?? "Default PDF Style",
    themeConfig: styleProfile?.theme_config ?? {},
    sections,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}
