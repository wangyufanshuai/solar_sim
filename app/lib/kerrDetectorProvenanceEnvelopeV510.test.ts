import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  createKerrMeasuredCalibrationPreflightSummaryV504,
} from "./kerrMeasuredCalibrationPreflightV504";
import {
  createKerrMeasuredCalibrationReadinessSummaryV503,
} from "./kerrMeasuredCalibrationReadinessV503";
import {
  createKerrTopologyDetectorAdmissionSummaryV501,
} from "./kerrTopologyDetectorAdmissionV501";
import {
  acquireKerrDetectorProvenanceExportV510,
  createKerrDetectorProvenanceEnvelopeV510,
  parseKerrDetectorProvenanceEnvelopeV510,
  serializeKerrDetectorProvenanceCsvV510,
  serializeKerrDetectorProvenanceJsonV510,
} from "./kerrDetectorProvenanceEnvelopeV510";

const artifact = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

function readySnapshots() {
  const admission = createKerrTopologyDetectorAdmissionSummaryV501(
    artifact("dist/science/kerr-topology-detector-admission-v501/admission-bridge.json"),
  );
  const readiness = createKerrMeasuredCalibrationReadinessSummaryV503(
    artifact("dist/science/kerr-measured-calibration-readiness-v503/readiness.json"),
  );
  const preflight = createKerrMeasuredCalibrationPreflightSummaryV504(
    artifact("dist/science/kerr-measured-calibration-preflight-v504/preflight.json"),
  );
  return {
    admission: Object.freeze({
      status: "ready" as const,
      reason: null,
      requestCount: 1 as const,
      responseBytes: 4096,
      summary: admission,
    }),
    readiness: Object.freeze({
      status: "ready" as const,
      reason: null,
      requestCount: 1 as const,
      responseBytes: 8192,
      summary: readiness,
    }),
    preflight: Object.freeze({
      status: "ready" as const,
      reason: null,
      requestCount: 1 as const,
      responseBytes: 4096,
      summary: preflight,
    }),
  };
}

describe("v510 portable detector provenance", () => {
  it("builds a deterministic sanitized three-stage envelope without granting authority", async () => {
    const snapshots = readySnapshots();
    const first = await createKerrDetectorProvenanceEnvelopeV510(
      snapshots.admission,
      snapshots.readiness,
      snapshots.preflight,
    );
    const second = await createKerrDetectorProvenanceEnvelopeV510(
      snapshots.admission,
      snapshots.readiness,
      snapshots.preflight,
    );
    expect(first).toEqual(second);
    expect(first.status).toBe("portable-provenance-qualified-detector-authority-blocked");
    expect(first.chain).toMatchObject({
      stageCount: 3,
      readyStageCount: 3,
      requestedStageCount: 3,
    });
    expect(first.chain.chainSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(first.canonicalSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(first.authority).toMatchObject({
      measuredCalibrationFiles: "0/6",
      measuredDetectorAuthorityGranted: false,
      detectorResponseAvailable: false,
      scienceRasterAvailable: false,
      denseCampaignStatus: "incomplete-0-of-49",
    });
    expect(first.boundary).toMatchObject({
      automaticRequestCount: 0,
      absolutePathIncluded: false,
      hostIncluded: false,
      pidIncluded: false,
      rawFileContentsIncluded: false,
      formalProductPointer: "v263",
      formalDefaultKernel: "legacy-eih-1pn",
    });
    const json = serializeKerrDetectorProvenanceJsonV510(first);
    const csv = serializeKerrDetectorProvenanceCsvV510(first);
    expect(json).not.toMatch(/[A-Z]:\\|"hostname":|"pid":|"rawFileContents":/);
    expect(csv.trim().split("\n")).toHaveLength(4);
    expect(csv).toContain(first.canonicalSha256);
  });

  it("preserves unavailable reasons as a partial envelope", async () => {
    const partial = await createKerrDetectorProvenanceEnvelopeV510(
      Object.freeze({
        status: "unavailable" as const,
        reason: "evidence-corrupt",
        requestCount: 1 as const,
        responseBytes: 0,
        summary: null,
      }),
      Object.freeze({
        status: "idle" as const,
        reason: null,
        requestCount: 0 as const,
        responseBytes: 0,
        summary: null,
      }),
      Object.freeze({
        status: "idle" as const,
        reason: null,
        requestCount: 0 as const,
        responseBytes: 0,
        summary: null,
      }),
    );
    expect(partial.status).toBe("portable-provenance-partial-detector-authority-blocked");
    expect(partial.stages.admission.reason).toBe("evidence-corrupt");
    expect(partial.chain.readyStageCount).toBe(0);
    expect(partial.chain.requestedStageCount).toBe(1);
  });

  it("tracks and idempotently releases JSON and CSV object URLs", async () => {
    const snapshots = readySnapshots();
    const envelope = await createKerrDetectorProvenanceEnvelopeV510(
      snapshots.admission,
      snapshots.readiness,
      snapshots.preflight,
    );
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValueOnce("blob:v510-json").mockReturnValueOnce("blob:v510-csv");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const baseline = getAtlasResourceSnapshot();
    const json = acquireKerrDetectorProvenanceExportV510(envelope, "json");
    const csv = acquireKerrDetectorProvenanceExportV510(envelope, "csv");
    expect(getAtlasResourceSnapshot().objectUrls - baseline.objectUrls).toBe(2);
    expect(json.filename).toBe("orbit-atlas-detector-provenance-v510.json");
    expect(csv.filename).toBe("orbit-atlas-detector-provenance-v510.csv");
    json.release();
    json.release();
    csv.release();
    csv.release();
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
    expect(create).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  });

  it("rejects authority escalation in a forged envelope", async () => {
    const snapshots = readySnapshots();
    const envelope = await createKerrDetectorProvenanceEnvelopeV510(
      snapshots.admission,
      snapshots.readiness,
      snapshots.preflight,
    );
    const forged = JSON.parse(JSON.stringify(envelope)) as Record<string, unknown>;
    (forged.authority as Record<string, unknown>).measuredDetectorAuthorityGranted = true;
    expect(() => parseKerrDetectorProvenanceEnvelopeV510(forged)).toThrow(
      "v510-detector-provenance-envelope-boundary",
    );
  });
});
