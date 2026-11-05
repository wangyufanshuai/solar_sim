/**
 * WebGL2 (GLSL ES 3.00) per-pixel Kerr ray tracer.
 *
 * Same equations as kerrMetricKS.ts / kerrReferenceTracer.ts, in float32:
 * Hamiltonian null geodesics in Cartesian Kerr–Schild coordinates, classic RK4
 * with step h = uStepScale · max(r − r₊, 0.02), refined ×0.3 near the horizon, equatorial crossings refined
 * by two secant RK4 sub-steps, Novikov–Thorne disk with Page–Thorne flux and
 * exact blackbody colour at the observed temperature T_obs = g · T_em.
 *
 * uMode = 0  beauty image (tone-mapped sRGB)
 * uMode = 1  diagnostics for validation: (status, r_emit, g, order) — physical only
 * uMode = 2  linear HDR radiance (exposure applied, no tone map) for bloom pipelines
 *            status 1 = disk, 2 = captured, 3 = escaped, 4 = step budget exhausted
 */
import { blackbodyLinearSRGB, COLOR_T_MAX, COLOR_T_MIN, COLOR_TABLE_SIZE, FLUX_TABLE_SIZE, pageThorneFluxTable, type FluxTable } from "./kerrDiskModel";
import { buildCameraFrame, type KerrCameraFrame, type KerrCameraInput } from "./kerrCameraV4";
import { outerHorizon } from "./kerrMetricKS";
import { SHARED_CAPTURE_MARGIN, sharedEscapeRadius } from "./kerrReferenceTracer";

export const KERR_V4_VERSION = "kerr-v4-ks-hamiltonian-rk4" as const;

