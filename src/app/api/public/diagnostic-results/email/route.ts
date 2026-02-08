import { getSupabaseConfig } from "../../../portal/_utils";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const codeId = url.searchParams.get("code_id")?.trim() ?? "";
  if (!codeId) {
    return new Response("Missing code id.", { status: 400 });
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase configuration.", { status: 500 });
  }

  const codeUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_codes`);
  codeUrl.searchParams.set("select", "issued_to_email");
  codeUrl.searchParams.set("id", `eq.${codeId}`);
  const response = await fetch(codeUrl.toString(), {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(errorText || "Unable to load email.", { status: 500 });
  }

  const rows = (await response.json()) as Array<{ issued_to_email: string | null }>;
  return new Response(JSON.stringify({ email: rows[0]?.issued_to_email ?? null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
