"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import { applyHistoryEntryToPhysics } from "../lib/applyPhysicsSnapshot";
import { PhysicsHistoryStack } from "../lib/physicsHistoryStack";
import { mainThreadLastAcceptedSubsteps } from "../lib/solarIntegrationMetrics";
import {
  fillInterpolatedHistory,
  writeHistoryEntryFromPhysics,
  type HistoryEntry,
} from "../lib/physicsSnapshot";
import { PHYSICS_ACTIVE_BODY_COUNT } from "../lib/physicsSharedBuffer";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";

const SCRUB_LIVE_THRESHOLD = 0.9995;

function allocEntry(n: number): HistoryEntry {
  return {
    simDays: 0,
    posAu: new Float64Array(n * 3),
    velAuPerDay: new Float64Array(n * 3),
    massKg: new Float64Array(n),
  };
}

export type PhysicsHistoryBridgeProps = {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  simDaysRef: MutableRefObject<number>;
  isPlaying: boolean;
  integrationSuspendedRef: MutableRefObject<boolean>;
  scrubURef: MutableRefObject<number>;
  scrubbingRef: MutableRefObject<boolean>;
  historyRef: MutableRefObject<PhysicsHistoryStack>;
};

/**
 * Records snapshots every 100 accepted substeps; applies interpolated state when scrubbing.
 * Runs after {@link SolarSystemIntegrator} (`useFrame` priority 1).
 */
export default function PhysicsHistoryBridge({
  physicsRef,
  simDaysRef,
  isPlaying,
  integrationSuspendedRef,
  scrubURef,
  scrubbingRef,
  historyRef,
}: PhysicsHistoryBridgeProps) {
  const liveTip = useRef<HistoryEntry | null>(null);
  const interpScratch = useRef<HistoryEntry | null>(null);
  const nCap = PHYSICS_ACTIVE_BODY_COUNT;

  useMemo(() => {
    liveTip.current = allocEntry(nCap);
    interpScratch.current = allocEntry(nCap);
  }, [nCap]);

  useFrame(() => {
    const p = physicsRef.current;
    const frozenLive = liveTip.current;
    const interpOut = interpScratch.current;
    if (!p || !frozenLive || !interpOut) return;

    const n = p.n;
    if (frozenLive.massKg.length < n) return;

    const suspended = integrationSuspendedRef.current;

    if (!suspended) {
      writeHistoryEntryFromPhysics(p, simDaysRef.current, n, frozenLive);
    }

    if (suspended) {
      fillInterpolatedHistory(
        historyRef.current.getSnapshots(),
        frozenLive,
        scrubURef.current,
        interpOut,
      );
      applyHistoryEntryToPhysics(p, interpOut);
      simDaysRef.current = interpOut.simDays;
      return;
    }

    const atLiveEdge =
      scrubURef.current >= SCRUB_LIVE_THRESHOLD && !scrubbingRef.current;
    if (isPlaying && atLiveEdge) {
      const sub = mainThreadLastAcceptedSubsteps.value;
      historyRef.current.recordAfterFrame(
        p,
        simDaysRef.current,
        sub,
        true,
      );
    }
  }, 1);

  return null;
}
