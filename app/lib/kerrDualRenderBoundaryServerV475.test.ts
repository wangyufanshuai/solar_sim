import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrDualRenderBoundaryV475,
  resetKerrDualRenderBoundaryServerCacheForTestsV475,
} from "./kerrDualRenderBoundaryServerV475";

afterEach(() => resetKerrDualRenderBoundaryServerCacheForTestsV475());

describe("v475 dual render boundary server", () => {
  it("single-flights a bounded, SHA-verified summary", async () => {
    const [left, right] = await Promise.all([
      loadKerrDualRenderBoundaryV475(),
      loadKerrDualRenderBoundaryV475(),
    ]);

    expect(left).toBe(right);
    expect(left.summary.scienceBuffer.rayIds).toHaveLength(4);
    expect(left.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(left.export.bytes).digest("hex")).toBe(
      left.export.fileSha256,
    );
  });
});
