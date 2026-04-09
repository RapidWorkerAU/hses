import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const { id: attachmentId } = await params;
  const supabase = createServiceRoleClient();
  const existingResponse = await supabase
    .from("quote_attachments")
    .select("id,storage_bucket,storage_path")
    .eq("id", attachmentId)
    .single();

  if (existingResponse.error || !existingResponse.data) {
    return new NextResponse(existingResponse.error?.message ?? "Attachment not found.", {
      status: 404,
    });
  }

  const storageDelete = await supabase
    .storage
    .from(existingResponse.data.storage_bucket)
    .remove([existingResponse.data.storage_path]);

  if (storageDelete.error) {
    return new NextResponse(storageDelete.error.message, { status: 500 });
  }

  const deleteResponse = await supabase
    .from("quote_attachments")
    .delete()
    .eq("id", attachmentId);

  if (deleteResponse.error) {
    return new NextResponse(deleteResponse.error.message, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
