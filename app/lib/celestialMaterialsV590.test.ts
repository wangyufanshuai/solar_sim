import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Browser } from "@playwright/test";
import { describe, expect, it } from "vitest";
import {
  ATMOSPHERE_FRAGMENT_V590,
  CELESTIAL_SURFACE_VERTEX_V590,
  EARTH_CLOUD_FRAGMENT_V590,
  EARTH_SURFACE_FRAGMENT_V590,
  GAS_GIANT_FRAGMENT_V590,
  ICE_GIANT_FRAGMENT_V590,
  ICE_RING_FRAGMENT_V590,
  RADIAL_RING_VERTEX_V590,
  REGOLITH_FRAGMENT_V590,
  ROCKY_SURFACE_FRAGMENT_V590,
  SATURN_PLANET_FRAGMENT_V590,
  SATURN_RING_FRAGMENT_V590,
  SOLAR_CHROMOSPHERE_FRAGMENT_V590,
  SOLAR_PHOTOSPHERE_FRAGMENT_V590,
  VENUS_SURFACE_FRAGMENT_V590,
  createRadialRingGeometryV590,
  deterministicBodyPhaseV590,
  radialRingGapTransmissionV590,
  sphereSegmentsV590,
} from "./celestialMaterialsV590";

const SURFACE_FRAGMENT_CASES_V590 = [
  ["solar-photosphere", SOLAR_PHOTOSPHERE_FRAGMENT_V590],
  ["solar-chromosphere", SOLAR_CHROMOSPHERE_FRAGMENT_V590],
  ["earth-surface", EARTH_SURFACE_FRAGMENT_V590],
  ["earth-cloud", EARTH_CLOUD_FRAGMENT_V590],
  ["atmosphere", ATMOSPHERE_FRAGMENT_V590],
  ["rocky-surface", ROCKY_SURFACE_FRAGMENT_V590],
  ["venus-surface", VENUS_SURFACE_FRAGMENT_V590],
  ["gas-giant", GAS_GIANT_FRAGMENT_V590],
  ["saturn-planet", SATURN_PLANET_FRAGMENT_V590],
  ["ice-giant", ICE_GIANT_FRAGMENT_V590],
  ["regolith", REGOLITH_FRAGMENT_V590],
] as const;

const RING_FRAGMENT_CASES_V590 = [
  ["saturn-ring", SATURN_RING_FRAGMENT_V590],
  ["ice-ring", ICE_RING_FRAGMENT_V590],
] as const;

function varyingContractV590(shader: string): Map<string, string> {
  return new Map([...shader.matchAll(/\bvarying\s+(\w+)\s+(\w+)\s*;/g)]
    .map((match) => [match[2], match[1]] as const));
}

