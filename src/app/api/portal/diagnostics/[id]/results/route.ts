export const dynamic = "force-dynamic";

import { getAccountIdsForUser, getSupabaseConfig, getUserIdFromToken } from "../../../_utils";

type DiagnosticRow = {
  id: string;
  account_id: string;
  name: string | null;
  domain_name: string | null;
  domain_id?: string | null;
  question_set_id?: string | null;
};

type ResponseRow = {
  rating: number | null;
  question: {
    id: string;
    prompt: string | null;
    criteria_id: string | null;
    module_id: string | null;
    clause_id?: string | null;
  };
};

type QuestionRow = {
  id: string;
  prompt: string | null;
  criteria_id: string | null;
  module_id: string | null;
};

type ModuleRow = {
  id: string;
  name: string | null;
  position: number | null;
};

type CriteriaRow = {
  id: string;
  name: string | null;
};

type ClauseRow = {
  id: string;
  clause: string | null;
};

const mapLevel = (percent: number | null) => {
  if (percent === null || Number.isNaN(percent)) return "unknown";
  if (percent <= 39) return "reactive";
  if (percent <= 69) return "proactive";
  return "resilient";
};

const parseCriteriaNumber = (name: string | null) => {
  if (!name) return null;
  const match = name.match(/^(\d+(\.\d+)?)/);
  return match ? match[1] : null;
};

