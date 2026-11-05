import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadMeasurementAuthorityTopologyV378,
  resetMeasurementAuthorityTopologyServerV378CacheForTests,
} from "./measurementAuthorityTopologyServerV378";

afterEach(() => resetMeasurementAuthorityTopologyServerV378CacheForTests());

describe("v378 measurement authority topology server", () => {
  it("loads the bounded content-addressed topology", async () => {
    expect(await loadMeasurementAuthorityTopologyV378()).toMatchObject({
      presentInputCount: 1,
      missingInputCount: 7,
      nodeCount: 10,
      edgeCount: 9,
      acyclic: true,
      boundaries: {
        observedCountsNodeExists: false,
        syntheticFallbackAllowed: false,
      },
    });
  });

  it("rejects a tampered topology", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v378-"));
    const path = join(
      root,
      "dist/science/measurement-authority-topology-v378/topology.json",
    );
    await mkdir(dirname(path), { recursive: true });
    const artifact = JSON.parse(
      await readFile(
        "dist/science/measurement-authority-topology-v378/topology.json",
        "utf8",
      ),
    );
    artifact.boundaries.observedCountsNodeExists = true;
    await writeFile(path, JSON.stringify(artifact));
    await expect(loadMeasurementAuthorityTopologyV378(root)).rejects.toThrow();
  });
});
