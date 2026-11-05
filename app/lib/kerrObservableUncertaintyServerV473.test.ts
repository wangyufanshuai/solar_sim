import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrObservableUncertaintyV473,
  resetKerrObservableUncertaintyServerCacheForTestsV473,
} from "./kerrObservableUncertaintyServerV473";

afterEach(() => resetKerrObservableUncertaintyServerCacheForTestsV473());

describe("v473 uncertainty server", () => {
  it("single-flights a bounded SHA-addressed ledger", async () => {
    const [left, right] = await Promise.all([
      loadKerrObservableUncertaintyV473(),
      loadKerrObservableUncertaintyV473(),
    ]);

    expect(left).toBe(right);
    expect(left.summary.entries).toHaveLength(13);
    expect(left.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(left.export.bytes).digest("hex")).toBe(
      left.export.fileSha256,
    );
  });
});
