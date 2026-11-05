import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createKerrCanonicalRayViewV315,
  createKerrScienceGeometrySourceViewV315,
  createKerrSciencePolarizationSourceViewV315,
  createSparseKerrSciencePayloadV315,
} from "./kerrSciencePayloadV315";
import {
  createKerrScienceBandRasterV321,
  createKerrScienceBandRasterWithIntegrityV321,
} from "./kerrScienceBandRasterV321";
import { cloneKerrScienceTransferPayloadV299 } from "./strongGravityRenderingV299";

const geometry = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"), "utf8"));
const polarization = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v313/polarization-short-gate.json"), "utf8"));
const plan = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v314/ray-plan.json"), "utf8"));
const bandArtifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json"), "utf8"));

function payload() {
  return createSparseKerrSciencePayloadV315(
    createKerrScienceGeometrySourceViewV315(geometry),
    createKerrSciencePolarizationSourceViewV315(polarization),
    createKerrCanonicalRayViewV315(plan),
  );
}

describe("v321 runtime fixed-band Science raster", () => {
  it("reuses v307 geometry and colors exactly four disk rays from the v320 fixed-band view", () => {
    const source = payload();
    const before = cloneKerrScienceTransferPayloadV299(source);
    const bandBefore = JSON.stringify(bandArtifact.view);
    const first = createKerrScienceBandRasterV321(source, bandArtifact.view);
    const replay = createKerrScienceBandRasterV321(source, bandArtifact.view);
    expect(source).toEqual(before);
    expect(JSON.stringify(bandArtifact.view)).toBe(bandBefore);
    expect(first.rgba).toEqual(replay.rgba);
    expect(first.rgba).not.toBe(replay.rgba);
    expect(first.rgba.buffer).not.toBe(source.classification.buffer);
    expect(first).toMatchObject({
      sourceRasterVersion: "v307-kerr-sparse-science-raster-v1",
      sourceBandViewVersion: "v320-kerr-fixed-band-science-imaging-v1",
      sourceBandArtifactSha256: "e2bd5957a1dd53a0942d5f7cd519d7b1dd84af1db7f476eb0f9dda0a65c5a460",
      summary: { sampleCount: 16, fixedBandColoredDiskRayCount: 4, fixedBandCount: 3, explicitSaturationFlagCount: 12 },
      encoding: {
        diskHitColor: "v320-fixed-reference-linear-rgb",
        normalization: "fixed-physical-reference-no-data-adaptive-rescale",
        cinematicBufferShared: false,
      },
      boundary: "sparse-authority-fixed-band-visualization-not-dense-transfer-map",
    });
  });

  it("proves payload, band view and raster identities remain independent", async () => {
    const source = payload();
    const materialized = await createKerrScienceBandRasterWithIntegrityV321(source, bandArtifact.view);
    expect(materialized.integrity).toMatchObject({
      payloadUnchanged: true,
      bandViewUnchanged: true,
      rasterBufferDisjoint: true,
      cinematicBufferShared: false,
      denseBoundary: "sparse-authority-dense-incomplete",
    });
    expect(materialized.integrity.payloadBefore.digestSha256).toBe(materialized.integrity.payloadAfter.digestSha256);
    expect(materialized.integrity.bandViewDigestBeforeSha256).toBe(materialized.integrity.bandViewDigestAfterSha256);
    expect(materialized.integrity.rasterDigestSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fails closed on a stale full authority or adaptive band normalization", () => {
    expect(() => createKerrScienceBandRasterV321(payload(), {
      ...bandArtifact.view,
      source: { ...bandArtifact.view.source, fullShortAuthoritySha256: "a".repeat(64) },
    })).toThrow("v320-band-view-identity");
    expect(() => createKerrScienceBandRasterV321(payload(), {
      ...bandArtifact.view,
      normalizationPolicy: "per-raster-maximum",
    })).toThrow("v320-band-view-identity");
  });

  it("contains no stochastic or cinematic transformation in the Science path", () => {
    const source = readFileSync(resolve(process.cwd(), "app/lib/kerrScienceBandRasterV321.ts"), "utf8");
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("sampleAtlasCinematicDetailV299");
    expect(source).not.toContain("bloom");
    expect(source).toContain("exact-si-in-v320-artifact-not-encoded-as-scalar-raster");
  });
});
