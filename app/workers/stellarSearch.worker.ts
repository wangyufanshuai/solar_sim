/// <reference lib="webworker" />

import type { Database, SqlValue } from "@sqlite.org/sqlite-wasm";
import {
  CATALOG_LITE_V6_MANIFEST_URL,
  CATALOG_MILLION_OPFS_FILENAME,
  CATALOG_PACK_ACTIVE_KEY,
  CATALOG_PACK_STATE_DB,
  type CatalogLiteManifestV6,
  type CatalogPackInstallState,
  type CatalogWorkerRequestV6,
} from "../lib/catalogV6";
import { normalizeCatalogFtsQuery } from "../lib/catalogV5";
import { fetchAtlasAsset } from "../lib/atlasAssetResolver";
import { atlasPublicAssetUrl } from "../lib/atlasDeliveryProfile";
import {
  STELLAR_SEARCH_CATALOG_MANIFEST_URL,
  normalizeStellarSearchQuery,
  searchStellarDocuments,
  selectStellarSearchShard,
  type StellarSearchDocument,
  type StellarSearchManifest,
  type StellarSearchResult,
  type StellarSearchWorkerRequest,
  type StellarSearchWorkerResponse,
} from "../lib/stellarSearchCatalog";
import {
  normalizeUniversalSearchAlias,
  universalSearchPrefix,
  type StellarAliasPostingV4,
  type StellarSearchDocumentV4,
} from "../lib/stellarSearchCatalogV4";

type WorkerRequest = StellarSearchWorkerRequest | CatalogWorkerRequestV6 | { type: "init-manifest" } | { type: "load-prefix"; prefix: string } | { type: "load-source-range"; sourceId: string } | { type: "init-shard"; shardId: string };

let liteManifestPromise: Promise<CatalogLiteManifestV6> | null = null;
let legacyManifestPromise: Promise<StellarSearchManifest> | null = null;
let legacyAliasesPromise: Promise<StellarSearchDocument[]> | null = null;
let millionDbPromise: Promise<Database | null> | null = null;
const postingPromises = new Map<string, Promise<StellarAliasPostingV4[]>>();
const documentPromises = new Map<string, Promise<StellarSearchDocumentV4[]>>();
const legacyShardPromises = new Map<string, Promise<StellarSearchDocument[]>>();
const CATALOG_LITE_V7_PARAMETERS_URL = atlasPublicAssetUrl("data/catalog-lite-v7/astrophysical-parameters.json.gz");

type CatalogLiteV7ParameterRow = {
  sourceId: string;
  dataTier: "parameter-rich" | "photometric-derived" | "catalog-basic";
  teffK: number | null;
  teffLowerK: number | null;
  teffUpperK: number | null;
  logg: number | null;
  radiusSolar: number | null;
  metallicityDex: number | null;
  luminositySolar: number | null;
  flagsFlame: string | null;
};

let liteV7ParametersPromise: Promise<Map<string, CatalogLiteV7ParameterRow>> | null = null;
let millionHasV7Parameters: boolean | null = null;

