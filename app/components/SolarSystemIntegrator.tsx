"use client";

import { useFrame } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import { C_LIGHT, DAY_SECONDS } from "../lib/physicalConstants";
import { isPhysicsRuntime } from "../lib/physicsRuntime";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import { SolarSystemPhysics } from "../lib/solarSystemPhysics";
import { mainThreadLastAcceptedSubsteps } from "../lib/solarIntegrationMetrics";
import type { PhysicsPrecisionTier } from "../lib/physicsPrecision";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import { scientificFrameStep } from "../lib/physicsExecutionPolicy";

const INV_C2 = 1 / (C_LIGHT * C_LIGHT);

export type SolarSystemIntegratorProps = {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  simDaysRef: MutableRefObject<number>;
  isPlaying: boolean;
  daysPerSecond: number;
  /** When false, integration uses pure Newton (invC2 = 0) unless tier is `newton`. */
  relativityEnabledRef: MutableRefObject<boolean>;
  precisionTierRef: MutableRefObject<PhysicsPrecisionTier>;
  /** Time-travel scrub: skip forward integration while true. */
  integrationSuspendedRef?: MutableRefObject<boolean>;
  /**
   * When true, the global EIH integrator is paused.
   * Used during local launch mode to prevent the N-body simulation from advancing.
   */
  localLaunchActiveRef?: MutableRefObject<boolean>;
  /** Floating origin ref for switching between N-body and galactic potential. */
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
};

/**
 * Advances N-body physics each frame: Web Worker + SharedArrayBuffer when available,
 * otherwise main-thread `SolarSystemPhysics`.
 *
 * When `localLaunchActiveRef` is true, global integration is skipped entirely —
 * the launch physics runs independently in LaunchSceneView.
 */
export default function SolarSystemIntegrator({
  physicsRef,
  simDaysRef,
  isPlaying,
  daysPerSecond,
  relativityEnabledRef,
  precisionTierRef,
  integrationSuspendedRef,
  localLaunchActiveRef,
  floatingOriginRef,
}: SolarSystemIntegratorProps) {
  useFrame((_, dt) => {
    const p = physicsRef.current;
    if (!p) return;
    const fixed = scientificFrameStep(p.getExecutionPolicy());
    // A completed worker step must be acknowledged even if playback was just paused.
    if (fixed && isPhysicsRuntime(p)) simDaysRef.current = p.getSimDays();
    // Pause global physics during local launch mode
    if (localLaunchActiveRef?.current) return;
    if (integrationSuspendedRef?.current) return;
    if (!isPlaying || daysPerSecond <= 0) return;
    // Display mode retains its existing LOD behavior. Scientific mode never reads LOD.
    if (p.getScientificFailure()) return;
    const wantGalactic = fixed ? false : floatingOriginRef.current.lodTier !== "solar";
    if (!isPhysicsRuntime(p) && p instanceof SolarSystemPhysics) {
      const currentGalactic = p.getGalacticMode();
      if (wantGalactic !== currentGalactic) {
        p.setGalacticMode(wantGalactic);
      }
    }

    const dtSimS = fixed?.dtSimS ?? dt * daysPerSecond * DAY_SECONDS;
    const invC2 = fixed?.invC2 ?? (relativityEnabledRef.current ? INV_C2 : 0);
    const precisionTier = fixed?.tier ?? precisionTierRef.current;
    const simDeltaDays = fixed?.simDeltaDays ?? dt * daysPerSecond;
    if (!fixed) simDaysRef.current += simDeltaDays;

    if (isPhysicsRuntime(p)) {
      p.integrateOneFrame(dtSimS, invC2, precisionTier, simDeltaDays, wantGalactic);
      mainThreadLastAcceptedSubsteps.value = p.getStepsLastFrame();
    } else {
      try {
        const m = p.integrateOneFrame(dtSimS, invC2, precisionTier);
        if (fixed) simDaysRef.current += m.simSecondsAdvanced / DAY_SECONDS;
        mainThreadLastAcceptedSubsteps.value = m.acceptedSubsteps;
      } catch (error) {
        if (!fixed || !p.getScientificFailure()) throw error;
        mainThreadLastAcceptedSubsteps.value = 0;
        console.error("[physics] Scientific shadow run stopped; rejected step rolled back.", error);
      }
    }
  });
  return null;
}
