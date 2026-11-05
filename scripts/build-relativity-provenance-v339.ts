import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadAtlasRelativityEvidenceSnapshotV338 } from "../app/lib/relativityEvidenceServerV338";
import { createRelativityProvenanceBundleV339, runRelativityProvenanceObjectUrlReplayV339, serializeRelativityProvenanceCsvV339, serializeRelativityProvenanceJsonV339 } from "../app/lib/relativityProvenanceV339";

const root = process.cwd();
const output = "dist/science/relativity-provenance-v339/provenance.json";
const fileSha = (relative: string) => createHash("sha256").update(readFileSync(resolve(root, relative))).digest("hex");
function canonicalize(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)])); }
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

async function main(): Promise<void> {
  const snapshot = await loadAtlasRelativityEvidenceSnapshotV338(root);
  const bundle = createRelativityProvenanceBundleV339(snapshot);
  const json = serializeRelativityProvenanceJsonV339(bundle);
  const csv = serializeRelativityProvenanceCsvV339(bundle);
  const objectUrlReplay = runRelativityProvenanceObjectUrlReplayV339(Buffer.byteLength(json, "utf8"), Buffer.byteLength(csv, "utf8"));
  const sourceManifest = ["app/lib/relativityProvenanceV339.ts", "app/lib/relativityProvenanceV339.test.ts", "app/lib/relativityWorkbenchEvidenceV338.ts", "app/lib/relativityEvidenceServerV338.ts", "app/components/RelativityEvidenceSurfaceV338.tsx", "app/components/RelativityResearchWorkbenchV280.tsx", "app/api/atlas/relativity-evidence/v338/route.ts", "scripts/build-relativity-provenance-v339.ts"].map((path) => ({ path, sha256: fileSha(path) }));
  const unsigned = { version: "v339-relativity-provenance-artifact-v1", generatedAt: new Date().toISOString(), status: "qualified-sanitized-json-csv-object-url-baseline-return", bundle, jsonByteLength: Buffer.byteLength(json, "utf8"), csvByteLength: Buffer.byteLength(csv, "utf8"), jsonCanonicalSha256: sha(bundle), csvSha256: createHash("sha256").update(csv).digest("hex"), objectUrlReplay, sourceManifest, browserQualification: "not-run" };
  const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
  const target = resolve(root, output); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`); renameSync(temporary, target);
  console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, jsonBytes: artifact.jsonByteLength, csvBytes: artifact.csvByteLength, objectUrls: artifact.objectUrlReplay.acquiredCount, baseline: artifact.objectUrlReplay.afterDuplicateRelease.status, dense: artifact.bundle.dense.status }, null, 2));
}

void main();
