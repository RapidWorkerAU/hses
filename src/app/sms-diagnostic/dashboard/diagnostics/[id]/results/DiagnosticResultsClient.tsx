"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithSession } from "../../../portalAuth";

type ResultRow = {
  criteria_id: string;
  criteria_number: string | null;
  criteria_topic: string;
  criteria_name: string;
  module_id: string;
  module_name: string;
  module_position: number;
  clauses: string[];
  percent: number | null;
  level: "reactive" | "proactive" | "resilient" | "unknown";
};

type ResultsPayload = {
  diagnostic: {
    id: string;
    name: string | null;
    domain_name: string | null;
  };
  rows: ResultRow[];
};

type ModuleGroup = {
  id: string;
  name: string;
  position: number;
  rows: ResultRow[];
};

const levelLabel = (level: ResultRow["level"]) => {
  if (level === "reactive") return "Reactive";
  if (level === "proactive") return "Proactive";
  if (level === "resilient") return "Resilient";
  return "Not yet rated";
};

const moduleClass = (name: string) => {
  const slug = name.toLowerCase();
  if (slug.includes("leadership")) return "leadership";
  if (slug.includes("decision")) return "decision";
  if (slug.includes("legal") || slug.includes("risk")) return "legal";
  return "default";
};

export default function DiagnosticResultsClient({ id }: { id: string }) {
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const { response } = await fetchWithSession(
          `/api/portal/diagnostics/${id}/results`
        );
        if (!response) {
          window.location.assign("/login");
          return;
        }
        if (!response.ok) {
          const message = await response.text();
          if (isActive) {
            setError(message || "Unable to load diagnostic results.");
          }
          return;
        }
        const payload = (await response.json()) as ResultsPayload;
        if (isActive) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (isActive) {
          setError("Unable to load diagnostic results.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [id]);

  const grouped = useMemo(() => {
    const map = new Map<string, ModuleGroup>();
    (data?.rows ?? []).forEach((row) => {
      const existing = map.get(row.module_id);
      if (existing) {
        existing.rows.push(row);
      } else {
        map.set(row.module_id, {
          id: row.module_id,
          name: row.module_name,
          position: row.module_position ?? 0,
          rows: [row],
        });
      }
    });
    const modules = Array.from(map.values());
    modules.sort((a, b) => a.position - b.position);
    modules.forEach((module) => {
      module.rows.sort((a, b) => {
        const numA = a.criteria_number ? parseFloat(a.criteria_number) : 0;
        const numB = b.criteria_number ? parseFloat(b.criteria_number) : 0;
        return numA - numB;
      });
    });
    return modules;
  }, [data]);

  if (isLoading) {
    return <div className="dashboard-empty">Loading results...</div>;
  }

  if (error) {
    return <div className="dashboard-empty">{error}</div>;
  }

  if (!data) {
    return <div className="dashboard-empty">Unable to load diagnostic results.</div>;
  }

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <h2>Intent and fundamental criteria</h2>
        <p>Indicators update as access codes are completed.</p>
      </div>
      <div className="dashboard-table-wrap" role="region" aria-label="Diagnostic results table">
        <table className="diagnostic-results-table">
          <thead>
            <tr>
              <th className="col-category">Category</th>
              <th className="col-number">#</th>
              <th className="col-topic">Topic</th>
              <th className="col-clauses">Clauses</th>
              <th className="col-indicators">Indicators</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((module) =>
              module.rows.map((row, index) => (
                <tr key={`${row.criteria_id}-${index}`}>
                  {index === 0 && (
                    <td
                      className={`results-category results-category--${moduleClass(module.name)}`}
                      rowSpan={module.rows.length}
                    >
                      <div className="results-category-title">{module.name}</div>
                    </td>
                  )}
                  <td className="results-number">{row.criteria_number ?? "--"}</td>
                  <td className="results-topic">{row.criteria_topic || row.criteria_name}</td>
                  <td className="results-clauses">
                    {row.clauses.length === 0 ? (
                      <span className="results-empty">No clauses yet.</span>
                    ) : (
                      row.clauses.map((clause) => (
                        <div key={clause} className="results-clause">
                          {clause}
                        </div>
                      ))
                    )}
                  </td>
                  <td className={`results-indicator level-${row.level}`}>
                    <span>{levelLabel(row.level)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
