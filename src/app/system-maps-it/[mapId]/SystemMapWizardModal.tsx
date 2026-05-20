"use client";

import { useEffect, useMemo, useState } from "react";

export type WizardSequenceItem = {
  timestamp: string;
  description: string;
  location: string;
};

export type WizardPersonItem = {
  roleName: string;
  occupantName: string;
};

export type WizardOutcomeItem = {
  description: string;
  outcomeCategory: "maximum_reasonable" | "actual" | "reporting";
  reportingOutcome: "" | "internally_reported" | "externally_reported" | "reported_to_regulator" | "reported_elsewhere";
  likelihood: "rare" | "unlikely" | "possible" | "likely" | "almost_certain";
  consequence: "insignificant" | "minor" | "moderate" | "major" | "severe";
};

export type WizardTaskConditionItem = {
  description: string;
  state: "normal" | "abnormal";
  environmentalContext: string;
};

export type WizardFactorItem = {
  kind: "incident_factor" | "incident_system_factor";
  description: string;
  presence: "present" | "absent";
  classification: "essential" | "contributing" | "predisposing" | "neutral";
  category: string;
};

export type WizardControlBarrierItem = {
  description: string;
  barrierState: "effective" | "failed" | "missing";
  barrierRole: "preventive" | "mitigative" | "recovery";
  controlType: string;
  ownerText: string;
};

export type WizardEvidenceItem = {
  description: string;
  evidenceType: string;
  source: string;
};

export type WizardResponseRecoveryItem = {
  description: string;
  category: "" | "emergency_response" | "medical_treatment" | "scene_preservation" | "make_area_safe";
};

export type WizardFindingItem = {
  description: string;
  confidenceLevel: "low" | "medium" | "high";
};

export type WizardRecommendationItem = {
  description: string;
  actionType: "corrective" | "preventive";
  ownerText: string;
  dueDate: string;
};

export type SystemMapWizardCommitPayload =
  | { step: "sequence"; items: WizardSequenceItem[] }
  | { step: "outcome"; items: WizardOutcomeItem[] }
  | { step: "people"; items: WizardPersonItem[] }
  | { step: "task-condition"; items: WizardTaskConditionItem[] }
  | { step: "factors"; items: WizardFactorItem[] }
  | { step: "control-barrier"; items: WizardControlBarrierItem[] }
  | { step: "evidence"; items: WizardEvidenceItem[] }
  | { step: "response-recovery"; items: WizardResponseRecoveryItem[] }
  | { step: "finding"; items: WizardFindingItem[] }
  | { step: "recommendation"; items: WizardRecommendationItem[] };

type SystemMapWizardModalProps = {
  open: boolean;
  isMobile?: boolean;
  onClose: () => void;
  onCommitStep: (payload: SystemMapWizardCommitPayload) => Promise<void>;
  isSaving: boolean;
};

const stepLabels = [
  "Sequence",
  "Outcomes",
  "People",
  "Task / Condition",
  "Factors",
  "Controls / Barriers",
  "Evidence",
  "Response / Recovery",
  "Findings",
  "Recommendations",
] as const;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
const textareaClass = `${inputClass} min-h-[92px] resize-y`;
const selectClass = inputClass;
const cardClass = "rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]";
const factorInfluenceTypeOptions = ["human", "equipment", "process", "environment", "organisation"] as const;
const systemFactorCategoryOptions = ["training", "supervision", "planning", "design", "culture", "other"] as const;

const createSequenceItem = (): WizardSequenceItem => ({
  timestamp: "",
  description: "",
  location: "",
});

const createPersonItem = (): WizardPersonItem => ({
  roleName: "",
  occupantName: "",
});

const createOutcomeItem = (): WizardOutcomeItem => ({
  description: "",
  outcomeCategory: "actual",
  reportingOutcome: "",
  likelihood: "possible",
  consequence: "moderate",
});

const createTaskConditionItem = (): WizardTaskConditionItem => ({
  description: "",
  state: "normal",
  environmentalContext: "",
});

const createFactorItem = (): WizardFactorItem => ({
  kind: "incident_factor",
  description: "",
  presence: "present",
  classification: "contributing",
  category: "human",
});

