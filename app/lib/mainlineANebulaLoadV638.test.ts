import { afterEach, describe, expect, it, vi } from "vitest";
import {
  classifyNebulaLoadErrorV638,
  createNebulaLoadAttemptV638,
  createNebulaLoadDeadlineV638,
  nebulaLoadStatusTextV638,
  nebulaLoadTimeoutV638,
  NebulaLoadErrorV638,
  transitionNebulaLoadAttemptV638,
} from "./mainlineANebulaLoadV638";

const start = "2026-09-27T00:00:00.000Z";
const decodedAt = "2026-09-27T00:00:00.500Z";
const renderedAt = "2026-09-27T00:00:00.700Z";
afterEach(() => vi.useRealTimers());

describe("V638 scene nebula attempt state", () => {
  it("requires decode and a later renderer callback before marking an attempt ready", () => {
    const initial = createNebulaLoadAttemptV638(1, start);
    expect(transitionNebulaLoadAttemptV638(initial, { type: "rendered", attempt: 1, at: renderedAt })).toBe(initial);
    const decoded = transitionNebulaLoadAttemptV638(initial, { type: "decoded", attempt: 1, at: decodedAt });
    expect(decoded).toMatchObject({ status: "decoded", phase: "render", decodedAt, endedAt: null });
    expect(nebulaLoadStatusTextV638(decoded)).toContain("尚未计入运行时就绪");
    const rendered = transitionNebulaLoadAttemptV638(decoded, { type: "rendered", attempt: 1, at: renderedAt });
    expect(rendered).toMatchObject({ status: "ready", decodedAt, renderedAt, endedAt: renderedAt });
    expect(nebulaLoadStatusTextV638(rendered)).toBe("本地观测图已绘制。");
  });

  it("rejects callbacks from older attempts and never revives a cancelled result", () => {
    const initial = createNebulaLoadAttemptV638(2, start);
    expect(initial.retryCount).toBe(1);
    expect(transitionNebulaLoadAttemptV638(initial, { type: "decoded", attempt: 1, at: decodedAt })).toBe(initial);
    const cancelled = transitionNebulaLoadAttemptV638(initial, { type: "cancelled", attempt: 2, at: decodedAt });
    expect(cancelled).toMatchObject({ status: "cancelled", endedAt: decodedAt, errorCode: "cancelled" });
    expect(transitionNebulaLoadAttemptV638(cancelled, { type: "decoded", attempt: 2, at: renderedAt })).toBe(cancelled);
    expect(transitionNebulaLoadAttemptV638(cancelled, { type: "rendered", attempt: 2, at: renderedAt })).toBe(cancelled);
  });

  it("invalidates rendered state without repeating decode and rejects stale redraw times", () => {
    const decoded = transitionNebulaLoadAttemptV638(createNebulaLoadAttemptV638(1, start), { type: "decoded", attempt: 1, at: decodedAt });
    const ready = transitionNebulaLoadAttemptV638(decoded, { type: "rendered", attempt: 1, at: renderedAt });
    const hiddenAt = "2026-09-27T00:00:00.800Z";
    const invalidated = transitionNebulaLoadAttemptV638(ready, { type: "render-invalidated", attempt: 1, at: hiddenAt });
    expect(invalidated).toMatchObject({ status: "decoded", decodedAt, renderedAt: null, endedAt: null, renderInvalidatedAt: hiddenAt });
    expect(transitionNebulaLoadAttemptV638(invalidated, { type: "rendered", attempt: 1, at: renderedAt })).toBe(invalidated);
    expect(transitionNebulaLoadAttemptV638(invalidated, { type: "rendered", attempt: 2, at: hiddenAt })).toBe(invalidated);
    const redrawn = transitionNebulaLoadAttemptV638(invalidated, { type: "rendered", attempt: 1, at: "2026-09-27T00:00:00.900Z" });
    expect(redrawn.status).toBe("ready");
    expect(redrawn.decodedAt).toBe(decodedAt);
    expect(redrawn.renderedAt).toBe("2026-09-27T00:00:00.900Z");
  });

  it("does not reopen failed or cancelled attempts with visibility changes", () => {
    const initial = createNebulaLoadAttemptV638(1, start);
    const failed = transitionNebulaLoadAttemptV638(initial, { type: "failed", attempt: 1, at: decodedAt,
      error: new NebulaLoadErrorV638("http", "request", "http:404", 404) });
    const cancelled = transitionNebulaLoadAttemptV638(initial, { type: "cancelled", attempt: 1, at: decodedAt });
    for (const state of [initial, failed, cancelled]) {
      expect(transitionNebulaLoadAttemptV638(state, { type: "render-invalidated", attempt: 1, at: renderedAt })).toBe(state);
    }
  });

  it("keeps failure classification, HTTP status and timeout distinct", () => {
    const initial = createNebulaLoadAttemptV638(1, start, 6000);
    const http = transitionNebulaLoadAttemptV638(initial, {
      type: "failed", attempt: 1, at: decodedAt,
      error: new NebulaLoadErrorV638("http", "request", "http:404", 404),
    });
    expect(http).toMatchObject({ status: "failed", httpStatus: 404, errorCode: "http", endedAt: decodedAt });
    expect(nebulaLoadStatusTextV638(http)).toContain("HTTP 404");
    const timedOut = transitionNebulaLoadAttemptV638(initial, {
      type: "failed", attempt: 1, at: decodedAt,
      error: new NebulaLoadErrorV638("timeout", "decode", "timeout"),
    });
    expect(nebulaLoadStatusTextV638(timedOut)).toContain("超过 6 秒");
    expect(timedOut).toMatchObject({ phase: "decode", httpStatus: null });
  });

  it("ignores invalid or backwards event times", () => {
    const initial = createNebulaLoadAttemptV638(1, start);
    expect(transitionNebulaLoadAttemptV638(initial, { type: "decoded", attempt: 1, at: "bad" })).toBe(initial);
    expect(transitionNebulaLoadAttemptV638(initial, { type: "decoded", attempt: 1, at: "2020-01-01" })).toBe(initial);
    const decoded = transitionNebulaLoadAttemptV638(initial, { type: "decoded", attempt: 1, at: decodedAt });
    expect(transitionNebulaLoadAttemptV638(decoded, { type: "rendered", attempt: 1, at: start })).toBe(decoded);
  });

  it("validates attempt numbers and bounded positive timeout values", () => {
    for (const invalid of [0, -1, NaN, Infinity, 1.5]) expect(() => createNebulaLoadAttemptV638(invalid, start)).toThrow();
    expect(() => createNebulaLoadAttemptV638(1, "invalid")).toThrow();
    for (const invalid of [0, -1, NaN, Infinity, 1.5, 120001]) expect(() => nebulaLoadTimeoutV638(invalid)).toThrow();
    expect(nebulaLoadTimeoutV638(undefined)).toBe(15000);
    expect(nebulaLoadTimeoutV638(120000)).toBe(120000);
  });

  it("classifies cancellation separately from network and decoder failures", () => {
    expect(classifyNebulaLoadErrorV638(new DOMException("cancel", "AbortError"), "body")).toMatchObject({ code: "cancelled", phase: "body" });
    expect(classifyNebulaLoadErrorV638(new TypeError("failed to fetch"), "request")).toMatchObject({ code: "network" });
    expect(classifyNebulaLoadErrorV638(new Error("bad image"), "decode")).toMatchObject({ code: "decode" });
    const known = new NebulaLoadErrorV638("digest", "verify", "mismatch");
    expect(classifyNebulaLoadErrorV638(known, "request")).toBe(known);
  });
});

