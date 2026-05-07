"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/loading/HsesLoaders";
import type { QuestionnaireSuggestionItem } from "@/lib/document-builder/ai/types";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import { supabaseBrowser } from "@/lib/supabase/client";
import styles from "./DocumentQuestionnaireClient.module.css";

type ProjectRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  document_type_version_id: string;
};

type QuestionRecord = {
  id: string;
  key: string;
  label: string;
  help_text: string | null;
  question_type: string;
  placeholder: string | null;
  is_required: boolean;
  order_index: number;
  options: { items?: string[] } | null;
};

type QuestionGroupRecord = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  order_index: number;
  document_questions: QuestionRecord[] | null;
};

type StructuredLocationAnswer = {
  country: string;
  region: string;
  city: string;
};

type StructuredRoleEntry = {
  title: string;
  seniority: string;
  affiliation: string;
};

type StructuredOversightAnswer = {
  has_role: string;
  role_title: string;
};

type StructuredAuthorityAnswer = {
  authority_model: string;
  notes: string;
};

type StructuredSystemAnswer = {
  system_type: string;
  details: string;
};

type StructuredValidityAnswer = {
  duration_value: string;
  duration_unit: string;
  shorter_conditions: string;
};

type StructuredZoneEntry = {
  zone_type: string;
  marking_method: string;
};

type AnswerValue =
  | string
  | string[]
  | boolean
  | StructuredLocationAnswer
  | StructuredOversightAnswer
  | StructuredAuthorityAnswer
  | StructuredSystemAnswer
  | StructuredValidityAnswer
  | StructuredZoneEntry[]
  | StructuredRoleEntry[]
  | QuestionnaireSuggestionItem[]
  | null;

type QuestionActionState = {
  isGenerating: boolean;
  error: string | null;
};

type PendingSuggestionState = Record<string, string>;

const A3_OPTIONS = [
  "New construction",
  "Brownfield expansion",
  "Commissioning",
  "Operations",
  "Shutdown / turnaround",
  "Maintenance",
  "Care and maintenance",
  "Decommissioning",
];

const A7_OPTIONS = [
  "Direct employees",
  "Contractor workforce",
  "Subcontractors",
  "Labour hire personnel",
  "Visitors entering controlled work areas",
];

const C1_OPTIONS = [
  "Working at heights",
  "Confined space entry",
  "Hot work",
  "Electrical work",
  "High voltage work",
  "Isolation of hazardous energy",
  "Excavation and ground disturbance",
  "Crane and lifting operations",
  "Mobile plant interaction",
  "Pressure testing",
  "Work over or near water",
  "Demolition",
  "Radiation-related work",
  "Hazardous chemicals handling",
  "Live process plant work",
  "Scaffolding",
  "Blasting or explosives work",
  "Remote or isolated work",
];

const C5_ZONE_OPTIONS = [
  "Restricted area",
  "Exclusion zone",
  "Isolation boundary",
  "Barricaded work area",
  "Permit handover point",
  "Access control point",
];

const C2_OPTIONS = ["Digital system", "Paper-based system", "Hybrid system"];

const C3_OPTIONS = ["Physical permit board", "Electronic dashboard", "Combination of board and dashboard", "Other method"];

const C4_DURATION_UNITS = ["Minutes", "Hours", "Days", "Weeks", "Months"];

const ROLE_LEVEL_OPTIONS = [
  "Executive / Director",
  "Senior leadership",
  "Project management",
  "Superintendent / Manager",
  "Supervisor / Coordinator",
  "Permit issuer / Authorising role",
  "Frontline worker / Operator",
  "Specialist / Advisor",
];

const ROLE_AFFILIATION_OPTIONS = ["Company", "Contractor"];

const B3_ROLE_OPTIONS = ["Yes", "No", "Depends on work scope"];

const B4_AUTHORITY_OPTIONS = [
  "Company representative issues permits",
  "Contractor senior supervisor issues permits",
  "Depends on the work type or area",
  "Shared company and contractor authority",
];

