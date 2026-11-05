import { describe, expect, it } from "vitest";
import { GAIA_PRESENTATION_CATALOG_V9_ID } from "./gaiaPresentationCatalogV9";
import { GAIA_PRESENTATION_CATALOG_V272_VERSION, parseGaiaPresentationCatalogManifestV272 } from "./gaiaPresentationCatalogV272";

const artifact = (url: string, byteLength: number) => ({ url, byteLength, sha256: "a".repeat(64) });

function manifest() {
  return {
    version: GAIA_PRESENTATION_CATALOG_V272_VERSION,
    id: GAIA_PRESENTATION_CATALOG_V9_ID,
    scheme: "NESTED",
    orders: [3, 6, 8],
    generatedAt: "2026-07-20T00:00:00Z",
    source: { archive: "Gaia DR3 gaiadr3.gaia_source", endpoint: "https://gea.esac.esa.int/tap-server/tap/sync", randomIndexStart: 0, randomIndexMaximumExclusive: 10_200_000, shardMaximumRows: 100_000, shardCount: 101, provenanceSha256: "b".repeat(64) },
    counts: { presentation: 10_000_000, excludedBright: 1, rejectedInvalid: 2, duplicateSourceIds: 0 },
    archive: { ...artifact("data/gaia-dr3-presentation-10000000-v9/catalog-v9.bin", 240_000_000), recordBytes: 24, sort: "healpix-order8,g-quantized,source-id" },
    aggregateOrder3: { ...artifact("aggregate", 18_432), entryBytes: 24, cellCount: 768 },
    directoryOrder6: { ...artifact("directory", 1_376_256), entryBytes: 28, cellCount: 49_152 },
    leafIndexOrder8: { ...artifact("leaf", 12_582_912), entryBytes: 16, cellCount: 786_432, pageBytes: 256 },
    sourceIndex: { data: { ...artifact("source", 160_000_000), entryBytes: 16, entryCount: 10_000_000 }, directory: { ...artifact("source-directory", 58_608), entryBytes: 24, pageEntries: 4096 } },
    runtime: { standaloneIntentRequired: true, liteIncluded: false, maxConcurrentRanges: 4, fallback: ["catalog-v10-1221242", "gaia-v255-46000", "gaia-legacy-5000"] },
    builder: { script: "scripts/build-gaia-presentation-v272.py", externalSort: "order3-spools-bounded-runs-kway-merge-and-source-high-byte-spools", maximumRunRows: 250_000, python: "3.13", numpy: "2.2.6", astropyHealpix: "1.1.2" },
    resourcePreflight: {
      freePhysicalMemoryBytes: 7 * 1024 ** 3,
      freeDiskBytes: 30 * 1024 ** 3,
      defaultRequiredPhysicalMemoryBytes: 6 * 1024 ** 3,
      requestedPhysicalMemoryBytes: 6 * 1024 ** 3,
      requiredPhysicalMemoryBytes: 6 * 1024 ** 3,
      requiredDiskBytes: 30 * 1024 ** 3,
      overrideApplied: false,
      authorization: "user-authorized-current-memory-build",
    },
    canonical: true,
    presentationOnly: true,
    surveyCompletenessClaim: "not-applied",
    livePhysicsMutation: "not-applied",
    workerPhysicsMutation: "not-applied",
    manifestSha256: "c".repeat(64),
  };
}

describe("v272 Gaia presentation catalog", () => {
  it("accepts the default 6 GiB external-sort resource contract", () => {
    expect(parseGaiaPresentationCatalogManifestV272(manifest()).version).toBe(GAIA_PRESENTATION_CATALOG_V272_VERSION);
    expect(() => parseGaiaPresentationCatalogManifestV272({ ...manifest(), resourcePreflight: { ...manifest().resourcePreflight, freePhysicalMemoryBytes: 1 } })).toThrow();
    expect(() => parseGaiaPresentationCatalogManifestV272({ ...manifest(), runtime: { ...manifest().runtime, liteIncluded: true } })).toThrow();
  });

  it("accepts an explicitly authorized 3 GiB low-memory build", () => {
    const lowMemoryManifest = manifest();
    lowMemoryManifest.resourcePreflight = {
      ...lowMemoryManifest.resourcePreflight,
      freePhysicalMemoryBytes: 5 * 1024 ** 3,
      requestedPhysicalMemoryBytes: 3 * 1024 ** 3,
      requiredPhysicalMemoryBytes: 3 * 1024 ** 3,
      overrideApplied: true,
    };
    expect(parseGaiaPresentationCatalogManifestV272(lowMemoryManifest).resourcePreflight.overrideApplied).toBe(true);
  });

  it("fails closed for an unauthorized or sub-3 GiB override", () => {
    const lowMemoryManifest = manifest();
    lowMemoryManifest.resourcePreflight = {
      ...lowMemoryManifest.resourcePreflight,
      requestedPhysicalMemoryBytes: 3 * 1024 ** 3,
      requiredPhysicalMemoryBytes: 3 * 1024 ** 3,
      overrideApplied: true,
    };
    const withoutAuthorization: Record<string, unknown> = { ...lowMemoryManifest.resourcePreflight };
    delete withoutAuthorization.authorization;
    expect(() => parseGaiaPresentationCatalogManifestV272({ ...lowMemoryManifest, resourcePreflight: withoutAuthorization })).toThrow();
    expect(() => parseGaiaPresentationCatalogManifestV272({
      ...lowMemoryManifest,
      resourcePreflight: {
        ...lowMemoryManifest.resourcePreflight,
        requestedPhysicalMemoryBytes: 3 * 1024 ** 3 - 1,
        requiredPhysicalMemoryBytes: 3 * 1024 ** 3 - 1,
      },
    })).toThrow();
    expect(() => parseGaiaPresentationCatalogManifestV272({
      ...lowMemoryManifest,
      resourcePreflight: { ...lowMemoryManifest.resourcePreflight, overrideApplied: false },
    })).toThrow();
  });
});
