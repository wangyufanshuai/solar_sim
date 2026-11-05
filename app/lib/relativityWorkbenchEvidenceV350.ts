import type { AtlasRelativityEvidenceSnapshotV349 } from "./relativityWorkbenchEvidenceV349";

export type RelativityBandObservationEvidenceV350 = Readonly<{
  status: "observation-v350-qualified-browser-pending-dense-incomplete-0-of-49" | "unavailable";
  artifactSha256: string | null;
  replaySha256: string | null;
  bandCount: number;
  rayCount: number;
  rowCount: number;
  measuredDetectorCounts: "unavailable-synthetic-model-only";
  calibratedBandpass: "unavailable-not-calibrated-observatory";
  spectralTemperature: "unavailable-no-physical-fit";
  celestialWcs: "unavailable-sparse-index-grid";
  solidAngleIntegratedFlux: "unavailable-no-celestial-wcs";
  scienceCinematicBoundary: "observation-layer-never-cinematic-color-input";
  denseStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
}>;

export type AtlasRelativityEvidenceSnapshotV350 = Readonly<{ version: "v350-relativity-evidence-snapshot"; status: "ready" | "corrupt"; base: AtlasRelativityEvidenceSnapshotV349; current: Readonly<{ v350: RelativityBandObservationEvidenceV350 }> }>;
export type RelativityEvidenceResponseV350 = Readonly<{ version: "v350-relativity-evidence-response"; available: boolean; reason: "ready" | "lite-boundary" | "evidence-unavailable" | "evidence-corrupt"; snapshot: AtlasRelativityEvidenceSnapshotV350 | null }>;
export function parseRelativityEvidenceResponseV350(value: unknown): RelativityEvidenceResponseV350 { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v350 evidence response invalid"); const response = value as Partial<RelativityEvidenceResponseV350>; if (response.version !== "v350-relativity-evidence-response" || typeof response.available !== "boolean" || !["ready", "lite-boundary", "evidence-unavailable", "evidence-corrupt"].includes(String(response.reason))) throw new Error("v350 evidence response identity"); if (!response.available) return { version: response.version, available: false, reason: response.reason!, snapshot: null }; if (!response.snapshot || response.snapshot.version !== "v350-relativity-evidence-snapshot" || response.snapshot.status !== "ready") throw new Error("v350 evidence snapshot identity"); return response as RelativityEvidenceResponseV350; }
