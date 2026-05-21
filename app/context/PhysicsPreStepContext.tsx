"use client";

import { useFrame } from "@react-three/fiber";
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { isPhysicsRuntime } from "../lib/physicsRuntime";
import { PHYSICS_ACTIVE_BODY_COUNT } from "../lib/physicsSharedBuffer";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";

/** Blend factor between pre-step and post-step AU positions (sync integrator only). */
export const PHYS_PRE_POST_BLEND = 0.56;

export type PhysicsPreStepContextValue = {
  preAuRef: MutableRefObject<Float64Array>;
  /** True when main-thread integration allows pre/post midpoint blending. */
  blendEnabledRef: MutableRefObject<boolean>;
};

const PhysicsPreStepContext = createContext<PhysicsPreStepContextValue | null>(
  null,
);

export function usePhysicsPreStepOptional(): PhysicsPreStepContextValue | null {
  return useContext(PhysicsPreStepContext);
}

/**
 * Captures `posAu` at the start of each frame (useFrame -1), before {@link SolarSystemIntegrator} runs.
 * Lets renderers blend pre/post integration for smoother motion on the synchronous physics path.
 */
export function PhysicsPreStepProvider({
  physicsRef,
  children,
}: {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  children: ReactNode;
}) {
  const preAuRef = useRef(new Float64Array(PHYSICS_ACTIVE_BODY_COUNT * 3));
  const blendEnabledRef = useRef(false);

  useFrame(() => {
    const p = physicsRef.current;
    if (!p) return;
    blendEnabledRef.current = !isPhysicsRuntime(p);
    if (blendEnabledRef.current) {
      const n3 = PHYSICS_ACTIVE_BODY_COUNT * 3;
      preAuRef.current.set(p.posAu.subarray(0, n3));
    }
  }, -1);

  const value = useMemo<PhysicsPreStepContextValue>(
    () => ({ preAuRef, blendEnabledRef }),
    [],
  );

  return (
    <PhysicsPreStepContext.Provider value={value}>
      {children}
    </PhysicsPreStepContext.Provider>
  );
}
