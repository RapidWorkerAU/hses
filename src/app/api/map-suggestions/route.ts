export const dynamic = "force-dynamic";

import { getUserFromToken } from "@/app/api/portal/_utils";
import { createStructuredOpenAiResponse } from "@/lib/ai/openai";
import { createServiceRoleClient } from "@/lib/supabase/server";

type SuggestionPriority = "low" | "medium" | "high";
type SuggestionCategory =
  | "chronology"
  | "evidence"
  | "people"
  | "factors"
  | "controls"
  | "outcomes"
  | "response"
  | "recommendations"
  | "relationships"
  | "scope"
  | "quality"
  | "other";

type MapSuggestionItem = {
  title: string;
  question: string;
  rationale: string;
  priority: SuggestionPriority;
  category: SuggestionCategory;
};

type MapSuggestionResponse = {
  overview: string;
  suggestions: MapSuggestionItem[];
};

type RequestBody = {
  mapId?: string;
  userPrompt?: unknown;
  mapSnapshot?: unknown;
};

type SystemMapAccessRow = {
  id: string;
  title: string;
  owner_id: string;
  map_category: string | null;
};

type MapMemberRow = {
  role: string;
};

const prioritySet = new Set<SuggestionPriority>(["low", "medium", "high"]);
const categorySet = new Set<SuggestionCategory>([
  "chronology",
  "evidence",
  "people",
  "factors",
  "controls",
  "outcomes",
  "response",
  "recommendations",
  "relationships",
  "scope",
  "quality",
  "other",
]);

const responseSchema = {
  name: "map_suggestion_response",
  description: "A map-grounded answer to a user's HSES question with key actions and observations.",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["overview", "suggestions"],
    properties: {
      overview: {
        type: "string",
        description: "One concise paragraph directly answering the user's question or statement.",
      },
      suggestions: {
        type: "array",
        minItems: 0,
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "question", "rationale", "priority", "category"],
          properties: {
            title: {
              type: "string",
              description: "Short title for the action, suggestion, or observation.",
            },
            question: {
              type: "string",
              description: "Direct action or observation text that responds to the user's request.",
            },
            rationale: {
              type: "string",
              description: "Brief reason this action or observation follows from the map context.",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
            },
            category: {
              type: "string",
              enum: ["relationships", "scope", "other"],
            },
          },
        },
      },
    },
  },
  strict: true,
};

const trimString = (value: unknown, fallback: string, maxLength: number) => {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!text) return fallback;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}...` : text;
};

const normalizeSuggestions = (payload: MapSuggestionResponse): MapSuggestionResponse => ({
  overview: trimString(payload.overview, "Question answered.", 900),
  suggestions: (payload.suggestions ?? [])
    .filter((item): item is MapSuggestionItem => Boolean(item && typeof item === "object"))
    .slice(0, 12)
    .map((item) => ({
      title: trimString(item.title, "Map response", 120),
      question: trimString(item.question, "No action or observation was provided.", 260),
      rationale: trimString(item.rationale, "This response is based on the supplied map context.", 420),
      priority: prioritySet.has(item.priority) ? item.priority : "medium",
      category: categorySet.has(item.category) ? item.category : "other",
    })),
});

const buildSystemPrompt = () => `
You are an HSES Industry Partners assistant answering questions about management-system maps, process flows, bow ties, organisation charts, and document maps.
Answer only the user's question or statement using the supplied map snapshot.
Do not run a generic quality review unless the user explicitly asks for that.
Return concise key actions and observations that are grounded in the map context.
Use priority "high" for high-priority actions, "medium" for suggestions, and "low" for observations.
Use category "relationships" only when the item is about links or dependencies, "scope" only when it is about boundaries or coverage, otherwise use "other".
Do not invent facts. If the map does not contain enough information, say what cannot be determined and what should be checked next.
`.trim();

const buildUserPrompt = (userPrompt: string, mapSnapshot: unknown) => `
User question or statement:
${userPrompt}

Answer the request above with a concise overview and key items. Each item must be either a high-priority action, a suggestion, or an observation.

