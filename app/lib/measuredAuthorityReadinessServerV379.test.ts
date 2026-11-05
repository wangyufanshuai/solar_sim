import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadMeasuredAuthorityReadinessV379,
  resetMeasuredAuthorityReadinessServerV379CacheForTests,
} from "./measuredAuthorityReadinessServerV379";

afterEach(() => resetMeasuredAuthorityReadinessServerV379CacheForTests());

describe("v379 measured authority readiness server", () => {
  it("loads the bounded contract-qualified, input-missing matrix", async () => {
    expect(await loadMeasuredAuthorityReadinessV379()).toMatchObject({
      presentInputCount: 0,
      missingInputCount: 7,
      schemaContractQualifiedCount: 7,
      boundedReadQualifiedCount: 7,
      downstream: {
        v375EnvelopeAvailable: false,
        v376ScienceImageAvailable: false,
        observedCountsAvailable: false,
      },
    });
  });

  it("rejects a tampered readiness claim", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v379-"));
    const path = join(
      root,
      "dist/science/measured-authority-readiness-v379/readiness.json",
    );
    await mkdir(dirname(path), { recursive: true });
    const artifact = JSON.parse(
      await readFile(
        "dist/science/measured-authority-readiness-v379/readiness.json",
        "utf8",
      ),
    );
    artifact.presentInputCount = 7;
    await writeFile(path, JSON.stringify(artifact));
    await expect(loadMeasuredAuthorityReadinessV379(root)).rejects.toThrow();
  });
});
