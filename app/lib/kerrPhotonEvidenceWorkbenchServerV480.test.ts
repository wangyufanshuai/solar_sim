import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrPhotonEvidenceWorkbenchV480,
  resetKerrPhotonEvidenceWorkbenchServerCacheForTestsV480,
} from "./kerrPhotonEvidenceWorkbenchServerV480";

afterEach(() => resetKerrPhotonEvidenceWorkbenchServerCacheForTestsV480());

describe("v480 photon evidence workbench server", () => {
  it("single-flights a bounded, content-verified summary", async () => {
    const [first, second] = await Promise.all([
      loadKerrPhotonEvidenceWorkbenchV480(),
      loadKerrPhotonEvidenceWorkbenchV480(),
    ]);
    expect(first).toBe(second);
    expect(first.summary.stages).toHaveLength(3);
    expect(first.summary.products).toHaveLength(9);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(first.export.bytes).digest("hex")).toBe(
      first.export.fileSha256,
    );
  });
});
