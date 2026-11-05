import {
  KERR_THIN_DISK_FIXED_BANDS_V320,
  type KerrThinDiskBandIdV320,
} from "./kerrThinDiskBandImagingV320";
import {
  MEASURED_AUTHORITY_BAND_IDS_V381,
  type MeasuredAuthorityBandIdV381,
} from "./measuredAuthorityBandIdentityV381";

export const MEASURED_AUTHORITY_IDENTITY_AUDIT_VERSION_V381 =
  "v381-measured-authority-identity-audit-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const SPEED_OF_LIGHT_M_S = 299_792_458;

export type MeasuredAuthorityIdentityLaneV381 = Readonly<{
  bandId: MeasuredAuthorityBandIdV381;
  label: "Visible" | "EUV" | "Soft X-ray";
  lowerFrequencyHz: number;
  upperFrequencyHz: number;
  lowerWavelengthM: number;
  upperWavelengthM: number;
  detectorAuthorityScope: "one-measured-detector-response-for-this-band";
  geometryAuthorityScope: "matching-instrument-geometry-for-this-band";
  sameBandInstrumentIdentityRequired: true;
  crossBandInstrumentIdentityRequired: false;
  status: "measured-authority-input-missing";
  detectorAuthorityPresent: false;
  geometryAuthorityPresent: false;
}>;

