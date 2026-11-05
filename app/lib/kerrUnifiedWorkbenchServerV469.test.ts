import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrUnifiedWorkbenchV469,
  resetKerrUnifiedWorkbenchServerCacheForTestsV469,
} from "./kerrUnifiedWorkbenchServerV469";

afterEach(() => resetKerrUnifiedWorkbenchServerCacheForTestsV469());

describe("v469 unified workbench server", () => {
  it("single-flights a bounded, SHA-addressed artifact", async () => {
    const [left, right] = await Promise.all([
      loadKerrUnifiedWorkbenchV469(),
      loadKerrUnifiedWorkbenchV469(),
    ]);

    expect(left).toBe(right);
    expect(left.summary.stages).toHaveLength(6);
    expect(left.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(left.export.bytes).digest("hex")).toBe(
      left.export.fileSha256,
    );
  });
});
