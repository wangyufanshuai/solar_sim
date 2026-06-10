import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outputDir = process.argv[2] ?? "public/data/review-demo";
mkdirSync(outputDir, { recursive: true });

const review = {
  schemaVersion: 1,
  id: "review-demo-evjs",
  createdAt: new Date("2026-06-10T00:00:00.000Z").toISOString(),
  projectId: "demo-project",
  scenarioId: "demo-scenario",
  runId: "demo-run",
  planId: "demo-plan",
  verdict: "warning",
  inputHash: "fnv1a-demo",
  solverVersion: "solar-sim-mission-worker-2",
  spiceChecksum: "demo-spice-checksum",
  reportReadiness: "partial",
  comparisonRows: [],
  engineeringMatrix: [],
  monteCarlo: {
    id: "risk-demo",
    runId: "demo-run",
    planId: "demo-plan",
    createdAt: new Date("2026-06-10T00:00:00.000Z").toISOString(),
    config: {
      seed: "solar-sim-review-v1",
      samples: 64,
      departureSigmaDays: 4,
      tofSigmaFraction: 0.018,
      dsmReserveSigmaFraction: 0.12,
      navigationSigmaKm: 350,
      ispSigmaSeconds: 3,
      dryMassSigmaKg: 75,
    },
    successRate: 0.78,
    robustnessGrade: "B",
    failReasonHistogram: { "finite-thrust-unverified": 64, "constraint-margin": 6 },
    c3: { p10: 42, p50: 45, p90: 48, worst: 49, unit: "km^2/s^2" },
    deltaV: { p10: 8.8, p50: 9.1, p90: 9.5, worst: 9.8, unit: "km/s" },
    arrivalThreeSigma: { p10: 9000, p50: 11000, p90: 14000, worst: 15000, unit: "km" },
    minimumConstraintMargin: { p10: 0.2, p50: 0.6, p90: 1.1, worst: 0.05, unit: "margin" },
    dominantFailureReason: "finite-thrust-unverified",
    preliminaryCaveat: "Monte Carlo Lite uses deterministic design perturbations for preliminary risk review only.",
  },
  artifactRecords: [],
  topRisks: ["Finite-thrust solve unavailable or audit-only seed", "Monte Carlo: finite-thrust-unverified"],
  exportReadiness: { report: true, ccsdsOem: true, ccsdsOpm: true, reviewPackage: true },
  caveat: "Preliminary mission design review package only. Not GMAT/STK/SPICE certification.",
};

const markdown = `# Solar Sim Mission Design Review

${review.caveat}

- Verdict: ${review.verdict}
- Run: ${review.runId}
- Plan: ${review.planId}
- Monte Carlo success: ${(review.monteCarlo.successRate * 100).toFixed(1)}%
- Dominant failure: ${review.monteCarlo.dominantFailureReason}

## Top Risks
${review.topRisks.map((risk) => `- ${risk}`).join("\n")}
`;

writeFileSync(join(outputDir, "solar-sim-demo-review.json"), `${JSON.stringify(review, null, 2)}\n`);
writeFileSync(join(outputDir, "solar-sim-demo-review.md"), markdown);
console.log(`PASS demo review exported to ${outputDir}`);
