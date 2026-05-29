export const dynamic = "force-dynamic";

import { getOwnedSmsMap, getSmsAuth } from "../../../_utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mapId: string }> }
) {
  const { mapId } = await params;
  const auth = await getSmsAuth(request);
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;

  try {
    const map = await getOwnedSmsMap(supabase, mapId, user.id);
    if (!map) {
      return Response.json({ error: "System map not found." }, { status: 404 });
    }

    const [sessionResult, prefResult, responsesResult, gapsResult] = await Promise.all([
      supabase
        .schema("sms")
        .from("question_sessions")
        .select("id,map_id,current_qs_group,current_question_index,ai_conversation_history,gap_analysis_complete,last_active_at,created_at,updated_at")
        .eq("map_id", map.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.schema("sms").from("pref_flags").select("*").eq("map_id", map.id).maybeSingle(),
      supabase
        .schema("sms")
        .from("responses")
        .select("id,map_id,session_id,qs_group,question_key,question_label,response_value,response_type,confidence,created_at,updated_at")
        .eq("map_id", map.id)
        .order("created_at", { ascending: true }),
      supabase
        .schema("sms")
        .from("gap_log")
        .select("id,qs_group,gap_description,follow_up_question,resolved,resolution_response,created_at")
        .eq("map_id", map.id)
        .order("created_at", { ascending: true }),
    ]);

    if (sessionResult.error) throw new Error(sessionResult.error.message);
    if (prefResult.error) throw new Error(prefResult.error.message);
    if (responsesResult.error) throw new Error(responsesResult.error.message);
    if (gapsResult.error) throw new Error(gapsResult.error.message);

    return Response.json({
      map,
      session: sessionResult.data,
      prefFlags: prefResult.data,
      responses: responsesResult.data ?? [],
      gaps: gapsResult.data ?? [],
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load intake." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ mapId: string }> }
) {
  const { mapId } = await params;
  const auth = await getSmsAuth(request);
  if (!auth.ok) return auth.response;

  let body: { action?: unknown };
  try {
    body = (await request.json()) as { action?: unknown };
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.action !== "restart") {
    return Response.json({ error: "Unsupported intake action." }, { status: 400 });
  }

  const { supabase, user } = auth;

  try {
    const map = await getOwnedSmsMap(supabase, mapId, user.id);
    if (!map) {
      return Response.json({ error: "System map not found." }, { status: 404 });
    }

    const deleteSteps = [
      supabase.schema("sms").from("edges").delete().eq("map_id", map.id),
      supabase.schema("sms").from("nodes").delete().eq("map_id", map.id),
      supabase.schema("sms").from("zones").delete().eq("map_id", map.id),
      supabase.schema("sms").from("pref_flags").delete().eq("map_id", map.id),
      supabase.schema("sms").from("question_sessions").delete().eq("map_id", map.id),
    ];

    for (const step of deleteSteps) {
      const { error } = await step;
      if (error) throw new Error(error.message);
    }

    const { data: session, error: sessionError } = await supabase
      .schema("sms")
      .from("question_sessions")
      .insert({
        map_id: map.id,
        current_qs_group: "QS1",
        current_question_index: 0,
        ai_conversation_history: [],
        gap_analysis_complete: false,
        last_active_at: new Date().toISOString(),
      })
      .select("id,map_id,current_qs_group,current_question_index,ai_conversation_history,gap_analysis_complete,last_active_at,created_at,updated_at")
      .single();

    if (sessionError || !session?.id) {
      throw new Error(sessionError?.message || "Unable to restart the intake session.");
    }

    const { error: mapUpdateError } = await supabase
      .schema("sms")
      .from("maps")
      .update({
        status: "draft",
        canvas_generated: false,
      })
      .eq("id", map.id)
      .eq("user_id", user.id);

    if (mapUpdateError) throw new Error(mapUpdateError.message);

    return Response.json({
      map: {
        ...map,
        status: "draft",
        canvas_generated: false,
      },
      session,
      prefFlags: null,
      responses: [],
      gaps: [],
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to restart intake." },
      { status: 500 }
    );
  }
}
