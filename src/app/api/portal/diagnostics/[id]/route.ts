export const dynamic = "force-dynamic";

import { getAccountIdsForUser, getSupabaseConfig, getUserIdFromToken } from "../../_utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.id;
  const idFromPath = request.url.split("/").pop();
  const diagnosticId = rawId && rawId !== "undefined" ? rawId : idFromPath;

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return new Response("Missing bearer token.", { status: 401 });
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase configuration.", { status: 500 });
  }

  let accountIds: string[] = [];
  try {
    const userId = await getUserIdFromToken(token);
    accountIds = await getAccountIdsForUser(userId);
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Unable to validate session.",
      { status: 401 }
    );
  }

  if (accountIds.length === 0) {
    return new Response(JSON.stringify({ diagnostic: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const accountIdFilter = accountIds.map((id) => `"${id}"`).join(",");
  const diagnosticUrl = new URL(`${supabaseUrl}/rest/v1/diagnostics`);
  diagnosticUrl.searchParams.set("select", "id,account_id,name,status,purchased_at,owner_user_id,created_at");
  diagnosticUrl.searchParams.set("id", `eq.${diagnosticId}`);
  diagnosticUrl.searchParams.set("account_id", `in.(${accountIdFilter})`);
  const diagnosticResponse = await fetch(diagnosticUrl.toString(), {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  });

  if (!diagnosticResponse.ok) {
    const errorText = await diagnosticResponse.text();
    return new Response(
      JSON.stringify({
        error: errorText,
        diagnostic_id: diagnosticId,
        account_ids: accountIds,
        request_url: diagnosticUrl.toString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const diagnostics = (await diagnosticResponse.json()) as Array<{
    id: string;
    account_id: string;
    name: string;
    status: string;
    purchased_at: string | null;
    owner_user_id: string | null;
    created_at: string;
  }>;

  const diagnostic = diagnostics[0];
  if (!diagnostic) {
    return new Response(JSON.stringify({ diagnostic: null, codes: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const codesUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_codes`);
  codesUrl.searchParams.set(
    "select",
    "id,code,issued_to_name,issued_to_email,issued_at,redeemed_at,status"
  );
  codesUrl.searchParams.set("diagnostic_id", `eq.${diagnostic.id}`);
  const codesResponse = await fetch(codesUrl.toString(), {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  });

  if (!codesResponse.ok) {
    const errorText = await codesResponse.text();
    return new Response(errorText, { status: 500 });
  }

  const codes = (await codesResponse.json()) as Array<{
    id: string;
    code: string;
    issued_to_name: string | null;
    issued_to_email: string | null;
    issued_at: string | null;
    redeemed_at: string | null;
    status: string;
  }>;

  return new Response(JSON.stringify({ diagnostic, codes }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
