export const dynamic = "force-dynamic";

import { getUserIdFromToken } from "@/app/api/portal/_utils";
import { generateQuestionnaireSuggestions } from "@/lib/document-builder/ai/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string; questionKey: string }> },
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

  const { documentId, questionKey } = await params;

  try {
    const result = await generateQuestionnaireSuggestions({
      documentId,
      questionKey,
      userId,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Unable to generate AI suggestions.", {
      status: 500,
    });
  }
}
