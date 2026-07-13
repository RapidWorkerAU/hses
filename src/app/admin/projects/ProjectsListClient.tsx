"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAdmin } from "../lib/adminFetch";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { IconChevronLeft, IconChevronRight, IconSearch } from "@tabler/icons-react";
import { formatDate } from "@/lib/formatters";

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

const statusOptions = ["all", "active", "completed", "paused", "on_hold"];

const formatStatus = (value: string | null | undefined) => {
  const status = (value ?? "active").trim();
  if (!status) return "Active";
  return status.replace(/_/g, " ").charAt(0).toUpperCase() + status.replace(/_/g, " ").slice(1);
};

const STATUS_PILL: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  active:    "bg-sky-100 text-sky-700",
  paused:    "bg-amber-100 text-amber-700",
  on_hold:   "bg-amber-100 text-amber-700",
};
const getStatusPill = (value: string | null | undefined) =>
  STATUS_PILL[(value ?? "active").trim().toLowerCase()] ?? "bg-neutral-100 text-neutral-600";

export default function ProjectsListClient() {
  const router = useRouter();
  const pageSize = 10;
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [resendModal, setResendModal] = useState<{
    open: boolean;
    projectId?: string;
    email?: string;
    code?: string | null;
    cc?: string;
  }>({ open: false });
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendError, setResendError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    const response = await fetchAdmin(`/api/admin/projects?${params.toString()}`);
    if (!response.ok) {
      const message = await response.text();
      setError(message || "Unable to load projects.");
    } else {
      const data = (await response.json()) as { projects: ProjectRow[]; total: number };
      setProjects(data.projects ?? []);
      setTotal(data.total ?? 0);
    }
    setIsLoading(false);
  };

  useEffect(() => { void load(); }, [page, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = page;
  const paginatedProjects = projects;

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput);
  };

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
    if (!email) { setResendStatus("error"); setResendError("Please enter a recipient email."); return; }
    if (!code) { setResendStatus("error"); setResendError("No access code found for this project."); return; }
    setResendStatus("sending");
    setResendError(null);
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");
    const response = await fetchAdmin(`/api/admin/projects/${resendModal.projectId}/send-access-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, cc: resendModal.cc?.trim() || null, access_code: code, link: `${siteUrl}/project` }),
    });
    if (!response.ok) {
      const message = await response.text();
      setResendStatus("error");
      setResendError(message || "Unable to send email.");
      return;
    }
    setResendStatus("sent");
  };

  const closeResend = () => {
    setResendModal({ open: false });
    setResendStatus("idle");
    setResendError(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-9 flex-1" />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-4 w-[70px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "all" ? "All statuses" : opt.replace(/_/g, " ").charAt(0).toUpperCase() + opt.replace(/_/g, " ").slice(1)}
            </option>
          ))}
        </select>
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 min-w-[200px]">
          <Input
            containerClassName="flex-1"
            className="!h-9 text-[13px]"
            iconLeft={<IconSearch size={14} />}
            placeholder="Search by project name, quote number, org, or contact…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" variant="neutral" size="sm">Search</Button>
        </form>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Project ID</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Proposal name</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Organisation</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Contact</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Accepted</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {paginatedProjects.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-neutral-400">
                  {total === 0 && !search ? "No accepted projects yet." : "No projects match your search."}
                </td>
              </tr>
            )}
            {paginatedProjects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-neutral-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/admin/projects/${project.id}`)}
              >
                <td className="px-4 py-3 font-semibold text-neutral-900">
                  {project.quotes?.quote_number ?? "-"}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {project.name ?? project.quotes?.title ?? "-"}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {project.quotes?.organisations?.name ?? "-"}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  <div>{project.quotes?.contacts?.full_name ?? "-"}</div>
                  <div className="text-[12px] text-neutral-400">{project.quotes?.contacts?.email ?? ""}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusPill(project.status)}`}>
                    {formatStatus(project.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {formatDate(project.accepted_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={(event) => openResend(event, project)}
                  >
                    Send email
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-[13px] text-neutral-500">
        <span>
          {total === 0
            ? "No projects"
            : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, total)} of ${total} project${total === 1 ? "" : "s"}`}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="neutral" size="sm" iconOnly
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            <IconChevronLeft size={14} />
          </Button>
          <span className="px-3 py-1 text-neutral-700">
            {safePage} / {totalPages}
          </span>
          <Button variant="neutral" size="sm" iconOnly
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            <IconChevronRight size={14} />
          </Button>
        </div>
      </div>

      {/* Send email modal */}
      <Modal
        open={resendModal.open}
        onClose={closeResend}
        title="Send project access email"
        subtitle="Send the existing access code to the recipient below."
        footer={
          <>
            <Button variant="neutral" onClick={closeResend}>Close</Button>
            <Button
              variant="primary"
              onClick={sendResendEmail}
              loading={resendStatus === "sending"}
              loadingText="Sending..."
            >
              Send email
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
            <p className="text-[12px] font-medium text-neutral-500 uppercase tracking-wider mb-1">Access code</p>
            <p className="text-[15px] font-semibold text-neutral-900">{resendModal.code ?? "-"}</p>
          </div>
          <Input
            label="Recipient email"
            type="email"
            value={resendModal.email ?? ""}
            placeholder="client@example.com"
            onChange={(e) => setResendModal((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Input
            label="CC"
            type="text"
            value={resendModal.cc ?? ""}
            placeholder="manager@example.com, ops@example.com"
            onChange={(e) => setResendModal((prev) => ({ ...prev, cc: e.target.value }))}
          />
          {resendError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
              {resendError}
            </div>
          )}
          {resendStatus === "sent" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">
              Email sent successfully.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
