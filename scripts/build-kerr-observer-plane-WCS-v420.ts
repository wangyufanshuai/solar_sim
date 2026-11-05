import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  KERR_OBSERVER_WCS_ARTIFACT_VERSION_V420,
  KERR_V314_PLAN_FILE_SHA256_V420,
  KERR_V419_FILE_SHA256_V420,
  canonicalShaV420,
  createKerrObserverPlaneWcsViewV420,
  parseKerrObserverPlaneWcsArtifactV420,
  serializeKerrObserverPlaneWcsCsvV420,
  type KerrObserverPlaneWcsArtifactV420,
} from "../app/lib/kerrObserverPlaneWcsV420";

const root = process.cwd();
const paths = { plan: "dist/science/kerr-campaign-v314/ray-plan.json", v419: "dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json", oracle: "dist/science/kerr-observer-plane-WCS-v420/python-wcs-oracle.json", output: "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json", csv: "dist/science/kerr-observer-plane-WCS-v420/sparse-source-catalog.csv" } as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const atomic = (path: string, value: string) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, value); renameSync(temporary, target); };
const plan = read(paths.plan), v419 = read(paths.v419), oracle = read(paths.oracle);
if (fileSha(paths.plan) !== KERR_V314_PLAN_FILE_SHA256_V420 || fileSha(paths.v419) !== KERR_V419_FILE_SHA256_V420 || typeof oracle.artifactSha256 !== "string" || !/^[a-f0-9]{64}$/.test(oracle.artifactSha256)) throw new Error("v420-source-file-lock");
const first = createKerrObserverPlaneWcsViewV420(plan, v419, oracle);
const second = createKerrObserverPlaneWcsViewV420(plan, v419, oracle);
if (canonicalShaV420(first) !== canonicalShaV420(second)) throw new Error("v420-ab-determinism");
const generatedAt = [plan.generatedAt, v419.generatedAt, oracle.generatedAt].filter((value): value is string => typeof value === "string" && Number.isFinite(Date.parse(value))).sort().at(-1);
if (!generatedAt) throw new Error("v420-generated-at");
const unsigned = { version: KERR_OBSERVER_WCS_ARTIFACT_VERSION_V420, generatedAt, status: first.status, sourceFiles: { v314PlanFileSha256: KERR_V314_PLAN_FILE_SHA256_V420, v419FileSha256: KERR_V419_FILE_SHA256_V420, pythonOracleFileSha256: fileSha(paths.oracle) }, pythonOracleArtifactSha256: oracle.artifactSha256, view: first, deterministicReplay: true, networkAttempted: false, denseShardExecuted: false, rasterScienceImageGenerated: false } as const;
const artifact = parseKerrObserverPlaneWcsArtifactV420({ ...unsigned, artifactSha256: canonicalShaV420(unsigned) } satisfies KerrObserverPlaneWcsArtifactV420);
atomic(paths.output, `${JSON.stringify(artifact, null, 2)}\n`);
atomic(paths.csv, serializeKerrObserverPlaneWcsCsvV420(artifact.view));
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, worldSupport: artifact.view.worldSupport, wcs: artifact.view.wcs, rows: artifact.view.catalog.rows.map((row) => [row.rayId, row.continuousPixelX, row.continuousPixelY]), maxima: artifact.view.maxima, fitsImage: artifact.view.products.fitsImage, dense: artifact.view.denseCampaignStatus }, null, 2));
