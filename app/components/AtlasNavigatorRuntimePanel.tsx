"use client";

import { useEffect, useMemo, useState } from "react";
import { createAtlasNavigatorSummary } from "../lib/atlasNavigator";
import { publishAtlasStellarSearchResults } from "../lib/atlasStellarSearchRuntime";
import type { GaiaIndexedStar } from "../lib/gaiaCatalogIndex";
import type {
  AtlasNavigatorItem,
  EvidenceLedgerSummary,
} from "../lib/simulationDiagnosticsTypes";
import { useStellarSearch } from "../lib/useStellarSearch";
import AtlasNavigatorPanel from "./AtlasNavigatorPanel";

type AtlasNavigatorRuntimePanelProps = {
  open: boolean;
  evidenceLedgerSummary: EvidenceLedgerSummary;
  orbitAnalysisAvailable: boolean;
  gaiaIndex: readonly GaiaIndexedStar[];
  onClose: () => void;
  onExecute: (item: AtlasNavigatorItem) => void;
};

export default function AtlasNavigatorRuntimePanel({
  open,
  evidenceLedgerSummary,
  orbitAnalysisAvailable,
  gaiaIndex,
  onClose,
  onExecute,
}: AtlasNavigatorRuntimePanelProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const searchState = useStellarSearch(query, 20, open);
  const summary = useMemo(
    () => createAtlasNavigatorSummary({
      query,
      evidenceLedgerSummary,
      orbitAnalysisAvailable,
      gaiaIndex,
      stellarSearchResults: searchState.results,
    }),
    [evidenceLedgerSummary, gaiaIndex, orbitAnalysisAvailable, query, searchState.results],
  );

  useEffect(() => {
    publishAtlasStellarSearchResults(searchState.results);
  }, [searchState.results]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-atlas-root]");
    if (!root) return;
    root.dataset.atlasNavigatorQuery = query;
    root.dataset.atlasNavigatorResultCount = String(summary.resultCount);
    root.dataset.atlasNavigatorSelectedId = selectedId;
    root.dataset.atlasNavigatorSearchStatus = searchState.status;
  }, [query, searchState.status, selectedId, summary.resultCount]);

  return (
    <AtlasNavigatorPanel
      open={open}
      summary={summary}
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      onExecute={onExecute}
      onSelectedIdChange={setSelectedId}
    />
  );
}
