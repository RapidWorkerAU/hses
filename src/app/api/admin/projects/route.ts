import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id,quote_id,name,status,accepted_at,created_at,quotes(quote_number,title,organisations(name),contacts(full_name,email))"
    )
    .order("accepted_at", { ascending: false });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json({ projects: data ?? [] });
}
