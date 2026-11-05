import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadKerrConditionalTemperatureIntervalV389,
  resetKerrConditionalTemperatureIntervalServerV389CacheForTests,
} from "./kerrConditionalTemperatureIntervalServerV389";

describe("v389 conditional temperature interval server", () => {
  it("loads the bounded canonical exact-interval artifact", async () => {
    resetKerrConditionalTemperatureIntervalServerV389CacheForTests();
    const artifact = await loadKerrConditionalTemperatureIntervalV389();
    expect(artifact.counts).toMatchObject({
      rayCount: 4,
      bandCount: 3,
      intervalCount: 12,
      overlapCount: 12,
    });
    expect(artifact.intervalSemantics).toMatchObject({
      confidenceInterval: false,
      probabilityContentAssigned: false,
      absoluteScientificIntervalQualified: false,
    });
  });

  it("rejects malformed evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v389-"));
    const target = join(
      root,
      "dist/science/kerr-conditional-temperature-interval-v389",
    );
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "temperature-interval.json"), "{}\n");
    resetKerrConditionalTemperatureIntervalServerV389CacheForTests();
    await expect(
      loadKerrConditionalTemperatureIntervalV389(root),
    ).rejects.toThrow("v389-interval-artifact-identity");
  });
});
