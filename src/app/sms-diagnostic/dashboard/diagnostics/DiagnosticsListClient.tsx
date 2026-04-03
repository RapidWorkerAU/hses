"use client";

import { useEffect, useState } from "react";
import { fetchWithSession } from "../portalAuth";
import { CardGridSkeleton } from "@/components/loading/HsesLoaders";
import styles from "../InvestigationDashboard.module.css";

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

  const statusClassName = (status: string | null) => {
    const normalized = status?.toLowerCase() ?? "new";
    if (normalized === "redeemed") return styles.statusRedeemed;
    if (normalized === "assigned") return styles.statusAssigned;
    if (normalized === "emailed") return styles.statusEmailed;
    if (normalized === "manual") return styles.statusManual;
    if (normalized === "new") return styles.statusNew;
    return styles.statusUnassigned;
  };

  if (isLoading) {
    return <CardGridSkeleton cards={3} />;
  }

  if (error) {
    return <div className={styles.emptyState}>{error}</div>;
  }

  if (diagnostics.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>No diagnostics yet</h2>
        <p>
          When you purchase a diagnostic, it will appear here with access codes and
          rollout progress.
        </p>
        <a className={`${styles.buttonBase} ${styles.primaryButton}`} href="/sms-diagnostic/purchase">
          Purchase a diagnostic
        </a>
      </div>
    );
  }

  return (
    <div className={styles.cardGrid}>
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
          : "--";

        return (
          <article key={diagnostic.id} className={styles.card}>
            <div className={styles.cardTop}>
              <p className={styles.cardDomain}>Safety Energy Loop Framework</p>
              <span className={`${styles.cardStatus} ${statusClassName(diagnostic.status)}`}>{diagnostic.status}</span>
            </div>
            <h3>{diagnostic.name}</h3>
            <p className={styles.cardMeta}>Purchased {purchasedLabel}</p>
            <div className={styles.cardStats}>
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
            <div className={styles.cardActions}>
              <a
                className={`${styles.buttonBase} ${styles.primaryButton}`}
                href={`/dashboard/diagnostics/${diagnostic.id}`}
              >
                Open diagnostic
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}

