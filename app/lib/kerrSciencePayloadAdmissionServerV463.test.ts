import { afterEach, describe, expect, it } from "vitest";
import { loadKerrSciencePayloadAdmissionV463, resetKerrSciencePayloadAdmissionServerCacheForTestsV463 } from "./kerrSciencePayloadAdmissionServerV463";

afterEach(() => resetKerrSciencePayloadAdmissionServerCacheForTestsV463());
describe("v463 payload admission server", () => {
  it("single-flights the bounded zero-row artifact", async () => {
    const first = loadKerrSciencePayloadAdmissionV463();
    const second = loadKerrSciencePayloadAdmissionV463();
    const [left, right] = await Promise.all([first, second]);
    expect(left.artifact.artifactSha256).toBe(right.artifact.artifactSha256);
    expect(left.summary.payload.rows).toHaveLength(0);
    expect(left.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024);
  });
});
