import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createKerrPhysicalObservationIntakeAdversarialFixturesV398,
  createKerrPhysicalObservationIntakeControlV398,
  parseKerrPhysicalObservationIntakeArtifactV398,
  validateKerrPhysicalObservationIntakeV398,
} from "./kerrPhysicalObservationIntakeV398";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const transfer = () => read("dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json");
const sourceAdmission = () => read("dist/science/kerr-covariance-source-admission-v393/source-admission.json");
const v397 = () => read("dist/science/kerr-physical-observation-admission-v397/observation-admission.json");

describe("v398 physical observation intake", () => {
  it("validates the complete synthetic file graph without allowing compile", () => {
    const dependency = v397();
    const control = createKerrPhysicalObservationIntakeControlV398(
      transfer(), sourceAdmission(), dependency.artifactSha256,
      dependency.source.v396ConstraintDesignArtifactSha256,
    );
    const result = validateKerrPhysicalObservationIntakeV398(
      control.manifest, control.observedFiles, control.pack, transfer(), sourceAdmission(),
      dependency.artifactSha256, dependency.source.v396ConstraintDesignArtifactSha256,
    );
    expect(result).toMatchObject({ status: "admitted-validation-only", compileAllowed: false, publicationAllowed: false, checkedFileCount: 13 });
  });

  it("rejects all pre-registered staging and integrity attacks", () => {
    const dependency = v397();
    const fixtures = createKerrPhysicalObservationIntakeAdversarialFixturesV398(
      transfer(), sourceAdmission(), dependency.artifactSha256,
      dependency.source.v396ConstraintDesignArtifactSha256,
    );
    expect(fixtures).toHaveLength(10);
    for (const fixture of fixtures) {
      const result = validateKerrPhysicalObservationIntakeV398(
        fixture.manifest, fixture.observedFiles, fixture.pack, transfer(), sourceAdmission(),
        dependency.artifactSha256, dependency.source.v396ConstraintDesignArtifactSha256,
      );
      expect(result.status, fixture.id).toBe("rejected");
      expect(result.rejectionReasons, fixture.id).toContain(fixture.expectedReason);
    }
  });

  it("keeps missing staging and compile state explicit", () => {
    const artifact = read("dist/science/kerr-physical-observation-intake-v398/intake-inspect.json");
    expect(parseKerrPhysicalObservationIntakeArtifactV398(artifact)).toBe(artifact);
    expect(artifact.inspect).toMatchObject({ stagingManifestPresent: false, presentFileCount: 0, compileExecuted: false, candidatePublished: false, attemptConsumed: false });
    expect(artifact.productionAdmission).toMatchObject({ physicalObservationPackAvailable: false, physicalPackCompiled: false, physicalPackPublished: false, measuredAuthorityGranted: false });
    const compiler = readFileSync("scripts/compile-kerr-physical-observation-v398.ts", "utf8");
    expect(compiler).toContain("v398-staging-unavailable-no-attempt-consumed");
    expect(compiler).toContain("v398-refuse-overwrite-existing-candidate");
    expect(compiler).toContain("independentScientificValidation: \"pending\"");
  });
});
