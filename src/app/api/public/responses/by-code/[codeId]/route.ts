import { NextRequest } from "next/server";
import { getSupabaseConfig } from "../../../../portal/_utils";

type ResponseRow = {
  question_id: string;
  rating: number | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codeId: string }> }
) {
  const { codeId: paramCodeId } = await params;
  const urlId = request.url.split("/").pop() ?? "";
  const codeId = (paramCodeId ?? urlId).trim();
  if (!codeId || codeId === "undefined" || codeId === "null") {
    return new Response("Missing code id.", { status: 400 });
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase configuration.", { status: 500 });
  }

  const responsesUrl = new URL(`${supabaseUrl}/rest/v1/responses`);
  responsesUrl.searchParams.set("select", "question_id,rating");
  responsesUrl.searchParams.set("code_id", `eq.${codeId}`);

  const response = await fetch(responsesUrl.toString(), {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(errorText || "Unable to load responses.", { status: 500 });
  }

  const responses = (await response.json()) as ResponseRow[];
  return new Response(JSON.stringify({ responses }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
