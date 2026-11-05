import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { celestialCameraGoalV590 } from "./CelestialRenderingStageV590";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("v590 additive single-Canvas integration", () => {
  it("adds an isolated local-shadow route without migrating formal v263", () => {
    const page = read("app/local-shadow-v590/page.tsx");
    const lazy = read("app/components/OrbitAtlasCelestialRenderingV590Lazy.tsx");
    expect(page).toContain("OrbitAtlasCelestialRenderingV590Lazy");
    expect(page).toContain('data-atlas-formal-product-pointer="v263"');
    expect(lazy).toContain("local-shadow-only");
    expect(lazy).toContain("ssr: false");
  });

  it("uses exactly one Canvas and composes independent deep-space and body renderers", () => {
    const shell = read("app/components/OrbitAtlasCelestialRenderingV590.tsx");
    const host = read("app/components/UniverseCanvasOverrideHostV590.tsx");
    const stage = read("app/components/CelestialRenderingStageV590.tsx");
    expect(shell.match(/<UniverseCanvasOverrideHostV590/g)).toHaveLength(1);
    expect(shell).not.toContain("<Canvas");
    expect(host.match(/<UniverseCanvas/g)).toHaveLength(1);
    expect(host).not.toContain("<Canvas");
    expect(stage).toContain("<CelestialDeepSpaceV590");
    expect(stage).toContain("<CelestialBodiesV590");
    expect(shell).toContain('data-atlas-v590-canvas-count="1"');
  });

  it("keeps Science, Cinematic and Clean view outside scientific state", () => {
    const shell = read("app/components/OrbitAtlasCelestialRenderingV590.tsx");
    const stage = read("app/components/CelestialRenderingStageV590.tsx");
    expect(shell).toContain('data-atlas-v590-scientific-writeback="false"');
    expect(shell).toContain("createScientificProjectionStateV590");
    expect(shell).toContain("serializeScientificProjectionStateV590");
    expect(shell).toContain("CELESTIAL_RENDERING_SCIENTIFIC_PROJECTION_URL_V590");
    expect(shell).toContain('cache: "no-store"');
    expect(shell).toContain("scientificProjectionBaselineRef");
    expect(shell).toContain('"blocked-not-connected"');
    expect(shell).toContain('data-atlas-v590-scientific-projection-status');
    expect(shell).toContain("mutatePresentation");
    expect(shell).toContain("toggleCleanView");
    expect(stage).toContain("THREE.NoToneMapping");
    expect(stage).toContain("THREE.ACESFilmicToneMapping");
  });

  it("protects instrument-rail legibility without adding a scientific render layer", () => {
    const shell = read("app/components/OrbitAtlasCelestialRenderingV590.tsx");
    expect(shell).toContain('data-atlas-v590-hud-contrast-protection="celestial-rail"');
    expect(shell).toContain('data-atlas-v590-hud-contrast-protection="deep-field-rail"');
    expect(shell).toContain("linear-gradient(90deg,rgba(0,1,4,.88)");
    expect(shell).toContain("radial-gradient(ellipse_at_bottom_left,rgba(0,2,6,.86)");
  });

  it("makes closed mobile controls inert without hiding the sheet toggle", () => {
    const shell = read("app/components/OrbitAtlasCelestialRenderingV590.tsx");
    expect(shell).toContain('aria-controls="atlas-v590-mobile-controls"');
    expect(shell).toContain("aria-hidden={!open}");
    expect(shell).toContain("inert={!open}");
    expect(shell).toContain('data-atlas-v590-mobile-sheet-state={open ? "open" : "closed-inert"}');
  });

  it("exposes disposal and runtime audit probes", () => {
    const shell = read("app/components/OrbitAtlasCelestialRenderingV590.tsx");
    const stage = read("app/components/CelestialRenderingStageV590.tsx");
    expect(shell).toContain("atlas:v590-release-scene");
    expect(stage).toContain("disposeV590TextureLoader");
    expect(stage).toContain("gl.renderLists.dispose()");
    expect(stage).toContain("released-zero");
    expect(stage).toContain("atlasV590GpuBytes");
  });

  it("keeps standalone and Lite build evidence distinct and source-bound", () => {
    const wrapper = read("scripts/build-atlas-v590-profile.mjs");
    const builder = read("scripts/build-atlas-profile.mjs");
    const seal = read("scripts/seal-v590-celestial-rendering-candidate.mjs");
    const verify = read("scripts/verify-v590-celestial-rendering-candidate.mjs");
    expect(wrapper).toContain("atlas-v590-${suffix}-build-resource.json");
    expect(wrapper).toContain("ATLAS_CANDIDATE_SOURCE_MANIFEST_SHA256");
    expect(builder).toContain("ATLAS_BUILD_RECEIPT_NAME");
    expect(builder).toContain("candidateSourceManifestSha256");
    expect(seal).toContain("evaluateBuildGate");
    expect(verify).toContain("v590-readonly-build-receipt-drift");
  });

  it("hands OrbitControls back after deterministic focus transitions", () => {
    const stage = read("app/components/CelestialRenderingStageV590.tsx");
    expect(stage).toContain("transitionActive.current = false");
    expect(stage).toContain("controls.current.enabled = true");
    expect(stage).toContain("enabled={controlsEnabled}");
    expect(stage).toContain("CELESTIAL_CAMERA_UNIT_TARGET_DISTANCE_V590");
    expect(stage).toContain("CELESTIAL_CAMERA_MAX_DISTANCE_V590");
    expect(stage).not.toContain("multiplyScalar(200)");
  });

  it("adds mobile close-up breathing room without changing the body target", () => {
    const desktop = celestialCameraGoalV590("earth", [0, 16.5, 31.5], "desktop");
    const mobile = celestialCameraGoalV590("earth", [0, 16.5, 31.5], "mobile");
    const distance = (goal: typeof desktop) => Math.hypot(
      goal.position[0] - goal.target[0],
      goal.position[1] - goal.target[1],
      goal.position[2] - goal.target[2],
    );
    expect(mobile.target).toEqual(desktop.target);
    expect(distance(mobile) / distance(desktop)).toBeCloseTo(1.24, 12);
  });

  it("keeps deep-space cameras away from the solar-system origin while preserving the requested sightline", () => {
    const goal = celestialCameraGoalV590("milky-way-center", [0, 16.5, 31.5], "desktop");
    const direction = [
      goal.target[0] - goal.position[0],
      goal.target[1] - goal.position[1],
      goal.target[2] - goal.position[2],
    ] as const;
    const missDistance = Math.hypot(
      goal.position[1] * direction[2] - goal.position[2] * direction[1],
      goal.position[2] * direction[0] - goal.position[0] * direction[2],
      goal.position[0] * direction[1] - goal.position[1] * direction[0],
    ) / Math.hypot(...direction);
    expect(Math.hypot(...direction)).toBeCloseTo(1, 12);
    expect(missDistance).toBeGreaterThan(20);
  });

  it("never imports a frozen v589 implementation into the v590 shell", () => {
    for (const file of [
      "app/components/OrbitAtlasCelestialRenderingV590.tsx",
      "app/components/CelestialRenderingStageV590.tsx",
      "app/lib/celestialRenderingV590.ts",
      "app/lib/useV590Texture.ts",
    ]) {
      expect(read(file)).not.toMatch(/from ["'][^"']*V589/);
      expect(read(file)).not.toMatch(/from ["'][^"']*celestialArtV589/);
    }
  });
});
