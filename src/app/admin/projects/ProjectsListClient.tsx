"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAdmin } from "../lib/adminFetch";

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

export default function ProjectsListClient() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      <div className="admin-projects-header">
        <button
          type="button"
          className="admin-projects-back mb-2 inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900"
          onClick={() => router.push("/dashboard/business-admin")}
        >
          â† Back
        </button>
        <h1 className="text-2xl font-semibold text-slate-900">Project Schedule Builder</h1>
        <p className="mt-1 text-sm text-slate-600">
          Quotes accepted by clients are listed here as projects ready for scheduling.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="admin-projects-table w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Loading projects...
                </td>
              </tr>
            )}
            {!isLoading && projects.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  No accepted projects yet.
                </td>
              </tr>
            )}
            {!isLoading &&
              projects.map((project) => (
                <tr
                  key={project.id}
                  className="admin-projects-row cursor-pointer border-t border-slate-100 hover:bg-slate-50"
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
                      {project.status ?? "active"}
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

      {resendModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">Send project access email</h3>
            <p className="mt-2 text-sm text-slate-600">
              Send the existing access code to the recipient below.
            </p>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Access code</p>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {resendModal.code ?? "-"}
              </div>
              <label className="mt-3 block text-xs text-slate-500">
                Recipient email
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  value={resendModal.email ?? ""}
                  onChange={(event) =>
                    setResendModal((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </label>
              <label className="mt-3 block text-xs text-slate-500">
                CC (comma separated)
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  value={resendModal.cc ?? ""}
                  placeholder="manager@example.com, ops@example.com"
                  onChange={(event) =>
                    setResendModal((prev) => ({ ...prev, cc: event.target.value }))
                  }
                />
              </label>
              {resendError && <div className="mt-2 text-xs text-rose-600">{resendError}</div>}
              {resendStatus === "sent" && (
                <div className="mt-2 text-xs text-emerald-600">Email sent.</div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs"
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
                className="rounded-full px-4 py-2 text-xs font-semibold"
                style={{ backgroundColor: "#0b2f4a", color: "#ffffff" }}
                onClick={sendResendEmail}
                disabled={resendStatus === "sending"}
              >
                {resendStatus === "sending" ? "Sending..." : "Send email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

