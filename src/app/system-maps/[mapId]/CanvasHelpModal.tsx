"use client";

import { useEffect, useMemo, useState } from "react";
import type { MapCategoryId, NodePaletteKind } from "./mapCategories";

type CanvasHelpModalProps = {
  open: boolean;
  isMobile?: boolean;
  mapCategoryId: MapCategoryId;
  allowedNodeKinds: NodePaletteKind[];
  onClose: () => void;
};

type HelpTopic = {
  id: string;
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    lines: Array<
      | string
      | {
          text: string;
          buttonVisuals?: Array<{
            label: string;
            icon?: string;
            variant?: "headerIcon" | "headerText" | "headerHelp" | "floating";
          }>;
          nodePreviews?: string[];
          mediaVisuals?: Array<{
            src: string;
            alt: string;
            type?: "image" | "gif";
          }>;
          videoVisuals?: Array<{
            src: string;
            title: string;
          }>;
        }
    >;
  }>;
  audience?: MapCategoryId[];
};

const categoryLabelById: Record<MapCategoryId, string> = {
  document_map: "Document Map",
  bow_tie: "Bow Tie",
  incident_investigation: "Investigation Map",
  org_chart: "Org Chart",
  process_flow: "Process Flow",
};

const baseTopics: HelpTopic[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    summary: "How to orient yourself on the canvas and choose the best starting path.",
    sections: [
      {
        heading: "What this area is for",
        lines: [
          "The canvas is the working map for building out documents, people, systems, process elements, investigation nodes, evidence, and supporting context in one place.",
          {
            text: "The black header gives you the map title, your current access level, the information panel, and this help reference.",
            buttonVisuals: [
              { label: "Info", icon: "/icons/info.svg", variant: "headerIcon" },
              { label: "Help", variant: "headerHelp" },
            ],
          },
        ],
      },
      {
        heading: "How to begin",
        lines: [
          {
            text: "Use the wizard if you want the tool to scaffold a structured investigation map for you immediately.",
            buttonVisuals: [{ label: "Wizard", icon: "/icons/wizard.svg", variant: "floating" }],
          },
          {
            text: "Use Add Component if you already know which nodes or supporting elements you want to place manually.",
            buttonVisuals: [{ label: "Add Component", icon: "/icons/addcomponent.svg", variant: "floating" }],
          },
          "If you are unsure which path is better, start with the major investigation nodes first and refine detail once the main story of the event is visible.",
        ],
      },
      {
        heading: "Why this matters",
        lines: [
          "A map becomes more useful when it shows both sequence and supporting evidence instead of isolated notes. The canvas is designed to let you build that chain visually.",
        ],
      },
    ],
  },
  {
    id: "selection-and-movement",
    title: "Selection, Deselecting, And Movement",
    summary: "How clicking, dragging, right-clicking, and blank canvas actions behave.",
    sections: [
      {
        heading: "Selecting and clearing",
        lines: [
          {
            text: "Click a node to select it and open its relevant edit panel. Different node types open different editors.",
            mediaVisuals: [{ src: "/gif/selectedit.gif", alt: "Selecting and deselecting a node on the canvas", type: "gif" }],
          },
          "Clicking the blank canvas clears the active selection and closes the current node editor.",
          "If you need to deselect something, clicking an empty part of the canvas is the normal way to do it.",
        ],
      },
      {
        heading: "Dragging and moving",
        lines: [
          {
            text: "Most editable nodes can be dragged to reposition them on the map.",
            mediaVisuals: [{ src: "/gif/movenode.gif", alt: "Dragging and moving a node on the canvas", type: "gif" }],
          },
          "Grouping containers are more deliberate: their selection and drag behavior is tied to their visible handle area so users do not accidentally open them while working around them.",
          "Moving nodes is not just cosmetic. It helps establish sequence, clustering, ownership, and causal flow so the investigation can be read quickly.",
        ],
      },
      {
        heading: "Right-click and multi-selection",
        lines: [
          {
            text: "Right-click a node on desktop to add or remove it from the current multi-selection.",
            mediaVisuals: [{ src: "/gif/selectdeselect.gif", alt: "Right-click and multi-selection on the canvas", type: "gif" }],
          },
          "Right-drag on blank canvas creates a box selection so you can select several items at once.",
          "Multi-selection is useful when you want to duplicate or remove a related group of items instead of rebuilding them one by one.",
        ],
      },
      {
        heading: "Mobile behaviour",
        lines: [
          "On mobile, many node types use double tap to open their detail editor rather than a single tap, which reduces accidental activation while panning.",
        ],
      },
    ],
  },
  {
    id: "node-types",
    title: "Node Types And What They Add",
    summary: "What each node type is good for, what can be changed, and what benefit it adds to the investigation.",
    sections: [
      {
        heading: "Core map nodes",
        lines: [
          {
            text: "Documents carry the richest structured detail. They can hold document metadata and a document structure outline, which is useful when you need the map to point into more formal investigation or system content.",
            nodePreviews: ["document"],
          },
          {
            text: "Systems and process nodes help show where work, controls, or interactions happen. They are useful when the investigation needs operational context rather than only chronological detail.",
            nodePreviews: ["system", "process"],
          },
          {
            text: "People nodes help show who was involved, who owned a control, who made a decision, or who sat within a reporting structure.",
            nodePreviews: ["person"],
          },
          {
            text: "Equipment and environment nodes capture the physical items and contextual conditions that can be tested against factor statements.",
            nodePreviews: ["equipment", "environment"],
          },
        ],
      },
      {
        heading: "Organisation and framing nodes",
        lines: [
          {
            text: "Categories work like visible headings or lane markers. They help break the map into meaningful sections.",
            nodePreviews: ["category"],
          },
          {
            text: "Grouping containers let you hold related items together visually so clusters remain readable. This is useful for separating work areas, themes, causal groupings, or functional sections.",
            nodePreviews: ["grouping_container"],
          },
        ],
      },
      {
        heading: "Supporting content nodes",
        lines: [
          {
            text: "Sticky notes are lightweight and fast. They are useful for provisional thinking, reminders, unanswered questions, and workshop capture before content is formalised elsewhere.",
            nodePreviews: ["sticky_note"],
          },
          {
            text: "Image nodes add visual evidence or supporting material with a description. This helps when an incident needs photographic or diagrammatic context.",
            nodePreviews: ["image_asset"],
          },
          {
            text: "Text boxes are freeform explanatory annotations. They are useful when you need narrative, interpretation, or labels that do not fit a formal node type.",
            nodePreviews: ["text_box"],
          },
          {
            text: "Tables are useful when evidence or findings are easier to compare in rows and columns than as separate nodes.",
            nodePreviews: ["table"],
          },
        ],
      },
      {
        heading: "Investigation and methodology nodes",
        lines: [
          {
            text: "Investigation nodes such as sequence steps, outcomes, task or condition, factors, system factors, controls or barriers, evidence, response or recovery, findings, and recommendations help you build a disciplined incident review instead of a loose sketch.",
            nodePreviews: [
              "incident_sequence_step",
              "incident_outcome",
              "incident_task_condition",
              "incident_factor",
              "incident_system_factor",
              "incident_control_barrier",
              "incident_evidence",
              "incident_response_recovery",
              "incident_finding",
              "incident_recommendation",
            ],
          },
          {
            text: "Bow tie nodes such as hazards, top events, threats, consequences, controls, escalation factors, recovery measures, degradation indicators, and risk rating help capture risk logic in a form that is easier to review and communicate.",
            nodePreviews: [
              "bowtie_hazard",
              "bowtie_top_event",
              "bowtie_threat",
              "bowtie_consequence",
              "bowtie_control",
              "bowtie_escalation_factor",
              "bowtie_recovery_measure",
              "bowtie_degradation_indicator",
              "bowtie_risk_rating",
            ],
          },
          {
            text: "Shapes in process flow maps help clarify direction, boundaries, flow, and emphasis without forcing everything into a document-style object.",
            nodePreviews: ["shape_rectangle", "shape_circle", "shape_pill", "shape_pentagon", "shape_chevron_left", "shape_arrow"],
          },
        ],
      },
    ],
  },
  {
    id: "editing-content",
    title: "Editing Content And Appearance",
    summary: "What can be changed once a node or canvas element has been selected.",
    sections: [
      {
        heading: "General editing model",
        lines: [
          {
            text: "Most editing happens in the properties panel that opens for the selected item.",
            mediaVisuals: [{ src: "/gif/selectedit.gif", alt: "Selecting a node to open its editing panel", type: "gif" }],
          },
          "The available fields change by node type, so a document, image, table, shape, and evidence node will not all expose the same controls.",
        ],
      },
      {
        heading: "Text and visual styling",
        lines: [
          {
            text: "Text boxes, tables, and several other canvas elements support text formatting controls such as alignment, bold, italic, underline, and font sizing.",
            mediaVisuals: [{ src: "/gif/edittext.gif", alt: "Editing text and visual styling on the canvas", type: "gif" }],
          },
          "Investigation map content also uses colour and layout cues across its available node types, which helps distinguish kinds of evidence, findings, barriers, and other investigation detail at a glance.",
          "Use styling to reinforce meaning and readability, not decoration. The goal is to help users read the investigation logic faster.",
        ],
      },
      {
        heading: "What this adds to the investigation",
        lines: [
          "Well-chosen formatting makes the investigation easier to scan. It should reinforce meaning such as evidence, control failure, responsibility, chronology, or recommendation priority rather than decorate the map.",
        ],
      },
    ],
  },
  {
    id: "tables-and-structured-detail",
    title: "Tables And Structured Detail",
    summary: "How table editing works and when a table is better than another node type.",
    sections: [
      {
        heading: "How tables are edited",
        lines: [
          {
            text: "Tables support direct cell editing on the canvas as well as a separate properties panel.",
            mediaVisuals: [{ src: "/gif/tableedit.gif", alt: "Editing a table on the canvas", type: "gif" }],
          },
          "The table properties panel lets you change row count, column count, line colour, and line weight.",
          "Table text styling can also be controlled so the content is readable and consistent.",
        ],
      },
      {
        heading: "When a table is useful",
        lines: [
          "Use a table when you want structured comparisons such as evidence source, confidence, owner, due date, or control status in one block.",
          "A table is usually better than many separate notes when readers need to compare entries line by line.",
        ],
      },
      {
        heading: "Practical tip",
        lines: [
          "Keep tables for structured comparison and keep the main causal or sequence story in nodes around them. That balance usually makes the map easier to read.",
        ],
      },
    ],
  },
  {
    id: "relationships-and-supporting-detail",
    title: "Relationships, Evidence, And Detail",
    summary: "How to add meaning between items and enrich the map with supporting context.",
    sections: [
      {
        heading: "Relationships",
        lines: [
          {
            text: "Relationships are not just connecting lines. They can hold type, category, discipline, and definition information so the map records why two items are connected.",
            mediaVisuals: [{ src: "/gif/relationships.gif", alt: "Creating and reviewing relationships on the canvas", type: "gif" }],
          },
          "This is useful when a line needs to mean something specific such as dependency, control, evidence support, ownership, or another defined relationship.",
        ],
      },
      {
        heading: "Evidence and previews",
        lines: [
          {
            text: "Evidence-related content can expose media previews and an evidence viewer, which helps investigators review supporting material without leaving the map context.",
            mediaVisuals: [{ src: "/gif/evidencenode.gif", alt: "Using an evidence node and preview on the canvas", type: "gif" }],
          },
          "This is especially valuable when the map needs to hold both interpretation and source material together.",
        ],
      },
      {
        heading: "Document structure and deeper detail",
        lines: [
          {
            text: "Document nodes can open structure editing so headings and content can be managed in a more detailed hierarchy.",
            mediaVisuals: [{ src: "/gif/documents.gif", alt: "Opening and working with document structure on the canvas", type: "gif" }],
          },
          "This helps when the map is being used as both a visual investigation model and an entry point into more formal documentation.",
        ],
      },
    ],
  },
  {
    id: "search-print-and-clipboard",
    title: "Search, Print, Copy, And Paste",
    summary: "Tools that help you navigate, output, and reuse map content.",
    sections: [
      {
        heading: "Search and navigation",
        lines: [
          {
            text: "Use search when the map is too large to scan manually. Search results jump you directly to matching content on the canvas.",
            buttonVisuals: [{ label: "Search", icon: "/icons/finddocument.svg", variant: "floating" }],
          },
          {
            text: "Use fit view and reset zoom when you need to reorient quickly after detailed editing.",
            buttonVisuals: [
              { label: "Fit View", icon: "/icons/zoomfit.svg", variant: "floating" },
              { label: "Reset Zoom", icon: "/icons/resetzoom.svg", variant: "floating" },
            ],
          },
        ],
      },
      {
        heading: "Print and output",
        lines: [
          {
            text: "The print menu can output the current view or a selected area.",
            buttonVisuals: [{ label: "Print", icon: "/icons/printer.svg", variant: "floating" }],
          },
          "Selected area is useful when one section of the investigation needs to be shared or reviewed on its own without shrinking the full map.",
        ],
      },
      {
        heading: "Copy and paste",
        lines: [
          {
            text: "When multiple items are selected, you can copy them with Ctrl or Cmd plus C and paste with Ctrl or Cmd plus V.",
            mediaVisuals: [{ src: "/gif/copypaste.gif", alt: "Copying and pasting selected items on the canvas", type: "gif" }],
          },
          "Pasted items are inserted with an offset so you can distinguish the duplicate from the source selection.",
          "This is useful when you want to reuse a local pattern or investigative structure without rebuilding it manually.",
        ],
      },
    ],
  },
  {
    id: "map-info-and-access",
    title: "Map Information And Access",
    summary: "How metadata, sharing, and read-only conditions affect what users can do.",
    sections: [
      {
        heading: "Map information",
        lines: [
          {
            text: "The information button opens the map information panel where users can review the name, code, description, and member access.",
            buttonVisuals: [{ label: "Info", icon: "/icons/info.svg", variant: "headerIcon" }],
          },
          "Owners with full write access can update map metadata and manage the roles of other linked users.",
        ],
      },
      {
        heading: "Access behaviour",
        lines: [
          "The access badge in the header shows whether the current map is read, partial write, or full write.",
          "When access conditions block editing, the canvas becomes read only and some creation or editing functions are intentionally unavailable.",
          "Understanding access state matters because missing controls may be caused by permissions rather than by the map type.",
        ],
      },
    ],
  },
];

