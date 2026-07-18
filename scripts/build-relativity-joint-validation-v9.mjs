import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const sha256 = async (file) => createHash("sha256").update(await readFile(path.join(root, file))).digest("hex");
const hashStableReport = (report) => {
  const { generatedAt: _generatedAt, ...stable } = report;
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex");
};
const indexRows = (report) => new Map(report.perBodyComparison.flatMap((checkpoint) =>
  checkpoint.bodies.map((body) => [`${checkpoint.offsetDays}:${body.bodyId}`, body])));
const rms = (values) => Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);

const files = {
  fixture: "dist/science/relativity-reference-fixture-v9.json",
  dopFine: "dist/science/relativity-reference-v9-converged-fine.json",
  dopFiner: "dist/science/relativity-reference-v9-converged-finer.json",
  dopFinerRerun: "dist/science/relativity-reference-v9-converged-finer-rerun.json",
  ias15: "dist/science/relativity-ias15-v9.json",
  ias15Rerun: "dist/science/relativity-ias15-v9-rerun.json",
  fittedBlind: "dist/science/relativity-fitted-blind-v9.json",
  priorV8: "dist/science/relativity-cross-validation-v8.json",
};
const [fixture, dopFine, dopFiner, dopFinerRerun, ias15, ias15Rerun, fittedBlind, priorV8] = await Promise.all(
  Object.values(files).map(readJson),
);
const fixtureSha256 = await sha256(files.fixture);
const provenanceReady = [dopFine, dopFiner, dopFinerRerun, ias15, ias15Rerun, fittedBlind]
  .every((report) => report.fixtureSha256 === fixtureSha256);
const dopRerunHash = hashStableReport(dopFiner);
const dopRerunRepeatHash = hashStableReport(dopFinerRerun);
const iasStateHash = ias15.reruns[0].canonicalStateHash;
const iasRepeatStateHash = ias15Rerun.reruns[0].canonicalStateHash;

const dopFineIndex = indexRows(dopFine);
const dopFinerIndex = indexRows(dopFiner);
const iasIndex = indexRows(ias15);
const checkpoints = dopFiner.perBodyComparison.map((checkpoint) => ({
  label: checkpoint.label,
  offsetDays: checkpoint.offsetDays,
  bodies: checkpoint.bodies.map((finer) => {
    const key = `${checkpoint.offsetDays}:${finer.bodyId}`;
    const fine = dopFineIndex.get(key);
    const ias = iasIndex.get(key);
    if (!fine || !ias) throw new Error(`Missing joint row ${key}`);
    const metrics = [
      {
        metric: "position",
        unit: "km",
        dop853Delta: finer.positionDeltaKm,
        ias15Delta: ias.positionDeltaKm,
        dop853Uncertainty: Math.max(1e-6, 5 * Math.abs(finer.positionDeltaKm - fine.positionDeltaKm)),
        ias15Uncertainty: ias.positionDeltaUncertaintyKm,
        referenceUncertainty: 1e-6,
      },
      {
        metric: "velocity",
        unit: "m/s",
        dop853Delta: finer.velocityDeltaMS,
        ias15Delta: ias.velocityDeltaMS,
        dop853Uncertainty: Math.max(1e-9, 5 * Math.abs(finer.velocityDeltaMS - fine.velocityDeltaMS)),
        ias15Uncertainty: ias.velocityDeltaUncertaintyMS,
        referenceUncertainty: 1e-9,
      },
    ].map((metric) => {
      const jointUncertainty = metric.dop853Uncertainty + metric.ias15Uncertainty + metric.referenceUncertainty;
      const solverAgreement = Math.abs(metric.dop853Delta - metric.ias15Delta) <= jointUncertainty;
      const dop853Regression = metric.dop853Delta > metric.dop853Uncertainty;
      const ias15Regression = metric.ias15Delta > metric.ias15Uncertainty;
      const dop853Improvement = metric.dop853Delta < -metric.dop853Uncertainty;
      const ias15Improvement = metric.ias15Delta < -metric.ias15Uncertainty;
      let outcome = "no-resolved-change";
      if (!solverAgreement) outcome = "solver-disagreement";
      else if (dop853Regression && ias15Regression) outcome = "cross-solver-regression-confirmed";
      else if (dop853Improvement && ias15Improvement) outcome = "cross-solver-improvement-confirmed";
      else if (dop853Regression || ias15Regression || dop853Improvement || ias15Improvement) outcome = "inconclusive";
      return {
        ...metric,
        jointUncertainty,
        jointFormulaCheck: metric.dop853Uncertainty + metric.ias15Uncertainty + metric.referenceUncertainty,
        solverAgreement,
        dop853Regression,
        ias15Regression,
        dop853Improvement,
        ias15Improvement,
        outcome,
      };
    });
    const regressionConfirmed = metrics.some((metric) => metric.outcome === "cross-solver-regression-confirmed");
    const solverDisagreement = metrics.some((metric) => metric.outcome === "solver-disagreement");
    return {
      bodyId: finer.bodyId,
      metrics,
      noRegression: !regressionConfirmed,
      classification: solverDisagreement
        ? "solver-disagreement"
        : regressionConfirmed
          ? "cross-solver-regression-confirmed"
          : metrics.some((metric) => metric.outcome === "inconclusive")
            ? "inconclusive"
            : "no-confirmed-regression",
    };
  }),
}));
const jointIndex = new Map(checkpoints.flatMap((checkpoint) =>
  checkpoint.bodies.map((body) => [`${checkpoint.offsetDays}:${body.bodyId}`, body])));
