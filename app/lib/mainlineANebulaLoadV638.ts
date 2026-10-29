export const MAINLINE_A_NEBULA_LOAD_TIMEOUT_MS_V638 = 15000;
export type NebulaLoadPhaseV638 = "request" | "body" | "verify" | "decode" | "render";
export type NebulaLoadErrorCodeV638 = "asset" | "http" | "network" | "timeout" | "cancelled" | "byte-size" | "digest" | "dimensions" | "decode";

export class NebulaLoadErrorV638 extends Error {
  readonly code: NebulaLoadErrorCodeV638;
  readonly phase: NebulaLoadPhaseV638;
  readonly httpStatus: number | null;

  constructor(code: NebulaLoadErrorCodeV638, phase: NebulaLoadPhaseV638, message: string, httpStatus: number | null = null) {
    super(message);
    this.name = code === "timeout" ? "TimeoutError" : code === "cancelled" ? "AbortError" : "NebulaLoadError";
    this.code = code;
    this.phase = phase;
    this.httpStatus = httpStatus;
  }
}

export function nebulaLoadTimeoutV638(value: number | undefined): number {
  const timeoutMs = value ?? MAINLINE_A_NEBULA_LOAD_TIMEOUT_MS_V638;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw new RangeError("nebula-load-timeout-out-of-range");
  return timeoutMs;
}

export function classifyNebulaLoadErrorV638(error: unknown, phase: NebulaLoadPhaseV638): NebulaLoadErrorV638 {
  if (error instanceof NebulaLoadErrorV638) return error;
  if (error instanceof Error && error.name === "AbortError") {
    return new NebulaLoadErrorV638("cancelled", phase, "v638-nebula-load-cancelled");
  }
  return new NebulaLoadErrorV638(phase === "decode" ? "decode" : "network", phase,
    phase === "decode" ? "v607-nebula-scene-decode-failed" : "v638-nebula-load-network-failed");
}

/** One deadline spans the request, response body, verification and decode. */
export function createNebulaLoadDeadlineV638(
  parent: AbortSignal,
  timeoutMs: number,
  onLateCleanupError: (error: unknown) => void = () => undefined,
) {
  const duration = nebulaLoadTimeoutV638(timeoutMs);
  const controller = new AbortController();
  const deadlineAt = Date.now() + duration;
  let phase: NebulaLoadPhaseV638 = "request";
  let disposed = false;
  const abortFromParent = () => controller.abort(new NebulaLoadErrorV638("cancelled", phase, "v638-nebula-load-cancelled"));
  parent.addEventListener("abort", abortFromParent, { once: true });
  if (parent.aborted) abortFromParent();
  const timer = setTimeout(() => {
    controller.abort(new NebulaLoadErrorV638("timeout", phase, `v638-nebula-load-timeout:${duration}`));
  }, duration);
  const reason = (): NebulaLoadErrorV638 => classifyNebulaLoadErrorV638(controller.signal.reason, phase);
  const late = <T>(callback: ((value: T) => void) | undefined, value: T) => {
    try { callback?.(value); }
    catch (error) { onLateCleanupError(error); }
  };
  return {
    signal: controller.signal,
    get phase() { return phase; },
    enter(next: NebulaLoadPhaseV638): void {
      if (!controller.signal.aborted && Date.now() >= deadlineAt) {
        controller.abort(new NebulaLoadErrorV638("timeout", phase, `v638-nebula-load-timeout:${duration}`));
      }
      controller.signal.throwIfAborted();
      phase = next;
    },
    wait<T>(promise: Promise<T>, onLateResolve?: (value: T) => void): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        let settled = false;
        const abort = () => {
          if (settled) return;
          settled = true;
          controller.signal.removeEventListener("abort", abort);
          reject(reason());
        };
        controller.signal.addEventListener("abort", abort, { once: true });
        if (controller.signal.aborted) abort();
        promise.then((value) => {
          if (settled) { late(onLateResolve, value); return; }
          settled = true;
          controller.signal.removeEventListener("abort", abort);
          resolve(value);
        }, (error: unknown) => {
          if (settled) return;
          settled = true;
          controller.signal.removeEventListener("abort", abort);
          reject(controller.signal.aborted ? reason() : error);
        });
      });
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      clearTimeout(timer);
      parent.removeEventListener("abort", abortFromParent);
    },
  };
}

export type NebulaLoadAttemptV638 = Readonly<{
  attempt: number;
  retryCount: number;
  status: "loading" | "decoded" | "ready" | "failed" | "cancelled";
  phase: NebulaLoadPhaseV638;
  startedAt: string;
  decodedAt: string | null;
  renderedAt: string | null;
  renderInvalidatedAt: string | null;
  endedAt: string | null;
  timeoutMs: number;
  errorCode: NebulaLoadErrorCodeV638 | null;
  httpStatus: number | null;
}>;

