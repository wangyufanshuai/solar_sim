import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page, type Request } from "@playwright/test";

const ROOT = '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]';
const DEFAULT_OUTPUT = "dist/science/lifecycle-soak-v178-report.json";
const DEFAULT_VERSION = "v178-production-lifecycle-soak";
const MEASURED_CYCLES = Math.max(1, Number(process.env.ATLAS_SOAK_CYCLES ?? "10"));
const WARMUP_CYCLES = Math.max(0, Number(process.env.ATLAS_SOAK_WARMUP_CYCLES ?? "2"));
const TEXTURE_AUDIT_ENABLED = process.env.ATLAS_SOAK_TEXTURE_AUDIT === "1";

type ResourceSample = {
  workers: number;
  renderTargets: number;
  subscriptions: number;
  cameraLocks: number;
  textures: number;
  models: number;
  programs: number;
  rendererTextures: number;
};

type WebGlTextureAuditSnapshot = {
  created: number;
  deleted: number;
  live: Array<{ id: number; stack: string; createdAtMs: number }>;
};

async function installWebGlTextureAudit(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state = {
      nextId: 1,
      created: 0,
      deleted: 0,
      ids: new WeakMap<object, number>(),
      live: new Map<number, { id: number; stack: string; createdAtMs: number }>(),
    };
    (window as typeof window & { __atlasWebGlTextureAudit?: typeof state }).__atlasWebGlTextureAudit = state;
    const patch = (prototype: object | undefined) => {
      if (!prototype) return;
      const target = prototype as {
        createTexture?: () => object | null;
        deleteTexture?: (texture: object | null) => void;
      };
      const createTexture = target.createTexture;
      const deleteTexture = target.deleteTexture;
      if (!createTexture || !deleteTexture) return;
      target.createTexture = function createAtlasAuditedTexture(this: object) {
        const texture = createTexture.call(this);
        if (texture) {
          const id = state.nextId++;
          state.created += 1;
          state.ids.set(texture, id);
          state.live.set(id, {
            id,
            stack: new Error("WebGL texture allocation").stack ?? "",
            createdAtMs: performance.now(),
          });
        }
        return texture;
      };
      target.deleteTexture = function deleteAtlasAuditedTexture(this: object, texture: object | null) {
        if (texture) {
          const id = state.ids.get(texture);
          if (id !== undefined && state.live.delete(id)) state.deleted += 1;
        }
        return deleteTexture.call(this, texture);
      };
    };
    patch(globalThis.WebGLRenderingContext?.prototype);
    patch(globalThis.WebGL2RenderingContext?.prototype);
  });
}

async function webGlTextureAuditSnapshot(page: Page): Promise<WebGlTextureAuditSnapshot> {
  return page.evaluate(() => {
    const state = (window as typeof window & {
      __atlasWebGlTextureAudit?: {
        created: number;
        deleted: number;
        live: Map<number, { id: number; stack: string; createdAtMs: number }>;
      };
    }).__atlasWebGlTextureAudit;
    return state
      ? { created: state.created, deleted: state.deleted, live: [...state.live.values()] }
      : { created: 0, deleted: 0, live: [] };
  });
}

async function snapshot(page: Page): Promise<ResourceSample> {
  return page.locator('[data-atlas-app-shell]').evaluate((element) => {
    const number = (name: string) => Number(element.getAttribute(name) ?? "0");
    return {
      workers: number("data-atlas-resource-workers"),
      renderTargets: number("data-atlas-resource-render-targets"),
      subscriptions: number("data-atlas-resource-subscriptions"),
      cameraLocks: number("data-atlas-resource-camera-locks"),
      textures: number("data-atlas-resource-textures"),
      models: number("data-atlas-resource-models"),
      programs: number("data-atlas-render-programs"),
      rendererTextures: number("data-atlas-render-textures"),
    };
  });
}

async function collectHeap(page: Page): Promise<number> {
  const session = await page.context().newCDPSession(page);
  try {
    await session.send("HeapProfiler.collectGarbage");
    const usage = await session.send("Runtime.getHeapUsage") as { usedSize: number };
    return usage.usedSize;
  } finally {
    await session.detach();
  }
}

async function openNavigator(page: Page): Promise<void> {
  await page.getByRole("button", { exact: true, name: "搜索" }).click();
  await expect(page.getByRole("dialog", { exact: true, name: "图谱导航" })).toBeVisible();
}

async function measureBrowserSearch(page: Page, value: string): Promise<number> {
  return page.locator('[role="dialog"][data-atlas-navigator-open="true"] input[data-no-escape-clear]').evaluate(
    (element, nextValue) => new Promise<number>((resolve) => {
      const input = element as HTMLInputElement;
      const started = performance.now();
      const finish = () => {
        if (!document.querySelector('[data-atlas-navigator-item-id="solar-body:earth"]')) return;
        observer.disconnect();
        resolve(performance.now() - started);
      };
      const observer = new MutationObserver(finish);
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, nextValue);
      input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: nextValue }));
      queueMicrotask(finish);
    }),
    value,
  );
}

