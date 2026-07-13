import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("brand_colour,logo_url")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return NextResponse.json({ brand_colour: "#2d9692", logo_url: null });
  }

  return NextResponse.json({
    brand_colour: data.brand_colour ?? "#2d9692",
    logo_url:     data.logo_url ?? null,
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  let payload: {
    brand_colour?: string;
    logo_base64?: string;
    logo_mime_type?: string;
    logo_extension?: string;
    remove_logo?: boolean;
  } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return new NextResponse("Invalid request.", { status: 400 });
  }

  const supabase = createServiceRoleClient();

  let logoUrl: string | null | undefined = undefined;

  if (payload.remove_logo) {
    logoUrl = null;
  } else if (payload.logo_base64 && payload.logo_mime_type && payload.logo_extension) {
    const filePath   = `logo.${payload.logo_extension}`;
    const fileBuffer = Buffer.from(payload.logo_base64, "base64");
    const { error: uploadError } = await supabase.storage
      .from("hses-branding")
      .upload(filePath, fileBuffer, { contentType: payload.logo_mime_type, upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("hses-branding")
        .getPublicUrl(filePath);
      // Append cache-buster so browser picks up the new image after re-upload
      logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    }
  }

  const updateData: { brand_colour?: string; logo_url?: string | null; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (payload.brand_colour) updateData.brand_colour = payload.brand_colour;
  if (logoUrl !== undefined) updateData.logo_url = logoUrl;

  const { error } = await supabase
    .from("app_settings")
    .update(updateData)
    .eq("id", 1);

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