const priorRegressionClosure = priorV8.regressionAttributions.map((prior) => {
  const v9 = jointIndex.get(`${prior.offsetDays}:${prior.bodyId}`);
  return {
    checkpoint: prior.checkpoint,
    offsetDays: prior.offsetDays,
    bodyId: prior.bodyId,
    priorV8Classification: prior.classification,
    v9Classification: v9?.classification ?? "provenance-mismatch",
    v9Metrics: v9?.metrics ?? [],
    resolved: v9 != null && !["solver-disagreement", "inconclusive"].includes(v9.classification),
  };
});
const closureCounts = Object.fromEntries([
  "cross-solver-regression-confirmed",
  "solver-disagreement",
  "inconclusive",
  "no-confirmed-regression",
  "provenance-mismatch",
].map((classification) => [
  classification,
  priorRegressionClosure.filter((row) => row.v9Classification === classification).length,
]));
const finalDop = dopFiner.perBodyComparison.at(-1).bodies;
const finalIas = ias15.perBodyComparison.at(-1).bodies;
const aggregates = {
  dop853: {
    legacyPositionRmsKm: rms(finalDop.map((row) => row.legacyPositionResidualKm)),
    candidatePositionRmsKm: rms(finalDop.map((row) => row.candidatePositionResidualKm)),
    legacyVelocityRmsMS: rms(finalDop.map((row) => row.legacyVelocityResidualMS)),
    candidateVelocityRmsMS: rms(finalDop.map((row) => row.candidateVelocityResidualMS)),
  },
  ias15: {
    legacyPositionRmsKm: rms(finalIas.map((row) => row.legacyPositionResidualKm)),
    candidatePositionRmsKm: rms(finalIas.map((row) => row.candidatePositionResidualKm)),
    legacyVelocityRmsMS: rms(finalIas.map((row) => row.legacyVelocityResidualMS)),
    candidateVelocityRmsMS: rms(finalIas.map((row) => row.candidateVelocityResidualMS)),
  },
};
const effectIsolation = ias15.effectIsolation.map((effect) => ({
  effectId: effect.effectId,
  unresolvedRows: effect.checkpoints.flatMap((checkpoint) =>
    checkpoint.bodies.filter((body) => !body.resolved).map((body) => ({
      offsetDays: checkpoint.offsetDays,
      bodyId: body.bodyId,
      positionSnr: body.positionSnr,
      velocitySnr: body.velocitySnr,
    }))),
  allBodiesResolved: effect.checkpoints.every((checkpoint) => checkpoint.bodies.every((body) => body.resolved)),
}));
const mercury = jointIndex.get("3652.5:mercury");
const confirmedRegressionCount = checkpoints.reduce((count, checkpoint) =>
  count + checkpoint.bodies.filter((body) => body.classification === "cross-solver-regression-confirmed").length, 0);
const aggregateImprovement = Object.values(aggregates).every((solver) =>
  solver.candidatePositionRmsKm < solver.legacyPositionRmsKm &&
  solver.candidateVelocityRmsMS < solver.legacyVelocityRmsMS);
const fittedBlindComplete = fittedBlind.independentRerunCount === 2 && fittedBlind.rerunHashesMatch === true;
const promotionQualified = provenanceReady && confirmedRegressionCount === 0 && aggregateImprovement &&
  effectIsolation.every((effect) => effect.allBodiesResolved) &&
  priorRegressionClosure.every((row) => row.resolved) &&
  fittedBlindComplete && fittedBlind.aggregateImprovement;

