import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrScienceProductAdmissionV476,
  createKerrScienceProductAdmissionSummaryV476,
  parseKerrScienceProductAdmissionArtifactV476,
  resolveKerrScienceProductAdmissionV476,
} from "./kerrScienceProductAdmissionV476";

const input = JSON.parse(
  readFileSync("dist/science/kerr-science-product-admission-v476/admission.json", "utf8"),
);
const sha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrScienceProductAdmissionV476(value)).digest("hex");

describe("v476 science product admission", () => {
  it("verifies the canonical artifact and exact 2/9 admission split", () => {
    const artifact = parseKerrScienceProductAdmissionArtifactV476(input);

    expect(sha(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.products.filter((entry) => entry.available).map((entry) => entry.id)).toEqual([
      "sparse-observable-hud",
      "sparse-vector-export",
    ]);
    expect(artifact.products.filter((entry) => !entry.available)).toHaveLength(7);
    expect(Object.isFrozen(artifact.products)).toBe(true);
  });

  it("allows sparse authority but rejects raster without placeholders", () => {
    const summary = createKerrScienceProductAdmissionSummaryV476(input);
    const sparse = resolveKerrScienceProductAdmissionV476(summary, {
      productId: "sparse-observable-hud",
      deliveryProfile: "local-shadow",
      renderMode: "science",
    });
    const raster = resolveKerrScienceProductAdmissionV476(summary, {
      productId: "science-raster",
      deliveryProfile: "local-shadow",
      renderMode: "science",
    });

    expect(sparse).toMatchObject({ allowed: true, recordCount: 4, placeholderUsed: false });
    expect(sparse.scienceBufferSha256).toBe(summary.scienceBufferSha256);
    expect(raster).toMatchObject({
      allowed: false,
      reason: "blocked-production-admission",
      scienceBufferSha256: null,
      recordCount: 0,
      presentationFallbackUsed: false,
      placeholderUsed: false,
      scienceWritebackAllowed: false,
    });
  });

  it("keeps cinematic, standalone and Lite from widening science authority", () => {
    const summary = createKerrScienceProductAdmissionSummaryV476(input);
    const cinematicRaster = resolveKerrScienceProductAdmissionV476(summary, {
      productId: "science-raster",
      deliveryProfile: "local-shadow",
      renderMode: "cinematic",
    });
    const standaloneSparse = resolveKerrScienceProductAdmissionV476(summary, {
      productId: "sparse-vector-export",
      deliveryProfile: "standalone-full",
      renderMode: "science",
    });
    const liteSparse = resolveKerrScienceProductAdmissionV476(summary, {
      productId: "sparse-vector-export",
      deliveryProfile: "vercel-lite",
      renderMode: "science",
    });

    expect(cinematicRaster.allowed).toBe(false);
    expect(cinematicRaster.presentationFallbackUsed).toBe(false);
    expect(standaloneSparse).toMatchObject({ allowed: false, reason: "local-shadow-only" });
    expect(liteSparse).toMatchObject({ allowed: false, reason: "lite-boundary" });
  });
});
