"use client";

import { useEffect, useState } from "react";
import { inspectWebSkyAtlasV656,
  type WebSkyAtlasPackV656,
} from "./mainlineAWebSkyV656";

export type WebSkyLoadFailureV656 = "http" | "type" | "bytes"
  | "sha" | "parse" | "boundary" | "timeout" | "network";
export type WebSkyLoadStateV656 = Readonly<{
  status: "loading" | "ready" | "failed";
  pack: WebSkyAtlasPackV656 | null;
  error: WebSkyLoadFailureV656 | null;
  sha256: string | null;
  bytes: number;
}>;

const ENDPOINT = "/api/atlas/mainline-a-web-sky";
const SHA = /^[a-f0-9]{64}$/;
const MAX_BYTES = 200_000;
const initialState: WebSkyLoadStateV656 = {
  status: "loading", pack: null, error: null, sha256: null, bytes: 0,
};

export class WebSkyLoadErrorV656 extends Error {
  constructor(readonly category: WebSkyLoadFailureV656) {
    super(`web-sky-v656:${category}`);
  }
}

function errorV656(category: WebSkyLoadFailureV656): never {
  throw new WebSkyLoadErrorV656(category);
}

export async function verifyWebSkyResponseV656(response: Response): Promise<{
  pack: WebSkyAtlasPackV656; sha256: string; bytes: number;
}> {
  if (!response.ok) errorV656("http");
  if (!response.headers.get("content-type")?.startsWith("application/json")) {
    errorV656("type");
  }
  if (response.headers.get("x-mainline-a-candidate-only") !== "true"
    || response.headers.get("x-mainline-a-admission") !== "hold"
    || response.headers.get("x-scientific-payload-writeback") !== "false"
    || !response.headers.get("cache-control")?.includes("no-store")) {
    errorV656("boundary");
  }
  const expectedSha = response.headers.get("x-artifact-sha256");
  if (!expectedSha || !SHA.test(expectedSha)) errorV656("sha");
  const expectedLength = Number(response.headers.get("content-length"));
  if (!Number.isInteger(expectedLength) || expectedLength < 100
    || expectedLength > MAX_BYTES) errorV656("bytes");
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== expectedLength) errorV656("bytes");
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const sha256 = Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0")).join("");
  if (sha256 !== expectedSha) errorV656("sha");
  let parsed: WebSkyAtlasPackV656;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true })
      .decode(bytes)) as WebSkyAtlasPackV656;
  } catch {
    errorV656("parse");
  }
  if (!inspectWebSkyAtlasV656(parsed).ok) errorV656("boundary");
  return { pack: parsed, sha256, bytes: bytes.byteLength };
}

function classifyLoadErrorV656(error: unknown): WebSkyLoadFailureV656 {
  if (error instanceof WebSkyLoadErrorV656) return error.category;
  if (error instanceof DOMException && error.name === "TimeoutError") return "timeout";
  return "network";
}

export function useMainlineAWebSkyV656() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<WebSkyLoadStateV656>(initialState);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(
      new DOMException("Web sky request timed out", "TimeoutError")), 15_000);
    setState(initialState);
    async function load() {
      try {
        const response = await fetch(ENDPOINT, {
          signal: controller.signal,
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const verified = await verifyWebSkyResponseV656(response);
        if (active) setState({ status: "ready", pack: verified.pack,
          error: null, sha256: verified.sha256, bytes: verified.bytes });
      } catch (error) {
        if (active) setState({ status: "failed", pack: null,
          error: classifyLoadErrorV656(error), sha256: null, bytes: 0 });
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1),
    attempts: attempt + 1 };
}
