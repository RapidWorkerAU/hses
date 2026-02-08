import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const { id: milestoneId } = await params;
  if (!milestoneId || milestoneId === "undefined") {
    return new NextResponse("Missing milestone id.", { status: 400 });
  }

  let payload: { hours?: number; note?: string | null; entry_date?: string | null } = {};
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
    .insert({
      project_milestone_id: milestoneId,
      entry_date: payload.entry_date ?? new Date().toISOString().slice(0, 10),
      hours,
      note: payload.note ?? null,
      created_by: auth.user?.userId ?? null,
    })
    .select("id,project_milestone_id,entry_date,hours,note,created_at")
    .single();

  if (error || !data) {
    return new NextResponse(error?.message ?? "Unable to log time.", { status: 500 });
  }

  return NextResponse.json({ entry: data });
}
