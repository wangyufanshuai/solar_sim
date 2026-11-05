import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  createKerrCanonicalRayViewV315,
  createKerrScienceGeometrySourceViewV315,
  createKerrSciencePolarizationSourceViewV315,
  createSparseKerrSciencePayloadV315,
} from "../app/lib/kerrSciencePayloadV315";
import { replayKerrScienceCinematicBuffersV337 } from "../app/lib/kerrScienceCinematicBufferReplayV337";

const root = process.cwd();
const output = "dist/science/kerr-science-cinematic-buffer-replay-v337/replay.json";
const read = (relative: string) => JSON.parse(readFileSync(resolve(root, relative), "utf8"));
const fileSha = (relative: string) => createHash("sha256").update(readFileSync(resolve(root, relative))).digest("hex");
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const geometry = createKerrScienceGeometrySourceViewV315(read("dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"));
const polarization = createKerrSciencePolarizationSourceViewV315(read("dist/science/kerr-reference-v313/polarization-short-gate.json"));
const canonicalRays = createKerrCanonicalRayViewV315(read("dist/science/kerr-campaign-v314/ray-plan.json"));
const payload = createSparseKerrSciencePayloadV315(geometry, polarization, canonicalRays);
const replay = replayKerrScienceCinematicBuffersV337(payload);
const sourceManifest = [
  "app/lib/kerrScienceCinematicBufferReplayV337.ts",
  "app/lib/kerrSciencePayloadV315.ts",
  "app/lib/kerrStrongGravityVisualV305.ts",
  "app/lib/strongGravityRenderingV299.ts",
  "app/lib/atlasVisualProfileV299.ts",
  "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
  "dist/science/kerr-reference-v313/polarization-short-gate.json",
  "dist/science/kerr-campaign-v314/ray-plan.json",
].map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v337-kerr-science-cinematic-buffer-replay-artifact-v1",
  generatedAt: new Date().toISOString(),
  status: replay.status,
  replay,
  sourceManifest,
  browserQualification: "not-run",
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  samples: replay.sampleCount,
  fields: replay.scientificBufferFieldCount,
  authorityBytes: replay.scientificBufferByteLength,
  scienceDigest: replay.scienceOutputDigest,
  v5Digest: replay.v5CinematicOutputDigest,
  v6Digest: replay.v6CinematicOutputDigest,
}, null, 2));
