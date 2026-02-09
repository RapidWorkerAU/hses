import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

type Payload = {
  to?: string;
  access_code?: string;
  link?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  let payload: Payload = {};
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  const to = payload.to?.trim();
  const accessCode = payload.access_code?.trim();
  const link = payload.link?.trim();

  if (!to) {
    return new NextResponse("Missing recipient email.", { status: 400 });
  }
  if (!accessCode || !link) {
    return new NextResponse("Missing access code or link.", { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;
  if (!resendApiKey || !resendFromEmail) {
    return new NextResponse("Missing email configuration.", { status: 500 });
  }

  const { id: projectId } = await params;
  const supabase = createServiceRoleClient();
  const projectResponse = await supabase
    .from("projects")
    .select("name,quote_id,quotes(quote_number,title,organisation_id)")
    .eq("id", projectId)
    .single();

  const project = projectResponse.data;
  const quote = (project?.quotes as { quote_number?: string | null; title?: string | null; organisation_id?: string | null } | null) ?? null;
  const subject = quote?.quote_number
    ? `Project ${quote.quote_number} - Access Details`
    : "Project Access Details";

  const organisationName =
    quote?.organisation_id &&
    (await supabase
      .from("organisations")
      .select("name")
      .eq("id", quote.organisation_id)
      .single()).data?.name;

  const projectTitle = project?.name ?? quote?.title ?? "Project";
  const accessDate = new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <h2 style="margin: 0 0 12px; color: #0b2f4a;">HSES Project Access</h2>
      <p style="margin: 0 0 12px; color: #334155;">Hi,</p>
      <p style="margin: 0 0 12px; color: #334155;">
        Welcome to HSES Industry Partners. Your project is confirmed and you can track progress at any time
        using the link and access code below.
      </p>
      <div style="margin: 0 0 16px; color: #0f172a;">
        ${organisationName ? `<div><strong>Organisation:</strong> ${organisationName}</div>` : ""}
        <div><strong>Project:</strong> ${projectTitle}</div>
        <div><strong>Date:</strong> ${accessDate}</div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">
          Access code
        </p>
        <div style="font-size:20px;font-weight:700;color:#0f172a;">${accessCode}</div>
      </div>
      <p style="margin:0 0 16px;color:#475569;">Use the link below to view your project:</p>
      <a href="${link}" style="display:inline-block;background:#0b2f4a;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600;">
        View Project
      </a>
      <p style="margin:16px 0 0;color:#334155;">Kind Regards,<br/>HSES Industry Partners</p>
    </div>
  `;

  const text = [
    "Hi,",
    "",
    "Welcome to HSES Industry Partners. Your project is confirmed and you can track progress at any time",
    "using the link and access code below.",
    "",
    organisationName ? `Organisation: ${organisationName}` : null,
    `Project: ${projectTitle}`,
    `Date: ${accessDate}`,
    "",
    `Access code: ${accessCode}`,
    `Link: ${link}`,
    "",
    "Kind Regards,",
    "HSES Industry Partners",
  ]
    .filter(Boolean)
    .join("\n");

  const resend = new Resend(resendApiKey);
  const sendResult = await resend.emails.send({
    from: resendFromEmail,
    to,
    subject,
    html,
    text,
  });

  if (sendResult.error) {
    return new NextResponse("Unable to send email.", { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
