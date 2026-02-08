import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  if (!id || id === "undefined") {
    return new NextResponse("Missing time entry id.", { status: 400 });
  }

  let payload: {
    hours?: number;
    note?: string | null;
    entry_date?: string | null;
    project_milestone_id?: string;
  } = {};
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  const hours = Number(payload.hours ?? 0);
  if (!Number.isFinite(hours) || hours <= 0) {
    return new NextResponse("Hours must be greater than 0.", { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("project_time_entries")
    .update({
      hours,
      note: payload.note ?? null,
      entry_date: payload.entry_date ?? null,
      project_milestone_id: payload.project_milestone_id,
    })
    .eq("id", id)
    .select("id,project_milestone_id,entry_date,hours,note,created_at")
    .single();

  if (error || !data) {
    return new NextResponse(error?.message ?? "Unable to update time entry.", { status: 500 });
  }

  return NextResponse.json({ entry: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  if (!id || id === "undefined") {
    return new NextResponse("Missing time entry id.", { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("project_time_entries").delete().eq("id", id);

  if (error) {
    return new NextResponse(error.message ?? "Unable to delete time entry.", { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
