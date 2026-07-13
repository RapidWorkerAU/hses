import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { calculateQuoteVersionTotals } from "../quotes/calcTotals";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  let payload: {
    deliverable_id?: string;
    milestone_title?: string | null;
    milestone_description?: string | null;
    milestone_order?: number | null;
    pricing_unit?: string | null;
    quantity?: number | null;
    estimated_hours?: number | null;
    billable?: boolean | null;
    client_rate?: number | null;
    delivery_mode?: string | null;
    supplier_name?: string | null;
    cost_rate?: number | null;
  } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  if (!payload.deliverable_id) {
    return new NextResponse("Missing deliverable.", { status: 400 });
  }

  const supabase = createServiceRoleClient();
  let milestoneOrder = payload.milestone_order ?? null;
  if (milestoneOrder === null) {
    const { data: existing, error: orderError } = await supabase
      .from("quote_milestones")
      .select("milestone_order")
      .eq("deliverable_id", payload.deliverable_id)
      .order("milestone_order", { ascending: false })
      .limit(1)
      .single();

    if (orderError && orderError.code !== "PGRST116") {
      return new NextResponse(orderError.message, { status: 500 });
    }
    const lastOrder = existing?.milestone_order ?? 0;
    milestoneOrder = Number(lastOrder) + 1;
  }

  const { data, error } = await supabase
    .from("quote_milestones")
    .insert({
      deliverable_id: payload.deliverable_id,
      milestone_title: payload.milestone_title ?? "New milestone",
      milestone_description: payload.milestone_description ?? null,
      milestone_order: milestoneOrder,
      pricing_unit: payload.pricing_unit ?? "hours",
      quantity: payload.quantity ?? 1,
      estimated_hours: payload.estimated_hours ?? 1,
      billable: payload.billable ?? true,
      client_rate: payload.client_rate ?? null,
      delivery_mode: payload.delivery_mode ?? "in_house",
      supplier_name: payload.supplier_name ?? null,
      cost_rate: payload.cost_rate ?? null,
    })
    .select(
      "id,deliverable_id,milestone_order,milestone_title,milestone_description,pricing_unit,quantity,estimated_hours,billable,client_rate,client_amount_ex_gst,delivery_mode,supplier_name,cost_rate,cost_amount,margin_amount,margin_percent"
    )
    .single();

  if (error || !data) {
    return new NextResponse(error?.message ?? "Unable to create milestone.", { status: 500 });
  }

  const { data: deliverable, error: deliverableError } = await supabase
    .from("quote_deliverables")
    .select("id,quote_version_id")
    .eq("id", data.deliverable_id)
    .single();

  if (deliverableError || !deliverable) {
    return new NextResponse(deliverableError?.message ?? "Unable to load deliverable.", {
      status: 500,
    });
  }

  const { data: milestones, error: milestonesError } = await supabase
    .from("quote_milestones")
    .select("pricing_unit,estimated_hours,quantity")
    .eq("deliverable_id", data.deliverable_id);

  if (milestonesError) {
    return new NextResponse(milestonesError.message, { status: 500 });
  }

  const totalHours = (milestones ?? []).reduce((sum, milestone) => {
    const unit = milestone.pricing_unit ?? "hours";
    if (unit === "hours") return sum + (milestone.estimated_hours ?? 0);
    return sum + (milestone.quantity ?? 0);
  }, 0);

  const { error: deliverableUpdateError } = await supabase
    .from("quote_deliverables")
    .update({ total_hours: totalHours })
    .eq("id", data.deliverable_id);

  if (deliverableUpdateError) {
    return new NextResponse(deliverableUpdateError.message, { status: 500 });
  }

  const { data: version, error: versionError } = await supabase
    .from("quote_versions")
    .select("gst_enabled,gst_rate,prices_include_gst")
    .eq("id", deliverable.quote_version_id)
    .single();

  if (versionError || !version) {
    return new NextResponse(versionError?.message ?? "Unable to load totals.", {
      status: 500,
    });
  }

  const totals = await calculateQuoteVersionTotals(supabase, deliverable.quote_version_id, version);
  const { error: totalsError } = await supabase
    .from("quote_versions")
    .update(totals)
    .eq("id", deliverable.quote_version_id);

  if (totalsError) {
    return new NextResponse(totalsError.message, { status: 500 });
  }

  return NextResponse.json({ milestone: data });
}