const formatSavedAt = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not saved yet";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const normaliseAnswer = (questionType: string, raw: unknown): AnswerValue => {
  if (
    Array.isArray(raw) &&
    raw.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as StructuredRoleEntry).title === "string" &&
        typeof (item as StructuredRoleEntry).seniority === "string" &&
        typeof (item as StructuredRoleEntry).affiliation === "string",
    )
  ) {
    return raw as StructuredRoleEntry[];
  }

  if (
    Array.isArray(raw) &&
    raw.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as StructuredZoneEntry).zone_type === "string" &&
        typeof (item as StructuredZoneEntry).marking_method === "string",
    )
  ) {
    return raw as StructuredZoneEntry[];
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const maybeOversight = raw as Partial<StructuredOversightAnswer>;
    if ("has_role" in maybeOversight || "role_title" in maybeOversight) {
      return {
        has_role: typeof maybeOversight.has_role === "string" ? maybeOversight.has_role : "",
        role_title: typeof maybeOversight.role_title === "string" ? maybeOversight.role_title : "",
      };
    }
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const maybeAuthority = raw as Partial<StructuredAuthorityAnswer>;
    if ("authority_model" in maybeAuthority || "notes" in maybeAuthority) {
      return {
        authority_model: typeof maybeAuthority.authority_model === "string" ? maybeAuthority.authority_model : "",
        notes: typeof maybeAuthority.notes === "string" ? maybeAuthority.notes : "",
      };
    }
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const maybeSystem = raw as Partial<StructuredSystemAnswer>;
    if ("system_type" in maybeSystem || "details" in maybeSystem) {
      return {
        system_type: typeof maybeSystem.system_type === "string" ? maybeSystem.system_type : "",
        details: typeof maybeSystem.details === "string" ? maybeSystem.details : "",
      };
    }
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const maybeValidity = raw as Partial<StructuredValidityAnswer>;
    if ("duration_value" in maybeValidity || "duration_unit" in maybeValidity || "shorter_conditions" in maybeValidity) {
      return {
        duration_value: typeof maybeValidity.duration_value === "string" ? maybeValidity.duration_value : "",
        duration_unit: typeof maybeValidity.duration_unit === "string" ? maybeValidity.duration_unit : "",
        shorter_conditions: typeof maybeValidity.shorter_conditions === "string" ? maybeValidity.shorter_conditions : "",
      };
    }
  }

  if (
    Array.isArray(raw) &&
    raw.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as QuestionnaireSuggestionItem).title === "string" &&
        typeof (item as QuestionnaireSuggestionItem).framework_name === "string" &&
        typeof (item as QuestionnaireSuggestionItem).reference_number === "string" &&
        typeof (item as QuestionnaireSuggestionItem).source_type === "string",
    )
  ) {
    return raw as QuestionnaireSuggestionItem[];
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const maybeLocation = raw as Partial<StructuredLocationAnswer>;
    if ("country" in maybeLocation || "region" in maybeLocation || "city" in maybeLocation) {
      return {
        country: typeof maybeLocation.country === "string" ? maybeLocation.country : "",
        region: typeof maybeLocation.region === "string" ? maybeLocation.region : "",
        city: typeof maybeLocation.city === "string" ? maybeLocation.city : "",
      };
    }
  }

  if (questionType === "boolean") return typeof raw === "boolean" ? raw : null;

  if (questionType === "multi_select") {
    if (isStringArray(raw)) return raw;
    if (typeof raw === "string" && raw.trim()) {
      return raw
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  if (typeof raw === "string") return raw;
  return "";
};

const createEmptyLocation = (): StructuredLocationAnswer => ({
  country: "",
  region: "",
  city: "",
});

const createEmptyRole = (): StructuredRoleEntry => ({
  title: "",
  seniority: "",
  affiliation: "",
});

const createEmptyOversightAnswer = (): StructuredOversightAnswer => ({
  has_role: "",
  role_title: "",
});

const createEmptyAuthorityAnswer = (): StructuredAuthorityAnswer => ({
  authority_model: "",
  notes: "",
});

const createEmptySystemAnswer = (): StructuredSystemAnswer => ({
  system_type: "",
  details: "",
});

const createEmptyValidityAnswer = (): StructuredValidityAnswer => ({
  duration_value: "",
  duration_unit: "",
  shorter_conditions: "",
});

const createEmptyZoneEntry = (): StructuredZoneEntry => ({
  zone_type: "",
  marking_method: "",
});

const isSuggestionArray = (value: unknown): value is QuestionnaireSuggestionItem[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      Boolean(
        item &&
          typeof item === "object" &&
          typeof (item as QuestionnaireSuggestionItem).title === "string" &&
          typeof (item as QuestionnaireSuggestionItem).framework_name === "string" &&
          typeof (item as QuestionnaireSuggestionItem).reference_number === "string" &&
          typeof (item as QuestionnaireSuggestionItem).source_type === "string",
      ),
  );

const isRoleEntryArray = (value: unknown): value is StructuredRoleEntry[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      Boolean(
        item &&
          typeof item === "object" &&
          typeof (item as StructuredRoleEntry).title === "string" &&
          typeof (item as StructuredRoleEntry).seniority === "string" &&
          typeof (item as StructuredRoleEntry).affiliation === "string",
      ),
  );

const isZoneEntryArray = (value: unknown): value is StructuredZoneEntry[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      Boolean(
        item &&
          typeof item === "object" &&
          typeof (item as StructuredZoneEntry).zone_type === "string" &&
          typeof (item as StructuredZoneEntry).marking_method === "string",
      ),
  );

const formatSuggestionPillLabel = (item: QuestionnaireSuggestionItem) => {
  const parts = [item.reference_number, item.framework_name || item.title].filter(Boolean);
  return parts.join(" ");
};

const hasAnswerValue = (value: AnswerValue) => {
  if (value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") {
    return Object.values(value).some((entry) => typeof entry === "string" && entry.trim().length > 0);
  }
  return false;
};

const splitQuestionText = (label: string) => {
  const trimmed = label.trim();
  const questionEndIndex = trimmed.indexOf("?");

  if (questionEndIndex === -1 || questionEndIndex === trimmed.length - 1) {
    return { primary: trimmed, secondary: "" };
  }

  return {
    primary: trimmed.slice(0, questionEndIndex + 1).trim(),
    secondary: trimmed.slice(questionEndIndex + 1).trim(),
  };
};

export default function DocumentQuestionnaireClient({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [groups, setGroups] = useState<QuestionGroupRecord[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [questionActionState, setQuestionActionState] = useState<Record<string, QuestionActionState>>({});
  const [pendingSuggestionText, setPendingSuggestionText] = useState<PendingSuggestionState>({});
  const [openQuestionIds, setOpenQuestionIds] = useState<Record<string, boolean>>({});
  const [contentPaneHeight, setContentPaneHeight] = useState<number | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const menuPaneRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const user = await ensurePortalSupabaseUser();
        if (!user) {
          window.location.assign(`/login?returnTo=${encodeURIComponent(`/dashboard/document-builder/${documentId}/questions`)}`);
          return;
        }

        const projectResult = await supabaseBrowser
          .schema("docbuilder")
          .from("document_projects")
          .select("id,title,description,status,document_type_version_id")
          .eq("id", documentId)
          .single();

        if (projectResult.error) {
          setError(projectResult.error.message || "Unable to load this document project.");
          return;
        }

        const resolvedProject = projectResult.data as ProjectRecord;
        setProject(resolvedProject);

        const [groupsResult, answersResult] = await Promise.all([
          supabaseBrowser
            .schema("docbuilder")
            .from("document_question_groups")
            .select(
              "id,key,title,description,order_index,document_questions(id,key,label,help_text,question_type,placeholder,is_required,order_index,options)",
            )
            .eq("document_type_version_id", resolvedProject.document_type_version_id)
            .order("order_index", { ascending: true }),
          supabaseBrowser
            .schema("docbuilder")
            .from("document_answers")
            .select("question_id,answer,updated_at")
            .eq("document_project_id", documentId),
        ]);

        if (groupsResult.error || answersResult.error) {
          setError(groupsResult.error?.message || answersResult.error?.message || "Unable to load the questionnaire.");
          return;
        }

        const nextGroups = ((groupsResult.data ?? []) as QuestionGroupRecord[]).map((group) => ({
          ...group,
          document_questions: [...(group.document_questions ?? [])].sort((a, b) => a.order_index - b.order_index),
        }));

        const nextAnswers: Record<string, AnswerValue> = {};
        let latestSavedAt: string | null = null;

        ((answersResult.data ?? []) as Array<{ question_id: string; answer: unknown; updated_at?: string | null }>).forEach((row) => {
          const question = nextGroups.flatMap((group) => group.document_questions ?? []).find((item) => item.id === row.question_id);
          if (!question) return;
          nextAnswers[row.question_id] = normaliseAnswer(question.question_type, row.answer);
          if (row.updated_at && (!latestSavedAt || row.updated_at > latestSavedAt)) {
            latestSavedAt = row.updated_at;
          }
        });

        setGroups(nextGroups);
        setAnswers(nextAnswers);
        setLastSavedAt(latestSavedAt);
        setActiveGroupId((current) => current ?? nextGroups[0]?.id ?? null);
        setOpenQuestionIds((current) => {
          if (Object.keys(current).length > 0) return current;
          const firstQuestionId = nextGroups[0]?.document_questions?.[0]?.id;
          return firstQuestionId ? { [firstQuestionId]: true } : {};
        });
      } catch {
        setError("Unable to load the questionnaire.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [documentId]);

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) ?? groups[0] ?? null,
    [activeGroupId, groups],
  );

  const activeQuestions = activeGroup?.document_questions ?? [];
  const activeGroupDescription = activeGroup?.description?.split(" Feeds:")[0]?.trim() ?? "";
  const activeGroupIndex = groups.findIndex((group) => group.id === activeGroup?.id);
  const nextGroup = activeGroupIndex >= 0 ? groups[activeGroupIndex + 1] ?? null : null;

  useLayoutEffect(() => {
    const syncContentPaneHeight = () => {
      const nextHeight = menuPaneRef.current?.offsetHeight ?? null;
      setContentPaneHeight(nextHeight);
    };

    syncContentPaneHeight();

    const observer =
      typeof ResizeObserver !== "undefined" && menuPaneRef.current
        ? new ResizeObserver(() => syncContentPaneHeight())
        : null;

    if (observer && menuPaneRef.current) {
      observer.observe(menuPaneRef.current);
    }

    window.addEventListener("resize", syncContentPaneHeight);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncContentPaneHeight);
    };
  }, [groups, activeGroupId]);

  const handleStringChange = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const handleLocationChange = (questionId: string, field: keyof StructuredLocationAnswer, value: string) => {
    setAnswers((current) => {
      const existing =
        current[questionId] && typeof current[questionId] === "object" && !Array.isArray(current[questionId])
          ? (current[questionId] as StructuredLocationAnswer)
          : createEmptyLocation();

      return {
        ...current,
        [questionId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const handleBooleanChange = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: value === "" ? null : value === "true" }));
  };

  const handleMultiSelectToggle = (questionId: string, option: string, checked: boolean) => {
    setAnswers((current) => {
      const existing = Array.isArray(current[questionId]) ? [...(current[questionId] as string[])] : [];
      const next = checked ? [...new Set([...existing, option])] : existing.filter((item) => item !== option);
      return { ...current, [questionId]: next };
    });
  };

  const generateA6Suggestions = async (questionId: string, questionKey: string) => {
    setQuestionActionState((current) => ({
      ...current,
      [questionId]: { isGenerating: true, error: null },
    }));

    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your session has expired. Refresh and try again.");
      }

      const response = await fetch(
        `/api/portal/document-builder/projects/${documentId}/ai/questionnaire/${questionKey}/suggestions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to generate suggestions.");
      }

      const payload = (await response.json()) as {
        suggestionSet?: {
          suggestions?: QuestionnaireSuggestionItem[];
        };
      };

      setAnswers((current) => ({
        ...current,
        [questionId]: payload.suggestionSet?.suggestions ?? [],
      }));

      setQuestionActionState((current) => ({
        ...current,
        [questionId]: { isGenerating: false, error: null },
      }));
    } catch (generationError) {
      setQuestionActionState((current) => ({
        ...current,
        [questionId]: {
          isGenerating: false,
          error: generationError instanceof Error ? generationError.message : "Unable to generate suggestions.",
        },
      }));
    }
  };

  const removeGeneratedItem = (questionId: string, item: string) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: isSuggestionArray(current[questionId])
        ? (current[questionId] as QuestionnaireSuggestionItem[]).filter((entry) => entry.title !== item)
        : [],
    }));
  };

  const handleRoleEntryChange = (
    questionId: string,
    index: number,
    field: keyof StructuredRoleEntry,
    value: string,
  ) => {
    setAnswers((current) => {
      const existing = isRoleEntryArray(current[questionId]) ? [...(current[questionId] as StructuredRoleEntry[])] : [createEmptyRole()];
      while (existing.length <= index) existing.push(createEmptyRole());
      existing[index] = { ...existing[index], [field]: value };
      return { ...current, [questionId]: existing };
    });
  };

  const addRoleEntry = (questionId: string) => {
    setAnswers((current) => {
      const existing = isRoleEntryArray(current[questionId]) ? [...(current[questionId] as StructuredRoleEntry[])] : [];
      return { ...current, [questionId]: [...existing, createEmptyRole()] };
    });
  };

  const removeRoleEntry = (questionId: string, index: number) => {
    setAnswers((current) => {
      const existing = isRoleEntryArray(current[questionId]) ? [...(current[questionId] as StructuredRoleEntry[])] : [];
      return { ...current, [questionId]: existing.filter((_, itemIndex) => itemIndex !== index) };
    });
  };

  const handleOversightChange = (
    questionId: string,
    field: keyof StructuredOversightAnswer,
    value: string,
  ) => {
    setAnswers((current) => {
      const existing =
        current[questionId] && typeof current[questionId] === "object" && !Array.isArray(current[questionId])
          ? (current[questionId] as StructuredOversightAnswer)
          : createEmptyOversightAnswer();

      return {
        ...current,
        [questionId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const handleAuthorityChange = (
    questionId: string,
    field: keyof StructuredAuthorityAnswer,
    value: string,
  ) => {
    setAnswers((current) => {
      const existing =
        current[questionId] && typeof current[questionId] === "object" && !Array.isArray(current[questionId])
          ? (current[questionId] as StructuredAuthorityAnswer)
          : createEmptyAuthorityAnswer();

      return {
        ...current,
        [questionId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const handleSystemChange = (
    questionId: string,
    field: keyof StructuredSystemAnswer,
    value: string,
  ) => {
    setAnswers((current) => {
      const existing =
        current[questionId] && typeof current[questionId] === "object" && !Array.isArray(current[questionId])
          ? (current[questionId] as StructuredSystemAnswer)
          : createEmptySystemAnswer();

      return {
        ...current,
        [questionId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const handleValidityChange = (
    questionId: string,
    field: keyof StructuredValidityAnswer,
    value: string,
  ) => {
    setAnswers((current) => {
      const existing =
        current[questionId] && typeof current[questionId] === "object" && !Array.isArray(current[questionId])
          ? (current[questionId] as StructuredValidityAnswer)
          : createEmptyValidityAnswer();

      return {
        ...current,
        [questionId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const handleZoneEntryChange = (
    questionId: string,
    index: number,
    field: keyof StructuredZoneEntry,
    value: string,
  ) => {
    setAnswers((current) => {
      const existing = isZoneEntryArray(current[questionId]) ? [...(current[questionId] as StructuredZoneEntry[])] : [createEmptyZoneEntry()];
      while (existing.length <= index) existing.push(createEmptyZoneEntry());
      existing[index] = { ...existing[index], [field]: value };
      return { ...current, [questionId]: existing };
    });
  };

  const addZoneEntry = (questionId: string) => {
    setAnswers((current) => {
      const existing = isZoneEntryArray(current[questionId]) ? [...(current[questionId] as StructuredZoneEntry[])] : [];
      return { ...current, [questionId]: [...existing, createEmptyZoneEntry()] };
    });
  };

  const removeZoneEntry = (questionId: string, index: number) => {
    setAnswers((current) => {
      const existing = isZoneEntryArray(current[questionId]) ? [...(current[questionId] as StructuredZoneEntry[])] : [];
      return { ...current, [questionId]: existing.filter((_, itemIndex) => itemIndex !== index) };
    });
  };

  const handlePendingSuggestionChange = (questionId: string, value: string) => {
    setPendingSuggestionText((current) => ({
      ...current,
      [questionId]: value,
    }));
  };

  const addManualSuggestion = (questionId: string) => {
    const rawValue = pendingSuggestionText[questionId]?.trim();
    if (!rawValue) return;

    const manualItem: QuestionnaireSuggestionItem = {
      title: rawValue,
      framework_name: rawValue,
      reference_number: "",
      source_type: "other",
      jurisdiction_label: "",
      confidence: "low",
    };

    setAnswers((current) => {
      const existing = isSuggestionArray(current[questionId]) ? (current[questionId] as QuestionnaireSuggestionItem[]) : [];
      const alreadyExists = existing.some((entry) => entry.title.toLowerCase() === rawValue.toLowerCase());
      return {
        ...current,
        [questionId]: alreadyExists ? existing : [...existing, manualItem],
      };
    });

    setPendingSuggestionText((current) => ({
      ...current,
      [questionId]: "",
    }));
  };

  const addManualMultiSelectOption = (questionId: string) => {
    const rawValue = pendingSuggestionText[questionId]?.trim();
    if (!rawValue) return;

    setAnswers((current) => {
      const existing = isStringArray(current[questionId]) ? current[questionId] : [];
      const alreadyExists = existing.some((entry) => entry.toLowerCase() === rawValue.toLowerCase());
      return {
        ...current,
        [questionId]: alreadyExists ? existing : [...existing, rawValue],
      };
    });

    setPendingSuggestionText((current) => ({
      ...current,
      [questionId]: "",
    }));
  };

  const toggleQuestionOpen = (questionId: string) => {
    setOpenQuestionIds((current) => {
      const isCurrentlyOpen = Boolean(current[questionId]);
      return isCurrentlyOpen ? {} : { [questionId]: true };
    });
  };

  const saveQuestionnaireAnswers = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const allQuestions = groups.flatMap((group) => group.document_questions ?? []);
      const rows = allQuestions
        .filter((question) => hasAnswerValue(answers[question.id] ?? null))
        .map((question) => ({
          document_project_id: documentId,
          question_id: question.id,
          answer: answers[question.id],
        }));

      const emptyQuestionIds = allQuestions
        .filter((question) => !hasAnswerValue(answers[question.id] ?? null))
        .map((question) => question.id);

      if (emptyQuestionIds.length > 0) {
        const { error: deleteError } = await supabaseBrowser
          .schema("docbuilder")
          .from("document_answers")
          .delete()
          .eq("document_project_id", documentId)
          .in("question_id", emptyQuestionIds);

        if (deleteError) {
          throw new Error(deleteError.message || "Unable to clear removed questionnaire answers.");
        }
      }

      if (rows.length > 0) {
        const { error: upsertError } = await supabaseBrowser
          .schema("docbuilder")
          .from("document_answers")
          .upsert(rows, { onConflict: "document_project_id,question_id" });

        if (upsertError) {
          throw new Error(upsertError.message || "Unable to save questionnaire answers.");
        }
      }

      const savedAt = new Date().toISOString();
      setLastSavedAt(savedAt);
      return true;
    } catch (saveFailure) {
      setSaveError(saveFailure instanceof Error ? saveFailure.message : "Unable to save questionnaire answers.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    const didSave = await saveQuestionnaireAnswers();
    if (!didSave) return;
    router.push(`/dashboard/document-builder/${documentId}`);
  };

  const handleSaveAndContinue = async () => {
    const didSave = await saveQuestionnaireAnswers();
    if (!didSave) return;

    if (!nextGroup) {
      setIsGeneratingDocument(true);
      router.push(`/dashboard/document-builder/${documentId}/generate`);
      return;
    }

    setActiveGroupId(nextGroup.id);
    const firstQuestionId = nextGroup.document_questions?.[0]?.id;
    setOpenQuestionIds(firstQuestionId ? { [firstQuestionId]: true } : {});
  };

  const renderPillSelector = (questionId: string, options: string[]) => {
    const selected = Array.isArray(answers[questionId]) ? (answers[questionId] as string[]) : [];

    return (
      <div className={styles.pillGroup}>
        {options.map((option) => {
          const isActive = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              className={`${styles.pill} ${isActive ? styles.pillActive : ""}`}
              onClick={() => handleMultiSelectToggle(questionId, option, !isActive)}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  };

  const renderSingleSelectPills = (
    questionId: string,
    options: string[],
    selectedValue?: string,
    onSelect?: (value: string) => void,
  ) => {
    const selected = selectedValue ?? (typeof answers[questionId] === "string" ? (answers[questionId] as string) : "");

    return (
      <div className={styles.pillGroup}>
        {options.map((option) => {
          const isActive = selected === option;
          return (
            <button
              key={option}
              type="button"
              className={`${styles.pill} ${isActive ? styles.pillActive : ""}`}
              onClick={() => {
                const nextValue = isActive ? "" : option;
                if (onSelect) {
                  onSelect(nextValue);
                  return;
                }
                handleStringChange(questionId, nextValue);
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  };

  const renderQuestionField = (question: QuestionRecord) => {
    const value = answers[question.id] ?? normaliseAnswer(question.question_type, null);
    const optionList = Array.isArray(question.options?.items) ? question.options.items : [];

    if (question.key === "A2") {
      return (
        <input
          className={styles.input}
          type="text"
          placeholder={question.placeholder ?? "Enter the project name and location"}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleStringChange(question.id, event.target.value)}
        />
      );
    }

    if (question.key === "A3") {
      return renderPillSelector(question.id, A3_OPTIONS);
    }

    if (question.key === "C1") {
      const selected = isStringArray(value) ? value : [];
      const defaultOptions = [...new Set(C1_OPTIONS)];
      const customSelected = selected.filter(
        (item) => !defaultOptions.some((option) => option.toLowerCase() === item.toLowerCase()),
      );

      return (
        <div className={styles.structuredStack}>
          {renderPillSelector(question.id, defaultOptions)}
          {customSelected.length > 0 ? (
            <div className={styles.generatedBox}>
              <div className={styles.generatedList}>
                {customSelected.map((item) => (
                  <div key={`${question.id}:${item}`} className={styles.generatedItem}>
                    <span>{item}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${item}`}
                      className={styles.removeItem}
                      onClick={() => handleMultiSelectToggle(question.id, item, false)}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className={styles.manualSuggestionRow}>
            <input
              type="text"
              className={styles.manualSuggestionInput}
              placeholder="Add another high-risk work category"
              value={pendingSuggestionText[question.id] ?? ""}
              onChange={(event) => handlePendingSuggestionChange(question.id, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addManualMultiSelectOption(question.id);
                }
              }}
            />
            <button
              type="button"
              className={styles.manualSuggestionAdd}
              aria-label="Add high-risk work category"
              onClick={() => addManualMultiSelectOption(question.id)}
            >
              +
            </button>
          </div>
        </div>
      );
    }

    if (question.key === "A4") {
      const structuredValue =
        value && typeof value === "object" && !Array.isArray(value) ? (value as StructuredLocationAnswer) : createEmptyLocation();

      return (
        <div className={styles.locationGrid}>
          <input
            className={styles.input}
            type="text"
            placeholder="Country"
            value={structuredValue.country}
            onChange={(event) => handleLocationChange(question.id, "country", event.target.value)}
          />
          <input
            className={styles.input}
            type="text"
            placeholder="State / Region"
            value={structuredValue.region}
            onChange={(event) => handleLocationChange(question.id, "region", event.target.value)}
          />
          <input
            className={styles.input}
            type="text"
            placeholder="City / Jurisdiction"
            value={structuredValue.city}
            onChange={(event) => handleLocationChange(question.id, "city", event.target.value)}
          />
        </div>
      );
    }

    if (question.key === "A5") {
      return (
        <input
          className={styles.input}
          type="text"
          placeholder={question.placeholder ?? "Enter the regulator name"}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleStringChange(question.id, event.target.value)}
        />
      );
    }

    if (question.key === "A6") {
      const items = isSuggestionArray(value) ? value : [];
      const actionState = questionActionState[question.id] ?? { isGenerating: false, error: null };

      return (
        <div className={styles.generateBlock}>
          <div className={styles.generateRow}>
            <button
              type="button"
              className={styles.generateButton}
              onClick={() => void generateA6Suggestions(question.id, question.key)}
              disabled={actionState.isGenerating}
            >
              {actionState.isGenerating ? "Generating..." : "Generate Suggestions"}
            </button>
            <span className={styles.generateHint}>Build draft legislation items from the selected location and regulator.</span>
          </div>

          <div className={styles.generatedBox}>
            <div className={styles.generatedList}>
              {items.length === 0 ? (
                <span className={styles.generateHint}>Press the Generate Suggestions button to create reference items.</span>
              ) : (
                items.map((item) => (
                  <div key={`${item.source_type}:${item.title}`} className={styles.generatedItem}>
                    <span>{formatSuggestionPillLabel(item)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${formatSuggestionPillLabel(item)}`}
                      className={styles.removeItem}
                      onClick={() => removeGeneratedItem(question.id, item.title)}
                    >
                      x
                    </button>
                  </div>
                ))
              )}
              <div className={styles.manualSuggestionRow}>
                <input
                  type="text"
                  className={styles.manualSuggestionInput}
                  placeholder="Add your own reference"
                  value={pendingSuggestionText[question.id] ?? ""}
                  onChange={(event) => handlePendingSuggestionChange(question.id, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addManualSuggestion(question.id);
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.manualSuggestionAdd}
                  aria-label="Add reference"
                  onClick={() => addManualSuggestion(question.id)}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          {actionState.error ? <div className={styles.inlineError}>{actionState.error}</div> : null}
        </div>
      );
    }

    if (question.key === "A7") {
      return renderPillSelector(question.id, A7_OPTIONS);
    }

    if (question.key === "B1") {
      const roleEntries = isRoleEntryArray(value) ? value : [createEmptyRole()];

      return (
        <div className={styles.roleBuilder}>
          {roleEntries.map((entry, index) => (
            <div key={`${question.id}-role-${index}`} className={styles.roleRow}>
              <input
                className={styles.input}
                type="text"
                placeholder="Role title"
                value={entry.title}
                onChange={(event) => handleRoleEntryChange(question.id, index, "title", event.target.value)}
              />
              <select
                className={styles.select}
                value={entry.seniority}
                onChange={(event) => handleRoleEntryChange(question.id, index, "seniority", event.target.value)}
              >
                <option value="">Select hierarchy level</option>
                {ROLE_LEVEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className={styles.select}
                value={entry.affiliation}
                onChange={(event) => handleRoleEntryChange(question.id, index, "affiliation", event.target.value)}
              >
                <option value="">Select company / contractor</option>
                {ROLE_AFFILIATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.roleRemoveButton}
                onClick={() => removeRoleEntry(question.id, index)}
                disabled={roleEntries.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className={styles.roleAddButton} onClick={() => addRoleEntry(question.id)}>
            + Add role
          </button>
        </div>
      );
    }

    if (question.key === "B2") {
      const rolesQuestion = activeQuestions.find((item) => item.key === "B1");
      const roleOptions = rolesQuestion && isRoleEntryArray(answers[rolesQuestion.id])
        ? (answers[rolesQuestion.id] as StructuredRoleEntry[])
            .map((entry) => entry.title.trim())
            .filter(Boolean)
        : [];

      return roleOptions.length > 0 ? (
        renderSingleSelectPills(question.id, roleOptions)
      ) : (
        <span className={styles.generateHint}>Add role titles in B1 first so they can be selected here.</span>
      );
    }

    if (question.key === "B3") {
      const structuredValue =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as StructuredOversightAnswer)
          : createEmptyOversightAnswer();
      const rolesQuestion = activeQuestions.find((item) => item.key === "B1");
      const roleOptions = rolesQuestion && isRoleEntryArray(answers[rolesQuestion.id])
        ? (answers[rolesQuestion.id] as StructuredRoleEntry[])
            .map((entry) => entry.title.trim())
            .filter(Boolean)
        : [];

      return (
        <div className={styles.structuredStack}>
          {renderSingleSelectPills(
            question.id,
            B3_ROLE_OPTIONS,
            structuredValue.has_role,
            (nextValue) => handleOversightChange(question.id, "has_role", nextValue),
          )}
          {structuredValue.has_role === "Yes" || structuredValue.has_role === "Depends on work scope" ? (
            roleOptions.length > 0 ? (
              renderSingleSelectPills(
                question.id,
                roleOptions,
                structuredValue.role_title,
                (nextValue) => handleOversightChange(question.id, "role_title", nextValue),
              )
            ) : (
              <span className={styles.generateHint}>Add role titles in B1 first so they can be selected here.</span>
            )
          ) : null}
        </div>
      );
    }

    if (question.key === "B4") {
      const structuredValue =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as StructuredAuthorityAnswer)
          : createEmptyAuthorityAnswer();

      return (
        <div className={styles.structuredStack}>
          <select
            className={styles.select}
            value={structuredValue.authority_model}
            onChange={(event) => handleAuthorityChange(question.id, "authority_model", event.target.value)}
          >
            <option value="">Select permit authority model</option>
            {B4_AUTHORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="Add any clarifying notes about how authority is assigned and communicated."
            value={structuredValue.notes}
            onChange={(event) => handleAuthorityChange(question.id, "notes", event.target.value)}
          />
        </div>
      );
    }

    if (question.key === "B5") {
      return (
        <input
          className={styles.input}
          type="text"
          placeholder={question.placeholder ?? "Enter the HSEC function or role title"}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleStringChange(question.id, event.target.value)}
        />
      );
    }

    if (question.key === "C2") {
      const structuredValue =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as StructuredSystemAnswer)
          : createEmptySystemAnswer();

      return (
        <div className={styles.structuredStack}>
          {renderSingleSelectPills(
            question.id,
            C2_OPTIONS,
            structuredValue.system_type,
            (nextValue) => handleSystemChange(question.id, "system_type", nextValue),
          )}
          {structuredValue.system_type ? (
            <input
              className={styles.input}
              type="text"
              placeholder="Add the system name, platform, document number, or other requested detail"
              value={structuredValue.details}
              onChange={(event) => handleSystemChange(question.id, "details", event.target.value)}
            />
          ) : null}
        </div>
      );
    }

    if (question.key === "C3") {
      return renderSingleSelectPills(question.id, C3_OPTIONS);
    }

    if (question.key === "C4") {
      const structuredValue =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as StructuredValidityAnswer)
          : createEmptyValidityAnswer();

      return (
        <div className={styles.structuredStack}>
          <div className={styles.validityRow}>
            <input
              className={styles.input}
              type="number"
              min="0"
              step="1"
              placeholder="Duration"
              value={structuredValue.duration_value}
              onChange={(event) => handleValidityChange(question.id, "duration_value", event.target.value)}
            />
            <select
              className={styles.select}
              value={structuredValue.duration_unit}
              onChange={(event) => handleValidityChange(question.id, "duration_unit", event.target.value)}
            >
              <option value="">Select duration unit</option>
              {C4_DURATION_UNITS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="Add any conditions or examples where the permit duration may need to be shorter."
            value={structuredValue.shorter_conditions}
            onChange={(event) => handleValidityChange(question.id, "shorter_conditions", event.target.value)}
          />
        </div>
      );
    }

    if (question.key === "C5") {
      const zoneEntries = isZoneEntryArray(value) ? value : [createEmptyZoneEntry()];

      return (
        <div className={styles.roleBuilder}>
          {zoneEntries.map((entry, index) => (
            <div key={`${question.id}-zone-${index}`} className={styles.zoneRow}>
              <select
                className={styles.select}
                value={entry.zone_type}
                onChange={(event) => handleZoneEntryChange(question.id, index, "zone_type", event.target.value)}
              >
                <option value="">Select zone or boundary type</option>
                {C5_ZONE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                className={styles.input}
                type="text"
                placeholder="How is it marked, controlled, or communicated?"
                value={entry.marking_method}
                onChange={(event) => handleZoneEntryChange(question.id, index, "marking_method", event.target.value)}
              />
              <button
                type="button"
                className={styles.roleRemoveButton}
                onClick={() => removeZoneEntry(question.id, index)}
                disabled={zoneEntries.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className={styles.roleAddButton} onClick={() => addZoneEntry(question.id)}>
            + Add boundary or zone
          </button>
        </div>
      );
    }

    if (question.question_type === "boolean") {
      return (
        <select
          className={styles.select}
          value={typeof value === "boolean" ? String(value) : ""}
          onChange={(event) => handleBooleanChange(question.id, event.target.value)}
        >
          <option value="">Select an answer</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }

    if (question.question_type === "multi_select" && optionList.length > 0) {
      const selected = isStringArray(value) ? value : [];
      return (
        <div className={styles.checkList}>
          {optionList.map((option) => (
            <label key={option} className={styles.checkRow}>
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(event) => handleMultiSelectToggle(question.id, option, event.target.checked)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    }

    if (question.question_type === "short_text" || question.question_type === "date" || question.question_type === "number") {
      return (
        <input
          className={styles.input}
          type={question.question_type === "date" ? "date" : question.question_type === "number" ? "number" : "text"}
          placeholder={question.placeholder ?? ""}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleStringChange(question.id, event.target.value)}
        />
      );
    }

    if (question.question_type === "single_select" && optionList.length > 0) {
      return (
        <select
          className={styles.select}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleStringChange(question.id, event.target.value)}
        >
          <option value="">Select an answer</option>
          {optionList.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <textarea
        className={styles.textarea}
        rows={5}
        placeholder={question.placeholder ?? "Add your answer here."}
        value={typeof value === "string" ? value : Array.isArray(value) ? value.join("\n") : ""}
        onChange={(event) => handleStringChange(question.id, event.target.value)}
      />
    );
  };

  if (isLoading) {
    return <TableSkeleton rows={8} columns="100%" showToolbar />;
  }

  if (error || !project) {
    return <div className={styles.noticeError}>{error ?? "Unable to load this questionnaire."}</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.workspace}>
        <aside ref={menuPaneRef} className={styles.menuPane}>
          <div className={styles.menuHeader}>
            <h3>Document Sections</h3>
            <p>Select a section to review the related questions.</p>
          </div>

          <div className={styles.menuList}>
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`${styles.menuItem} ${activeGroup?.id === group.id ? styles.menuItemActive : ""}`}
                onClick={() => setActiveGroupId(group.id)}
              >
                <span className={styles.menuKey}>{group.key}</span>
                <span className={styles.menuText}>{group.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className={styles.contentColumn}>
          <section className={styles.contentPane} style={contentPaneHeight ? { height: `${contentPaneHeight}px` } : undefined}>
            {activeGroup ? (
              <>
                <div className={styles.contentHeader}>
                  <h3>{activeGroup.title}</h3>
                  <p>{activeGroupDescription || "Answer the questions below for this section."}</p>
                </div>

                <div className={styles.questionStack}>
                  {activeQuestions.map((question) => (
                    <div key={question.id} className={styles.questionRow}>
                      {(() => {
                        const questionText = splitQuestionText(question.label);
                        const isOpen = Boolean(openQuestionIds[question.id]);
                        const isComplete = hasAnswerValue(answers[question.id] ?? null);

                        return (
                          <>
                            <button
                              type="button"
                              className={styles.questionToggle}
                              onClick={() => toggleQuestionOpen(question.id)}
                              aria-expanded={isOpen}
                            >
                              <div className={styles.questionHeader}>
                                <div className={styles.questionHeaderMain}>
                                  <span className={styles.questionKey}>{question.key}</span>
                                  <span className={styles.questionLabel}>{questionText.primary}</span>
                                </div>
                                {questionText.secondary ? (
                                  <div className={styles.questionSubtext}>{questionText.secondary}</div>
                                ) : null}
                              </div>
                              <span
                                className={`${styles.questionStatus} ${isComplete ? styles.questionStatusComplete : ""}`}
                                aria-hidden="true"
                              >
                                {isComplete ? "✓" : ""}
                              </span>
                            </button>
                            {isOpen ? <div className={styles.fieldWrap}>{renderQuestionField(question)}</div> : null}
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>No question groups are available for this document template.</div>
            )}
          </section>

          <div className={styles.footerActions}>
            <div className={styles.footerButtons}>
              <button type="button" className={styles.saveExitButton} onClick={() => void handleSaveAndExit()} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save and exit"}
              </button>
              <button
                type="button"
                className={styles.saveContinueButton}
                onClick={() => void handleSaveAndContinue()}
                disabled={isSaving || isGeneratingDocument}
              >
                {isGeneratingDocument
                  ? "Saving and generating..."
                  : isSaving
                    ? "Saving..."
                    : nextGroup
                      ? "Save and continue"
                      : "Save and generate"}
              </button>
            </div>
            <div className={styles.saveMeta}>
              <span>Last saved: {formatSavedAt(lastSavedAt)}</span>
              {saveError ? <span className={styles.saveError}>{saveError}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
