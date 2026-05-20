"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import type { MapSessionHistorySnapshot } from "./mapSnapshotUtils";

export async function restoreMapSessionHistorySnapshot({
  mapId,
  snapshot,
}: {
  mapId: string;
  snapshot: MapSessionHistorySnapshot;
}) {
  const { error } = await supabaseBrowser.rpc("restore_system_map_session_snapshot", {
    p_map_id: mapId,
    p_snapshot: snapshot,
  });

  if (error) throw error;
}
