import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  createMeasuredVisiblePhotonErrorBudgetV385,
  parseMeasuredVisiblePhotonErrorBudgetArtifactV385,
  V385_ORACLE_RELATIVE_DIFFERENCE_LIMIT,
} from "../app/lib/measuredVisiblePhotonErrorBudgetV385";
import { parseMeasuredVisiblePhotonObservableArtifactV384 } from "../app/lib/measuredVisiblePhotonObservableV384";
import { parseMeasuredVisibleThroughputArtifactV383 } from "../app/lib/measuredVisibleThroughputV383";

const root = process.cwd();
const paths = {
  observable:
    "dist/science/measured-visible-photon-observable-v384/observable.json",
  throughput: "dist/science/measured-visible-throughput-v383/manifest.json",
  oracle:
    "dist/science/measured-visible-photon-error-budget-v385/python-oracle.json",
  csv: "dist/science/measured-visible-photon-error-budget-v385/error-budget.csv" as const,
  artifact:
    "dist/science/measured-visible-photon-error-budget-v385/error-budget.json",
} as const;
const shaBytes = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value: unknown) =>
  shaBytes(JSON.stringify(canonicalize(value)));
const bounded = (path: string, maximumBytes: number) => {
  const target = resolve(root, path);
  const metadata = statSync(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximumBytes) {
    throw new Error(`v385-input-size:${path}`);
  }
  return readFileSync(target);
};
const atomicText = (path: string, value: string) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, value);
  renameSync(temporary, target);
};
const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) /
  Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

