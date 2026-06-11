"use client";

import type { SkyAtlasCoverMetadata } from "./skyAtlas";

export type SkyAtlasAlbumRecord = {
  id: string;
  createdAt: string;
  metadata: SkyAtlasCoverMetadata;
  thumbnailWebp?: string;
};

const DB_NAME = "solar-sim-sky-atlas";
const DB_VERSION = 1;
const STORE_NAME = "album";
const MAX_RECORDS = 12;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function canvasToWebp(canvas: HTMLCanvasElement): Promise<string | undefined> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(undefined);
          return;
        }
        void blobToDataUrl(blob).then(resolve).catch(() => resolve(undefined));
      },
      "image/webp",
      0.72,
    );
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    callback(transaction.objectStore(STORE_NAME), resolve, reject);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function loadSkyAtlasAlbum(): Promise<SkyAtlasAlbumRecord[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    return await withStore("readonly", (store, resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () =>
        resolve((request.result as SkyAtlasAlbumRecord[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX_RECORDS));
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function saveSkyAtlasAlbumRecord(record: SkyAtlasAlbumRecord): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const records = await loadSkyAtlasAlbum();
    await withStore<void>("readwrite", (store, resolve, reject) => {
      store.put(record);
      for (const stale of records.slice(MAX_RECORDS - 1)) store.delete(stale.id);
      const request = store.get(record.id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Album persistence is optional. The Atlas remains fully usable without IndexedDB.
  }
}

export async function removeSkyAtlasAlbumRecord(id: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    await withStore<void>("readwrite", (store, resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Optional persistence failure.
  }
}

export async function createSkyAtlasAlbumRecord(
  metadata: SkyAtlasCoverMetadata,
  canvas: HTMLCanvasElement | null,
): Promise<SkyAtlasAlbumRecord> {
  const createdAt = metadata.timestamp || new Date().toISOString();
  let thumbnailWebp: string | undefined;
  if (canvas) {
    try {
      const preview = document.createElement("canvas");
      preview.width = 480;
      preview.height = 270;
      const context = preview.getContext("2d");
      if (context) {
        context.drawImage(canvas, 0, 0, preview.width, preview.height);
        thumbnailWebp = await canvasToWebp(preview);
      }
    } catch {
      thumbnailWebp = undefined;
    }
  }
  return {
    id: `atlas-album-${createdAt.replace(/[^0-9]/g, "")}-${metadata.targetId ?? "route"}`,
    createdAt,
    metadata,
    thumbnailWebp,
  };
}
