/**
 * Frame-time benchmark for the Kerr v4 tracer (roadmap A1 acceptance: 1080p >= 60 fps).
 * Run from next-web:  PW_CHANNEL=chrome npx tsx scripts/kerr-v4/benchmark.mts
 * Renders the demo's default camera with the cinematic pipeline and the science tracer at
 * several resolutions, timing each frame up to a 1-pixel readback, and writes
 * app/lib/kerr-v4/validation/benchmark-<date>.json including the WebGL renderer string.
 */
import { createRequire } from "node:module";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const { build } = (() => {
  for (const id of ["esbuild", join(process.cwd(), "node_modules", "tsx", "node_modules", "esbuild")]) {
    try {
      return require(id);
    } catch {
      /* try next */
    }
  }
  throw new Error("esbuild not found");
})() as { build: (o: Record<string, unknown>) => Promise<{ outputFiles: { text: string }[] }> };

const FRAMES = Number(process.env.FRAMES ?? 30);
const sizes = [
  { label: "1080p", w: 1920, h: 1080 },
  { label: "1080p-half", w: 960, h: 540 },
  { label: "720p", w: 1280, h: 720 },
];
const camera = { spin: 0.9, incl: 83, dist: 110, fov: 20 }; // demo-entry.ts defaults

const entry = `import { prepareKerrUniformsV4, KERR_V4_CINEMATIC, KERR_V4_SCIENCE } from "./app/lib/kerr-v4/kerrShaderV4";
import { KerrWebGLRendererV4, KerrCinematicPipelineV4 } from "./app/lib/kerr-v4/kerrWebGLRendererV4";
import { orbitCamera } from "./app/lib/kerr-v4/kerrCameraV4";
(window as any).kerr = { prepareKerrUniformsV4, KERR_V4_CINEMATIC, KERR_V4_SCIENCE, KerrWebGLRendererV4, KerrCinematicPipelineV4, orbitCamera };`;
const bundle = await build({ stdin: { contents: entry, resolveDir: process.cwd(), loader: "ts" }, bundle: true, write: false, format: "iife" });
const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || undefined,
  args: ["--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11", "--force_high_performance_gpu"],
});
const page = await browser.newPage();
await page.setContent(`<canvas id=c width=1920 height=1080></canvas><script>${bundle.outputFiles[0].text}</script>`);
const renderer = await page.evaluate(() => {
  const gl = (document.getElementById("c") as HTMLCanvasElement).getContext("webgl2")!;
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "unknown";
});
console.log("renderer:", renderer);
const results: any[] = [];
for (const mode of ["cinematic", "science"]) {
  for (const size of sizes) {
    const ms: number[] = await page.evaluate(({ mode, size, camera, frames }) => {
      const k = (window as any).kerr;
      const canvas = document.getElementById("c") as HTMLCanvasElement;
      canvas.width = size.w;
      canvas.height = size.h;
      const gl = canvas.getContext("webgl2")!;
      const tracer = new k.KerrWebGLRendererV4(gl);
      const pipeline = new k.KerrCinematicPipelineV4(gl, tracer);
      const settings = mode === "science" ? k.KERR_V4_SCIENCE : k.KERR_V4_CINEMATIC;
      const cam = k.orbitCamera(camera.spin, camera.dist, (camera.incl * Math.PI) / 180, 0, (camera.fov * Math.PI) / 180, size.w / size.h);
      const values = k.prepareKerrUniformsV4(cam, settings);
      const times: number[] = [];
      const pixel = new Uint8Array(4);
      for (let i = 0; i < frames + 3; i++) {
        const t0 = performance.now();
        if (mode === "science") {
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          tracer.draw(values, settings, size.w, size.h, 0, i * 0.6);
        } else {
          pipeline.render(values, settings, size.w, size.h, i * 0.6);
        }
        // gl.finish() does not block in Chrome; a 1-pixel readback waits for the GPU.
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        if (i >= 3) times.push(performance.now() - t0);
      }
      return times;
    }, { mode, size, camera, frames: FRAMES });
    ms.sort((a, b) => a - b);
    const row = { mode, ...size, frames: ms.length, medianMs: ms[Math.floor(ms.length / 2)], p90Ms: ms[Math.floor(ms.length * 0.9)],
      medianFps: 1000 / ms[Math.floor(ms.length / 2)] };
    results.push(row);
    console.log(JSON.stringify(row));
  }
}
const stamp = new Date().toISOString().slice(0, 10);
writeFileSync(`app/lib/kerr-v4/validation/benchmark-${stamp}.json`,
  JSON.stringify({ generatedAt: new Date().toISOString(), renderer, camera, results }, null, 2) + "\n");
await browser.close();
