import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrPhotonRadiometryTransferV477,
  resetKerrPhotonRadiometryTransferServerCacheForTestsV477,
} from "./kerrPhotonRadiometryTransferServerV477";

afterEach(() => resetKerrPhotonRadiometryTransferServerCacheForTestsV477());

describe("v477 photon radiometry server", () => {
  it("single-flights a bounded, row-verified transfer payload", async () => {
    const [left, right] = await Promise.all([
      loadKerrPhotonRadiometryTransferV477(),
      loadKerrPhotonRadiometryTransferV477(),
    ]);

    expect(left).toBe(right);
    expect(left.summary.rows).toHaveLength(4);
    expect(left.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(createHash("sha256").update(left.export.bytes).digest("hex")).toBe(
      left.export.fileSha256,
    );
  });
});
