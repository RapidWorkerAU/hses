import type {
  PermitReferenceSuggestionContext,
  QuestionnaireSuggestionSet,
} from "./types";

type QuestionnaireSuggestionTaskDefinition<TContext, TResult> = {
  taskKey: string;
  documentTypeSlug: string;
  questionKey: string;
  promptVersion: string;
  model?: string;
  responseSchema: {
    name: string;
    description: string;
    schema: Record<string, unknown>;
    strict?: boolean;
  };
  buildSystemPrompt: (context: TContext) => string;
  buildUserPrompt: (context: TContext) => string;
};

const questionnaireSuggestionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          source_type: {
            type: "string",
            enum: [
              "legislation",
              "regulation",
              "code_of_practice",
              "standard",
              "internal_framework",
              "client_requirement",
              "other",
            ],
          },
          framework_name: { type: "string" },
          reference_number: { type: "string" },
          jurisdiction_label: { type: "string" },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
        },
        required: ["title", "source_type", "framework_name", "reference_number", "jurisdiction_label", "confidence"],
      },
    },
  },
  required: ["summary", "suggestions"],
} satisfies Record<string, unknown>;

export const permitProcedureA6SuggestionTask: QuestionnaireSuggestionTaskDefinition<
  PermitReferenceSuggestionContext,
  QuestionnaireSuggestionSet
> = {
  taskKey: "questionnaire_suggestions",
  documentTypeSlug: "permit-to-work-procedure",
  questionKey: "A6",
  promptVersion: "permit_a6_suggestions_v1",
  responseSchema: {
    name: "permit_a6_suggestions",
    description:
      "Suggested legal and reference sources for a project-specific permit-to-work procedure questionnaire.",
    schema: questionnaireSuggestionSchema,
    strict: true,
  },
  buildSystemPrompt: (context) => `
You are assisting with a controlled document-builder workflow for safety procedures.
Your job is to propose candidate reference sources for a project-specific permit-to-work procedure.

Rules:
- Return JSON only through the schema.
- Suggest 4 to 8 items.
- Only suggest current, in-force, presently applicable legal or standards instruments. This is mandatory.
- Prefer credible source categories that a project team should verify and adopt.
- Do not return superseded, repealed, or historical instruments.
- Do not fabricate highly specific law titles when confidence is low.
- If the jurisdiction is unclear, use category-level titles rather than invented document names.
- Keep each title concise and professional.
- Where a formal title is known, framework_name must contain the full current instrument name, not just the numbering series.
- framework_name should contain the formal instrument or framework family name.
- reference_number should contain the instrument number, year, code number, or other identifier when known. Otherwise return an empty string.
- Confidence should be high only when the suggestion is broadly reliable from the context.

Jurisdiction-specific rule for Western Australia:
- If the project is in Western Australia, do not return the Occupational Safety and Health Act 1984 or the Occupational Safety and Health Regulations 1996 because they were replaced from 31 March 2022.
- For Western Australia, prefer current instruments under the Work Health and Safety Act 2020 framework.

Project context:
- Document type: ${context.document_type_title}
- Project title: ${context.project_title}
- Country: ${context.country || "Not provided"}
- Region/state: ${context.region || "Not provided"}
- City/jurisdiction: ${context.city || "Not provided"}
- Regulator: ${context.regulator_name || "Not provided"}
- Project activity context: ${context.project_types.join(", ") || "Not provided"}
`.trim(),
  buildUserPrompt: (context) => `
Generate a shortlist of candidate legislation, regulations, codes of practice, standards, or related reference sources that should likely be reviewed for this permit-to-work procedure.

Use this context:
- Country: ${context.country || "Not provided"}
- Region/state: ${context.region || "Not provided"}
- City/jurisdiction: ${context.city || "Not provided"}
- Regulator: ${context.regulator_name || "Not provided"}
- Project context: ${context.project_types.join(", ") || "Not provided"}

If exact source titles are uncertain, produce safe generic labels such as "Primary occupational health and safety legislation applicable in [country]" instead of inventing precise legal citations.
Do not include explanatory rationale text in the title. Keep the title usable as a compact removable suggestion pill.
When you know both the identifier and the name, return both. Example pattern: "AS 2865:2009 Confined spaces" or "SL 2022/31 Work Health and Safety (General) Regulations 2022".
`.trim(),
};

export const questionnaireSuggestionRegistry = {
  [`${permitProcedureA6SuggestionTask.documentTypeSlug}:${permitProcedureA6SuggestionTask.questionKey}`]:
    permitProcedureA6SuggestionTask,
};
