"use client";

import { useCallback, useEffect, useRef } from "react";
import { shouldWriteRuntimeMarker } from "../lib/atlasRuntimeSceneFocusPerformance";

type CameraRuntimeMarkerUpdate = {
  distance?: number;
  rigPolicy?: string;
  originResetNonce?: number;
  /** Actual camera state sampled after OrbitControls.update(). */
  actualPosition?: { x: number; y: number; z: number };
  actualTarget?: { x: number; y: number; z: number };
  actualDirection?: { x: number; y: number; z: number };
  actualUp?: { x: number; y: number; z: number };
  actualQuaternion?: { x: number; y: number; z: number; w: number };
  actualFov?: number;
  actualZoom?: number;
  bookmarkRestoredRequestId?: number;
  bookmarkDistanceBoundAdjusted?: boolean;
  bookmarkSavedDistance?: number;
  bookmarkRestoredDistance?: number;
  force?: boolean;
};

function formatVector(value: { x: number; y: number; z: number } | undefined) {
  if (!value) return "";
  return [value.x, value.y, value.z]
    .map((component) => Number.isFinite(component) ? component.toFixed(5) : "")
    .join(",");
}

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
    const actualPosition = formatVector(args.actualPosition);
    const actualTarget = formatVector(args.actualTarget);
    const actualDirection = formatVector(args.actualDirection);
    const actualUp = formatVector(args.actualUp);
    const actualQuaternion = args.actualQuaternion
      ? [args.actualQuaternion.x, args.actualQuaternion.y, args.actualQuaternion.z, args.actualQuaternion.w].map((value) => value.toFixed(8)).join(",") : "";
    const nextValue = `${distance}|${rigPolicy}|${originResetNonce}|${actualPosition}|${actualTarget}|${actualDirection}|${actualUp}|${actualQuaternion}|${args.actualFov}|${args.actualZoom}`;
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
    if (args.actualPosition !== undefined) {
      root.setAttribute("data-atlas-camera-actual-position", actualPosition);
    }
    if (args.actualTarget !== undefined) {
      root.setAttribute("data-atlas-camera-actual-target", actualTarget);
    }
    if (args.actualDirection !== undefined) {
      // `direction` is the camera's world-space forward vector, sampled from
      // the camera after controls.update() (it is not the focus command).
      root.setAttribute("data-atlas-camera-actual-direction", actualDirection);
      root.setAttribute("data-atlas-camera-actual-forward", actualDirection);
    }
    if (args.actualUp !== undefined) root.setAttribute("data-atlas-camera-actual-up", actualUp);
    if (args.actualQuaternion !== undefined) root.setAttribute("data-atlas-camera-actual-quaternion", actualQuaternion);
    if (args.actualFov !== undefined) root.setAttribute("data-atlas-camera-actual-fov", args.actualFov.toFixed(8));
    if (args.actualZoom !== undefined) root.setAttribute("data-atlas-camera-actual-zoom", args.actualZoom.toFixed(8));
    if (args.bookmarkRestoredRequestId !== undefined) root.setAttribute("data-mainline-a-bookmark-restored-request-id", String(args.bookmarkRestoredRequestId));
    if (args.bookmarkDistanceBoundAdjusted !== undefined) root.setAttribute("data-mainline-a-bookmark-distance-bound-adjusted", String(args.bookmarkDistanceBoundAdjusted));
    if (args.bookmarkSavedDistance !== undefined) root.setAttribute("data-mainline-a-bookmark-saved-distance", args.bookmarkSavedDistance.toFixed(8));
    if (args.bookmarkRestoredDistance !== undefined) root.setAttribute("data-mainline-a-bookmark-restored-distance", args.bookmarkRestoredDistance.toFixed(8));
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
