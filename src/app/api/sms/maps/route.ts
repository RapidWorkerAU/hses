export const dynamic = "force-dynamic";

import { getSmsAuth, sanitizeText } from "../_utils";

type CreateSmsMapBody = {
  name?: unknown;
  description?: unknown;
};

export async function GET(request: Request) {
  const auth = await getSmsAuth(request);
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .schema("sms")
    .from("maps")
    .select("id,user_id,name,description,status,canvas_generated,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    const setupError =
      "code" in error && error.code === "PGRST106"
        ? "Supabase schema sms is not exposed to the API yet. Apply the sms expose-schema migration or add sms to the exposed schemas in Supabase settings."
        : null;

    return Response.json({ error: setupError || error.message || "Unable to load system maps." }, { status: setupError ? 503 : 500 });
  }

  return Response.json({ maps: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await getSmsAuth(request);
  if (!auth.ok) return auth.response;

  let body: CreateSmsMapBody;
  try {
    body = (await request.json()) as CreateSmsMapBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = sanitizeText(body.name, 160);
  const description = sanitizeText(body.description, 900);

  if (!name) {
    return Response.json({ error: "System map name is required." }, { status: 400 });
  }

  const { supabase, user } = auth;

  const { data: map, error: mapError } = await supabase
    .schema("sms")
    .from("maps")
    .insert({
      user_id: user.id,
      name,
      description: description || null,
      status: "draft",
      canvas_generated: false,
    })
    .select("id,name,description,status")
    .single();

  if (mapError || !map?.id) {
    const setupError =
      mapError && "code" in mapError && mapError.code === "PGRST106"
        ? "Supabase schema sms is not exposed to the API yet. Apply the sms expose-schema migration or add sms to the exposed schemas in Supabase settings."
        : null;

    return Response.json({ error: setupError || mapError?.message || "Unable to create system map." }, { status: setupError ? 503 : 500 });
  }

  const { data: session, error: sessionError } = await supabase
    .schema("sms")
    .from("question_sessions")
    .insert({
      map_id: map.id,
      current_qs_group: "QS1",
      current_question_index: 0,
      ai_conversation_history: [],
      last_active_at: new Date().toISOString(),
    })
    .select("id,current_qs_group,current_question_index")
    .single();

  if (sessionError || !session?.id) {
    await supabase.schema("sms").from("maps").delete().eq("id", map.id).eq("user_id", user.id);
    return Response.json({ error: sessionError?.message || "Unable to start the question session." }, { status: 500 });
  }

  return Response.json({
    map,
    session,
    href: `/dashboard/system-architect/${map.id}/intake`,
  });
}

export async function DELETE(request: Request) {
  const auth = await getSmsAuth(request);
  if (!auth.ok) return auth.response;

  let body: { ids?: unknown };
  try {
    body = (await request.json()) as { ids?: unknown };
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0).slice(0, 100)
    : [];

  if (!ids.length) {
    return Response.json({ error: "No system maps selected." }, { status: 400 });
  }

  const { supabase, user } = auth;
  const { error } = await supabase
    .schema("sms")
    .from("maps")
    .delete()
    .eq("user_id", user.id)
    .in("id", ids);

  if (error) {
    return Response.json({ error: error.message || "Unable to delete system maps." }, { status: 500 });
  }

  return Response.json({ deletedIds: ids });
}
