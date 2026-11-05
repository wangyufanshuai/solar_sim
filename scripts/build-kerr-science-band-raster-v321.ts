import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createKerrScienceBandRasterWithIntegrityV321 } from "../app/lib/kerrScienceBandRasterV321";
import {
  createKerrCanonicalRayViewV315,
  createKerrScienceGeometrySourceViewV315,
  createKerrSciencePolarizationSourceViewV315,
  createSparseKerrSciencePayloadV315,
} from "../app/lib/kerrSciencePayloadV315";
import {
  KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
  parseKerrThinDiskBandImagingViewV320,
} from "../app/lib/kerrThinDiskBandImagingV320";

const root = process.cwd();
const inputs = {
  geometry: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
  polarization: "dist/science/kerr-reference-v313/polarization-short-gate.json",
  rayPlan: "dist/science/kerr-campaign-v314/ray-plan.json",
  bands: "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json",
};
const outputs = {
  raster: "dist/science/kerr-science-band-raster-v321/sparse-fixed-band.rgba",
  manifest: "dist/science/kerr-science-band-raster-v321/manifest.json",
};
const bytes = (relative: string) => readFileSync(resolve(root, relative));
const read = (relative: string) => JSON.parse(bytes(relative).toString("utf8"));
const fileSha = (relative: string) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "generatedAt" && key !== "artifactSha256")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomicBytes = (relative: string, value: Uint8Array | string) => {
  const target = resolve(root, relative);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, value);
  renameSync(temporary, target);
};

async function main(): Promise<void> {
  const bandArtifact = read(inputs.bands);
  if (bandArtifact.version !== "v320-kerr-thin-disk-fixed-band-artifact-v1"
    || bandArtifact.artifactSha256 !== KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320
    || canonicalSha(bandArtifact) !== KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320) {
    throw new Error("v321-band-artifact-authority-lock-mismatch");
  }
  const payload = createSparseKerrSciencePayloadV315(
    createKerrScienceGeometrySourceViewV315(read(inputs.geometry)),
    createKerrSciencePolarizationSourceViewV315(read(inputs.polarization)),
    createKerrCanonicalRayViewV315(read(inputs.rayPlan)),
  );
  const materialized = await createKerrScienceBandRasterWithIntegrityV321(
    payload,
    parseKerrThinDiskBandImagingViewV320(bandArtifact.view),
  );
  atomicBytes(outputs.raster, materialized.raster.rgba);
  const rasterFileSha256 = fileSha(outputs.raster);
  const unsigned = {
  version: "v321-kerr-science-band-raster-artifact-v1",
  generatedAt: new Date().toISOString(),
  sources: {
    geometryFileSha256: fileSha(inputs.geometry),
    polarizationFileSha256: fileSha(inputs.polarization),
    rayPlanFileSha256: fileSha(inputs.rayPlan),
    bandArtifactFileSha256: fileSha(inputs.bands),
    bandArtifactCanonicalSha256: KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
  },
  raster: {
    path: outputs.raster,
    fileSha256: rasterFileSha256,
    byteLength: materialized.raster.rgba.byteLength,
    width: materialized.raster.width,
    height: materialized.raster.height,
    version: materialized.raster.version,
    boundary: materialized.raster.boundary,
    summary: materialized.raster.summary,
    encoding: materialized.raster.encoding,
  },
  integrity: materialized.integrity,
  boundary: "reproducible-sparse-fixed-band-runtime-raster-not-dense-science-image",
  };
  const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
  atomicBytes(outputs.manifest, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify({
  status: "v321-runtime-raster-materialized",
  artifactSha256: artifact.artifactSha256,
  rasterFileSha256,
  rasterDigestSha256: materialized.integrity.rasterDigestSha256,
  payloadDigestSha256: materialized.integrity.payloadAfter.digestSha256,
  bandViewDigestSha256: materialized.integrity.bandViewDigestAfterSha256,
  byteLength: materialized.raster.rgba.byteLength,
  summary: materialized.raster.summary,
  outputs,
  }, null, 2));
}

void main();
