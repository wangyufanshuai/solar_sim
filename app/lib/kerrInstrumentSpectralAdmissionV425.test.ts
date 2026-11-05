import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  SPEED_OF_LIGHT_M_PER_S_V425,
  canonicalShaV425,
  createKerrInstrumentSpectralAdmissionSummaryV425,
  createKerrInstrumentSpectralAdmissionViewV425,
  parseKerrInstrumentSpectralAdmissionArtifactV425,
  serializeKerrInstrumentSpectralAdmissionCsvV425,
} from "./kerrInstrumentSpectralAdmissionV425";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v425 instrument spectral applicability firewall", () => {
  it("converts every v424 frequency with exact SI constants and blocks all out-of-domain response applications", () => {
    const view = createKerrInstrumentSpectralAdmissionViewV425(
      read("dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.json"),
      read("dist/science/kerr-polarimeter-calibration-v411/inspect.json"),
      read("dist/science/kerr-polarimeter-spectral-response-v413/spectral-response.json"),
      read("dist/science/kerr-instrument-spectral-admission-v425/python-spectral-admission-oracle.json"),
    );
    expect(view.counts).toMatchObject({ sourcePredictionCount: 24, affectedV424ModulationRowCount: 96, responseEligibleSourceCount: 0, blockedOutOfDomainSourceCount: 24, v413ResponseMatrixApplicationCount: 0 });
    expect(view.domains).toMatchObject({ v413FixtureWavelengthM: [4e-7, 8e-7], overlapM: null, overlapFraction: 0, extrapolation: "forbidden" });
    for (const row of view.rows) {
      expect(row.vacuumWavelengthM).toBe(SPEED_OF_LIGHT_M_PER_S_V425 / row.observedFrequencyHz);
      expect(row.responseEligible).toBe(false);
      expect(row.v413ResponseMatrixApplied).toBe(false);
      expect(row.opticalHwpWollastonPhysicalApplicabilityGranted).toBe(false);
    }
    expect(view.metrics.maximumPythonOracleRelativeDifference).toBe(0);
  });
  it("publishes a three-band summary without response matrices or measurement authority", () => {
    const artifact = parseKerrInstrumentSpectralAdmissionArtifactV425(read("dist/science/kerr-instrument-spectral-admission-v425/spectral-admission.json"));
    expect(canonicalShaV425(artifact)).toBe(artifact.artifactSha256);
    const summary = createKerrInstrumentSpectralAdmissionSummaryV425(artifact);
    expect(summary.bandSummaries).toHaveLength(3);
    expect(summary).not.toHaveProperty("rows");
    expect(summary.authorityBoundary).toMatchObject({ spectralApplicabilityAuditQualified: true, nonidealInstrumentResponseAuthorityGranted: false, measurementAuthorityGranted: false, detectorAuthorityGranted: false });
    expect(serializeKerrInstrumentSpectralAdmissionCsvV425(artifact.view)).toContain("response_eligible,extrapolation_allowed,v413_response_matrix_applied");
  });
});
