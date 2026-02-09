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
      "id,quote_id,name,status,accepted_at,created_at,quotes(quote_number,title,organisation_id,contact_id,organisations(name),contacts(full_name,email))"
    )
    .order("accepted_at", { ascending: false });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  let rows = data ?? [];
  const quoteIds = rows.map((row) => row.quote_id).filter(Boolean) as string[];
  if (quoteIds.length) {
    const { data: codes } = await supabase
      .from("quote_access_codes")
      .select("quote_id,access_code,created_at")
      .in("quote_id", quoteIds)
      .order("created_at", { ascending: false });

    const latestByQuote = new Map<string, string | null>();
    (codes ?? []).forEach((code) => {
      if (!latestByQuote.has(code.quote_id)) {
        latestByQuote.set(code.quote_id, code.access_code ?? null);
      }
    });

    rows = rows.map((row) => ({
      ...row,
      latest_access_code: row.quote_id ? latestByQuote.get(row.quote_id) ?? null : null,
    }));
  }

  return NextResponse.json({ projects: rows });
}
