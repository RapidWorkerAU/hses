import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { calculateQuoteVersionTotals } from "../../quotes/calcTotals";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  const allowedFields = [
    "milestone_title",
    "milestone_description",
    "pricing_unit",
    "quantity",
    "estimated_hours",
    "billable",
    "client_rate",
    "delivery_mode",
    "supplier_name",
    "cost_rate",
    "milestone_order",
  ];
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in payload) {
      updateData[field] = payload[field];
    }
  }

  const { id: milestoneId } = await params;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("quote_milestones")
    .update(updateData)
    .eq("id", milestoneId)
    .select(
      "id,deliverable_id,milestone_order,milestone_title,milestone_description,pricing_unit,quantity,estimated_hours,billable,client_rate,client_amount_ex_gst,delivery_mode,supplier_name,cost_rate,cost_amount,margin_amount,margin_percent"
    )
    .single();

  if (error || !data) {
    return new NextResponse(error?.message ?? "Unable to update milestone.", { status: 500 });
  }

  return NextResponse.json({ milestone: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const { id: milestoneId } = await params;
  if (!milestoneId || milestoneId === "undefined") {
    return new NextResponse("Missing milestone id.", { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: existing, error: existingError } = await supabase
    .from("quote_milestones")
    .select("id,deliverable_id")
    .eq("id", milestoneId)
    .single();

  if (existingError || !existing) {
    return new NextResponse(existingError?.message ?? "Unable to load milestone.", {
      status: 404,
    });
  }

  const { data: deliverable, error: deliverableError } = await supabase
    .from("quote_deliverables")
    .select("id,quote_version_id")
    .eq("id", existing.deliverable_id)
    .single();

  if (deliverableError || !deliverable) {
    return new NextResponse(deliverableError?.message ?? "Unable to load deliverable.", {
      status: 500,
    });
  }

  const { data: projectMilestone, error: projectMilestoneError } = await supabase
    .from("project_milestones")
    .select("id")
    .eq("source_milestone_id", milestoneId)
    .limit(1)
    .maybeSingle();

  if (projectMilestoneError) {
    return new NextResponse(projectMilestoneError.message, { status: 500 });
  }

  if (projectMilestone) {
    return new NextResponse(
      "This milestone is already linked to a project and cannot be deleted from the quote.",
      { status: 409 }
    );
  }

  const { error } = await supabase.from("quote_milestones").delete().eq("id", milestoneId);

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  const { data: remainingMilestones, error: remainingError } = await supabase
    .from("quote_milestones")
    .select("pricing_unit,estimated_hours,quantity")
    .eq("deliverable_id", existing.deliverable_id);

  if (remainingError) {
    return new NextResponse(remainingError.message, { status: 500 });
  }

  const totalHours = (remainingMilestones ?? []).reduce((sum, milestone) => {
    const unit = milestone.pricing_unit ?? "hours";
    if (unit === "hours") {
      return sum + (milestone.estimated_hours ?? 0);
    }
    return sum + (milestone.quantity ?? 0);
  }, 0);

  const { error: deliverableUpdateError } = await supabase
    .from("quote_deliverables")
    .update({ total_hours: totalHours })
    .eq("id", existing.deliverable_id);

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

  const totals = await calculateQuoteVersionTotals(
    supabase,
    deliverable.quote_version_id,
    version
  );
  const { error: totalsError } = await supabase
    .from("quote_versions")
    .update(totals)
    .eq("id", deliverable.quote_version_id);

  if (totalsError) {
    return new NextResponse(totalsError.message, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
