"use client";

import { useEffect, useState } from "react";
import { R71_SOURCE_ROUTE_V658,
  type R71SourceRowV658 } from "./mainlineAR71SourceV658";

export type R71ImageFailureV658 = "http" | "origin" | "headers"
  | "bytes" | "sha" | "decode" | "network";

export type R71ImageStateV658 = Readonly<{
  status: "idle" | "loading" | "loaded" | "failed";
  objectUrl: string | null;
  width: number | null;
  height: number | null;
  error: R71ImageFailureV658 | null;
  retry: () => void;
}>;

function sameOriginResponseV658(response: Response, requested: string) {
  try {
    const final = new URL(response.url, window.location.href);
    const original = new URL(requested, window.location.href);
    return final.origin === window.location.origin
      && final.pathname === original.pathname
      && !final.search && !final.hash;
  } catch {
    return false;
  }
}

function reportErrorV658(error: unknown): R71ImageFailureV658 {
  const message = error instanceof Error ? error.message : String(error);
  if (message === "http") return "http";
  if (message === "origin") return "origin";
  if (message === "headers") return "headers";
  if (message === "bytes") return "bytes";
  if (message === "sha") return "sha";
  if (message === "decode") return "decode";
  return "network";
}

async function webSha256V658(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}

async function decodeObjectUrlV658(objectUrl: string) {
  const image = new Image();
  image.src = objectUrl;
  try {
    await image.decode();
  } catch {
    throw new Error("decode");
  }
  if (image.naturalWidth < 1 || image.naturalHeight < 1) {
    throw new Error("decode");
  }
  return { width: image.naturalWidth, height: image.naturalHeight };
}

export async function loadR71SourceImageV658(row: R71SourceRowV658,
  signal: AbortSignal) {
  if (!row.imageRaw || row.imageResponseCaptured !== 1
    || row.rightsStatus !== "pending"
    || row.runtimeAdmission !== "candidate-only") {
    throw new Error("headers");
  }
  const route = `${R71_SOURCE_ROUTE_V658}/${encodeURIComponent(row.id)}/image`;
  const response = await fetch(route, { method: "GET", credentials: "same-origin",
    cache: "no-store", redirect: "error", signal });
  if (!response.ok || response.status !== 200) throw new Error("http");
  if (!sameOriginResponseV658(response, route)) throw new Error("origin");
  if (!/^image\/jpeg(?:\s*;|$)/i.test(response.headers.get("content-type") ?? "")
    || response.headers.get("x-mainline-a-review-only") !== "candidate-hold"
    || response.headers.get("x-mainline-a-rights") !== "pending"
    || response.headers.get("x-scientific-payload-writeback") !== "false"
    || response.headers.get("x-artifact-sha256") !== row.imageRaw.sha256) {
    throw new Error("headers");
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== row.imageRaw.bytes
    || bytes.byteLength < 100 || bytes.byteLength > 60_000_000) {
    throw new Error("bytes");
  }
  if (await webSha256V658(bytes) !== row.imageRaw.sha256) {
    throw new Error("sha");
  }
  const blob = new Blob([bytes], { type: "image/jpeg" });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await decodeObjectUrlV658(objectUrl);
    if (row.originalWidth !== image.width
      || row.originalHeight !== image.height) throw new Error("decode");
    return { objectUrl, ...image };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export function useMainlineAR71SourceImageV658(row: R71SourceRowV658 | null):
  R71ImageStateV658 {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Omit<R71ImageStateV658, "retry">>({
    status: "idle", objectUrl: null, width: null, height: null,
    error: null,
  });
  useEffect(() => {
    if (!row) {
      setState({ status: "idle", objectUrl: null,
        width: null, height: null, error: null });
      return;
    }
    let disposed = false;
    let activeObjectUrl: string | null = null;
    const controller = new AbortController();
    setState({ status: "loading", objectUrl: null,
      width: null, height: null, error: null });
    void loadR71SourceImageV658(row, controller.signal).then((loaded) => {
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
        width: null, height: null, error: reportErrorV658(error) });
    });
    return () => {
      disposed = true;
      controller.abort();
      if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
    };
  }, [row, attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
