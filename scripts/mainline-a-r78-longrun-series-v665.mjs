const MIN_DURATION_MS = 30 * 60 * 1000;
const WINDOW_MS = 5 * 60 * 1000;
const REQUIRED_WINDOWS = MIN_DURATION_MS / WINDOW_MS;
const RENDERABLE = new Set([
  "texture", "model", "gpu-buffer", "gpu-render-target",
  "gpu-compute-pipeline",
]);

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function nonnegative(value) {
  return finite(value) && value >= 0;
}
function issue(issues, valid, code) {
  if (!valid) issues.push(code);
}
function percentile(sorted, proportion) {
  if (sorted.length === 0) return null;
  const position = (sorted.length - 1) * proportion;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] +
    (sorted[upper] - sorted[lower]) * (position - lower);
}
function quantiles(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return { minimum: sorted[0] ?? null,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    maximum: sorted.at(-1) ?? null };
}
function frameBudget(values) {
  const measured = values.filter((value) => value > 0);
  const count = measured.length;
  return { count,
    above16Ms: measured.filter((value) => value > 16.667).length,
    above33Ms: measured.filter((value) => value > 33.333).length,
    above50Ms: measured.filter((value) => value > 50).length,
    medianDerivedFps: count
      ? 1000 / quantiles(measured).p50 : null,
    metric: "browser-animation-frame-interval-not-production-fps" };
}
function memoryTrend(windows) {
  const endpoints = windows.map((window) =>
    window.lastUsedBytes).filter(nonnegative);
  if (endpoints.length < 2) {
    return { measuredWindows: endpoints.length,
      netBytes: null, slopeBytesPerMinute: null,
      nondecreasingTransitions: null,
      advisory: "unavailable" };
  }
  const first = endpoints[0];
  const last = endpoints.at(-1);
  const meanX = (endpoints.length - 1) / 2;
  const meanY = endpoints.reduce((sum, value) =>
    sum + value, 0) / endpoints.length;
  let numerator = 0;
  let denominator = 0;
  for (const [index, value] of endpoints.entries()) {
    numerator += (index - meanX) * (value - meanY);
    denominator += (index - meanX) ** 2;
  }
  const slopeBytesPerMinute = denominator > 0
    ? numerator / denominator / 5 : null;
  const nondecreasingTransitions = endpoints.slice(1)
    .filter((value, index) => value >= endpoints[index]).length;
  const advisory = last - first >= 64 * 1024 * 1024
    && slopeBytesPerMinute >= 1024 * 1024
    && nondecreasingTransitions >= endpoints.length - 2
    ? "sustained-reported-heap-growth-review"
    : "no-sustained-growth-signal";
  return { measuredWindows: endpoints.length,
    netBytes: last - first,
    slopeBytesPerMinute,
    nondecreasingTransitions,
    advisory };
}
function frameTailTrend(windows) {
  const first = windows.slice(0, 2).map((window) =>
    window.deltaMs.p95).filter(finite);
  const last = windows.slice(-2).map((window) =>
    window.deltaMs.p95).filter(finite);
  if (first.length !== 2 || last.length !== 2) {
    return { firstP95Ms: null, lastP95Ms: null,
      ratio: null, advisory: "unavailable" };
  }
  const firstP95Ms = (first[0] + first[1]) / 2;
  const lastP95Ms = (last[0] + last[1]) / 2;
  const ratio = firstP95Ms > 0
    ? lastP95Ms / firstP95Ms : null;
  return { firstP95Ms, lastP95Ms, ratio,
    advisory: ratio !== null && ratio >= 1.5
      ? "late-window-frame-tail-review"
      : "no-late-window-tail-signal",
    interpretation: "local-browser-diagnostic-not-production-performance" };
}
function occupiedWindows(samples, durationMs, selector) {
  const groups = Array.from({ length: REQUIRED_WINDOWS },
    () => []);
  for (const sample of samples) {
    const index = Math.min(REQUIRED_WINDOWS - 1,
      Math.floor(sample.atMs / WINDOW_MS));
    if (index >= 0) groups[index].push(selector(sample));
  }
  return groups.map((values, index) => ({
    index, fromMs: index * WINDOW_MS,
    toMs: Math.min(durationMs, (index + 1) * WINDOW_MS),
    count: values.length, values,
  }));
}
function orderIssues(samples, durationMs, code, valueCheck) {
  const issues = [];
  issue(issues, Array.isArray(samples)
    && samples.length <= 500_000, code + ":array-or-size");
  if (!Array.isArray(samples) || samples.length > 500_000) {
    return issues;
  }
  let previous = -1;
  let largestGap = 0;
  for (const sample of samples) {
    if (!nonnegative(sample?.atMs)
      || sample.atMs < previous
      || sample.atMs > durationMs + 5_000
      || !valueCheck(sample)) {
      issues.push(code + ":sample-invalid");
      break;
    }
    if (previous >= 0) {
      largestGap = Math.max(largestGap, sample.atMs - previous);
    }
    previous = sample.atMs;
  }
  issue(issues, previous >= durationMs - 5_000,
    code + ":trailing-coverage");
  issue(issues, samples.length > 0
    && samples[0].atMs <= 5_000,
  code + ":leading-coverage");
  issue(issues, largestGap <= 30_000,
    code + ":gap-over-thirty-seconds");
  return issues;
}

