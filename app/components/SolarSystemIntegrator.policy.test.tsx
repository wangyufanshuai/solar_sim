import { afterEach, describe, expect, it, vi } from "vitest";
import type { RootState } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import { C_LIGHT, DAY_SECONDS } from "../lib/physicalConstants";
import { SolarSystemPhysics } from "../lib/solarSystemPhysics";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import { PhysicsRuntime } from "../lib/physicsRuntime";
import { createPhysicsBufferViews, createSharedPhysicsArrayBuffer } from "../lib/physicsSharedBuffer";
import { normalizePhysicsExecutionPolicy, scientificFrameStep } from "../lib/physicsExecutionPolicy";
import SolarSystemIntegrator, { type SolarSystemIntegratorProps } from "./SolarSystemIntegrator";

const frame = vi.hoisted(() => ({ current: null as ((state: RootState, dt: number) => void) | null }));
vi.mock("@react-three/fiber", () => ({ useFrame: (callback: typeof frame.current) => { frame.current = callback; } }));
afterEach(() => { vi.restoreAllMocks(); frame.current = null; });

function inputs(physics: SolarSystemPhysicsRef): SolarSystemIntegratorProps {
  return {
    physicsRef: { current: physics }, simDaysRef: { current: 0 },
    isPlaying: true, daysPerSecond: 500,
    relativityEnabledRef: { current: false }, precisionTierRef: { current: "economy" },
    floatingOriginRef: { current: { lodTier: "galaxy" } } as unknown as MutableRefObject<FloatingOriginState>,
  };
}
function tick(dt: number) { frame.current!({} as RootState, dt); }

describe("scientific frame wiring without rendering or art changes", () => {
  it("does not read LOD and ignores render delta, speed, precision and relativity toggles", () => {
    const executionPolicy = { mode: "scientific-shadow", model: "eih-1pn", stepSeconds: 60 } as const;
    const physics = new SolarSystemPhysics({ executionPolicy, forceFixedRk4: false });
    const reference = new SolarSystemPhysics({ executionPolicy, forceFixedRk4: false });
    const props = inputs(physics);
    Object.defineProperty(props.floatingOriginRef, "current", { get: () => { throw new Error("Scientific frame read the camera"); } });
    SolarSystemIntegrator(props);
    for (const dt of [0.001, 0.1, 3]) {
      tick(dt);
      reference.stepSimulatedSeconds(60, 1 / C_LIGHT ** 2);
      expect(physics.posM).toEqual(reference.posM);
      expect(physics.velM).toEqual(reference.velM);
    }
    expect(physics.getGalacticMode()).toBe(false);
    expect(props.simDaysRef.current).toBe(3 * (60 / DAY_SECONDS));
  });

  it("does not advance the calendar or retry after a transactional failure", () => {
    const physics = new SolarSystemPhysics({ activeN: 1, forceFixedRk4: false, executionPolicy: {
      mode: "scientific-shadow", model: "eih-1pn", stepSeconds: 4800, maxDpAttempts: 1,
    } });
    const props = inputs(physics);
    props.simDaysRef.current = 5;
    const before = physics.posM.slice();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    SolarSystemIntegrator(props);
    tick(1); tick(1);
    expect(physics.posM).toEqual(before);
    expect(props.simDaysRef.current).toBe(5);
    expect(error).toHaveBeenCalledTimes(1);
    expect(physics.getScientificFailure()?.reason).toBe("max-attempts");
  });

  it("retains the existing interactive galactic LOD behavior", () => {
    const physics = new SolarSystemPhysics({ forceFixedRk4: false });
    const props = inputs(physics);
    props.daysPerSecond = 1 / DAY_SECONDS;
    SolarSystemIntegrator(props);
    tick(1);
    expect(physics.getGalacticMode()).toBe(true);
    expect(props.simDaysRef.current).toBe(1 / DAY_SECONDS);
  });

  it("synchronizes the acknowledged scientific worker clock while paused without requesting a step", () => {
    let onMessage: ((event: { data: unknown }) => void) | undefined;
    const messages: unknown[] = [];
    const worker = {
      addEventListener: (type: string, callback: typeof onMessage) => { if (type === "message") onMessage = callback; },
      postMessage: (value: unknown) => messages.push(value), terminate: () => undefined,
    } as unknown as Worker;
    const policy = normalizePhysicsExecutionPolicy({ mode: "scientific-shadow", model: "eih-1pn", stepSeconds: 60 });
    const views = createPhysicsBufferViews(createSharedPhysicsArrayBuffer());
    const runtime = new PhysicsRuntime(views, worker, policy);
    const step = scientificFrameStep(policy)!;
    runtime.integrateOneFrame(step.dtSimS, step.invC2, step.tier, step.simDeltaDays, false);
    views.metaF64[0] = 60 / DAY_SECONDS;
    onMessage!({ data: { type: "stepDone" } });
    const props = inputs(runtime);
    props.isPlaying = false;
    SolarSystemIntegrator(props);
    tick(1);
    expect(props.simDaysRef.current).toBe(60 / DAY_SECONDS);
    expect(messages).toHaveLength(1);
  });
});
