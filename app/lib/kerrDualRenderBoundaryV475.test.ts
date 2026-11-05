import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrDualRenderPayloadV475,
  countKerrPresentationScientificFieldsV475,
  createKerrDualRenderSummaryV475,
  parseKerrDualRenderArtifactV475,
  resolveKerrDualRenderViewV475,
} from "./kerrDualRenderBoundaryV475";

const input = JSON.parse(
  readFileSync("dist/science/kerr-dual-render-boundary-v475/dual-render.json", "utf8"),
);
const sha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrDualRenderPayloadV475(value)).digest("hex");

describe("v475 dual render boundary", () => {
  it("verifies the artifact and immutable science buffer SHAs", () => {
    const artifact = parseKerrDualRenderArtifactV475(input);

    expect(sha(artifact)).toBe(artifact.artifactSha256);
    expect(sha(artifact.scienceBuffer)).toBe(artifact.scienceBuffer.scienceBufferSha256);
    expect(artifact.scienceBuffer.rayIds).toEqual(["disk-00", "disk-01", "disk-02", "disk-03"]);
    expect(Object.isFrozen(artifact.scienceBuffer)).toBe(true);
  });

  it("shares one science buffer object across stable cached views", () => {
    const summary = createKerrDualRenderSummaryV475(input);
    const science = resolveKerrDualRenderViewV475(summary, "science");
    const cinematic = resolveKerrDualRenderViewV475(summary, "cinematic");

    expect(science.scienceBuffer).toBe(cinematic.scienceBuffer);
    expect(science.scienceBufferSha256).toBe(cinematic.scienceBufferSha256);
    expect(resolveKerrDualRenderViewV475(summary, "science")).toBe(science);
    expect(science.presentation).not.toBe(cinematic.presentation);
  });

  it("keeps presentation buffers free of exact scientific fields", () => {
    const artifact = parseKerrDualRenderArtifactV475(input);

    expect(countKerrPresentationScientificFieldsV475(artifact.presentation)).toBe(0);
    expect(countKerrPresentationScientificFieldsV475({ bloomIntensity: 0.18 })).toBe(0);
    expect(countKerrPresentationScientificFieldsV475({ intensity: 1 })).toBe(1);
    expect(artifact.presentation.science).toMatchObject({
      linearDisplay: true,
      bloomIntensity: 0,
      colorGradeIntensity: 0,
      grain: 0,
      chromaticAberration: 0,
      seed: null,
    });
    expect(artifact.audit.presentationWritebackCount).toBe(0);
  });
});
