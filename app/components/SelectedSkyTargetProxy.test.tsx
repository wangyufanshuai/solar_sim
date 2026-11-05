import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  STELLAR_CORONA_FRAGMENT_SHADER_V594,
  STELLAR_CORONA_VERTEX_SHADER_V594,
  STELLAR_HALO_FRAGMENT_SHADER,
  STELLAR_HALO_VERTEX_SHADER_V594,
  STELLAR_SURFACE_FRAGMENT_SHADER_V594,
  STELLAR_SURFACE_VERTEX_SHADER_V594,
  assertStellarShaderUniformParityV594,
  createStellarCoronaUniformsV594,
  createStellarHaloUniformsV594,
  createStellarSurfaceUniformsV594,
} from "./StellarPortraitMaterial";
import { stellarMaterialProfile } from "../lib/stellarMaterialProfile";
import { STELLAR_HERO_BY_ID_V592 } from "../lib/stellarHeroesV592";
import {
  createStellarPortraitProfileFromRenderContractV594,
  createStellarPortraitRenderContractV594,
} from "../lib/stellarPortraitRenderContractV594";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v595 selected stellar target render bridge", () => {
  it("observes each actual surface, halo and corona draw without making decorative draws readiness authority", () => {
    const proxy = read("app/components/SelectedSkyTargetProxy.tsx");
    for (const layer of ["surface", "halo", "corona"]) {
      expect(proxy).toContain(`ref={${layer}MeshRef}`);
      expect(proxy).toContain(`${layer}MeshRef.current !== this`);
      expect(proxy).toContain(`observeCanonicalStellarLayerV636(this, hero.id, "${layer}")`);
    }
    expect((proxy.match(/canonicalProducer\.rendered\(\)/g) ?? [])).toHaveLength(1);
    expect(proxy).toMatch(/observeCanonicalStellarLayerV636\(this, hero\.id, "surface"\);\s+canonicalProducer\.rendered\(\)/);
    expect(proxy).not.toContain("releaseRegistry");
  });
  it("routes only stellar descriptors into the portrait and binds hero contracts", () => {
    const proxy = read("app/components/SelectedSkyTargetProxy.tsx");
    expect(proxy).toContain("isStellarSkyTargetFocusDescriptor(descriptor)");
    expect(proxy).toContain("createStellarPortraitRenderContractV594(hero, effectiveMode)");
    expect(proxy).toContain("createStellarPortraitProfileFromRenderContractV594");
    expect(proxy).toContain("JULIAN_DATE_J2000_V592 + simDaysRef.current");
    expect(proxy).toContain('atlasCandidate: "v595"');
    expect(proxy).toContain("atlasStellarRenderContractSha256");
    expect(proxy).toContain("atlasStellarPhenomenologySha256");
    expect(proxy).toContain("atlasStellarBinaryOrbitClaim: false");
    expect(proxy).toContain("atlasStellarGeometrySignature");
    expect(proxy).toContain("data-stellar-render-contract-sha256");
    expect(proxy).toContain("data-stellar-phenomenology-sha256");
    expect(proxy).toContain("data-stellar-phenomenology-variability-state");
    expect(proxy).toContain("data-stellar-phenomenology-pulsation-state");
    expect(proxy).toContain("data-stellar-phenomenology-binary-state");
    expect(proxy).toContain("data-stellar-phenomenology-binary-orbit-claim");
    expect(proxy).toContain("data-stellar-render-authoritative=\"false\"");
    expect(proxy).toContain("renderContract.companions.entries.filter");
    expect(proxy).not.toContain("Math.random");
  });

  it("compiles logarithmic-depth support into every custom stellar shader", () => {
    for (const vertex of [
      STELLAR_SURFACE_VERTEX_SHADER_V594,
      STELLAR_CORONA_VERTEX_SHADER_V594,
      STELLAR_HALO_VERTEX_SHADER_V594,
    ]) {
      expect(vertex).toContain("#include <common>");
      expect(vertex).toContain("#include <logdepthbuf_pars_vertex>");
      expect(vertex).toContain("#include <logdepthbuf_vertex>");
    }
    for (const fragment of [
      STELLAR_SURFACE_FRAGMENT_SHADER_V594,
      STELLAR_CORONA_FRAGMENT_SHADER_V594,
      STELLAR_HALO_FRAGMENT_SHADER,
    ]) {
      expect(fragment).toContain("#include <logdepthbuf_pars_fragment>");
      expect(fragment).toContain("#include <logdepthbuf_fragment>");
    }
  });

  it("feeds contract phase, gravity, octave and authority fields to the material", () => {
    const shader = read("app/components/StellarPortraitMaterial.tsx");
    expect(shader).toContain("resolveStellarPortraitRotationPhaseV594");
    expect(shader).toContain("resolveStellarPortraitEvolutionPhaseV594");
    expect(shader).toContain("uGravityDarkening");
    expect(shader).toContain("uGranulationOctaves");
    expect(shader).toContain("uRapidRotatorFactor");
    expect(shader).toContain("uPulsationAmplitude");
    expect(shader).toContain("uPresentationEnhancement");
    expect(shader).toContain("atlasStellarAuthoritative: false");
    expect(shader).not.toContain("Math.random");
    expect(shader).not.toContain("uniform float uTime");
  });

  it("keeps declared stellar shader uniforms symmetric and finite", () => {
    const hero = STELLAR_HERO_BY_ID_V592.achernar;
    const contract = createStellarPortraitRenderContractV594(hero, "cinematic");
    const material = stellarMaterialProfile({
      id: hero.id,
      colorBpRp: hero.colorBpRp,
      mag: hero.apparentMagnitudeV,
      parallaxMas: hero.parallaxMas,
    });
    const portrait = createStellarPortraitProfileFromRenderContractV594(contract, material);
    const surface = createStellarSurfaceUniformsV594(portrait, contract.mode, contract);
    const corona = createStellarCoronaUniformsV594(portrait, contract.mode, contract);
    const halo = createStellarHaloUniformsV594(portrait, contract.mode, contract);
    expect(() => assertStellarShaderUniformParityV594(
      [STELLAR_SURFACE_VERTEX_SHADER_V594, STELLAR_SURFACE_FRAGMENT_SHADER_V594],
      surface,
    )).not.toThrow();
    expect(() => assertStellarShaderUniformParityV594(
      [STELLAR_CORONA_VERTEX_SHADER_V594, STELLAR_CORONA_FRAGMENT_SHADER_V594],
      corona,
    )).not.toThrow();
    expect(() => assertStellarShaderUniformParityV594(
      [STELLAR_HALO_VERTEX_SHADER_V594, STELLAR_HALO_FRAGMENT_SHADER],
      halo,
    )).not.toThrow();
    expect(surface.uSignaturePhase.value).toBe(portrait.visualSignature.signaturePhaseRad);
    expect(surface.uSignatureFrequency.value)
      .toBe(portrait.visualSignature.signatureFrequency);
    expect(surface.uCellAnisotropy.value).toBe(portrait.visualSignature.cellAnisotropy);
    expect(surface.uRadiativeBands.value)
      .toBe(portrait.visualSignature.radiativeBandStrength);
    expect(surface.uConvectiveCells.value)
      .toBe(portrait.visualSignature.convectiveCellStrength);
    expect(surface.uWindFilaments.value)
      .toBe(portrait.visualSignature.windFilamentStrength);
    expect(surface.uPolarRadiance.value).toBe(portrait.visualSignature.polarRadiance);
    expect(surface.uEquatorialShade.value).toBe(portrait.visualSignature.equatorialShade);
  });

  it("varies representative signature uniforms and closes presentation layers in science", () => {
    const profiles = ["sirius-a", "betelgeuse", "achernar"].map((id) => {
      const hero = STELLAR_HERO_BY_ID_V592[id as keyof typeof STELLAR_HERO_BY_ID_V592];
      const contract = createStellarPortraitRenderContractV594(hero, "cinematic");
      const material = stellarMaterialProfile({
        id: hero.id,
        colorBpRp: hero.colorBpRp,
        mag: hero.apparentMagnitudeV,
        parallaxMas: hero.parallaxMas,
      });
      return createStellarPortraitProfileFromRenderContractV594(contract, material);
    });
    expect(new Set(profiles.map((profile) =>
      createStellarSurfaceUniformsV594(profile, "cinematic").uSignatureFrequency.value,
    )).size).toBe(3);
    expect(new Set(profiles.map((profile) =>
      createStellarSurfaceUniformsV594(profile, "cinematic").uCellAnisotropy.value,
    )).size).toBeGreaterThan(1);

    const hero = STELLAR_HERO_BY_ID_V592.achernar;
    const science = createStellarPortraitRenderContractV594(hero, "science");
    const material = stellarMaterialProfile({
      id: hero.id,
      colorBpRp: hero.colorBpRp,
      mag: hero.apparentMagnitudeV,
      parallaxMas: hero.parallaxMas,
    });
    const profile = createStellarPortraitProfileFromRenderContractV594(science, material);
    expect(createStellarSurfaceUniformsV594(profile, "science", science)
      .uPresentationEnhancement.value).toBe(0);
    expect(createStellarCoronaUniformsV594(profile, "science", science).uStrength.value)
      .toBe(0);
    expect(createStellarHaloUniformsV594(profile, "science", science).uStrength.value)
      .toBe(0);
  });
});
