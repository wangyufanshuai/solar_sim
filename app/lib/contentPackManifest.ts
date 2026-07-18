import type { ContentPackManifest } from "./atlasReleaseProgram";

export const CONTENT_PACK_SCHEMA_VERSION = 1 as const;
export const CORE_PACK_MAX_INSTALLED_BYTES = 300 * 1024 * 1024;
const VERSION_TOKEN = /^(?:\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?|v[0-9][0-9A-Za-z.-]*)$/;

export function validateContentPackManifest(value: ContentPackManifest): readonly string[] {
  const errors: string[] = [];
  if (value.schemaVersion !== CONTENT_PACK_SCHEMA_VERSION) errors.push("unsupported-schema");
  // Existing codec packs use a frozen descriptive v160 token. App compatibility
  // remains strict SemVer; the artifact version itself is an opaque stable ID.
  if (!VERSION_TOKEN.test(value.version)) errors.push("invalid-version");
  if (value.installedBytes !== value.files.reduce((total, file) => total + file.bytes, 0)) errors.push("installed-size-mismatch");
  if (value.files.some((file) => !/^[a-f0-9]{64}$/.test(file.sha256))) errors.push("invalid-checksum");
  if (value.files.some((file) => file.path.includes("..") || file.path.startsWith("/") || /^[A-Za-z]:/.test(file.path))) errors.push("unsafe-path");
  if (value.id === "core" && value.installedBytes > CORE_PACK_MAX_INSTALLED_BYTES) errors.push("core-pack-over-300-mib");
  return errors;
}
