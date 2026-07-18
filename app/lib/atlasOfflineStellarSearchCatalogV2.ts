export const ATLAS_OFFLINE_STELLAR_SEARCH_CATALOG_V2_VERSION =
  "v116-offline-stellar-search-catalog-v2" as const;
export const ATLAS_OFFLINE_STELLAR_SEARCH_CATALOG_V2_PROFILE =
  "v116-100k-sharded-worker-alias-search" as const;
export const ATLAS_OFFLINE_STELLAR_SEARCH_CATALOG_V2_BOUNDARY =
  "v116 adds a 100,000-row offline search-only Gaia catalog and alias bundle. The existing 5,000-row render catalog and v97 1000/1800/3000 budgets remain unchanged; runtime network access and scientific-core mutations are prohibited.";

export type AtlasOfflineStellarSearchCatalogV2Summary = {
  version: typeof ATLAS_OFFLINE_STELLAR_SEARCH_CATALOG_V2_VERSION;
  profile: typeof ATLAS_OFFLINE_STELLAR_SEARCH_CATALOG_V2_PROFILE;
  status: "ready-offline-worker-search";
  searchRowCount: 100000;
  renderRowCount: 5000;
  shardCount: 16;
  workerProtocol: "init-shard-query-query-result-query-error";
  runtimePolicy: "offline-sharded-no-runtime-network";
  fallbackPolicy: "bright-5000-and-curated-catalogs-remain-available";
  focusedCommand: "npm run test:atlas:stellar-search-catalog-v2";
  protectedMutation: "not-applied";
  trustedBoundary: string;
};

export function createAtlasOfflineStellarSearchCatalogV2Summary(): AtlasOfflineStellarSearchCatalogV2Summary {
  return {
    version: ATLAS_OFFLINE_STELLAR_SEARCH_CATALOG_V2_VERSION,
    profile: ATLAS_OFFLINE_STELLAR_SEARCH_CATALOG_V2_PROFILE,
    status: "ready-offline-worker-search",
    searchRowCount: 100000,
    renderRowCount: 5000,
    shardCount: 16,
    workerProtocol: "init-shard-query-query-result-query-error",
    runtimePolicy: "offline-sharded-no-runtime-network",
    fallbackPolicy: "bright-5000-and-curated-catalogs-remain-available",
    focusedCommand: "npm run test:atlas:stellar-search-catalog-v2",
    protectedMutation: "not-applied",
    trustedBoundary: ATLAS_OFFLINE_STELLAR_SEARCH_CATALOG_V2_BOUNDARY,
  };
}
