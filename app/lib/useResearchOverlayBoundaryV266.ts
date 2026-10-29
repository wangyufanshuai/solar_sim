"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  atlasRuntimeStore,
  useAtlasRuntimeStore,
  type AtlasResearchOverlayV266,
} from "./atlasRuntimeStore";

export function useResearchOverlayBoundaryV266(
  overlay: Exclude<AtlasResearchOverlayV266, "none">,
) {
  const activeOverlay = useAtlasRuntimeStore((snapshot) => snapshot.researchOverlay);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = activeOverlay === overlay;

  const open = useCallback(() => atlasRuntimeStore.openResearchOverlay(overlay), [overlay]);
  const close = useCallback(() => {
    atlasRuntimeStore.closeResearchOverlay(overlay);
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }, [overlay]);

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      const root = panelRef.current;
      const target = root?.querySelector<HTMLElement>(
        '[data-atlas-accessibility-focus-target="true"],button,input,select,textarea',
      );
      (target ?? root)?.focus({ preventScroll: true });
    });
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      close();
    };
    window.addEventListener("keydown", handleEscape, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleEscape, true);
    };
  }, [close, isOpen]);

  return { activeOverlay, isOpen, open, close, triggerRef, panelRef } as const;
}
