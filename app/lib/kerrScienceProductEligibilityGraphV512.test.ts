import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrScienceProductEligibilityGraphV512,
  createKerrScienceProductEligibilityGraphSummaryV512,
  parseKerrScienceProductEligibilityGraphApiV512,
  parseKerrScienceProductEligibilityGraphArtifactV512,
} from "./kerrScienceProductEligibilityGraphV512";

const artifact = JSON.parse(
  readFileSync(
    "dist/science/kerr-science-product-eligibility-v512/eligibility-graph.json",
    "utf8",
  ),
);

describe("v512 science product eligibility graph", () => {
  it("locks ten nodes and twelve dependency edges without granting image authority", () => {
    const parsed = parseKerrScienceProductEligibilityGraphArtifactV512(artifact);
    expect(parsed.nodes).toHaveLength(10);
    expect(parsed.edges).toHaveLength(12);
    expect(parsed.counts).toMatchObject({
      qualifiedNodeCount: 3,
      blockedNodeCount: 5,
      incompleteNodeCount: 1,
      notRunNodeCount: 1,
      fitsHeaderCards: 22,
      wcsCoordinateRows: 4,
      sparsePhotonRows: 4,
      sparseValueRows: 0,
      detectorProjectionRows: 0,
      measuredResponseRows: 0,
      electronExpectationRows: 0,
      scienceRasterRows: 0,
      fitsHduCount: 0,
      pngCount: 0,
    });
    expect(parsed.nodes.every((node) => !node.grantsScienceImageAuthority)).toBe(true);
    expect(
      createHash("sha256")
        .update(canonicalKerrScienceProductEligibilityGraphV512(parsed))
        .digest("hex"),
    ).toBe(parsed.artifactSha256);
  });

  it("allows coordinate/table products while keeping FITS and PNG blocked", () => {
    const summary = createKerrScienceProductEligibilityGraphSummaryV512(artifact);
    expect(summary.decision).toMatchObject({
      coordinateOnlyScienceDisplayAllowed: true,
      sparsePhotonTableAllowed: true,
      detectorImageAuthorityGranted: false,
      scienceProductPromotionAllowed: false,
      fitsWriteAllowed: false,
      pngWriteAllowed: false,
      localShadowDefaultApplied: false,
    });
    expect(summary.products.find((product) => product.id === "wcs-coordinate-overlay")).toMatchObject({
      availability: "qualified",
      scienceAuthority: true,
      detectorImageClaimAllowed: false,
    });
    expect(summary.products.find((product) => product.id === "science-fits-hdu")?.availability).toBe(
      "blocked",
    );
    expect(summary.products.find((product) => product.id === "science-png-raster")?.availability).toBe(
      "blocked",
    );
  });

  it("preserves the Science/Cinematic V7 measurement boundary", () => {
    const parsed = parseKerrScienceProductEligibilityGraphArtifactV512(artifact);
    expect(parsed.visualBoundary).toMatchObject({
      profileId: "science-cinematic-v7-v457",
      scienceLinearDisplay: true,
      scienceBloomDisabled: true,
      scienceGradeDisabled: true,
      cinematicSeed: "orbit-atlas-v457-cinematic-seed-01",
      cinematicMayStyleCoordinates: true,
      cinematicMayClaimDetectorImage: false,
      scientificFieldMutation: false,
      localShadowOnly: true,
      defaultApplied: false,
    });
  });

  it("parses API summaries and rejects forged promotion", () => {
    const summary = createKerrScienceProductEligibilityGraphSummaryV512(artifact);
    expect(
      parseKerrScienceProductEligibilityGraphApiV512({
        version: "v512-kerr-science-product-eligibility-graph-api-v1",
        available: true,
        reason: "ready",
        summary,
      }).available,
    ).toBe(true);
    const forged = JSON.parse(JSON.stringify(artifact));
    forged.decision.scienceProductPromotionAllowed = true;
    expect(() => parseKerrScienceProductEligibilityGraphArtifactV512(forged)).toThrow(
      "v512-science-product-eligibility-boundary",
    );
  });
});