const createControlBarrierItem = (): WizardControlBarrierItem => ({
  description: "",
  barrierState: "effective",
  barrierRole: "preventive",
  controlType: "",
  ownerText: "",
});

const createEvidenceItem = (): WizardEvidenceItem => ({
  description: "",
  evidenceType: "",
  source: "",
});

const createResponseRecoveryItem = (): WizardResponseRecoveryItem => ({
  description: "",
  category: "",
});

const createFindingItem = (): WizardFindingItem => ({
  description: "",
  confidenceLevel: "medium",
});

const createRecommendationItem = (): WizardRecommendationItem => ({
  description: "",
  actionType: "corrective",
  ownerText: "",
  dueDate: "",
});

const updateItem = <T,>(items: T[], index: number, patch: Partial<T>) =>
  items.map((entry, currentIndex) => (currentIndex === index ? { ...entry, ...patch } : entry));

const toggleExpandedIndex = (current: number, index: number) => (current === index ? -1 : index);

const adjustExpandedIndexAfterRemove = (current: number, index: number) => {
  if (current === index) return Math.max(0, index - 1);
  if (current > index) return current - 1;
  return current;
};

const summarizeValues = (...values: Array<string | undefined>) => {
  const summary = values.map((value) => value?.trim()).filter(Boolean).join(" · ");
  return summary || "No details entered yet.";
};

const formatWizardOptionLabel = (value: string) =>
  value
    .split("_")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
    .join(" ");

