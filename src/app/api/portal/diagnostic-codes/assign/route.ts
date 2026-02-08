export const dynamic = "force-dynamic";

import { getAccountIdsForUser, getSupabaseConfig, getUserIdFromToken } from "../../_utils";

type AssignPayload = {
  code_id: string;
  name: string;
  email?: string | null;
};

export async function PATCH(request: Request) {
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

  const payload = (await request.json().catch(() => null)) as AssignPayload | null;
  if (!payload?.code_id || !payload?.name) {
    return new Response("Missing code or name.", { status: 400 });
  }

  const accountIdFilter = accountIds.map((id) => `"${id}"`).join(",");
  const codeResponse = await fetch(
    `${supabaseUrl}/rest/v1/diagnostic_codes?select=id,diagnostic_id&id=eq.${payload.code_id}`,
    {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    }
  );

  if (!codeResponse.ok) {
    const errorText = await codeResponse.text();
    return new Response(errorText, { status: 500 });
  }

  const codeRows = (await codeResponse.json()) as Array<{ id: string; diagnostic_id: string }>;
  const codeRow = codeRows[0];
  if (!codeRow) {
    return new Response("Code not found.", { status: 404 });
  }

  const diagnosticResponse = await fetch(
    `${supabaseUrl}/rest/v1/diagnostics?select=id,account_id&id=eq.${codeRow.diagnostic_id}&account_id=in.(${accountIdFilter})`,
    {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    }
  );

  if (!diagnosticResponse.ok) {
    const errorText = await diagnosticResponse.text();
    return new Response(errorText, { status: 500 });
  }

  const diagnosticRows = (await diagnosticResponse.json()) as Array<{ id: string }>;
  if (diagnosticRows.length === 0) {
    return new Response("Not authorised for this code.", { status: 403 });
  }

  const updatePayload = {
    issued_to_name: payload.name,
    issued_to_email: payload.email ?? null,
    issued_at: new Date().toISOString(),
  };

  const updateResponse = await fetch(
    `${supabaseUrl}/rest/v1/diagnostic_codes?id=eq.${payload.code_id}`,
    {
      method: "PATCH",
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updatePayload),
    }
  );

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    return new Response(errorText, { status: 500 });
  }

  return new Response(await updateResponse.text(), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