export function analyzeR78FramesV665(samples, durationMs) {
  const issues = orderIssues(samples, durationMs,
    "frames", (sample) => nonnegative(sample.deltaMs)
      && nonnegative(sample.longTaskMs));
  if (!Array.isArray(samples) || issues.includes("frames:array-or-size")) {
    return { ok: false, issues, windows: [], sampleCount: 0 };
  }
  const windows = occupiedWindows(samples, durationMs,
    (sample) => sample.deltaMs).map((group) => {
    const deltas = group.values.filter((value) => value > 0);
    const longTasks = samples.filter((sample) =>
      Math.min(REQUIRED_WINDOWS - 1,
        Math.floor(sample.atMs / WINDOW_MS)) === group.index
      && sample.longTaskMs >= 50);
    return { index: group.index, fromMs: group.fromMs,
      toMs: group.toMs,
      sampleCount: group.count,
      deltaMs: quantiles(deltas),
      longTaskCount: longTasks.length,
      longTaskMaximumMs: longTasks.reduce((maximum, row) =>
        Math.max(maximum, row.longTaskMs), 0),
      frameBudget: frameBudget(deltas),
      under50MsRatio: deltas.length
        ? deltas.filter((value) => value < 50).length / deltas.length
        : null };
  });
  issue(issues, samples.length >= 10_000,
    "frames:insufficient-samples");
  for (const window of windows) {
    issue(issues, window.sampleCount >= 1_000,
      `frames:window-${window.index}-undercovered`);
  }
  const all = samples.map((row) => row.deltaMs)
    .filter((value) => value > 0);
  return { ok: issues.length === 0, issues,
    sampleCount: samples.length,
    durationMs, quantiles: quantiles(all),
    frameBudget: frameBudget(all),
    tailTrend: frameTailTrend(windows),
    longTaskCount: samples.filter((row) =>
      row.longTaskMs >= 50).length,
    windows };
}

export function analyzeR78MemoryV665(samples, durationMs) {
  const issues = orderIssues(samples, durationMs,
    "memory", (sample) =>
      (sample.usedBytes === null || nonnegative(sample.usedBytes))
      && (sample.totalBytes === null
        || nonnegative(sample.totalBytes))
      && (sample.limitBytes === null
        || nonnegative(sample.limitBytes))
      && ["performance-memory", "navigator-device-memory",
        "unavailable"].includes(sample.source));
  if (!Array.isArray(samples)
    || issues.includes("memory:array-or-size")) {
    return { ok: false, issues, windows: [], sampleCount: 0 };
  }
  const sourceSet = [...new Set(samples.map((row) => row.source))]
    .sort();
  const windows = occupiedWindows(samples, durationMs,
    (sample) => sample.usedBytes).map((group) => {
    const values = group.values.filter(nonnegative);
    return { index: group.index, fromMs: group.fromMs,
      toMs: group.toMs, sampleCount: group.count,
      usedSampleCount: values.length,
      firstUsedBytes: values[0] ?? null,
      lastUsedBytes: values.at(-1) ?? null,
      deltaBytes: values.length >= 2
        ? values.at(-1) - values[0] : null,
      usedBytes: quantiles(values) };
  });
  issue(issues, samples.length >= 1_500,
    "memory:insufficient-samples");
  for (const window of windows) {
    issue(issues, window.sampleCount >= 200,
      `memory:window-${window.index}-undercovered`);
  }
  const measured = samples.map((row) => row.usedBytes)
    .filter(nonnegative);
  const first = measured[0] ?? null;
  const last = measured.at(-1) ?? null;
  return { ok: issues.length === 0, issues,
    sampleCount: samples.length, sourceSet,
    measuredSamples: measured.length,
    firstUsedBytes: first,
    lastUsedBytes: last,
    deltaBytes: first === null || last === null
      ? null : last - first,
    usedBytes: quantiles(measured), windows,
    trend: memoryTrend(windows),
    physicalMemoryMeasurement: false };
}

