import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { AtlasRenderMetricsProbe } from "./AtlasUniverseSceneRuntime";

const harness = vi.hoisted(() => ({ state: null as unknown,
  effects: [] as Array<() => void | (() => void)>, frames: [] as Array<(state: { clock: { elapsedTime: number } }) => void> }));
vi.mock("react", async (original) => ({ ...await original<typeof import("react")>(),
  useEffect: (effect: () => void | (() => void)) => { harness.effects.push(effect); } }));
vi.mock("@react-three/fiber", async (original) => ({ ...await original<typeof import("@react-three/fiber")>(),
  useThree: (selector: (state: unknown) => unknown) => selector(harness.state),
  useFrame: (callback: (state: { clock: { elapsedTime: number } }) => void) => { harness.frames.push(callback); } }));
const cleanups: Array<() => void> = [];
afterEach(() => { while (cleanups.length) cleanups.pop()?.(); harness.frames = []; harness.effects = []; vi.unstubAllGlobals(); });

it("the actual render probe reports unknown while lost and resumes raster metrics without throwing", () => {
  let lost = false;
  const attributes = new Map<string, string>();
  const root = { setAttribute: (name: string, value: string) => attributes.set(name, value) };
  vi.stubGlobal("document", { querySelector: () => root });
  vi.stubGlobal("window", { setTimeout, clearTimeout });
  const context = { isContextLost: () => lost, VIEWPORT: 1, SCISSOR_BOX: 2,
    drawingBufferWidth: 1280, drawingBufferHeight: 720,
    getParameter: vi.fn(() => lost ? null : new Int32Array([0, 0, 1280, 720])) };
  const gl = { getContext: () => context, capabilities: { isWebGL2: false },
    info: { render: { calls: 9, triangles: 42 }, programs: [1], memory: { textures: 3 } } };
  harness.state = { gl, scene: { traverse: () => {} } };
  renderToStaticMarkup(createElement(AtlasRenderMetricsProbe));
  for (const effect of harness.effects) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); }
  const frame = (time: number) => harness.frames.forEach((callback) => callback({ clock: { elapsedTime: time } }));
  frame(1);
  expect(attributes.get("data-atlas-render-context-status")).toBe("ready");
  expect(attributes.get("data-atlas-render-draw-calls")).toBe("9");
  lost = true;
  expect(() => frame(1.3)).not.toThrow();
  expect(attributes.get("data-atlas-render-context-status")).toBe("context-lost");
  expect(attributes.get("data-atlas-render-viewport")).toBe("unavailable");
  expect(attributes.get("data-atlas-render-draw-calls")).toBe("unavailable");
  expect(attributes.get("data-atlas-render-textures")).toBe("unavailable");
  expect(attributes.get("data-atlas-render-gpu-frame-p50-ms")).toBe("unavailable");
  lost = false; frame(1.6);
  expect(attributes.get("data-atlas-render-context-status")).toBe("ready");
  expect(attributes.get("data-atlas-render-viewport")).toBe("0,0,1280,720");
  expect(attributes.get("data-atlas-render-draw-calls")).toBe("9");
});
