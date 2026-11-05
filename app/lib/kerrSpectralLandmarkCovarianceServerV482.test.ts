import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrSpectralLandmarkCovarianceV482,
  resetKerrSpectralLandmarkCovarianceServerCacheForTestsV482,
} from "./kerrSpectralLandmarkCovarianceServerV482";

afterEach(() => resetKerrSpectralLandmarkCovarianceServerCacheForTestsV482());

describe("v482 covariance server", () => {
  it("single-flights a bounded covariance artifact", async () => {
    const [first, second] = await Promise.all([
      loadKerrSpectralLandmarkCovarianceV482(),
      loadKerrSpectralLandmarkCovarianceV482(),
    ]);
    expect(first).toBe(second);
    expect(first.summary.audit.covarianceElementCount).toBe(100);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(first.export.bytes).digest("hex")).toBe(
      first.export.fileSha256,
    );
  });
});
