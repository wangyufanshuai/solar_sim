import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  KERR_SCREEN_COORDINATE_ARTIFACT_VERSION_V419,
  KERR_GEOMETRY_FILE_SHA256_V312,
  KERR_POLARIZATION_FILE_SHA256_V313,
  KERR_RAY_PLAN_FILE_SHA256_V314,
  canonicalShaV419,
  createKerrScreenCoordinateViewV419,
  parseKerrScreenCoordinateArtifactV419,
  serializeKerrScreenCoordinateCsvV419,
  type KerrScreenCoordinateArtifactV419,
} from "../app/lib/kerrScreenCoordinateProvenanceV419";

const root = process.cwd();
const paths = {
  plan: "dist/science/kerr-campaign-v314/ray-plan.json",
  geometry: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
  polarization: "dist/science/kerr-reference-v313/polarization-short-gate.json",
  v418: "dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product.json",
  oracle: "dist/science/kerr-screen-coordinate-provenance-v419/python-oracle.json",
  output: "dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json",
  csv: "dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.csv",
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
const plan = read(paths.plan);
const geometry = read(paths.geometry);
const polarization = read(paths.polarization);
const v418 = read(paths.v418);
const oracle = read(paths.oracle);
if (fileSha(paths.plan) !== KERR_RAY_PLAN_FILE_SHA256_V314 || fileSha(paths.geometry) !== KERR_GEOMETRY_FILE_SHA256_V312 || fileSha(paths.polarization) !== KERR_POLARIZATION_FILE_SHA256_V313 || typeof oracle.artifactSha256 !== "string" || !/^[a-f0-9]{64}$/.test(oracle.artifactSha256)) throw new Error("v419-source-file-lock");
const first = createKerrScreenCoordinateViewV419(plan, geometry, polarization, v418, oracle);
const second = createKerrScreenCoordinateViewV419(plan, geometry, polarization, v418, oracle);
if (canonicalShaV419(first) !== canonicalShaV419(second)) throw new Error("v419-ab-determinism");
const generatedAt = [plan.generatedAt, geometry.generatedAt, polarization.generatedAt, v418.generatedAt, oracle.generatedAt].filter((value): value is string => typeof value === "string" && Number.isFinite(Date.parse(value))).sort().at(-1);
if (!generatedAt) throw new Error("v419-generated-at");
const unsigned = {
  version: KERR_SCREEN_COORDINATE_ARTIFACT_VERSION_V419,
  generatedAt,
  status: first.status,
  sourceFiles: { v312FileSha256: KERR_GEOMETRY_FILE_SHA256_V312, v313FileSha256: KERR_POLARIZATION_FILE_SHA256_V313, v314PlanFileSha256: KERR_RAY_PLAN_FILE_SHA256_V314, v418FileSha256: fileSha(paths.v418), pythonOracleFileSha256: fileSha(paths.oracle) },
  pythonOracleArtifactSha256: oracle.artifactSha256,
  view: first,
  deterministicReplay: true,
  networkAttempted: false,
  denseShardExecuted: false,
  rasterScienceImageGenerated: false,
} as const;
const artifact = parseKerrScreenCoordinateArtifactV419({ ...unsigned, artifactSha256: canonicalShaV419(unsigned) } satisfies KerrScreenCoordinateArtifactV419);
atomic(paths.output, `${JSON.stringify(artifact, null, 2)}\n`);
atomic(paths.csv, serializeKerrScreenCoordinateCsvV419(artifact.view));
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, rows: artifact.view.counts.coordinateRowCount, observer: artifact.view.observer, maxima: artifact.view.maxima, fitsImage: artifact.view.products.fitsImage, dense: artifact.view.denseCampaignStatus }, null, 2));
