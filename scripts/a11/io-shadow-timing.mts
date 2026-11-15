/**
 * A11 acceptance: Io's shadow on Jupiter, event times from the app's N-body integrator vs
 * JPL Horizons.
 *
 * Event definition (same on both sides): the shadow axis uses parallel rays along the Sun direction
 * seen from Jupiter (a finite-Sun-distance approximation, unchanged from the original test). Ingress / egress are the instants it starts / stops meeting Jupiter's sphere
 * (mean radius 69 911 km, as in the renderer), i.e. the perpendicular distance of Jupiter's
 * centre from that parallel shadow-axis line crosses R_J while Io is on the sunward side. This is the
 * shadow centre touching the limb, not first/last contact of the penumbra. Times are
 * found by linear interpolation of that distance between 1-minute samples (it changes by
 * ~1 000 km per minute and is close to linear over one minute).
 *
 * Reference: Horizons VECTORS, Io (501) and Sun (10) relative to Jupiter (500@599), ecliptic
 * J2000, TDB, geometric (no light-time), 1-minute steps, 2000-01-20 00:00 to 2000-01-23 00:00.
 * With a raw-data directory argument the reference events are recomputed from the two
 * Horizons text files and written to scripts/a11/horizons-io-shadow-events.json.
 *
 * Simulation: SolarSystemPhysics from its J2000 ephemeris (2000-01-01 12:00 TDB), adaptive
 * DP5(4) as in the app, run Newton and EIH 1PN, sampled every 60 s over the same window. Default app force model; no RK4 fallback allowed.
 * Set A11_OUTPUT to write the numeric result as JSON.
 *
 * Run from next-web:  npx tsx scripts/a11/io-shadow-timing.mts [rawHorizonsDir]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { SolarSystemPhysics } = require("../../app/lib/solarSystemPhysics") as typeof import("../../app/lib/solarSystemPhysics");
const { SOLAR_SYSTEM_BODIES } = require("../../app/data/planetsJ2000") as typeof import("../../app/data/planetsJ2000");
const { C_LIGHT, AU_METERS, DAY_SECONDS } = require("../../app/lib/physicalConstants") as typeof import("../../app/lib/physicalConstants");
const { BODY_RADIUS_KM } = require("../../app/lib/eclipseShadow") as typeof import("../../app/lib/eclipseShadow");

type V = [number, number, number];
type Event = { kind: "ingress" | "egress"; jdTdb: number };
const R_J = BODY_RADIUS_KM.jupiter;
const EPOCH_JD = 2451545.0;
const START_JD = 2451563.5; // 2000-01-20 00:00 TDB
const MINUTES = 3 * 24 * 60;
const REF_PATH = "scripts/a11/horizons-io-shadow-events.json";

/** signed distance (km) of the shadow axis from Jupiter's limb; NaN when Io is anti-sunward */
function axisMinusRadius(io: V, sun: V): number {
  const sl = Math.hypot(...sun);
  const s = sun.map((x) => x / sl) as V;
  const along = io[0] * s[0] + io[1] * s[1] + io[2] * s[2];
  if (along <= 0) return NaN;
  return Math.hypot(io[0] - along * s[0], io[1] - along * s[1], io[2] - along * s[2]) - R_J;
}

function events(jd: number[], f: number[]): Event[] {
  const out: Event[] = [];
  for (let k = 1; k < jd.length; k++) {
    const a = f[k - 1], b = f[k];
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.sign(a) === Math.sign(b)) continue;
    out.push({ kind: a > 0 ? "ingress" : "egress", jdTdb: jd[k - 1] + ((jd[k] - jd[k - 1]) * a) / (a - b) });
  }
  return out;
}

function readHorizons(path: string): { jd: number[]; v: V[] } {
  const text = readFileSync(path, "utf8");
  const body = text.slice(text.indexOf("$$SOE") + 5, text.indexOf("$$EOE"));
  const jd: number[] = [], v: V[] = [];
  for (const line of body.split("\n")) {
    const c = line.split(",").map((x) => x.trim());
    if (c.length < 5 || !c[0]) continue;
    jd.push(Number(c[0]));
    v.push([Number(c[2]), Number(c[3]), Number(c[4])]);
  }
  return { jd, v };
}

let reference: Event[];
if (process.argv[2]) {
  const io = readHorizons(`${process.argv[2]}/horizons-501-wrt-599.txt`);
  const sun = readHorizons(`${process.argv[2]}/horizons-10-wrt-599.txt`);
  if (io.jd.length !== MINUTES + 1 || sun.jd.length !== io.jd.length) throw new Error("unexpected Horizons row count");
  reference = events(io.jd, io.v.map((p, k) => axisMinusRadius(p, sun.v[k])));
  writeFileSync(REF_PATH, JSON.stringify({
    source: "JPL Horizons API, VECTORS, COMMAND 501 and 10, CENTER 500@599, ecliptic J2000, TDB, geometric, 1 m steps, 2000-01-20 00:00 to 2000-01-23 00:00; fetched 2026-11-15",
    definition: "shadow axis (Io, away from the Sun) meets Jupiter's sphere R = 69911 km",
    events: reference,
  }, null, 2) + "\n");
} else {
  reference = JSON.parse(readFileSync(REF_PATH, "utf8")).events;
}

