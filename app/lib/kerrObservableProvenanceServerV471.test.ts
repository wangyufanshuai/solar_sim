import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrObservableProvenanceV471,
  resetKerrObservableProvenanceServerCacheForTestsV471,
} from "./kerrObservableProvenanceServerV471";

afterEach(() => resetKerrObservableProvenanceServerCacheForTestsV471());

describe("v471 observable provenance server", () => {
  it("single-flights a bounded SHA-addressed matrix", async () => {
    const [left, right] = await Promise.all([
      loadKerrObservableProvenanceV471(),
      loadKerrObservableProvenanceV471(),
    ]);

    expect(left).toBe(right);
    expect(left.summary.rows).toHaveLength(13);
    expect(left.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(left.export.bytes).digest("hex")).toBe(
      left.export.fileSha256,
    );
  });
});