const observable = parseMeasuredVisiblePhotonObservableArtifactV384(
  JSON.parse(bounded(paths.observable, 128 * 1024).toString("utf8")),
);
const throughput = parseMeasuredVisibleThroughputArtifactV383(
  JSON.parse(bounded(paths.throughput, 128 * 1024).toString("utf8")),
);
const oracle = JSON.parse(bounded(paths.oracle, 128 * 1024).toString("utf8"));
if (
  oracle.version !==
    "v385-visible-photon-error-budget-python-decimal-oracle-v1" ||
  oracle.status !== "qualified-independent-decimal-linear-budget-oracle" ||
  oracle.source?.v384ObservableArtifactSha256 !== observable.artifactSha256 ||
  oracle.source?.v383ThroughputArtifactSha256 !== throughput.artifactSha256 ||
  oracle.rows?.length !== 4 ||
  oracle.combinationRule !== "linear-sum-no-independence-proof" ||
  oracle.rssApplied !== false ||
  oracle.unknownSystematicsTreatedAsZero !== false ||
  oracle.networkAttempted !== false ||
  oracle.absoluteScientificBudgetQualified !== false
) {
  throw new Error("v385-input-identity");
}
const computation = createMeasuredVisiblePhotonErrorBudgetV385(
  observable,
  throughput,
);
let maximumOracleDifference = 0;
const rows = Object.freeze(
  computation.rows.map((row) => {
    const oracleRow = oracle.rows.find(
      (entry: { rayIndex?: unknown }) => entry.rayIndex === row.rayIndex,
    );
    if (!oracleRow) throw new Error(`v385-oracle-row:${row.rayIndex}`);
    const differences = [
      relativeDifference(
        row.knownComputationalUpperBoundRelative,
        Number(oracleRow.knownComputationalUpperBoundRelative),
      ),
      relativeDifference(
        row.knownComputationalInterval.lower,
        Number(oracleRow.knownComputationalInterval.lower),
      ),
      relativeDifference(
        row.knownComputationalInterval.upper,
        Number(oracleRow.knownComputationalInterval.upper),
      ),
    ];
    const pythonOracleRelativeDifference = Math.max(...differences);
    if (
      pythonOracleRelativeDifference >=
      V385_ORACLE_RELATIVE_DIFFERENCE_LIMIT
    ) {
      throw new Error(
        `v385-oracle-difference:${row.rayIndex}:${pythonOracleRelativeDifference}`,
      );
    }
    maximumOracleDifference = Math.max(
      maximumOracleDifference,
      pythonOracleRelativeDifference,
    );
    return Object.freeze({ ...row, pythonOracleRelativeDifference });
  }),
);
const csv = [
  "ray_index,photon_observable_per_s_m2_sr,v328_photon_quadrature_relative,v383_throughput_normalization_relative,v384_band_reconstruction_relative,v384_cross_domain_relative,known_computational_upper_bound_relative,known_interval_lower,known_interval_upper,throughput_calibration_systematic,source_model_systematic,total_scientific_uncertainty_relative\n",
  ...rows.map((row) => {
    const components = Object.fromEntries(
      row.quantifiedComponents.map((component) => [
        component.id,
        component.relativeUpperBound,
      ]),
    );
    return `${row.rayIndex},${row.photonObservablePerSM2Sr.toExponential(16)},${components["v328-photon-quadrature"].toExponential(16)},${components["v383-throughput-normalization"].toExponential(16)},${components["v384-band-reconstruction"].toExponential(16)},${components["v384-cross-domain-integration"].toExponential(16)},${row.knownComputationalUpperBoundRelative.toExponential(16)},${row.knownComputationalInterval.lower.toExponential(16)},${row.knownComputationalInterval.upper.toExponential(16)},unavailable,unavailable,unavailable\n`;
  }),
].join("");
atomicText(paths.csv, csv);
const csvFileSha256 = shaBytes(bounded(paths.csv, 128 * 1024));
const unsigned = {
  version: "v385-visible-photon-error-budget-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "computational-error-budget-qualified-scientific-systematics-unavailable" as const,
  source: Object.freeze({
    v384ObservableArtifactSha256: observable.artifactSha256,
    v384ObservableCsvSha256: observable.export.csvFileSha256,
    v383ThroughputArtifactSha256: throughput.artifactSha256,
    v328PhotonArtifactSha256: observable.source.v328PhotonArtifactSha256,
  }),
  rows,
  counts: Object.freeze({
    rayCount: 4 as const,
    quantifiedComponentCountPerRay: 4 as const,
    unavailableSystematicCountPerRay: 2 as const,
  }),
  maxima: Object.freeze({
    knownComputationalUpperBoundRelative:
      computation.maximumKnownComputationalUpperBoundRelative,
    pythonOracleRelativeDifference: maximumOracleDifference,
  }),
  combination: Object.freeze({
    rule: "linear-sum-no-independence-proof" as const,
    rssApplied: false as const,
    unknownSystematicsTreatedAsZero: false as const,
    knownComputationalIntervalIsConfidenceInterval: false as const,
    deterministicReplay: true as const,
  }),
  qualification: Object.freeze({
    computationalBudgetQualified: true as const,
    absoluteScientificBudgetQualified: false as const,
    throughputCalibrationSystematicAvailable: false as const,
    sourceModelSystematicAvailable: false as const,
    detectorElectronBudgetApplicable: false as const,
    measuredAuthorityGranted: false as const,
    observedCountsAvailable: false as const,
    scienceImageAvailable: false as const,
  }),
  export: Object.freeze({
    csvPath: paths.csv,
    csvFileSha256,
    rowCount: 4 as const,
  }),
  networkAttempted: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseMeasuredVisiblePhotonErrorBudgetArtifactV385({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomicText(paths.artifact, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      csvFileSha256: artifact.export.csvFileSha256,
      rows: artifact.counts.rayCount,
      maximumKnownComputationalUpperBoundRelative:
        artifact.maxima.knownComputationalUpperBoundRelative,
      maximumPythonOracleRelativeDifference:
        artifact.maxima.pythonOracleRelativeDifference,
      rssApplied: artifact.combination.rssApplied,
      unknownSystematicsTreatedAsZero:
        artifact.combination.unknownSystematicsTreatedAsZero,
      absoluteScientificBudgetQualified:
        artifact.qualification.absoluteScientificBudgetQualified,
    },
    null,
    2,
  ),
);
