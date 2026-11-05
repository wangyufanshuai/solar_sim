import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrPhotonMetrologyCockpitV485,
  resetKerrPhotonMetrologyCockpitServerCacheForTestsV485,
} from "./kerrPhotonMetrologyCockpitServerV485";

afterEach(() => resetKerrPhotonMetrologyCockpitServerCacheForTestsV485());

describe("v485 cockpit server", () => {
  it("single-flights a bounded scalar-only summary", async () => {
    const [first, second] = await Promise.all([
      loadKerrPhotonMetrologyCockpitV485(),
      loadKerrPhotonMetrologyCockpitV485(),
    ]);
    expect(first).toBe(second);
    expect(first.summary.stages).toHaveLength(6);
    expect(first.summary.audit.summaryMatrixElementCount).toBe(0);
    expect(first.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(first.export.bytes).digest("hex")).toBe(
      first.export.fileSha256,
    );
  });
});
