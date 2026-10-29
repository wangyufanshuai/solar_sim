import {
  GAIA_PRESENTATION_CATALOG_V9_VERSION,
  parseGaiaPresentationTileManifestV9,
  type GaiaPresentationTileManifestV9,
} from "./gaiaPresentationCatalogV9";

export const GAIA_PRESENTATION_CATALOG_V272_VERSION = "v272-gaia-dr3-presentation-10000000-v10m-v1" as const;

const DEFAULT_REQUIRED_PHYSICAL_MEMORY_BYTES_V272 = 6 * 1024 ** 3;
const LOW_MEMORY_OVERRIDE_FLOOR_BYTES_V272 = 3 * 1024 ** 3;
const REQUIRED_DISK_BYTES_V272 = 30 * 1024 ** 3;
const LOW_MEMORY_BUILD_AUTHORIZATION_V272 = "user-authorized-current-memory-build" as const;

export type GaiaPresentationCatalogManifestV272 = Omit<GaiaPresentationTileManifestV9, "version"> & {
  version: typeof GAIA_PRESENTATION_CATALOG_V272_VERSION;
  builder: {
    script: "scripts/build-gaia-presentation-v272.py";
    externalSort: "order3-spools-bounded-runs-kway-merge-and-source-high-byte-spools";
    maximumRunRows: 250_000;
    python: string;
    numpy: string;
    astropyHealpix: "1.1.2";
  };
  resourcePreflight: {
    freePhysicalMemoryBytes: number;
    freeDiskBytes: number;
    defaultRequiredPhysicalMemoryBytes: 6_442_450_944;
    requestedPhysicalMemoryBytes: number;
    requiredPhysicalMemoryBytes: number;
    requiredDiskBytes: 32_212_254_720;
    overrideApplied: boolean;
    authorization: typeof LOW_MEMORY_BUILD_AUTHORIZATION_V272;
  };
};

export function parseGaiaPresentationCatalogManifestV272(value: unknown): GaiaPresentationCatalogManifestV272 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Gaia v272 presentation manifest must be an object");
  const root = value as Record<string, unknown>;
  if (root.version !== GAIA_PRESENTATION_CATALOG_V272_VERSION) throw new Error("Gaia v272 presentation manifest version is invalid");
  parseGaiaPresentationTileManifestV9({ ...root, version: GAIA_PRESENTATION_CATALOG_V9_VERSION });
  const builder = root.builder as Record<string, unknown> | undefined;
  const preflight = root.resourcePreflight as Record<string, unknown> | undefined;
  const requestedMemoryBytes = Number(preflight?.requestedPhysicalMemoryBytes);
  const requiredMemoryBytes = Number(preflight?.requiredPhysicalMemoryBytes);
  const freeMemoryBytes = Number(preflight?.freePhysicalMemoryBytes);
  const freeDiskBytes = Number(preflight?.freeDiskBytes);
  const overrideApplied = preflight?.overrideApplied;
  const expectedOverride = requestedMemoryBytes < DEFAULT_REQUIRED_PHYSICAL_MEMORY_BYTES_V272;
  if (
    !builder
    || builder.script !== "scripts/build-gaia-presentation-v272.py"
    || builder.externalSort !== "order3-spools-bounded-runs-kway-merge-and-source-high-byte-spools"
    || builder.maximumRunRows !== 250_000
    || builder.astropyHealpix !== "1.1.2"
    || !preflight
    || preflight.defaultRequiredPhysicalMemoryBytes !== DEFAULT_REQUIRED_PHYSICAL_MEMORY_BYTES_V272
    || !Number.isSafeInteger(requestedMemoryBytes)
    || requestedMemoryBytes < LOW_MEMORY_OVERRIDE_FLOOR_BYTES_V272
    || requestedMemoryBytes > DEFAULT_REQUIRED_PHYSICAL_MEMORY_BYTES_V272
    || requiredMemoryBytes !== requestedMemoryBytes
    || preflight.requiredDiskBytes !== REQUIRED_DISK_BYTES_V272
    || !Number.isSafeInteger(freeMemoryBytes)
    || freeMemoryBytes < requestedMemoryBytes
    || !Number.isSafeInteger(freeDiskBytes)
    || freeDiskBytes < REQUIRED_DISK_BYTES_V272
    || overrideApplied !== expectedOverride
    || preflight.authorization !== LOW_MEMORY_BUILD_AUTHORIZATION_V272
  ) {
    throw new Error("Gaia v272 external-sort or resource contract is invalid");
  }
  return value as GaiaPresentationCatalogManifestV272;
}
