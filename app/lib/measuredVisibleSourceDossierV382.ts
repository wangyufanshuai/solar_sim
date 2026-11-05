export const MEASURED_VISIBLE_SOURCE_DOSSIER_VERSION_V382 =
  "v382-visible-measured-source-dossier-v1" as const;

export const MEASURED_VISIBLE_SOURCE_PLAN_V382 = Object.freeze([
  Object.freeze({
    id: "svo-f350lp-profile",
    fileName: "svo-hst-wfc3-uvis1-f350lp.xml",
    url: "https://svo2.cab.inta-csic.es/theory/fps/fps.php?ID=HST/WFC3_UVIS1.F350LP",
    expectedContentKind: "votable" as const,
    sourceRole: "derived-throughput-reference" as const,
    evidenceGrade: "B-curated-secondary-calibration-service" as const,
  }),
  Object.freeze({
    id: "wfc3-isr-2020-10",
    fileName: "WFC3-ISR-2020-10.pdf",
    url: "https://www.stsci.edu/files/live/sites/www/files/home/hst/instrumentation/wfc3/documentation/instrument-science-reports-isrs/_documents/2020/WFC3-ISR-2020-10.pdf",
    expectedContentKind: "pdf" as const,
    sourceRole: "primary-photometric-calibration-report" as const,
    evidenceGrade: "A-primary-instrument-calibration-report" as const,
  }),
  Object.freeze({
    id: "wfc3-isr-2021-04",
    fileName: "WFC3-ISR-2021-04.pdf",
    url: "https://www.stsci.edu/files/live/sites/www/files/home/hst/instrumentation/wfc3/documentation/instrument-science-reports-isrs/_documents/2021/WFC3_ISR_2021-04.pdf",
    expectedContentKind: "pdf" as const,
    sourceRole: "primary-photometric-calibration-report" as const,
    evidenceGrade: "A-primary-instrument-calibration-report" as const,
  }),
  Object.freeze({
    id: "wfc3-uvis-geometry",
    fileName: "wfc3-uvis-field-of-view-and-distortion.html",
    url: "https://hst-docs.stsci.edu/wfc3ihb/chapter-2-wfc3-instrument-description/2-2-field-of-view-and-geometric-distortions",
    expectedContentKind: "html" as const,
    sourceRole: "authoritative-geometry-handbook" as const,
    evidenceGrade: "A-official-instrument-handbook" as const,
  }),
  Object.freeze({
    id: "wfc3-uvis-detector-performance",
    fileName: "wfc3-uvis-detector-performance.html",
    url: "https://hst-docs.stsci.edu/wfc3ihb/chapter-5-wfc3-detector-characteristics-and-performance/5-4-wfc3-ccd-characteristics-and-performance",
    expectedContentKind: "html" as const,
    sourceRole: "authoritative-detector-performance-handbook" as const,
    evidenceGrade: "A-official-instrument-handbook" as const,
  }),
  Object.freeze({
    id: "wfc3-uvis-spectral-elements",
    fileName: "wfc3-uvis-spectral-elements.html",
    url: "https://hst-docs.stsci.edu/wfc3ihb/chapter-6-uvis-imaging-with-wfc3/6-5-uvis-spectral-elements",
    expectedContentKind: "html" as const,
    sourceRole: "authoritative-filter-handbook" as const,
    evidenceGrade: "A-official-instrument-handbook" as const,
  }),
  Object.freeze({
    id: "stsci-copyright",
    fileName: "stsci-copyright.html",
    url: "https://www.stsci.edu/copyright",
    expectedContentKind: "html" as const,
    sourceRole: "governing-use-terms" as const,
    evidenceGrade: "A-primary-governing-terms" as const,
  }),
] as const);

export type MeasuredVisibleSourcePlanEntryV382 =
  (typeof MEASURED_VISIBLE_SOURCE_PLAN_V382)[number];

export type SvoVisibleProfileAuditV382 = Readonly<{
  filterId: "HST/WFC3_UVIS1.F350LP";
  facility: "HST";
  instrument: "WFC3";
  wavelengthUnit: "Angstrom";
  rowCount: number;
  wavelengthMinimumAngstrom: number;
  wavelengthMaximumAngstrom: number;
  positiveTransmissionMinimumAngstrom: number;
  positiveTransmissionMaximumAngstrom: number;
  visibleCoverage400To700Nm: true;
  measuredQeStatementPresent: true;
  laboratoryFilterThroughputStatementPresent: true;
  calibrationReport2020Present: true;
  calibrationReport2021Present: true;
}>;

