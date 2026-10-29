import type { AtlasRelativityEvidenceSnapshotV348 } from "./relativityWorkbenchEvidenceV348";

export type RelativityVisualV349Evidence = Readonly<{
  status: "visual-v8-v349-qualified-browser-pending-dense-incomplete-0-of-49" | "unavailable";
  artifactSha256: string | null;
  runtimeMatrixRows: number;
  runtimeGroupCount: number;
  profiles: readonly string[];
  scienceOutputDigest: string | null;
  scienceFieldsEquivalent: boolean;
  sciencePayloadByteIdentical: boolean;
  cinematicOutputsPairwiseDistinct: boolean;
  cinematicDigests: Readonly<Record<string, string>>;
  presentationConsumer: "spectral-ribbon-reticle-channel-separation-seeded-overlay" | "unavailable";
  scienceBufferMutationAllowed: false;
  assetSelector: string | null;
  assetBeforeIntent: "no-deep-space-intent" | "unavailable";
  liteBoundary: "lite-boundary" | "unavailable";
  localShadowManualOnly: true;
  defaultApplied: false;
  browserQualification: "not-run";
  denseStatus: "incomplete-0-of-49";
}>;

export type AtlasRelativityEvidenceSnapshotV349 = Readonly<{
  version: "v349-relativity-evidence-snapshot";
  status: "ready" | "corrupt";
  base: AtlasRelativityEvidenceSnapshotV348;
  current: Readonly<{ v349: RelativityVisualV349Evidence }>;
}>;

export type RelativityEvidenceResponseV349 = Readonly<{
  version: "v349-relativity-evidence-response";
  available: boolean;
  reason: "ready" | "lite-boundary" | "evidence-unavailable" | "evidence-corrupt";
  snapshot: AtlasRelativityEvidenceSnapshotV349 | null;
}>;

export function parseRelativityEvidenceResponseV349(value: unknown): RelativityEvidenceResponseV349 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v349 evidence response invalid");
  const response = value as Partial<RelativityEvidenceResponseV349>;
  if (response.version !== "v349-relativity-evidence-response" || typeof response.available !== "boolean" || !["ready", "lite-boundary", "evidence-unavailable", "evidence-corrupt"].includes(String(response.reason))) throw new Error("v349 evidence response identity");
  if (!response.available) return { version: response.version, available: false, reason: response.reason!, snapshot: null };
  if (!response.snapshot || response.snapshot.version !== "v349-relativity-evidence-snapshot" || response.snapshot.status !== "ready") throw new Error("v349 evidence snapshot identity");
  return response as RelativityEvidenceResponseV349;
}
