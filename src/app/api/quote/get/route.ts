import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { readQuoteSessionToken, quoteSessionCookie } from "@/lib/quote/session";
import type { QuotePublicPayload } from "@/lib/quote/types";

export async function GET(request: Request) {
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

  const supabase = createServiceRoleClient();

  const quoteResponse = await supabase
    .from("quotes")
    .select("id,title,quote_number,status,published_at,expires_at,currency")
    .eq("id", quoteId)
    .single();

  if (quoteResponse.error || !quoteResponse.data) {
    return new NextResponse("Quote not found.", { status: 404 });
  }

  const versionResponse = await supabase
    .from("quote_versions")
    .select(
      "id,version_number,pricing_model,gst_enabled,gst_rate,prices_include_gst,subtotal_ex_gst,gst_amount,total_inc_gst,client_notes,assumptions,exclusions,terms"
    )
    .eq("quote_id", quoteId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  if (versionResponse.error || !versionResponse.data) {
    return new NextResponse("Quote version not found.", { status: 404 });
  }

  const deliverablesResponse = await supabase
    .from("quote_deliverables")
    .select(
      "id,deliverable_order,deliverable_title,deliverable_description,deliverable_status,pricing_mode,fixed_price_ex_gst,total_hours,default_client_rate,subtotal_ex_gst,cost_total,margin_amount,margin_percent"
    )
    .eq("quote_version_id", versionResponse.data.id)
    .order("deliverable_order", { ascending: true });

  if (deliverablesResponse.error) {
    return new NextResponse("Unable to load deliverables.", { status: 500 });
  }

  const deliverables = deliverablesResponse.data ?? [];
  const deliverableIds = deliverables.map((item) => item.id);

  const milestonesResponse = deliverableIds.length
    ? await supabase
        .from("quote_milestones")
        .select(
          "id,deliverable_id,milestone_order,milestone_title,milestone_description,pricing_unit,quantity,estimated_hours,billable,client_rate,client_amount_ex_gst,delivery_mode,supplier_name,cost_rate,cost_amount,margin_amount,margin_percent"
        )
        .in("deliverable_id", deliverableIds)
        .order("milestone_order", { ascending: true })
    : {
        data: [] as Array<{
          id: string;
          deliverable_id: string;
          milestone_order: number | null;
          milestone_title: string | null;
          milestone_description: string | null;
          pricing_unit: string | null;
          quantity: number | null;
          estimated_hours: number | null;
          billable: boolean | null;
          client_rate: number | null;
          client_amount_ex_gst: number | null;
          delivery_mode: string | null;
          supplier_name: string | null;
          cost_rate: number | null;
          cost_amount: number | null;
          margin_amount: number | null;
          margin_percent: number | null;
        }>,
        error: null,
      };

  if (milestonesResponse.error) {
    return new NextResponse("Unable to load milestones.", { status: 500 });
  }

  const latestActionResponse = await supabase
    .from("quote_client_actions")
    .select("action,client_name,note,created_at")
    .eq("quote_id", quoteId)
    .in("action", ["approved", "rejected"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestActionResponse.error) {
    return new NextResponse("Unable to load quote status.", { status: 500 });
  }

  const payload: QuotePublicPayload = {
    quote: {
      title: quoteResponse.data.title,
      quote_number: quoteResponse.data.quote_number,
      status: quoteResponse.data.status,
      published_at: quoteResponse.data.published_at,
      expires_at: quoteResponse.data.expires_at,
      currency: quoteResponse.data.currency ?? null,
    },
    latest_action:
      quoteResponse.data.status === "approved" ||
      quoteResponse.data.status === "rejected"
        ? latestActionResponse.data ?? null
        : null,
    version: versionResponse.data,
    deliverables,
    milestones: milestonesResponse.data ?? [],
  };

  return NextResponse.json(payload);
}
