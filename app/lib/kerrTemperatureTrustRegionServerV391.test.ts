import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadKerrTemperatureTrustRegionV391,
  resetKerrTemperatureTrustRegionServerV391CacheForTests,
} from "./kerrTemperatureTrustRegionServerV391";

describe("v391 trust region server", () => {
  it("loads the bounded canonical curvature artifact", async () => {
    resetKerrTemperatureTrustRegionServerV391CacheForTests();
    const artifact = await loadKerrTemperatureTrustRegionV391();
    expect(artifact.counts).toMatchObject({
      rowCount: 12,
      axisReplayCount: 216,
      mixedCornerReplayCount: 864,
    });
    expect(artifact.method.stressGridIsPhysicalUncertainty).toBe(false);
  });

  it("rejects malformed evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v391-"));
    const target = join(
      root,
      "dist/science/kerr-temperature-trust-region-v391",
    );
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "trust-region.json"), "{}\n");
    resetKerrTemperatureTrustRegionServerV391CacheForTests();
    await expect(loadKerrTemperatureTrustRegionV391(root)).rejects.toThrow(
      "v391-trust-region-artifact-identity",
    );
  });
});
