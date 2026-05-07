"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingRow } from "@/components/loading/HsesLoaders";
import { supabaseBrowser } from "@/lib/supabase/client";
import styles from "./DocumentGenerationClient.module.css";

const PROGRESS_STEPS = [
  "Saving your questionnaire context.",
  "Preparing the document sections.",
  "Generating draft content for each section.",
  "Opening the editor.",
];

export default function DocumentGenerationClient({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const advanceStep = (nextIndex: number, delayMs: number) => {
      const timer = setTimeout(() => {
        if (!isCancelled) {
          setActiveStepIndex((current) => Math.max(current, nextIndex));
        }
      }, delayMs);
      timers.push(timer);
    };

    const runGeneration = async () => {
      try {
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Your session has expired. Refresh and try again.");
        }

        const { error: projectStatusError } = await supabaseBrowser
          .schema("docbuilder")
          .from("document_projects")
          .update({ status: "generating" })
          .eq("id", documentId);

        if (projectStatusError) {
          throw new Error(projectStatusError.message || "Unable to update document status.");
        }

        advanceStep(1, 700);
        advanceStep(2, 1800);

        const response = await fetch(`/api/portal/document-builder/projects/${documentId}/generation/run`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Unable to generate document sections.");
        }

        const { error: editingStatusError } = await supabaseBrowser
          .schema("docbuilder")
          .from("document_projects")
          .update({ status: "editing" })
          .eq("id", documentId);

        if (editingStatusError) {
          throw new Error(editingStatusError.message || "Unable to update document status.");
        }

        setActiveStepIndex(3);

        const timer = setTimeout(() => {
          if (!isCancelled) {
            router.replace(`/dashboard/document-builder/${documentId}/edit`);
          }
        }, 400);
        timers.push(timer);
      } catch (generationFailure) {
        if (!isCancelled) {
          setError(
            generationFailure instanceof Error
              ? generationFailure.message
              : "Unable to generate document sections.",
          );
        }
      }
    };

    void runGeneration();

    return () => {
      isCancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [documentId, router]);

  const activeLabel = useMemo(() => PROGRESS_STEPS[Math.min(activeStepIndex, PROGRESS_STEPS.length - 1)], [activeStepIndex]);

  if (error) {
    return (
      <div className={styles.errorCard}>
        <h3>Generation stopped</h3>
        <p>{error}</p>
        <button type="button" className={styles.retryButton} onClick={() => router.replace(`/dashboard/document-builder/${documentId}/questions`)}>
          Return to questionnaire
        </button>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.heroCard}>
        <span className={styles.eyebrow}>AI generation in progress</span>
        <h3>Building your section drafts</h3>
        <p>The document is still working. This page will automatically switch to the text editor when generation finishes.</p>
        <div className={styles.spinner} aria-hidden="true" />
      </div>

      <div className={styles.progressCard}>
        <LoadingRow label={activeLabel} />
        <div className={styles.progressList}>
          {PROGRESS_STEPS.map((step, index) => (
            <div key={step} className={`${styles.progressItem} ${index <= activeStepIndex ? styles.progressItemActive : ""}`}>
              <span className={styles.progressDot} aria-hidden="true" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
