import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createKerrCanonicalRayViewV315, createKerrScienceGeometrySourceViewV315, createKerrSciencePolarizationSourceViewV315, createSparseKerrSciencePayloadV315 } from "./kerrSciencePayloadV315";
import { replayKerrScienceCinematicV9V362 } from "./kerrScienceCinematicV9V362";

const read = (relative: string) => JSON.parse(readFileSync(resolve(process.cwd(), relative), "utf8"));
const payload = createSparseKerrSciencePayloadV315(
  createKerrScienceGeometrySourceViewV315(read("dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json")),
  createKerrSciencePolarizationSourceViewV315(read("dist/science/kerr-reference-v313/polarization-short-gate.json")),
  createKerrCanonicalRayViewV315(read("dist/science/kerr-campaign-v314/ray-plan.json")),
);

describe("v362 V9 Instrument Lab Science/Cinematic replay", () => {
  it("keeps Science bytes frozen and adds one deterministic presentation digest", () => {
    const first = replayKerrScienceCinematicV9V362(payload);
    const second = replayKerrScienceCinematicV9V362(payload);
    expect(first).toMatchObject({
      status: "qualified-v9-instrument-science-frozen-cinematic-distinct",
      sampleCount: 16,
      sciencePayloadByteIdentical: true,
      scienceOutputProfileInvariant: true,
      cinematicOutputsPairwiseDistinct: true,
      rendererOutputsDisjointFromAuthority: true,
      measuredCalibrationUsedForCinematicColor: false,
      denseAggregateAccepted: false,
    });
    expect(new Set(Object.values(first.cinematicDigests)).size).toBe(5);
    expect(first.scienceOutputDigest).toBe(second.scienceOutputDigest);
    expect(first.cinematicDigests).toEqual(second.cinematicDigests);
  });

  it("fails closed when sparse authority is mislabeled as dense", () => {
    expect(() => replayKerrScienceCinematicV9V362({ ...payload, denseCampaignComplete: true })).toThrow("v362-kerr-authority-boundary");
  });
});
