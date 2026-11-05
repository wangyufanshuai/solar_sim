import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { classifyAtlasProxyPathV562 } from "./atlasProxyContractV562";
import {
  CELESTIAL_CONVERGENCE_BOUNDARY_V591,
  CELESTIAL_CONVERGENCE_ROUTE_V591,
  V591_ALL_HERO_IDS,
  V591_CORE_HERO_ORDER,
  V591_HERO_FRAME_MAX_WIDTH_RATIO,
  heroFrameFitsV591,
  nextCelestialConvergencePhaseV591,
} from "./celestialConvergenceV591";

const root = process.cwd();
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]));
}
const canonicalSha = (value: unknown) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function readSealed(path: string, field = "receiptSha256") {
  const document = JSON.parse(readFileSync(resolve(root, path), "utf8"));
  const unsigned = { ...document };
  delete unsigned[field];
  expect(canonicalSha(unsigned), path).toBe(document[field]);
  return document;
}

describe("v591 celestial convergence contract", () => {
  it("opens only through the existing generic local-shadow proxy contract", () => {
    expect(classifyAtlasProxyPathV562("GET", CELESTIAL_CONVERGENCE_ROUTE_V591, "local-shadow")).toBe("next");
    expect(classifyAtlasProxyPathV562("GET", CELESTIAL_CONVERGENCE_ROUTE_V591, "standalone-full")).toBe("redirect-root");
  });

  it("locks the additive scientific boundary and P1 hero order", () => {
    expect(CELESTIAL_CONVERGENCE_BOUNDARY_V591).toMatchObject({
      formalProductPointer: "v263",
      runtimeBaseline: "v590-readonly",
      scientificPayloadWriteback: false,
      scientificAuthorityChanged: false,
      productionPromotionAllowed: false,
      gitMutationAllowed: false,
      singleCanvasRequired: true,
    });
    expect(V591_ALL_HERO_IDS).toHaveLength(16);
    expect(V591_CORE_HERO_ORDER).toEqual(["sun", "earth", "moon", "mars", "jupiter", "saturn"]);
    expect(nextCelestialConvergencePhaseV591(new Set(["p0-governance"]))).toBe("p1-core-heroes");
  });

  it("enforces the browser framing ceiling from measured pixels rather than camera-distance proxies", () => {
    expect(V591_HERO_FRAME_MAX_WIDTH_RATIO).toBe(0.92);
    expect(heroFrameFitsV591(true, 358.8, 390)).toBe(true);
    expect(heroFrameFitsV591(true, 358.81, 390)).toBe(false);
    expect(heroFrameFitsV591(true, 71.99, 390)).toBe(false);
    expect(heroFrameFitsV591(false, 320, 390)).toBe(false);
    expect(heroFrameFitsV591(true, Number.NaN, 390)).toBe(false);
  });

  it("keeps every v590 sealed source byte unchanged", () => {
    const manifest = JSON.parse(readFileSync(resolve(root, "docs/release/v590/source-manifest-v590.json"), "utf8"));
    expect(manifest.status).toBe("complete");
    expect(manifest.files).toHaveLength(36);
    for (const file of manifest.files) {
      const path = resolve(root, file.path);
      expect(existsSync(path), file.path).toBe(true);
      expect(sha256(readFileSync(path)), file.path).toBe(file.sha256);
    }
  });

  it("seals Lite size budgets and rejects Full Sun assets in the Lite dist", () => {
    const seal = readFileSync(resolve(root, "scripts/seal-v591-celestial-convergence-candidate.mjs"), "utf8");
    const verify = readFileSync(resolve(root, "scripts/verify-v591-celestial-convergence-candidate.mjs"), "utf8");
    expect(seal).toContain("liteIncrementBytesMaximum");
    expect(seal).toContain("liteTotalBytesMaximum");
    expect(seal).toContain("v591-full-ktx2-webp-excluded-from-lite-dist");
    expect(verify).toContain("v591-readonly-lite-increment-budget");
    expect(verify).toContain("v591-readonly-lite-packaging-isolation");
  });

  it("admits the bounded USGS/MOLA Mars packet while preserving every failed-source receipt", () => {
    const acquisition = readSealed("docs/release/v591/acquisition-receipt-mars.json");
    const identity = readSealed("docs/release/v591/mars-albedo-identity-audit.json");
    const fullBlock = readSealed("docs/release/v591/acquisition-blocked-mars-usgs-full.json");
    const nasa3dJpeg = readSealed("docs/release/v591/acquisition-blocked-mars-nasa3d-jpeg.json");
    const rejection = readSealed("docs/release/v591/mars-albedo-composite-rejection.json");
    const resample = readSealed("docs/release/v591/mars-albedo-usgs-resample-audit.json");
    const overlay = readSealed("public/data/celestial-convergence-v591/mars-asset-overlay.json");
    const manifest = JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/manifest.json"), "utf8"));
    expect(acquisition.status).toBe("acquired-single-request-no-retry");
    expect(acquisition.assets.map((asset: { id: string }) => asset.id)).toEqual([
      "mars-albedo-source-v591",
      "mars-mola-label-source-v591",
      "mars-mola-height-source-v591",
    ]);
    expect(identity.status).toBe("blocked-identity-mismatch");
    expect(identity.comparison.luminanceCorrelation).toBeLessThan(identity.comparison.thresholds.luminanceCorrelationMinimum);
    expect(fullBlock.status).toBe("blocked-resource-throughput");
    expect(fullBlock.automaticRetryPerformed).toBe(false);
    expect(nasa3dJpeg.status).toBe("blocked-no-automatic-retry");
    expect(nasa3dJpeg.automaticRetryPerformed).toBe(false);
    expect(rejection.status).toBe("rejected-upstream-license-and-product-identity-gap");
    expect(rejection.runtimeAdmission).toBe(false);
    expect(resample.status).toBe("passed-public-domain-source-bounded-resample");
    expect(resample.claims.nativeEightKObservation).toBe(false);
    expect(overlay.status).toBe("mars-usgs-viking-color-mola-terrain-admitted");
    expect(overlay.assets.map((asset: { id: string }) => asset.id)).toEqual(["mars-albedo", "mars-normal", "mars-roughness", "mars-height"]);
    expect(overlay.blockers).toEqual([]);
    expect(overlay.compositeRejectionReceiptSha256).toBe(rejection.receiptSha256);
    expect(overlay.albedoResampleAuditReceiptSha256).toBe(resample.receiptSha256);
    expect(manifest.heroBodies.mars.v591OverrideStatus).toBe("admitted");
    expect(manifest.runtime.v591HeroOverrideCount).toBe(16);
    for (const asset of overlay.assets) {
      const source = readFileSync(resolve(root, asset.source.path));
      expect(source.byteLength, asset.id).toBe(asset.source.bytes);
      expect(sha256(source), asset.id).toBe(asset.source.sha256);
      for (const variant of Object.values(asset.variants) as Array<{ url: string; bytes: number; sha256: string }>) {
        const bytes = readFileSync(resolve(root, `public/${variant.url.replace(/^\/+/, "")}`));
        expect(bytes.byteLength, variant.url).toBe(variant.bytes);
        expect(sha256(bytes), variant.url).toBe(variant.sha256);
      }
    }
  });

  it("binds both ice giants to the sealed registered-primary overlay without texture or measurement claims", () => {
    const overlay = readSealed("public/data/celestial-convergence-v591/ice-giant-primary-overlay.json");
    const manifest = JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/manifest.json"), "utf8"));
    expect(overlay.status).toBe("ice-giant-registered-primary-ready-for-runtime-admission");
    expect(overlay.modelPolicy).toBe("registered-analytical-primary-not-observational-texture");
    expect(overlay.noNetworkRequestsPerformed).toBe(true);
    expect(overlay.noAssetBytesCopied).toBe(true);
    expect(overlay.noTextureAssetsRequired).toBe(true);
    expect(overlay.bodies.map((body: { body: string }) => body.body)).toEqual(["uranus", "neptune"]);
    for (const body of overlay.bodies) {
      expect(body.proceduralPrimary).toBe(true);
      expect(body.proceduralFallback).toBe(false);
      expect(body.observationTextureClaim).toBe(false);
      expect(body.measuredPhotometryClaim).toBe(false);
      expect(manifest.heroBodies[body.body].v591OverrideStatus).toBe("admitted");
    }
    expect(manifest.heroAssetOverlays.slice(-2).map((entry: { body: string }) => entry.body)).toEqual(["uranus", "neptune"]);
    expect(manifest.heroAssetOverlays.slice(-2).every((entry: { overlaySha256: string }) => entry.overlaySha256 === overlay.receiptSha256)).toBe(true);
  });

  it("keeps capability Hero arrays in the canonical runtime order", () => {
    const manifest = JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/manifest.json"), "utf8"));
    const capability = readSealed("docs/release/v591/capability-report-v591.json", "reportSha256");
    expect(capability.capabilities.v591HeroOverrideBodies).toEqual(manifest.runtime.v591HeroOverrideBodies);
    expect(capability.capabilities.effectiveHeroAdmissions).toEqual(manifest.runtime.v591HeroOverrideBodies);
  });

  it("records the additive Gaia optics implementation without changing catalog authority", () => {
    const manifest = JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/manifest.json"), "utf8"));
    expect(manifest.starfield).toMatchObject({
      source: "Gaia-readonly",
      baseline: "v590-readonly",
      v591OverrideStatus: "implemented-v591-gaia-deterministic-psf",
      opticsVersion: "v591-gaia-moffat-airy-optics-v1",
      drawPolicy: "one-point-draw-plus-one-instanced-bright-psf-draw",
      faintDensityPolicy: "deterministic-source-id-thinning-anchor-preserving",
    });
  });
});
