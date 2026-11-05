import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  deterministicDisplayPhase,
  displaySemiMajorAxisAu,
} from "./exoplanetCatalog";

describe("v127 exoplanet atlas", () => {
  it("keeps derived geometry explicit and deterministic", () => {
    expect(displaySemiMajorAxisAu(365.25, 1)).toBeCloseTo(1);
    expect(displaySemiMajorAxisAu(null, 1)).toBeNull();
    expect(deterministicDisplayPhase("kepler-90-b")).toBe(
      deterministicDisplayPhase("kepler-90-b"),
    );
  });

  it("publishes all confirmed systems as offline shards", () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), "dist/content-packs/files/core/data/exoplanets-v2/manifest.json"), "utf8"),
    ) as {
      systemCount: number;
      planetCount: number;
      runtimePolicy: string;
      shards: Array<{ systemCount: number; sha256: string }>;
      index: Record<string, string>;
    };
    expect(manifest.systemCount).toBe(4_735);
    expect(manifest.planetCount).toBe(6_319);
    expect(manifest.runtimePolicy).toBe("offline-system-shards");
    expect(Object.keys(manifest.index)).toHaveLength(4_735);
    expect(manifest.shards.reduce((sum, shard) => sum + shard.systemCount, 0)).toBe(4_735);
    expect(manifest.shards.every((shard) => /^[a-f0-9]{64}$/.test(shard.sha256))).toBe(
      true,
    );
  });
});
