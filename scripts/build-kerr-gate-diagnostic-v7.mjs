import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const inputFile = path.join(root, "dist", "science", "kerr-dense-gate-v7.json");
const outputFile = path.join(root, "dist", "science", "kerr-dense-gate-v7-diagnostic.json");
const input = JSON.parse(await readFile(inputFile, "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const critical = input.rays.filter((ray) => ray.rayClass === "critical-bracket");
const pairRows = [...new Set(critical.map((ray) => Number(ray.source.pair)))].map((pair) => {
  const sides = Object.fromEntries(
    critical.filter((ray) => Number(ray.source.pair) === pair).map((ray) => [
      ray.source.side,
      {
        rayId: ray.id,
        offsetPx: ray.source.offsetPx,
        classifications: [...new Set(ray.executions.map((execution) => execution.status))],
      },
    ]),
  );
  const collapsed =
    sides.inner?.classifications.length === 1 &&
    sides.outer?.classifications.length === 1 &&
    sides.inner.classifications[0] === sides.outer.classifications[0];
  return { pair, sides, collapsedToSameClassification: collapsed };
});

const solverAgreementRows = input.rays.flatMap((ray) => {
  const lookup = new Map(
    ray.executions.map((execution) => [
      `${execution.solver}:${execution.tolerance}:${execution.run}`,
      execution,
    ]),
  );
  return ["fine", "finer"].flatMap((tolerance) => ["A", "B"].map((run) => ({
    rayId: ray.id,
    tolerance,
    run,
    agrees:
      lookup.get(`carter-mino-dop853:${tolerance}:${run}`)?.status ===
      lookup.get(`kerr-schild-hamiltonian-dop853:${tolerance}:${run}`)?.status,
  })));
});
const stable = {
  version: "v242-kerr-dense-short-gate-v7-diagnostic",
  source: "dist/science/kerr-dense-gate-v7.json",
  sourceSha256: sha256(await readFile(inputFile)),
  sourceCanonicalEvidenceSha256: input.canonicalEvidenceSha256,
  gatePassed: false,
  observed: {
    executionCount: input.evaluation.executionCount,
    invalidCount: input.evaluation.invalidCount,
    nonPhysicalCount: input.evaluation.nonPhysicalCount,
    deterministicFailureCount: input.evaluation.deterministicFailureCount,
    maxNullConstraint: input.evaluation.maxNullConstraint,
    nullConstraintGatePassed: input.evaluation.maxNullConstraint < 1e-10,
    radiativeEvidencePassed: input.evaluation.radiativeEvidencePassed,
    solverClassificationAgreement:
      solverAgreementRows.filter((row) => row.agrees).length / solverAgreementRows.length,
    criticalTransitionCount: input.evaluation.criticalTransitionCount,
    criticalTransitionExpected: input.evaluation.criticalTransitionExpected,
    selectedCriticalPairCount: pairRows.length,
    collapsedCriticalPairCount: pairRows.filter((row) => row.collapsedToSameClassification).length,
    pairs: pairRows,
  },
  attribution: {
    status: "reference-projection-mismatch-suspected-not-repaired",
    rootCauseEstablished: false,
    mostLikelyCause:
      "asymptotic-critical-curve-center-does-not-bracket-the-finite-radius-zamo-separatrix",
    evidence: [
      "all-128-executions-are-physical-and-A-B-deterministic",
      "both-independent-solvers-agree-on-every-selected-ray-classification",
      "all-five-selected-critical-pairs-collapse-to-the-same-classification-on-both-sides",
      "release-plan-centers-brackets-on-an-asymptotic-analytic-critical-curve-and-projects-it-to-a-radius-50M-ZAMO-screen-without-a-finite-distance-separatrix-root-solve",
      "the-plus-minus-quarter-pixel-offset-therefore-does-not-straddle-the-numerical-capture-boundary",
    ],
    alternativesNotExcluded: [
      "nearest-analytic-curve-sampling-error",
      "finite-distance-ZAMO-frame-dragging-correction",
      "screen-basis-impact-parameter-conversion-error",
    ],
  },
  requiredNextAction: {
    campaignMayStart: false,
    automaticRetryAllowed: false,
    thresholdWideningAllowed: false,
    frozenV5ManifestMutated: false,
    releaseRunnerMutated: false,
    recommendation:
      "authorize-a-new-versioned-v8-finite-observer-critical-separatrix-mapping-and-independent-short-gate-before-any-release-shard-campaign",
  },
  promotionDecision: "shadow-retained",
  boundary: "diagnostic-only-no-ray-rerun-no-runtime-or-frozen-gate-mutation",
};
const document = {
  ...stable,
  canonicalEvidenceSha256: sha256(JSON.stringify(stable)),
};
await writeFile(outputFile, `${JSON.stringify(document, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(root, outputFile).replaceAll("\\", "/"),
  gatePassed: false,
  solverClassificationAgreement: document.observed.solverClassificationAgreement,
  collapsedCriticalPairs: `${document.observed.collapsedCriticalPairCount}/${document.observed.selectedCriticalPairCount}`,
  attribution: document.attribution.status,
  canonicalEvidenceSha256: document.canonicalEvidenceSha256,
}, null, 2));
