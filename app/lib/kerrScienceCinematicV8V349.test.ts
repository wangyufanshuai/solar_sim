import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createKerrCanonicalRayViewV315,
  createKerrScienceGeometrySourceViewV315,
  createKerrSciencePolarizationSourceViewV315,
  createSparseKerrSciencePayloadV315,
} from "./kerrSciencePayloadV315";
import { replayKerrScienceCinematicV8V349 } from "./kerrScienceCinematicV8V349";

const read = (relative: string) => JSON.parse(readFileSync(resolve(process.cwd(), relative), "utf8"));
const payload = createSparseKerrSciencePayloadV315(
  createKerrScienceGeometrySourceViewV315(read("dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json")),
  createKerrSciencePolarizationSourceViewV315(read("dist/science/kerr-reference-v313/polarization-short-gate.json")),
  createKerrCanonicalRayViewV315(read("dist/science/kerr-campaign-v314/ray-plan.json")),
);

describe("v349 V8 strong-gravity Science/Cinematic replay", () => {
  it("keeps Science bytes frozen and adds a fourth deterministic cinematic output", () => {
    const first = replayKerrScienceCinematicV8V349(payload);
    const second = replayKerrScienceCinematicV8V349(payload);
    expect(first).toMatchObject({
      status: "qualified-v8-science-frozen-cinematic-distinct",
      profiles: ["science-cinematic-v5-v299", "science-cinematic-v6-v300", "science-cinematic-v7-v340", "science-cinematic-v8-v349"],
      sampleCount: 16,
      scienceContractsEquivalent: true,
      scienceOutputProfileInvariant: true,
      scienceOutputDeterministic: true,
      sciencePayloadByteIdentical: true,
      cinematicOutputDeterministic: true,
      cinematicOutputsPairwiseDistinct: true,
      rendererOutputsDisjointFromAuthority: true,
      v8Tokens: { exposure: 0.71, bloom: 0.32, detailSeed: 349, redshiftColorStrength: 0.55, dopplerColorStrength: 0.61, spectralRibbonOpacity: 0.72, reticleLuminance: 0.82, channelSeparation: 0.64 },
      denseAggregateAccepted: false,
    });
    expect(new Set(Object.values(first.cinematicDigests)).size).toBe(4);
    expect(first.scienceOutputDigest).toBe(second.scienceOutputDigest);
    expect(first.cinematicDigests).toEqual(second.cinematicDigests);
  });

  it("fails closed when sparse authority is mislabeled as dense", () => {
    expect(() => replayKerrScienceCinematicV8V349({ ...payload, denseCampaignComplete: true })).toThrow("v349-kerr-authority-boundary");
  });
});
