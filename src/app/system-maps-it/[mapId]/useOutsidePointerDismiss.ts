"use client";

import { useEffect, type RefObject } from "react";

type DismissRef = RefObject<HTMLElement | null>;

type OutsidePointerDismissParams = {
  enabled?: boolean;
  refs: DismissRef[];
  onDismiss: () => void;
};

type StackedDismissItem = {
  ref: DismissRef;
  onDismiss: () => void;
};

function targetIsInside(ref: DismissRef, target: Node | null) {
  return !!ref.current && !!target && ref.current.contains(target);
}

export function useOutsidePointerDismiss({
  enabled = true,
  refs,
  onDismiss,
}: OutsidePointerDismissParams) {
  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (refs.some((ref) => targetIsInside(ref, target))) return;
      onDismiss();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [enabled, onDismiss, refs]);
}

export function useStackedOutsidePointerDismiss(items: StackedDismissItem[]) {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      for (const item of items) {
        if (targetIsInside(item.ref, target)) return;
        item.onDismiss();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [items]);
}
