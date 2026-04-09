import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const { id: quoteId } = await params;
  const supabase = createServiceRoleClient();
  if (!quoteId || quoteId === "undefined") {
    return new NextResponse("Missing quote id.", { status: 400 });
  }

  const quoteResponse = await supabase
    .from("quotes")
    .select("id,quote_number,title,status,organisation_id,contact_id,updated_at")
    .eq("id", quoteId)
    .single();

  if (quoteResponse.error) {
    return new NextResponse(quoteResponse.error.message, { status: 500 });
  }
  if (!quoteResponse.data) {
    return new NextResponse("Quote not found.", { status: 404 });
  }

  const versionResponse = await supabase
    .from("quote_versions")
    .select(
      "id,version_number,pricing_model,gst_enabled,gst_rate,prices_include_gst,subtotal_ex_gst,gst_amount,total_inc_gst,client_notes,assumptions,exclusions,terms,created_at"
    )
    .eq("quote_id", quoteId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  if (versionResponse.error) {
    return new NextResponse(versionResponse.error.message, { status: 500 });
  }
  if (!versionResponse.data) {
    return new NextResponse("Quote version not found.", { status: 404 });
  }

  const deliverablesResponse = await supabase
    .from("quote_deliverables")
    .select(
      "id,quote_version_id,deliverable_order,deliverable_title,deliverable_description,deliverable_status,pricing_mode,fixed_price_ex_gst,total_hours,default_client_rate,subtotal_ex_gst,cost_total,margin_amount,margin_percent,created_at"
    )
    .eq("quote_version_id", versionResponse.data.id)
    .order("deliverable_order", { ascending: true });

  if (deliverablesResponse.error) {
    return new NextResponse(deliverablesResponse.error.message, { status: 500 });
  }

  const deliverables = deliverablesResponse.data ?? [];
  const deliverableIds = deliverables.map((item) => item.id);

  const milestonesResponse = deliverableIds.length
    ? await supabase
        .from("quote_milestones")
        .select(
          "id,deliverable_id,milestone_order,milestone_title,milestone_description,pricing_unit,quantity,estimated_hours,billable,client_rate,client_amount_ex_gst,delivery_mode,supplier_name,cost_rate,cost_amount,margin_amount,margin_percent,created_at"
        )
        .in("deliverable_id", deliverableIds)
        .order("milestone_order", { ascending: true })
    : { data: [], error: null };

  if (milestonesResponse.error) {
    return new NextResponse(milestonesResponse.error.message, { status: 500 });
  }

  const contactResponse = quoteResponse.data.contact_id
    ? await supabase
        .from("contacts")
        .select("id,organisation_id,full_name,email,phone")
        .eq("id", quoteResponse.data.contact_id)
        .single()
    : { data: null, error: null };

  const attachmentsResponse = await supabase
    .from("quote_attachments")
    .select("id,quote_id,storage_bucket,storage_path,file_name,file_size,content_type,created_at")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false });

  if (attachmentsResponse.error) {
    return new NextResponse(attachmentsResponse.error.message, { status: 500 });
  }

  const attachments = (attachmentsResponse.data ?? []).map((attachment) => ({
    ...attachment,
    public_url: supabase.storage
      .from(attachment.storage_bucket)
      .getPublicUrl(attachment.storage_path).data.publicUrl,
  }));

  return NextResponse.json({
    quote: quoteResponse.data,
    version: versionResponse.data,
    deliverables,
    milestones: milestonesResponse.data ?? [],
    contact: contactResponse.data ?? null,
    attachments,
  });
}

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
    "title",
    "status",
    "organisation_id",
    "contact_id",
    "expires_at",
  ];
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in payload) {
      updateData[field] = payload[field];
    }
  }

  const { id: quoteId } = await params;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("quotes")
    .update(updateData)
    .eq("id", quoteId)
    .select("id,quote_number,title,status,organisation_id,contact_id,updated_at")
    .single();

  if (error || !data) {
    return new NextResponse(error?.message ?? "Unable to update quote.", { status: 500 });
  }

  return NextResponse.json({ quote: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const { id: quoteId } = await params;
  if (!quoteId || quoteId === "undefined") {
    return new NextResponse("Missing quote id.", { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const projectCheck = await supabase
    .from("projects")
    .select("id")
    .eq("quote_id", quoteId)
    .limit(1);

  if (projectCheck.error) {
    return new NextResponse(projectCheck.error.message, { status: 500 });
  }
  if ((projectCheck.data ?? []).length > 0) {
    return new NextResponse("Quotes linked to projects cannot be deleted.", { status: 400 });
  }

  const versionsResponse = await supabase
    .from("quote_versions")
    .select("id")
    .eq("quote_id", quoteId);

  if (versionsResponse.error) {
    return new NextResponse(versionsResponse.error.message, { status: 500 });
  }

  const versionIds = (versionsResponse.data ?? []).map((row) => row.id);
  if (versionIds.length) {
    const deliverablesResponse = await supabase
      .from("quote_deliverables")
      .select("id")
      .in("quote_version_id", versionIds);

    if (deliverablesResponse.error) {
      return new NextResponse(deliverablesResponse.error.message, { status: 500 });
    }

    const deliverableIds = (deliverablesResponse.data ?? []).map((row) => row.id);
    if (deliverableIds.length) {
      const milestonesDelete = await supabase
        .from("quote_milestones")
        .delete()
        .in("deliverable_id", deliverableIds);
      if (milestonesDelete.error) {
        return new NextResponse(milestonesDelete.error.message, { status: 500 });
      }
    }

    const deliverablesDelete = await supabase
      .from("quote_deliverables")
      .delete()
      .in("quote_version_id", versionIds);
    if (deliverablesDelete.error) {
      return new NextResponse(deliverablesDelete.error.message, { status: 500 });
    }

    const versionsDelete = await supabase
      .from("quote_versions")
      .delete()
      .in("id", versionIds);
    if (versionsDelete.error) {
      return new NextResponse(versionsDelete.error.message, { status: 500 });
    }
  }

  const attachmentsResponse = await supabase
    .from("quote_attachments")
    .select("id,storage_bucket,storage_path")
    .eq("quote_id", quoteId);

  if (attachmentsResponse.error) {
    return new NextResponse(attachmentsResponse.error.message, { status: 500 });
  }

  const attachmentsByBucket = new Map<string, string[]>();
  for (const attachment of attachmentsResponse.data ?? []) {
    const bucketPaths = attachmentsByBucket.get(attachment.storage_bucket) ?? [];
    bucketPaths.push(attachment.storage_path);
    attachmentsByBucket.set(attachment.storage_bucket, bucketPaths);
  }

  for (const [bucket, paths] of attachmentsByBucket.entries()) {
    const { error: storageDeleteError } = await supabase.storage.from(bucket).remove(paths);
    if (storageDeleteError) {
      return new NextResponse(storageDeleteError.message, { status: 500 });
    }
  }

  const accessCodesDelete = await supabase
    .from("quote_access_codes")
    .delete()
    .eq("quote_id", quoteId);
  if (accessCodesDelete.error) {
    return new NextResponse(accessCodesDelete.error.message, { status: 500 });
  }

  const quoteDelete = await supabase.from("quotes").delete().eq("id", quoteId);
  if (quoteDelete.error) {
    return new NextResponse(quoteDelete.error.message, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
