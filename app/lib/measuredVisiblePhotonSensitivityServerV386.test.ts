import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadMeasuredVisiblePhotonSensitivityV386,
  resetMeasuredVisiblePhotonSensitivityServerV386CacheForTests,
} from "./measuredVisiblePhotonSensitivityServerV386";

describe("v386 sensitivity server", () => {
  it("loads the canonical bounded artifact", async () => {
    resetMeasuredVisiblePhotonSensitivityServerV386CacheForTests();
    const artifact = await loadMeasuredVisiblePhotonSensitivityV386();
    expect(artifact.counts).toMatchObject({
      rayCount: 4,
      wavelengthBinCount: 12,
      responseCoefficientCount: 56,
    });
    expect(artifact.qualification.absoluteScientificUncertaintyQualified).toBe(
      false,
    );
  });

  it("rejects a malformed artifact", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v386-"));
    const target = join(
      root,
      "dist/science/measured-visible-photon-sensitivity-v386",
    );
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "sensitivity.json"), "{}\n");
    resetMeasuredVisiblePhotonSensitivityServerV386CacheForTests();
    await expect(loadMeasuredVisiblePhotonSensitivityV386(root)).rejects.toThrow(
      "v386-sensitivity-artifact-identity",
    );
  });
});
