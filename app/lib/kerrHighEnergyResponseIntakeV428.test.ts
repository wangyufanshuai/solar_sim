import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalShaV428, compileKerrHighEnergyResponseIntakeV428, createKerrHighEnergyResponseIntakeSummaryV428, parseKerrHighEnergyResponseIntakeArtifactV428, type KerrHighEnergyResponseSubmissionSchemaV428 } from "./kerrHighEnergyResponseIntakeV428";
import type { KerrHighEnergyResponseAcquisitionSubmissionV427 } from "./kerrHighEnergyResponseAcquisitionPackV427";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const fileSha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
describe("v428 high-energy response intake firewall", () => {
  it("cross-validates the nonpublishable archive fixture and rejects all adversarial mutations", () => {
    const report = read("dist/science/kerr-high-energy-response-intake-v428/fixture-intake-report.json");
    const normalized = read("dist/science/kerr-high-energy-response-intake-v428/normalized-fixture-submission.json") as KerrHighEnergyResponseAcquisitionSubmissionV427;
    const schema = read("dist/science/kerr-high-energy-response-intake-v428/response-submission-schema.json") as KerrHighEnergyResponseSubmissionSchemaV428;
    const view = compileKerrHighEnergyResponseIntakeV428(report, normalized, schema, fileSha("dist/science/kerr-high-energy-response-intake-v428/normalized-fixture-submission.json"));
    expect(view.fixture).toMatchObject({ status: "validated-test-fixture-intake-nonpublishable", mutationCount: 12, rejectedMutationCount: 12, performanceAuthorityGranted: false });
    expect(view.fixture.pythonTypeScriptMaximumDifference).toBeLessThan(1e-12);
    expect(view.counts).toMatchObject({ fixtureDataRowCount: 900, measuredSubmissionCount: 0, measuredDataRowCount: 0, measuredImportAttemptCount: 0, scienceResponseApplicationCount: 0 });
  });
  it("publishes intake authority without measured-response authority or raw rows in the summary", () => {
    const artifact = parseKerrHighEnergyResponseIntakeArtifactV428(read("dist/science/kerr-high-energy-response-intake-v428/intake-firewall.json"));
    expect(canonicalShaV428(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.view.authorityBoundary).toMatchObject({ intakeSchemaAuthorityGranted: true, containerValidatorAuthorityGranted: true, csvBridgeAuthorityGranted: true, fixturePerformanceAuthorityGranted: false, measuredResponseAuthorityGranted: false, independentScientificValidationGranted: false });
    const summary = createKerrHighEnergyResponseIntakeSummaryV428(artifact);
    expect(summary).not.toHaveProperty("normalizedSubmission");
    expect(summary).not.toHaveProperty("mutationResults");
  });
});
