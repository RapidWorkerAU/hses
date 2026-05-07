export type DocumentBuilderSuggestionConfidence = "high" | "medium" | "low";

export type DocumentBuilderSourceType =
  | "legislation"
  | "regulation"
  | "code_of_practice"
  | "standard"
  | "internal_framework"
  | "client_requirement"
  | "other";

export type QuestionnaireSuggestionItem = {
  title: string;
  source_type: DocumentBuilderSourceType;
  framework_name: string;
  reference_number: string;
  jurisdiction_label: string;
  confidence: DocumentBuilderSuggestionConfidence;
};

export type QuestionnaireSuggestionSet = {
  summary: string;
  suggestions: QuestionnaireSuggestionItem[];
};

export type PermitReferenceSuggestionContext = {
  project_title: string;
  document_type_title: string;
  project_types: string[];
  country: string;
  region: string;
  city: string;
  regulator_name: string;
};
