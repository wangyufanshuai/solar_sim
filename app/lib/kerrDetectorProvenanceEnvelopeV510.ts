"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import type { AtlasCalibrationEvidenceSnapshotV508 } from "./atlasCalibrationEvidenceClientV508";
import type { KerrMeasuredCalibrationPreflightSummaryV504 } from "./kerrMeasuredCalibrationPreflightV504";
import type { KerrMeasuredCalibrationReadinessSummaryV503 } from "./kerrMeasuredCalibrationReadinessV503";
import type {
  KerrTopologyDetectorAdmissionSnapshotV501,
} from "./kerrTopologyDetectorAdmissionClientV501";

export const KERR_DETECTOR_PROVENANCE_ENVELOPE_VERSION_V510 =
  "v510-kerr-detector-portable-provenance-envelope-v1" as const;

export type KerrDetectorProvenanceStageStatusV510 =
  | "idle"
  | "loading"
  | "ready"
  | "unavailable";

type KerrDetectorProvenanceStageBaseV510 = Readonly<{
  status: KerrDetectorProvenanceStageStatusV510;
  reason: string | null;
  requestCount: 0 | 1;
  responseBytes: number;
  artifactSha256: string | null;
}>;

export type KerrDetectorProvenanceEnvelopeV510 = Readonly<{
  version: typeof KERR_DETECTOR_PROVENANCE_ENVELOPE_VERSION_V510;
  status:
    | "portable-provenance-qualified-detector-authority-blocked"
    | "portable-provenance-partial-detector-authority-blocked";
  stages: Readonly<{
    admission: KerrDetectorProvenanceStageBaseV510 &
      Readonly<{
        passedGateCount: number | null;
        blockingGateCount: number | null;
        admitted: false;
      }>;
    readiness: KerrDetectorProvenanceStageBaseV510 &
      Readonly<{
        requiredFileCount: 6;
        readyFileCount: number;
        missingFileCount: number;
      }>;
    preflight: KerrDetectorProvenanceStageBaseV510 &
      Readonly<{
        readyFileCount: number;
        missingFileCount: number;
        invalidFileCount: number;
        bytesRead: number;
        candidateReadyForIndependentValidation: boolean;
      }>;
  }>;
  chain: Readonly<{
    stageCount: 3;
    readyStageCount: number;
    requestedStageCount: number;
    artifactSha256: readonly [string | null, string | null, string | null];
    chainSha256: string;
  }>;
  authority: Readonly<{
    measuredCalibrationFiles: "0/6";
    measuredDetectorAuthorityGranted: false;
    detectorResponseAvailable: false;
    observedCountsAvailable: false;
    observedIntensityAvailable: false;
    scienceRasterAvailable: false;
    denseCampaignStatus: "incomplete-0-of-49";
  }>;
  boundary: Readonly<{
    automaticRequestCount: 0;
    exportChangesScientificFields: false;
    absolutePathIncluded: false;
    hostIncluded: false;
    pidIncluded: false;
    rawFileContentsIncluded: false;
    formalProductPointer: "v263";
    formalDefaultKernel: "legacy-eih-1pn";
    browserQualification: "not-run";
  }>;
  canonicalSha256: string;
}>;

export type KerrDetectorProvenanceExportFormatV510 = "json" | "csv";

export type AcquiredKerrDetectorProvenanceExportV510 = Readonly<{
  format: KerrDetectorProvenanceExportFormatV510;
  filename: string;
  objectUrl: string;
  bytes: number;
  release: () => void;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const SAFE_REASON = /^[a-z0-9-]{1,64}$/;
const FORBIDDEN_KEYS = new Set([
  "absolutePath",
  "host",
  "hostname",
  "pid",
  "rawFileContents",
  "rayBuffer",
  "scienceRaster",
]);

const freezeStage = <T extends object>(value: T): Readonly<T> => Object.freeze(value);

function normalizeReason(value: string | null): string | null {
  return value !== null && SAFE_REASON.test(value) ? value : value === null ? null : "request-failed";
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "canonicalSha256" && key !== "chainSha256")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

function containsForbiddenKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenKey);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(
    ([key, entry]) => FORBIDDEN_KEYS.has(key) || containsForbiddenKey(entry),
  );
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (entry) =>
    entry.toString(16).padStart(2, "0"),
  ).join("");
}

