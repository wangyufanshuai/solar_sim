import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  KERR_SPARSE_POLARIMETRIC_ARTIFACT_VERSION_V418,
  canonicalShaV418,
  createKerrSparsePolarimetricProductV418,
  parseKerrSparsePolarimetricArtifactV418,
  serializeKerrSparsePolarimetricCsvV418,
  type KerrSparsePolarimetricArtifactV418,
} from "../app/lib/kerrSparsePolarimetricProductV418";

const root = process.cwd();
const paths = {
  polarization: "dist/science/kerr-reference-v297/polarization-short-gate.json",
  photon: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  nonlinear: "dist/science/kerr-polarimeter-nonlinear-observables-v417/nonlinear-observables.json",
  output: "dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product.json",
  csv: "dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product.csv",
} as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const atomic = (path: string, value: string): void => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, value);
  renameSync(temporary, target);
};

const polarization = read(paths.polarization);
const photon = read(paths.photon);
const nonlinear = read(paths.nonlinear);
const generatedAt = [polarization.generatedAt, photon.generatedAt, nonlinear.generatedAt]
  .filter((value): value is string => typeof value === "string" && Number.isFinite(Date.parse(value)))
  .sort()
  .at(-1);
if (!generatedAt) throw new Error("v418-source-generated-at");
const first = createKerrSparsePolarimetricProductV418(polarization, photon, nonlinear);
const second = createKerrSparsePolarimetricProductV418(polarization, photon, nonlinear);
if (canonicalShaV418(first) !== canonicalShaV418(second)) throw new Error("v418-ab-determinism");
const unsigned = {
  version: KERR_SPARSE_POLARIMETRIC_ARTIFACT_VERSION_V418,
  generatedAt,
  status: first.status,
  sourceFiles: {
    v297FileSha256: fileSha(paths.polarization),
    v328FileSha256: fileSha(paths.photon),
    v417FileSha256: fileSha(paths.nonlinear),
  },
  view: first,
  deterministicReplay: true,
  networkAttempted: false,
  denseShardExecuted: false,
  scienceImageGenerated: false,
  browserQualification: "not-run",
} as const;
const artifact = parseKerrSparsePolarimetricArtifactV418({
  ...unsigned,
  artifactSha256: canonicalShaV418(unsigned),
} satisfies KerrSparsePolarimetricArtifactV418);
atomic(paths.output, `${JSON.stringify(artifact, null, 2)}\n`);
atomic(paths.csv, serializeKerrSparsePolarimetricCsvV418(artifact.view));
console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  rows: artifact.view.counts.diagnosticRowCount,
  imagePlaneCoordinates: artifact.view.counts.imagePlaneCoordinateCount,
  fitsImage: artifact.view.products.fitsImage,
  dense: artifact.view.denseCampaignStatus,
}, null, 2));
