import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createKerrScienceCinematicABViewV327 } from "../app/lib/kerrScienceCinematicABV327";
import { parseKerrThinDiskBandImagingViewV320 } from "../app/lib/kerrThinDiskBandImagingV320";

const root = process.cwd();
const sourcePath = "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json";
const outputPath = "dist/science/kerr-science-cinematic-ab-v327/swatches.json";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

function sha256(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}

const sourceBytes = readFileSync(resolve(root, sourcePath));
const sourceArtifact = JSON.parse(sourceBytes.toString("utf8")) as { view?: unknown; artifactSha256?: unknown };
const view = createKerrScienceCinematicABViewV327(parseKerrThinDiskBandImagingViewV320(sourceArtifact.view));
const unsigned = {
  version: "v327-kerr-science-cinematic-ab-artifact-v1",
  generatedAt: new Date().toISOString(),
  source: { path: sourcePath, fileSha256: sha256(sourceBytes), canonicalSha256: sourceArtifact.artifactSha256 },
  view,
};
const artifact = { ...unsigned, artifactSha256: sha256(JSON.stringify(canonicalize(unsigned))) };
const target = resolve(root, outputPath);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(JSON.stringify({
  status: view.status,
  artifactSha256: artifact.artifactSha256,
  swatchCount: view.swatches.length,
  scienceValuesUnchanged: view.scienceValuesUnchanged,
  cinematicBuffersDisjoint: view.cinematicBuffersDisjoint,
  profileOutputsDistinct: view.profileOutputsDistinct,
}, null, 2));
