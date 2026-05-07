import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";

const resolveDocumentProjectHref = (documentId: string, status: string | null | undefined) => {
  if (status === "exported") {
    return `/dashboard/document-builder/${documentId}/export`;
  }

  if (status && ["editing", "generating", "review", "ready"].includes(status)) {
    return `/dashboard/document-builder/${documentId}/edit`;
  }

  return `/dashboard/document-builder/${documentId}/questions`;
};

export default async function DocumentProjectPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const supabase = createServiceRoleClient();

  const { data } = await supabase
    .schema("docbuilder")
    .from("document_projects")
    .select("status")
    .eq("id", documentId)
    .maybeSingle<{ status: string }>();

  redirect(resolveDocumentProjectHref(documentId, data?.status));
}
