/** A11/S4: same hourly DP advancement, old and new forces vs the existing Horizons checkpoints.
 * Defaults to +30d on all bodies. A11_MAX_DAYS can enable longer runs; 600 s hard run budget.
 * A11_PLANET_OUTPUT writes the measured errors; no reference data is regenerated.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { SolarSystemPhysics } = require("../../app/lib/solarSystemPhysics") as typeof import("../../app/lib/solarSystemPhysics");
const { SOLAR_SYSTEM_BODIES } = require("../../app/data/planetsJ2000") as typeof import("../../app/data/planetsJ2000");
const { AU_METERS, C_LIGHT, DAY_SECONDS } = require("../../app/lib/physicalConstants") as typeof import("../../app/lib/physicalConstants");
const { defaultEps2Meters } = require("../../app/lib/physicsEngine") as typeof import("../../app/lib/physicsEngine");
const started = performance.now();
const maxDays = Number(process.env.A11_MAX_DAYS ?? 30);
if (!Number.isFinite(maxDays) || maxDays < 30) throw new Error("A11_MAX_DAYS must be at least 30");
const ref = JSON.parse(readFileSync("public/data/horizons-validation-j2000.json", "utf8"));
const rows: { model: string; checkpoint: string; body: string; legacyKm: number; correctedKm: number; deltaKm: number }[] = [];
for (const model of ["newton", "eih"] as const) {
  const legacy = new SolarSystemPhysics({ forceFixedRk4: false, enableJ2Dynamics: false, jovianSatelliteEps2Meters: defaultEps2Meters() });
  const corrected = new SolarSystemPhysics({ forceFixedRk4: false });
  let seconds = 0;
  for (const cp of ref.checkpoints) {
    if (cp.offsetDays === 0 || cp.offsetDays > maxDays) continue;
    const target = cp.offsetDays * DAY_SECONDS;
    while (seconds < target) {
      if (performance.now() - started > 590_000) throw new Error("A11 resource limit: 600 s; regression incomplete");
      const dt = Math.min(3600, target - seconds);
      for (const p of [legacy, corrected]) {
        const metrics = p.stepSimulatedSeconds(dt, model === "eih" ? 1 / C_LIGHT ** 2 : 0);
        if (metrics.mode !== "dp" || Math.abs(metrics.simSecondsAdvanced - dt) > 1e-6)
          throw new Error(`regression rejects fallback: ${JSON.stringify(metrics)}`);
      }
      seconds += dt;
    }
    for (const b of cp.bodies) {
      const i = SOLAR_SYSTEM_BODIES.findIndex((x) => x.id === b.id);
      if (i < 1 || !["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "moon"].includes(b.id)) continue;
      const error = (p: InstanceType<typeof SolarSystemPhysics>) => Math.hypot(
        p.posAu[3 * i] - p.posAu[0] - b.x_au,
        p.posAu[3 * i + 1] - p.posAu[1] - b.y_au,
        p.posAu[3 * i + 2] - p.posAu[2] - b.z_au,
      ) * AU_METERS / 1000;
      const legacyKm = error(legacy), correctedKm = error(corrected);
      rows.push({ model, checkpoint: cp.label, body: b.id, legacyKm, correctedKm, deltaKm: correctedKm - legacyKm });
    }
    console.log(JSON.stringify({ model, checkpoint: cp.label, rows: rows.filter((r) => r.model === model && r.checkpoint === cp.label) }));
  }
}
const passed = rows.length > 0 && rows.every((r) => Number.isFinite(r.correctedKm) && r.correctedKm <= r.legacyKm);
const report = { elapsedSeconds: (performance.now() - started) / 1000, maxDays, bodies: SOLAR_SYSTEM_BODIES.length, stepSeconds: 3600, fallbackCount: 0, rows, passed };
if (process.env.A11_PLANET_OUTPUT) writeFileSync(process.env.A11_PLANET_OUTPUT, JSON.stringify(report, null, 2) + "\n");
console.log(`Horizons non-regression (+${maxDays}d maximum): ${passed ? "PASS" : "FAIL"}`);
process.exitCode = passed ? 0 : 1;
