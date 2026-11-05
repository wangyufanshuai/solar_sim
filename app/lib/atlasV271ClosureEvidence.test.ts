import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { AtlasV271AttemptNegativeEvidence, AtlasV271ClosureEvidence } from "./atlasV271ClosureEvidence";

const EVIDENCE_PATH = "dist/science/gaia-research-v271-attempt-1-negative-evidence.json";
const POINTER_PATH = "dist/release/orbit-atlas-current-local-v271-closure-v275r2.json";
const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const read = <T>(path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;

describe("v271 attempt-1 fail-closed evidence", () => {
  it("preserves the reusable part and stops every dependent stage", () => {
    const evidence = read<AtlasV271AttemptNegativeEvidence & Record<string, unknown>>(EVIDENCE_PATH);
    const { evidenceSha256, ...unsigned } = evidence;
    expect(evidenceSha256).toBe(sha256(JSON.stringify(canonicalize(unsigned))));
    expect(evidence).toMatchObject({
      status: "blocked-v271-aggregate-attempt-1-not-retried",
      capabilityState: "blocked",
      attempt: { exitCode: 1, durationMs: 21800, automaticRetryApplied: false },
      retainedPart: { bytes: 14925824, integrity: "ok", checkpointReusable: true },
      downstream: {
        v272ShardSeriesStarted: false,
        gaia10mBuildStarted: false,
        v273ToV275HeavyClosureStarted: false,
      },
      science: {
        defaultKernel: "legacy-eih-1pn",
        workerPhysicsMutation: "not-applied",
        eihOnePnMutation: "not-applied",
        kerrMutation: "not-applied",
      },
      formalProduct: { version: "v263", advanced: false, defaultVisualProfile: "legacy-v9" },
    });
  });

  it("retains attempt 1 as prior negative evidence after the current local pointer advances", () => {
    const pointer = read<Record<string, unknown>>(POINTER_PATH);
    const { pointerSha256, ...unsigned } = pointer;
    expect(pointerSha256).toBe(sha256(JSON.stringify(canonicalize(unsigned))));
    expect(pointer).toMatchObject({
      status: "implemented-awaiting-browser-qualification",
      formalProductPointerAdvanced: false,
      automaticRetryApplied: false,
      localShadowPromotionApplied: false,
      priorNegativeEvidence: { path: EVIDENCE_PATH },
      capabilities: {
        v271: { state: "implemented-awaiting-browser-qualification" },
        v272: { state: "ready-for-resource-gated-shard-series" },
      },
    });
    const prior = pointer.priorNegativeEvidence as { path: string; sha256: string };
    expect(prior.sha256).toBe(sha256(readFileSync(resolve(process.cwd(), EVIDENCE_PATH))));
  });
});

describe("v271 attempt-2 closure evidence", () => {
  it("qualifies the implementation while retaining browser and formal-product boundaries", () => {
    const path = "dist/science/gaia-research-v271-closure-evidence.json";
    const evidence = read<AtlasV271ClosureEvidence & Record<string, unknown>>(path);
    const { evidenceSha256, ...unsigned } = evidence;
    expect(evidenceSha256).toBe(sha256(JSON.stringify(canonicalize(unsigned))));
    expect(evidence).toMatchObject({
      status: "implemented-awaiting-browser-qualification",
      capabilityState: "implemented-awaiting-browser-qualification",
      attempts: {
        attempt1: { retainedAsNegativeEvidence: true },
        attempt2: { exitCode: 0, durationMs: 1583, automaticRetryApplied: false, checkpointResumeApplied: true },
      },
      aggregate: { integrity: "ok", contentAddressed: true },
      validation: {
        generatedIntegrity: { status: "passed-v271-generated-integrity" },
        focusedTests: { total: 16, passed: 16, failed: 0 },
        browserQualification: "not-run",
      },
      science: {
        defaultKernel: "legacy-eih-1pn",
        workerPhysicsMutation: "not-applied",
        eihOnePnMutation: "not-applied",
        kerrMutation: "not-applied",
      },
      release: {
        formalProductVersion: "v263",
        formalProductPointerAdvanced: false,
        defaultVisualProfile: "legacy-v9",
        localShadowPromotionApplied: false,
        v272ShardSeriesStarted: false,
      },
    });
  });
});
