import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrSpectralSensitivityV483,
  resetKerrSpectralSensitivityServerCacheForTestsV483,
} from "./kerrSpectralSensitivityServerV483";

afterEach(() => resetKerrSpectralSensitivityServerCacheForTestsV483());

describe("v483 sensitivity server", () => {
  it("single-flights a bounded mode envelope", async () => {
    const [first, second] = await Promise.all([
      loadKerrSpectralSensitivityV483(),
      loadKerrSpectralSensitivityV483(),
    ]);
    expect(first).toBe(second);
    expect(first.summary.audit.projectionCount).toBe(20);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(first.export.bytes).digest("hex")).toBe(
      first.export.fileSha256,
    );
  });
});
