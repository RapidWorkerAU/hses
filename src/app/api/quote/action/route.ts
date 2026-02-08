import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAnonServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { readQuoteSessionToken, quoteSessionCookie } from "@/lib/quote/session";

type ActionPayload = {
  action?: "viewed" | "noted" | "approved" | "rejected";
  note?: string | null;
  client_name?: string | null;
};

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const tokenMatch = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${quoteSessionCookie.name}=`));
  const token = tokenMatch?.split("=")[1] ?? null;
  const quoteId = readQuoteSessionToken(token);

  if (!quoteId) {
    return new NextResponse("Unauthorized.", { status: 401 });
  }

  let payload: ActionPayload = {};
  try {
    payload = (await request.json()) as ActionPayload;
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  const action = payload.action;
  const clientName = payload.client_name?.trim() ?? "";
  const note = payload.note?.trim() ?? null;

  if (!action) {
    return new NextResponse("Missing action.", { status: 400 });
  }

  if (action !== "viewed" && !clientName) {
    return new NextResponse("Please provide your name.", { status: 400 });
  }

  if (action === "rejected" && !note) {
    return new NextResponse("Please include a reason for rejection.", { status: 400 });
  }

  const supabase = createAnonServerClient();
  const { error } = await supabase.rpc("add_quote_client_action", {
    p_quote_id: quoteId,
    p_action: action,
    p_note: note,
    p_client_name: clientName || null,
  });

  if (error) {
    return new NextResponse("Unable to record action.", { status: 500 });
  }

  if (action === "approved" || action === "rejected") {
    const service = createServiceRoleClient();
    const nextStatus = action === "approved" ? "approved" : "rejected";
    const { error: statusError } = await service
      .from("quotes")
      .update({ status: nextStatus })
      .eq("id", quoteId);

    if (statusError) {
      console.error("Quote status update failed:", statusError);
      return new NextResponse(
        `Unable to update quote status: ${statusError.message ?? "unknown error"}`,
        { status: 500 }
      );
    }
  }

  if (action === "approved") {
    const service = createServiceRoleClient();
    const { data: existingProject, error: projectLookupError } = await service
      .from("projects")
      .select("id")
      .eq("quote_id", quoteId)
      .maybeSingle();

    if (projectLookupError) {
      return new NextResponse("Unable to check project status.", { status: 500 });
    }

    if (!existingProject) {
      const { error: projectError } = await service.rpc("create_project_from_quote", {
        p_quote_id: quoteId,
      });

      if (projectError) {
        return new NextResponse("Unable to create project.", { status: 500 });
      }
    }
  }

  if (action === "approved" || action === "rejected") {
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;
    if (!resendApiKey || !resendFromEmail) {
      return NextResponse.json(
        { ok: true, email_failed: true, email_error: "Missing email configuration." },
        { status: 200 }
      );
    }

    const service = createServiceRoleClient();
    const quoteResponse = await service
      .from("quotes")
      .select("id,quote_number,title,organisation_id,contact_id,currency")
      .eq("id", quoteId)
      .single();

    if (quoteResponse.error || !quoteResponse.data) {
      return NextResponse.json(
        { ok: true, email_failed: true, email_error: "Unable to load quote details." },
        { status: 200 }
      );
    }

    const versionResponse = await service
      .from("quote_versions")
      .select("id,version_number,subtotal_ex_gst,gst_amount,total_inc_gst")
      .eq("quote_id", quoteId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    if (versionResponse.error || !versionResponse.data) {
      return NextResponse.json(
        { ok: true, email_failed: true, email_error: "Unable to load quote totals." },
        { status: 200 }
      );
    }

    const deliverablesResponse = await service
      .from("quote_deliverables")
      .select(
        "deliverable_order,deliverable_title,pricing_mode,fixed_price_ex_gst,total_hours,default_client_rate,subtotal_ex_gst"
      )
      .eq("quote_version_id", versionResponse.data.id)
      .order("deliverable_order", { ascending: true });

    if (deliverablesResponse.error) {
      return NextResponse.json(
        { ok: true, email_failed: true, email_error: "Unable to load deliverables." },
        { status: 200 }
      );
    }

    const deliverables = deliverablesResponse.data ?? [];
    const totalHours = deliverables.reduce((sum, deliverable) => {
      if (deliverable.pricing_mode === "fixed_price") return sum;
      return sum + (deliverable.total_hours ?? 0);
    }, 0);

    const orgId = quoteResponse.data.organisation_id;
    const contactId = quoteResponse.data.contact_id;

    const [orgResponse, contactResponse] = await Promise.all([
      orgId
        ? service
            .from("organisations")
            .select("name")
            .eq("id", orgId)
            .single()
        : Promise.resolve({ data: null, error: null }),
      contactId
        ? service
            .from("contacts")
            .select("full_name,email,phone")
            .eq("id", contactId)
            .single()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const currency = quoteResponse.data.currency ?? "AUD";
    const formatMoney = (value: number | null | undefined) =>
      value === null || value === undefined
        ? "-"
        : new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
          }).format(value);

    const deliverableLines = deliverables
      .map((deliverable, index) => {
        const title = deliverable.deliverable_title ?? `Deliverable ${index + 1}`;
        const isFixed = deliverable.pricing_mode === "fixed_price";
        const hours = isFixed ? null : deliverable.total_hours ?? 0;
        const unitRate = isFixed
          ? deliverable.fixed_price_ex_gst ?? 0
          : deliverable.default_client_rate ?? 0;
        const subtotal =
          deliverable.subtotal_ex_gst ??
          (isFixed ? deliverable.fixed_price_ex_gst ?? 0 : unitRate * (hours ?? 0));

        if (isFixed) {
          return `- ${title} (Fixed): ${formatMoney(subtotal)}`;
        }

        return `- ${title}: ${hours} hrs @ ${formatMoney(unitRate)} = ${formatMoney(subtotal)}`;
      })
      .join("\n");

    const organisationName = orgResponse?.data?.name ?? "Unknown organisation";
    const contactName = contactResponse?.data?.full_name ?? "Unknown contact";
    const contactEmail = contactResponse?.data?.email ?? "-";
    const contactPhone = contactResponse?.data?.phone ?? "-";

    const subject = `Quote ${quoteResponse.data.quote_number ?? ""} ${action.toUpperCase()}`.trim();
    const message = [
      `Quote ${action}:`,
      `Quote number: ${quoteResponse.data.quote_number ?? "-"}`,
      `Quote title: ${quoteResponse.data.title ?? "-"}`,
      `Organisation: ${organisationName}`,
      `Contact: ${contactName}`,
      `Contact email: ${contactEmail}`,
      `Contact phone: ${contactPhone}`,
      ``,
      `Deliverables:`,
      deliverableLines || "-",
      ``,
      `Total hours: ${totalHours}`,
      `Total amount: ${formatMoney(versionResponse.data.total_inc_gst)}`,
      ``,
      `Accepted/Rejected by: ${clientName || "-"}`,
      `Notes: ${note ?? "-"}`,
    ].join("\n");

    const resend = new Resend(resendApiKey);
    const sendResult = await resend.emails.send({
      from: resendFromEmail,
      to: "ask@hses.com.au",
      subject,
      text: message,
    });

    if (sendResult.error) {
      return NextResponse.json(
        { ok: true, email_failed: true, email_error: "Unable to send notification email." },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
