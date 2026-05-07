import "server-only";

import { createStructuredOpenAiResponse } from "@/lib/ai/openai";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { documentGenerationRegistry } from "./registry";
import type {
  DocumentGenerationDefinition,
  GenerationOutputShape,
  MappedAnswerContext,
  SectionGenerationContext,
} from "./types";

type ProjectRow = {
  id: string;
  title: string;
  description: string | null;
  owner_user_id: string;
  document_type_id: string;
  document_type_version_id: string;
};

type DocumentTypeRow = {
  id: string;
  slug: string;
  title: string;
};

type SectionRow = {
  id: string;
  key: string;
  title: string;
  objective: string | null;
  instructions: string | null;
  default_content: string | null;
  minimum_requirements: string | null;
  generation_mode: string;
  order_index: number;
};

type ReferenceSourceRow = {
  source_type: string;
  title: string;
  description: string | null;
};

type MappingRow = {
  influence_type: string;
  weight: number;
  document_questions:
    | {
        id: string;
        key: string;
        label: string;
      }
    | Array<{
        id: string;
        key: string;
        label: string;
      }>
    | null;
};

type AnswerRow = {
  question_id: string;
  answer: unknown;
};

type SuggestionRow = {
  question_id: string | null;
  output_payload: unknown;
  created_at: string;
};

type RunRequest = {
  documentId: string;
  userId: string;
  sectionId?: string | null;
};

const ensureProjectAccess = async (
  documentId: string,
  userId: string,
  supabase: ReturnType<typeof createServiceRoleClient>,
) => {
  const { data: project, error: projectError } = await supabase
    .schema("docbuilder")
    .from("document_projects")
    .select("id,title,description,owner_user_id,document_type_id,document_type_version_id")
    .eq("id", documentId)
    .maybeSingle<ProjectRow>();

  if (projectError) {
    throw new Error(projectError.message || "Unable to load the document project.");
  }

  if (!project) {
    throw new Error("Document project not found.");
  }

  if (project.owner_user_id === userId) {
    return project;
  }

  const { data: collaborator, error: collaboratorError } = await supabase
    .schema("docbuilder")
    .from("document_collaborators")
    .select("user_id")
    .eq("document_project_id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (collaboratorError) {
    throw new Error(collaboratorError.message || "Unable to verify document access.");
  }

  if (!collaborator) {
    throw new Error("You do not have access to this document project.");
  }

  return project;
};

const ensureProjectSections = async ({
  documentId,
  documentTypeVersionId,
  supabase,
}: {
  documentId: string;
  documentTypeVersionId: string;
  supabase: ReturnType<typeof createServiceRoleClient>;
}) => {
  const { data: templateSections, error: templateError } = await supabase
    .schema("docbuilder")
    .from("document_sections")
    .select("id")
    .eq("document_type_version_id", documentTypeVersionId);

  if (templateError) {
    throw new Error(templateError.message || "Unable to load template sections.");
  }

  const rows = (templateSections ?? []).map((section) => ({
    document_project_id: documentId,
    section_id: section.id,
  }));

  if (rows.length === 0) return;

  const { error: seedError } = await supabase
    .schema("docbuilder")
    .from("document_project_sections")
    .upsert(rows, { onConflict: "document_project_id,section_id", ignoreDuplicates: true });

  if (seedError) {
    throw new Error(seedError.message || "Unable to seed project sections.");
  }
};

const loadGenerationDefinition = async ({
  documentTypeId,
  supabase,
}: {
  documentTypeId: string;
  supabase: ReturnType<typeof createServiceRoleClient>;
}) => {
  const { data: documentType, error: typeError } = await supabase
    .schema("docbuilder")
    .from("document_types")
    .select("id,slug,title")
    .eq("id", documentTypeId)
    .maybeSingle<DocumentTypeRow>();

  if (typeError) {
    throw new Error(typeError.message || "Unable to load the document type.");
  }

  if (!documentType) {
    throw new Error("Document type not found.");
  }

  const definition = documentGenerationRegistry[documentType.slug];
  if (!definition) {
    throw new Error(`No document generation definition is configured for ${documentType.slug}.`);
  }

  return { documentType, definition };
};

