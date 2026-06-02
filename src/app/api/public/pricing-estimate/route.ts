import { Resend } from "resend";

type QuoteEnquiryPayload = {
  quoteType?: "document_development" | "management_system_design" | "safety_technology";
  quoteTypeLabel?: string;
  urgency?: "soon" | "scheduled" | "exploring";
  urgencyLabel?: string;
  urgencyDetails?: string;
  name?: string;
  businessName?: string;
  email?: string;
  phone?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getQuoteTypeLabel(payload: QuoteEnquiryPayload) {
  if (payload.quoteTypeLabel?.trim()) return payload.quoteTypeLabel.trim();
  if (payload.quoteType === "document_development") return "Document Development";
  if (payload.quoteType === "management_system_design") return "Management System Design";
  if (payload.quoteType === "safety_technology") return "Safety Technology";
  return "";
}

function getUrgencyLabel(payload: QuoteEnquiryPayload) {
  if (payload.urgencyLabel?.trim()) return payload.urgencyLabel.trim();
  if (payload.urgency === "soon") return "Urgent";
  if (payload.urgency === "scheduled") return "Planned";
  if (payload.urgency === "exploring") return "Exploring";
  return "";
}

function renderSummaryRows(rows: Array<{ label: string; value: string }>) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
      ${rows
        .map(
          (row) => `
            <tr>
              <td style="padding:10px 12px;border:1px solid #d7dce1;background:#f9fbfc;color:#5d6b76;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">
                ${escapeHtml(row.label)}
              </td>
              <td style="padding:10px 12px;border:1px solid #d7dce1;border-left:none;background:#ffffff;color:#1f2f3c;font-size:15px;font-weight:700;" align="left">
                ${escapeHtml(row.value || "-")}
              </td>
            </tr>
          `
        )
        .join("")}
    </table>
  `;
}

function renderEmailLayout(params: {
  title: string;
  intro: string;
  summaryHtml: string;
  detailHtml: string;
  supportingText: string;
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hses.com.au").replace(/\/$/, "");
  const logoUrl = `${siteUrl}/images/logo-black.png`;

  return `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#eef2f5;font-family:Arial,sans-serif;color:#1f2f3c;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
          ${escapeHtml(params.title)}
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eef2f5;padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:720px;border-collapse:collapse;background:#ffffff;border:1px solid #d7dce1;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #d7dce1;background:#ffffff;">
                    <img src="${logoUrl}" alt="HSES Industry Partners" width="132" style="display:block;width:132px;height:auto;border:0;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px;">
                    <h1 style="margin:0 0 10px;font-size:24px;line-height:1.2;color:#1d2f3f;">${escapeHtml(params.title)}</h1>
                    <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#43515d;">
                      ${escapeHtml(params.intro)}
                    </p>

                    <div style="margin:0 0 22px;">
                      <h2 style="margin:0 0 10px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#5d6b76;">Summary</h2>
                      ${params.summaryHtml}
                    </div>

                    <div style="margin:0 0 22px;">
                      <h2 style="margin:0 0 10px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#5d6b76;">Urgency and context</h2>
                      ${params.detailHtml}
                    </div>

                    <p style="margin:0;font-size:14px;line-height:1.55;color:#43515d;">
                      ${escapeHtml(params.supportingText)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildCustomerEmail(payload: Required<QuoteEnquiryPayload>) {
  const summaryHtml = renderSummaryRows([
    { label: "Business", value: payload.businessName },
    { label: "Quote Type", value: payload.quoteTypeLabel },
    { label: "Urgency", value: payload.urgencyLabel },
  ]);

  return {
    subject: `We received your HSES quote enquiry`,
    html: renderEmailLayout({
      title: "Thanks for your enquiry",
      intro: `Hi ${payload.name}, we have received your quote enquiry for ${payload.quoteTypeLabel.toLowerCase()}.`,
      summaryHtml,
      detailHtml: `<p style="margin:0;padding:14px 16px;border:1px solid #d7dce1;background:#f9fbfc;color:#243746;font-size:14px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(
        payload.urgencyDetails
      )}</p>`,
      supportingText:
        "We will review the context you provided and come back to you within 1-3 business days with the most practical next step.",
    }),
    text: [
      `Hi ${payload.name},`,
      ``,
      `We have received your quote enquiry for ${payload.quoteTypeLabel}.`,
      `Business: ${payload.businessName}`,
      ``,
      `Urgency and context:`,
      payload.urgencyDetails,
      ``,
      `We will come back to you within 1-3 business days.`,
    ].join("\n"),
  };
}

function buildInternalEmail(payload: Required<QuoteEnquiryPayload>) {
  const summaryHtml = renderSummaryRows([
    { label: "Customer", value: payload.name },
    { label: "Business", value: payload.businessName },
    { label: "Email", value: payload.email },
    { label: "Phone", value: payload.phone || "-" },
    { label: "Quote Type", value: payload.quoteTypeLabel },
    { label: "Urgency", value: payload.urgencyLabel },
  ]);

  return {
    subject: `Quote enquiry: ${payload.businessName} - ${payload.quoteTypeLabel}`,
    html: renderEmailLayout({
      title: "Website Quote Enquiry",
      intro: `${payload.name} from ${payload.businessName} submitted a quote enquiry through the website.`,
      summaryHtml,
      detailHtml: `<p style="margin:0;padding:14px 16px;border:1px solid #d7dce1;background:#f9fbfc;color:#243746;font-size:14px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(
        payload.urgencyDetails
      )}</p>`,
      supportingText: "This enquiry was submitted through the website quote request form.",
    }),
    text: [
      `Website quote enquiry received.`,
      `Customer: ${payload.name}`,
      `Business: ${payload.businessName}`,
      `Email: ${payload.email}`,
      `Phone: ${payload.phone || "-"}`,
      `Quote type: ${payload.quoteTypeLabel}`,
      ``,
      `Urgency and context:`,
      payload.urgencyDetails,
    ].join("\n"),
  };
}

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !resendFromEmail) {
    return new Response("Missing email configuration.", { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as QuoteEnquiryPayload | null;
  if (!payload) {
    return new Response("Invalid request.", { status: 400 });
  }

  const name = payload.name?.trim() ?? "";
  const businessName = payload.businessName?.trim() ?? "";
  const email = payload.email?.trim() ?? "";
  const phone = payload.phone?.trim() ?? "";
  const quoteType = payload.quoteType;
  const quoteTypeLabel = getQuoteTypeLabel(payload);
  const urgency = payload.urgency;
  const urgencyLabel = getUrgencyLabel(payload);
  const urgencyDetails = payload.urgencyDetails?.trim() ?? "";

  if (!name || !businessName || !email || !quoteType || !quoteTypeLabel || !urgency || !urgencyLabel || !urgencyDetails) {
    return new Response("Missing required enquiry details.", { status: 400 });
  }

  if (!email.includes("@")) {
    return new Response("Missing or invalid email address.", { status: 400 });
  }

  const normalizedPayload: Required<QuoteEnquiryPayload> = {
    name,
    businessName,
    email,
    phone,
    quoteType,
    quoteTypeLabel,
    urgency,
    urgencyLabel,
    urgencyDetails,
  };

  const customerEmail = buildCustomerEmail(normalizedPayload);
  const internalEmail = buildInternalEmail(normalizedPayload);

  const resend = new Resend(resendApiKey);
  const [customerResult, internalResult] = await Promise.all([
    resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: customerEmail.subject,
      html: customerEmail.html,
      text: customerEmail.text,
    }),
    resend.emails.send({
      from: resendFromEmail,
      to: "ask@hses.com.au",
      subject: internalEmail.subject,
      html: internalEmail.html,
      text: internalEmail.text,
    }),
  ]);

  if (customerResult.error) {
    return new Response(customerResult.error.message || "Customer email send failed.", {
      status: 500,
    });
  }

  if (internalResult.error) {
    return new Response(internalResult.error.message || "Internal email send failed.", {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ ok: true, email }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
