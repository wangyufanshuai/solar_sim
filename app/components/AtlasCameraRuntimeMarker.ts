"use client";

import { useCallback, useEffect, useRef } from "react";
import { shouldWriteRuntimeMarker } from "../lib/atlasRuntimeSceneFocusPerformance";

type CameraRuntimeMarkerUpdate = {
  distance?: number;
  rigPolicy?: string;
  originResetNonce?: number;
  force?: boolean;
};

export function useAtlasCameraRuntimeMarkerWriter() {
  const rootRef = useRef<HTMLElement | null>(null);
  const lastWriteRef = useRef(0);
  const valueRef = useRef("");

  const writeMarker = useCallback((args: CameraRuntimeMarkerUpdate) => {
    const root = rootRef.current;
    if (!root) return;
    const distance = args.distance?.toFixed(3) ?? "";
    const rigPolicy = args.rigPolicy ?? "";
    const originResetNonce = args.originResetNonce?.toString() ?? "";
    const nextValue = `${distance}|${rigPolicy}|${originResetNonce}`;
    if (!shouldWriteRuntimeMarker({
      nowMs: performance.now(),
      lastWriteMs: lastWriteRef.current,
      intervalMs: 120,
      previousValue: valueRef.current,
      nextValue,
      force: args.force,
    })) return;
    if (args.distance !== undefined) {
      root.setAttribute("data-atlas-camera-target-distance", distance);
    }
    if (args.rigPolicy !== undefined) {
      root.setAttribute("data-atlas-camera-rig-policy", rigPolicy);
    }
    if (args.originResetNonce !== undefined) {
      root.setAttribute("data-atlas-camera-origin-reset-nonce", originResetNonce);
    }
    valueRef.current = nextValue;
    lastWriteRef.current = performance.now();
  }, []);

  useEffect(() => {
    rootRef.current = document.querySelector<HTMLElement>(
      "[data-atlas-browser-acceptance-version]",
    );
    return () => { rootRef.current = null; };
  }, []);

  return writeMarker;
}
