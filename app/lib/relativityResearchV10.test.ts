import { describe, expect, it } from "vitest";
import {
  validateRelativityBatchFitV10,
  validateRelativityReferenceBundleV10,
  type RelativityBatchFitReportV10,
  type RelativityReferenceBundleV10,
} from "./relativityResearchV10";

const hash = "a".repeat(64);

describe("relativity research V10 contracts", () => {
  it("requires mixed DE440/NAIF and Horizons provenance", () => {
    const bundle: RelativityReferenceBundleV10 = {
      version: "v209-relativity-research-contract-v10",
      fixtureSha256: hash,
      coordinateFrame: "ICRF-J2000-barycentric",
      timeScale: "TDB",
      units: { position: "AU", velocity: "AU/day", time: "TDB days" },
      epochs: [
        { offsetDays: 0, epochJdTdb: 2451545, source: "de440-naif", frame: "ICRF-J2000-barycentric", timeScale: "TDB", origin: "solar-system-barycenter", bodyCount: 12, rawSha256: hash, convertedSha256: hash },
        { offsetDays: 0, epochJdTdb: 2451545, source: "horizons-frozen", frame: "ICRF-J2000-barycentric", timeScale: "TDB", origin: "solar-system-barycenter", bodyCount: 12, rawSha256: hash, convertedSha256: hash },
      ],
      assets: [{ id: "de440s.bsp", sha256: hash, localOnly: true }],
      provenanceReady: true,
      boundary: "offline-reference-only-no-runtime-physics",
    };
    expect(validateRelativityReferenceBundleV10(bundle).passed).toBe(true);
  });

  it("keeps STM fit evidence separate from raw propagation", () => {
    const report = {
      version: "v209-relativity-research-contract-v10",
      mode: "legacy-eih-1pn",
      calibrationWindowDays: [0, 30],
      observationCount: 372,
      parameterCount: 72,
      solver: "scipy-least-squares-stm",
      regularizationLambda: 1e-12,
      conditionNumber: 12,
      weightedResidualRmsKm: 0.1,
      leaveOneDayOutRmsKm: 0.2,
      stm: [],
      rawPropagationReplaced: false,
      provenanceReady: true,
      boundary: "offline-fit-only-no-runtime-promotion",
    } satisfies RelativityBatchFitReportV10;
    expect(validateRelativityBatchFitV10(report).passed).toBe(true);
    expect(report.rawPropagationReplaced).toBe(false);
  });
});
