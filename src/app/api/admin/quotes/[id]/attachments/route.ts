import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

const bucketName = "adminattachments";

const sanitizeFileName = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9.\-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const { id: quoteId } = await params;
  if (!quoteId || quoteId === "undefined") {
    return new NextResponse("Missing quote id.", { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new NextResponse("Invalid upload.", { status: 400 });
  }

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!files.length) {
    return new NextResponse("Select at least one file to upload.", { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const uploaded: Array<{
    id: string;
    quote_id: string;
    storage_bucket: string;
    storage_path: string;
    file_name: string;
    file_size: number | null;
    content_type: string | null;
    created_at: string;
    public_url: string;
  }> = [];

  for (const file of files) {
    const safeName = sanitizeFileName(file.name || "attachment");
    const storagePath = `${quoteId}/${crypto.randomUUID()}-${safeName || "attachment"}`;
    const uploadResult = await supabase.storage.from(bucketName).upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

    if (uploadResult.error) {
      return new NextResponse(uploadResult.error.message, { status: 500 });
    }

    const insertResult = await supabase
      .from("quote_attachments")
      .insert({
        quote_id: quoteId,
        storage_bucket: bucketName,
        storage_path: storagePath,
        file_name: file.name || safeName || "Attachment",
        file_size: file.size || null,
        content_type: file.type || null,
      })
      .select("id,quote_id,storage_bucket,storage_path,file_name,file_size,content_type,created_at")
      .single();

    if (insertResult.error || !insertResult.data) {
      await supabase.storage.from(bucketName).remove([storagePath]);
      return new NextResponse(insertResult.error?.message ?? "Unable to save attachment.", {
        status: 500,
      });
    }

    uploaded.push({
      ...insertResult.data,
      public_url: supabase.storage.from(bucketName).getPublicUrl(storagePath).data.publicUrl,
    });
  }

  return NextResponse.json({ attachments: uploaded });
}
