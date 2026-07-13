import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Number(url.searchParams.get("page_size") ?? 10));
  const search = url.searchParams.get("search")?.toLowerCase().trim() ?? "";
  const statusFilter = url.searchParams.get("status") ?? "all";

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("projects")
    .select(
      "id,quote_id,name,status,accepted_at,created_at,quotes(quote_number,title,organisation_id,contact_id,organisations(name),contacts(full_name,email))",
      { count: "exact" }
    )
    .order("accepted_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (!search) {
    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);
  }

  const { data, error, count } = await query;
  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  let rows = data ?? [];

  if (search) {
    rows = rows.filter((row) => {
      const name = (row.name ?? (row.quotes as { title?: string | null } | null)?.title ?? "").toLowerCase();
      const org = ((row.quotes as { organisations?: { name?: string | null } | null } | null)?.organisations?.name ?? "").toLowerCase();
      const contact = ((row.quotes as { contacts?: { full_name?: string | null } | null } | null)?.contacts?.full_name ?? "").toLowerCase();
      const quoteNum = ((row.quotes as { quote_number?: string | null } | null)?.quote_number ?? "").toLowerCase();
      return name.includes(search) || org.includes(search) || contact.includes(search) || quoteNum.includes(search);
    });
  }

  const total = search ? rows.length : (count ?? 0);
  if (search) {
    const start = (page - 1) * pageSize;
    rows = rows.slice(start, start + pageSize);
  }

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

  return NextResponse.json({ projects: rows, total });
}
