"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type QuestionRow = {
  id: string;
  prompt: string;
  module?: string | null;
  criteria?: string | null;
  module_id?: string | null;
  criteria_id?: string | null;
  domain_id?: string | null;
  type: string | null;
  required: boolean | null;
  order_index: number | null;
};

type ResponseRow = {
  question_id: string;
  rating: number | null;
};

type ModuleRow = {
  id: string;
  name: string;
  position: number;
};

type ModuleScore = {
  label: string;
  percent: number;
  average: number;
  level: Level;
  maturityLabel: string;
  answered: number;
  total: number;
  criteriaScores: Array<{
    name: string;
    percent: number;
    level: Level;
    maturityLabel: string;
  }>;
};

type Level = "reactive" | "proactive" | "resilient";

type ModuleKey =
  | "leadership_accountability"
  | "decision_rights_governance"
  | "legal_risk_governance";

type ModuleNarratives = {
  name: string;
  narratives: Record<Level, string>;
};

type SurveyNarrativesConfig = {
  modules: Record<ModuleKey, ModuleNarratives>;
  overall: Record<Level, string>;
};

const surveyNarratives: SurveyNarrativesConfig = {
  modules: {
    leadership_accountability: {
      name: "Leadership & Accountability",
      narratives: {
        reactive:
          "Leadership intent for safety is expressed as general values rather than decision rules. Expectations for leaders and supervisors are not consistently defined, and safety is often treated as a compliance or reporting function rather than a driver of operational decisions. Accountability is primarily measured through lag indicators and audit outcomes. Ownership of system weaknesses and control performance is unclear. Leadership involvement in safety is more visible after incidents or during audits than during planning and resourcing.",
        proactive:
          "Leadership intent is more clearly defined and is increasingly referenced in planning, approvals, and resourcing decisions. Expectations for leaders are written into responsibilities and routines, though application varies across teams. Accountability extends beyond injury rates to include ownership of controls and system performance. Leaders participate in risk discussions and review control health more regularly. Follow-through on actions and system improvements is more visible but not yet consistent across the organisation.",
        resilient:
          "Leadership intent is operational and decision-based, with clear non-negotiables applied consistently across teams and contractors. Leaders are accountable for control integrity, system performance, and learning outcomes. Safety is embedded into planning, work design, and operational decision forums. Leaders actively verify control health, invite challenge, and use risk information to shape priorities and resourcing. Accountability is predictable, evidence-based, and focused on improving how work is decided and controlled.",
      },
    },
    decision_rights_governance: {
      name: "Decision Rights & Governance Structure",
      narratives: {
        reactive:
          "Decision rights for high-risk work are unclear, inconsistently applied, or poorly understood. Stop-work authority exists in policy but is rarely exercised in practice. Approvals and escalations are often influenced by urgency, hierarchy, or relationships rather than defined criteria. Governance forums focus on reporting, incidents, or compliance rather than real-time risk and control performance. Actions are recorded but closure and follow-through are inconsistent.",
        proactive:
          "Decision rights are formally defined and generally understood by leaders and supervisors. Approval, escalation, and stop-work roles are clearer, particularly for high-risk tasks. Governance forums have clearer purpose and increasingly focus on high-risk activities, controls, and trends. Action tracking and closure are more disciplined. Escalation is becoming more accepted, though still uneven under pressure.",
        resilient:
          "Decision rights are clearly defined, widely understood, and consistently applied across sites and contractors. Stop-work and escalation pathways function effectively under pressure. Governance forums actively shape priorities, resourcing, and control strategies using frontline and system data. Information flows effectively between frontline and leadership, and decision rules are regularly reviewed and improved based on experience and learning.",
      },
    },
    legal_risk_governance: {
      name: "Legal & Risk Governance",
      narratives: {
        reactive:
          "A legal register exists but is treated as a compliance artefact rather than an operational tool. Legal duties are not clearly mapped to controls, procedures, or accountable roles. Risk appetite is informal or implicit, and similar risks may be treated differently depending on circumstances. Legal compliance and risk boundaries are experienced as paperwork rather than as decision-making tools.",
        proactive:
          "Legal duties are increasingly mapped to controls, procedures, and roles. The legal register is more current and referenced in high-risk work planning. A documented risk appetite exists and is sometimes referenced in approvals and governance forums. Risk acceptance is more often documented, though rationale and application still vary between areas.",
        resilient:
          "Legal duties are systematically translated into critical controls, procedures, and accountable roles. The legal register is a live governance tool that informs risk priorities and control design. Risk appetite is clearly defined, operationalised, and consistently applied in planning, approvals, and resourcing. Decisions can be clearly justified to regulators and stakeholders through visible links between legal duties, controls, and risk boundaries.",
      },
    },
  },
  overall: {
    reactive:
      "Safety governance across the organisation is fragmented and relies heavily on individuals rather than a coherent system. Leadership intent, decision rights, and legal obligations exist but are not consistently translated into how work is planned, approved, and controlled. Decisions under pressure are influenced more by urgency or experience than by defined risk boundaries and control verification. Governance forums and leadership routines tend to respond to events rather than shape work in advance. Legal and risk requirements are present but operate as compliance artefacts rather than as practical decision tools. As a result, safety performance depends on personal capability and local effort rather than predictable, system-driven behaviours.",
    proactive:
      "The organisation has established many of the structures required for effective safety governance. Leadership intent is clearer, decision rights are more defined, and legal and risk requirements are increasingly linked to controls and planning. Governance forums are becoming more purposeful, and leaders are more engaged with risk and control performance. However, application is still uneven across teams and locations, and the system relies on capable individuals to maintain momentum. Safety governance is moving from compliance-driven to decision-driven, but has not yet become fully consistent or self-sustaining.",
    resilient:
      "Safety governance is fully integrated into how the organisation designs, decides, and delivers work. Leadership intent, decision rights, and legal and risk boundaries operate together as a coherent system that guides decisions at all levels. Governance forums actively shape priorities and resourcing based on risk and control performance. Legal duties are visibly translated into operational controls, and risk appetite is consistently applied in planning and approvals. The system is self-sustaining, evidence-based, and continuously improving, with predictable decision-making even under pressure.",
  },
};

