import type { KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";

export const MEASURED_AUTHORITY_BAND_IDENTITY_VERSION_V381 =
  "v381-measured-authority-per-band-identity-v1" as const;

export const MEASURED_AUTHORITY_BAND_IDS_V381 = [
  "visible",
  "euv",
  "soft-x-ray",
] as const satisfies readonly KerrThinDiskBandIdV320[];

const SHA256 = /^[a-f0-9]{64}$/;

export type MeasuredAuthorityBandIdV381 =
  (typeof MEASURED_AUTHORITY_BAND_IDS_V381)[number];

export type MeasuredAuthorityBandEndpointV381 = Readonly<{
  instrumentSerialOrCampaignId: string;
  authorityPointerSha256: string;
  artifactCanonicalSha256: string;
  qualified: boolean;
}>;

export type MeasuredAuthorityDetectorEndpointV381 =
  MeasuredAuthorityBandEndpointV381 &
    Readonly<{
      lowerFrequencyHz: number;
      upperFrequencyHz: number;
    }>;

export type MeasuredAuthorityBandInputV381 = Readonly<{
  bandId: MeasuredAuthorityBandIdV381;
  requiredLowerFrequencyHz: number;
  requiredUpperFrequencyHz: number;
  detector: MeasuredAuthorityDetectorEndpointV381;
  geometry: MeasuredAuthorityBandEndpointV381;
}>;

export type MeasuredAuthorityBandDecisionV381 = Readonly<{
  version: typeof MEASURED_AUTHORITY_BAND_IDENTITY_VERSION_V381;
  bandId: MeasuredAuthorityBandIdV381;
  status: "qualified-per-band-authority" | "blocked-per-band-authority";
  authorityQualified: boolean;
  reasons: readonly (
    | "detector-authority-not-qualified"
    | "geometry-authority-not-qualified"
    | "instrument-identity-mismatch"
    | "detector-band-coverage-incomplete"
  )[];
  detectorInstrumentSerialOrCampaignId: string;
  geometryInstrumentSerialOrCampaignId: string;
  sameBandInstrumentIdentityRequired: true;
  crossBandInstrumentIdentityRequired: false;
  syntheticFallbackUsed: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
}>;

export type MeasuredAuthorityBandSetDecisionV381 = Readonly<{
  version: "v381-measured-authority-per-band-set-v1";
  status:
    | "qualified-three-band-authority-set"
    | "blocked-three-band-authority-set";
  authorityQualified: boolean;
  decisions: readonly MeasuredAuthorityBandDecisionV381[];
  qualifiedBandCount: number;
  requiredBandCount: 3;
  uniqueInstrumentCount: number;
  crossBandInstrumentIdentityRequired: false;
  allBandsRequiredForThreeBandImage: true;
  partialBandScienceAllowed: false;
  syntheticFallbackUsed: false;
  observedCountsAvailable: false;
}>;

function assertEndpoint(
  endpoint: MeasuredAuthorityBandEndpointV381,
  label: string,
) {
  if (
    endpoint.instrumentSerialOrCampaignId.trim().length < 3 ||
    !SHA256.test(endpoint.authorityPointerSha256) ||
    !SHA256.test(endpoint.artifactCanonicalSha256)
  ) {
    throw new Error(`v381-endpoint:${label}`);
  }
}

export function evaluateMeasuredAuthorityBandV381(
  input: MeasuredAuthorityBandInputV381,
): MeasuredAuthorityBandDecisionV381 {
  if (!MEASURED_AUTHORITY_BAND_IDS_V381.includes(input.bandId)) {
    throw new Error("v381-band-id");
  }
  assertEndpoint(input.detector, "detector");
  assertEndpoint(input.geometry, "geometry");
  if (
    !Number.isFinite(input.requiredLowerFrequencyHz) ||
    !Number.isFinite(input.requiredUpperFrequencyHz) ||
    !Number.isFinite(input.detector.lowerFrequencyHz) ||
    !Number.isFinite(input.detector.upperFrequencyHz) ||
    !(input.requiredLowerFrequencyHz > 0) ||
    !(input.requiredUpperFrequencyHz > input.requiredLowerFrequencyHz) ||
    !(input.detector.lowerFrequencyHz > 0) ||
    !(input.detector.upperFrequencyHz > input.detector.lowerFrequencyHz)
  ) {
    throw new Error("v381-frequency-range");
  }

  const reasons: MeasuredAuthorityBandDecisionV381["reasons"][number][] = [];
  if (!input.detector.qualified) reasons.push("detector-authority-not-qualified");
  if (!input.geometry.qualified) reasons.push("geometry-authority-not-qualified");
  if (
    input.detector.instrumentSerialOrCampaignId !==
    input.geometry.instrumentSerialOrCampaignId
  ) {
    reasons.push("instrument-identity-mismatch");
  }
  if (
    input.detector.lowerFrequencyHz > input.requiredLowerFrequencyHz ||
    input.detector.upperFrequencyHz < input.requiredUpperFrequencyHz
  ) {
    reasons.push("detector-band-coverage-incomplete");
  }
  const uniqueReasons = Object.freeze([...new Set(reasons)]);
  const authorityQualified = uniqueReasons.length === 0;
  return Object.freeze({
    version: MEASURED_AUTHORITY_BAND_IDENTITY_VERSION_V381,
    bandId: input.bandId,
    status: authorityQualified
      ? "qualified-per-band-authority"
      : "blocked-per-band-authority",
    authorityQualified,
    reasons: uniqueReasons,
    detectorInstrumentSerialOrCampaignId:
      input.detector.instrumentSerialOrCampaignId,
    geometryInstrumentSerialOrCampaignId:
      input.geometry.instrumentSerialOrCampaignId,
    sameBandInstrumentIdentityRequired: true,
    crossBandInstrumentIdentityRequired: false,
    syntheticFallbackUsed: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  });
}

export function evaluateMeasuredAuthorityBandSetV381(
  inputs: readonly MeasuredAuthorityBandInputV381[],
): MeasuredAuthorityBandSetDecisionV381 {
  const ids = inputs.map((input) => input.bandId);
  if (
    inputs.length !== 3 ||
    new Set(ids).size !== 3 ||
    MEASURED_AUTHORITY_BAND_IDS_V381.some((bandId) => !ids.includes(bandId))
  ) {
    throw new Error("v381-band-set-coverage");
  }
  const decisions = Object.freeze(
    MEASURED_AUTHORITY_BAND_IDS_V381.map((bandId) =>
      evaluateMeasuredAuthorityBandV381(
        inputs.find((input) => input.bandId === bandId)!,
      ),
    ),
  );
  const qualifiedBandCount = decisions.filter(
    (decision) => decision.authorityQualified,
  ).length;
  const authorityQualified = qualifiedBandCount === 3;
  return Object.freeze({
    version: "v381-measured-authority-per-band-set-v1",
    status: authorityQualified
      ? "qualified-three-band-authority-set"
      : "blocked-three-band-authority-set",
    authorityQualified,
    decisions,
    qualifiedBandCount,
    requiredBandCount: 3,
    uniqueInstrumentCount: new Set(
      decisions.map((decision) => decision.detectorInstrumentSerialOrCampaignId),
    ).size,
    crossBandInstrumentIdentityRequired: false,
    allBandsRequiredForThreeBandImage: true,
    partialBandScienceAllowed: false,
    syntheticFallbackUsed: false,
    observedCountsAvailable: false,
  });
}
