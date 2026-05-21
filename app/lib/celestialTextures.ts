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
