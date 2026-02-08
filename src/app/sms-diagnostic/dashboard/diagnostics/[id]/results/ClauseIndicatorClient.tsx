"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithSession } from "../../../portalAuth";

type ClauseIndicator = {
  clause: string;
  percent: number | null;
  level: "reactive" | "proactive" | "resilient" | "unknown";
};

type ResultsPayload = {
  clauseIndicators?: ClauseIndicator[];
};

const levelLabel = (level: ClauseIndicator["level"]) => {
  if (level === "reactive") return "Reactive";
  if (level === "proactive") return "Proactive";
  if (level === "resilient") return "Resilient";
  return "";
};

export default function ClauseIndicatorClient({
  diagnosticId,
  clause,
}: {
  diagnosticId: string;
  clause: string;
}) {
  const [indicators, setIndicators] = useState<ClauseIndicator[]>([]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      const { response } = await fetchWithSession(
        `/api/portal/diagnostics/${diagnosticId}/results`
      );
      if (!response) return;
      if (!response.ok) return;
      const payload = (await response.json()) as ResultsPayload;
      if (isActive) {
        setIndicators(payload.clauseIndicators ?? []);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [diagnosticId]);

  const match = useMemo(
    () => indicators.find((item) => item.clause === clause),
    [indicators, clause]
  );

  if (!match || !match.level || match.level === "unknown") {
    return <span className="results-indicator-item is-pending">Pending</span>;
  }

  return (
    <span className={`results-indicator-item level-${match.level}`}>
      {levelLabel(match.level)}
    </span>
  );
}
