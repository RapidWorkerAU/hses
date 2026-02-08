import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { calculateQuoteVersionTotals } from "../quotes/calcTotals";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  let payload: {
    quote_version_id?: string;
    deliverable_title?: string | null;
    deliverable_description?: string | null;
    deliverable_order?: number | null;
    deliverable_status?: string | null;
    pricing_mode?: string | null;
    fixed_price_ex_gst?: number | null;
    default_client_rate?: number | null;
  } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  if (!payload.quote_version_id) {
    return new NextResponse("Missing quote version.", { status: 400 });
  }

  const supabase = createServiceRoleClient();
  let deliverableOrder = payload.deliverable_order ?? null;
  if (deliverableOrder === null) {
    const { data: existing, error: orderError } = await supabase
      .from("quote_deliverables")
      .select("deliverable_order")
      .eq("quote_version_id", payload.quote_version_id)
      .order("deliverable_order", { ascending: false })
      .limit(1)
      .single();

    if (orderError && orderError.code !== "PGRST116") {
      return new NextResponse(orderError.message, { status: 500 });
    }
    const lastOrder = existing?.deliverable_order ?? 0;
    deliverableOrder = Number(lastOrder) + 1;
  }

  const { data, error } = await supabase
    .from("quote_deliverables")
    .insert({
      quote_version_id: payload.quote_version_id,
      deliverable_title: payload.deliverable_title ?? "New deliverable",
      deliverable_description: payload.deliverable_description ?? null,
      deliverable_order: deliverableOrder,
      deliverable_status: payload.deliverable_status ?? "draft",
      pricing_mode: payload.pricing_mode ?? "rolled_up_hours",
      fixed_price_ex_gst: payload.fixed_price_ex_gst ?? null,
      default_client_rate: payload.default_client_rate ?? null,
    })
    .select(
      "id,quote_version_id,deliverable_order,deliverable_title,deliverable_description,deliverable_status,pricing_mode,fixed_price_ex_gst,total_hours,default_client_rate,subtotal_ex_gst,cost_total,margin_amount,margin_percent"
    )
    .single();

  if (error || !data) {
    return new NextResponse(error?.message ?? "Unable to create deliverable.", { status: 500 });
  }

  const { data: version, error: versionError } = await supabase
    .from("quote_versions")
    .select("gst_enabled,gst_rate,prices_include_gst")
    .eq("id", data.quote_version_id)
    .single();

  if (versionError || !version) {
    return new NextResponse(versionError?.message ?? "Unable to load totals.", {
      status: 500,
    });
  }

  const totals = await calculateQuoteVersionTotals(supabase, data.quote_version_id, version);
  const { error: totalsError } = await supabase
    .from("quote_versions")
    .update(totals)
    .eq("id", data.quote_version_id);

  if (totalsError) {
    return new NextResponse(totalsError.message, { status: 500 });
  }

  return NextResponse.json({ deliverable: data });
}
