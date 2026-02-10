import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const { id: milestoneId } = await params;
  if (!milestoneId || milestoneId === "undefined") {
    return new NextResponse("Missing milestone id.", { status: 400 });
  }

  let payload: { estimated_completion_date?: string | null } = {};
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  const nextDate = payload.estimated_completion_date ?? null;
  if (nextDate && !/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
    return new NextResponse("Estimated completion date must be YYYY-MM-DD.", {
      status: 400,
    });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("project_milestones")
    .update({
      estimated_completion_date: nextDate,
    })
    .eq("id", milestoneId)
    .select("id,project_deliverable_id,estimated_completion_date")
    .single();

  if (error || !data) {
    return new NextResponse(error?.message ?? "Unable to update milestone.", {
      status: 500,
    });
  }

  return NextResponse.json({ milestone: data });
}
