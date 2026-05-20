import type { InvestigationTemplateSnapshot } from "@/lib/investigationTemplates";
import {
  normalizeTypeRanks,
  type AnchorLinkRow,
  type CanvasElementRow,
  type DocumentNodeRow,
  type DocumentTypeRow,
  type NodeRelationRow,
  type OutlineItemRow,
  type SystemMap,
} from "./canvasShared";
import type {
  MapCategoryId,
} from "./mapCategories";
import { defaultMapCategoryId } from "./mapCategories";

export type MapSessionHistorySnapshot = InvestigationTemplateSnapshot & {
  map: Pick<SystemMap, "title" | "description" | "map_code" | "map_category">;
};

type BuildSnapshotParams = {
  types: DocumentTypeRow[];
  nodes: DocumentNodeRow[];
  elements: CanvasElementRow[];
  relations: NodeRelationRow[];
  anchorLinks: AnchorLinkRow[];
  outlineItems: OutlineItemRow[];
  includeElementCreator?: boolean;
};

export function buildInvestigationTemplateSnapshot({
  types,
  nodes,
  elements,
  relations,
  anchorLinks,
  outlineItems,
  includeElementCreator = false,
}: BuildSnapshotParams): InvestigationTemplateSnapshot {
  return {
    types: types.map((item) => ({
      id: item.id,
      map_id: item.map_id,
      name: item.name,
      level_rank: item.level_rank,
      band_y_min: item.band_y_min,
      band_y_max: item.band_y_max,
      is_active: item.is_active,
    })),
    nodes: nodes.map((item) => ({
      id: item.id,
      type_id: item.type_id,
      title: item.title,
      document_number: item.document_number,
      discipline: item.discipline,
      owner_user_id: item.owner_user_id,
      owner_name: item.owner_name,
      user_group: item.user_group,
      pos_x: item.pos_x,
      pos_y: item.pos_y,
      width: item.width,
      height: item.height,
      is_archived: item.is_archived,
    })),
    elements: elements.map((item) => {
      const snapshotElement = {
        id: item.id,
        element_type: item.element_type,
        heading: item.heading,
        color_hex: item.color_hex,
        element_config: item.element_config,
        pos_x: item.pos_x,
        pos_y: item.pos_y,
        width: item.width,
        height: item.height,
      };
      return includeElementCreator
        ? {
            ...snapshotElement,
            created_by_user_id: item.created_by_user_id,
          }
        : snapshotElement;
    }),
    relations: relations.map((item) => ({
      id: item.id,
      from_node_id: item.from_node_id,
      to_node_id: item.to_node_id,
      source_grouping_element_id: item.source_grouping_element_id,
      target_grouping_element_id: item.target_grouping_element_id,
      source_system_element_id: item.source_system_element_id,
      target_system_element_id: item.target_system_element_id,
      relation_type: item.relation_type,
      relationship_description: item.relationship_description,
      relationship_disciplines: item.relationship_disciplines,
      relationship_category: item.relationship_category,
      relationship_custom_type: item.relationship_custom_type,
    })),
    anchorLinks: anchorLinks.map((item) => ({
      id: item.id,
      anchor_id: item.anchor_id,
      linked_anchor_id: item.linked_anchor_id,
      sort_order: item.sort_order,
      created_by_user_id: item.created_by_user_id,
    })),
    outlineItems: outlineItems.map((item) => ({
      id: item.id,
      node_id: item.node_id,
      kind: item.kind,
      heading_level: item.heading_level,
      parent_heading_id: item.parent_heading_id,
      heading_id: item.heading_id,
      title: item.title,
      content_text: item.content_text,
      sort_order: item.sort_order,
    })),
  };
}

export function buildMapSessionHistorySnapshot(
  map: SystemMap | null,
  snapshotParams: BuildSnapshotParams
): MapSessionHistorySnapshot | null {
  if (!map) return null;
  return {
    map: {
      title: map.title,
      description: map.description,
      map_code: map.map_code,
      map_category: map.map_category ?? defaultMapCategoryId,
    },
    ...buildInvestigationTemplateSnapshot({
      ...snapshotParams,
      includeElementCreator: true,
    }),
  };
}

export function resolveMapSessionHistorySnapshotState(snapshot: MapSessionHistorySnapshot) {
  const mapCategory = (snapshot.map.map_category ?? defaultMapCategoryId) as MapCategoryId;
  return {
    mapPatch: {
      title: snapshot.map.title,
      description: snapshot.map.description ?? null,
      map_code: snapshot.map.map_code ?? null,
      map_category: mapCategory,
    },
    titleDraft: snapshot.map.title,
    descriptionDraft: snapshot.map.description ?? "",
    codeDraft: snapshot.map.map_code ?? "",
    mapCategory,
    types: normalizeTypeRanks(snapshot.types as DocumentTypeRow[]),
    nodes: snapshot.nodes as DocumentNodeRow[],
    elements: snapshot.elements as CanvasElementRow[],
    relations: snapshot.relations as NodeRelationRow[],
    anchorLinks: ((snapshot as { anchorLinks?: AnchorLinkRow[] }).anchorLinks ?? []) as AnchorLinkRow[],
    outlineItems: snapshot.outlineItems as OutlineItemRow[],
  };
}
