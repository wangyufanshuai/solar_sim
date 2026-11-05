import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ATLAS_RESOURCE_PREFLIGHT_MIN_DISK_BYTES_V275R1,
  ATLAS_RESOURCE_PREFLIGHT_MIN_MEMORY_BYTES_V275R1,
  ATLAS_RESOURCE_PREFLIGHT_SAMPLE_COUNT_V275R1,
  ATLAS_RESOURCE_PREFLIGHT_SAMPLE_INTERVAL_MS_V275R1,
} from "./atlasResourcePreflightV275R1";

const EVIDENCE_PATH = "dist/science/resource-preflight-v275r1-evidence.json";
const POINTER_PATH = "dist/release/orbit-atlas-current-local-resource-preflight-v275r1.json";
const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const readJson = <T = Record<string, unknown>>(path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
type Evidence = {
  evidenceSha256: string;
  attempt: number;
  thresholds: Record<string, unknown>;
  samples: unknown[];
  cleanup: { protectedTerminationCount: number };
  formalProductPointer: string;
  formalProductPointerAdvanced: boolean;
  science: Record<string, unknown>;
  heavyWorkAuthorized: boolean;
  status: string;
  nextAuthorizedStage: string;
  evaluation: { blockers: string[]; minimumMemoryBytes: number; p10MemoryBytes: number };
  [key: string]: unknown;
};
type Pointer = {
  pointerSha256: string;
  source: { sha256: string };
  heavyWorkAuthorized: boolean;
  status: string;
  [key: string]: unknown;
};

describe("v275.1 formal resource preflight evidence", () => {
  it("binds the one-shot evidence and preserves the formal/science boundaries", () => {
    const evidence = readJson<Evidence>(EVIDENCE_PATH);
    const { evidenceSha256, ...unsignedEvidence } = evidence;
    expect(evidenceSha256).toBe(sha256(JSON.stringify(canonicalize(unsignedEvidence))));
    expect(evidence.attempt).toBe(1);
    expect(evidence.thresholds).toMatchObject({
      sampleCount: ATLAS_RESOURCE_PREFLIGHT_SAMPLE_COUNT_V275R1,
      sampleIntervalMs: ATLAS_RESOURCE_PREFLIGHT_SAMPLE_INTERVAL_MS_V275R1,
      minimumMemoryBytes: ATLAS_RESOURCE_PREFLIGHT_MIN_MEMORY_BYTES_V275R1,
      minimumDiskBytes: ATLAS_RESOURCE_PREFLIGHT_MIN_DISK_BYTES_V275R1,
      requiredFreePorts: [3015, 3017],
      historicalCanonicalThresholdsChanged: false,
    });
    expect(evidence.samples).toHaveLength(18);
    expect(evidence.cleanup.protectedTerminationCount).toBe(0);
    expect(evidence.formalProductPointer).toBe("dist/release/orbit-atlas-current-product-evidence-v263.json");
    expect(evidence.formalProductPointerAdvanced).toBe(false);
    expect(evidence.science).toMatchObject({
      defaultKernel: "legacy-eih-1pn",
      codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8",
      screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037",
      workerPhysicsMutation: "not-applied",
      eihOnePnMutation: "not-applied",
      kerrMutation: "not-applied",
    });
  });

  it("keeps authorization and blockers internally consistent", () => {
    const evidence = readJson<Evidence>(EVIDENCE_PATH);
    const pointer = readJson<Pointer>(POINTER_PATH);
    const { pointerSha256, ...unsignedPointer } = pointer;
    expect(pointerSha256).toBe(sha256(JSON.stringify(canonicalize(unsignedPointer))));
    expect(pointer.source.sha256).toBe(sha256(readFileSync(resolve(process.cwd(), EVIDENCE_PATH))));
    expect(pointer.heavyWorkAuthorized).toBe(evidence.heavyWorkAuthorized);
    expect(pointer.status).toBe(evidence.status);
    if (evidence.heavyWorkAuthorized) {
      expect(evidence.status).toBe("resource-preflight-passed-heavy-work-authorized");
      expect(evidence.nextAuthorizedStage).toBe("v271-aggregate-only");
      expect(evidence.evaluation.blockers).toEqual([]);
      expect(evidence.evaluation.minimumMemoryBytes).toBeGreaterThanOrEqual(ATLAS_RESOURCE_PREFLIGHT_MIN_MEMORY_BYTES_V275R1);
      expect(evidence.evaluation.p10MemoryBytes).toBeGreaterThanOrEqual(ATLAS_RESOURCE_PREFLIGHT_MIN_MEMORY_BYTES_V275R1);
    } else {
      expect(evidence.status).toBe("blocked-resource-preflight");
      expect(evidence.nextAuthorizedStage).toBe("none");
      expect(evidence.evaluation.blockers.length).toBeGreaterThan(0);
    }
  });
});