const categorySpecificTopics: HelpTopic[] = [
  {
    id: "investigation-workflow",
    title: "Investigation Workflow",
    summary: "Guidance for structuring an investigation map from sequence through recommendations.",
    sections: [
      {
        heading: "How to think about this map type",
        lines: [
          "Investigation maps are strongest when they move from what happened to why it happened and then to what should change.",
        ],
      },
      {
        heading: "Useful structure",
        lines: [
          "Sequence steps and outcomes establish the timeline.",
          "Task or condition, factors, and system factors add causal detail.",
          "Controls or barriers, evidence, findings, and recommendations turn the map into something that supports review, action, and learning.",
        ],
      },
      {
        heading: "Benefit",
        lines: [
          "This structure helps the investigation stay disciplined and reduces the risk that recommendations are disconnected from evidence or causal reasoning.",
        ],
      },
    ],
    audience: ["incident_investigation"],
  },
  {
    id: "bowtie-workflow",
    title: "Bow Tie Workflow",
    summary: "Guidance for organising hazards, threats, controls, and recovery measures.",
    sections: [
      {
        heading: "How to think about this map type",
        lines: [
          "Bow tie maps work best when the central event is clear and every threat, consequence, and control can be read against it.",
        ],
      },
      {
        heading: "Useful structure",
        lines: [
          "Hazard and top event define the centre of the model.",
          "Threats and consequences show what can lead in and what can flow out.",
          "Controls, recovery measures, escalation factors, degradation indicators, and risk rating help show the strength and vulnerability of the control environment.",
        ],
      },
      {
        heading: "Benefit",
        lines: [
          "This makes it easier to discuss risk logic, control assurance, and where failure pathways need attention.",
        ],
      },
    ],
    audience: ["bow_tie"],
  },
  {
    id: "process-flow-workflow",
    title: "Process Flow Workflow",
    summary: "Guidance for combining flow shapes, systems, and annotations in process maps.",
    sections: [
      {
        heading: "How to think about this map type",
        lines: [
          "Process flow maps are best when the main path is visually obvious and supporting detail does not overwhelm that path.",
        ],
      },
      {
        heading: "Useful structure",
        lines: [
          "Use process nodes and directional shapes for the main operational path.",
          "Use systems and documents where information, control, or interface points need to be shown.",
          "Use text boxes and tables for supporting explanation rather than making the main path unreadable.",
        ],
      },
      {
        heading: "Benefit",
        lines: [
          "A clear process view helps investigators explain where the work system broke down, where controls sat, and where handoffs or decisions became important.",
        ],
      },
    ],
    audience: ["process_flow"],
  },
  {
    id: "org-chart-workflow",
    title: "Org Chart Workflow",
    summary: "Guidance for mapping people, teams, and reporting lines cleanly.",
    sections: [
      {
        heading: "How to think about this map type",
        lines: [
          "Org charts are most useful when they clarify responsibility, reporting lines, and where decision or control ownership sits.",
        ],
      },
      {
        heading: "Useful structure",
        lines: [
          "Start with the key roles or leaders, then build outward.",
          "Use groups and categories to separate teams, functions, or business areas.",
          "Add reporting relationships after the main role layout is stable.",
        ],
      },
      {
        heading: "Benefit",
        lines: [
          "This helps the investigation show accountability and organisational context rather than only operational sequence.",
        ],
      },
    ],
    audience: ["org_chart"],
  },
];

