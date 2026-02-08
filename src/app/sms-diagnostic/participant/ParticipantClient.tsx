"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ParticipantClientProps = {
  diagnosticId: string;
};

type DiagnosticSession = {
  diagnostic_id: string;
  diagnostic_name: string;
  domain_name: string | null;
  question_set_id: string | null;
  code_id: string;
};

type ModuleRow = {
  name: string;
  position: number;
};

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

export default function ParticipantClient({ diagnosticId }: ParticipantClientProps) {
  const router = useRouter();
  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "backward" | null>(
    null
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [modules, setModules] = useState<ModuleRow[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code") ?? "";
    const identifier = params.get("identifier") ?? "";

    if (!code.trim()) {
      setError("Missing access code.");
      setIsLoading(false);
      return;
    }

    const validate = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/public/diagnostic-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, identifier }),
        });

        if (!response.ok) {
          const message = await response.text();
          setError(message || "We could not validate that code.");
          return;
        }

        const payload = (await response.json()) as DiagnosticSession;
        if (payload.diagnostic_id?.toLowerCase() !== diagnosticId.toLowerCase()) {
          const redirectParams = new URLSearchParams({ code, identifier });
          router.replace(
            `/sms-diagnostic/participant/${payload.diagnostic_id}?${redirectParams.toString()}`
          );
          return;
        }
        setSession(payload);

        if (!payload.question_set_id) {
          setError("This diagnostic does not have a question set configured.");
          return;
        }

        const modulesResponse = await fetch(
          `/api/public/diagnostic-modules?diagnostic_id=${payload.diagnostic_id}`
        );
        if (modulesResponse.ok) {
          const modulePayload = (await modulesResponse.json()) as { modules: ModuleRow[] };
          setModules(modulePayload.modules ?? []);
        }

        setIsQuestionLoading(true);
        const questionResponse = await fetch(
          `/api/public/question-sets/${payload.question_set_id}`
        );
        if (!questionResponse.ok) {
          const message = await questionResponse.text();
          setError(message || "We could not load the questions.");
          return;
        }
        const questionPayload = (await questionResponse.json()) as {
          questions: QuestionRow[];
        };
        setQuestions(questionPayload.questions ?? []);
      } catch (err) {
        setError("We could not validate that code.");
      } finally {
        setIsLoading(false);
        setIsQuestionLoading(false);
      }
    };

    validate();
  }, [diagnosticId]);

  if (isLoading) {
    return <div className="diagnostic-access-card">Loading your diagnostic...</div>;
  }

  if (error) {
    return (
      <div className="diagnostic-access-card">
        <h1>We could not open your diagnostic</h1>
        <p className="diagnostic-access-error">{error}</p>
        <a className="btn btn-outline" href="/sms-diagnostic/access">
          Back to access
        </a>
      </div>
    );
  }

  if (isQuestionLoading) {
    return <div className="diagnostic-access-card">Loading questions...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="diagnostic-access-card">
        <h1>No questions found</h1>
        <p className="diagnostic-access-subtitle">
          This question set does not have any questions yet.
        </p>
      </div>
    );
  }

  const renderQuestionInput = (question: QuestionRow) => {
    const value = answers[question.id] ?? "";
    const type = question.type?.toLowerCase() ?? "text";

    if (type === "rating") {
      return (
        <div className="diagnostic-rating">
          <div className="diagnostic-rating-options">
            {[
              { score: 1, label: "Never" },
              { score: 2, label: "Rarely" },
              { score: 3, label: "Sometimes" },
              { score: 4, label: "Often" },
              { score: 5, label: "Always" },
            ].map(({ score, label }) => (
              <button
                key={score}
                className={`diagnostic-rating-pill ${value === String(score) ? "is-active" : ""}`}
                type="button"
                onClick={async () => {
                  const nextValue = String(score);
                  setAnswers((prev) => ({
                    ...prev,
                    [question.id]: nextValue,
                  }));
                  const saved = await saveCurrentAnswer(
                    {
                    ...question,
                    type: "rating",
                    },
                    nextValue
                  );
                  if (!saved) return;
                  if (activeIndex < totalQuestions - 1) {
                    transitionTo(activeIndex + 1, "forward");
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (type === "boolean" || type === "yes_no") {
      return (
        <div className="diagnostic-access-options">
          {["Yes", "No"].map((option) => (
            <button
              key={option}
              className={`btn btn-outline ${value === option ? "is-active" : ""}`}
              type="button"
              onClick={() =>
                setAnswers((prev) => ({
                  ...prev,
                  [question.id]: option,
                }))
              }
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

    return (
      <label className="diagnostic-access-input">
        <span className="sr-only">Answer</span>
        <textarea
          className="dashboard-textarea"
          rows={3}
          value={value}
          onChange={(event) =>
            setAnswers((prev) => ({
              ...prev,
              [question.id]: event.target.value,
            }))
          }
        />
      </label>
    );
  };

  const orderedQuestions = questions.sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );
  const totalQuestions = orderedQuestions.length;
  const currentQuestion = orderedQuestions[activeIndex];
  const moduleSize = Math.max(1, Math.ceil(totalQuestions / 3));
  const currentModule = Math.min(3, Math.floor(activeIndex / moduleSize) + 1);
  const progressPercent =
    totalQuestions === 0 ? 0 : Math.round(((activeIndex + 1) / totalQuestions) * 100);
  const moduleNames =
    modules.length >= 3
      ? modules.slice(0, 3).map((module) => module.name)
      : ["Module 1", "Module 2", "Module 3"];
  const moduleBreakpoints = [0, moduleSize, moduleSize * 2, totalQuestions];
  const isStepComplete = (stepIndex: number) => activeIndex + 1 >= stepIndex;

  const allRequiredAnswered = (questionList: QuestionRow[]) =>
    questionList.every((question) => {
      if (!question.required) return true;
      const value = answers[question.id]?.trim();
      return Boolean(value);
    });

  const saveCurrentAnswer = async (question: QuestionRow, overrideValue?: string) => {
    if (!session) return false;
    const value = (overrideValue ?? answers[question.id] ?? "").trim();
    if (question.required && !value) {
      setSaveError("Please answer this question before continuing.");
      return false;
    }

    const type = question.type?.toLowerCase() ?? "text";
    const rating =
      type === "rating" && value ? Number.parseInt(value, 10) : null;
    const textAnswer = type === "rating" ? null : value || null;

    try {
      setSaveError(null);
      const response = await fetch("/api/public/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnostic_id: session.diagnostic_id,
          code_id: session.code_id,
          question_id: question.id,
          rating: Number.isNaN(rating as number) ? null : rating,
          text_answer: textAnswer,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        setSaveError(message || "We could not save your response yet.");
        return false;
      }
      return true;
    } catch {
      setSaveError("We could not save your response yet.");
      return false;
    }
  };

  const markCodeRedeemed = async () => {
    if (!session?.code_id) return;
    await fetch("/api/public/diagnostic-codes/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code_id: session.code_id }),
    });
  };

  const transitionTo = (nextIndex: number, direction: "forward" | "backward") => {
    if (nextIndex === activeIndex) return;
    setPreviousIndex(activeIndex);
    setTransitionDirection(direction);
    setActiveIndex(nextIndex);
    setIsAnimating(true);
    window.setTimeout(() => {
      setIsAnimating(false);
      setPreviousIndex(null);
      setTransitionDirection(null);
    }, 320);
  };

  const displayName =
    session?.diagnostic_name === "SMS Diagnostic"
      ? "Safety Management System Diagnostic"
      : session?.diagnostic_name ?? "Diagnostic";

  return (
    <div className="diagnostic-access-card">
      <p className="diagnostic-access-domain">
        {displayName}
      </p>
      <h1>
        {session?.domain_name ? `${session.domain_name} diagnostic` : "Diagnostic assessment"}
      </h1>
      <p className="diagnostic-access-subtitle">
        Answer each question honestly. Your responses are confidential and linked to your access
        code only.
      </p>
      <div className="diagnostic-progress">
        <div className="diagnostic-progress-meta">
          <span>Question {activeIndex + 1} of {totalQuestions}</span>
          <span>Module {currentModule} of 3</span>
        </div>
        <div className="diagnostic-progress-track">
          <div className="diagnostic-progress-bar">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <span className={`diagnostic-progress-step ${isStepComplete(moduleBreakpoints[0] + 1) ? "is-complete" : ""}`} style={{ left: "0%" }}>
            ✓
          </span>
          <span className={`diagnostic-progress-step ${isStepComplete(moduleBreakpoints[1]) ? "is-complete" : ""}`} style={{ left: "33.33%" }}>
            2
          </span>
          <span className={`diagnostic-progress-step ${isStepComplete(moduleBreakpoints[2]) ? "is-complete" : ""}`} style={{ left: "66.66%" }}>
            3
          </span>
          <span className={`diagnostic-progress-step ${isStepComplete(moduleBreakpoints[3]) ? "is-complete" : ""}`} style={{ left: "100%" }}>
            4
          </span>
          <div className="diagnostic-progress-labels">
            <span className="module-1">{moduleNames[0]}</span>
            <span className="module-2">{moduleNames[1]}</span>
            <span className="module-3">{moduleNames[2]}</span>
          </div>
        </div>
      </div>

      {currentQuestion && (
        <div className="diagnostic-question-stage">
          {previousIndex !== null && transitionDirection && (
            <div
              key={`prev-${previousIndex}`}
              className={`diagnostic-question-card diagnostic-question-panel ${
                transitionDirection === "forward" ? "slide-out-left" : "slide-out-right"
              }`}
            >
              <p className="diagnostic-question-index">
                Question {previousIndex + 1}
                {orderedQuestions[previousIndex]?.required ? " *" : ""}
              </p>
              <h2>{orderedQuestions[previousIndex]?.prompt}</h2>
              <p className="diagnostic-question-helper">
                Think about what happens in day-to-day work and choose the response that fits most
                often.
              </p>
              {orderedQuestions[previousIndex]
                ? renderQuestionInput(orderedQuestions[previousIndex])
                : null}
            </div>
          )}
          <div
            key={`current-${activeIndex}`}
            className={`diagnostic-question-card diagnostic-question-panel ${
              isAnimating && transitionDirection === "forward"
                ? "slide-in-right"
                : isAnimating && transitionDirection === "backward"
                ? "slide-in-left"
                : ""
            }`}
          >
            <p className="diagnostic-question-index">
              Question {activeIndex + 1}{currentQuestion.required ? " *" : ""}
            </p>
            <h2>{currentQuestion.prompt}</h2>
            <p className="diagnostic-question-helper">
              Think about what happens in day-to-day work and choose the response that fits most
              often.
            </p>
            {renderQuestionInput(currentQuestion)}
          </div>
        </div>
      )}

      {saveError && <div className="diagnostic-access-error">{saveError}</div>}

      <div className="diagnostic-question-actions">
        <button
          className="btn btn-outline"
          type="button"
          onClick={() => transitionTo(Math.max(0, activeIndex - 1), "backward")}
          disabled={activeIndex === 0}
        >
          Back
        </button>
        {activeIndex < totalQuestions - 1 ? (
          <button
            className="btn btn-primary"
            type="button"
            onClick={async () => {
              if (!currentQuestion) return;
              const saved = await saveCurrentAnswer(currentQuestion);
              if (!saved) return;
              transitionTo(Math.min(totalQuestions - 1, activeIndex + 1), "forward");
            }}
          >
            Next
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={async () => {
              if (!currentQuestion) return;
              if (!session) {
                setSaveError("Unable to load the diagnostic session.");
                return;
              }
              const saved = await saveCurrentAnswer(currentQuestion);
              if (!saved) return;
              if (!allRequiredAnswered(orderedQuestions)) {
                setSaveError("Please answer all required questions before submitting.");
                return;
              }
              await markCodeRedeemed();
              try {
                sessionStorage.setItem(
                  "diagnostic_thank_you",
                  JSON.stringify({
                    code_id: session.code_id,
                    question_set_id: session.question_set_id ?? "",
                    diagnostic_name: session.diagnostic_name ?? "",
                    domain_name: session.domain_name ?? "",
                    diagnostic_id: session.diagnostic_id,
                  })
                );
              } catch {
                // Ignore storage issues.
              }
              const params = new URLSearchParams({
                code_id: session.code_id,
                question_set_id: session.question_set_id ?? "",
                diagnostic_name: session.diagnostic_name ?? "",
                domain_name: session.domain_name ?? "",
                diagnostic_id: session.diagnostic_id,
              });
              router.push(`/sms-diagnostic/participant/thank-you?${params.toString()}`);
            }}
          >
            Submit responses
          </button>
        )}
      </div>
    </div>
  );
}