describe("v590 celestial material helpers", () => {
  it("builds a deterministic annulus with true radial UV coordinates", () => {
    const geometry = createRadialRingGeometryV590(1.25, 2.35, 32, 4);
    const positions = geometry.getAttribute("position");
    const uvs = geometry.getAttribute("uv");
    expect(positions.count).toBe((32 + 1) * (4 + 1));
    expect(geometry.index?.count).toBe(32 * 4 * 6);
    expect(uvs.getX(0)).toBe(0);
    expect(uvs.getY(0)).toBe(0);
    expect(uvs.getX(positions.count - 1)).toBe(1);
    expect(uvs.getY(positions.count - 1)).toBe(1);
    expect(geometry.boundingSphere?.radius).toBeCloseTo(2.35, 5);
    expect(geometry.userData.atlasRadialUv).toBe(true);
    geometry.dispose();
  });

  it("rejects malformed ring geometry instead of producing NaN vertices", () => {
    expect(() => createRadialRingGeometryV590(2, 1)).toThrow("v590-ring-radius-invalid");
    expect(() => createRadialRingGeometryV590(1, 2, 8, 1)).toThrow("v590-ring-segments-invalid");
  });

  it("encodes Cassini and Encke as explicit low-transmission gaps", () => {
    expect(radialRingGapTransmissionV590(0.635)).toBeLessThan(0.06);
    expect(radialRingGapTransmissionV590(0.914)).toBeLessThan(0.15);
    expect(radialRingGapTransmissionV590(0.30)).toBeGreaterThan(0.99);
    expect(radialRingGapTransmissionV590(0.78)).toBeGreaterThan(0.99);
  });

  it("keeps body presentation phases deterministic and bounded", () => {
    const earth = deterministicBodyPhaseV590("earth");
    expect(earth).toBe(deterministicBodyPhaseV590("earth"));
    expect(earth).toBeGreaterThanOrEqual(0);
    expect(earth).toBeLessThan(Math.PI * 2);
    expect(earth).not.toBe(deterministicBodyPhaseV590("jupiter"));
  });

  it("uses low-cost overview geometry and richer focused geometry", () => {
    expect(sphereSegmentsV590(false, false)).toEqual([48, 32]);
    expect(sphereSegmentsV590(false, true)).toEqual([40, 24]);
    expect(sphereSegmentsV590(true, false)).toEqual([128, 88]);
  });

  it("locks terminators to the Sun and carries the required material treatments", () => {
    expect(EARTH_SURFACE_FRAGMENT_V590).toContain("normalize(uSunWorld - vWorldPosition)");
    expect(EARTH_SURFACE_FRAGMENT_V590).toContain("oceanGlint");
    expect(EARTH_SURFACE_FRAGMENT_V590).toContain("cloudShadow");
    expect(EARTH_SURFACE_FRAGMENT_V590).toContain("nightGate");
    expect(ROCKY_SURFACE_FRAGMENT_V590).toContain("orenA");
    expect(ROCKY_SURFACE_FRAGMENT_V590).not.toContain("reflect(");
    expect(SATURN_RING_FRAGMENT_V590).toContain("cassiniTransmission");
    expect(SATURN_RING_FRAGMENT_V590).toContain("planetShadow");
    expect(SOLAR_PHOTOSPHERE_FRAGMENT_V590).toContain("seamSafePhotosphereV590");
    expect(SOLAR_PHOTOSPHERE_FRAGMENT_V590).not.toContain("clamp(vec2(n.z, n.y)");
  });

  it("keeps vertex-only matrices out of every fragment and links all varyings", () => {
    const surfaceVaryings = varyingContractV590(CELESTIAL_SURFACE_VERTEX_V590);
    const ringVaryings = varyingContractV590(RADIAL_RING_VERTEX_V590);
    for (const [name, fragment] of [...SURFACE_FRAGMENT_CASES_V590, ...RING_FRAGMENT_CASES_V590]) {
      expect(fragment, `${name} uses modelMatrix in fragment`).not.toMatch(/\bmodelMatrix\b/);
      expect(fragment, `${name} uses modelViewMatrix in fragment`).not.toMatch(/\bmodelViewMatrix\b/);
      expect(fragment, `${name} uses projectionMatrix in fragment`).not.toMatch(/\bprojectionMatrix\b/);
      const vertexVaryings = name.endsWith("ring") ? ringVaryings : surfaceVaryings;
      for (const [varying, type] of varyingContractV590(fragment)) {
        expect(vertexVaryings.get(varying), `${name} varying ${varying}`).toBe(type);
      }
    }
    expect(EARTH_SURFACE_FRAGMENT_V590).toContain("normalize(vWorldTangent)");
    expect(ROCKY_SURFACE_FRAGMENT_V590).toContain("normalize(vWorldBitangent)");
    expect(REGOLITH_FRAGMENT_V590).toContain("tangentNormalV590(");
  });

  it("uses the Three output and logarithmic-depth shader pipeline", () => {
    expect(CELESTIAL_SURFACE_VERTEX_V590).toContain("#include <logdepthbuf_pars_vertex>");
    expect(CELESTIAL_SURFACE_VERTEX_V590).toContain("#include <logdepthbuf_vertex>");
    expect(RADIAL_RING_VERTEX_V590).toContain("#include <logdepthbuf_pars_vertex>");
    expect(RADIAL_RING_VERTEX_V590).toContain("#include <logdepthbuf_vertex>");
    for (const [name, fragment] of [...SURFACE_FRAGMENT_CASES_V590, ...RING_FRAGMENT_CASES_V590]) {
      const colorWrite = fragment.lastIndexOf("gl_FragColor =");
      const toneMapping = fragment.lastIndexOf("#include <tonemapping_fragment>");
      const colorSpace = fragment.lastIndexOf("#include <colorspace_fragment>");
      const premultipliedAlpha = fragment.lastIndexOf("#include <premultiplied_alpha_fragment>");
      expect(fragment, name).toContain("#include <logdepthbuf_pars_fragment>");
      expect(fragment, name).toContain("#include <logdepthbuf_fragment>");
      expect(colorWrite, name).toBeGreaterThan(-1);
      expect(toneMapping, name).toBeGreaterThan(colorWrite);
      expect(colorSpace, name).toBeGreaterThan(toneMapping);
      expect(premultipliedAlpha, name).toBeGreaterThan(colorSpace);
    }
  });

  it("compiles and links every v590 planetary shader in headless Chromium WebGL", async () => {
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
    } catch (error: unknown) {
      // The static contract above remains mandatory on runners that do not
      // install Playwright Chromium. Other launch failures are real failures.
      if (error instanceof Error && /Executable doesn't exist|browser executable/i.test(error.message)) return;
      throw error;
    }
    try {
      const page = await browser.newPage();
      const threeModuleSource = readFileSync(resolve(process.cwd(), "node_modules/three/build/three.module.min.js"), "utf8");
      const cases = [
        ...SURFACE_FRAGMENT_CASES_V590.map(([name, fragmentShader]) => ({
          name,
          fragmentShader,
          vertexShader: CELESTIAL_SURFACE_VERTEX_V590,
          ring: false,
        })),
        ...RING_FRAGMENT_CASES_V590.map(([name, fragmentShader]) => ({
          name,
          fragmentShader,
          vertexShader: RADIAL_RING_VERTEX_V590,
          ring: true,
        })),
      ];
      const result = await page.evaluate(async ({ moduleSource, shaderCases }) => {
        const moduleUrl = URL.createObjectURL(new Blob([moduleSource], { type: "text/javascript" }));
        try {
          const importModule = new Function("url", "return import(url);") as (url: string) => Promise<typeof import("three")>;
          const THREE = await importModule(moduleUrl);
          const canvas = document.createElement("canvas");
          const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: false,
            logarithmicDepthBuffer: true,
          });
          renderer.setSize(32, 32, false);
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          const errors: Array<Readonly<{ name: string; program: string; vertex: string; fragment: string }>> = [];
          let currentName = "unknown";
          renderer.debug.checkShaderErrors = true;
          renderer.debug.onShaderError = (
            gl: WebGLRenderingContext | WebGL2RenderingContext,
            program: WebGLProgram,
            vertexShader: WebGLShader,
            fragmentShader: WebGLShader,
          ) => {
            errors.push({
              name: currentName,
              program: gl.getProgramInfoLog(program) ?? "",
              vertex: gl.getShaderInfoLog(vertexShader) ?? "",
              fragment: gl.getShaderInfoLog(fragmentShader) ?? "",
            });
          };
          const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
          camera.position.z = 3;
          for (const shaderCase of shaderCases) {
            for (const mode of ["science", "cinematic"] as const) {
              currentName = `${shaderCase.name}:${mode}`;
              const scene = new THREE.Scene();
              const geometry = shaderCase.ring
                ? new THREE.RingGeometry(0.55, 1, 32, 2)
                : new THREE.SphereGeometry(0.75, 24, 16);
              const material = new THREE.ShaderMaterial({
                vertexShader: shaderCase.vertexShader,
                fragmentShader: shaderCase.fragmentShader,
                toneMapped: mode === "cinematic",
                premultipliedAlpha: shaderCase.name.endsWith("ring") || shaderCase.name === "solar-chromosphere",
              });
              const mesh = new THREE.Mesh(geometry, material);
              scene.add(mesh);
              renderer.compile(scene, camera);
              renderer.render(scene, camera);
              geometry.dispose();
              material.dispose();
            }
          }
          const context = renderer.getContext();
          renderer.dispose();
          context.getExtension("WEBGL_lose_context")?.loseContext();
          return { errors, renderer: context instanceof WebGL2RenderingContext ? "webgl2" : "webgl1" };
        } finally {
          URL.revokeObjectURL(moduleUrl);
        }
      }, { moduleSource: threeModuleSource, shaderCases: cases });
      expect(result.errors, `${result.renderer} shader compile diagnostics`).toEqual([]);
    } finally {
      await browser.close();
    }
  }, 30_000);
});
