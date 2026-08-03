"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
  parseKerrThinDiskBandImagingViewV320,
  type KerrThinDiskBandImagingViewV320,
} from "./kerrThinDiskBandImagingV320";

const ARTIFACT_URL = "/api/atlas/relativity-evidence/artifacts/v320-thin-disk-bands";
const MAX_RESPONSE_BYTES = 64 * 1024;

export type AcquiredKerrThinDiskBandViewV321 = Readonly<{
  view: KerrThinDiskBandImagingViewV320;
  artifactSha256: typeof KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320;
  release: () => void;
}>;

let viewPromise: Promise<KerrThinDiskBandImagingViewV320> | null = null;
let cachedView: KerrThinDiskBandImagingViewV320 | null = null;
let cacheRelease: (() => void) | null = null;
let referenceCount = 0;
let pendingCount = 0;
let loadController: AbortController | null = null;

function abortError(): DOMException {
  return new DOMException("Kerr fixed-band view acquisition aborted", "AbortError");
}

function awaitWithSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then((value) => {
      signal.removeEventListener("abort", onAbort);
      resolve(value);
    }, (error) => {
      signal.removeEventListener("abort", onAbort);
      reject(error);
    });
  });
}

function releaseCacheIfUnused(): void {
  if (pendingCount !== 0 || referenceCount !== 0) return;
  if (!cachedView) loadController?.abort();
  cacheRelease?.();
  cacheRelease = null;
  cachedView = null;
  viewPromise = null;
}

async function loadView(signal: AbortSignal): Promise<KerrThinDiskBandImagingViewV320> {
  const response = await fetch(ARTIFACT_URL, { cache: "no-store", signal });
  if (!response.ok) throw new Error("v321-fixed-band-artifact-unavailable");
  const text = await response.text();
  const byteLength = new TextEncoder().encode(text).byteLength;
  if (byteLength <= 0 || byteLength > MAX_RESPONSE_BYTES) throw new Error("v321-fixed-band-artifact-size-boundary");
  const view = parseKerrThinDiskBandImagingViewV320(JSON.parse(text));
  cacheRelease = acquireAtlasResource("typed-array-cache", "kerr", "kerr-v320-fixed-band-view", {
    owner: "strong-gravity-science",
    estimatedBytes: byteLength,
    contentSha256: KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
  });
  return view;
}

export async function acquireKerrThinDiskBandViewV321(signal?: AbortSignal): Promise<AcquiredKerrThinDiskBandViewV321> {
  if (signal?.aborted) throw abortError();
  pendingCount += 1;
  let pending = true;
  const releasePending = (cleanup: boolean) => {
    if (!pending) return;
    pending = false;
    pendingCount = Math.max(0, pendingCount - 1);
    if (cleanup) releaseCacheIfUnused();
  };
  if (!viewPromise) {
    const controller = new AbortController();
    loadController = controller;
    viewPromise = loadView(controller.signal).then((view) => {
      if (controller.signal.aborted) throw abortError();
      cachedView = view;
      if (loadController === controller) loadController = null;
      return view;
    }).catch((error) => {
      if (loadController === controller) {
        loadController = null;
        viewPromise = null;
      }
      cacheRelease?.();
      cacheRelease = null;
      throw error;
    });
  }
  let view: KerrThinDiskBandImagingViewV320;
  try {
    view = cachedView ?? await awaitWithSignal(viewPromise, signal);
    if (signal?.aborted) throw abortError();
    releasePending(false);
  } catch (error) {
    releasePending(true);
    throw error;
  }
  referenceCount += 1;
  let released = false;
  const acquired: AcquiredKerrThinDiskBandViewV321 = Object.freeze({
    view,
    artifactSha256: KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
    release: () => {
      if (released) return;
      released = true;
      signal?.removeEventListener("abort", acquired.release);
      referenceCount = Math.max(0, referenceCount - 1);
      releaseCacheIfUnused();
    },
  });
  signal?.addEventListener("abort", acquired.release, { once: true });
  return acquired;
}

export function resetKerrThinDiskBandClientV321ForTests(): void {
  loadController?.abort();
  loadController = null;
  cacheRelease?.();
  cacheRelease = null;
  cachedView = null;
  viewPromise = null;
  referenceCount = 0;
  pendingCount = 0;
}
