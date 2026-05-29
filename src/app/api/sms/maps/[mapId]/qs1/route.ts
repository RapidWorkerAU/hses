export const dynamic = "force-dynamic";

import { getOwnedSmsMap, getSmsAuth, sanitizeText } from "../../../_utils";

type Qs1Answers = {
  jurisdiction?: unknown;
  operationalContext?: unknown;
  industrySector?: unknown;
  workforceSize?: unknown;
  existingSms?: unknown;
  iso45001?: unknown;
  audience?: unknown;
  documentStyle?: unknown;
};

const allowedOperationalContext = new Set(["ongoing_operations", "project_based", "both"]);
const allowedWorkforceSize = new Set(["1-5", "6-20", "21-50", "51-200", "200+"]);
const allowedExistingSms = new Set(["yes", "partially", "no"]);
const allowedIso = new Set(["yes", "no", "not_sure"]);
const allowedAudience = new Set(["employees", "contractors", "visitors", "public"]);
const allowedDocumentStyle = new Set(["combined", "separate", "not_sure"]);

const responseLabels: Record<string, string> = {
  jurisdiction: "What country or state does this business operate in?",
  operational_context: "Is this safety system for ongoing operations or a specific project?",
  industry_sector: "What industry or sector does the business operate in?",
  workforce_size: "How many people work in the business?",
  existing_sms: "Does the business currently have a safety management system in place?",
  iso45001: "Is the business working toward or currently certified to ISO 45001?",
  audience_scope: "Will this system cover employees only, or contractors and visitors as well?",
  document_style: "How would you prefer your documents to be structured?",
};

const toStringArray = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ mapId: string }> }
) {
  const { mapId } = await params;
  const auth = await getSmsAuth(request);
  if (!auth.ok) return auth.response;

  let body: Qs1Answers;
  try {
    body = (await request.json()) as Qs1Answers;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const jurisdiction = sanitizeText(body.jurisdiction, 80);
  const operationalContext = sanitizeText(body.operationalContext, 40);
  const industrySector = sanitizeText(body.industrySector, 80);
  const workforceSize = sanitizeText(body.workforceSize, 20);
  const existingSms = sanitizeText(body.existingSms, 20);
  const iso45001 = sanitizeText(body.iso45001, 20);
  const audience = toStringArray(body.audience);
  const documentStyle = sanitizeText(body.documentStyle, 20);

  if (!jurisdiction) return Response.json({ error: "Jurisdiction is required." }, { status: 400 });
  if (!allowedOperationalContext.has(operationalContext)) return Response.json({ error: "Operational context is required." }, { status: 400 });
  if (!industrySector) return Response.json({ error: "Industry sector is required." }, { status: 400 });
  if (!allowedWorkforceSize.has(workforceSize)) return Response.json({ error: "Workforce size is required." }, { status: 400 });
  if (!allowedExistingSms.has(existingSms)) return Response.json({ error: "Existing SMS answer is required." }, { status: 400 });
  if (!allowedIso.has(iso45001)) return Response.json({ error: "ISO 45001 answer is required." }, { status: 400 });
  if (!audience.length || audience.some((item) => !allowedAudience.has(item))) {
    return Response.json({ error: "Audience selection is required." }, { status: 400 });
  }
  if (!allowedDocumentStyle.has(documentStyle)) return Response.json({ error: "Document style is required." }, { status: 400 });

  const { supabase, user } = auth;

  try {
    const map = await getOwnedSmsMap(supabase, mapId, user.id);
    if (!map) return Response.json({ error: "System map not found." }, { status: 404 });

    const { data: session, error: sessionError } = await supabase
      .schema("sms")
      .from("question_sessions")
      .select("id")
      .eq("map_id", map.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError || !session?.id) {
      throw new Error(sessionError?.message || "Question session not found.");
    }

    const audienceValue = audience.join(", ");
    const audienceFlag = audience.includes("public")
      ? "public_included"
      : audience.some((item) => item === "contractors" || item === "visitors")
        ? "contractors_included"
        : "employees_only";
    const mappedDocumentStyle = documentStyle === "not_sure" ? "mixed" : documentStyle;
    const mappedMaturity = existingSms === "yes" ? "improving_existing" : "new_build";
    const isoFlag = iso45001 === "yes";

    const rows = [
      ["jurisdiction", responseLabels.jurisdiction, jurisdiction],
      ["operational_context", responseLabels.operational_context, operationalContext],
      ["industry_sector", responseLabels.industry_sector, industrySector],
      ["workforce_size", responseLabels.workforce_size, workforceSize],
      ["existing_sms", responseLabels.existing_sms, existingSms],
      ["iso45001", responseLabels.iso45001, iso45001],
      ["audience_scope", responseLabels.audience_scope, audienceValue],
      ["document_style", responseLabels.document_style, documentStyle],
    ].map(([questionKey, questionLabel, responseValue]) => ({
      map_id: map.id,
      session_id: session.id,
      qs_group: questionKey === "document_style" || questionKey === "audience_scope" ? "preferences" : "QS1",
      question_key: questionKey,
      question_label: questionLabel,
      response_value: responseValue,
      response_type: "fixed",
      confidence: "confirmed",
    }));

    await supabase.schema("sms").from("responses").delete().eq("map_id", map.id).eq("session_id", session.id).in("question_key", rows.map((row) => row.question_key));

    const { error: responseError } = await supabase.schema("sms").from("responses").insert(rows);
    if (responseError) throw new Error(responseError.message);

    const { error: prefError } = await supabase
      .schema("sms")
      .from("pref_flags")
      .upsert(
        {
          map_id: map.id,
          jurisdiction,
          operational_context: operationalContext,
          is_iso45001: isoFlag,
          document_style: mappedDocumentStyle,
          audience: audienceFlag,
          system_maturity: mappedMaturity,
        },
        { onConflict: "map_id" }
      );

    if (prefError) throw new Error(prefError.message);

    const { data: updatedSession, error: updateSessionError } = await supabase
      .schema("sms")
      .from("question_sessions")
      .update({
        current_qs_group: "QS2",
        current_question_index: 0,
        last_active_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .select("id,map_id,current_qs_group,current_question_index,ai_conversation_history,gap_analysis_complete,last_active_at")
      .single();

    if (updateSessionError) throw new Error(updateSessionError.message);

    return Response.json({
      session: updatedSession,
      prefFlags: {
        jurisdiction,
        operational_context: operationalContext,
        is_iso45001: isoFlag,
        document_style: mappedDocumentStyle,
        audience: audienceFlag,
        system_maturity: mappedMaturity,
      },
      responses: rows,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save fixed questions." },
      { status: 500 }
    );
  }
}
