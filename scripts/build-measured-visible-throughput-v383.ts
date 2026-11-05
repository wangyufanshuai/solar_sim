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
  normalizeMeasuredVisibleThroughputV383,
  parseMeasuredVisibleThroughputArtifactV383,
  VISIBLE_ORACLE_RELATIVE_DIFFERENCE_LIMIT_V383,
} from "../app/lib/measuredVisibleThroughputV383";
import { parseMeasuredVisibleSourceForensicV382R1 } from "../app/lib/measuredVisibleSourceForensicV382R1";

const root = process.cwd();
const paths = {
  raw: "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml",
  forensic: "dist/science/measured-visible-source-v382r1/forensic.json",
  oracle: "dist/science/measured-visible-throughput-v383/python-oracle.json",
  profile: "dist/science/measured-visible-throughput-v383/profile.csv" as const,
  manifest: "dist/science/measured-visible-throughput-v383/manifest.json",
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
    throw new Error(`v383-input-size:${path}`);
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

const raw = bounded(paths.raw, 4 * 1024 * 1024);
const forensic = parseMeasuredVisibleSourceForensicV382R1(
  JSON.parse(bounded(paths.forensic, 128 * 1024).toString("utf8")),
);
const oracle = JSON.parse(bounded(paths.oracle, 128 * 1024).toString("utf8"));
const rawSha256 = shaBytes(raw);
if (
  forensic.recoveredSource.sha256 !== rawSha256 ||
  forensic.progress.sourceDossierAvailable !== false ||
  oracle.version !== "v383-visible-throughput-python-decimal-oracle-v1" ||
  oracle.status !== "qualified-independent-xml-decimal-oracle" ||
  oracle.input?.sha256 !== rawSha256 ||
  oracle.metrics?.rowCount !== 3301 ||
  oracle.strictlyIncreasing !== true ||
  oracle.duplicateWavelengthCount !== 0 ||
  oracle.interpolationApplied !== false ||
  oracle.networkAttempted !== false ||
  oracle.authorityGranted !== false ||
  oracle.observedCountsAvailable !== false
) {
  throw new Error("v383-input-identity");
}
const normalized = normalizeMeasuredVisibleThroughputV383(raw.toString("utf8"));
const sourceRowCanonicalSha256 = shaBytes(normalized.sourceRowCanonicalText);
if (sourceRowCanonicalSha256 !== oracle.sourceRowCanonicalSha256) {
  throw new Error("v383-source-row-canonical-sha");
}
const metricKeys = [
  "minimumThroughput",
  "maximumThroughput",
  "equivalentWidthAngstrom",
  "meanThroughput",
  "throughputWeightedMeanWavelengthAngstrom",
  "pivotWavelengthAngstrom",
] as const;
const differences = metricKeys.map((key) => ({
  key,
  relativeDifference: relativeDifference(
    normalized.metrics[key],
    Number(oracle.metrics[key]),
  ),
}));
const maximumMetricRelativeDifference = Math.max(
  ...differences.map((entry) => entry.relativeDifference),
);
if (
  maximumMetricRelativeDifference >=
  VISIBLE_ORACLE_RELATIVE_DIFFERENCE_LIMIT_V383
) {
  throw new Error(`v383-oracle-difference:${maximumMetricRelativeDifference}`);
}
const csv = [
  "wavelength_m,throughput\n",
  ...normalized.rows.map(
    (row) =>
      `${row.wavelengthM.toExponential(16)},${row.throughput.toExponential(16)}\n`,
  ),
].join("");
atomicText(paths.profile, csv);
const profileFileSha256 = shaBytes(bounded(paths.profile, 512 * 1024));
const unsigned = {
  version: "v383-visible-throughput-normalization-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "visible-throughput-candidate-qualified-dual-implementation-authority-withheld-source-dossier-incomplete" as const,
  candidate: Object.freeze({
    bandId: "visible" as const,
    facility: "HST" as const,
    instrument: "WFC3/UVIS1" as const,
    spectralElement: "F350LP" as const,
    wavelengthUnit: "m" as const,
    throughputUnit: "dimensionless" as const,
    lowerWavelengthM: 4e-7 as const,
    upperWavelengthM: 7e-7 as const,
    rowCount: 3301 as const,
  }),
  input: Object.freeze({
    rawProfilePath: paths.raw,
    rawProfileSha256: rawSha256,
    v382r1ForensicArtifactSha256: forensic.artifactSha256,
    v382r1SourceDossierStatus: "incomplete-1-of-7" as const,
  }),
  normalizedProfile: Object.freeze({
    path: paths.profile,
    fileSha256: profileFileSha256,
    sourceRowCanonicalSha256,
    metrics: normalized.metrics,
  }),
  dualImplementation: Object.freeze({
    typescript:
      "regex-votable-parser-plus-float64-trapezoid-and-pivot-integrals" as const,
    python:
      "xml-etree-parser-plus-decimal-50-digit-trapezoid-and-pivot-integrals" as const,
    parserImplementationIndependent: true as const,
    arithmeticImplementationIndependent: true as const,
    sourceRowCanonicalShaMatched: true as const,
    rowCountMatched: true as const,
    endpointMatched: true as const,
    maximumMetricRelativeDifference,
    relativeDifferenceLimit: VISIBLE_ORACLE_RELATIVE_DIFFERENCE_LIMIT_V383,
    qualified: true as const,
  }),
  authorityBoundary: Object.freeze({
    normalizedCandidateQualified: true as const,
    sourceDossierAvailable: false as const,
    detectorNoiseAuthorityAvailable: false as const,
    observationGeometryAuthorityAvailable: false as const,
    visibleMeasuredAuthorityGranted: false as const,
    measuredBandAuthorityCount: 0 as const,
    observedCountsAvailable: false as const,
    runtimePackagingAllowed: false as const,
    sciencePayloadMutationAllowed: false as const,
    cinematicConsumerAllowed: false as const,
  }),
  networkAttempted: false as const,
  automaticRetryApplied: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseMeasuredVisibleThroughputArtifactV383({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomicText(paths.manifest, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      profileSha256: artifact.normalizedProfile.fileSha256,
      sourceRowCanonicalSha256,
      rows: artifact.normalizedProfile.metrics.rowCount,
      equivalentWidthAngstrom:
        artifact.normalizedProfile.metrics.equivalentWidthAngstrom,
      pivotWavelengthAngstrom:
        artifact.normalizedProfile.metrics.pivotWavelengthAngstrom,
      maximumMetricRelativeDifference,
      authorityGranted:
        artifact.authorityBoundary.visibleMeasuredAuthorityGranted,
    },
    null,
    2,
  ),
);
