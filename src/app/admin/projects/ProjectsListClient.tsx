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
  quotes?: {
    quote_number?: string | null;
    title?: string | null;
    organisations?: { name?: string | null } | null;
    contacts?: { full_name?: string | null; email?: string | null } | null;
  } | null;
};

export default function ProjectsListClient() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="admin-projects-header">
        <button
          type="button"
          className="admin-projects-back mb-2 inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900"
          onClick={() => router.push("/sms-diagnostic/dashboard/business-admin")}
        >
          ← Back
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
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Loading projects...
                </td>
              </tr>
            )}
            {!isLoading && projects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
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
                    {project.accepted_at
                      ? new Date(project.accepted_at).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
