import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";
  const limitParam = Number(url.searchParams.get("limit") ?? "200");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 200;

  const supabase = createServiceRoleClient();
  let requestBuilder = supabase
    .from("organisations")
    .select("id,name,abn,billing_address,shipping_address")
    .order("name", { ascending: true })
    .limit(limit);

  if (query) {
    requestBuilder = requestBuilder.ilike("name", `%${query}%`);
  }

  const { data, error } = await requestBuilder;
  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json({ organisations: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  let payload: {
    name?: string;
    abn?: string | null;
    billing_address?: string | null;
    shipping_address?: string | null;
  } = {};
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  if (!payload.name?.trim()) {
    return new NextResponse("Organisation name is required.", { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("organisations")
    .insert({
      name: payload.name.trim(),
      abn: payload.abn ?? null,
      billing_address: payload.billing_address ?? null,
      shipping_address: payload.shipping_address ?? null,
    })
    .select("id,name,abn,billing_address,shipping_address")
    .single();

  if (error || !data) {
    return new NextResponse(error?.message ?? "Unable to create organisation.", { status: 500 });
  }

  return NextResponse.json({ organisation: data });
}