function resourceMap(checkpoint) {
  const source = checkpoint?.snapshot?.byIdentity;
  return source && typeof source === "object"
    && !Array.isArray(source) ? source : {};
}
function resourceDifference(before, after) {
  const beforeMap = resourceMap(before);
  const afterMap = resourceMap(after);
  const identities = [...new Set([
    ...Object.keys(beforeMap), ...Object.keys(afterMap),
  ])].sort();
  return identities.map((identity) => {
    const old = beforeMap[identity];
    const current = afterMap[identity];
    const beforeCount = old?.count ?? 0;
    const afterCount = current?.count ?? 0;
    return { identity,
      kind: current?.kind ?? old?.kind ?? "unknown",
      owner: current?.owner ?? old?.owner ?? "unknown",
      beforeCount, afterCount,
      deltaCount: afterCount - beforeCount,
      beforeBytes: old?.estimatedBytes ?? 0,
      afterBytes: current?.estimatedBytes ?? 0,
      deltaBytes: (current?.estimatedBytes ?? 0)
        - (old?.estimatedBytes ?? 0),
      contentSha256: current?.contentSha256
        ?? old?.contentSha256 ?? null };
  }).filter((row) => row.deltaCount !== 0
    || row.deltaBytes !== 0);
}

export function analyzeR78ResourceCycleV665(resources) {
  const issues = [];
  const baseline = resources?.baseline;
  const active = resources?.active;
  const final = resources?.final;
  issue(issues, baseline?.phase === "baseline"
    && active?.phase === "active"
    && final?.phase === "final", "resource:phase-invalid");
  issue(issues, [baseline, active, final].every((checkpoint) =>
    nonnegative(checkpoint?.total)
    && nonnegative(checkpoint?.estimatedBytes)
    && nonnegative(checkpoint?.estimatedGpuBytes)
    && typeof checkpoint?.identityDigest === "string"
    && checkpoint.identityDigest.length > 0),
  "resource:checkpoint-invalid");
  const acquired = resourceDifference(baseline, active)
    .filter((row) => row.deltaCount > 0);
  const renderable = acquired.filter((row) =>
    RENDERABLE.has(row.kind) && row.deltaBytes > 0);
  const remaining = resourceDifference(baseline, final);
  issue(issues, active?.total > baseline?.total
    && acquired.length > 0 && renderable.length > 0,
  "resource:no-real-renderable-acquire");
  issue(issues, final?.total === baseline?.total
    && final?.identityDigest === baseline?.identityDigest
    && final?.ownerDigest === baseline?.ownerDigest
    && remaining.length === 0,
  "resource:baseline-not-restored");
  issue(issues, nonnegative(baseline?.atMs)
    && active?.atMs >= baseline?.atMs
    && final?.atMs >= active?.atMs,
  "resource:checkpoint-order");
  return { ok: issues.length === 0, issues,
    totals: [baseline?.total ?? null,
      active?.total ?? null, final?.total ?? null],
    identityDigests: [baseline?.identityDigest ?? null,
      active?.identityDigest ?? null,
      final?.identityDigest ?? null],
    acquired, renderable, remaining,
    renderableEstimatedBytes: renderable.reduce((sum, row) =>
      sum + row.deltaBytes, 0),
    gpuBytes: [baseline?.estimatedGpuBytes ?? null,
      active?.estimatedGpuBytes ?? null,
      final?.estimatedGpuBytes ?? null],
    physicalGpuMemoryMeasurement: false };
}

export function analyzeR78ObservationSeriesV665(observation) {
  const duration = observation?.observedDurationMs;
  const issues = [];
  issue(issues, nonnegative(duration)
    && duration >= MIN_DURATION_MS,
  "observation:duration-under-thirty-minutes");
  const frames = analyzeR78FramesV665(
    observation?.frameSamples, duration);
  const memory = analyzeR78MemoryV665(
    observation?.memorySamples, duration);
  const resources = analyzeR78ResourceCycleV665(
    observation?.resources);
  issues.push(...frames.issues, ...memory.issues,
    ...resources.issues);
  issue(issues, observation?.status === "complete"
    && observation?.source === "browser-runtime"
    && observation?.physicalDevice === false
    && observation?.visibility?.interruptions === 0
    && observation?.consoleErrors === 0
    && observation?.pageErrors === 0,
  "observation:runtime-boundary-or-error");
  return { status: issues.length === 0
      ? "series-complete-local-diagnostic"
      : "series-incomplete",
    ok: issues.length === 0,
    issues, device: observation?.device ?? null,
    sessionId: observation?.sessionId ?? null,
    durationMs: duration ?? null,
    frames, memory, resources,
    claims: { productionPerformance: false,
      physicalMobile: false, realUserValidation: false } };
}
