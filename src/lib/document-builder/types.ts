export type DocumentTypeStatus = "draft" | "active" | "archived" | "retired";
export type DocumentTemplateVersionStatus = "draft" | "published" | "archived";
export type DocumentProjectStatus =
  | "draft"
  | "questionnaire"
  | "generating"
  | "editing"
  | "review"
  | "ready"
  | "exported"
  | "archived";
export type DocumentSectionStatus = "pending" | "generated" | "edited" | "approved";
export type DocumentGenerationRunType = "full" | "section" | "review" | "export";
export type DocumentGenerationRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type DocumentCollaboratorRole = "viewer" | "editor" | "admin";

export type DocumentTypeRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  default_language_code: string;
  status: DocumentTypeStatus;
  active_version_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentTypeVersionRecord = {
  id: string;
  document_type_id: string;
  version_no: number;
  status: DocumentTemplateVersionStatus;
  notes: string | null;
  requirements_mode: "objective" | "jurisdictional" | "hybrid";
  published_at: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentProjectRecord = {
  id: string;
  document_type_id: string;
  document_type_version_id: string;
  style_profile_id: string | null;
  owner_user_id: string;
  organisation_id: string | null;
  project_id: string | null;
  title: string;
  description: string | null;
  status: DocumentProjectStatus;
  country_code: string | null;
  jurisdiction_id: string | null;
  language_code: string;
  context: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DocumentSectionDefinition = {
  id: string;
  document_type_version_id: string;
  key: string;
  title: string;
  order_index: number;
  instructions: string | null;
  objective: string | null;
  default_content: string | null;
  minimum_requirements: string | null;
  generation_mode: "rewrite" | "augment" | "manual";
  is_required: boolean;
  allow_user_edit: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DocumentQuestionDefinition = {
  id: string;
  group_id: string;
  key: string;
  label: string;
  help_text: string | null;
  question_type:
    | "short_text"
    | "long_text"
    | "single_select"
    | "multi_select"
    | "boolean"
    | "date"
    | "number"
    | "country"
    | "jurisdiction"
    | "standard"
    | "person"
    | "role";
  placeholder: string | null;
  is_required: boolean;
  order_index: number;
  options: Record<string, unknown> | null;
  validation: Record<string, unknown>;
  visibility_rule: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DocumentProjectSectionRecord = {
  id: string;
  document_project_id: string;
  section_id: string;
  generated_content: string | null;
  edited_content: string | null;
  final_content: string | null;
  status: DocumentSectionStatus;
  last_generated_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
