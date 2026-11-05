import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import { atlasRuntimeStore } from "./atlasRuntimeStore";
import {
  ATLAS_SCIENCE_AUTHORITY_POINTER_V585,
  ATLAS_VISUAL_AUTHORITY_POINTER_V585,
  ATLAS_VISUAL_LANES_V585,
  stableVisualManifestV585,
} from "./atlasVisualAuthorityV585";
import { ATLAS_VISUAL_CANDIDATE_ASSETS_V562 } from "./atlasVisualCandidateV562";

const root = process.cwd();
const sha256 = (path: string) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");

const frozenFiles = Object.freeze({
  "public/textures/sky/orbit-atlas-v9-base-8k.jpg": "9d52abb4774cdca473606f514158b72a5af5950fa283e53d703b983a83ff1df2",
  "public/textures/sky/orbit-atlas-v9-base-4k.jpg": "eea88c57a8fd769c0ca70bcd53006a0314b9e8fab40dba1ad4a8b2317c24a0dc",
  "public/textures/sky/orbit-atlas-v9-stars-4k.jpg": "4c22311b7b87d2b003312a548aca2c904bbade5d9edfaf8cca8b085928cd873c",
  "public/textures/sky/orbit-atlas-v9-stars-2k.jpg": "613625b6d2b71dd943cf62c90b33a9d12522e38f99df50ebc7e9ec60c5f17d65",
  "public/textures/sky/orbit-atlas-v9-dust-2k.jpg": "8011f424415f9e8b3841f6a36ce2a63dcdbc5b5161395dc484104e352d9169ce",
  "dist/release/orbit-atlas-current-product-evidence-v263.json": "5f59d18a66d4415747e1068213b5e1acf719b3ce4e10cb20bc58713f40b2ac5b",
  "dist/release/orbit-atlas-v263-local-validation-dossier.md": "d527985afa205c34fb099ad7975e58f432084f0185e14fd4454e1c0f6cbf7ea1",
  "dist/release/orbit-atlas-v263-local-validation-evidence.json": "00d2c6b1f55abb4e7be110d9f0f81ab35f86c1e6beb0fe7291a5e984da742757",
});

function resolveSourceImport(from: string, specifier: string): string | null {
  const base = resolve(dirname(from), specifier);
  const candidates = extname(base)
    ? [base]
    : [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, resolve(base, "index.ts"), resolve(base, "index.tsx")];
  return candidates.find((candidate) => existsSync(candidate) && /\.(?:ts|tsx|js|mjs)$/.test(candidate)) ?? null;
}

function importGraph(entry: string): Set<string> {
  const pending = [resolve(root, entry)];
  const visited = new Set<string>();
  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || visited.has(file)) continue;
    visited.add(file);
    const source = readFileSync(file, "utf8");
    const specifiers = new Set<string>();
    for (const pattern of [/(?:import|export)[^"']*?from\s*["'](\.[^"']+)["']/g, /import\(\s*["'](\.[^"']+)["']\s*\)/g, /import\s*["'](\.[^"']+)["']/g]) {
      for (const match of source.matchAll(pattern)) specifiers.add(match[1]);
    }
    for (const specifier of specifiers) {
      const dependency = resolveSourceImport(file, specifier);
      if (dependency && dependency.startsWith(resolve(root, "app"))) pending.push(dependency);
    }
  }
  return visited;
}

describe("v585 Stable/Preview visual freeze", () => {
  it("restores every Legacy V9 asset and preserves historical v263 evidence byte-for-byte", () => {
    for (const [path, expected] of Object.entries(frozenFiles)) {
      expect(existsSync(resolve(root, path)), path).toBe(true);
      expect(sha256(path), path).toBe(expected);
    }
  });

  it("keeps science and visual authority pointers independent", () => {
    expect(ATLAS_SCIENCE_AUTHORITY_POINTER_V585).toEqual({ formalProductPointer: "v263", defaultScientificKernel: "legacy-eih-1pn", visualPointerCoupled: false });
    expect(ATLAS_VISUAL_AUTHORITY_POINTER_V585.lane).toBe("stable-v263-legacy-v9");
    expect(ATLAS_VISUAL_AUTHORITY_POINTER_V585.formalProductPointerAdvanced).toBe(false);
    expect(ATLAS_VISUAL_AUTHORITY_POINTER_V585.productionAliasSwitchAllowed).toBe(false);
    expect(stableVisualManifestV585()).toBe(ORBIT_ATLAS_V9_SKY);
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
    expect(atlasRuntimeStore.getServerSnapshot().visualProfile).toBe("legacy-v9");
  });

  it("removes CandidateV, v562 and local-shadow modules from the stable root graph", () => {
    const graph = [...importGraph("app/page.tsx")].map((path) => path.replaceAll("\\", "/"));
    const forbidden = graph.filter((path) => /CandidateV|candidate-v562|local-shadow-v562/i.test(path));
    expect(forbidden).toEqual([]);
    const sphere = readFileSync(resolve(root, "app/components/GalaxyEnvironmentSphere.tsx"), "utf8");
    expect(sphere).toContain("layerManifest = ORBIT_ATLAS_SKY");
    expect(sphere).not.toContain("ATLAS_VISUAL_RUNTIME_SKY_V562");
  });

  it("admits candidate and experimental lanes only through explicit local-shadow activation", () => {
    expect(ATLAS_VISUAL_LANES_V585.stable.activation).toBe("implicit-formal-default");
    expect(ATLAS_VISUAL_LANES_V585.candidate).toMatchObject({ id: "candidate-v562", activation: "explicit-route-only", routes: ["/local-shadow-v562"] });
    expect(ATLAS_VISUAL_LANES_V585.experimental.activation).toBe("explicit-hero-control-only");
    const route = readFileSync(resolve(root, "app/local-shadow-v562/page.tsx"), "utf8");
    expect(route).toContain('data-atlas-visual-lane="candidate-v562"');
    expect(route).toContain("ATLAS_VISUAL_RUNTIME_SKY_V562");
  });

  it("derives the Vercel direct-asset allowlist from the candidate catalog", () => {
    const ignore = readFileSync(resolve(root, ".vercelignore"), "utf8");
    const block = ignore.split("# BEGIN v585 manifest-driven candidate allowlist")[1]?.split("# END v585 manifest-driven candidate allowlist")[0] ?? "";
    for (const asset of ATLAS_VISUAL_CANDIDATE_ASSETS_V562) expect(block).toContain(`!${asset.sourcePath}`);
    expect(block).not.toContain("orbit-atlas-v9");
  });
});
