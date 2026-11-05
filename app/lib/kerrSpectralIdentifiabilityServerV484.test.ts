import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrSpectralIdentifiabilityV484,
  resetKerrSpectralIdentifiabilityServerCacheForTestsV484,
} from "./kerrSpectralIdentifiabilityServerV484";

afterEach(() => resetKerrSpectralIdentifiabilityServerCacheForTestsV484());

describe("v484 identifiability server", () => {
  it("single-flights a bounded identifiability ledger", async () => {
    const [first, second] = await Promise.all([
      loadKerrSpectralIdentifiabilityV484(),
      loadKerrSpectralIdentifiabilityV484(),
    ]);
    expect(first).toBe(second);
    expect(first.summary.audit.identifiableDimensionCount).toBe(4);
    expect(first.summary.audit.unidentifiableDimensionCount).toBe(16);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(first.export.bytes).digest("hex")).toBe(
      first.export.fileSha256,
    );
  });
});
