"use client";

import { useEffect, useState } from "react";
import { R72_SOURCE_ROUTE_V659,
  type R72SourceRowV659 } from "./mainlineAR72ExpansionSourceV659";

export type R72ImageErrorV659 = "policy" | "http" | "origin"
  | "headers" | "bytes" | "sha" | "decode" | "network";

export type R72ImageStateV659 = Readonly<{
  status: "idle" | "policy-hold" | "loading" | "loaded" | "failed";
  objectUrl: string | null;
  width: number | null;
  height: number | null;
  error: R72ImageErrorV659 | null;
  retry: () => void;
}>;

function errorCode(error: unknown): R72ImageErrorV659 {
  const message = error instanceof Error ? error.message : String(error);
  if (["policy", "http", "origin", "headers", "bytes", "sha",
    "decode"].includes(message)) return message as R72ImageErrorV659;
  return "network";
}

async function sha256Web(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}

function sameLocalResponse(response: Response, route: string) {
  try {
    const final = new URL(response.url, window.location.href);
    const requested = new URL(route, window.location.href);
    return final.origin === window.location.origin
      && final.pathname === requested.pathname
      && final.search === "" && final.hash === "";
  } catch {
    return false;
  }
}

async function decodedSize(objectUrl: string) {
  const image = new Image();
  image.src = objectUrl;
  try { await image.decode(); }
  catch { throw new Error("decode"); }
  if (image.naturalWidth < 1 || image.naturalHeight < 1) {
    throw new Error("decode");
  }
  return { width: image.naturalWidth,
    height: image.naturalHeight };
}

export async function loadR72SourceImageV659(row: R72SourceRowV659,
  signal: AbortSignal) {
  if (row.id !== "california-nebula" || !row.imageAcquisitionAllowed
    || !row.imageRaw || row.imageRequestExecuted !== true
    || row.rightsStatus !== "pending"
    || row.runtimeAdmission !== "candidate-only"
    || row.scientificPayloadWriteback !== false) {
    throw new Error("policy");
  }
  const route = `${R72_SOURCE_ROUTE_V659}/${encodeURIComponent(row.id)}`;
  const response = await fetch(route, { method: "GET",
    credentials: "same-origin", cache: "no-store",
    redirect: "error", signal });
  if (!response.ok || response.status !== 200) throw new Error("http");
  if (!sameLocalResponse(response, route)) throw new Error("origin");
  if (!/^image\/jpeg(?:\s*;|$)/i.test(
    response.headers.get("content-type") ?? "")
    || response.headers.get("x-mainline-a-review-only") !== "candidate-hold"
    || response.headers.get("x-mainline-a-rights") !== "pending"
    || response.headers.get("x-scientific-payload-writeback") !== "false"
    || response.headers.get("x-artifact-sha256") !== row.imageRaw.sha256
    || response.headers.get("x-nasa-id") !== row.nasaId) {
    throw new Error("headers");
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== row.imageRaw.bytes
    || bytes.byteLength < 100 || bytes.byteLength > 60_000_000) {
    throw new Error("bytes");
  }
  if (await sha256Web(bytes) !== row.imageRaw.sha256) {
    throw new Error("sha");
  }
  const objectUrl = URL.createObjectURL(new Blob([bytes],
    { type: "image/jpeg" }));
  try {
    const size = await decodedSize(objectUrl);
    if (size.width !== row.originalWidth
      || size.height !== row.originalHeight) throw new Error("decode");
    return { objectUrl, ...size };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export function useMainlineAR72SourceImageV659(
  row: R72SourceRowV659 | null): R72ImageStateV659 {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Omit<R72ImageStateV659, "retry">>({
    status: "idle", objectUrl: null,
    width: null, height: null, error: null,
  });
  useEffect(() => {
    if (!row || !row.imageAcquisitionAllowed || !row.imageRaw) {
      setState({ status: row ? "policy-hold" : "idle",
        objectUrl: null, width: null, height: null,
        error: row ? "policy" : null });
      return;
    }
    const controller = new AbortController();
    let disposed = false;
    let activeObjectUrl: string | null = null;
    setState({ status: "loading", objectUrl: null,
      width: null, height: null, error: null });
    void loadR72SourceImageV659(row, controller.signal).then((loaded) => {
      if (disposed) {
        URL.revokeObjectURL(loaded.objectUrl);
        return;
      }
      activeObjectUrl = loaded.objectUrl;
      setState({ status: "loaded", objectUrl: loaded.objectUrl,
        width: loaded.width, height: loaded.height, error: null });
    }).catch((error) => {
      if (disposed || controller.signal.aborted) return;
      setState({ status: "failed", objectUrl: null,
        width: null, height: null, error: errorCode(error) });
    });
    return () => {
      disposed = true;
      controller.abort();
      if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
    };
  }, [row, attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
