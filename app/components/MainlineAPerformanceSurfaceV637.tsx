"use client";

import { useEffect, useRef, useState } from "react";
import MainlineAPerformancePanelV625 from "./MainlineAPerformancePanelV625";
import { focusMainlineATargetV637 } from "../lib/mainlineAPanelNavigationV637";
import {
  observeMainlineAPerformanceDockLayoutV638,
  restoreMainlineAPerformanceDockFocusV638,
  type MainlineAPerformanceDockLayoutV638,
} from "../lib/mainlineAPerformanceDockLayoutV638";

export default function MainlineAPerformanceSurfaceV637({ onClose, selectedCatalogId, onFocusCatalogObject, onClearFocus }: {
  onClose: () => void;
  selectedCatalogId: string;
  onFocusCatalogObject: (catalogId: string) => void;
  onClearFocus: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const returnTargetRef = useRef<HTMLElement | null>(null);
  const inlineTargetRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef(false);
  const [dockState, setDockState] = useState<{ layout: MainlineAPerformanceDockLayoutV638; inlineTarget: HTMLElement | null } | null>(null);
  const dockLayout = dockState?.layout;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    return observeMainlineAPerformanceDockLayoutV638(host, (next, inlineTarget, restoreHadFocus) => {
      if (restoreHadFocus && inlineTargetRef.current !== inlineTarget) restoreFocusRef.current = true;
      inlineTargetRef.current = inlineTarget;
      setDockState((previous) => previous && previous.inlineTarget === inlineTarget
        && previous.layout.right === next.right && previous.layout.bottom === next.bottom
        && previous.layout.maxWidth === next.maxWidth && previous.layout.maxHeight === next.maxHeight
        && previous.layout.status === next.status && previous.layout.mode === next.mode && previous.layout.hitStatus === next.hitStatus
        ? previous : { layout: next, inlineTarget });
    });
  }, []);

  useEffect(() => {
    if (!restoreFocusRef.current) return;
    const frame = requestAnimationFrame(() => {
      restoreFocusRef.current = false;
      if (hostRef.current) restoreMainlineAPerformanceDockFocusV638(hostRef.current, dockState?.inlineTarget ?? null);
    });
    return () => cancelAnimationFrame(frame);
  }, [dockState]);

  useEffect(() => {
    returnTargetRef.current = document.querySelector<HTMLElement>("[data-mainline-a-tools-toggle]");
    const frame = requestAnimationFrame(() => {
      if (document.querySelector("dialog[open]")) return;
      const panel = hostRef.current?.querySelector<HTMLElement>("[data-mainline-a-performance]");
      const initial = panel?.querySelector<HTMLElement>("button:not([hidden]):not([disabled])");
      if (initial) focusMainlineATargetV637(initial);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function close() {
    const target = returnTargetRef.current;
    onClose();
    requestAnimationFrame(() => {
      if (document.querySelector("dialog[open], [role='dialog'][aria-modal='true'], [data-mainline-a-performance]")) return;
      if (!focusMainlineATargetV637(target)) {
        focusMainlineATargetV637(document.querySelector<HTMLElement>("[data-mainline-a-tools-toggle]"));
      }
    });
  }

  return (
    <div ref={hostRef} data-mainline-a-modeless-observer="true" data-mainline-a-observer-dock-layout={dockLayout?.status ?? "pending"} data-mainline-a-observer-dock-mode={dockLayout?.mode ?? "pending"} data-mainline-a-observer-dock-hit={dockLayout?.hitStatus ?? "pending"}>
      <MainlineAPerformancePanelV625 onClose={close} selectedCatalogId={selectedCatalogId} onFocusCatalogObject={onFocusCatalogObject} onClearFocus={onClearFocus} dockedMode={dockLayout?.mode ?? "inline"} dockedTarget={dockState?.inlineTarget} dockedStyle={dockLayout ? {
        right: dockLayout.right, bottom: dockLayout.bottom,
        maxHeight: dockLayout.maxHeight, maxWidth: dockLayout.maxWidth,
      } : undefined} />
    </div>
  );
}