function buildNodeTypesTopic(allowedNodeKinds: NodePaletteKind[]): HelpTopic {
  const allowed = new Set<NodePaletteKind>(allowedNodeKinds);

  const coreLines: HelpTopic["sections"][number]["lines"] = [];
  const organisationLines: HelpTopic["sections"][number]["lines"] = [];
  const supportingLines: HelpTopic["sections"][number]["lines"] = [];
  const investigationLines: HelpTopic["sections"][number]["lines"] = [];

  if (allowed.has("document")) {
    coreLines.push({
      text: "Documents carry the richest structured detail. They can hold document metadata and a document structure outline, which is useful when you need the map to point into more formal investigation or system content.",
      nodePreviews: ["document"],
    });
  }

  if (allowed.has("process")) {
    coreLines.push({
      text: "Process nodes help show where work, tasks, or interactions happen. They are useful when the investigation needs operational context rather than only chronological detail.",
      nodePreviews: ["process"],
    });
  }

  if (allowed.has("person")) {
    coreLines.push({
      text: "People nodes help show who was involved, who owned a control, who made a decision, or who sat within a reporting structure.",
      nodePreviews: ["person"],
    });
  }

  if (allowed.has("category")) {
    organisationLines.push({
      text: "Categories work like visible headings or lane markers. They help break the map into meaningful sections.",
      nodePreviews: ["category"],
    });
  }

  if (allowed.has("grouping_container")) {
    organisationLines.push({
      text: "Grouping containers let you hold related items together visually so clusters remain readable. This is useful for separating work areas, themes, causal groupings, or functional sections.",
      nodePreviews: ["grouping_container"],
    });
  }

  if (allowed.has("anchor")) {
    organisationLines.push({
      text: "Anchors create invisible navigation sequences so viewers can step through the map in a planned order without drawing extra relationship lines.",
      nodePreviews: ["anchor"],
    });
  }

  if (allowed.has("sticky_note")) {
    supportingLines.push({
      text: "Sticky notes are lightweight and fast. They are useful for provisional thinking, reminders, unanswered questions, and workshop capture before content is formalised elsewhere.",
      nodePreviews: ["sticky_note"],
    });
  }

  if (allowed.has("image_asset")) {
    supportingLines.push({
      text: "Image nodes add visual evidence or supporting material with a description. This helps when an incident needs photographic or diagrammatic context.",
      nodePreviews: ["image_asset"],
    });
  }

  if (allowed.has("text_box")) {
    supportingLines.push({
      text: "Text boxes are freeform explanatory annotations. They are useful when you need narrative, interpretation, or labels that do not fit a formal node type.",
      nodePreviews: ["text_box"],
    });
  }

  if (allowed.has("table")) {
    supportingLines.push({
      text: "Tables are useful when evidence or findings are easier to compare in rows and columns than as separate nodes.",
      nodePreviews: ["table"],
    });
  }

  const investigationPreviewKeys = [
    "incident_sequence_step",
    "incident_outcome",
    "incident_task_condition",
    "incident_factor",
    "incident_system_factor",
    "incident_control_barrier",
    "incident_evidence",
    "incident_response_recovery",
    "incident_finding",
    "incident_recommendation",
  ].filter((key) => allowed.has(key as NodePaletteKind));

  if (investigationPreviewKeys.length) {
    investigationLines.push({
      text: "Investigation nodes such as sequence steps, outcomes, task or condition, factors, system factors, controls or barriers, evidence, response or recovery, findings, and recommendations help you build a disciplined incident review instead of a loose sketch.",
      nodePreviews: investigationPreviewKeys,
    });
  }

  const sections = [
    { heading: "Core map nodes", lines: coreLines },
    { heading: "Organisation and framing nodes", lines: organisationLines },
    { heading: "Supporting content nodes", lines: supportingLines },
    { heading: "Investigation nodes", lines: investigationLines },
  ].filter((section) => section.lines.length > 0);

  return {
    id: "node-types",
    title: "Node Types And What They Add",
    summary: "What each available node type is good for, what it contributes to the investigation, and when it is useful.",
    sections,
  };
}

