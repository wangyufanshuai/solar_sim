import type { DetectorResponseAuthorityResultV368 } from "./detectorResponseAuthorityGateV368";

export const DETECTOR_RESPONSE_AUTHORITY_SNAPSHOT_VERSION_V368 = "v368-detector-response-authority-snapshot-v1" as const;
export type DetectorResponseAuthoritySnapshotV368 = Readonly<{
  version: typeof DETECTOR_RESPONSE_AUTHORITY_SNAPSHOT_VERSION_V368;
  status: "unavailable-v367-authority-artifacts-missing" | "unavailable-v367-authority-not-qualified" | "qualified-measured-response-adapter";
  reason: "authority-chain-artifacts-missing" | "authority-chain-artifact-missing" | "v367-authority-not-qualified" | "qualified";
  admissionArtifactPresent: boolean;
  authorityPointerPresent: boolean;
  manifestPresent: boolean;
  authorityGranted: boolean;
  measuredResponseAvailable: boolean;
  bandResponseCount: number;
  bandResponses: readonly DetectorResponseAuthorityResultV368[];
  admissionArtifactSha256: string | null;
  authorityPointerSha256: string | null;
  manifestFileSha256: string | null;
  manifestCanonicalSha256: string | null;
  instrumentSerialOrCampaignId: string | null;
  syntheticV332Status: "separate-qualified-fixture-never-measured-fallback";
  syntheticFallbackUsed: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "intent-only-read-only-authority-gate-no-synthetic-measured-fallback";
}>;

export function parseDetectorResponseAuthoritySnapshotV368(value: unknown): DetectorResponseAuthoritySnapshotV368 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<DetectorResponseAuthoritySnapshotV368> : null;
  if (!source
    || source.version !== DETECTOR_RESPONSE_AUTHORITY_SNAPSHOT_VERSION_V368
    || !["unavailable-v367-authority-artifacts-missing", "unavailable-v367-authority-not-qualified", "qualified-measured-response-adapter"].includes(source.status ?? "")
    || source.authorityGranted !== (source.status === "qualified-measured-response-adapter")
    || source.measuredResponseAvailable !== (source.status === "qualified-measured-response-adapter")
    || !Number.isInteger(source.bandResponseCount)
    || source.bandResponseCount !== source.bandResponses?.length
    || source.syntheticV332Status !== "separate-qualified-fixture-never-measured-fallback"
    || source.syntheticFallbackUsed !== false
    || source.sciencePayloadMutationAllowed !== false
    || source.cinematicConsumerAllowed !== false
    || source.formalProductPointer !== "v263"
    || source.denseCampaignStatus !== "incomplete-0-of-49"
    || source.browserQualification !== "not-run"
    || source.boundary !== "intent-only-read-only-authority-gate-no-synthetic-measured-fallback") throw new Error("v368-snapshot-identity");
  if (source.status === "qualified-measured-response-adapter" && (source.bandResponseCount !== 3 || source.bandResponses?.some((entry) => entry.status !== "qualified-measured-detector-response") || !/^[a-f0-9]{64}$/.test(source.admissionArtifactSha256 ?? "") || !/^[a-f0-9]{64}$/.test(source.authorityPointerSha256 ?? "") || !/^[a-f0-9]{64}$/.test(source.manifestFileSha256 ?? "") || !/^[a-f0-9]{64}$/.test(source.manifestCanonicalSha256 ?? "") || !source.instrumentSerialOrCampaignId)) throw new Error("v368-snapshot-qualified");
  if (source.status === "unavailable-v367-authority-artifacts-missing" && (source.authorityGranted || source.measuredResponseAvailable || source.bandResponseCount !== 0)) throw new Error("v368-snapshot-unavailable");
  return value as DetectorResponseAuthoritySnapshotV368;
}
