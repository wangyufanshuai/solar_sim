import { describe, expect, it } from "vitest";
import {
  evaluateAtlasReleaseReadinessV240,
  type AtlasReleaseGateMapV240,
} from "./atlasReleaseReadinessV240";

const passingProductGates: AtlasReleaseGateMapV240 = {
  "evidence-consistent": true,
  typescript: true,
  rust: true,
  regression: true,
  "standalone-build": true,
  "lite-build": true,
  "content-packs": true,
  "visual-40-frame": true,
  "fresh-browser-qa": true,
  accessibility: true,
  "lifecycle-30-cycle": true,
  "bundle-budget": true,
  "rtx4060-performance": true,
};

describe("v240 release readiness", () => {
  it("keeps incomplete research shadow without blocking a passed local Web outcome", () => {
    const readiness = evaluateAtlasReleaseReadinessV240({
      productGates: passingProductGates,
      denseKerrComplete: false,
      variationalStmQualified: false,
      perBodyNoRegression: false,
      scientificPromotionQualified: false,
      desktopArtifactsBuilt: true,
      desktopSigned: false,
      externalInstallReportPassed: false,
    });
    expect(readiness.product.outcome).toBe("orbit-atlas-web-1.0.0-ga-ready-local");
    expect(readiness.research.outcome).toBe("relativity-v12-research-candidate-shadow-retained");
    expect(readiness.research.defaultKernel).toBe("legacy-eih-1pn");
    expect(readiness.desktop.outcome).toBe("desktop-1.0.0-beta.1-unsigned-rc");
  });

  it("fails the product outcome closed on any missing product gate", () => {
    const readiness = evaluateAtlasReleaseReadinessV240({
      productGates: { ...passingProductGates, "fresh-browser-qa": false },
      denseKerrComplete: true,
      variationalStmQualified: true,
      perBodyNoRegression: true,
      scientificPromotionQualified: true,
      desktopArtifactsBuilt: true,
      desktopSigned: true,
      externalInstallReportPassed: true,
    });
    expect(readiness.product.passed).toBe(false);
    expect(readiness.product.blockers).toEqual(["fresh-browser-qa"]);
  });

  it("never represents scientific qualification as a runtime promotion", () => {
    const readiness = evaluateAtlasReleaseReadinessV240({
      productGates: passingProductGates,
      denseKerrComplete: true,
      variationalStmQualified: true,
      perBodyNoRegression: true,
      scientificPromotionQualified: true,
      desktopArtifactsBuilt: true,
      desktopSigned: false,
      externalInstallReportPassed: false,
    });
    expect(readiness.research.outcome).toBe("relativity-v12-promotion-qualified-not-applied");
    expect(readiness.research.candidateRuntimePolicy).toBe("offline-shadow");
  });
});