export type NebulaLoadEventV638 =
  | { type: "phase"; attempt: number; phase: NebulaLoadPhaseV638 }
  | { type: "decoded" | "rendered" | "render-invalidated" | "cancelled"; attempt: number; at: string }
  | { type: "failed"; attempt: number; at: string; error: NebulaLoadErrorV638 };

export function createNebulaLoadAttemptV638(attempt: number, startedAt: string, timeoutMs = MAINLINE_A_NEBULA_LOAD_TIMEOUT_MS_V638): NebulaLoadAttemptV638 {
  if (!Number.isSafeInteger(attempt) || attempt < 1) throw new RangeError("nebula-load-attempt-invalid");
  if (!Number.isFinite(Date.parse(startedAt))) throw new RangeError("nebula-load-start-invalid");
  return {
    attempt, retryCount: attempt - 1, status: "loading", phase: "request", startedAt,
    decodedAt: null, renderedAt: null, renderInvalidatedAt: null, endedAt: null, timeoutMs: nebulaLoadTimeoutV638(timeoutMs),
    errorCode: null, httpStatus: null,
  };
}

export function transitionNebulaLoadAttemptV638(state: NebulaLoadAttemptV638, event: NebulaLoadEventV638): NebulaLoadAttemptV638 {
  if (event.attempt !== state.attempt) return state;
  if (event.type === "render-invalidated") {
    if (state.status !== "ready" || !state.renderedAt || !Number.isFinite(Date.parse(event.at))
      || Date.parse(event.at) < Date.parse(state.renderedAt)) return state;
    return { ...state, status: "decoded", phase: "render", renderedAt: null, endedAt: null, renderInvalidatedAt: event.at };
  }
  if (state.endedAt !== null) return state;
  if (event.type === "phase") return state.status === "loading" ? { ...state, phase: event.phase } : state;
  if (!Number.isFinite(Date.parse(event.at)) || Date.parse(event.at) < Date.parse(state.startedAt)) return state;
  if (event.type === "decoded") {
    return state.status === "loading" ? { ...state, status: "decoded", phase: "render", decodedAt: event.at } : state;
  }
  if (event.type === "rendered") {
    if (state.status !== "decoded" || !state.decodedAt || Date.parse(event.at) < Date.parse(state.decodedAt)) return state;
    if (state.renderInvalidatedAt && Date.parse(event.at) < Date.parse(state.renderInvalidatedAt)) return state;
    return { ...state, status: "ready", renderedAt: event.at, endedAt: event.at };
  }
  if (event.type === "cancelled") return { ...state, status: "cancelled", errorCode: "cancelled", endedAt: event.at };
  if (event.type !== "failed") return state;
  return { ...state, status: event.error.code === "cancelled" ? "cancelled" : "failed",
    phase: event.error.phase, errorCode: event.error.code, httpStatus: event.error.httpStatus, endedAt: event.at };
}

export function nebulaLoadStatusTextV638(state: NebulaLoadAttemptV638): string {
  if (state.status === "ready") return "本地观测图已绘制。";
  if (state.status === "decoded") return "纹理已解码，等待场景绘制；尚未计入运行时就绪。";
  if (state.status === "cancelled") return "本次加载已取消，可重新加载。";
  if (state.status === "loading") {
    const phases: Record<NebulaLoadPhaseV638, string> = {
      request: "正在请求本地观测图…", body: "正在读取本地观测图…", verify: "正在校验图像字节与哈希…",
      decode: "正在解码观测图…", render: "等待场景绘制…",
    };
    return phases[state.phase];
  }
  const failures: Record<NebulaLoadErrorCodeV638, string> = {
    asset: "图像来源或资产记录不符合当前 A 线要求。",
    http: `本地观测图请求失败${state.httpStatus === null ? "" : `（HTTP ${state.httpStatus}）`}。`,
    network: "本地观测图连接或读取失败。",
    timeout: `本次加载超过 ${state.timeoutMs / 1000} 秒，已停止请求。`,
    cancelled: "本次加载已取消。",
    "byte-size": "文件字节数与来源记录不一致，已停止加载。",
    digest: "文件 SHA-256 与来源记录不一致，已停止加载。",
    dimensions: "解码尺寸与来源记录不一致，已停止加载。",
    decode: "浏览器未能解码这张观测图。",
  };
  return failures[state.errorCode ?? "network"];
}
