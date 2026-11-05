import { Worker as NodeWorker } from "node:worker_threads";
import { afterEach, describe, expect, it } from "vitest";
import { C_LIGHT, DAY_SECONDS } from "../lib/physicalConstants";
import { createPhysicsBufferViews, createSharedPhysicsArrayBuffer, META_I32_SEQ, META_F64_SIM_DAYS } from "../lib/physicsSharedBuffer";
import { SolarSystemPhysics } from "../lib/solarSystemPhysics";
import { normalizePhysicsExecutionPolicy, scientificFrameStep, type PhysicsExecutionPolicyInput } from "../lib/physicsExecutionPolicy";

const workers: NodeWorker[] = [];
afterEach(async () => { await Promise.all(workers.splice(0).map((worker) => worker.terminate())); });

type Reply = { type: string; executionPolicy?: unknown; failure?: { reason: string; attemptedSubsteps: number; attemptedSeconds: number } };
function send(worker: NodeWorker, message: unknown): Promise<Reply> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error("worker reply timeout")); }, 8000);
    const cleanup = () => { clearTimeout(timer); worker.off("message", received); worker.off("error", failed); };
    const received = (reply: Reply) => { cleanup(); resolve(reply); };
    const failed = (error: Error) => { cleanup(); reject(error); };
    worker.once("message", received); worker.once("error", failed);
    worker.postMessage(message);
  });
}
async function start(executionPolicy?: PhysicsExecutionPolicyInput) {
  const worker = new NodeWorker(new URL("../../scripts/test-support/physics-worker-node-host.mjs", import.meta.url));
  workers.push(worker);
  const sab = createSharedPhysicsArrayBuffer();
  const ready = await send(worker, { type: "init", sab, forceFixedRk4: false, executionPolicy });
  expect(ready.type).toBe("ready");
  expect(ready.executionPolicy).toEqual(normalizePhysicsExecutionPolicy(executionPolicy));
  return { worker, sab, views: createPhysicsBufferViews(sab) };
}
const policy = { mode: "scientific-shadow", model: "eih-1pn", stepSeconds: 60 } as const;

describe("actual physics worker execution-policy integration", () => {
  it.each(["eih-1pn", "newton-nbody"] as const)("matches main-thread %s state byte-for-byte over multiple steps", async (model) => {
    const executionPolicy = { ...policy, model };
    const { worker, views } = await start(executionPolicy);
    const main = new SolarSystemPhysics({ forceFixedRk4: false, executionPolicy });
    const step = scientificFrameStep(normalizePhysicsExecutionPolicy(executionPolicy))!;
    for (let i = 0; i < 4; i++) {
      const reply = await send(worker, { type: "step", ...step });
      expect(reply.type).toBe("stepDone");
      main.integrateOneFrame(step.dtSimS, step.invC2, step.tier);
      expect(new Uint8Array(views.posM.buffer, views.posM.byteOffset, main.posM.byteLength)).toEqual(new Uint8Array(main.posM.buffer));
      expect(new Uint8Array(views.velM.buffer, views.velM.byteOffset, main.velM.byteLength)).toEqual(new Uint8Array(main.velM.buffer));
      expect(views.metaI32[META_I32_SEQ]).toBe(i + 1);
      expect(views.metaF64[META_F64_SIM_DAYS]).toBeCloseTo((i + 1) * 60 / DAY_SECONDS, 15);
    }
  });

  it.each([
    { galacticMode: true }, { tier: "economy" }, { invC2: 0 },
    { dtSimS: 61 }, { simDeltaDays: 10 },
  ])("rejects a forged step without any shared-byte mutation and remains stopped: %j", async (override) => {
    const { worker, sab } = await start(policy);
    const before = new Uint8Array(sab).slice();
    const step = scientificFrameStep(normalizePhysicsExecutionPolicy(policy))!;
    expect((await send(worker, { type: "step", ...step, ...override })).type).toBe("stepFailed");
    expect(new Uint8Array(sab)).toEqual(before);
    expect((await send(worker, { type: "step", ...step })).type).toBe("stepFailed");
    expect(new Uint8Array(sab)).toEqual(before);
  });

  it("rejects budget exhaustion without advancing calendar or sequence", async () => {
    const executionPolicy = { ...policy, stepSeconds: 4800, maxAccelEvals: 7 };
    const { worker, sab } = await start(executionPolicy);
    const before = new Uint8Array(sab).slice();
    const reply = await send(worker, { type: "step", ...scientificFrameStep(normalizePhysicsExecutionPolicy(executionPolicy))! });
    expect(reply).toMatchObject({ type: "stepFailed", failure: { reason: "max-accel-evals" } });
    expect(new Uint8Array(sab)).toEqual(before);
  });

  it("rolls back an already accepted real worker substep in a synthetic inertial fixture", async () => {
    const executionPolicy = { ...policy, stepSeconds: 4800, maxAccelEvals: 7 };
    const { worker, sab, views } = await start(executionPolicy);
    // Test-only initial data: negligible positive masses yield accepted inertial motion.
    // This is not an astronomical observation or an externally validated physical benchmark.
    views.mass.fill(1e-100);
    views.velM.fill(10);
    const before = new Uint8Array(sab).slice();
    const reply = await send(worker, { type: "step", ...scientificFrameStep(normalizePhysicsExecutionPolicy(executionPolicy))! });
    expect(reply).toMatchObject({ type: "stepFailed", failure: { reason: "max-accel-evals", attemptedSubsteps: 1, attemptedSeconds: 2400 } });
    expect(new Uint8Array(sab)).toEqual(before);
  });

  it.each(["applySnapshot", "init"])("cannot reset a scientific worker using %s", async (type) => {
    const { worker, sab } = await start(policy);
    const before = new Uint8Array(sab).slice();
    expect((await send(worker, { type, sab, forceFixedRk4: false })).type).toBe("stepFailed");
    expect(new Uint8Array(sab)).toEqual(before);
  });

  it("preserves interactive model switching and actual main/worker trajectories", async () => {
    const { worker, views } = await start();
    const main = new SolarSystemPhysics({ forceFixedRk4: false });
    for (const galacticMode of [false, true, false]) {
      const step = { dtSimS: 60, invC2: 1 / C_LIGHT ** 2, tier: "full" as const, simDeltaDays: 60 / DAY_SECONDS, galacticMode };
      expect((await send(worker, { type: "step", ...step })).type).toBe("stepDone");
      main.setGalacticMode(galacticMode);
      main.integrateOneFrame(step.dtSimS, step.invC2, step.tier);
      expect(views.posM.subarray(0, main.n * 3)).toEqual(main.posM);
      expect(views.velM.subarray(0, main.n * 3)).toEqual(main.velM);
    }
  });
});