describe("V638 total request deadline", () => {
  it("uses one budget across phases instead of granting a fresh budget per await", async () => {
    vi.useFakeTimers();
    const parent = new AbortController();
    const scope = createNebulaLoadDeadlineV638(parent.signal, 100);
    await vi.advanceTimersByTimeAsync(70);
    scope.enter("body");
    const pending = scope.wait(new Promise<never>(() => undefined));
    const rejected = expect(pending).rejects.toMatchObject({ code: "timeout", phase: "body" });
    await vi.advanceTimersByTimeAsync(30);
    await rejected;
    scope.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cleans a resource resolved after cancellation instead of exposing it to the caller", async () => {
    const parent = new AbortController();
    const scope = createNebulaLoadDeadlineV638(parent.signal, 1000);
    let resolve!: (resource: { id: number }) => void;
    const underlying = new Promise<{ id: number }>((accept) => { resolve = accept; });
    const cleanup = vi.fn();
    const result = scope.wait(underlying, cleanup);
    const rejected = expect(result).rejects.toMatchObject({ code: "cancelled" });
    parent.abort();
    await rejected;
    resolve({ id: 1 });
    await Promise.resolve();
    expect(cleanup).toHaveBeenCalledExactlyOnceWith({ id: 1 });
    scope.dispose();
  });

  it("reports late cleanup failures through the established caller error path", async () => {
    const parent = new AbortController();
    const report = vi.fn();
    const scope = createNebulaLoadDeadlineV638(parent.signal, 1000, report);
    let resolve!: (value: number) => void;
    const result = scope.wait(new Promise<number>((accept) => { resolve = accept; }), () => { throw new Error("dispose failed"); });
    const rejected = expect(result).rejects.toMatchObject({ code: "cancelled" });
    parent.abort();
    await rejected;
    resolve(1);
    await Promise.resolve();
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ message: "dispose failed" }));
    scope.dispose();
  });

  it("removes parent listeners and timers when a completed scope is disposed", async () => {
    vi.useFakeTimers();
    const parent = new AbortController();
    const remove = vi.spyOn(parent.signal, "removeEventListener");
    const scope = createNebulaLoadDeadlineV638(parent.signal, 100);
    expect(await scope.wait(Promise.resolve(42))).toBe(42);
    scope.dispose();
    scope.dispose();
    parent.abort();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(scope.signal.aborted).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("checks elapsed wall time after synchronous verification before entering decode", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(start));
    const scope = createNebulaLoadDeadlineV638(new AbortController().signal, 100);
    scope.enter("verify");
    vi.setSystemTime(new Date(Date.parse(start) + 101));
    expect(() => scope.enter("decode")).toThrow(expect.objectContaining({ code: "timeout", phase: "verify" }));
    scope.dispose();
  });
});
