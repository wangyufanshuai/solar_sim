"use client";

import { useEffect, useRef } from "react";
import AtlasScaleNavigatorV260 from "./AtlasScaleNavigatorV260";
import PostV593StellarRosterPanel from "./PostV593StellarRosterPanel";
import styles from "./MainlineAWorkspaceNavigationV637.module.css";

type Props = Readonly<{
  selectedCatalogId: string;
  toolsVisible: boolean;
  onFocus: (direction: [number, number, number], catalogId?: string) => void;
  onOpenPerformance: () => void;
}>;

export default function MainlineAWorkspaceNavigationV637(props: Props) {
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const root = document.documentElement;
    const property = "--mainline-a-header-bottom";
    const previous = root.style.getPropertyValue(property);
    let frame: number | null = null;
    let lastValue = "";
    const update = () => {
      frame = null;
      const bounds = header.getBoundingClientRect();
      const next = `${Math.ceil(bounds.bottom + 8)}px`;
      if (next === lastValue) return;
      lastValue = next;
      root.style.setProperty(property, next);
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(header);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      if (frame !== null) cancelAnimationFrame(frame);
      if (root.style.getPropertyValue(property) === lastValue) {
        if (previous) root.style.setProperty(property, previous);
        else root.style.removeProperty(property);
      }
    };
  }, []);

  return (
    <div
      ref={headerRef}
      className={styles.workspaceHeader}
      data-mainline-a-workspace-navigation="v637"
      data-mainline-a-tools-visible={String(props.toolsVisible)}
    >
      <AtlasScaleNavigatorV260 embedded focusObjectId={props.selectedCatalogId} />
      {props.toolsVisible ? (
        <PostV593StellarRosterPanel
          selectedCatalogId={props.selectedCatalogId}
          onFocus={props.onFocus}
          onOpenPerformance={props.onOpenPerformance}
        />
      ) : null}
    </div>
  );
}
