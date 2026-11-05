import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateAtlasScientificEvidenceTruthAuditV286, type AtlasScientificEvidenceTruthAuditV286 } from "./atlasScientificEvidenceTruthAuditV286";

describe("v286 runtime and evidence truth correction", () => {
  it("keeps full deep-space presentation behind explicit intent", () => {
    const runtime = readFileSync("app/components/AtlasUniverseSceneRuntime.tsx", "utf8");
    const subtree = readFileSync("app/components/AtlasDeepSpacePresentationSubtreeV275.tsx", "utf8");
    const primer = readFileSync("app/components/AtlasSolarSkyPrimerV286.tsx", "utf8");
    expect(runtime).toContain("const deepSpaceIntent =");
    expect(runtime).toContain("{deepSpaceIntent ? (");
    expect(primer).toContain("owns no catalog store, Worker, or network request");
    expect(subtree).not.toContain('import GalacticLandmarks from "./GalacticLandmarks"');
  });

  it("updates resource evidence without subscribing the app shell render tree", () => {
    const shell = readFileSync("app/components/AtlasAppShell.tsx", "utf8");
    expect(shell).not.toContain("useAtlasResourceSnapshot");
    expect(shell).toContain("subscribeAtlasResourceSnapshot");
    expect(shell).toContain("writeResourceAttributes");
  });

  it("uses direct Drei runtime module imports", () => {
    const files = [
      "app/components/AtlasUniverseSceneRuntime.tsx",
      "app/components/UniverseScene.tsx",
      "app/components/ExoplanetSystemScene.tsx",
      "app/components/SelectedSkyTargetProxy.tsx",
    ];
    const source = files.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toContain('from "@react-three/drei"');
    expect(source).toContain("@react-three/drei/core/OrbitControls");
  });

  it("accepts a withdrawn legacy authority audit without promoting physics", () => {
    const audit: AtlasScientificEvidenceTruthAuditV286 = {
      version: "v286-scientific-evidence-truth-audit-v1",
      status: "scientific-qualification-corrected",
      v283: { status: "structural-gate-passed-science-qualification-withdrawn", executionCount: 128, carterCaptureCount: 0, kerrSchildCaptureCount: 0, uniqueRedshiftResidualCount: 1, uniqueEvpaResidualCount: 1, positiveBracketWidthCount: 0, reasons: ["degenerate"] },
      v284: { status: "quarantined-nonauthoritative-1-of-49", completedShardCount: 1, authorityInheritedFromWithdrawnGate: true },
      historicalArtifactsMutated: false,
      formalProductPointer: "v263",
      defaultKernel: "legacy-eih-1pn",
      evidenceSha256: "a".repeat(64),
    };
    expect(validateAtlasScientificEvidenceTruthAuditV286(audit)).toBe(true);
  });
});
