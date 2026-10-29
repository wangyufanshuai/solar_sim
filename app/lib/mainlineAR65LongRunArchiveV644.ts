import { sha256BytesHexV566 } from "./sha256BrowserV566";
import {
  appendMainlineAR65LongRunObservationV643,
  createPendingMainlineAR65LongRunReceiptV643,
  digestMainlineAR65LongRunValueV643,
  finalizeMainlineAR65LongRunReceiptV643,
  MAINLINE_A_R65_LONGRUN_EVIDENCE_CLASS_V643,
  type MainlineAR65LongRunBuildIdentityV643,
  type MainlineAR65LongRunObservationV643,
  type MainlineAR65LongRunReceiptV643,
} from "./mainlineAR65LongRunV643";

export const MAINLINE_A_R65_ARCHIVE_SCHEMA_V644 = "mainline-a-r65-longrun-observation-archive-v644" as const;
export const MAINLINE_A_R65_ARCHIVE_DATABASE_V644 = "mainline-a-r65-longrun-v644";
export const MAINLINE_A_R65_ARCHIVE_STORE_V644 = "observations";
export const MAINLINE_A_R65_ARCHIVE_MAX_ROW_BYTES_V644 = 64 * 1024 * 1024;

export type MainlineAR65ArchivedObservationV644 = Readonly<{
  schema: typeof MAINLINE_A_R65_ARCHIVE_SCHEMA_V644;
  id: string;
  buildKey: string;
  sessionId: string;
  savedAt: string;
  byteLength: number;
  sha256: string;
  rawJson: string;
}>;

export type MainlineAR65ArchivePortV644 = Readonly<{
  list(buildKey: string): Promise<readonly unknown[]>;
  put(record: MainlineAR65ArchivedObservationV644): Promise<void>;
}>;

export type MainlineAR65ArchiveRestoreV644 = Readonly<{
  status: "empty" | "restored" | "corrupt" | "unavailable";
  receipt: MainlineAR65LongRunReceiptV643 | null;
  records: number;
  bytes: number;
  issues: readonly string[];
}>;

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireText(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`archive:${name}`);
  return value;
}

