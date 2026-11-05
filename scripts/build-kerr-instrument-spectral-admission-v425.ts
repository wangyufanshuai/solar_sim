import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  KERR_INSTRUMENT_SPECTRAL_ADMISSION_ARTIFACT_VERSION_V425,
  KERR_V411_FILE_SHA256_V425,
  KERR_V413_FILE_SHA256_V425,
  KERR_V424_FILE_SHA256_V425,
  canonicalShaV425,
  createKerrInstrumentSpectralAdmissionViewV425,
  parseKerrInstrumentSpectralAdmissionArtifactV425,
  serializeKerrInstrumentSpectralAdmissionCsvV425,
  type KerrInstrumentSpectralAdmissionArtifactV425,
} from "../app/lib/kerrInstrumentSpectralAdmissionV425";

const root = process.cwd();
const paths = {
  v424: "dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.json",
  v411: "dist/science/kerr-polarimeter-calibration-v411/inspect.json",
  v413: "dist/science/kerr-polarimeter-spectral-response-v413/spectral-response.json",
  oracle: "dist/science/kerr-instrument-spectral-admission-v425/python-spectral-admission-oracle.json",
  output: "dist/science/kerr-instrument-spectral-admission-v425/spectral-admission.json",
  csv: "dist/science/kerr-instrument-spectral-admission-v425/spectral-admission.csv",
} as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const atomic = (path: string, value: string) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, value, "utf8");
  renameSync(temporary, target);
};
if (
  fileSha(paths.v424) !== KERR_V424_FILE_SHA256_V425 ||
  fileSha(paths.v411) !== KERR_V411_FILE_SHA256_V425 ||
  fileSha(paths.v413) !== KERR_V413_FILE_SHA256_V425
) throw new Error("v425-source-file-lock");
const v424 = read(paths.v424), v411 = read(paths.v411), v413 = read(paths.v413), oracle = read(paths.oracle);
const first = createKerrInstrumentSpectralAdmissionViewV425(v424, v411, v413, oracle);
const second = createKerrInstrumentSpectralAdmissionViewV425(v424, v411, v413, oracle);
if (canonicalShaV425(first) !== canonicalShaV425(second)) throw new Error("v425-ab-determinism");
const unsigned = {
  version: KERR_INSTRUMENT_SPECTRAL_ADMISSION_ARTIFACT_VERSION_V425,
  generatedAt: v424.generatedAt as string,
  status: first.status,
  sourceFiles: {
    v424FileSha256: KERR_V424_FILE_SHA256_V425,
    v411FileSha256: KERR_V411_FILE_SHA256_V425,
    v413FileSha256: KERR_V413_FILE_SHA256_V425,
    pythonOracleFileSha256: fileSha(paths.oracle),
  },
  pythonOracleArtifactSha256: oracle.artifactSha256 as string,
  view: first,
  deterministicReplay: true,
  networkAttempted: false,
  denseShardExecuted: false,
  responseMatrixApplicationAttempted: false,
  measurementAuthorityGranted: false,
  detectorAuthorityGranted: false,
} as const;
const artifact = parseKerrInstrumentSpectralAdmissionArtifactV425({
  ...unsigned,
  artifactSha256: canonicalShaV425(unsigned),
} satisfies KerrInstrumentSpectralAdmissionArtifactV425);
atomic(paths.output, `${JSON.stringify(artifact, null, 2)}\n`);
atomic(paths.csv, serializeKerrInstrumentSpectralAdmissionCsvV425(artifact.view));
console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  counts: artifact.view.counts,
  domains: artifact.view.domains,
  bands: artifact.view.bandSummaries,
  metrics: artifact.view.metrics,
}, null, 2));
