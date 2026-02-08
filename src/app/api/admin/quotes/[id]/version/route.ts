import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const { id: quoteId } = await params;
  const supabase = createServiceRoleClient();

  const latestVersionResponse = await supabase
    .from("quote_versions")
    .select("*")
    .eq("quote_id", quoteId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  if (latestVersionResponse.error || !latestVersionResponse.data) {
    return new NextResponse("No version to clone.", { status: 404 });
  }

  const latestVersion = latestVersionResponse.data;

  const { data: newVersion, error: insertError } = await supabase
    .from("quote_versions")
    .insert({
      quote_id: quoteId,
      version_number: Number(latestVersion.version_number) + 1,
      pricing_model: latestVersion.pricing_model,
      gst_enabled: latestVersion.gst_enabled,
      gst_rate: latestVersion.gst_rate,
      prices_include_gst: latestVersion.prices_include_gst,
      client_notes: latestVersion.client_notes,
      assumptions: latestVersion.assumptions,
      exclusions: latestVersion.exclusions,
      terms: latestVersion.terms,
    })
    .select("*")
    .single();

  if (insertError || !newVersion) {
    return new NextResponse(insertError?.message ?? "Unable to create version.", {
      status: 500,
    });
  }

  const deliverablesResponse = await supabase
    .from("quote_deliverables")
    .select("*")
    .eq("quote_version_id", latestVersion.id)
    .order("deliverable_order", { ascending: true });

  if (deliverablesResponse.error) {
    return new NextResponse(deliverablesResponse.error.message, { status: 500 });
  }

  const deliverables = deliverablesResponse.data ?? [];
  const idMap = new Map<string, string>();

  for (const deliverable of deliverables) {
    const { data: newDeliverable, error: deliverableError } = await supabase
      .from("quote_deliverables")
      .insert({
        quote_version_id: newVersion.id,
        deliverable_order: deliverable.deliverable_order,
        deliverable_title: deliverable.deliverable_title,
        deliverable_description: deliverable.deliverable_description,
        deliverable_status: deliverable.deliverable_status,
        pricing_mode: deliverable.pricing_mode,
        fixed_price_ex_gst: deliverable.fixed_price_ex_gst,
        total_hours: deliverable.total_hours,
        default_client_rate: deliverable.default_client_rate,
      })
      .select("id")
      .single();

    if (deliverableError || !newDeliverable) {
      return new NextResponse(
        deliverableError?.message ?? "Unable to copy deliverables.",
        { status: 500 }
      );
    }

    idMap.set(deliverable.id, newDeliverable.id);
  }

  const milestoneResponse = await supabase
    .from("quote_milestones")
    .select("*")
    .in(
      "deliverable_id",
      deliverables.map((item) => item.id)
    )
    .order("milestone_order", { ascending: true });

  if (milestoneResponse.error) {
    return new NextResponse(milestoneResponse.error.message, { status: 500 });
  }

  for (const milestone of milestoneResponse.data ?? []) {
    const newDeliverableId = idMap.get(milestone.deliverable_id);
    if (!newDeliverableId) continue;
    const { error: milestoneError } = await supabase.from("quote_milestones").insert({
      deliverable_id: newDeliverableId,
      milestone_order: milestone.milestone_order,
      milestone_title: milestone.milestone_title,
      milestone_description: milestone.milestone_description,
      pricing_unit: milestone.pricing_unit,
      quantity: milestone.quantity,
      estimated_hours: milestone.estimated_hours,
      billable: milestone.billable,
      client_rate: milestone.client_rate,
      delivery_mode: milestone.delivery_mode,
      supplier_name: milestone.supplier_name,
      cost_rate: milestone.cost_rate,
    });

    if (milestoneError) {
      return new NextResponse(milestoneError.message, { status: 500 });
    }
  }

  return NextResponse.json({ version_id: newVersion.id });
}
