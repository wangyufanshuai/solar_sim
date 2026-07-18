"use client";

import { useEffect, useRef, useState } from "react";
import type {
  StellarSearchResult,
  StellarSearchWorkerRequest,
  StellarSearchWorkerResponse,
} from "./stellarSearchCatalog";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { getDesktopCapabilities, searchDesktopCatalog } from "./desktopBridge";

export type StellarSearchState = {
  status: "idle" | "loading" | "ready" | "fallback";
  query: string;
  results: readonly StellarSearchResult[];
  error: string;
};

const IDLE_STATE: StellarSearchState = {
  status: "idle",
  query: "",
  results: [],
  error: "",
};

export function useStellarSearch(query: string, maxResults = 20, enabled = true): StellarSearchState {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const [workerReady, setWorkerReady] = useState(false);
  const [desktopCatalogAvailable, setDesktopCatalogAvailable] = useState(false);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [state, setState] = useState<StellarSearchState>(IDLE_STATE);

  useEffect(() => {
    void getDesktopCapabilities().then((capabilities) => {
      setDesktopCatalogAvailable(
        capabilities.available && capabilities.catalogBackend === "sqlite-fts5",
      );
    });
  }, []);

  useEffect(() => {
    const onInstalled = (event: Event) => {
      const filename = (event as CustomEvent<{ filename?: string }>).detail?.filename;
      workerRef.current?.postMessage({ type: "open-database", requestId: requestIdRef.current, filename });
      setCatalogRevision((revision) => revision + 1);
    };
    window.addEventListener("atlas-catalog-pack-installed", onInstalled);
    return () => window.removeEventListener("atlas-catalog-pack-installed", onInstalled);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (typeof Worker === "undefined") return;
    const worker = new Worker(
      new URL("../workers/stellarSearch.worker.ts", import.meta.url),
    );
    const releaseWorker = acquireAtlasResource("worker", "atlas", "stellar-search-v4");
    workerRef.current = worker;
    setWorkerReady(true);
    worker.onmessage = (event: MessageEvent<StellarSearchWorkerResponse>) => {
      const message = event.data;
      if (message.requestId !== requestIdRef.current) return;
      if (message.type === "query-result") {
        setState({ status: "ready", query: message.query, results: message.results, error: "" });
      } else {
        setState({ status: "fallback", query: message.query, results: [], error: message.message });
      }
    };
    worker.onerror = (event) => {
      setState((current) => ({ ...current, status: "fallback", error: event.message }));
    };
    return () => {
      worker.terminate();
      releaseWorker();
      workerRef.current = null;
      setWorkerReady(false);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      setState(IDLE_STATE);
      return;
    }
    const normalized = query.trim();
    if (normalized.length < 2) {
      requestIdRef.current += 1;
      setState(IDLE_STATE);
      return;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((current) => ({ ...current, status: "loading", query, error: "" }));
    const queryWorker = () => {
      const worker = workerRef.current;
      if (!worker || !workerReady) {
        setState({ status: "fallback", query, results: [], error: "Search service unavailable" });
        return;
      }
      const message: StellarSearchWorkerRequest = { type: "query", requestId, query, maxResults };
      worker.postMessage(message);
    };
    if (!desktopCatalogAvailable) {
      queryWorker();
      return;
    }
    void searchDesktopCatalog({ query, limit: maxResults }).then((results) => {
      if (requestId !== requestIdRef.current) return;
      setState({
        status: "ready",
        query,
        error: "",
        results: results.map((result) => ({
          document: {
            sourceId: result.gaiaSourceId ?? result.id,
            designation: result.designation || result.displayName,
            displayName: result.displayName,
            aliases: [],
            raDeg: result.raDeg,
            decDeg: result.decDeg,
            parallaxMas: result.parallaxMas,
            magG: result.magG ?? 99,
            bpRp: result.bpRp,
            ruwe: null,
            teffK: result.teffK,
            logg: result.logg,
            radiusSolar: result.radiusSolar,
            variable: false,
            source: result.objectType === "exoplanet-host" ? "exoplanet-host" : "curated-local",
            exoplanetSystemId: result.exoplanetSystemId ?? undefined,
          },
          matchKind: /^\d{8,20}$/.test(query.trim().replace(/^gaia\s+dr3\s+/i, "")) ? "exact-id" : "alias",
          score: 2_000,
        })),
      });
    }).catch(queryWorker);
  }, [catalogRevision, desktopCatalogAvailable, enabled, maxResults, query, workerReady]);

  return state;
}
