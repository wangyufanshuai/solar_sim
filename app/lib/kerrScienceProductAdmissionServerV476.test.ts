import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrScienceProductAdmissionV476,
  resetKerrScienceProductAdmissionServerCacheForTestsV476,
} from "./kerrScienceProductAdmissionServerV476";

afterEach(() => resetKerrScienceProductAdmissionServerCacheForTestsV476());

describe("v476 science product admission server", () => {
  it("single-flights a bounded, SHA-verified admission summary", async () => {
    const [left, right] = await Promise.all([
      loadKerrScienceProductAdmissionV476(),
      loadKerrScienceProductAdmissionV476(),
    ]);

    expect(left).toBe(right);
    expect(left.summary.products).toHaveLength(9);
    expect(left.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(left.export.bytes).digest("hex")).toBe(
      left.export.fileSha256,
    );
  });
});
