import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { stellarMaterialProfile } from "../lib/stellarMaterialProfile";
import { STELLAR_HERO_BY_ID_V592 } from "../lib/stellarHeroesV592";
import {
  createStellarPortraitProfileFromRenderContractV596,
  createStellarPortraitRenderContractV596,
} from "../lib/stellarPortraitRenderContractV596";
import {
  STELLAR_CORONA_FRAGMENT_SHADER_V596,
  STELLAR_CORONA_VERTEX_SHADER_V596,
  STELLAR_HALO_FRAGMENT_SHADER_V596,
  STELLAR_HALO_VERTEX_SHADER_V596,
  STELLAR_SURFACE_FRAGMENT_SHADER_V596,
  STELLAR_SURFACE_VERTEX_SHADER_V596,
  assertStellarShaderUniformParityV596,
  createStellarCoronaUniformsV596,
  createStellarHaloUniformsV596,
  createStellarSurfaceUniformsV596,
} from "./StellarPortraitMaterialV596";

const REPRESENTATIVE_IDS = [
  "sirius-a",
  "rigel",
  "alpha-centauri-a",
  "arcturus",
  "betelgeuse",
  "procyon-a",
  "achernar",
] as const;

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

function portraitFor(id: typeof REPRESENTATIVE_IDS[number], mode: "science" | "cinematic") {
  const hero = STELLAR_HERO_BY_ID_V592[id];
  const contract = createStellarPortraitRenderContractV596(hero, mode);
  const material = stellarMaterialProfile({
    id: hero.id,
    colorBpRp: hero.colorBpRp,
    mag: hero.apparentMagnitudeV,
    parallaxMas: hero.parallaxMas,
  });
  return {
    contract,
    portrait: createStellarPortraitProfileFromRenderContractV596(contract, material),
  };
}

describe("v596 stellar portrait material", () => {
  it("binds ordinary hero rendering to the V596 main-route consumer and preserves exact baselines", () => {
    const proxy = read("app/components/SelectedSkyTargetProxy.tsx");
    expect(proxy).toContain("createStellarPortraitRenderContractV596(hero, effectiveMode)");
    expect(proxy).toContain("createStellarPortraitProfileFromRenderContractV596");
    expect(proxy).toContain("hero && (!exactProfile || checkpointProfile)");
    expect(proxy).toContain("hero && exactProfile && !checkpointProfile");
    expect(proxy).toContain("createStellarPortraitRenderContractV594(hero, effectiveMode)");
    expect(proxy).toContain("<StellarPortraitMaterialV596");
    expect(proxy).toContain("<StellarCoronaMaterialV596");
    expect(proxy).toContain("<StellarHaloMaterialV596");
    expect(proxy).toContain("data-atlas-v596-stellar-morphology-sha256");
    expect(proxy).toContain("camera-plane-local-polar-axis-no-scientific-orientation-claim");
    expect(proxy).toContain('data-stellar-scientific-authority="false"');
    expect(proxy).toContain('data-stellar-radiative-transfer-authority="false"');
    expect(proxy).not.toContain("Math.random");
  });

  it("keeps all declared surface, corona and halo uniforms initialized and finite", () => {
    for (const id of REPRESENTATIVE_IDS) {
      for (const mode of ["science", "cinematic"] as const) {
        const { contract, portrait } = portraitFor(id, mode);
        const surface = createStellarSurfaceUniformsV596(portrait, contract);
        const corona = createStellarCoronaUniformsV596(portrait, contract);
        const halo = createStellarHaloUniformsV596(portrait, contract);
        expect(() => assertStellarShaderUniformParityV596(
          [STELLAR_SURFACE_VERTEX_SHADER_V596, STELLAR_SURFACE_FRAGMENT_SHADER_V596],
          surface,
        )).not.toThrow();
        expect(() => assertStellarShaderUniformParityV596(
          [STELLAR_CORONA_VERTEX_SHADER_V596, STELLAR_CORONA_FRAGMENT_SHADER_V596],
          corona,
        )).not.toThrow();
        expect(() => assertStellarShaderUniformParityV596(
          [STELLAR_HALO_VERTEX_SHADER_V596, STELLAR_HALO_FRAGMENT_SHADER_V596],
          halo,
        )).not.toThrow();
      }
    }
  });

  it("consumes every morphology uniform in an observable GLSL expression", () => {
    const { contract, portrait } = portraitFor("betelgeuse", "cinematic");
    const groups = [
      {
        shader: STELLAR_SURFACE_FRAGMENT_SHADER_V596,
        uniforms: createStellarSurfaceUniformsV596(portrait, contract),
      },
      {
        shader: STELLAR_CORONA_FRAGMENT_SHADER_V596,
        uniforms: createStellarCoronaUniformsV596(portrait, contract),
      },
      {
        shader: STELLAR_HALO_FRAGMENT_SHADER_V596,
        uniforms: createStellarHaloUniformsV596(portrait, contract),
      },
    ];
    for (const group of groups) {
      for (const name of Object.keys(group.uniforms)) {
        const references = group.shader.match(new RegExp(`\\b${name}\\b`, "g")) ?? [];
        expect(references.length, `${name} must be declared and consumed`).toBeGreaterThan(1);
      }
    }
  });

  it("keeps radiative fibers continuous across longitude and finite at both poles", () => {
    expect(STELLAR_SURFACE_FRAGMENT_SHADER_V596).not.toContain("atan(n.z, n.x)");
    expect(STELLAR_SURFACE_FRAGMENT_SHADER_V596)
      .toContain("vec3 fiberPosition = irregularNormal * uRadiativeFiberScale");
    expect(STELLAR_SURFACE_FRAGMENT_SHADER_V596)
      .toContain("dot(fiberPosition, normalize(vec3(1.0, 0.37, 0.61)))");
    expect(STELLAR_SURFACE_FRAGMENT_SHADER_V596)
      .toContain("float radiativeBreakup = fbmV596");
    expect(STELLAR_SURFACE_FRAGMENT_SHADER_V596)
      .toContain("float ridgedBreakup = 1.0 - abs(radiativeBreakup * 2.0 - 1.0)");
  });

  it("breaks wind filaments in continuous sphere space without an azimuth seam", () => {
    expect(STELLAR_CORONA_FRAGMENT_SHADER_V596).not.toContain("atan(");
    expect(STELLAR_CORONA_FRAGMENT_SHADER_V596)
      .toContain("float turbulence = fbmCoronaV596");
    expect(STELLAR_CORONA_FRAGMENT_SHADER_V596)
      .toContain("float brokenEnvelope = smoothstep");
    expect(STELLAR_CORONA_FRAGMENT_SHADER_V596)
      .toContain("float windKnots = smoothstep");
  });

  it("keeps science linear and disables presentation layers without changing morphology", () => {
    const science = portraitFor("procyon-a", "science");
    const cinematic = portraitFor("procyon-a", "cinematic");
    expect(science.contract.morphology.profileSha256)
      .toBe(cinematic.contract.morphology.profileSha256);
    expect(createStellarSurfaceUniformsV596(science.portrait, science.contract)
      .uPresentationEnhancement.value).toBe(0);
    expect(createStellarSurfaceUniformsV596(cinematic.portrait, cinematic.contract)
      .uPresentationEnhancement.value).toBe(1);
    expect(createStellarCoronaUniformsV596(science.portrait, science.contract)
      .uStrength.value).toBe(0);
    expect(createStellarHaloUniformsV596(science.portrait, science.contract)
      .uStrength.value).toBe(0);
  });
});
