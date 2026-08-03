import type { AtlasRelativityEvidenceSnapshotV341 } from "./relativityWorkbenchEvidenceV341";
export type RelativityObservationRasterEvidenceV342 = Readonly<{
  status: "sparse-observation-raster-v342-qualified-browser-pending-dense-incomplete-0-of-49" | "unavailable";
  artifactSha256: string | null;
  rowCount: number;
  columnCount: number;
  cellCount: number;
  bandOrder: readonly string[];
  scienceDigest: string | null;
  cinematicDigests: Readonly<Record<string, string>>;
  scienceProfileInvariant: boolean;
  physicalValuesBeforeAfterIdentical: boolean;
  cinematicPhysicalFieldsExcluded: boolean;
  cinematicCopiesDisjoint: boolean;
  denseStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  cells: readonly Readonly<{
    rayIndex: number;
    spinA: number;
    bandId: string;
    imageOrder: number;
    redshiftFactor: number;
    walkerPenroseEvpaDeg: number;
    evpaDifferenceDeg: number;
    observedEnergyRadianceWM2Sr: number;
    lowerAuditEnvelopeWM2Sr: number;
    upperAuditEnvelopeWM2Sr: number;
    conservativeLinearRelativeEnvelope: number;
    scienceLinearDisplay01: number;
  }>[];
}>;
export type AtlasRelativityEvidenceSnapshotV342 = Readonly<{
  version: "v342-relativity-evidence-snapshot";
  status: "ready" | "corrupt";
  base: AtlasRelativityEvidenceSnapshotV341;
  current: Readonly<{ v342: RelativityObservationRasterEvidenceV342 }>;
}>;
export type RelativityEvidenceResponseV342 = Readonly<{
  version: "v342-relativity-evidence-response";
  available: boolean;
  reason: "ready" | "lite-boundary" | "evidence-unavailable" | "evidence-corrupt";
  snapshot: AtlasRelativityEvidenceSnapshotV342 | null;
}>;
export function parseRelativityEvidenceResponseV342(value: unknown): RelativityEvidenceResponseV342 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v342 evidence response invalid");
  const response = value as Partial<RelativityEvidenceResponseV342>;
  if (response.version !== "v342-relativity-evidence-response" || typeof response.available !== "boolean" || !["ready", "lite-boundary", "evidence-unavailable", "evidence-corrupt"].includes(String(response.reason))) throw new Error("v342 evidence response identity");
  if (!response.available) return { version: response.version, available: false, reason: response.reason!, snapshot: null };
  if (!response.snapshot || response.snapshot.version !== "v342-relativity-evidence-snapshot" || response.snapshot.status !== "ready") throw new Error("v342 evidence snapshot identity");
  return response as RelativityEvidenceResponseV342;
}
