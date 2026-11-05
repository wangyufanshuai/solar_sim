import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312 } from "../app/lib/kerrAuthorityV312";
import { KERR_POLARIZATION_AUTHORITY_FILE_SHA256_V313 } from "../app/lib/kerrAuthorityV313";
import { KERR_CORRECTED_DENSE_RAY_PLAN_FILE_SHA256_V314 } from "../app/lib/kerrCampaignV314";
import {
  createKerrCanonicalRayViewV315,
  createKerrScienceGeometrySourceViewV315,
  createKerrSciencePolarizationSourceViewV315,
  createSparseKerrSciencePayloadV315,
} from "../app/lib/kerrSciencePayloadV315";
import { createKerrThinDiskSpectralViewV319 } from "../app/lib/kerrThinDiskSpectralV319";

const root = process.cwd();
const inputs = {
  geometry: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
  polarization: "dist/science/kerr-reference-v313/polarization-short-gate.json",
  rayPlan: "dist/science/kerr-campaign-v314/ray-plan.json",
};
const output = "dist/science/kerr-thin-disk-v319/sparse-spectrum.json";
const bytes = (relative: string) => readFileSync(resolve(root, relative));
const fileSha = (relative: string) => createHash("sha256").update(bytes(relative)).digest("hex");
const read = (relative: string) => JSON.parse(bytes(relative).toString("utf8"));
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "generatedAt" && key !== "artifactSha256")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const sourceFiles = {
  geometry: fileSha(inputs.geometry),
  polarization: fileSha(inputs.polarization),
  rayPlan: fileSha(inputs.rayPlan),
};
if (sourceFiles.geometry !== KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312
  || sourceFiles.polarization !== KERR_POLARIZATION_AUTHORITY_FILE_SHA256_V313
  || sourceFiles.rayPlan !== KERR_CORRECTED_DENSE_RAY_PLAN_FILE_SHA256_V314) {
  throw new Error("v319-source-file-authority-lock-mismatch");
}
const geometry = read(inputs.geometry);
const polarization = read(inputs.polarization);
const rayPlan = read(inputs.rayPlan);
const geometryView = createKerrScienceGeometrySourceViewV315(geometry);
const polarizationView = createKerrSciencePolarizationSourceViewV315(polarization);
const canonicalRayView = createKerrCanonicalRayViewV315(rayPlan);
const payload = createSparseKerrSciencePayloadV315(geometryView, polarizationView, canonicalRayView);
const view = createKerrThinDiskSpectralViewV319(payload);
const unsigned = {
  version: "v319-kerr-thin-disk-spectral-artifact-v1",
  generatedAt: new Date().toISOString(),
  sourceFiles,
  view,
  boundary: "immutable-derived-sparse-spectrum-no-dense-or-product-promotion",
};
const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(JSON.stringify({ status: view.status, artifactSha256: artifact.artifactSha256, applicableDiskRayCount: view.counts.applicableDiskRayCount, maxima: view.maxima, output }, null, 2));