export const kerrVertexShaderV4 = /* glsl */ `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

export const kerrFragmentShaderV4 = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

uniform vec2  uResolution;
uniform float uSpin;
uniform float uRh;
uniform float uCapture;
uniform float uRIn;
uniform float uROut;
uniform float uEscapeR;
uniform float uStepScale;
uniform int   uMaxSteps;
uniform vec3  uCamPos;
uniform vec4  uU;
uniform vec4  uEF;
uniform vec4  uER;
uniform vec4  uEU;
uniform mat4  uG;
uniform float uTanHalfFov;
uniform float uAspect;
uniform vec4  uFlux4[${FLUX_TABLE_SIZE / 4}];
uniform vec3  uBB[${COLOR_TABLE_SIZE}];
uniform vec4  uBBLogY4[${COLOR_TABLE_SIZE / 4}];
uniform float uDiskTMax;
uniform float uExposure;
uniform float uStarBrightness;
uniform float uTime;
uniform float uDiskDetail;
uniform float uLumGamma;
uniform int   uMode;

out vec4 outColor;

float ksRadius(vec3 p) {
  float a2 = uSpin * uSpin;
  float b = dot(p, p) - a2;
  float r2 = 0.5 * (b + sqrt(b * b + 4.0 * a2 * p.z * p.z));
  return sqrt(max(r2, 1e-12));
}

// Hamilton's equations; mirrors photonRhs() in kerrMetricKS.ts
void rhs(float kt, vec3 x, vec3 k, out vec3 dx, out vec3 dk) {
  float a = uSpin, a2 = a * a;
  float r = ksRadius(x);
  float r2 = r * r;
  float R2 = dot(x, x);
  float den = r * (2.0 * r2 - R2 + a2);
  vec3 dr = vec3(x.x * r2, x.y * r2, x.z * r2 + a2 * x.z) / den;
  float q = r2 * r2 + a2 * x.z * x.z;
  float f = 2.0 * r2 * r / q;
  vec3 dq = 4.0 * r2 * r * dr + vec3(0.0, 0.0, 2.0 * a2 * x.z);
  vec3 df = (6.0 * r2 * dr * q - 2.0 * r2 * r * dq) / (q * q);
  float s = r2 + a2;
  float nxv = r * x.x + a * x.y;
  float nyv = r * x.y - a * x.x;
  vec3 l = vec3(nxv / s, nyv / s, x.z / r);
  vec3 ds = 2.0 * r * dr;
  // dl_j/dx_i for j = x, y, z (vectors indexed by i)
  vec3 dlx = ((dr * x.x + vec3(r, a, 0.0)) * s - nxv * ds) / (s * s);
  vec3 dly = ((dr * x.y + vec3(-a, r, 0.0)) * s - nyv * ds) / (s * s);
  vec3 dlz = vec3(0.0, 0.0, 1.0 / r) - x.z * dr / r2;
  float L = -kt + dot(l, k);
  dx = k - f * L * l;
  vec3 dL = dlx * k.x + dly * k.y + dlz * k.z;
  dk = 0.5 * df * L * L + f * L * dL;
}

void rk4(float kt, vec3 x, vec3 k, float h, out vec3 xo, out vec3 ko) {
  vec3 dx1, dk1, dx2, dk2, dx3, dk3, dx4, dk4;
  rhs(kt, x, k, dx1, dk1);
  rhs(kt, x + 0.5 * h * dx1, k + 0.5 * h * dk1, dx2, dk2);
  rhs(kt, x + 0.5 * h * dx2, k + 0.5 * h * dk2, dx3, dk3);
  rhs(kt, x + h * dx3, k + h * dk3, dx4, dk4);
  xo = x + h / 6.0 * (dx1 + 2.0 * dx2 + 2.0 * dx3 + dx4);
  ko = k + h / 6.0 * (dk1 + 2.0 * dk2 + 2.0 * dk3 + dk4);
}

float fluxAt(int i) { return uFlux4[i / 4][i - 4 * (i / 4)]; }
float logYAt(int i) { return uBBLogY4[i / 4][i - 4 * (i / 4)]; }

float sampleFlux(float r) {
  if (r < uRIn || r > uROut) return 0.0;
  float t = (log(r) - log(uRIn)) / (log(uROut) - log(uRIn)) * float(${FLUX_TABLE_SIZE - 1});
  int i0 = clamp(int(floor(t)), 0, ${FLUX_TABLE_SIZE - 2});
  float w = t - float(i0);
  return mix(fluxAt(i0), fluxAt(i0 + 1), w);
}

// observed blackbody: linear sRGB chroma (Y=1) and ln Y(T) relative to 6500 K
vec3 blackbody(float T, out float lnY) {
  float t = (log(T) - log(${COLOR_T_MIN.toFixed(1)})) / (log(${COLOR_T_MAX.toFixed(1)}) - log(${COLOR_T_MIN.toFixed(1)})) * float(${COLOR_TABLE_SIZE - 1});
  t = clamp(t, 0.0, float(${COLOR_TABLE_SIZE - 1}) - 0.001);
  int i0 = int(floor(t));
  float w = t - float(i0);
  lnY = mix(logYAt(i0), logYAt(i0 + 1), w);
  return mix(uBB[i0], uBB[i0 + 1], w);
}

// circular-orbit emitter: returns k·u_em, so g = 1 / (k·u)
float kDotEmitter(float kt, vec3 x, vec3 k) {
  float a = uSpin;
  float r = ksRadius(vec3(x.xy, 0.0));
  float omega = 1.0 / (r * sqrt(r) + a);
  vec4 v = vec4(1.0, -omega * x.y, omega * x.x, 0.0);
  // g_{μν} = η + f l l at z = 0
  float a2 = a * a;
  float f = 2.0 / r;
  float s = r * r + a2;
  vec4 l = vec4(1.0, (r * x.x + a * x.y) / s, (r * x.y - a * x.x) / s, 0.0);
  float vl = dot(l, v);
  float vv = -v.x * v.x + dot(v.yzw, v.yzw) + f * vl * vl;
  float ut = inversesqrt(-vv);
  return ut * (kt * v.x + dot(k, v.yzw));
}

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i), n100 = hash13(i + vec3(1, 0, 0)), n010 = hash13(i + vec3(0, 1, 0)), n110 = hash13(i + vec3(1, 1, 0));
  float n001 = hash13(i + vec3(0, 0, 1)), n101 = hash13(i + vec3(1, 0, 1)), n011 = hash13(i + vec3(0, 1, 1)), n111 = hash13(i + vec3(1, 1, 1));
  return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y), mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
}

// Presentation-only disk structure: sheared turbulence co-moving with the
// Keplerian flow. Multiplies the physical emissivity; never used in uMode 1.
float diskStructure(float r, float phi) {
  float omega = 1.0 / (r * sqrt(r) + uSpin);
  float v = phi - omega * uTime;
  float lr = log(r);
  float acc = 0.0, amp = 0.5, fr = 1.0;
  for (int o = 0; o < 5; o++) {
    vec3 p = vec3(cos(v) * 1.7 * fr, sin(v) * 1.7 * fr, lr * 9.0 * fr + float(o) * 3.1);
    acc += amp * vnoise(p);
    amp *= 0.5;
    fr *= 2.03;
  }
  float streaks = 0.5 + 0.5 * sin(lr * 70.0 + 6.0 * acc);
  return mix(1.0, (0.3 + 1.4 * acc * acc * 1.6) * (0.85 + 0.3 * streaks), uDiskDetail);
}

vec3 sky(vec3 d) {
  // procedural catalogue-free starfield on cube-face grids with a 3×3 neighbour
  // search, so stars are never clipped by cell borders; sampled by the lensed
  // escape direction, so the Einstein ring and multiple images come for free.
  vec3 ad = abs(d);
  float face;
  vec2 uv;
  if (ad.x >= ad.y && ad.x >= ad.z) { face = d.x > 0.0 ? 0.0 : 1.0; uv = d.yz / ad.x; }
  else if (ad.y >= ad.z) { face = d.y > 0.0 ? 2.0 : 3.0; uv = d.xz / ad.y; }
  else { face = d.z > 0.0 ? 4.0 : 5.0; uv = d.xy / ad.z; }
  vec3 col = vec3(0.0);
  for (int layer = 0; layer < 3; layer++) {
    float N = 110.0 + 80.0 * float(layer);
    vec2 g = (uv * 0.5 + 0.5) * N;
    vec2 base = floor(g);
    for (int dy = -1; dy <= 1; dy++) {
      for (int dx = -1; dx <= 1; dx++) {
        vec2 cell = base + vec2(float(dx), float(dy));
        vec3 key = vec3(cell, face * 13.0 + float(layer) * 101.0);
        float hsh = hash13(key);
        if (hsh < 0.9) continue;
        vec2 pos = cell + 0.15 + 0.7 * vec2(hash13(key + 1.7), hash13(key + 5.3));
        vec2 off = g - pos;
        float mag = pow((hsh - 0.9) / 0.1, 5.0);
        float tint = hash13(key + 9.1);
        vec3 sc = mix(vec3(1.0, 0.7, 0.45), vec3(0.6, 0.74, 1.0), tint);
        col += sc * mag * exp(-dot(off, off) * 220.0) * 7.0;
      }
    }
  }
  // faint galactic band around a tilted great circle
  vec3 n = normalize(vec3(0.25, 0.9, 0.35));
  float band = exp(-pow(dot(d, n) / 0.16, 2.0));
  float grain = hash13(floor(d * 400.0));
  col += vec3(0.55, 0.5, 0.45) * band * (0.012 + 0.01 * grain);
  return col * uStarBrightness;
}

vec3 acesFilm(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

vec3 toSRGB(vec3 c) {
  return mix(12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec2 ndc = (gl_FragCoord.xy / uResolution) * 2.0 - 1.0;
  float sx = ndc.x * uTanHalfFov * uAspect;
  float sy = ndc.y * uTanHalfFov;
  vec4 kUp = -uU + (uEF + sx * uER + sy * uEU) * inversesqrt(1.0 + sx * sx + sy * sy);
  vec4 kLow = uG * kUp;
  float kt = kLow.x;
  vec3 x = uCamPos;
  vec3 k = kLow.yzw;

  float status = 4.0;
  float rEmit = 0.0;
  float gEmit = 0.0;
  float order = 0.0;
  float phiEmit = 0.0;
  vec3 escapeDir = vec3(0.0);

  for (int i = 0; i < 4000; i++) {
    if (i >= uMaxSteps) break;
    float r = ksRadius(x);
    // finer steps inside ~2M of the horizon, where near-extremal photon orbits live
    float h = uStepScale * max(r - uRh, 0.02) * mix(0.3, 1.0, smoothstep(uRh, uRh + 2.0, r));
    vec3 xn, kn;
    rk4(kt, x, k, h, xn, kn);
    if (x.z * xn.z < 0.0 && max(abs(x.z), abs(xn.z)) > 1e-6) {
      // secant refinement of the equatorial crossing from the last accepted state
      float lo = 0.0, hi = h, zlo = x.z, zhi = xn.z;
      vec3 xc = xn, kc = kn;
      for (int it = 0; it < 3; it++) {
        float t = lo + (hi - lo) * zlo / (zlo - zhi);
        rk4(kt, x, k, t, xc, kc);
        if (xc.z * zlo > 0.0) { lo = t; zlo = xc.z; } else { hi = t; zhi = xc.z; }
      }
      float rc = ksRadius(vec3(xc.xy, 0.0));
      if (rc >= uRIn && rc <= uROut) {
        status = 1.0;
        rEmit = rc;
        gEmit = 1.0 / kDotEmitter(kt, xc, kc);
        phiEmit = atan(xc.y, xc.x);
        break;
      }
      order += 1.0;
    }
    x = xn;
    k = kn;
    float rn = ksRadius(x);
    if (rn < uCapture) { status = 2.0; break; }
    vec3 dx, dk;
    rhs(kt, x, k, dx, dk);
    if (rn > uEscapeR && dot(x, dx) > 0.0) { status = 3.0; escapeDir = normalize(dx); break; }
  }

  if (uMode == 1) {
    outColor = vec4(status, rEmit, gEmit, order);
    return;
  }

  vec3 col = vec3(0.0);
  if (status == 1.0) {
    float F = sampleFlux(rEmit) * diskStructure(rEmit, phiEmit);
    // presentation taper so the disk does not end in a hard edge at rOut
    F *= mix(1.0, smoothstep(uROut, 0.6 * uROut, rEmit), uDiskDetail);
    float Tobs = gEmit * uDiskTMax * pow(max(F, 0.0), 0.25);
    if (Tobs > 0.0) {
      float lnY;
      vec3 chroma = blackbody(Tobs, lnY);
      // uLumGamma = 1 is the physical visible-band luminance; < 1 compresses the
      // Doppler/temperature dynamic range for display (colour is unchanged).
      col = chroma * exp(lnY * uLumGamma);
    }
  } else if (status == 3.0) {
    col = sky(escapeDir);
  }
  col *= uExposure;
  if (uMode == 2) { outColor = vec4(col, 1.0); return; } // linear HDR for an external bloom/tone-map pass
  outColor = vec4(toSRGB(acesFilm(col)), 1.0);
}
`;