Snapshot JSON:
${JSON.stringify(mapSnapshot).slice(0, 60000)}
`.trim();

const ensureMapWriteAccess = async ({
  mapId,
  userId,
  supabase,
}: {
  mapId: string;
  userId: string;
  supabase: ReturnType<typeof createServiceRoleClient>;
}) => {
  const { data: map, error: mapError } = await supabase
    .schema("ms")
    .from("system_maps")
    .select("id,title,owner_id,map_category")
    .eq("id", mapId)
    .maybeSingle<SystemMapAccessRow>();

  if (mapError) throw new Error(mapError.message || "Unable to load map.");
  if (!map) throw new Error("Map not found.");
  if (map.owner_id === userId) return map;

  const { data: member, error: memberError } = await supabase
    .schema("ms")
    .from("map_members")
    .select("role")
    .eq("map_id", mapId)
    .eq("user_id", userId)
    .maybeSingle<MapMemberRow>();

  if (memberError) throw new Error(memberError.message || "Unable to verify map access.");
  if (member?.role === "partial_write" || member?.role === "full_write") return map;

  throw new Error("You need write access to run map suggestions.");
};

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return Response.json({ error: "Missing bearer token." }, { status: 401 });
  }

  let userId: string;
  try {
    const user = await getUserFromToken(token);
    userId = user.id;
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to validate session." },
      { status: 401 }
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const mapId = typeof body.mapId === "string" ? body.mapId.trim() : "";
  if (!mapId) {
    return Response.json({ error: "Missing map id." }, { status: 400 });
  }
  const userPrompt = typeof body.userPrompt === "string" ? body.userPrompt.replace(/\s+/g, " ").trim() : "";
  if (!userPrompt) {
    return Response.json({ error: "Ask a question or enter a statement first." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    await ensureMapWriteAccess({ mapId, userId, supabase });

    const aiResult = await createStructuredOpenAiResponse<MapSuggestionResponse>({
      model: process.env.OPENAI_MODEL_MAP_SUGGESTIONS ?? process.env.OPENAI_MODEL_DOCUMENT_BUILDER ?? "gpt-5.2",
      systemPrompt: buildSystemPrompt(),
      userPrompt: buildUserPrompt(userPrompt, body.mapSnapshot ?? {}),
      schema: responseSchema,
    });
    const normalized = normalizeSuggestions(aiResult.data);
    const generatedAt = new Date().toISOString();

    const { error: clearCurrentError } = await supabase
      .schema("ms")
      .from("map_suggestion_runs")
      .update({ is_current: false })
      .eq("map_id", mapId)
      .eq("is_current", true);

    if (clearCurrentError) {
      throw new Error(clearCurrentError.message || "Unable to update previous suggestion runs.");
    }

    const { data: runRow, error: runError } = await supabase
      .schema("ms")
      .from("map_suggestion_runs")
      .insert({
        map_id: mapId,
        overview: normalized.overview,
        map_snapshot: {
          user_prompt: userPrompt,
          snapshot: body.mapSnapshot ?? {},
        },
        raw_response: {
          user_prompt: userPrompt,
          model: aiResult.model,
          response_id: aiResult.responseId,
          output: normalized,
        },
        is_current: true,
        created_by_user_id: userId,
      })
      .select("id,created_at")
      .single();

    if (runError || !runRow?.id) {
      throw new Error(runError?.message || "Unable to save suggestion run.");
    }

    if (normalized.suggestions.length) {
      const { error: suggestionsError } = await supabase
        .schema("ms")
        .from("map_suggestions")
        .insert(
          normalized.suggestions.map((suggestion) => ({
            run_id: runRow.id,
            map_id: mapId,
            title: suggestion.title,
            question: suggestion.question,
            rationale: suggestion.rationale,
            priority: suggestion.priority,
            category: suggestion.category,
          }))
        );

      if (suggestionsError) {
        throw new Error(suggestionsError.message || "Unable to save map suggestions.");
      }
    }

    return Response.json({
      overview: normalized.overview,
      suggestions: normalized.suggestions.map((suggestion, index) => ({
        id: `${runRow.id}-${index}`,
        ...suggestion,
      })),
      generatedAt: typeof runRow.created_at === "string" ? runRow.created_at : generatedAt,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to answer the map question." },
      { status: 500 }
    );
  }
}
