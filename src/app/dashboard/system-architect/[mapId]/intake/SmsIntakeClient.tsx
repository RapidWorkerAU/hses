"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import styles from "./SmsIntakeClient.module.css";

type SmsMap = {
  id: string;
  name: string;
  description: string | null;
  status: string;
};

type SmsSession = {
  id: string;
  current_qs_group: string | null;
  current_question_index: number;
  ai_conversation_history: Array<{ role: "user" | "assistant"; content: string }> | null;
  gap_analysis_complete: boolean;
};

type IntakePayload = {
  map: SmsMap;
  session: SmsSession | null;
  prefFlags: Record<string, unknown> | null;
  responses: Array<Record<string, unknown>>;
  gaps: Array<Record<string, unknown>>;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  savedCount?: number;
};

type GuidedQuestionOption = {
  id: string;
  label: string;
  description?: string;
};

type GuidedQuestion = {
  group: string;
  key: string;
  label: string;
  prompt: string;
  selectionMode: "single" | "multi";
  allowOther: boolean;
  otherPrompt: string;
  options: GuidedQuestionOption[];
};

type Qs1State = {
  jurisdiction: string;
  operationalContext: string;
  industrySector: string;
  workforceSize: string;
  existingSms: string;
  iso45001: string;
  audience: string[];
  documentStyle: string;
};

const progressSteps = [
  { key: "QS1", label: "Context" },
  { key: "QS2", label: "Activities" },
  { key: "QS3", label: "People" },
  { key: "QS4", label: "Hazards" },
  { key: "QS5", label: "Controls" },
  { key: "QS6", label: "History" },
  { key: "QS7", label: "Future" },
  { key: "preferences", label: "Preferences" },
];

const groupIndexByKey = new Map(progressSteps.map((step, index) => [step.key, index]));
const nextChatGroupByKey: Record<string, { key: string; label: string }> = {
  QS2: { key: "QS3", label: "People" },
  QS3: { key: "QS4", label: "Hazards" },
  QS4: { key: "QS5", label: "Controls" },
  QS5: { key: "QS6", label: "History" },
  QS6: { key: "QS7", label: "Future" },
  QS7: { key: "preferences", label: "Preferences" },
};

const jurisdictionOptions = [
  { value: "AU_WA", label: "Australia - Western Australia" },
  { value: "AU_NSW", label: "Australia - New South Wales" },
  { value: "AU_QLD", label: "Australia - Queensland" },
  { value: "AU_VIC", label: "Australia - Victoria" },
  { value: "AU_SA", label: "Australia - South Australia" },
  { value: "AU_TAS", label: "Australia - Tasmania" },
  { value: "AU_ACT", label: "Australia - ACT" },
  { value: "AU_NT", label: "Australia - Northern Territory" },
  { value: "NZ", label: "New Zealand" },
  { value: "UK", label: "United Kingdom" },
  { value: "SG", label: "Singapore" },
  { value: "OTHER", label: "Other" },
];

const industryOptions = [
  "Construction",
  "Mining",
  "Manufacturing",
  "Healthcare",
  "Retail",
  "Hospitality",
  "Transport & Logistics",
  "Professional Services",
  "Agriculture",
  "Other",
];

const initialQs1: Qs1State = {
  jurisdiction: "",
  operationalContext: "",
  industrySector: "",
  workforceSize: "",
  existingSms: "",
  iso45001: "",
  audience: [],
  documentStyle: "",
};

const getAuthHeaders = async () => {
  await ensurePortalSupabaseUser();
  const { data } = await supabaseBrowser.auth.getSession();
  const token = data.session?.access_token ?? localStorage.getItem("hses_access_token");
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
};

const normalizeHistory = (session: SmsSession | null): ChatMessage[] =>
  (session?.ai_conversation_history ?? [])
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message, index) => ({
      id: `history-${index}`,
      role: message.role,
      content: message.content,
    }));

const isChatGroup = (group: string | null | undefined) =>
  Boolean(group && ["QS2", "QS3", "QS4", "QS5", "QS6", "QS7", "preferences"].includes(group));

