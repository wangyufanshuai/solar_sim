import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  parseKerrSpectralEigenmodeAuditArtifactV355,
  type KerrSpectralEigenmodeAuditArtifactV355,
} from "./kerrSpectralEigenmodeAuditV355";

const PATH = "dist/science/kerr-spectral-eigenmode-audit-v355/audit.json";
let cache: { fingerprint: string; promise: Promise<KerrSpectralEigenmodeAuditArtifactV355> } | null = null;

function sha256(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

export async function loadKerrSpectralEigenmodeAuditV355(
  root = process.cwd(),
): Promise<KerrSpectralEigenmodeAuditArtifactV355> {
  const path = resolve(root, PATH);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) {
    throw new Error("v355-spectral-eigenmode-size");
  }
  const bytes = await readFile(path);
  const fingerprint = `${metadata.size}:${metadata.mtimeMs}:${sha256(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve(bytes).then((source) => {
    const artifact = parseKerrSpectralEigenmodeAuditArtifactV355(
      JSON.parse(source.toString("utf8")),
    );
    if (sha256(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256) {
      throw new Error("v355-spectral-eigenmode-sha");
    }
    return artifact;
  });
  cache = { fingerprint, promise };
  try {
    return await promise;
  } catch (error) {
    if (cache?.promise === promise) cache = null;
    throw error;
  }
}

export function resetKerrSpectralEigenmodeAuditServerV355CacheForTests(): void {
  cache = null;
}
