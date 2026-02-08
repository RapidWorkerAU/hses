export const dynamic = "force-dynamic";

import { getAccountIdsForUser, getSupabaseConfig, getUserIdFromToken } from "../_utils";

type DiagnosticsResponse = {
  id: string;
  account_id: string;
  name: string;
  status: string;
  purchased_at: string | null;
  owner_user_id: string | null;
  created_at: string;
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

export async function GET(request: Request) {
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
    return new Response(JSON.stringify({ diagnostics: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const accountIdFilter = accountIds.map((id) => `"${id}"`).join(",");
  const diagnosticsUrl = new URL(`${supabaseUrl}/rest/v1/diagnostics`);
  diagnosticsUrl.searchParams.set("select", "id,account_id,name,status,purchased_at,owner_user_id,created_at");
  diagnosticsUrl.searchParams.set("account_id", `in.(${accountIdFilter})`);
  const diagnosticsResponse = await fetch(diagnosticsUrl.toString(), {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  });

  if (!diagnosticsResponse.ok) {
    const errorText = await diagnosticsResponse.text();
    return new Response(errorText, { status: 500 });
  }

  const diagnostics = (await diagnosticsResponse.json()) as DiagnosticsResponse[];
  const diagnosticIds = diagnostics
    .map((diag) => diag.id)
    .filter((value): value is string => Boolean(value && value !== "undefined" && isUuid(value)));

  let codes: Array<{ diagnostic_id: string; redeemed_at: string | null; status: string }> = [];
  if (diagnosticIds.length > 0) {
    const diagnosticIdFilter = diagnosticIds.map((id) => `"${id}"`).join(",");
    const codesUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_codes`);
    codesUrl.searchParams.set("select", "diagnostic_id,redeemed_at,status");
    codesUrl.searchParams.set("diagnostic_id", `in.(${diagnosticIdFilter})`);
    const codesResponse = await fetch(codesUrl.toString(), {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    });

    if (codesResponse.ok) {
      codes = (await codesResponse.json()) as Array<{
        diagnostic_id: string;
        redeemed_at: string | null;
        status: string;
      }>;
    }
  }

  const counts = diagnostics.reduce<Record<string, { issued: number; redeemed: number }>>(
    (acc, diagnostic) => {
      acc[diagnostic.id] = { issued: 0, redeemed: 0 };
      return acc;
    },
    {}
  );

  for (const code of codes) {
    const entry = counts[code.diagnostic_id];
    if (!entry) continue;
    entry.issued += 1;
    if (code.redeemed_at || code.status === "redeemed") {
      entry.redeemed += 1;
    }
  }

  const responsePayload = diagnostics.map((diagnostic) => ({
    ...diagnostic,
    issued_codes: counts[diagnostic.id]?.issued ?? 0,
    redeemed_codes: counts[diagnostic.id]?.redeemed ?? 0,
  }));

  return new Response(JSON.stringify({ diagnostics: responsePayload }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
