/**
 * Standalone interactive demo for the Kerr v4 renderer (no React, no three.js).
 * Built into a single HTML file by scripts/kerr-v4/build-demo.mjs.
 */
import { orbitCamera } from "../../app/lib/kerr-v4/kerrCameraV4";
import { iscoRadius, outerHorizon, photonOrbitRadii } from "../../app/lib/kerr-v4/kerrMetricKS";
import { KERR_V4_CINEMATIC, KERR_V4_SCIENCE, prepareKerrUniformsV4, type KerrRenderSettingsV4 } from "../../app/lib/kerr-v4/kerrShaderV4";
import { KerrCinematicPipelineV4, KerrWebGLRendererV4 } from "../../app/lib/kerr-v4/kerrWebGLRendererV4";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>("view");
const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true });

const state = {
  spin: 0.9,
  incl: 83,
  az: 0,
  dist: 110,
  fov: 20,
  tmax: 7000,
  mode: "cinematic" as "cinematic" | "science",
  animate: false,
  time: 40,
};

const fmt = (v: number, d = 3) => v.toFixed(d);

function readouts() {
  const a = state.spin;
  const ph = photonOrbitRadii(a);
  $("ro-rh").textContent = fmt(outerHorizon(a));
  $("ro-isco").textContent = fmt(iscoRadius(a));
  $("ro-ph").textContent = `${fmt(a >= 0 ? ph.prograde : ph.retrograde)} / ${fmt(a >= 0 ? ph.retrograde : ph.prograde)}`;
  $("val-spin").textContent = fmt(a, 3);
  $("val-incl").textContent = `${state.incl.toFixed(0)}°`;
  $("val-dist").textContent = `${state.dist.toFixed(0)} M`;
  $("val-temp").textContent = `${(state.tmax / 1000).toFixed(1)} kK`;
}

if (!gl) {
  $("fallback").hidden = false;
} else {
  const tracer = new KerrWebGLRendererV4(gl);
  const pipeline = new KerrCinematicPipelineV4(gl, tracer);
  let interactiveUntil = 0;
  let dirty = true;

  const settings = (): KerrRenderSettingsV4 => ({
    ...(state.mode === "science" ? KERR_V4_SCIENCE : KERR_V4_CINEMATIC),
    diskTMax: state.tmax,
  });

  const render = (scale: number) => {
    const W = Math.max(160, Math.floor(canvas.clientWidth * scale));
    const H = Math.max(90, Math.floor(canvas.clientHeight * scale));
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    const cam = orbitCamera(state.spin, state.dist, (state.incl * Math.PI) / 180, (state.az * Math.PI) / 180, (state.fov * Math.PI) / 180, W / H);
    const t0 = performance.now();
    try {
      const s = settings();
      const values = prepareKerrUniformsV4(cam, s);
      if (state.mode === "science") {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        tracer.draw(values, s, W, H, 0, state.time);
      } else {
        pipeline.render(values, s, W, H, state.time);
      }
      gl.finish();
      $("ro-frame").textContent = `${(performance.now() - t0).toFixed(0)} ms · ${W}×${H}`;
    } catch (e) {
      $("ro-frame").textContent = String((e as Error).message).slice(0, 60);
    }
  };

  const frame = (now: number) => {
    const interacting = now < interactiveUntil;
    const full = Math.min(devicePixelRatio || 1, 1.5);
    if (state.animate) {
      state.time += 0.6;
      render(0.45);
    } else if (dirty) {
      render(interacting ? 0.45 : full);
      dirty = interacting; // one more full-resolution trace once the interaction settles
    }
    requestAnimationFrame(frame);
  };

  const touch = (settle = 260) => {
    interactiveUntil = performance.now() + settle;
    dirty = true;
    readouts();
  };

  let drag: { x: number; y: number; az: number; incl: number } | null = null;
  canvas.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, az: state.az, incl: state.incl };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    state.az = drag.az - (e.clientX - drag.x) * 0.3;
    state.incl = Math.min(177, Math.max(3, drag.incl - (e.clientY - drag.y) * 0.25));
    ($("in-incl") as HTMLInputElement).value = String(state.incl);
    touch();
  });
  const endDrag = () => {
    drag = null;
    touch(0);
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      state.dist = Math.min(400, Math.max(18, state.dist * Math.exp(e.deltaY * 0.001)));
      ($("in-dist") as HTMLInputElement).value = String(state.dist);
      touch();
    },
    { passive: false },
  );

  const bind = (id: string, key: "spin" | "incl" | "dist" | "tmax") => {
    const el = $<HTMLInputElement>(id);
    el.value = String(state[key]);
    el.addEventListener("input", () => {
      state[key] = Number(el.value);
      touch();
    });
    el.addEventListener("change", () => touch(0));
  };
  bind("in-spin", "spin");
  bind("in-incl", "incl");
  bind("in-dist", "dist");
  bind("in-temp", "tmax");

  for (const btn of document.querySelectorAll<HTMLButtonElement>("[data-mode]")) {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode as "cinematic" | "science";
      for (const b of document.querySelectorAll<HTMLButtonElement>("[data-mode]")) b.setAttribute("aria-pressed", String(b === btn));
      $("mode-note").textContent =
        state.mode === "science"
          ? "Smooth Page–Thorne emissivity, physical visible-band luminance, no bloom."
          : "Same geometry, redshift and colour. Adds disk turbulence, luminance compression (γ = 0.5) and bloom.";
      touch(0);
    });
  }
  $<HTMLInputElement>("in-animate").addEventListener("change", (e) => {
    state.animate = (e.target as HTMLInputElement).checked;
    touch(0);
  });
  new ResizeObserver(() => touch(0)).observe(canvas);
  readouts();
  requestAnimationFrame(frame);
}