async function measureBrowserFocusCommand(page: Page): Promise<number> {
  return page.locator('[data-atlas-navigator-item-id="solar-body:earth"]').evaluate(
    (element) => new Promise<number>((resolve) => {
      const onDispatch = (event: Event) => {
        window.removeEventListener("atlas:focus-command-dispatched", onDispatch);
        const detail = (event as CustomEvent<{ durationMs?: number }>).detail;
        resolve(detail?.durationMs ?? Number.POSITIVE_INFINITY);
      };
      window.addEventListener("atlas:focus-command-dispatched", onDispatch);
      (element as HTMLButtonElement).click();
    }),
  );
}

async function runCycle(page: Page, measureSearch: boolean) {
  const stageResources: Partial<Record<"inspect" | "launch" | "kerr", ResourceSample>> = {};
  await openNavigator(page);
  const searchMs = await measureBrowserSearch(page, "Earth");
  const earth = page.locator('[data-atlas-navigator-item-id="solar-body:earth"]');
  await expect(earth).toBeVisible();
  const focusMs = await measureBrowserFocusCommand(page);
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "inspect");
  await page.keyboard.press("Escape");
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas");
  if (measureSearch) stageResources.inspect = await snapshot(page);

  await page.getByRole("button", { exact: true, name: "发射" }).click();
  await expect(page.locator('[data-launch-control-panel="true"]')).toBeVisible();
  await page.getByRole("button", { exact: true, name: "点火发射" }).click();
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "launch");
  await page.getByRole("button", { exact: true, name: "中止发射" }).click();
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas");
  if (measureSearch) stageResources.launch = await snapshot(page);

  const opener = page.getByRole("button", { exact: true, name: "打开对象浏览器" });
  if (await opener.isVisible()) await opener.click();
  await page.getByRole("button", { exact: true, name: "视图" }).click();
  const kerr = page.getByLabel("Kerr 相对论实验室", { exact: true });
  if (!(await kerr.isChecked())) await kerr.check();
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "kerr");
  await kerr.uncheck();
  await expect(page.locator(ROOT)).toHaveAttribute("data-atlas-runtime-scene-mode", "atlas");
  if (measureSearch) stageResources.kerr = await snapshot(page);
  const closer = page.getByRole("button", { exact: true, name: "收起对象浏览器" });
  if (await closer.isVisible()) await closer.click();
  await page.waitForTimeout(2_000);
  return measureSearch ? { searchMs, focusMs, stageResources } : null;
}

function ordinaryLeastSquaresSlope(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const meanX = (values.length - 1) / 2;
  const meanY = values.reduce((sum, value) => sum + value, 0) / values.length;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index += 1) {
    const deltaX = index - meanX;
    numerator += deltaX * (values[index]! - meanY);
    denominator += deltaX * deltaX;
  }
  return denominator > 0 ? numerator / denominator : 0;
}

async function waitForBaselineQuiescence(
  page: Page,
  pendingRequests: ReadonlySet<Request>,
): Promise<{ waitMs: number; rendererTextures: number }> {
  const startedAt = Date.now();
  const timeoutMs = 300_000;
  let stableSamples = 0;
  let lastRendererTextures = -1;
  while (Date.now() - startedAt < timeoutMs) {
    const resources = await snapshot(page);
    if (pendingRequests.size === 0 && resources.rendererTextures === lastRendererTextures) {
      stableSamples += 1;
    } else {
      stableSamples = 0;
    }
    lastRendererTextures = resources.rendererTextures;
    if (stableSamples >= 5) {
      return { waitMs: Date.now() - startedAt, rendererTextures: resources.rendererTextures };
    }
    await page.waitForTimeout(1_000);
  }
  throw new Error(
    `Atlas baseline did not quiesce within ${timeoutMs} ms; pending=${pendingRequests.size}, textures=${lastRendererTextures}`,
  );
}

