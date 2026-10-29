import type { StellarSearchDocument, StellarSearchResult } from "./stellarSearchCatalog";

const documentsBySourceId = new Map<string, StellarSearchDocument>();

export function publishAtlasStellarSearchResults(
  results: readonly StellarSearchResult[],
): void {
  for (const { document } of results) {
    documentsBySourceId.set(document.sourceId, document);
  }
}

export function getAtlasStellarSearchDocument(
  sourceId: string,
): StellarSearchDocument | null {
  return documentsBySourceId.get(sourceId) ?? null;
}

export function clearAtlasStellarSearchRuntimeForTests(): void {
  documentsBySourceId.clear();
}