export type MeasuredAuthorityIdentityAuditV381 = Readonly<{
  version: typeof MEASURED_AUTHORITY_IDENTITY_AUDIT_VERSION_V381;
  generatedAt: string;
  status:
    "identity-model-corrected-three-band-lanes-ready-inputs-0-of-3";
  legacyModel: Readonly<{
    readinessArtifactSha256: string;
    readinessStructuralContractsQualified: "7/7";
    measuredInputsPresent: "0/7";
    singleManifestBandCount: 3;
    singleGeometryIdentityCount: 1;
    scientificFusionEligibility:
      "withdrawn-single-instrument-three-band-identity-not-demonstrated";
    historicalArtifactsMutated: false;
  }>;
  correctedModel: Readonly<{
    authorityUnit: "detector-response-plus-geometry-per-band";
    bandLaneCount: 3;
    qualifiedBandLaneCount: 0;
    sameBandInstrumentIdentityRequired: true;
    crossBandInstrumentIdentityRequired: false;
    allBandsRequiredForThreeBandImage: true;
    partialBandScienceAllowed: false;
    observedCountsAvailable: false;
  }>;
  lanes: readonly MeasuredAuthorityIdentityLaneV381[];
  sourceSha256: Readonly<{
    v320BandDefinitions: string;
    v361DetectorManifestContract: string;
    v369MeasuredExpectationOperator: string;
    v375DualAuthorityContract: string;
  }>;
  findings: readonly [
    "v361-binds-visible-euv-soft-x-ray-to-one-instrument-manifest",
    "v369-v375-bind-all-three-bands-to-one-observation-geometry-identity",
    "real-authority-requires-per-band-detector-and-matching-geometry",
  ];
  nextRequiredInput:
    "one-traceable-measured-detector-and-geometry-pair-for-one-band";
  authorityPromotionAllowed: false;
  syntheticFallbackUsed: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  attemptConsumed: false;
  networkAttempted: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const LABELS: Readonly<Record<MeasuredAuthorityBandIdV381, MeasuredAuthorityIdentityLaneV381["label"]>> =
  Object.freeze({ visible: "Visible", euv: "EUV", "soft-x-ray": "Soft X-ray" });

export function createMeasuredAuthorityIdentityLanesV381(): readonly MeasuredAuthorityIdentityLaneV381[] {
  if (
    KERR_THIN_DISK_FIXED_BANDS_V320.length !== 3 ||
    MEASURED_AUTHORITY_BAND_IDS_V381.some(
      (bandId) =>
        !KERR_THIN_DISK_FIXED_BANDS_V320.some((band) => band.id === bandId),
    )
  ) {
    throw new Error("v381-source-band-identity");
  }
  return Object.freeze(
    MEASURED_AUTHORITY_BAND_IDS_V381.map((bandId) => {
      const band = KERR_THIN_DISK_FIXED_BANDS_V320.find(
        (entry) => entry.id === (bandId as KerrThinDiskBandIdV320),
      )!;
      return Object.freeze({
        bandId,
        label: LABELS[bandId],
        lowerFrequencyHz: band.lowerFrequencyHz,
        upperFrequencyHz: band.upperFrequencyHz,
        lowerWavelengthM: SPEED_OF_LIGHT_M_S / band.upperFrequencyHz,
        upperWavelengthM: SPEED_OF_LIGHT_M_S / band.lowerFrequencyHz,
        detectorAuthorityScope:
          "one-measured-detector-response-for-this-band" as const,
        geometryAuthorityScope:
          "matching-instrument-geometry-for-this-band" as const,
        sameBandInstrumentIdentityRequired: true as const,
        crossBandInstrumentIdentityRequired: false as const,
        status: "measured-authority-input-missing" as const,
        detectorAuthorityPresent: false as const,
        geometryAuthorityPresent: false as const,
      });
    }),
  );
}

export function parseMeasuredAuthorityIdentityAuditV381(
  value: unknown,
): MeasuredAuthorityIdentityAuditV381 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<MeasuredAuthorityIdentityAuditV381>)
    : null;
  const lanes = source?.lanes ?? [];
  if (
    !source ||
    source.version !== MEASURED_AUTHORITY_IDENTITY_AUDIT_VERSION_V381 ||
    source.status !==
      "identity-model-corrected-three-band-lanes-ready-inputs-0-of-3" ||
    source.legacyModel?.readinessStructuralContractsQualified !== "7/7" ||
    source.legacyModel.measuredInputsPresent !== "0/7" ||
    source.legacyModel.singleManifestBandCount !== 3 ||
    source.legacyModel.singleGeometryIdentityCount !== 1 ||
    source.legacyModel.scientificFusionEligibility !==
      "withdrawn-single-instrument-three-band-identity-not-demonstrated" ||
    source.legacyModel.historicalArtifactsMutated !== false ||
    source.correctedModel?.authorityUnit !==
      "detector-response-plus-geometry-per-band" ||
    source.correctedModel.bandLaneCount !== 3 ||
    source.correctedModel.qualifiedBandLaneCount !== 0 ||
    source.correctedModel.sameBandInstrumentIdentityRequired !== true ||
    source.correctedModel.crossBandInstrumentIdentityRequired !== false ||
    source.correctedModel.allBandsRequiredForThreeBandImage !== true ||
    source.correctedModel.partialBandScienceAllowed !== false ||
    source.correctedModel.observedCountsAvailable !== false ||
    lanes.length !== 3 ||
    MEASURED_AUTHORITY_BAND_IDS_V381.some(
      (bandId) => !lanes.some((lane) => lane.bandId === bandId),
    ) ||
    lanes.some(
      (lane) =>
        lane.status !== "measured-authority-input-missing" ||
        lane.detectorAuthorityPresent !== false ||
        lane.geometryAuthorityPresent !== false ||
        lane.sameBandInstrumentIdentityRequired !== true ||
        lane.crossBandInstrumentIdentityRequired !== false ||
        !(lane.lowerFrequencyHz > 0) ||
        !(lane.upperFrequencyHz > lane.lowerFrequencyHz) ||
        !(lane.lowerWavelengthM > 0) ||
        !(lane.upperWavelengthM > lane.lowerWavelengthM),
    ) ||
    !source.sourceSha256 ||
    !Object.values(source.sourceSha256).every((entry) => SHA256.test(entry)) ||
    !SHA256.test(source.legacyModel.readinessArtifactSha256) ||
    source.nextRequiredInput !==
      "one-traceable-measured-detector-and-geometry-pair-for-one-band" ||
    source.authorityPromotionAllowed !== false ||
    source.syntheticFallbackUsed !== false ||
    source.sciencePayloadMutationAllowed !== false ||
    source.cinematicConsumerAllowed !== false ||
    source.attemptConsumed !== false ||
    source.networkAttempted !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v381-identity-audit");
  }
  return value as MeasuredAuthorityIdentityAuditV381;
}
