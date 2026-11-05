import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FINAL_ART_ACCEPTED_SOURCE_BOUNDARIES_V593,
  FINAL_ART_BUDGETS_V593,
  FINAL_ART_CONTENT_PACK_POLICY_V593,
  FINAL_ART_DIRECTION_BOUNDARY_V593,
  FINAL_ART_DIRECTION_ROUTE_V593,
  FINAL_ART_GOLDEN_MATRIX_V593,
  FINAL_ART_SIGNATURE_PASSES_V593,
  evaluateFinalArtBudgetV593,
  resolvePrimaryObservationContextV593,
} from "./finalArtDirectionV593";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Orbit Atlas v593 Final Art Direction and Product RC", () => {
  it("adds a client-only additive route while retaining formal v263", () => {
    const page = read("app/local-shadow-v593/page.tsx");
    const lazy = read("app/components/OrbitAtlasFinalArtDirectionV593Lazy.tsx");
    expect(FINAL_ART_DIRECTION_ROUTE_V593).toBe("/local-shadow-v593");
    expect(page).toContain("OrbitAtlasFinalArtDirectionV593Lazy");
    expect(page).toContain('data-atlas-formal-product-pointer="v263"');
    expect(lazy).toContain("next/dynamic");
    expect(lazy).toContain("ssr: false");
  });

  it("owns a compact R3F host while keeping the v592 scene as a read-only stage", () => {
    const shell = read("app/components/OrbitAtlasFinalArtDirectionV593.tsx");
    const observatory = read("app/components/FinalArtObservatoryShellV593.tsx");
    const canvasHost = read("app/components/FinalArtCanvasHostV593.tsx");
    const stage = read("app/components/FinalArtStageV593.tsx");
    expect(shell).toContain("FinalArtObservatoryShellV593");
    expect(observatory).toContain("FinalArtCanvasHostV593");
    expect(canvasHost.match(/<Canvas\b/g)).toHaveLength(1);
    expect(stage).toContain("LivingUniverseStageV592");
    expect(observatory).toContain('data-atlas-v593-canvas-count="1"');
    expect(observatory).toContain('data-atlas-v593-scientific-writeback="false"');
    expect(FINAL_ART_DIRECTION_BOUNDARY_V593).toEqual(expect.objectContaining({
      additiveOnly: true,
      formalProductPointer: "v263",
      baseline: "v592-readonly",
      singleCanvasRequired: true,
      catalogExpansionAllowed: false,
      productionReleaseAuthorized: false,
    }));
  });

  it("gates the measured same-realm lifecycle contract behind the exact audit query", () => {
    const observatory = read("app/components/FinalArtObservatoryShellV593.tsx");
    const canvasHost = read("app/components/FinalArtCanvasHostV593.tsx");
    expect(observatory).toContain('getAll("lifecycleAudit")');
    expect(observatory).toContain('values.length === 1 && values[0] === SAME_REALM_LIFECYCLE_QUERY_V593');
    expect(observatory).toContain('data-atlas-v593-lifecycle-audit');
    expect(observatory).toContain('data-atlas-v593-lifecycle-phase');
    expect(observatory).toContain('data-atlas-v593-lifecycle-action="mount"');
    expect(observatory).toContain('data-atlas-v593-lifecycle-action="detach"');
    expect(observatory).toContain('data-atlas-v593-lifecycle-action="exit"');
    expect(observatory).toContain('href="/downloads"');
    expect(observatory).toContain('prefetch={false}');
    expect(observatory).toContain('onNavigate={exitLifecycleAudit}');
    expect(observatory).toContain('"__atlasV593SameRealmSceneExitV1"');
    expect(observatory).toContain('"v593-same-realm-scene-exit-v1"');
    expect(observatory).toContain('FINAL_ART_SOURCE_MANIFEST_SHA256_V593');
    expect(observatory).toContain('NEXT_PUBLIC_ATLAS_V593_BUILD_FINGERPRINT');
    expect(observatory).not.toContain("about:blank");
    expect(observatory).not.toContain("buildId:");
    expect(canvasHost).toContain("getAtlasResourceSnapshot()");
    expect(canvasHost).toContain('renderTargetsSource: renderTargets === null');
    expect(canvasHost).toContain("renderLists.dispose = wrappedRenderListsDispose");
    expect(canvasHost).toContain('canvas.addEventListener("webglcontextlost"');
    expect(canvasHost).toContain("canvas.isConnected");
    expect(canvasHost).not.toContain("forceContextLoss(");
  });

  it("resolves sky focus as primary context and exposes it from the v593 shell", () => {
    const context = resolvePrimaryObservationContextV593({
      selectedObjectKind: "body-hero",
      selectedObjectId: "saturn",
      selectedBodyId: "saturn",
      focusTarget: "orion",
    });
    expect(context).toEqual({
      kind: "sky-reference",
      id: "orion",
      label: "Orion · 猎户座",
      secondaryBodyId: "saturn",
      presentationOnly: true,
    });
    const shell = read("app/components/FinalArtObservatoryShellV593.tsx");
    expect(shell).toContain('data-atlas-v593-focus-kind');
    expect(shell).toContain('data-atlas-v593-inspector');
    expect(shell).toContain('"sky-reference"');
  });

  it("requires a v593-owned WebGL material bridge for signature progress", () => {
    const bridge = read("app/components/SignatureArtDirectionBridgeV593.tsx");
    expect(bridge).toContain("JUPITER_FRAGMENT_V593");
    expect(bridge).toContain("SOLAR_PHOTOSPHERE_FRAGMENT_V593");
    expect(bridge).toContain("SOLAR_CHROMOSPHERE_FRAGMENT_V593");
    expect(bridge).toContain("vec3 hash3V593(vec3 p)");
    expect(bridge).toContain("sdo-hmi-source-local-contrast-observed-sunspot-limb-darkening");
    expect(bridge).toContain("sdo-aia-source-bounded-rim-and-spicules");
    expect(bridge).toContain("v592-physical-days-latitude-law-preserved");
    expect(bridge).toContain("STELLAR_SURFACE_FRAGMENT_V593");
    expect(bridge).toContain("atlasV593SignatureMaterial");
    expect(bridge).toContain("deterministic-domain-warped-multiscale-convection-no-hard-voronoi-cells");
    expect(bridge).toContain("fineField");
    expect(bridge).toContain("granulePotential");
    expect(bridge).toContain("fineContourLane");
    expect(bridge).not.toContain("cellularV593");
    expect(bridge).not.toContain("domainCellV593");
    expect(bridge).toContain("STELLAR_SIGNATURE_PROFILES_V593");
    expect(bridge).toContain("symmetric-clean-inset-reconstruction-6.48deg-repeat-sampling");
    expect(bridge).toContain("SATURN_SURFACE_FRAGMENT_V593");
    expect(bridge).toContain("SATURN_RING_FRAGMENT_V593");
    expect(bridge).toContain("bounded-henyey-greenstein-forward-backward");
    expect(bridge).toContain("optical-depth-ray-plane-transmission");
    expect(bridge).toContain("analytic-ray-sphere-penumbra");
    expect(bridge).toContain("EARTH_SURFACE_FRAGMENT_V593");
    expect(bridge).toContain("EARTH_CLOUD_FRAGMENT_V593");
    expect(bridge).toContain("EARTH_ATMOSPHERE_FRAGMENT_V593");
    expect(bridge).toContain("blue-marble-gebco-roughness-ggx-ocean-black-marble-terminator");
    expect(bridge).toContain("dual-layer-source-opacity-self-shadow-silver-lining");
    expect(bridge).toContain("bounded-rayleigh-mie-optical-path-twilight");
    expect(bridge).toContain("DEEP_SKY_SPHERE_FRAGMENT_V593");
    expect(bridge).toContain("#include <common>");
    expect(bridge).toContain("DEEP_FIELD_FRAGMENT_V593");
    expect(bridge).toContain("uSliceIndexV593");
    expect(bridge).toContain("DEEP_STAR_POINT_FRAGMENT_V593");
    expect(bridge).toContain("DEEP_STAR_PSF_FRAGMENT_V593");
    expect(bridge).toContain("seam-safe-nine-tap-source-reconstruction-bounded-direction-microstructure");
    expect(bridge).toContain("source-background-separated-frequency-layered-organic-aperture-black-level-reconstruction");
    expect(bridge).toContain("sourceFilament");
    expect(bridge).toContain("sourceBackground");
    expect(bridge).toContain("sourceMorphology");
    expect(bridge).toContain("sourceBoundaryWarp");
    expect(bridge).toContain("nebulaAperture");
    expect(bridge).toContain("atlasV593DeepSkySourceTargets");
    expect(bridge).toContain("catalog-coordinate-and-linear-sky-no-observation-image");
    expect(bridge).toContain("gaia-flux-preserving-moffat-airy-no-random-twinkle");
    expect(bridge).toContain("implemented-code-gates-pending");
    expect(bridge).toContain("restore-original-on-focus-change-or-unmount");
    expect(bridge).toContain('atlasV593ScientificWriteback = "false"');
    const observatory = read("app/components/FinalArtObservatoryShellV593.tsx");
    expect(observatory).toContain('get("art") !== "baseline"');
    expect(observatory).toContain("data-atlas-v593-same-build-art-ab");
    expect(observatory).toContain("v592-same-build-baseline");
    expect(observatory).toContain('"jupiter-cinematic-grs"');
    expect(observatory).toContain("2_461_287.71598");
    expect(observatory).toContain('"jupiter-seam-audit"');
    expect(observatory).toContain("2_461_287.04239991");
    expect(observatory).toContain('data-atlas-v593-frame-preset');
    expect(observatory).toContain('"saturn-cinematic-front"');
    expect(observatory).toContain('"saturn-cinematic-backlight"');
    expect(observatory).toContain('"saturn-cinematic-ring-shadow"');
    expect(observatory).toContain('"sun-science-signature"');
    expect(observatory).toContain('"sun-cinematic-signature"');
    expect(observatory).toContain('"earth-seam-audit"');
    expect(observatory).toContain("2_461_269.331542");
    expect(observatory).toContain('"galactic-core-science"');
    expect(observatory).toContain('"galactic-core-cinematic"');
    expect(observatory).toContain('"orion-cinematic"');
    expect(observatory).toContain('"heart-nebula-cinematic"');
    expect(observatory).toContain('"andromeda-cinematic"');
    expect(observatory).toContain('data-atlas-v593-rotation-w0-blocked="bennu,kleopatra"');
    expect(observatory).toContain("data-atlas-v592-nebula-marker");
    expect(observatory).toContain("data-atlas-v592-deep-space-marker");
    const standalone = read("scripts/start-atlas-v593-standalone.mjs");
    expect(standalone).toContain("ensureRuntimeTree");
    expect(standalone).toContain('join(root, "public", "textures")');
    expect(standalone).toContain("v593-runtime-file-mismatch");
    const candidateBuilder = read("scripts/build-v593-final-art-direction-candidate.mjs");
    const candidateVerifier = read("scripts/verify-v593-final-art-direction-candidate.mjs");
    const candidateResealer = read("scripts/seal-v593-final-art-direction-candidate.mjs");
    expect(candidateBuilder).toContain("assertHistoricalRecord");
    expect(candidateBuilder).toContain('status: "historical-receipt-verified-current-source-revalidation-pending"');
    expect(candidateBuilder).toContain('currentSourceRevalidationEvidence: "docs/release/v593/final-sealed-browser-matrix-v593.json"');
    expect(candidateBuilder).toContain('currentSourceBound: false');
    expect(candidateVerifier).toContain("verifyHistoricalRecord");
    expect(candidateVerifier).toContain('currentSourceBound !== false');
    expect(candidateVerifier).toContain('currentSourceRevalidation !== "passed-current-sealed-build"');
    expect(candidateVerifier).toContain("humanVisualSignoff.exactAbStage ?? humanVisualSignoff.captureCorrection");
    expect(candidateVerifier).toContain('humanVisualSignoff.userDecision.path.replaceAll("\\\\", "/")');
    expect(candidateResealer).toContain('evidencePath(humanVisualSignoff.userDecision, "human-user-decision")');
    const sealedBrowserGate = read("scripts/build-v593-final-sealed-browser-gate.mjs");
    expect(sealedBrowserGate).toContain("sealed-golden-matrix-current-source-final");
    expect(sealedBrowserGate).toContain("Codex-in-app-browser-visual-review+Playwright-CLI-exact-viewport");
    expect(sealedBrowserGate).toContain("blocked-runner-ignored-requested-dimensions");
  });

  it("locks the finite signature and golden-frame scope", () => {
    expect(FINAL_ART_SIGNATURE_PASSES_V593).toHaveLength(6);
    expect(FINAL_ART_SIGNATURE_PASSES_V593.filter((pass) => pass.state === "implemented-code-gates-pending").map((pass) => pass.id))
      .toEqual(["sun", "earth", "jupiter", "saturn", "stellar-archetypes", "deep-sky"]);
    expect(FINAL_ART_GOLDEN_MATRIX_V593).toHaveLength(42);
    expect(new Set(FINAL_ART_GOLDEN_MATRIX_V593.map((frame) => frame.id)).size).toBe(42);
    expect(FINAL_ART_GOLDEN_MATRIX_V593.filter((frame) => frame.viewport === "1440x900")).toHaveLength(36);
    expect(FINAL_ART_GOLDEN_MATRIX_V593.filter((frame) => frame.viewport === "390x844")).toHaveLength(6);
  });

  it("treats source gaps as disclosed boundaries instead of procedural replacements", () => {
    expect(FINAL_ART_ACCEPTED_SOURCE_BOUNDARIES_V593).toHaveLength(6);
    expect(FINAL_ART_ACCEPTED_SOURCE_BOUNDARIES_V593.filter((entry) => entry.state === "asset-blocked").map((entry) => entry.id))
      .toEqual(["triton-global-visual-asset", "miranda-global-visual-asset", "titania-global-visual-asset"]);
    expect(FINAL_ART_ACCEPTED_SOURCE_BOUNDARIES_V593.filter((entry) => entry.state === "asset-blocked")
      .every((entry) => entry.runtimePolicy === "catalog-only-no-procedural-fallback")).toBe(true);
  });

  it("projects real externalization headroom for Lite and Full", () => {
    const lite = evaluateFinalArtBudgetV593(
      FINAL_ART_BUDGETS_V593.inheritedLiteBytes,
      5_163_538,
      FINAL_ART_BUDGETS_V593.liteShellMaximumBytes,
    );
    const full = evaluateFinalArtBudgetV593(
      FINAL_ART_BUDGETS_V593.inheritedFullBytes,
      87_384_877,
      FINAL_ART_BUDGETS_V593.observatoryDefaultMaximumBytes,
    );
    expect(lite.status).toBe("passed");
    expect(full.status).toBe("passed");
    expect(FINAL_ART_CONTENT_PACK_POLICY_V593.maximumResidentHighResolutionBodyPacks).toBe(1);
  });

  it("gives bare Vitest a repository boundary that excludes tmp and Playwright", () => {
    const config = read("vitest.config.mts");
    expect(config).toContain('"app/**/*.test.{ts,tsx}"');
    expect(config).toContain('"tmp/**"');
    expect(config).toContain('"tests/**"');
    expect(config).toContain('"**/playwright*.{ts,tsx}"');
  });
});
