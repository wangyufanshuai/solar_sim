/**
 * GPU-vs-float64 validation for the Kerr v4 shader.
 * Run from next-web:  npx tsx scripts/kerr-v4/validate.mts      (N=128 STEP=0.04 by default)
 * Writes app/lib/kerr-v4/validation/validation-<N>-step<STEP>.json
 */
import { createRequire } from "node:module";
import { join } from "node:path";
// esbuild is not a direct dependency; fall back to the copy that ships with tsx.
const require = createRequire(import.meta.url);
const { build } = (() => {
  for (const id of ["esbuild", join(process.cwd(), "node_modules", "tsx", "node_modules", "esbuild")]) {
    try {
      return require(id);
    } catch {
      /* try next */
    }
  }
  throw new Error("esbuild not found (install it or keep tsx in devDependencies)");
})() as { build: (o: Record<string, unknown>) => Promise<{ outputFiles: { text: string }[] }> };
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
// The project package has no "type": "module", so tsx loads app/lib/*.ts as CommonJS.
// Under Node 24 + tsx 4.20 a static ESM import of those modules exposes no named
// exports, so they are loaded through require() instead.
const { orbitCamera } = require("../../app/lib/kerr-v4/kerrCameraV4") as typeof import("../../app/lib/kerr-v4/kerrCameraV4");
const { defaultTraceOptions, traceImage } = require("../../app/lib/kerr-v4/kerrReferenceTracer") as typeof import("../../app/lib/kerr-v4/kerrReferenceTracer");

const W = Number(process.env.N ?? 128), H = W;
const stepScale = Number(process.env.STEP ?? 0.04);
const configs = [
  { name: "a0.9-i75", spin: 0.9, D: 30, incl: 75 },
  { name: "a0-i60", spin: 0.0, D: 30, incl: 60 },
  { name: "a0.99-i85", spin: 0.99, D: 40, incl: 85 },
  { name: "a-0.6-i45", spin: -0.6, D: 25, incl: 45 },
];
const rOut = 20;
const outDir = "app/lib/kerr-v4/validation";
mkdirSync(outDir, { recursive: true });
const entry = `import { prepareKerrUniformsV4, KERR_V4_DEFAULTS } from "./app/lib/kerr-v4/kerrShaderV4";
import { KerrWebGLRendererV4 } from "./app/lib/kerr-v4/kerrWebGLRendererV4";
import { orbitCamera } from "./app/lib/kerr-v4/kerrCameraV4";
(window as any).kerr = { prepareKerrUniformsV4, KerrWebGLRendererV4, orbitCamera, KERR_V4_DEFAULTS };`;
const bundle = await build({ stdin: { contents: entry, resolveDir: process.cwd(), loader: "ts" }, bundle: true, write: false, format: "iife" });
const js = bundle.outputFiles[0].text;
// SOFTWARE=1 forces SwiftShader (how the recorded results were produced); default uses the real GPU when available.
// PW_CHANNEL=chrome (or msedge) uses an installed browser instead of Playwright's bundled Chromium.
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, args:process.env.SOFTWARE ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : ["--ignore-gpu-blocklist", "--enable-gpu"] });
const page = await browser.newPage();
await page.setContent(`<canvas id=c width=${W} height=${H}></canvas><script>${js}</script>`);
const summary: any[] = [];
for (const c of configs) {
  const fov = 2 * Math.atan((0.85 * rOut) / c.D);
  const cam = orbitCamera(c.spin, c.D, (c.incl * Math.PI) / 180, 0, fov, 1);
  const t0 = Date.now();
  const ref = traceImage(cam, W, H, defaultTraceOptions(c.D, rOut));
  const tRef = Date.now() - t0;
  const gpu: number[] = await page.evaluate(({ spin, D, incl, fov, W, H, stepScale, rOut }) => {
    const k = (window as any).kerr;
    const gl = (document.getElementById("c") as HTMLCanvasElement).getContext("webgl2")!;
    const r = new k.KerrWebGLRendererV4(gl);
    const settings = { ...k.KERR_V4_DEFAULTS, stepScale, rOut, maxSteps: 4000 };
    const cam = k.orbitCamera(spin, D, (incl * Math.PI) / 180, 0, fov, 1);
    return Array.from(r.diagnostics(k.prepareKerrUniformsV4(cam, settings), settings, W, H));
  }, { spin: c.spin, D: c.D, incl: c.incl, fov, W, H, stepScale, rOut });
  const code: Record<string, number> = { disk: 1, captured: 2, escaped: 3, "max-steps": 4 };
  let agree = 0, both = 0, maxGErr = 0, maxRErr = 0, maxStepsGpu = 0;
  const gErrs: number[] = [];
  const confusion: Record<string, number> = {};
  for (let p = 0; p < W * H; p++) {
    const rr = ref.rays[p];
    const gs = gpu[p * 4], gr = gpu[p * 4 + 1], gg = gpu[p * 4 + 2];
    if (gs === 4) maxStepsGpu++;
    if (code[rr.status] === gs) agree++;
    else { const key = `${rr.status}->${gs}`; confusion[key] = (confusion[key] ?? 0) + 1; }
    if (rr.status === "disk" && gs === 1) {
      both++;
      const ge = Math.abs(gg - rr.g!) / rr.g!;
      gErrs.push(ge);
      maxGErr = Math.max(maxGErr, ge);
      maxRErr = Math.max(maxRErr, Math.abs(gr - rr.r!) / rr.r!);
    }
  }
  gErrs.sort((x, y) => x - y);
  const s = {
    config: c.name, pixels: W * H, refMs: tRef,
    statusAgreement: agree / (W * H),
    mismatches: confusion,
    gpuStepBudgetExhausted: maxStepsGpu,
    diskPixelsCompared: both,
    redshiftRelErr: { median: gErrs[Math.floor(gErrs.length / 2)], p99: gErrs[Math.floor(gErrs.length * 0.99)], max: maxGErr },
    emitRadiusRelErrMax: maxRErr,
    refMaxHamiltonian: Math.max(...ref.rays.map((r) => r.maxHamiltonian)),
  };
  summary.push(s);
  console.log(JSON.stringify(s));
}
writeFileSync(`${outDir}/validation-${W}-step${stepScale}.json`, JSON.stringify({ generatedAt: new Date().toISOString(), renderer: await page.evaluate(() => { const gl = document.createElement("canvas").getContext("webgl2"); const ext = gl?.getExtension("WEBGL_debug_renderer_info"); return ext ? gl!.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown"; }), stepScale, W, H, rOut, summary }, null, 2));
await browser.close();
