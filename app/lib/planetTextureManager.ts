import * as THREE from "three";
import {
  textureManifestEntryForBodyId,
  type PlanetTextureManifestEntry,
} from "../data/planetTextureManifest";
import { atlasAssetCandidates } from "./atlasAssetResolver";

export type BodyTextureSlots = {
  albedo?: THREE.Texture;
  normal?: THREE.Texture;
  clouds?: THREE.Texture;
  cloudAlpha?: THREE.Texture;
  night?: THREE.Texture;
  nightMask?: THREE.Texture;
  ringColorMap?: THREE.Texture;
  ringAlphaMap?: THREE.Texture;
  roughness?: THREE.Texture;
  bandMask?: THREE.Texture;
};
export type TextureQualityTier = "high" | "medium" | "low";

type TextureSlotKey = keyof PlanetTextureManifestEntry;
type LoadTask = {
  url: string;
  colorSpace: THREE.ColorSpace;
  slot: TextureSlotKey;
};

const SLOT_COLOR_SPACE: Record<keyof PlanetTextureManifestEntry, THREE.ColorSpace> = {
  albedo: THREE.SRGBColorSpace,
  normal: THREE.LinearSRGBColorSpace,
  clouds: THREE.SRGBColorSpace,
  cloudAlpha: THREE.LinearSRGBColorSpace,
  night: THREE.SRGBColorSpace,
  nightMask: THREE.LinearSRGBColorSpace,
  ringColorMap: THREE.SRGBColorSpace,
  ringAlphaMap: THREE.LinearSRGBColorSpace,
  roughness: THREE.LinearSRGBColorSpace,
  bandMask: THREE.LinearSRGBColorSpace,
};

function configureTexture(
  tex: THREE.Texture,
  colorSpace: THREE.ColorSpace,
  anisotropyMax: number,
  slot: TextureSlotKey,
  qualityTier: TextureQualityTier,
) {
  const tierCap = qualityTier === "low" ? 4 : qualityTier === "medium" ? 8 : 16;
  const slotCap = slot === "albedo" ? tierCap : Math.max(2, Math.floor(tierCap / 2));
  tex.colorSpace = colorSpace;
  tex.anisotropy = Math.min(slotCap, anisotropyMax);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
}

export function collectPlanetTextureLoadTasks(
  bodyIds: string[],
  extraNormalById?: Record<string, string | undefined>,
): LoadTask[] {
  const seen = new Set<string>();
  const tasks: LoadTask[] = [];

  const push = (
    url: string | undefined,
    colorSpace: THREE.ColorSpace,
    slot: TextureSlotKey,
  ) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    tasks.push({ url, colorSpace, slot });
  };

  for (const id of bodyIds) {
    const m = textureManifestEntryForBodyId(id);
    (Object.keys(m) as (keyof PlanetTextureManifestEntry)[]).forEach((key) => {
      const url = m[key];
      if (url) push(url, SLOT_COLOR_SPACE[key], key);
    });
    const n = extraNormalById?.[id];
    if (n) push(n, THREE.LinearSRGBColorSpace, "normal");
  }

  return tasks;
}

/**
 * Preload through the content-pack resolver while retaining manifest URLs as map keys.
 * Failed candidates are skipped and progress advances when each logical asset settles.
 */
export function preloadPlanetTextureUrls(
  tasks: LoadTask[],
  gl: THREE.WebGLRenderer,
  onProgress?: (loaded: number, total: number) => void,
  qualityTier: TextureQualityTier = "medium",
): Promise<Map<string, THREE.Texture>> {
  const aniso = gl.capabilities.getMaxAnisotropy();
  const byUrl = new Map<string, THREE.Texture>();

  if (tasks.length === 0) {
    onProgress?.(0, 0);
    return Promise.resolve(byUrl);
  }

  const loader = new THREE.TextureLoader();
  let settled = 0;
  return Promise.all(tasks.map(async (task) => {
    for (const candidate of atlasAssetCandidates(task.url)) {
      try {
        const tex = await loader.loadAsync(candidate);
        configureTexture(tex, task.colorSpace, aniso, task.slot, qualityTier);
        byUrl.set(task.url, tex);
        break;
      } catch {
        // Continue through local pack, remote pack, and core fallback candidates.
      }
    }
    settled += 1;
    onProgress?.(settled, tasks.length);
  })).then(() => byUrl);
}

export function assembleBodyTextureSlots(
  bodyIds: string[],
  byUrl: Map<string, THREE.Texture>,
  extraNormalById?: Record<string, string | undefined>,
): Record<string, BodyTextureSlots> {
  const out: Record<string, BodyTextureSlots> = {};

  for (const id of bodyIds) {
    const m = textureManifestEntryForBodyId(id);
    const slot: BodyTextureSlots = {};
    if (m.albedo && byUrl.has(m.albedo)) slot.albedo = byUrl.get(m.albedo);
    if (m.normal && byUrl.has(m.normal)) slot.normal = byUrl.get(m.normal);
    if (m.clouds && byUrl.has(m.clouds)) slot.clouds = byUrl.get(m.clouds);
    if (m.night && byUrl.has(m.night)) slot.night = byUrl.get(m.night);
    if (m.ringColorMap && byUrl.has(m.ringColorMap))
      slot.ringColorMap = byUrl.get(m.ringColorMap);
    if (m.ringAlphaMap && byUrl.has(m.ringAlphaMap))
      slot.ringAlphaMap = byUrl.get(m.ringAlphaMap);
    const extraN = extraNormalById?.[id];
    if (extraN && byUrl.has(extraN)) slot.normal = byUrl.get(extraN);
    out[id] = slot;
  }

  return out;
}
