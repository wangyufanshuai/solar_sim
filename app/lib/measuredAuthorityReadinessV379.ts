import type { MeasurementAuthorityInputIdV378 } from "./measurementAuthorityTopologyV378";

export const MEASURED_AUTHORITY_READINESS_VERSION_V379 =
  "v379-measured-authority-readiness-matrix-v1" as const;
export const MEASURED_AUTHORITY_MISSING_IDS_V379 = [
  "v367-detector-admission",
  "v367-detector-authority-pointer",
  "v361-detector-manifest",
  "v373-geometry-admission",
  "v373-geometry-authority-pointer",
  "v374-geometry-publication-receipt",
  "v369-runtime-observation-geometry",
] as const satisfies readonly MeasurementAuthorityInputIdV378[];

export type MeasuredAuthorityMissingIdV379 =
  (typeof MEASURED_AUTHORITY_MISSING_IDS_V379)[number];

export type MeasuredAuthorityReadinessEntryV379 = Readonly<{
  id: MeasuredAuthorityMissingIdV379;
  label: string;
  lane: "detector" | "geometry";
  path: string;
  maximumBytes: number;
  present: false;
  schemaSource: string;
  schemaSymbol: string;
  schemaSourceFileSha256: string;
  boundedConsumerSource: "scripts/build-measured-expectation-v375.ts";
  boundedConsumerSourceFileSha256: string;
  producerCommand: string;
  validatorCommands: readonly string[];
  schemaContractQualified: true;
  boundedReadQualified: true;
  fileSha256Required: true;
  canonicalSha256Required: true;
  instrumentIdentityRequired: true;
  independentValidationRequired: true;
  automaticRetryAllowed: false;
  automaticPromotionAllowed: false;
  readiness: "contract-qualified-input-missing";
  failurePropagation: readonly [
    "v375-envelope-withheld",
    "v376-image-withheld",
    "observed-counts-unavailable",
  ];
}>;

export type MeasuredAuthorityReadinessMatrixV379 = Readonly<{
  version: typeof MEASURED_AUTHORITY_READINESS_VERSION_V379;
  generatedAt: string;
  status: "readiness-matrix-qualified-contracts-7-of-7-inputs-0-of-7";
  expectedMissingInputCount: 7;
  presentInputCount: 0;
  missingInputCount: 7;
  schemaContractQualifiedCount: 7;
  boundedReadQualifiedCount: 7;
  photonAuthorityQualified: true;
  entries: readonly MeasuredAuthorityReadinessEntryV379[];
  downstream: Readonly<{
    v375EnvelopeAvailable: false;
    v376ScienceImageAvailable: false;
    observedCountsAvailable: false;
    zeroImageFallbackAllowed: false;
    syntheticFallbackAllowed: false;
  }>;
  attemptConsumed: false;
  networkAttempted: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;

export function parseMeasuredAuthorityReadinessMatrixV379(
  value: unknown,
): MeasuredAuthorityReadinessMatrixV379 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<MeasuredAuthorityReadinessMatrixV379>)
      : null;
  const entries = source?.entries ?? [];
  if (
    !source ||
    source.version !== MEASURED_AUTHORITY_READINESS_VERSION_V379 ||
    source.status !== "readiness-matrix-qualified-contracts-7-of-7-inputs-0-of-7" ||
    source.expectedMissingInputCount !== 7 ||
    source.presentInputCount !== 0 ||
    source.missingInputCount !== 7 ||
    source.schemaContractQualifiedCount !== 7 ||
    source.boundedReadQualifiedCount !== 7 ||
    source.photonAuthorityQualified !== true ||
    entries.length !== 7 ||
    JSON.stringify(entries.map((entry) => entry.id)) !==
      JSON.stringify(MEASURED_AUTHORITY_MISSING_IDS_V379) ||
    new Set(entries.map((entry) => entry.id)).size !== 7 ||
    entries.some(
      (entry) =>
        entry.present !== false ||
        !(entry.maximumBytes > 0) ||
        !entry.path.startsWith("dist/") ||
        !entry.schemaSource.startsWith("app/lib/") ||
        !entry.schemaSymbol ||
        !SHA256.test(entry.schemaSourceFileSha256) ||
        entry.boundedConsumerSource !==
          "scripts/build-measured-expectation-v375.ts" ||
        !SHA256.test(entry.boundedConsumerSourceFileSha256) ||
        !entry.producerCommand ||
        entry.validatorCommands.length < 1 ||
        entry.schemaContractQualified !== true ||
        entry.boundedReadQualified !== true ||
        entry.fileSha256Required !== true ||
        entry.canonicalSha256Required !== true ||
        entry.instrumentIdentityRequired !== true ||
        entry.independentValidationRequired !== true ||
        entry.automaticRetryAllowed !== false ||
        entry.automaticPromotionAllowed !== false ||
        entry.readiness !== "contract-qualified-input-missing" ||
        entry.failurePropagation.join("|") !==
          "v375-envelope-withheld|v376-image-withheld|observed-counts-unavailable",
    ) ||
    source.downstream?.v375EnvelopeAvailable !== false ||
    source.downstream.v376ScienceImageAvailable !== false ||
    source.downstream.observedCountsAvailable !== false ||
    source.downstream.zeroImageFallbackAllowed !== false ||
    source.downstream.syntheticFallbackAllowed !== false ||
    source.attemptConsumed !== false ||
    source.networkAttempted !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v379-measured-authority-readiness-identity");
  }
  return value as MeasuredAuthorityReadinessMatrixV379;
}
