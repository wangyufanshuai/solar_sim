import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createKerrCanonicalRayViewV315,
  createKerrScienceGeometrySourceViewV315,
  createKerrSciencePolarizationSourceViewV315,
  createSparseKerrSciencePayloadV315,
} from "./kerrSciencePayloadV315";
import { replayKerrScienceCinematicBuffersV337 } from "./kerrScienceCinematicBufferReplayV337";

const read = (relative: string) => JSON.parse(readFileSync(resolve(process.cwd(), relative), "utf8"));
const geometry = createKerrScienceGeometrySourceViewV315(read("dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"));
const polarization = createKerrSciencePolarizationSourceViewV315(read("dist/science/kerr-reference-v313/polarization-short-gate.json"));
const canonicalRays = createKerrCanonicalRayViewV315(read("dist/science/kerr-campaign-v314/ray-plan.json"));

describe("v337 complete sparse-authority Science/Cinematic buffer replay", () => {
  it("keeps every authority TypedArray byte-identical across Science and V5/V6 Cinematic rendering", () => {
    const payload = createSparseKerrSciencePayloadV315(geometry, polarization, canonicalRays);
    const first = replayKerrScienceCinematicBuffersV337(payload);
    const second = replayKerrScienceCinematicBuffersV337(payload);
    expect(first).toMatchObject({
      status: "qualified-full-sparse-authority-render-boundary-replay",
      sampleCount: 16,
      classificationCounts: { capture: 6, escape: 6, diskHit: 4 },
      applicableEvpaCount: 4,
      allScientificBuffersByteIdentical: true,
      classificationUnchanged: true,
      redshiftUnchanged: true,
      evpaUnchanged: true,
      intensityUnchanged: true,
      errorBudgetBuffersUnchanged: true,
      scienceContractsEquivalent: true,
      scienceOutputProfileInvariant: true,
      scienceOutputDeterministic: true,
      cinematicOutputDeterministic: true,
      cinematicProfileOutputsDistinct: true,
      scienceAndCinematicBuffersDisjoint: true,
      rendererOutputsDisjointFromAuthority: true,
      responseCopyDisjointFromAuthority: true,
      denseIncompleteVisible: true,
    });
    expect(first.scientificBufferFieldCount).toBeGreaterThan(50);
    expect(first.scientificBufferByteLength).toBeGreaterThan(0);
    expect(first.buffersBefore).toEqual(first.buffersAfter);
    expect(first.scienceOutputDigest).toBe(second.scienceOutputDigest);
    expect(first.v5CinematicOutputDigest).toBe(second.v5CinematicOutputDigest);
    expect(first.v6CinematicOutputDigest).toBe(second.v6CinematicOutputDigest);
    expect(first.v5CinematicOutputDigest).not.toBe(first.v6CinematicOutputDigest);
  });

  it("fails closed when incomplete sparse authority is mislabeled as dense", () => {
    const payload = createSparseKerrSciencePayloadV315(geometry, polarization, canonicalRays);
    expect(() => replayKerrScienceCinematicBuffersV337({ ...payload, denseCampaignComplete: true })).toThrow("v337-sparse-authority-boundary");
  });
});