test("measured scene cycles return resources and heap to the production baseline", async ({ page }, testInfo) => {
  test.setTimeout(600_000);
  const metadata = testInfo.config.metadata as Record<string, unknown>;
  const output = path.resolve(
    typeof metadata.soakEvidenceOutput === "string"
      ? metadata.soakEvidenceOutput
      : DEFAULT_OUTPUT,
  );
  const version = typeof metadata.soakEvidenceVersion === "string"
    ? metadata.soakEvidenceVersion
    : DEFAULT_VERSION;
  const runtimeBaseline = typeof metadata.soakRuntimeBaseline === "string"
    ? metadata.soakRuntimeBaseline
    : "production-standalone";
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const pendingRequests = new Set<Request>();
  let phase = "navigation";
  page.on("request", (request) => pendingRequests.add(request));
  page.on("requestfinished", (request) => pendingRequests.delete(request));
  page.on("requestfailed", (request) => pendingRequests.delete(request));
  if (TEXTURE_AUDIT_ENABLED) await installWebGlTextureAudit(page);
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(`[${phase}] ${error.stack ?? error.message}`));
  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  await expect(page.locator(ROOT)).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.waitForTimeout(2_000);
  const pauseSimulation = page.getByRole("button", { exact: true, name: "暂停" });
  if (await pauseSimulation.isVisible()) {
    await pauseSimulation.click();
    await expect(page.getByRole("button", { exact: true, name: "播放" })).toBeVisible();
  }

  for (let index = 0; index < WARMUP_CYCLES; index += 1) {
    phase = `warmup-${index + 1}`;
    await runCycle(page, false);
  }
  phase = "baseline-quiescence";
  const baselineQuiescence = await waitForBaselineQuiescence(page, pendingRequests);
  phase = "baseline";
  const baseline = await snapshot(page);
  const baselineHeap = await collectHeap(page);
  const baselineWebGlTextureAudit = await webGlTextureAuditSnapshot(page);
  const cycles: Array<{
    resources: ResourceSample;
    heapBytes: number;
    searchMs: number;
    focusMs: number;
    stageResources: Partial<Record<"inspect" | "launch" | "kerr", ResourceSample>>;
  }> = [];
  for (let index = 0; index < MEASURED_CYCLES; index += 1) {
    phase = `measured-${index + 1}`;
    const latency = await runCycle(page, true);
    cycles.push({
      resources: await snapshot(page),
      heapBytes: await collectHeap(page),
      searchMs: latency?.searchMs ?? Number.POSITIVE_INFINITY,
      focusMs: latency?.focusMs ?? Number.POSITIVE_INFINITY,
      stageResources: latency?.stageResources ?? {},
    });
  }

  const released = cycles.at(-1)?.resources ?? baseline;
  const finalHeap = cycles.at(-1)?.heapBytes ?? baselineHeap;
  const finalWebGlTextureAudit = await webGlTextureAuditSnapshot(page);
  const baselineTextureIds = new Set(baselineWebGlTextureAudit.live.map((texture) => texture.id));
  const newLiveWebGlTextures = finalWebGlTextureAudit.live.filter(
    (texture) => !baselineTextureIds.has(texture.id),
  );
  const heapLimit = baselineHeap + Math.max(32 * 1024 * 1024, baselineHeap * 0.1);
  const rendererTextureSeries = cycles.map((cycle) => cycle.resources.rendererTextures);
  const programSeries = cycles.map((cycle) => cycle.resources.programs);
  const stableHeapSeries = cycles.slice(-Math.min(10, cycles.length)).map((cycle) => cycle.heapBytes);
  const stableHeapOlsSlopeBytesPerCycle = ordinaryLeastSquaresSlope(stableHeapSeries);
  const stableHeapOlsSlopeLimitBytesPerCycle = 256 * 1024;
  const strictlyGrowing = (values: number[]) => values.length > 1 && values.every(
    (value, index) => index === 0 || value >= values[index - 1],
  ) && values.at(-1)! > values[0];
  const report = {
    version,
    generatedAt: new Date().toISOString(),
    runtimeBaseline,
    simulationClockPolicy: "paused-before-warmup-to-isolate-scene-lifecycle",
    webGlTextureAuditEnabled: TEXTURE_AUDIT_ENABLED,
    warmupCycles: WARMUP_CYCLES,
    measuredCycles: MEASURED_CYCLES,
    baselineQuiescence,
    baseline,
    baselineHeap,
    baselineWebGlTextureAudit,
    cycles,
    released,
    finalHeap,
    finalWebGlTextureAudit,
    newLiveWebGlTextures,
    heapLimit,
    stableHeapSeries,
    stableHeapOlsSlopeBytesPerCycle,
    stableHeapOlsSlopeLimitBytesPerCycle,
    consoleErrors,
    pageErrors,
    passed: released.workers === baseline.workers
      && released.renderTargets === baseline.renderTargets
      && released.subscriptions === baseline.subscriptions
      && released.cameraLocks === baseline.cameraLocks
      && released.models === baseline.models
      && released.rendererTextures <= baseline.rendererTextures + 2
      && finalHeap <= heapLimit
      && stableHeapOlsSlopeBytesPerCycle <= stableHeapOlsSlopeLimitBytesPerCycle
      && !strictlyGrowing(rendererTextureSeries)
      && !strictlyGrowing(programSeries)
      && cycles.every((cycle, index) => cycle.searchMs < (index === 0 ? 150 : 50) && cycle.focusMs < 100)
      && consoleErrors.length === 0
      && pageErrors.length === 0,
    boundary: "production-browser-lifecycle-only-no-scientific-state-mutation",
  };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);

  expect(report.passed, JSON.stringify(report, null, 2)).toBe(true);
});
