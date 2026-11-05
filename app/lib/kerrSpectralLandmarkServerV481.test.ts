import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrSpectralLandmarksV481,
  resetKerrSpectralLandmarkServerCacheForTestsV481,
} from "./kerrSpectralLandmarkServerV481";

afterEach(() => resetKerrSpectralLandmarkServerCacheForTestsV481());

describe("v481 spectral landmark server", () => {
  it("single-flights a bounded, content-verified coordinate envelope", async () => {
    const [first, second] = await Promise.all([
      loadKerrSpectralLandmarksV481(),
      loadKerrSpectralLandmarksV481(),
    ]);
    expect(first).toBe(second);
    expect(first.summary.audit.landmarkCount).toBe(20);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(first.export.bytes).digest("hex")).toBe(
      first.export.fileSha256,
    );
  });
});
