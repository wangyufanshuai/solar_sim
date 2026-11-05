import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { KERR_DENSE_RAY_PLAN_FILE_SHA256_V298R1 } from "./kerrCampaignV298R1";
import {
  createKerrCanonicalRayViewV315,
  createKerrScienceGeometrySourceViewV315,
  createKerrSciencePolarizationSourceViewV315,
  createSparseKerrSciencePayloadV315,
} from "./kerrSciencePayloadV315";
import {
  createKerrScienceObservablesViewV306,
  parseKerrScienceObservablesViewV306,
} from "./kerrScienceObservablesV306";
import {
  cloneKerrScienceTransferPayloadV299,
  createSparseKerrSciencePayloadV299,
} from "./strongGravityRenderingV299";

function fixture() {
  const geometry = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"), "utf8"));
  const polarization = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v297/polarization-short-gate.json"), "utf8"));
  const plan = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v298r1/ray-plan.json"), "utf8"));
  const canonicalRays = plan.rays.slice(0, 16);
  const payload = createSparseKerrSciencePayloadV299(geometry, polarization, {
    version: "v299-kerr-canonical-ray-view-v1",
    planSha256: plan.planSha256,
    planFileSha256: KERR_DENSE_RAY_PLAN_FILE_SHA256_V298R1,
    canonicalRays,
  });
  return { payload, canonicalRays };
}

function correctedFixture() {
  const geometry = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"), "utf8"));
  const polarization = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v313/polarization-short-gate.json"), "utf8"));
  const plan = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v314/ray-plan.json"), "utf8"));
  const canonicalView = createKerrCanonicalRayViewV315(plan);
  const payload = createSparseKerrSciencePayloadV315(
    createKerrScienceGeometrySourceViewV315(geometry),
    createKerrSciencePolarizationSourceViewV315(polarization),
    canonicalView,
  );
  return { payload, canonicalRays: canonicalView.canonicalRays };
}

describe("v306 bounded sparse science observables", () => {
  it("publishes exactly 16 canonical rays without mutating the CPU authority payload", () => {
    const { payload, canonicalRays } = fixture();
    const before = cloneKerrScienceTransferPayloadV299(payload);
    const view = createKerrScienceObservablesViewV306(payload, canonicalRays);
    expect(payload).toEqual(before);
    expect(view).toMatchObject({
      status: "qualified-sparse-authority",
      counts: {
        sampleCount: 16,
        capture: 6,
        escape: 6,
        diskHit: 4,
        redshiftApplicable: 4,
        imageOrderApplicable: 4,
        polarizationApplicable: 4,
      },
      policy: {
        missingObservableEncoding: "null-not-zero",
        uncertaintyCombination: "componentwise-no-rss-no-scalar-total",
        denseQualificationAccepted: false,
      },
      boundary: "16-canonical-rays-not-dense-transfer-map",
    });
    expect(view.records).toHaveLength(16);
    expect(Object.isFrozen(view)).toBe(true);
    expect(Object.isFrozen(view.records)).toBe(true);
  });

  it("uses explicit null applicability for all capture and escape observables", () => {
    const { payload, canonicalRays } = fixture();
    const view = createKerrScienceObservablesViewV306(payload, canonicalRays);
    for (const record of view.records) {
      if (record.classification === "disk-hit") {
        expect(record).toMatchObject({ applicability: { redshift: true, imageOrder: true, polarization: true } });
        expect(record.emissionRadiusM).toBeGreaterThan(0);
        expect(record.redshiftFactor).toBeGreaterThan(0);
        expect(record.imageOrder).toBeGreaterThanOrEqual(0);
        expect(record.intensity).toBeGreaterThanOrEqual(0);
      } else {
        expect(record).toMatchObject({
          emissionRadiusM: null,
          redshiftFactor: null,
          imageOrder: null,
          walkerPenroseEvpaDeg: null,
          parallelTransportEvpaDeg: null,
          evpaDifferenceDeg: null,
          intensity: null,
          applicability: { redshift: false, imageOrder: false, polarization: false },
        });
        expect(Object.values(record.polarizationBudget).every((value) => value === null)).toBe(true);
      }
    }
  });

  it("round-trips the bounded JSON contract with authority hashes intact", () => {
    const { payload, canonicalRays } = fixture();
    const source = createKerrScienceObservablesViewV306(payload, canonicalRays);
    const parsed = parseKerrScienceObservablesViewV306(JSON.parse(JSON.stringify(source)));
    expect(parsed).toEqual(source);
    expect(parsed.authority.geometryEvidenceSha256).toBe(payload.geometryEvidenceSha256);
    expect(parsed.authority.polarizationEvidenceSha256).toBe(payload.polarizationEvidenceSha256);
    expect(parsed.authority.rayPlanSha256).toBe(payload.rayPlanSha256);
    expect(parsed.authority.denseAggregateSha256).toBeNull();
  });

  it("publishes corrected v312/v313 observables while keeping dense qualification unavailable", () => {
    const { payload, canonicalRays } = correctedFixture();
    const source = createKerrScienceObservablesViewV306(payload, canonicalRays);
    const parsed = parseKerrScienceObservablesViewV306(JSON.parse(JSON.stringify(source)));
    expect(parsed.authority).toMatchObject({
      kind: "v312-v313-short-gate-sparse",
      denseAggregateSha256: null,
    });
    expect(parsed.policy).toMatchObject({
      displayAuthority: "cpu-v312-geometry+v313-polarization",
      denseQualificationAccepted: false,
    });
    expect(parsed.records).toHaveLength(16);
  });

  it("fails closed on false zeros, scalar uncertainty, hash drift or negative residuals", () => {
    const { payload, canonicalRays } = fixture();
    const source = JSON.parse(JSON.stringify(createKerrScienceObservablesViewV306(payload, canonicalRays)));
    const falseZero = structuredClone(source);
    falseZero.records[0].redshiftFactor = 0;
    expect(() => parseKerrScienceObservablesViewV306(falseZero)).toThrow("v306-observable-applicability-invalid");

    const scalar = structuredClone(source);
    scalar.policy.scalarCombinedUncertainty = 0;
    expect(() => parseKerrScienceObservablesViewV306(scalar)).toThrow("v306-view-contract-invalid");

    const hashDrift = structuredClone(source);
    hashDrift.authority.geometryEvidenceSha256 = "a".repeat(64);
    expect(() => parseKerrScienceObservablesViewV306(hashDrift)).toThrow("v306-view-contract-invalid");

    const negative = structuredClone(source);
    negative.records[0].geometryBudget.metricDerivativeAuditResidual = -1;
    expect(() => parseKerrScienceObservablesViewV306(negative)).toThrow("negative");
  });
});
