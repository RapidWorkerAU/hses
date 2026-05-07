import "server-only";

import { createStructuredOpenAiResponse } from "@/lib/ai/openai";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { questionnaireSuggestionRegistry } from "./registry";
import type {
  PermitReferenceSuggestionContext,
  QuestionnaireSuggestionItem,
  QuestionnaireSuggestionSet,
} from "./types";

type ProjectRow = {
  id: string;
  title: string;
  owner_user_id: string;
  document_type_id: string;
  document_type_version_id: string;
};

type DocumentTypeRow = {
  id: string;
  slug: string;
  title: string;
};

type QuestionGroupRow = {
  id: string;
  key: string;
  document_questions:
    | Array<{
        id: string;
        key: string;
        question_type: string;
      }>
    | null;
};

type AnswerRow = {
  question_id: string;
  answer: unknown;
};

type GenerateQuestionnaireSuggestionsArgs = {
  documentId: string;
  questionKey: string;
  userId: string;
};

const isLocationAnswer = (
  value: unknown,
): value is { country?: string; region?: string; city?: string } =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const ensureProjectAccess = async (
  documentId: string,
  userId: string,
  supabase: ReturnType<typeof createServiceRoleClient>,
) => {
  const { data: project, error: projectError } = await supabase
    .schema("docbuilder")
    .from("document_projects")
    .select("id,title,owner_user_id,document_type_id,document_type_version_id")
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

const loadQuestionnaireContext = async (
  documentId: string,
  documentTypeVersionId: string,
  documentTypeId: string,
  questionKey: string,
  supabase: ReturnType<typeof createServiceRoleClient>,
) => {
  const [{ data: documentType, error: typeError }, { data: groups, error: groupsError }, { data: answers, error: answersError }] =
    await Promise.all([
      supabase
        .schema("docbuilder")
        .from("document_types")
        .select("id,slug,title")
        .eq("id", documentTypeId)
        .maybeSingle<DocumentTypeRow>(),
      supabase
        .schema("docbuilder")
        .from("document_question_groups")
        .select("id,key,document_questions(id,key,question_type)")
        .eq("document_type_version_id", documentTypeVersionId),
      supabase
        .schema("docbuilder")
        .from("document_answers")
        .select("question_id,answer")
        .eq("document_project_id", documentId),
    ]);

  if (typeError || groupsError || answersError) {
    throw new Error(typeError?.message || groupsError?.message || answersError?.message || "Unable to load questionnaire context.");
  }

  if (!documentType) {
    throw new Error("Document type not found.");
  }

  const flatQuestions = ((groups ?? []) as QuestionGroupRow[]).flatMap((group) => group.document_questions ?? []);
  const targetQuestion = flatQuestions.find((question) => question.key === questionKey);

  if (!targetQuestion) {
    throw new Error("Question not found for this document template.");
  }

  const answerByQuestionId = new Map<string, unknown>();
  ((answers ?? []) as AnswerRow[]).forEach((row) => {
    answerByQuestionId.set(row.question_id, row.answer);
  });

  const answerByQuestionKey = new Map<string, unknown>();
  flatQuestions.forEach((question) => {
    answerByQuestionKey.set(question.key, answerByQuestionId.get(question.id));
  });

  return { documentType, targetQuestion, answerByQuestionKey };
};

const buildPermitA6Context = ({
  projectTitle,
  documentTypeTitle,
  answerByQuestionKey,
}: {
  projectTitle: string;
  documentTypeTitle: string;
  answerByQuestionKey: Map<string, unknown>;
}): PermitReferenceSuggestionContext => {
  const a3 = answerByQuestionKey.get("A3");
  const a4 = answerByQuestionKey.get("A4");
  const a5 = answerByQuestionKey.get("A5");

  return {
    project_title: projectTitle,
    document_type_title: documentTypeTitle,
    project_types: isStringArray(a3) ? a3 : [],
    country: isLocationAnswer(a4) && typeof a4.country === "string" ? a4.country : "",
    region: isLocationAnswer(a4) && typeof a4.region === "string" ? a4.region : "",
    city: isLocationAnswer(a4) && typeof a4.city === "string" ? a4.city : "",
    regulator_name: typeof a5 === "string" ? a5 : "",
  };
};

const normalizeSuggestions = (payload: QuestionnaireSuggestionSet): QuestionnaireSuggestionSet => ({
  summary: payload.summary,
  suggestions: (payload.suggestions ?? []).filter(
    (item): item is QuestionnaireSuggestionItem =>
      Boolean(
        item &&
          typeof item.title === "string" &&
          typeof item.source_type === "string" &&
          typeof item.framework_name === "string" &&
          typeof item.reference_number === "string" &&
          typeof item.jurisdiction_label === "string" &&
          typeof item.confidence === "string",
      ),
  ),
});

export async function generateQuestionnaireSuggestions({
  documentId,
  questionKey,
  userId,
}: GenerateQuestionnaireSuggestionsArgs) {
  const supabase = createServiceRoleClient();
  const project = await ensureProjectAccess(documentId, userId, supabase);
  const { documentType, targetQuestion, answerByQuestionKey } = await loadQuestionnaireContext(
    documentId,
    project.document_type_version_id,
    project.document_type_id,
    questionKey,
    supabase,
  );

  const task = questionnaireSuggestionRegistry[`${documentType.slug}:${questionKey}`];

  if (!task) {
    throw new Error(`No AI suggestion task is configured for ${documentType.slug} / ${questionKey}.`);
  }

  const taskContext = buildPermitA6Context({
    projectTitle: project.title,
    documentTypeTitle: documentType.title,
    answerByQuestionKey,
  });

  const aiResult = await createStructuredOpenAiResponse<QuestionnaireSuggestionSet>({
    model: task.model,
    systemPrompt: task.buildSystemPrompt(taskContext),
    userPrompt: task.buildUserPrompt(taskContext),
    schema: task.responseSchema,
  });

  const normalized = normalizeSuggestions(aiResult.data);

  const { data: savedRow, error: saveError } = await supabase
    .schema("docbuilder")
    .from("document_ai_suggestions")
    .insert({
      document_project_id: documentId,
      question_id: targetQuestion.id,
      task_key: task.taskKey,
      prompt_version: task.promptVersion,
      model: aiResult.model,
      input_snapshot: taskContext,
      output_payload: normalized,
      created_by_user_id: userId,
    })
    .select("id,created_at")
    .single();

  if (saveError) {
    throw new Error(saveError.message || "Unable to persist AI suggestions.");
  }

  return {
    suggestionSet: normalized,
    metadata: {
      id: savedRow.id as string,
      created_at: savedRow.created_at as string,
      prompt_version: task.promptVersion,
      model: aiResult.model,
      question_key: questionKey,
      task_key: task.taskKey,
    },
  };
}
