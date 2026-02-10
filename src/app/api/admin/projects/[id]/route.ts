import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const { id: projectId } = await params;
  if (!projectId || projectId === "undefined") {
    return new NextResponse("Missing project id.", { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const projectResponse = await supabase
    .from("projects")
    .select(
      "id,quote_id,name,status,accepted_at,created_at,quotes(quote_number,title,organisations(name),contacts(full_name,email))"
    )
    .eq("id", projectId)
    .single();

  if (projectResponse.error || !projectResponse.data) {
    return new NextResponse(projectResponse.error?.message ?? "Project not found.", {
      status: 404,
    });
  }

  const deliverablesResponse = await supabase
    .from("project_deliverables")
    .select(
      "id,project_id,source_deliverable_id,title,description,pricing_mode,planned_hours,unit_rate,budget_ex_gst,status,estimated_completion_date,created_at"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (deliverablesResponse.error) {
    return new NextResponse(deliverablesResponse.error.message, { status: 500 });
  }

  const deliverables = deliverablesResponse.data ?? [];
  const deliverableIds = deliverables.map((item) => item.id);

  const milestonesResponse = deliverableIds.length
    ? await supabase
        .from("project_milestones")
        .select(
          "id,project_deliverable_id,source_milestone_id,title,description,planned_hours,status,estimated_completion_date,created_at"
        )
        .in("project_deliverable_id", deliverableIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (milestonesResponse.error) {
    return new NextResponse(milestonesResponse.error.message, { status: 500 });
  }

  const milestoneIds = (milestonesResponse.data ?? []).map((item) => item.id);
  const timeEntriesResponse = milestoneIds.length
    ? await supabase
        .from("project_time_entries")
        .select("id,project_milestone_id,entry_date,hours,note,created_at")
        .in("project_milestone_id", milestoneIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (timeEntriesResponse.error) {
    return new NextResponse(timeEntriesResponse.error.message, { status: 500 });
  }

  return NextResponse.json({
    project: projectResponse.data,
    deliverables,
    milestones: milestonesResponse.data ?? [],
    time_entries: timeEntriesResponse.data ?? [],
  });
}
