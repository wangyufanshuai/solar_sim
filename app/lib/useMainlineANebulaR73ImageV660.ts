"use client";

import { useCallback, useEffect, useState } from "react";
import type { R73GalleryRowV660 } from "./mainlineANebulaR73CatalogV660";

export type R73ImageErrorV660 = "policy" | "origin" | "http"
  | "headers" | "bytes" | "sha" | "decode" | "network";
export type R73ImageStateV660 = Readonly<{
  requestKey: string;
  status: "idle" | "policy-hold" | "loading" | "loaded" | "failed";
  objectUrl: string | null;
  width: number | null;
  height: number | null;
  error: R73ImageErrorV660 | null;
}>;

function empty(key: string, status: R73ImageStateV660["status"] = "idle"):
  R73ImageStateV660 {
  return { requestKey: key, status, objectUrl: null,
    width: null, height: null, error: null };
}

function report(error: unknown): R73ImageErrorV660 {
  const value = error instanceof Error ? error.message : String(error);
  if (["policy", "origin", "http", "headers", "bytes", "sha",
    "decode"].includes(value)) return value as R73ImageErrorV660;
  return "network";
}

function exactRoute(row: R73GalleryRowV660) {
  if (row.cohort === "B1" || row.cohort === "B2") {
    return `/api/atlas/mainline-a-nebula-review/${row.id}/detail`;
  }
  if (row.cohort === "R71") {
    return `/api/atlas/mainline-a-r71-source/${row.id}/image`;
  }
  return `/api/atlas/mainline-a-r72-source/${row.id}`;
}

export function r73ImageRequestAllowedV660(row: R73GalleryRowV660 | null) {
  if (!row || row.imageState !== "review-image" || !row.delivery
    || row.rightsStatus !== "pending"
    || row.runtimeAdmission !== "candidate-only"
    || row.hold !== true || row.notAdmitted !== true
    || row.scientificPayloadWriteback !== false
    || row.delivery.route !== exactRoute(row)
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id)) return false;
  if (row.cohort === "R72" && row.id !== "california-nebula") return false;
  if (!/^[a-f0-9]{64}$/.test(row.delivery.sha256)
    || row.delivery.bytes < 100 || row.delivery.bytes > 60_000_000
    || row.delivery.width < 1 || row.delivery.height < 1) return false;
  return true;
}

export function sameR73LocalResponseV660(response: Response, route: string,
  origin: string) {
  try {
    const expected = new URL(route, origin);
    const actual = new URL(response.url, origin);
    return !response.redirected && expected.origin === origin
      && actual.origin === origin
      && actual.pathname === expected.pathname
      && !actual.search && !actual.hash;
  } catch {
    return false;
  }
}

function headerBoundary(row: R73GalleryRowV660, response: Response) {
  const asset = row.delivery!;
  if (response.headers.get("content-type") !== asset.mimeType
    || response.headers.get("x-mainline-a-review-only") !== "candidate-hold"
    || response.headers.get("x-mainline-a-rights") !== "pending"
    || response.headers.get("x-scientific-payload-writeback") !== "false"
    || response.headers.get("x-artifact-sha256") !== asset.sha256
    || Number(response.headers.get("content-length")) !== asset.bytes) {
    return false;
  }
  if (row.cohort === "B1" || row.cohort === "B2") {
    const candidate = row.rawEvidence.find((item) =>
      item.role === "candidate-raw");
    return Boolean(candidate && response.headers.get("x-candidate-raw-sha256")
      === candidate.sha256);
  }
  return response.headers.get("x-nasa-id") === row.nasaId;
}

async function sha256(buffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0")).join("");
}

export async function retrieveR73ImageV660(row: R73GalleryRowV660,
  signal: AbortSignal, fetcher: typeof fetch = fetch,
  origin = window.location.origin) {
  if (!r73ImageRequestAllowedV660(row)) throw new Error("policy");
  const asset = row.delivery!;
  const response = await fetcher(asset.route, { method: "GET",
    credentials: "same-origin", cache: "no-store", redirect: "error", signal });
  if (!response.ok || response.status !== 200) throw new Error("http");
  if (!sameR73LocalResponseV660(response, asset.route, origin)) {
    throw new Error("origin");
  }
  if (!headerBoundary(row, response)) throw new Error("headers");
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength !== asset.bytes) throw new Error("bytes");
  if (await sha256(buffer) !== asset.sha256) throw new Error("sha");
  return { buffer, width: asset.width, height: asset.height,
    mimeType: asset.mimeType };
}

async function decode(url: string) {
  const image = new Image();
  image.src = url;
  try { await image.decode(); }
  catch { throw new Error("decode"); }
  if (image.naturalWidth < 1 || image.naturalHeight < 1) {
    throw new Error("decode");
  }
  return { width: image.naturalWidth, height: image.naturalHeight };
}

export function useMainlineANebulaR73ImageV660(
  row: R73GalleryRowV660 | null, enabled = true,
) {
  const [attempt, setAttempt] = useState(0);
  const key = `${row?.id ?? "none"}:${row?.delivery?.sha256 ?? "hold"}:${attempt}`;
  const [stored, setStored] = useState<R73ImageStateV660>(() => empty(key));
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const visible = stored.requestKey === key ? stored : empty(key,
    row?.imageState === "policy-hold" ? "policy-hold" : "idle");

  useEffect(() => {
    if (!enabled || !row) {
      setStored(empty(key));
      return;
    }
    if (!r73ImageRequestAllowedV660(row)) {
      setStored(empty(key, "policy-hold"));
      return;
    }
    let released = false;
    let activeUrl: string | null = null;
    const controller = new AbortController();
    setStored(empty(key, "loading"));
    void retrieveR73ImageV660(row, controller.signal).then(async (asset) => {
      if (released || controller.signal.aborted) return;
      activeUrl = URL.createObjectURL(new Blob([asset.buffer], {
        type: asset.mimeType,
      }));
      const image = await decode(activeUrl);
      if (image.width !== asset.width || image.height !== asset.height) {
        throw new Error("decode");
      }
      if (released || controller.signal.aborted) return;
      setStored({ requestKey: key, status: "loaded",
        objectUrl: activeUrl, width: image.width,
        height: image.height, error: null });
    }).catch((error) => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
        activeUrl = null;
      }
      if (released || controller.signal.aborted) return;
      setStored({ requestKey: key, status: "failed",
        objectUrl: null, width: null, height: null, error: report(error) });
    });
    return () => {
      released = true;
      controller.abort();
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [enabled, key, row]);
  return { ...visible, retry } as const;
}
