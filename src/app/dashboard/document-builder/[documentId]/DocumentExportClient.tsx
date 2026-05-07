"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingRow } from "@/components/loading/HsesLoaders";
import { supabaseBrowser } from "@/lib/supabase/client";
import styles from "./DocumentExportClient.module.css";

type ExportResult = {
  download_url?: string;
};

export default function DocumentExportClient({
  documentId,
}: {
  documentId: string;
}) {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const buildPdf = async () => {
      setIsExporting(true);
      setError(null);

      try {
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Your session has expired. Refresh and try again.");
        }

        const response = await fetch(`/api/portal/document-builder/projects/${documentId}/export/pdf`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Unable to create the PDF export.");
        }

        const result = (await response.json()) as ExportResult;
        if (!result.download_url) {
          throw new Error("The PDF export completed but no viewer URL was returned.");
        }

        if (!isCancelled) {
          setPdfUrl(result.download_url);
        }
      } catch (failure) {
        if (!isCancelled) {
          setError(failure instanceof Error ? failure.message : "Unable to create the PDF export.");
        }
      } finally {
        if (!isCancelled) {
          setIsExporting(false);
        }
      }
    };

    void buildPdf();

    return () => {
      isCancelled = true;
    };
  }, [documentId]);

  if (isExporting) {
    return (
      <div className={styles.stateCard}>
        <span className={styles.eyebrow}>PDF preview</span>
        <h3>Building your styled PDF</h3>
        <p>The viewer will appear here as soon as the export is ready.</p>
        <LoadingRow label="Generating PDF document..." />
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className={styles.stateCard}>
        <h3>PDF preview unavailable</h3>
        <p>{error ?? "Unable to open the PDF preview."}</p>
        <div className={styles.buttonRow}>
          <button type="button" className={styles.primaryButton} onClick={() => router.refresh()}>
            Try again
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => router.push(`/dashboard/document-builder/${documentId}/edit`)}>
            Return to editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.viewerShell}>
      <div className={styles.viewerToolbar}>
        <div className={styles.buttonRow}>
          <span className={styles.viewerHint}>Use the native PDF viewer controls to zoom, save, or print.</span>
        </div>
      </div>

      <div className={styles.viewerFrame}>
        <iframe
          title="Document PDF preview"
          src={pdfUrl}
          className={styles.iframe}
        />
      </div>
    </div>
  );
}
