import { getSupabaseConfig } from "../../portal/_utils";

type ResponsePayload = {
  diagnostic_id?: string;
  code_id?: string;
  question_id?: string;
  rating?: number | null;
  text_answer?: string | null;
};

export async function POST(request: Request) {
  let payload: ResponsePayload = {};
  try {
    payload = (await request.json()) as ResponsePayload;
  } catch {
    return new Response("Invalid request body.", { status: 400 });
  }

  const { diagnostic_id, code_id, question_id } = payload;
  if (!diagnostic_id || !code_id || !question_id) {
    return new Response("Missing required response fields.", { status: 400 });
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase configuration.", { status: 500 });
  }

  const responseBody = {
    diagnostic_id,
    code_id,
    question_id,
    rating: payload.rating ?? null,
    text_answer: payload.text_answer ?? null,
  };

  const upsertUrl = new URL(`${supabaseUrl}/rest/v1/responses`);
  upsertUrl.searchParams.set("on_conflict", "code_id,question_id");

  let response = await fetch(upsertUrl.toString(), {
    method: "POST",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(responseBody),
  });

  if (!response.ok) {
    const cloned = response.clone();
    let errorText = await response.text();
    let normalizedError = errorText.toLowerCase();
    if (!normalizedError.trim()) {
      try {
        const parsed = await cloned.json();
        const message = String(parsed?.message ?? parsed?.error ?? "");
        const code = String(parsed?.code ?? "");
        errorText = message || JSON.stringify(parsed);
        normalizedError = `${message} ${code}`.toLowerCase();
      } catch {
        // Ignore JSON parse issues.
      }
    }
    if (
      normalizedError.includes("no unique constraint") ||
      normalizedError.includes("on conflict") ||
      normalizedError.includes("exclusion constraint") ||
      normalizedError.includes("42p10")
    ) {
      response = await fetch(`${supabaseUrl}/rest/v1/responses`, {
        method: "POST",
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(responseBody),
      });
    } else {
      return new Response(errorText || "Unable to save response.", { status: 500 });
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(errorText || "Unable to save response.", { status: 500 });
  }

  const saved = await response.json();
  return new Response(JSON.stringify({ response: saved }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
