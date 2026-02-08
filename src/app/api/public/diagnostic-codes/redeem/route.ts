import { getSupabaseConfig } from "../../../portal/_utils";

type RedeemPayload = {
  code_id?: string;
};

export async function POST(request: Request) {
  let payload: RedeemPayload = {};
  try {
    payload = (await request.json()) as RedeemPayload;
  } catch {
    return new Response("Invalid request body.", { status: 400 });
  }

  const codeId = payload.code_id?.trim();
  if (!codeId) {
    return new Response("Missing code id.", { status: 400 });
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase configuration.", { status: 500 });
  }

  const redeemUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_codes`);
  redeemUrl.searchParams.set("id", `eq.${codeId}`);

  const response = await fetch(redeemUrl.toString(), {
    method: "PATCH",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      status: "redeemed",
      redeemed_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(errorText || "Unable to mark code as redeemed.", { status: 500 });
  }

  const updated = await response.json();
  return new Response(JSON.stringify({ code: updated }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
