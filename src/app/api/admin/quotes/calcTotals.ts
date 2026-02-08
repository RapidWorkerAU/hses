import type { SupabaseClient } from "@supabase/supabase-js";

type QuoteVersionTotals = {
  subtotal_ex_gst: number;
  gst_amount: number;
  total_inc_gst: number;
};

type VersionFlags = {
  gst_enabled?: boolean | null;
  gst_rate?: number | null;
  prices_include_gst?: boolean | null;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

export const calculateQuoteVersionTotals = async (
  supabase: SupabaseClient,
  versionId: string,
  flags: VersionFlags
): Promise<QuoteVersionTotals> => {
  const { data: deliverables, error } = await supabase
    .from("quote_deliverables")
    .select("pricing_mode,fixed_price_ex_gst,total_hours,default_client_rate")
    .eq("quote_version_id", versionId);

  if (error) {
    throw new Error(error.message);
  }

  const subtotal = (deliverables ?? []).reduce((sum, item) => {
    const mode = item.pricing_mode ?? "rolled_up_hours";
    if (mode === "fixed_price") {
      return sum + (item.fixed_price_ex_gst ?? 0);
    }
    const rate = item.default_client_rate ?? 0;
    const hours = item.total_hours ?? 0;
    return sum + rate * hours;
  }, 0);

  const gstEnabled = Boolean(flags.gst_enabled);
  const gstRate = flags.gst_rate ?? 0;
  const gstAmount = gstEnabled ? subtotal * gstRate : 0;
  const totalIncGst = gstEnabled ? subtotal + gstAmount : subtotal;

  return {
    subtotal_ex_gst: round2(subtotal),
    gst_amount: round2(gstAmount),
    total_inc_gst: round2(totalIncGst),
  };
};
