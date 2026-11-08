/**
 * Roadmap S5: export the real verification results shown on /lab into one static JSON.
 * Reads the standalone NR repository (NR_ROOT, default E:/xuexi/solar-sim-nr) and this repo's
 * Kerr and S4 records; it copies numbers, it does not recompute anything.
 *
 *   npx tsx scripts/export-relativity-lab.mts
 * Writes app/data/relativityLab.generated.json.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const NR = process.env.NR_ROOT ?? "E:/xuexi/solar-sim-nr";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const sha = (cwd: string) => execSync("git rev-parse --short HEAD", { cwd }).toString().trim();

const v2Run = join(NR, ".release-local/binary64-v2-richardson-20261103-r2/outputs/binary64-v2-20261103-02");
const v2Prod = read(join(v2Run, "production/acceptance.json"));
const v2Replay = read(join(v2Run, "replay/acceptance.json"));
const v2Compare = read(join(v2Run, "comparison.json"));
const v1Prod = read(join(NR, ".release-local/binary64-startup2g-20261029/outputs/binary64-startup2g-20261103-04/production/acceptance.json"));
const s2 = read(join(NR, "outputs/s2-20261105-01/summary.json"));
const s2Robust = [2, 4].map((order) => read(join(NR, `outputs/s2-20261105-01/robust-fd${order}.json`)));
const s2c = read(join(NR, "docs/s2c-v2-summary-20261105.json"));
const kerrGpu = read("app/lib/kerr-v4/validation/validation-128-step0.04-gpu.json");
const kerrBench = read("app/lib/kerr-v4/validation/benchmark-2026-11-05.json");
const s4 = read("docs/s4/horizons-error-20261105.json");
const s4Iau = read("docs/s4/horizons-error-sun-gm-iau-20261105.json");

const tenYear = (rows: any[]) => Object.fromEntries(
  rows.filter((r) => r.checkpoint === "+10y").map((r) => [r.body, Math.round(r.errorKm)]),
);

const out = {
  generatedAt: new Date().toISOString(),
  sources: { nrRepository: "github.com/wangyufanshuai/solar-sim-nr", nrCommit: sha(NR), siteCommit: sha(".") },
  s1: {
    v1: { passed: v1Prod.acceptance.accepted, physical43AllSlots: v1Prod.physical43.all_slots,
      note: "1 of 99,760 physical43 slots exceeded 64*eps^2 by 0.5% (error scales exactly as eps^2)" },
    v2: {
      passed: v2Prod.acceptance.accepted && v2Replay.acceptance.accepted && v2Compare.accepted,
      productionWorst: { rhs: v2Prod.rhs.richardson_worst_ratio, physical43: v2Prod.physical43.richardson_worst_ratio,
        modal: v2Prod.modal.richardson_worst_ratio },
      replayWorst: Object.fromEntries(Object.entries(v2Replay.richardson).map(([k, v]: [string, any]) =>
        [k, Math.max(...v.map((r: any) => r.worst_ratio))])),
      negativeControlsDetected: v2Prod.negative_controls.filter((c: any) => c.accepted).length,
      negativeControls: v2Prod.negative_controls.length,
      registeredAfterSeeingV1: true,
    },
  },
  s2: {
    spatial: { fd2: s2.checks.spatial_fd2, fd4: s2.checks.spatial_fd4, points: [16, 32, 64] },
    time: { ...s2.checks.time_fd4, cfls: [0.8, 0.4, 0.2] },
    robustRun01: {
      passed: s2.checks.robust_fd2.passed && s2.checks.robust_fd4.passed,
      series: s2Robust.map((r) => ({ order: r.order, samples: r.samples.map((x: any) => [x.time, x.growth_ratio]) })),
    },
    robustV2: { passed: s2c.passed, runs: Object.fromEntries(Object.entries(s2c).filter(([k]) => k !== "passed")),
      registeredAfterSeeingRun01: true },
  },
  kerr: {
    renderer: kerrGpu.renderer,
    configs: kerrGpu.summary.map((c: any) => ({ config: c.config, statusAgreement: c.statusAgreement,
      redshiftMaxRelErr: c.redshiftRelErr.max })),
    benchmark: kerrBench.results.filter((r: any) => r.mode === "cinematic")
      .map((r: any) => ({ label: r.label, w: r.w, h: r.h, medianMs: r.medianMs })),
  },
  s4: {
    mercury: s4.mercury,
    tenYearErrorKm: { current: tenYear(s4.part1[0].rows), iauSunGm: tenYear(s4Iau.part1[0].rows) },
  },
};
writeFileSync("app/data/relativityLab.generated.json", JSON.stringify(out, null, 1) + "\n");
console.log("wrote app/data/relativityLab.generated.json", out.sources);
