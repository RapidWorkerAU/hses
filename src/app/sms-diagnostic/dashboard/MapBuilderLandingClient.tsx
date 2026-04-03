"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import { TableSkeleton } from "@/components/loading/HsesLoaders";
import PortalTableFooter from "@/components/table/PortalTableFooter";
import styles from "./MapBuilderLanding.module.css";
import {
  MAP_BUILDER_CATEGORIES,
  MAP_BUILDER_CATEGORY_BY_ID,
  MAP_BUILDER_CATEGORY_OPTIONS,
  type MapBuilderCategory,
} from "./mapBuilderCategories";
import { hasMapCategoryAccess } from "./dashboardPortals";

type SystemMapRow = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  map_code: string | null;
  map_category: MapBuilderCategory["mapCategory"] | null;
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

const formatDateParts = (value: string) => {
  const formatted = formatDateTime(value);
  const [datePart, timePart] = formatted.split(", ");
  return {
    date: datePart ?? formatted,
    time: timePart ?? "",
  };
};

const truncateValue = (value: string) => {
  if (value.length <= 24) return value;
  return `${value.slice(0, 21)}...`;
};

const DEFAULT_MAP_CATEGORY = MAP_BUILDER_CATEGORIES[0]?.mapCategory ?? "document_map";

const getStoredUserEmail = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("hses_user_email") ?? "";
};

const getCategoryForMap = (mapCategory: MapBuilderCategory["mapCategory"] | null | undefined) =>
  (mapCategory ? MAP_BUILDER_CATEGORY_BY_ID.get(mapCategory) : null) ?? MAP_BUILDER_CATEGORY_BY_ID.get(DEFAULT_MAP_CATEGORY)!;

const getTitlePlaceholder = (category: MapBuilderCategory) => {
  switch (category.mapCategory) {
    case "incident_investigation":
      return "Example: Forklift collision in warehouse";
    case "document_map":
      return "Example: Contractor onboarding document map";
    case "bow_tie":
      return "Example: Working at heights bow tie";
    case "org_chart":
      return "Example: Operations team structure";
    case "process_flow":
      return "Example: Incident notification workflow";
    default:
      return "Enter a clear working title";
  }
};

const getDescriptionPlaceholder = (category: MapBuilderCategory) => {
  switch (category.mapCategory) {
    case "incident_investigation":
      return "Summarise what happened, who is involved, and what the investigation needs to establish.";
    case "document_map":
      return "Outline the documents, relationships, and structure this map needs to capture.";
    case "bow_tie":
      return "Summarise the hazard, key controls, escalation factors, and consequences this bow tie will cover.";
    case "org_chart":
      return "Describe the team, reporting lines, and organisational structure this chart should present.";
    case "process_flow":
      return "Describe the process, steps, decision points, and outputs this flow should represent.";
    default:
      return "Add context to help identify the purpose of this map.";
  }
};

type MapBuilderLandingClientProps = {
  category?: MapBuilderCategory;
};

