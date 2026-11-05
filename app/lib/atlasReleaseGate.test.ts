import { describe, expect, it } from "vitest";
import {
  ATLAS_RELEASE_GATE_VERSION,
  createAtlasReleaseGateDomain,
  createAtlasReleaseGateSummary,
} from "./atlasReleaseGate";
import type { AtlasValidationDomain } from "./simulationDiagnosticsTypes";

const baseDomains: readonly AtlasValidationDomain[] = [
  domain("evidence-ledger", "Evidence Ledger", "ready"),
  domain("performance-budget", "Performance Budget", "informational"),
  domain("kerr-lab", "Kerr Studio", "ready"),
];

describe("Atlas Release Candidate Gate v36", () => {
  it("creates a deterministic local readiness rollup without command-status claims", () => {
    const first = createAtlasReleaseGateSummary({ validationDomains: baseDomains });
    const second = createAtlasReleaseGateSummary({ validationDomains: baseDomains });

    expect(first.version).toBe(ATLAS_RELEASE_GATE_VERSION);
    expect(first).toEqual(second);
    expect(first.status).toBe("ready");
    expect(first.blockerCount).toBe(0);
    expect(first.warningCount).toBe(0);
    expect(first.primaryMetric).toContain("domains 3");
    expect(first.trustedBoundary).toContain("does not run tests");
    expect("ciStatus" in first).toBe(false);
    expect("trustScore" in first).toBe(false);
  });

  it("maps failed domains to blockers and pending domains to warnings", () => {
    const summary = createAtlasReleaseGateSummary({
      validationDomains: [
        ...baseDomains,
        domain("solar-eih-1pn", "Solar EIH 1PN / JPL", "failed"),
        domain("report-studio", "Report Studio", "pending"),
      ],
    });

    expect(summary.status).toBe("failed");
    expect(summary.blockerCount).toBe(1);
    expect(summary.warningCount).toBe(1);
    expect(summary.failedDomainCount).toBe(1);
    expect(summary.pendingDomainCount).toBe(1);
  });

  it("creates a Validation Console domain that reuses the stable console panel action", () => {
    const summary = createAtlasReleaseGateSummary({ validationDomains: baseDomains });
    const releaseDomain = createAtlasReleaseGateDomain(summary);

    expect(releaseDomain).toEqual(
      expect.objectContaining({
        id: "release-gate",
        title: "Release Candidate Gate",
        source: ATLAS_RELEASE_GATE_VERSION,
        relatedNavigatorItemId: "panel:validation-console",
        relatedPanelId: "validation-console",
        relatedEvidenceClaimId: "release-candidate-gate",
      }),
    );
    expect(releaseDomain.boundary).toContain("does not run tests");
  });
});

function domain(
  id: AtlasValidationDomain["id"],
  title: string,
  status: AtlasValidationDomain["status"],
): AtlasValidationDomain {
  return {
    id,
    title,
    status,
    source: `${title} source`,
    model: `${title} model`,
    primaryMetric: `${title} metric`,
    boundary: `${title} boundary`,
    actionLabel: `Open ${title}`,
  };
}
