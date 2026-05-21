import * as THREE from "three";

/** Small radial gradients for `LensflareElement` (no external assets). */
export function createSunLensflareTextures(): {
  glowPrimary: THREE.CanvasTexture;
  glowRing: THREE.CanvasTexture;
  hexGhost: THREE.CanvasTexture;
  hexGhostFar: THREE.CanvasTexture;
} {
  const glowPrimary = radialCanvasTexture(256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.12, "rgba(255,245,210,0.88)");
    g.addColorStop(0.35, "rgba(255,200,120,0.4)");
    g.addColorStop(0.7, "rgba(255,140,60,0.08)");
    g.addColorStop(1, "rgba(255,120,40,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });

  const glowRing = radialCanvasTexture(192, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.25, s / 2, s / 2, s * 0.5);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.55, "rgba(255,200,100,0.5)");
    g.addColorStop(1, "rgba(255,80,20,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });

  const hexGhost = radialCanvasTexture(128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.35);
    g.addColorStop(0, "rgba(255,240,200,0.9)");
    g.addColorStop(0.5, "rgba(255,160,60,0.25)");
    g.addColorStop(1, "rgba(255,100,20,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });

  const hexGhostFar = radialCanvasTexture(128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.42);
    g.addColorStop(0, "rgba(255,200,120,0.55)");
    g.addColorStop(0.65, "rgba(255,120,40,0.18)");
    g.addColorStop(1, "rgba(255,60,10,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });

  for (const t of [glowPrimary, glowRing, hexGhost, hexGhostFar]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
  }

  return { glowPrimary, glowRing, hexGhost, hexGhostFar };
}

function radialCanvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2d context required for lensflare texture");
  }
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}
