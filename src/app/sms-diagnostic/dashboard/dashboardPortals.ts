"use client";

import { MAP_BUILDER_CATEGORIES } from "./mapBuilderCategories";

export const ADMIN_EMAIL = "ashleigh.phillips@hses.com.au";

export type PortalItem = {
  key: string;
  title: string;
  description: string;
  href: string;
  requiresAdmin: boolean;
  lockedForStandardUsers?: boolean;
  icon: string;
  children?: Array<{
    key: string;
    title: string;
    href: string;
  }>;
};

export const DASHBOARD_PORTALS: PortalItem[] = [
  {
    key: "business-admin",
    title: "Business Admin",
    description: "Access administration pages and business management features.",
    href: "/dashboard/business-admin",
    requiresAdmin: true,
    icon: "/icons/businessadmin.svg",
    children: [
      {
        key: "business-admin-home",
        title: "Business Admin Home",
        href: "/dashboard/business-admin",
      },
      {
        key: "admin-quotes",
        title: "Quotes & Proposals",
        href: "/admin/quotes",
      },
      {
        key: "admin-projects",
        title: "Project Schedule Builder",
        href: "/admin/projects",
      },
      {
        key: "management-system-design-dashboard",
        title: "Management System Design",
        href: "/dashboard/business-admin/management-system-design-dashboard",
      },
    ],
  },
  {
    key: "diagnostics",
    title: "Diagnostics",
    description: "Open diagnostics, code register, and access landing resources.",
    href: "/dashboard/diagnostics",
    requiresAdmin: true,
    icon: "/icons/diagnostics.svg",
    children: [
      {
        key: "diagnostics-list",
        title: "Your Diagnostics",
        href: "/dashboard/diagnostics",
      },
      {
        key: "codes",
        title: "Code Register",
        href: "/dashboard/codes",
      },
      {
        key: "access-landing",
        title: "Access Landing",
        href: "/sms-diagnostic/access",
      },
    ],
  },
  ...MAP_BUILDER_CATEGORIES.map((category) => ({
    key: category.key,
    title: category.menuTitle,
    description: category.subtitle,
    href: `/dashboard/map-builders/${category.slug}`,
    requiresAdmin: false,
    lockedForStandardUsers: category.mapCategory !== "document_map",
    icon: category.icon,
  })),
  {
    key: "risk-assessments",
    title: "Risk Assessments",
    description: "Review and manage your risk assessments and related records.",
    href: "/risk-assessments",
    requiresAdmin: false,
    lockedForStandardUsers: true,
    icon: "/icons/riskassess.svg",
  },
];

export const hasAdminAccess = (email: string | null | undefined) =>
  (email ?? "").trim().toLowerCase() === ADMIN_EMAIL;

export const hasPortalAccess = (email: string | null | undefined, portalKey: string) => {
  const portal = DASHBOARD_PORTALS.find((item) => item.key === portalKey);
  if (!portal) return true;

  const isAdmin = hasAdminAccess(email);
  if (portal.requiresAdmin && !isAdmin) return false;
  if (portal.lockedForStandardUsers && !isAdmin) return false;
  return true;
};

export const MAP_CATEGORY_PORTAL_KEY: Record<string, string> = {
  document_map: "document-maps",
  bow_tie: "bow-ties",
  incident_investigation: "investigation-maps",
  org_chart: "org-charts",
  process_flow: "process-flows",
  risk_assessment: "risk-assessments",
};

export const hasMapCategoryAccess = (email: string | null | undefined, mapCategory: string | null | undefined) => {
  if (!mapCategory) return true;
  const portalKey = MAP_CATEGORY_PORTAL_KEY[mapCategory];
  if (!portalKey) return true;
  return hasPortalAccess(email, portalKey);
};
