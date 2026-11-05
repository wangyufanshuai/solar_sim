import { describe, expect, it, vi } from "vitest";
import { createAtlasGpuTimerM5, readAtlasWebglRasterMetricsM5 } from "./atlasWebglContextMetricsM5";

function fixture() {
  let lost = false; let generation = 0; let id = 0;
  let supported = true; let available = true; let disjoint = false;
  const events = new EventTarget();
  type Query = { generation: number; id: number };
  const check = (query: Query) => { if (lost || query.generation !== generation) throw new Error("object does not belong to this context"); };
  const context = {
    VIEWPORT: 1, SCISSOR_BOX: 2, QUERY_RESULT_AVAILABLE: 3, QUERY_RESULT: 4,
    drawingBufferWidth: 1280, drawingBufferHeight: 720,
    isContextLost: () => lost,
    getExtension: vi.fn(() => supported ? { TIME_ELAPSED_EXT: 5, GPU_DISJOINT_EXT: 6 } : null),
    getParameter: vi.fn((parameter: number) => {
      if (lost) return null;
      return parameter === 6 ? disjoint : new Int32Array([0, 0, 1280, 720]);
    }),
    createQuery: vi.fn(() => { if (lost) throw new Error("create while lost"); return { generation, id: ++id }; }),
    beginQuery: vi.fn((_target: number, query: Query) => check(query)),
    endQuery: vi.fn(() => { if (lost) throw new Error("end while lost"); }),
    getQueryParameter: vi.fn((query: Query, parameter: number) => { check(query); return parameter === 3 ? available : 2_000_000; }),
    deleteQuery: vi.fn((query: Query) => check(query)),
  };
  const hooks = { sample: vi.fn(), reset: vi.fn(), status: vi.fn() };
  return { context: context as unknown as WebGL2RenderingContext, calls: context, hooks, events,
    lose(dispatch = true) { lost = true; if (dispatch) events.dispatchEvent(new Event("webglcontextlost")); },
    restore() { lost = false; generation++; events.dispatchEvent(new Event("webglcontextrestored")); },
    supported(value: boolean) { supported = value; }, available(value: boolean) { available = value; }, disjoint(value: boolean) { disjoint = value; },
  };
}

describe("M5 lost context metrics", () => {
  it("does not read raster parameters or pretend zero measurements while lost", () => {
    const test = fixture(); test.lose();
    expect(readAtlasWebglRasterMetricsM5(test.context)).toEqual({ status: "context-lost", viewport: "unavailable", scissor: "unavailable", drawingBuffer: "unavailable" });
    expect(test.calls.getParameter).not.toHaveBeenCalled();
    test.restore();
    expect(readAtlasWebglRasterMetricsM5(test.context)).toEqual({ status: "ready", viewport: "0,0,1280,720", scissor: "0,0,1280,720", drawingBuffer: "1280x720" });
  });
  it("treats null or malformed raster reads as unavailable instead of throwing", () => {
    const test = fixture(); test.calls.getParameter.mockReturnValue(null);
    expect(readAtlasWebglRasterMetricsM5(test.context).status).toBe("unavailable");
  });
});

describe("M5 GPU timer context generation", () => {
  it("drops pending old query handles and gets a fresh extension after restoration", () => {
    const test = fixture(); test.available(false);
    const timer = createAtlasGpuTimerM5(test.context, test.events, test.hooks);
    timer.before(); timer.after();
    test.lose(); timer.before(); timer.after();
    expect(test.hooks.status).toHaveBeenLastCalledWith("context-lost");
    expect(test.calls.getQueryParameter).not.toHaveBeenCalled();
    expect(test.calls.deleteQuery).not.toHaveBeenCalled();
    test.restore(); test.available(true);
    timer.before(); timer.after(); timer.before();
    expect(test.calls.getExtension).toHaveBeenCalledTimes(2);
    expect(test.hooks.sample).toHaveBeenCalledExactlyOnceWith(2);
    expect(test.hooks.reset).toHaveBeenCalledTimes(2);
    expect(test.calls.getQueryParameter.mock.calls.every(([query]) => (query as unknown as { generation: number }).generation === 1)).toBe(true);
    timer.dispose();
  });
  it("abandons an active query without endQuery or deleteQuery after loss", () => {
    const test = fixture(); const timer = createAtlasGpuTimerM5(test.context, test.events, test.hooks);
    timer.before(); test.lose(); timer.after(); timer.dispose(); timer.dispose();
    expect(test.calls.endQuery).not.toHaveBeenCalled(); expect(test.calls.deleteQuery).not.toHaveBeenCalled();
    expect(test.hooks.status).toHaveBeenLastCalledWith("released");
    test.restore(); timer.before(); timer.after();
    expect(test.calls.getExtension).toHaveBeenCalledTimes(1);
  });
  it("detects loss before the DOM event is delivered and never polls stale queries", () => {
    const test = fixture(); const timer = createAtlasGpuTimerM5(test.context, test.events, test.hooks);
    timer.before(); timer.after(); test.lose(false); timer.before();
    expect(test.calls.getQueryParameter).not.toHaveBeenCalled();
    expect(test.hooks.status).toHaveBeenLastCalledWith("context-lost");
    test.restore(); timer.before(); timer.after(); timer.before();
    expect(test.hooks.sample).toHaveBeenCalledExactlyOnceWith(2); timer.dispose();
  });
  it("handles missing timer support and rechecks support on restoration", () => {
    const test = fixture(); test.supported(false);
    const timer = createAtlasGpuTimerM5(test.context, test.events, test.hooks);
    timer.before(); timer.after(); expect(test.calls.createQuery).not.toHaveBeenCalled();
    expect(test.hooks.status).toHaveBeenLastCalledWith("unavailable-no-disjoint-query");
    test.lose(); test.supported(true); test.restore(); timer.before();
    expect(test.calls.createQuery).toHaveBeenCalledOnce(); timer.dispose();
  });
  it("deletes only live-generation handles on ordinary cleanup and rejects disjoint samples", () => {
    const test = fixture(); test.disjoint(true);
    const timer = createAtlasGpuTimerM5(test.context, test.events, test.hooks);
    timer.before(); timer.after(); timer.before();
    expect(test.hooks.sample).not.toHaveBeenCalled();
    expect(test.calls.deleteQuery).toHaveBeenCalledOnce();
    timer.dispose(); expect(test.calls.deleteQuery).toHaveBeenCalledTimes(2);
  });
});