export async function createKerrDetectorProvenanceEnvelopeV510(
  admission: KerrTopologyDetectorAdmissionSnapshotV501,
  readiness: AtlasCalibrationEvidenceSnapshotV508<KerrMeasuredCalibrationReadinessSummaryV503>,
  preflight: AtlasCalibrationEvidenceSnapshotV508<KerrMeasuredCalibrationPreflightSummaryV504>,
): Promise<KerrDetectorProvenanceEnvelopeV510> {
  const artifactSha256 = Object.freeze([
    admission.summary?.artifactSha256 ?? null,
    readiness.summary?.artifactSha256 ?? null,
    preflight.summary?.artifactSha256 ?? null,
  ] as const);
  const readyStageCount = [admission, readiness, preflight].filter(
    (entry) => entry.status === "ready" && entry.summary !== null,
  ).length;
  const requestedStageCount = [admission, readiness, preflight].reduce(
    (total, entry) => total + entry.requestCount,
    0,
  );
  const chainSha256 = await sha256(
    JSON.stringify({ stageIds: ["admission", "readiness", "preflight"], artifactSha256 }),
  );
  const unsigned = {
    version: KERR_DETECTOR_PROVENANCE_ENVELOPE_VERSION_V510,
    status:
      readyStageCount === 3
        ? ("portable-provenance-qualified-detector-authority-blocked" as const)
        : ("portable-provenance-partial-detector-authority-blocked" as const),
    stages: Object.freeze({
      admission: freezeStage({
        status: admission.status,
        reason: normalizeReason(admission.reason),
        requestCount: admission.requestCount,
        responseBytes: admission.responseBytes,
        artifactSha256: artifactSha256[0],
        passedGateCount: admission.summary?.decision.passedGateCount ?? null,
        blockingGateCount: admission.summary?.decision.blockingGateCount ?? null,
        admitted: false as const,
      }),
      readiness: freezeStage({
        status: readiness.status,
        reason: normalizeReason(readiness.reason),
        requestCount: readiness.requestCount,
        responseBytes: readiness.responseBytes,
        artifactSha256: artifactSha256[1],
        requiredFileCount: 6 as const,
        readyFileCount: readiness.summary?.decision.readyFileCount ?? 0,
        missingFileCount: readiness.summary?.decision.missingFileCount ?? 6,
      }),
      preflight: freezeStage({
        status: preflight.status,
        reason: normalizeReason(preflight.reason),
        requestCount: preflight.requestCount,
        responseBytes: preflight.responseBytes,
        artifactSha256: artifactSha256[2],
        readyFileCount: preflight.summary?.observation.readyFileCount ?? 0,
        missingFileCount: preflight.summary?.observation.missingFileIds.length ?? 6,
        invalidFileCount: preflight.summary?.observation.invalidFileIds.length ?? 0,
        bytesRead: preflight.summary?.observation.bytesRead ?? 0,
        candidateReadyForIndependentValidation:
          preflight.summary?.observation.candidateReadyForIndependentValidation ?? false,
      }),
    }),
    chain: Object.freeze({
      stageCount: 3 as const,
      readyStageCount,
      requestedStageCount,
      artifactSha256,
      chainSha256,
    }),
    authority: Object.freeze({
      measuredCalibrationFiles: "0/6" as const,
      measuredDetectorAuthorityGranted: false as const,
      detectorResponseAvailable: false as const,
      observedCountsAvailable: false as const,
      observedIntensityAvailable: false as const,
      scienceRasterAvailable: false as const,
      denseCampaignStatus: "incomplete-0-of-49" as const,
    }),
    boundary: Object.freeze({
      automaticRequestCount: 0 as const,
      exportChangesScientificFields: false as const,
      absolutePathIncluded: false as const,
      hostIncluded: false as const,
      pidIncluded: false as const,
      rawFileContentsIncluded: false as const,
      formalProductPointer: "v263" as const,
      formalDefaultKernel: "legacy-eih-1pn" as const,
      browserQualification: "not-run" as const,
    }),
  };
  const envelope = Object.freeze({
    ...unsigned,
    canonicalSha256: await sha256(JSON.stringify(canonicalize(unsigned))),
  });
  return parseKerrDetectorProvenanceEnvelopeV510(envelope);
}

