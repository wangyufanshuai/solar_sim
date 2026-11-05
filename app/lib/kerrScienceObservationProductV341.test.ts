import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createKerrCanonicalRayViewV315, createKerrScienceGeometrySourceViewV315, createKerrSciencePolarizationSourceViewV315, createSparseKerrSciencePayloadV315 } from "./kerrSciencePayloadV315";
import { parseKerrScienceBandUncertaintyViewV325 } from "./kerrScienceBandUncertaintyV325";
import { parseKerrScienceInstrumentResponseV332 } from "./kerrScienceInstrumentResponseV332";
import { createKerrScienceObservationProductV341, createKerrScienceObservationProfileAuditV341, parseKerrScienceObservationProductV341 } from "./kerrScienceObservationProductV341";

function json(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as Record<string, unknown>;
}

function fixture() {
  const geometry = createKerrScienceGeometrySourceViewV315(json("dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"));
  const polarization = createKerrSciencePolarizationSourceViewV315(json("dist/science/kerr-reference-v313/polarization-short-gate.json"));
  const rayPlan = createKerrCanonicalRayViewV315(json("dist/science/kerr-campaign-v314/ray-plan.json"));
  const payload = createSparseKerrSciencePayloadV315(geometry, polarization, rayPlan);
  const uncertaintyArtifact = json("dist/science/kerr-science-band-uncertainty-v325/componentwise-envelope.json");
  const instrumentArtifact = json("dist/science/kerr-science-instrument-response-v332/response-reference.json");
  return createKerrScienceObservationProductV341(
    payload,
    parseKerrScienceBandUncertaintyViewV325(uncertaintyArtifact.view),
    parseKerrScienceInstrumentResponseV332(instrumentArtifact.response),
    String(instrumentArtifact.artifactSha256),
  );
}

describe("v341 sparse Kerr observation product", () => {
  it("joins geometry, polarization, radiance, uncertainty and instrument response without claiming a dense image", () => {
    const product = parseKerrScienceObservationProductV341(fixture());
    expect(product.measurements).toHaveLength(12);
    expect(new Set(product.measurements.map((row) => row.rayIndex))).toEqual(new Set([12, 13, 14, 15]));
    expect(product.measurements.every((row) => Number.isFinite(row.walkerPenroseEvpaDeg) && row.evpaDifferenceDeg < 0.5)).toBe(true);
    expect(product.measurements.every((row) => row.lowerAuditEnvelopeWM2Sr <= row.observedEnergyRadianceWM2Sr && row.upperAuditEnvelopeWM2Sr >= row.observedEnergyRadianceWM2Sr)).toBe(true);
    expect(product.authority.denseCampaignStatus).toBe("incomplete-0-of-49");
    expect(product.authority.denseAggregateSha256).toBeNull();
    expect(product.instrument.status).toBe("synthetic-audit-fixture-not-calibrated-observatory");
  });

  it("keeps V5/V6/V7 science values invariant while seeded cinematic copies remain distinct", () => {
    const audit = createKerrScienceObservationProfileAuditV341(fixture());
    expect(new Set(Object.values(audit.scienceDigests)).size).toBe(1);
    expect(new Set(Object.values(audit.cinematicDigests)).size).toBe(3);
    expect(audit.sourceProductByteIdentical).toBe(true);
    expect(audit.presentationCopiesDisjoint).toBe(true);
    expect(audit.cinematicPhysicalMeasurementFieldsExcluded).toBe(true);
  });

  it("fails closed when the dense boundary is forged", () => {
    const product = fixture();
    expect(() => parseKerrScienceObservationProductV341({ ...product, authority: { ...product.authority, denseCampaignStatus: "complete-49-of-49" } })).toThrow(/v341-observation-product-identity/);
  });
});
