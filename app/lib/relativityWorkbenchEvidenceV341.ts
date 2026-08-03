import type { AtlasRelativityEvidenceSnapshotV338 } from "./relativityWorkbenchEvidenceV338";

export type RelativityObservationEvidenceV341 = Readonly<{
  status: "qualified-sparse-observation-product-science-profile-invariant" | "unavailable";
  artifactSha256: string | null;
  authorityKind: string;
  authorityRayCount: number;
  applicableDiskRayCount: number;
  unavailableRayCount: number;
  bandMeasurementCount: number;
  polarizationMeasurementCount: number;
  maximumEnvelope: number | null;
  maximumInstrumentQuadrature: number | null;
  maximumEvpaDifferenceDeg: number | null;
  instrumentModel: string;
  instrumentStatus: string;
  scienceDigest: string | null;
  cinematicDigests: Readonly<Record<string, string>>;
  scienceProfileInvariant: boolean;
  cinematicPairwiseDistinct: boolean;
  sourceProductByteIdentical: boolean;
  presentationCopiesDisjoint: boolean;
  denseStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
}>;

export type RelativityVisualEvidenceV341 = Readonly<{
  status: "visual-v7-v340-wired-browser-pending-dense-incomplete-0-of-49" | "unavailable";
  profile: string;
  runtimeMatrixRows: number;
  scienceDigest: string | null;
  cinematicDigests: Readonly<Record<string, string>>;
  assetSelector: string;
  defaultApplied: boolean;
  browserQualification: "not-run";
}>;

export type AtlasRelativityEvidenceSnapshotV341 = Readonly<{
  version: "v341-relativity-evidence-snapshot";
  status: "ready" | "corrupt";
  base: AtlasRelativityEvidenceSnapshotV338;
  current: Readonly<{
    v340: RelativityVisualEvidenceV341;
    v341: RelativityObservationEvidenceV341;
  }>;
}>;

export type RelativityEvidenceResponseV341 = Readonly<{
  version: "v341-relativity-evidence-response";
  available: boolean;
  reason: "ready" | "lite-boundary" | "evidence-unavailable" | "evidence-corrupt";
  snapshot: AtlasRelativityEvidenceSnapshotV341 | null;
}>;

export function parseRelativityEvidenceResponseV341(value: unknown): RelativityEvidenceResponseV341 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v341 evidence response is invalid");
  const response = value as Partial<RelativityEvidenceResponseV341>;
  if (response.version !== "v341-relativity-evidence-response" || typeof response.available !== "boolean"
    || !["ready", "lite-boundary", "evidence-unavailable", "evidence-corrupt"].includes(String(response.reason))) throw new Error("v341 evidence response identity");
  if (!response.available) return { version: response.version, available: false, reason: response.reason!, snapshot: null };
  if (!response.snapshot || response.snapshot.version !== "v341-relativity-evidence-snapshot" || response.snapshot.status !== "ready") throw new Error("v341 evidence snapshot identity");
  return response as RelativityEvidenceResponseV341;
}
