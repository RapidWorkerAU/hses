import { getSupabaseConfig } from "../../portal/_utils";

type DiagnosticDomainRow = {
  id: string;
};

type DiagnosticRow = {
  id: string;
  domain_name: string | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const diagnosticId = url.searchParams.get("diagnostic_id")?.trim() ?? "";
  const domainName = url.searchParams.get("domain_name")?.trim() ?? "";

  if (!diagnosticId && !domainName) {
    return new Response("Missing diagnostic id.", { status: 400 });
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase configuration.", { status: 500 });
  }

  let resolvedDomainName = domainName;

  if (!resolvedDomainName && diagnosticId) {
    const diagnosticUrl = new URL(`${supabaseUrl}/rest/v1/diagnostics`);
    diagnosticUrl.searchParams.set("select", "id,domain_name");
    diagnosticUrl.searchParams.set("id", `eq.${diagnosticId}`);
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
    const diagnostics = (await diagnosticResponse.json()) as DiagnosticRow[];
    resolvedDomainName = diagnostics[0]?.domain_name ?? "";
  }

  if (!resolvedDomainName) {
    return new Response("Missing domain name.", { status: 400 });
  }

  const fetchDomain = async (column: string, value: string) => {
    const domainUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_domains`);
    domainUrl.searchParams.set("select", "id");
    domainUrl.searchParams.set(column, `eq.${value}`);
    const response = await fetch(domainUrl.toString(), {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    });
    return response;
  };

  let domainResponse = await fetchDomain("name", resolvedDomainName);
  if (!domainResponse.ok) {
    const errorText = await domainResponse.text();
    if (errorText.includes("name")) {
      domainResponse = await fetchDomain("domain_name", resolvedDomainName);
    } else if (errorText.includes("domain_name")) {
      domainResponse = await fetchDomain("slug", resolvedDomainName);
    }
  }

  if (!domainResponse.ok) {
    const errorText = await domainResponse.text();
    return new Response(errorText || "Unable to load domain.", { status: 500 });
  }

  const domainRows = (await domainResponse.json()) as DiagnosticDomainRow[];
  const domainId = domainRows[0]?.id;
  if (!domainId) {
    return new Response("Domain not found.", { status: 404 });
  }

  const modulesUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_modules`);
  modulesUrl.searchParams.set("select", "id,name,position");
  modulesUrl.searchParams.set("domain_id", `eq.${domainId}`);
  modulesUrl.searchParams.set("order", "position.asc");
  const modulesResponse = await fetch(modulesUrl.toString(), {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  });

  if (!modulesResponse.ok) {
    const errorText = await modulesResponse.text();
    return new Response(errorText || "Unable to load modules.", { status: 500 });
  }

  const modules = (await modulesResponse.json()) as Array<{ id: string; name: string; position: number }>;
  return new Response(JSON.stringify({ modules }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
