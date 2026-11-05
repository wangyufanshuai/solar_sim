import { describe, expect, it } from "vitest";
import {
  auditSvoVisibleProfileV382,
  MEASURED_VISIBLE_SOURCE_PLAN_V382,
  parseMeasuredVisibleSourceDossierV382,
} from "./measuredVisibleSourceDossierV382";

const SHA = "a".repeat(64);
const xml = `<?xml version="1.0"?><VOTABLE><RESOURCE><PARAM name="filterID" value="HST/WFC3_UVIS1.F350LP"/><PARAM name="Facility" value="HST"/><PARAM name="Instrument" value="WFC3"/><PARAM name="WavelengthUnit" value="Angstrom"/><PARAM name="Comments" value="filter throughputs determined in the lab in combination with the measured QE of the flight detectors and WFC3's optics WFC3-ISR-2020-10.pdf WFC3_ISR_2021-04.pdf"/><TABLE><DATA><TABLEDATA>${Array.from({ length: 1001 }, (_, index) => `<TR><TD>${3500 + index * 4}</TD><TD>${index === 0 ? 0 : 0.5}</TD></TR>`).join("")}</TABLEDATA></DATA></TABLE></RESOURCE></VOTABLE>`;

describe("v382 visible measured source dossier", () => {
  it("locks seven unique HTTPS sources with two primary calibration reports", () => {
    expect(MEASURED_VISIBLE_SOURCE_PLAN_V382).toHaveLength(7);
    expect(new Set(MEASURED_VISIBLE_SOURCE_PLAN_V382.map((entry) => entry.url)).size).toBe(7);
    expect(MEASURED_VISIBLE_SOURCE_PLAN_V382.filter((entry) => entry.sourceRole === "primary-photometric-calibration-report")).toHaveLength(2);
    expect(MEASURED_VISIBLE_SOURCE_PLAN_V382.every((entry) => entry.url.startsWith("https://"))).toBe(true);
  });

  it("requires measured-QE, laboratory-throughput and visible coverage statements", () => {
    const audit = auditSvoVisibleProfileV382(xml);
    expect(audit.visibleCoverage400To700Nm).toBe(true);
    expect(audit.measuredQeStatementPresent).toBe(true);
    expect(audit.laboratoryFilterThroughputStatementPresent).toBe(true);
    expect(audit.rowCount).toBe(1001);
    expect(audit.calibrationReport2021Present).toBe(true);
  });

  it("keeps a source dossier outside measured authority and runtime packaging", () => {
    const records = MEASURED_VISIBLE_SOURCE_PLAN_V382.map((entry) => ({
      id: entry.id,
      path: `dist/staging/measured-authority-v382-visible/raw/${entry.fileName}`,
      sourceUrl: entry.url,
      sourceRole: entry.sourceRole,
      evidenceGrade: entry.evidenceGrade,
      contentType: "application/octet-stream",
      bytes: 1,
      sha256: SHA,
      fetchedAt: "2026-07-29T00:00:00.000Z",
      validated: true as const,
    }));
    const dossier = {
      version: "v382-visible-measured-source-dossier-v1",
      generatedAt: "2026-07-29T00:00:00.000Z",
      status: "source-dossier-qualified-visible-normalization-pending-authority-not-granted",
      candidate: { bandId: "visible", facility: "HST", instrument: "WFC3/UVIS1", spectralElement: "F350LP", identityScope: "one-visible-detector-response-plus-matching-wfc3-uvis1-geometry" },
      sources: records,
      sourceCount: 7,
      profile: auditSvoVisibleProfileV382(xml),
      sourceQuality: { primaryCalibrationReportCount: 2, officialHandbookSourceCount: 3, curatedSecondaryProfileCount: 1, governingTermsSourceCount: 1, institutionalConflictDisclosed: "stsci-documents-and-calibrates-the-instrument-it-operates-for-nasa", sourceExistenceVerified: true },
      licenseBoundary: { termsSourcePresent: true, stagingOnly: true, redistributionQualified: false, runtimePackagingAllowed: false, reason: "source-specific-redistribution-and-attribution-review-required-before-publication" },
      missingForMeasuredAuthority: ["normalized-per-band-throughput-with-independent-reconstruction", "traceable-repeat-detector-noise-measurements", "traceable-repeat-collecting-area-and-plate-scale-measurements", "qualified-same-instrument-detector-and-geometry-authority-pointers"],
      nextCommand: "npm run atlas -- relativity measurement-authority-v383-normalize-visible",
      authorityGranted: false,
      measuredBandAuthorityCount: 0,
      observedCountsAvailable: false,
      syntheticFallbackUsed: false,
      sciencePayloadMutationAllowed: false,
      cinematicConsumerAllowed: false,
      attemptConsumed: true,
      networkAttempted: true,
      automaticRetryApplied: false,
      formalProductPointer: "v263",
      denseCampaignStatus: "incomplete-0-of-49",
      browserQualification: "not-run",
      artifactSha256: SHA,
    } as const;
    expect(parseMeasuredVisibleSourceDossierV382(dossier)).toBe(dossier);
  });
});
