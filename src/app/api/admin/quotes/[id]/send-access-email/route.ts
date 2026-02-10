import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

type Payload = {
  to?: string;
  cc?: string;
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
  const cc = payload.cc?.trim() ?? "";
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

  const { id: quoteId } = await params;
  const supabase = createServiceRoleClient();
  const quoteResponse = await supabase
    .from("quotes")
    .select("quote_number,title,organisation_id,contact_id")
    .eq("id", quoteId)
    .single();

  const quote = quoteResponse.data;
  const subject = quote?.quote_number
    ? `Quote ${quote.quote_number} - Access Details`
    : "Quote Access Details";

  const organisationName =
    quote?.organisation_id &&
    (await supabase
      .from("organisations")
      .select("name")
      .eq("id", quote.organisation_id)
      .single()).data?.name;

  const proposalTitle = quote?.title ?? "Proposal";
  const proposalDate = new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <h2 style="margin: 0 0 12px; color: #0b2f4a;">HSES Quote Access</h2>
      <p style="margin: 0 0 12px; color: #334155;">Hi,</p>
      <p style="margin: 0 0 12px; color: #334155;">
        Thankyou for allowing HSES the opportunity to provide a proposal for your work. Please see below link
        and access code to view an itemised proposal for your works. You will be able to accept or reject the
        proposal through the link with any commentary that may be relevant.
      </p>
      <p style="margin: 0 0 16px; color: #334155;">
        The team at HSES will be notified of your response and will follow-up with next steps as soon as possible.
      </p>
      <div style="margin: 0 0 16px; color: #0f172a;">
        ${organisationName ? `<div><strong>Organisation:</strong> ${organisationName}</div>` : ""}
        <div><strong>Proposal Name:</strong> ${proposalTitle}</div>
        <div><strong>Date:</strong> ${proposalDate}</div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">
          Access code
        </p>
        <div style="font-size:20px;font-weight:700;color:#0f172a;">${accessCode}</div>
      </div>
      <p style="margin:0 0 16px;color:#475569;">Use the link below to view your quote:</p>
      <a href="${link}" style="display:inline-block;background:#0b2f4a;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600;">
        View Quote
      </a>
      <p style="margin:16px 0 0;color:#334155;">Kind Regards,<br/>HSES Industry Partners</p>
    </div>
  `;

  const text = [
    "Hi,",
    "",
    "Thankyou for allowing HSES the opportunity to provide a proposal for your work. Please see below link",
    "and access code to view an itemised proposal for your works. You will be able to accept or reject the",
    "proposal through the link with any commentary that may be relevant.",
    "",
    "The team at HSES will be notified of your response and will follow-up with next steps as soon as possible.",
    "",
    organisationName ? `Organisation: ${organisationName}` : null,
    `Proposal Name: ${proposalTitle}`,
    `Date: ${proposalDate}`,
    "",
    `Access code: ${accessCode}`,
    `Link: ${link}`,
    "",
    "Kind Regards,",
    "HSES Industry Partners",
  ]
    .filter(Boolean)
    .join("\n");

  const ccList = cc
    .split(/[;,]/)
    .map((value) => value.trim())
    .filter(Boolean);

  const resend = new Resend(resendApiKey);
  const sendResult = await resend.emails.send({
    from: resendFromEmail,
    to,
    cc: ccList.length ? ccList : undefined,
    subject,
    html,
    text,
  });

  if (sendResult.error) {
    return new NextResponse("Unable to send email.", { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
