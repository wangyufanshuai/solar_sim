import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import {
  ATLAS_BUFFERED_RANGE_DELIVERY_VERSION,
  shouldBufferAtlasRangeV1,
} from "./atlasBufferedRangeDeliveryV1";
export { ATLAS_CONTENT_PACK_DELIVERY_VERSION } from "./atlasContentPackContractV3";
export const ATLAS_CONTENT_PACK_API_PREFIX = "/api/atlas/content-packs" as const;

export type AtlasContentPackFileV3 = {
  path: string;
  bytes: number;
  sha256: string;
  source: string;
  license: string;
};

export type AtlasContentPackManifestV3 = {
  schemaVersion: 1;
  id: string;
  version: string;
  appCompatibility: { minimum: string; maximumExclusive: string };
  qualityTier: "required" | "standard" | "hd" | "scientific";
  compressedBytes: number;
  installedBytes: number;
  baseUrl: string;
  files: readonly AtlasContentPackFileV3[];
};

export type AtlasContentPackDescriptorV3 = {
  root: string;
  fileRoot: string;
  manifestPath: string;
  manifest: AtlasContentPackManifestV3;
  allowedFiles: ReadonlyMap<string, AtlasContentPackFileV3>;
};

const PACK_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const DESCRIPTOR_CACHE = new Map<string, Promise<AtlasContentPackDescriptorV3>>();
const VERIFIED_FILE_CACHE = new Map<string, {
  bytes: number;
  mtimeMs: number;
  ino: number | bigint;
}>();

function normalizePackPath(value: string): string | null {
  const normalized = value.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("\0") || normalized.split("/").some((part) => part === ".." || part === "")) {
    return null;
  }
  return normalized;
}

export function validateAtlasContentPackManifestV3(value: unknown): readonly string[] {
  if (!value || typeof value !== "object") return ["manifest-not-object"];
  const manifest = value as Partial<AtlasContentPackManifestV3>;
  const errors: string[] = [];
  if (manifest.schemaVersion !== 1) errors.push("schema-version");
  if (typeof manifest.id !== "string" || !PACK_ID.test(manifest.id)) errors.push("pack-id");
  if (typeof manifest.version !== "string" || !manifest.version) errors.push("pack-version");
  if (!Array.isArray(manifest.files)) errors.push("files");
  if (!Number.isFinite(manifest.installedBytes) || (manifest.installedBytes ?? -1) < 0) errors.push("installed-bytes");
  const seen = new Set<string>();
  let total = 0;
  for (const file of manifest.files ?? []) {
    const normalized = typeof file.path === "string" ? normalizePackPath(file.path) : null;
    if (!normalized) errors.push("unsafe-path");
    else if (seen.has(normalized)) errors.push("duplicate-path");
    else seen.add(normalized);
    if (!Number.isSafeInteger(file.bytes) || file.bytes < 0) errors.push("file-bytes");
    else total += file.bytes;
    if (typeof file.sha256 !== "string" || !SHA256.test(file.sha256)) errors.push("file-checksum");
  }
  if (Number.isFinite(manifest.installedBytes) && total !== manifest.installedBytes) errors.push("installed-size-mismatch");
  return Array.from(new Set(errors));
}

export function resolveAtlasContentPackRoot(args: {
  configuredRoot?: string;
  cwd?: string;
} = {}): string | null {
  const configured = args.configuredRoot?.trim();
  if (configured?.toLowerCase() === "off") return null;
  if (configured) return path.resolve(configured);
  // Runtime callers must provide an explicit root. Keeping a process.cwd()
  // fallback here makes Next's Windows file tracer recursively capture every
  // historical standalone build and the external 539 MiB content payload.
  return null;
}