const stripCriteriaNumber = (name: string | null) => {
  if (!name) return "";
  return name.replace(/^(\d+(\.\d+)?\s*)/, "").trim();
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.id;
  const idFromPath = request.url.split("/").at(-2);
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
    return new Response("No account access.", { status: 403 });
  }

  const accountIdFilter = accountIds.map((id) => `"${id}"`).join(",");
  const diagnosticUrl = new URL(`${supabaseUrl}/rest/v1/diagnostics`);
  diagnosticUrl.searchParams.set(
    "select",
    "id,account_id,name,domain_name,domain_id,question_set_id"
  );
  diagnosticUrl.searchParams.set("id", `eq.${diagnosticId}`);
  diagnosticUrl.searchParams.set("account_id", `in.(${accountIdFilter})`);
  let diagnosticResponse = await fetch(diagnosticUrl.toString(), {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  });

  if (!diagnosticResponse.ok) {
    const errorText = await diagnosticResponse.text();
    if (
      errorText.includes("domain_id") ||
      errorText.includes("question_set_id")
    ) {
      const fallbackUrl = new URL(`${supabaseUrl}/rest/v1/diagnostics`);
      fallbackUrl.searchParams.set("select", "id,account_id,name,domain_name");
      fallbackUrl.searchParams.set("id", `eq.${diagnosticId}`);
      fallbackUrl.searchParams.set("account_id", `in.(${accountIdFilter})`);
      diagnosticResponse = await fetch(fallbackUrl.toString(), {
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
        },
      });
    }
  }

  if (!diagnosticResponse.ok) {
    const errorText = await diagnosticResponse.text();
    return new Response(errorText || "Unable to load diagnostic.", { status: 500 });
  }

  const diagnostics = (await diagnosticResponse.json()) as DiagnosticRow[];
  const diagnostic = diagnostics[0];
  if (!diagnostic) {
    return new Response("Diagnostic not found.", { status: 404 });
  }

  const responsesUrl = new URL(`${supabaseUrl}/rest/v1/responses`);
  responsesUrl.searchParams.set(
    "select",
    "rating,question:questions!inner(id,prompt,criteria_id,module_id,clause_id)"
  );
  responsesUrl.searchParams.set("diagnostic_id", `eq.${diagnostic.id}`);
  const responsesResponse = await fetch(responsesUrl.toString(), {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  });

  if (!responsesResponse.ok) {
    const errorText = await responsesResponse.text();
    return new Response(errorText || "Unable to load responses.", { status: 500 });
  }

  const responses = (await responsesResponse.json()) as ResponseRow[];
  const clauseRatings = new Map<string, number[]>();
  for (const row of responses) {
    const clauseId = row.question?.clause_id;
    if (!clauseId || typeof row.rating !== "number") continue;
    const existing = clauseRatings.get(clauseId) ?? [];
    existing.push(row.rating);
    clauseRatings.set(clauseId, existing);
  }
  const criteriaMap = new Map<
    string,
    {
      criteria_id: string;
      module_id: string;
      prompts: string[];
      ratings: number[];
    }
  >();

  const resolveDomainId = async (
    domainName: string,
    domainId?: string | null,
    questionSetId?: string | null
  ) => {
    if (questionSetId || domainId) {
      return { domainId: domainId ?? null, questionSetId: questionSetId ?? null };
    }
    const fetchDomain = async (column: string, value: string) => {
      const domainUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_domains`);
      domainUrl.searchParams.set("select", "id,question_set_id");
      domainUrl.searchParams.set(column, `eq.${value}`);
      const response = await fetch(domainUrl.toString(), {
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
        },
      });
      return response;
    };

    let domainResponse = await fetchDomain("name", domainName);
    if (!domainResponse.ok) {
      const errorText = await domainResponse.text();
      if (errorText.includes("name")) {
        domainResponse = await fetchDomain("domain_name", domainName);
      } else if (errorText.includes("domain_name")) {
        domainResponse = await fetchDomain("slug", domainName);
      }
    }

    if (!domainResponse.ok) {
      return { domainId: null, questionSetId: null };
    }

    const domainRows = (await domainResponse.json()) as Array<{
      id: string;
      question_set_id?: string | null;
    }>;
    return {
      domainId: domainRows[0]?.id ?? null,
      questionSetId: domainRows[0]?.question_set_id ?? null,
    };
  };

  const primeQuestions = async () => {
    const domainName = diagnostic.domain_name ?? "";
    if (!domainName && !diagnostic.domain_id && !diagnostic.question_set_id) return;
    const { domainId, questionSetId } = await resolveDomainId(
      domainName,
      diagnostic.domain_id,
      diagnostic.question_set_id
    );
    const questionsUrl = new URL(`${supabaseUrl}/rest/v1/questions`);
    questionsUrl.searchParams.set(
      "select",
      "id,prompt,criteria_id,module_id"
    );
    if (questionSetId) {
      questionsUrl.searchParams.set("question_set_id", `eq.${questionSetId}`);
    } else if (domainId) {
      questionsUrl.searchParams.set("domain_id", `eq.${domainId}`);
    } else {
      return;
    }

    const questionsResponse = await fetch(questionsUrl.toString(), {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    });

    if (!questionsResponse.ok) {
      return;
    }

    const questions = (await questionsResponse.json()) as QuestionRow[];
    for (const question of questions) {
      if (!question.criteria_id || !question.module_id) continue;
      const entry = criteriaMap.get(question.criteria_id) ?? {
        criteria_id: question.criteria_id,
        module_id: question.module_id,
        prompts: [],
        ratings: [],
      };
      if (question.prompt && !entry.prompts.includes(question.prompt)) {
        entry.prompts.push(question.prompt);
      }
      criteriaMap.set(question.criteria_id, entry);
    }
  };

  await primeQuestions();

  for (const row of responses) {
    const question = row.question;
    if (!question?.criteria_id || !question?.module_id) continue;
    const key = question.criteria_id;
    const entry = criteriaMap.get(key) ?? {
      criteria_id: question.criteria_id,
      module_id: question.module_id,
      prompts: [],
      ratings: [],
    };
    if (question.prompt && !entry.prompts.includes(question.prompt)) {
      entry.prompts.push(question.prompt);
    }
    if (typeof row.rating === "number") {
      entry.ratings.push(row.rating);
    }
    criteriaMap.set(key, entry);
  }

  const criteriaIds = Array.from(criteriaMap.keys());
  const moduleIds = Array.from(new Set(Array.from(criteriaMap.values()).map((entry) => entry.module_id)));

  const criteriaLookup = new Map<string, CriteriaRow>();
  if (criteriaIds.length > 0) {
    const criteriaUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_criteria`);
    criteriaUrl.searchParams.set("select", "id,name");
    criteriaUrl.searchParams.set("id", `in.(${criteriaIds.map((id) => `"${id}"`).join(",")})`);
    const criteriaResponse = await fetch(criteriaUrl.toString(), {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    });
    if (criteriaResponse.ok) {
      const criteriaRows = (await criteriaResponse.json()) as CriteriaRow[];
      criteriaRows.forEach((row) => criteriaLookup.set(row.id, row));
    }
  }

  const moduleLookup = new Map<string, ModuleRow>();
  if (moduleIds.length > 0) {
    const modulesUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_modules`);
    modulesUrl.searchParams.set("select", "id,name,position");
    modulesUrl.searchParams.set("id", `in.(${moduleIds.map((id) => `"${id}"`).join(",")})`);
    const modulesResponse = await fetch(modulesUrl.toString(), {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    });
    if (modulesResponse.ok) {
      const modules = (await modulesResponse.json()) as ModuleRow[];
      modules.forEach((row) => moduleLookup.set(row.id, row));
    }
  }

  const rows = Array.from(criteriaMap.values()).map((entry) => {
    const criteria = criteriaLookup.get(entry.criteria_id);
    const module = moduleLookup.get(entry.module_id);
    const avgRating =
      entry.ratings.length === 0
        ? null
        : entry.ratings.reduce((sum, value) => sum + value, 0) / entry.ratings.length;
    const percent = avgRating === null ? null : Math.round((avgRating / 5) * 100);
    const level = mapLevel(percent);
    const criteriaName = criteria?.name ?? "";
    return {
      criteria_id: entry.criteria_id,
      criteria_number: parseCriteriaNumber(criteriaName),
      criteria_topic: stripCriteriaNumber(criteriaName),
      criteria_name: criteriaName,
      module_id: entry.module_id,
      module_name: module?.name ?? "Module",
      module_position: module?.position ?? 0,
      clauses: entry.prompts,
      percent,
      level,
    };
  });

  rows.sort((a, b) => {
    if (a.module_position !== b.module_position) {
      return (a.module_position ?? 0) - (b.module_position ?? 0);
    }
    const numA = a.criteria_number ? parseFloat(a.criteria_number) : 0;
    const numB = b.criteria_number ? parseFloat(b.criteria_number) : 0;
    return numA - numB;
  });

  const clauseIndicators: Array<{
    clause: string;
    percent: number | null;
    level: ReturnType<typeof mapLevel>;
  }> = [];

  const clauseIds = Array.from(clauseRatings.keys());
  if (clauseIds.length > 0) {
    const clausesUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_clauses`);
    clausesUrl.searchParams.set("select", "id,clause");
    clausesUrl.searchParams.set("id", `in.(${clauseIds.map((id) => `"${id}"`).join(",")})`);
    const clausesResponse = await fetch(clausesUrl.toString(), {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    });
    if (clausesResponse.ok) {
      const clauses = (await clausesResponse.json()) as ClauseRow[];
      clauses.forEach((clause) => {
        if (!clause.clause) return;
        const ratings = clauseRatings.get(clause.id) ?? [];
        const avg =
          ratings.length === 0
            ? null
            : ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
        const percent = avg === null ? null : Math.round((avg / 5) * 100);
        clauseIndicators.push({
          clause: clause.clause,
          percent,
          level: mapLevel(percent),
        });
      });
    }
  }

  return new Response(
    JSON.stringify({
      diagnostic: {
        id: diagnostic.id,
        name: diagnostic.name,
        domain_name: diagnostic.domain_name,
      },
      rows,
      clauseIndicators,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
