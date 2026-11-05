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
  KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328,
  parseKerrSciencePhotonBandViewV328,
} from "../app/lib/kerrSciencePhotonBandsV328";
import {
  createMeasuredVisiblePhotonObservableV384,
  parseMeasuredVisiblePhotonObservableArtifactV384,
  V384_CROSS_IMPLEMENTATION_LIMIT,
  V384_UNWEIGHTED_RECONSTRUCTION_LIMIT,
} from "../app/lib/measuredVisiblePhotonObservableV384";
import { parseMeasuredVisibleThroughputArtifactV383 } from "../app/lib/measuredVisibleThroughputV383";

const root = process.cwd();
const paths = {
  photon: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  throughput: "dist/science/measured-visible-throughput-v383/manifest.json",
  profile: "dist/science/measured-visible-throughput-v383/profile.csv",
  oracle: "dist/science/measured-visible-photon-observable-v384/python-oracle.json",
  csv: "dist/science/measured-visible-photon-observable-v384/observable.csv" as const,
  artifact:
    "dist/science/measured-visible-photon-observable-v384/observable.json",
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
    throw new Error(`v384-input-size:${path}`);
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

const photonBytes = bounded(paths.photon, 2 * 1024 * 1024);
const photonOuter = JSON.parse(photonBytes.toString("utf8"));
const photonView = parseKerrSciencePhotonBandViewV328(photonOuter.view);
const throughput = parseMeasuredVisibleThroughputArtifactV383(
  JSON.parse(bounded(paths.throughput, 128 * 1024).toString("utf8")),
);
const profileBytes = bounded(paths.profile, 512 * 1024);
const oracle = JSON.parse(bounded(paths.oracle, 128 * 1024).toString("utf8"));
if (
  photonOuter.artifactSha256 !==
    KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328 ||
  throughput.normalizedProfile.fileSha256 !== shaBytes(profileBytes) ||
  throughput.authorityBoundary.normalizedCandidateQualified !== true ||
  throughput.authorityBoundary.visibleMeasuredAuthorityGranted !== false ||
  oracle.version !==
    "v384-visible-photon-frequency-domain-python-oracle-v1" ||
  oracle.status !== "qualified-independent-frequency-domain-simpson-oracle" ||
  oracle.input?.rawProfileSha256 !== throughput.input.rawProfileSha256 ||
  oracle.input?.sourceRowCanonicalSha256 !==
    throughput.normalizedProfile.sourceRowCanonicalSha256 ||
  oracle.input?.v328PhotonArtifactSha256 !== photonOuter.artifactSha256 ||
  oracle.rows?.length !== 4 ||
  oracle.networkAttempted !== false ||
  oracle.electronExpectationAvailable !== false ||
  oracle.observedCountsAvailable !== false ||
  oracle.maximumSourceReconstructionRelativeDifference >=
    V384_UNWEIGHTED_RECONSTRUCTION_LIMIT
) {
  throw new Error("v384-input-identity");
}
const computation = createMeasuredVisiblePhotonObservableV384(
  photonView,
  profileBytes.toString("utf8"),
);
let maximumPythonDifference = 0;
const rows = Object.freeze(
  computation.rows.map((row) => {
    const oracleRow = oracle.rows.find(
      (entry: { rayIndex?: unknown }) => entry.rayIndex === row.rayIndex,
    );
    if (!oracleRow) throw new Error(`v384-oracle-row:${row.rayIndex}`);
    const pythonOracleRelativeDifference = relativeDifference(
      row.throughputWeightedPhotonRadiancePerSM2Sr,
      Number(oracleRow.throughputWeightedPhotonRadiancePerSM2Sr),
    );
    if (pythonOracleRelativeDifference >= V384_CROSS_IMPLEMENTATION_LIMIT) {
      throw new Error(
        `v384-oracle-difference:${row.rayIndex}:${pythonOracleRelativeDifference}`,
      );
    }
    maximumPythonDifference = Math.max(
      maximumPythonDifference,
      pythonOracleRelativeDifference,
    );
    return Object.freeze({ ...row, pythonOracleRelativeDifference });
  }),
);
const csv = [
  "ray_index,spin_a,redshift_factor,effective_temperature_k,source_photon_radiance_per_s_m2_sr,reconstructed_unweighted_photon_radiance_per_s_m2_sr,throughput_weighted_photon_radiance_per_s_m2_sr,effective_band_throughput,unweighted_reconstruction_relative_difference,python_oracle_relative_difference,electron_expectation_applicable\n",
  ...rows.map(
    (row) =>
      `${row.rayIndex},${row.spinA.toExponential(16)},${row.redshiftFactor.toExponential(16)},${row.effectiveTemperatureK.toExponential(16)},${row.sourcePhotonRadiancePerSM2Sr.toExponential(16)},${row.reconstructedUnweightedPhotonRadiancePerSM2Sr.toExponential(16)},${row.throughputWeightedPhotonRadiancePerSM2Sr.toExponential(16)},${row.effectiveBandThroughput.toExponential(16)},${row.unweightedReconstructionRelativeDifference.toExponential(16)},${row.pythonOracleRelativeDifference.toExponential(16)},false\n`,
  ),
].join("");
atomicText(paths.csv, csv);
const csvFileSha256 = shaBytes(bounded(paths.csv, 128 * 1024));
const unsigned = {
  version: "v384-visible-throughput-weighted-photon-observable-v1" as const,
  generatedAt: new Date().toISOString(),
  status:
    "throughput-weighted-visible-photon-observable-qualified-dual-domain-electron-authority-withheld" as const,
  source: Object.freeze({
    v328PhotonArtifactSha256: photonOuter.artifactSha256 as string,
    v328FullShortAuthoritySha256:
      photonView.source.fullShortAuthoritySha256,
    v383ThroughputArtifactSha256: throughput.artifactSha256,
    v383ProfileFileSha256: throughput.normalizedProfile.fileSha256,
    v383SourceRowCanonicalSha256:
      throughput.normalizedProfile.sourceRowCanonicalSha256,
    denseAggregateSha256: null,
  }),
  rows,
  counts: Object.freeze({
    authorityDiskRayCount: 4 as const,
    observableRowCount: 4 as const,
    unavailableNonDiskRayCount: 12 as const,
  }),
  maxima: Object.freeze({
    sourcePhotonQuadratureRelativeDifference:
      computation.maxima.sourcePhotonQuadratureRelativeDifference,
    unweightedReconstructionRelativeDifference:
      computation.maxima.unweightedReconstructionRelativeDifference,
    pythonOracleRelativeDifference: maximumPythonDifference,
  }),
  algorithms: Object.freeze({
    typescript:
      "wavelength-domain-irregular-trapezoid-with-neumaier-compensation" as const,
    python:
      "frequency-domain-fixed-simpson-65536-with-linear-throughput-interpolation" as const,
    integrationDomainIndependent: true as const,
    parserIndependent: true as const,
    sourceRowsShaMatched: true as const,
    deterministicReplay: true as const,
  }),
  units: Object.freeze({
    photonObservable: "photons s^-1 m^-2 sr^-1" as const,
    throughput: "dimensionless" as const,
  }),
  export: Object.freeze({
    csvPath: paths.csv,
    csvFileSha256,
    rowCount: 4 as const,
  }),
  operator:
    "integral-observed-photon-spectral-radiance-times-dimensionless-throughput" as const,
  assumptions: Object.freeze([
    "v328-planck-thin-disk-effective-temperature-and-redshift-reused-read-only",
    "v383-total-system-throughput-treated-as-dimensionless-spectral-weight",
    "no-collecting-area-pixel-solid-angle-exposure-noise-gain-or-background-applied",
  ] as const),
  authorityBoundary: Object.freeze({
    photonObservableQualified: true as const,
    detectorElectronExpectationAvailable: false as const,
    sourceDossierAvailable: false as const,
    detectorNoiseAuthorityAvailable: false as const,
    observationGeometryAuthorityAvailable: false as const,
    visibleMeasuredAuthorityGranted: false as const,
    measuredBandAuthorityCount: 0 as const,
    observedCountsAvailable: false as const,
    scienceImageAvailable: false as const,
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
const artifact = parseMeasuredVisiblePhotonObservableArtifactV384({
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
      rows: artifact.counts.observableRowCount,
      effectiveThroughputRange: [
        Math.min(...artifact.rows.map((row) => row.effectiveBandThroughput)),
        Math.max(...artifact.rows.map((row) => row.effectiveBandThroughput)),
      ],
      maximumUnweightedReconstructionRelativeDifference:
        artifact.maxima.unweightedReconstructionRelativeDifference,
      maximumPythonOracleRelativeDifference:
        artifact.maxima.pythonOracleRelativeDifference,
      electronExpectationAvailable:
        artifact.authorityBoundary.detectorElectronExpectationAvailable,
    },
    null,
    2,
  ),
);
