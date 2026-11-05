import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrEvidenceDependencyV470,
  resetKerrEvidenceDependencyServerCacheForTestsV470,
} from "./kerrEvidenceDependencyServerV470";

afterEach(() => resetKerrEvidenceDependencyServerCacheForTestsV470());

describe("v470 dependency server", () => {
  it("single-flights a bounded SHA-addressed dependency artifact", async () => {
    const [left, right] = await Promise.all([
      loadKerrEvidenceDependencyV470(),
      loadKerrEvidenceDependencyV470(),
    ]);

    expect(left).toBe(right);
    expect(left.summary.nodes).toHaveLength(16);
    expect(left.summary.analysis.rootBlockers).toHaveLength(3);
    expect(left.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(left.export.bytes).digest("hex")).toBe(
      left.export.fileSha256,
    );
  });
});