const loadSectionsForRun = async ({
  documentTypeVersionId,
  sectionId,
  supabase,
}: {
  documentTypeVersionId: string;
  sectionId?: string | null;
  supabase: ReturnType<typeof createServiceRoleClient>;
}) => {
  let query = supabase
    .schema("docbuilder")
    .from("document_sections")
    .select("id,key,title,objective,instructions,default_content,minimum_requirements,generation_mode,order_index")
    .eq("document_type_version_id", documentTypeVersionId)
    .order("order_index", { ascending: true });

  if (sectionId) {
    query = query.eq("id", sectionId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Unable to load document sections.");
  }

  return (data ?? []) as SectionRow[];
};

const loadReferenceSources = async ({
  documentTypeVersionId,
  supabase,
}: {
  documentTypeVersionId: string;
  supabase: ReturnType<typeof createServiceRoleClient>;
}) => {
  const { data, error } = await supabase
    .schema("docbuilder")
    .from("document_reference_sources")
    .select("source_type,title,description")
    .eq("document_type_version_id", documentTypeVersionId);

  if (error) {
    throw new Error(error.message || "Unable to load reference sources.");
  }

  return (data ?? []) as ReferenceSourceRow[];
};

const loadAnswerContext = async ({
  documentId,
  sectionId,
  supabase,
}: {
  documentId: string;
  sectionId: string;
  supabase: ReturnType<typeof createServiceRoleClient>;
}) => {
  const [{ data: mappings, error: mappingsError }, { data: answers, error: answersError }, { data: suggestions, error: suggestionsError }] =
    await Promise.all([
      supabase
        .schema("docbuilder")
        .from("document_question_section_map")
        .select("influence_type,weight,document_questions(id,key,label)")
        .eq("section_id", sectionId),
      supabase
        .schema("docbuilder")
        .from("document_answers")
        .select("question_id,answer")
        .eq("document_project_id", documentId),
      supabase
        .schema("docbuilder")
        .from("document_ai_suggestions")
        .select("question_id,output_payload,created_at")
        .eq("document_project_id", documentId)
        .order("created_at", { ascending: false }),
    ]);

  if (mappingsError || answersError || suggestionsError) {
    throw new Error(mappingsError?.message || answersError?.message || suggestionsError?.message || "Unable to load mapped answer context.");
  }

  const answerMap = new Map<string, unknown>();
  ((answers ?? []) as AnswerRow[]).forEach((row) => {
    answerMap.set(row.question_id, row.answer);
  });

  const latestSuggestionByQuestionId = new Map<string, unknown>();
  ((suggestions ?? []) as SuggestionRow[]).forEach((row) => {
    if (!row.question_id) return;
    if (!latestSuggestionByQuestionId.has(row.question_id)) {
      latestSuggestionByQuestionId.set(row.question_id, row.output_payload);
    }
  });

  return ((mappings ?? []) as MappingRow[])
    .map((mapping) => ({
      ...mapping,
      document_question: Array.isArray(mapping.document_questions)
        ? (mapping.document_questions[0] ?? null)
        : mapping.document_questions,
    }))
    .filter((mapping) => mapping.document_question?.id)
    .map((mapping) => ({
      question_key: mapping.document_question?.key ?? "",
      question_label: mapping.document_question?.label ?? "",
      influence_type: mapping.influence_type,
      weight: mapping.weight,
      answer: answerMap.get(mapping.document_question?.id ?? "") ?? null,
      ai_suggestions: latestSuggestionByQuestionId.get(mapping.document_question?.id ?? "") ?? null,
    })) satisfies MappedAnswerContext[];
};

const buildSectionGenerationContext = async ({
  project,
  documentType,
  section,
  referenceSources,
  supabase,
}: {
  project: ProjectRow;
  documentType: DocumentTypeRow;
  section: SectionRow;
  referenceSources: ReferenceSourceRow[];
  supabase: ReturnType<typeof createServiceRoleClient>;
}): Promise<SectionGenerationContext> => {
  const mappedAnswers = await loadAnswerContext({
    documentId: project.id,
    sectionId: section.id,
    supabase,
  });

  return {
    document_project_id: project.id,
    project_title: project.title,
    project_description: project.description ?? "",
    document_type_slug: documentType.slug,
    document_type_title: documentType.title,
    section,
    mapped_answers: mappedAnswers,
    reference_sources: referenceSources,
  };
};

const saveGeneratedSection = async ({
  documentId,
  section,
  output,
  runId,
  definition,
  promptSnapshot,
  responseSnapshot,
  supabase,
}: {
  documentId: string;
  section: SectionRow;
  output: GenerationOutputShape;
  runId: string;
  definition: DocumentGenerationDefinition;
  promptSnapshot: string;
  responseSnapshot: string;
  supabase: ReturnType<typeof createServiceRoleClient>;
}) => {
  const { data: projectSection, error: projectSectionError } = await supabase
    .schema("docbuilder")
    .from("document_project_sections")
    .upsert(
      {
        document_project_id: documentId,
        section_id: section.id,
        generated_content: output.content,
        status: "generated",
        last_generated_at: new Date().toISOString(),
        metadata: {
          generation_prompt_version: definition.sectionGeneration.promptVersion,
          assumptions: output.assumptions,
          follow_up_items: output.follow_up_items,
        },
      },
      { onConflict: "document_project_id,section_id" },
    )
    .select("id")
    .single();

  if (projectSectionError) {
    throw new Error(projectSectionError.message || `Unable to save generated content for section ${section.key}.`);
  }

  const { error: runSectionError } = await supabase
    .schema("docbuilder")
    .from("document_generation_run_sections")
    .insert({
      generation_run_id: runId,
      project_section_id: projectSection.id,
      status: "completed",
      prompt_snapshot: promptSnapshot,
      response_snapshot: responseSnapshot,
    });

  if (runSectionError) {
    throw new Error(runSectionError.message || `Unable to save generation trace for section ${section.key}.`);
  }
};

export async function runDocumentGeneration({ documentId, userId, sectionId }: RunRequest) {
  const supabase = createServiceRoleClient();
  const project = await ensureProjectAccess(documentId, userId, supabase);
  const { documentType, definition } = await loadGenerationDefinition({
    documentTypeId: project.document_type_id,
    supabase,
  });

  await ensureProjectSections({
    documentId,
    documentTypeVersionId: project.document_type_version_id,
    supabase,
  });

  const sections = await loadSectionsForRun({
    documentTypeVersionId: project.document_type_version_id,
    sectionId,
    supabase,
  });

  if (sections.length === 0) {
    throw new Error("No sections are available to generate.");
  }

  const referenceSources = await loadReferenceSources({
    documentTypeVersionId: project.document_type_version_id,
    supabase,
  });

  const { data: runRow, error: runError } = await supabase
    .schema("docbuilder")
    .from("document_generation_runs")
    .insert({
      document_project_id: documentId,
      run_type: sectionId ? "section" : "full",
      status: "running",
      model: definition.sectionGeneration.model ?? process.env.OPENAI_MODEL_DOCUMENT_BUILDER ?? "gpt-5.2",
      prompt_version: definition.sectionGeneration.promptVersion,
      requested_by_user_id: userId,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (runError) {
    throw new Error(runError.message || "Unable to create the generation run.");
  }

  try {
    const generatedSections: Array<{ section_id: string; key: string; title: string }> = [];

    for (const section of sections) {
      const context = await buildSectionGenerationContext({
        project,
        documentType,
        section,
        referenceSources,
        supabase,
      });

      const promptSnapshot = JSON.stringify({
        system: definition.sectionGeneration.buildSystemPrompt(context),
        user: definition.sectionGeneration.buildUserPrompt(context),
      });

      const aiResult = await createStructuredOpenAiResponse<GenerationOutputShape>({
        model: definition.sectionGeneration.model,
        systemPrompt: definition.sectionGeneration.buildSystemPrompt(context),
        userPrompt: definition.sectionGeneration.buildUserPrompt(context),
        schema: definition.sectionGeneration.outputSchema,
      });

      await saveGeneratedSection({
        documentId,
        section,
        output: aiResult.data,
        runId: runRow.id as string,
        definition,
        promptSnapshot,
        responseSnapshot: aiResult.outputText,
        supabase,
      });

      generatedSections.push({
        section_id: section.id,
        key: section.key,
        title: section.title,
      });
    }

    const { error: completeError } = await supabase
      .schema("docbuilder")
      .from("document_generation_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", runRow.id);

    if (completeError) {
      throw new Error(completeError.message || "Unable to complete the generation run.");
    }

    return {
      run_id: runRow.id as string,
      prompt_version: definition.sectionGeneration.promptVersion,
      generated_sections: generatedSections,
    };
  } catch (error) {
    await supabase
      .schema("docbuilder")
      .from("document_generation_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_text: error instanceof Error ? error.message : "Generation failed.",
      })
      .eq("id", runRow.id);

    throw error;
  }
}
