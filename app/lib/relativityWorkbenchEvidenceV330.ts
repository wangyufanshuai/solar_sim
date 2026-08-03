import {
  createRelativityWorkbenchEvidenceModelV324,
  type AtlasRelativityEvidenceSnapshotV324,
  type RelativityWorkbenchEvidenceModelV324,
} from "./relativityWorkbenchEvidenceV324";
import type { RelativityEvidenceLoadStatusV285 } from "./relativityWorkbenchEvidenceV285";

export type RelativityWorkbenchEvidenceV330 = Readonly<{
  v325: Readonly<{
    status: "componentwise-uncertainty-qualified-browser-pending" | "unavailable";
    applicableDiskRayCount: number;
    bandMeasurementCount: number;
    maximumLinearRelativeEnvelope: number | null;
    combinationPolicy: "linear-sum-without-independence-claim-no-rss" | "unavailable";
    artifactSha256: string | null;
  }>;
  v326: Readonly<{
    status: "sanitized-provenance-qualified-browser-pending" | "unavailable";
    jsonExport: boolean;
    csvExport: boolean;
    bandMeasurementCount: number;
    noRawRayBuffer: boolean;
    noHostPathPid: boolean;
    canonicalSha256: string | null;
    artifactSha256: string | null;
  }>;
  v327: Readonly<{
    status: "science-cinematic-ab-qualified-browser-pending" | "unavailable";
    swatchCount: number;
    profileTokenSources: readonly ("v5" | "v6")[];
    scienceValuesUnchanged: boolean;
    buffersDisjoint: boolean;
    cinematicOutputsDistinct: boolean;
    artifactSha256: string | null;
  }>;
  v328: Readonly<{
    status: "photon-observables-qualified-browser-pending" | "unavailable";
    applicableDiskRayCount: number;
    bandMeasurementCount: number;
    maximumQuadratureRelativeDifference: number | null;
    photonRadianceUnit: "photons s^-1 m^-2 sr^-1" | "unavailable";
    detectorIndependent: boolean;
    artifactSha256: string | null;
  }>;
  v329: Readonly<{
    status: "single-flight-lifecycle-qualified-browser-pending" | "unavailable";
    consumerCountFixture: number;
    acquisitionCountFixture: number;
    derivationCountFixture: number;
    derivedModelCount: number;
    directConsumerFetches: number;
    idempotentRelease: boolean;
    resourceBaselineReturnTested: boolean;
    artifactSha256: string | null;
  }>;
}>;

export type AtlasRelativityEvidenceSnapshotV330 = Omit<AtlasRelativityEvidenceSnapshotV324, "version" | "current"> & Readonly<{
  version: "v330-relativity-evidence-snapshot";
  current: AtlasRelativityEvidenceSnapshotV324["current"] & RelativityWorkbenchEvidenceV330;
}>;

type RelativityWorkbenchCurrentRowV330 = RelativityWorkbenchEvidenceModelV324["currentRows"][number] | Readonly<{
  id: keyof RelativityWorkbenchEvidenceV330;
  status: string;
  label: string;
  metric: string;
  artifactSha256: string | null;
}>;

export type RelativityWorkbenchEvidenceModelV330 = Omit<RelativityWorkbenchEvidenceModelV324, "version" | "currentRows"> & Readonly<{
  version: "v330-relativity-workbench-evidence-model";
  currentRows: readonly RelativityWorkbenchCurrentRowV330[];
}>;

function scientific(value: number | null): string {
  return value == null ? "unavailable" : value.toExponential(6);
}

