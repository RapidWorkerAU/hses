"use client";

import { useEffect, useState } from "react";
import { fetchWithSession } from "../portalAuth";

type DiagnosticRow = {
  id: string;
  account_id: string;
  name: string;
  status: string;
  purchased_at: string | null;
  owner_user_id: string | null;
  created_at: string;
  issued_codes: number;
  redeemed_codes: number;
};

export default function DiagnosticsListClient() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        setIsLoading(true);
        const { response, error: sessionError } = await fetchWithSession("/api/portal/diagnostics");
        if (!response) {
          window.location.assign("/login");
          return;
        }
        if (!response.ok) {
          const errorText = await response.text();
          setError(
            sessionError
              ? `We could not load your diagnostics yet. ${sessionError}`
              : errorText
              ? `We could not load your diagnostics yet. ${errorText}`
              : "We could not load your diagnostics yet."
          );
          return;
        }

        const payload = (await response.json()) as { diagnostics: DiagnosticRow[] };
        setDiagnostics(payload.diagnostics ?? []);
      } catch (err) {
        setError("We could not load your diagnostics yet.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiagnostics();
  }, []);

  if (isLoading) {
    return <div className="dashboard-empty">Loading diagnostics...</div>;
  }

  if (error) {
    return <div className="dashboard-empty">{error}</div>;
  }

  if (diagnostics.length === 0) {
    return (
      <div className="dashboard-empty">
        <h2>No diagnostics yet</h2>
        <p>
          When you purchase a diagnostic, it will appear here with access codes and
          rollout progress.
        </p>
        <a className="btn btn-primary" href="/sms-diagnostic/purchase">
          Purchase a diagnostic
        </a>
      </div>
    );
  }

  return (
    <div className="dashboard-card-grid">
      {diagnostics.map((diagnostic) => {
        const issued = diagnostic.issued_codes ?? 0;
        const redeemed = diagnostic.redeemed_codes ?? 0;
        const completion = issued === 0 ? 0 : Math.round((redeemed / issued) * 100);
        const purchasedLabel = diagnostic.purchased_at
          ? new Date(diagnostic.purchased_at).toLocaleDateString("en-AU", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
          : "—";

        return (
          <article key={diagnostic.id} className="dashboard-card">
            <div className="dashboard-card-top">
              <p className="dashboard-card-domain">Safety Energy Loop Framework</p>
              <span className="dashboard-card-status">{diagnostic.status}</span>
            </div>
            <h3>{diagnostic.name}</h3>
            <p className="dashboard-card-meta">Purchased {purchasedLabel}</p>
            <div className="dashboard-card-stats">
              <div>
                <strong>{issued}</strong>
                <span>Codes issued</span>
              </div>
              <div>
                <strong>{redeemed}</strong>
                <span>Redeemed</span>
              </div>
              <div>
                <strong>{completion}%</strong>
                <span>Completion</span>
              </div>
            </div>
            <div className="dashboard-card-actions">
              <a className="btn btn-primary" href={`/sms-diagnostic/dashboard/diagnostics/${diagnostic.id}`}>
                Open diagnostic
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
