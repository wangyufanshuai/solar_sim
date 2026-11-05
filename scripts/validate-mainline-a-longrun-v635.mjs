const MINIMUM_DURATION_MS = 30 * 60 * 1000;
const REQUIRED_RUNS = 2;
const MAXIMUM_RUNS = 32;
const SHA = /^[a-f0-9]{64}$/u;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const label = (value) => typeof value === "string" && value.trim().length > 0;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function inspectFrames(frame, duration, issues, prefix) {
  if (!object(frame) || !Number.isSafeInteger(frame.sampleCount) || frame.sampleCount < 2
    || !["totalMs", "minMs", "p50Ms", "p95Ms", "maxMs"].every((key) => finite(frame[key]))) {
    issues.push(`${prefix}:raf-summary-invalid`);
    return;
  }
  const ordered = frame.minMs >= 0 && frame.minMs <= frame.p50Ms && frame.p50Ms <= frame.p95Ms && frame.p95Ms <= frame.maxMs;
  const mean = frame.totalMs / frame.sampleCount;
  if (!ordered || mean < frame.minMs || mean > frame.maxMs || frame.maxMs > duration) issues.push(`${prefix}:raf-summary-inconsistent`);
  if (frame.totalMs < duration * 0.95 || frame.totalMs > duration + 250) issues.push(`${prefix}:raf-coverage-insufficient`);
}

function inspectTimeline(timeline, checkpoints, startedAt, duration, issues, prefix) {
  if (!Array.isArray(timeline) || timeline.length < 4 || timeline.length > 64) {
    issues.push(`${prefix}:continuous-timeline-missing`);
    return;
  }
  let previous = -1;
  for (const event of timeline) {
    if (!object(event) || !finite(event.elapsedMs) || event.elapsedMs < previous || event.elapsedMs > duration + 250
      || !label(event.scene) || !["baseline", "active", "returned", "finished", "visible"].includes(event.event)) {
      issues.push(`${prefix}:continuous-timeline-invalid`);
    }
    previous = object(event) ? event.elapsedMs : previous;
  }
  const phases = timeline.filter((event) => ["baseline", "active", "returned", "finished"].includes(event?.event));
  if (!same(phases.map((event) => event.event), ["baseline", "active", "returned", "finished"])
    || phases[0]?.elapsedMs > 250 || Math.abs((phases.at(-1)?.elapsedMs ?? 0) - duration) > 250) {
    issues.push(`${prefix}:timeline-span-invalid`);
  }
  if (!Array.isArray(checkpoints) || checkpoints.length !== 3) {
    issues.push(`${prefix}:timeline-checkpoints-missing`);
    return;
  }
  const start = Date.parse(startedAt);
  for (let index = 0; index < 3; index += 1) {
    const checkpoint = checkpoints[index];
    const event = phases[index];
    if (!object(checkpoint) || checkpoint.phase !== ["baseline", "active", "returned"][index]
      || !finite(checkpoint.elapsedMs) || !finite(Date.parse(checkpoint.capturedAt))
      || Math.abs(Date.parse(checkpoint.capturedAt) - start - checkpoint.elapsedMs) > 250
      || checkpoint.scene !== event?.scene || Math.abs(checkpoint.elapsedMs - (event?.elapsedMs ?? NaN)) > 250) {
      issues.push(`${prefix}:timeline-checkpoint-mismatch`);
    }
  }
}

