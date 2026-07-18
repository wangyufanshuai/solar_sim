import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ATLAS_KERR_OFFLINE_REFERENCE_SUMMARY_V208,
  ATLAS_RELATIVITY_RESEARCH_STATUS_V208,
  KERR_RAY_TRACE_QUALITY_TIERS_V3,
  RELATIVITY_RESEARCH_MODES_V9,
} from "./relativityResearchEvidenceV208";

describe("Orbit Atlas v208 relativity research boundary", () => {
  it("keeps the V9 candidate shadowed behind the legacy default", () => {
    expect(ATLAS_RELATIVITY_RESEARCH_STATUS_V208.defaultSolarKernel).toBe("legacy-eih-1pn");
    expect(ATLAS_RELATIVITY_RESEARCH_STATUS_V208.candidateKernelStatus).toBe("shadow-retained");
    expect(ATLAS_RELATIVITY_RESEARCH_STATUS_V208.runtimePromotionApplied).toBe(false);
    expect(RELATIVITY_RESEARCH_MODES_V9).toHaveLength(6);
  });

  it("exposes all four bounded ray-trace quality tiers", () => {
    expect(KERR_RAY_TRACE_QUALITY_TIERS_V3).toEqual([
      "mobile-safe",
      "interactive",
      "science-still",
      "offline-reference",
    ]);
    expect(ATLAS_KERR_OFFLINE_REFERENCE_SUMMARY_V208.maxNullConstraint).toBeLessThan(1e-10);
  });

  it("records a fail-closed research dossier", () => {
    const dossier = JSON.parse(
      readFileSync("dist/release/orbit-atlas-v208-relativity-dossier.json", "utf8"),
    );
    expect(dossier.status).toBe("relativity-v9-research-candidate-shadow-retained");
    expect(dossier.runtime.scientificPromotionApplied).toBe(false);
    expect(dossier.weakField.gate.promotionQualified).toBe(false);
    expect(dossier.weakField.researchAssets.passed).toBe(true);
    expect(dossier.strongField.gate.passed).toBe(true);
    expect(dossier.strongField.canonicalEvidenceSha256).toBe(
      ATLAS_KERR_OFFLINE_REFERENCE_SUMMARY_V208.canonicalEvidenceSha256,
    );
  });

  it("keeps the new renderer conditional and mobile target-free", () => {
    const renderer = readFileSync("app/components/KerrRayTraceRendererV3.tsx", "utf8");
    const scene = readFileSync("app/components/AtlasUniverseSceneRuntime.tsx", "utf8");
    expect(renderer).toContain('quality === "mobile-safe"');
    expect(renderer).toContain("WebGLRenderTarget");
    expect(renderer).toContain('quality === "science-still" ? 1024');
    expect(renderer).toContain('quality === "interactive" ? 192');
    expect(scene).toContain("rayTraceQuality");
  });

  it("does not import frozen live physics into the weak-field research contract", () => {
    const contract = readFileSync("app/lib/relativityResearchV9.ts", "utf8");
    const runner = readFileSync("scripts/run-relativity-reference-v9.py", "utf8");
    expect(contract).not.toMatch(/^import\s+.*(?:SolarSystemIntegrator|worker)/im);
    expect(runner).not.toMatch(/^(?:from\s+.*relativity-force-model|import\s+.*worker)/im);
    expect(runner).toContain("independent-scalar-research-runner-no-live-worker-physics-import");
  });
});
