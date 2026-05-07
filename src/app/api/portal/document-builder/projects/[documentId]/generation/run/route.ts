export const dynamic = "force-dynamic";

import { getUserIdFromToken } from "@/app/api/portal/_utils";
import { runDocumentGeneration } from "@/lib/document-builder/generation/service";

type RunRequestBody = {
  sectionId?: string | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return new Response("Missing bearer token.", { status: 401 });
  }

  let userId: string;
  try {
    userId = await getUserIdFromToken(token);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Unable to validate session.", {
      status: 401,
    });
  }

  const { documentId } = await params;
  const body = (await request.json().catch(() => ({}))) as RunRequestBody;

  try {
    const result = await runDocumentGeneration({
      documentId,
      userId,
      sectionId: body.sectionId ?? null,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Unable to run document generation.", {
      status: 500,
    });
  }
}
