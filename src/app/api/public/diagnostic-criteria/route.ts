import { getSupabaseConfig } from "../../portal/_utils";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids")?.trim() ?? "";
  if (!ids) {
    return new Response("Missing criteria ids.", { status: 400 });
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase configuration.", { status: 500 });
  }

  const criteriaUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_criteria`);
  criteriaUrl.searchParams.set("select", "id,name");
  criteriaUrl.searchParams.set("id", `in.(${ids})`);

  const response = await fetch(criteriaUrl.toString(), {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(errorText || "Unable to load criteria.", { status: 500 });
  }

  const criteria = (await response.json()) as Array<{ id: string; name: string }>;
  return new Response(JSON.stringify({ criteria }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
