import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadKerrGlobalObservabilityV395,
  resetKerrGlobalObservabilityServerV395CacheForTests,
} from "./kerrGlobalObservabilityServerV395";

describe("v395 observability server", () => {
  it("loads the bounded canonical structural artifact", async () => {
    resetKerrGlobalObservabilityServerV395CacheForTests();
    const artifact = await loadKerrGlobalObservabilityV395();
    expect(artifact.dimensions).toMatchObject({
      inputDimension: 36,
      outputDimension: 24,
      rank: 24,
      nullity: 12,
    });
    expect(artifact.productionAdmission).toMatchObject({
      physicalNuisanceModesAvailable: false,
      physicalModeAttributionExecuted: false,
    });
  });

  it("rejects malformed evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v395-"));
    const target = join(root, "dist/science/kerr-global-observability-v395");
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "observability.json"), "{}\n");
    resetKerrGlobalObservabilityServerV395CacheForTests();
    await expect(loadKerrGlobalObservabilityV395(root)).rejects.toThrow(
      "v395-global-observability-artifact-identity",
    );
  });
});