export type MeasuredVisibleSourceRecordV382 = Readonly<{
  id: MeasuredVisibleSourcePlanEntryV382["id"];
  path: string;
  sourceUrl: string;
  sourceRole: MeasuredVisibleSourcePlanEntryV382["sourceRole"];
  evidenceGrade: MeasuredVisibleSourcePlanEntryV382["evidenceGrade"];
  contentType: string;
  bytes: number;
  sha256: string;
  fetchedAt: string;
  validated: true;
}>;

export type MeasuredVisibleSourceDossierV382 = Readonly<{
  version: typeof MEASURED_VISIBLE_SOURCE_DOSSIER_VERSION_V382;
  generatedAt: string;
  status:
    "source-dossier-qualified-visible-normalization-pending-authority-not-granted";
  candidate: Readonly<{
    bandId: "visible";
    facility: "HST";
    instrument: "WFC3/UVIS1";
    spectralElement: "F350LP";
    identityScope:
      "one-visible-detector-response-plus-matching-wfc3-uvis1-geometry";
  }>;
  sources: readonly MeasuredVisibleSourceRecordV382[];
  sourceCount: 7;
  profile: SvoVisibleProfileAuditV382;
  sourceQuality: Readonly<{
    primaryCalibrationReportCount: 2;
    officialHandbookSourceCount: 3;
    curatedSecondaryProfileCount: 1;
    governingTermsSourceCount: 1;
    institutionalConflictDisclosed:
      "stsci-documents-and-calibrates-the-instrument-it-operates-for-nasa";
    sourceExistenceVerified: true;
  }>;
  licenseBoundary: Readonly<{
    termsSourcePresent: true;
    stagingOnly: true;
    redistributionQualified: false;
    runtimePackagingAllowed: false;
    reason:
      "source-specific-redistribution-and-attribution-review-required-before-publication";
  }>;
  missingForMeasuredAuthority: readonly [
    "normalized-per-band-throughput-with-independent-reconstruction",
    "traceable-repeat-detector-noise-measurements",
    "traceable-repeat-collecting-area-and-plate-scale-measurements",
    "qualified-same-instrument-detector-and-geometry-authority-pointers",
  ];
  nextCommand:
    "npm run atlas -- relativity measurement-authority-v383-normalize-visible";
  authorityGranted: false;
  measuredBandAuthorityCount: 0;
  observedCountsAvailable: false;
  syntheticFallbackUsed: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  attemptConsumed: true;
  networkAttempted: true;
  automaticRetryApplied: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;

function param(xml: string, name: string): string | null {
  const match = xml.match(
    new RegExp(
      `<PARAM\\s+name=["']${name}["'][^>]*\\svalue=(["'])([\\s\\S]*?)\\1`,
      "i",
    ),
  );
  return match?.[2] ?? null;
}

export function auditSvoVisibleProfileV382(xml: string): SvoVisibleProfileAuditV382 {
  if (Buffer.byteLength(xml, "utf8") <= 0 || Buffer.byteLength(xml, "utf8") > 4 * 1024 * 1024 || !/<VOTABLE[\s>]/i.test(xml)) {
    throw new Error("v382-votable-boundary");
  }
  const rows = [...xml.matchAll(/<TR>\s*<TD>([^<]+)<\/TD>\s*<TD>([^<]+)<\/TD>\s*<\/TR>/gi)].map((match) => ({
    wavelengthAngstrom: Number(match[1]),
    transmission: Number(match[2]),
  }));
  if (rows.length < 1000 || rows.some((row) => !Number.isFinite(row.wavelengthAngstrom) || !Number.isFinite(row.transmission) || row.wavelengthAngstrom <= 0 || row.transmission < 0 || row.transmission > 1)) {
    throw new Error("v382-votable-rows");
  }
  const positive = rows.filter((row) => row.transmission > 0);
  const wavelengthMinimumAngstrom = Math.min(...rows.map((row) => row.wavelengthAngstrom));
  const wavelengthMaximumAngstrom = Math.max(...rows.map((row) => row.wavelengthAngstrom));
  const positiveTransmissionMinimumAngstrom = Math.min(...positive.map((row) => row.wavelengthAngstrom));
  const positiveTransmissionMaximumAngstrom = Math.max(...positive.map((row) => row.wavelengthAngstrom));
  const comments = param(xml, "Comments") ?? "";
  const audit = {
    filterId: param(xml, "filterID"),
    facility: param(xml, "Facility"),
    instrument: param(xml, "Instrument"),
    wavelengthUnit: param(xml, "WavelengthUnit"),
    rowCount: rows.length,
    wavelengthMinimumAngstrom,
    wavelengthMaximumAngstrom,
    positiveTransmissionMinimumAngstrom,
    positiveTransmissionMaximumAngstrom,
    visibleCoverage400To700Nm:
      positiveTransmissionMinimumAngstrom <= 4000 &&
      positiveTransmissionMaximumAngstrom >= 7000,
    measuredQeStatementPresent: /measured QE of the flight detectors/i.test(comments),
    laboratoryFilterThroughputStatementPresent: /filter throughputs determined in the lab/i.test(comments),
    calibrationReport2020Present: /WFC3-ISR-2020-10\.pdf/i.test(comments),
    calibrationReport2021Present: /WFC3_ISR_2021-04\.pdf/i.test(comments),
  };
  if (
    audit.filterId !== "HST/WFC3_UVIS1.F350LP" ||
    audit.facility !== "HST" ||
    audit.instrument !== "WFC3" ||
    audit.wavelengthUnit !== "Angstrom" ||
    !audit.visibleCoverage400To700Nm ||
    !audit.measuredQeStatementPresent ||
    !audit.laboratoryFilterThroughputStatementPresent ||
    !audit.calibrationReport2020Present ||
    !audit.calibrationReport2021Present
  ) {
    throw new Error("v382-votable-provenance");
  }
  return Object.freeze(audit as SvoVisibleProfileAuditV382);
}

export function parseMeasuredVisibleSourceDossierV382(
  value: unknown,
): MeasuredVisibleSourceDossierV382 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<MeasuredVisibleSourceDossierV382>)
    : null;
  const records = source?.sources ?? [];
  if (
    !source ||
    source.version !== MEASURED_VISIBLE_SOURCE_DOSSIER_VERSION_V382 ||
    source.status !==
      "source-dossier-qualified-visible-normalization-pending-authority-not-granted" ||
    source.candidate?.bandId !== "visible" ||
    source.candidate.facility !== "HST" ||
    source.candidate.instrument !== "WFC3/UVIS1" ||
    source.candidate.spectralElement !== "F350LP" ||
    source.sourceCount !== 7 ||
    records.length !== 7 ||
    new Set(records.map((record) => record.id)).size !== 7 ||
    records.some((record) => record.bytes <= 0 || !SHA256.test(record.sha256) || record.validated !== true || !record.sourceUrl.startsWith("https://") || !record.path.startsWith("dist/staging/measured-authority-v382-visible/raw/") || /^[A-Za-z]:\\/.test(record.path)) ||
    source.profile?.filterId !== "HST/WFC3_UVIS1.F350LP" ||
    source.profile.visibleCoverage400To700Nm !== true ||
    source.profile.measuredQeStatementPresent !== true ||
    source.profile.laboratoryFilterThroughputStatementPresent !== true ||
    source.sourceQuality?.primaryCalibrationReportCount !== 2 ||
    source.sourceQuality.officialHandbookSourceCount !== 3 ||
    source.sourceQuality.curatedSecondaryProfileCount !== 1 ||
    source.sourceQuality.governingTermsSourceCount !== 1 ||
    source.sourceQuality.sourceExistenceVerified !== true ||
    source.licenseBoundary?.termsSourcePresent !== true ||
    source.licenseBoundary.stagingOnly !== true ||
    source.licenseBoundary.redistributionQualified !== false ||
    source.licenseBoundary.runtimePackagingAllowed !== false ||
    source.missingForMeasuredAuthority?.length !== 4 ||
    source.authorityGranted !== false ||
    source.measuredBandAuthorityCount !== 0 ||
    source.observedCountsAvailable !== false ||
    source.syntheticFallbackUsed !== false ||
    source.sciencePayloadMutationAllowed !== false ||
    source.cinematicConsumerAllowed !== false ||
    source.attemptConsumed !== true ||
    source.networkAttempted !== true ||
    source.automaticRetryApplied !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v382-source-dossier-identity");
  }
  return value as MeasuredVisibleSourceDossierV382;
}
