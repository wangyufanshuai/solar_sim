import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312 } from "./kerrAuthorityV312";
import { KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313 } from "./kerrAuthorityV313";
import { KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314 } from "./kerrCampaignV314";
import {
  KERR_SCIENCE_PAYLOAD_AUTHORITY_SHA256_V315,
  createKerrCanonicalRayViewV315,
  createKerrScienceGeometrySourceViewV315,
  createKerrSciencePolarizationSourceViewV315,
  createSparseKerrSciencePayloadV315,
} from "./kerrSciencePayloadV315";
import { KERR_CLASSIFICATION_V299, validateKerrScienceTransferPayloadV299 } from "./strongGravityRenderingV299";

const geometry = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"), "utf8"));
const polarization = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v313/polarization-short-gate.json"), "utf8"));
const rayPlan = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v314/ray-plan.json"), "utf8"));

describe("v315 corrected sparse science payload", () => {
  it("builds a bounded 16-ray payload from v312, v313 and the v314 plan", () => {
    const geometryView = createKerrScienceGeometrySourceViewV315(geometry);
    const polarizationView = createKerrSciencePolarizationSourceViewV315(polarization);
    const canonicalView = createKerrCanonicalRayViewV315(rayPlan);
    expect(Buffer.byteLength(JSON.stringify(geometryView), "utf8")).toBeLessThanOrEqual(64 * 1024);
    expect(Buffer.byteLength(JSON.stringify(polarizationView), "utf8")).toBeLessThanOrEqual(16 * 1024);
    expect(Buffer.byteLength(JSON.stringify(canonicalView), "utf8")).toBeLessThanOrEqual(32 * 1024);

    const payload = createSparseKerrSciencePayloadV315(geometryView, polarizationView, canonicalView);
    expect(payload).toMatchObject({
      authorityKind: "v312-v313-short-gate-sparse",
      geometryEvidenceSha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
      polarizationEvidenceSha256: KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313,
      rayPlanSha256: KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314,
      errorBudgetVersion: "v315-sparse-release-residual-budget-v1",
      denseCampaignComplete: false,
      denseAggregateSha256: null,
      sampleCount: 16,
    });
    expect(KERR_SCIENCE_PAYLOAD_AUTHORITY_SHA256_V315).toMatch(/^[a-f0-9]{64}$/);
    expect([...payload.classification].filter((value) => value === KERR_CLASSIFICATION_V299.capture)).toHaveLength(6);
    expect([...payload.classification].filter((value) => value === KERR_CLASSIFICATION_V299.escape)).toHaveLength(6);
    expect([...payload.classification].filter((value) => value === KERR_CLASSIFICATION_V299["disk-hit"])).toHaveLength(4);
    expect([...payload.evpaApplicable].filter(Boolean)).toHaveLength(4);
    expect(validateKerrScienceTransferPayloadV299(payload)).toEqual({ passed: true, failures: [] });
  });

  it("fails closed when a corrected authority or dense boundary is tampered", () => {
    const geometryView = createKerrScienceGeometrySourceViewV315(geometry);
    const polarizationView = createKerrSciencePolarizationSourceViewV315(polarization);
    const canonicalView = createKerrCanonicalRayViewV315(rayPlan);
    expect(() => createSparseKerrSciencePayloadV315(
      { ...geometryView, evidenceSha256: "0".repeat(64) },
      polarizationView,
      canonicalView,
    )).toThrow("v315-geometry-source-view-identity");
    expect(() => createSparseKerrSciencePayloadV315(
      geometryView,
      polarizationView,
      { ...canonicalView, denseCampaignStatus: "complete-49-of-49" },
    )).toThrow("v315-canonical-ray-view-identity");
  });
});