const buildGuidedAnswerSummary = ({
  question,
  selectedOptionIds,
  otherSelected,
  otherText,
}: {
  question: GuidedQuestion;
  selectedOptionIds: string[];
  otherSelected: boolean;
  otherText: string;
}) => {
  const labels = selectedOptionIds
    .map((id) => question.options.find((option) => option.id === id)?.label)
    .filter((label): label is string => Boolean(label));
  const parts = [...labels];
  if (otherSelected && otherText.trim()) parts.push(`Other: ${otherText.trim()}`);
  return parts.length ? parts.join("; ") : "No answer selected";
};

export default function SmsIntakeClient({ mapId }: { mapId: string }) {
  const [payload, setPayload] = useState<IntakePayload | null>(null);
  const [qs1, setQs1] = useState<Qs1State>(initialQs1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeGuidedQuestion, setActiveGuidedQuestion] = useState<GuidedQuestion | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [otherSelected, setOtherSelected] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [gapResponse, setGapResponse] = useState("");
  const [isGroupComplete, setIsGroupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingFixed, setIsSavingFixed] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isAdvancingGroup, setIsAdvancingGroup] = useState(false);
  const [isCompletingGapAnalysis, setIsCompletingGapAnalysis] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedChatRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentGroup = payload?.session?.current_qs_group ?? "QS1";
  const currentStepIndex = useMemo(() => {
    if (currentGroup === "gap_analysis" || currentGroup === "complete") return progressSteps.length - 1;
    return groupIndexByKey.get(currentGroup) ?? 0;
  }, [currentGroup]);
  const activeStep = progressSteps[currentStepIndex] ?? progressSteps[0];
  const nextChatGroup = nextChatGroupByKey[currentGroup];

  const loadIntake = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        window.location.assign(`/login?returnTo=${encodeURIComponent(`/dashboard/system-architect/${mapId}/intake`)}`);
        return;
      }

      const response = await fetch(`/api/sms/maps/${mapId}/intake`, { headers });
      const data = (await response.json()) as IntakePayload | { error?: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error || "Unable to load intake." : "Unable to load intake.");
      }

      const nextPayload = data as IntakePayload;
      setPayload(nextPayload);
      setMessages(normalizeHistory(nextPayload.session));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load intake.");
    } finally {
      setIsLoading(false);
    }
  }, [mapId]);

  useEffect(() => {
    void loadIntake();
  }, [loadIntake]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isAiThinking]);

  const updateQs1 = (key: keyof Qs1State, value: string | string[]) => {
    setQs1((current) => ({ ...current, [key]: value }));
  };

  const toggleAudience = (value: string) => {
    setQs1((current) => ({
      ...current,
      audience: current.audience.includes(value)
        ? current.audience.filter((item) => item !== value)
        : [...current.audience, value],
    }));
  };

  const resetGuidedAnswer = useCallback(() => {
    setSelectedOptionIds([]);
    setOtherSelected(false);
    setOtherText("");
  }, []);

  const resetLocalIntakeState = useCallback(() => {
    setQs1(initialQs1);
    setMessages([]);
    setActiveGuidedQuestion(null);
    setGapResponse("");
    setIsGroupComplete(false);
    startedChatRef.current = false;
    resetGuidedAnswer();
  }, [resetGuidedAnswer]);

  const restartIntake = useCallback(async () => {
    const confirmed = window.confirm(
      "Restart this intake? This will delete all captured answers, preferences, gap analysis data, and generated SMS map items for this system map."
    );
    if (!confirmed) return;

    setIsRestarting(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        window.location.assign(`/login?returnTo=${encodeURIComponent(`/dashboard/system-architect/${mapId}/intake`)}`);
        return;
      }

      const response = await fetch(`/api/sms/maps/${mapId}/intake`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "restart" }),
      });
      const data = (await response.json()) as IntakePayload | { error?: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error || "Unable to restart intake." : "Unable to restart intake.");
      }

      resetLocalIntakeState();
      setPayload(data as IntakePayload);
    } catch (restartError) {
      setError(restartError instanceof Error ? restartError.message : "Unable to restart intake.");
    } finally {
      setIsRestarting(false);
    }
  }, [mapId, resetLocalIntakeState]);

  const submitFixedQuestions = async () => {
    setIsSavingFixed(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        window.location.assign(`/login?returnTo=${encodeURIComponent(`/dashboard/system-architect/${mapId}/intake`)}`);
        return;
      }

      const response = await fetch(`/api/sms/maps/${mapId}/qs1`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(qs1),
      });
      const data = (await response.json()) as { session?: SmsSession; error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to save fixed questions.");

      setPayload((current) =>
        current && data.session
          ? {
              ...current,
              session: data.session,
            }
          : current
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save fixed questions.");
    } finally {
      setIsSavingFixed(false);
    }
  };

  const requestGuidedQuestion = useCallback(async () => {
    if (!isChatGroup(currentGroup)) return;
    setIsAiThinking(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        window.location.assign(`/login?returnTo=${encodeURIComponent(`/dashboard/system-architect/${mapId}/intake`)}`);
        return;
      }

      const response = await fetch(`/api/sms/maps/${mapId}/chat`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestQuestion: true }),
      });
      const data = (await response.json()) as {
        session?: SmsSession;
        message?: { role: "assistant"; content: string; savedCount?: number };
        guidedQuestion?: GuidedQuestion | null;
        groupComplete?: boolean;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Unable to load the next question.");

      setPayload((current) =>
        current && data.session
          ? {
              ...current,
              session: data.session,
            }
          : current
      );
      setActiveGuidedQuestion(data.guidedQuestion ?? null);
      setIsGroupComplete(Boolean(data.groupComplete));
      resetGuidedAnswer();
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Unable to load the next question.");
    } finally {
      setIsAiThinking(false);
    }
  }, [currentGroup, mapId, resetGuidedAnswer]);

  const toggleGuidedOption = (question: GuidedQuestion, optionId: string) => {
    setSelectedOptionIds((current) => {
      if (question.selectionMode === "single") return current.includes(optionId) ? [] : [optionId];
      return current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
    });
  };

  const submitGuidedAnswer = useCallback(async () => {
    if (!activeGuidedQuestion || isAiThinking) return;

    const answerSummary = buildGuidedAnswerSummary({
      question: activeGuidedQuestion,
      selectedOptionIds,
      otherSelected,
      otherText,
    });

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: `${activeGuidedQuestion.label}: ${answerSummary}` },
    ]);
    setIsAiThinking(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        window.location.assign(`/login?returnTo=${encodeURIComponent(`/dashboard/system-architect/${mapId}/intake`)}`);
        return;
      }

      const response = await fetch(`/api/sms/maps/${mapId}/chat`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedOptions: selectedOptionIds,
          otherSelected,
          otherText,
        }),
      });
      const data = (await response.json()) as {
        session?: SmsSession;
        message?: { role: "assistant"; content: string; savedCount?: number };
        guidedQuestion?: GuidedQuestion | null;
        groupComplete?: boolean;
        needsMoreDetail?: boolean;
        error?: string;
      };
      if (!response.ok || !data.message) throw new Error(data.error || "Unable to save this answer.");

      setPayload((current) =>
        current && data.session
          ? {
              ...current,
              session: data.session,
            }
          : current
      );
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message?.content ?? "",
          savedCount: data.message?.savedCount ?? 0,
        },
      ]);
      setActiveGuidedQuestion(data.guidedQuestion ?? activeGuidedQuestion);
      setIsGroupComplete(Boolean(data.groupComplete));
      if (!data.needsMoreDetail) resetGuidedAnswer();
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Unable to save this answer.");
    } finally {
      setIsAiThinking(false);
    }
  }, [activeGuidedQuestion, isAiThinking, mapId, otherSelected, otherText, resetGuidedAnswer, selectedOptionIds]);

  const advanceChatGroup = useCallback(async (groupKey: string) => {
    setIsAdvancingGroup(true);
    setError(null);
    setActiveGuidedQuestion(null);
    setIsGroupComplete(false);
    resetGuidedAnswer();

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        window.location.assign(`/login?returnTo=${encodeURIComponent(`/dashboard/system-architect/${mapId}/intake`)}`);
        return;
      }

      const response = await fetch(`/api/sms/maps/${mapId}/chat`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ advanceToGroup: groupKey }),
      });
      const data = (await response.json()) as {
        session?: SmsSession;
        message?: { role: "assistant"; content: string; savedCount?: number };
        guidedQuestion?: GuidedQuestion | null;
        error?: string;
      };
      if (!response.ok || !data.message) throw new Error(data.error || "Unable to move to the next section.");

      setPayload((current) =>
        current && data.session
          ? {
              ...current,
              session: data.session,
            }
          : current
      );
      setMessages((current) => [
        ...current,
        {
          id: `assistant-advance-${Date.now()}`,
          role: "assistant",
          content: data.message?.content ?? "",
          savedCount: data.message?.savedCount ?? 0,
        },
      ]);
      setActiveGuidedQuestion(data.guidedQuestion ?? null);
      setIsGroupComplete(!data.guidedQuestion);
    } catch (advanceError) {
      setError(advanceError instanceof Error ? advanceError.message : "Unable to move to the next section.");
    } finally {
      setIsAdvancingGroup(false);
    }
  }, [mapId, resetGuidedAnswer]);

  const completeGapAnalysis = useCallback(async (skipDetail = false) => {
    if (isCompletingGapAnalysis) return;
    const trimmedGapResponse = gapResponse.trim();
    if (!skipDetail && !trimmedGapResponse) {
      setError("Add a short answer or complete without extra detail.");
      return;
    }

    if (trimmedGapResponse) {
      setMessages((current) => [
        ...current,
        { id: `user-gap-${Date.now()}`, role: "user", content: `Gap analysis follow-up answers: ${trimmedGapResponse}` },
      ]);
    }

    setIsCompletingGapAnalysis(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        window.location.assign(`/login?returnTo=${encodeURIComponent(`/dashboard/system-architect/${mapId}/intake`)}`);
        return;
      }

      const response = await fetch(`/api/sms/maps/${mapId}/chat`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gapResponse: trimmedGapResponse,
          completeGapAnalysis: true,
        }),
      });
      const data = (await response.json()) as {
        session?: SmsSession;
        message?: { role: "assistant"; content: string; savedCount?: number };
        error?: string;
      };
      if (!response.ok || !data.message) throw new Error(data.error || "Unable to complete the gap analysis.");

      setPayload((current) =>
        current && data.session
          ? {
              ...current,
              session: data.session,
              map: {
                ...current.map,
                status: "complete",
              },
            }
          : current
      );
      setMessages((current) => [
        ...current,
        {
          id: `assistant-gap-${Date.now()}`,
          role: "assistant",
          content: data.message?.content ?? "",
          savedCount: data.message?.savedCount ?? 0,
        },
      ]);
      setGapResponse("");
      setActiveGuidedQuestion(null);
      setIsGroupComplete(true);
    } catch (gapError) {
      setError(gapError instanceof Error ? gapError.message : "Unable to complete the gap analysis.");
    } finally {
      setIsCompletingGapAnalysis(false);
    }
  }, [gapResponse, isCompletingGapAnalysis, mapId]);

  const startConversation = useCallback(async () => {
    if (startedChatRef.current || isAiThinking) return;
    startedChatRef.current = true;
    await requestGuidedQuestion();
  }, [isAiThinking, requestGuidedQuestion]);

  useEffect(() => {
    if (!isChatGroup(currentGroup)) return;
    if (activeGuidedQuestion || isGroupComplete) return;
    void startConversation();
  }, [activeGuidedQuestion, currentGroup, isGroupComplete, startConversation]);

  useEffect(() => {
    startedChatRef.current = false;
    setActiveGuidedQuestion(null);
    setIsGroupComplete(false);
    setGapResponse("");
    resetGuidedAnswer();
  }, [currentGroup, resetGuidedAnswer]);

  if (isLoading) {
    return (
      <div className={styles.screen}>
        <div className={styles.progressHeader}>
          <p className={styles.eyebrow}>System Architect</p>
          <h1 className={styles.title}>Loading intake...</h1>
        </div>
        <div className={styles.loadingState}>Preparing your questions</div>
      </div>
    );
  }

  if (!payload?.map || !payload.session) {
    return (
      <div className={styles.screen}>
        <div className={styles.progressHeader}>
          <p className={styles.eyebrow}>System Architect</p>
          <h1 className={styles.title}>Intake unavailable</h1>
        </div>
        <main className={styles.main}>
          <div className={styles.panel}>{error ? <div className={styles.error}>{error}</div> : null}</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <main className={styles.main}>
        <div className={styles.intakeShell}>
          <aside className={styles.sideNav} aria-label="Question progress">
            <p className={styles.sideEyebrow}>Intake</p>
            <h2 className={styles.sideTitle}>System Map</h2>
            <div className={styles.navItems}>
              {progressSteps.map((step, index) => {
                const isDone = index < currentStepIndex || currentGroup === "complete";
                const isActive = index === currentStepIndex && currentGroup !== "complete";
                return (
                  <div
                    key={step.key}
                    className={`${styles.navItem} ${isDone ? styles.navItemDone : ""} ${isActive ? styles.navItemActive : ""}`}
                  >
                    <span className={styles.navIcon}>{isDone ? "OK" : index + 1}</span>
                    <span>
                      <strong>{step.label}</strong>
                      <small>{isDone ? "Complete" : isActive ? "In progress" : "Waiting"}</small>
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>

          <div className={styles.workspace}>
            <div className={styles.workspaceHeader}>
              <div>
                <h2>
                  {currentGroup === "QS1"
                    ? "Context"
                    : currentGroup === "gap_analysis"
                      ? "Gap analysis"
                      : currentGroup === "complete"
                        ? "Complete"
                        : activeStep.label}
                </h2>
                <p>
                  {currentGroup === "QS1"
                    ? "Start with the core operating details before the guided conversation begins."
                    : currentGroup === "gap_analysis"
                      ? "Answer any follow-up questions you can, or complete the intake without extra detail."
                      : currentGroup === "complete"
                      ? "The intake responses have been captured for this system map."
                      : "Answer one question at a time so the system can capture structured map inputs."}
                </p>
              </div>
              <div className={styles.workspaceActions}>
                <span className={styles.statusPill}>
                  {currentGroup === "complete" ? "Intake complete" : currentGroup === "gap_analysis" ? "Gap analysis" : `Current: ${progressSteps[currentStepIndex]?.label ?? "Context"}`}
                </span>
                <button type="button" className={styles.dangerButton} onClick={() => void restartIntake()} disabled={isRestarting}>
                  {isRestarting ? "Restarting..." : "Restart questions"}
                </button>
              </div>
            </div>

            {currentGroup === "QS1" ? (
              <section className={styles.panel}>
                {error ? <div className={styles.error}>{error}</div> : null}

                <div className={styles.questionGrid}>
                  <div className={styles.questionCard}>
                    <label className={styles.questionLabel} htmlFor="jurisdiction">What country or state does this business operate in?</label>
                    <select id="jurisdiction" className={styles.select} value={qs1.jurisdiction} onChange={(event) => updateQs1("jurisdiction", event.target.value)}>
                      <option value="">Select jurisdiction</option>
                      {jurisdictionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>

                  <div className={styles.questionCard}>
                    <div className={styles.questionLabel}>Is this safety system for ongoing operations or a specific project?</div>
                    <div className={styles.optionGrid}>
                      {[
                        ["ongoing_operations", "Ongoing operations", "A business or site that will keep operating."],
                        ["project_based", "Project based", "A defined project, shutdown, campaign, or contract."],
                        ["both", "Both", "A system that needs to cover operations and projects."],
                      ].map(([value, label, description]) => (
                        <button key={value} type="button" className={`${styles.optionCard} ${qs1.operationalContext === value ? styles.optionCardActive : ""}`} onClick={() => updateQs1("operationalContext", value)}>
                          <strong>{label}</strong>
                          <span>{description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.questionCard}>
                    <label className={styles.questionLabel} htmlFor="industry">What industry or sector does the business operate in?</label>
                    <input id="industry" className={styles.input} list="industry-options" value={qs1.industrySector} onChange={(event) => updateQs1("industrySector", event.target.value)} placeholder="Start typing or choose an industry" />
                    <datalist id="industry-options">
                      {industryOptions.map((option) => <option key={option} value={option} />)}
                    </datalist>
                  </div>

                  <div className={styles.questionCard}>
                    <div className={styles.questionLabel}>How many people work in the business?</div>
                    <div className={`${styles.optionGrid} ${styles.optionGridCompact}`}>
                      {["1-5", "6-20", "21-50", "51-200", "200+"].map((value) => (
                        <button key={value} type="button" className={`${styles.optionCard} ${qs1.workforceSize === value ? styles.optionCardActive : ""}`} onClick={() => updateQs1("workforceSize", value)}>
                          <strong>{value}</strong>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.questionCard}>
                    <div className={styles.questionLabel}>Does the business currently have a safety management system in place?</div>
                    <div className={`${styles.optionGrid} ${styles.optionGridCompact}`}>
                      {[
                        ["yes", "Yes"],
                        ["partially", "Partially"],
                        ["no", "No"],
                      ].map(([value, label]) => (
                        <button key={value} type="button" className={`${styles.optionCard} ${qs1.existingSms === value ? styles.optionCardActive : ""}`} onClick={() => updateQs1("existingSms", value)}>
                          <strong>{label}</strong>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.questionCard}>
                    <div className={styles.questionLabel}>Is the business working toward or currently certified to ISO 45001?</div>
                    <div className={`${styles.optionGrid} ${styles.optionGridCompact}`}>
                      {[
                        ["yes", "Yes"],
                        ["no", "No"],
                        ["not_sure", "Not sure"],
                      ].map(([value, label]) => (
                        <button key={value} type="button" className={`${styles.optionCard} ${qs1.iso45001 === value ? styles.optionCardActive : ""}`} onClick={() => updateQs1("iso45001", value)}>
                          <strong>{label}</strong>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.questionCard}>
                    <div className={styles.questionLabel}>Will this system cover employees only, or contractors and visitors as well?</div>
                    <div className={styles.optionGrid}>
                      {[
                        ["employees", "Employees", "Your direct workforce."],
                        ["contractors", "Contractors", "Contractors and subcontractors."],
                        ["visitors", "Visitors", "Visitors entering your workplace."],
                        ["public", "Members of public", "Public-facing operations or shared spaces."],
                      ].map(([value, label, description]) => (
                        <button key={value} type="button" className={`${styles.optionCard} ${qs1.audience.includes(value) ? styles.optionCardActive : ""}`} onClick={() => toggleAudience(value)}>
                          <strong>{label}</strong>
                          <span>{description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.questionCard}>
                    <div className={styles.questionLabel}>How would you prefer your documents to be structured?</div>
                    <div className={styles.optionGrid}>
                      {[
                        ["combined", "Combined", "Fewer, broader documents that cover multiple topics together."],
                        ["separate", "Separate", "Individual focused documents for each topic."],
                        ["not_sure", "Not sure", "Let the system recommend a sensible structure."],
                      ].map(([value, label, description]) => (
                        <button key={value} type="button" className={`${styles.optionCard} ${qs1.documentStyle === value ? styles.optionCardActive : ""}`} onClick={() => updateQs1("documentStyle", value)}>
                          <strong>{label}</strong>
                          <span>{description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button type="button" className={styles.primaryButton} onClick={() => void submitFixedQuestions()} disabled={isSavingFixed}>
                    {isSavingFixed ? "Saving..." : "Continue to conversation"}
                  </button>
                </div>
              </section>
            ) : (
              <section className={styles.chatShell}>
                <div className={styles.messages} aria-live="polite">
                  {messages.map((message) => (
                    <div key={message.id} className={`${styles.messageRow} ${message.role === "user" ? styles.messageRowUser : ""}`}>
                      <div className={`${styles.messageBubble} ${message.role === "user" ? styles.messageUser : styles.messageAi}`}>
                        <span>{message.content}</span>
                        {message.role === "assistant" && message.savedCount ? (
                          <span className={styles.savedIndicator}>Saved {message.savedCount} item{message.savedCount === 1 ? "" : "s"}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {isAiThinking ? (
                    <div className={styles.messageRow}>
                      <div className={`${styles.messageBubble} ${styles.messageAi}`}>Thinking through the next practical question...</div>
                    </div>
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>

                {error ? <div className={styles.error}>{error}</div> : null}

                <div className={styles.guidedComposer}>
                  {currentGroup === "gap_analysis" ? (
                    <div className={styles.guidedPanel}>
                      <div className={styles.guidedPanelHeader}>
                        <p>Follow-up notes</p>
                        <span>Answer what you know</span>
                      </div>
                      <h3>Use the questions above as prompts. Short notes are enough.</h3>
                      <textarea
                        className={styles.otherContext}
                        value={gapResponse}
                        onChange={(event) => setGapResponse(event.target.value)}
                        placeholder="Example: Controls in place include pre-start checks, SWMS, toolbox talks, supervision, inductions..."
                        disabled={isCompletingGapAnalysis}
                      />
                      <div className={styles.guidedActions}>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => void completeGapAnalysis(true)}
                          disabled={isCompletingGapAnalysis}
                        >
                          Complete without extra detail
                        </button>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={() => void completeGapAnalysis(false)}
                          disabled={isCompletingGapAnalysis || !gapResponse.trim()}
                        >
                          {isCompletingGapAnalysis ? "Completing..." : "Save follow-up answers"}
                        </button>
                      </div>
                    </div>
                  ) : currentGroup === "complete" ? (
                    <div className={styles.groupCompletePanel}>
                      <strong>Intake complete</strong>
                      <span>The captured responses are ready for the next System Architect step.</span>
                    </div>
                  ) : activeGuidedQuestion ? (
                    <div className={styles.guidedPanel}>
                      <div className={styles.guidedPanelHeader}>
                        <p>{activeGuidedQuestion.label}</p>
                        <span>{activeGuidedQuestion.selectionMode === "multi" ? "Select all that apply" : "Select one"}</span>
                      </div>
                      <h3>{activeGuidedQuestion.prompt}</h3>
                      <div className={styles.guidedOptions}>
                        {activeGuidedQuestion.options.map((option) => {
                          const isSelected = selectedOptionIds.includes(option.id);
                          return (
                            <button
                              key={option.id}
                              type="button"
                              className={`${styles.guidedOption} ${isSelected ? styles.guidedOptionActive : ""}`}
                              onClick={() => toggleGuidedOption(activeGuidedQuestion, option.id)}
                              disabled={isAiThinking || isAdvancingGroup}
                            >
                              <strong>{option.label}</strong>
                              {option.description ? <span>{option.description}</span> : null}
                            </button>
                          );
                        })}
                        {activeGuidedQuestion.allowOther ? (
                          <button
                            type="button"
                            className={`${styles.guidedOption} ${otherSelected ? styles.guidedOptionActive : ""}`}
                            onClick={() => setOtherSelected((current) => !current)}
                            disabled={isAiThinking || isAdvancingGroup}
                          >
                            <strong>Other</strong>
                            <span>Add context in your own words.</span>
                          </button>
                        ) : null}
                      </div>
                      {otherSelected ? (
                        <textarea
                          className={styles.otherContext}
                          value={otherText}
                          onChange={(event) => setOtherText(event.target.value)}
                          placeholder={activeGuidedQuestion.otherPrompt}
                          disabled={isAiThinking || isAdvancingGroup}
                        />
                      ) : null}
                      <div className={styles.guidedActions}>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={() => void submitGuidedAnswer()}
                          disabled={isAiThinking || isAdvancingGroup || (!selectedOptionIds.length && !otherText.trim())}
                        >
                          {isAiThinking ? "Saving..." : "Save and continue"}
                        </button>
                      </div>
                    </div>
                  ) : isGroupComplete ? (
                    <div className={styles.groupCompletePanel}>
                      <strong>{activeStep.label} section complete</strong>
                      <span>Use the continue button to move to the next question set.</span>
                    </div>
                  ) : (
                    <div className={styles.groupCompletePanel}>
                      <strong>Preparing the next question</strong>
                      <span>The options are being tailored from the answers already captured.</span>
                    </div>
                  )}

                  {nextChatGroup ? (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => void advanceChatGroup(nextChatGroup.key)}
                      disabled={isAiThinking || isAdvancingGroup}
                    >
                      {isAdvancingGroup ? "Moving..." : `Continue to ${nextChatGroup.label}`}
                    </button>
                  ) : null}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
