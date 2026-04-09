type QuoteEmailTemplateParams = {
  organisationName?: string | null;
  proposalTitle: string;
  proposalDate: string;
  accessCode: string;
  link: string;
};

export const QUOTE_EMAIL_PLACEHOLDERS = [
  "{{organisation_name}}",
  "{{proposal_name}}",
  "{{proposal_date}}",
  "{{access_code}}",
  "{{quote_link}}",
] as const;

export const DEFAULT_QUOTE_EMAIL_TEMPLATE = `Hi,

Thankyou for allowing HSES the opportunity to provide a proposal for your work. Please use the details below to view an itemised proposal for your works. You will be able to accept or reject the proposal through the link with any commentary that may be relevant.

Organisation: {{organisation_name}}
Proposal Name: {{proposal_name}}
Date: {{proposal_date}}
Access Code: {{access_code}}
Quote Link: {{quote_link}}

The team at HSES will be notified of your response and will follow up with next steps as soon as possible.

Kind Regards,
HSES Industry Partners`;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderParagraphs = (value: string) =>
  value
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p style="margin: 0 0 12px; color: #334155;">${escapeHtml(block).replace(/\n/g, "<br/>")}</p>`)
    .join("");

export const renderQuoteEmailTemplate = (
  template: string,
  params: QuoteEmailTemplateParams
) => {
  const replacements: Record<(typeof QUOTE_EMAIL_PLACEHOLDERS)[number], string> = {
    "{{organisation_name}}": params.organisationName?.trim() || "Organisation",
    "{{proposal_name}}": params.proposalTitle,
    "{{proposal_date}}": params.proposalDate,
    "{{access_code}}": params.accessCode,
    "{{quote_link}}": params.link,
  };

  let text = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    text = text.split(placeholder).join(value);
  }

  const htmlBodyText = text
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (trimmed === `Access Code: ${params.accessCode}`) return false;
      if (trimmed === `Quote Link: ${params.link}`) return false;
      return true;
    })
    .join("\n")
    .trim();

  const htmlBody = renderParagraphs(htmlBodyText);

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin: 0 0 12px; color: #0b2f4a;">HSES Quote Access</h2>
      ${htmlBody}
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:0 0 16px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">
          Access code
        </p>
        <div style="font-size:20px;font-weight:700;color:#0f172a;">${escapeHtml(params.accessCode)}</div>
      </div>
      <p style="margin:0 0 16px;color:#475569;">Use the link below to view your quote:</p>
      <a href="${escapeHtml(params.link)}" style="display:inline-block;background:#0b2f4a;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600;">
        View Quote
      </a>
      <div style="margin:16px 0 0;color:#334155;">This message was sent from HSES Industry Partners.</div>
    </div>
  `;

  return { text, html };
};
