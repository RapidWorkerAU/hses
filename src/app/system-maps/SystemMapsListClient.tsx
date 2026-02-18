"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";

type SystemMapRow = {
  id: string;
  title: string;
  description: string | null;
  updated_at: string;
  created_at: string;
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function SystemMapsListClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SystemMapRow[]>([]);

  const redirectToLogin = useMemo(
    () => `/login?returnTo=${encodeURIComponent("/system-maps")}`,
    []
  );

  const loadMaps = async () => {
    const user = await ensurePortalSupabaseUser();
    if (!user) {
      window.location.assign(redirectToLogin);
      return;
    }

    const { data, error: mapsError } = await supabaseBrowser
      .schema("ms")
      .from("system_maps")
      .select("id,title,description,updated_at,created_at")
      .order("updated_at", { ascending: false });

    if (mapsError) {
      setError(mapsError.message || "Unable to load system maps.");
      return;
    }

    setRows((data ?? []) as SystemMapRow[]);
  };

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await loadMaps();
      } catch (loadError) {
        setError("Unable to load system maps.");
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  const handleCreateMap = async () => {
    try {
      setIsCreating(true);
      setError(null);

      const user = await ensurePortalSupabaseUser();
      if (!user) {
        window.location.assign(redirectToLogin);
        return;
      }

      const { data, error: createError } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .insert({
          owner_id: user.id,
          title: "Untitled System Map",
        })
        .select("id")
        .single();

      if (createError || !data?.id) {
        setError(createError?.message || "Unable to create a new system map.");
        return;
      }

      router.push(`/system-maps/${data.id}`);
    } catch (createError) {
      setError("Unable to create a new system map.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="dashboard-empty">Loading system maps...</div>;
  }

  return (
    <div className="dashboard-panel" style={{ overflowX: "auto" }}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">Your maps</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCreateMap}
          disabled={isCreating}
        >
          {isCreating ? "Creating..." : "Create New System Map"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="dashboard-empty mt-4">
          <h3>No system maps yet</h3>
          <p>Create your first map to begin laying out your management system.</p>
        </div>
      ) : (
        <table className="mt-4 w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Description</th>
              <th className="px-3 py-3">Updated</th>
              <th className="px-3 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                onClick={() => router.push(`/system-maps/${row.id}`)}
              >
                <td className="px-3 py-3 font-semibold text-slate-900">{row.title}</td>
                <td className="px-3 py-3 text-slate-600">{row.description || "-"}</td>
                <td className="px-3 py-3 text-slate-600">{formatDateTime(row.updated_at)}</td>
                <td className="px-3 py-3 text-slate-600">{formatDateTime(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

