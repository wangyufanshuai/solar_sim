import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrDetectorExpectedImageV450,
  resetKerrDetectorExpectedImageServerCacheForTestsV450,
} from "./kerrDetectorExpectedImageFormationServerV450";

afterEach(() => resetKerrDetectorExpectedImageServerCacheForTestsV450());

describe("v450 expected image server", () => {
  it("loads a bounded summary and only whitelisted exports", async () => {
    const first = loadKerrDetectorExpectedImageV450();
    const second = loadKerrDetectorExpectedImageV450();
    const [loaded, replay] = await Promise.all([first, second]);
    expect(replay.artifact.artifactSha256).toBe(loaded.artifact.artifactSha256);
    expect(loaded.summary.rows).toHaveLength(4);
    expect(loaded.summary.counts.sparseDepositRowCount).toBe(16);
    expect(Object.keys(loaded.exports)).toEqual([
      "qualification",
      "fixture",
      "oracle",
    ]);
    expect(
      Object.values(loaded.exports).every((entry) => entry.bytes.byteLength < 256 * 1024),
    ).toBe(true);
  });
});
