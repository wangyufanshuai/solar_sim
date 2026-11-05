import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadKerrAuxiliaryConstraintDesignV396,
  resetKerrAuxiliaryConstraintDesignServerV396CacheForTests,
} from "./kerrAuxiliaryConstraintDesignServerV396";

describe("v396 auxiliary constraint server", () => {
  it("loads the bounded canonical structural artifact", async () => {
    resetKerrAuxiliaryConstraintDesignServerV396CacheForTests();
    const artifact = await loadKerrAuxiliaryConstraintDesignV396();
    expect(artifact.design).toMatchObject({
      strategyCount: 5,
      blockCount: 12,
      minimumConstraintsForFullRank: 12,
      baselineRank: 24,
      fullRank: 36,
    });
    expect(artifact.productionAdmission.instrumentResponseAvailable).toBe(false);
  });

  it("rejects malformed evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v396-"));
    const target = join(
      root,
      "dist/science/kerr-auxiliary-constraint-design-v396",
    );
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "constraint-design.json"), "{}\n");
    resetKerrAuxiliaryConstraintDesignServerV396CacheForTests();
    await expect(loadKerrAuxiliaryConstraintDesignV396(root)).rejects.toThrow(
      "v396-auxiliary-constraint-artifact-identity",
    );
  });
});
