import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { rateLimit } from "@/lib/quote/rateLimit";

const leadRecipient = "ask@hses.com.au";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limit = rateLimit(`contact:${ip}`);
  if (!limit.allowed) {
    return new NextResponse("Too many requests. Please try again shortly.", {
      status: 429,
    });
  }

  const formData = await request.formData();

  if (getValue(formData, "bot-field")) {
    return NextResponse.redirect(new URL("/contact/success", request.url), 303);
  }

  const name = getValue(formData, "name");
  const email = getValue(formData, "email");
  const phone = getValue(formData, "phone");
  const company = getValue(formData, "company");
  const location = getValue(formData, "location");
  const need = getValue(formData, "need");
  const timing = getValue(formData, "timing");
  const context = getValue(formData, "context");

  if (!name || !email) {
    return new NextResponse("Name and email are required.", { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;
  if (!resendApiKey || !resendFromEmail) {
    return new NextResponse("Missing email configuration.", { status: 500 });
  }

  const rows = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone || "-"],
    ["Company", company || "-"],
    ["Location", location || "-"],
    ["Need", need || "-"],
    ["Preferred time", timing || "-"],
    ["Additional context", context || "-"],
  ];

  const text = [
    "New HSES website contact request",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");

  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#64748b;font-size:13px;font-weight:700;">${escapeHtml(label)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#0f172a;font-size:13px;">${escapeHtml(value).replace(/\n/g, "<br/>")}</td>
        </tr>
      `
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
      <h2 style="margin:0 0 12px;">New HSES website contact request</h2>
      <table style="border-collapse:collapse;width:100%;max-width:680px;border:1px solid #e5e7eb;">
        ${htmlRows}
      </table>
    </div>
  `;

  const resend = new Resend(resendApiKey);
  const result = await resend.emails.send({
    from: resendFromEmail,
    to: leadRecipient,
    reply_to: email,
    subject: `Website contact request from ${name}`,
    text,
    html,
  });

  if (result.error) {
    return new NextResponse(result.error.message || "Unable to send contact request.", {
      status: 500,
    });
  }

  return NextResponse.redirect(new URL("/contact/success", request.url), 303);
}
