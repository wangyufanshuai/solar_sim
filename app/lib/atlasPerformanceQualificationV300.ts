export const ATLAS_PERFORMANCE_QUALIFICATION_V300_VERSION = "v300-unified-browser-performance-qualification" as const;

export const ATLAS_PERFORMANCE_SCENARIOS_V300 = Object.freeze([
  "overview", "research", "catalog", "scale", "kerr",
] as const);
export const ATLAS_PERFORMANCE_DEVICES_V300 = Object.freeze(["desktop", "mobile"] as const);

export type AtlasPerformanceScenarioV300 = typeof ATLAS_PERFORMANCE_SCENARIOS_V300[number];
export type AtlasPerformanceDeviceV300 = typeof ATLAS_PERFORMANCE_DEVICES_V300[number];

export type AtlasPerformanceScenarioSampleV300 = Readonly<{
  device: AtlasPerformanceDeviceV300;
  scenario: AtlasPerformanceScenarioV300;
  windowMs: number;
  frameSamples: number;
  medianFps: number;
  frameP95Ms: number;
  gpuBytesBaseline: number;
  gpuBytesPeak: number;
  resourceIdentityBefore: string;
  resourceIdentityAfter: string;
  canvasCountBefore: number;
  canvasCountAfter: number;
  sceneRevisionBefore: number;
  sceneRevisionAfter: number;
  consoleErrorCount: number;
  pageErrorCount: number;
  gpuValidationErrorCount: number;
  rendererFaultCount: number;
  notFoundCount: number;
}>;

export type AtlasPerformanceQualificationInputV300 = Readonly<{
  samples: readonly AtlasPerformanceScenarioSampleV300[];
  heapUsedBytesByCycle: readonly number[];
}>;

export type AtlasPerformanceQualificationV300 = Readonly<{
  version: typeof ATLAS_PERFORMANCE_QUALIFICATION_V300_VERSION;
  status: "qualified" | "failed";
  thresholds: Readonly<{
    requiredSamplePairs: 10;
    frameSamplesMinimum: 241;
    sampleWindowMinimumMs: 10_000;
    overviewMedianFpsMinimum: 55;
    scienceMedianFpsMinimum: 45;
    frameP95MaximumMs: 50;
    heapCycleCount: 30;
    heapSlopeMaximumBytesPerCycle: 262_144;
    catalogGpuMaximumBytes: 33_554_432;
    kerrDesktopGpuMaximumBytes: 100_663_296;
    kerrMobileGpuMaximumBytes: 33_554_432;
  }>;
  heapSlopeBytesPerCycle: number | null;
  passedSamplePairs: number;
  failures: readonly string[];
}>;

export function atlasHeapOlsSlopeBytesPerCycleV300(values: readonly number[]): number | null {
  if (values.length < 2 || values.some((value) => !Number.isSafeInteger(value) || value < 0)) return null;
  const count = values.length;
  const sumX = count * (count - 1) / 2;
  const sumXX = count * (count - 1) * (2 * count - 1) / 6;
  const sumY = values.reduce((sum, value) => sum + value, 0);
  const sumXY = values.reduce((sum, value, index) => sum + index * value, 0);
  const denominator = count * sumXX - sumX * sumX;
  return denominator > 0 ? (count * sumXY - sumX * sumY) / denominator : null;
}

function finiteNonnegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function evaluateAtlasPerformanceQualificationV300(
  input: AtlasPerformanceQualificationInputV300,
): AtlasPerformanceQualificationV300 {
  const failures: string[] = [];
  const expectedPairs = ATLAS_PERFORMANCE_DEVICES_V300.flatMap((device) => ATLAS_PERFORMANCE_SCENARIOS_V300.map((scenario) => `${device}:${scenario}`));
  const observedPairs = new Set<string>();
  let passedSamplePairs = 0;
  if (input.samples.length !== expectedPairs.length) failures.push("sample-pair-count");
  for (const sample of input.samples) {
    const pair = `${sample.device}:${sample.scenario}`;
    const sampleFailures: string[] = [];
    if (!expectedPairs.includes(pair) || observedPairs.has(pair)) sampleFailures.push("sample-pair-identity");
    observedPairs.add(pair);
    if (!Number.isSafeInteger(sample.windowMs) || sample.windowMs < 10_000) sampleFailures.push("sample-window");
    if (!Number.isSafeInteger(sample.frameSamples) || sample.frameSamples < 241) sampleFailures.push("frame-samples");
    const minimumFps = sample.scenario === "overview" ? 55 : 45;
    if (!finiteNonnegative(sample.medianFps) || sample.medianFps < minimumFps) sampleFailures.push("median-fps");
    if (!finiteNonnegative(sample.frameP95Ms) || sample.frameP95Ms > 50) sampleFailures.push("frame-p95");
    if (!Number.isSafeInteger(sample.gpuBytesBaseline) || sample.gpuBytesBaseline < 0
      || !Number.isSafeInteger(sample.gpuBytesPeak) || sample.gpuBytesPeak < sample.gpuBytesBaseline) sampleFailures.push("gpu-bytes");
    const incrementalGpuBytes = sample.gpuBytesPeak - sample.gpuBytesBaseline;
    if (sample.scenario === "catalog" && incrementalGpuBytes > 32 * 2 ** 20) sampleFailures.push("catalog-gpu-budget");
    if (sample.scenario === "kerr" && incrementalGpuBytes > (sample.device === "desktop" ? 96 : 32) * 2 ** 20) sampleFailures.push("kerr-gpu-budget");
    if (!/^[a-f0-9]{8}$/.test(sample.resourceIdentityBefore)
      || sample.resourceIdentityAfter !== sample.resourceIdentityBefore) sampleFailures.push("resource-identity-baseline");
    if (sample.canvasCountBefore !== 1 || sample.canvasCountAfter !== 1) sampleFailures.push("single-canvas");
    if (!Number.isSafeInteger(sample.sceneRevisionBefore)
      || sample.sceneRevisionAfter !== sample.sceneRevisionBefore) sampleFailures.push("scene-revision");
    for (const [name, value] of [
      ["console-error", sample.consoleErrorCount],
      ["page-error", sample.pageErrorCount],
      ["gpu-validation-error", sample.gpuValidationErrorCount],
      ["renderer-fault", sample.rendererFaultCount],
      ["not-found", sample.notFoundCount],
    ] as const) if (!Number.isSafeInteger(value) || value !== 0) sampleFailures.push(name);
    if (sampleFailures.length === 0) passedSamplePairs += 1;
    else failures.push(...sampleFailures.map((failure) => `${pair}:${failure}`));
  }
  for (const pair of expectedPairs) if (!observedPairs.has(pair)) failures.push(`${pair}:missing`);
  if (observedPairs.size !== expectedPairs.length) failures.push("sample-pair-count");
  const heapSlopeBytesPerCycle = input.heapUsedBytesByCycle.length === 30
    ? atlasHeapOlsSlopeBytesPerCycleV300(input.heapUsedBytesByCycle)
    : null;
  if (input.heapUsedBytesByCycle.length !== 30) failures.push("heap-cycle-count");
  if (heapSlopeBytesPerCycle === null || heapSlopeBytesPerCycle > 262_144) failures.push("heap-slope");
  const uniqueFailures = [...new Set(failures)];
  return Object.freeze({
    version: ATLAS_PERFORMANCE_QUALIFICATION_V300_VERSION,
    status: uniqueFailures.length === 0 ? "qualified" : "failed",
    thresholds: Object.freeze({
      requiredSamplePairs: 10,
      frameSamplesMinimum: 241,
      sampleWindowMinimumMs: 10_000,
      overviewMedianFpsMinimum: 55,
      scienceMedianFpsMinimum: 45,
      frameP95MaximumMs: 50,
      heapCycleCount: 30,
      heapSlopeMaximumBytesPerCycle: 262_144,
      catalogGpuMaximumBytes: 33_554_432,
      kerrDesktopGpuMaximumBytes: 100_663_296,
      kerrMobileGpuMaximumBytes: 33_554_432,
    }),
    heapSlopeBytesPerCycle,
    passedSamplePairs,
    failures: Object.freeze(uniqueFailures),
  });
}
