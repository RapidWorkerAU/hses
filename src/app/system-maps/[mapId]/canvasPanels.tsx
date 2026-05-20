"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import type { InvestigationTemplateVisibility } from "@/lib/investigationTemplates";
import type { MapMemberProfileRow, SystemMap } from "./canvasShared";
import type { NodePaletteKind } from "./mapCategories";

const getContrastTextColor = (hex: string | null | undefined) => {
  if (!hex) return "#ffffff";
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return "#ffffff";
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#0f172a" : "#ffffff";
};

type CanvasActionButtonsProps = {
  viewerMode?: "member" | "guest";
  isMobile: boolean;
  backHref: string;
  backTitle: string;
  showMapInfoAside: boolean;
  canUndoSessionChanges: boolean;
  canRedoSessionChanges: boolean;
  onUndoSessionChanges: () => void;
  onRedoSessionChanges: () => void;
  rf: {
    fitView: (opts?: { duration?: number; padding?: number }) => void;
    setViewport: (v: { x: number; y: number; zoom: number }, opts?: { duration?: number }) => void;
  } | null;
  setShowAddMenu: (updater: (prev: boolean) => boolean) => void;
  showAddMenu: boolean;
  addMenuRef: RefObject<HTMLDivElement | null>;
  canUseSuggestionCheck: boolean;
  suggestionsDisabledReason?: string;
  showSuggestionsMenu: boolean;
  suggestionMenuRef: RefObject<HTMLDivElement | null>;
  onToggleSuggestionsMenu: () => void;
  isLoadingSuggestions: boolean;
  suggestionProgress: number;
  suggestionOverview: string;
  suggestionPrompt: string;
  setSuggestionPrompt: (value: string) => void;
  suggestions: Array<{
    id: string;
    title: string;
    question: string;
    rationale: string;
    priority: "low" | "medium" | "high";
    category: string;
  }>;
  suggestionError: string | null;
  suggestionsLastUpdatedAt: string | null;
  onRunSuggestionCheck: () => void;
  onDismissSuggestion: (suggestionId: string) => void;
  showSearchMenu: boolean;
  setShowSearchMenu: (updater: (prev: boolean) => boolean) => void;
  searchMenuRef: RefObject<HTMLDivElement | null>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchResults: Array<{
    id: string;
    label: string;
    documentNumber: string | null;
    kind: string;
    description?: string;
    kindColor?: string | null;
    kindTextColor?: string | null;
    kindBorderColor?: string | null;
  }>;
  onSelectSearchResult: (id: string) => void;
  canWriteMap: boolean;
  canUseWizard: boolean;
  addDisabledReason?: string;
  wizardDisabledReason?: string;
  canPrint: boolean;
  printDisabledReason?: string;
  onOpenWizard: () => void;
  canCreateSticky: boolean;
  handleAddBlankDocument: () => void;
  handleAddSystemCircle: () => void;
  handleAddProcessComponent: () => void;
  handleAddPerson: () => void;
  handleAddEquipment: () => void;
  handleAddEnvironment: () => void;
  handleAddAnchor: () => void;
  handleAddProcessHeading: () => void;
  handleAddGroupingContainer: () => void;
  handleAddStickyNote: () => void;
  handleStartAddImageAsset: () => void;
  handleAddTextBox: () => void;
  handleAddTable: () => void;
  handleAddShapeRectangle: () => void;
  handleAddShapeCircle: () => void;
  handleAddShapePill: () => void;
  handleAddShapePentagon: () => void;
  handleAddShapeChevronLeft: () => void;
  handleAddShapeArrow: () => void;
  handleAddBowtieHazard: () => void;
  handleAddBowtieTopEvent: () => void;
  handleAddBowtieThreat: () => void;
  handleAddBowtieConsequence: () => void;
  handleAddBowtieControl: () => void;
  handleAddBowtieEscalationFactor: () => void;
  handleAddBowtieRecoveryMeasure: () => void;
  handleAddBowtieDegradationIndicator: () => void;
  handleAddBowtieRiskRating: () => void;
  handleAddIncidentSequenceStep: () => void;
  handleAddIncidentOutcome: () => void;
  handleAddIncidentTaskCondition: () => void;
  handleAddIncidentFactor: () => void;
  handleAddIncidentSystemFactor: () => void;
  handleAddIncidentControlBarrier: () => void;
  handleAddIncidentEvidence: () => void;
  handleAddIncidentResponseRecovery: () => void;
  handleAddIncidentFinding: () => void;
  handleAddIncidentRecommendation: () => void;
  allowedNodeKinds: NodePaletteKind[];
  canSaveTemplate: boolean;
  canvasInteractionLocked: boolean;
  onToggleCanvasInteractionLock: () => void;
  isPlatformAdmin: boolean;
  isOrgTemplateUser: boolean;
  templateVisibility: InvestigationTemplateVisibility;
  setTemplateVisibility: (visibility: InvestigationTemplateVisibility) => void;
  templateDisabledReason?: string;
  showTemplateMenu: boolean;
  setShowTemplateMenu: (updater: (prev: boolean) => boolean) => void;
  templateMenuRef: RefObject<HTMLDivElement | null>;
  templateQuery: string;
  setTemplateQuery: (value: string) => void;
  templateResults: Array<{ id: string; name: string; updatedAt: string; isGlobal: boolean; visibility: InvestigationTemplateVisibility }>;
  isLoadingTemplates: boolean;
  isSavingTemplate: boolean;
  templateSaveMessage: string | null;
  onSelectTemplate: (id: string, name: string, visibility: InvestigationTemplateVisibility) => void;
  onSaveTemplate: () => void;
  showPrintMenu: boolean;
  setShowPrintMenu: (updater: (prev: boolean) => boolean) => void;
  printMenuRef: RefObject<HTMLDivElement | null>;
  onPrintCurrentView: () => void;
  onPrintSelectArea: () => void;
  isPreparingPrint: boolean;
};

