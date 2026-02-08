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
    "pricing_model",
    "gst_enabled",
    "gst_rate",
    "prices_include_gst",
    "client_notes",
    "assumptions",
    "exclusions",
    "terms",
  ];
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in payload) {
      updateData[field] = payload[field];
    }
  }

  const { id: versionId } = await params;
  const supabase = createServiceRoleClient();
  const { data: existingVersion, error: existingError } = await supabase
    .from("quote_versions")
    .select("gst_enabled,gst_rate,prices_include_gst")
    .eq("id", versionId)
    .single();

  if (existingError || !existingVersion) {
    return new NextResponse(existingError?.message ?? "Unable to load version.", {
      status: 500,
    });
  }

  const effectiveFlags = {
    gst_enabled:
      (updateData.gst_enabled as boolean | null | undefined) ?? existingVersion.gst_enabled,
    gst_rate: (updateData.gst_rate as number | null | undefined) ?? existingVersion.gst_rate,
    prices_include_gst:
      (updateData.prices_include_gst as boolean | null | undefined) ??
      existingVersion.prices_include_gst,
  };

  const totals = await calculateQuoteVersionTotals(supabase, versionId, effectiveFlags);

  const { data, error } = await supabase
    .from("quote_versions")
    .update({ ...updateData, ...totals })
    .eq("id", versionId)
    .select(
      "id,version_number,pricing_model,gst_enabled,gst_rate,prices_include_gst,subtotal_ex_gst,gst_amount,total_inc_gst,client_notes,assumptions,exclusions,terms"
    )
    .single();

  if (error || !data) {
    return new NextResponse(error?.message ?? "Unable to update version.", { status: 500 });
  }

  return NextResponse.json({ version: data });
}
