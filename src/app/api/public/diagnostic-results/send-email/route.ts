import { Resend } from "resend";
import { getSupabaseConfig } from "../../../portal/_utils";

type EmailPayload = {
  code_id?: string;
  email?: string;
  subject?: string;
  body?: string;
};

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;
  if (!resendApiKey || !resendFromEmail) {
    return new Response("Missing email configuration.", { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as EmailPayload | null;
  if (!payload?.code_id) {
    return new Response("Missing code id.", { status: 400 });
  }

  const subject = payload.subject?.trim();
  const body = payload.body?.trim();
  if (!subject || !body) {
    return new Response("Missing email content.", { status: 400 });
  }

  let email = payload.email?.trim() ?? "";
  if (!email) {
    const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response("Missing Supabase configuration.", { status: 500 });
    }
    const codeUrl = new URL(`${supabaseUrl}/rest/v1/diagnostic_codes`);
    codeUrl.searchParams.set("select", "issued_to_email");
    codeUrl.searchParams.set("id", `eq.${payload.code_id}`);
    const response = await fetch(codeUrl.toString(), {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText || "Unable to load code email.", { status: 500 });
    }
    const rows = (await response.json()) as Array<{ issued_to_email: string | null }>;
    email = rows[0]?.issued_to_email ?? "";
  }

  if (!email || !email.includes("@")) {
    return new Response("Missing or invalid email address.", { status: 400 });
  }

  const resend = new Resend(resendApiKey);
  const sendResult = await resend.emails.send({
    from: resendFromEmail,
    to: email,
    subject,
    text: body,
  });

  if (sendResult.error) {
    return new Response(sendResult.error.message || "Email send failed.", { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, email }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
