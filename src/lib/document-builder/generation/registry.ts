import type { DocumentGenerationDefinition, GenerationOutputShape } from "./types";

const sectionGenerationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    content: { type: "string" },
    assumptions: {
      type: "array",
      items: { type: "string" },
    },
    follow_up_items: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["content", "assumptions", "follow_up_items"],
} satisfies Record<string, unknown>;

const renderMappedAnswers = (mappedAnswers: DocumentGenerationDefinition["sectionGeneration"] extends never ? never : Array<{
  question_key: string;
  question_label: string;
  influence_type: string;
  weight: number;
  answer: unknown;
  ai_suggestions: unknown | null;
}>) =>
  mappedAnswers
    .map((item) => {
      const answerText =
        typeof item.answer === "string"
          ? item.answer
          : JSON.stringify(item.answer ?? null);
      const suggestionText =
        item.ai_suggestions === null ? "None" : JSON.stringify(item.ai_suggestions);

      return [
        `Question ${item.question_key}: ${item.question_label}`,
        `Influence: ${item.influence_type} (${item.weight})`,
        `Answer: ${answerText}`,
        `AI suggestions: ${suggestionText}`,
      ].join("\n");
    })
    .join("\n\n");

export const permitToWorkProcedureGenerationDefinition: DocumentGenerationDefinition = {
  slug: "permit-to-work-procedure",
  sectionGeneration: {
    promptVersion: "permit_section_generation_v1",
    outputSchema: {
      name: "permit_section_generation",
      description: "Structured output for a single generated section of a permit-to-work procedure.",
      schema: sectionGenerationSchema,
      strict: true,
    },
    buildSystemPrompt: (context) => `
You are generating one section of a professional permit-to-work procedure.

Requirements:
- Produce credible, formal procedural prose.
- Follow the section objective and minimum requirements strictly.
- Use the mapped questionnaire answers as the primary source of project-specific facts.
- If facts are missing, write cautiously and surface them in follow_up_items rather than inventing details.
- Preserve a compliance-oriented tone.
- Do not include markdown headings beyond the section content itself.
- Do not mention that an AI wrote the content.
- assumptions must list any inferred points that should later be checked.
- follow_up_items must list unresolved project-specific details that still need user confirmation.
`.trim(),
    buildUserPrompt: (context) => `
Generate the section content for this document project.

Document type: ${context.document_type_title}
Project title: ${context.project_title}
Project description: ${context.project_description || "Not provided"}

Section:
- Key: ${context.section.key}
- Title: ${context.section.title}
- Objective: ${context.section.objective || "Not provided"}
- Instructions: ${context.section.instructions || "Not provided"}
- Minimum requirements: ${context.section.minimum_requirements || "Not provided"}
- Base content/template: ${context.section.default_content || "Not provided"}
- Generation mode: ${context.section.generation_mode}

Mapped questionnaire context:
${renderMappedAnswers(context.mapped_answers) || "No mapped answers available."}

Reference sources:
${context.reference_sources.length > 0 ? context.reference_sources.map((source) => `- [${source.source_type}] ${source.title}: ${source.description || "No description"}`).join("\n") : "No uploaded reference sources available."}
`.trim(),
  },
  sectionReview: {
    promptVersion: "permit_section_review_v1",
  },
  assembly: {
    promptVersion: "permit_document_assembly_v1",
  },
};

export const documentGenerationRegistry: Record<string, DocumentGenerationDefinition> = {
  [permitToWorkProcedureGenerationDefinition.slug]: permitToWorkProcedureGenerationDefinition,
};
