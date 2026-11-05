import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrPhotonEvidenceWorkbenchV480,
  createKerrPhotonEvidenceWorkbenchSummaryV480,
  parseKerrPhotonEvidenceWorkbenchArtifactV480,
} from "./kerrPhotonEvidenceWorkbenchV480";

const input = JSON.parse(
  readFileSync("dist/science/kerr-photon-evidence-workbench-v480/workbench.json", "utf8"),
);
const canonicalSha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrPhotonEvidenceWorkbenchV480(value)).digest("hex");

describe("v480 photon evidence workbench", () => {
  it("verifies the bounded artifact and exact upstream stages", () => {
    const artifact = parseKerrPhotonEvidenceWorkbenchArtifactV480(input);
    expect(canonicalSha(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.stages.map((stage) => stage.id)).toEqual([
      "v475-dual-render-boundary",
      "v476-product-admission",
      "v479-frequency-provenance",
    ]);
    expect(artifact.provenance).toHaveLength(4);
  });

  it("keeps sparse-science and frequency buffer identities distinct", () => {
    const summary = createKerrPhotonEvidenceWorkbenchSummaryV480(input);
    expect(summary.buffers.sparseScienceBufferSha256).not.toBe(
      summary.buffers.normalizedFrequencyBufferSha256,
    );
    expect(summary.buffers.scienceViewFrequencyBufferSha256).toBe(
      summary.buffers.normalizedFrequencyBufferSha256,
    );
    expect(summary.buffers.cinematicViewFrequencyBufferSha256).toBe(
      summary.buffers.normalizedFrequencyBufferSha256,
    );
    expect(summary.buffers.scienceViewAndCinematicViewShareFrequencyBuffer).toBe(true);
  });

  it("admits only two sparse products and fail-closes seven production products", () => {
    const artifact = parseKerrPhotonEvidenceWorkbenchArtifactV480(input);
    const allowed = artifact.products.filter((product) => product.available);
    const blocked = artifact.products.filter((product) => !product.available);
    expect(allowed.map((product) => product.id)).toEqual([
      "sparse-observable-hud",
      "sparse-vector-export",
    ]);
    expect(blocked).toHaveLength(7);
    expect(blocked.every((product) => product.recordCount === 0 && product.blockedBy.length > 0)).toBe(
      true,
    );
    expect(artifact.boundary.scienceRasterAuthorityGranted).toBe(false);
    expect(artifact.boundary.fitsWriteAllowed).toBe(false);
    expect(artifact.boundary.pngWriteAllowed).toBe(false);
  });

  it("preserves normalized-only provenance and zero science writeback", () => {
    const artifact = parseKerrPhotonEvidenceWorkbenchArtifactV480(input);
    expect(artifact.provenance.reduce((count, row) => count + row.sampleCount, 0)).toBe(20);
    expect(artifact.audit.absoluteFrequencyRows).toBe(0);
    expect(artifact.audit.physicalBandpassRows).toBe(0);
    expect(artifact.audit.sciencePixelRows).toBe(0);
    expect(artifact.audit.scienceWritebackCount).toBe(0);
    expect(artifact.boundary.denseCampaignStatus).toBe("incomplete-0-of-49");
  });
});
