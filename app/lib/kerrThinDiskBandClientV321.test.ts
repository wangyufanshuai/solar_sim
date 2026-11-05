import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  acquireKerrThinDiskBandViewV321,
  resetKerrThinDiskBandClientV321ForTests,
} from "./kerrThinDiskBandClientV321";

const view = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json"), "utf8")).view;

afterEach(() => {
  resetKerrThinDiskBandClientV321ForTests();
  vi.unstubAllGlobals();
});

describe("v321 fixed-band runtime client", () => {
  it("single-flights the intent-only artifact and releases its tracked cache", async () => {
    const baseline = getAtlasResourceSnapshot();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(view), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const first = await acquireKerrThinDiskBandViewV321();
    const second = await acquireKerrThinDiskBandViewV321();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.view).toBe(second.view);
    expect(first.artifactSha256).toBe("e2bd5957a1dd53a0942d5f7cd519d7b1dd84af1db7f476eb0f9dda0a65c5a460");
    expect(getAtlasResourceSnapshot().typedArrayCaches).toBe(baseline.typedArrayCaches + 1);
    first.release();
    expect(getAtlasResourceSnapshot().typedArrayCaches).toBe(baseline.typedArrayCaches + 1);
    second.release();
    expect(getAtlasResourceSnapshot()).toMatchObject({ total: baseline.total, typedArrayCaches: baseline.typedArrayCaches, estimatedBytes: baseline.estimatedBytes });
  });

  it("aborts a sole pending load without consuming a later recovery", async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal("fetch", vi.fn((_: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      if (init?.signal) {
        signals.push(init.signal);
        init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
      }
    })));
    const controller = new AbortController();
    const cancelled = acquireKerrThinDiskBandViewV321(controller.signal);
    controller.abort();
    await expect(cancelled).rejects.toMatchObject({ name: "AbortError" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(signals).toHaveLength(1);
    expect(signals[0].aborted).toBe(true);
  });
});
