import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  let payload: { expires_at?: string | null } = {};
  try {
    payload = (await request.json()) as { expires_at?: string | null };
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  const { id: quoteId } = await params;
  const supabase = createServiceRoleClient();
  const publishedAt = new Date().toISOString();
  let { error: updateError } = await supabase
    .from("quotes")
    .update({
      status: "published",
      published_at: publishedAt,
      accepted_at: null,
      rejected_at: null,
    })
    .eq("id", quoteId);

  if (updateError) {
    const message = updateError.message ?? "";
    if (message.includes("column") && (message.includes("accepted_at") || message.includes("rejected_at"))) {
      const fallback = await supabase
        .from("quotes")
        .update({ status: "published", published_at: publishedAt })
        .eq("id", quoteId);
      updateError = fallback.error ?? null;
    }
  }

  if (updateError) {
    return new NextResponse(updateError.message, { status: 500 });
  }

  const { data: existingCode } = await supabase
    .from("quote_access_codes")
    .select("id")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const createAccessCode = async () =>
    supabase.rpc("create_quote_access_code", {
      p_quote_id: quoteId,
      p_expires_at: payload.expires_at ?? null,
    });

  let data: unknown = null;
  let error: { message?: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await createAccessCode();
    data = result.data;
    error = result.error ?? null;
    if (!error) break;
    if (!error.message?.includes("quote_access_codes_access_code_key")) {
      break;
    }
  }

  if (error || !data) {
    return new NextResponse(error?.message ?? "Unable to create access code.", { status: 500 });
  }

  const { data: latestCode, error: latestError } = await supabase
    .from("quote_access_codes")
    .select("id,access_code,code_hash,expires_at")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (latestError || !latestCode) {
    return new NextResponse(latestError?.message ?? "Unable to load access code.", {
      status: 500,
    });
  }

  if (existingCode && existingCode.id !== latestCode.id) {
    const { error: updateCodeError } = await supabase
      .from("quote_access_codes")
      .update({
        access_code: latestCode.access_code,
        code_hash: latestCode.code_hash,
        expires_at: latestCode.expires_at,
        revoked_at: null,
      })
      .eq("id", existingCode.id);

    if (updateCodeError) {
      return new NextResponse(updateCodeError.message, { status: 500 });
    }

    const { error: deleteError } = await supabase
      .from("quote_access_codes")
      .delete()
      .eq("id", latestCode.id);

    if (deleteError) {
      return new NextResponse(deleteError.message, { status: 500 });
    }

    return NextResponse.json({ access_code: latestCode.access_code });
  }

  return NextResponse.json({ access_code: latestCode.access_code });
}
