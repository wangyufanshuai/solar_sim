"use client";

import { createSHA256 } from "hash-wasm";
import {
  CATALOG_MILLION_OPFS_FILENAME,
  CATALOG_MILLION_V6_VERSION,
  CATALOG_PACK_ACTIVE_KEY,
  CATALOG_PACK_STATE_DB,
  validateWebCatalogPackManifest,
  type CatalogPackInstallState,
  type WebCatalogPackManifestV2,
} from "./catalogV6";

const STATE_STORE = "state";

function initialState(manifest: WebCatalogPackManifestV2): CatalogPackInstallState {
  return {
    version: CATALOG_MILLION_V6_VERSION,
    status: "not-installed",
    completedChunks: 0,
    totalChunks: manifest.chunks.length,
    downloadedBytes: 0,
    installedBytes: manifest.installedBytes,
    activeFilename: null,
    error: null,
  };
}

async function openStateDb(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(CATALOG_PACK_STATE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STATE_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readCatalogPackInstallState(): Promise<CatalogPackInstallState | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openStateDb();
  return new Promise<CatalogPackInstallState | null>((resolve, reject) => {
    const request = db.transaction(STATE_STORE).objectStore(STATE_STORE).get(CATALOG_PACK_ACTIVE_KEY);
    request.onsuccess = () => resolve((request.result as CatalogPackInstallState | undefined) ?? null);
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

async function writeState(state: CatalogPackInstallState): Promise<void> {
  const db = await openStateDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STATE_STORE, "readwrite");
    transaction.objectStore(STATE_STORE).put(state, CATALOG_PACK_ACTIVE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  }).finally(() => db.close());
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function chunkUrl(manifest: WebCatalogPackManifestV2, path: string): string {
  const configured = process.env.NEXT_PUBLIC_ATLAS_CATALOG_PACK_BASE_URL?.trim();
  const base = configured || manifest.baseUrl;
  return new URL(path, base || window.location.href).toString();
}

export async function installCatalogMillionV6(
  manifest: WebCatalogPackManifestV2,
  options: { signal?: AbortSignal; onProgress?: (state: CatalogPackInstallState) => void } = {},
): Promise<CatalogPackInstallState> {
  const manifestErrors = validateWebCatalogPackManifest(manifest);
  if (manifestErrors.length > 0) throw new Error(`Invalid catalog pack manifest: ${manifestErrors.join(", ")}`);
  if (!navigator.storage?.getDirectory) throw new Error("OPFS is unavailable in this browser");

  let state = (await readCatalogPackInstallState()) ?? initialState(manifest);
  state = { ...state, status: "checking-space", totalChunks: manifest.chunks.length, installedBytes: manifest.installedBytes, error: null };
  await writeState(state);
  options.onProgress?.(state);
  await navigator.storage.persist?.();
  const estimate = await navigator.storage.estimate();
  if ((estimate.quota ?? 0) - (estimate.usage ?? 0) < manifest.installedBytes * 1.08) {
    state = { ...state, status: "insufficient-space", error: "Insufficient persistent storage for the million-star catalog" };
    await writeState(state);
    options.onProgress?.(state);
    return state;
  }

  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(CATALOG_MILLION_OPFS_FILENAME, { create: true });
  const writable = await fileHandle.createWritable({ keepExistingData: true });
  try {
    for (let index = state.completedChunks; index < manifest.chunks.length; index += 1) {
      options.signal?.throwIfAborted();
      const chunk = manifest.chunks[index]!;
      const response = await fetch(chunkUrl(manifest, chunk.path), { cache: "no-store", signal: options.signal });
      if (!response.ok) throw new Error(`Catalog chunk ${index} failed: ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength !== chunk.bytes) throw new Error(`Catalog chunk ${index} size mismatch`);
      if (await sha256Hex(bytes) !== chunk.sha256) throw new Error(`Catalog chunk ${index} checksum mismatch`);
      await writable.seek(chunk.offset);
      await writable.write(bytes);
      state = {
        ...state,
        status: "downloading",
        completedChunks: index + 1,
        downloadedBytes: chunk.offset + chunk.bytes,
      };
      await writeState(state);
      options.onProgress?.(state);
    }
  } catch (error) {
    await writable.abort();
    state = { ...state, status: "corrupt", error: error instanceof Error ? error.message : String(error) };
    await writeState(state);
    options.onProgress?.(state);
    throw error;
  }
  await writable.truncate(manifest.installedBytes);
  await writable.close();

  state = { ...state, status: "verifying" };
  await writeState(state);
  options.onProgress?.(state);
  const file = await fileHandle.getFile();
  const hasher = await createSHA256();
  const reader = file.stream().getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    hasher.update(value);
  }
  const fullHash = hasher.digest();
  if (fullHash !== manifest.sha256) {
    await root.removeEntry(CATALOG_MILLION_OPFS_FILENAME);
    state = { ...state, status: "corrupt", completedChunks: 0, downloadedBytes: 0, error: "Full catalog checksum mismatch" };
    await writeState(state);
    options.onProgress?.(state);
    return state;
  }
  state = { ...state, status: "installed", activeFilename: CATALOG_MILLION_OPFS_FILENAME, error: null };
  await writeState(state);
  options.onProgress?.(state);
  return state;
}
