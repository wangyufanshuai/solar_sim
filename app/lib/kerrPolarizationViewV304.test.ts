import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  KERR_INTERNAL_EVPA_LIMIT_DEG_V304,
  KERR_RELEASE_EVPA_LIMIT_DEG_V304,
  parseKerrPolarizationAuthorityViewV304,
  replayProjectedPolarizationV304,
} from "./kerrPolarizationViewV304";
import { createKerrPolarizationAuthorityViewV304 } from "./kerrPolarizationViewServerV304";

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));

function documents() {
  return {
    geometry: readJson("dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"),
    polarization: readJson("dist/science/kerr-reference-v297/polarization-short-gate.json"),
    rayPlan: readJson("dist/science/kerr-campaign-v298r1/ray-plan.json"),
  };
}

function view() {
  const source = documents();
  return createKerrPolarizationAuthorityViewV304(source.geometry, source.polarization, source.rayPlan);
}

describe("v304 bounded polarization authority view", () => {
  it("replays projected disk-normal polarization and preserves both authority paths", () => {
    const result = view();
    expect(result).toMatchObject({
      version: "v304-kerr-polarization-authority-view-v1",
      status: "polarization-authority-qualified",
      counts: { diskRayCount: 4, applicableExecutionCount: 16, captureEscapeNotApplicableCount: 96, kerrSchildGeometryCrossCheckExecutionCount: 16 },
      symmetry: { passed: true, exactFaceOn: "not-applicable-degenerate-emission-basis" },
      denseBoundary: "not-a-dense-polarization-map",
    });
    expect(result.rays.map((ray) => ray.rayId)).toEqual(["disk-00", "disk-01", "disk-02", "disk-03"]);
    expect(result.rays.every((ray) => ray.release.length === 2 && ray.internal.length === 2 && ray.branchDeterministic)).toBe(true);
    expect(result.maxima.releaseEvpaDifferenceDeg).toBeLessThan(KERR_RELEASE_EVPA_LIMIT_DEG_V304);
    expect(result.maxima.internalEvpaDifferenceDeg).toBeLessThan(KERR_INTERNAL_EVPA_LIMIT_DEG_V304);
    expect(result.maxima.projectionReplayDifference).toBeLessThanOrEqual(1e-12);
  });

  it("independently reproduces the complex Walker-Penrose seed", () => {
    const ray = view().rays[0];
    const replayed = replayProjectedPolarizationV304(ray.spinA, ray.projectedSeed.coordinatesBl, ray.projectedSeed.wavevectorBl);
    expect(replayed.polarizationBl).toEqual(ray.projectedSeed.polarizationBl);
    expect(replayed.walkerPenroseConstant.real).toBeCloseTo(ray.projectedSeed.walkerPenroseConstant.real, 14);
    expect(replayed.walkerPenroseConstant.imaginary).toBeCloseTo(ray.projectedSeed.walkerPenroseConstant.imaginary, 14);
    expect(replayed.waveOrthogonalityResidual).toBeLessThan(1e-10);
  });

  it("fails closed on branch, projection, EVPA and symmetry drift", () => {
    const source = documents();
    const branchB = source.polarization.payloads.find((row: Record<string, unknown>) => row.rayId === "disk-00" && row.toleranceClass === "release" && row.branch === "B") as { parallelTransportEvpaDeg: number; evpaDifferenceDeg: number };
    branchB.parallelTransportEvpaDeg += 0.01;
    branchB.evpaDifferenceDeg += 0.01;
    expect(() => createKerrPolarizationAuthorityViewV304(source.geometry, source.polarization, source.rayPlan))
      .toThrow("v304-branch-determinism-failed");

    const result = view();
    const rays = result.rays.map((ray, index) => index === 0
      ? { ...ray, projectedSeed: { ...ray.projectedSeed, polarizationBl: [ray.projectedSeed.polarizationBl[0] + 0.01, ...ray.projectedSeed.polarizationBl.slice(1)] } }
      : ray);
    expect(() => parseKerrPolarizationAuthorityViewV304({ ...result, rays }))
      .toThrow("v304-projection-replay-conservation-failed");
    expect(() => parseKerrPolarizationAuthorityViewV304({
      ...result,
      symmetry: { ...result.symmetry, exactFaceOn: "applicable" },
    })).toThrow("v304-polarization-symmetry-failed");
  });

  it("round-trips the bounded authority without full transport trajectories", () => {
    const result = view();
    expect(parseKerrPolarizationAuthorityViewV304(JSON.parse(JSON.stringify(result)))).toEqual(result);
    expect(JSON.stringify(result)).not.toContain('"trajectory":[');
  });

  it("loads the bounded polarization view only behind ray-image intent", () => {
    const workbench = readFileSync(resolve(process.cwd(), "app/components/RelativityResearchWorkbenchV280.tsx"), "utf8");
    const polarization = readFileSync(resolve(process.cwd(), "app/components/KerrPolarizationWorkbenchV304.tsx"), "utf8");
    expect(workbench).toContain('tab === "ray-image"');
    expect(workbench).toContain("<KerrPolarizationWorkbenchV304");
    expect(polarization).toContain("/api/atlas/relativity-evidence/artifacts/v304-polarization-view");
    expect(polarization).toContain("MAX_RESPONSE_BYTES = 32 * 1024");
    expect(polarization).toContain("not-applicable");
  });
});
