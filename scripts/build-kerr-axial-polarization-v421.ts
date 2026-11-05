import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  KERR_AXIAL_VECTOR_ARTIFACT_VERSION_V421,
  KERR_SCREEN_EVPA_IMPLEMENTATION_SHA256_V421,
  KERR_V418_FILE_SHA256_V421,
  KERR_V420_FILE_SHA256_V421,
  canonicalShaV421,
  createKerrAxialPolarizationVectorViewV421,
  parseKerrAxialPolarizationVectorArtifactV421,
  serializeKerrAxialPolarizationVectorCsvV421,
  type KerrAxialPolarizationVectorArtifactV421,
} from "../app/lib/kerrAxialPolarizationVectorCatalogV421";

const root = process.cwd();
const paths = {
  v420: "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json",
  v418: "dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product.json",
  implementation: "scripts/run-kerr-polarization-v297.py",
  oracle: "dist/science/kerr-axial-polarization-vectors-v421/python-axial-vector-oracle.json",
  output: "dist/science/kerr-axial-polarization-vectors-v421/axial-vector-catalog.json",
  csv: "dist/science/kerr-axial-polarization-vectors-v421/axial-vector-catalog.csv",
} as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const atomic = (path: string, value: string) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, value);
  renameSync(temporary, target);
};

if (
  fileSha(paths.v420) !== KERR_V420_FILE_SHA256_V421
  || fileSha(paths.v418) !== KERR_V418_FILE_SHA256_V421
  || fileSha(paths.implementation) !== KERR_SCREEN_EVPA_IMPLEMENTATION_SHA256_V421
) throw new Error("v421-source-file-lock");

const v420 = read(paths.v420);
const v418 = read(paths.v418);
const oracle = read(paths.oracle);
const first = createKerrAxialPolarizationVectorViewV421(v420, v418, oracle);
const second = createKerrAxialPolarizationVectorViewV421(v420, v418, oracle);
if (canonicalShaV421(first) !== canonicalShaV421(second)) throw new Error("v421-ab-determinism");
const generatedAt = [v420.generatedAt, v418.generatedAt, oracle.generatedAt]
  .filter((value): value is string => typeof value === "string" && Number.isFinite(Date.parse(value)))
  .sort()
  .at(-1);
if (!generatedAt) throw new Error("v421-generated-at");
const unsigned = {
  version: KERR_AXIAL_VECTOR_ARTIFACT_VERSION_V421,
  generatedAt,
  status: first.status,
  sourceFiles: {
    v420FileSha256: KERR_V420_FILE_SHA256_V421,
    v418FileSha256: KERR_V418_FILE_SHA256_V421,
    screenEvpaImplementationFileSha256: KERR_SCREEN_EVPA_IMPLEMENTATION_SHA256_V421,
    pythonOracleFileSha256: fileSha(paths.oracle),
  },
  pythonOracleArtifactSha256: oracle.artifactSha256,
  view: first,
  deterministicReplay: true,
  networkAttempted: false,
  denseShardExecuted: false,
  rasterScienceImageGenerated: false,
} as const;
const artifact = parseKerrAxialPolarizationVectorArtifactV421({
  ...unsigned,
  artifactSha256: canonicalShaV421(unsigned),
} satisfies KerrAxialPolarizationVectorArtifactV421);
atomic(paths.output, `${JSON.stringify(artifact, null, 2)}\n`);
atomic(paths.csv, serializeKerrAxialPolarizationVectorCsvV421(artifact.view));
console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  rows: artifact.view.rows.map((row) => [row.rayId, row.authorityEvpaDeg, row.worldDirectionUnit.alpha, row.worldDirectionUnit.beta]),
  maxima: artifact.view.maxima,
  priorDisplayAudit: artifact.view.priorDisplayAudit,
  products: artifact.view.products,
}, null, 2));