export async function loadAtlasContentPackDescriptorV3(
  root: string,
  packId: string,
): Promise<AtlasContentPackDescriptorV3> {
  if (!PACK_ID.test(packId)) throw new Error("Invalid content pack id");
  const resolvedRoot = path.resolve(root);
  const manifestPath = path.join(resolvedRoot, `${packId}.manifest.json`);
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as AtlasContentPackManifestV3;
  const errors = validateAtlasContentPackManifestV3(manifest);
  if (errors.length) throw new Error(`Invalid content pack ${packId}: ${errors.join(", ")}`);
  if (manifest.id !== packId) throw new Error(`Content pack id mismatch: ${packId}`);

  const fileRoot = path.resolve(resolvedRoot, "files", packId);
  const allowedFiles = new Map<string, AtlasContentPackFileV3>();
  for (const entry of manifest.files) {
    const normalized = normalizePackPath(entry.path)!;
    const candidate = path.resolve(fileRoot, ...normalized.split("/"));
    if (!candidate.startsWith(`${fileRoot}${path.sep}`)) throw new Error(`Content pack path escapes root: ${entry.path}`);
    allowedFiles.set(normalized, { ...entry, path: normalized });
  }
  return { root: resolvedRoot, fileRoot, manifestPath, manifest, allowedFiles };
}

export function loadCachedAtlasContentPackDescriptorV3(
  root: string,
  packId: string,
): Promise<AtlasContentPackDescriptorV3> {
  const key = `${path.resolve(root)}\0${packId}`;
  const existing = DESCRIPTOR_CACHE.get(key);
  if (existing) return existing;
  const pending = loadAtlasContentPackDescriptorV3(root, packId).catch((error) => {
    DESCRIPTOR_CACHE.delete(key);
    throw error;
  });
  DESCRIPTOR_CACHE.set(key, pending);
  return pending;
}

export async function listAtlasContentPacksV3(root: string) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const ids = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".manifest.json"))
    .map((entry) => entry.name.slice(0, -".manifest.json".length))
    .filter((id) => PACK_ID.test(id))
    .sort();
  const packs = [];
  for (const id of ids) {
    const descriptor = await loadAtlasContentPackDescriptorV3(root, id);
    packs.push({
      id,
      version: descriptor.manifest.version,
      qualityTier: descriptor.manifest.qualityTier,
      installedBytes: descriptor.manifest.installedBytes,
      fileCount: descriptor.manifest.files.length,
      manifestUrl: `${ATLAS_CONTENT_PACK_API_PREFIX}/${id}/manifest`,
    });
  }
  return packs;
}

export function atlasContentPackManifestForClientV3(
  descriptor: AtlasContentPackDescriptorV3,
): AtlasContentPackManifestV3 {
  return {
    ...descriptor.manifest,
    baseUrl: `${ATLAS_CONTENT_PACK_API_PREFIX}/${descriptor.manifest.id}/files/`,
  };
}

export function resolveAllowedAtlasContentPackFileV3(
  descriptor: AtlasContentPackDescriptorV3,
  requestedPath: string,
): { absolutePath: string; entry: AtlasContentPackFileV3 } | null {
  const normalized = normalizePackPath(requestedPath);
  if (!normalized) return null;
  const entry = descriptor.allowedFiles.get(normalized);
  if (!entry) return null;
  const absolutePath = path.resolve(descriptor.fileRoot, ...normalized.split("/"));
  if (!absolutePath.startsWith(`${descriptor.fileRoot}${path.sep}`)) return null;
  return { absolutePath, entry };
}

export async function verifyAllowedAtlasContentPackFileV3(
  descriptor: AtlasContentPackDescriptorV3,
  requestedPath: string,
): Promise<{ absolutePath: string; entry: AtlasContentPackFileV3 } | null> {
  const resolved = resolveAllowedAtlasContentPackFileV3(descriptor, requestedPath);
  if (!resolved) return null;

  const linkInfo = await fs.lstat(resolved.absolutePath);
  if (!linkInfo.isFile() || linkInfo.size !== resolved.entry.bytes) {
    throw new Error(`Content pack file mismatch: ${resolved.entry.path}`);
  }

  const cacheKey = `${resolved.absolutePath}\0${resolved.entry.sha256}`;
  const cached = VERIFIED_FILE_CACHE.get(cacheKey);
  if (
    cached &&
    cached.bytes === linkInfo.size &&
    cached.mtimeMs === linkInfo.mtimeMs &&
    cached.ino === linkInfo.ino
  ) {
    return resolved;
  }

  const handle = await fs.open(resolved.absolutePath, "r");
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size !== resolved.entry.bytes) {
      throw new Error(`Content pack file mismatch: ${resolved.entry.path}`);
    }
    const digest = createHash("sha256");
    for await (const chunk of handle.createReadStream({ autoClose: false })) {
      digest.update(chunk);
    }
    const after = await handle.stat();
    if (
      after.size !== before.size ||
      after.mtimeMs !== before.mtimeMs ||
      after.ino !== before.ino
    ) {
      throw new Error(`Content pack file changed during verification: ${resolved.entry.path}`);
    }
    if (digest.digest("hex") !== resolved.entry.sha256) {
      throw new Error(`Content pack file checksum mismatch: ${resolved.entry.path}`);
    }
    VERIFIED_FILE_CACHE.set(cacheKey, {
      bytes: after.size,
      mtimeMs: after.mtimeMs,
      ino: after.ino,
    });
    return resolved;
  } finally {
    await handle.close();
  }
}