const toLevel = (score: number): Level => {
  if (score <= 39) return "reactive";
  if (score <= 69) return "proactive";
  return "resilient";
};

const getSurveyFeedback = (modulePercents: number[]) => {
  const moduleKeys: ModuleKey[] = [
    "leadership_accountability",
    "decision_rights_governance",
    "legal_risk_governance",
  ];
  const moduleLevels = modulePercents.map((percent) => toLevel(percent));
  const overallLevel = toLevel(
    modulePercents.reduce((sum, value) => sum + value, 0) / modulePercents.length
  );
  return {
    overallLevel,
    overallNarrative: surveyNarratives.overall[overallLevel],
    perModule: moduleKeys.reduce((acc, key, index) => {
      const level = moduleLevels[index] ?? "reactive";
      acc[key] = {
        level,
        narrative: surveyNarratives.modules[key].narratives[level],
      };
      return acc;
    }, {} as Record<ModuleKey, { level: Level; narrative: string }>),
  };
};

const formatPercent = (value: number) => Math.round(value);
const levelToLabel = (level: Level) =>
  level === "reactive" ? "Reactive" : level === "proactive" ? "Proactive" : "Resilient";

export default function ThankYouClient() {
  const searchParams = useSearchParams();
  const [codeId, setCodeId] = useState(searchParams.get("code_id") ?? "");
  const [questionSetId, setQuestionSetId] = useState(
    searchParams.get("question_set_id") ?? ""
  );
  const [diagnosticId, setDiagnosticId] = useState(searchParams.get("diagnostic_id") ?? "");
  const [diagnosticName, setDiagnosticName] = useState(
    searchParams.get("diagnostic_name") ?? "Management System Diagnostic"
  );
  const [domainName, setDomainName] = useState(
    searchParams.get("domain_name") ?? "Diagnostic"
  );
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [criteriaMap, setCriteriaMap] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessCode, setAccessCode] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [assignedEmail, setAssignedEmail] = useState<string | null>(null);
  const [showEmailField, setShowEmailField] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  useEffect(() => {
    if (codeId && questionSetId) return;
    try {
      const stored = sessionStorage.getItem("diagnostic_thank_you");
      if (!stored) return;
      const parsed = JSON.parse(stored) as {
        code_id?: string;
        question_set_id?: string;
        diagnostic_name?: string;
        domain_name?: string;
        diagnostic_id?: string;
      };
      if (!codeId && parsed.code_id) setCodeId(parsed.code_id);
      if (!questionSetId && parsed.question_set_id) setQuestionSetId(parsed.question_set_id);
      if (!diagnosticId && parsed.diagnostic_id) setDiagnosticId(parsed.diagnostic_id);
      if (parsed.diagnostic_name) setDiagnosticName(parsed.diagnostic_name);
      if (parsed.domain_name) setDomainName(parsed.domain_name);
    } catch {
      // Ignore storage issues.
    }
  }, [codeId, questionSetId, diagnosticId]);

  const handleLookup = async () => {
    const trimmed = accessCode.trim();
    if (!trimmed) {
      setLookupError("Please enter your access code.");
      return;
    }

    try {
      setLookupError(null);
      setIsLookupLoading(true);
      const response = await fetch("/api/public/diagnostic-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      if (!response.ok) {
        const message = await response.text();
        setLookupError(message || "We could not find that access code.");
        return;
      }

      const payload = (await response.json()) as {
        code_id: string;
        question_set_id: string | null;
        diagnostic_name: string | null;
        domain_name: string | null;
        diagnostic_id: string | null;
      };

      setError(null);
      setCodeId(payload.code_id ?? "");
      setQuestionSetId(payload.question_set_id ?? "");
      setDiagnosticId(payload.diagnostic_id ?? "");
      if (payload.diagnostic_name) setDiagnosticName(payload.diagnostic_name);
      if (payload.domain_name) setDomainName(payload.domain_name);
      try {
        sessionStorage.setItem(
          "diagnostic_thank_you",
          JSON.stringify({
            code_id: payload.code_id ?? "",
            question_set_id: payload.question_set_id ?? "",
            diagnostic_name: payload.diagnostic_name ?? "",
            domain_name: payload.domain_name ?? "",
            diagnostic_id: payload.diagnostic_id ?? "",
          })
        );
      } catch {
        // Ignore storage issues.
      }
    } catch {
      setLookupError("We could not load results for that code.");
    } finally {
      setIsLookupLoading(false);
    }
  };

  useEffect(() => {
    const loadResults = async () => {
      const normalizedCodeId = codeId.trim();
      const normalizedQuestionSetId = questionSetId.trim();
      if (!normalizedCodeId || !normalizedQuestionSetId) {
        setError("Missing response data for this submission.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const modulesQuery =
          diagnosticId.trim().length > 0
            ? `diagnostic_id=${diagnosticId.trim()}`
            : domainName.trim().length > 0
            ? `domain_name=${encodeURIComponent(domainName.trim())}`
            : "";
        const [questionsResponse, responsesResponse, modulesResponse, emailResponse] =
          await Promise.all([
          fetch(`/api/public/question-sets/${normalizedQuestionSetId}`),
          fetch(`/api/public/responses/by-code/${normalizedCodeId}`),
          modulesQuery
            ? fetch(`/api/public/diagnostic-modules?${modulesQuery}`)
            : Promise.resolve(null),
          fetch(`/api/public/diagnostic-results/email?code_id=${normalizedCodeId}`),
        ]);

        if (!questionsResponse.ok) {
          const message = await questionsResponse.text();
          setError(message || "We could not load your questions.");
          return;
        }

        if (!responsesResponse.ok) {
          const message = await responsesResponse.text();
          setError(message || "We could not load your responses.");
          return;
        }

        const questionPayload = (await questionsResponse.json()) as {
          questions: QuestionRow[];
        };
        const responsePayload = (await responsesResponse.json()) as {
          responses: ResponseRow[];
        };
        if (modulesResponse && modulesResponse.ok) {
          const modulePayload = (await modulesResponse.json()) as { modules: ModuleRow[] };
          setModules(modulePayload.modules ?? []);
        }
        if (emailResponse.ok) {
          const emailPayload = (await emailResponse.json()) as { email: string | null };
          setAssignedEmail(emailPayload.email);
          if (emailPayload.email) {
            setEmailInput(emailPayload.email);
          }
        }

        setQuestions(questionPayload.questions ?? []);
        setResponses(responsePayload.responses ?? []);

        const criteriaIds = Array.from(
          new Set(
            (questionPayload.questions ?? [])
              .map((question) => question.criteria_id)
              .filter((id): id is string => Boolean(id))
          )
        );
        if (criteriaIds.length > 0) {
          const criteriaResponse = await fetch(
            `/api/public/diagnostic-criteria?ids=${criteriaIds.join(",")}`
          );
          if (criteriaResponse.ok) {
            const criteriaPayload = (await criteriaResponse.json()) as {
              criteria: Array<{ id: string; name: string }>;
            };
            const nextMap = new Map<string, string>();
            criteriaPayload.criteria.forEach((criteria) => {
              nextMap.set(criteria.id, criteria.name);
            });
            setCriteriaMap(nextMap);
          }
        }
      } catch {
        setError("We could not load your results.");
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [codeId, questionSetId, diagnosticId]);

  const orderedQuestions = useMemo(
    () => [...questions].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [questions]
  );

  const responseMap = useMemo(() => {
    const map = new Map<string, number>();
    responses.forEach((response) => {
      if (typeof response.rating === "number") {
        map.set(response.question_id, response.rating);
      }
    });
    return map;
  }, [responses]);

  const moduleScores = useMemo(() => {
    if (orderedQuestions.length === 0) return [];
    const criteriaMapNames = criteriaMap;
    const labels =
      modules.length >= 3
        ? modules.slice(0, 3).map((module) => module.name)
        : ["Module 1", "Module 2", "Module 3"];
    const labelMap = new Map(
      labels.map((label, index) => [label.trim().toLowerCase(), index])
    );
    const moduleIdMap = new Map(modules.map((module, index) => [module.id, index]));
    const moduleBuckets: QuestionRow[][] = [[], [], []];
    const moduleSize = Math.max(1, Math.ceil(orderedQuestions.length / 3));

    orderedQuestions.forEach((question, index) => {
      let bucketIndex = -1;
      const moduleKey = question.module?.trim().toLowerCase();
      if (moduleKey && labelMap.has(moduleKey)) {
        bucketIndex = labelMap.get(moduleKey) ?? -1;
      } else if (question.module_id && moduleIdMap.has(question.module_id)) {
        bucketIndex = moduleIdMap.get(question.module_id) ?? -1;
      }
      if (bucketIndex < 0) {
        bucketIndex = Math.min(2, Math.floor(index / moduleSize));
      }
      moduleBuckets[bucketIndex].push(question);
    });

    return [0, 1, 2].map((index) => {
      const slice = moduleBuckets[index] ?? [];
      const ratings = slice
        .map((question) => responseMap.get(question.id))
        .filter((value): value is number => typeof value === "number");
      const answered = ratings.length;
      const average =
        ratings.length > 0 ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0;
      const percent = ratings.length > 0 ? (average / 5) * 100 : 0;
      const level = toLevel(percent);
      const criteriaMap = new Map<string, number[]>();
      slice.forEach((question) => {
        const criteriaName =
          (question.criteria_id ? criteriaMapNames.get(question.criteria_id) : undefined) ??
          question.criteria?.trim();
        if (!criteriaName) return;
        const rating = responseMap.get(question.id);
        if (typeof rating !== "number") return;
        if (!criteriaMap.has(criteriaName)) {
          criteriaMap.set(criteriaName, []);
        }
        criteriaMap.get(criteriaName)?.push(rating);
      });
      const criteriaScores = Array.from(criteriaMap.entries()).map(([name, values]) => {
        const avg =
          values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
        const pct = values.length > 0 ? (avg / 5) * 100 : 0;
        const criteriaLevel = toLevel(pct);
        return {
          name,
          percent: pct,
          level: criteriaLevel,
          maturityLabel: levelToLabel(criteriaLevel),
        };
      });
      return {
        label: labels[index],
        percent,
        average,
        level,
        maturityLabel: levelToLabel(level),
        answered,
        total: slice.length,
        criteriaScores,
      };
    });
  }, [orderedQuestions, responseMap, modules, criteriaMap]);

  const overall = useMemo(() => {
    if (moduleScores.length === 0) return null;
    const allAnswered = moduleScores.reduce((sum, module) => sum + module.answered, 0);
    const totalQuestions = moduleScores.reduce((sum, module) => sum + module.total, 0);
    const totalPercent =
      moduleScores.reduce((sum, module) => sum + module.percent, 0) / moduleScores.length;
    const average =
      moduleScores.reduce((sum, module) => sum + module.average, 0) / moduleScores.length;
    const overallLevel = toLevel(totalPercent);
    return {
      percent: totalPercent,
      average,
      level: overallLevel,
      maturityLabel: levelToLabel(overallLevel),
      answered: allAnswered,
      total: totalQuestions,
    };
  }, [moduleScores]);

  const feedback = useMemo(() => {
    if (moduleScores.length === 0) return null;
    return getSurveyFeedback(moduleScores.map((module) => module.percent));
  }, [moduleScores]);

  const emailHref = useMemo(() => {
    if (!overall || !feedback) return "";
    const moduleLines = moduleScores.map((module, index) => {
      const moduleKeys: ModuleKey[] = [
        "leadership_accountability",
        "decision_rights_governance",
        "legal_risk_governance",
      ];
      const key = moduleKeys[index];
      const level = feedback.perModule[key]?.level ?? "reactive";
      const label = module.label;
      return `${label}: ${formatPercent(module.percent)}% (${level})`;
    });
    const body = [
      `${domainName} diagnostic results`,
      "",
      `Overall: ${formatPercent(overall.percent)}% (${feedback.overallLevel})`,
      "",
      "Module scores:",
      ...moduleLines,
      "",
      "Narrative summary:",
      feedback.overallNarrative,
    ].join("\n");
    const subject = `${domainName} diagnostic results`;
    return { subject, body };
  }, [domainName, feedback, moduleScores, overall]);

  const sendEmail = async (targetEmail: string) => {
    if (!emailHref || !feedback || !overall) return;
    try {
      setEmailStatus("sending");
      setEmailError(null);
      setSentEmail(null);
      const response = await fetch("/api/public/diagnostic-results/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code_id: codeId,
          email: targetEmail,
          subject: emailHref.subject,
          body: emailHref.body,
        }),
      });
      if (!response.ok) {
        const message = await response.text();
        setEmailStatus("error");
        setEmailError(message || "We could not send that email.");
        return;
      }
      setEmailStatus("sent");
      setSentEmail(targetEmail);
    } catch {
      setEmailStatus("error");
      setEmailError("We could not send that email.");
    }
  };

  if (isLoading) {
    return (
      <div className="diagnostic-access-card">
        <p className="diagnostic-access-domain">Submission complete</p>
        <h1>Loading your results...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diagnostic-access-card">
        <p className="diagnostic-access-domain">Submission complete</p>
        <h1>Thank you for your responses.</h1>
        <p className="diagnostic-access-error">{error}</p>
        <div className="diagnostic-results-lookup">
          <p className="diagnostic-results-label">Results not loading?</p>
          <p className="diagnostic-access-subtitle">
            Re-enter your access code to load your results.
          </p>
          <label className="diagnostic-access-input">
            <span className="sr-only">Access code</span>
            <input
              className="diagnostic-access-underline"
              type="text"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Enter access code"
            />
          </label>
          {lookupError && <p className="diagnostic-access-error">{lookupError}</p>}
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleLookup}
            disabled={isLookupLoading}
          >
            {isLookupLoading ? "Loading results..." : "Load results"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="diagnostic-access-card">
      <p className="diagnostic-access-domain">{diagnosticName}</p>
      <h1>{domainName} diagnostic results</h1>
      {overall && (
        <>
          <p className="diagnostic-results-meta">
            {overall.answered} of {overall.total} questions answered
          </p>
          <p
            className="diagnostic-access-subtitle diagnostic-results-intro"
            style={{ marginTop: "10px" }}
          >
            Thanks for completing the diagnostic. Below is a snapshot of your responses and
            maturity level across each module.
          </p>
          <div className="diagnostic-results-legend">
            <span className="legend-item level-reactive">Reactive</span>
            <span className="legend-item level-proactive">Proactive</span>
            <span className="legend-item level-resilient">Resilient</span>
          </div>
          <div className="diagnostic-results-summary">
            <div className="diagnostic-results-summary-content">
              <p className="diagnostic-results-label">Overall maturity</p>
              <h2>{overall.maturityLabel}</h2>
              {feedback && (
                <p className="diagnostic-results-narrative">{feedback.overallNarrative}</p>
              )}
            </div>
            <div className="diagnostic-results-score">
              <span className={`diagnostic-results-percent-text level-${overall.level}`}>
                {formatPercent(overall.percent)}%
              </span>
              <p>Average score</p>
            </div>
          </div>
        </>
      )}

      <div className="diagnostic-results-grid">
        {moduleScores.map((module, index) => {
          const moduleKeys: ModuleKey[] = [
            "leadership_accountability",
            "decision_rights_governance",
            "legal_risk_governance",
          ];
          const key = moduleKeys[index];
          const narrative = feedback?.perModule[key]?.narrative;
          return (
          <div key={module.label} className="diagnostic-results-card">
            <div className="diagnostic-results-card-header">
              <p>{module.label}</p>
              <span className={`diagnostic-results-pill level-${module.level}`}>
                {module.maturityLabel}
              </span>
            </div>
            <div
              className={`diagnostic-results-percent level-${module.level}`}
            >
              {formatPercent(module.percent)}%
            </div>
            <div className="diagnostic-results-bar">
              <span
                className={`level-${module.level}`}
                style={{ width: `${module.percent}%` }}
              />
            </div>
            <p className="diagnostic-results-meta">
              {module.answered} of {module.total} questions answered
            </p>
            {narrative && <p className="diagnostic-results-narrative">{narrative}</p>}
          </div>
        );
        })}
      </div>
      {moduleScores.some((module) => module.criteriaScores.length > 0) && (
        <div className="diagnostic-results-criteria-row">
          {moduleScores.map((module) => (
            <div key={module.label} className="diagnostic-results-criteria-card">
              <p className="diagnostic-results-criteria-title">Criteria scores</p>
              {module.criteriaScores.length > 0 ? (
                <div className="diagnostic-results-criteria-list">
                  {module.criteriaScores.map((criteria) => (
                    <div key={criteria.name} className="diagnostic-results-criteria-item">
                      <span className="criteria-name">{criteria.name}</span>
                      <span className={`criteria-score level-${criteria.level}`}>
                        {formatPercent(criteria.percent)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="diagnostic-results-criteria-empty">No criteria scores available.</p>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="diagnostic-results-footer">
            <div className="diagnostic-results-actions">
              <a className="btn btn-outline" href="https://hses.com.au" rel="noopener noreferrer">
                Close this page
              </a>
              {emailHref && (
                <div className="diagnostic-results-email">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => {
                      if (assignedEmail) {
                        sendEmail(assignedEmail);
                      } else {
                        setEmailError(null);
                        setEmailStatus("idle");
                        setShowEmailField(true);
                      }
                    }}
                    disabled={emailStatus === "sending"}
                  >
                    Email results to myself
                  </button>
                  {!assignedEmail && showEmailField && (
                    <>
                      <input
                        className="diagnostic-access-underline diagnostic-results-email-input"
                        type="email"
                        placeholder="Email address"
                        value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                  />
                      <button
                        className="btn btn-outline diagnostic-results-email-send"
                        type="button"
                        aria-label="Send results email"
                        onClick={() => {
                          const trimmed = emailInput.trim();
                          if (!trimmed || !trimmed.includes("@")) {
                            setEmailError("Enter a valid email address.");
                            setEmailStatus("error");
                            return;
                          }
                          sendEmail(trimmed);
                        }}
                        disabled={emailStatus === "sending"}
                      >
                        <span aria-hidden="true">✈</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            {emailStatus === "sent" && sentEmail && (
              <p className="diagnostic-results-note">Results sent to {sentEmail}.</p>
            )}
            {emailError && <p className="diagnostic-results-note diagnostic-results-error">{emailError}</p>}
            <p className="diagnostic-results-note">
              These results will also be available to the administrator of your diagnostic in the
              dashboard.
            </p>
      </div>
    </div>
  );
}
