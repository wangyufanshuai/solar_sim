import type { VisualReviewPlanV666 } from
  "./mainlineAR79VisualReviewV666";

export type VisualLoadCodeV666 = "not-eligible" | "route-invalid"
  | "cancelled" | "timeout" | "network" | "http-unavailable"
  | "http-error" | "redirect" | "content-type" | "empty"
  | "too-large" | "byte-length" | "digest" | "artifact-header"
  | "decode" | "dimensions" | "object-url";

export class VisualLoadErrorV666 extends Error {
  readonly code: VisualLoadCodeV666;
  readonly httpStatus: number | null;
  constructor(code: VisualLoadCodeV666, httpStatus: number | null = null) {
    super(`visual-review:${code}${httpStatus === null ? "" : `:${httpStatus}`}`);
    this.name = "VisualLoadErrorV666";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export interface VisualLoadEnvironmentV666 {
  origin: string;
  fetcher?: typeof fetch;
  sha256?: (bytes: ArrayBuffer) => Promise<string>;
  decode?: (blob: Blob) => Promise<{ width: number; height: number }>;
  createObjectUrl?: (blob: Blob) => string;
  revokeObjectUrl?: (url: string) => void;
  timeoutMs?: number;
  maxBytes?: number;
  signal?: AbortSignal;
}

export interface LoadedVisualImageV666 {
  key: string;
  route: string;
  finalUrl: string;
  objectUrl: string;
  sha256: string;
  bytes: number;
  contentType: string;
  width: number;
  height: number;
  httpStatus: 200;
  acquiredAt: string;
  release: () => void;
}

const CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SHA256 = /^[a-f0-9]{64}$/;
const DEFAULT_TIMEOUT_MS = 18_000;
const DEFAULT_MAX_BYTES = 32 * 1024 * 1024;

function requestUrlV666(route: string, origin: string): URL {
  if (!route.startsWith("/") || route.startsWith("//")
    || route.includes("\\") || route.includes("..")
    || route.includes("?") || route.includes("#")
    || /[\u0000-\u001f]/.test(route)) {
    throw new VisualLoadErrorV666("route-invalid");
  }
  let base: URL;
  try { base = new URL(origin); }
  catch { throw new VisualLoadErrorV666("route-invalid"); }
  if (!(["http:", "https:"].includes(base.protocol))
    || base.pathname !== "/" || base.search || base.hash
    || base.username || base.password) {
    throw new VisualLoadErrorV666("route-invalid");
  }
  const url = new URL(route, base);
  if (url.origin !== base.origin || url.pathname !== route) {
    throw new VisualLoadErrorV666("route-invalid");
  }
  return url;
}

async function digestBytesV666(bytes: ArrayBuffer): Promise<string> {
  const result = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(result)]
    .map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function decodeImageV666(blob: Blob): Promise<{
  width: number; height: number;
}> {
  const bitmap = await createImageBitmap(blob);
  try { return { width: bitmap.width, height: bitmap.height }; }
  finally { bitmap.close(); }
}

function normalizedContentType(value: string | null): string {
  return (value ?? "").split(";", 1)[0].trim().toLowerCase();
}

export function visualLoadErrorV666(error: unknown,
  signal?: AbortSignal): VisualLoadErrorV666 {
  if (error instanceof VisualLoadErrorV666) return error;
  if (signal?.aborted) return new VisualLoadErrorV666("cancelled");
  if (error instanceof DOMException && error.name === "AbortError") {
    return new VisualLoadErrorV666("cancelled");
  }
  return new VisualLoadErrorV666("network");
}

export function visualLoadMessageV666(code: VisualLoadCodeV666): string {
  if (code === "not-eligible") return "该对象没有允许请求的本机候选图。";
  if (code === "route-invalid") return "图片路径不在本机审查允许范围。";
  if (code === "cancelled") return "读取已取消，图片资源已释放。";
  if (code === "timeout") return "本机图片读取超时；可手动重试。";
  if (code === "http-unavailable") {
    return "本机候选图接口未开放或文件不可用，保持 hold。";
  }
  if (code === "http-error" || code === "network") {
    return "本机图片读取失败，保持 hold；可手动重试。";
  }
  if (code === "redirect") return "图片请求发生跳转，已拒绝展示。";
  if (code === "content-type") return "响应并非允许的图片类型。";
  if (code === "empty") return "图片响应为空。";
  if (code === "too-large") return "图片超出本机审查大小上限。";
  if (code === "byte-length") return "图片字节数与交付记录不一致。";
  if (code === "digest" || code === "artifact-header") {
    return "图片 SHA-256 与候选记录不一致，已拒绝展示。";
  }
  if (code === "decode") return "图片无法解码，已拒绝展示。";
  if (code === "dimensions") return "图片尺寸与候选记录不一致。";
  return "图片资源创建失败，已拒绝展示。";
}

export function formatVisualBytesV666(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "未知大小";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

export async function loadVisualImageV666(
  plan: VisualReviewPlanV666,
  environment: VisualLoadEnvironmentV666,
): Promise<LoadedVisualImageV666> {
  if (!plan.requestAllowed || !plan.route || !plan.expectedSha256
    || plan.candidateOnly !== true || plan.hold !== true
    || plan.notAdmitted !== true
    || plan.scientificPayloadWriteback !== false
    || plan.rights !== "pending") {
    throw new VisualLoadErrorV666("not-eligible");
  }
  if (!SHA256.test(plan.expectedSha256)) {
    throw new VisualLoadErrorV666("digest");
  }
  const url = requestUrlV666(plan.route, environment.origin);
  const fetcher = environment.fetcher ?? fetch;
  const maxBytes = environment.maxBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = environment.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0
    || maxBytes > DEFAULT_MAX_BYTES || !Number.isSafeInteger(timeoutMs)
    || timeoutMs < 100 || timeoutMs > 60_000) {
    throw new VisualLoadErrorV666("route-invalid");
  }
  const controller = new AbortController();
  const cancel = () => controller.abort("parent-cancelled");
  if (environment.signal?.aborted) cancel();
  else environment.signal?.addEventListener("abort", cancel, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort("timeout");
  }, timeoutMs);
  try {
    if (controller.signal.aborted) {
      throw new VisualLoadErrorV666("cancelled");
    }
    let response: Response;
    try {
      response = await fetcher(url.href, {
        method: "GET", cache: "no-store", redirect: "error",
        credentials: "same-origin", signal: controller.signal,
        headers: { Accept: "image/avif,image/webp,image/png,image/jpeg",
          "X-Mainline-A-R79-Visual-Inspect": "manual" },
      });
    } catch (error) {
      if (timedOut) throw new VisualLoadErrorV666("timeout");
      if (controller.signal.aborted) {
        throw new VisualLoadErrorV666("cancelled");
      }
      throw visualLoadErrorV666(error);
    }
    if (response.status === 404 || response.status === 403) {
      throw new VisualLoadErrorV666("http-unavailable", response.status);
    }
    if (response.status !== 200) {
      throw new VisualLoadErrorV666("http-error", response.status);
    }
    if (response.url !== url.href) {
      throw new VisualLoadErrorV666("redirect", response.status);
    }
    const contentType = normalizedContentType(
      response.headers.get("content-type"));
    if (!CONTENT_TYPES.has(contentType)
      || (plan.expectedMimeType && contentType !== plan.expectedMimeType)) {
      throw new VisualLoadErrorV666("content-type", response.status);
    }
    const lengthHeader = response.headers.get("content-length");
    const declaredLength = lengthHeader === null
      ? null : Number(lengthHeader);
    if (declaredLength !== null && (!Number.isSafeInteger(declaredLength)
      || declaredLength <= 0 || declaredLength > maxBytes)) {
      throw new VisualLoadErrorV666("too-large", response.status);
    }
    let bytes: ArrayBuffer;
    try { bytes = await response.arrayBuffer(); }
    catch (error) {
      if (timedOut) throw new VisualLoadErrorV666("timeout");
      throw visualLoadErrorV666(error, controller.signal);
    }
    if (controller.signal.aborted) {
      throw new VisualLoadErrorV666(timedOut ? "timeout" : "cancelled");
    }
    if (bytes.byteLength === 0) {
      throw new VisualLoadErrorV666("empty", response.status);
    }
    if (bytes.byteLength > maxBytes) {
      throw new VisualLoadErrorV666("too-large", response.status);
    }
    if (declaredLength !== null && declaredLength !== bytes.byteLength) {
      throw new VisualLoadErrorV666("byte-length", response.status);
    }
    if (plan.expectedBytes !== null
      && plan.expectedBytes !== bytes.byteLength) {
      throw new VisualLoadErrorV666("byte-length", response.status);
    }
    const digest = await (environment.sha256 ?? digestBytesV666)(bytes);
    if (digest !== plan.expectedSha256) {
      throw new VisualLoadErrorV666("digest", response.status);
    }
    const artifactHeader = response.headers.get("x-artifact-sha256");
    if (artifactHeader && artifactHeader !== digest) {
      throw new VisualLoadErrorV666("artifact-header", response.status);
    }
    const blob = new Blob([bytes], { type: contentType });
    let dimensions: { width: number; height: number };
    try {
      dimensions = await (environment.decode ?? decodeImageV666)(blob);
    } catch {
      throw new VisualLoadErrorV666("decode", response.status);
    }
    if (!Number.isSafeInteger(dimensions.width)
      || !Number.isSafeInteger(dimensions.height)
      || dimensions.width <= 0 || dimensions.height <= 0
      || dimensions.width > 32768 || dimensions.height > 32768
      || (plan.expectedWidth !== null
        && plan.expectedWidth !== dimensions.width)
      || (plan.expectedHeight !== null
        && plan.expectedHeight !== dimensions.height)) {
      throw new VisualLoadErrorV666("dimensions", response.status);
    }
    if (controller.signal.aborted) {
      throw new VisualLoadErrorV666(timedOut ? "timeout" : "cancelled");
    }
    let objectUrl: string;
    try {
      objectUrl = (environment.createObjectUrl ?? URL.createObjectURL)(blob);
    } catch {
      throw new VisualLoadErrorV666("object-url", response.status);
    }
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      (environment.revokeObjectUrl ?? URL.revokeObjectURL)(objectUrl);
    };
    return { key: plan.key, route: plan.route,
      finalUrl: response.url, objectUrl, sha256: digest,
      bytes: bytes.byteLength, contentType,
      width: dimensions.width, height: dimensions.height,
      httpStatus: 200, acquiredAt: new Date().toISOString(), release };
  } finally {
    clearTimeout(timer);
    environment.signal?.removeEventListener("abort", cancel);
  }
}
