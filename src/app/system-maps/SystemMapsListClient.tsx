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
  role: string;
  updated_at: string;
  created_at: string;
};

type MapMemberRow = {
  map_id: string;
  user_id: string;
  role: string;
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
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
      .select("id,title,description,owner_id,map_code,updated_at,created_at")
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

  const handleCreateMap = async () => {
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
          title: "Untitled System Map",
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
            title: "Untitled System Map",
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
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateMap}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create New System Map"}
            </button>
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
      </div>

      <div className="dashboard-panel mt-4" style={{ overflowX: "auto" }}>
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Description</th>
              <th className="px-3 py-3">Access</th>
              <th className="px-3 py-3">Map Code</th>
              <th className="px-3 py-3">Updated</th>
              <th className="px-3 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-5 text-slate-600" colSpan={6}>
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
                  <td className="px-3 py-3 text-slate-600">{row.description || "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{getAccessLabel(row)}</td>
                  <td className="px-3 py-3 text-slate-600">{row.owner_id === currentUserId ? row.map_code || "-" : "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDateTime(row.updated_at)}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDateTime(row.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
