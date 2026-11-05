import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrSparseSciencePayloadV474,
  resetKerrSparseSciencePayloadServerCacheForTestsV474,
} from "./kerrSparseSciencePayloadServerV474";

afterEach(() => resetKerrSparseSciencePayloadServerCacheForTestsV474());

describe("v474 sparse payload server", () => {
  it("single-flights a bounded, row-verified envelope", async () => {
    const [left, right] = await Promise.all([
      loadKerrSparseSciencePayloadV474(),
      loadKerrSparseSciencePayloadV474(),
    ]);

    expect(left).toBe(right);
    expect(left.summary.rows).toHaveLength(4);
    expect(left.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(left.export.bytes).digest("hex")).toBe(
      left.export.fileSha256,
    );
  });
});
