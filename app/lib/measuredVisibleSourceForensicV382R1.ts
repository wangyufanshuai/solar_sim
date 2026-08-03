import type { SvoVisibleProfileAuditV382 } from "./measuredVisibleSourceDossierV382";

export const MEASURED_VISIBLE_SOURCE_FORENSIC_VERSION_V382R1 =
  "v382r1-visible-source-offline-forensic-v1" as const;

export type MeasuredVisibleSourceForensicV382R1 = Readonly<{
  version: typeof MEASURED_VISIBLE_SOURCE_FORENSIC_VERSION_V382R1;
  generatedAt: string;
  status:
    "parser-corrected-offline-source-qualified-1-of-7-attempt-1-failed-no-retry";
  attempt1: Readonly<{
    status: "attempt-1-failed-no-automatic-retry";
    reason: "v382-votable-provenance";
    attemptConsumed: true;
    networkAttempted: true;
    automaticRetryApplied: false;
    historicalNegativeEvidencePreserved: true;
  }>;
  correction: Readonly<{
    cause:
      "xml-double-quoted-attribute-contained-apostrophe-and-legacy-parser-stopped-early";
    parserSourceSha256: string;
    parserRegressionTestAdded: true;
    sourceRevalidatedOffline: true;
    networkAttemptedDuringCorrection: false;
  }>;
  recoveredSource: Readonly<{
    id: "svo-f350lp-profile";
    path:
      "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml";
    bytes: number;
    sha256: string;
    profile: SvoVisibleProfileAuditV382;
    validated: true;
  }>;
  progress: Readonly<{
    qualifiedSourceCount: 1;
    plannedSourceCount: 7;
    remainingSourceCount: 6;
    sourceDossierAvailable: false;
    visibleMeasuredAuthorityAvailable: false;
    resumeRequiresExplicitAuthorization: true;
  }>;
  authorityGranted: false;
  measuredBandAuthorityCount: 0;
  observedCountsAvailable: false;
  runtimePackagingAllowed: false;
  syntheticFallbackUsed: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;

export function parseMeasuredVisibleSourceForensicV382R1(
  value: unknown,
): MeasuredVisibleSourceForensicV382R1 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<MeasuredVisibleSourceForensicV382R1>)
    : null;
  if (
    !source ||
    source.version !== MEASURED_VISIBLE_SOURCE_FORENSIC_VERSION_V382R1 ||
    source.status !==
      "parser-corrected-offline-source-qualified-1-of-7-attempt-1-failed-no-retry" ||
    source.attempt1?.status !== "attempt-1-failed-no-automatic-retry" ||
    source.attempt1.reason !== "v382-votable-provenance" ||
    source.attempt1.attemptConsumed !== true ||
    source.attempt1.networkAttempted !== true ||
    source.attempt1.automaticRetryApplied !== false ||
    source.attempt1.historicalNegativeEvidencePreserved !== true ||
    source.correction?.cause !==
      "xml-double-quoted-attribute-contained-apostrophe-and-legacy-parser-stopped-early" ||
    !SHA256.test(source.correction.parserSourceSha256 ?? "") ||
    source.correction.parserRegressionTestAdded !== true ||
    source.correction.sourceRevalidatedOffline !== true ||
    source.correction.networkAttemptedDuringCorrection !== false ||
    source.recoveredSource?.id !== "svo-f350lp-profile" ||
    source.recoveredSource.path !==
      "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml" ||
    !(source.recoveredSource.bytes > 0) ||
    !SHA256.test(source.recoveredSource.sha256 ?? "") ||
    source.recoveredSource.validated !== true ||
    source.recoveredSource.profile.filterId !== "HST/WFC3_UVIS1.F350LP" ||
    source.recoveredSource.profile.visibleCoverage400To700Nm !== true ||
    source.recoveredSource.profile.measuredQeStatementPresent !== true ||
    source.progress?.qualifiedSourceCount !== 1 ||
    source.progress.plannedSourceCount !== 7 ||
    source.progress.remainingSourceCount !== 6 ||
    source.progress.sourceDossierAvailable !== false ||
    source.progress.visibleMeasuredAuthorityAvailable !== false ||
    source.progress.resumeRequiresExplicitAuthorization !== true ||
    source.authorityGranted !== false ||
    source.measuredBandAuthorityCount !== 0 ||
    source.observedCountsAvailable !== false ||
    source.runtimePackagingAllowed !== false ||
    source.syntheticFallbackUsed !== false ||
    source.sciencePayloadMutationAllowed !== false ||
    source.cinematicConsumerAllowed !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v382r1-source-forensic-identity");
  }
  return value as MeasuredVisibleSourceForensicV382R1;
}
