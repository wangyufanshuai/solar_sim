import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createKerrCanonicalRayViewV315, createKerrScienceGeometrySourceViewV315, createKerrSciencePolarizationSourceViewV315, createSparseKerrSciencePayloadV315 } from "../app/lib/kerrSciencePayloadV315";
import { parseKerrScienceBandUncertaintyViewV325 } from "../app/lib/kerrScienceBandUncertaintyV325";
import { parseKerrScienceInstrumentResponseV332 } from "../app/lib/kerrScienceInstrumentResponseV332";
import { createKerrScienceObservationProductV341, createKerrScienceObservationProfileAuditV341 } from "../app/lib/kerrScienceObservationProductV341";

const root = process.cwd();
const paths = {
  geometry: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
  polarization: "dist/science/kerr-reference-v313/polarization-short-gate.json",
  rayPlan: "dist/science/kerr-campaign-v314/ray-plan.json",
  uncertainty: "dist/science/kerr-science-band-uncertainty-v325/componentwise-envelope.json",
  photonProvenance: "dist/science/kerr-science-photon-provenance-v331/provenance-reference.json",
  instrument: "dist/science/kerr-science-instrument-response-v332/response-reference.json",
  output: "dist/science/kerr-observation-product-v341/observation-product.json",
} as const;

function bytes(path: string): Buffer { return readFileSync(resolve(root, path)); }
function read(path: string): Record<string, unknown> { return JSON.parse(bytes(path).toString("utf8")) as Record<string, unknown>; }
function sha256(value: string | Uint8Array): string { return createHash("sha256").update(value).digest("hex"); }
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}
function atomic(path: string, value: unknown): void {
  const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target);
}

const geometry = createKerrScienceGeometrySourceViewV315(read(paths.geometry));
const polarization = createKerrSciencePolarizationSourceViewV315(read(paths.polarization));
const rayPlan = createKerrCanonicalRayViewV315(read(paths.rayPlan));
const payload = createSparseKerrSciencePayloadV315(geometry, polarization, rayPlan);
const uncertaintyArtifact = read(paths.uncertainty);
const photonProvenanceArtifact = read(paths.photonProvenance);
const instrumentArtifact = read(paths.instrument);
const product = createKerrScienceObservationProductV341(
  payload,
  parseKerrScienceBandUncertaintyViewV325(uncertaintyArtifact.view),
  parseKerrScienceInstrumentResponseV332(instrumentArtifact.response),
  String(instrumentArtifact.artifactSha256),
);
const profileAudit = createKerrScienceObservationProfileAuditV341(product);
if (photonProvenanceArtifact.artifactSha256 !== product.sources.photonProvenanceArtifactSha256) throw new Error("v341-photon-provenance-lock");
const source = Object.freeze(Object.entries(paths).filter(([key]) => key !== "output").map(([, path]) => Object.freeze({ path, fileSha256: sha256(bytes(path)) })));
const unsigned = {
  version: "v341-kerr-science-observation-product-artifact-v1",
  generatedAt: new Date().toISOString(),
  status: "qualified-sparse-observation-product-science-profile-invariant",
  source,
  product,
  profileAudit,
  browserQualification: "not-run",
  boundary: "v312-v313-sparse-authority-four-disk-rays-twelve-bands-dense-incomplete-0-of-49",
};
const artifact = { ...unsigned, artifactSha256: sha256(JSON.stringify(canonicalize(unsigned))) };
atomic(paths.output, artifact);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, measurements: product.counts.bandMeasurementCount, diskRays: product.counts.applicableDiskRayCount, scienceDigest: profileAudit.scienceDigest, cinematicDigests: profileAudit.cinematicDigests, maximumEnvelope: product.maxima.conservativeLinearRelativeEnvelope, maximumEvpaDifferenceDeg: product.maxima.evpaDifferenceDeg, dense: product.authority.denseCampaignStatus }, null, 2));