function inspectRun(replay, expectedBuild, index, issues) {
  const prefix = `run:${index}`;
  if (!object(replay) || replay.schema !== "mainline-a-resource-observation-replay-v633"
    || replay.status !== "measured-local" || !Array.isArray(replay.issues) || replay.issues.length) {
    issues.push(`${prefix}:raw-replay-not-verified`);
    return null;
  }
  if (replay.fixture === true || replay.transport === "fixture-replay") issues.push(`${prefix}:fixture-not-admitted`);
  if (!label(replay.runId) || !SHA.test(replay.rawSha256 ?? "") || replay.expectedSha256 !== replay.rawSha256
    || !SHA.test(replay.buildReceiptSha256 ?? "") || replay.buildReceiptSha256 !== expectedBuild?.receiptSha256) {
    issues.push(`${prefix}:raw-or-build-digest-invalid`);
  }
  const identity = expectedBuild?.runtimeBuildId ?? expectedBuild?.buildId;
  if (!label(identity) || !label(expectedBuild?.branch) || !label(expectedBuild?.head)
    || replay.build?.buildId !== identity || replay.build?.branch !== expectedBuild.branch || replay.build?.head !== expectedBuild.head) {
    issues.push(`${prefix}:build-mismatch`);
  }
  if (replay.baselineRestored !== true || replay.resourceReleaseObserved !== true || replay.retainedCount !== 0 || !(replay.acquiredCount > 0)
    || !(replay.releasedCount > 0) || replay.registryEstimatedBytesDelta !== 0
    || replay.physicalGpuMemoryClaim !== false || replay.scientificPayloadWriteback !== false) {
    issues.push(`${prefix}:resource-baseline-not-restored`);
  }
  const summary = replay.observationSummary;
  if (!object(summary) || summary.validated !== true) {
    issues.push(`${prefix}:validated-summary-missing`);
    return null;
  }
  const started = typeof summary.startedAt === "string" ? Date.parse(summary.startedAt) : NaN;
  const ended = typeof summary.endedAt === "string" ? Date.parse(summary.endedAt) : NaN;
  const duration = ended - started;
  if (!finite(started) || !finite(ended) || !finite(summary.durationMs) || summary.durationMs !== duration
    || duration < MINIMUM_DURATION_MS || !finite(summary.requestedDurationMs)
    || summary.requestedDurationMs < MINIMUM_DURATION_MS || summary.requestedDurationMs > duration) {
    issues.push(`${prefix}:duration-under-thirty-minutes-or-inconsistent`);
  }
  if (summary.sessionState !== "finished" || summary.durationSatisfied !== true
    || !Array.isArray(summary.sessionIssues) || summary.sessionIssues.length !== 0) issues.push(`${prefix}:session-incomplete`);
  if (summary.visibility?.startedVisible !== true || summary.visibility?.endedVisible !== true
    || summary.visibility?.interruptions !== 0) issues.push(`${prefix}:visibility-not-continuous`);
  if (summary.frameSummarySource !== "requestAnimationFrame"
    || !["exact-samples", "fixed-histogram-upper-bound"].includes(summary.frameSummaryMethod)) issues.push(`${prefix}:raf-provenance-invalid`);
  if (!["desktop", "mobile-simulated"].includes(summary.device) || summary.viewport?.device !== summary.device
    || !["width", "height", "devicePixelRatio"].every((key) => finite(summary.viewport?.[key]) && summary.viewport[key] > 0)) {
    issues.push(`${prefix}:device-unverified`);
  }
  inspectFrames(summary.frameSummary, duration, issues, prefix);
  inspectTimeline(summary.timeline, summary.checkpoints, summary.startedAt, duration, issues, prefix);
  return {
    runId: replay.runId, rawSha256: replay.rawSha256, startedAt: summary.startedAt, endedAt: summary.endedAt,
    durationMs: duration, device: summary.device, viewport: structuredClone(summary.viewport),
    frameSummary: structuredClone(summary.frameSummary),
    scenario: {
      scenes: Array.isArray(summary.timeline) ? summary.timeline.filter((event) => ["baseline", "active", "returned"].includes(event?.event)).map((event) => event.scene) : [],
      objectCycle: summary.objectCycle ? structuredClone(summary.objectCycle) : null,
    },
  };
}

export function evaluateMainlineALongRunV635({ replays, expectedBuild, browserDevices = {}, fixture = false }) {
  const issues = [];
  const inputs = Array.isArray(replays) ? replays : [];
  if (!Array.isArray(replays)) issues.push("long-run:replay-list-invalid");
  if (inputs.length < REQUIRED_RUNS) issues.push("long-run:two-independent-runs-required");
  if (inputs.length > MAXIMUM_RUNS) issues.push("long-run:too-many-runs");
  if (fixture) issues.push("long-run:fixture-not-admitted");
  const runs = inputs.slice(0, MAXIMUM_RUNS).map((value, index) => inspectRun(value, expectedBuild, index, issues)).filter(Boolean);
  const runIds = runs.map((run) => run.runId);
  const rawSha256s = runs.map((run) => run.rawSha256);
  if (new Set(runIds).size !== runs.length) issues.push("long-run:duplicate-run-id");
  if (new Set(rawSha256s).size !== runs.length) issues.push("long-run:duplicate-raw-sha256");
  const ordered = [...runs].sort((left, right) => Date.parse(left.startedAt) - Date.parse(right.startedAt));
  for (let index = 1; index < ordered.length; index += 1) {
    if (Date.parse(ordered[index].startedAt) < Date.parse(ordered[index - 1].endedAt)) issues.push("long-run:overlapping-runs");
  }
  const first = runs[0];
  if (runs.some((run) => ["device", "width", "height", "devicePixelRatio"].some((key) => run.viewport?.[key] !== first.viewport?.[key]))) issues.push("long-run:device-or-viewport-changed");
  if (runs.some((run) => !same(run.scenario, first.scenario))) issues.push("long-run:repeated-scenario-mismatch");
  const observed = first?.device === "desktop" ? browserDevices.desktop === true
    : first?.device === "mobile-simulated" ? browserDevices.mobileViewport === true : false;
  if (!observed) issues.push("long-run:browser-device-not-observed");
  return {
    schema: "mainline-a-longrun-evaluation-v635",
    status: inputs.length === 0 ? "not-run" : issues.length ? "blocked" : "measured-local",
    requiredRuns: REQUIRED_RUNS, minimumDurationMs: MINIMUM_DURATION_MS, minimumRafCoverageRatio: 0.95,
    runCount: runs.length, totalDurationMs: runs.reduce((sum, run) => sum + (finite(run.durationMs) ? run.durationMs : 0), 0),
    device: first?.device ?? null, runIds, rawSha256s, runs,
    issues: [...new Set(issues)].sort(),
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false },
    limits: {
      scope: "two or more independent local browser observations; not production performance or real-user validation",
      frames: "RAF timing coverage; not renderer frame time or proof that a canvas rendered",
      memory: "registry allocation estimates; not measured physical GPU memory",
      authenticity: "release integration must rehash raw files and rerun the V633 verifier before evaluating these summaries",
    },
  };
}