export default function MapBuilderLandingClient({ category }: MapBuilderLandingClientProps) {
  const pageSize = 7;
  const router = useRouter();
  const linkPanelRef = useRef<HTMLDivElement | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [rows, setRows] = useState<SystemMapRow[]>([]);
  const [selectedMapIds, setSelectedMapIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deletingMapId, setDeletingMapId] = useState<string | null>(null);
  const [duplicatingMapId, setDuplicatingMapId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [mapCodeInput, setMapCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedMapCategory, setSelectedMapCategory] = useState<MapBuilderCategory["mapCategory"]>(
    category?.mapCategory ?? DEFAULT_MAP_CATEGORY
  );
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [pendingDuplicateRow, setPendingDuplicateRow] = useState<SystemMapRow | null>(null);
  const [pendingDeleteRow, setPendingDeleteRow] = useState<SystemMapRow | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{ percent: number; message: string } | null>(null);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{ percent: number; message: string } | null>(null);
  const [page, setPage] = useState(1);

  const redirectToLogin = "/login?returnTo=%2Fdashboard%2Fmap-builders";

  const resolvedCreateCategory = getCategoryForMap(selectedMapCategory);

  const getRecordHref = (row: SystemMapRow) =>
    row.map_category === "incident_investigation"
      ? `/dashboard/map-builders/investigation-maps/${row.id}`
      : `/system-maps/${row.id}`;

  const loadMaps = async () => {
    const user = await ensurePortalSupabaseUser();
    if (!user) {
      window.location.assign(redirectToLogin);
      return;
    }

    setCurrentUserId(user.id);
    setCurrentUserEmail(user.email ?? getStoredUserEmail());

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
      setSelectedMapIds([]);
      return;
    }

    const { data, error: mapsError } = await supabaseBrowser
      .schema("ms")
      .from("system_maps")
      .select("id,title,description,owner_id,map_code,map_category,updated_at,created_at")
      .in("id", mapIds)
      .order("updated_at", { ascending: false });

    if (mapsError) {
      setError(mapsError.message || "Unable to load maps.");
      return;
    }

    const mergedRows = ((data ?? []) as Omit<SystemMapRow, "role">[])
      .map((row) => ({
        ...row,
        role: memberByMapId.get(row.id)?.role ?? "read",
      }))
      .filter((row) => hasMapCategoryAccess(user.email ?? getStoredUserEmail(), row.map_category));

    setRows(mergedRows);
    setSelectedMapIds((current) => current.filter((id) => mergedRows.some((row) => row.id === id)));
  };

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await loadMaps();
      } catch {
        setError("Unable to load maps.");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [category?.mapCategory]);

  useEffect(() => {
    if (!successMessage) return;
    const timeoutId = window.setTimeout(() => setSuccessMessage(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    setPage((current) => Math.min(current, totalPages));
  }, [rows.length]);

  useEffect(() => {
    if (!showLinkForm) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (linkPanelRef.current?.contains(target)) return;
      setShowLinkForm(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showLinkForm]);

  useEffect(() => {
    if (!showLinkForm) return;
    const timeoutId = window.setTimeout(() => linkInputRef.current?.focus(), 140);
    return () => window.clearTimeout(timeoutId);
  }, [showLinkForm]);

  const selectedOwnedMapIds = selectedMapIds.filter((mapId) => rows.some((row) => row.id === mapId && row.owner_id === currentUserId));
  const ownRows = rows.filter((row) => row.owner_id === currentUserId);
  const allOwnedSelected = ownRows.length > 0 && ownRows.every((row) => selectedMapIds.includes(row.id));
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSelectAllOwned = () => {
    if (allOwnedSelected) {
      setSelectedMapIds((current) => current.filter((id) => !ownRows.some((row) => row.id === id)));
      return;
    }

    setSelectedMapIds((current) => {
      const next = new Set(current);
      ownRows.forEach((row) => next.add(row.id));
      return [...next];
    });
  };

  const toggleRowSelection = (mapId: string) => {
    setSelectedMapIds((current) => (current.includes(mapId) ? current.filter((id) => id !== mapId) : [...current, mapId]));
  };

  const openCreateModal = () => {
    setError(null);
    setSelectedMapCategory(category?.mapCategory ?? DEFAULT_MAP_CATEGORY);
    setNewTitle("");
    setNewDescription("");
    setIsCreateModalOpen(true);
  };

  const createMap = async () => {
    if (!selectedMapCategory) {
      setError("Map category is required.");
      return;
    }

    if (!newTitle.trim()) {
      setError("Map title is required.");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const user = await ensurePortalSupabaseUser();
      if (!user) {
        window.location.assign(redirectToLogin);
        return;
      }

      let createdMapId: string | null = null;
      const { data, error: createErrorResponse } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .insert({
          owner_id: user.id,
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          map_category: selectedMapCategory,
        })
        .select("id")
        .single();

      if (!createErrorResponse && data?.id) {
        createdMapId = data.id;
      } else {
        const fallbackInsert = await supabaseBrowser
          .schema("ms")
          .from("system_maps")
          .insert({
            owner_id: user.id,
            title: newTitle.trim(),
            description: newDescription.trim() || null,
            map_category: selectedMapCategory,
          });

        if (fallbackInsert.error) {
          setError(createErrorResponse?.message || fallbackInsert.error.message || "Unable to create map.");
          return;
        }

        const latestMap = await supabaseBrowser
          .schema("ms")
          .from("system_maps")
          .select("id")
          .eq("owner_id", user.id)
          .eq("map_category", selectedMapCategory)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestMap.error || !latestMap.data?.id) {
          setError(latestMap.error?.message || "Map created, but the new map id could not be resolved.");
          return;
        }

        createdMapId = latestMap.data.id;
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

      if (selectedMapCategory === "incident_investigation") {
        router.push(`/dashboard/map-builders/investigation-maps/${createdMapId}`);
        return;
      }

      router.push(`/system-maps/${createdMapId}`);
    } catch {
      setError("Unable to create map.");
    } finally {
      setIsCreating(false);
    }
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

      const { error: linkError } = await supabaseBrowser.schema("ms").rpc("link_map_to_profile_by_code", {
        p_map_code: code,
      });

      if (linkError) {
        setError(linkError.message || "Unable to link map to your profile with this code.");
        return;
      }

      setMapCodeInput("");
      setShowLinkForm(false);
      setSuccessMessage("Map linked.");
      await loadMaps();
    } catch {
      setError("Unable to link map to your profile.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleDeleteMap = async (row: SystemMapRow) => {
    if (row.owner_id !== currentUserId) return;

    try {
      setDeletingMapId(row.id);
      setError(null);
      setDeleteProgress({ percent: 20, message: "Preparing delete..." });

      window.setTimeout(() => {
        setDeleteProgress((current) => (current ? { percent: 68, message: "Deleting map content..." } : current));
      }, 180);

      const { error: deleteError } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .delete()
        .eq("id", row.id)
        .eq("owner_id", currentUserId as string);

      if (deleteError) {
        setError(deleteError.message || "Unable to delete map.");
        return;
      }

      setDeleteProgress({ percent: 100, message: "Finalising..." });
      setRows((current) => current.filter((item) => item.id !== row.id));
      setSelectedMapIds((current) => current.filter((id) => id !== row.id));
      window.setTimeout(() => {
        setPendingDeleteRow(null);
        setDeleteProgress(null);
      }, 180);
      setSuccessMessage("Map deleted.");
    } catch {
      setError("Unable to delete map.");
    } finally {
      setDeletingMapId(null);
      window.setTimeout(() => setDeleteProgress(null), 220);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedOwnedMapIds.length || !currentUserId) return;

    try {
      setIsBulkDeleting(true);
      setError(null);
      setBulkDeleteProgress({ percent: 18, message: "Preparing bulk delete..." });

      window.setTimeout(() => {
        setBulkDeleteProgress((current) => (current ? { percent: 72, message: "Deleting selected maps..." } : current));
      }, 180);

      const { error: deleteError } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .delete()
        .eq("owner_id", currentUserId)
        .in("id", selectedOwnedMapIds);

      if (deleteError) {
        setError(deleteError.message || "Unable to bulk delete maps.");
        return;
      }

      setBulkDeleteProgress({ percent: 100, message: "Finalising..." });
      setRows((current) => current.filter((row) => !selectedOwnedMapIds.includes(row.id)));
      setSelectedMapIds((current) => current.filter((id) => !selectedOwnedMapIds.includes(id)));
      window.setTimeout(() => {
        setShowBulkDeleteConfirm(false);
        setBulkDeleteProgress(null);
      }, 180);
      setSuccessMessage(`${selectedOwnedMapIds.length} map${selectedOwnedMapIds.length === 1 ? "" : "s"} deleted.`);
    } catch {
      setError("Unable to bulk delete maps.");
    } finally {
      setIsBulkDeleting(false);
      window.setTimeout(() => setBulkDeleteProgress(null), 220);
    }
  };

  const handleDuplicateMap = async (row: SystemMapRow) => {
    try {
      setDuplicatingMapId(row.id);
      setError(null);

      const user = await ensurePortalSupabaseUser();
      if (!user) {
        window.location.assign(redirectToLogin);
        return;
      }

      let createdMapId: string | null = null;
      const duplicateTitle = `${row.title} (Copy)`;

      const { data, error: createErrorResponse } = await supabaseBrowser
        .schema("ms")
        .from("system_maps")
        .insert({
          owner_id: user.id,
          title: duplicateTitle,
          description: row.description,
          map_category: row.map_category,
        })
        .select("id")
        .single();

      if (!createErrorResponse && data?.id) {
        createdMapId = data.id;
      } else {
        const fallbackInsert = await supabaseBrowser
          .schema("ms")
          .from("system_maps")
          .insert({
            owner_id: user.id,
            title: duplicateTitle,
            description: row.description,
            map_category: row.map_category,
          });

        if (fallbackInsert.error) {
          setError(createErrorResponse?.message || fallbackInsert.error.message || "Unable to duplicate map.");
          return;
        }

        const latestMap = await supabaseBrowser
          .schema("ms")
          .from("system_maps")
          .select("id")
          .eq("owner_id", user.id)
          .eq("map_category", row.map_category)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestMap.error || !latestMap.data?.id) {
          setError(latestMap.error?.message || "Map duplicated, but the new map id could not be resolved.");
          return;
        }

        createdMapId = latestMap.data.id;
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
        setError(memberInsertError.message || "Map duplicated, but owner permissions could not be assigned.");
        return;
      }

      if (row.map_category === "incident_investigation") {
        router.push(`/dashboard/map-builders/investigation-maps/${createdMapId}`);
        return;
      }

      router.push(`/system-maps/${createdMapId}`);
    } catch {
      setError("Unable to duplicate map.");
    } finally {
      setDuplicatingMapId(null);
    }
  };

  const handleCopyCode = async (row: SystemMapRow) => {
    const canCopy = row.owner_id === currentUserId && !!row.map_code;
    if (!canCopy) return;

    try {
      await navigator.clipboard.writeText(row.map_code as string);
      setSuccessMessage(`Map code copied for "${row.title}"`);
    } catch {
      setError("Unable to copy map code.");
    }
  };

  const getOwnerLabel = (row: SystemMapRow) => {
    if (row.owner_id === currentUserId) {
      return currentUserEmail || "You";
    }
    return truncateValue(row.owner_id);
  };

  const accessibleCategoryOptions = MAP_BUILDER_CATEGORY_OPTIONS.filter((option) =>
    hasMapCategoryAccess(currentUserEmail || getStoredUserEmail(), option.value)
  );
  const deleteItemLabel = "map";
  const isSingleCategoryView = Boolean(category);
  const emptyLabel = category?.emptyLabel ?? "No canvas maps have been added yet.";
  const createButtonLabel = category?.createButtonLabel ?? "Create New Canvas Map";
  const footerLabel = category?.title.toLowerCase() ?? "canvas maps";

  if (isLoading) {
    return <TableSkeleton rows={pageSize} columns="5% 20% 14% 15% 10% 12% 10% 14%" showToolbar />;
  }

  return (
    <div className={`${styles.wrap} ${!isSingleCategoryView ? styles.documentMapWrap : ""}`}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.bulkDeleteButton}
          onClick={() => setShowBulkDeleteConfirm(true)}
          disabled={!selectedOwnedMapIds.length || isBulkDeleting}
        >
          <img src="/icons/delete.svg" alt="" className={styles.toolbarButtonIcon} />
          <span>{isBulkDeleting ? "Deleting..." : "Bulk Delete"}</span>
        </button>

        <div className={styles.toolbarActions}>
            <div ref={linkPanelRef} className={`${styles.linkPanelInline} ${showLinkForm ? styles.linkPanelInlineOpen : ""}`}>
              <div className={styles.linkExpandShell}>
                <button
                  type="button"
                  className={styles.linkExpandTrigger}
                  onClick={() => setShowLinkForm((prev) => !prev)}
                  aria-expanded={showLinkForm}
                >
                  <img src="/icons/relationship.svg" alt="" className={styles.toolbarButtonIcon} />
                  <span>Link Map Code</span>
                </button>
                <input
                  ref={linkInputRef}
                  type="text"
                  className={styles.linkInput}
                  placeholder="Enter code here"
                  value={mapCodeInput}
                  onChange={(event) => setMapCodeInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleLinkMapToProfile();
                    }
                    if (event.key === "Escape") {
                      setShowLinkForm(false);
                    }
                  }}
                />
              </div>
              <div className={styles.linkPanelInlineBody}>
                <button
                  type="button"
                  className={styles.linkInlineIconButton}
                  onClick={handleLinkMapToProfile}
                  disabled={isLinking}
                  title={isLinking ? "Linking" : "Link map code"}
                  aria-label={isLinking ? "Linking" : "Link map code"}
                >
                  <img src="/icons/relationship.svg" alt="" className={styles.linkInlineIcon} />
                </button>
                <button
                  type="button"
                  className={styles.linkInlineIconButton}
                  onClick={() => setShowLinkForm(false)}
                  title="Close link map code"
                  aria-label="Close link map code"
                >
                  <span className={styles.linkInlineCloseIcon} aria-hidden="true" />
                </button>
              </div>
            </div>
          <button type="button" className={styles.primaryButton} onClick={openCreateModal}>
            <img
              src="/icons/addcomponent.svg"
              alt=""
              className={`${styles.toolbarButtonIcon} ${styles.toolbarButtonIconLight}`}
            />
            <span>{createButtonLabel}</span>
          </button>
        </div>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}
      {successMessage ? <div className={styles.success}>{successMessage}</div> : null}

      {!isSingleCategoryView ? (
        <div className={styles.mobileDocumentCards}>
          {rows.length === 0 ? (
            <div className={styles.mobileDocumentEmpty}>{emptyLabel}</div>
          ) : (
            paginatedRows.map((row) => {
              const rowCategory = getCategoryForMap(row.map_category);
              const updatedParts = formatDateParts(row.updated_at);
              const ownerLabel = getOwnerLabel(row);

              return (
                <button
                  key={row.id}
                  type="button"
                  className={styles.mobileDocumentCard}
                  onClick={() => router.push(getRecordHref(row))}
                >
                  <div className={styles.mobileDocumentCardTop}>
                    <span className={styles.mobileDocumentIcon}>
                      <img src={rowCategory.icon} alt="" className={styles.mobileDocumentIconImage} />
                    </span>
                    <span className={styles.mobileDocumentCodePill}>{row.map_code || "No code"}</span>
                  </div>
                  <div className={styles.mobileDocumentBody}>
                    <h3>{row.title}</h3>
                    <p>{row.description || "No description added for this canvas map yet."}</p>
                  </div>
                  <div className={styles.mobileDocumentMeta}>
                    <span className={styles.mobileDocumentMetaGroup}>
                      <span className={styles.mobileDocumentMetaLabel}>Category</span>
                      <span className={styles.mobileDocumentMetaPill}>{rowCategory.title}</span>
                    </span>
                    <span className={styles.mobileDocumentMetaGroup}>
                      <span className={styles.mobileDocumentMetaLabel}>Owner</span>
                      <span className={styles.mobileDocumentMetaPill}>{ownerLabel}</span>
                    </span>
                    <span className={styles.mobileDocumentMetaGroup}>
                      <span className={styles.mobileDocumentMetaLabel}>Updated</span>
                      <span className={styles.mobileDocumentMetaPill}>{updatedParts.date}</span>
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : null}

      <div className={`${styles.tableCard} portal-table-shell`}>
        <div className={styles.tableWrap}>
          <table className={`${styles.table} portal-table`}>
            <colgroup>
              <col className={styles.colCheckbox} />
              <col className={styles.colName} />
              <col className={styles.colCategory} />
              <col className={styles.colOwner} />
              <col className={styles.colCode} />
              <col className={styles.colUpdatedBy} />
              <col className={styles.colUpdatedDate} />
              <col className={styles.colCreatedDate} />
              <col className={styles.colActions} />
            </colgroup>
            <thead>
              <tr>
                <th className={styles.checkboxHeader}>
                  <input type="checkbox" checked={allOwnedSelected} onChange={toggleSelectAllOwned} aria-label="Select all owned maps" />
                </th>
                <th>Map name</th>
                <th>Category</th>
                <th>Owner</th>
                <th>Code</th>
                <th>Last updated by</th>
                <th>Updated date</th>
                <th>Created date</th>
                <th className={styles.actionHeader}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="portal-table-empty-row">
                  <td className={styles.empty} colSpan={9}>
                    {emptyLabel}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const canDelete = row.owner_id === currentUserId;
                  const rowCategory = getCategoryForMap(row.map_category);
                  const ownerLabel = getOwnerLabel(row);
                  const updatedParts = formatDateParts(row.updated_at);
                  const createdParts = formatDateParts(row.created_at);

                  return (
                    <tr
                      key={row.id}
                      className={`${styles.row} portal-table-row`}
                      onClick={() => router.push(getRecordHref(row))}
                    >
                      <td className={styles.checkboxCell} onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedMapIds.includes(row.id)}
                          disabled={!canDelete}
                          onChange={() => toggleRowSelection(row.id)}
                          aria-label={`Select ${row.title}`}
                        />
                      </td>
                      <td>
                        <div className={styles.nameCell}>
                          <strong>{row.title}</strong>
                          <span className={styles.desc}>{row.description || "-"}</span>
                        </div>
                      </td>
                      <td>{rowCategory.title}</td>
                      <td title={ownerLabel}>{ownerLabel}</td>
                      <td>{row.map_code || "-"}</td>
                      <td title={ownerLabel}>{ownerLabel}</td>
                      <td>
                        <div className={styles.dateCell}>
                          <span>{updatedParts.date}</span>
                          <span>{updatedParts.time}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.dateCell}>
                          <span>{createdParts.date}</span>
                          <span>{createdParts.time}</span>
                        </div>
                      </td>
                      <td className={styles.actionCell} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.actionButtons}>
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
                                className={styles.actionButton}
                                onClick={() => void handleCopyCode(row)}
                                disabled={!canCopy}
                              >
                                <img src="/icons/structure.svg" alt="" className={styles.actionIcon} />
                              </button>
                            );
                          })()}
                          <button
                            type="button"
                            title="Duplicate map"
                            aria-label="Duplicate map"
                            className={styles.actionButton}
                            onClick={() => setPendingDuplicateRow(row)}
                            disabled={duplicatingMapId === row.id}
                          >
                            <img src="/icons/addcomponent.svg" alt="" className={styles.actionIcon} />
                          </button>
                          <button
                            type="button"
                            title={canDelete ? "Delete map" : "Only the map creator can delete this map"}
                            aria-label={canDelete ? "Delete map" : "Only the map creator can delete this map"}
                            className={styles.actionButton}
                            onClick={() => setPendingDeleteRow(row)}
                            disabled={!canDelete || deletingMapId === row.id}
                          >
                            <img src="/icons/delete.svg" alt="" className={styles.actionIcon} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.tableFooterWrap}>
        <PortalTableFooter
          total={rows.length}
          page={safePage}
          pageSize={pageSize}
          onPageChange={setPage}
          label={footerLabel}
        />
      </div>

      {isCreateModalOpen ? (
        <>
          <button type="button" className={styles.modalBackdrop} aria-label="Close create map modal" onClick={() => setIsCreateModalOpen(false)} />
          <div className={`${styles.modal} ${styles.createModal}`} role="dialog" aria-modal="true" aria-label="Create canvas map">
            <div className={styles.createModalHeader}>
              <div className={styles.createModalBrand}>
                <img src="/images/favicon.png" alt="HSES Industry Partners" className={styles.createModalLogo} />
                <div className={styles.createModalBrandCopy}>
                  <span className={styles.createModalEyebrow}>New canvas map</span>
                  <h3 className={styles.createModalTitle}>Create your canvas map</h3>
                </div>
              </div>
            </div>
            <div className={styles.createModalBody}>
              {!category ? (
                <label className={styles.createModalField}>
                  <span>Map category</span>
                  <select
                    className={styles.createModalInput}
                    value={selectedMapCategory}
                    onChange={(event) => setSelectedMapCategory(event.target.value as MapBuilderCategory["mapCategory"])}
                  >
                    {accessibleCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className={styles.createModalField}>
                <span>{resolvedCreateCategory.mapCategory === "incident_investigation" ? "Investigation title" : "Title"}</span>
                <input
                  className={styles.createModalInput}
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder={getTitlePlaceholder(resolvedCreateCategory)}
                />
              </label>
              <label className={styles.createModalField}>
                <span>Description</span>
                <textarea
                  className={`${styles.createModalInput} ${styles.createModalTextarea}`}
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  placeholder={getDescriptionPlaceholder(resolvedCreateCategory)}
                  rows={5}
                />
              </label>
              <div className={styles.createModalActions}>
                <button
                  type="button"
                  className={styles.modalSecondaryButton}
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button type="button" className={styles.modalPrimaryButton} onClick={() => void createMap()} disabled={isCreating}>
                  {isCreating ? "Creating..." : resolvedCreateCategory.mapCategory === "incident_investigation" ? "Create investigation" : "Create new"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {pendingDuplicateRow ? (
        <>
          <button type="button" className={styles.modalBackdrop} aria-label="Close duplicate modal" onClick={() => setPendingDuplicateRow(null)} />
          <div className={`${styles.modal} ${styles.createModal}`} role="dialog" aria-modal="true" aria-label="Duplicate map">
            <div className={styles.createModalHeader}>
              <div className={styles.createModalBrand}>
                <img src="/images/favicon.png" alt="HSES Industry Partners" className={styles.createModalLogo} />
                <div className={styles.createModalBrandCopy}>
                  <span className={styles.createModalEyebrow}>Duplicate map</span>
                  <h3 className={styles.createModalTitle}>Duplicate map?</h3>
                </div>
              </div>
            </div>
            <div className={styles.createModalBody}>
              <p className={styles.dialogText}>
                You are about to duplicate <strong>{pendingDuplicateRow.title}</strong>.
              </p>
              <p className={styles.dialogText}>
                The duplicate will include nodes, components, relationships, and outline content. You will become the owner of the new map.
              </p>
              <div className={styles.createModalActions}>
                <button
                  type="button"
                  className={styles.modalSecondaryButton}
                  onClick={() => setPendingDuplicateRow(null)}
                  disabled={duplicatingMapId === pendingDuplicateRow.id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.modalPrimaryButton}
                  onClick={() => void handleDuplicateMap(pendingDuplicateRow)}
                  disabled={duplicatingMapId === pendingDuplicateRow.id}
                >
                  {duplicatingMapId === pendingDuplicateRow.id ? "Duplicating..." : "Duplicate map"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {pendingDeleteRow ? (
        <>
          <button type="button" className={styles.modalBackdrop} aria-label="Close delete modal" onClick={() => setPendingDeleteRow(null)} />
          <div className={`${styles.modal} ${styles.createModal}`} role="dialog" aria-modal="true" aria-label="Delete map">
            <div className={styles.createModalHeader}>
              <div className={styles.createModalBrand}>
                <img src="/images/favicon.png" alt="HSES Industry Partners" className={styles.createModalLogo} />
                <div className={styles.createModalBrandCopy}>
                  <span className={styles.createModalEyebrow}>Delete map</span>
                  <h3 className={styles.createModalTitle}>Delete map?</h3>
                </div>
              </div>
            </div>
            <div className={styles.createModalBody}>
              <p className={styles.dialogText}>
                You are about to permanently delete <strong>{pendingDeleteRow.title}</strong>.
              </p>
              <ul className={styles.dialogList}>
                <li>The {deleteItemLabel}</li>
                <li>All nodes and canvas components</li>
                <li>All relationships and outline content</li>
                <li>All linked map member access for this map</li>
              </ul>
              <p className={styles.dialogWarning}>This cannot be undone.</p>
              {deleteProgress ? (
                <div className={styles.dialogProgress}>
                  <div className={styles.dialogProgressHeader}>
                    <span>{deleteProgress.message}</span>
                    <span>{deleteProgress.percent}%</span>
                  </div>
                  <div className={styles.dialogProgressTrack}>
                    <div className={styles.dialogProgressFill} style={{ width: `${deleteProgress.percent}%` }} />
                  </div>
                </div>
              ) : null}
              <div className={styles.createModalActions}>
              <button type="button" className={styles.modalSecondaryButton} onClick={() => setPendingDeleteRow(null)} disabled={deletingMapId === pendingDeleteRow.id}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalDangerButton}
                onClick={() => void handleDeleteMap(pendingDeleteRow)}
                disabled={deletingMapId === pendingDeleteRow.id}
              >
                {deletingMapId === pendingDeleteRow.id ? "Deleting..." : "Delete map"}
              </button>
            </div>
          </div>
          </div>
        </>
      ) : null}

      {showBulkDeleteConfirm ? (
        <>
          <button type="button" className={styles.modalBackdrop} aria-label="Close bulk delete modal" onClick={() => setShowBulkDeleteConfirm(false)} />
          <div className={`${styles.modal} ${styles.createModal}`} role="dialog" aria-modal="true" aria-label="Bulk delete maps">
            <div className={styles.createModalHeader}>
              <div className={styles.createModalBrand}>
                <img src="/images/favicon.png" alt="HSES Industry Partners" className={styles.createModalLogo} />
                <div className={styles.createModalBrandCopy}>
                  <span className={styles.createModalEyebrow}>Bulk delete</span>
                  <h3 className={styles.createModalTitle}>Bulk delete maps?</h3>
                </div>
              </div>
            </div>
            <div className={styles.createModalBody}>
              <p className={styles.dialogText}>
                You are about to delete <strong>{selectedOwnedMapIds.length}</strong> selected map{selectedOwnedMapIds.length === 1 ? "" : "s"}.
              </p>
              <ul className={styles.dialogList}>
                <li>The selected maps</li>
                <li>All nodes and canvas components linked to those maps</li>
                <li>All relationships and outline content for those maps</li>
                <li>All linked map member access for those maps</li>
              </ul>
              <p className={styles.dialogWarning}>This cannot be undone.</p>
              {bulkDeleteProgress ? (
                <div className={styles.dialogProgress}>
                  <div className={styles.dialogProgressHeader}>
                    <span>{bulkDeleteProgress.message}</span>
                    <span>{bulkDeleteProgress.percent}%</span>
                  </div>
                  <div className={styles.dialogProgressTrack}>
                    <div className={styles.dialogProgressFill} style={{ width: `${bulkDeleteProgress.percent}%` }} />
                  </div>
                </div>
              ) : null}
              <div className={styles.createModalActions}>
                <button type="button" className={styles.modalSecondaryButton} onClick={() => setShowBulkDeleteConfirm(false)} disabled={isBulkDeleting}>
                  Cancel
                </button>
                <button type="button" className={styles.modalDangerButton} onClick={() => void handleBulkDelete()} disabled={isBulkDeleting}>
                  {isBulkDeleting ? "Deleting..." : "Delete selected"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