export function SystemMapWizardModal({
  open,
  isMobile = false,
  onClose,
  onCommitStep,
  isSaving,
}: SystemMapWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedSequenceIndex, setExpandedSequenceIndex] = useState(0);
  const [expandedOutcomeIndex, setExpandedOutcomeIndex] = useState(0);
  const [expandedPersonIndex, setExpandedPersonIndex] = useState(0);
  const [expandedTaskConditionIndex, setExpandedTaskConditionIndex] = useState(0);
  const [expandedFactorIndex, setExpandedFactorIndex] = useState(0);
  const [expandedControlBarrierIndex, setExpandedControlBarrierIndex] = useState(0);
  const [expandedEvidenceIndex, setExpandedEvidenceIndex] = useState(0);
  const [expandedResponseRecoveryIndex, setExpandedResponseRecoveryIndex] = useState(0);
  const [expandedFindingIndex, setExpandedFindingIndex] = useState(0);
  const [expandedRecommendationIndex, setExpandedRecommendationIndex] = useState(0);
  const [sequenceItems, setSequenceItems] = useState<WizardSequenceItem[]>([createSequenceItem()]);
  const [outcomeItems, setOutcomeItems] = useState<WizardOutcomeItem[]>([createOutcomeItem()]);
  const [personItems, setPersonItems] = useState<WizardPersonItem[]>([createPersonItem()]);
  const [taskConditionItems, setTaskConditionItems] = useState<WizardTaskConditionItem[]>([createTaskConditionItem()]);
  const [factorItems, setFactorItems] = useState<WizardFactorItem[]>([createFactorItem()]);
  const [controlBarrierItems, setControlBarrierItems] = useState<WizardControlBarrierItem[]>([createControlBarrierItem()]);
  const [evidenceItems, setEvidenceItems] = useState<WizardEvidenceItem[]>([createEvidenceItem()]);
  const [responseRecoveryItems, setResponseRecoveryItems] = useState<WizardResponseRecoveryItem[]>([createResponseRecoveryItem()]);
  const [findingItems, setFindingItems] = useState<WizardFindingItem[]>([createFindingItem()]);
  const [recommendationItems, setRecommendationItems] = useState<WizardRecommendationItem[]>([createRecommendationItem()]);

  const resetWizard = () => {
    setCurrentStep(0);
    setError(null);
    setExpandedSequenceIndex(0);
    setExpandedOutcomeIndex(0);
    setExpandedPersonIndex(0);
    setExpandedTaskConditionIndex(0);
    setExpandedFactorIndex(0);
    setExpandedControlBarrierIndex(0);
    setExpandedEvidenceIndex(0);
    setExpandedResponseRecoveryIndex(0);
    setExpandedFindingIndex(0);
    setExpandedRecommendationIndex(0);
    setSequenceItems([createSequenceItem()]);
    setOutcomeItems([createOutcomeItem()]);
    setPersonItems([createPersonItem()]);
    setTaskConditionItems([createTaskConditionItem()]);
    setFactorItems([createFactorItem()]);
    setControlBarrierItems([createControlBarrierItem()]);
    setEvidenceItems([createEvidenceItem()]);
    setResponseRecoveryItems([createResponseRecoveryItem()]);
    setFindingItems([createFindingItem()]);
    setRecommendationItems([createRecommendationItem()]);
  };

  useEffect(() => {
    if (!open) resetWizard();
  }, [open]);

  const stepTitle = stepLabels[currentStep];
  const isLastStep = currentStep === stepLabels.length - 1;
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
      if (currentStep === 0) await onCommitStep({ step: "sequence", items: sequenceItems });
      else if (currentStep === 1) await onCommitStep({ step: "outcome", items: outcomeItems });
      else if (currentStep === 2) await onCommitStep({ step: "people", items: personItems });
      else if (currentStep === 3) await onCommitStep({ step: "task-condition", items: taskConditionItems });
      else if (currentStep === 4) await onCommitStep({ step: "factors", items: factorItems });
      else if (currentStep === 5) await onCommitStep({ step: "control-barrier", items: controlBarrierItems });
      else if (currentStep === 6) await onCommitStep({ step: "evidence", items: evidenceItems });
      else if (currentStep === 7) await onCommitStep({ step: "response-recovery", items: responseRecoveryItems });
      else if (currentStep === 8) await onCommitStep({ step: "finding", items: findingItems });
      else await onCommitStep({ step: "recommendation", items: recommendationItems });

      if (isLastStep) {
        handleClose();
        return;
      }
      setCurrentStep((value) => value + 1);
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : "Unable to add wizard nodes.");
    }
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
            <h2 className="mt-2 text-xl font-semibold">Build The Investigation Map</h2>
            <p className="mt-2 text-sm text-slate-700">Each step can create grouped nodes on the canvas immediately.</p>
          </div>
          <div className="mt-5 space-y-2">
            {stepLabels.map((label, index) => (
              <button
                key={label}
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
                {label}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          <header className="border-b border-slate-200/80 px-5 py-4 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Step {currentStep + 1} of {stepLabels.length}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{stepTitle}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Fill in what you know. When you continue, this section is added to the canvas inside its own grouping container.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            {currentStep === 0 ? (
              <div className="space-y-4">
                {sequenceItems.map((item, index) => (
                  <div key={`sequence-${index}`} className={cardClass}>
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedSequenceIndex((current) => toggleExpandedIndex(current, index))}
                        className="flex flex-1 items-center justify-between gap-3 text-left"
                      >
                        <span className="text-sm font-semibold text-slate-900">Event {index + 1}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {expandedSequenceIndex === index ? "Collapse" : "Expand"}
                        </span>
                      </button>
                      {sequenceItems.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSequenceItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
                            setExpandedSequenceIndex((current) => adjustExpandedIndexAfterRemove(current, index));
                          }}
                          className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    {expandedSequenceIndex === index ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-1 text-sm text-slate-700">
                          Timestamp
                          <input type="datetime-local" className={inputClass} value={item.timestamp} onChange={(event) => setSequenceItems((current) => updateItem(current, index, { timestamp: event.target.value }))} />
                        </label>
                        <div />
                        <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">
                          Description
                          <textarea className={textareaClass} value={item.description} onChange={(event) => setSequenceItems((current) => updateItem(current, index, { description: event.target.value }))} />
                        </label>
                        <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">
                          Location
                          <input className={inputClass} value={item.location} onChange={(event) => setSequenceItems((current) => updateItem(current, index, { location: event.target.value }))} />
                        </label>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        {summarizeValues(item.timestamp, item.location, item.description)}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSequenceItems((current) => [...current, createSequenceItem()]);
                    setExpandedSequenceIndex(sequenceItems.length);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Add Another Event
                </button>
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div className="space-y-4">
                {outcomeItems.map((item, index) => (
                  <div key={`outcome-${index}`} className={cardClass}>
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedOutcomeIndex((current) => toggleExpandedIndex(current, index))}
                        className="flex flex-1 items-center justify-between gap-3 text-left"
                      >
                        <span className="text-sm font-semibold text-slate-900">Outcome {index + 1}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {expandedOutcomeIndex === index ? "Collapse" : "Expand"}
                        </span>
                      </button>
                      {outcomeItems.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOutcomeItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
                            setExpandedOutcomeIndex((current) => adjustExpandedIndexAfterRemove(current, index));
                          }}
                          className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    {expandedOutcomeIndex === index ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-1 text-sm text-slate-700">
                          Outcome Category
                          <select className={selectClass} value={item.outcomeCategory} onChange={(event) => setOutcomeItems((current) => updateItem(current, index, { outcomeCategory: event.target.value as WizardOutcomeItem["outcomeCategory"] }))}>
                            <option value="maximum_reasonable">Maximum Reasonable Outcome</option>
                            <option value="actual">Actual Outcome</option>
                            <option value="reporting">Reporting Outcome</option>
                          </select>
                        </label>
                        {item.outcomeCategory === "reporting" ? (
                          <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">
                            Reporting Outcome
                            <select className={selectClass} value={item.reportingOutcome} onChange={(event) => setOutcomeItems((current) => updateItem(current, index, { reportingOutcome: event.target.value as WizardOutcomeItem["reportingOutcome"] }))}>
                              <option value="">Select reporting outcome</option>
                              <option value="internally_reported">Internal Report</option>
                              <option value="externally_reported">External Report</option>
                              <option value="reported_to_regulator">Regulator Report</option>
                              <option value="reported_elsewhere">Reported Elsewhere</option>
                            </select>
                          </label>
                        ) : (
                          <>
                            <label className="grid gap-1 text-sm text-slate-700">
                              Likelihood
                              <select className={selectClass} value={item.likelihood} onChange={(event) => setOutcomeItems((current) => updateItem(current, index, { likelihood: event.target.value as WizardOutcomeItem["likelihood"] }))}>
                                {["rare", "unlikely", "possible", "likely", "almost_certain"].map((option) => (
                                  <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>
                                ))}
                              </select>
                            </label>
                            <label className="grid gap-1 text-sm text-slate-700">
                              Consequence
                              <select className={selectClass} value={item.consequence} onChange={(event) => setOutcomeItems((current) => updateItem(current, index, { consequence: event.target.value as WizardOutcomeItem["consequence"] }))}>
                                {["insignificant", "minor", "moderate", "major", "severe"].map((option) => (
                                  <option key={option} value={option}>{formatWizardOptionLabel(option)}</option>
                                ))}
                              </select>
                            </label>
                          </>
                        )}
                        <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">
                          Description
                          <textarea className={textareaClass} value={item.description} onChange={(event) => setOutcomeItems((current) => updateItem(current, index, { description: event.target.value }))} />
                        </label>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">{summarizeValues(item.outcomeCategory, item.reportingOutcome, item.likelihood, item.consequence, item.description)}</div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setOutcomeItems((current) => [...current, createOutcomeItem()]);
                    setExpandedOutcomeIndex(outcomeItems.length);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Add Another Outcome
                </button>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="space-y-4">
                {personItems.map((item, index) => (
                  <div key={`person-${index}`} className={cardClass}>
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedPersonIndex((current) => toggleExpandedIndex(current, index))}
                        className="flex flex-1 items-center justify-between gap-3 text-left"
                      >
                        <span className="text-sm font-semibold text-slate-900">Person / Role {index + 1}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {expandedPersonIndex === index ? "Collapse" : "Expand"}
                        </span>
                      </button>
                      {personItems.length > 1 ? (
                        <button type="button" onClick={() => {
                          setPersonItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
                          setExpandedPersonIndex((current) => adjustExpandedIndexAfterRemove(current, index));
                        }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">
                          Remove
                        </button>
                      ) : null}
                    </div>
                    {expandedPersonIndex === index ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-1 text-sm text-slate-700">
                          Role Name
                          <input className={inputClass} value={item.roleName} onChange={(event) => setPersonItems((current) => updateItem(current, index, { roleName: event.target.value }))} />
                        </label>
                        <label className="grid gap-1 text-sm text-slate-700">
                          Occupant Name
                          <input className={inputClass} value={item.occupantName} onChange={(event) => setPersonItems((current) => updateItem(current, index, { occupantName: event.target.value }))} />
                        </label>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">{summarizeValues(item.roleName, item.occupantName)}</div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => {
                  setPersonItems((current) => [...current, createPersonItem()]);
                  setExpandedPersonIndex(personItems.length);
                }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  Add Another Person / Role
                </button>
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="space-y-4">
                {taskConditionItems.map((item, index) => (
                  <div key={`task-${index}`} className={cardClass}>
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedTaskConditionIndex((current) => toggleExpandedIndex(current, index))}
                        className="flex flex-1 items-center justify-between gap-3 text-left"
                      >
                        <span className="text-sm font-semibold text-slate-900">Task / Condition {index + 1}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {expandedTaskConditionIndex === index ? "Collapse" : "Expand"}
                        </span>
                      </button>
                      {taskConditionItems.length > 1 ? (
                        <button type="button" onClick={() => {
                          setTaskConditionItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
                          setExpandedTaskConditionIndex((current) => adjustExpandedIndexAfterRemove(current, index));
                        }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">
                          Remove
                        </button>
                      ) : null}
                    </div>
                    {expandedTaskConditionIndex === index ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-1 text-sm text-slate-700">
                        State
                        <select className={selectClass} value={item.state} onChange={(event) => setTaskConditionItems((current) => updateItem(current, index, { state: event.target.value as WizardTaskConditionItem["state"] }))}>
                          <option value="normal">Normal</option>
                          <option value="abnormal">Abnormal</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">
                        Description
                        <textarea className={textareaClass} value={item.description} onChange={(event) => setTaskConditionItems((current) => updateItem(current, index, { description: event.target.value }))} />
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">
                        Environmental Context
                        <textarea className={textareaClass} value={item.environmentalContext} onChange={(event) => setTaskConditionItems((current) => updateItem(current, index, { environmentalContext: event.target.value }))} />
                      </label>
                    </div>
                    ) : (
                      <div className="text-sm text-slate-500">{summarizeValues(item.state, item.environmentalContext, item.description)}</div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => {
                  setTaskConditionItems((current) => [...current, createTaskConditionItem()]);
                  setExpandedTaskConditionIndex(taskConditionItems.length);
                }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  Add Another Task / Condition
                </button>
              </div>
            ) : null}
            {currentStep === 4 ? (
              <div className="space-y-4">
                {factorItems.map((item, index) => (
                  <div key={`factor-${index}`} className={cardClass}>
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedFactorIndex((current) => toggleExpandedIndex(current, index))}
                        className="flex flex-1 items-center justify-between gap-3 text-left"
                      >
                        <span className="text-sm font-semibold text-slate-900">Factor {index + 1}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {expandedFactorIndex === index ? "Collapse" : "Expand"}
                        </span>
                      </button>
                      {factorItems.length > 1 ? (
                        <button type="button" onClick={() => {
                          setFactorItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
                          setExpandedFactorIndex((current) => adjustExpandedIndexAfterRemove(current, index));
                        }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button>
                      ) : null}
                    </div>
                    {expandedFactorIndex === index ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-1 text-sm text-slate-700">Node Type
                        <select
                          className={selectClass}
                          value={item.kind}
                          onChange={(event) =>
                            setFactorItems((current) =>
                              updateItem(current, index, {
                                kind: event.target.value as WizardFactorItem["kind"],
                                category:
                                  event.target.value === "incident_system_factor"
                                    ? "training"
                                    : "human",
                              })
                            )
                          }
                        >
                          <option value="incident_factor">Factor</option>
                          <option value="incident_system_factor">System Factor</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700">Presence
                        <select className={selectClass} value={item.presence} onChange={(event) => setFactorItems((current) => updateItem(current, index, { presence: event.target.value as WizardFactorItem["presence"] }))}>
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700">Classification
                        <select className={selectClass} value={item.classification} onChange={(event) => setFactorItems((current) => updateItem(current, index, { classification: event.target.value as WizardFactorItem["classification"] }))}>
                          <option value="essential">Essential</option>
                          <option value="contributing">Contributing</option>
                          <option value="predisposing">Predisposing</option>
                          <option value="neutral">Neutral</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700">{item.kind === "incident_system_factor" ? "Category" : "Influence Type"}
                        <select className={selectClass} value={item.category} onChange={(event) => setFactorItems((current) => updateItem(current, index, { category: event.target.value }))}>
                          {(item.kind === "incident_system_factor" ? systemFactorCategoryOptions : factorInfluenceTypeOptions).map((option) => (
                            <option key={option} value={option}>
                              {formatWizardOptionLabel(option)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description
                        <textarea className={textareaClass} value={item.description} onChange={(event) => setFactorItems((current) => updateItem(current, index, { description: event.target.value }))} />
                      </label>
                    </div>
                    ) : (
                      <div className="text-sm text-slate-500">{summarizeValues(item.kind === "incident_system_factor" ? "System Factor" : "Factor", item.presence, item.classification, item.category, item.description)}</div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => {
                  setFactorItems((current) => [...current, createFactorItem()]);
                  setExpandedFactorIndex(factorItems.length);
                }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Factor</button>
              </div>
            ) : null}

            {currentStep === 5 ? (
              <div className="space-y-4">
                {controlBarrierItems.map((item, index) => (
                  <div key={`barrier-${index}`} className={cardClass}>
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedControlBarrierIndex((current) => toggleExpandedIndex(current, index))}
                        className="flex flex-1 items-center justify-between gap-3 text-left"
                      >
                        <span className="text-sm font-semibold text-slate-900">Control / Barrier {index + 1}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {expandedControlBarrierIndex === index ? "Collapse" : "Expand"}
                        </span>
                      </button>
                      {controlBarrierItems.length > 1 ? (
                        <button type="button" onClick={() => {
                          setControlBarrierItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
                          setExpandedControlBarrierIndex((current) => adjustExpandedIndexAfterRemove(current, index));
                        }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button>
                      ) : null}
                    </div>
                    {expandedControlBarrierIndex === index ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-1 text-sm text-slate-700">Owner
                        <input className={inputClass} value={item.ownerText} onChange={(event) => setControlBarrierItems((current) => updateItem(current, index, { ownerText: event.target.value }))} />
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700">Barrier State
                        <select className={selectClass} value={item.barrierState} onChange={(event) => setControlBarrierItems((current) => updateItem(current, index, { barrierState: event.target.value as WizardControlBarrierItem["barrierState"] }))}>
                          <option value="effective">Effective</option>
                          <option value="failed">Failed</option>
                          <option value="missing">Missing</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700">Barrier Role
                        <select className={selectClass} value={item.barrierRole} onChange={(event) => setControlBarrierItems((current) => updateItem(current, index, { barrierRole: event.target.value as WizardControlBarrierItem["barrierRole"] }))}>
                          <option value="preventive">Preventive</option>
                          <option value="mitigative">Mitigative</option>
                          <option value="recovery">Recovery</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Control Type
                        <select className={selectClass} value={item.controlType} onChange={(event) => setControlBarrierItems((current) => updateItem(current, index, { controlType: event.target.value }))}>
                          <option value="">Select control type</option>
                          <option value="engineering">Engineering</option>
                          <option value="substitution">Substitution</option>
                          <option value="elimination">Elimination</option>
                          <option value="administrative">Administrative</option>
                          <option value="ppe">PPE</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description
                        <textarea className={textareaClass} value={item.description} onChange={(event) => setControlBarrierItems((current) => updateItem(current, index, { description: event.target.value }))} />
                      </label>
                    </div>
                    ) : (
                      <div className="text-sm text-slate-500">{summarizeValues(item.barrierState, item.barrierRole, item.controlType, item.ownerText, item.description)}</div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => {
                  setControlBarrierItems((current) => [...current, createControlBarrierItem()]);
                  setExpandedControlBarrierIndex(controlBarrierItems.length);
                }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Control / Barrier</button>
              </div>
            ) : null}

            {currentStep === 6 ? (
              <div className="space-y-4">
                {evidenceItems.map((item, index) => (
                  <div key={`evidence-${index}`} className={cardClass}>
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedEvidenceIndex((current) => toggleExpandedIndex(current, index))}
                        className="flex flex-1 items-center justify-between gap-3 text-left"
                      >
                        <span className="text-sm font-semibold text-slate-900">Evidence {index + 1}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {expandedEvidenceIndex === index ? "Collapse" : "Expand"}
                        </span>
                      </button>
                      {evidenceItems.length > 1 ? (
                        <button type="button" onClick={() => {
                          setEvidenceItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
                          setExpandedEvidenceIndex((current) => adjustExpandedIndexAfterRemove(current, index));
                        }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button>
                      ) : null}
                    </div>
                    {expandedEvidenceIndex === index ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-1 text-sm text-slate-700">Evidence Type
                        <input className={inputClass} value={item.evidenceType} onChange={(event) => setEvidenceItems((current) => updateItem(current, index, { evidenceType: event.target.value }))} />
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700">Source
                        <input className={inputClass} value={item.source} onChange={(event) => setEvidenceItems((current) => updateItem(current, index, { source: event.target.value }))} />
                      </label>
                      <div />
                      <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description
                        <textarea className={textareaClass} value={item.description} onChange={(event) => setEvidenceItems((current) => updateItem(current, index, { description: event.target.value }))} />
                      </label>
                    </div>
                    ) : (
                      <div className="text-sm text-slate-500">{summarizeValues(item.evidenceType, item.source, item.description)}</div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => {
                  setEvidenceItems((current) => [...current, createEvidenceItem()]);
                  setExpandedEvidenceIndex(evidenceItems.length);
                }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Evidence Item</button>
              </div>
            ) : null}

            {currentStep === 7 ? (
              <div className="space-y-4">
                {responseRecoveryItems.map((item, index) => (
                  <div key={`response-recovery-${index}`} className={cardClass}>
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedResponseRecoveryIndex((current) => toggleExpandedIndex(current, index))}
                        className="flex flex-1 items-center justify-between gap-3 text-left"
                      >
                        <span className="text-sm font-semibold text-slate-900">Response / Recovery {index + 1}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {expandedResponseRecoveryIndex === index ? "Collapse" : "Expand"}
                        </span>
                      </button>
                      {responseRecoveryItems.length > 1 ? (
                        <button type="button" onClick={() => {
                          setResponseRecoveryItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
                          setExpandedResponseRecoveryIndex((current) => adjustExpandedIndexAfterRemove(current, index));
                        }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button>
                      ) : null}
                    </div>
                    {expandedResponseRecoveryIndex === index ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-1 text-sm text-slate-700">
                          Category
                          <select className={selectClass} value={item.category} onChange={(event) => setResponseRecoveryItems((current) => updateItem(current, index, { category: event.target.value as WizardResponseRecoveryItem["category"] }))}>
                            <option value="">Select category</option>
                            <option value="emergency_response">Emergency Response</option>
                            <option value="medical_treatment">Medical Treatment</option>
                            <option value="scene_preservation">Scene Preservation</option>
                            <option value="make_area_safe">Make Area Safe</option>
                          </select>
                        </label>
                        <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">
                          Description
                          <textarea className={textareaClass} value={item.description} onChange={(event) => setResponseRecoveryItems((current) => updateItem(current, index, { description: event.target.value }))} />
                        </label>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">{summarizeValues(item.category, item.description)}</div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => {
                  setResponseRecoveryItems((current) => [...current, createResponseRecoveryItem()]);
                  setExpandedResponseRecoveryIndex(responseRecoveryItems.length);
                }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Response / Recovery</button>
              </div>
            ) : null}

            {currentStep === 8 ? (
              <div className="space-y-4">
                {findingItems.map((item, index) => (
                  <div key={`finding-${index}`} className={cardClass}>
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedFindingIndex((current) => toggleExpandedIndex(current, index))}
                        className="flex flex-1 items-center justify-between gap-3 text-left"
                      >
                        <span className="text-sm font-semibold text-slate-900">Finding {index + 1}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {expandedFindingIndex === index ? "Collapse" : "Expand"}
                        </span>
                      </button>
                      {findingItems.length > 1 ? (
                        <button type="button" onClick={() => {
                          setFindingItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
                          setExpandedFindingIndex((current) => adjustExpandedIndexAfterRemove(current, index));
                        }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button>
                      ) : null}
                    </div>
                    {expandedFindingIndex === index ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-1 text-sm text-slate-700">Confidence Level
                        <select className={selectClass} value={item.confidenceLevel} onChange={(event) => setFindingItems((current) => updateItem(current, index, { confidenceLevel: event.target.value as WizardFindingItem["confidenceLevel"] }))}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description
                        <textarea className={textareaClass} value={item.description} onChange={(event) => setFindingItems((current) => updateItem(current, index, { description: event.target.value }))} />
                      </label>
                    </div>
                    ) : (
                      <div className="text-sm text-slate-500">{summarizeValues(item.confidenceLevel, item.description)}</div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => {
                  setFindingItems((current) => [...current, createFindingItem()]);
                  setExpandedFindingIndex(findingItems.length);
                }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Finding</button>
              </div>
            ) : null}

            {currentStep === 9 ? (
              <div className="space-y-4">
                {recommendationItems.map((item, index) => (
                  <div key={`recommendation-${index}`} className={cardClass}>
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedRecommendationIndex((current) => toggleExpandedIndex(current, index))}
                        className="flex flex-1 items-center justify-between gap-3 text-left"
                      >
                        <span className="text-sm font-semibold text-slate-900">Recommendation {index + 1}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {expandedRecommendationIndex === index ? "Collapse" : "Expand"}
                        </span>
                      </button>
                      {recommendationItems.length > 1 ? (
                        <button type="button" onClick={() => {
                          setRecommendationItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
                          setExpandedRecommendationIndex((current) => adjustExpandedIndexAfterRemove(current, index));
                        }} className="ml-3 text-xs font-semibold text-slate-500 hover:text-slate-900">Remove</button>
                      ) : null}
                    </div>
                    {expandedRecommendationIndex === index ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-1 text-sm text-slate-700">Action Type
                        <select className={selectClass} value={item.actionType} onChange={(event) => setRecommendationItems((current) => updateItem(current, index, { actionType: event.target.value as WizardRecommendationItem["actionType"] }))}>
                          <option value="corrective">Corrective</option>
                          <option value="preventive">Preventive</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700">Owner
                        <input className={inputClass} value={item.ownerText} onChange={(event) => setRecommendationItems((current) => updateItem(current, index, { ownerText: event.target.value }))} />
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700">Due Date
                        <input type="date" className={inputClass} value={item.dueDate} onChange={(event) => setRecommendationItems((current) => updateItem(current, index, { dueDate: event.target.value }))} />
                      </label>
                      <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">Description
                        <textarea className={textareaClass} value={item.description} onChange={(event) => setRecommendationItems((current) => updateItem(current, index, { description: event.target.value }))} />
                      </label>
                    </div>
                    ) : (
                      <div className="text-sm text-slate-500">{summarizeValues(item.actionType, item.ownerText, item.dueDate, item.description)}</div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => {
                  setRecommendationItems((current) => [...current, createRecommendationItem()]);
                  setExpandedRecommendationIndex(recommendationItems.length);
                }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add Another Recommendation</button>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200/80 px-5 py-4 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">Nodes from completed steps stay on the canvas even if you exit the wizard early.</p>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button type="button" onClick={handleSkip} disabled={isSaving} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => void handleNext()}
                  disabled={isSaving}
                  className="rounded-xl border border-[rgba(79,70,229,0.42)] bg-[linear-gradient(135deg,#2563eb_0%,#6d28d9_52%,#db2777_100%)] px-5 py-2 text-sm font-semibold !text-white shadow-[0_14px_28px_rgba(79,70,229,0.24)] transition hover:-translate-y-0.5 hover:border-[rgba(79,70,229,0.55)] hover:bg-[linear-gradient(135deg,#1d4ed8_0%,#5b21b6_52%,#be185d_100%)] hover:!text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:!text-white"
                >
                  {isSaving ? "Adding To Canvas..." : `${nextLabel} And Add`}
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
