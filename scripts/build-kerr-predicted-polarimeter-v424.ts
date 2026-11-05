import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  KERR_PREDICTED_POLARIMETER_ARTIFACT_VERSION_V424,
  KERR_V410_FILE_SHA256_V424,
  KERR_V423_FILE_SHA256_V424,
  canonicalShaV424,
  createKerrPredictedPolarimeterViewV424,
  parseKerrPredictedPolarimeterArtifactV424,
  serializeKerrPredictedPolarimeterCsvV424,
  type KerrPredictedPolarimeterArtifactV424,
} from "../app/lib/kerrPredictedPolarimeterV424";

const root = process.cwd();
const paths = {
  v423: "dist/science/kerr-predicted-stokes-admission-v423/predicted-stokes-catalog.json",
  v410: "dist/science/kerr-ideal-polarimeter-v410/ideal-dual-beam.json",
  oracle: "dist/science/kerr-predicted-polarimeter-v424/python-modulation-oracle.json",
  output: "dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.json",
  csv: "dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.csv",
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

if (fileSha(paths.v423) !== KERR_V423_FILE_SHA256_V424 || fileSha(paths.v410) !== KERR_V410_FILE_SHA256_V424) {
  throw new Error("v424-source-file-lock");
}
const v423 = read(paths.v423);
const v410 = read(paths.v410);
const oracle = read(paths.oracle);
const first = createKerrPredictedPolarimeterViewV424(v423, v410, oracle);
const second = createKerrPredictedPolarimeterViewV424(v423, v410, oracle);
if (canonicalShaV424(first) !== canonicalShaV424(second)) throw new Error("v424-ab-determinism");
const unsigned = {
  version: KERR_PREDICTED_POLARIMETER_ARTIFACT_VERSION_V424,
  generatedAt: v423.generatedAt as string,
  status: first.status,
  sourceFiles: {
    v423FileSha256: KERR_V423_FILE_SHA256_V424,
    v410FileSha256: KERR_V410_FILE_SHA256_V424,
    pythonOracleFileSha256: fileSha(paths.oracle),
  },
  pythonOracleArtifactSha256: oracle.artifactSha256 as string,
  view: first,
  deterministicReplay: true,
  networkAttempted: false,
  denseShardExecuted: false,
  measurementAuthorityGranted: false,
  detectorAuthorityGranted: false,
} as const;
const artifact = parseKerrPredictedPolarimeterArtifactV424({
  ...unsigned,
  artifactSha256: canonicalShaV424(unsigned),
} satisfies KerrPredictedPolarimeterArtifactV424);
atomic(paths.output, `${JSON.stringify(artifact, null, 2)}\n`);
atomic(paths.csv, serializeKerrPredictedPolarimeterCsvV424(artifact.view));
console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  counts: artifact.view.counts,
  maxima: artifact.view.maxima,
  measurementAuthority: artifact.view.authorityBoundary.measurementAuthorityGranted,
}, null, 2));
