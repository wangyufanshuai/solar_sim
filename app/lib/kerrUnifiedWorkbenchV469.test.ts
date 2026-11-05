import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrUnifiedWorkbenchPayloadV469,
  createKerrUnifiedWorkbenchSummaryV469,
  parseKerrUnifiedWorkbenchArtifactV469,
} from "./kerrUnifiedWorkbenchV469";

const artifactInput = JSON.parse(
  readFileSync("dist/science/kerr-unified-workbench-v469/workbench.json", "utf8"),
);
const expectedStageIds = [
  "v463-payload-admission",
  "v464-provenance",
  "v465-response",
  "v466-radiative-transfer",
  "v467-thin-disk",
  "v468-coupling",
];

describe("v469 unified Kerr workbench", () => {
  it("parses the canonical six-stage artifact", () => {
    const artifact = parseKerrUnifiedWorkbenchArtifactV469(artifactInput);
    const canonicalSha = createHash("sha256")
      .update(canonicalKerrUnifiedWorkbenchPayloadV469(artifact))
      .digest("hex");

    expect(canonicalSha).toBe(artifact.artifactSha256);
    expect(artifact.stages.map((stage) => stage.id)).toEqual(expectedStageIds);
    expect(new Set(artifact.stages.map((stage) => stage.id)).size).toBe(6);
    expect(Object.isFrozen(artifact)).toBe(true);
  });

  it("keeps authority, pixels and lifecycle fail closed", () => {
    const artifact = parseKerrUnifiedWorkbenchArtifactV469(artifactInput);

    expect(artifact.stages.every((stage) => !stage.authorityGranted)).toBe(true);
    expect(artifact.stages.every((stage) => stage.sciencePixelRows === 0)).toBe(true);
    expect(artifact.lifecycle).toMatchObject({
      existingCanvasCount: 1,
      newCanvasCreated: false,
      sceneRevisionDelta: 0,
      allResourcesAtBaseline: true,
    });
    expect(artifact.boundary).toMatchObject({
      sciencePayloadMutationAllowed: false,
      cinematicScienceWritebackAllowed: false,
      fitsWriteAllowed: false,
      pngWriteAllowed: false,
      denseAggregate: "unavailable",
    });
  });

  it("creates a bounded summary without full ray or pixel arrays", () => {
    const summary = createKerrUnifiedWorkbenchSummaryV469(artifactInput);
    const serialized = JSON.stringify(summary);

    expect(new TextEncoder().encode(serialized).byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(summary.stages).toHaveLength(6);
    expect(serialized).not.toMatch(/"(?:rays|executions|pixels|trajectories|samples)"\s*:/);
  });
});