function requireIso(value: unknown, name: string): string {
  const text = requireText(value, name);
  if (!Number.isFinite(Date.parse(text)) || new Date(text).toISOString() !== text) throw new Error(`archive:${name}`);
  return text;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function sha256Text(value: string): string {
  return sha256BytesHexV566(new TextEncoder().encode(value));
}

function observationDigest(observation: Record<string, unknown>): string {
  const withoutDigest = { ...observation };
  delete withoutDigest.digest;
  return digestMainlineAR65LongRunValueV643(withoutDigest);
}

export function mainlineAR65ArchiveBuildKeyV644(build: MainlineAR65LongRunBuildIdentityV643): string {
  return JSON.stringify([build.buildId, build.runtimeBuildId, build.branch, build.head, build.route]);
}

export function createMainlineAR65ArchiveRecordV644(
  observation: MainlineAR65LongRunObservationV643,
  build: MainlineAR65LongRunBuildIdentityV643,
  savedAt = new Date().toISOString(),
): MainlineAR65ArchivedObservationV644 {
  if (observation.source !== "browser-runtime" || observation.physicalDevice || observation.evidenceClass !== MAINLINE_A_R65_LONGRUN_EVIDENCE_CLASS_V643) {
    throw new Error("archive:browser-observation-required");
  }
  if (mainlineAR65ArchiveBuildKeyV644(observation.build) !== mainlineAR65ArchiveBuildKeyV644(build)
    || mainlineAR65ArchiveBuildKeyV644(observation.endedBuild) !== mainlineAR65ArchiveBuildKeyV644(build)) {
    throw new Error("archive:build-mismatch");
  }
  if (!observation.sessionId || !observation.digest || observation.digest !== observationDigest(observation as unknown as Record<string, unknown>)) {
    throw new Error("archive:observation-digest");
  }
  const rawJson = JSON.stringify(observation);
  const length = byteLength(rawJson);
  if (length > MAINLINE_A_R65_ARCHIVE_MAX_ROW_BYTES_V644) throw new Error("archive:row-too-large");
  const buildKey = mainlineAR65ArchiveBuildKeyV644(build);
  return Object.freeze({
    schema: MAINLINE_A_R65_ARCHIVE_SCHEMA_V644,
    id: `${buildKey}:${observation.sessionId}`,
    buildKey,
    sessionId: observation.sessionId,
    savedAt: requireIso(savedAt, "saved-at"),
    byteLength: length,
    sha256: sha256Text(rawJson),
    rawJson,
  });
}

export function decodeMainlineAR65ArchiveRecordV644(
  value: unknown,
  build: MainlineAR65LongRunBuildIdentityV643,
): MainlineAR65LongRunObservationV643 {
  if (!object(value) || value.schema !== MAINLINE_A_R65_ARCHIVE_SCHEMA_V644) throw new Error("archive:schema");
  const buildKey = mainlineAR65ArchiveBuildKeyV644(build);
  if (value.buildKey !== buildKey || value.id !== `${buildKey}:${value.sessionId}`) throw new Error("archive:build-mismatch");
  requireIso(value.savedAt, "saved-at");
  const rawJson = requireText(value.rawJson, "raw-json");
  const length = byteLength(rawJson);
  if (length > MAINLINE_A_R65_ARCHIVE_MAX_ROW_BYTES_V644 || value.byteLength !== length) throw new Error("archive:byte-length");
  if (value.sha256 !== sha256Text(rawJson)) throw new Error("archive:sha256");
  let parsed: unknown;
  try { parsed = JSON.parse(rawJson) as unknown; }
  catch { throw new Error("archive:json"); }
  if (!object(parsed) || parsed.sessionId !== value.sessionId || parsed.source !== "browser-runtime"
    || parsed.physicalDevice !== false || parsed.evidenceClass !== MAINLINE_A_R65_LONGRUN_EVIDENCE_CLASS_V643) throw new Error("archive:source");
  if (!object(parsed.build) || !object(parsed.endedBuild)
    || mainlineAR65ArchiveBuildKeyV644(parsed.build as MainlineAR65LongRunBuildIdentityV643) !== buildKey
    || mainlineAR65ArchiveBuildKeyV644(parsed.endedBuild as MainlineAR65LongRunBuildIdentityV643) !== buildKey) throw new Error("archive:observation-build");
  if (parsed.digest !== observationDigest(parsed)) throw new Error("archive:observation-digest");
  return parsed as MainlineAR65LongRunObservationV643;
}

export async function saveMainlineAR65ObservationV644(
  port: MainlineAR65ArchivePortV644,
  observation: MainlineAR65LongRunObservationV643,
  build: MainlineAR65LongRunBuildIdentityV643,
): Promise<MainlineAR65ArchivedObservationV644> {
  const record = createMainlineAR65ArchiveRecordV644(observation, build);
  const existing = await port.list(record.buildKey);
  for (const item of existing) {
    try { decodeMainlineAR65ArchiveRecordV644(item, build); }
    catch { throw new Error("archive:existing-corrupt"); }
    if (!object(item) || item.id !== record.id) continue;
    if (item.sha256 === record.sha256 && item.rawJson === record.rawJson) return record;
    throw new Error("archive:session-conflict");
  }
  await port.put(record);
  return record;
}

export async function restoreMainlineAR65ObservationsV644(
  port: MainlineAR65ArchivePortV644,
  build: MainlineAR65LongRunBuildIdentityV643,
): Promise<MainlineAR65ArchiveRestoreV644> {
  let entries: readonly unknown[];
  try { entries = await port.list(mainlineAR65ArchiveBuildKeyV644(build)); }
  catch (error) { return { status: "unavailable", receipt: null, records: 0, bytes: 0, issues: [String(error)] }; }
  if (!entries.length) return { status: "empty", receipt: null, records: 0, bytes: 0, issues: [] };
  const observations: MainlineAR65LongRunObservationV643[] = [];
  const issues: string[] = [];
  const ids = new Set<string>();
  let bytes = 0;
  for (const [index, entry] of entries.entries()) {
    try {
      const observation = decodeMainlineAR65ArchiveRecordV644(entry, build);
      if (ids.has(observation.sessionId)) throw new Error("archive:duplicate-session");
      ids.add(observation.sessionId);
      observations.push(observation);
      bytes += (entry as MainlineAR65ArchivedObservationV644).byteLength;
    } catch (error) { issues.push(`record-${index}:${String(error)}`); }
  }
  if (issues.length) return { status: "corrupt", receipt: null, records: entries.length, bytes, issues };
  observations.sort((left, right) => left.startedAt.localeCompare(right.startedAt) || left.sessionId.localeCompare(right.sessionId));
  let receipt = createPendingMainlineAR65LongRunReceiptV643(build);
  for (const observation of observations) receipt = appendMainlineAR65LongRunObservationV643(receipt, observation);
  return { status: "restored", receipt: finalizeMainlineAR65LongRunReceiptV643(receipt), records: entries.length, bytes, issues: [] };
}

function openDatabaseV644(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("archive:indexeddb-unavailable"));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MAINLINE_A_R65_ARCHIVE_DATABASE_V644, 1);
    let settled = false;
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MAINLINE_A_R65_ARCHIVE_STORE_V644)) {
        const store = db.createObjectStore(MAINLINE_A_R65_ARCHIVE_STORE_V644, { keyPath: "id" });
        store.createIndex("buildKey", "buildKey", { unique: false });
      }
    };
    request.onsuccess = () => {
      if (settled) { request.result.close(); return; }
      settled = true;
      resolve(request.result);
    };
    request.onerror = () => { if (!settled) { settled = true; reject(request.error ?? new Error("archive:indexeddb-open")); } };
    request.onblocked = () => { if (!settled) { settled = true; reject(new Error("archive:indexeddb-blocked")); } };
  });
}

export function createMainlineAR65IndexedDbPortV644(): MainlineAR65ArchivePortV644 {
  return {
    async list(buildKey) {
      const db = await openDatabaseV644();
      try {
        return await new Promise<readonly unknown[]>((resolve, reject) => {
          const transaction = db.transaction(MAINLINE_A_R65_ARCHIVE_STORE_V644, "readonly");
          const request = transaction.objectStore(MAINLINE_A_R65_ARCHIVE_STORE_V644).index("buildKey").getAll(buildKey);
          request.onsuccess = () => resolve(request.result as unknown[]);
          request.onerror = () => reject(request.error ?? new Error("archive:indexeddb-read"));
          transaction.onabort = () => reject(transaction.error ?? new Error("archive:indexeddb-read-aborted"));
        });
      } finally { db.close(); }
    },
    async put(record) {
      const db = await openDatabaseV644();
      try {
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(MAINLINE_A_R65_ARCHIVE_STORE_V644, "readwrite");
          transaction.objectStore(MAINLINE_A_R65_ARCHIVE_STORE_V644).add(record);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error ?? new Error("archive:indexeddb-write"));
          transaction.onabort = () => reject(transaction.error ?? new Error("archive:indexeddb-write-aborted"));
        });
      } finally { db.close(); }
    },
  };
}
