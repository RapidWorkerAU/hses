import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildStyledDocumentPdf } from "./pdf";
import { loadDocumentExportPayload } from "./service";

const EXPORT_BUCKET = "documentexports";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "document";

const ensureProjectAccess = async (
  documentId: string,
  userId: string,
  supabase: ReturnType<typeof createServiceRoleClient>,
) => {
  const { data: project, error: projectError } = await supabase
    .schema("docbuilder")
    .from("document_projects")
    .select("id,owner_user_id")
    .eq("id", documentId)
    .maybeSingle<{ id: string; owner_user_id: string }>();

  if (projectError) {
    throw new Error(projectError.message || "Unable to load the document project.");
  }

  if (!project) {
    throw new Error("Document project not found.");
  }

  if (project.owner_user_id === userId) {
    return;
  }

  const { data: collaborator, error: collaboratorError } = await supabase
    .schema("docbuilder")
    .from("document_collaborators")
    .select("user_id")
    .eq("document_project_id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (collaboratorError) {
    throw new Error(collaboratorError.message || "Unable to verify document access.");
  }

  if (!collaborator) {
    throw new Error("You do not have access to this document project.");
  }
};

const ensureExportBucket = async (supabase: ReturnType<typeof createServiceRoleClient>) => {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(listError.message || "Unable to load storage buckets.");
  }

  if (buckets.some((bucket) => bucket.name === EXPORT_BUCKET)) return;

  const { error: createError } = await supabase.storage.createBucket(EXPORT_BUCKET, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
  });

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw new Error(createError.message || "Unable to create the export bucket.");
  }
};

export async function createPdfExportForDocument(documentId: string, userId: string) {
  const supabase = createServiceRoleClient();
  await ensureProjectAccess(documentId, userId, supabase);
  await ensureExportBucket(supabase);

  const payload = await loadDocumentExportPayload(documentId);
  const pdfBytes = await buildStyledDocumentPdf(payload);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const baseSlug = slugify(payload.projectTitle);
  const fileName = `${baseSlug}-${timestamp}.pdf`;
  const storagePath = `${documentId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(EXPORT_BUCKET)
    .upload(storagePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Unable to upload the PDF export.");
  }

  const { data: exportRow, error: exportInsertError } = await supabase
    .schema("docbuilder")
    .from("document_exports")
    .insert({
      document_project_id: documentId,
      export_type: "pdf",
      version_label: timestamp,
      storage_bucket: EXPORT_BUCKET,
      storage_path: storagePath,
      mime_type: "application/pdf",
      file_size: pdfBytes.byteLength,
      created_by_user_id: userId,
    })
    .select("id,storage_bucket,storage_path,created_at")
    .single();

  if (exportInsertError) {
    await supabase.storage.from(EXPORT_BUCKET).remove([storagePath]);
    throw new Error(exportInsertError.message || "Unable to save the document export record.");
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(EXPORT_BUCKET)
    .createSignedUrl(storagePath, 60 * 30);

  if (signedUrlError) {
    throw new Error(signedUrlError.message || "Unable to create the PDF download link.");
  }

  await supabase
    .schema("docbuilder")
    .from("document_projects")
    .update({ status: "exported" })
    .eq("id", documentId);

  return {
    export_id: (exportRow as { id: string }).id,
    download_url: signedUrlData.signedUrl,
    storage_bucket: EXPORT_BUCKET,
    storage_path: storagePath,
  };
}
