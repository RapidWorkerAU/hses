"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAdmin } from "../lib/adminFetch";
import PortalModal from "@/components/PortalModal";
import modalStyles from "@/components/PortalModal.module.css";
import { TableSkeleton } from "@/components/loading/HsesLoaders";
import PortalTableFooter from "@/components/table/PortalTableFooter";

type ProjectRow = {
  id: string;
  quote_id: string;
  name: string | null;
  status: string | null;
  accepted_at: string | null;
  created_at: string | null;
  latest_access_code?: string | null;
  quotes?: {
    quote_number?: string | null;
    title?: string | null;
    organisations?: { name?: string | null } | null;
    contacts?: { full_name?: string | null; email?: string | null } | null;
  } | null;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-AU");
};

const formatStatus = (value: string | null | undefined) => {
  const status = (value ?? "active").trim();
  if (!status) return "Active";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function ProjectsListClient() {
  const router = useRouter();
  const pageSize = 7;
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [resendModal, setResendModal] = useState<{
    open: boolean;
    projectId?: string;
    email?: string;
    code?: string | null;
    cc?: string;
  }>({ open: false });
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [resendError, setResendError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    const response = await fetchAdmin("/api/admin/projects");
    if (!response.ok) {
      const message = await response.text();
      setError(message || "Unable to load projects.");
    } else {
      const data = (await response.json()) as { projects: ProjectRow[] };
      setProjects(data.projects ?? []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(projects.length / pageSize));
    setPage((current) => Math.min(current, totalPages));
  }, [projects.length]);

  if (isLoading) {
    return <TableSkeleton rows={pageSize} columns="14% 18% 16% 18% 12% 10% 12%" showToolbar={false} />;
  }

  const totalPages = Math.max(1, Math.ceil(projects.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedProjects = projects.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openResend = (event: React.MouseEvent, project: ProjectRow) => {
    event.stopPropagation();
    setResendStatus("idle");
    setResendError(null);
    setResendModal({
      open: true,
      projectId: project.id,
      email: project.quotes?.contacts?.email ?? "",
      code: project.latest_access_code ?? null,
      cc: "",
    });
  };

  const sendResendEmail = async () => {
    if (!resendModal.projectId) return;
    const email = resendModal.email?.trim() ?? "";
    const code = resendModal.code?.trim() ?? "";
    if (!email) {
      setResendStatus("error");
      setResendError("Please enter a recipient email.");
      return;
    }
    if (!code) {
      setResendStatus("error");
      setResendError("No access code found for this project.");
      return;
    }
    setResendStatus("sending");
    setResendError(null);
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");
    const link = `${siteUrl}/project`;
    const response = await fetchAdmin(
      `/api/admin/projects/${resendModal.projectId}/send-access-email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          cc: resendModal.cc?.trim() || null,
          access_code: code,
          link,
        }),
      }
    );
    if (!response.ok) {
      const message = await response.text();
      setResendStatus("error");
      setResendError(message || "Unable to send email.");
      return;
    }
    setResendStatus("sent");
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="portal-table-shell">
        <table className="admin-projects-table portal-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3">Project ID</th>
              <th className="px-4 py-3">Proposal name</th>
              <th className="px-4 py-3">Organisation</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Accepted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 && (
              <tr className="portal-table-empty-row">
                <td colSpan={7}>
                  No accepted projects yet.
                </td>
              </tr>
            )}
            {paginatedProjects.map((project) => (
                <tr
                  key={project.id}
                  className="admin-projects-row portal-table-row cursor-pointer"
                  onClick={() => router.push(`/admin/projects/${project.id}`)}
                >
                  <td className="px-4 py-3" data-label="Project ID">
                    <div className="admin-projects-title-block font-semibold text-slate-900">
                      <span className="admin-projects-mobile-label">Project ID</span>
                      {project.quotes?.quote_number ?? "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600" data-label="Proposal name">
                    <div className="admin-projects-title-block text-slate-600">
                      <span className="admin-projects-mobile-label">Proposal name</span>
                      {project.name ?? project.quotes?.title ?? "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600" data-label="Organisation">
                    {project.quotes?.organisations?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600" data-label="Contact">
                    <div>{project.quotes?.contacts?.full_name ?? "-"}</div>
                    <div className="text-xs text-slate-400">
                      {project.quotes?.contacts?.email ?? ""}
                    </div>
                  </td>
                  <td className="px-4 py-3" data-label="Status">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {formatStatus(project.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500" data-label="Accepted">
                    {formatDate(project.accepted_at)}
                  </td>
                  <td className="px-4 py-3 text-right" data-label="Actions">
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      onClick={(event) => openResend(event, project)}
                    >
                      Send email
                    </button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PortalTableFooter
        total={projects.length}
        page={safePage}
        pageSize={pageSize}
        onPageChange={setPage}
        label="projects"
      />

      {resendModal.open && (
        <PortalModal
          open={resendModal.open}
          ariaLabel="Send project access email"
          eyebrow="Project Access"
          title="Send project access email"
          description="Send the existing access code to the recipient below."
          onClose={() => {
            setResendModal({ open: false });
            setResendStatus("idle");
            setResendError(null);
          }}
          footer={
            <>
              <button
                type="button"
                className={modalStyles.secondaryButton}
                onClick={() => {
                  setResendModal({ open: false });
                  setResendStatus("idle");
                  setResendError(null);
                }}
              >
                Close
              </button>
              <button
                type="button"
                className={modalStyles.primaryButton}
                onClick={sendResendEmail}
                disabled={resendStatus === "sending"}
              >
                {resendStatus === "sending" ? "Sending..." : "Send email"}
              </button>
            </>
          }
        >
          <div className={modalStyles.stack}>
            <div className={modalStyles.surface}>
              <p className={modalStyles.fieldLabel}>Access code</p>
              <div className="mt-2 text-base font-semibold text-slate-900">{resendModal.code ?? "-"}</div>
            </div>
            <div className={modalStyles.field}>
              <span className={modalStyles.fieldLabel}>Recipient email</span>
              <input
                type="email"
                className={modalStyles.input}
                value={resendModal.email ?? ""}
                placeholder="client@example.com"
                onChange={(event) => setResendModal((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className={modalStyles.field}>
              <span className={modalStyles.fieldLabel}>CC</span>
              <input
                type="text"
                className={modalStyles.input}
                value={resendModal.cc ?? ""}
                placeholder="manager@example.com, ops@example.com"
                onChange={(event) => setResendModal((prev) => ({ ...prev, cc: event.target.value }))}
              />
            </div>
            {resendError ? <div className={modalStyles.noticeError}>{resendError}</div> : null}
            {resendStatus === "sent" ? <div className={modalStyles.noticeSuccess}>Email sent.</div> : null}
          </div>
        </PortalModal>
      )}
    </div>
  );
}

