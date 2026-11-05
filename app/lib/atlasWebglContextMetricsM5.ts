type RasterContext = Pick<WebGLRenderingContext, "isContextLost" | "getParameter" | "VIEWPORT" | "SCISSOR_BOX" | "drawingBufferWidth" | "drawingBufferHeight">;

/** Lost contexts return null from getParameter. Unknown is never a zero or stale GPU measurement. */
export function readAtlasWebglRasterMetricsM5(context: RasterContext) {
  if (context.isContextLost()) return { status: "context-lost" as const, viewport: "unavailable", scissor: "unavailable", drawingBuffer: "unavailable" };
  const viewport: unknown = context.getParameter(context.VIEWPORT);
  const scissor: unknown = context.getParameter(context.SCISSOR_BOX);
  const valid = (value: unknown): value is Int32Array => value instanceof Int32Array && value.length === 4;
  if (context.isContextLost() || !valid(viewport) || !valid(scissor)) {
    return { status: context.isContextLost() ? "context-lost" as const : "unavailable" as const,
      viewport: "unavailable", scissor: "unavailable", drawingBuffer: "unavailable" };
  }
  return { status: "ready" as const, viewport: Array.from(viewport).join(","), scissor: Array.from(scissor).join(","),
    drawingBuffer: `${context.drawingBufferWidth}x${context.drawingBufferHeight}` };
}

type TimerExtension = { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number };
type TimerHooks = { sample: (milliseconds: number) => void; reset: () => void; status: (status: string) => void };

/** Query handles belong to a context generation even when the JS context object is reused. */
export function createAtlasGpuTimerM5(context: WebGL2RenderingContext, events: EventTarget, hooks: TimerHooks) {
  let extension: TimerExtension | null = null;
  let pending: WebGLQuery[] = [];
  let active: WebGLQuery | null = null;
  let disposed = false;
  let lost = false;

  const invalidate = () => {
    // These handles are already invalid. Calling delete/end/getQuery on them
    // after restoration would address resources from the previous generation.
    pending = []; active = null; extension = null;
    hooks.reset();
  };
  const suspend = () => {
    if (disposed || lost) return;
    lost = true; invalidate(); hooks.status("context-lost");
  };
  const initialize = () => {
    if (disposed) return;
    if (context.isContextLost()) { suspend(); return; }
    lost = false;
    extension = context.getExtension("EXT_disjoint_timer_query_webgl2") as TimerExtension | null;
    hooks.status(extension ? "active-ext-disjoint-timer-query-webgl2" : "unavailable-no-disjoint-query");
  };
  const restore = () => { if (!disposed) { invalidate(); initialize(); } };
  events.addEventListener("webglcontextlost", suspend);
  events.addEventListener("webglcontextrestored", restore);
  initialize();

  return {
    before() {
      if (disposed) return;
      if (context.isContextLost()) { suspend(); return; }
      if (!extension || lost) return;
      while (pending.length > 0) {
        const query = pending[0];
        if (!context.getQueryParameter(query, context.QUERY_RESULT_AVAILABLE)) break;
        pending.shift();
        if (!context.getParameter(extension.GPU_DISJOINT_EXT)) {
          const nanoseconds = Number(context.getQueryParameter(query, context.QUERY_RESULT));
          if (Number.isFinite(nanoseconds) && nanoseconds >= 0) hooks.sample(nanoseconds / 1_000_000);
        }
        context.deleteQuery(query);
      }
      if (active || pending.length >= 4) return;
      const query = context.createQuery();
      if (!query) return;
      context.beginQuery(extension.TIME_ELAPSED_EXT, query);
      active = query;
    },
    after() {
      if (disposed) return;
      if (context.isContextLost()) { suspend(); return; }
      if (!active || !extension || lost) return;
      context.endQuery(extension.TIME_ELAPSED_EXT);
      pending.push(active); active = null;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      events.removeEventListener("webglcontextlost", suspend);
      events.removeEventListener("webglcontextrestored", restore);
      if (!context.isContextLost() && !lost) {
        if (active && extension) { context.endQuery(extension.TIME_ELAPSED_EXT); context.deleteQuery(active); }
        for (const query of pending) context.deleteQuery(query);
      }
      pending = []; active = null; extension = null;
      hooks.status("released");
    },
  };
}
