"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";

export const KERR_SCIENCE_IMAGE_PRODUCT_CLIENT_VERSION_V344 = "v344-kerr-science-image-product-client-v1" as const;
export type KerrScienceImageProductIdV344 = "fits" | "png";
export type KerrScienceImageProductExpectationV344 = Readonly<{
  id: KerrScienceImageProductIdV344;
  endpoint: string;
  sha256: string;
  manifestSha256: string;
  bytes: number;
  mimeType: "application/fits" | "image/png";
}>;
export type AcquiredKerrScienceImageProductV344 = Readonly<{
  id: KerrScienceImageProductIdV344;
  objectUrl: string;
  bytes: number;
  sha256: string;
  release: () => void;
}>;
export type KerrScienceImageProductClientSnapshotV344 = Readonly<{
  version: typeof KERR_SCIENCE_IMAGE_PRODUCT_CLIENT_VERSION_V344;
  cacheEntries: number;
  inFlightCount: number;
  referenceCount: number;
  fetchCount: number;
  boundary: "no-fetch-before-explicit-acquire-single-flight-exact-sha-object-url-per-consumer";
}>;
type Entry = { expectation: KerrScienceImageProductExpectationV344; promise: Promise<Uint8Array>; bytes: Uint8Array | null; releaseCache: (() => void) | null; pending: number; references: number };
const entries = new Map<KerrScienceImageProductIdV344, Entry>();
let fetchCount = 0;
const SHA = /^[a-f0-9]{64}$/;

function validateExpectation(value: KerrScienceImageProductExpectationV344): void {
  if (!value.endpoint.startsWith("/api/atlas/relativity-evidence/v343/products/") || !SHA.test(value.sha256) || !SHA.test(value.manifestSha256) || !Number.isSafeInteger(value.bytes) || value.bytes <= 0 || value.bytes > 1024 * 1024 || (value.id === "fits" ? value.mimeType !== "application/fits" : value.mimeType !== "image/png")) throw new Error("v344-product-expectation-invalid");
}
async function exactSha(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}
async function fetchBytes(expectation: KerrScienceImageProductExpectationV344): Promise<Uint8Array> {
  fetchCount += 1;
  const response = await fetch(expectation.endpoint, { cache: "no-store" });
  const contentType = response.headers.get("content-type")?.split(";", 1)[0] ?? "";
  const contentLength = Number(response.headers.get("content-length"));
  const etag = response.headers.get("etag")?.replaceAll('"', "") ?? "";
  if (!response.ok || contentType !== expectation.mimeType || contentLength !== expectation.bytes || etag !== expectation.sha256 || response.headers.get("x-atlas-science-product") !== `v343-${expectation.id}`) throw new Error("v344-product-response-identity");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength !== expectation.bytes || await exactSha(bytes) !== expectation.sha256) throw new Error("v344-product-byte-integrity");
  return bytes;
}
function same(left: KerrScienceImageProductExpectationV344, right: KerrScienceImageProductExpectationV344): boolean { return left.id === right.id && left.endpoint === right.endpoint && left.sha256 === right.sha256 && left.manifestSha256 === right.manifestSha256 && left.bytes === right.bytes && left.mimeType === right.mimeType; }
function cleanup(entry: Entry): void {
  if (entry.pending !== 0 || entry.references !== 0) return;
  entry.releaseCache?.(); entry.releaseCache = null; entry.bytes = null;
  if (entries.get(entry.expectation.id) === entry) entries.delete(entry.expectation.id);
}
function getEntry(expectation: KerrScienceImageProductExpectationV344): Entry {
  const existing = entries.get(expectation.id);
  if (existing) { if (!same(existing.expectation, expectation)) throw new Error("v344-product-cache-identity-drift"); return existing; }
  const entry: Entry = { expectation, promise: Promise.resolve(new Uint8Array()), bytes: null, releaseCache: null, pending: 0, references: 0 };
  entry.promise = fetchBytes(expectation).then((bytes) => {
    entry.bytes = bytes;
    entry.releaseCache = acquireAtlasResource("typed-array-cache", "relativity-lab", `v344:${expectation.id}:verified-bytes`, { owner: "v344-science-image-product", estimatedBytes: bytes.byteLength, contentSha256: expectation.sha256, manifestSha256: expectation.manifestSha256 });
    return bytes;
  }).catch((error: unknown) => { if (entries.get(expectation.id) === entry) entries.delete(expectation.id); throw error; });
  entries.set(expectation.id, entry);
  return entry;
}
function abortError(): DOMException { return new DOMException("Science image product acquisition aborted", "AbortError"); }
async function withSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) throw abortError();
  return new Promise<T>((resolve, reject) => { const abort = () => reject(abortError()); signal.addEventListener("abort", abort, { once: true }); promise.then((value) => { signal.removeEventListener("abort", abort); resolve(value); }, (error) => { signal.removeEventListener("abort", abort); reject(error); }); });
}
export async function acquireKerrScienceImageProductV344(expectation: KerrScienceImageProductExpectationV344, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<AcquiredKerrScienceImageProductV344> {
  validateExpectation(expectation);
  const entry = getEntry(expectation); entry.pending += 1;
  let bytes: Uint8Array;
  try { bytes = await withSignal(entry.promise, options.signal); } finally { entry.pending = Math.max(0, entry.pending - 1); }
  if (options.signal?.aborted) { cleanup(entry); throw abortError(); }
  const blob = new Blob([bytes.slice()], { type: expectation.mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const releaseRegistry = acquireAtlasResource("object-url", "relativity-lab", `v344:${expectation.id}:consumer-url`, { owner: "v344-science-image-product", estimatedBytes: blob.size, contentSha256: expectation.sha256, manifestSha256: expectation.manifestSha256 });
  entry.references += 1;
  let released = false;
  return Object.freeze({ id: expectation.id, objectUrl, bytes: bytes.byteLength, sha256: expectation.sha256, release: () => { if (released) return; released = true; URL.revokeObjectURL(objectUrl); releaseRegistry(); entry.references = Math.max(0, entry.references - 1); cleanup(entry); } });
}
export function getKerrScienceImageProductClientSnapshotV344(): KerrScienceImageProductClientSnapshotV344 { const current = [...entries.values()]; return Object.freeze({ version: KERR_SCIENCE_IMAGE_PRODUCT_CLIENT_VERSION_V344, cacheEntries: current.length, inFlightCount: current.filter((entry) => entry.bytes == null).length, referenceCount: current.reduce((total, entry) => total + entry.references, 0), fetchCount, boundary: "no-fetch-before-explicit-acquire-single-flight-exact-sha-object-url-per-consumer" }); }
export function resetKerrScienceImageProductClientV344ForTests(): void { for (const entry of entries.values()) { if (entry.references !== 0 || entry.pending !== 0) throw new Error("v344-reset-with-live-consumers"); entry.releaseCache?.(); } entries.clear(); fetchCount = 0; }
