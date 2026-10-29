"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  CandidateReviewPinV655, CandidateReviewRowV655,
  CandidateReviewVariantV655,
} from "./mainlineANebulaReviewAssetV655";

export type ReviewImageStateV655 = Readonly<{
  requestKey: string;
  status: "idle" | "loading" | "loaded" | "failed";
  objectUrl: string | null;
  width: number | null;
  height: number | null;
  error: "http" | "boundary" | "bytes" | "sha"
    | "decode" | "network" | null;
}>;

function pinFor(row: CandidateReviewRowV655,
  variant: CandidateReviewVariantV655): CandidateReviewPinV655 {
  return variant === "raw" ? row.candidateRaw : row.preview[variant];
}

function expectedMime(variant: CandidateReviewVariantV655) {
  return variant === "raw" ? "image/jpeg" : "image/webp";
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function classifyReviewImageFailureV655(error: unknown):
  ReviewImageStateV655["error"] {
  if (error instanceof DOMException && error.name === "AbortError") return null;
  if (error instanceof Error && ["http", "boundary", "bytes",
    "sha", "decode"].includes(error.message)) {
    return error.message as ReviewImageStateV655["error"];
  }
  return "network";
}

export function reviewImageEndpointV655(id: string,
  variant: CandidateReviewVariantV655): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)
    || !["thumb", "detail", "raw"].includes(variant)) {
    throw new Error("review-image-endpoint-invalid");
  }
  return `/api/atlas/mainline-a-nebula-review/${id}/${variant}`;
}

export async function retrieveReviewImageV655(row: CandidateReviewRowV655,
  variant: CandidateReviewVariantV655, signal: AbortSignal,
  fetcher: typeof fetch = fetch): Promise<{
    buffer: ArrayBuffer; width: number; height: number;
    mimeType: string;
  }> {
  const pin = pinFor(row, variant);
  const mime = expectedMime(variant);
  const response = await fetcher(reviewImageEndpointV655(row.id, variant), {
    signal, cache: "no-store", credentials: "same-origin",
  });
  if (!response.ok || response.redirected) throw new Error("http");
  if (response.headers.get("x-mainline-a-review-only")
      !== "candidate-hold"
    || response.headers.get("x-mainline-a-rights") !== "pending"
    || response.headers.get("x-scientific-payload-writeback") !== "false"
    || response.headers.get("content-type") !== mime) {
    throw new Error("boundary");
  }
  if (response.headers.get("x-artifact-sha256") !== pin.sha256
    || response.headers.get("x-candidate-raw-sha256")
      !== row.candidateRaw.sha256) {
    throw new Error("sha");
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength !== pin.bytes
    || Number(response.headers.get("content-length")) !== pin.bytes) {
    throw new Error("bytes");
  }
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  if (hex(new Uint8Array(digest)) !== pin.sha256) throw new Error("sha");
  return { buffer, width: pin.width ?? row.originalWidth,
    height: pin.height ?? row.originalHeight,
    mimeType: mime };
}

function initial(key: string): ReviewImageStateV655 {
  return { requestKey: key, status: "idle",
    objectUrl: null, width: null, height: null, error: null };
}

export function useMainlineANebulaReviewImageV655(
  row: CandidateReviewRowV655,
  variant: CandidateReviewVariantV655,
  enabled = true,
) {
  const [retryIndex, setRetryIndex] = useState(0);
  const key = `${row.id}:${variant}:${retryIndex}`;
  const [stored, setStored] = useState<ReviewImageStateV655>(() => initial(key));
  const retry = useCallback(() => setRetryIndex((value) => value + 1), []);
  const visible = stored.requestKey === key ? stored : initial(key);

  useEffect(() => {
    if (!enabled) {
      setStored(initial(key));
      return;
    }
    const controller = new AbortController();
    let released = false;
    let objectUrl: string | null = null;
    setStored({ requestKey: key, status: "loading",
      objectUrl: null, width: null, height: null, error: null });
    const load = async () => {
      try {
        const result = await retrieveReviewImageV655(row, variant,
          controller.signal);
        if (released || controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(new Blob([result.buffer], {
          type: result.mimeType,
        }));
        const image = new Image();
        image.src = objectUrl;
        try { await image.decode(); }
        catch { throw new Error("decode"); }
        if (released || controller.signal.aborted) return;
        if (image.naturalWidth !== result.width
          || image.naturalHeight !== result.height) {
          throw new Error("decode");
        }
        setStored({ requestKey: key, status: "loaded",
          objectUrl, width: image.naturalWidth,
          height: image.naturalHeight, error: null });
      } catch (error) {
        if (released || controller.signal.aborted) return;
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
        setStored({ requestKey: key, status: "failed",
          objectUrl: null, width: null, height: null,
          error: classifyReviewImageFailureV655(error) });
      }
    };
    void load();
    return () => {
      released = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [enabled, key, row, variant]);

  return { ...visible, retry } as const;
}