// --- uniform packing shared by the demo page and the R3F component ----------

export type KerrRenderSettingsV4 = {
  /** outer disk radius in M */
  rOut: number;
  /** peak local disk temperature in kelvin (presentation scale; changes colour, not geometry) */
  diskTMax: number;
  exposure: number;
  /** step = stepScale · (r − r₊); 0.04 interactive, 0.015 still */
  stepScale: number;
  maxSteps: number;
  starBrightness: number;
  /** 0 = physical Page–Thorne emissivity only; 1 = full presentation turbulence + outer taper */
  diskDetail: number;
  /** exponent on the blackbody visible luminance: 1 = physical, < 1 = compressed for display */
  luminanceGamma: number;
};

/** Cinematic preset: physical geometry, redshift and colour; documented presentation transforms on top. */
export const KERR_V4_CINEMATIC: KerrRenderSettingsV4 = {
  rOut: 28,
  diskTMax: 7000,
  exposure: 0.6,
  stepScale: 0.04,
  maxSteps: 1500,
  starBrightness: 1,
  diskDetail: 0.85,
  luminanceGamma: 0.5,
};

/** Science preset: smooth Page–Thorne emissivity and physical visible-band luminance. */
export const KERR_V4_SCIENCE: KerrRenderSettingsV4 = {
  ...KERR_V4_CINEMATIC,
  diskDetail: 0,
  luminanceGamma: 1,
  exposure: 0.9,
};

