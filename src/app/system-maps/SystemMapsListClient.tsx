"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";

type SystemMapRow = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  map_code: string | null;
  map_category?: "document_map" | "bow_tie" | "incident_investigation" | "org_chart" | null;
  role: string;
  updated_at: string;
  created_at: string;
};

type MapMemberRow = {
  map_id: string;
  user_id: string;
  role: string;
};

type MapCategoryOption = {
  id: "document_map" | "bow_tie" | "incident_investigation" | "org_chart";
  label: string;
  description: string;
};

const mapCategoryOptions: MapCategoryOption[] = [
  { id: "document_map", label: "Document Map", description: "Document-centric compliance and management maps." },
  { id: "bow_tie", label: "Bow Tie", description: "Hazard, controls, escalation and consequence mapping." },
  { id: "incident_investigation", label: "Incident Investigation", description: "Investigation workflows and evidence maps." },
  { id: "org_chart", label: "Org Chart", description: "People and team structure mapping." },
];

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [deletingMapId, setDeletingMapId] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [pendingDeleteRow, setPendingDeleteRow] = useState<SystemMapRow | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [mapCodeInput, setMapCodeInput] = useState("");
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
    setCurrentUserId(user.id);

    const { data: memberRows, error: memberError } = await supabaseBrowser
      .schema("ms")
      .from("map_members")
      .select("map_id,user_id,role")
      .eq("user_id", user.id);

    if (memberError) {
      setError(memberError.message || "Unable to load map memberships.");
      return;
    }

    const memberByMapId = new Map<string, MapMemberRow>();
    (memberRows ?? []).forEach((row) => memberByMapId.set(row.map_id, row as MapMemberRow));
    const mapIds = [...memberByMapId.keys()];

    if (!mapIds.length) {
      setRows([]);
      return;
    }

    const { data, error: mapsError } = await supabaseBrowser
      .schema("ms")
      .from("system_maps")
      .select("id,title,description,owner_id,map_code,map_category,updated_at,created_at")
      .in("id", mapIds)
      .order("updated_at", { ascending: false });

    if (mapsError) {
      setError(mapsError.message || "Unable to load system maps.");
      return;
    }

    const mergedRows = ((data ?? []) as Omit<SystemMapRow, "role">[]).map((row) => ({
      ...row,
      role: memberByMapId.get(row.id)?.role ?? "read",
    }));
    setRows(mergedRows);
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

  const handleCreateMap = async (mapCategory: MapCategoryOption["id"]) => {
    try {
      setIsCreating(true);
      setError(null);

      const user = await ensurePortalSupabaseUser();
      if (!user) {
        window.location.assign(redirectToLogin);
        return;
      }

      let createdMapId: string | null = null;
      const { data, error: createError } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .insert({
          owner_id: user.id,
          title: mapCategory === "bow_tie" ? "Untitled Bow Tie Map" : "Untitled System Map",
          map_category: mapCategory,
        })
        .select("id")
        .single();

      if (!createError && data?.id) {
        createdMapId = data.id;
      } else {
        // Some RLS setups allow INSERT but block RETURNING payloads.
        const insertWithoutReturning = await supabaseBrowser
          .schema("ms")
          .from("system_maps")
          .insert({
            owner_id: user.id,
            title: mapCategory === "bow_tie" ? "Untitled Bow Tie Map" : "Untitled System Map",
            map_category: mapCategory,
          });

        if (insertWithoutReturning.error) {
          setError(createError?.message || insertWithoutReturning.error.message || "Unable to create a new system map.");
          return;
        }

        const latestMap = await supabaseBrowser
          .schema("ms")
          .from("system_maps")
          .select("id")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestMap.error || !latestMap.data?.id) {
          setError(latestMap.error?.message || "Map created, but the new map id could not be resolved.");
          return;
        }
        createdMapId = latestMap.data.id;
      }

      if (!createdMapId) {
        setError("Map created, but the new map id could not be resolved.");
        return;
      }

      const { error: memberInsertError } = await supabaseBrowser
        .schema("ms")
        .from("map_members")
        .upsert(
          {
            map_id: createdMapId,
            user_id: user.id,
            role: "full_write",
          },
          { onConflict: "map_id,user_id" }
        );

      if (memberInsertError) {
        setError(memberInsertError.message || "Map created, but owner permissions could not be assigned.");
        return;
      }

      router.push(`/system-maps/${createdMapId}`);
    } catch (createError) {
      setError("Unable to create a new system map.");
    } finally {
      setIsCreating(false);
      setShowCreateMenu(false);
    }
  };

  const getAccessLabel = (row: SystemMapRow) => {
    if (!row.role) return "Read access";
    const role = row.role.toLowerCase();
    if (role === "full_write") return row.owner_id ? "Full write" : "Full write";
    if (role === "partial_write") return "Partial write";
    if (role === "read") return "Read access";
    return row.role;
  };

  const getCategoryLabel = (row: SystemMapRow) => {
    if (!row.map_category) return "Document Map";
    if (row.map_category === "bow_tie") return "Bow Tie";
    if (row.map_category === "incident_investigation") return "Incident Investigation";
    if (row.map_category === "org_chart") return "Org Chart";
    return row.map_category;
  };

  const handleLinkMapToProfile = async () => {
    try {
      setIsLinking(true);
      setError(null);

      const user = await ensurePortalSupabaseUser();
      if (!user) {
        window.location.assign(redirectToLogin);
        return;
      }

      const code = mapCodeInput.trim().toUpperCase();
      if (!code) {
        setError("Enter a valid map code.");
        return;
      }

      const { error: linkError } = await supabaseBrowser
        .schema("ms")
        .rpc("link_map_to_profile_by_code", {
          p_map_code: code,
        });

      if (linkError) {
        setError(linkError.message || "Unable to link map to your profile with this code.");
        return;
      }

      setMapCodeInput("");
      setShowLinkForm(false);
      await loadMaps();
    } catch (linkErr) {
      setError("Unable to link map to your profile.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleDeleteMap = async (row: SystemMapRow) => {
    const canDelete = row.owner_id === currentUserId;
    if (!canDelete) return;

    try {
      setDeletingMapId(row.id);
      setError(null);
      const { error: deleteError } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .delete()
        .eq("id", row.id)
        .eq("owner_id", currentUserId as string);

      if (deleteError) {
        setError(deleteError.message || "Unable to delete system map.");
        return;
      }

      setRows((prev) => prev.filter((item) => item.id !== row.id));
      setPendingDeleteRow(null);
    } catch {
      setError("Unable to delete system map.");
    } finally {
      setDeletingMapId(null);
    }
  };

  const handleCopyCode = async (row: SystemMapRow) => {
    const codeVisible = row.owner_id === currentUserId && !!row.map_code;
    if (!codeVisible) return;
    try {
      await navigator.clipboard.writeText(row.map_code as string);
      setCopiedMessage(`Map code copied for "${row.title}"`);
      window.setTimeout(() => {
        setCopiedMessage((prev) => (prev ? null : prev));
      }, 1400);
    } catch {
      setError("Unable to copy map code.");
    }
  };

  if (isLoading) {
    return <div className="dashboard-empty">Loading system maps...</div>;
  }

  return (
    <>
      <div className="dashboard-panel">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Your maps</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowLinkForm((prev) => !prev)}
            >
              Link Map to Profile
            </button>
            <div className="relative">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowCreateMenu((prev) => !prev)}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create New"}
              </button>
              {showCreateMenu ? (
                <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-none border border-slate-300 bg-white p-2 shadow-lg">
                  <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Map Category</div>
                  <div className="space-y-1">
                    {mapCategoryOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50"
                        onClick={() => void handleCreateMap(option.id)}
                        disabled={isCreating}
                      >
                        <div className="text-sm font-semibold text-slate-900">{option.label}</div>
                        <div className="text-xs text-slate-600">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {showLinkForm && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <input
              type="text"
              className="min-w-[260px] flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              placeholder="Enter map code"
              value={mapCodeInput}
              onChange={(e) => setMapCodeInput(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleLinkMapToProfile}
              disabled={isLinking}
            >
              {isLinking ? "Linking..." : "Link"}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        {copiedMessage && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {copiedMessage}
          </p>
        )}
      </div>

      <div className="dashboard-panel mt-4" style={{ overflowX: "auto" }}>
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Description</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Access</th>
              <th className="px-3 py-3">Map Code</th>
              <th className="px-3 py-3">Updated</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-5 text-slate-600" colSpan={8}>
                  No maps have been added. Create a new map or link one to your profile.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                  onClick={() => router.push(`/system-maps/${row.id}`)}
                >
                  <td className="px-3 py-3 font-semibold text-slate-900">{row.title}</td>
                  <td className="max-w-[260px] truncate px-3 py-3 text-slate-600" title={row.description || "-"}>
                    {row.description || "-"}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-3 text-slate-600" title={getCategoryLabel(row)}>
                    {getCategoryLabel(row)}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{getAccessLabel(row)}</td>
                  <td className="px-3 py-3 text-slate-600">{row.owner_id === currentUserId ? row.map_code || "-" : "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDateTime(row.updated_at)}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDateTime(row.created_at)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {(() => {
                        const canCopy = row.owner_id === currentUserId && !!row.map_code;
                        const copyTitle = canCopy
                          ? "Copy map code"
                          : row.owner_id !== currentUserId
                            ? "Map code is only visible to the map owner"
                            : "No map code available to copy";
                        return (
                          <button
                            type="button"
                            title={copyTitle}
                            aria-label={copyTitle}
                            className={`flex h-9 w-9 items-center justify-center rounded-none border border-black bg-white ${
                              canCopy ? "text-black hover:bg-slate-100" : "cursor-not-allowed text-slate-400 opacity-60"
                            }`}
                            disabled={!canCopy}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleCopyCode(row);
                            }}
                          >
                            <img src="/icons/structure.svg" alt="" className="h-4 w-4" />
                          </button>
                        );
                      })()}
                      {(() => {
                        const canDelete = row.owner_id === currentUserId;
                        const deleteTitle = canDelete ? "Delete map" : "Only the map creator can delete this map";
                        return (
                          <button
                            type="button"
                            title={deleteTitle}
                            aria-label={deleteTitle}
                            className={`flex h-9 w-9 items-center justify-center rounded-none border border-black bg-white ${
                              canDelete ? "text-rose-700 hover:bg-slate-100" : "cursor-not-allowed text-slate-400 opacity-60"
                            }`}
                            disabled={!canDelete || deletingMapId === row.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              setPendingDeleteRow(row);
                            }}
                          >
                            <img src="/icons/delete.svg" alt="" className="h-4 w-4" />
                          </button>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pendingDeleteRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-none border border-slate-300 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Delete map?</h2>
            <p className="mt-2 text-sm text-slate-700">
              You are about to permanently delete <span className="font-semibold">"{pendingDeleteRow.title}"</span>.
            </p>
            <div className="mt-3 text-sm text-slate-700">
              <div>This will delete:</div>
              <ul className="mt-1 list-disc pl-5">
                <li>The system map</li>
                <li>All document nodes</li>
                <li>All canvas components</li>
                <li>All relationships</li>
                <li>All document structure content</li>
                <li>All linked map member access for this map</li>
              </ul>
            </div>
            <p className="mt-3 text-sm font-semibold text-rose-700">This cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                onClick={() => setPendingDeleteRow(null)}
                disabled={deletingMapId === pendingDeleteRow.id}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-none border border-black bg-white px-3 py-2 text-sm text-rose-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void handleDeleteMap(pendingDeleteRow)}
                disabled={deletingMapId === pendingDeleteRow.id}
              >
                {deletingMapId === pendingDeleteRow.id ? "Deleting..." : "Delete map"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
