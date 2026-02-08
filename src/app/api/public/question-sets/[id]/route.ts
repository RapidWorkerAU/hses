import { NextRequest } from "next/server";
import { getSupabaseConfig } from "../../../portal/_utils";

type QuestionRow = {
  id: string;
  question_set_id: string;
  domain: string | null;
  module: string | null;
  criteria: string | null;
  domain_id: string | null;
  module_id: string | null;
  criteria_id: string | null;
  prompt: string;
  type: string | null;
  required: boolean | null;
  order_index: number | null;
  created_at: string | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const questionSetId =
    id ?? new URL(request.url).pathname.split("/").filter(Boolean).slice(-1)[0];
  if (!questionSetId || questionSetId === "undefined") {
    return new Response("Missing question set id.", { status: 400 });
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase configuration.", { status: 500 });
  }

  const baseUrl = `${supabaseUrl}/rest/v1/questions`;
  const selects = [
    "id,question_set_id,domain,domain_id,module,criteria,module_id,criteria_id,prompt,type,required,order_index,created_at",
    "id,question_set_id,domain,domain_id,module_name,criteria_name,module_id,criteria_id,prompt,type,required,order_index,created_at",
    "id,question_set_id,domain,domain_id,module_id,criteria_id,prompt,type,required,order_index,created_at",
    "id,question_set_id,domain,domain_id,prompt,type,required,order_index,created_at",
  ];

  let questions: QuestionRow[] = [];
  let lastError = "";

  for (const select of selects) {
    const questionsUrl = new URL(baseUrl);
    questionsUrl.searchParams.set("select", select);
    questionsUrl.searchParams.set("question_set_id", `eq.${questionSetId}`);
    questionsUrl.searchParams.set("order", "order_index.asc");

    const response = await fetch(questionsUrl.toString(), {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    });

    if (!response.ok) {
      lastError = await response.text();
      continue;
    }

    const rows = (await response.json()) as Array<Record<string, unknown>>;
    questions = rows.map((row) => {
      const module =
        (row.module as string | null | undefined) ??
        (row.module_name as string | null | undefined) ??
        (row.module_id ? String(row.module_id) : null);
      const criteria =
        (row.criteria as string | null | undefined) ??
        (row.criteria_name as string | null | undefined) ??
        (row.criteria_id ? String(row.criteria_id) : null);
      return {
        id: String(row.id),
        question_set_id: String(row.question_set_id),
        domain: (row.domain as string | null) ?? null,
        module,
        criteria,
        domain_id: (row.domain_id as string | null) ?? null,
        module_id: row.module_id ? String(row.module_id) : null,
        criteria_id: row.criteria_id ? String(row.criteria_id) : null,
        prompt: String(row.prompt ?? ""),
        type: (row.type as string | null) ?? null,
        required: (row.required as boolean | null) ?? null,
        order_index: (row.order_index as number | null) ?? null,
        created_at: (row.created_at as string | null) ?? null,
      };
    });
    lastError = "";
    break;
  }

  if (lastError) {
    return new Response(lastError || "Unable to load questions.", { status: 500 });
  }

  return new Response(JSON.stringify({ question_set_id: questionSetId, questions }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