function matchesTopic(topic: HelpTopic, query: string) {
  if (!query) return true;
  const haystack = [
    topic.title,
    topic.summary,
    ...topic.sections.flatMap((section) => [
      section.heading,
      ...section.lines.flatMap((line) =>
        typeof line === "string"
          ? [line]
          : [line.text, ...(line.buttonVisuals?.map((visual) => visual.label) ?? []), ...(line.mediaVisuals?.map((visual) => visual.alt) ?? [])]
              .concat(line.videoVisuals?.map((visual) => visual.title) ?? [])
      ),
    ]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function CanvasHelpModal({
  open,
  isMobile = false,
  mapCategoryId,
  allowedNodeKinds,
  onClose,
}: CanvasHelpModalProps) {
  const [query, setQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("getting-started");

  const allTopics = useMemo(() => {
    const categoryTopics = categorySpecificTopics.filter((topic) => !topic.audience || topic.audience.includes(mapCategoryId));
    const dynamicNodeTypesTopic = buildNodeTypesTopic(allowedNodeKinds);
    return [...baseTopics.filter((topic) => topic.id !== "node-types"), dynamicNodeTypesTopic, ...categoryTopics];
  }, [allowedNodeKinds, mapCategoryId]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTopics = useMemo(
    () => allTopics.filter((topic) => matchesTopic(topic, normalizedQuery)),
    [allTopics, normalizedQuery]
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedTopicId("getting-started");
      return;
    }
    if (!filteredTopics.some((topic) => topic.id === selectedTopicId)) {
      setSelectedTopicId(filteredTopics[0]?.id ?? "getting-started");
    }
  }, [filteredTopics, open, selectedTopicId]);

  const selectedTopic = filteredTopics.find((topic) => topic.id === selectedTopicId) ?? filteredTopics[0] ?? null;

  if (!open) return null;

  const renderButtonVisual = (visual: { label: string; icon?: string; variant?: "headerIcon" | "headerText" | "headerHelp" | "floating" }) => {
    const variant = visual.variant ?? "floating";
    const icon = visual.icon ? (
      <span
        aria-hidden="true"
        className={`${variant === "floating" ? "h-6 w-6" : "h-4 w-4"} bg-current`}
        style={{
          WebkitMaskImage: `url('${visual.icon}')`,
          maskImage: `url('${visual.icon}')`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    ) : null;

    if (variant === "headerIcon") {
      return (
        <span
          key={`${visual.label}-${visual.icon ?? "text"}`}
          className="inline-flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-600/60 bg-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-600/60 bg-transparent text-white">
            {icon}
          </span>
        </span>
      );
    }

    if (variant === "headerText") {
      return (
        <span
          key={`${visual.label}-${visual.icon ?? "text"}`}
          className="inline-flex h-[62px] min-w-[88px] items-center justify-center rounded-2xl border border-slate-600/60 bg-black px-4 text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
        >
          {visual.label}
        </span>
      );
    }

    if (variant === "headerHelp") {
      return (
        <span
          key={`${visual.label}-${visual.icon ?? "text"}`}
          className="inline-flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-600/60 bg-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-600/60 bg-transparent text-white">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-current text-[10px] font-bold leading-none text-white">
              ?
            </span>
          </span>
        </span>
      );
    }

    return (
      <span
        key={`${visual.label}-${visual.icon ?? "text"}`}
        className={`inline-flex h-[62px] w-[62px] items-center justify-center rounded-2xl border shadow-[0_10px_24px_rgba(15,23,42,0.14)] ${
          visual.label === "Wizard"
            ? "border-[rgba(79,70,229,0.42)] bg-[linear-gradient(135deg,#2563eb_0%,#6d28d9_52%,#db2777_100%)] text-white"
            : "border-slate-200 bg-white text-black"
        }`}
        title={visual.label}
      >
        {icon ?? <span className="text-[10px] font-semibold">{visual.label}</span>}
      </span>
    );
  };

  const renderMiniDocumentTile = (bannerBg: string, bannerText: string, typeLabel: string) => (
    <div className="flex h-12 w-16 flex-col overflow-hidden rounded-[10px] border border-slate-300 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.14)]">
      <div className="flex h-3 items-center justify-center px-1 text-[4px] font-semibold uppercase tracking-[0.08em]" style={{ backgroundColor: bannerBg, color: bannerText }}>
        {typeLabel}
      </div>
      <div className="flex flex-1 flex-col px-1.5 py-1">
        <div className="h-1 rounded bg-slate-800/80" />
        <div className="mt-1 h-1 w-2/3 rounded bg-slate-400" />
        <div className="mt-auto rounded border border-slate-300 px-1 py-[2px]">
          <div className="h-1 w-4/5 rounded bg-slate-300" />
          <div className="mt-[2px] h-1 w-1/2 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );

  const renderMiniBowtieCard = (accent: string, background: string, border: string, labelBackground?: string, stripeHeader?: boolean) => (
    <div className="relative flex h-14 w-16 overflow-hidden rounded-[12px] border shadow-[0_6px_16px_rgba(15,23,42,0.14)]" style={{ backgroundColor: background, borderColor: border }}>
      <div className="w-1.5 shrink-0" style={{ backgroundColor: accent }} />
      <div className="flex min-w-0 flex-1 flex-col">
        {stripeHeader ? (
          <div className="h-2.5 w-full border-b border-slate-700" style={{ backgroundImage: "repeating-linear-gradient(-45deg, #111827 0 6px, #facc15 6px 12px)" }} />
        ) : (
          <div className="h-3.5 border-b px-1" style={{ backgroundColor: labelBackground ?? accent, borderColor: "rgba(15,23,42,0.08)" }} />
        )}
        <div className="flex flex-1 items-center justify-center px-1.5">
          <div className="w-full">
            <div className="h-1 rounded bg-slate-800/75" />
            <div className="mt-1 h-1 w-2/3 rounded bg-slate-400/80" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNodePreview = (key: string) => {
    switch (key) {
      case "document":
        return renderMiniDocumentTile("#111827", "#ffffff", "Procedure");
      case "system":
        return <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1e3a8a] px-2 text-[7px] font-semibold text-white shadow-[0_8px_20px_rgba(30,58,138,0.35)]">SYS</div>;
      case "process":
        return <div className="relative h-12 w-16 overflow-hidden"><svg viewBox="0 0 700 500" preserveAspectRatio="none" className="h-full w-full drop-shadow-[0_6px_16px_rgba(15,23,42,0.18)]"><path d="M0 0H700V500C640 458 560 450 486 485C435 510 389 509 338 484C260 447 186 446 112 479C74 496 37 503 0 500V0Z" fill="#ff751f" /></svg></div>;
      case "anchor":
        return <div className="flex h-12 w-16 flex-col overflow-hidden rounded-lg border border-[#0f766e] bg-white shadow-[0_6px_16px_rgba(15,23,42,0.14)]"><div className="flex h-5 items-center justify-between bg-[#0f766e] px-1 text-white"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true"><path d="M12 3.5v14m-4.5-8H16.5M8 17.5c-2.4-.8-4-2.6-4-4.9h3m9 4.9c2.4-.8 4-2.6 4-4.9h-3M9.2 5.8a2.8 2.8 0 1 0 5.6 0 2.8 2.8 0 0 0-5.6 0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg><span className="rounded-full bg-white px-1 text-[7px] font-bold text-[#0f766e]">1</span></div><div className="flex flex-1 items-center justify-center px-1"><div className="h-1.5 w-9 rounded bg-slate-700" /></div></div>;
      case "incident_sequence_step":
        return renderMiniDocumentTile("#bfdbfe", "#111827", "Step");
      case "incident_outcome":
        return renderMiniDocumentTile("#ef4444", "#ffffff", "Outcome");
      case "incident_task_condition":
        return renderMiniDocumentTile("#fb923c", "#111827", "Task");
      case "incident_factor":
        return renderMiniDocumentTile("#fde047", "#111827", "Factor");
      case "incident_system_factor":
        return renderMiniDocumentTile("#a78bfa", "#111827", "System");
      case "incident_control_barrier":
        return renderMiniDocumentTile("#4ade80", "#111827", "Barrier");
      case "incident_evidence":
        return renderMiniDocumentTile("#cbd5e1", "#111827", "Evidence");
      case "incident_response_recovery":
        return renderMiniDocumentTile("#ec4899", "#ffffff", "Response");
      case "incident_finding":
        return renderMiniDocumentTile("#1d4ed8", "#ffffff", "Finding");
      case "incident_recommendation":
        return renderMiniDocumentTile("#14b8a6", "#111827", "Recommend");
      case "person":
        return <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]"><img src="/icons/account.svg" alt="" className="h-full w-full object-contain" /></div>;
      case "equipment":
        return <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]"><img src="/icons/equipment.svg" alt="" className="h-full w-full object-contain" /></div>;
      case "environment":
        return <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]"><img src="/icons/environment.svg" alt="" className="h-full w-full object-contain" /></div>;
      case "category":
        return <div className="flex h-12 w-16 flex-col border bg-[#249BC7] px-1 py-1 text-white shadow-[0_6px_20px_rgba(15,23,42,0.18)]" style={{ borderColor: "#249BC7" }}><div className="text-center text-[5px] font-semibold uppercase tracking-[0.14em]">Category</div><div className="flex flex-1 items-center justify-center"><div className="h-1.5 w-8 rounded bg-white/80" /></div></div>;
      case "grouping_container":
        return <div className="relative h-12 w-16 rounded-[10px] border bg-transparent shadow-[0_6px_16px_rgba(15,23,42,0.12)]" style={{ borderColor: "#000000" }}><div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black bg-white px-2 py-[2px] text-[5px] text-slate-800 shadow-[0_3px_8px_rgba(15,23,42,0.12)]">Group</div></div>;
      case "sticky_note":
        return <div className="h-14 w-14 border border-[#facc15] bg-[#fef08a] shadow-[0_10px_24px_rgba(15,23,42,0.22)]" />;
      case "image_asset":
        return <div className="flex h-14 w-16 items-center justify-center overflow-hidden border border-slate-300 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.12)]"><img src="/icons/image.svg" alt="" className="h-8 w-8 object-contain opacity-70" /></div>;
      case "text_box":
        return <div className="flex h-14 w-16 items-center justify-center"><img src="/icons/texticon.svg" alt="" className="h-10 w-10 object-contain" /></div>;
      case "table":
        return <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.14)]"><div className="h-3 w-full bg-[#249BC7]" /><div className="grid h-11 w-16 grid-cols-3 grid-rows-3 gap-0 border-t border-slate-300 p-1">{Array.from({ length: 9 }).map((_, index) => <span key={index} className="border border-slate-300 bg-white" />)}</div></div>;
      case "shape_rectangle":
        return <div className="h-10 w-16 bg-[#249BC7] shadow-[0_6px_16px_rgba(15,23,42,0.14)]" />;
      case "shape_circle":
        return <div className="h-12 w-12 rounded-full bg-[#249BC7] shadow-[0_6px_16px_rgba(15,23,42,0.14)]" />;
      case "shape_pill":
        return <div className="h-10 w-16 rounded-full bg-[#249BC7] shadow-[0_6px_16px_rgba(15,23,42,0.14)]" />;
      case "shape_pentagon":
        return <div className="h-12 w-14 bg-[#249BC7] shadow-[0_6px_16px_rgba(15,23,42,0.14)]" style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }} />;
      case "shape_chevron_left":
        return <div className="h-10 w-16 bg-[#249BC7] shadow-[0_6px_16px_rgba(15,23,42,0.14)]" style={{ clipPath: "polygon(28% 0%, 100% 0%, 72% 50%, 100% 100%, 28% 100%, 0% 50%)" }} />;
      case "shape_arrow":
        return <div className="h-10 w-16 bg-[#249BC7] shadow-[0_6px_16px_rgba(15,23,42,0.14)]" style={{ clipPath: "polygon(0% 35%, 58% 35%, 58% 10%, 100% 50%, 58% 90%, 58% 65%, 0% 65%)" }} />;
      case "bowtie_hazard":
        return renderMiniBowtieCard("#facc15", "#f8fafc", "#334155", undefined, true);
      case "bowtie_top_event":
        return renderMiniBowtieCard("#22c55e", "#ecfdf5", "#16a34a", "#16a34a");
      case "bowtie_threat":
        return renderMiniBowtieCard("#f97316", "#fff7ed", "#fb923c", "#fdba74");
      case "bowtie_consequence":
        return renderMiniBowtieCard("#ef4444", "#fef2f2", "#f87171", "#f87171");
      case "bowtie_control":
        return renderMiniBowtieCard("#3b82f6", "#eff6ff", "#60a5fa", "#93c5fd");
      case "bowtie_escalation_factor":
        return renderMiniBowtieCard("#a855f7", "#faf5ff", "#c084fc", "#d8b4fe");
      case "bowtie_recovery_measure":
        return renderMiniBowtieCard("#14b8a6", "#f0fdfa", "#2dd4bf", "#5eead4");
      case "bowtie_degradation_indicator":
        return renderMiniBowtieCard("#64748b", "#f8fafc", "#94a3b8", "#cbd5e1");
      case "bowtie_risk_rating":
        return renderMiniBowtieCard("#111827", "#fef3c7", "#f59e0b", undefined, true);
      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 z-[121] ${isMobile ? "bg-white" : "flex items-center justify-center bg-[rgba(15,23,42,0.5)] px-4 py-6"}`}>
      <div
        className={
          isMobile
            ? "flex h-full w-full flex-col overflow-hidden bg-white"
            : "flex h-[min(90vh,860px)] w-full max-w-[1220px] overflow-hidden rounded-[30px] border border-white/45 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))] shadow-[0_34px_80px_rgba(15,23,42,0.28)]"
        }
      >
        <aside
          className={`${
            isMobile
              ? "border-b border-slate-200/80 px-4 py-4"
              : "hidden w-[290px] border-r border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(241,245,249,0.92))] p-5 lg:flex lg:min-h-0 lg:flex-col"
          }`}
        >
          <div className="shrink-0 rounded-2xl bg-[linear-gradient(135deg,#dbeafe_0%,#ecfccb_52%,#fde68a_100%)] p-4 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Canvas Help</p>
            <h2 className="mt-2 text-xl font-semibold">Reference For {categoryLabelById[mapCategoryId]}</h2>
            <p className="mt-2 text-sm text-slate-700">Browse topics from the left, then search the reference on desktop when you need something specific.</p>
          </div>
          {!isMobile ? (
            <div className="mt-5 min-h-0 flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredTopics.map((topic) => {
                const active = topic.id === selectedTopic?.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`block w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                      active
                        ? "border border-slate-200 bg-white text-slate-950 shadow-[0_12px_26px_rgba(15,23,42,0.12)]"
                        : "bg-transparent text-slate-600 hover:bg-white/70 hover:text-slate-800"
                    }`}
                  >
                    <div className="font-semibold">{topic.title}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">{topic.summary}</div>
                  </button>
                );
              })}
              {!filteredTopics.length ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
                  No topics match that search.
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          <header className="border-b border-slate-200/80 px-5 py-4 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {isMobile ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Canvas Help</p>
                    <p className="mt-2 text-sm text-slate-600">Choose a topic from the dropdown below to browse the canvas reference.</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search Help</p>
                    <div className="mt-2">
                      <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search topics, features, or steps"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      Search filters the topic list and the selected content using titles, section headings, and descriptive help text.
                    </p>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            {isMobile ? (
              <label className="mt-4 block w-full text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Topic
                <select
                  className="mt-2 block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none"
                  value={selectedTopic?.id ?? ""}
                  onChange={(event) => setSelectedTopicId(event.target.value)}
                >
                  {filteredTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
            {selectedTopic ? (
              <div className="max-w-4xl">
                <div className="pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Topic</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedTopic.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{selectedTopic.summary}</p>
                </div>

                <div className="border-t border-slate-200" />

                {selectedTopic.sections.map((section, index) => (
                  <div key={`${selectedTopic.id}-${section.heading}`} className="py-4">
                    {(() => {
                      const usePerLineNodePreviewLayout = selectedTopic.id === "node-types";
                      const sectionHasButtonVisuals = section.lines.some(
                        (line) => typeof line !== "string" && (line.buttonVisuals?.length ?? 0) > 0
                      );
                      const sectionMediaVisuals = section.lines.flatMap((line) =>
                        typeof line === "string" ? [] : (line.mediaVisuals ?? [])
                      );
                      const sectionVideoVisuals = section.lines.flatMap((line) =>
                        typeof line === "string" ? [] : (line.videoVisuals ?? [])
                      );
                      if (usePerLineNodePreviewLayout) {
                        return (
                          <>
                            <div className="grid gap-3 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] md:items-end md:gap-5">
                              <h3 className="text-base font-semibold text-slate-900">{section.heading}</h3>
                              <div className="hidden md:block" />
                            </div>
                            <div className="mt-2 grid gap-4">
                              {section.lines.map((line, lineIndex) => {
                                const text = typeof line === "string" ? line : line.text;
                                const nodePreviews = typeof line === "string" ? [] : (line.nodePreviews ?? []);
                                return (
                                  <div
                                    key={`${section.heading}-${lineIndex}`}
                                    className="grid gap-3 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] md:items-start md:gap-5"
                                  >
                                    <p className="text-sm leading-6 text-slate-700">{text}</p>
                                    <div className="flex min-w-0 flex-wrap items-center justify-center gap-2">
                                      {nodePreviews.map((previewKey) => (
                                        <span key={`${section.heading}-${lineIndex}-${previewKey}`} className="inline-flex items-center justify-center">
                                          {renderNodePreview(previewKey)}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {index < selectedTopic.sections.length - 1 ? <div className="mt-4 border-t border-slate-200" /> : null}
                          </>
                        );
                      }

                      const sectionHasAnySupport =
                        sectionHasButtonVisuals || sectionMediaVisuals.length > 0 || sectionVideoVisuals.length > 0;

                      return (
                        <>
                    {sectionHasAnySupport ? (
                      <>
                        <div className="grid gap-3 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] md:items-end md:gap-5">
                          <h3 className="text-base font-semibold text-slate-900">{section.heading}</h3>
                          <div className="min-w-0">
                            {sectionHasButtonVisuals && !isMobile ? (
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 md:text-center">What To Look For</p>
                            ) : (
                              <div className="hidden md:block" />
                            )}
                          </div>
                        </div>
                        <div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] md:items-start md:gap-5">
                          <div className="min-w-0 grid gap-2">
                            {section.lines.map((line, lineIndex) => {
                              const text = typeof line === "string" ? line : line.text;
                              return (
                                <p key={`${section.heading}-${lineIndex}`} className="text-sm leading-6 text-slate-700">
                                  {text}
                                </p>
                              );
                            })}
                          </div>
                          <div className="min-w-0">
                            <div className="flex min-w-0 flex-col items-center justify-center gap-3">
                              {sectionHasButtonVisuals ? (
                                <div className="w-full rounded-2xl bg-[#f6f7f8] px-4 py-3">
                                  <div className="flex min-w-0 flex-wrap items-center justify-center gap-2">
                                    {section.lines.flatMap((line) =>
                                      typeof line === "string" ? [] : (line.buttonVisuals ?? []).map(renderButtonVisual)
                                    )}
                                  </div>
                                </div>
                              ) : null}
                              {sectionMediaVisuals.map((visual) => (
                                <img
                                  key={`${visual.src}-${visual.alt}`}
                                  src={visual.src}
                                  alt={visual.alt}
                                  className="max-h-[220px] w-full max-w-[240px] rounded-xl object-contain"
                                />
                              ))}
                              {sectionVideoVisuals.map((visual) => (
                                <video
                                  key={`${visual.src}-${visual.title}`}
                                  className="max-h-[220px] w-full max-w-[240px] rounded-xl object-contain"
                                  src={visual.src}
                                  title={visual.title}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-base font-semibold text-slate-900">{section.heading}</h3>
                        <div className="mt-2 grid gap-2">
                          {section.lines.map((line, lineIndex) => {
                            const text = typeof line === "string" ? line : line.text;
                            return (
                              <p key={`${section.heading}-${lineIndex}`} className="text-sm leading-6 text-slate-700">
                                {text}
                              </p>
                            );
                          })}
                        </div>
                      </>
                    )}
                    {index < selectedTopic.sections.length - 1 ? <div className="mt-4 border-t border-slate-200" /> : null}
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 text-sm text-slate-600">
                No help topics match the current search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
