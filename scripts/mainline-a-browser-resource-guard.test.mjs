import assert from "node:assert/strict";
import test from "node:test";
import { inspectBrowserCapacity, createBrowserResourceGuard, resolveBrowserResourceProfile,
  BROWSER_RESOURCE_POLICY, CONSTRAINED_DEVELOPMENT_BROWSER_RESOURCE_POLICY } from "./mainline-a-browser-resource-guard.mjs";
const GiB = 1024 ** 3;

test("capacity guard enforces physical, absolute commit and proportional commit reserves", () => {
  const enough = { freePhysicalBytes: 3 * GiB, commitLimitBytes: 40 * GiB, committedBytes: 35 * GiB };
  assert.equal(inspectBrowserCapacity(enough).ok, true);
  for (const patch of [{ freePhysicalBytes: 1.9 * GiB }, { committedBytes: 36.1 * GiB },
    { commitLimitBytes: 10 * GiB, committedBytes: 8.1 * GiB }, { freePhysicalBytes: null }, { committedBytes: NaN }]) {
    assert.equal(inspectBrowserCapacity({ ...enough, ...patch }).ok, false);
  }
});

test("a failed preflight preserves the observed sample and never starts a browser", async () => {
  const written = []; let closed = false;
  const guard = createBrowserResourceGuard({ environment: {}, sample: async () => ({ freePhysicalBytes: GiB, commitLimitBytes: 40 * GiB, committedBytes: 35 * GiB }),
    onSample: async (sample) => written.push(sample), onStop: async () => { closed = true; } });
  await assert.rejects(guard.check, /physical-memory-below-reserve/);
  assert.equal(written.length, 1); assert.equal(guard.evidence.samples[0].ok, false); assert.equal(closed, false);
  await guard.stop();
});

test("the default policy stays unchanged and constrained development requires an explicit profile", async () => {
  assert.deepEqual(BROWSER_RESOURCE_POLICY, { intervalMs: 15_000, freePhysicalBytesMin: 2 * GiB,
    commitHeadroomBytesMin: 2 * GiB, commitHeadroomRatioMin: .10 });
  const sample = { freePhysicalBytes: 1.25 * GiB, commitLimitBytes: 40 * GiB, committedBytes: 38 * GiB };
  const guard = createBrowserResourceGuard({ environment: {}, sample: async () => sample });
  assert.equal(guard.evidence.profile, "default");
  assert.equal(guard.evidence.policy, BROWSER_RESOURCE_POLICY);
  await assert.rejects(guard.check, /physical-memory-below-reserve,commit-headroom-below-reserve/);
  assert.equal(inspectBrowserCapacity(sample).ok, false);
  assert.equal(inspectBrowserCapacity(sample, CONSTRAINED_DEVELOPMENT_BROWSER_RESOURCE_POLICY).ok, true);
  await guard.stop();
});

test("constrained development enforces physical, absolute commit, and ratio boundaries", () => {
  const policy = resolveBrowserResourceProfile("constrained-development").policy;
  assert.deepEqual(policy, { intervalMs: 10_000, freePhysicalBytesMin: GiB,
    commitHeadroomBytesMin: 1.5 * GiB, commitHeadroomRatioMin: .04 });
  const enough = { freePhysicalBytes: GiB, commitLimitBytes: 25 * GiB, committedBytes: 23.5 * GiB };
  assert.equal(inspectBrowserCapacity(enough, policy).ok, true);
  assert.deepEqual(inspectBrowserCapacity({ ...enough, freePhysicalBytes: GiB - 1 }, policy).issues,
    ["physical-memory-below-reserve"]);
  assert.deepEqual(inspectBrowserCapacity({ ...enough, committedBytes: 23.5 * GiB + 1 }, policy).issues,
    ["commit-headroom-below-reserve"]);
  const ratioBoundary = { freePhysicalBytes: GiB, commitLimitBytes: 50 * GiB, committedBytes: 48 * GiB };
  assert.equal(inspectBrowserCapacity(ratioBoundary, policy).ok, true);
  assert.deepEqual(inspectBrowserCapacity({ ...ratioBoundary, committedBytes: 48 * GiB + 1 }, policy).issues,
    ["commit-headroom-below-reserve"]);
  assert.deepEqual(inspectBrowserCapacity({ ...enough, committedBytes: NaN }, policy).issues,
    ["invalid-capacity-sample"]);
});

test("unknown profiles reject before observing capacity or creating a timer", () => {
  let observations = 0;
  for (const profile of ["constrained", "CONSTRAINED-DEVELOPMENT", "constrained-development ", "disabled"]) {
    assert.throws(() => createBrowserResourceGuard({ environment: { ATLAS_BROWSER_RESOURCE_PROFILE: profile },
      sample: async () => { observations++; } }), /Unknown ATLAS_BROWSER_RESOURCE_PROFILE/);
  }
  assert.equal(observations, 0);
});

test("an explicit constrained guard preserves profile and policy in each sample without regrading earlier failures", async () => {
  const sample = { freePhysicalBytes: 1.25 * GiB, commitLimitBytes: 40 * GiB, committedBytes: 38 * GiB };
  const prior = createBrowserResourceGuard({ environment: {}, sample: async () => sample });
  await assert.rejects(prior.check, /browser-resource-protection/);
  const priorEvidence = JSON.stringify(prior.evidence);
  const environment = { ATLAS_BROWSER_RESOURCE_PROFILE: "constrained-development" };
  const written = [];
  const guard = createBrowserResourceGuard({ environment, sample: async () => sample,
    onSample: async (entry) => written.push(entry) });
  environment.ATLAS_BROWSER_RESOURCE_PROFILE = "default";
  await guard.check();
  assert.equal(guard.evidence.profile, "constrained-development");
  assert.equal(guard.evidence.performanceAcceptance, false);
  assert.equal(guard.evidence.use, "functional-and-visual-development-only-not-performance-acceptance");
  assert.equal(written.length, 1);
  assert.equal(written[0].ok, true);
  assert.equal(written[0].profile, guard.evidence.profile);
  assert.deepEqual(written[0].policy, guard.evidence.policy);
  assert.equal(written[0].performanceAcceptance, false);
  assert.equal(JSON.stringify(prior.evidence), priorEvidence);
  await guard.stop(); await prior.stop();
});

test("constrained periodic sampling uses ten seconds and stops only via the owned-browser callback", async (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  const written = []; const closed = []; let observations = 0;
  const guard = createBrowserResourceGuard({ environment: { ATLAS_BROWSER_RESOURCE_PROFILE: "constrained-development" },
    sample: async () => { observations++; return { freePhysicalBytes: GiB - 1, commitLimitBytes: 40 * GiB, committedBytes: 38 * GiB }; },
    onSample: async (entry) => written.push(entry), onStop: async (reason) => closed.push(reason) });
  guard.start(); t.mock.timers.tick(9_999);
  await new Promise(setImmediate);
  assert.equal(observations, 0);
  t.mock.timers.tick(1); await new Promise(setImmediate);
  assert.equal(observations, 1);
  assert.equal(written[0].ok, false);
  assert.equal(written[0].profile, "constrained-development");
  assert.deepEqual(closed, ["physical-memory-below-reserve"]);
  assert.equal(guard.evidence.stopReason, "physical-memory-below-reserve");
  t.mock.timers.tick(30_000); await new Promise(setImmediate);
  assert.equal(observations, 1);
  await guard.stop();
});
