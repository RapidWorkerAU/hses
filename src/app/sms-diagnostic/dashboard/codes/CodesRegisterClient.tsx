"use client";

import { useEffect, useState } from "react";
import { fetchWithSession } from "../portalAuth";
import { TableSkeleton } from "@/components/loading/HsesLoaders";
import PortalTableFooter from "@/components/table/PortalTableFooter";
import styles from "../InvestigationDashboard.module.css";

type CodeRow = {
  id: string;
  diagnostic_id: string;
  diagnostic_name: string;
  diagnostic_order_id: string | null;
  diagnostic_domain_name: string | null;
  diagnostic_purchased_at: string | null;
  diagnostic_created_at: string | null;
  code: string;
  issued_to_name: string | null;
  issued_to_email: string | null;
  issued_at: string | null;
  redeemed_at: string | null;
  status: string;
};

export default function CodesRegisterClient() {
  const [codes, setCodes] = useState<CodeRow[]>([]);
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
  const [activeTab, setActiveTab] = useState("All Codes");
  const [searchTerm, setSearchTerm] = useState("");
  const [codeTypeFilter, setCodeTypeFilter] = useState("All");
  const [usageFilter, setUsageFilter] = useState("All");
  const pageSize = 7;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        setIsLoading(true);
        const { response, error: sessionError } = await fetchWithSession("/api/portal/codes");
        if (!response) {
          window.location.assign("/login");
          return;
        }
        if (!response.ok) {
          const errorText = await response.text();
          setError(
            sessionError
              ? `We could not load your codes yet. ${sessionError}`
              : errorText
              ? `We could not load your codes yet. ${errorText}`
              : "We could not load your codes yet."
          );
          return;
        }

        const payload = (await response.json()) as { codes: CodeRow[] };
        setCodes(payload.codes ?? []);
      } catch (err) {
        setError("We could not load your codes yet.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCodes();
  }, []);

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

  const formatDateOnly = (value: string | null) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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

  const getDisplayStatus = (entry: CodeRow) => {
    if (entry.redeemed_at || entry.status?.toLowerCase() === "redeemed") return "redeemed";
    if (entry.issued_to_email) return "emailed";
    if (entry.issued_to_name) return "manual";
    return entry.status || "unassigned";
  };

  const startAssignment = (entry: CodeRow) => {
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

  const saveAssignment = async (entry: CodeRow) => {
    if (!assignmentName.trim()) {
      setAssignmentError("Please provide a name for this code.");
      return;
    }

    if (assignmentEmail && !assignmentEmail.includes("@")) {
      setAssignmentError("Please provide a valid email address or leave it blank.");
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
                issued_to_email: updated.issued_to_email ?? (assignmentEmail.trim() || null),
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

  const diagnosticTabs = [
    "All Codes",
    ...Array.from(
      new Set(
        codes
          .map((code) => code.diagnostic_domain_name)
          .filter((value): value is string => Boolean(value && value.trim()))
      )
    ).sort(),
  ];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCodes = codes.filter((code) => {
    if (activeTab !== "All Codes" && code.diagnostic_domain_name !== activeTab) {
      return false;
    }
    if (normalizedSearch && !code.diagnostic_name.toLowerCase().includes(normalizedSearch)) {
      return false;
    }
    if (codeTypeFilter !== "All" || usageFilter !== "All") {
      return true;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCodes.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCodes = filteredCodes.slice(
    (safePage - 1) * pageSize,
    (safePage - 1) * pageSize + pageSize
  );

  if (isLoading) {
    return <TableSkeleton rows={pageSize} columns="18% 14% 18% 16% 14%" showToolbar />;
  }

  if (error) {
    return <div className={styles.emptyState}>{error}</div>;
  }

  if (codes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>No codes yet</h2>
        <p>Codes will appear here once diagnostics have been issued.</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.tabList} role="tablist" aria-label="Code management views">
        {diagnosticTabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.tabButton} ${activeTab === tab ? styles.tabButtonActive : ""}`}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className={styles.card}>
        <div className={styles.toolbarLead}>
          <h2>All codes</h2>
        </div>
        <div className={styles.filterToolbar}>
          <div className={styles.filterGroup}>
            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Code type</span>
              <select
                className={styles.select}
                value={codeTypeFilter}
                onChange={(event) => setCodeTypeFilter(event.target.value)}
              >
                <option>All</option>
                <option>Safety Management System Diagnostic</option>
              </select>
            </label>
            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Usage</span>
              <select
                className={styles.select}
                value={usageFilter}
                onChange={(event) => setUsageFilter(event.target.value)}
              >
                <option>All</option>
                <option>Single-use</option>
              </select>
            </label>
          </div>
          <div className={styles.toolbarActions}>
            <button
              className={`${styles.buttonBase} ${styles.secondaryButton} ${styles.buttonSmall}`}
              type="button"
            >
              Export
            </button>
            <label className={`${styles.filterField} ${styles.searchField}`}>
              <span className="sr-only">Search codes</span>
              <input
                className={styles.input}
                placeholder="Search codes"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className={`${styles.tableCard} portal-table-shell`} role="region" aria-label="Access codes">
          <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.tableCompact} portal-table`}>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Purchased</th>
                <th>Code</th>
                <th>Status</th>
                <th>Redeemed</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCodes.map((code) => {
                const displayStatus = getDisplayStatus(code);
                const badgeClass = statusClass(displayStatus);
                const openDiagnostic = () => {
                  if (typeof window === "undefined") return;
                  window.location.assign(`/dashboard/diagnostics/${code.diagnostic_id}`);
                };
                const redeemedParts = formatDateParts(code.redeemed_at);
                return (
                  <tr
                    key={code.id}
                    className={`${styles.row} ${styles.rowHover}`}
                    role="button"
                    tabIndex={0}
                    onClick={openDiagnostic}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDiagnostic();
                      }
                    }}
                  >
                    <td>
                      <div className={styles.stack}>
                        <strong>{code.diagnostic_domain_name ?? "--"}</strong>
                        <span className={styles.muted}>{code.diagnostic_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <span>{formatDateOnly(code.diagnostic_purchased_at ?? code.diagnostic_created_at)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.codePill}>{code.code}</span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status${badgeClass.charAt(0).toUpperCase()}${badgeClass.slice(1)}`]}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <span>{redeemedParts.date}</span>
                        <span className={styles.muted}>{redeemedParts.time || "--"}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCodes.length === 0 && (
                <tr className="portal-table-empty-row">
                  <td colSpan={5}>No codes available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        <div className={styles.tableFooterWrap}>
        <PortalTableFooter
          total={filteredCodes.length}
          page={safePage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          label="codes"
        />
        </div>
      </section>
    </div>
  );
}