export const KERR_V4_DEFAULTS = KERR_V4_CINEMATIC;

/** ln of the CIE-Y luminance of a blackbody, relative to 6500 K, sampled like blackbodyColorTable(). */
export function blackbodyLogLuminanceTable(n = COLOR_TABLE_SIZE): Float32Array {
  const Y = (T: number) => {
    let s = 0;
    for (let l = 380; l <= 780; l += 2) {
      const lam = l * 1e-9;
      const ybar = 0.821 * Math.exp(-0.5 * Math.pow((l - 568.8) / (l < 568.8 ? 46.9 : 40.5), 2)) + 0.286 * Math.exp(-0.5 * Math.pow((l - 530.9) / (l < 530.9 ? 16.3 : 31.1), 2));
      s += ybar / (Math.pow(lam, 5) * (Math.exp(1.438776877e-2 / (lam * T)) - 1));
    }
    return s;
  };
  const ref = Math.log(Y(6500));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const T = Math.exp(Math.log(COLOR_T_MIN) + ((Math.log(COLOR_T_MAX) - Math.log(COLOR_T_MIN)) * i) / (n - 1));
    out[i] = Math.log(Y(T)) - ref;
  }
  return out;
}

export type KerrUniformValuesV4 = {
  frame: KerrCameraFrame;
  flux: FluxTable;
  bb: Float32Array;
  bbLogY: Float32Array;
  rh: number;
  capture: number;
  escapeR: number;
};

