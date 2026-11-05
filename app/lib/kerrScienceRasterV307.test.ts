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
  createKerrScienceGlyphV307,
  createKerrScienceRasterV307,
} from "./kerrScienceRasterV307";
import {
  KERR_CLASSIFICATION_V299,
  cloneKerrScienceTransferPayloadV299,
} from "./strongGravityRenderingV299";

function createPayload() {
  const geometry = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"), "utf8"));
  const polarization = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v313/polarization-short-gate.json"), "utf8"));
  const plan = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v314/ray-plan.json"), "utf8"));
  return createSparseKerrSciencePayloadV315(
    createKerrScienceGeometrySourceViewV315(geometry),
    createKerrSciencePolarizationSourceViewV315(polarization),
    createKerrCanonicalRayViewV315(plan),
  );
}

const pixelMap = (glyph: ReturnType<typeof createKerrScienceGlyphV307>) => new Map(glyph.pixels.map((pixel) => [`${pixel.dx}:${pixel.dy}`, pixel]));

describe("v307 deterministic sparse science raster", () => {
  it("uses distinct fixed classification shapes without invented observables", () => {
    const capture = createKerrScienceGlyphV307({ classification: KERR_CLASSIFICATION_V299.capture, redshiftFactor: Number.NaN, redshiftApplicable: false, imageOrder: null, evpaDeg: null });
    const escape = createKerrScienceGlyphV307({ classification: KERR_CLASSIFICATION_V299.escape, redshiftFactor: Number.NaN, redshiftApplicable: false, imageOrder: null, evpaDeg: null });
    expect(capture.pixels.every((pixel) => pixel.channel === "classification")).toBe(true);
    expect(escape.pixels.every((pixel) => pixel.channel === "classification")).toBe(true);
    expect(capture.pixels).not.toEqual(escape.pixels);
    expect(capture.evpaDirection).toBeNull();
    expect(escape.imageOrderRadius).toBeNull();
    expect(() => createKerrScienceGlyphV307({ classification: KERR_CLASSIFICATION_V299.escape, redshiftFactor: 0, redshiftApplicable: false, imageOrder: 0, evpaDeg: null }))
      .toThrow("v307-nondisk-observable-must-be-unavailable");
  });

  it("encodes ZAMO EVPA as a 180-degree screen line and image order as a bounded contour", () => {
    const zero = createKerrScienceGlyphV307({ classification: KERR_CLASSIFICATION_V299["disk-hit"], redshiftFactor: 0.8, redshiftApplicable: true, imageOrder: 2, evpaDeg: 0 });
    const halfTurn = createKerrScienceGlyphV307({ classification: KERR_CLASSIFICATION_V299["disk-hit"], redshiftFactor: 0.8, redshiftApplicable: true, imageOrder: 2, evpaDeg: 180 });
    const quarterTurn = createKerrScienceGlyphV307({ classification: KERR_CLASSIFICATION_V299["disk-hit"], redshiftFactor: 0.8, redshiftApplicable: true, imageOrder: 2, evpaDeg: 90 });
    expect(zero.imageOrderRadius).toBe(5);
    expect(zero.imageOrderCapped).toBe(false);
    expect(zero.evpaDirection).toEqual([6, 0]);
    expect(quarterTurn.evpaDirection).toEqual([0, -6]);
    expect([...pixelMap(zero).keys()].sort()).toEqual([...pixelMap(halfTurn).keys()].sort());
    expect(zero.pixels.some((pixel) => pixel.channel === "evpa")).toBe(true);
    expect(zero.pixels.some((pixel) => pixel.channel === "image-order")).toBe(true);

    const capped = createKerrScienceGlyphV307({ classification: KERR_CLASSIFICATION_V299["disk-hit"], redshiftFactor: 1.2, redshiftApplicable: true, imageOrder: 20, evpaDeg: 45 });
    expect(capped).toMatchObject({ imageOrderRadius: 11, imageOrderCapped: true });
  });

  it("creates a deterministic isolated raster without mutating authority arrays", () => {
    const payload = createPayload();
    const before = cloneKerrScienceTransferPayloadV299(payload);
    const first = createKerrScienceRasterV307(payload);
    const replay = createKerrScienceRasterV307(payload);
    expect(payload).toEqual(before);
    expect(first.rgba).toEqual(replay.rgba);
    expect(first.rgba).not.toBe(replay.rgba);
    expect(first.rgba.buffer).not.toBe(payload.classification.buffer);
    expect(first).toMatchObject({
      summary: {
        sampleCount: 16,
        captureCount: 6,
        escapeCount: 6,
        diskHitCount: 4,
        evpaGlyphCount: 4,
        imageOrderGlyphCount: 4,
        imageOrderCappedCount: 0,
      },
      encoding: {
        intensity: "exact-v306-workbench-only-not-rasterized",
        sourcePayloadMutationAllowed: false,
        cinematicBufferShared: false,
      },
      boundary: "sparse-authority-visualization-not-dense-transfer-map",
    });
    expect(first.rgba.some((value) => value !== 0)).toBe(true);
  });

  it("contains no random or adaptive intensity mapping in the scientific raster", () => {
    const source = readFileSync(resolve(process.cwd(), "app/lib/kerrScienceRasterV307.ts"), "utf8");
    const renderer = readFileSync(resolve(process.cwd(), "app/components/KerrStrongGravityRendererV299.tsx"), "utf8");
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("sampleAtlasCinematicDetailV299");
    expect(source).not.toContain("payload.intensity[index]");
    expect(source).toContain("exact-v306-workbench-only-not-rasterized");
    expect(renderer).toContain("createKerrScienceBandRasterWithIntegrityV321(acquiredPayload.payload, acquiredBands.view)");
    expect(renderer).toContain("publishKerrScienceBandRasterTelemetryV321");
    expect(renderer).toContain("kerr-v321-science-fixed-band-sparse");
    expect(renderer).toContain("atlasScienceRasterEncoding: raster.encoding");
  });
});