async function loadJson<T>(url: string): Promise<T> {
  const response = await fetchAtlasAsset(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Stellar search asset failed: ${response.status} ${url}`);
  return response.json() as Promise<T>;
}

async function loadGzipJson<T>(url: string): Promise<T> {
  const response = await fetchAtlasAsset(url, { cache: "force-cache" });
  if (!response.ok || !response.body) throw new Error(`Compressed catalog asset failed: ${response.status} ${url}`);
  if (typeof DecompressionStream === "undefined") throw new Error("gzip decompression is unavailable");
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text()) as T;
}

const getLiteManifest = () => liteManifestPromise ??= loadJson<CatalogLiteManifestV6>(CATALOG_LITE_V6_MANIFEST_URL);
const getLegacyManifest = () => legacyManifestPromise ??= loadJson<StellarSearchManifest>(STELLAR_SEARCH_CATALOG_MANIFEST_URL);

function getLiteV7Parameters(): Promise<Map<string, CatalogLiteV7ParameterRow>> {
  liteV7ParametersPromise ??= loadGzipJson<CatalogLiteV7ParameterRow[]>(CATALOG_LITE_V7_PARAMETERS_URL)
    .then((rows) => new Map(rows.map((row) => [row.sourceId, row])))
    .catch(() => new Map());
  return liteV7ParametersPromise;
}

function enrichWithLiteV7Parameters(document: StellarSearchDocument, parameters: Map<string, CatalogLiteV7ParameterRow>): StellarSearchDocument {
  const row = parameters.get(document.sourceId);
  if (!row) return document;
  return {
    ...document,
    teffK: row.teffK ?? document.teffK,
    teffLowerK: row.teffLowerK,
    teffUpperK: row.teffUpperK,
    logg: row.logg ?? document.logg,
    radiusSolar: row.radiusSolar ?? document.radiusSolar,
    metallicityDex: row.metallicityDex,
    luminositySolar: row.luminositySolar,
    astrophysicalFlags: row.flagsFlame,
    dataTier: row.dataTier,
  };
}

async function getPosting(query: string): Promise<StellarAliasPostingV4[]> {
  const manifest = await getLiteManifest();
  const key = universalSearchPrefix(query);
  const entry = manifest.postings.find((candidate) => candidate.prefix === key);
  if (!entry) return [];
  let promise = postingPromises.get(key);
  if (!promise) {
    promise = loadGzipJson<StellarAliasPostingV4[]>(entry.path);
    postingPromises.set(key, promise);
  }
  return promise;
}

async function getDocumentShard(id: string): Promise<StellarSearchDocumentV4[]> {
  const manifest = await getLiteManifest();
  const entry = manifest.documents.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Unknown catalog-lite-v6 document shard ${id}`);
  let promise = documentPromises.get(id);
  if (!promise) {
    promise = loadGzipJson<StellarSearchDocumentV4[]>(entry.path);
    documentPromises.set(id, promise);
  }
  return promise;
}

async function queryLite(query: string, maxResults: number): Promise<StellarSearchResult[]> {
  const normalized = normalizeUniversalSearchAlias(query);
  if (normalized.length < 2) return [];
  const terms = normalized.split(" ").filter(Boolean);
  const postings = await getPosting(query);
  const ranked = postings.flatMap((posting) => {
    if (!terms.every((term) => posting.normalizedAlias.includes(term))) return [];
    let score = posting.normalizedAlias === normalized ? 2_000 : posting.normalizedAlias.startsWith(normalized) ? 1_200 : 600;
    score -= Math.min(200, posting.normalizedAlias.length);
    return [{ posting, score }];
  }).sort((left, right) => right.score - left.score);
  const unique: typeof ranked = [];
  const seen = new Set<string>();
  for (const row of ranked) {
    if (seen.has(row.posting.documentKey)) continue;
    seen.add(row.posting.documentKey);
    unique.push(row);
    if (unique.length >= Math.max(maxResults * 2, 24)) break;
  }
  const byShard = new Map<string, string[]>();
  for (const row of unique) {
    const keys = byShard.get(row.posting.documentShardId) ?? [];
    keys.push(row.posting.documentKey);
    byShard.set(row.posting.documentShardId, keys);
  }
  const documents: StellarSearchDocumentV4[] = [];
  for (const [id, keys] of Array.from(byShard.entries())) {
    const wanted = new Set(keys);
    documents.push(...(await getDocumentShard(id)).filter((document) => wanted.has(document.catalogKey)));
  }
  const results = searchStellarDocuments(documents, query, maxResults);
  if (results.length === 0) return results;
  const parameters = await getLiteV7Parameters();
  return results.map((result) => ({
    ...result,
    document: enrichWithLiteV7Parameters(result.document, parameters),
  }));
}

