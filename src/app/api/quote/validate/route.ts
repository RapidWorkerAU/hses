import { NextResponse } from "next/server";
import { createAnonServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { createQuoteSessionToken, quoteSessionCookie } from "@/lib/quote/session";
import { rateLimit } from "@/lib/quote/rateLimit";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const limit = rateLimit(`quote-validate:${ip}`);
  if (!limit.allowed) {
    return new NextResponse("Too many attempts. Please try again shortly.", { status: 429 });
  }

  let payload: { code?: string } = {};
  try {
    payload = (await request.json()) as { code?: string };
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  const code = (payload.code?.trim() ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!code) {
    return new NextResponse("Enter your access code.", { status: 400 });
  }

  const supabase = createAnonServerClient();
  const { data, error } = await supabase.rpc("validate_quote_code", { p_code: code });

  let quoteId = data as string | null;

  if (error || !quoteId) {
    const service = createServiceRoleClient();
    const { data: accessRow, error: accessError } = await service
      .from("quote_access_codes")
      .select("quote_id,expires_at,revoked_at")
      .eq("access_code", code)
      .is("revoked_at", null)
      .maybeSingle();

    if (accessError || !accessRow) {
      return new NextResponse("Invalid access code.", { status: 401 });
    }

    if (accessRow.expires_at && new Date(accessRow.expires_at) <= new Date()) {
      return new NextResponse("Access code has expired.", { status: 401 });
    }

    quoteId = accessRow.quote_id;
  }

  try {
    if (!quoteId) {
      return new NextResponse("Invalid access code.", { status: 401 });
    }
    const token = createQuoteSessionToken(quoteId);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(quoteSessionCookie.name, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: quoteSessionCookie.maxAge,
      path: "/",
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to create session.";
    return new NextResponse(message, { status: 500 });
  }
}
