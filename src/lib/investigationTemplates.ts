import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingAccessState } from "./access";

export type InvestigationTemplateVisibility = "private" | "organisation" | "global";

export type InvestigationTemplateSnapshot = {
  types: unknown[];
  nodes: unknown[];
  elements: unknown[];
  relations: unknown[];
  anchorLinks?: unknown[];
  outlineItems: unknown[];
  imageUrlsByElementId?: Record<string, string>;
};

export type InvestigationTemplateListItem = {
  id: string;
  name: string;
  updated_at: string;
  is_global: boolean;
  visibility: InvestigationTemplateVisibility | null;
  can_edit: boolean;
};

export const templateAccessDisabledReason = "Template saving is unavailable for your current access.";

export const hasActiveTemplateAccess = (accessState: BillingAccessState | null | undefined) =>
  Boolean(accessState?.canEditMaps);

const isTemplateVisibility = (value: unknown): value is InvestigationTemplateVisibility =>
  value === "private" || value === "organisation" || value === "global";

export async function listInvestigationTemplates(
  supabase: SupabaseClient,
  query = "",
  limit = 24
): Promise<InvestigationTemplateListItem[]> {
  const normalizedQuery = query.trim();
  const { data, error } = await supabase.rpc("list_investigation_templates", {
    p_query: normalizedQuery || null,
    p_limit: limit,
  });

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? ""),
    name: String(item.name ?? "Untitled Template"),
    updated_at: String(item.updated_at ?? new Date().toISOString()),
    is_global: Boolean(item.is_global),
    visibility: isTemplateVisibility(item.visibility) ? item.visibility : null,
    can_edit: item.can_edit !== false,
  }));
}
