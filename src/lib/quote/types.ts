export type QuoteStatus = "draft" | "published" | "approved" | "rejected";

export type QuoteVersion = {
  id: string;
  version_number: number;
  pricing_model: string | null;
  gst_enabled: boolean;
  gst_rate: number | null;
  prices_include_gst: boolean;
  subtotal_ex_gst: number | null;
  gst_amount: number | null;
  total_inc_gst: number | null;
  client_notes: string | null;
  assumptions: string | null;
  exclusions: string | null;
  terms: string | null;
};

export type QuoteDeliverable = {
  id: string;
  deliverable_order: number | null;
  deliverable_title: string | null;
  deliverable_description: string | null;
  deliverable_status: string | null;
  pricing_mode: string | null;
  fixed_price_ex_gst: number | null;
  total_hours: number | null;
  default_client_rate: number | null;
  subtotal_ex_gst: number | null;
  cost_total: number | null;
  margin_amount: number | null;
  margin_percent: number | null;
};

export type QuoteMilestone = {
  id: string;
  deliverable_id: string;
  milestone_order: number | null;
  milestone_title: string | null;
  milestone_description: string | null;
  pricing_unit: string | null;
  quantity: number | null;
  estimated_hours: number | null;
  billable: boolean | null;
  client_rate: number | null;
  client_amount_ex_gst: number | null;
  delivery_mode: string | null;
  supplier_name: string | null;
  cost_rate: number | null;
  cost_amount: number | null;
  margin_amount: number | null;
  margin_percent: number | null;
};

export type QuotePublicPayload = {
  quote: {
    title: string | null;
    quote_number: string | null;
    status: QuoteStatus | null;
    published_at: string | null;
    expires_at: string | null;
    currency?: string | null;
  };
  latest_action?: {
    action: "approved" | "rejected";
    client_name: string | null;
    note: string | null;
    created_at: string | null;
  } | null;
  version: QuoteVersion;
  deliverables: QuoteDeliverable[];
  milestones: QuoteMilestone[];
};
