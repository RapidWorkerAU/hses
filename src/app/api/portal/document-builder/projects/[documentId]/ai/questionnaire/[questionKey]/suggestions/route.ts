export const dynamic = "force-dynamic";

import { getUserFromToken } from "@/app/api/portal/_utils";
import { generateQuestionnaireSuggestions } from "@/lib/document-builder/ai/service";
import { hasAdminEmail } from "@/lib/access/admin";

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
    const user = await getUserFromToken(token);
    if (!hasAdminEmail(user.email)) {
      return new Response("Document Builder is restricted to the site administrator.", {
        status: 403,
      });
    }
    userId = user.id;
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
