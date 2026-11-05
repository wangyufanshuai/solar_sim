import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalShaV427,
  createKerrHighEnergyResponseAcquisitionSummaryV427,
  parseKerrHighEnergyResponseAcquisitionArtifactV427,
  validateKerrHighEnergyResponseSubmissionV427,
} from "./kerrHighEnergyResponseAcquisitionPackV427";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v427 high-energy response acquisition pack", () => {
  it("validates only the nonpublishable fixture structure and rejects corrupt response rows", () => {
    const fixture = read("dist/science/kerr-high-energy-response-acquisition-pack-v427/validator-fixture.json");
    const result = validateKerrHighEnergyResponseSubmissionV427(fixture);
    expect(result).toMatchObject({ status: "validated-test-fixture-nonpublishable", valid: true, measuredAuthorityGranted: false, scienceResponseApplicationAllowed: false });
    expect(result.metrics).toMatchObject({ trueEnergyBinCount: 6, detectorChannelCount: 6, repeatCount: 2, effectiveAreaRowCount: 12, modulationRowCount: 12, redistributionRowCount: 72, backgroundRowCount: 12, responseCovarianceRowCount: 576, redistributionCovarianceRowCount: 216 });
    const corrupt = structuredClone(fixture);
    corrupt.redistributionRows[0].probability += 0.1;
    expect(validateKerrHighEnergyResponseSubmissionV427(corrupt)).toMatchObject({ status: "rejected-invalid-submission", valid: false, measuredAuthorityGranted: false });
  });

  it("publishes nine empty hand-off files without measured response authority", () => {
    const artifact = parseKerrHighEnergyResponseAcquisitionArtifactV427(read("dist/science/kerr-high-energy-response-acquisition-pack-v427/acquisition-pack.json"));
    expect(canonicalShaV427(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.view.files).toHaveLength(9);
    expect(artifact.view.files.filter((entry) => entry.measurementTemplate)).toHaveLength(7);
    expect(artifact.view.files.filter((entry) => entry.measurementTemplate).every((entry) => entry.dataRowCount === 0 && entry.admissibleAsMeasured === false)).toBe(true);
    expect(artifact.view.authorityBoundary).toMatchObject({ packSchemaAuthorityGranted: true, validatorAuthorityGranted: true, fixturePerformanceAuthorityGranted: false, measuredResponseAuthorityGranted: false, scienceProjectionAuthorityGranted: false });
    const summary = createKerrHighEnergyResponseAcquisitionSummaryV427(artifact);
    expect(summary).not.toHaveProperty("files");
    expect(summary).not.toHaveProperty("fixture");
  });
});
