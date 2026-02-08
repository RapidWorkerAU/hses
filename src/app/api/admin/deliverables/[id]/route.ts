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
    "deliverable_title",
    "deliverable_description",
    "deliverable_status",
    "pricing_mode",
    "fixed_price_ex_gst",
    "total_hours",
    "default_client_rate",
    "deliverable_order",
  ];
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in payload) {
      updateData[field] = payload[field];
    }
  }

  const { id: deliverableId } = await params;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("quote_deliverables")
    .update(updateData)
    .eq("id", deliverableId)
    .select(
      "id,quote_version_id,deliverable_order,deliverable_title,deliverable_description,deliverable_status,pricing_mode,fixed_price_ex_gst,total_hours,default_client_rate,subtotal_ex_gst,cost_total,margin_amount,margin_percent"
    )
    .single();

  if (error || !data) {
    return new NextResponse(error?.message ?? "Unable to update deliverable.", { status: 500 });
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const { id: deliverableId } = await params;
  const supabase = createServiceRoleClient();
  const { data: existing, error: existingError } = await supabase
    .from("quote_deliverables")
    .select("id,quote_version_id")
    .eq("id", deliverableId)
    .single();

  if (existingError || !existing) {
    return new NextResponse(existingError?.message ?? "Unable to load deliverable.", {
      status: 500,
    });
  }

  const { error } = await supabase.from("quote_deliverables").delete().eq("id", deliverableId);

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  const { data: version, error: versionError } = await supabase
    .from("quote_versions")
    .select("gst_enabled,gst_rate,prices_include_gst")
    .eq("id", existing.quote_version_id)
    .single();

  if (versionError || !version) {
    return new NextResponse(versionError?.message ?? "Unable to load totals.", {
      status: 500,
    });
  }

  const totals = await calculateQuoteVersionTotals(
    supabase,
    existing.quote_version_id,
    version
  );
  const { error: totalsError } = await supabase
    .from("quote_versions")
    .update(totals)
    .eq("id", existing.quote_version_id);

  if (totalsError) {
    return new NextResponse(totalsError.message, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