export function createRelativityWorkbenchEvidenceModelV330(
  snapshot: AtlasRelativityEvidenceSnapshotV330,
  loadStatus: RelativityEvidenceLoadStatusV285 = "ready",
): RelativityWorkbenchEvidenceModelV330 {
  const { v325, v326, v327, v328, v329, ...v324Current } = snapshot.current;
  const v324Snapshot: AtlasRelativityEvidenceSnapshotV324 = {
    ...snapshot,
    version: "v324-relativity-evidence-snapshot",
    current: v324Current,
  };
  const previous = createRelativityWorkbenchEvidenceModelV324(v324Snapshot, loadStatus);
  return {
    ...previous,
    version: "v330-relativity-workbench-evidence-model",
    currentRows: [
      ...previous.currentRows,
      {
        id: "v325",
        status: v325.status,
        label: "Componentwise uncertainty",
        metric: `${v325.applicableDiskRayCount} disk rays / ${v325.bandMeasurementCount} band measurements / max linear envelope ${scientific(v325.maximumLinearRelativeEnvelope)} / no RSS`,
        artifactSha256: v325.artifactSha256,
      },
      {
        id: "v326",
        status: v326.status,
        label: "Sanitized uncertainty provenance",
        metric: `${v326.bandMeasurementCount} rows / JSON ${v326.jsonExport ? "ready" : "unavailable"} / CSV ${v326.csvExport ? "ready" : "unavailable"} / raw rays ${v326.noRawRayBuffer ? "excluded" : "unsafe"} / host-path-PID ${v326.noHostPathPid ? "excluded" : "unsafe"}`,
        artifactSha256: v326.artifactSha256,
      },
      {
        id: "v327",
        status: v327.status,
        label: "Science / Cinematic A/B boundary",
        metric: `${v327.swatchCount} swatches / ${v327.profileTokenSources.join("+") || "no profile"} / science ${v327.scienceValuesUnchanged ? "unchanged" : "drift"} / buffers ${v327.buffersDisjoint ? "disjoint" : "shared"} / cinematic ${v327.cinematicOutputsDistinct ? "distinct" : "not distinct"}`,
        artifactSha256: v327.artifactSha256,
      },
      {
        id: "v328",
        status: v328.status,
        label: "Photon-domain observables",
        metric: `${v328.applicableDiskRayCount} disk rays / ${v328.bandMeasurementCount} measurements / 512↔256 ${scientific(v328.maximumQuadratureRelativeDifference)} / ${v328.photonRadianceUnit} / ${v328.detectorIndependent ? "detector-independent" : "detector-coupled"}`,
        artifactSha256: v328.artifactSha256,
      },
      {
        id: "v329",
        status: v329.status,
        label: "Science observatory single-flight lifecycle",
        metric: `${v329.consumerCountFixture} consumers → ${v329.acquisitionCountFixture} acquisition → ${v329.derivationCountFixture} derivation / ${v329.derivedModelCount} bounded models / ${v329.directConsumerFetches} direct fetches / release ${v329.idempotentRelease && v329.resourceBaselineReturnTested ? "baseline-qualified" : "pending"}`,
        artifactSha256: v329.artifactSha256,
      },
    ],
  };
}

export type RelativityEvidenceResponseV330 = Readonly<{
  version: "v330-relativity-evidence-response";
  available: boolean;
  reason: "ready" | "lite-boundary" | "evidence-unavailable" | "evidence-corrupt";
  snapshot: AtlasRelativityEvidenceSnapshotV330 | null;
}>;

export function parseRelativityEvidenceResponseV330(value: unknown): RelativityEvidenceResponseV330 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v330 evidence response is invalid");
  const response = value as Partial<RelativityEvidenceResponseV330>;
  if (response.version !== "v330-relativity-evidence-response" || typeof response.available !== "boolean") throw new Error("v330 evidence response version is invalid");
  if (!["ready", "lite-boundary", "evidence-unavailable", "evidence-corrupt"].includes(String(response.reason))) throw new Error("v330 evidence response reason is invalid");
  if (!response.available) return { version: response.version, available: false, reason: response.reason!, snapshot: null };
  if (!response.snapshot || response.snapshot.version !== "v330-relativity-evidence-snapshot") throw new Error("v330 evidence snapshot is invalid");
  return response as RelativityEvidenceResponseV330;
}
