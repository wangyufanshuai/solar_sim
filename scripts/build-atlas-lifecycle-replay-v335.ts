import { createHash } from "node:crypto";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runAtlasResourceLifecycleReplayV335 } from "../app/lib/atlasResourceLifecycleReplayV335";

const root = process.cwd();
const output = "dist/science/atlas-resource-lifecycle-v335/replay.json";
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["generatedAt", "artifactSha256", "baselineIdentityDigest", "returnIdentityDigest"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const replay = runAtlasResourceLifecycleReplayV335();
const unsigned = { version: "v335-atlas-resource-lifecycle-replay-artifact-v1", generatedAt: new Date().toISOString(), replay };
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(JSON.stringify({ status: replay.status, artifactSha256: artifact.artifactSha256, kinds: replay.resourceKindCount, acquired: replay.acquiredCount, baseline: replay.afterDuplicateRelease.status }, null, 2));
