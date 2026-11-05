import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrPhotonMetrologyCockpitV485,
  createKerrPhotonMetrologyCockpitSummaryV485,
  parseKerrPhotonMetrologyCockpitArtifactV485,
} from "./kerrPhotonMetrologyCockpitV485";

const input = JSON.parse(
  readFileSync("dist/science/kerr-photon-metrology-cockpit-v485/cockpit.json", "utf8"),
);
const canonicalSha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrPhotonMetrologyCockpitV485(value)).digest("hex");

describe("v485 photon metrology cockpit", () => {
  it("verifies the six-stage artifact and immutable stage chain", () => {
    const artifact = parseKerrPhotonMetrologyCockpitArtifactV485(input);
    expect(canonicalSha(artifact)).toBe(artifact.artifactSha256);
    expect(canonicalSha(artifact.stages)).toBe(artifact.stageChainSha256);
    expect(artifact.stages.map((stage) => stage.id)).toEqual([
      "v479-frequency-provenance",
      "v480-product-admission",
      "v481-landmark-transport",
      "v482-correlated-uncertainty",
      "v483-sensitivity-modes",
      "v484-identifiability",
    ]);
  });

  it("keeps large matrices, projections and execution records out of the summary", () => {
    const summary = createKerrPhotonMetrologyCockpitSummaryV485(input);
    expect(summary.audit.summaryMatrixElementCount).toBe(0);
    expect(summary.audit.summaryProjectionRecordCount).toBe(0);
    expect(summary.audit.summaryExecutionRecordCount).toBe(0);
    const serialized = JSON.stringify(summary);
    expect(serialized).not.toContain("moorePenrosePseudoInverse");
    expect(serialized).not.toContain("covarianceUpperBound");
    expect(serialized).not.toContain('"projections"');
  });

  it("exposes six whitelisted detail endpoints without auto-loading them", () => {
    const artifact = parseKerrPhotonMetrologyCockpitArtifactV485(input);
    expect(artifact.stages).toHaveLength(6);
    expect(artifact.stages.every((stage) => stage.detailEndpoint.startsWith("/api/atlas/relativity-evidence/"))).toBe(
      true,
    );
    expect(artifact.stages.every((stage) => stage.downloadHref.startsWith(`${stage.detailEndpoint}?download=`))).toBe(
      true,
    );
    expect(artifact.boundary.detailedArtifactsAutoLoaded).toBe(false);
  });

  it("preserves qualified sparse truth and fail-closed production capabilities", () => {
    const artifact = parseKerrPhotonMetrologyCockpitArtifactV485(input);
    expect(artifact.overview.normalizedFrequencySampleCount).toBe(20);
    expect(artifact.overview.allowedProductCount).toBe(2);
    expect(artifact.overview.blockedProductCount).toBe(7);
    expect(artifact.overview.identifiableDimension).toBe(1);
    expect(artifact.overview.unidentifiableDimension).toBe(4);
    expect(artifact.availability.detectorResponse).toBe("blocked");
    expect(artifact.availability.scienceRaster).toBe("blocked");
    expect(artifact.audit.sciencePixelRows).toBe(0);
  });
});
