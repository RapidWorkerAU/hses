import { Resend } from "resend";

type DocumentLineItem = {
  label: string;
  quantity: number;
  developmentHours: number;
  reviewHours: number;
  finalApprovalHours: number;
};

type PricingEstimatePayload = {
  name?: string;
  businessName?: string;
  email?: string;
  serviceType?: "document_development" | "app_development" | "incident_investigation";
  subtotalExGst?: number;
  gstAmount?: number;
  totalIncGst?: number;
  totalHours?: number;
  breakdown?: {
    newBusiness?: string;
    discoveryIncluded?: boolean;
    developmentHours?: number;
    reviewHours?: number;
    finalApprovalHours?: number;
    lineItems?: DocumentLineItem[];
    level?: string;
  };
};

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(value)} AUD`;
}

function formatHours(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 0,
  }).format(value);
}

function getServiceLabel(serviceType: PricingEstimatePayload["serviceType"]) {
  if (serviceType === "document_development") return "Document Development";
  if (serviceType === "incident_investigation") return "Investigation Facilitation";
  if (serviceType === "app_development") return "App Development";
  return "Estimate";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatSelectionLabel(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderTable(headers: string[], rows: string[][]) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid #d7dce1;">
      <thead>
        <tr>
          ${headers
            .map(
              (header, index) => `
                <th align="${index === 0 ? "left" : "center"}" style="padding:10px 12px;background:#f4f6f8;border-bottom:1px solid #d7dce1;color:#41505c;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">
                  ${escapeHtml(header)}
                </th>
              `
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                ${row
                  .map(
                    (cell, index) => `
                      <td align="${index === 0 ? "left" : "center"}" style="padding:10px 12px;border-bottom:1px solid #e6eaee;color:#20303d;font-size:14px;vertical-align:top;">
                        ${cell}
                      </td>
                    `
                  )
                  .join("")}
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
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
                ${escapeHtml(row.value)}
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
                      <h2 style="margin:0 0 10px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#5d6b76;">Detail</h2>
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

function buildCustomerEmail(payload: Required<PricingEstimatePayload>) {
  const serviceLabel = getServiceLabel(payload.serviceType);
  const summaryRows = [
    { label: "Business", value: payload.businessName },
    { label: "Estimate Type", value: serviceLabel },
    { label: "Total Hours", value: formatHours(payload.totalHours) },
    { label: "Subtotal ex GST", value: formatMoney(payload.subtotalExGst) },
    { label: "GST", value: formatMoney(payload.gstAmount) },
    { label: "Total inc GST", value: formatMoney(payload.totalIncGst) },
  ];

  let detailHtml = "";

  if (payload.serviceType === "document_development") {
    const lineItems = payload.breakdown.lineItems ?? [];
    detailHtml = renderTable(
      ["Document Type", "Qty", "Development Hrs", "Review Hrs", "Approval Hrs"],
      [
        ...lineItems.map((item) => [
          escapeHtml(item.label),
          escapeHtml(String(item.quantity)),
          escapeHtml(formatHours(item.developmentHours * item.quantity)),
          escapeHtml(formatHours(item.reviewHours * item.quantity)),
          escapeHtml(formatHours(item.finalApprovalHours * item.quantity)),
        ]),
        [
          "Discovery (New Business)",
          "1",
          escapeHtml(formatHours(payload.breakdown.discoveryIncluded ? 38 : 0)),
          "-",
          "-",
        ],
      ]
    );
  } else {
    detailHtml = renderTable(
      ["Item", "Selection", "Hours"],
      [[
        serviceLabel,
        escapeHtml(formatSelectionLabel(payload.breakdown.level ?? "-")),
        escapeHtml(formatHours(payload.totalHours)),
      ]]
    );
  }

  return {
    subject: `Your HSES price estimate for ${payload.businessName}`,
    html: renderEmailLayout({
      title: "Your HSES Price Estimate",
      intro: `Hi ${payload.name}, here is your requested ${serviceLabel.toLowerCase()} estimate from HSES Industry Partners.`,
      summaryHtml: renderSummaryRows(summaryRows),
      detailHtml,
      supportingText:
        "This is an estimate only and does not constitute a formal quote. If you have not received this email within 5 minutes on mobile, please check your spam folder or contact ask@hses.com.au.",
    }),
    text: [
      `Hi ${payload.name},`,
      ``,
      `Here is your requested ${serviceLabel.toLowerCase()} estimate from HSES Industry Partners.`,
      `Business: ${payload.businessName}`,
      `Total hours: ${formatHours(payload.totalHours)}`,
      `Subtotal ex GST: ${formatMoney(payload.subtotalExGst)}`,
      `GST: ${formatMoney(payload.gstAmount)}`,
      `Total inc GST: ${formatMoney(payload.totalIncGst)}`,
      ``,
      `This is an estimate only and does not constitute a formal quote.`,
    ].join("\n"),
  };
}

function buildInternalEmail(payload: Required<PricingEstimatePayload>) {
  const serviceLabel = getServiceLabel(payload.serviceType);
  const summaryRows = [
    { label: "Customer", value: payload.name },
    { label: "Business", value: payload.businessName },
    { label: "Email", value: payload.email },
    { label: "Estimate Type", value: serviceLabel },
    { label: "Total Hours", value: formatHours(payload.totalHours) },
    { label: "Total inc GST", value: formatMoney(payload.totalIncGst) },
  ];

  let detailHtml = "";

  if (payload.serviceType === "document_development") {
    const lineItems = payload.breakdown.lineItems ?? [];
    detailHtml = renderTable(
      ["Document Type", "Qty", "Development Hrs", "Review Hrs", "Approval Hrs"],
      [
        ...lineItems.map((item) => [
          escapeHtml(item.label),
          escapeHtml(String(item.quantity)),
          escapeHtml(formatHours(item.developmentHours * item.quantity)),
          escapeHtml(formatHours(item.reviewHours * item.quantity)),
          escapeHtml(formatHours(item.finalApprovalHours * item.quantity)),
        ]),
        [
          "Discovery (New Business)",
          "1",
          escapeHtml(formatHours(payload.breakdown.discoveryIncluded ? 38 : 0)),
          "-",
          "-",
        ],
      ]
    );
  } else {
    detailHtml = renderTable(
      ["Item", "Selection", "Hours"],
      [[
        serviceLabel,
        escapeHtml(formatSelectionLabel(payload.breakdown.level ?? "-")),
        escapeHtml(formatHours(payload.totalHours)),
      ]]
    );
  }

  return {
    subject: `Estimator used: ${payload.businessName} - ${serviceLabel}`,
    html: renderEmailLayout({
      title: "Pricing Estimator Submission",
      intro: `${payload.name} from ${payload.businessName} has used the HSES pricing estimator.`,
      summaryHtml: renderSummaryRows(summaryRows),
      detailHtml,
      supportingText:
        "This internal notice shows the estimate request submitted through the website pricing estimator.",
    }),
    text: [
      `Estimator submission received.`,
      `Customer: ${payload.name}`,
      `Business: ${payload.businessName}`,
      `Email: ${payload.email}`,
      `Estimate type: ${serviceLabel}`,
      `Total hours: ${formatHours(payload.totalHours)}`,
      `Total inc GST: ${formatMoney(payload.totalIncGst)}`,
    ].join("\n"),
  };
}

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !resendFromEmail) {
    return new Response("Missing email configuration.", { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as PricingEstimatePayload | null;
  if (!payload) {
    return new Response("Invalid request.", { status: 400 });
  }

  const name = payload.name?.trim() ?? "";
  const businessName = payload.businessName?.trim() ?? "";
  const email = payload.email?.trim() ?? "";
  const serviceType = payload.serviceType;

  if (!name || !businessName || !email || !serviceType) {
    return new Response("Missing required estimate details.", { status: 400 });
  }

  if (!email.includes("@")) {
    return new Response("Missing or invalid email address.", { status: 400 });
  }

  const normalizedPayload: Required<PricingEstimatePayload> = {
    name,
    businessName,
    email,
    serviceType,
    subtotalExGst: Number(payload.subtotalExGst ?? 0),
    gstAmount: Number(payload.gstAmount ?? 0),
    totalIncGst: Number(payload.totalIncGst ?? 0),
    totalHours: Number(payload.totalHours ?? 0),
    breakdown: {
      newBusiness: payload.breakdown?.newBusiness ?? "yes",
      discoveryIncluded: payload.breakdown?.discoveryIncluded ?? false,
      developmentHours: Number(payload.breakdown?.developmentHours ?? 0),
      reviewHours: Number(payload.breakdown?.reviewHours ?? 0),
      finalApprovalHours: Number(payload.breakdown?.finalApprovalHours ?? 0),
      lineItems: payload.breakdown?.lineItems ?? [],
      level: payload.breakdown?.level ?? "",
    },
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
