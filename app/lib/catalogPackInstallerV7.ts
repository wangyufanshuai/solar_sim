"use client";

import { createSHA256 } from "hash-wasm";
import { CATALOG_PACK_ACTIVE_KEY, CATALOG_PACK_STATE_DB } from "./catalogV6";
import {
  CATALOG_MILLION_V7_MANIFEST_VERSION,
  CATALOG_MILLION_V7_OPFS_FILENAME,
  validateWebCatalogPackManifestV3,
  type CatalogPackInstallStateV7,
  type WebCatalogPackManifestV3,
} from "./catalogV7";

const STATE_STORE = "state";

function initialState(manifest: WebCatalogPackManifestV3): CatalogPackInstallStateV7 {
  return {
    version: CATALOG_MILLION_V7_MANIFEST_VERSION,
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
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CATALOG_PACK_STATE_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STATE_STORE)) {
        request.result.createObjectStore(STATE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readCatalogPackInstallStateV7(): Promise<CatalogPackInstallStateV7 | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openStateDb();
  return new Promise<CatalogPackInstallStateV7 | null>((resolve, reject) => {
    const request = db.transaction(STATE_STORE).objectStore(STATE_STORE).get(CATALOG_PACK_ACTIVE_KEY);
    request.onsuccess = () => {
      const value = request.result as CatalogPackInstallStateV7 | { version?: string } | undefined;
      resolve(value?.version === CATALOG_MILLION_V7_MANIFEST_VERSION ? value as CatalogPackInstallStateV7 : null);
    };
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

async function writeState(state: CatalogPackInstallStateV7): Promise<void> {
  const db = await openStateDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STATE_STORE, "readwrite");
    transaction.objectStore(STATE_STORE).put(state, CATALOG_PACK_ACTIVE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  }).finally(() => db.close());
}

async function chunkSha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function chunkUrl(manifest: WebCatalogPackManifestV3, chunkPath: string): string {
  const configured = process.env.NEXT_PUBLIC_ATLAS_CATALOG_PACK_BASE_URL?.trim();
  return new URL(chunkPath, configured || manifest.baseUrl || window.location.href).toString();
}

async function persistChunk(
  fileHandle: FileSystemFileHandle,
  offset: number,
  bytes: Uint8Array,
): Promise<void> {
  const writable = await fileHandle.createWritable({ keepExistingData: true });
  try {
    await writable.seek(offset);
    const writeBuffer = Uint8Array.from(bytes).buffer as ArrayBuffer;
    await writable.write(writeBuffer);
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => undefined);
    throw error;
  }
}

async function truncateFile(
  fileHandle: FileSystemFileHandle,
  installedBytes: number,
): Promise<void> {
  const writable = await fileHandle.createWritable({ keepExistingData: true });
  try {
    await writable.truncate(installedBytes);
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => undefined);
    throw error;
  }
}

export async function installCatalogMillionV7(
  manifest: WebCatalogPackManifestV3,
  options: {
    signal?: AbortSignal;
    onProgress?: (state: CatalogPackInstallStateV7) => void;
  } = {},
): Promise<CatalogPackInstallStateV7> {
  const errors = validateWebCatalogPackManifestV3(manifest);
  if (errors.length > 0) throw new Error(`百万恒星目录清单无效：${errors.join(", ")}`);
  if (!navigator.storage?.getDirectory) {
    throw new Error("此浏览器不支持 OPFS，无法安装百万恒星目录");
  }

  let state = (await readCatalogPackInstallStateV7()) ?? initialState(manifest);
  if (
    state.installedBytes !== manifest.installedBytes ||
    state.totalChunks !== manifest.chunks.length ||
    state.status === "corrupt"
  ) {
    state = initialState(manifest);
  }
  state = { ...state, status: "checking-space", error: null };
  await writeState(state);
  options.onProgress?.(state);

  await navigator.storage.persist?.();
  const estimate = await navigator.storage.estimate();
  const remainingBytes = Math.max(0, manifest.installedBytes - state.downloadedBytes);
  if ((estimate.quota ?? 0) - (estimate.usage ?? 0) < remainingBytes * 1.08) {
    state = {
      ...state,
      status: "insufficient-space",
      error: "持久存储空间不足，无法安装百万恒星目录",
    };
    await writeState(state);
    options.onProgress?.(state);
    return state;
  }

  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(CATALOG_MILLION_V7_OPFS_FILENAME, { create: true });
  try {
    for (let index = state.completedChunks; index < manifest.chunks.length; index += 1) {
      options.signal?.throwIfAborted();
      const chunk = manifest.chunks[index]!;
      const response = await fetch(chunkUrl(manifest, chunk.path), {
        cache: "no-store",
        signal: options.signal,
      });
      if (!response.ok) {
        throw new Error(`目录分块 ${index + 1} 下载失败：HTTP ${response.status}`);
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength !== chunk.bytes) {
        throw new Error(`目录分块 ${index + 1} 大小不匹配`);
      }
      if (await chunkSha256(bytes) !== chunk.sha256) {
        throw new Error(`目录分块 ${index + 1} 校验失败`);
      }
      await persistChunk(fileHandle, chunk.offset, bytes);
      state = {
        ...state,
        status: "downloading",
        completedChunks: index + 1,
        downloadedBytes: chunk.offset + chunk.bytes,
        error: null,
      };
      await writeState(state);
      options.onProgress?.(state);
    }
  } catch (error) {
    state = {
      ...state,
      status: "paused",
      error: error instanceof DOMException && error.name === "AbortError"
        ? "目录安装已暂停，可稍后继续"
        : error instanceof Error ? error.message : String(error),
    };
    await writeState(state);
    options.onProgress?.(state);
    throw error;
  }

  await truncateFile(fileHandle, manifest.installedBytes);
  state = { ...state, status: "verifying", error: null };
  await writeState(state);
  options.onProgress?.(state);

  const hasher = await createSHA256();
  const reader = (await fileHandle.getFile()).stream().getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    hasher.update(value);
  }
  if (hasher.digest() !== manifest.sha256) {
    await root.removeEntry(CATALOG_MILLION_V7_OPFS_FILENAME);
    state = {
      ...state,
      status: "corrupt",
      completedChunks: 0,
      downloadedBytes: 0,
      activeFilename: null,
      error: "百万恒星目录整包校验失败",
    };
  } else {
    state = {
      ...state,
      status: "installed",
      activeFilename: CATALOG_MILLION_V7_OPFS_FILENAME,
      error: null,
    };
  }
  await writeState(state);
  options.onProgress?.(state);
  return state;
}
