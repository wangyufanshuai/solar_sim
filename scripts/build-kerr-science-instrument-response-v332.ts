import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseKerrSciencePhotonBandViewV328 } from "../app/lib/kerrSciencePhotonBandsV328";
import { createKerrScienceInstrumentResponseV332 } from "../app/lib/kerrScienceInstrumentResponseV332";

const root = process.cwd();
const sourcePath = "dist/science/kerr-science-photon-bands-v328/photon-radiance.json";
const outputPath = "dist/science/kerr-science-instrument-response-v332/response-reference.json";

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

async function main(): Promise<void> {
  const sourceBytes = readFileSync(resolve(root, sourcePath));
  const sourceArtifact = JSON.parse(sourceBytes.toString("utf8")) as { view?: unknown; artifactSha256?: unknown };
  const response = createKerrScienceInstrumentResponseV332(parseKerrSciencePhotonBandViewV328(sourceArtifact.view));
  const unsigned = {
    version: "v332-kerr-science-instrument-response-artifact-v1",
    generatedAt: new Date().toISOString(),
    source: { path: sourcePath, fileSha256: sha256(sourceBytes), canonicalSha256: sourceArtifact.artifactSha256 },
    response,
  };
  const artifact = { ...unsigned, artifactSha256: sha256(JSON.stringify(canonicalize(unsigned))) };
  const target = resolve(root, outputPath);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
  renameSync(temporary, target);
  console.log(JSON.stringify({
    status: "qualified-synthetic-reference-instrument-operator",
    artifactSha256: artifact.artifactSha256,
    rowCount: response.rows.length,
    modelId: response.model.modelId,
    quadratureRelativeDifference: response.maxima.quadratureRelativeDifference,
    denseAggregateSha256: response.source.denseAggregateSha256,
  }, null, 2));
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
