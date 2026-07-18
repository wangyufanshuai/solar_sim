import { promises as fs } from "node:fs";
import path from "node:path";
import {
  validateWebCatalogPackManifestV3,
  type WebCatalogPackManifestV3,
} from "./catalogV7";

export const LOCAL_CATALOG_PACK_API_PREFIX = "/api/atlas/catalog-pack" as const;

export type LocalCatalogPackDescriptor = {
  root: string;
  manifestPath: string;
  manifest: WebCatalogPackManifestV3;
  allowedChunks: ReadonlyMap<string, { bytes: number; sha256: string }>;
};

export function resolveLocalCatalogPackRoot(args: {
  configuredRoot?: string;
  nodeEnv?: string;
  cwd?: string;
} = {}): string | null {
  const configured = args.configuredRoot?.trim();
  if (configured) return path.resolve(configured);
  if ((args.nodeEnv ?? process.env.NODE_ENV) !== "development") return null;
  return path.resolve(args.cwd ?? process.cwd(), "dist", "catalog-million-v7");
}

export async function loadLocalCatalogPackDescriptor(
  root: string,
): Promise<LocalCatalogPackDescriptor> {
  const resolvedRoot = path.resolve(root);
  const manifestPath = path.join(resolvedRoot, "manifest.json");
  const raw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw) as WebCatalogPackManifestV3;
  const errors = validateWebCatalogPackManifestV3(manifest);
  if (errors.length > 0) {
    throw new Error(`Invalid local catalog pack: ${errors.join(", ")}`);
  }
  const allowedChunks = new Map<string, { bytes: number; sha256: string }>();
  for (const chunk of manifest.chunks) {
    if (!/^catalog-million-v7\.part-\d{3}$/.test(chunk.path)) {
      throw new Error(`Invalid catalog chunk path: ${chunk.path}`);
    }
    const candidate = path.resolve(resolvedRoot, chunk.path);
    if (path.dirname(candidate) !== resolvedRoot) {
      throw new Error(`Catalog chunk escapes configured root: ${chunk.path}`);
    }
    const stat = await fs.stat(candidate);
    if (!stat.isFile() || stat.size !== chunk.bytes) {
      throw new Error(`Catalog chunk size mismatch: ${chunk.path}`);
    }
    allowedChunks.set(chunk.path, { bytes: chunk.bytes, sha256: chunk.sha256 });
  }
  return { root: resolvedRoot, manifestPath, manifest, allowedChunks };
}

export function catalogPackManifestForClient(
  descriptor: LocalCatalogPackDescriptor,
  apiPrefix = LOCAL_CATALOG_PACK_API_PREFIX,
): WebCatalogPackManifestV3 {
  return {
    ...descriptor.manifest,
    baseUrl: `${apiPrefix.replace(/\/$/, "")}/`,
  };
}

export function resolveAllowedCatalogChunk(
  descriptor: LocalCatalogPackDescriptor,
  requestedName: string,
): string | null {
  if (!descriptor.allowedChunks.has(requestedName)) return null;
  const resolved = path.resolve(descriptor.root, requestedName);
  return path.dirname(resolved) === descriptor.root ? resolved : null;
}