export function CanvasActionButtons({
  viewerMode = "member",
  isMobile,
  backHref,
  backTitle,
  showMapInfoAside,
  canUndoSessionChanges,
  canRedoSessionChanges,
  onUndoSessionChanges,
  onRedoSessionChanges,
  rf,
  setShowAddMenu,
  showAddMenu,
  addMenuRef,
  canUseSuggestionCheck,
  suggestionsDisabledReason,
  showSuggestionsMenu,
  suggestionMenuRef,
  onToggleSuggestionsMenu,
  isLoadingSuggestions,
  suggestionProgress,
  suggestionOverview,
  suggestionPrompt,
  setSuggestionPrompt,
  suggestions,
  suggestionError,
  suggestionsLastUpdatedAt,
  onRunSuggestionCheck,
  onDismissSuggestion,
  showSearchMenu,
  setShowSearchMenu,
  searchMenuRef,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSelectSearchResult,
  canWriteMap,
  canUseWizard,
  addDisabledReason,
  wizardDisabledReason,
  canPrint,
  printDisabledReason,
  onOpenWizard,
  canCreateSticky,
  handleAddBlankDocument,
  handleAddSystemCircle,
  handleAddProcessComponent,
  handleAddPerson,
  handleAddEquipment,
  handleAddEnvironment,
  handleAddAnchor,
  handleAddProcessHeading,
  handleAddGroupingContainer,
  handleAddStickyNote,
  handleStartAddImageAsset,
  handleAddTextBox,
  handleAddTable,
  handleAddShapeRectangle,
  handleAddShapeCircle,
  handleAddShapePill,
  handleAddShapePentagon,
  handleAddShapeChevronLeft,
  handleAddShapeArrow,
  handleAddBowtieHazard,
  handleAddBowtieTopEvent,
  handleAddBowtieThreat,
  handleAddBowtieConsequence,
  handleAddBowtieControl,
  handleAddBowtieEscalationFactor,
  handleAddBowtieRecoveryMeasure,
  handleAddBowtieDegradationIndicator,
  handleAddBowtieRiskRating,
  handleAddIncidentSequenceStep,
  handleAddIncidentOutcome,
  handleAddIncidentTaskCondition,
  handleAddIncidentFactor,
  handleAddIncidentSystemFactor,
  handleAddIncidentControlBarrier,
  handleAddIncidentEvidence,
  handleAddIncidentResponseRecovery,
  handleAddIncidentFinding,
  handleAddIncidentRecommendation,
  allowedNodeKinds,
  canSaveTemplate,
  canvasInteractionLocked,
  onToggleCanvasInteractionLock,
  isPlatformAdmin,
  isOrgTemplateUser,
  templateVisibility,
  setTemplateVisibility,
  templateDisabledReason,
  showTemplateMenu,
  setShowTemplateMenu,
  templateMenuRef,
  templateQuery,
  setTemplateQuery,
  templateResults,
  isLoadingTemplates,
  isSavingTemplate,
  templateSaveMessage,
  onSelectTemplate,
  onSaveTemplate,
  showPrintMenu,
  setShowPrintMenu,
  printMenuRef,
  onPrintCurrentView,
  onPrintSelectArea,
  isPreparingPrint,
}: CanvasActionButtonsProps) {
  const allowed = new Set<NodePaletteKind>(allowedNodeKinds);
  const isGuestViewer = viewerMode === "guest";
  const leaveHref = isGuestViewer ? "/subscribe" : backHref;
  const leaveTitle = isGuestViewer ? "Leave case study" : backTitle;
  const leaveLabel = isGuestViewer ? "Leave" : "Exit";
  type AddItemGroup = "core" | "investigation" | "bowtie" | "content" | "shapes";
  type AddItem = { key: string; label: string; group: AddItemGroup; onClick: () => void };
  const [activeAddFilter, setActiveAddFilter] = useState<"all" | AddItemGroup>("all");
  const searchTriggerRef = useRef<HTMLDivElement | null>(null);
  const templateTriggerRef = useRef<HTMLDivElement | null>(null);
  const [templateMenuStyle, setTemplateMenuStyle] = useState<CSSProperties>({});
  const [searchMenuStyle, setSearchMenuStyle] = useState<CSSProperties>({});
  const addItems: AddItem[] = [];
  if (canWriteMap) {
    if (allowed.has("document")) addItems.push({ key: "document", label: "Document", group: "core", onClick: handleAddBlankDocument });
    if (allowed.has("system")) addItems.push({ key: "system", label: "System", group: "core", onClick: handleAddSystemCircle });
    if (allowed.has("process")) addItems.push({ key: "process", label: "Process", group: "core", onClick: handleAddProcessComponent });
    if (allowed.has("person")) addItems.push({ key: "person", label: "Person", group: "investigation", onClick: handleAddPerson });
    if (allowed.has("equipment")) addItems.push({ key: "equipment", label: "Equipment", group: "investigation", onClick: handleAddEquipment });
    if (allowed.has("environment")) addItems.push({ key: "environment", label: "Environment", group: "investigation", onClick: handleAddEnvironment });
    if (allowed.has("anchor")) addItems.push({ key: "anchor", label: "Anchor", group: "investigation", onClick: handleAddAnchor });
    if (allowed.has("category")) addItems.push({ key: "category", label: "Category", group: "investigation", onClick: handleAddProcessHeading });
    if (allowed.has("grouping_container")) {
      addItems.push({ key: "grouping_container", label: "Group", group: "investigation", onClick: handleAddGroupingContainer });
    }
    if (allowed.has("bowtie_hazard")) addItems.push({ key: "bowtie_hazard", label: "Hazard", group: "bowtie", onClick: handleAddBowtieHazard });
    if (allowed.has("bowtie_top_event")) addItems.push({ key: "bowtie_top_event", label: "Top Event", group: "bowtie", onClick: handleAddBowtieTopEvent });
    if (allowed.has("bowtie_threat")) addItems.push({ key: "bowtie_threat", label: "Threat", group: "bowtie", onClick: handleAddBowtieThreat });
    if (allowed.has("bowtie_consequence")) {
      addItems.push({ key: "bowtie_consequence", label: "Consequence", group: "bowtie", onClick: handleAddBowtieConsequence });
    }
    if (allowed.has("bowtie_control")) addItems.push({ key: "bowtie_control", label: "Control", group: "bowtie", onClick: handleAddBowtieControl });
    if (allowed.has("bowtie_escalation_factor")) {
      addItems.push({ key: "bowtie_escalation_factor", label: "Escalation Factor", group: "bowtie", onClick: handleAddBowtieEscalationFactor });
    }
    if (allowed.has("bowtie_recovery_measure")) {
      addItems.push({ key: "bowtie_recovery_measure", label: "Recovery Measure", group: "bowtie", onClick: handleAddBowtieRecoveryMeasure });
    }
    if (allowed.has("bowtie_degradation_indicator")) {
      addItems.push({
        key: "bowtie_degradation_indicator",
        label: "Degradation Indicator",
        group: "bowtie",
        onClick: handleAddBowtieDegradationIndicator,
      });
    }
    if (allowed.has("bowtie_risk_rating")) {
      addItems.push({ key: "bowtie_risk_rating", label: "Risk Rating", group: "bowtie", onClick: handleAddBowtieRiskRating });
    }
    if (allowed.has("incident_sequence_step")) {
      addItems.push({ key: "incident_sequence_step", label: "Sequence Step", group: "investigation", onClick: handleAddIncidentSequenceStep });
    }
    if (allowed.has("incident_outcome")) {
      addItems.push({ key: "incident_outcome", label: "Outcome", group: "investigation", onClick: handleAddIncidentOutcome });
    }
    if (allowed.has("incident_task_condition")) {
      addItems.push({ key: "incident_task_condition", label: "Task / Condition", group: "investigation", onClick: handleAddIncidentTaskCondition });
    }
    if (allowed.has("incident_factor")) {
      addItems.push({ key: "incident_factor", label: "Factor", group: "investigation", onClick: handleAddIncidentFactor });
    }
    if (allowed.has("incident_system_factor")) {
      addItems.push({ key: "incident_system_factor", label: "System Factor", group: "investigation", onClick: handleAddIncidentSystemFactor });
    }
    if (allowed.has("incident_control_barrier")) {
      addItems.push({ key: "incident_control_barrier", label: "Control / Barrier", group: "investigation", onClick: handleAddIncidentControlBarrier });
    }
    if (allowed.has("incident_evidence")) {
      addItems.push({ key: "incident_evidence", label: "Evidence", group: "investigation", onClick: handleAddIncidentEvidence });
    }
    if (allowed.has("incident_response_recovery")) {
      addItems.push({
        key: "incident_response_recovery",
        label: "Response / Recovery",
        group: "investigation",
        onClick: handleAddIncidentResponseRecovery,
      });
    }
    if (allowed.has("incident_finding")) {
      addItems.push({ key: "incident_finding", label: "Finding", group: "investigation", onClick: handleAddIncidentFinding });
    }
    if (allowed.has("incident_recommendation")) {
      addItems.push({ key: "incident_recommendation", label: "Recommendation", group: "investigation", onClick: handleAddIncidentRecommendation });
    }
    if (allowed.has("image_asset")) addItems.push({ key: "image_asset", label: "Image", group: "content", onClick: handleStartAddImageAsset });
    if (allowed.has("text_box")) addItems.push({ key: "text_box", label: "Text Box", group: "content", onClick: handleAddTextBox });
    if (allowed.has("table")) addItems.push({ key: "table", label: "Table", group: "content", onClick: handleAddTable });
    if (allowed.has("shape_rectangle")) {
      addItems.push({ key: "shape_rectangle", label: "Rectangle", group: "shapes", onClick: handleAddShapeRectangle });
    }
    if (allowed.has("shape_circle")) addItems.push({ key: "shape_circle", label: "Circle", group: "shapes", onClick: handleAddShapeCircle });
    if (allowed.has("shape_pill")) addItems.push({ key: "shape_pill", label: "Pill", group: "shapes", onClick: handleAddShapePill });
    if (allowed.has("shape_pentagon")) {
      addItems.push({ key: "shape_pentagon", label: "Pentagon", group: "shapes", onClick: handleAddShapePentagon });
    }
    if (allowed.has("shape_chevron_left")) {
      addItems.push({ key: "shape_chevron_left", label: "Chevron", group: "shapes", onClick: handleAddShapeChevronLeft });
    }
    if (allowed.has("shape_arrow")) addItems.push({ key: "shape_arrow", label: "Arrow", group: "shapes", onClick: handleAddShapeArrow });
  }
  if (canCreateSticky && allowed.has("sticky_note")) {
    addItems.push({ key: "sticky_note", label: "Sticky Note", group: "content", onClick: handleAddStickyNote });
  }

  const addItemGroupOrder: AddItemGroup[] = ["core", "investigation", "bowtie", "content", "shapes"];
  const addItemGroupLabels: Record<AddItemGroup, string> = {
    core: "Core",
    investigation: "Investigation",
    bowtie: "Bowtie",
    content: "Content",
    shapes: "Shapes",
  };
  const addItemGroups = addItemGroupOrder
    .map((group) => ({ group, label: addItemGroupLabels[group], items: addItems.filter((item) => item.group === group) }))
    .filter((section) => section.items.length > 0);
  const visibleAddItemGroups = (activeAddFilter === "all"
    ? addItemGroups
    : activeAddFilter === "content"
    ? [
        {
          group: "content" as const,
          label: "Content",
          items: addItems.filter((item) => item.group === "content" || item.group === "shapes"),
        },
      ]
    : addItemGroups.filter((section) => section.group === activeAddFilter)
  ).filter((section) => section.items.length > 0);
  const addFilterPillsBase: Array<{ key: "all" | AddItemGroup; label: string }> = [
    { key: "all", label: "All" },
    { key: "core", label: "Core" },
    { key: "investigation", label: "Investigation" },
    { key: "content", label: "Content" },
    { key: "bowtie", label: "Bowtie" },
  ];
  const addFilterPills = addFilterPillsBase.filter(
    (pill) => pill.key === "all" || addItemGroups.some((section) => section.group === pill.key)
  );

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

  const renderAddItemPreview = (key: string) => {
    switch (key) {
      case "document":
        return renderMiniDocumentTile("#111827", "#ffffff", "Procedure");
      case "system":
        return (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1e3a8a] px-2 text-[7px] font-semibold text-white shadow-[0_8px_20px_rgba(30,58,138,0.35)]">
            SYS
          </div>
        );
      case "process":
        return (
          <div className="relative h-12 w-16 overflow-hidden">
            <svg viewBox="0 0 700 500" preserveAspectRatio="none" className="h-full w-full drop-shadow-[0_6px_16px_rgba(15,23,42,0.18)]">
              <path
                d="M0 0H700V500C640 458 560 450 486 485C435 510 389 509 338 484C260 447 186 446 112 479C74 496 37 503 0 500V0Z"
                fill="#ff751f"
              />
            </svg>
          </div>
        );
      case "anchor":
        return (
          <div className="flex h-12 w-20 items-center justify-center">
            <img
              src="/icons/anchor.svg"
              alt=""
              className="h-full w-full object-contain drop-shadow-[0_6px_16px_rgba(15,23,42,0.16)]"
            />
          </div>
        );
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
        return (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]">
            <img src="/icons/account.svg" alt="" className="h-full w-full object-contain" />
          </div>
        );
      case "equipment":
        return (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]">
            <img src="/icons/equipment.svg" alt="" className="h-full w-full object-contain" />
          </div>
        );
      case "environment":
        return (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]">
            <img src="/icons/environment.svg" alt="" className="h-full w-full object-contain" />
          </div>
        );
      case "category":
        return (
          <div className="flex h-12 w-16 flex-col border bg-[#249BC7] px-1 py-1 text-white shadow-[0_6px_20px_rgba(15,23,42,0.18)]" style={{ borderColor: "#249BC7" }}>
            <div className="text-center text-[5px] font-semibold uppercase tracking-[0.14em]">Category</div>
            <div className="flex flex-1 items-center justify-center">
              <div className="h-1.5 w-8 rounded bg-white/80" />
            </div>
          </div>
        );
      case "grouping_container":
        return (
          <div className="relative h-12 w-16 rounded-[10px] border bg-transparent shadow-[0_6px_16px_rgba(15,23,42,0.12)]" style={{ borderColor: "#000000" }}>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black bg-white px-2 py-[2px] text-[5px] text-slate-800 shadow-[0_3px_8px_rgba(15,23,42,0.12)]">
              Group
            </div>
          </div>
        );
      case "sticky_note":
        return <div className="h-14 w-14 border border-[#facc15] bg-[#fef08a] shadow-[0_10px_24px_rgba(15,23,42,0.22)]" />;
      case "image_asset":
        return (
          <div className="flex h-14 w-16 items-center justify-center overflow-hidden border border-slate-300 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.12)]">
            <img src="/icons/image.svg" alt="" className="h-8 w-8 object-contain opacity-70" />
          </div>
        );
      case "text_box":
        return (
          <div className="flex h-14 w-16 items-center justify-center">
            <img src="/icons/texticon.svg" alt="" className="h-10 w-10 object-contain" />
          </div>
        );
      case "table":
        return (
          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.14)]">
            <div className="h-3 w-full bg-[#249BC7]" />
            <div className="grid h-11 w-16 grid-cols-3 grid-rows-3 gap-0 border-t border-slate-300 p-1">
              {Array.from({ length: 9 }).map((_, index) => (
                <span key={index} className="border border-slate-300 bg-white" />
              ))}
            </div>
          </div>
        );
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
        return renderMiniBowtieCard("#f97316", "#fff7ed", "#fb923c", "#f97316");
      case "bowtie_consequence":
        return renderMiniBowtieCard("#ef4444", "#fef2f2", "#f87171", "#ef4444");
      case "bowtie_escalation_factor":
      case "bowtie_recovery_measure":
      case "bowtie_degradation_indicator":
      case "bowtie_risk_rating":
        return renderMiniBowtieCard("#8b5cf6", "#f5f3ff", "#a78bfa", "#8b5cf6");
      case "bowtie_control":
        return renderMiniBowtieCard("#16a34a", "#ecfdf5", "#4ade80", "#16a34a");
      default:
        return <div className="h-12 w-12 rounded-2xl bg-slate-300 shadow-[0_6px_16px_rgba(15,23,42,0.14)]" />;
    }
  };

  const floatingButtonClass =
    "group flex h-[56px] w-[56px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]";
  const mobileLockButtonClass = `group flex h-[56px] w-[56px] items-center justify-center rounded-2xl border shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 ${
    canvasInteractionLocked
      ? "border-[#102a43] bg-[#102a43] text-white"
      : "border-slate-200 bg-white text-black"
  }`;
  const desktopRailButtonClass =
    "group flex h-[56px] w-[56px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-[#1f2937] transition-colors duration-150 hover:bg-white hover:text-black";
  const desktopRailPrimaryButtonClass =
    "group flex h-[56px] w-[56px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-white transition-all duration-150 hover:brightness-[1.03]";
  const desktopRailLabelClass = "text-[10px] font-medium leading-none tracking-[0.01em]";
  const desktopFlyoutClass =
    "fixed z-[170] rounded-[28px] border border-white/45 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))] text-sm shadow-[0_28px_64px_rgba(15,23,42,0.24)] backdrop-blur";

  useLayoutEffect(() => {
    const viewportPadding = 15;
    const horizontalGap = 24;
    const computeStyle = (
      trigger: HTMLDivElement | null,
      menu: HTMLDivElement | null,
      options?: { stableTopFrom?: HTMLDivElement | null },
    ): CSSProperties => {
      if (!trigger || !menu || typeof window === "undefined") return {};
      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const menuWidth = Math.min(menuRect.width || 220, window.innerWidth - viewportPadding * 2);
      const preferredLeft = triggerRect.right + horizontalGap;
      const maxLeft = Math.max(viewportPadding, window.innerWidth - viewportPadding - menuWidth);
      const left = Math.min(Math.max(preferredLeft, viewportPadding), maxLeft);
      const stableTopTriggerRect = options?.stableTopFrom?.getBoundingClientRect();
      if (stableTopTriggerRect) {
        const top = Math.max(viewportPadding, stableTopTriggerRect.top);
        return {
          top,
          left,
          maxHeight: `${Math.max(0, window.innerHeight - Math.round(top) - viewportPadding)}px`,
          overflowY: "auto",
        };
      }
      const maxHeight = window.innerHeight - viewportPadding * 2;
      const menuHeight = Math.min(menuRect.height || maxHeight, maxHeight);
      const unclampedTop = triggerRect.top;
      const maxTop = Math.max(viewportPadding, window.innerHeight - viewportPadding - menuHeight);
      const top = Math.min(Math.max(unclampedTop, viewportPadding), maxTop);
      return {
        top,
        left,
        maxHeight: `calc(100vh - ${viewportPadding * 2}px)`,
        overflowY: "auto",
      };
    };
    const updateStyles = () => {
      setTemplateMenuStyle(
        showTemplateMenu
          ? computeStyle(templateTriggerRef.current, templateMenuRef.current, { stableTopFrom: searchTriggerRef.current })
          : {},
      );
      setSearchMenuStyle(showSearchMenu ? computeStyle(searchTriggerRef.current, searchMenuRef.current) : {});
    };
    if (typeof window === "undefined") return;
    updateStyles();
    const frame = window.requestAnimationFrame(updateStyles);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            updateStyles();
          })
        : null;
    if (showTemplateMenu && templateMenuRef.current) resizeObserver?.observe(templateMenuRef.current);
    if (showSearchMenu && searchMenuRef.current) resizeObserver?.observe(searchMenuRef.current);
    if (searchTriggerRef.current) resizeObserver?.observe(searchTriggerRef.current);
    if (templateTriggerRef.current) resizeObserver?.observe(templateTriggerRef.current);
    window.addEventListener("resize", updateStyles);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateStyles);
    };
  }, [
    isLoadingTemplates,
    searchMenuRef,
    searchQuery,
    searchResults.length,
    showSearchMenu,
    showTemplateMenu,
    templateMenuRef,
    templateQuery,
    templateResults.length,
    templateSaveMessage,
    templateVisibility,
  ]);

  const renderTemplateMenu = () => {
    if (!showTemplateMenu || !canSaveTemplate) return null;
    const visibilityOptions: Array<{ value: InvestigationTemplateVisibility; label: string; description: string }> = [
      { value: "global", label: "Global", description: "Visible to every Investigation Tool user." },
      ...(isOrgTemplateUser
        ? [{ value: "organisation" as const, label: "Organisation", description: "Visible to active users in your organisation." }]
        : []),
      { value: "private", label: "Private", description: "Visible only in your template library." },
    ];
    const selectedVisibilityLabel = visibilityOptions.find((option) => option.value === templateVisibility)?.label ?? "Private";
    return (
      <div className="fixed left-[98px] top-[82px] bottom-[20px] z-[160] w-[360px] max-w-[calc(100vw-132px)]">
        <div
          ref={templateMenuRef}
          className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/45 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))] shadow-[0_28px_64px_rgba(15,23,42,0.24)]"
        >
          <div className="border-b border-slate-200/80 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Templates</p>
                <h2 className="mt-1 text-[1.4rem] font-semibold text-slate-950">Save as Template</h2>
              </div>
              <button
                type="button"
                aria-label="Close template modal"
                className="inline-flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
                onClick={() => setShowTemplateMenu(() => false)}
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 bg-current"
                  style={{ WebkitMaskImage: "url('/icons/close.svg')", maskImage: "url('/icons/close.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                />
              </button>
            </div>
            <p className="mt-3 text-sm leading-5 text-slate-600">
              Select an existing template to overwrite it, or enter a new name to save a fresh template.
              {` Saving as ${selectedVisibilityLabel.toLowerCase()} controls who can find and use this template.`}
            </p>
            <div className="mt-4 text-left">
              <div
                className={`grid gap-1.5 rounded-2xl bg-[#314661] p-1 ${isOrgTemplateUser ? "grid-cols-3" : "grid-cols-2"}`}
                role="radiogroup"
                aria-label="Template visibility"
              >
                {visibilityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={templateVisibility === option.value}
                    className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                      templateVisibility === option.value
                        ? "bg-white text-[#102a43] shadow-[0_8px_18px_rgba(15,23,42,0.16)]"
                        : "text-white hover:text-white"
                    }`}
                    onClick={() => setTemplateVisibility(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-600">
                {visibilityOptions.find((option) => option.value === templateVisibility)?.description}
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-5">
            <input
              type="text"
              value={templateQuery}
              onChange={(e) => setTemplateQuery(e.target.value)}
              placeholder="Enter or search template name"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <div className="mt-3 space-y-3">
              {templateSaveMessage ? <div className="text-xs font-medium text-emerald-600">{templateSaveMessage}</div> : null}
              <button
                type="button"
                className="w-full rounded-2xl border border-slate-900 bg-white px-3 py-3 text-sm font-semibold text-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onSaveTemplate}
                disabled={isSavingTemplate || !templateQuery.trim()}
              >
                {isSavingTemplate ? "Saving..." : `Save ${selectedVisibilityLabel} Template`}
              </button>
            </div>
            {templateQuery.trim().length > 0 || isLoadingTemplates || templateResults.length > 0 ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {isLoadingTemplates ? (
                  <div className="px-3 py-2 text-xs text-slate-500">Loading templates...</div>
                ) : templateResults.length ? (
                  templateResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className="block w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm text-slate-800 last:border-b-0 hover:bg-slate-50"
                      onClick={() => onSelectTemplate(result.id, result.name, result.visibility)}
                    >
                      <div className="font-semibold text-slate-900">{result.name}</div>
                      <div className="hidden text-xs text-slate-500">
                        Updated {result.updatedAt}
                        {result.isGlobal ? " · Global template" : ""}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-500">
                    {templateQuery.trim().length >= 4 ? "No templates found." : "Type 4 characters to start filtering your templates."}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderSearchMenu = () => {
    if (!showSearchMenu) return null;
    return (
      <div className="fixed left-[98px] top-[82px] bottom-[20px] z-[160] w-[360px] max-w-[calc(100vw-132px)]">
        <div
          ref={searchMenuRef}
          className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/45 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))] shadow-[0_28px_64px_rgba(15,23,42,0.24)]"
        >
          <div className="border-b border-slate-200/80 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Search</p>
                <h2 className="mt-1 text-[1.4rem] font-semibold text-slate-950">Find Components</h2>
              </div>
              <button
                type="button"
                aria-label="Close search modal"
                className="inline-flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
                onClick={() => setShowSearchMenu(() => false)}
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 bg-current"
                  style={{ WebkitMaskImage: "url('/icons/close.svg')", maskImage: "url('/icons/close.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                />
              </button>
            </div>
            <p className="mt-3 text-sm leading-5 text-slate-600">
              Search by label, description, or node type and jump straight to the matching item on the map.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Start typing to search components"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery.trim().length > 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                {searchResults.length} result{searchResults.length === 1 ? "" : "s"} found for &quot;{searchQuery.trim()}&quot;
              </p>
            ) : null}
            {searchQuery.trim().length > 0 ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {searchResults.length ? (
                  searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className="block w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm text-slate-800 last:border-b-0 hover:bg-slate-50"
                      onClick={() => {
                        setShowSearchMenu(() => false);
                        onSelectSearchResult(result.id);
                      }}
                    >
                      <div className="truncate font-semibold text-slate-900" title={result.label}>{result.label}</div>
                      {result.description ? (
                        <div className="truncate text-xs text-slate-500" title={result.description}>{result.description}</div>
                      ) : null}
                      <div className="mt-1">
                        {result.kindColor ? (
                          <span
                            className="inline-flex max-w-full items-center justify-center rounded-full px-1.5 py-[1px] text-[10px] font-semibold leading-none"
                            style={{
                              backgroundColor: result.kindColor,
                              color: result.kindTextColor ?? getContrastTextColor(result.kindColor),
                            }}
                            title={result.kind}
                          >
                            <span className="truncate">{result.kind}</span>
                          </span>
                        ) : (
                      <div className="mt-1">
                        {result.kindColor ? (
                          <span
                            className="inline-flex max-w-full items-center justify-center rounded-full px-1.5 py-[1px] text-[10px] font-semibold leading-none"
                            style={{
                              backgroundColor: result.kindColor,
                              color: result.kindTextColor ?? getContrastTextColor(result.kindColor),
                              border: result.kindBorderColor ? `1px solid ${result.kindBorderColor}` : "none",
                            }}
                            title={result.kind}
                          >
                            <span className="truncate">{result.kind}</span>
                          </span>
                        ) : result.kindBorderColor ? (
                          <span
                            className="inline-flex max-w-full items-center justify-center rounded-full border bg-transparent px-1.5 py-[1px] text-[10px] font-semibold leading-none"
                            style={{
                              borderColor: result.kindBorderColor,
                              color: result.kindTextColor ?? "#475569",
                            }}
                            title={result.kind}
                          >
                            <span className="truncate">{result.kind}</span>
                          </span>
                        ) : (
                          <div className="mt-1">
                            {result.kindColor ? (
                              <span
                                className="inline-flex max-w-full items-center justify-center rounded-full px-1.5 py-[1px] text-[10px] font-semibold leading-none"
                                style={{
                                  backgroundColor: result.kindColor,
                                  color: result.kindTextColor ?? getContrastTextColor(result.kindColor),
                                  border: result.kindBorderColor ? `1px solid ${result.kindBorderColor}` : "none",
                                }}
                                title={result.kind}
                              >
                                <span className="truncate">{result.kind}</span>
                              </span>
                            ) : result.kindBorderColor ? (
                              <span
                                className="inline-flex max-w-full items-center justify-center rounded-full border bg-transparent px-1.5 py-[1px] text-[10px] font-semibold leading-none"
                                style={{
                                  borderColor: result.kindBorderColor,
                                  color: result.kindTextColor ?? "#475569",
                                }}
                                title={result.kind}
                              >
                                <span className="truncate">{result.kind}</span>
                              </span>
                            ) : (
                              <div className="truncate text-xs text-slate-500" title={result.kind}>{result.kind}</div>
                            )}
                          </div>
                        )}
                      </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-500">No results found</div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderSuggestionsModal = () => {
    if (!showSuggestionsMenu || !canUseSuggestionCheck) return null;
    const canAskSuggestionQuestion = suggestionPrompt.trim().length > 0 && !isLoadingSuggestions;

    const getSuggestionMeta = (suggestion: (typeof suggestions)[number]) => {
      if (suggestion.priority === "high") {
        return { icon: "/icons/lightbulb.svg", color: "#f59e0b", label: "High priority" };
      }
      if (suggestion.priority === "medium") {
        return { icon: "/icons/file.svg", color: "#45c4b0", label: "Suggestion" };
      }
      return { icon: "/icons/infoicon.svg", color: "#47b9d6", label: "Observation" };
    };

    return (
      <div className="fixed left-[98px] top-[82px] bottom-[20px] z-[160] w-[380px] max-w-[calc(100vw-132px)]">
        <div
          ref={suggestionMenuRef}
          className="flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_64px_rgba(15,23,42,0.24)]"
        >
          <div className="border-b border-slate-200/80 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">HSES Assistant</p>
                <h2 className="mt-1 text-[1.35rem] font-semibold text-slate-950">Ask About This Map</h2>
              </div>
              <button
                type="button"
                aria-label="Close suggestions modal"
                className="inline-flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
                onClick={onToggleSuggestionsMenu}
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 bg-current"
                  style={{ WebkitMaskImage: "url('/icons/close.svg')", maskImage: "url('/icons/close.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                />
              </button>
            </div>
            <label htmlFor="map-suggestion-prompt" className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Question or statement
            </label>
            <textarea
              id="map-suggestion-prompt"
              value={suggestionPrompt}
              onChange={(event) => setSuggestionPrompt(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && canAskSuggestionQuestion) {
                  onRunSuggestionCheck();
                }
              }}
              rows={4}
              className="mt-2 min-h-[104px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#45c4b0] focus:bg-white focus:ring-4 focus:ring-[#45c4b0]/15"
              placeholder="What are the key actions from this process flow?"
            />
            <div className="mt-4">
              <button
                type="button"
                className="flex min-h-[42px] w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b_0%,#f97316_100%)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(249,115,22,0.24)] transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onRunSuggestionCheck}
                disabled={!canAskSuggestionQuestion}
              >
                {isLoadingSuggestions ? "Answering..." : suggestions.length ? "Refresh Answer" : "Ask"}
              </button>
              {suggestionsLastUpdatedAt ? (
                <div className="mt-2 text-xs text-slate-500">Last answered {suggestionsLastUpdatedAt}</div>
              ) : null}
            </div>
            {isLoadingSuggestions ? (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <span>Answering request</span>
                  <span>{Math.max(6, Math.min(100, Math.round(suggestionProgress)))}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_100%)] transition-[width] duration-200"
                    style={{ width: `${Math.max(6, Math.min(100, suggestionProgress))}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            {suggestionError ? (
              <div className="m-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {suggestionError}
              </div>
            ) : null}
            {!suggestionError && !isLoadingSuggestions && !suggestionOverview && suggestions.length === 0 ? (
              <div className="flex min-h-full items-center justify-center">
                <div className="max-w-[280px] text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <span
                      aria-hidden="true"
                      className="h-8 w-8 bg-current"
                      style={{ WebkitMaskImage: "url('/icons/lightbulb.svg')", maskImage: "url('/icons/lightbulb.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                    />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">No answer loaded yet</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Ask a question to get high-priority items, suggestions, and observations for this map.
                  </p>
                </div>
              </div>
            ) : null}
            {!suggestionError && !isLoadingSuggestions && suggestionOverview ? (
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-sm leading-6 text-slate-700">{suggestionOverview}</p>
              </div>
            ) : null}
            <div className="divide-y divide-slate-200 border-t border-slate-200">
              {suggestions.map((suggestion) => {
                const meta = getSuggestionMeta(suggestion);
                return (
                  <div key={suggestion.id} className="group relative grid grid-cols-[36px_minmax(0,1fr)_28px] gap-4 bg-white px-5 py-4 transition hover:bg-slate-50">
                    <div className="pt-0.5">
                      <span
                        aria-hidden="true"
                        className="block h-7 w-7"
                        style={{
                          backgroundColor: meta.color,
                          WebkitMaskImage: `url('${meta.icon}')`,
                          maskImage: `url('${meta.icon}')`,
                          WebkitMaskRepeat: "no-repeat",
                          maskRepeat: "no-repeat",
                          WebkitMaskPosition: "center",
                          maskPosition: "center",
                          WebkitMaskSize: "contain",
                          maskSize: "contain",
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] italic leading-5 text-slate-400">
                        {meta.label}
                      </div>
                      <div className="mt-0.5 text-[14px] font-bold leading-5 text-slate-700">
                        {suggestion.title || "Suggestion"}
                      </div>
                      <p className="mt-1 text-[11.2px] leading-[1.55] text-slate-700">
                        {suggestion.question}
                      </p>
                      {suggestion.rationale ? (
                        <p className="mt-2 text-[11px] leading-[1.45] text-slate-500">
                          {suggestion.rationale}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-full text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
                        aria-label={`Dismiss ${suggestion.title}`}
                        title="Dismiss Suggestion"
                        onClick={() => onDismissSuggestion(suggestion.id)}
                      >
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 bg-current"
                          style={{ WebkitMaskImage: "url('/icons/close.svg')", maskImage: "url('/icons/close.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <>
        {showSearchMenu ? (
          <div className="fixed inset-0 z-[98] md:hidden">
            <div className="absolute inset-0 bg-white" />
            <div className="absolute inset-0 overflow-y-auto px-5 pb-28 pt-5 text-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Search</p>
                  <h2 className="text-lg font-semibold text-slate-950">Find components</h2>
                </div>
                <button
                  type="button"
                  aria-label="Close search"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-900"
                  onClick={() => setShowSearchMenu(() => false)}
                >
                  <span className="text-xl leading-none">x</span>
                </button>
              </div>
              <div ref={searchMenuRef}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Start typing to search components"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                {searchQuery.trim().length > 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    {searchResults.length} result{searchResults.length === 1 ? "" : "s"} found for &quot;{searchQuery.trim()}&quot;
                  </p>
                ) : null}
                {searchQuery.trim().length > 0 ? (
                  <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                    {searchResults.length ? (
                      searchResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          className="block w-full border-b border-slate-200 px-4 py-3 text-left last:border-b-0"
                          onClick={() => {
                            setShowSearchMenu(() => false);
                            onSelectSearchResult(result.id);
                          }}
                        >
                          <div className="truncate font-semibold text-slate-900" title={result.label}>{result.label}</div>
                          <div className="hidden text-xs text-slate-500">
                            {result.documentNumber ? `${result.documentNumber} · ` : ""}
                            {result.kind}
                          </div>
                          {result.description ? (
                            <div className="truncate text-xs text-slate-500" title={result.description}>{result.description}</div>
                          ) : null}
                          <div className="truncate text-xs text-slate-500" title={result.kind}>{result.kind}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500">No results found.</div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        {showAddMenu && (canWriteMap || canCreateSticky) ? (
          <div className="fixed inset-0 z-[97] md:hidden">
            <div className="absolute inset-0 bg-white" />
            <div className="absolute inset-0 overflow-y-auto px-5 pb-28 pt-5 text-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Add</p>
                  <h2 className="text-lg font-semibold text-slate-950">New component</h2>
                </div>
                <button
                  type="button"
                  aria-label="Close add menu"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-900"
                  onClick={() => setShowAddMenu(() => false)}
                >
                  <span className="text-xl leading-none">x</span>
                </button>
              </div>
              <div ref={addMenuRef} className="grid grid-cols-2 gap-3">
                {addItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="flex min-h-[112px] flex-col items-center justify-center px-3 py-3 text-center text-sm font-semibold text-slate-900 transition-transform duration-150 hover:-translate-y-0.5"
                    onClick={() => {
                      setShowAddMenu(() => false);
                      item.onClick();
                    }}
                  >
                    <span className="mb-3 flex h-16 items-center justify-center">{renderAddItemPreview(item.key)}</span>
                    <span className="text-sm font-semibold leading-tight text-slate-900">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="fixed inset-x-0 bottom-0 z-[95] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] md:hidden">
          <div className="mx-auto flex max-w-max items-center gap-2 rounded-[24px] border border-slate-300/80 bg-white/94 px-2.5 py-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.22)] backdrop-blur">
            <Link href={leaveHref} aria-label={leaveTitle} title={leaveTitle} className={floatingButtonClass}>
              <span
                aria-hidden="true"
                className="h-6 w-6 bg-current"
                style={{ WebkitMaskImage: "url('/icons/back.svg')", maskImage: "url('/icons/back.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </Link>
            <button
              type="button"
              aria-label="Search components"
              title="Search components"
              onClick={() => setShowSearchMenu((prev) => !prev)}
              className={floatingButtonClass}
            >
              <span
                aria-hidden="true"
                className="h-6 w-6 bg-current"
                style={{ WebkitMaskImage: "url('/icons/finddocument.svg')", maskImage: "url('/icons/finddocument.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
            <button
              type="button"
              aria-label="Zoom to fit"
              title="Zoom to fit"
              onClick={() => rf?.fitView({ duration: 300, padding: 0.2 })}
              className={floatingButtonClass}
            >
              <span
                aria-hidden="true"
                className="h-6 w-6 bg-current"
                style={{ WebkitMaskImage: "url('/icons/zoomfit.svg')", maskImage: "url('/icons/zoomfit.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
            <button
              type="button"
              aria-label="Reset zoom"
              title="Reset zoom"
              onClick={() => rf?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })}
              className={floatingButtonClass}
            >
              <span
                aria-hidden="true"
                className="h-6 w-6 bg-current"
                style={{ WebkitMaskImage: "url('/icons/resetzoom.svg')", maskImage: "url('/icons/resetzoom.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
            {!isGuestViewer ? (
              <>
                <span title={!canWriteMap && !canCreateSticky ? addDisabledReason : "Add component"}>
                  <button
                    type="button"
                    aria-label="Add component"
                    title={undefined}
                    onClick={() => setShowAddMenu((prev) => !prev)}
                    disabled={!canWriteMap && !canCreateSticky}
                    className={floatingButtonClass}
                  >
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 bg-current"
                      style={{ WebkitMaskImage: "url('/icons/addcomponent.svg')", maskImage: "url('/icons/addcomponent.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                    />
                  </button>
                </span>
                <span title={canvasInteractionLocked ? "Unlock canvas movement" : "Lock canvas movement"}>
                  <button
                    type="button"
                    aria-label={canvasInteractionLocked ? "Unlock canvas movement" : "Lock canvas movement"}
                    title={undefined}
                    onClick={onToggleCanvasInteractionLock}
                    className={mobileLockButtonClass}
                  >
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 bg-current"
                      style={{ WebkitMaskImage: "url('/icons/lock.svg')", maskImage: "url('/icons/lock.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                    />
                  </button>
                </span>
                <span title={canUseWizard ? "Open wizard" : wizardDisabledReason}>
                  <button
                    type="button"
                    aria-label="Open wizard"
                    title={undefined}
                    onClick={onOpenWizard}
                    disabled={!canUseWizard}
                    className="group flex h-[56px] w-[56px] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#6d28d9_52%,#db2777_100%)] text-white shadow-[0_14px_30px_rgba(79,70,229,0.26)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#1d4ed8_0%,#5b21b6_52%,#be185d_100%)] hover:shadow-[0_18px_36px_rgba(79,70,229,0.32)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-[0_14px_30px_rgba(79,70,229,0.26)]"
                  >
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 bg-current"
                      style={{ WebkitMaskImage: "url('/icons/wizard.svg')", maskImage: "url('/icons/wizard.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                    />
                  </button>
                </span>
              </>
            ) : null}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {!isGuestViewer ? (
        <>
          <div className="fixed right-[92px] top-[82px] z-[74]">
            <button
              type="button"
              aria-label="Undo recent map change"
              title={canUndoSessionChanges ? "Undo recent map change" : "Nothing to undo in this session"}
              onClick={onUndoSessionChanges}
              disabled={!canUndoSessionChanges}
              className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-black disabled:hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
            >
              <span
                aria-hidden="true"
                className="h-7 w-7 bg-current"
                style={{ WebkitMaskImage: "url('/icons/undo.svg')", maskImage: "url('/icons/undo.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
          </div>
          <div className="fixed right-[20px] top-[82px] z-[74]">
            <button
              type="button"
              aria-label="Redo recent map change"
              title={canRedoSessionChanges ? "Redo recent map change" : "Nothing to redo in this session"}
              onClick={onRedoSessionChanges}
              disabled={!canRedoSessionChanges}
              className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-black disabled:hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
            >
              <span
                aria-hidden="true"
                className="h-7 w-7 bg-current"
                style={{ WebkitMaskImage: "url('/icons/redo.svg')", maskImage: "url('/icons/redo.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
          </div>
        </>
      ) : null}
      <div className="fixed left-0 top-[64px] z-[60] h-[calc(100vh-64px)] w-[72px] border-r border-slate-200 bg-[#f7f7fb]/96 shadow-[10px_0_30px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="flex h-full flex-col items-center px-2 py-4">
          <Link
            href={leaveHref}
            aria-label={leaveTitle}
            title={leaveTitle}
            className="group flex h-[56px] w-[56px] flex-col items-center justify-center gap-1 rounded-2xl bg-[linear-gradient(180deg,#1e3a5f_0%,#16324f_52%,#0f2035_100%)] px-1 py-1 text-white shadow-[0_14px_28px_rgba(15,23,42,0.22)] transition-all duration-150 hover:brightness-[1.03]"
          >
            <span
              aria-hidden="true"
              className="h-5 w-5 bg-current"
              style={{ WebkitMaskImage: "url('/icons/back.svg')", maskImage: "url('/icons/back.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
            />
            <span className={desktopRailLabelClass}>{leaveLabel}</span>
          </Link>
          {!isGuestViewer ? (
            <span title={!canWriteMap && !canCreateSticky ? addDisabledReason : "Add component"} className="mt-1 w-full">
              <button
                type="button"
                aria-label="Add component"
                title={undefined}
                onClick={() => setShowAddMenu((prev) => !prev)}
                disabled={!canWriteMap && !canCreateSticky}
                className={`${desktopRailButtonClass} disabled:cursor-not-allowed disabled:opacity-45`}
              >
                <span
                  aria-hidden="true"
                  className="h-5 w-5 bg-current"
                  style={{ WebkitMaskImage: "url('/icons/addcomponent.svg')", maskImage: "url('/icons/addcomponent.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                />
                <span className={desktopRailLabelClass}>Add</span>
              </button>
            </span>
          ) : null}
          <div className={`flex w-full flex-1 flex-col items-center gap-1 ${isGuestViewer ? "mt-1" : "mt-1"}`}>
            <div ref={searchTriggerRef} className="relative w-full">
              <button
                type="button"
                aria-label="Search components"
                title="Search components"
                onClick={() => setShowSearchMenu((prev) => !prev)}
                className={desktopRailButtonClass}
              >
                <span
                  aria-hidden="true"
                  className="h-5 w-5 bg-current"
                  style={{ WebkitMaskImage: "url('/icons/finddocument.svg')", maskImage: "url('/icons/finddocument.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                />
                <span className={desktopRailLabelClass}>Search</span>
              </button>
              {false ? (
                <div
                  ref={searchMenuRef}
                  className={`${desktopFlyoutClass} w-[352px] p-4`}
                  style={searchMenuStyle}
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Start typing to search documents"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  {searchQuery.trim().length > 0 ? (
                    <div className="mt-3 max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white">
                      {searchResults.length ? (
                        searchResults.map((result) => (
                          <button
                            key={result.id}
                            type="button"
                            className="block w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm text-slate-800 last:border-b-0 hover:bg-slate-50"
                            onClick={() => onSelectSearchResult(result.id)}
                          >
                            <div className="font-semibold text-slate-900">{result.label}</div>
                            <div className="text-xs text-slate-500">
                              {result.documentNumber ? `${result.documentNumber} · ` : ""}
                              {result.kind}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-slate-500">No results found</div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            {renderSearchMenu()}
            {!isGuestViewer ? (
              <span title={canvasInteractionLocked ? "Unlock canvas movement" : "Lock canvas movement"} className="w-full">
                <button
                  type="button"
                  aria-label={canvasInteractionLocked ? "Unlock canvas movement" : "Lock canvas movement"}
                  title={undefined}
                  onClick={onToggleCanvasInteractionLock}
                  className={`${desktopRailButtonClass} ${canvasInteractionLocked ? "bg-[#102a43] text-white shadow-[0_14px_28px_rgba(15,23,42,0.22)]" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 bg-current"
                    style={{ WebkitMaskImage: "url('/icons/lock.svg')", maskImage: "url('/icons/lock.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                  />
                  <span className={desktopRailLabelClass}>{canvasInteractionLocked ? "Unlock" : "Lock"}</span>
                </button>
              </span>
            ) : null}
            {!isGuestViewer ? <div className="my-2 h-px w-10 bg-[#9CA3AF]" /> : null}
            {!isGuestViewer ? (
              <span title={canUseWizard ? "Open wizard" : wizardDisabledReason} className="w-full">
                <button
                  type="button"
                  aria-label="Open wizard"
                  title={undefined}
                  onClick={onOpenWizard}
                  disabled={!canUseWizard}
                  className={`${desktopRailPrimaryButtonClass} bg-[linear-gradient(135deg,#2563eb_0%,#6d28d9_52%,#db2777_100%)] shadow-[0_14px_28px_rgba(79,70,229,0.22)] disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 bg-current"
                    style={{ WebkitMaskImage: "url('/icons/wizard.svg')", maskImage: "url('/icons/wizard.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                  />
                  <span className={desktopRailLabelClass}>Magic</span>
                </button>
              </span>
            ) : null}
            {!isGuestViewer ? (
              <span title={canUseSuggestionCheck ? "Ask about this map" : suggestionsDisabledReason} className="w-full">
                <button
                  type="button"
                  aria-label="Ask about this map"
                  title={undefined}
                  onClick={onToggleSuggestionsMenu}
                  disabled={!canUseSuggestionCheck}
                  className={`relative ${desktopRailButtonClass} disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  {suggestions.length > 0 ? (
                    <span className="absolute right-1.5 top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#dc2626] px-1.5 py-[1px] text-[10px] font-semibold leading-none text-white">
                      {suggestions.length > 99 ? "99+" : suggestions.length}
                    </span>
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 bg-current"
                    style={{ WebkitMaskImage: "url('/icons/lightbulb.svg')", maskImage: "url('/icons/lightbulb.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                  />
                  <span className={desktopRailLabelClass}>Ideas</span>
                </button>
              </span>
            ) : null}
            {!isGuestViewer ? (
              <div ref={templateTriggerRef} className="relative w-full">
                <span title={canSaveTemplate ? "Save as template" : templateDisabledReason}>
                  <button
                    type="button"
                    aria-label="Save as template"
                    title={undefined}
                    onClick={() => setShowTemplateMenu((prev) => !prev)}
                    disabled={!canSaveTemplate}
                    className={`${desktopRailButtonClass} disabled:cursor-not-allowed disabled:opacity-45`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-5 w-5 bg-current"
                      style={{ WebkitMaskImage: "url('/icons/template.svg')", maskImage: "url('/icons/template.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                    />
                    <span className={desktopRailLabelClass}>Templates</span>
                  </button>
                </span>
                {renderTemplateMenu()}
              </div>
            ) : null}
            {!isGuestViewer ? <div className="my-2 h-px w-10 bg-[#9CA3AF]" /> : null}
            <button
              type="button"
              aria-label="Reset zoom"
              title="Reset zoom"
              onClick={() => rf?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })}
              className={desktopRailButtonClass}
            >
              <span
                aria-hidden="true"
                className="h-5 w-5 bg-current"
                style={{ WebkitMaskImage: "url('/icons/resetzoom.svg')", maskImage: "url('/icons/resetzoom.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
              <span className={desktopRailLabelClass}>Reset</span>
            </button>
            <button
              type="button"
              aria-label="Zoom to fit"
              title="Zoom to fit"
              onClick={() => rf?.fitView({ duration: 300, padding: 0.2 })}
              className={desktopRailButtonClass}
            >
              <span
                aria-hidden="true"
                className="h-5 w-5 bg-current"
                style={{ WebkitMaskImage: "url('/icons/zoomfit.svg')", maskImage: "url('/icons/zoomfit.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
              <span className={desktopRailLabelClass}>Fit</span>
            </button>
            {!isGuestViewer ? (
              <>
                <div className="relative w-full">
                  <span title={!canPrint ? printDisabledReason : "Print to PDF"}>
                    <button
                      type="button"
                      aria-label="Print to PDF"
                      title={undefined}
                      onClick={() => setShowPrintMenu((prev) => !prev)}
                      disabled={!canPrint || isPreparingPrint}
                      className={`${desktopRailButtonClass} disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      {isPreparingPrint ? (
                        <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="h-5 w-5 bg-current"
                          style={{ WebkitMaskImage: "url('/icons/printer.svg')", maskImage: "url('/icons/printer.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                        />
                      )}
                      <span className={desktopRailLabelClass}>Print</span>
                    </button>
                  </span>
                  {showPrintMenu && canPrint ? (
                    <div
                      ref={printMenuRef}
                      className="absolute bottom-0 left-[calc(100%+24px)] z-[170] max-h-[calc(100vh-30px)] min-w-[220px] overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-1.5 text-sm shadow-[0_22px_44px_rgba(15,23,42,0.18)]"
                    >
                      <button className="block w-full rounded-xl px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100 disabled:opacity-50" onClick={onPrintCurrentView} disabled={isPreparingPrint}>
                        Current View
                      </button>
                      <button className="block w-full rounded-xl px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100 disabled:opacity-50" onClick={onPrintSelectArea} disabled={isPreparingPrint}>
                        Selected Area
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
      {showAddMenu && (canWriteMap || canCreateSticky) ? (
        <div className="fixed left-[98px] top-[82px] bottom-[20px] z-[160] w-[360px] max-w-[calc(100vw-132px)]">
          <div
            ref={addMenuRef}
            className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/45 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))] shadow-[0_28px_64px_rgba(15,23,42,0.24)]"
          >
            <div className="border-b border-slate-200/80 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Add Component</p>
                <button
                  type="button"
                  aria-label="Close add component modal"
                  className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-black shadow-[0_8px_18px_rgba(15,23,42,0.12)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
                  onClick={() => setShowAddMenu(() => false)}
                >
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 bg-current"
                    style={{ WebkitMaskImage: "url('/icons/close.svg')", maskImage: "url('/icons/close.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                  />
                </button>
              </div>
              <h2 className="mt-3 w-full text-[1.2rem] font-semibold text-slate-950">Choose what to place on the map</h2>
              <p className="mt-2 w-full text-sm leading-5 text-slate-600">
                Left-rail palette preview. Components open beside the tool stack instead of in the canvas center.
              </p>
              <div className="mt-3 flex flex-nowrap gap-1.5 overflow-x-auto pb-1">
                {addFilterPills.map((pill) => {
                  const isActive = activeAddFilter === pill.key;
                  return (
                    <button
                      key={pill.key}
                      type="button"
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${
                        isActive
                          ? "bg-[#102a43] text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      onClick={() => setActiveAddFilter(pill.key)}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5 pt-5">
              <div className="mx-auto flex min-h-full w-full flex-col justify-start">
                {activeAddFilter === "all" ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                    {addItems.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className="flex min-h-[112px] flex-col items-center justify-start rounded-2xl px-2 py-2 text-center text-sm font-semibold text-slate-900 transition duration-150 hover:-translate-y-0.5 hover:bg-white/70"
                        onClick={() => {
                          setShowAddMenu(() => false);
                          item.onClick();
                        }}
                      >
                        <span className="mb-2 flex items-center justify-center">{renderAddItemPreview(item.key)}</span>
                        <span className="text-sm font-semibold leading-tight text-slate-900">{item.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleAddItemGroups.map((section) => (
                      <div key={section.group}>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                          {section.items.map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              className="flex min-h-[112px] flex-col items-center justify-start rounded-2xl px-2 py-2 text-center text-sm font-semibold text-slate-900 transition duration-150 hover:-translate-y-0.5 hover:bg-white/70"
                              onClick={() => {
                                setShowAddMenu(() => false);
                                item.onClick();
                              }}
                            >
                              <span className="mb-2 flex items-center justify-center">{renderAddItemPreview(item.key)}</span>
                              <span className="text-sm font-semibold leading-tight text-slate-900">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {canvasInteractionLocked ? (
        <div className="pointer-events-none fixed bottom-[20px] left-1/2 z-[180] -translate-x-1/2">
          <div className="rounded-full bg-[#102a43] px-4 py-2 text-sm font-medium text-white shadow-[0_14px_28px_rgba(15,23,42,0.22)]">
            Canvas is locked. Dragging and moving items is disabled.
          </div>
        </div>
      ) : null}
      {renderSuggestionsModal()}
    </>
  );

  return (
    <>
      {!isGuestViewer ? (
        <>
          <div className="fixed right-[92px] top-[82px] z-[74]">
            <button
              type="button"
              aria-label="Undo recent map change"
              title={canUndoSessionChanges ? "Undo recent map change" : "Nothing to undo in this session"}
              onClick={onUndoSessionChanges}
              disabled={!canUndoSessionChanges}
              className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-black disabled:hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
            >
              <span
                aria-hidden="true"
                className="h-7 w-7 bg-current"
                style={{ WebkitMaskImage: "url('/icons/undo.svg')", maskImage: "url('/icons/undo.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
          </div>
          <div className="fixed right-[20px] top-[82px] z-[74]">
            <button
              type="button"
              aria-label="Redo recent map change"
              title={canRedoSessionChanges ? "Redo recent map change" : "Nothing to redo in this session"}
              onClick={onRedoSessionChanges}
              disabled={!canRedoSessionChanges}
              className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-black disabled:hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
            >
              <span
                aria-hidden="true"
                className="h-7 w-7 bg-current"
                style={{ WebkitMaskImage: "url('/icons/redo.svg')", maskImage: "url('/icons/redo.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
          </div>
          <Link
            href={backHref}
            aria-label={backTitle}
            title={backTitle}
            className="fixed left-[20px] top-[82px] z-[74] group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
          >
            <span
              aria-hidden="true"
              className="h-7 w-7 bg-current"
              style={{ WebkitMaskImage: "url('/icons/back.svg')", maskImage: "url('/icons/back.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
            />
          </Link>
          <div className="fixed left-[20px] top-[156px] z-[74]">
            <div className="relative">
              <span title={canSaveTemplate ? "Save as template" : templateDisabledReason}>
                <button
                  type="button"
                  aria-label="Save as template"
                  title={undefined}
                  onClick={() => setShowTemplateMenu((prev) => !prev)}
                  disabled={!canSaveTemplate}
                  className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-black disabled:hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
                >
                  <span
                    aria-hidden="true"
                    className="h-[22px] w-[22px] bg-current"
                    style={{ WebkitMaskImage: "url('/icons/template.svg')", maskImage: "url('/icons/template.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                  />
                </button>
              </span>
            </div>
          </div>
          <span title={canUseWizard ? "Open wizard" : wizardDisabledReason}>
            <button
              type="button"
              aria-label="Open wizard"
              title={undefined}
              onClick={onOpenWizard}
              disabled={!canUseWizard}
              className="fixed left-[20px] top-[230px] z-[74] group flex h-[62px] w-[62px] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#6d28d9_52%,#db2777_100%)] text-white shadow-[0_14px_30px_rgba(79,70,229,0.26)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#1d4ed8_0%,#5b21b6_52%,#be185d_100%)] hover:shadow-[0_18px_36px_rgba(79,70,229,0.32)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-[0_14px_30px_rgba(79,70,229,0.26)]"
            >
              <span
                aria-hidden="true"
                className="h-7 w-7 bg-current"
                style={{ WebkitMaskImage: "url('/icons/wizard.svg')", maskImage: "url('/icons/wizard.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
          </span>
          <span title={canUseSuggestionCheck ? "Ask about this map" : suggestionsDisabledReason}>
            <button
              type="button"
              aria-label="Ask about this map"
              title={undefined}
              onClick={onToggleSuggestionsMenu}
              disabled={!canUseSuggestionCheck}
              className="fixed left-[20px] top-[304px] z-[74] group flex h-[62px] w-[62px] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b_0%,#f97316_100%)] text-white shadow-[0_14px_30px_rgba(249,115,22,0.26)] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-[1.03] hover:shadow-[0_18px_36px_rgba(249,115,22,0.32)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 relative"
            >
              {suggestions.length > 0 ? (
                <span className="absolute right-1.5 top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#dc2626] px-1.5 py-[1px] text-[10px] font-semibold leading-none text-white">
                  {suggestions.length > 99 ? "99+" : suggestions.length}
                </span>
              ) : null}
              <span
                aria-hidden="true"
                className="h-7 w-7 bg-current"
                style={{ WebkitMaskImage: "url('/icons/lightbulb.svg')", maskImage: "url('/icons/lightbulb.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
              />
            </button>
          </span>
        </>
      ) : null}
      <div className="fixed left-[20px] top-[378px] z-[88]">
        <div className="relative flex flex-col items-center gap-3">
        {!isGuestViewer ? (
          <div className="relative">
            <span title={canvasInteractionLocked ? "Unlock canvas movement" : "Lock canvas movement"}>
              <button
                type="button"
                aria-label={canvasInteractionLocked ? "Unlock canvas movement" : "Lock canvas movement"}
                title={undefined}
                onClick={onToggleCanvasInteractionLock}
                className={`group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)] ${
                  canvasInteractionLocked
                    ? "border-[#102a43] bg-[#102a43] text-white"
                    : "border-slate-200 bg-white text-black hover:bg-[#102a43] hover:text-white"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-7 w-7 bg-current"
                  style={{ WebkitMaskImage: "url('/icons/lock.svg')", maskImage: "url('/icons/lock.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                />
              </button>
            </span>
          {false ? (
            <div
              ref={templateMenuRef}
              className="absolute left-0 top-full z-[70] mt-2 w-[358px] rounded-none border border-slate-300 bg-white p-2 text-sm shadow-xl"
            >
              <input
                type="text"
                value={templateQuery}
                onChange={(e) => setTemplateQuery(e.target.value)}
                placeholder="Enter or search template name"
                className="w-full bg-transparent px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <div className="px-2 pb-1 text-[11px] text-slate-500">
                Select an existing template to overwrite it, or enter a new name to save a fresh template.
              </div>
              {templateQuery.trim().length > 0 || isLoadingTemplates || templateResults.length > 0 ? (
                <div className="mt-1 max-h-56 overflow-auto rounded-none border border-slate-300 bg-white">
                  {isLoadingTemplates ? (
                    <div className="px-3 py-2 text-xs text-slate-500">Loading templates...</div>
                  ) : templateResults.length ? (
                    templateResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
                        onClick={() => onSelectTemplate(result.id, result.name, result.visibility)}
                      >
                        <div className="font-semibold text-slate-900">{result.name}</div>
                        <div className="text-xs text-slate-500">
                          Updated {result.updatedAt}
                          {result.isGlobal ? " · Global template" : ""}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-500">
                      {templateQuery.trim().length >= 4 ? "No templates found." : "Type 4 characters to start filtering your templates."}
                    </div>
                  )}
                </div>
              ) : null}
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-200 pt-2">
                {templateSaveMessage ? <div className="mr-auto text-xs font-medium text-emerald-600">{templateSaveMessage}</div> : null}
                <div className="flex flex-1 items-stretch gap-2">
                  {false ? (
                    <label
                      className={`flex min-h-[46px] items-stretch border px-3 py-2 text-left transition-colors ${
                        templateVisibility === "global"
                          ? "border-sky-700 bg-[#102a43] text-white"
                          : "border-slate-300 bg-white text-slate-900"
                      }`}
                      title="Save the current map as a global template for every Investigation Tool user."
                    >
                      <div className="flex flex-col justify-center pr-4 leading-tight">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">Global template</span>
                        <span className={`mt-0.5 text-[11px] ${templateVisibility === "global" ? "text-slate-200" : "text-slate-500"}`}>
                          {templateVisibility === "global" ? "Visible to every user" : "Save only to your library"}
                        </span>
                      </div>
                      <div className="flex min-w-[24px] items-center justify-center self-stretch">
                        <input
                          type="checkbox"
                          checked={templateVisibility === "global"}
                          onChange={() => setTemplateVisibility(templateVisibility === "global" ? "private" : "global")}
                          className="h-4 w-4 cursor-pointer accent-slate-900"
                          aria-label="Save as global template"
                        />
                      </div>
                    </label>
                  ) : null}
                  <button
                    type="button"
                    className="flex-1 rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={onSaveTemplate}
                    disabled={isSavingTemplate || !templateQuery.trim()}
                  >
                    {isSavingTemplate ? "Saving..." : "Save Template"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          </div>
        ) : null}
        <div ref={searchTriggerRef}>
          <button
            type="button"
            aria-label="Search components"
            title="Search components"
            onClick={() => setShowSearchMenu((prev) => !prev)}
            className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
          >
            <span
              aria-hidden="true"
              className="h-7 w-7 bg-current"
              style={{ WebkitMaskImage: "url('/icons/finddocument.svg')", maskImage: "url('/icons/finddocument.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
            />
          </button>
        </div>
        <button
          type="button"
          aria-label="Zoom to fit"
          title="Zoom to fit"
          onClick={() => rf?.fitView({ duration: 300, padding: 0.2 })}
          className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
        >
          <span
            aria-hidden="true"
            className="h-7 w-7 bg-current"
            style={{ WebkitMaskImage: "url('/icons/zoomfit.svg')", maskImage: "url('/icons/zoomfit.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
          />
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          title="Reset zoom"
          onClick={() => rf?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })}
          className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
        >
          <span
            aria-hidden="true"
            className="h-7 w-7 bg-current"
            style={{ WebkitMaskImage: "url('/icons/resetzoom.svg')", maskImage: "url('/icons/resetzoom.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
          />
        </button>
        {!isGuestViewer ? (
          <>
            <div className="relative">
              <span title={!canPrint ? printDisabledReason : "Print to PDF"}>
                <button
                  type="button"
                  aria-label="Print to PDF"
                  title={undefined}
                  onClick={() => setShowPrintMenu((prev) => !prev)}
                  disabled={!canPrint || isPreparingPrint}
                  className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-black disabled:hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
                >
                  {isPreparingPrint ? (
                    <span aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="h-7 w-7 bg-current"
                      style={{ WebkitMaskImage: "url('/icons/printer.svg')", maskImage: "url('/icons/printer.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                    />
                  )}
                </button>
              </span>
              {showPrintMenu && canPrint ? (
                <div
                  ref={printMenuRef}
                  className="absolute bottom-[calc(100%+8px)] left-0 z-[170] max-h-[calc(100vh-30px)] min-w-[220px] overflow-y-auto rounded-[20px] border border-slate-200 bg-white/97 p-1.5 text-sm shadow-[0_22px_44px_rgba(15,23,42,0.18)] backdrop-blur"
                >
                  <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100 disabled:opacity-50" onClick={onPrintCurrentView} disabled={isPreparingPrint}>
                    Current View
                  </button>
                  <button className="block w-full rounded-none px-3 py-2 text-left font-normal text-slate-800 hover:bg-slate-100 disabled:opacity-50" onClick={onPrintSelectArea} disabled={isPreparingPrint}>
                    Selected Area
                  </button>
                </div>
              ) : null}
            </div>
            <span title={!canWriteMap && !canCreateSticky ? addDisabledReason : "Add component"}>
              <button
                type="button"
                aria-label="Add component"
                title={undefined}
                onClick={() => setShowAddMenu((prev) => !prev)}
                disabled={!canWriteMap && !canCreateSticky}
                className="group flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-black disabled:hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
              >
                <span
                  aria-hidden="true"
                  className="h-7 w-7 bg-current"
                  style={{ WebkitMaskImage: "url('/icons/addcomponent.svg')", maskImage: "url('/icons/addcomponent.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                />
              </button>
            </span>
          </>
        ) : null}
        {renderSearchMenu()}
        {false && (
          <div
            ref={searchMenuRef}
            className="fixed z-[170] w-[320px] rounded-[24px] border border-slate-200 bg-white/97 p-3 text-sm shadow-[0_22px_44px_rgba(15,23,42,0.18)] backdrop-blur"
            style={searchMenuStyle}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Start typing to search documents"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery.trim().length > 0 && (
              <div className="mt-2 max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white">
                {searchResults.length ? (
                  searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
                      onClick={() => onSelectSearchResult(result.id)}
                    >
                      <div className="truncate font-semibold text-slate-900" title={result.label}>{result.label}</div>
                      {result.description ? (
                        <div className="truncate text-xs text-slate-500" title={result.description}>{result.description}</div>
                      ) : null}
                      <div className="truncate text-xs text-slate-500" title={result.kind}>{result.kind}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-500">No results found</div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
      {showAddMenu && (canWriteMap || canCreateSticky) && (
        <div className="fixed left-[98px] top-[82px] bottom-[20px] z-[160] w-[360px] max-w-[calc(100vw-132px)]">
          <div
            ref={addMenuRef}
            className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/45 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))] shadow-[0_28px_64px_rgba(15,23,42,0.24)]"
          >
            <div className="border-b border-slate-200/80 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Add Component</p>
                  <h2 className="mt-1 text-[1.4rem] font-semibold text-slate-950">Choose what to place on the map</h2>
                  <p className="mt-1.5 max-w-none text-sm leading-5 text-slate-600">
                    Left-rail palette preview. Components open beside the tool stack instead of in the canvas center.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close add component modal"
                  className="inline-flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
                  onClick={() => setShowAddMenu(() => false)}
                >
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 bg-current"
                    style={{ WebkitMaskImage: "url('/icons/close.svg')", maskImage: "url('/icons/close.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                  />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {addFilterPills.map((pill) => {
                  const isActive = activeAddFilter === pill.key;
                  return (
                    <button
                      key={pill.key}
                      type="button"
                      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                        isActive
                          ? "bg-[#102a43] text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      onClick={() => setActiveAddFilter(pill.key)}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-5">
              <div className="mx-auto flex min-h-full w-full flex-col justify-start">
              {activeAddFilter === "all" ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                  {addItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="flex min-h-[112px] flex-col items-center justify-start rounded-2xl px-2 py-2 text-center text-sm font-semibold text-slate-900 transition duration-150 hover:-translate-y-0.5 hover:bg-white/70"
                      onClick={() => {
                        setShowAddMenu(() => false);
                        item.onClick();
                      }}
                    >
                      <span className="mb-2 flex items-center justify-center">{renderAddItemPreview(item.key)}</span>
                      <span className="text-sm font-semibold leading-tight text-slate-900">{item.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleAddItemGroups.map((section) => (
                    <div key={section.group}>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                        {section.items.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            className="flex min-h-[112px] flex-col items-center justify-start rounded-2xl px-2 py-2 text-center text-sm font-semibold text-slate-900 transition duration-150 hover:-translate-y-0.5 hover:bg-white/70"
                            onClick={() => {
                              setShowAddMenu(() => false);
                              item.onClick();
                            }}
                          >
                            <span className="mb-2 flex items-center justify-center">{renderAddItemPreview(item.key)}</span>
                            <span className="text-sm font-semibold leading-tight text-slate-900">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}
      {canvasInteractionLocked ? (
        <div className="pointer-events-none fixed bottom-[20px] left-1/2 z-[180] -translate-x-1/2">
          <div className="rounded-full bg-[#102a43] px-4 py-2 text-sm font-medium text-white shadow-[0_14px_28px_rgba(15,23,42,0.22)]">
            Canvas is locked. Dragging and moving items is disabled.
          </div>
        </div>
      ) : null}
      {renderSuggestionsModal()}
    </>
  );
}

type MapInfoAsideProps = {
  isMobile: boolean;
  showMapInfoAside: boolean;
  mapInfoAsideRef: RefObject<HTMLDivElement | null>;
  handleCloseMapInfoAside: () => void;
  canManageMapMetadata: boolean;
  isEditingMapInfo: boolean;
  mapInfoNameDraft: string;
  setMapInfoNameDraft: (value: string) => void;
  mapCodeDraft: string;
  setMapCodeDraft: (value: string) => void;
  mapInfoDescriptionDraft: string;
  setMapInfoDescriptionDraft: (value: string) => void;
  map: SystemMap;
  savingMapInfo: boolean;
  handleSaveMapInfo: () => Promise<void>;
  setIsEditingMapInfo: (value: boolean) => void;
  setMapInfoDescriptionDraftFromMap: () => void;
  setMapCodeDraftFromMap: () => void;
  mapMembers: MapMemberProfileRow[];
  ownerHasActiveOrganisation: boolean;
  showOrgAccessModal: boolean;
  setShowOrgAccessModal: (value: boolean) => void;
  userId: string | null;
  userEmail: string;
  orgAccessCandidates: Array<{
    userId: string;
    fullName: string;
    email: string;
    organisations: string[];
    currentRole: "read" | "partial_write" | "full_write" | null;
  }>;
  orgAccessSearch: string;
  setOrgAccessSearch: (value: string) => void;
  orgAccessLoading: boolean;
  orgAccessError: string | null;
  grantingOrgAccessUserId: string | null;
  handleGrantOrgUserFullWrite: (userId: string) => Promise<void>;
  savingMemberRoleUserId: string | null;
  handleUpdateMapMemberRole: (userId: string, role: "read" | "partial_write" | "full_write") => Promise<void>;
  mapRoleLabel: (role: string) => string;
};

export function MapInfoAside({
  isMobile,
  showMapInfoAside,
  mapInfoAsideRef,
  handleCloseMapInfoAside,
  canManageMapMetadata,
  isEditingMapInfo,
  mapInfoNameDraft,
  setMapInfoNameDraft,
  mapCodeDraft,
  setMapCodeDraft,
  mapInfoDescriptionDraft,
  setMapInfoDescriptionDraft,
  map,
  savingMapInfo,
  handleSaveMapInfo,
  setIsEditingMapInfo,
  setMapInfoDescriptionDraftFromMap,
  setMapCodeDraftFromMap,
  mapMembers,
  ownerHasActiveOrganisation,
  showOrgAccessModal,
  setShowOrgAccessModal,
  userId,
  userEmail,
  orgAccessCandidates,
  orgAccessSearch,
  setOrgAccessSearch,
  orgAccessLoading,
  orgAccessError,
  grantingOrgAccessUserId,
  handleGrantOrgUserFullWrite,
  savingMemberRoleUserId,
  handleUpdateMapMemberRole,
  mapRoleLabel,
}: MapInfoAsideProps) {
  if (!showMapInfoAside) return null;
  return (
    <>
      <aside
        ref={mapInfoAsideRef}
        className={
          isMobile
            ? "fixed inset-0 z-[98] w-full bg-white text-slate-900"
            : "fixed bottom-0 right-0 top-[64px] z-[79] w-full max-w-[294px] border-l border-slate-300 bg-white shadow-[-16px_0_30px_rgba(15,23,42,0.26),0_8px_22px_rgba(15,23,42,0.14)]"
        }
      >
        <div className={`flex h-full flex-col overflow-auto ${isMobile ? "px-5 pb-28 pt-5" : "p-4"}`}>
        <div className="flex items-center justify-between border-b border-slate-300 pb-3">
          <h2 className="text-base font-semibold text-slate-900">Map Information</h2>
          <button
            className="rounded-none border border-black bg-white px-2 py-1 text-xs text-black hover:bg-slate-100"
            onClick={handleCloseMapInfoAside}
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="text-sm text-slate-700">System Map Name
            {isEditingMapInfo ? (
              <input
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                value={mapInfoNameDraft}
                onChange={(e) => setMapInfoNameDraft(e.target.value)}
              />
            ) : (
              <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">{map.title}</div>
            )}
          </label>
          {canManageMapMetadata ? (
            <label className="text-sm text-slate-700">Map Code
              {isEditingMapInfo ? (
                <input
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 font-semibold uppercase tracking-[0.08em] text-black"
                  value={mapCodeDraft}
                  onChange={(e) => setMapCodeDraft(e.target.value.toUpperCase())}
                  placeholder="Enter map code"
                />
              ) : (
                <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-900">
                  {map.map_code || "-"}
                </div>
              )}
            </label>
          ) : null}

          <label className="text-sm text-slate-700">Description
            {isEditingMapInfo ? (
              <textarea
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-black"
                rows={6}
                value={mapInfoDescriptionDraft}
                onChange={(e) => setMapInfoDescriptionDraft(e.target.value)}
              />
            ) : (
              <div className="mt-1 min-h-[132px] rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                {map.description?.trim() || "No description"}
              </div>
            )}
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          {isEditingMapInfo ? (
            <>
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-slate-100"
                onClick={() => void handleSaveMapInfo()}
                disabled={savingMapInfo}
              >
                {savingMapInfo ? "Saving..." : "Save"}
              </button>
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                onClick={() => {
                  setIsEditingMapInfo(false);
                  setMapInfoNameDraft(map.title);
                  setMapInfoDescriptionDraftFromMap();
                  setMapCodeDraftFromMap();
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            canManageMapMetadata ? (
              <button
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                onClick={() => setIsEditingMapInfo(true)}
              >
                Edit
              </button>
            ) : null
          )}
        </div>

        <div className="mt-5 border-t border-slate-300 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">Map Access</h3>
          {ownerHasActiveOrganisation ? (
            <p className="mt-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
              Organisation members can view this map read-only. Grant full access only to users who should edit it.
            </p>
          ) : null}
          {canManageMapMetadata ? (
            <button
              type="button"
              className="mt-3 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              onClick={() => {
                setOrgAccessSearch("");
                setShowOrgAccessModal(true);
              }}
            >
              Grant Full Access
            </button>
          ) : null}
          <div className="mt-2 space-y-2">
            {mapMembers.length ? (
              mapMembers.map((member) => {
                const canEditMemberRole = canManageMapMetadata && member.user_id !== map.owner_id;
                const displayName = member.full_name?.trim() || (member.user_id === map.owner_id ? "Map Owner" : "User");
                const displayEmail = member.email?.trim() || (member.user_id === userId ? userEmail : "");
                return (
                  <div key={member.user_id} className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                    <div className="text-xs text-slate-600">{displayEmail || member.user_id}</div>
                    <div className="mt-2">
                      {canEditMemberRole ? (
                        <select
                          className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                          value={member.role}
                          disabled={savingMemberRoleUserId === member.user_id}
                          onChange={(e) =>
                            void handleUpdateMapMemberRole(
                              member.user_id,
                              e.target.value as "read" | "partial_write" | "full_write"
                            )
                          }
                        >
                          <option value="read">Read</option>
                          <option value="partial_write">Partial write</option>
                          <option value="full_write">Full write</option>
                        </select>
                      ) : (
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">
                          {member.user_id === map.owner_id ? "Owner (Full write)" : mapRoleLabel(member.role)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">No linked users</div>
            )}
          </div>
        </div>
        </div>
      </aside>
      {showOrgAccessModal ? (
        <div className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="flex max-h-[82vh] w-full max-w-[560px] flex-col rounded border border-slate-300 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Grant Full Access</h3>
                <p className="mt-1 text-sm text-slate-600">Search active users in your organisation and add them to this map.</p>
              </div>
              <button
                type="button"
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 hover:bg-slate-100"
                onClick={() => setShowOrgAccessModal(false)}
              >
                Close
              </button>
            </div>
            <div className="px-5 py-4">
              <input
                autoFocus
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                value={orgAccessSearch}
                onChange={(e) => setOrgAccessSearch(e.target.value)}
                placeholder="Search by name or email"
              />
              {orgAccessError ? <p className="mt-2 text-sm text-red-700">{orgAccessError}</p> : null}
            </div>
            <div className="min-h-0 flex-1 overflow-auto border-t border-slate-200 px-5 py-4">
              {orgAccessSearch.trim().length < 2 ? (
                <div className="rounded border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                  Type at least 2 characters to search organisation users.
                </div>
              ) : orgAccessLoading ? (
                <div className="rounded border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">Searching organisation users...</div>
              ) : orgAccessCandidates.length === 0 ? (
                <div className="rounded border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                  No organisation users match that search.
                </div>
              ) : (
                <div className="space-y-2">
                  {orgAccessCandidates.map((candidate) => {
                    const displayName = candidate.fullName || candidate.email || candidate.userId;
                    const isAlreadyFullWrite = candidate.currentRole === "full_write";
                    return (
                      <div key={candidate.userId} className="rounded border border-slate-200 bg-white px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900" title={displayName}>{displayName}</div>
                            <div className="truncate text-xs text-slate-600" title={candidate.email || candidate.userId}>
                              {candidate.email || candidate.userId}
                            </div>
                            {candidate.organisations.length ? (
                              <div className="mt-1 truncate text-[11px] text-slate-500" title={candidate.organisations.join(", ")}>
                                {candidate.organisations.join(", ")}
                              </div>
                            ) : null}
                            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                              {candidate.currentRole ? mapRoleLabel(candidate.currentRole) : "Org read access"}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="shrink-0 rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isAlreadyFullWrite || grantingOrgAccessUserId === candidate.userId}
                            onClick={() => void handleGrantOrgUserFullWrite(candidate.userId)}
                          >
                            {isAlreadyFullWrite
                              ? "Added"
                              : grantingOrgAccessUserId === candidate.userId
                              ? "Adding..."
                              : "Add"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
