"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { DesktopNodeAction } from "./useCanvasAsideController";
import type { CanvasSelectionSetters, CanvasSelectionTarget } from "./canvasSelection";

type PrimaryAsideKind = CanvasSelectionTarget;

type UsePrimaryAsideRegistryParams = {
  isMobile: boolean;
  selectionSetters: CanvasSelectionSetters;
  setDesktopNodeAction: Dispatch<SetStateAction<DesktopNodeAction>>;
  handleCloseDocumentPropertiesPanel: () => void;
  isPrimaryLeftAsideOpen: (key: string | null) => boolean;
};

const primaryAsideKeyPrefixByKind: Record<PrimaryAsideKind, string> = {
  document: "document",
  category: "category",
  system: "system",
  processComponent: "process",
  person: "person",
  anchor: "anchor",
  grouping: "grouping",
  sticky: "sticky",
  image: "image",
  textBox: "textbox",
  table: "table",
  flowShape: "shape",
  bowtieElement: "bowtie",
};

export const getPrimaryAsideKey = (kind: PrimaryAsideKind, id: string | null | undefined) =>
  id ? `${primaryAsideKeyPrefixByKind[kind]}:${id}` : null;

export const usePrimaryAsideRegistry = ({
  isMobile,
  selectionSetters,
  setDesktopNodeAction,
  handleCloseDocumentPropertiesPanel,
  isPrimaryLeftAsideOpen,
}: UsePrimaryAsideRegistryParams) => {
  const closeResponsivePrimaryAside = useCallback(
    (closeMobileAside: () => void) => {
      if (isMobile) {
        closeMobileAside();
        return;
      }
      setDesktopNodeAction(null);
    },
    [isMobile, setDesktopNodeAction]
  );

  const closePrimaryAside = useCallback(
    (kind: PrimaryAsideKind) => {
      if (kind === "document") {
        closeResponsivePrimaryAside(handleCloseDocumentPropertiesPanel);
        return;
      }

      closeResponsivePrimaryAside(() => {
        switch (kind) {
          case "category":
            selectionSetters.setSelectedProcessId(null);
            break;
          case "system":
            selectionSetters.setSelectedSystemId(null);
            break;
          case "processComponent":
            selectionSetters.setSelectedProcessComponentId(null);
            break;
          case "person":
            selectionSetters.setSelectedPersonId(null);
            break;
          case "anchor":
            selectionSetters.setSelectedAnchorId(null);
            break;
          case "grouping":
            selectionSetters.setSelectedGroupingId(null);
            break;
          case "sticky":
            selectionSetters.setSelectedStickyId(null);
            break;
          case "image":
            selectionSetters.setSelectedImageId(null);
            break;
          case "textBox":
            selectionSetters.setSelectedTextBoxId(null);
            break;
          case "table":
            selectionSetters.setSelectedTableId(null);
            break;
          case "flowShape":
            selectionSetters.setSelectedFlowShapeId(null);
            break;
          case "bowtieElement":
            selectionSetters.setSelectedBowtieElementId(null);
            break;
        }
      });
    },
    [closeResponsivePrimaryAside, handleCloseDocumentPropertiesPanel, selectionSetters]
  );

  const getPrimaryAsideOpen = useCallback(
    (kind: PrimaryAsideKind, selectedEntity: unknown, selectedId: string | null) => {
      if (kind !== "document" && isMobile) return Boolean(selectedEntity);
      return isPrimaryLeftAsideOpen(getPrimaryAsideKey(kind, selectedId));
    },
    [isMobile, isPrimaryLeftAsideOpen]
  );

  return {
    closePrimaryAside,
    getPrimaryAsideOpen,
  };
};
