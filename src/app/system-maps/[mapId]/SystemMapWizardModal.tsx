import { useEffect, useMemo, useRef, useState } from "react";
import type { MapCategoryId } from "./mapCategories";
import { defaultMapCategoryId } from "./mapCategories";

export type WizardSequenceItem = {
  heading: string;
  timestamp: string;
  description: string;
  location: string;
};

export type WizardPersonItem = {
  roleName: string;
  occupantName: string;
};

export type WizardTaskConditionItem = {
  heading: string;
  description: string;
  state: "normal" | "abnormal";
  environmentalContext: string;
};

export type WizardFactorItem = {
  kind: "incident_factor" | "incident_system_factor";
  heading: string;
  description: string;
  presence: "present" | "absent";
  classification: "essential" | "contributing" | "predisposing" | "neutral";
  category: string;
};

export type WizardControlBarrierItem = {
  heading: string;
  description: string;
  barrierState: "effective" | "failed" | "missing";
  barrierRole: "preventive" | "mitigative" | "recovery";
  controlType: string;
  ownerText: string;
};

export type WizardEvidenceItem = {
  heading: string;
  description: string;
  evidenceType: string;
  source: string;
};

export type WizardFindingItem = {
  heading: string;
  description: string;
  confidenceLevel: "low" | "medium" | "high";
};

export type WizardRecommendationItem = {
  heading: string;
  description: string;
  actionType: "corrective" | "preventive";
  ownerText: string;
  dueDate: string;
};

export type WizardSimpleItem = {
  heading: string;
  description: string;
};

export type WizardDocumentItem = {
  title: string;
  documentType: string;
  documentNumber: string;
};

export type WizardHierarchyItem = {
  layerName: string;
  documentIds: string[];
};

export type WizardBowtieOverviewItem = {
  hazard: string;
  topEvent: string;
  lossOfControlType: string;
  likelihood: "rare" | "unlikely" | "possible" | "likely" | "almost_certain";
  consequence: "insignificant" | "minor" | "moderate" | "major" | "severe";
  riskLevel: "low" | "medium" | "high" | "critical";
};

export type WizardBowtieThreatItem = {
  heading: string;
  threatCategory: string;
};

export type WizardBowtieConsequenceItem = {
  heading: string;
  impactCategory: string;
};

export type WizardBowtieControlItem = {
  heading: string;
  description: string;
  controlCategory: "preventive" | "mitigative" | "recovery";
  linkedTargetHeading: string;
  controlType: string;
  verificationMethod: string;
  verificationFrequency: string;
  critical: boolean;
};

export type WizardOrgChartRoleItem = {
  positionTitle: string;
  occupantName: string;
  roleId: string;
  employmentType: "fte" | "contractor";
  proposedRole: boolean;
};

export type WizardProcessFlowStepItem = {
  heading: string;
  kind: "process_component" | "shape_rectangle" | "shape_pill";
  description: string;
};

export type WizardBowtieAssuranceItem = {
  heading: string;
  kind: "bowtie_escalation_factor" | "bowtie_recovery_measure" | "bowtie_degradation_indicator";
  description: string;
  factorType: string;
  timeRequirement: string;
  monitoringMethod: string;
};

export type SystemMapWizardCommitPayload =
  | { category: "incident_investigation"; step: "sequence"; items: WizardSequenceItem[] }
  | { category: "incident_investigation"; step: "people"; items: WizardPersonItem[] }
  | { category: "incident_investigation"; step: "task-condition"; items: WizardTaskConditionItem[] }
  | { category: "incident_investigation"; step: "factors"; items: WizardFactorItem[] }
  | { category: "incident_investigation"; step: "control-barrier"; items: WizardControlBarrierItem[] }
  | { category: "incident_investigation"; step: "evidence"; items: WizardEvidenceItem[] }
  | { category: "incident_investigation"; step: "finding"; items: WizardFindingItem[] }
  | { category: "incident_investigation"; step: "recommendation"; items: WizardRecommendationItem[] }
  | { category: "document_map"; step: "systems"; items: WizardSimpleItem[] }
  | { category: "document_map"; step: "processes"; items: WizardSimpleItem[] }
  | { category: "document_map"; step: "people"; items: WizardPersonItem[] }
  | { category: "document_map"; step: "documents"; items: WizardDocumentItem[] }
  | { category: "document_map"; step: "hierarchy"; items: WizardHierarchyItem[] }
  | { category: "bow_tie"; step: "overview"; items: WizardBowtieOverviewItem[] }
  | { category: "bow_tie"; step: "threats"; items: WizardBowtieThreatItem[] }
  | { category: "bow_tie"; step: "consequences"; items: WizardBowtieConsequenceItem[] }
  | { category: "bow_tie"; step: "controls"; items: WizardBowtieControlItem[] }
  | { category: "bow_tie"; step: "assurance"; items: WizardBowtieAssuranceItem[] }
  | { category: "org_chart"; step: "departments"; items: WizardSimpleItem[] }
  | { category: "org_chart"; step: "leadership"; items: WizardOrgChartRoleItem[] }
  | { category: "org_chart"; step: "team"; items: WizardOrgChartRoleItem[] }
  | { category: "process_flow"; step: "lanes"; items: WizardSimpleItem[] }
  | { category: "process_flow"; step: "steps"; items: WizardProcessFlowStepItem[] }
  | { category: "process_flow"; step: "inputs-outputs"; items: WizardSimpleItem[] }
  | { category: "process_flow"; step: "roles"; items: WizardPersonItem[] };

type WizardStepConfig = {
  id: string;
  label: string;
  description: string;
};

