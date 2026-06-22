import * as THREE from "three";

/** 远距离时 Sprite 光点至少占用的屏幕像素，避免完全不可见。 */
export const MIN_PLANET_ICON_PX = 10;
/** 投影直径小于此值（px）时切换为发光 sprite（与 EXIT 形成滞回）。 */
export const SPRITE_LOD_ENTER_PX = 12;
export const SPRITE_LOD_EXIT_PX = 18;

export const DEFAULT_SPHERE_SEGMENTS: [number, number] = [128, 128];

let sharedPlanetGlowTex: THREE.CanvasTexture | null = null;
export function getSharedPlanetGlowTexture(): THREE.CanvasTexture {
  if (sharedPlanetGlowTex) return sharedPlanetGlowTex;
  const size = 256;
  const half = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(half, half, 0, half, half, half);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.15, "rgba(255,255,255,0.7)");
  g.addColorStop(0.35, "rgba(255,255,255,0.3)");
  g.addColorStop(0.6, "rgba(255,255,255,0.08)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  sharedPlanetGlowTex = new THREE.CanvasTexture(canvas);
  sharedPlanetGlowTex.colorSpace = THREE.SRGBColorSpace;
  return sharedPlanetGlowTex;
}

const proceduralPlanetTextures = new Map<string, THREE.DataTexture>();

function hash2(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function paletteForBody(bodyId: string, base: THREE.Color): [THREE.Color, THREE.Color, THREE.Color] {
  if (bodyId === "jupiter") {
    return [new THREE.Color("#b88757"), new THREE.Color("#e2cba2"), new THREE.Color("#68412f")];
  }
  if (bodyId === "saturn") {
    return [new THREE.Color("#aa8f5e"), new THREE.Color("#ddc99c"), new THREE.Color("#6f6044")];
  }
  if (bodyId === "uranus") {
    return [new THREE.Color("#6bb3bf"), new THREE.Color("#b4e0e3"), new THREE.Color("#2d6472")];
  }
  if (bodyId === "neptune") {
    return [new THREE.Color("#315fa8"), new THREE.Color("#88b5ff"), new THREE.Color("#182c58")];
  }
  if (bodyId === "earth") {
    return [new THREE.Color("#244f8d"), new THREE.Color("#6b8d55"), new THREE.Color("#d6d3ba")];
  }
  if (bodyId === "mars") {
    return [new THREE.Color("#8d4b2c"), new THREE.Color("#c38255"), new THREE.Color("#3e251e")];
  }
  if (bodyId === "moon" || bodyId === "mercury") {
    return [new THREE.Color("#77736c"), new THREE.Color("#b7b0a3"), new THREE.Color("#34312d")];
  }
  const dark = base.clone().multiplyScalar(0.52);
  const light = base.clone().lerp(new THREE.Color("#ffffff"), 0.42);
  const accent = base.clone().lerp(new THREE.Color("#0d1420"), 0.38);
  return [dark, light, accent];
}

export function getProceduralPlanetTexture(
  bodyId: string,
  baseColor: THREE.Color,
): THREE.DataTexture {
  const key = `${bodyId}:${baseColor.getHexString()}`;
  const cached = proceduralPlanetTextures.get(key);
  if (cached) return cached;

  const width = 512;
  const height = 256;
  const data = new Uint8Array(width * height * 4);
  const [dark, light, accent] = paletteForBody(bodyId, baseColor);
  const isBanded = bodyId === "jupiter" || bodyId === "saturn" || bodyId === "uranus" || bodyId === "neptune";
  const seed = Array.from(bodyId).reduce((a, c) => a + c.charCodeAt(0), 17);

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    const lat = Math.abs(v - 0.5) * 2;
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const n1 = hash2(Math.floor(u * 96), Math.floor(v * 48), seed);
      const n2 = hash2(Math.floor(u * 38), Math.floor(v * 22), seed + 11);
      const band = isBanded
        ? 0.5 + 0.5 * Math.sin((v * 28 + n2 * 0.7 + Math.sin(u * 10) * 0.12) * Math.PI)
        : 0.5 + 0.5 * Math.sin((u * 8 + v * 5 + n2 * 1.7) * Math.PI);
      const mottling = n1 * 0.42 + n2 * 0.28 + (1 - lat) * 0.12;
      const c = dark.clone().lerp(light, Math.min(1, Math.max(0, band * 0.62 + mottling * 0.42)));
      c.lerp(accent, isBanded ? Math.max(0, 0.22 - band * 0.18) : Math.max(0, n2 - 0.72) * 0.32);
      const i = (y * width + x) * 4;
      data[i] = Math.round(THREE.MathUtils.clamp(c.r, 0, 1) * 255);
      data[i + 1] = Math.round(THREE.MathUtils.clamp(c.g, 0, 1) * 255);
      data[i + 2] = Math.round(THREE.MathUtils.clamp(c.b, 0, 1) * 255);
      data[i + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  proceduralPlanetTextures.set(key, texture);
  return texture;
}

let sharedSunHaloTex: THREE.CanvasTexture | null = null;
export function getSunHaloGlowTexture(): THREE.CanvasTexture {
  if (sharedSunHaloTex) return sharedSunHaloTex;
  const size = 512;
  const half = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(half, half, 0, half, half, half);
  g.addColorStop(0, "rgba(255,248,235,1)");
  g.addColorStop(0.08, "rgba(255,240,215,0.75)");
  g.addColorStop(0.2, "rgba(255,225,185,0.4)");
  g.addColorStop(0.4, "rgba(255,200,150,0.15)");
  g.addColorStop(0.65, "rgba(255,160,100,0.04)");
  g.addColorStop(1, "rgba(255,120,60,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  sharedSunHaloTex = new THREE.CanvasTexture(canvas);
  sharedSunHaloTex.colorSpace = THREE.SRGBColorSpace;
  return sharedSunHaloTex;
}

export const noopRaycast: THREE.Object3D["raycast"] = () => {};
