import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  analyzeKerrEvidenceDependencyGraphV470,
  canonicalKerrEvidenceDependencyPayloadV470,
  createKerrEvidenceDependencySummaryV470,
  parseKerrEvidenceDependencyArtifactV470,
  type KerrEvidenceDependencyEdgeV470,
} from "./kerrEvidenceDependencyV470";

const input = JSON.parse(
  readFileSync("dist/science/kerr-evidence-dependency-v470/dependency-graph.json", "utf8"),
);

describe("v470 Kerr evidence dependency graph", () => {
  it("parses the canonical 16-node 34-edge DAG", () => {
    const artifact = parseKerrEvidenceDependencyArtifactV470(input);
    const sha = createHash("sha256")
      .update(canonicalKerrEvidenceDependencyPayloadV470(artifact))
      .digest("hex");

    expect(sha).toBe(artifact.artifactSha256);
    expect(artifact.nodes).toHaveLength(16);
    expect(artifact.edges).toHaveLength(34);
    expect(artifact.analysis.acyclic).toBe(true);
    expect(artifact.analysis.topologicalOrder).toHaveLength(16);
  });

  it("derives exactly three real root blockers and their propagation", () => {
    const artifact = parseKerrEvidenceDependencyArtifactV470(input);
    expect(artifact.analysis.rootBlockers).toEqual([
      {
        nodeId: "v458-measured-intake",
        reason: "measured-files-missing-6-of-6",
        blockedDescendantCount: 12,
      },
      {
        nodeId: "v314-dense-campaign",
        reason: "dense-campaign-incomplete-0-of-49",
        blockedDescendantCount: 2,
      },
      {
        nodeId: "heavy-qualification",
        reason: "heavy-qualification-not-run",
        blockedDescendantCount: 1,
      },
    ]);
    expect(artifact.outcomes).toMatchObject({
      measuredAuthorityGranted: false,
      scienceRasterAuthorityGranted: false,
      localShadowPromotionAllowed: false,
    });
  });

  it("rejects a dependency cycle and keeps the summary bounded", () => {
    const artifact = parseKerrEvidenceDependencyArtifactV470(input);
    const cycle: KerrEvidenceDependencyEdgeV470 = {
      from: "local-shadow-promotion",
      to: "v458-measured-intake",
      requirement: "invalid-cycle",
      propagatesBlocker: true,
    };
    expect(() =>
      analyzeKerrEvidenceDependencyGraphV470(artifact.nodes, [...artifact.edges, cycle]),
    ).toThrow("v470-dependency-cycle");

    const summary = createKerrEvidenceDependencySummaryV470(artifact);
    expect(new TextEncoder().encode(JSON.stringify(summary)).byteLength).toBeLessThanOrEqual(
      128 * 1024,
    );
  });
});
