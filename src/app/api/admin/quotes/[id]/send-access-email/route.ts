import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_QUOTE_EMAIL_TEMPLATE,
  QUOTE_EMAIL_PLACEHOLDERS,
  renderQuoteEmailTemplate,
} from "@/lib/quote/emailTemplate";

type Payload = {
  to?: string;
  cc?: string;
  access_code?: string;
  link?: string;
  message_template?: string;
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
  const messageTemplate = payload.message_template?.trim() || DEFAULT_QUOTE_EMAIL_TEMPLATE;

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

  const missingPlaceholders = ["{{access_code}}", "{{quote_link}}"].filter(
    (placeholder) => !messageTemplate.includes(placeholder)
  );
  if (missingPlaceholders.length > 0) {
    return new NextResponse(
      `Email template must include: ${missingPlaceholders.join(", ")}`,
      { status: 400 }
    );
  }

  const unknownPlaceholders = Array.from(messageTemplate.matchAll(/\{\{[^}]+\}\}/g))
    .map((match) => match[0])
    .filter((placeholder) => !QUOTE_EMAIL_PLACEHOLDERS.includes(placeholder as (typeof QUOTE_EMAIL_PLACEHOLDERS)[number]));

  if (unknownPlaceholders.length > 0) {
    return new NextResponse(
      `Unknown placeholders found: ${Array.from(new Set(unknownPlaceholders)).join(", ")}`,
      { status: 400 }
    );
  }

  const { html, text } = renderQuoteEmailTemplate(messageTemplate, {
    organisationName,
    proposalTitle,
    proposalDate,
    accessCode,
    link,
  });

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
