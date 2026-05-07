import { redirect } from "next/navigation";

export default async function DocumentExportPrintPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  redirect(`/dashboard/document-builder/${documentId}/export`);
}
