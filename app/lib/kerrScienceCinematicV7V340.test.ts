import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createKerrCanonicalRayViewV315, createKerrScienceGeometrySourceViewV315, createKerrSciencePolarizationSourceViewV315, createSparseKerrSciencePayloadV315 } from "./kerrSciencePayloadV315";
import { replayKerrScienceCinematicV7V340 } from "./kerrScienceCinematicV7V340";

const read = (relative: string) => JSON.parse(readFileSync(resolve(process.cwd(), relative), "utf8"));
const payload = createSparseKerrSciencePayloadV315(
  createKerrScienceGeometrySourceViewV315(read("dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json")),
  createKerrSciencePolarizationSourceViewV315(read("dist/science/kerr-reference-v313/polarization-short-gate.json")),
  createKerrCanonicalRayViewV315(read("dist/science/kerr-campaign-v314/ray-plan.json")),
);

describe("v340 V7 strong-gravity Science/Cinematic replay", () => {
  it("keeps Science bytes frozen while producing a third deterministic cinematic output", () => {
    const first = replayKerrScienceCinematicV7V340(payload);
    const second = replayKerrScienceCinematicV7V340(payload);
    expect(first).toMatchObject({ status: "qualified-v7-science-frozen-cinematic-distinct", profiles: ["science-cinematic-v5-v299", "science-cinematic-v6-v300", "science-cinematic-v7-v340"], sampleCount: 16, scienceContractsEquivalent: true, scienceOutputProfileInvariant: true, scienceOutputDeterministic: true, sciencePayloadByteIdentical: true, cinematicOutputDeterministic: true, cinematicOutputsPairwiseDistinct: true, rendererOutputsDisjointFromAuthority: true, v7Tokens: { exposure: 0.74, bloom: 0.38, detailSeed: 340, redshiftColorStrength: 0.58, dopplerColorStrength: 0.64 }, denseAggregateAccepted: false });
    expect(new Set(Object.values(first.cinematicDigests)).size).toBe(3);
    expect(first.scienceOutputDigest).toBe(second.scienceOutputDigest);
    expect(first.cinematicDigests).toEqual(second.cinematicDigests);
  });

  it("fails closed when sparse authority is mislabeled as dense", () => {
    expect(() => replayKerrScienceCinematicV7V340({ ...payload, denseCampaignComplete: true })).toThrow("v340-kerr-authority-boundary");
  });
});