async function getLegacyShard(id: string): Promise<StellarSearchDocument[]> {
  const manifest = await getLegacyManifest();
  const entry = manifest.shards.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Unknown legacy stellar shard ${id}`);
  let promise = legacyShardPromises.get(id);
  if (!promise) {
    promise = loadJson<StellarSearchDocument[]>(entry.path);
    legacyShardPromises.set(id, promise);
  }
  return promise;
}

async function queryLegacy(query: string, maxResults: number): Promise<StellarSearchResult[]> {
  const manifest = await getLegacyManifest();
  legacyAliasesPromise ??= loadJson<StellarSearchDocument[]>(manifest.aliasPath);
  const normalized = normalizeStellarSearchQuery(query);
  const shard = selectStellarSearchShard(manifest, normalized);
  const documents = shard
    ? [...await legacyAliasesPromise, ...await getLegacyShard(shard.id)]
    : await legacyAliasesPromise;
  return searchStellarDocuments(documents, query, maxResults);
}

async function readInstalledState(): Promise<CatalogPackInstallState | null> {
  if (typeof indexedDB === "undefined") return null;
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(CATALOG_PACK_STATE_DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore("state");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const request = db.transaction("state").objectStore("state").get(CATALOG_PACK_ACTIVE_KEY);
      request.onsuccess = () => { resolve((request.result as CatalogPackInstallState | undefined) ?? null); db.close(); };
      request.onerror = () => { reject(request.error); db.close(); };
    };
  });
}

async function openMillionDatabase(filename?: string): Promise<Database | null> {
  if (!filename) {
    const state = await readInstalledState();
    if (state?.status !== "installed" || !state.activeFilename) return null;
    filename = state.activeFilename;
  }
  const { default: sqlite3InitModule } = await import("@sqlite.org/sqlite-wasm");
  const sqlite3 = await sqlite3InitModule();
  if (!sqlite3.oo1.OpfsDb) return null;
  const database = new sqlite3.oo1.OpfsDb(`/${filename || CATALOG_MILLION_OPFS_FILENAME}`, "r");
  millionHasV7Parameters = null;
  return database;
}

async function getMillionDatabase(): Promise<Database | null> {
  millionDbPromise ??= openMillionDatabase().catch(() => null);
  return millionDbPromise;
}

function value(row: Record<string, SqlValue>, key: string): SqlValue | null {
  return row[key] ?? null;
}

function numberOrNull(input: SqlValue | null): number | null {
  return typeof input === "number" && Number.isFinite(input) ? input : typeof input === "bigint" ? Number(input) : null;
}

function rowToSearchResult(row: Record<string, SqlValue>, query: string): StellarSearchResult {
  const sourceId = value(row, "gaia_source_id");
  const gaiaSourceId = sourceId == null ? String(value(row, "id") ?? "") : String(sourceId);
  const displayName = String(value(row, "display_name") ?? value(row, "designation") ?? gaiaSourceId);
  const designation = String(value(row, "designation") ?? displayName);
  const normalizedId = query.trim().replace(/^gaia\s+dr3\s+/i, "");
  return {
    document: {
      sourceId: gaiaSourceId,
      designation,
      displayName,
      aliases: [],
      raDeg: numberOrNull(value(row, "ra_deg")) ?? 0,
      decDeg: numberOrNull(value(row, "dec_deg")) ?? 0,
      parallaxMas: numberOrNull(value(row, "parallax_mas")),
      magG: numberOrNull(value(row, "mag_g")) ?? 99,
      bpRp: numberOrNull(value(row, "bp_rp")),
      ruwe: null,
      teffK: numberOrNull(value(row, "teff_k")),
      teffLowerK: numberOrNull(value(row, "teff_k_lower")),
      teffUpperK: numberOrNull(value(row, "teff_k_upper")),
      logg: numberOrNull(value(row, "logg")),
      radiusSolar: numberOrNull(value(row, "radius_solar")),
      metallicityDex: numberOrNull(value(row, "metallicity_dex")),
      luminositySolar: numberOrNull(value(row, "luminosity_solar")),
      astrophysicalFlags: value(row, "flags_flame") == null ? null : String(value(row, "flags_flame")),
      dataTier: value(row, "data_tier") === "parameter-rich"
        ? "parameter-rich"
        : value(row, "data_tier") === "photometric-derived"
          ? "photometric-derived"
          : "catalog-basic",
      variable: false,
      source: value(row, "object_type") === "exoplanet-host" ? "exoplanet-host" : "curated-local",
      exoplanetSystemId: value(row, "exoplanet_system_id") == null ? undefined : String(value(row, "exoplanet_system_id")),
    },
    matchKind: /^\d{8,20}$/.test(normalizedId) ? "exact-id" : "alias",
    score: 2_000,
  };
}

function hasV7ParameterTable(db: Database): boolean {
  millionHasV7Parameters ??= Number(db.selectValue(
    "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='stellar_astrophysical_parameters'",
  ) ?? 0) > 0;
  return millionHasV7Parameters;
}

function v7SelectColumns(db: Database): string {
  return hasV7ParameterTable(db)
    ? ", ap.teff_k_lower, ap.teff_k_upper, ap.metallicity_dex, ap.luminosity_solar, ap.flags_flame"
    : "";
}

function v7ParameterJoin(db: Database): string {
  return hasV7ParameterTable(db)
    ? " LEFT JOIN stellar_astrophysical_parameters ap ON ap.source_id=c.gaia_source_id"
    : "";
}

async function queryMillion(query: string, maxResults: number): Promise<StellarSearchResult[] | null> {
  const db = await getMillionDatabase();
  if (!db) return null;
  const normalized = normalizeCatalogFtsQuery(query);
  if (!normalized) return [];
  const sourceId = query.trim().replace(/^gaia\s+dr3\s+/i, "");
  const extraColumns = v7SelectColumns(db);
  const parameterJoin = v7ParameterJoin(db);
  const rows = /^\d{8,20}$/.test(sourceId)
    ? db.selectObjects(`SELECT c.*${extraColumns} FROM catalog_objects c${parameterJoin} WHERE CAST(c.gaia_source_id AS TEXT)=? OR c.id=? LIMIT ?`, [sourceId, sourceId, maxResults])
    : db.selectObjects(
        `SELECT c.*${extraColumns} FROM catalog_fts f JOIN catalog_objects c ON c.rowid=f.rowid${parameterJoin} WHERE catalog_fts MATCH ? ORDER BY bm25(catalog_fts) LIMIT ?`,
        [normalized.split(/\s+/).map((term) => `${term.replaceAll('"', "")}*`).join(" "), maxResults],
      );
  return rows.map((row) => rowToSearchResult(row, query));
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  if (message.type === "init-manifest") {
    await Promise.allSettled([getLiteManifest(), getLegacyManifest(), getMillionDatabase()]);
    return;
  }
  if (message.type === "load-prefix") { await getPosting(message.prefix); return; }
  if (message.type === "load-source-range") { await getPosting(message.sourceId); return; }
  if (message.type === "init-shard") { try { await getLegacyShard(message.shardId); } catch { /* fallback remains available */ } return; }
  if (message.type === "install-status") {
    self.postMessage({ type: "install-status", requestId: message.requestId, state: await readInstalledState() });
    return;
  }
  if (message.type === "open-database") {
    millionDbPromise = openMillionDatabase(message.filename);
    const db = await millionDbPromise;
    const rowCount = db ? Number(db.selectValue("SELECT count(*) FROM catalog_objects") ?? 0) : 0;
    self.postMessage({ type: "database-opened", requestId: message.requestId, filename: message.filename ?? CATALOG_MILLION_OPFS_FILENAME, rowCount });
    return;
  }
  if (message.type === "cone-search") {
    const db = await getMillionDatabase();
    if (!db) {
      self.postMessage({ type: "query-error", requestId: message.requestId, query: `${message.raDeg},${message.decDeg}`, message: "Million catalog is not installed" });
      return;
    }
    const radius = Math.max(0.0001, Math.min(30, message.radiusDeg));
    const rows = db.selectObjects(
      `SELECT c.*${v7SelectColumns(db)} FROM catalog_objects c${v7ParameterJoin(db)} WHERE c.ra_deg BETWEEN ? AND ? AND c.dec_deg BETWEEN ? AND ? LIMIT ?`,
      [message.raDeg - radius, message.raDeg + radius, message.decDeg - radius, message.decDeg + radius, message.maxResults],
    );
    self.postMessage({ type: "query-result", requestId: message.requestId, query: `${message.raDeg},${message.decDeg}`, results: rows.map((row) => rowToSearchResult(row, "cone")), source: "catalog-million-v6" });
    return;
  }

  const requestId = message.requestId;
  const query = message.type === "get-by-id" ? message.id : message.query;
  const maxResults = message.type === "get-by-id" ? 1 : message.maxResults;
  try {
    const million = await queryMillion(query, maxResults);
    const results = million ?? await queryLite(query, maxResults).catch(() => queryLegacy(query, maxResults));
    const response: StellarSearchWorkerResponse = { type: "query-result", requestId, query, results };
    self.postMessage(response);
  } catch (error) {
    const response: StellarSearchWorkerResponse = { type: "query-error", requestId, query, message: error instanceof Error ? error.message : String(error) };
    self.postMessage(response);
  }
};

export {};