export function parseKerrDetectorProvenanceEnvelopeV510(
  value: unknown,
): KerrDetectorProvenanceEnvelopeV510 {
  const envelope =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrDetectorProvenanceEnvelopeV510>)
      : null;
  const stages = envelope?.stages;
  const stageValues = stages ? [stages.admission, stages.readiness, stages.preflight] : [];
  if (
    !envelope ||
    envelope.version !== KERR_DETECTOR_PROVENANCE_ENVELOPE_VERSION_V510 ||
    ![
      "portable-provenance-qualified-detector-authority-blocked",
      "portable-provenance-partial-detector-authority-blocked",
    ].includes(String(envelope.status)) ||
    stageValues.length !== 3 ||
    stageValues.some(
      (stage) =>
        !stage ||
        !["idle", "loading", "ready", "unavailable"].includes(stage.status) ||
        ![0, 1].includes(stage.requestCount) ||
        !Number.isInteger(stage.responseBytes) ||
        stage.responseBytes < 0 ||
        (stage.reason !== null && !SAFE_REASON.test(stage.reason)) ||
        (stage.artifactSha256 !== null && !SHA256.test(stage.artifactSha256)),
    ) ||
    envelope.chain?.stageCount !== 3 ||
    !Number.isInteger(envelope.chain.readyStageCount) ||
    envelope.chain.readyStageCount < 0 ||
    envelope.chain.readyStageCount > 3 ||
    !Number.isInteger(envelope.chain.requestedStageCount) ||
    envelope.chain.requestedStageCount < 0 ||
    envelope.chain.requestedStageCount > 3 ||
    envelope.chain.artifactSha256?.length !== 3 ||
    !SHA256.test(envelope.chain.chainSha256 ?? "") ||
    envelope.authority?.measuredCalibrationFiles !== "0/6" ||
    envelope.authority.measuredDetectorAuthorityGranted !== false ||
    envelope.authority.detectorResponseAvailable !== false ||
    envelope.authority.observedCountsAvailable !== false ||
    envelope.authority.observedIntensityAvailable !== false ||
    envelope.authority.scienceRasterAvailable !== false ||
    envelope.authority.denseCampaignStatus !== "incomplete-0-of-49" ||
    envelope.boundary?.automaticRequestCount !== 0 ||
    envelope.boundary.exportChangesScientificFields !== false ||
    envelope.boundary.absolutePathIncluded !== false ||
    envelope.boundary.hostIncluded !== false ||
    envelope.boundary.pidIncluded !== false ||
    envelope.boundary.rawFileContentsIncluded !== false ||
    envelope.boundary.formalProductPointer !== "v263" ||
    envelope.boundary.formalDefaultKernel !== "legacy-eih-1pn" ||
    envelope.boundary.browserQualification !== "not-run" ||
    !SHA256.test(envelope.canonicalSha256 ?? "") ||
    containsForbiddenKey(envelope)
  ) {
    throw new Error("v510-detector-provenance-envelope-boundary");
  }
  const shouldBeQualified =
    envelope.chain.readyStageCount === 3 &&
    stageValues.every((stage) => stage.status === "ready" && stage.artifactSha256 !== null);
  if (
    shouldBeQualified !==
    (envelope.status === "portable-provenance-qualified-detector-authority-blocked")
  ) {
    throw new Error("v510-detector-provenance-envelope-status");
  }
  return envelope as KerrDetectorProvenanceEnvelopeV510;
}

export function serializeKerrDetectorProvenanceJsonV510(
  envelope: KerrDetectorProvenanceEnvelopeV510,
): string {
  return `${JSON.stringify(parseKerrDetectorProvenanceEnvelopeV510(envelope), null, 2)}\n`;
}

export function serializeKerrDetectorProvenanceCsvV510(
  envelope: KerrDetectorProvenanceEnvelopeV510,
): string {
  const parsed = parseKerrDetectorProvenanceEnvelopeV510(envelope);
  const rows = [
    ["admission", parsed.stages.admission],
    ["readiness", parsed.stages.readiness],
    ["preflight", parsed.stages.preflight],
  ] as const;
  const header = [
    "envelope_version",
    "envelope_sha256",
    "chain_sha256",
    "stage",
    "status",
    "reason",
    "request_count",
    "response_bytes",
    "artifact_sha256",
    "detector_authority",
    "science_raster",
  ];
  const encode = (entry: string | number | boolean | null): string =>
    JSON.stringify(String(entry ?? ""));
  const body = rows.map(([id, stage]) =>
    [
      parsed.version,
      parsed.canonicalSha256,
      parsed.chain.chainSha256,
      id,
      stage.status,
      stage.reason,
      stage.requestCount,
      stage.responseBytes,
      stage.artifactSha256,
      false,
      false,
    ]
      .map(encode)
      .join(","),
  );
  return `${[header.map(encode).join(","), ...body].join("\n")}\n`;
}

export function acquireKerrDetectorProvenanceExportV510(
  envelope: KerrDetectorProvenanceEnvelopeV510,
  format: KerrDetectorProvenanceExportFormatV510,
): AcquiredKerrDetectorProvenanceExportV510 {
  const parsed = parseKerrDetectorProvenanceEnvelopeV510(envelope);
  const content =
    format === "json"
      ? serializeKerrDetectorProvenanceJsonV510(parsed)
      : serializeKerrDetectorProvenanceCsvV510(parsed);
  const blob = new Blob([content], {
    type: format === "json" ? "application/json" : "text/csv;charset=utf-8",
  });
  const objectUrl = URL.createObjectURL(blob);
  const releaseRegistry = acquireAtlasResource(
    "object-url",
    "relativity-lab",
    `v510:detector-provenance:${format}`,
    {
      owner: "v510-detector-provenance",
      estimatedBytes: blob.size,
      contentSha256: parsed.canonicalSha256,
      manifestSha256: parsed.chain.chainSha256,
    },
  );
  let released = false;
  return Object.freeze({
    format,
    filename: `orbit-atlas-detector-provenance-v510.${format}`,
    objectUrl,
    bytes: blob.size,
    release: () => {
      if (released) return;
      released = true;
      URL.revokeObjectURL(objectUrl);
      releaseRegistry();
    },
  });
}
