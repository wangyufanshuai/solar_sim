import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadKerrGlobalCovariancePropagationV394,
  resetKerrGlobalCovariancePropagationServerV394CacheForTests,
} from "./kerrGlobalCovariancePropagationServerV394";

describe("v394 global covariance server", () => {
  it("loads the bounded canonical production-unavailable artifact", async () => {
    resetKerrGlobalCovariancePropagationServerV394CacheForTests();
    const artifact = await loadKerrGlobalCovariancePropagationV394();
    expect(artifact.dimensions).toMatchObject({
      inputDimension: 36,
      outputDimension: 24,
      inputCovarianceCoefficientCount: 1296,
      outputCovarianceCoefficientCount: 576,
    });
    expect(artifact.productionAdmission).toMatchObject({
      globalCovarianceModelAvailable: false,
      covariancePropagationExecuted: false,
    });
  });

  it("rejects malformed evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v394-"));
    const target = join(
      root,
      "dist/science/kerr-global-covariance-propagation-v394",
    );
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "global-propagation.json"), "{}\n");
    resetKerrGlobalCovariancePropagationServerV394CacheForTests();
    await expect(loadKerrGlobalCovariancePropagationV394(root)).rejects.toThrow(
      "v394-global-covariance-artifact-identity",
    );
  });
});
