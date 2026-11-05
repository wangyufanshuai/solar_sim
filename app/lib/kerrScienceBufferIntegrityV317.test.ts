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
  KERR_SCIENCE_TYPED_ARRAY_COUNT_V317,
  createKerrScienceBufferSnapshotV317,
  createKerrScienceRasterWithIntegrityV317,
  kerrInteractiveBufferDisjointFromObservedScienceV317,
  kerrScienceBuffersDisjointFromV317,
  resetKerrScienceBufferObservationsV317ForTests,
} from "./kerrScienceBufferIntegrityV317";
import { cloneKerrScienceTransferPayloadV299 } from "./strongGravityRenderingV299";

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

describe("v317 science buffer integrity", () => {
  it("digests all 67 scientific arrays and proves rasterization is byte-exact immutable", async () => {
    resetKerrScienceBufferObservationsV317ForTests();
    const payload = createPayload();
    const materialized = await createKerrScienceRasterWithIntegrityV317(payload);
    expect(materialized.integrity).toMatchObject({
      sourcePayloadUnchanged: true,
      rasterBufferDisjoint: true,
      denseBoundary: "sparse-authority-dense-incomplete",
      before: {
        typedArrayCount: KERR_SCIENCE_TYPED_ARRAY_COUNT_V317,
        uniqueBufferCount: KERR_SCIENCE_TYPED_ARRAY_COUNT_V317,
        internalBuffersDisjoint: true,
        digestAlgorithm: "sha-256-field-framed-byte-exact",
      },
    });
    expect(materialized.integrity.before.digestSha256).toBe(materialized.integrity.after.digestSha256);
    expect(materialized.integrity.before.digestSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(materialized.integrity.rasterDigestSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(kerrScienceBuffersDisjointFromV317(payload, [materialized.raster.rgba])).toBe(true);
    expect(kerrInteractiveBufferDisjointFromObservedScienceV317(new Float32Array(8))).toBe(true);
    expect(kerrInteractiveBufferDisjointFromObservedScienceV317(payload.alphaM)).toBe(false);
  });

  it("detects scientific value mutation and internal buffer aliasing", async () => {
    const payload = createPayload();
    const before = await createKerrScienceBufferSnapshotV317(payload);
    payload.alphaM[0] += 0.125;
    const after = await createKerrScienceBufferSnapshotV317(payload);
    expect(after.digestSha256).not.toBe(before.digestSha256);

    const cloned = cloneKerrScienceTransferPayloadV299(createPayload());
    const aliased = { ...cloned, betaM: cloned.alphaM };
    await expect(createKerrScienceBufferSnapshotV317(aliased)).rejects.toThrow("v317-science-internal-buffer-alias");
  });
});
