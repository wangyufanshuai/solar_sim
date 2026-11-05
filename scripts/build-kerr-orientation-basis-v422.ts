import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { KERR_ORIENTATION_BASIS_ARTIFACT_VERSION_V422, KERR_V421_FILE_SHA256_V422, canonicalShaV422, createKerrPolarizationOrientationBasisViewV422, parseKerrPolarizationOrientationBasisArtifactV422, serializeKerrPolarizationOrientationBasisCsvV422, type KerrPolarizationOrientationBasisArtifactV422 } from "../app/lib/kerrPolarizationOrientationBasisV422";

const root = process.cwd();
const paths = { v421: "dist/science/kerr-axial-polarization-vectors-v421/axial-vector-catalog.json", oracle: "dist/science/kerr-polarization-orientation-basis-v422/python-orientation-basis-oracle.json", output: "dist/science/kerr-polarization-orientation-basis-v422/orientation-basis-catalog.json", csv: "dist/science/kerr-polarization-orientation-basis-v422/orientation-basis-catalog.csv" } as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const atomic = (path: string, value: string) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, value); renameSync(temporary, target); };
if (fileSha(paths.v421) !== KERR_V421_FILE_SHA256_V422) throw new Error("v422-source-file-lock");
const v421 = read(paths.v421), oracle = read(paths.oracle);
const first = createKerrPolarizationOrientationBasisViewV422(v421, oracle), second = createKerrPolarizationOrientationBasisViewV422(v421, oracle);
if (canonicalShaV422(first) !== canonicalShaV422(second)) throw new Error("v422-ab-determinism");
const generatedAt = [v421.generatedAt, oracle.generatedAt].filter((value): value is string => typeof value === "string" && Number.isFinite(Date.parse(value))).sort().at(-1);
if (!generatedAt) throw new Error("v422-generated-at");
const unsigned = { version: KERR_ORIENTATION_BASIS_ARTIFACT_VERSION_V422, generatedAt, status: first.status, sourceFiles: { v421FileSha256: KERR_V421_FILE_SHA256_V422, pythonOracleFileSha256: fileSha(paths.oracle) }, pythonOracleArtifactSha256: oracle.artifactSha256, view: first, deterministicReplay: true, networkAttempted: false, denseShardExecuted: false, rasterMaskGenerated: false, stokesMeasurementGenerated: false } as const;
const artifact = parseKerrPolarizationOrientationBasisArtifactV422({ ...unsigned, artifactSha256: canonicalShaV422(unsigned) } satisfies KerrPolarizationOrientationBasisArtifactV422);
atomic(paths.output, `${JSON.stringify(artifact, null, 2)}\n`);
atomic(paths.csv, serializeKerrPolarizationOrientationBasisCsvV422(artifact.view));
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, rows: artifact.view.rows.map((row) => [row.rayId, row.orientationBasis.qHat, row.orientationBasis.uHat]), maxima: artifact.view.maxima, mask: artifact.view.maskContract, rasterAdmission: artifact.view.rasterAdmission }, null, 2));