const ids = SOLAR_SYSTEM_BODIES.map((b) => b.id);
const iSun = ids.indexOf("sun"), iJup = ids.indexOf("jupiter"), iIo = ids.indexOf("io");
const AU_KM = AU_METERS / 1000;
const rel = (p: InstanceType<typeof SolarSystemPhysics>, i: number): V => [
  (p.posAu[3 * i] - p.posAu[3 * iJup]) * AU_KM,
  (p.posAu[3 * i + 1] - p.posAu[3 * iJup + 1]) * AU_KM,
  (p.posAu[3 * i + 2] - p.posAu[3 * iJup + 2]) * AU_KM,
];

const fmt = (jd: number) => new Date((jd - 2440587.5) * 86400e3).toISOString().slice(0, 19).replace("T", " ");
console.log(`reference (Horizons): ${reference.map((e) => `${e.kind} ${fmt(e.jdTdb)} TDB`).join(", ")}`);
const started = performance.now();
const result: Record<string, { kind: string; horizons: string; sim: string; diffS: number }[]> = {};
for (const mode of ["newton", "eih"] as const) {
  const p = new SolarSystemPhysics({ forceFixedRk4: false });
  p.resetFromEphemeris();
  const inv = mode === "eih" ? 1 / (C_LIGHT * C_LIGHT) : 0;
  const advance = (seconds: number) => {
    if (performance.now() - started > 590_000) throw new Error("A11 resource limit: 600 s; no scientific pass");
    const metrics = p.stepSimulatedSeconds(seconds, inv);
    if (metrics.mode !== "dp" || Math.abs(metrics.simSecondsAdvanced - seconds) > 1e-6)
      throw new Error(`A11 rejects fallback/incomplete integration: ${JSON.stringify(metrics)}`);
  };
  // Bound individual calls so the UI work budget cannot silently trigger RK4 fallback.
  const warmup = (START_JD - EPOCH_JD) * DAY_SECONDS;
  for (let t = 0; t < warmup; t += 3600) {
    advance(Math.min(3600, warmup - t));
    if (t % DAY_SECONDS === 0) console.log(`${mode}: warmup day ${t / DAY_SECONDS}`);
  }
  p.syncPosAu();
  const jd: number[] = [], f: number[] = [];
  for (let k = 0; k <= MINUTES; k++) {
    if (k > 0) { advance(60); p.syncPosAu(); }
    if (k % 1440 === 0) console.log(`${mode}: sampling day ${k / 1440}`);
    jd.push(START_JD + k / 1440);
    f.push(axisMinusRadius(rel(p, iIo), rel(p, iSun)));
  }
  const sim = events(jd, f);
  result[mode] = reference.map((r) => {
    const m = sim.filter((e) => e.kind === r.kind).sort((a, b) => Math.abs(a.jdTdb - r.jdTdb) - Math.abs(b.jdTdb - r.jdTdb))[0];
    return { kind: r.kind, horizons: fmt(r.jdTdb), sim: m ? fmt(m.jdTdb) : "none", diffS: m ? (m.jdTdb - r.jdTdb) * 86400 : NaN };
  });
}
for (const [mode, rows] of Object.entries(result)) {
  for (const r of rows) console.log(`${mode.padEnd(6)} ${r.kind.padEnd(7)} Horizons ${r.horizons}  sim ${r.sim}  Δ = ${r.diffS.toFixed(1)} s`);
}
const worst = Math.max(...Object.values(result).flat().map((r) => Math.abs(r.diffS)));
if (process.env.A11_OUTPUT) writeFileSync(process.env.A11_OUTPUT, JSON.stringify({
  generatedAt: new Date().toISOString(), elapsedSeconds: (performance.now() - started) / 1000,
  bodies: SOLAR_SYSTEM_BODIES.length, warmupChunkSeconds: 3600, sampleSeconds: 60,
  jovianSatelliteSofteningMeters: 10000, jupiterJ2: true, fallbackCount: 0,
  result, worstSeconds: worst, acceptanceSeconds: 60, passed: worst < 60,
}, null, 2) + "\n");
console.log(`worst |Δt| = ${worst.toFixed(1)} s (acceptance: < 60 s) → ${worst < 60 ? "PASS" : "FAIL"}`);
process.exitCode = worst < 60 ? 0 : 1;
