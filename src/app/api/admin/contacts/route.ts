import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";
  const organisationId = url.searchParams.get("organisationId")?.trim() ?? "";
  const limitParam = Number(url.searchParams.get("limit") ?? "200");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 200;

  const supabase = createServiceRoleClient();
  let requestBuilder = supabase
    .from("contacts")
    .select("id,organisation_id,full_name,email,phone")
    .order("full_name", { ascending: true })
    .limit(limit);

  if (query) {
    requestBuilder = requestBuilder.or(
      `full_name.ilike.%${query}%,email.ilike.%${query}%`
    );
  }
  if (organisationId) {
    requestBuilder = requestBuilder.eq("organisation_id", organisationId);
  }

  const { data, error } = await requestBuilder;
  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json({ contacts: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  let payload: {
    organisation_id?: string;
    full_name?: string;
    email?: string;
    phone?: string | null;
  } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  if (!payload.organisation_id || !payload.full_name || !payload.email) {
    return new NextResponse("Organisation, name, and email are required.", { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      organisation_id: payload.organisation_id,
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone ?? null,
    })
    .select("id,organisation_id,full_name,email,phone")
    .single();

  if (error || !data) {
    return new NextResponse(error?.message ?? "Unable to create contact.", { status: 500 });
  }

  return NextResponse.json({ contact: data });
}
