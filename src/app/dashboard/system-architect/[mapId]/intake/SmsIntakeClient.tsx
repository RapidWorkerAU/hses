"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import { cn } from "@/lib/utils";

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

const inputCls = "w-full rounded-lg border border-neutral-200 px-3 py-2 text-[13px] text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2d9692]/20 focus:border-[#2d9692] transition disabled:opacity-50";

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
      <div className="animate-pulse flex flex-col gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden flex min-h-[500px]">
          <div className="w-52 shrink-0 border-r border-neutral-100 bg-neutral-50 p-5 flex flex-col gap-3">
            <div className="h-3 w-16 rounded bg-neutral-200" />
            <div className="h-4 w-28 rounded bg-neutral-200 mb-2" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 rounded-lg bg-neutral-100" />
            ))}
          </div>
          <div className="flex-1 p-6 flex flex-col gap-4">
            <div className="h-5 w-36 rounded bg-neutral-200" />
            <div className="h-4 w-64 rounded bg-neutral-100" />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-neutral-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!payload?.map || !payload.session) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-[16px] font-semibold text-neutral-900">Intake unavailable</h2>
        {error ? (
          <p className="mt-2 text-[13px] text-red-600">{error}</p>
        ) : (
          <p className="mt-1 text-[13px] text-neutral-500">The intake session could not be loaded for this map.</p>
        )}
      </div>
    );
  }

  const workspaceTitle =
    currentGroup === "QS1"
      ? "Context"
      : currentGroup === "gap_analysis"
        ? "Gap analysis"
        : currentGroup === "complete"
          ? "Complete"
          : activeStep.label;

  const workspaceSubtitle =
    currentGroup === "QS1"
      ? "Start with the core operating details before the guided conversation begins."
      : currentGroup === "gap_analysis"
        ? "Answer any follow-up questions you can, or complete the intake without extra detail."
        : currentGroup === "complete"
          ? "The intake responses have been captured for this system map."
          : "Answer one question at a time so the system can capture structured map inputs.";

  const statusLabel =
    currentGroup === "complete"
      ? "Intake complete"
      : currentGroup === "gap_analysis"
        ? "Gap analysis"
        : `Current: ${progressSteps[currentStepIndex]?.label ?? "Context"}`;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden flex min-h-[600px]">
      {/* Left step nav */}
      <aside className="w-52 shrink-0 border-r border-neutral-100 bg-neutral-50/60 p-5 flex flex-col" aria-label="Question progress">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Intake</p>
        <p className="text-[14px] font-semibold text-neutral-800 mb-5">System Map</p>
        <div className="flex flex-col gap-0.5">
          {progressSteps.map((step, index) => {
            const isDone = index < currentStepIndex || currentGroup === "complete";
            const isActive = index === currentStepIndex && currentGroup !== "complete";
            return (
              <div
                key={step.key}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]",
                  isDone && "text-neutral-500",
                  isActive && "bg-[#2d9692]/10 text-[#2d9692]",
                  !isDone && !isActive && "text-neutral-400"
                )}
              >
                <span className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  isDone && "bg-[#2d9692]/15 text-[#2d9692]",
                  isActive && "bg-[#2d9692] text-white",
                  !isDone && !isActive && "bg-neutral-200 text-neutral-500"
                )}>
                  {isDone ? "✓" : index + 1}
                </span>
                <span className="flex flex-col leading-tight">
                  <strong className={cn("font-medium", isActive && "font-semibold")}>{step.label}</strong>
                  <small className="text-[10px] opacity-70">{isDone ? "Complete" : isActive ? "In progress" : "Waiting"}</small>
                </span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Right workspace */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Workspace header */}
        <div className="px-6 pt-5 pb-4 border-b border-neutral-100 flex-shrink-0 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-semibold text-neutral-900">{workspaceTitle}</h2>
            <p className="text-[13px] text-neutral-500 mt-0.5">{workspaceSubtitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
              {statusLabel}
            </span>
            <button
              type="button"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              onClick={() => void restartIntake()}
              disabled={isRestarting}
            >
              {isRestarting ? "Restarting..." : "Restart"}
            </button>
          </div>
        </div>

        {/* QS1 form */}
        {currentGroup === "QS1" ? (
          <div className="flex-1 p-6 overflow-y-auto">
            {error ? (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">{error}</div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {/* Jurisdiction */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <label className="block text-[13px] font-medium text-neutral-700 mb-2" htmlFor="jurisdiction">
                  What country or state does this business operate in?
                </label>
                <select
                  id="jurisdiction"
                  className={inputCls}
                  value={qs1.jurisdiction}
                  onChange={(event) => updateQs1("jurisdiction", event.target.value)}
                >
                  <option value="">Select jurisdiction</option>
                  {jurisdictionOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Operational context */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="text-[13px] font-medium text-neutral-700 mb-2">
                  Is this safety system for ongoing operations or a specific project?
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["ongoing_operations", "Ongoing operations", "A business or site that will keep operating."],
                    ["project_based", "Project based", "A defined project, shutdown, campaign, or contract."],
                    ["both", "Both", "A system that needs to cover operations and projects."],
                  ].map(([value, label, description]) => (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        "rounded-lg border p-2.5 text-left text-[12px] transition",
                        qs1.operationalContext === value
                          ? "border-[#2d9692] bg-[#2d9692]/5"
                          : "border-neutral-200 bg-white hover:border-[#2d9692]/40 hover:bg-[#2d9692]/5"
                      )}
                      onClick={() => updateQs1("operationalContext", value)}
                    >
                      <strong className="block font-medium text-neutral-900">{label}</strong>
                      <span className="mt-0.5 block text-neutral-500">{description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <label className="block text-[13px] font-medium text-neutral-700 mb-2" htmlFor="industry">
                  What industry or sector does the business operate in?
                </label>
                <input
                  id="industry"
                  className={inputCls}
                  list="industry-options"
                  value={qs1.industrySector}
                  onChange={(event) => updateQs1("industrySector", event.target.value)}
                  placeholder="Start typing or choose an industry"
                />
                <datalist id="industry-options">
                  {industryOptions.map((option) => <option key={option} value={option} />)}
                </datalist>
              </div>

              {/* Workforce size */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="text-[13px] font-medium text-neutral-700 mb-2">How many people work in the business?</p>
                <div className="flex flex-wrap gap-2">
                  {["1-5", "6-20", "21-50", "51-200", "200+"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        "rounded-lg border px-3 py-2 text-[13px] font-medium transition",
                        qs1.workforceSize === value
                          ? "border-[#2d9692] bg-[#2d9692]/5 text-[#2d9692]"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-[#2d9692]/40"
                      )}
                      onClick={() => updateQs1("workforceSize", value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Existing SMS */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="text-[13px] font-medium text-neutral-700 mb-2">
                  Does the business currently have a safety management system in place?
                </p>
                <div className="flex gap-2">
                  {[["yes", "Yes"], ["partially", "Partially"], ["no", "No"]].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        "rounded-lg border px-3 py-2 text-[13px] font-medium transition",
                        qs1.existingSms === value
                          ? "border-[#2d9692] bg-[#2d9692]/5 text-[#2d9692]"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-[#2d9692]/40"
                      )}
                      onClick={() => updateQs1("existingSms", value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ISO 45001 */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="text-[13px] font-medium text-neutral-700 mb-2">
                  Is the business working toward or currently certified to ISO 45001?
                </p>
                <div className="flex gap-2">
                  {[["yes", "Yes"], ["no", "No"], ["not_sure", "Not sure"]].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        "rounded-lg border px-3 py-2 text-[13px] font-medium transition",
                        qs1.iso45001 === value
                          ? "border-[#2d9692] bg-[#2d9692]/5 text-[#2d9692]"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-[#2d9692]/40"
                      )}
                      onClick={() => updateQs1("iso45001", value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audience */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm md:col-span-2">
                <p className="text-[13px] font-medium text-neutral-700 mb-2">
                  Will this system cover employees only, or contractors and visitors as well?
                </p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {[
                    ["employees", "Employees", "Your direct workforce."],
                    ["contractors", "Contractors", "Contractors and subcontractors."],
                    ["visitors", "Visitors", "Visitors entering your workplace."],
                    ["public", "Members of public", "Public-facing operations or shared spaces."],
                  ].map(([value, label, description]) => (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        "rounded-lg border p-3 text-left text-[12px] transition",
                        qs1.audience.includes(value)
                          ? "border-[#2d9692] bg-[#2d9692]/5"
                          : "border-neutral-200 bg-white hover:border-[#2d9692]/40 hover:bg-[#2d9692]/5"
                      )}
                      onClick={() => toggleAudience(value)}
                    >
                      <strong className="block font-medium text-neutral-900">{label}</strong>
                      <span className="mt-0.5 block text-neutral-500">{description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Document style */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm md:col-span-2">
                <p className="text-[13px] font-medium text-neutral-700 mb-2">
                  How would you prefer your documents to be structured?
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["combined", "Combined", "Fewer, broader documents that cover multiple topics together."],
                    ["separate", "Separate", "Individual focused documents for each topic."],
                    ["not_sure", "Not sure", "Let the system recommend a sensible structure."],
                  ].map(([value, label, description]) => (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        "rounded-lg border p-3 text-left text-[12px] transition",
                        qs1.documentStyle === value
                          ? "border-[#2d9692] bg-[#2d9692]/5"
                          : "border-neutral-200 bg-white hover:border-[#2d9692]/40 hover:bg-[#2d9692]/5"
                      )}
                      onClick={() => updateQs1("documentStyle", value)}
                    >
                      <strong className="block font-medium text-neutral-900">{label}</strong>
                      <span className="mt-0.5 block text-neutral-500">{description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="rounded-lg bg-[#2d9692] px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#236e6b] disabled:opacity-50"
                onClick={() => void submitFixedQuestions()}
                disabled={isSavingFixed}
              >
                {isSavingFixed ? "Saving..." : "Continue to conversation"}
              </button>
            </div>
          </div>
        ) : (
          /* Chat section */
          <div className="flex flex-1 flex-col min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3" aria-live="polite">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div className={cn(
                    "max-w-[82%] rounded-xl px-4 py-3 text-[13px] leading-relaxed",
                    message.role === "user"
                      ? "bg-[#2d9692] text-white"
                      : "bg-white border border-neutral-200 text-neutral-800"
                  )}>
                    {message.content}
                    {message.role === "assistant" && message.savedCount ? (
                      <span className="mt-1.5 block text-[11px] text-[#2d9692]">
                        Saved {message.savedCount} item{message.savedCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
              {isAiThinking ? (
                <div className="flex justify-start">
                  <div className="max-w-[82%] rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[13px] text-neutral-400 italic">
                    Thinking through the next practical question...
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            {error ? (
              <div className="px-5 pb-2">
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-600">{error}</div>
              </div>
            ) : null}

            {/* Guided composer */}
            <div className="border-t border-neutral-100 bg-neutral-50/50 p-5 flex flex-col gap-3">
              {currentGroup === "gap_analysis" ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[12px] font-semibold text-neutral-500">Follow-up notes</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Answer what you know</p>
                  </div>
                  <p className="text-[13px] font-medium text-neutral-800">Use the questions above as prompts. Short notes are enough.</p>
                  <textarea
                    className={cn(inputCls, "min-h-[80px] resize-y")}
                    value={gapResponse}
                    onChange={(event) => setGapResponse(event.target.value)}
                    placeholder="Example: Controls in place include pre-start checks, SWMS, toolbox talks, supervision, inductions..."
                    disabled={isCompletingGapAnalysis}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
                      onClick={() => void completeGapAnalysis(true)}
                      disabled={isCompletingGapAnalysis}
                    >
                      Complete without extra detail
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-[#2d9692] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#236e6b] disabled:opacity-50"
                      onClick={() => void completeGapAnalysis(false)}
                      disabled={isCompletingGapAnalysis || !gapResponse.trim()}
                    >
                      {isCompletingGapAnalysis ? "Completing..." : "Save follow-up answers"}
                    </button>
                  </div>
                </div>
              ) : currentGroup === "complete" ? (
                <div className="rounded-xl border border-[#2d9692]/20 bg-[#2d9692]/5 px-4 py-3">
                  <strong className="block text-[13px] font-semibold text-[#2d9692]">Intake complete</strong>
                  <span className="text-[12px] text-neutral-600">The captured responses are ready for the next System Architect step.</span>
                </div>
              ) : activeGuidedQuestion ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[12px] font-semibold text-neutral-500">{activeGuidedQuestion.label}</p>
                    <p className="text-[13px] font-semibold text-neutral-900 mt-0.5">{activeGuidedQuestion.prompt}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {activeGuidedQuestion.selectionMode === "multi" ? "Select all that apply" : "Select one"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {activeGuidedQuestion.options.map((option) => {
                      const isSelected = selectedOptionIds.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={cn(
                            "rounded-lg border p-3 text-left text-[12px] transition",
                            isSelected
                              ? "border-[#2d9692] bg-[#2d9692]/5"
                              : "border-neutral-200 bg-white hover:border-[#2d9692]/40 hover:bg-[#2d9692]/5"
                          )}
                          onClick={() => toggleGuidedOption(activeGuidedQuestion, option.id)}
                          disabled={isAiThinking || isAdvancingGroup}
                        >
                          <strong className="block font-medium text-neutral-900">{option.label}</strong>
                          {option.description ? <span className="mt-0.5 block text-neutral-500">{option.description}</span> : null}
                        </button>
                      );
                    })}
                    {activeGuidedQuestion.allowOther ? (
                      <button
                        type="button"
                        className={cn(
                          "rounded-lg border p-3 text-left text-[12px] transition",
                          otherSelected
                            ? "border-[#2d9692] bg-[#2d9692]/5"
                            : "border-neutral-200 bg-white hover:border-[#2d9692]/40 hover:bg-[#2d9692]/5"
                        )}
                        onClick={() => setOtherSelected((current) => !current)}
                        disabled={isAiThinking || isAdvancingGroup}
                      >
                        <strong className="block font-medium text-neutral-900">Other</strong>
                        <span className="mt-0.5 block text-neutral-500">Add context in your own words.</span>
                      </button>
                    ) : null}
                  </div>
                  {otherSelected ? (
                    <textarea
                      className={cn(inputCls, "min-h-[60px] resize-y")}
                      value={otherText}
                      onChange={(event) => setOtherText(event.target.value)}
                      placeholder={activeGuidedQuestion.otherPrompt}
                      disabled={isAiThinking || isAdvancingGroup}
                    />
                  ) : null}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="rounded-lg bg-[#2d9692] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#236e6b] disabled:opacity-50"
                      onClick={() => void submitGuidedAnswer()}
                      disabled={isAiThinking || isAdvancingGroup || (!selectedOptionIds.length && !otherText.trim())}
                    >
                      {isAiThinking ? "Saving..." : "Save and continue"}
                    </button>
                  </div>
                </div>
              ) : isGroupComplete ? (
                <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                  <strong className="block text-[13px] font-medium text-neutral-800">{activeStep.label} section complete</strong>
                  <span className="text-[12px] text-neutral-500">Use the continue button to move to the next question set.</span>
                </div>
              ) : (
                <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3">
                  <strong className="block text-[13px] font-medium text-neutral-700">Preparing the next question</strong>
                  <span className="text-[12px] text-neutral-400">The options are being tailored from the answers already captured.</span>
                </div>
              )}

              {nextChatGroup ? (
                <div className="flex justify-end border-t border-neutral-100 pt-3">
                  <button
                    type="button"
                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
                    onClick={() => void advanceChatGroup(nextChatGroup.key)}
                    disabled={isAiThinking || isAdvancingGroup}
                  >
                    {isAdvancingGroup ? "Moving..." : `Continue to ${nextChatGroup.label}`}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
