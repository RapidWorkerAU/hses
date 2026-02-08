import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

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
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("quote_milestones").delete().eq("id", milestoneId);

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
