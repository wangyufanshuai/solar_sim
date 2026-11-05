import { describe, expect, it } from "vitest";
import {
  ATLAS_PERFORMANCE_DEVICES_V300,
  ATLAS_PERFORMANCE_SCENARIOS_V300,
  atlasHeapOlsSlopeBytesPerCycleV300,
  evaluateAtlasPerformanceQualificationV300,
  type AtlasPerformanceScenarioSampleV300,
} from "./atlasPerformanceQualificationV300";

const IDENTITY = "1a2b3c4d";

function passingSamples(): AtlasPerformanceScenarioSampleV300[] {
  return ATLAS_PERFORMANCE_DEVICES_V300.flatMap((device) => ATLAS_PERFORMANCE_SCENARIOS_V300.map((scenario) => {
    const baseline = 8 * 2 ** 20;
    const increment = scenario === "catalog" ? 32 * 2 ** 20
      : scenario === "kerr" ? (device === "desktop" ? 96 : 32) * 2 ** 20
        : 0;
    return {
      device,
      scenario,
      windowMs: 10_000,
      frameSamples: 241,
      medianFps: scenario === "overview" ? 55 : 45,
      frameP95Ms: 50,
      gpuBytesBaseline: baseline,
      gpuBytesPeak: baseline + increment,
      resourceIdentityBefore: IDENTITY,
      resourceIdentityAfter: IDENTITY,
      canvasCountBefore: 1,
      canvasCountAfter: 1,
      sceneRevisionBefore: 7,
      sceneRevisionAfter: 7,
      consoleErrorCount: 0,
      pageErrorCount: 0,
      gpuValidationErrorCount: 0,
      rendererFaultCount: 0,
      notFoundCount: 0,
    };
  }));
}

describe("v300 unified browser performance qualification", () => {
  it("qualifies only the complete desktop/mobile five-scene boundary matrix", () => {
    const result = evaluateAtlasPerformanceQualificationV300({
      samples: passingSamples(),
      heapUsedBytesByCycle: Array.from({ length: 30 }, (_, cycle) => 100_000_000 + cycle * 262_144),
    });
    expect(result).toMatchObject({
      status: "qualified",
      passedSamplePairs: 10,
      heapSlopeBytesPerCycle: 262_144,
      failures: [],
      thresholds: { requiredSamplePairs: 10, frameSamplesMinimum: 241, heapCycleCount: 30 },
    });
  });

  it("fails closed on missing, duplicate, NaN, frame or resource identity evidence", () => {
    const samples = passingSamples();
    samples[0] = {
      ...samples[0],
      medianFps: Number.NaN,
      frameSamples: 240,
      frameP95Ms: 50.1,
      resourceIdentityAfter: "ffffffff",
      canvasCountAfter: 2,
      sceneRevisionAfter: 8,
      consoleErrorCount: 1,
    };
    samples[1] = { ...samples[1], device: samples[0].device, scenario: samples[0].scenario };
    const result = evaluateAtlasPerformanceQualificationV300({
      samples,
      heapUsedBytesByCycle: Array.from({ length: 29 }, (_, cycle) => 100_000_000 + cycle),
    });
    expect(result.status).toBe("failed");
    expect(result.failures).toEqual(expect.arrayContaining([
      "desktop:overview:median-fps",
      "desktop:overview:frame-samples",
      "desktop:overview:frame-p95",
      "desktop:overview:resource-identity-baseline",
      "desktop:overview:single-canvas",
      "desktop:overview:scene-revision",
      "desktop:overview:console-error",
      "desktop:research:missing",
      "sample-pair-count",
      "heap-cycle-count",
      "heap-slope",
    ]));
  });

  it("enforces catalog/Kerr GPU and heap-slope limits without RSS substitution", () => {
    const samples = passingSamples();
    const desktopCatalog = samples.find((sample) => sample.device === "desktop" && sample.scenario === "catalog")!;
    const mobileKerr = samples.find((sample) => sample.device === "mobile" && sample.scenario === "kerr")!;
    samples[samples.indexOf(desktopCatalog)] = { ...desktopCatalog, gpuBytesPeak: desktopCatalog.gpuBytesPeak + 1 };
    samples[samples.indexOf(mobileKerr)] = { ...mobileKerr, gpuBytesPeak: mobileKerr.gpuBytesPeak + 1 };
    const heap = Array.from({ length: 30 }, (_, cycle) => 200_000_000 + cycle * 262_145);
    expect(atlasHeapOlsSlopeBytesPerCycleV300(heap)).toBe(262_145);
    const result = evaluateAtlasPerformanceQualificationV300({ samples, heapUsedBytesByCycle: heap });
    expect(result.failures).toEqual(expect.arrayContaining([
      "desktop:catalog:catalog-gpu-budget",
      "mobile:kerr:kerr-gpu-budget",
      "heap-slope",
    ]));
  });

  it("rejects invalid heap samples instead of converting them to zero", () => {
    expect(atlasHeapOlsSlopeBytesPerCycleV300([1, Number.NaN, 3])).toBeNull();
    expect(atlasHeapOlsSlopeBytesPerCycleV300([1, -1, 3])).toBeNull();
  });
});
