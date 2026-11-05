import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadKerrPhysicalCovarianceAdmissionV392,
  resetKerrPhysicalCovarianceAdmissionServerV392CacheForTests,
} from "./kerrPhysicalCovarianceAdmissionServerV392";

describe("v392 covariance admission server", () => {
  it("loads the bounded canonical fail-closed artifact", async () => {
    resetKerrPhysicalCovarianceAdmissionServerV392CacheForTests();
    const artifact = await loadKerrPhysicalCovarianceAdmissionV392();
    expect(artifact.validator).toMatchObject({
      qualified: true,
      acceptedControlFixtureCount: 1,
      rejectedAdversarialFixtureCount: 6,
    });
    expect(artifact.productionAdmission).toMatchObject({
      physicalCovariancePackAvailable: false,
      covarianceProjectionExecuted: false,
    });
  });

  it("rejects malformed evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v392-"));
    const target = join(
      root,
      "dist/science/kerr-physical-covariance-admission-v392",
    );
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "covariance-admission.json"), "{}\n");
    resetKerrPhysicalCovarianceAdmissionServerV392CacheForTests();
    await expect(loadKerrPhysicalCovarianceAdmissionV392(root)).rejects.toThrow(
      "v392-covariance-admission-artifact-identity",
    );
  });
});
