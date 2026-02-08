import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { readQuoteSessionToken, quoteSessionCookie } from "@/lib/quote/session";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const tokenMatch = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${quoteSessionCookie.name}=`));
  const token = tokenMatch?.split("=")[1] ?? null;
  const quoteId = readQuoteSessionToken(token);

  if (!quoteId) {
    return new NextResponse("Unauthorized.", { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const projectResponse = await supabase
    .from("projects")
    .select("id,quote_id,name,status,accepted_at,created_at")
    .eq("quote_id", quoteId)
    .single();

  if (projectResponse.error || !projectResponse.data) {
    return new NextResponse("Project not found.", { status: 404 });
  }

  const deliverablesResponse = await supabase
    .from("project_deliverables")
    .select(
      "id,project_id,source_deliverable_id,title,description,pricing_mode,planned_hours,unit_rate,budget_ex_gst,status,created_at"
    )
    .eq("project_id", projectResponse.data.id)
    .order("created_at", { ascending: true });

  if (deliverablesResponse.error) {
    return new NextResponse("Unable to load deliverables.", { status: 500 });
  }

  const deliverables = deliverablesResponse.data ?? [];
  const deliverableIds = deliverables.map((item) => item.id);

  const milestonesResponse = deliverableIds.length
    ? await supabase
        .from("project_milestones")
        .select(
          "id,project_deliverable_id,source_milestone_id,title,description,planned_hours,status,created_at"
        )
        .in("project_deliverable_id", deliverableIds)
        .order("created_at", { ascending: true })
    : { data: [] as Array<Record<string, unknown>>, error: null };

  if (milestonesResponse.error) {
    return new NextResponse("Unable to load milestones.", { status: 500 });
  }

  const milestoneIds = (milestonesResponse.data ?? []).map(
    (item) => (item as { id: string }).id
  );

  const timeEntriesResponse = milestoneIds.length
    ? await supabase
        .from("project_time_entries")
        .select("id,project_milestone_id,entry_date,hours,note,created_at")
        .in("project_milestone_id", milestoneIds)
        .order("created_at", { ascending: false })
    : { data: [] as Array<Record<string, unknown>>, error: null };

  if (timeEntriesResponse.error) {
    return new NextResponse("Unable to load time entries.", { status: 500 });
  }

  return NextResponse.json({
    project: projectResponse.data,
    deliverables,
    milestones: milestonesResponse.data ?? [],
    time_entries: timeEntriesResponse.data ?? [],
  });
}
