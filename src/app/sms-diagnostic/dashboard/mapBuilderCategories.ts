export type MapBuilderCategoryId =
  | "document_map"
  | "bow_tie"
  | "incident_investigation"
  | "org_chart"
  | "process_flow";

export type MapBuilderCategory = {
  key: string;
  slug: string;
  mapCategory: MapBuilderCategoryId;
  title: string;
  menuTitle: string;
  subtitle: string;
  icon: string;
  createButtonLabel: string;
  emptyLabel: string;
};

export const MAP_BUILDER_CATEGORIES: MapBuilderCategory[] = [
  {
    key: "document-maps",
    slug: "document-maps",
    mapCategory: "document_map",
    title: "Document Maps",
    menuTitle: "Document Maps",
    subtitle: "Create and manage document-centric management system maps from one central workspace.",
    icon: "/icons/documentmap.svg",
    createButtonLabel: "Create New Document Map",
    emptyLabel: "No document maps have been added yet.",
  },
  {
    key: "bow-ties",
    slug: "bow-ties",
    mapCategory: "bow_tie",
    title: "Bow Tie Maps",
    menuTitle: "Bow Tie Maps",
    subtitle: "Create and manage bow tie maps for hazards, controls, escalation factors, and consequences.",
    icon: "/icons/relationship.svg",
    createButtonLabel: "Create New Bow Tie Map",
    emptyLabel: "No bow tie maps have been added yet.",
  },
  {
    key: "investigation-maps",
    slug: "investigation-maps",
    mapCategory: "incident_investigation",
    title: "Investigation Maps",
    menuTitle: "Investigation Maps",
    subtitle: "Create and manage investigation maps for workflows, evidence, findings, and recommendations.",
    icon: "/icons/investigatemap.svg",
    createButtonLabel: "Create New Investigation Map",
    emptyLabel: "No investigation maps have been added yet.",
  },
  {
    key: "org-charts",
    slug: "org-charts",
    mapCategory: "org_chart",
    title: "Org Charts",
    menuTitle: "Org Charts",
    subtitle: "Create and manage organisation chart builders for teams, roles, and reporting structures.",
    icon: "/icons/orgchartmap.svg",
    createButtonLabel: "Create New Org Chart",
    emptyLabel: "No organisation charts have been added yet.",
  },
  {
    key: "process-flows",
    slug: "process-flows",
    mapCategory: "process_flow",
    title: "Process Flows",
    menuTitle: "Process Flows",
    subtitle: "Create and manage process flow builders for operational and systems workflows.",
    icon: "/icons/processflowmap.svg",
    createButtonLabel: "Create New Process Flow",
    emptyLabel: "No process flow maps have been added yet.",
  },
];

export const MAP_BUILDER_CATEGORY_BY_SLUG = new Map(
  MAP_BUILDER_CATEGORIES.map((category) => [category.slug, category])
);
