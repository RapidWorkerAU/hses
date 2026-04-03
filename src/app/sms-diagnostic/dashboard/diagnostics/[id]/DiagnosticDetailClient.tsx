"use client";

import { useEffect, useState } from "react";
import { fetchWithSession } from "../../portalAuth";
import { DetailPageSkeleton } from "@/components/loading/HsesLoaders";
import PortalTableFooter from "@/components/table/PortalTableFooter";
import styles from "../../InvestigationDashboard.module.css";

type DiagnosticRecord = {
  id: string;
  account_id: string;
  name: string;
  status: string;
  purchased_at: string | null;
  owner_user_id: string | null;
  created_at: string;
};

type DiagnosticCode = {
  id: string;
  code: string;
  issued_to_name: string | null;
  issued_to_email: string | null;
  issued_at: string | null;
  redeemed_at: string | null;
  status: string;
  notes?: string | null;
};

type DiagnosticDetailClientProps = {
  id: string;
};

export default function DiagnosticDetailClient({ id }: DiagnosticDetailClientProps) {
  const pageSize = 7;
  const [diagnostic, setDiagnostic] = useState<DiagnosticRecord | null>(null);
  const [codes, setCodes] = useState<DiagnosticCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [assignmentName, setAssignmentName] = useState("");
  const [assignmentEmail, setAssignmentEmail] = useState("");
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedCodeIds, setSelectedCodeIds] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState(
    "Your Safety Energy Loop Framework diagnostic access code"
  );
  const [emailMessage, setEmailMessage] = useState(
    "Hi {{name}},\n\nHere is your access code for the {{diagnostic}} diagnostic: {{code}}.\n\nUse this code to start the assessment when you are ready. If you have questions, reply to this email and we will help.\n\nRegards,\nHSES"
  );
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showEmailView, setShowEmailView] = useState(false);
  const [sendingCodeId, setSendingCodeId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  useEffect(() => {
    let effectiveId = id;
    if (!effectiveId || effectiveId === "undefined" || !isUuid(effectiveId)) {
      if (typeof window !== "undefined") {
        const match = window.location.pathname.match(
          /\/(?:sms-diagnostic\/)?dashboard\/diagnostics\/([0-9a-f-]{36})/i
        );
        if (match?.[1]) {
          effectiveId = match[1];
        }
      }
    }

    if (!effectiveId || effectiveId === "undefined" || !isUuid(effectiveId)) {
      setIsLoading(false);
      setError("We could not determine which diagnostic to load.");
      return;
    }

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        const { response, error: sessionError } = await fetchWithSession(
          `/api/portal/diagnostics/${effectiveId}`
        );
        if (!response) {
          window.location.assign("/login");
          return;
        }
        if (!response.ok) {
          const errorText = await response.text();
          setError(
            sessionError
              ? `We could not load this diagnostic. ${sessionError}`
              : errorText
              ? `We could not load this diagnostic. ${errorText}`
              : "We could not load this diagnostic."
          );
          return;
        }

        const payload = (await response.json()) as {
          diagnostic: DiagnosticRecord | null;
          codes: DiagnosticCode[];
        };

        setDiagnostic(payload.diagnostic);
        setCodes(payload.codes ?? []);
      } catch (err) {
        setError("We could not load this diagnostic.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const formatTimestamp = (value: string | null) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateParts = (value: string | null) => {
    const formatted = formatTimestamp(value);
    const [datePart, timePart] = formatted.split(", ");
    return {
      date: datePart ?? formatted,
      time: timePart ?? "",
    };
  };

  const statusClass = (status: string | null) => {
    const normalized = status ? status.toLowerCase() : "unassigned";
    if (normalized === "redeemed") return "redeemed";
    if (normalized === "assigned") return "assigned";
    if (normalized === "emailed") return "emailed";
    if (normalized === "manual") return "manual";
    if (normalized === "new") return "new";
    return "unassigned";
  };

  const getDisplayStatus = (entry: DiagnosticCode) => {
    if (entry.redeemed_at || entry.status?.toLowerCase() === "redeemed") return "redeemed";
    if (entry.issued_to_email) return "emailed";
    if (entry.issued_to_name) return "manual";
    return entry.status || "unassigned";
  };

  const startAssignment = (entry: DiagnosticCode) => {
    if (entry.redeemed_at || entry.status === "redeemed") {
      return;
    }
    setEditingCodeId(entry.id);
    setAssignmentName(entry.issued_to_name ?? "");
    setAssignmentEmail(entry.issued_to_email ?? "");
    setAssignmentError(null);
  };

  const cancelAssignment = () => {
    setEditingCodeId(null);
    setAssignmentName("");
    setAssignmentEmail("");
    setAssignmentError(null);
  };

  const saveAssignment = async (entry: DiagnosticCode) => {
    if (!assignmentName.trim()) {
      setAssignmentError("Please provide a name for this code.");
      return;
    }

    if (!assignmentEmail.trim() || !assignmentEmail.includes("@")) {
      setAssignmentError("Please provide a valid email address.");
      return;
    }

    try {
      setIsAssigning(true);
      setAssignmentError(null);
      const { response, error: sessionError } = await fetchWithSession(
        "/api/portal/diagnostic-codes/assign",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code_id: entry.id,
            name: assignmentName.trim(),
            email: assignmentEmail.trim() ? assignmentEmail.trim() : null,
          }),
        }
      );

      if (!response) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        setAssignmentError(
          sessionError
            ? `We could not save this assignment. ${sessionError}`
            : errorText
            ? `We could not save this assignment. ${errorText}`
            : "We could not save this assignment."
        );
        return;
      }

      const updated = (await response.json()) as {
        id: string;
        issued_to_name: string | null;
        issued_to_email: string | null;
        issued_at: string | null;
        status?: string | null;
      };

      setCodes((prev) =>
        prev.map((code) =>
          code.id === entry.id
            ? {
                ...code,
                issued_to_name: updated.issued_to_name ?? assignmentName.trim(),
                issued_to_email: updated.issued_to_email ?? assignmentEmail.trim(),
                issued_at: updated.issued_at ?? new Date().toISOString(),
                status: updated.status ?? code.status,
              }
            : code
        )
      );

      cancelAssignment();
    } catch (err) {
      setAssignmentError("We could not save this assignment yet.");
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleSelection = (codeId: string) => {
    setSelectedCodeIds((prev) =>
      prev.includes(codeId) ? prev.filter((id) => id !== codeId) : [...prev, codeId]
    );
  };

  const selectedCodes = codes.filter((code) => selectedCodeIds.includes(code.id));

  const sendEmails = async () => {
    if (selectedCodes.length === 0) {
      setEmailError("Select at least one assigned code to email.");
      return;
    }

    const missingDetails = selectedCodes.filter(
      (code) => !code.issued_to_name || !code.issued_to_email
    );
    if (missingDetails.length > 0) {
      setEmailError("Every selected code must have a name and email before sending.");
      return;
    }

    if (!emailSubject.trim() || !emailMessage.trim()) {
      setEmailError("Please provide an email subject and message.");
      return;
    }

    try {
      setIsSending(true);
      setEmailError(null);
      setEmailSuccess(null);

      const recipients = selectedCodes.map((code) => ({
        code_id: code.id,
        code: code.code,
        name: code.issued_to_name ?? "",
        email: code.issued_to_email ?? "",
      }));

      const { response, error: sessionError } = await fetchWithSession(
        "/api/portal/diagnostic-codes/send-emails",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: emailSubject.trim(),
            message: emailMessage.trim(),
            recipients,
          }),
        }
      );

      if (!response) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        setEmailError(
          sessionError
            ? `We could not send those emails. ${sessionError}`
            : errorText
            ? `We could not send those emails. ${errorText}`
            : "We could not send those emails."
        );
        return;
      }

      const payload = (await response.json()) as {
        results: Array<{ code_id: string; ok: boolean }>;
      };

      const succeeded = payload.results.filter((result) => result.ok).map((result) => result.code_id);
      if (succeeded.length > 0) {
        const issuedAt = new Date().toISOString();
        setCodes((prev) =>
          prev.map((code) =>
            succeeded.includes(code.id)
              ? {
                  ...code,
                  issued_at: issuedAt,
                  status: code.status,
                }
              : code
          )
        );
      }

      setEmailSuccess(
        `Sent ${payload.results.filter((result) => result.ok).length} email invitation${
          payload.results.length === 1 ? "" : "s"
        }.`
      );
      setSelectedCodeIds([]);
    } catch (err) {
      setEmailError("We could not send those emails yet.");
    } finally {
      setIsSending(false);
    }
  };

  const sendSingleEmail = async (entry: DiagnosticCode) => {
    if (!entry.issued_to_name || !entry.issued_to_email) {
      setEmailError("Add a name and email before sending.");
      return;
    }

    if (!emailSubject.trim() || !emailMessage.trim()) {
      setEmailError("Please provide an email subject and message.");
      return;
    }

    try {
      setSendingCodeId(entry.id);
      setEmailError(null);
      setEmailSuccess(null);

      const { response, error: sessionError } = await fetchWithSession(
        "/api/portal/diagnostic-codes/send-emails",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: emailSubject.trim(),
            message: emailMessage.trim(),
            recipients: [
              {
                code_id: entry.id,
                code: entry.code,
                name: entry.issued_to_name ?? "",
                email: entry.issued_to_email ?? "",
              },
            ],
          }),
        }
      );

      if (!response) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        setEmailError(
          sessionError
            ? `We could not send that email. ${sessionError}`
            : errorText
            ? `We could not send that email. ${errorText}`
            : "We could not send that email."
        );
        return;
      }

      const issuedAt = new Date().toISOString();
      setCodes((prev) =>
        prev.map((code) =>
          code.id === entry.id
            ? {
                ...code,
                issued_at: issuedAt,
                status: code.status,
              }
            : code
        )
      );

      setEmailSuccess(`Email sent to ${entry.issued_to_email}.`);
    } catch (err) {
      setEmailError("We could not send that email yet.");
    } finally {
      setSendingCodeId(null);
    }
  };

  const openEmailView = () => setShowEmailView(true);
  const closeEmailView = () => setShowEmailView(false);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(codes.length / pageSize));
    setPage((current) => Math.min(current, totalPages));
  }, [codes.length]);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error) {
    return <div className={styles.emptyState}>{error}</div>;
  }

  if (!diagnostic) {
    return (
      <div className={styles.emptyState}>
        <h2>Diagnostic not found</h2>
        <p>Return to the diagnostics list to select another diagnostic.</p>
        <a className={`${styles.buttonBase} ${styles.primaryButton}`} href="/dashboard/diagnostics">
          Open diagnostics
        </a>
      </div>
    );
  }

  const issued = codes.length;
  const redeemed = codes.filter((code) => code.redeemed_at || code.status === "redeemed").length;
  const completion = issued === 0 ? 0 : Math.round((redeemed / issued) * 100);

  const purchasedLabel = diagnostic.purchased_at
    ? new Date(diagnostic.purchased_at).toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "--";
  const totalPages = Math.max(1, Math.ceil(codes.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedCodes = codes.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (showEmailView) {
    return (
      <>
        <div className="dashboard-page-header">
          <img
            src="/images/SELF-Original-Logo.png"
            alt="Safety Energy Loop Framework logo"
            className="dashboard-page-logo"
          />
          <h1>Email invitations</h1>
        <p className="dashboard-page-helper">
          Use placeholders {"{{name}}"}, {"{{code}}"}, and {"{{diagnostic}}"} to personalise
          each email.
        </p>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.toolbarActions}>
          <button
            className={`${styles.buttonBase} ${styles.secondaryButton}`}
            type="button"
            onClick={closeEmailView}
          >
            Back to access codes
          </button>
        </div>
      </div>

        <section className={styles.card}>
          <div className={styles.fieldStack}>
            <label className={styles.field}>
              <span>Email subject</span>
              <input
                className={styles.input}
                value={emailSubject}
                onChange={(event) => setEmailSubject(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Email message</span>
              <textarea
                className={styles.textarea}
                value={emailMessage}
                onChange={(event) => setEmailMessage(event.target.value)}
                rows={8}
              />
            </label>
          </div>
          <div className={styles.toolbar}>
            <div>
              <strong>{selectedCodes.length}</strong> invitation
              {selectedCodes.length === 1 ? "" : "s"} selected
            </div>
            <div className={styles.toolbarActions}>
              <button
                className={`${styles.buttonBase} ${styles.secondaryButton} ${styles.buttonSmall}`}
                type="button"
                onClick={() =>
                  setSelectedCodeIds(
                    codes
                      .filter((code) => code.issued_to_email && code.issued_to_name)
                      .map((code) => code.id)
                  )
                }
              >
                Select all eligible
              </button>
              <button
                className={`${styles.buttonBase} ${styles.ghostButton} ${styles.buttonSmall}`}
                type="button"
                onClick={() => setSelectedCodeIds([])}
              >
                Clear selection
              </button>
            </div>
          </div>
          {emailError && <div className={styles.error}>{emailError}</div>}
          {emailSuccess && <div className={styles.success}>{emailSuccess}</div>}
          <button
            className={`${styles.buttonBase} ${styles.primaryButton}`}
            type="button"
            onClick={sendEmails}
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send email invitations"}
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-page-header">
        <img
          src="/images/SELF-Original-Logo.png"
          alt="Safety Energy Loop Framework logo"
          className="dashboard-page-logo"
        />
        <h1>
          {diagnostic.name === "SMS Diagnostic"
            ? "Safety Management System Diagnostic"
            : diagnostic.name}
        </h1>
        <p className="dashboard-page-helper">
          Manage access codes, assign them to people, and track redemption progress in one
          place.
        </p>
      </div>
      <div className={styles.metricRow}>
        <div className={styles.metricCard}>
          <span>Purchased</span>
          <strong>{purchasedLabel}</strong>
        </div>
        <div className={styles.metricCard}>
          <span>Issued</span>
          <strong>{issued}</strong>
        </div>
        <div className={styles.metricCard}>
          <span>Redeemed</span>
          <strong>
            {redeemed} ({completion}%)
          </strong>
        </div>
        <div className={styles.metricCard}>
          <span>Status</span>
          <strong>{diagnostic.status}</strong>
        </div>
      </div>

      <section className={styles.card}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarLead}>
              <h2>Access codes</h2>
              <p>Assign codes manually or ask us to email invitations for you.</p>
            </div>
            <div className={styles.toolbarActions}>
              <a
                className={`${styles.buttonBase} ${styles.secondaryButton}`}
                href={`/dashboard/diagnostics/${id}/results`}
              >
              Diagnostic Results
              </a>
            </div>
          </div>
          <div className={`${styles.tableCard} portal-table-shell`} role="region" aria-label="Diagnostic codes">
            <div className={styles.tableWrap}>
            <table className={`${styles.table} portal-table`}>
              <thead>
                <tr>
                  <th>Invite</th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCodes.map((entry) => {
                  const isEditing = editingCodeId === entry.id;
                  const canEmail = Boolean(entry.issued_to_name && entry.issued_to_email);
                  const isRedeemed = Boolean(
                    entry.redeemed_at || entry.status?.toLowerCase() === "redeemed"
                  );
                  const isSelected = selectedCodeIds.includes(entry.id);
                  const displayStatus = getDisplayStatus(entry);
                  const badgeClass = statusClass(displayStatus);
                  const issuedParts = formatDateParts(entry.issued_at);
                  const redeemedParts = formatDateParts(entry.redeemed_at);

                  return (
                    <tr key={entry.id} className={styles.row}>
                      <td className={styles.checkboxCell}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!canEmail}
                            onChange={() => toggleSelection(entry.id)}
                          />
                          <span>{canEmail ? "Email" : "Add email"}</span>
                        </label>
                      </td>
                      <td>
                        <span className={styles.codePill}>{entry.code}</span>
                      </td>
                      <td>
                        {isEditing ? (
                          <label className={styles.field}>
                            <span className="sr-only">Name</span>
                            <input
                              className={styles.compactInput}
                              value={assignmentName}
                              onChange={(event) => setAssignmentName(event.target.value)}
                              placeholder="Participant name"
                              disabled={isRedeemed}
                            />
                          </label>
                        ) : (
                          <div className={styles.stack}>
                            <strong>{entry.issued_to_name ?? "--"}</strong>
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <label className={styles.field}>
                            <span className="sr-only">Email</span>
                            <input
                              className={styles.compactInput}
                              value={assignmentEmail}
                              onChange={(event) => setAssignmentEmail(event.target.value)}
                              placeholder="name@company.com"
                              disabled={isRedeemed}
                            />
                          </label>
                        ) : (
                          <div className={styles.stack}>
                            <span>{entry.issued_to_email ?? "--"}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status${badgeClass.charAt(0).toUpperCase()}${badgeClass.slice(1)}`]}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td>
                        <div className={styles.dateCell}>
                          <span>Issued {issuedParts.date}</span>
                          <span className={styles.muted}>{issuedParts.time || "--"}</span>
                          <span>Redeemed {redeemedParts.date}</span>
                          <span className={styles.muted}>{redeemedParts.time || "--"}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionBar}>
                          {isEditing ? (
                            <>
                              <button
                                className={`${styles.buttonBase} ${styles.primaryButton} ${styles.buttonSmall}`}
                                type="button"
                                onClick={() => saveAssignment(entry)}
                                disabled={isAssigning}
                              >
                                {isAssigning ? "Saving..." : "Save"}
                              </button>
                              <button
                                className={`${styles.buttonBase} ${styles.secondaryButton} ${styles.buttonSmall}`}
                                type="button"
                                onClick={cancelAssignment}
                                disabled={isAssigning}
                              >
                                Cancel
                              </button>
                              {assignmentError && (
                                <div className={styles.error}>{assignmentError}</div>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                className={`${styles.buttonBase} ${styles.ghostButton} ${styles.buttonSmall}`}
                                type="button"
                                onClick={() => startAssignment(entry)}
                                disabled={isRedeemed}
                                title={
                                  isRedeemed
                                    ? "This code has already been redeemed and cannot be edited."
                                    : undefined
                                }
                              >
                                Edit
                              </button>
                              <button
                                className={`${styles.buttonBase} ${styles.ghostButton} ${styles.buttonSmall}`}
                                type="button"
                                disabled={!canEmail || sendingCodeId === entry.id || isRedeemed}
                                onClick={() => {
                                  if (!canEmail) return;
                                  sendSingleEmail(entry);
                                }}
                                title={
                                  isRedeemed
                                    ? "This code has already been redeemed and cannot be edited."
                                    : undefined
                                }
                              >
                                {entry.issued_at ? "Resend" : "Send email"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {codes.length === 0 && (
                  <tr className="portal-table-empty-row">
                    <td colSpan={7}>No codes have been issued yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
          <div className={styles.tableFooterWrap}>
          <PortalTableFooter
            total={codes.length}
            page={safePage}
            pageSize={pageSize}
            onPageChange={setPage}
            label="codes"
          />
          </div>
          <div className={styles.toolbar}>
            <div className={styles.toolbarActions}>
            <button
              className={`${styles.buttonBase} ${styles.primaryButton}`}
              type="button"
              onClick={openEmailView}
            >
              Email invitations via HSES
            </button>
          </div>
          </div>
      </section>
    </>
  );
}



