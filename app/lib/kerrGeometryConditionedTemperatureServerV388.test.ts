import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadKerrGeometryConditionedTemperatureV388,
  resetKerrGeometryConditionedTemperatureServerV388CacheForTests,
} from "./kerrGeometryConditionedTemperatureServerV388";

describe("v388 conditioned temperature server", () => {
  it("loads the bounded canonical replay", async () => {
    resetKerrGeometryConditionedTemperatureServerV388CacheForTests();
    const artifact = await loadKerrGeometryConditionedTemperatureV388();
    expect(artifact.identifiability).toMatchObject({
      spectralOnlyRank: 1,
      geometryConditionedRank: 2,
    });
    expect(artifact.qualification.absoluteTemperatureAuthorityGranted).toBe(
      false,
    );
  });

  it("rejects malformed evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v388-"));
    const target = join(
      root,
      "dist/science/kerr-geometry-conditioned-temperature-v388",
    );
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "temperature-replay.json"), "{}\n");
    resetKerrGeometryConditionedTemperatureServerV388CacheForTests();
    await expect(loadKerrGeometryConditionedTemperatureV388(root)).rejects.toThrow(
      "v388-temperature-artifact-identity",
    );
  });
});