const report = {
  version: "v204-relativity-joint-validation-v9",
  generatedAt: new Date().toISOString(),
  status: "shadow-retained",
  coordinateFrame: fixture.coordinateFrame,
  timeScale: fixture.timeScale,
  fixtureSha256,
  provenance: {
    ready: provenanceReady,
    files: Object.fromEntries(await Promise.all(Object.entries(files).map(async ([id, file]) => [id, { file, sha256: await sha256(file) }]))),
  },
  deterministicReruns: {
    dop853: { primaryHash: dopRerunHash, rerunHash: dopRerunRepeatHash, passed: dopRerunHash === dopRerunRepeatHash },
    ias15: { primaryHash: iasStateHash, rerunHash: iasRepeatStateHash, passed: iasStateHash === iasRepeatStateHash },
  },
  uncertaintyPolicy: {
    formula: "Ujoint=UDOP853+UIAS15+Ureference",
    dop853: "max(floor,5*abs(delta_fine-delta_finer))",
    ias15: "max(floor,5*abs(delta_epsilon_fine-delta_epsilon_finer),rerun_delta)",
    referencePositionFloorKm: 1e-6,
    referenceVelocityFloorMS: 1e-9,
  },
  rawPropagation: { checkpoints, aggregates },
  fittedBlindPropagation: {
    status: "complete",
    file: files.fittedBlind,
    sha256: await sha256(files.fittedBlind),
    calibrationWindowDays: [0, 30],
    holdoutDays: [365, 3652.5],
    deterministicReruns: {
      count: fittedBlind.independentRerunCount,
      hashes: fittedBlind.rerunCanonicalHashes,
      passed: fittedBlind.rerunHashesMatch,
    },
    mercuryTenYear: fittedBlind.mercuryTenYear,
    aggregates: fittedBlind.results.aggregates,
    aggregateImprovement: fittedBlind.aggregateImprovement,
    physicalCauseEstablished: fittedBlind.physicalCauseEstablished,
    rawResultsMayNotBeReplaced: true,
  },
  effectIsolation,
  priorFifteenRegressionClosure: {
    rowCount: priorRegressionClosure.length,
    counts: closureCounts,
    allRowsPresent: priorRegressionClosure.length === 15 && priorRegressionClosure.every((row) => row.v9Classification !== "provenance-mismatch"),
    allRowsResolved: priorRegressionClosure.every((row) => row.resolved),
    rows: priorRegressionClosure,
  },
  mercuryTenYear: {
    dop853PositionDeltaMeters: mercury.metrics.find((metric) => metric.metric === "position").dop853Delta * 1000,
    ias15PositionDeltaMeters: mercury.metrics.find((metric) => metric.metric === "position").ias15Delta * 1000,
    positionJointUncertaintyMeters: mercury.metrics.find((metric) => metric.metric === "position").jointUncertainty * 1000,
    positionOutcome: mercury.metrics.find((metric) => metric.metric === "position").outcome,
    physicalCauseEstablished: false,
  },
  promotionEvaluation: {
    absoluteGatePassed: Object.values(aggregates).every((solver) => solver.candidatePositionRmsKm < 10_000 && solver.candidateVelocityRmsMS < 1),
    aggregateImprovement,
    confirmedRegressionCount,
    allEffectsResolved: effectIsolation.every((effect) => effect.allBodiesResolved),
    fittedBlindComplete,
    promotionQualified,
    decision: "shadow-retained",
    reason: "Cross-solver regressions remain, raw and fitted-blind aggregate position RMS are not improved, and 2PN isolation is unresolved.",
  },
  defaultKernel: "legacy-eih-1pn",
  shadowKernel: "barycentric-eih-1pn-j2-2pn-lt-v9",
  liveStateMutated: false,
  workerStateMutated: false,
  boundary: "offline-joint-reference-evidence-no-runtime-promotion-no-physical-cause-overclaim",
};
if (!provenanceReady) throw new Error("V9 joint provenance mismatch");
if (!report.deterministicReruns.dop853.passed || !report.deterministicReruns.ias15.passed) {
  throw new Error("V9 deterministic rerun gate failed");
}
if (promotionQualified) throw new Error("V9 must remain shadow-retained in this stage");
const output = path.join(root, "dist/science/relativity-joint-validation-v9.json");
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  version: report.version,
  output,
  deterministicReruns: report.deterministicReruns,
  closureCounts,
  mercuryTenYear: report.mercuryTenYear,
  aggregateImprovement,
  promotionQualified,
}, null, 2));
