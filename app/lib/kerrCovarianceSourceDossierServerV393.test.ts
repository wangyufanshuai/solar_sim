import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadKerrCovarianceSourceAdmissionV393,
  resetKerrCovarianceSourceDossierServerV393CacheForTests,
} from "./kerrCovarianceSourceDossierServerV393";

describe("v393 covariance source server", () => {
  it("loads the bounded canonical production-incomplete artifact", async () => {
    resetKerrCovarianceSourceDossierServerV393CacheForTests();
    const artifact = await loadKerrCovarianceSourceAdmissionV393();
    expect(artifact.validator).toMatchObject({
      qualified: true,
      acceptedControlFixtureCount: 1,
      rejectedAdversarialFixtureCount: 9,
    });
    expect(artifact.productionAdmission).toMatchObject({
      dossierAvailable: false,
      covariancePackBuilt: false,
    });
  });

  it("rejects malformed evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v393-"));
    const target = join(
      root,
      "dist/science/kerr-covariance-source-admission-v393",
    );
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "source-admission.json"), "{}\n");
    resetKerrCovarianceSourceDossierServerV393CacheForTests();
    await expect(loadKerrCovarianceSourceAdmissionV393(root)).rejects.toThrow(
      "v393-covariance-source-admission-artifact-identity",
    );
  });
});
