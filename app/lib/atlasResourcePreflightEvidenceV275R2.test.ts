import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const EVIDENCE = "dist/science/resource-preflight-v275r2-evidence.json";
const POINTER = "dist/release/orbit-atlas-current-local-resource-preflight-v275r2.json";
const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const read = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as Record<string, unknown>;

describe("v275.2 user-authorized resource preflight evidence", () => {
  it("authorizes only v271 while preserving v275.1 and formal science boundaries", () => {
    const evidence = read(EVIDENCE);
    const { evidenceSha256, ...unsignedEvidence } = evidence;
    expect(evidenceSha256).toBe(sha256(JSON.stringify(canonicalize(unsignedEvidence))));
    expect(evidence).toMatchObject({
      version: "v275r2-resource-stability-preflight-user-override-v1",
      attempt: 2,
      status: "resource-preflight-passed-heavy-work-authorized-v271-only",
      heavyWorkAuthorized: true,
      nextAuthorizedStage: "v271-aggregate-only",
      formalProductPointerAdvanced: false,
      automaticRetryApplied: false,
      userAuthorizedThresholdOverride: {
        requestedExecutionMemoryGiB: 6.48,
        appliedMinimumMemoryBytes: 6 * 1024 ** 3,
        historicalV275R1EvidenceChanged: false,
      },
      science: {
        defaultKernel: "legacy-eih-1pn",
        workerPhysicsMutation: "not-applied",
        eihOnePnMutation: "not-applied",
        kerrMutation: "not-applied",
      },
    });
    expect(readFileSync(resolve(process.cwd(), "dist/science/resource-preflight-v275r1-evidence.json"), "utf8")).toContain('"blocked-resource-preflight"');
  });

  it("binds the current resource pointer to the immutable attempt", () => {
    const pointer = read(POINTER);
    const { pointerSha256, ...unsignedPointer } = pointer;
    expect(pointerSha256).toBe(sha256(JSON.stringify(canonicalize(unsignedPointer))));
    expect(pointer).toMatchObject({
      status: "resource-preflight-passed-heavy-work-authorized-v271-only",
      heavyWorkAuthorized: true,
      nextAuthorizedStage: "v271-aggregate-only",
      formalProductPointerAdvanced: false,
    });
    const source = pointer.source as { path: string; sha256: string };
    expect(source.path).toBe(EVIDENCE);
    expect(source.sha256).toBe(sha256(readFileSync(resolve(process.cwd(), EVIDENCE))));
  });
});
