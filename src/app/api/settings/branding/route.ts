import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Public endpoint — no auth required. Returns the current brand colour and logo URL.
export async function GET() {
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
