import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalIxpeMeasuredIntakeV562, parseIxpeMeasuredIntakeV562, type IxpeMeasuredIntakeV562 } from "./ixpeMeasuredIntakeV562";

const ARTIFACT_PATH_V562 = "dist/science/ixpe-measured-intake-v562/intake.json";
const sha = (value: Uint8Array | string): string => createHash("sha256").update(value).digest("hex");
let cache: Readonly<{ fingerprint: string; promise: Promise<IxpeMeasuredIntakeV562> }> | null = null;

export async function loadIxpeMeasuredIntakeV562(
  root = process.env.ATLAS_PROJECT_ROOT?.trim() || process.cwd(),
): Promise<IxpeMeasuredIntakeV562> {
  const path = resolve(root, ARTIFACT_PATH_V562);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 512 * 1024) throw new Error("v562-ixpe-artifact-size");
  const bytes = new Uint8Array(await readFile(path));
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${sha(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseIxpeMeasuredIntakeV562(JSON.parse(Buffer.from(bytes).toString("utf8")));
    if (sha(canonicalIxpeMeasuredIntakeV562(artifact)) !== artifact.artifactSha256) throw new Error("v562-ixpe-canonical-sha");
    return artifact;
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetIxpeMeasuredIntakeServerCacheForTestsV562(): void { cache = null; }
