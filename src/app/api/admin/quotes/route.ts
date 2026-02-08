import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

const formatQuoteNumber = (year: number, seq: number) => {
  const padded = String(seq).padStart(4, "0");
  return `HSES-${year}-${padded}`;
};

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "all";
  const search = url.searchParams.get("search")?.toLowerCase().trim() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Number(url.searchParams.get("page_size") ?? 15));

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("quotes")
    .select(
      "id,quote_number,title,status,updated_at,organisations(name),contacts(full_name,email),quote_versions(id,version_number,subtotal_ex_gst,gst_amount,total_inc_gst,created_at),quote_access_codes(access_code,created_at)",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .order("version_number", { foreignTable: "quote_versions", ascending: false })
    .limit(1, { foreignTable: "quote_versions" })
    .order("created_at", { foreignTable: "quote_access_codes", ascending: false })
    .limit(1, { foreignTable: "quote_access_codes" });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const shouldFilterServerSide = Boolean(search);
  if (!shouldFilterServerSide) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);
  }

  const { data, error, count } = await query;
  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  let rows = data ?? [];
  let filteredRows = rows;
  if (search) {
    filteredRows = rows.filter((row) => {
      const orgName = (row.organisations as { name?: string } | null)?.name ?? "";
      const contactName = (row.contacts as { full_name?: string } | null)?.full_name ?? "";
      const contactEmail = (row.contacts as { email?: string } | null)?.email ?? "";
      const haystack = `${row.quote_number ?? ""} ${row.title ?? ""} ${orgName} ${contactName} ${contactEmail}`.toLowerCase();
      return haystack.includes(search);
    });
    rows = filteredRows;
  }

  const quoteIds = rows.map((row) => row.id);
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
      latest_access_code: latestByQuote.get(row.id) ?? null,
    }));
  }

  if (search) {
    const start = (page - 1) * pageSize;
    rows = filteredRows.slice(start, start + pageSize);
  }

  const total = search ? filteredRows.length : count ?? 0;
  return NextResponse.json({ quotes: rows, total });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  let payload: { title?: string; organisation_id?: string | null; contact_id?: string | null } = {};
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const year = new Date().getFullYear();
  const { data: nextNumber, error: sequenceError } = await supabase.rpc("next_quote_number", {
    p_year: year,
  });

  if (sequenceError || !nextNumber) {
    return new NextResponse(sequenceError?.message ?? "Unable to generate quote number.", {
      status: 500,
    });
  }

  const quoteNumber = formatQuoteNumber(year, Number(nextNumber));
  const { data: quoteRow, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      quote_number: quoteNumber,
      title: payload.title ?? "New Quote",
      status: "draft",
      currency: "AUD",
      organisation_id: payload.organisation_id ?? null,
      contact_id: payload.contact_id ?? null,
      created_by: auth.user?.userId ?? null,
    })
    .select("id")
    .single();

  if (quoteError || !quoteRow) {
    return new NextResponse(quoteError?.message ?? "Unable to create quote.", { status: 500 });
  }

  const { error: versionError } = await supabase.from("quote_versions").insert({
    quote_id: quoteRow.id,
    version_number: 1,
    gst_enabled: true,
    gst_rate: 0.1,
    prices_include_gst: false,
  });

  if (versionError) {
    return new NextResponse(versionError.message ?? "Unable to create version.", { status: 500 });
  }

  return NextResponse.json({ id: quoteRow.id });
}
