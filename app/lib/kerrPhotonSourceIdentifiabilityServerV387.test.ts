import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadKerrPhotonSourceIdentifiabilityV387,
  resetKerrPhotonSourceIdentifiabilityServerV387CacheForTests,
} from "./kerrPhotonSourceIdentifiabilityServerV387";

describe("v387 identifiability server", () => {
  it("loads the bounded canonical artifact", async () => {
    resetKerrPhotonSourceIdentifiabilityServerV387CacheForTests();
    const artifact = await loadKerrPhotonSourceIdentifiabilityV387();
    expect(artifact.global.rank).toBe(1);
    expect(artifact.theorem.additionalContinuumBandsBreakDegeneracy).toBe(false);
    expect(artifact.covarianceAdmission.covariancePackAvailable).toBe(false);
  });

  it("rejects malformed evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v387-"));
    const target = join(
      root,
      "dist/science/kerr-photon-source-identifiability-v387",
    );
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "identifiability.json"), "{}\n");
    resetKerrPhotonSourceIdentifiabilityServerV387CacheForTests();
    await expect(loadKerrPhotonSourceIdentifiabilityV387(root)).rejects.toThrow(
      "v387-identifiability-artifact-identity",
    );
  });
});