export type AtlasByteRange = { start: number; end: number; length: number };

export type AtlasExactBufferedRangeResultV1 = {
  version: typeof ATLAS_BUFFERED_RANGE_DELIVERY_VERSION;
  bytes: Uint8Array;
  sourceBytes: number;
  sourceMtimeMs: number;
};

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("Catalog Range request was cancelled", "AbortError");
  }
}

export async function readExactAtlasByteRangeV1(
  absolutePath: string,
  range: AtlasByteRange,
  expectedFileBytes: number,
  signal?: AbortSignal,
): Promise<AtlasExactBufferedRangeResultV1> {
  if (!shouldBufferAtlasRangeV1(range.length)) {
    throw new RangeError("Atlas buffered Range exceeds its bounded delivery contract");
  }
  if (
    !Number.isSafeInteger(expectedFileBytes) ||
    expectedFileBytes <= 0 ||
    range.start < 0 ||
    range.end >= expectedFileBytes ||
    range.end - range.start + 1 !== range.length
  ) {
    throw new RangeError("Atlas buffered Range is outside the frozen content-pack file");
  }
  throwIfAborted(signal);
  const handle = await fs.open(absolutePath, "r");
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size !== expectedFileBytes) {
      throw new Error("Atlas content-pack file changed before buffered Range delivery");
    }
    const bytes = new Uint8Array(range.length);
    let offset = 0;
    while (offset < bytes.byteLength) {
      throwIfAborted(signal);
      const { bytesRead } = await handle.read(
        bytes,
        offset,
        bytes.byteLength - offset,
        range.start + offset,
      );
      if (bytesRead <= 0) {
        throw new Error("Atlas content-pack buffered Range ended before its declared length");
      }
      offset += bytesRead;
    }
    throwIfAborted(signal);
    const after = await handle.stat();
    if (
      after.size !== before.size ||
      after.mtimeMs !== before.mtimeMs ||
      after.ino !== before.ino
    ) {
      throw new Error("Atlas content-pack file changed during buffered Range delivery");
    }
    return {
      version: ATLAS_BUFFERED_RANGE_DELIVERY_VERSION,
      bytes,
      sourceBytes: after.size,
      sourceMtimeMs: after.mtimeMs,
    };
  } finally {
    await handle.close();
  }
}

export function parseAtlasByteRange(value: string | null, size: number): AtlasByteRange | null | "invalid" {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || size <= 0) return "invalid";
  const startText = match[1] ?? "";
  const endText = match[2] ?? "";
  let start: number;
  let end: number;
  if (!startText) {
    const suffix = Number(endText);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return "invalid";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(startText);
    end = endText ? Number(endText) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) return "invalid";
    end = Math.min(end, size - 1);
  }
  return { start, end, length: end - start + 1 };
}

export function atlasContentTypeForPath(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  return ({
    ".json": "application/json; charset=utf-8",
    ".gz": "application/gzip",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".ktx2": "image/ktx2",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".wasm": "application/wasm",
    ".js": "text/javascript; charset=utf-8",
    ".ico": "image/x-icon",
  } as Record<string, string>)[extension] ?? "application/octet-stream";
}
