import { getSupabaseConfig } from "../../portal/_utils";

type ResultsPayload = {
  code?: string;
};

type DiagnosticDomainRow = {
  id: string;
  question_set_id: string | null;
};

const fetchDomain = async (
  baseUrl: string,
  apiKey: string,
  column: string,
  domainName: string
) => {
  const domainUrl = new URL(`${baseUrl}/rest/v1/diagnostic_domains`);
  domainUrl.searchParams.set("select", "id,question_set_id");
  domainUrl.searchParams.set(column, `eq.${domainName}`);

  const response = await fetch(domainUrl.toString(), {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return response;
};

export async function POST(request: Request) {
  let payload: ResultsPayload = {};
  try {
    payload = (await request.json()) as ResultsPayload;
  } catch {
    return new Response("Invalid request body.", { status: 400 });
  }

  const rawCode = payload.code?.trim() ?? "";
  const accessCode = rawCode;

  if (!accessCode) {
    return new Response("Missing access code.", { status: 400 });
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase configuration.", { status: 500 });
  }

  const fetchCodeByValue = async (value: string) => {
    const codeUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_codes`);
    codeUrl.searchParams.set("select", "id,diagnostic_id,status");
    codeUrl.searchParams.set("code", `eq.${value}`);
    const response = await fetch(codeUrl.toString(), {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    });
    return response;
  };

  const candidateCodes = Array.from(
    new Set(
      [
        accessCode,
        accessCode.toUpperCase(),
        accessCode.toLowerCase(),
        accessCode.replace(/[^a-zA-Z0-9]/g, ""),
        accessCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(),
      ].filter((value) => value)
    )
  );

  let codeRows: Array<{
    id: string;
    diagnostic_id: string;
    status: string;
  }> = [];

  for (const candidate of candidateCodes) {
    const codeResponse = await fetchCodeByValue(candidate);
    if (!codeResponse.ok) {
      const errorText = await codeResponse.text();
      return new Response(errorText || "Unable to validate access code.", { status: 500 });
    }
    codeRows = (await codeResponse.json()) as Array<{
      id: string;
      diagnostic_id: string;
      status: string;
    }>;
    if (codeRows.length > 0) break;
  }

  const codeRow = codeRows[0];
  if (!codeRow) {
    return new Response("Access code not found.", { status: 404 });
  }

  const diagnosticUrl = new URL(`${supabaseUrl}/rest/v1/diagnostics`);
  diagnosticUrl.searchParams.set("select", "id,name,domain_name");
  diagnosticUrl.searchParams.set("id", `eq.${codeRow.diagnostic_id}`);

  const diagnosticResponse = await fetch(diagnosticUrl.toString(), {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  });

  if (!diagnosticResponse.ok) {
    const errorText = await diagnosticResponse.text();
    return new Response(errorText || "Unable to load diagnostic.", { status: 500 });
  }

  const diagnostics = (await diagnosticResponse.json()) as Array<{
    id: string;
    name: string;
    domain_name: string | null;
  }>;

  const diagnostic = diagnostics[0];
  if (!diagnostic) {
    return new Response("Diagnostic not found.", { status: 404 });
  }

  let questionSetId: string | null = null;
  if (diagnostic.domain_name) {
    let domainResponse = await fetchDomain(
      supabaseUrl,
      supabaseServiceRoleKey,
      "name",
      diagnostic.domain_name
    );

    if (!domainResponse.ok) {
      const errorText = await domainResponse.text();
      if (errorText.includes("name")) {
        domainResponse = await fetchDomain(
          supabaseUrl,
          supabaseServiceRoleKey,
          "domain_name",
          diagnostic.domain_name
        );
      } else if (errorText.includes("domain_name")) {
        domainResponse = await fetchDomain(
          supabaseUrl,
          supabaseServiceRoleKey,
          "slug",
          diagnostic.domain_name
        );
      }
    }

    if (domainResponse.ok) {
      const domainRows = (await domainResponse.json()) as DiagnosticDomainRow[];
      questionSetId = domainRows[0]?.question_set_id ?? null;
    }
  }

  return new Response(
    JSON.stringify({
      diagnostic_id: diagnostic.id,
      diagnostic_name: diagnostic.name,
      domain_name: diagnostic.domain_name,
      question_set_id: questionSetId,
      code_id: codeRow.id,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