type SystemMapWizardModalProps = {
  open: boolean;
  isMobile?: boolean;
  categoryId: MapCategoryId;
  documentTypeOptions: Array<{ id: string; name: string }>;
  existingDocumentOptions: Array<{ id: string; title: string; subtitle: string }>;
  onClose: () => void;
  onCommitStep: (payload: SystemMapWizardCommitPayload) => Promise<void>;
  isSaving: boolean;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
const textareaClass = `${inputClass} min-h-[92px] resize-y`;
const selectClass = inputClass;
const cardClass = "rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]";
const factorInfluenceTypeOptions = ["human", "equipment", "process", "environment", "organisation"] as const;
const systemFactorCategoryOptions = ["training", "supervision", "planning", "design", "culture", "other"] as const;
const riskLevelOptions = ["low", "medium", "high", "critical"] as const;
const bowtieLikelihoodOptions = ["rare", "unlikely", "possible", "likely", "almost_certain"] as const;
const bowtieConsequenceOptions = ["insignificant", "minor", "moderate", "major", "severe"] as const;
const bowtieLossOfControlTypeOptions = ["containment", "stability", "condition", "process", "other"] as const;
const bowtieThreatCategoryOptions = ["people", "process", "plant", "environment", "external", "other"] as const;
const bowtieImpactCategoryOptions = ["safety", "health", "environment", "community", "financial", "reputation", "other"] as const;
const controlCategoryOptions = ["preventive", "mitigative", "recovery"] as const;
const bowtieControlTypeOptions = ["elimination", "substitution", "isolation", "engineering", "administrative", "procedural", "behavioural", "detection", "ppe"] as const;
const bowtieVerificationMethodOptions = ["inspection", "test", "monitoring", "audit", "review", "other"] as const;
const bowtieVerificationFrequencyOptions = ["per_shift", "daily", "weekly", "monthly", "quarterly", "annual", "triggered"] as const;
const bowtieFactorTypeOptions = ["human", "environmental", "equipment", "system", "process", "other"] as const;
const bowtieTimeRequirementOptions = ["immediate", "within_15m", "within_1h", "within_shift", "within_24h", "planned"] as const;
const bowtieMonitoringMethodOptions = ["inspection", "sensor", "test", "observation", "audit", "other"] as const;

const createSequenceItem = (): WizardSequenceItem => ({ heading: "", timestamp: "", description: "", location: "" });
const createPersonItem = (): WizardPersonItem => ({ roleName: "", occupantName: "" });
const createTaskConditionItem = (): WizardTaskConditionItem => ({ heading: "", description: "", state: "normal", environmentalContext: "" });
const createFactorItem = (): WizardFactorItem => ({ kind: "incident_factor", heading: "", description: "", presence: "present", classification: "contributing", category: "human" });
const createControlBarrierItem = (): WizardControlBarrierItem => ({ heading: "", description: "", barrierState: "effective", barrierRole: "preventive", controlType: "", ownerText: "" });
const createEvidenceItem = (): WizardEvidenceItem => ({ heading: "", description: "", evidenceType: "", source: "" });
const createFindingItem = (): WizardFindingItem => ({ heading: "", description: "", confidenceLevel: "medium" });
const createRecommendationItem = (): WizardRecommendationItem => ({ heading: "", description: "", actionType: "corrective", ownerText: "", dueDate: "" });
const createSimpleItem = (): WizardSimpleItem => ({ heading: "", description: "" });
const createDocumentItem = (): WizardDocumentItem => ({ title: "", documentType: "", documentNumber: "" });
const createHierarchyItem = (): WizardHierarchyItem => ({ layerName: "", documentIds: [] });
const createBowtieOverviewItem = (): WizardBowtieOverviewItem => ({
  hazard: "",
  topEvent: "",
  lossOfControlType: "",
  likelihood: "possible",
  consequence: "moderate",
  riskLevel: "medium",
});
const createBowtieThreatItem = (): WizardBowtieThreatItem => ({ heading: "", threatCategory: "" });
const createBowtieConsequenceItem = (): WizardBowtieConsequenceItem => ({ heading: "", impactCategory: "" });
const createBowtieControlItem = (): WizardBowtieControlItem => ({
  heading: "",
  description: "",
  controlCategory: "preventive",
  linkedTargetHeading: "",
  controlType: "",
  verificationMethod: "",
  verificationFrequency: "",
  critical: false,
});
const createBowtieAssuranceItem = (): WizardBowtieAssuranceItem => ({
  heading: "",
  kind: "bowtie_escalation_factor",
  description: "",
  factorType: "",
  timeRequirement: "",
  monitoringMethod: "",
});
const createOrgChartRoleItem = (): WizardOrgChartRoleItem => ({ positionTitle: "", occupantName: "", roleId: "", employmentType: "fte", proposedRole: false });
const createProcessFlowStepItem = (): WizardProcessFlowStepItem => ({ heading: "", kind: "process_component", description: "" });

const updateItem = <T,>(items: T[], index: number, patch: Partial<T>) =>
  items.map((entry, currentIndex) => (currentIndex === index ? { ...entry, ...patch } : entry));

const toggleExpandedIndex = (current: number, index: number) => (current === index ? -1 : index);
const adjustExpandedIndexAfterRemove = (current: number, index: number) => {
  if (current === index) return Math.max(0, index - 1);
  if (current > index) return current - 1;
  return current;
};
const summarizeValues = (...values: Array<string | undefined>) => {
  const summary = values.map((value) => value?.trim()).filter(Boolean).join(" | ");
  return summary || "No details entered yet.";
};
const formatWizardOptionLabel = (value: string) =>
  value
    .split("_")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
    .join(" ");

const wizardConfigs: Record<MapCategoryId, { title: string; intro: string; steps: WizardStepConfig[] }> = {
  incident_investigation: {
    title: "Build The Investigation Map",
    intro: "Each step adds a grouped investigation section onto the canvas.",
    steps: [
      { id: "sequence", label: "Sequence", description: "Capture the timeline of events." },
      { id: "people", label: "People", description: "Add people and key roles involved." },
      { id: "task-condition", label: "Task / Condition", description: "Record what was happening and the operating conditions." },
      { id: "factors", label: "Factors", description: "Capture direct and systemic factors." },
      { id: "control-barrier", label: "Controls / Barriers", description: "Add barriers and their current state." },
      { id: "evidence", label: "Evidence", description: "List the key evidence sources." },
      { id: "finding", label: "Findings", description: "Capture your emerging findings." },
      { id: "recommendation", label: "Recommendations", description: "Add practical actions and owners." },
    ],
  },
  document_map: {
    title: "Build The Document Map",
    intro: "Create a fuller starter map with systems, processes, categories, people, and seeded documents.",
    steps: [
      { id: "systems", label: "Systems", description: "Add the main systems or business areas." },
      { id: "processes", label: "Processes", description: "Add the main process nodes under review." },
      { id: "people", label: "People", description: "Add owners or key roles for the map." },
      { id: "documents", label: "Documents", description: "Seed starter documents by type or layer." },
      { id: "hierarchy", label: "Hierarchy", description: "Optionally scaffold starter structure from your hierarchy." },
    ],
  },
  bow_tie: {
    title: "Build The Bow Tie",
    intro: "Set up the central hazard view first, then add threats, consequences, and controls.",
    steps: [
      { id: "overview", label: "Overview", description: "Set the hazard, top event, and starting risk rating." },
      { id: "threats", label: "Threats", description: "Add the main threats on the left side." },
      { id: "consequences", label: "Consequences", description: "Add the potential consequences on the right side." },
      { id: "controls", label: "Controls", description: "Add preventive, mitigative, and recovery controls." },
      { id: "assurance", label: "Escalation / Recovery", description: "Add escalation factors, recovery measures, and degradation indicators." },
    ],
  },
  org_chart: {
    title: "Build The Org Chart",
    intro: "Create a fuller organisation chart with departments, leadership, and team roles.",
    steps: [
      { id: "departments", label: "Departments", description: "Add key departments or divisions first." },
      { id: "leadership", label: "Leadership", description: "Add the key leadership roles first." },
      { id: "team", label: "Team", description: "Add the broader team structure." },
    ],
  },
  process_flow: {
    title: "Build The Process Flow",
    intro: "Create lanes, core steps, inputs/outputs, and supporting roles to start the flow.",
    steps: [
      { id: "lanes", label: "Lanes", description: "Add phase or lane headings for the flow." },
      { id: "steps", label: "Steps", description: "Add the main steps and decision points." },
      { id: "inputs-outputs", label: "Inputs / Outputs", description: "Add key inputs, outputs, or transfers in the flow." },
      { id: "roles", label: "Roles", description: "Add people responsible for the flow." },
    ],
  },
};

export function SystemMapWizardModal({
  open,
  isMobile = false,
  categoryId,
  documentTypeOptions,
  existingDocumentOptions,
  onClose,
  onCommitStep,
  isSaving,
}: SystemMapWizardModalProps) {
  const hierarchyPickerAreaRef = useRef<HTMLDivElement | null>(null);
  const resolvedCategoryId = categoryId && categoryId in wizardConfigs ? categoryId : defaultMapCategoryId;
  const config = wizardConfigs[resolvedCategoryId];
  const steps = config.steps;
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedSequenceIndex, setExpandedSequenceIndex] = useState(0);
  const [expandedPersonIndex, setExpandedPersonIndex] = useState(0);
  const [expandedTaskConditionIndex, setExpandedTaskConditionIndex] = useState(0);
  const [expandedFactorIndex, setExpandedFactorIndex] = useState(0);
  const [expandedControlBarrierIndex, setExpandedControlBarrierIndex] = useState(0);
  const [expandedEvidenceIndex, setExpandedEvidenceIndex] = useState(0);
  const [expandedFindingIndex, setExpandedFindingIndex] = useState(0);
  const [expandedRecommendationIndex, setExpandedRecommendationIndex] = useState(0);
  const [expandedSimpleIndex, setExpandedSimpleIndex] = useState(0);
  const [expandedDocumentIndex, setExpandedDocumentIndex] = useState(0);
  const [expandedHierarchyIndex, setExpandedHierarchyIndex] = useState(0);
  const [hierarchySearchByIndex, setHierarchySearchByIndex] = useState<Record<number, string>>({});
  const [hierarchyPickerOpenIndex, setHierarchyPickerOpenIndex] = useState<number>(-1);
  const [expandedBowtieThreatIndex, setExpandedBowtieThreatIndex] = useState(0);
  const [expandedBowtieConsequenceIndex, setExpandedBowtieConsequenceIndex] = useState(0);
  const [expandedBowtieControlIndex, setExpandedBowtieControlIndex] = useState(0);
  const [expandedBowtieAssuranceIndex, setExpandedBowtieAssuranceIndex] = useState(0);
  const [expandedDepartmentIndex, setExpandedDepartmentIndex] = useState(0);
  const [expandedOrgChartIndex, setExpandedOrgChartIndex] = useState(0);
  const [expandedProcessFlowStepIndex, setExpandedProcessFlowStepIndex] = useState(0);
  const [sequenceItems, setSequenceItems] = useState<WizardSequenceItem[]>([createSequenceItem()]);
  const [personItems, setPersonItems] = useState<WizardPersonItem[]>([createPersonItem()]);
  const [taskConditionItems, setTaskConditionItems] = useState<WizardTaskConditionItem[]>([createTaskConditionItem()]);
  const [factorItems, setFactorItems] = useState<WizardFactorItem[]>([createFactorItem()]);
  const [controlBarrierItems, setControlBarrierItems] = useState<WizardControlBarrierItem[]>([createControlBarrierItem()]);
  const [evidenceItems, setEvidenceItems] = useState<WizardEvidenceItem[]>([createEvidenceItem()]);
  const [findingItems, setFindingItems] = useState<WizardFindingItem[]>([createFindingItem()]);
  const [recommendationItems, setRecommendationItems] = useState<WizardRecommendationItem[]>([createRecommendationItem()]);
  const [systemItems, setSystemItems] = useState<WizardSimpleItem[]>([createSimpleItem()]);
  const [processItems, setProcessItems] = useState<WizardSimpleItem[]>([createSimpleItem()]);
  const [documentItems, setDocumentItems] = useState<WizardDocumentItem[]>([createDocumentItem()]);
  const [hierarchyItems, setHierarchyItems] = useState<WizardHierarchyItem[]>([createHierarchyItem()]);
  const [laneItems, setLaneItems] = useState<WizardSimpleItem[]>([createSimpleItem()]);
  const [bowtieOverviewItems, setBowtieOverviewItems] = useState<WizardBowtieOverviewItem[]>([createBowtieOverviewItem()]);
  const [bowtieThreatItems, setBowtieThreatItems] = useState<WizardBowtieThreatItem[]>([createBowtieThreatItem()]);
  const [bowtieConsequenceItems, setBowtieConsequenceItems] = useState<WizardBowtieConsequenceItem[]>([createBowtieConsequenceItem()]);
  const [bowtieControlItems, setBowtieControlItems] = useState<WizardBowtieControlItem[]>([createBowtieControlItem()]);
  const [bowtieAssuranceItems, setBowtieAssuranceItems] = useState<WizardBowtieAssuranceItem[]>([createBowtieAssuranceItem()]);
  const [departmentItems, setDepartmentItems] = useState<WizardSimpleItem[]>([createSimpleItem()]);
  const [orgLeadershipItems, setOrgLeadershipItems] = useState<WizardOrgChartRoleItem[]>([createOrgChartRoleItem()]);
  const [orgTeamItems, setOrgTeamItems] = useState<WizardOrgChartRoleItem[]>([createOrgChartRoleItem()]);
  const [processFlowStepItems, setProcessFlowStepItems] = useState<WizardProcessFlowStepItem[]>([createProcessFlowStepItem()]);
  const [processFlowInputOutputItems, setProcessFlowInputOutputItems] = useState<WizardSimpleItem[]>([createSimpleItem()]);

  const resetWizard = () => {
    setCurrentStep(0);
    setError(null);
    setExpandedSequenceIndex(0);
    setExpandedPersonIndex(0);
    setExpandedTaskConditionIndex(0);
    setExpandedFactorIndex(0);
    setExpandedControlBarrierIndex(0);
    setExpandedEvidenceIndex(0);
    setExpandedFindingIndex(0);
    setExpandedRecommendationIndex(0);
    setExpandedSimpleIndex(0);
    setExpandedDocumentIndex(0);
    setExpandedHierarchyIndex(0);
    setHierarchySearchByIndex({});
    setHierarchyPickerOpenIndex(-1);
    setExpandedBowtieThreatIndex(0);
    setExpandedBowtieConsequenceIndex(0);
    setExpandedBowtieControlIndex(0);
    setExpandedBowtieAssuranceIndex(0);
    setExpandedDepartmentIndex(0);
    setExpandedOrgChartIndex(0);
    setExpandedProcessFlowStepIndex(0);
    setSequenceItems([createSequenceItem()]);
    setPersonItems([createPersonItem()]);
    setTaskConditionItems([createTaskConditionItem()]);
    setFactorItems([createFactorItem()]);
    setControlBarrierItems([createControlBarrierItem()]);
    setEvidenceItems([createEvidenceItem()]);
    setFindingItems([createFindingItem()]);
    setRecommendationItems([createRecommendationItem()]);
    setSystemItems([createSimpleItem()]);
    setProcessItems([createSimpleItem()]);
    setDocumentItems([createDocumentItem()]);
    setHierarchyItems([createHierarchyItem()]);
    setLaneItems([createSimpleItem()]);
    setBowtieOverviewItems([createBowtieOverviewItem()]);
    setBowtieThreatItems([createBowtieThreatItem()]);
    setBowtieConsequenceItems([createBowtieConsequenceItem()]);
    setBowtieControlItems([createBowtieControlItem()]);
    setBowtieAssuranceItems([createBowtieAssuranceItem()]);
    setDepartmentItems([createSimpleItem()]);
    setOrgLeadershipItems([createOrgChartRoleItem()]);
    setOrgTeamItems([createOrgChartRoleItem()]);
    setProcessFlowStepItems([createProcessFlowStepItem()]);
    setProcessFlowInputOutputItems([createSimpleItem()]);
  };

  useEffect(() => {
    if (!open) resetWizard();
  }, [open]);

  useEffect(() => {
    setCurrentStep(0);
    setError(null);
  }, [categoryId]);

  useEffect(() => {
    if (hierarchyPickerOpenIndex < 0) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (hierarchyPickerAreaRef.current?.contains(target)) return;
      setHierarchyPickerOpenIndex(-1);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [hierarchyPickerOpenIndex]);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const nextLabel = useMemo(() => (isLastStep ? "Finish" : "Next"), [isLastStep]);

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const handleSkip = () => {
    setError(null);
    if (isLastStep) {
      handleClose();
      return;
    }
    setCurrentStep((value) => value + 1);
  };

  const handleNext = async () => {
    setError(null);
    try {
      if (resolvedCategoryId === "incident_investigation") {
        if (step.id === "sequence") await onCommitStep({ category: "incident_investigation", step: "sequence", items: sequenceItems });
        else if (step.id === "people") await onCommitStep({ category: "incident_investigation", step: "people", items: personItems });
        else if (step.id === "task-condition") await onCommitStep({ category: "incident_investigation", step: "task-condition", items: taskConditionItems });
        else if (step.id === "factors") await onCommitStep({ category: "incident_investigation", step: "factors", items: factorItems });
        else if (step.id === "control-barrier") await onCommitStep({ category: "incident_investigation", step: "control-barrier", items: controlBarrierItems });
        else if (step.id === "evidence") await onCommitStep({ category: "incident_investigation", step: "evidence", items: evidenceItems });
        else if (step.id === "finding") await onCommitStep({ category: "incident_investigation", step: "finding", items: findingItems });
        else await onCommitStep({ category: "incident_investigation", step: "recommendation", items: recommendationItems });
      } else if (resolvedCategoryId === "document_map") {
        if (step.id === "systems") await onCommitStep({ category: "document_map", step: "systems", items: systemItems });
        else if (step.id === "processes") await onCommitStep({ category: "document_map", step: "processes", items: processItems });
        else if (step.id === "people") await onCommitStep({ category: "document_map", step: "people", items: personItems });
        else if (step.id === "documents") await onCommitStep({ category: "document_map", step: "documents", items: documentItems });
        else await onCommitStep({ category: "document_map", step: "hierarchy", items: hierarchyItems });
      } else if (resolvedCategoryId === "bow_tie") {
        if (step.id === "overview") await onCommitStep({ category: "bow_tie", step: "overview", items: bowtieOverviewItems });
        else if (step.id === "threats") await onCommitStep({ category: "bow_tie", step: "threats", items: bowtieThreatItems });
        else if (step.id === "consequences") await onCommitStep({ category: "bow_tie", step: "consequences", items: bowtieConsequenceItems });
        else if (step.id === "controls") await onCommitStep({ category: "bow_tie", step: "controls", items: bowtieControlItems });
        else await onCommitStep({ category: "bow_tie", step: "assurance", items: bowtieAssuranceItems });
      } else if (resolvedCategoryId === "org_chart") {
        if (step.id === "departments") await onCommitStep({ category: "org_chart", step: "departments", items: departmentItems });
        else if (step.id === "leadership") await onCommitStep({ category: "org_chart", step: "leadership", items: orgLeadershipItems });
        else await onCommitStep({ category: "org_chart", step: "team", items: orgTeamItems });
      } else {
        if (step.id === "lanes") await onCommitStep({ category: "process_flow", step: "lanes", items: laneItems });
        else if (step.id === "steps") await onCommitStep({ category: "process_flow", step: "steps", items: processFlowStepItems });
        else if (step.id === "inputs-outputs") await onCommitStep({ category: "process_flow", step: "inputs-outputs", items: processFlowInputOutputItems });
        else await onCommitStep({ category: "process_flow", step: "roles", items: personItems });
      }

      if (isLastStep) {
        handleClose();
        return;
      }
      setCurrentStep((value) => value + 1);
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : "Unable to add wizard nodes.");
    }
  };

  const renderSimpleItems = (
    title: string,
    items: WizardSimpleItem[],
    setItems: React.Dispatch<React.SetStateAction<WizardSimpleItem[]>>,
    addLabel: string
  ) => (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${title}-${index}`} className={cardClass}>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setExpandedSimpleIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
              <span className="text-sm font-semibold text-slate-900">{title} {index + 1}</span>
              <span className="text-xs font-semibold text-slate-500">{expandedSimpleIndex === index ? "Collapse" : "Expand"}</span>
            </button>
            {items.length > 1 ? (
              <button type="button" onClick={() => { setItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedSimpleIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button>
            ) : null}
          </div>
          {expandedSimpleIndex === index ? (
            <div className="grid gap-4">
              <label className="grid gap-1 text-sm text-slate-700">
                Title
                <input className={inputClass} value={item.heading} onChange={(event) => setItems((current) => updateItem(current, index, { heading: event.target.value }))} />
              </label>
              <label className="grid gap-1 text-sm text-slate-700">
                Description
                <textarea className={textareaClass} value={item.description} onChange={(event) => setItems((current) => updateItem(current, index, { description: event.target.value }))} />
              </label>
            </div>
          ) : (
            <div className="text-sm text-slate-500">{summarizeValues(item.heading, item.description)}</div>
          )}
        </div>
      ))}
      <button type="button" onClick={() => { setItems((current) => [...current, createSimpleItem()]); setExpandedSimpleIndex(items.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">{addLabel}</button>
    </div>
  );

  const renderPersonItems = (
    items: WizardPersonItem[],
    setItems: React.Dispatch<React.SetStateAction<WizardPersonItem[]>>,
    addLabel: string
  ) => (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`person-${index}`} className={cardClass}>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setExpandedPersonIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
              <span className="text-sm font-semibold text-slate-900">Person / Role {index + 1}</span>
              <span className="text-xs font-semibold text-slate-500">{expandedPersonIndex === index ? "Collapse" : "Expand"}</span>
            </button>
            {items.length > 1 ? (
              <button type="button" onClick={() => { setItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedPersonIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button>
            ) : null}
          </div>
          {expandedPersonIndex === index ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-slate-700">
                Role
                <input className={inputClass} value={item.roleName} onChange={(event) => setItems((current) => updateItem(current, index, { roleName: event.target.value }))} />
              </label>
              <label className="grid gap-1 text-sm text-slate-700">
                Occupant
                <input className={inputClass} value={item.occupantName} onChange={(event) => setItems((current) => updateItem(current, index, { occupantName: event.target.value }))} />
              </label>
            </div>
          ) : (
            <div className="text-sm text-slate-500">{summarizeValues(item.roleName, item.occupantName)}</div>
          )}
        </div>
      ))}
      <button type="button" onClick={() => { setItems((current) => [...current, createPersonItem()]); setExpandedPersonIndex(items.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">{addLabel}</button>
    </div>
  );

  const renderDocumentItems = () => (
    <div className="space-y-4">
      {documentItems.map((item, index) => (
        <div key={`document-${index}`} className={cardClass}>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setExpandedDocumentIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
              <span className="text-sm font-semibold text-slate-900">Document {index + 1}</span>
              <span className="text-xs font-semibold text-slate-500">{expandedDocumentIndex === index ? "Collapse" : "Expand"}</span>
            </button>
            {documentItems.length > 1 ? <button type="button" onClick={() => { setDocumentItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedDocumentIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
          </div>
          {expandedDocumentIndex === index ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-slate-700">Document Title<input className={inputClass} value={item.title} onChange={(event) => setDocumentItems((current) => updateItem(current, index, { title: event.target.value }))} /></label>
              <label className="grid gap-1 text-sm text-slate-700">Document Number<input className={inputClass} value={item.documentNumber} onChange={(event) => setDocumentItems((current) => updateItem(current, index, { documentNumber: event.target.value }))} /></label>
              <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Document Type<select className={selectClass} value={item.documentType} onChange={(event) => setDocumentItems((current) => updateItem(current, index, { documentType: event.target.value }))}><option value="">Select a type</option>{documentTypeOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
            </div>
          ) : <div className="text-sm text-slate-500">{summarizeValues(item.title, documentTypeOptions.find((option) => option.id === item.documentType)?.name, item.documentNumber)}</div>}
        </div>
      ))}
      <button type="button" onClick={() => { setDocumentItems((current) => [...current, createDocumentItem()]); setExpandedDocumentIndex(documentItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Document</button>
    </div>
  );

  const renderHierarchyItems = () => (
    <div className="space-y-4">
      {hierarchyItems.map((item, index) => (
        <div key={`hierarchy-${index}`} className={cardClass}>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setExpandedHierarchyIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
              <span className="text-sm font-semibold text-slate-900">Layer {index + 1}</span>
              <span className="text-xs font-semibold text-slate-500">{expandedHierarchyIndex === index ? "Collapse" : "Expand"}</span>
            </button>
            {hierarchyItems.length > 1 ? <button type="button" onClick={() => { setHierarchyItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedHierarchyIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
          </div>
          {expandedHierarchyIndex === index ? (
            <div className="grid gap-4">
              <label className="grid gap-1 text-sm text-slate-700">Layer Name<input className={inputClass} value={item.layerName} onChange={(event) => setHierarchyItems((current) => updateItem(current, index, { layerName: event.target.value }))} /></label>
              <div className="grid gap-2 text-sm text-slate-700">
                <span>Existing Documents</span>
                <div ref={hierarchyPickerAreaRef} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
                  {item.documentIds.length ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {item.documentIds.map((documentId) => {
                        const option = existingDocumentOptions.find((entry) => entry.id === documentId);
                        if (!option) return null;
                        return (
                          <span key={documentId} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            <span className="max-w-[180px] truncate">{option.title}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setHierarchyItems((current) =>
                                  current.map((entry, currentIndex) =>
                                    currentIndex !== index
                                      ? entry
                                      : { ...entry, documentIds: entry.documentIds.filter((value) => value !== documentId) }
                                  )
                                )
                              }
                              className="text-slate-500 hover:text-slate-900"
                              aria-label={`Remove ${option.title}`}
                            >
                              x
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                  <div className="relative">
                    <input
                      className={inputClass}
                      placeholder="Search and select documents"
                      value={hierarchySearchByIndex[index] ?? ""}
                      onFocus={() => setHierarchyPickerOpenIndex(index)}
                      onChange={(event) => {
                        setHierarchyPickerOpenIndex(index);
                        setHierarchySearchByIndex((current) => ({
                          ...current,
                          [index]: event.target.value,
                        }));
                      }}
                    />
                    {hierarchyPickerOpenIndex === index ? (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                        {existingDocumentOptions
                          .filter((option) => !item.documentIds.includes(option.id))
                          .filter((option) => {
                            const query = (hierarchySearchByIndex[index] ?? "").trim().toLowerCase();
                            if (!query) return true;
                            return `${option.title} ${option.subtitle}`.toLowerCase().includes(query);
                          })
                          .map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                setHierarchyItems((current) =>
                                  current.map((entry, currentIndex) =>
                                    currentIndex !== index
                                      ? entry
                                      : { ...entry, documentIds: [...entry.documentIds, option.id] }
                                  )
                                );
                                setHierarchySearchByIndex((current) => ({ ...current, [index]: "" }));
                              }}
                              className="block w-full rounded-xl px-3 py-2 text-left hover:bg-slate-50"
                            >
                              <span className="block truncate text-sm font-medium text-slate-900">{option.title}</span>
                              <span className="block truncate text-xs text-slate-500">{option.subtitle}</span>
                            </button>
                          ))}
                        {!existingDocumentOptions.length ? <div className="px-3 py-2 text-sm text-slate-500">No existing documents available yet.</div> : null}
                        {existingDocumentOptions.length &&
                        !existingDocumentOptions
                          .filter((option) => !item.documentIds.includes(option.id))
                          .some((option) => {
                            const query = (hierarchySearchByIndex[index] ?? "").trim().toLowerCase();
                            if (!query) return true;
                            return `${option.title} ${option.subtitle}`.toLowerCase().includes(query);
                          }) ? <div className="px-3 py-2 text-sm text-slate-500">No matching documents.</div> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : <div className="text-sm text-slate-500">{summarizeValues(item.layerName, item.documentIds.length ? `${item.documentIds.length} mapped documents` : "")}</div>}
        </div>
      ))}
      <button type="button" onClick={() => { setHierarchyItems((current) => [...current, createHierarchyItem()]); setExpandedHierarchyIndex(hierarchyItems.length); setHierarchyPickerOpenIndex(hierarchyItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Layer</button>
    </div>
  );

  const renderCurrentStep = () => {
    if (resolvedCategoryId === "incident_investigation" && step.id === "sequence") {
      return (
        <div className="space-y-4">
          {sequenceItems.map((item, index) => (
            <div key={`sequence-${index}`} className={cardClass}>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setExpandedSequenceIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-900">Event {index + 1}</span>
                  <span className="text-xs font-semibold text-slate-500">{expandedSequenceIndex === index ? "Collapse" : "Expand"}</span>
                </button>
                {sequenceItems.length > 1 ? (
                  <button type="button" onClick={() => { setSequenceItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedSequenceIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button>
                ) : null}
              </div>
              {expandedSequenceIndex === index ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-700">Step Title<input className={inputClass} value={item.heading} onChange={(event) => setSequenceItems((current) => updateItem(current, index, { heading: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Timestamp<input type="datetime-local" className={inputClass} value={item.timestamp} onChange={(event) => setSequenceItems((current) => updateItem(current, index, { timestamp: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description<textarea className={textareaClass} value={item.description} onChange={(event) => setSequenceItems((current) => updateItem(current, index, { description: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Location<input className={inputClass} value={item.location} onChange={(event) => setSequenceItems((current) => updateItem(current, index, { location: event.target.value }))} /></label>
                </div>
              ) : <div className="text-sm text-slate-500">{summarizeValues(item.heading, item.timestamp, item.location, item.description)}</div>}
            </div>
          ))}
          <button type="button" onClick={() => { setSequenceItems((current) => [...current, createSequenceItem()]); setExpandedSequenceIndex(sequenceItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Event</button>
        </div>
      );
    }
    if (resolvedCategoryId === "incident_investigation" && step.id === "people") return renderPersonItems(personItems, setPersonItems, "Add Another Person");
    if (resolvedCategoryId === "incident_investigation" && step.id === "task-condition") {
      return (
        <div className="space-y-4">
          {taskConditionItems.map((item, index) => (
            <div key={`task-${index}`} className={cardClass}>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setExpandedTaskConditionIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-900">Task / Condition {index + 1}</span>
                  <span className="text-xs font-semibold text-slate-500">{expandedTaskConditionIndex === index ? "Collapse" : "Expand"}</span>
                </button>
                {taskConditionItems.length > 1 ? <button type="button" onClick={() => { setTaskConditionItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedTaskConditionIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
              </div>
              {expandedTaskConditionIndex === index ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-700">Heading<input className={inputClass} value={item.heading} onChange={(event) => setTaskConditionItems((current) => updateItem(current, index, { heading: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">State<select className={selectClass} value={item.state} onChange={(event) => setTaskConditionItems((current) => updateItem(current, index, { state: event.target.value as WizardTaskConditionItem["state"] }))}><option value="normal">Normal</option><option value="abnormal">Abnormal</option></select></label>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description<textarea className={textareaClass} value={item.description} onChange={(event) => setTaskConditionItems((current) => updateItem(current, index, { description: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Environmental Context<input className={inputClass} value={item.environmentalContext} onChange={(event) => setTaskConditionItems((current) => updateItem(current, index, { environmentalContext: event.target.value }))} /></label>
                </div>
              ) : <div className="text-sm text-slate-500">{summarizeValues(item.heading, item.state, item.environmentalContext, item.description)}</div>}
            </div>
          ))}
          <button type="button" onClick={() => { setTaskConditionItems((current) => [...current, createTaskConditionItem()]); setExpandedTaskConditionIndex(taskConditionItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Task / Condition</button>
        </div>
      );
    }
    if (resolvedCategoryId === "incident_investigation" && step.id === "factors") {
      return (
        <div className="space-y-4">
          {factorItems.map((item, index) => (
            <div key={`factor-${index}`} className={cardClass}>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setExpandedFactorIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-900">Factor {index + 1}</span>
                  <span className="text-xs font-semibold text-slate-500">{expandedFactorIndex === index ? "Collapse" : "Expand"}</span>
                </button>
                {factorItems.length > 1 ? <button type="button" onClick={() => { setFactorItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedFactorIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
              </div>
              {expandedFactorIndex === index ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-700">Type<select className={selectClass} value={item.kind} onChange={(event) => setFactorItems((current) => updateItem(current, index, { kind: event.target.value as WizardFactorItem["kind"], category: event.target.value === "incident_system_factor" ? "training" : "human" }))}><option value="incident_factor">Factor</option><option value="incident_system_factor">System Factor</option></select></label>
                  <label className="grid gap-1 text-sm text-slate-700">Heading<input className={inputClass} value={item.heading} onChange={(event) => setFactorItems((current) => updateItem(current, index, { heading: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Presence<select className={selectClass} value={item.presence} onChange={(event) => setFactorItems((current) => updateItem(current, index, { presence: event.target.value as WizardFactorItem["presence"] }))}><option value="present">Present</option><option value="absent">Absent</option></select></label>
                  <label className="grid gap-1 text-sm text-slate-700">Classification<select className={selectClass} value={item.classification} onChange={(event) => setFactorItems((current) => updateItem(current, index, { classification: event.target.value as WizardFactorItem["classification"] }))}><option value="essential">Essential</option><option value="contributing">Contributing</option><option value="predisposing">Predisposing</option><option value="neutral">Neutral</option></select></label>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">{item.kind === "incident_system_factor" ? "System Category" : "Influence Type"}<select className={selectClass} value={item.category} onChange={(event) => setFactorItems((current) => updateItem(current, index, { category: event.target.value }))}>{(item.kind === "incident_system_factor" ? systemFactorCategoryOptions : factorInfluenceTypeOptions).map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description<textarea className={textareaClass} value={item.description} onChange={(event) => setFactorItems((current) => updateItem(current, index, { description: event.target.value }))} /></label>
                </div>
              ) : <div className="text-sm text-slate-500">{summarizeValues(item.heading, formatWizardOptionLabel(item.kind), formatWizardOptionLabel(item.category), item.description)}</div>}
            </div>
          ))}
          <button type="button" onClick={() => { setFactorItems((current) => [...current, createFactorItem()]); setExpandedFactorIndex(factorItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Factor</button>
        </div>
      );
    }
    if (resolvedCategoryId === "incident_investigation" && step.id === "control-barrier") {
      return (
        <div className="space-y-4">
          {controlBarrierItems.map((item, index) => (
            <div key={`control-${index}`} className={cardClass}>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setExpandedControlBarrierIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-900">Control / Barrier {index + 1}</span>
                  <span className="text-xs font-semibold text-slate-500">{expandedControlBarrierIndex === index ? "Collapse" : "Expand"}</span>
                </button>
                {controlBarrierItems.length > 1 ? <button type="button" onClick={() => { setControlBarrierItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedControlBarrierIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
              </div>
              {expandedControlBarrierIndex === index ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-700">Heading<input className={inputClass} value={item.heading} onChange={(event) => setControlBarrierItems((current) => updateItem(current, index, { heading: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Barrier State<select className={selectClass} value={item.barrierState} onChange={(event) => setControlBarrierItems((current) => updateItem(current, index, { barrierState: event.target.value as WizardControlBarrierItem["barrierState"] }))}><option value="effective">Effective</option><option value="failed">Failed</option><option value="missing">Missing</option></select></label>
                  <label className="grid gap-1 text-sm text-slate-700">Barrier Role<select className={selectClass} value={item.barrierRole} onChange={(event) => setControlBarrierItems((current) => updateItem(current, index, { barrierRole: event.target.value as WizardControlBarrierItem["barrierRole"] }))}>{controlCategoryOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label>
                  <label className="grid gap-1 text-sm text-slate-700">Control Type<input className={inputClass} value={item.controlType} onChange={(event) => setControlBarrierItems((current) => updateItem(current, index, { controlType: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description<textarea className={textareaClass} value={item.description} onChange={(event) => setControlBarrierItems((current) => updateItem(current, index, { description: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Owner<input className={inputClass} value={item.ownerText} onChange={(event) => setControlBarrierItems((current) => updateItem(current, index, { ownerText: event.target.value }))} /></label>
                </div>
              ) : <div className="text-sm text-slate-500">{summarizeValues(item.heading, item.barrierRole, item.barrierState, item.controlType)}</div>}
            </div>
          ))}
          <button type="button" onClick={() => { setControlBarrierItems((current) => [...current, createControlBarrierItem()]); setExpandedControlBarrierIndex(controlBarrierItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Control / Barrier</button>
        </div>
      );
    }
    if (resolvedCategoryId === "incident_investigation" && step.id === "evidence") {
      return (
        <div className="space-y-4">
          {evidenceItems.map((item, index) => (
            <div key={`evidence-${index}`} className={cardClass}>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setExpandedEvidenceIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-900">Evidence {index + 1}</span>
                  <span className="text-xs font-semibold text-slate-500">{expandedEvidenceIndex === index ? "Collapse" : "Expand"}</span>
                </button>
                {evidenceItems.length > 1 ? <button type="button" onClick={() => { setEvidenceItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedEvidenceIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
              </div>
              {expandedEvidenceIndex === index ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-700">Heading<input className={inputClass} value={item.heading} onChange={(event) => setEvidenceItems((current) => updateItem(current, index, { heading: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Evidence Type<input className={inputClass} value={item.evidenceType} onChange={(event) => setEvidenceItems((current) => updateItem(current, index, { evidenceType: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description<textarea className={textareaClass} value={item.description} onChange={(event) => setEvidenceItems((current) => updateItem(current, index, { description: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Source<input className={inputClass} value={item.source} onChange={(event) => setEvidenceItems((current) => updateItem(current, index, { source: event.target.value }))} /></label>
                </div>
              ) : <div className="text-sm text-slate-500">{summarizeValues(item.heading, item.evidenceType, item.source, item.description)}</div>}
            </div>
          ))}
          <button type="button" onClick={() => { setEvidenceItems((current) => [...current, createEvidenceItem()]); setExpandedEvidenceIndex(evidenceItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Evidence Item</button>
        </div>
      );
    }
    if (resolvedCategoryId === "incident_investigation" && step.id === "finding") {
      return (
        <div className="space-y-4">
          {findingItems.map((item, index) => (
            <div key={`finding-${index}`} className={cardClass}>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setExpandedFindingIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-900">Finding {index + 1}</span>
                  <span className="text-xs font-semibold text-slate-500">{expandedFindingIndex === index ? "Collapse" : "Expand"}</span>
                </button>
                {findingItems.length > 1 ? <button type="button" onClick={() => { setFindingItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedFindingIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
              </div>
              {expandedFindingIndex === index ? (
                <div className="grid gap-4">
                  <label className="grid gap-1 text-sm text-slate-700">Heading<input className={inputClass} value={item.heading} onChange={(event) => setFindingItems((current) => updateItem(current, index, { heading: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Confidence<select className={selectClass} value={item.confidenceLevel} onChange={(event) => setFindingItems((current) => updateItem(current, index, { confidenceLevel: event.target.value as WizardFindingItem["confidenceLevel"] }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
                  <label className="grid gap-1 text-sm text-slate-700">Description<textarea className={textareaClass} value={item.description} onChange={(event) => setFindingItems((current) => updateItem(current, index, { description: event.target.value }))} /></label>
                </div>
              ) : <div className="text-sm text-slate-500">{summarizeValues(item.heading, item.confidenceLevel, item.description)}</div>}
            </div>
          ))}
          <button type="button" onClick={() => { setFindingItems((current) => [...current, createFindingItem()]); setExpandedFindingIndex(findingItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Finding</button>
        </div>
      );
    }
    if (resolvedCategoryId === "incident_investigation" && step.id === "recommendation") {
      return (
        <div className="space-y-4">
          {recommendationItems.map((item, index) => (
            <div key={`recommendation-${index}`} className={cardClass}>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setExpandedRecommendationIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-900">Recommendation {index + 1}</span>
                  <span className="text-xs font-semibold text-slate-500">{expandedRecommendationIndex === index ? "Collapse" : "Expand"}</span>
                </button>
                {recommendationItems.length > 1 ? <button type="button" onClick={() => { setRecommendationItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedRecommendationIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
              </div>
              {expandedRecommendationIndex === index ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-700">Heading<input className={inputClass} value={item.heading} onChange={(event) => setRecommendationItems((current) => updateItem(current, index, { heading: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Action Type<select className={selectClass} value={item.actionType} onChange={(event) => setRecommendationItems((current) => updateItem(current, index, { actionType: event.target.value as WizardRecommendationItem["actionType"] }))}><option value="corrective">Corrective</option><option value="preventive">Preventive</option></select></label>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description<textarea className={textareaClass} value={item.description} onChange={(event) => setRecommendationItems((current) => updateItem(current, index, { description: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Owner<input className={inputClass} value={item.ownerText} onChange={(event) => setRecommendationItems((current) => updateItem(current, index, { ownerText: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Due Date<input type="date" className={inputClass} value={item.dueDate} onChange={(event) => setRecommendationItems((current) => updateItem(current, index, { dueDate: event.target.value }))} /></label>
                </div>
              ) : <div className="text-sm text-slate-500">{summarizeValues(item.heading, item.actionType, item.ownerText, item.dueDate)}</div>}
            </div>
          ))}
          <button type="button" onClick={() => { setRecommendationItems((current) => [...current, createRecommendationItem()]); setExpandedRecommendationIndex(recommendationItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Recommendation</button>
        </div>
      );
    }
    if (resolvedCategoryId === "document_map" && step.id === "systems") return renderSimpleItems("System", systemItems, setSystemItems, "Add Another System");
    if (resolvedCategoryId === "document_map" && step.id === "processes") return renderSimpleItems("Process", processItems, setProcessItems, "Add Another Process");
    if (resolvedCategoryId === "document_map" && step.id === "people") return renderPersonItems(personItems, setPersonItems, "Add Another Person");
    if (resolvedCategoryId === "document_map" && step.id === "documents") return renderDocumentItems();
    if (resolvedCategoryId === "document_map" && step.id === "hierarchy") return renderHierarchyItems();
    if (resolvedCategoryId === "bow_tie" && step.id === "overview") {
      const item = bowtieOverviewItems[0];
      return (
        <div className="space-y-4">
          <div className={cardClass}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Hazard<input className={inputClass} value={item.hazard} onChange={(event) => setBowtieOverviewItems([{ ...item, hazard: event.target.value }])} /></label>
              <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Top Event<input className={inputClass} value={item.topEvent} onChange={(event) => setBowtieOverviewItems([{ ...item, topEvent: event.target.value }])} /></label>
              <label className="grid gap-1 text-sm text-slate-700">Loss Of Control Type<select className={selectClass} value={item.lossOfControlType} onChange={(event) => setBowtieOverviewItems([{ ...item, lossOfControlType: event.target.value }])}><option value="">Select type</option>{bowtieLossOfControlTypeOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label>
              <label className="grid gap-1 text-sm text-slate-700">Likelihood<select className={selectClass} value={item.likelihood} onChange={(event) => setBowtieOverviewItems([{ ...item, likelihood: event.target.value as WizardBowtieOverviewItem["likelihood"] }])}>{bowtieLikelihoodOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label>
              <label className="grid gap-1 text-sm text-slate-700">Consequence<select className={selectClass} value={item.consequence} onChange={(event) => setBowtieOverviewItems([{ ...item, consequence: event.target.value as WizardBowtieOverviewItem["consequence"] }])}>{bowtieConsequenceOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label>
              <label className="grid gap-1 text-sm text-slate-700">Risk Level<select className={selectClass} value={item.riskLevel} onChange={(event) => setBowtieOverviewItems([{ ...item, riskLevel: event.target.value as WizardBowtieOverviewItem["riskLevel"] }])}>{riskLevelOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label>
            </div>
          </div>
        </div>
      );
    }
    if (resolvedCategoryId === "bow_tie" && step.id === "threats") {
      return (
        <div className="space-y-4">
          {bowtieThreatItems.map((item, index) => (
            <div key={`threat-${index}`} className={cardClass}>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setExpandedBowtieThreatIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-900">Threat {index + 1}</span>
                  <span className="text-xs font-semibold text-slate-500">{expandedBowtieThreatIndex === index ? "Collapse" : "Expand"}</span>
                </button>
                {bowtieThreatItems.length > 1 ? <button type="button" onClick={() => { setBowtieThreatItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedBowtieThreatIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
              </div>
              {expandedBowtieThreatIndex === index ? (
                <div className="grid gap-4">
                  <label className="grid gap-1 text-sm text-slate-700">Threat<input className={inputClass} value={item.heading} onChange={(event) => setBowtieThreatItems((current) => updateItem(current, index, { heading: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Threat Category<select className={selectClass} value={item.threatCategory} onChange={(event) => setBowtieThreatItems((current) => updateItem(current, index, { threatCategory: event.target.value }))}><option value="">Select category</option>{bowtieThreatCategoryOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label>
                </div>
              ) : <div className="text-sm text-slate-500">{summarizeValues(item.heading, item.threatCategory)}</div>}
            </div>
          ))}
          <button type="button" onClick={() => { setBowtieThreatItems((current) => [...current, createBowtieThreatItem()]); setExpandedBowtieThreatIndex(bowtieThreatItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Threat</button>
        </div>
      );
    }
    if (resolvedCategoryId === "bow_tie" && step.id === "consequences") {
      return (
        <div className="space-y-4">
          {bowtieConsequenceItems.map((item, index) => (
            <div key={`consequence-${index}`} className={cardClass}>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setExpandedBowtieConsequenceIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-900">Consequence {index + 1}</span>
                  <span className="text-xs font-semibold text-slate-500">{expandedBowtieConsequenceIndex === index ? "Collapse" : "Expand"}</span>
                </button>
                {bowtieConsequenceItems.length > 1 ? <button type="button" onClick={() => { setBowtieConsequenceItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedBowtieConsequenceIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
              </div>
              {expandedBowtieConsequenceIndex === index ? (
                <div className="grid gap-4">
                  <label className="grid gap-1 text-sm text-slate-700">Consequence<input className={inputClass} value={item.heading} onChange={(event) => setBowtieConsequenceItems((current) => updateItem(current, index, { heading: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Impact Category<select className={selectClass} value={item.impactCategory} onChange={(event) => setBowtieConsequenceItems((current) => updateItem(current, index, { impactCategory: event.target.value }))}><option value="">Select category</option>{bowtieImpactCategoryOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label>
                </div>
              ) : <div className="text-sm text-slate-500">{summarizeValues(item.heading, item.impactCategory)}</div>}
            </div>
          ))}
          <button type="button" onClick={() => { setBowtieConsequenceItems((current) => [...current, createBowtieConsequenceItem()]); setExpandedBowtieConsequenceIndex(bowtieConsequenceItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Consequence</button>
        </div>
      );
    }
    if (resolvedCategoryId === "bow_tie" && step.id === "controls") {
      const threatOptions = bowtieThreatItems
        .map((entry) => entry.heading.trim())
        .filter(Boolean);
      const consequenceOptions = bowtieConsequenceItems
        .map((entry) => entry.heading.trim())
        .filter(Boolean);
      return (
        <div className="space-y-4">
          {bowtieControlItems.map((item, index) => (
            <div key={`bt-control-${index}`} className={cardClass}>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setExpandedBowtieControlIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-900">Control {index + 1}</span>
                  <span className="text-xs font-semibold text-slate-500">{expandedBowtieControlIndex === index ? "Collapse" : "Expand"}</span>
                </button>
                {bowtieControlItems.length > 1 ? <button type="button" onClick={() => { setBowtieControlItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedBowtieControlIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
              </div>
              {expandedBowtieControlIndex === index ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-700">Heading<input className={inputClass} value={item.heading} onChange={(event) => setBowtieControlItems((current) => updateItem(current, index, { heading: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Control Category<select className={selectClass} value={item.controlCategory} onChange={(event) => setBowtieControlItems((current) => updateItem(current, index, { controlCategory: event.target.value as WizardBowtieControlItem["controlCategory"], linkedTargetHeading: "" }))}>{controlCategoryOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label>
                  <label className="grid gap-1 text-sm text-slate-700">
                    {item.controlCategory === "preventive" ? "Linked Threat" : "Linked Consequence"}
                    <select className={selectClass} value={item.linkedTargetHeading} onChange={(event) => setBowtieControlItems((current) => updateItem(current, index, { linkedTargetHeading: event.target.value }))}>
                      <option value="">
                        {item.controlCategory === "preventive" ? "Select threat" : "Select consequence"}
                      </option>
                      {(item.controlCategory === "preventive" ? threatOptions : consequenceOptions).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm text-slate-700">Control Type<select className={selectClass} value={item.controlType} onChange={(event) => setBowtieControlItems((current) => updateItem(current, index, { controlType: event.target.value }))}><option value="">Select type</option>{bowtieControlTypeOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label>
                  <label className="grid gap-1 text-sm text-slate-700">Verification Method<select className={selectClass} value={item.verificationMethod} onChange={(event) => setBowtieControlItems((current) => updateItem(current, index, { verificationMethod: event.target.value }))}><option value="">Select method</option>{bowtieVerificationMethodOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label>
                  <label className="grid gap-1 text-sm text-slate-700">Verification Frequency<select className={selectClass} value={item.verificationFrequency} onChange={(event) => setBowtieControlItems((current) => updateItem(current, index, { verificationFrequency: event.target.value }))}><option value="">Select frequency</option>{bowtieVerificationFrequencyOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label>
                  <div className="grid gap-2 text-sm text-slate-700 pt-1">
                    <span>Critical Control</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBowtieControlItems((current) => updateItem(current, index, { critical: true }))}
                        className={`relative min-w-[112px] rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                          item.critical
                            ? "border-[#102a43] bg-[#102a43] text-white"
                            : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {item.critical ? <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] leading-none">✓</span> : null}
                        <span className="block text-center">Yes</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBowtieControlItems((current) => updateItem(current, index, { critical: false }))}
                        className={`relative min-w-[112px] rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                          !item.critical
                            ? "border-[#102a43] bg-[#102a43] text-white"
                            : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {!item.critical ? <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] leading-none">✓</span> : null}
                        <span className="block text-center">No</span>
                      </button>
                    </div>
                  </div>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description<textarea className={textareaClass} value={item.description} onChange={(event) => setBowtieControlItems((current) => updateItem(current, index, { description: event.target.value }))} /></label>
                </div>
              ) : <div className="text-sm text-slate-500">{summarizeValues(item.heading, item.controlCategory, item.linkedTargetHeading, item.controlType)}</div>}
            </div>
          ))}
          <button type="button" onClick={() => { setBowtieControlItems((current) => [...current, createBowtieControlItem()]); setExpandedBowtieControlIndex(bowtieControlItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Control</button>
        </div>
      );
    }
    if (resolvedCategoryId === "bow_tie" && step.id === "assurance") {
      return (
        <div className="space-y-4">
          {bowtieAssuranceItems.map((item, index) => (
            <div key={`assurance-${index}`} className={cardClass}>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setExpandedBowtieAssuranceIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-900">Escalation / Recovery Item {index + 1}</span>
                  <span className="text-xs font-semibold text-slate-500">{expandedBowtieAssuranceIndex === index ? "Collapse" : "Expand"}</span>
                </button>
                {bowtieAssuranceItems.length > 1 ? <button type="button" onClick={() => { setBowtieAssuranceItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedBowtieAssuranceIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
              </div>
              {expandedBowtieAssuranceIndex === index ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-700">Heading<input className={inputClass} value={item.heading} onChange={(event) => setBowtieAssuranceItems((current) => updateItem(current, index, { heading: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Type<select className={selectClass} value={item.kind} onChange={(event) => setBowtieAssuranceItems((current) => updateItem(current, index, { kind: event.target.value as WizardBowtieAssuranceItem["kind"] }))}><option value="bowtie_escalation_factor">Escalation Factor</option><option value="bowtie_recovery_measure">Recovery Measure</option><option value="bowtie_degradation_indicator">Degradation Indicator</option></select></label>
                  {item.kind === "bowtie_escalation_factor" ? <label className="grid gap-1 text-sm text-slate-700">Factor Type<select className={selectClass} value={item.factorType} onChange={(event) => setBowtieAssuranceItems((current) => updateItem(current, index, { factorType: event.target.value }))}><option value="">Select type</option>{bowtieFactorTypeOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label> : null}
                  {item.kind === "bowtie_recovery_measure" ? <label className="grid gap-1 text-sm text-slate-700">Time Requirement<select className={selectClass} value={item.timeRequirement} onChange={(event) => setBowtieAssuranceItems((current) => updateItem(current, index, { timeRequirement: event.target.value }))}><option value="">Select requirement</option>{bowtieTimeRequirementOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label> : null}
                  {item.kind === "bowtie_degradation_indicator" ? <label className="grid gap-1 text-sm text-slate-700">Monitoring Method<select className={selectClass} value={item.monitoringMethod} onChange={(event) => setBowtieAssuranceItems((current) => updateItem(current, index, { monitoringMethod: event.target.value }))}><option value="">Select method</option>{bowtieMonitoringMethodOptions.map((option) => <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>)}</select></label> : null}
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description<textarea className={textareaClass} value={item.description} onChange={(event) => setBowtieAssuranceItems((current) => updateItem(current, index, { description: event.target.value }))} /></label>
                </div>
              ) : <div className="text-sm text-slate-500">{summarizeValues(item.heading, formatWizardOptionLabel(item.kind), item.description)}</div>}
            </div>
          ))}
          <button type="button" onClick={() => { setBowtieAssuranceItems((current) => [...current, createBowtieAssuranceItem()]); setExpandedBowtieAssuranceIndex(bowtieAssuranceItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Escalation / Recovery Item</button>
        </div>
      );
    }
    if (resolvedCategoryId === "org_chart" && step.id === "departments") {
      return renderSimpleItems("Department", departmentItems, setDepartmentItems, "Add Another Department");
    }
    if (resolvedCategoryId === "org_chart") {
      const items = step.id === "leadership" ? orgLeadershipItems : orgTeamItems;
      const setItems = step.id === "leadership" ? setOrgLeadershipItems : setOrgTeamItems;
      return (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={`org-role-${index}`} className={cardClass}>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setExpandedOrgChartIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-900">Role {index + 1}</span>
                  <span className="text-xs font-semibold text-slate-500">{expandedOrgChartIndex === index ? "Collapse" : "Expand"}</span>
                </button>
                {items.length > 1 ? <button type="button" onClick={() => { setItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedOrgChartIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
              </div>
              {expandedOrgChartIndex === index ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-700">Position Title<input className={inputClass} value={item.positionTitle} onChange={(event) => setItems((current) => updateItem(current, index, { positionTitle: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Occupant<input className={inputClass} value={item.occupantName} onChange={(event) => setItems((current) => updateItem(current, index, { occupantName: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Role ID<input className={inputClass} value={item.roleId} onChange={(event) => setItems((current) => updateItem(current, index, { roleId: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Employment<select className={selectClass} value={item.employmentType} onChange={(event) => setItems((current) => updateItem(current, index, { employmentType: event.target.value as WizardOrgChartRoleItem["employmentType"] }))}><option value="fte">Employee</option><option value="contractor">Contractor</option></select></label>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2 flex items-center gap-2"><input type="checkbox" checked={item.proposedRole} onChange={(event) => setItems((current) => updateItem(current, index, { proposedRole: event.target.checked }))} className="h-4 w-4 accent-slate-900" /> Proposed role</label>
                </div>
              ) : <div className="text-sm text-slate-500">{summarizeValues(item.positionTitle, item.occupantName, item.roleId)}</div>}
            </div>
          ))}
          <button type="button" onClick={() => { setItems((current) => [...current, createOrgChartRoleItem()]); setExpandedOrgChartIndex(items.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Role</button>
        </div>
      );
    }
    if (resolvedCategoryId === "process_flow" && step.id === "lanes") return renderSimpleItems("Lane", laneItems, setLaneItems, "Add Another Lane");
    if (resolvedCategoryId === "process_flow" && step.id === "steps") {
      return (
        <div className="space-y-4">
          {processFlowStepItems.map((item, index) => (
            <div key={`flow-step-${index}`} className={cardClass}>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setExpandedProcessFlowStepIndex((current) => toggleExpandedIndex(current, index))} className="flex flex-1 items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-900">Flow Step {index + 1}</span>
                  <span className="text-xs font-semibold text-slate-500">{expandedProcessFlowStepIndex === index ? "Collapse" : "Expand"}</span>
                </button>
                {processFlowStepItems.length > 1 ? <button type="button" onClick={() => { setProcessFlowStepItems((current) => current.filter((_, currentIndex) => currentIndex !== index)); setExpandedProcessFlowStepIndex((current) => adjustExpandedIndexAfterRemove(current, index)); }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button> : null}
              </div>
              {expandedProcessFlowStepIndex === index ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1 text-sm text-slate-700">Step Title<input className={inputClass} value={item.heading} onChange={(event) => setProcessFlowStepItems((current) => updateItem(current, index, { heading: event.target.value }))} /></label>
                  <label className="grid gap-1 text-sm text-slate-700">Node Type<select className={selectClass} value={item.kind} onChange={(event) => setProcessFlowStepItems((current) => updateItem(current, index, { kind: event.target.value as WizardProcessFlowStepItem["kind"] }))}><option value="process_component">Process</option><option value="shape_rectangle">Step Box</option><option value="shape_pill">Decision / Gate</option></select></label>
                  <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description<textarea className={textareaClass} value={item.description} onChange={(event) => setProcessFlowStepItems((current) => updateItem(current, index, { description: event.target.value }))} /></label>
                </div>
              ) : <div className="text-sm text-slate-500">{summarizeValues(item.heading, formatWizardOptionLabel(item.kind), item.description)}</div>}
            </div>
          ))}
          <button type="button" onClick={() => { setProcessFlowStepItems((current) => [...current, createProcessFlowStepItem()]); setExpandedProcessFlowStepIndex(processFlowStepItems.length); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Step</button>
        </div>
      );
    }
    if (resolvedCategoryId === "process_flow" && step.id === "inputs-outputs") return renderSimpleItems("Input / Output", processFlowInputOutputItems, setProcessFlowInputOutputItems, "Add Another Input / Output");
    if (resolvedCategoryId === "process_flow" && step.id === "roles") return renderPersonItems(personItems, setPersonItems, "Add Another Role");
    return null;
  };

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[120] ${isMobile ? "bg-white" : "flex items-center justify-center bg-[rgba(15,23,42,0.5)] px-4 py-6"}`}>
      <div
        className={
          isMobile
            ? "flex h-full w-full overflow-hidden bg-white"
            : "flex h-[min(90vh,860px)] w-full max-w-[1180px] overflow-hidden rounded-[30px] border border-white/45 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))] shadow-[0_34px_80px_rgba(15,23,42,0.28)]"
        }
      >
        <aside className="hidden w-[250px] border-r border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(241,245,249,0.92))] p-5 lg:block">
          <div className="rounded-2xl bg-[linear-gradient(135deg,#dbeafe_0%,#ede9fe_52%,#fce7f3_100%)] p-4 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Wizard</p>
            <h2 className="mt-2 text-xl font-semibold">{config.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{config.intro}</p>
          </div>
          <div className="mt-5 space-y-2">
            {steps.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setError(null);
                  setCurrentStep(index);
                }}
                className={`block w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                  index === currentStep
                    ? "border border-slate-200 bg-white text-slate-950 shadow-[0_12px_26px_rgba(15,23,42,0.12)]"
                    : index < currentStep
                      ? "bg-white text-slate-700 hover:bg-slate-50"
                      : "bg-transparent text-slate-500 hover:bg-white/70 hover:text-slate-700"
                }`}
              >
                <span className="mr-2 font-semibold">{index + 1}.</span>
                {entry.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          <header className="border-b border-slate-200/80 px-5 py-4 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step {currentStep + 1} of {steps.length}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{step.label}</h2>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </div>
              <button type="button" onClick={handleClose} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Close</button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
            {error ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
            {renderCurrentStep()}
          </div>

          <footer className="border-t border-slate-200/80 px-5 py-4 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setError(null); setCurrentStep((value) => Math.max(0, value - 1)); }} disabled={currentStep === 0 || isSaving} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Back</button>
                <button type="button" onClick={handleSkip} disabled={isSaving} className="rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{isLastStep ? "Finish Later" : "Skip This Step"}</button>
              </div>
              <button type="button" onClick={() => void handleNext()} disabled={isSaving} className="rounded-xl bg-[#102a43] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(16,42,67,0.22)] transition hover:bg-[#0d2236] disabled:cursor-not-allowed disabled:opacity-50">
                {isSaving ? "Saving..." : nextLabel}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
