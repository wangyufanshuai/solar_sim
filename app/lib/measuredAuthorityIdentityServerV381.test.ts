import { afterEach, describe, expect, it } from "vitest";
import {
  loadMeasuredAuthorityIdentityAuditV381,
  resetMeasuredAuthorityIdentityServerV381CacheForTests,
} from "./measuredAuthorityIdentityServerV381";

afterEach(() => resetMeasuredAuthorityIdentityServerV381CacheForTests());

describe("v381 measured authority identity server", () => {
  it("loads and verifies the bounded content-addressed audit", async () => {
    const first = await loadMeasuredAuthorityIdentityAuditV381();
    const second = await loadMeasuredAuthorityIdentityAuditV381();
    expect(second).toBe(first);
    expect(first.correctedModel.bandLaneCount).toBe(3);
    expect(first.correctedModel.qualifiedBandLaneCount).toBe(0);
  });
});
