"use client";

import { useFrame } from "@react-three/fiber";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { isPhysicsRuntime, type PhysicsRuntime } from "../lib/physicsRuntime";
import {
  META_I32_SEQ,
  PHYSICS_ACTIVE_BODY_COUNT,
} from "../lib/physicsSharedBuffer";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";

const EMA_STEP_MS_MIN = 8;
const EMA_STEP_MS_MAX = 250;

export type PhysicsRenderInterpolationValue = {
  /** True while `physicsRef` is worker-backed `PhysicsRuntime`. */
  workerLerpActiveRef: MutableRefObject<boolean>;
  alphaRef: MutableRefObject<number>;
  prevAuRef: MutableRefObject<Float64Array>;
  currAuRef: MutableRefObject<Float64Array>;
};

const PhysicsRenderInterpolationContext =
  createContext<PhysicsRenderInterpolationValue | null>(null);

export function usePhysicsRenderInterpolationOptional(): PhysicsRenderInterpolationValue | null {
  return useContext(PhysicsRenderInterpolationContext);
}

/**
 * Worker/SAB path: keeps previous/current `posAu` snapshots on `META_I32_SEQ` change and
 * exposes `alpha` in wall time between steps for linear interpolation at 60fps render.
 * `subscribeStepDone` mirrors the same snapshot when the worker posts `stepDone` (plan A+B).
 * Runs at useFrame(-2) so alpha is fresh before {@link PhysicsPreStepProvider} and integrator.
 */
export function PhysicsRenderInterpolationProvider({
  physicsRef,
  children,
}: {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  children: ReactNode;
}) {
  const prevAuRef = useRef(new Float64Array(PHYSICS_ACTIVE_BODY_COUNT * 3));
  const currAuRef = useRef(new Float64Array(PHYSICS_ACTIVE_BODY_COUNT * 3));
  const alphaRef = useRef(1);
  const workerLerpActiveRef = useRef(false);
  const lastSeqRef = useRef(-1);
  const tLastStepRef = useRef(0);
  const emaStepRef = useRef(1000 / 60);
  const initedRef = useRef(false);
  const stepDoneUnsubRef = useRef<(() => void) | null>(null);

  /** Shared by useFrame and `stepDone`; idempotent per `META_I32_SEQ`. */
  const syncOnWorkerStep = (p: PhysicsRuntime) => {
    const seq = p.metaI32[META_I32_SEQ] ?? 0;
    const n3 = PHYSICS_ACTIVE_BODY_COUNT * 3;

    if (!initedRef.current) {
      for (let i = 0; i < n3; i++) {
        const v = p.posAu[i]!;
        prevAuRef.current[i] = v;
        currAuRef.current[i] = v;
      }
      lastSeqRef.current = seq;
      tLastStepRef.current = performance.now();
      alphaRef.current = 1;
      initedRef.current = true;
      return;
    }

    if (seq === lastSeqRef.current) return;

    prevAuRef.current.set(currAuRef.current);
    // SAB `posAu` is sized for PHYSICS_CAPACITY; render only uses active bodies.
    currAuRef.current.set(p.posAu.subarray(0, n3));
    const now = performance.now();
    const tPrev = tLastStepRef.current;
    if (tPrev > 0) {
      const dtStep = now - tPrev;
      const ema = emaStepRef.current;
      emaStepRef.current = Math.min(
        EMA_STEP_MS_MAX,
        Math.max(EMA_STEP_MS_MIN, ema * 0.82 + dtStep * 0.18),
      );
    }
    tLastStepRef.current = now;
    lastSeqRef.current = seq;
    alphaRef.current = 0;
  };

  useEffect(() => {
    return () => {
      stepDoneUnsubRef.current?.();
      stepDoneUnsubRef.current = null;
    };
  }, []);

  useFrame(() => {
    const p = physicsRef.current;
    if (!p) {
      workerLerpActiveRef.current = false;
      initedRef.current = false;
      stepDoneUnsubRef.current?.();
      stepDoneUnsubRef.current = null;
      return;
    }
    const worker = isPhysicsRuntime(p);
    workerLerpActiveRef.current = worker;
    if (!worker) {
      alphaRef.current = 1;
      initedRef.current = false;
      stepDoneUnsubRef.current?.();
      stepDoneUnsubRef.current = null;
      return;
    }

    if (!stepDoneUnsubRef.current) {
      stepDoneUnsubRef.current = p.subscribeStepDone(() => {
        const cur = physicsRef.current;
        if (cur && isPhysicsRuntime(cur)) syncOnWorkerStep(cur);
      });
    }

    const wasInitedBeforeFrame = initedRef.current;
    syncOnWorkerStep(p);
    if (!wasInitedBeforeFrame) {
      return;
    }

    const now = performance.now();
    const ema = emaStepRef.current;
    const dt = now - tLastStepRef.current;
    alphaRef.current =
      ema > 1e-6 ? Math.min(1, Math.max(0, dt / ema)) : 1;
  }, -2);

  const value = useMemo<PhysicsRenderInterpolationValue>(
    () => ({
      workerLerpActiveRef,
      alphaRef,
      prevAuRef,
      currAuRef,
    }),
    [],
  );

  return (
    <PhysicsRenderInterpolationContext.Provider value={value}>
      {children}
    </PhysicsRenderInterpolationContext.Provider>
  );
}