const tableCache = new Map<string, { flux: FluxTable }>();
let bbCache: { bb: Float32Array; bbLogY: Float32Array } | null = null;

export function prepareKerrUniformsV4(camera: KerrCameraInput, settings: KerrRenderSettingsV4): KerrUniformValuesV4 {
  const frame = buildCameraFrame(camera);
  const key = `${camera.spin.toFixed(6)}:${settings.rOut}`;
  let t = tableCache.get(key);
  if (!t) {
    t = { flux: pageThorneFluxTable(camera.spin, settings.rOut) };
    tableCache.set(key, t);
  }
  if (!bbCache) {
    const bb = new Float32Array(COLOR_TABLE_SIZE * 3);
    for (let i = 0; i < COLOR_TABLE_SIZE; i++) {
      const T = Math.exp(Math.log(COLOR_T_MIN) + ((Math.log(COLOR_T_MAX) - Math.log(COLOR_T_MIN)) * i) / (COLOR_TABLE_SIZE - 1));
      bb.set(blackbodyLinearSRGB(T), i * 3);
    }
    bbCache = { bb, bbLogY: blackbodyLogLuminanceTable() };
  }
  const rh = outerHorizon(camera.spin);
  const D = Math.hypot(...camera.position);
  return {
    frame,
    flux: t.flux,
    bb: bbCache.bb,
    bbLogY: bbCache.bbLogY,
    rh,
    capture: rh + SHARED_CAPTURE_MARGIN,
    escapeR: sharedEscapeRadius(D, settings.rOut),
  };
}

/** Column-major Float32Array for a symmetric 4×4 metric. */
export function metricToMat4(g: number[][]): Float32Array {
  const m = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) m[c * 4 + r] = g[r][c];
  return m;
}
