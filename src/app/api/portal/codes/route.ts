export const dynamic = "force-dynamic";

import { getAccountIdsForUser, getSupabaseConfig, getUserIdFromToken } from "../_utils";

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
    return new Response(JSON.stringify({ codes: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const accountIdFilter = accountIds.map((id) => `"${id}"`).join(",");
  const diagnosticsUrl = new URL(`${supabaseUrl}/rest/v1/diagnostics`);
  diagnosticsUrl.searchParams.set(
    "select",
    "id,name,order_id,domain_name,purchased_at,created_at"
  );
  diagnosticsUrl.searchParams.set("account_id", `in.(${accountIdFilter})`);
  let diagnosticsResponse = await fetch(diagnosticsUrl.toString(), {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  });

  let diagnostics: Array<{
    id: string;
    name: string;
    order_id?: string | null;
    domain_name?: string | null;
    purchased_at?: string | null;
    created_at?: string | null;
  }> = [];

  if (!diagnosticsResponse.ok) {
    const errorText = await diagnosticsResponse.text();
    if (errorText.includes("order_id")) {
      const fallbackUrl = new URL(`${supabaseUrl}/rest/v1/diagnostics`);
      fallbackUrl.searchParams.set("select", "id,name,domain_name,purchased_at,created_at");
      fallbackUrl.searchParams.set("account_id", `in.(${accountIdFilter})`);
      diagnosticsResponse = await fetch(fallbackUrl.toString(), {
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
        },
      });
      if (!diagnosticsResponse.ok) {
        const fallbackError = await diagnosticsResponse.text();
          if (
            fallbackError.includes("domain_name") ||
            fallbackError.includes("purchased_at") ||
            fallbackError.includes("created_at")
          ) {
            const minimalUrl = new URL(`${supabaseUrl}/rest/v1/diagnostics`);
            minimalUrl.searchParams.set("select", "id,name");
          minimalUrl.searchParams.set("account_id", `in.(${accountIdFilter})`);
          diagnosticsResponse = await fetch(minimalUrl.toString(), {
            headers: {
              apikey: supabaseServiceRoleKey,
              Authorization: `Bearer ${supabaseServiceRoleKey}`,
            },
          });
          if (!diagnosticsResponse.ok) {
            const minimalError = await diagnosticsResponse.text();
            return new Response(minimalError, { status: 500 });
          }
        } else {
          return new Response(fallbackError, { status: 500 });
        }
      }
      diagnostics = (await diagnosticsResponse.json()) as Array<{
        id: string;
        name: string;
        domain_name?: string | null;
        purchased_at?: string | null;
        created_at?: string | null;
      }>;
    } else {
      return new Response(errorText, { status: 500 });
    }
  } else {
    diagnostics = (await diagnosticsResponse.json()) as Array<{
      id: string;
      name: string;
      order_id?: string | null;
      domain_name?: string | null;
      purchased_at?: string | null;
      created_at?: string | null;
    }>;
  }

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  const diagnosticMap = diagnostics.reduce<
    Record<
      string,
      {
        name: string;
        order_id?: string | null;
        domain_name?: string | null;
        purchased_at?: string | null;
        created_at?: string | null;
      }
    >
  >((acc, diag) => {
      acc[diag.id] = {
        name: diag.name,
        order_id: diag.order_id ?? null,
        domain_name: diag.domain_name ?? null,
        purchased_at: diag.purchased_at ?? null,
        created_at: diag.created_at ?? null,
      };
      return acc;
    },
    {}
  );

  const diagnosticIds = diagnostics
    .map((diag) => diag.id)
    .filter((value): value is string => Boolean(value && value !== "undefined" && isUuid(value)));
  if (diagnosticIds.length === 0) {
    return new Response(JSON.stringify({ codes: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const diagnosticIdFilter = diagnosticIds.map((id) => `"${id}"`).join(",");
  const codesUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_codes`);
  codesUrl.searchParams.set(
    "select",
    "id,diagnostic_id,code,issued_to_name,issued_to_email,issued_at,redeemed_at,status"
  );
  codesUrl.searchParams.set("diagnostic_id", `in.(${diagnosticIdFilter})`);
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
    diagnostic_id: string;
    code: string;
    issued_to_name: string | null;
    issued_to_email: string | null;
    issued_at: string | null;
    redeemed_at: string | null;
    status: string;
  }>;

  const responsePayload = codes.map((entry) => ({
    ...entry,
    diagnostic_name: diagnosticMap[entry.diagnostic_id]?.name ?? "Diagnostic",
    diagnostic_order_id: diagnosticMap[entry.diagnostic_id]?.order_id ?? null,
    diagnostic_domain_name: diagnosticMap[entry.diagnostic_id]?.domain_name ?? null,
    diagnostic_purchased_at: diagnosticMap[entry.diagnostic_id]?.purchased_at ?? null,
    diagnostic_created_at: diagnosticMap[entry.diagnostic_id]?.created_at ?? null,
  }));

  return new Response(JSON.stringify({ codes: responsePayload }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
