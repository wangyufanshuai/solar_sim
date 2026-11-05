import { describe, expect, it } from "vitest";
import { PhysicsRuntime } from "./physicsRuntime";
import { normalizePhysicsExecutionPolicy, scientificFrameStep } from "./physicsExecutionPolicy";
import {
  createPhysicsBufferViews,
  createSharedPhysicsArrayBuffer,
  META_I32_FALLBACK_REASON,
  META_I32_MODE,
  META_I32_REJECTED_SUBSTEPS,
  PHYSICS_FALLBACK_MAX_ACCEL_EVALS,
  PHYSICS_MODE_RK4_FALLBACK,
} from "./physicsSharedBuffer";

describe("PhysicsRuntime worker contract", () => {
  it("serializes the selected galactic regime with every step", () => {
    const messages: unknown[] = [];
    const worker = {
      addEventListener: () => undefined,
      postMessage: (message: unknown) => messages.push(message),
      terminate: () => undefined,
    } as unknown as Worker;
    const views = createPhysicsBufferViews(createSharedPhysicsArrayBuffer());
    const runtime = new PhysicsRuntime(views, worker);

    runtime.integrateOneFrame(12, 1.0e-16, "full", 0.25, true);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      type: "step",
      dtSimS: 12,
      invC2: 1.0e-16,
      tier: "full",
      simDeltaDays: 0.25,
      galacticMode: true,
    });
  });

  it("decodes fallback diagnostics without collapsing them to dp", () => {
    const worker = {
      addEventListener: () => undefined,
      postMessage: () => undefined,
      terminate: () => undefined,
    } as unknown as Worker;
    const views = createPhysicsBufferViews(createSharedPhysicsArrayBuffer());
    views.metaI32[META_I32_MODE] = PHYSICS_MODE_RK4_FALLBACK;
    views.metaI32[META_I32_REJECTED_SUBSTEPS] = 7;
    views.metaI32[META_I32_FALLBACK_REASON] = PHYSICS_FALLBACK_MAX_ACCEL_EVALS;
    const runtime = new PhysicsRuntime(views, worker);

    expect(runtime.getModeLastFrame()).toBe("rk4-fallback");
    expect(runtime.getRejectedSubstepsLastFrame()).toBe(7);
    expect(runtime.getFallbackReasonLastFrame()).toBe("max-accel-evals");
  });
});

describe("PhysicsRuntime scientific stop and backpressure", () => {
  function fixture(sendError = false) {
    const messages: unknown[] = [];
    const listeners = new Map<string, (event: { data?: unknown }) => void>();
    const worker = {
      addEventListener: (type: string, callback: (event: { data?: unknown }) => void) => listeners.set(type, callback),
      postMessage: (message: unknown) => { if (sendError) throw new Error("test transport failure"); messages.push(message); }, terminate: () => undefined,
    } as unknown as Worker;
    const policy = normalizePhysicsExecutionPolicy({ mode: "scientific-shadow", model: "eih-1pn", stepSeconds: 60 });
    const runtime = new PhysicsRuntime(createPhysicsBufferViews(createSharedPhysicsArrayBuffer()), worker, policy);
    const step = scientificFrameStep(policy)!;
    const advance = () => runtime.integrateOneFrame(step.dtSimS, step.invC2, step.tier, step.simDeltaDays, step.galacticMode);
    return { runtime, messages, listeners, advance };
  }

  it("allows only one outstanding scientific step and resumes only on completion", () => {
    const { messages, listeners, advance } = fixture();
    expect(advance()).toBe(true);
    expect(advance()).toBe(false);
    expect(messages).toHaveLength(1);
    listeners.get("message")!({ data: { type: "stepDone" } });
    expect(advance()).toBe(true);
    expect(messages).toHaveLength(2);
  });

  it("never emits completion or sends more work after rejection", () => {
    const { runtime, messages, listeners, advance } = fixture();
    let completions = 0;
    runtime.subscribeStepDone(() => { completions += 1; });
    advance();
    listeners.get("message")!({ data: { type: "stepFailed", failure: { reason: "max-attempts", attemptedSubsteps: 1, attemptedSeconds: 10 } } });
    expect(completions).toBe(0);
    listeners.get("message")!({ data: { type: "stepDone" } });
    expect(completions).toBe(0);
    expect(() => advance()).toThrow(/terminated/);
    expect(messages).toHaveLength(1);
    expect(() => runtime.postApplySnapshot({ posAu: [], velAuPerDay: [], massKg: [], n: 0, simDays: 0 })).toThrow(/locked/);
  });

  it.each(["error", "messageerror"])("latches a worker %s without a fallback backend", (type) => {
    const { runtime, listeners, advance } = fixture();
    advance();
    listeners.get(type)!({});
    expect(runtime.getScientificFailure()?.reason).toBe("worker-transport-failed");
    expect(() => advance()).toThrow(/terminated/);
  });

  it("does not publish an unacknowledged worker calendar", () => {
    const { runtime, listeners, advance } = fixture();
    advance();
    runtime.metaF64[0] = 10;
    expect(runtime.getSimDays()).toBe(0);
    listeners.get("message")!({ data: { type: "stepDone" } });
    expect(runtime.getSimDays()).toBe(10);
  });

  it("latches a send failure and cannot silently retry", () => {
    const { runtime, advance } = fixture(true);
    expect(() => advance()).toThrow(/transport failure/);
    expect(runtime.getScientificFailure()?.reason).toBe("worker-send-failed");
    expect(() => advance()).toThrow(/terminated/);
  });

  it("does not allow a terminated scientific worker to accumulate pending work", () => {
    const { runtime, advance } = fixture();
    runtime.terminateWorker();
    expect(runtime.getScientificFailure()?.reason).toBe("worker-terminated");
    expect(() => advance()).toThrow(/terminated/);
  });
});
