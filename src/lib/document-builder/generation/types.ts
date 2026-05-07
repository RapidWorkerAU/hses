export type GenerationOutputShape = {
  content: string;
  assumptions: string[];
  follow_up_items: string[];
};

export type GenerationReviewShape = {
  decision: "approved" | "revise";
  summary: string;
  issues: string[];
};

export type GenerationAssemblyShape = {
  title: string;
  sections: Array<{
    section_key: string;
    heading: string;
    body: string;
  }>;
};

export type MappedAnswerContext = {
  question_key: string;
  question_label: string;
  influence_type: string;
  weight: number;
  answer: unknown;
  ai_suggestions: unknown | null;
};

export type SectionGenerationContext = {
  document_project_id: string;
  project_title: string;
  project_description: string;
  document_type_slug: string;
  document_type_title: string;
  section: {
    id: string;
    key: string;
    title: string;
    objective: string | null;
    instructions: string | null;
    default_content: string | null;
    minimum_requirements: string | null;
    generation_mode: string;
  };
  mapped_answers: MappedAnswerContext[];
  reference_sources: Array<{
    source_type: string;
    title: string;
    description: string | null;
  }>;
};

export type DocumentGenerationDefinition = {
  slug: string;
  sectionGeneration: {
    promptVersion: string;
    model?: string;
    outputSchema: {
      name: string;
      description: string;
      schema: Record<string, unknown>;
      strict?: boolean;
    };
    buildSystemPrompt: (context: SectionGenerationContext) => string;
    buildUserPrompt: (context: SectionGenerationContext) => string;
  };
  sectionReview: {
    promptVersion: string;
    model?: string;
  };
  assembly: {
    promptVersion: string;
    model?: string;
  };
};
