/**
 * Roadmap S4: error of the app's solar-system integrator against JPL Horizons, and the
 * Mercury perihelion advance from the EIH 1PN term.
 *
 * Run from next-web:  npx tsx scripts/s4-horizons-error.mts
 *
 * Part 1. Starts SolarSystemPhysics from its J2000 ephemeris with the full default body set
 * and advances it with the app's adaptive DP5(4) path, once with invC2 = 0 (Newton) and once
 * with invC2 = 1/c^2 (EIH 1PN). At each checkpoint of public/data/horizons-validation-j2000.json
 * (heliocentric, ecliptic J2000, geometric) it reports |r_sim - r_Horizons| per body, using
 * heliocentric positions r_body - r_sun from the simulation.
 *
 * Part 2. Sun + planets + Moon + Pluto + Ceres (first 12 bodies) for 100 Julian years, Newton
 * and EIH. Mercury's osculating longitude of perihelion  varpi = Omega + omega  is computed daily
 * from its heliocentric state with mu = G (M_sun + M_mercury); a least-squares line gives its
 * rate. The EIH − Newton rate isolates the relativistic advance, compared with
 * 6 pi G M_sun / (c^2 a (1 - e^2)) per orbit (42.98 arcsec per century). Planetary
 * perturbations are present in both runs and cancel in the difference to first order.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { SolarSystemPhysics } = require("../app/lib/solarSystemPhysics") as typeof import("../app/lib/solarSystemPhysics");
const { SOLAR_SYSTEM_BODIES } = require("../app/data/planetsJ2000") as typeof import("../app/data/planetsJ2000");
const { C_LIGHT, G_SI, AU_METERS, DAY_SECONDS } = require("../app/lib/physicalConstants") as typeof import("../app/lib/physicalConstants");

const INV_C2 = 1 / (C_LIGHT * C_LIGHT);
const AU_KM = AU_METERS / 1000;
const ref = JSON.parse(readFileSync("public/data/horizons-validation-j2000.json", "utf8"));
const ids: string[] = SOLAR_SYSTEM_BODIES.map((b: any) => b.id);
const quiet = console.warn;
console.warn = () => {}; // resetFromEphemeris warns when activeN < the full catalogue

function helio(p: InstanceType<typeof SolarSystemPhysics>, i: number): [number, number, number] {
  p.syncPosAu();
  return [p.posAu[3 * i] - p.posAu[0], p.posAu[3 * i + 1] - p.posAu[1], p.posAu[3 * i + 2] - p.posAu[2]];
}

// Optional diagnostic: SUN_GM=iau replaces the Sun's G*M with the IAU 2015 nominal heliocentric
// constant GM = 1.3271244e20 m^3 s^-2 (the app derives it from G_SI * massKg).
const SUN_GM_IAU = 1.3271244e20;
function part1(mode: "newton" | "eih") {
  const p = new SolarSystemPhysics({ forceFixedRk4: false });
  p.resetFromEphemeris();
  if (process.env.SUN_GM === "iau") p.mass[0] = SUN_GM_IAU / G_SI;
  let day = 0;
  const rows: any[] = [];
  const start = performance.now();
  for (const cp of ref.checkpoints) {
    if (cp.offsetDays > day) {
      p.stepSimulatedSeconds((cp.offsetDays - day) * DAY_SECONDS, mode === "eih" ? INV_C2 : 0);
      day = cp.offsetDays;
    }
    for (const b of cp.bodies) {
      if (b.id === "sun") continue;
      const i = ids.indexOf(b.id);
      if (i < 0) continue;
      const r = helio(p, i);
      const d = Math.hypot(r[0] - b.x_au, r[1] - b.y_au, r[2] - b.z_au);
      rows.push({ checkpoint: cp.label, days: cp.offsetDays, body: b.id, errorKm: d * AU_KM,
        relative: d / Math.hypot(b.x_au, b.y_au, b.z_au) });
    }
  }
  return { mode, bodies: p.n, seconds: (performance.now() - start) / 1000, rows };
}

function varpi(r: number[], v: number[], mu: number) {
  const h = [r[1] * v[2] - r[2] * v[1], r[2] * v[0] - r[0] * v[2], r[0] * v[1] - r[1] * v[0]];
  const rn = Math.hypot(...r);
  const vxh = [v[1] * h[2] - v[2] * h[1], v[2] * h[0] - v[0] * h[2], v[0] * h[1] - v[1] * h[0]];
  const e = vxh.map((c, k) => c / mu - r[k] / rn);
  const node = [-h[1], h[0], 0];
  const nn = Math.hypot(...node), en = Math.hypot(...e), hn = Math.hypot(...h);
  const Omega = Math.atan2(node[1], node[0]);
  let omega = Math.acos(Math.max(-1, Math.min(1, (node[0] * e[0] + node[1] * e[1]) / (nn * en))));
  if (e[2] < 0) omega = 2 * Math.PI - omega;
  const a = 1 / (2 / rn - (v[0] ** 2 + v[1] ** 2 + v[2] ** 2) / mu);
  return { varpi: Omega + omega, a, e: en, h: hn };
}

function part2(mode: "newton" | "eih", years = 100) {
  const p = new SolarSystemPhysics({ activeN: 12, forceFixedRk4: false });
  p.resetFromEphemeris();
  const mu = G_SI * (p.mass[0] + p.mass[1]);
  const t: number[] = [], w: number[] = [];
  let aSum = 0, eSum = 0;
  const days = Math.round(years * 365.25);
  const start = performance.now();
  let prev = 0, turns = 0;
  for (let d = 0; d <= days; d++) {
    if (d > 0) p.stepSimulatedSeconds(DAY_SECONDS, mode === "eih" ? INV_C2 : 0);
    const r = [0, 1, 2].map((k) => p.posM[3 + k] - p.posM[k]);
    const v = [0, 1, 2].map((k) => p.velM[3 + k] - p.velM[k]);
    const el = varpi(r, v, mu);
    let x = el.varpi + 2 * Math.PI * turns;
    if (d > 0 && x - prev > Math.PI) { turns -= 1; x -= 2 * Math.PI; }
    if (d > 0 && x - prev < -Math.PI) { turns += 1; x += 2 * Math.PI; }
    prev = x;
    t.push(d / 36525); w.push(x);
    aSum += el.a; eSum += el.e;
  }
  const n = t.length, mt = t.reduce((s, x) => s + x, 0) / n, mw = w.reduce((s, x) => s + x, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (t[i] - mt) * (w[i] - mw); sxx += (t[i] - mt) ** 2; }
  const rateArcsecPerCentury = (sxy / sxx) * (180 / Math.PI) * 3600;
  return { mode, years, samples: n, seconds: (performance.now() - start) / 1000,
    meanA_au: aSum / n / AU_METERS, meanE: eSum / n, rateArcsecPerCentury, sunMassKg: p.mass[0] };
}

const out: any = { generatedAt: new Date().toISOString(), reference: "public/data/horizons-validation-j2000.json", part1: [], part2: [] };
for (const mode of (process.env.S4_MODES ?? "newton,eih").split(",") as ("newton" | "eih")[]) {
  const r = part1(mode);
  out.part1.push(r);
  console.log(`part1 ${mode}: ${r.bodies} bodies, ${r.seconds.toFixed(1)} s`);
}
for (const mode of (process.env.S4_PART2 === "0" ? [] : ["newton", "eih"]) as ("newton" | "eih")[]) {
  const r = part2(mode);
  out.part2.push(r);
  console.log(`part2 ${mode}: varpi rate ${r.rateArcsecPerCentury.toFixed(3)} arcsec/cy, ${r.seconds.toFixed(1)} s`);
}
const [pn, pe] = out.part2.length ? out.part2 : [null, null];
if (pe) {
const a = pe.meanA_au * AU_METERS, e = pe.meanE;
const predictedPerOrbit = (6 * Math.PI * G_SI * pe.sunMassKg) / (C_LIGHT ** 2 * a * (1 - e * e));
const periodDays = 2 * Math.PI * Math.sqrt(a ** 3 / (G_SI * pe.sunMassKg)) / DAY_SECONDS;
const predicted = predictedPerOrbit * (36525 / periodDays) * (180 / Math.PI) * 3600;
const measured = pe.rateArcsecPerCentury - pn.rateArcsecPerCentury;
out.mercury = { measuredGrArcsecPerCentury: measured, predictedArcsecPerCentury: predicted,
  relativeError: (measured - predicted) / predicted, passed: Math.abs(measured - predicted) / predicted <= 0.02 };
console.log(JSON.stringify(out.mercury));
}
out.sunGm = process.env.SUN_GM === "iau" ? "iau-nominal" : "G_SI*massKg";
console.warn = quiet;
mkdirSync("output/s4", { recursive: true });
writeFileSync(`output/s4/horizons-error${process.env.SUN_GM === "iau" ? "-sun-gm-iau" : ""}.json`, JSON.stringify(out, null, 1) + "\n");
