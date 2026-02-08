import { Resend } from "resend";

export const dynamic = "force-dynamic";

import { getAccountIdsForUser, getSupabaseConfig, getUserIdFromToken } from "../../_utils";

type SendEmailPayload = {
  subject: string;
  message: string;
  recipients: Array<{
    code_id: string;
    code: string;
    name: string;
    email: string;
  }>;
};

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return new Response("Missing bearer token.", { status: 401 });
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase configuration.", { status: 500 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;
  if (!resendApiKey || !resendFromEmail) {
    return new Response("Missing email configuration.", { status: 500 });
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

  const payload = (await request.json().catch(() => null)) as SendEmailPayload | null;
  if (!payload?.subject || !payload?.message || !payload?.recipients?.length) {
    return new Response("Missing email details.", { status: 400 });
  }

  const accountIdFilter = accountIds.map((id) => `"${id}"`).join(",");

  const codeIds = payload.recipients.map((recipient) => recipient.code_id);
  const codeIdFilter = codeIds.map((id) => `"${id}"`).join(",");

  const codeResponse = await fetch(
    `${supabaseUrl}/rest/v1/diagnostic_codes?select=id,code,diagnostic_id&id=in.(${codeIdFilter})`,
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

  const codeRows = (await codeResponse.json()) as Array<{
    id: string;
    code: string;
    diagnostic_id: string;
  }>;

  const diagnosticIds = [...new Set(codeRows.map((row) => row.diagnostic_id))];
  if (diagnosticIds.length === 0) {
    return new Response("No diagnostic codes found.", { status: 400 });
  }

  const diagnosticIdFilter = diagnosticIds.map((id) => `"${id}"`).join(",");
  const diagnosticResponse = await fetch(
    `${supabaseUrl}/rest/v1/diagnostics?select=id,account_id,name&id=in.(${diagnosticIdFilter})&account_id=in.(${accountIdFilter})`,
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

  const diagnostics = (await diagnosticResponse.json()) as Array<{
    id: string;
    name: string;
  }>;

  const allowedDiagnosticIds = new Set(diagnostics.map((diag) => diag.id));
  const safeRecipients = payload.recipients.filter((recipient) =>
    codeRows.some((row) => row.id === recipient.code_id && allowedDiagnosticIds.has(row.diagnostic_id))
  );

  if (safeRecipients.length === 0) {
    return new Response("Not authorised to email these codes.", { status: 403 });
  }

  const diagnosticMap = diagnostics.reduce<Record<string, string>>((acc, diag) => {
    acc[diag.id] = diag.name;
    return acc;
  }, {});

  const resend = new Resend(resendApiKey);

  const results: Array<{ code_id: string; email: string; ok: boolean; error?: string }> = [];

  for (const recipient of safeRecipients) {
    const codeRow = codeRows.find((row) => row.id === recipient.code_id);
    const diagnosticName = codeRow ? diagnosticMap[codeRow.diagnostic_id] : "Diagnostic";
    const codeValue = codeRow?.code ?? recipient.code;

    const personalised = payload.message
      .replace(/\{\{name\}\}/g, recipient.name)
      .replace(/\{\{code\}\}/g, codeValue)
      .replace(/\{\{diagnostic\}\}/g, diagnosticName);

    const sendResult = await resend.emails.send({
      from: resendFromEmail,
      to: recipient.email,
      subject: payload.subject,
      text: personalised,
    });

    if (sendResult.error) {
      results.push({
        code_id: recipient.code_id,
        email: recipient.email,
        ok: false,
        error: String(sendResult.error),
      });
      continue;
    }

    await fetch(`${supabaseUrl}/rest/v1/diagnostic_codes?id=eq.${recipient.code_id}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        issued_to_name: recipient.name,
        issued_to_email: recipient.email,
        issued_at: new Date().toISOString(),
      }),
    });

    results.push({ code_id: recipient.code_id, email: recipient.email, ok: true });
  }

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
