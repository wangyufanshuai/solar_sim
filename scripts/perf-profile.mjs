import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const targetUrl = process.argv[2] ?? process.env.SOLAR_PERF_URL ?? "http://127.0.0.1:3002/";
const port = Number(process.env.SOLAR_PERF_CDP_PORT ?? (9700 + Math.floor(Math.random() * 400)));
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function waitForCdp() {
  const deadline = Date.now() + 12000;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      return await fetchJson(`http://127.0.0.1:${port}/json/version`);
    } catch (err) {
      lastError = err;
      await sleep(180);
    }
  }
  throw lastError ?? new Error("Chrome DevTools endpoint did not start");
}

function createCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id) {
      const item = pending.get(msg.id);
      if (!item) return;
      pending.delete(msg.id);
      if (msg.error) item.reject(new Error(msg.error.message ?? "CDP error"));
      else item.resolve(msg.result);
      return;
    }
    const items = listeners.get(msg.method);
    if (items) for (const cb of items) cb(msg.params);
  });
  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const callId = ++id;
          ws.send(JSON.stringify({ id: callId, method, params }));
          return new Promise((res, rej) => pending.set(callId, { resolve: res, reject: rej }));
        },
        on(method, cb) {
          if (!listeners.has(method)) listeners.set(method, []);
          listeners.get(method).push(cb);
        },
        close() {
          ws.close();
        },
      });
    });
    ws.addEventListener("error", reject);
  });
}

const scenarioRunner = String.raw`
async (scenario) => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const canvasDeadline = performance.now() + 60000;
  let canvas = document.querySelector("canvas");
  while (!canvas && performance.now() < canvasDeadline) {
    await sleep(250);
    canvas = document.querySelector("canvas");
  }
  const press = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return false;
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return true;
  };
  const sample = (durationMs, drive) => new Promise((resolve) => {
    let done = false;
    const samples = [];
    let last = performance.now();
    const start = last;
    let frame = 0;
    const finish = (forced = false) => {
      if (done) return;
      done = true;
      resolve({ forced, frames: samples.length });
    };
    setTimeout(() => finish(true), durationMs + 5000);
    function tick(now) {
      if (done) return;
      samples.push(now - last);
      last = now;
      drive?.(frame++, now - start);
      if (now - start < durationMs) requestAnimationFrame(tick);
      else finish(false);
    }
    requestAnimationFrame(tick);
  });
  await sleep(1200);
  const box = canvas?.getBoundingClientRect();
  if (!canvas || !box) return { ok: false, reason: "canvas_unavailable" };
  if (scenario === "mission") {
    press('[data-solar-section="mission"]');
    await sleep(500);
    press('[data-solar-action="mission-optimize"]');
    await sleep(1800);
  }
  if (scenario === "quality") {
    press('[data-solar-section="view"]');
    await sleep(200);
    press('[data-solar-action="budget-quality"]');
    await sleep(1200);
  }
  if (scenario === "safe") {
    press('[data-solar-section="view"]');
    await sleep(200);
    press('[data-solar-action="budget-safe"]');
    await sleep(800);
  }
  const result = await sample(scenario === "zoom" ? 4500 : 6000, (frame) => {
    if (scenario === "zoom") {
      if (frame % 4 === 0) canvas.dispatchEvent(new WheelEvent("wheel", { bubbles: true, clientX: box.left + box.width * 0.5, clientY: box.top + box.height * 0.5, deltaY: frame % 8 === 0 ? -140 : 120, deltaMode: 0 }));
      return;
    }
    if (frame === 0) canvas.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 7, pointerType: "mouse", clientX: box.left + box.width * 0.5, clientY: box.top + box.height * 0.5, buttons: 1 }));
    const x = box.left + box.width * (0.5 + 0.25 * Math.sin(frame / 10));
    const y = box.top + box.height * (0.48 + 0.12 * Math.cos(frame / 15));
    canvas.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 7, pointerType: "mouse", clientX: x, clientY: y, buttons: 1 }));
    if (frame > 340) canvas.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 7, pointerType: "mouse", clientX: x, clientY: y, buttons: 0 }));
  });
  return { ok: true, scenario, ...result };
}`;

async function readTraceStream(cdp, stream) {
  let data = "";
  for (;;) {
    const chunk = await cdp.send("IO.read", { handle: stream });
    data += chunk.data ?? "";
    if (chunk.eof) break;
  }
  await cdp.send("IO.close", { handle: stream });
  return JSON.parse(data);
}

function summarizeTrace(trace, scenarioResult) {
  const events = Array.isArray(trace.traceEvents) ? trace.traceEvents : [];
  const complete = events.filter((ev) => ev.ph === "X" && typeof ev.dur === "number");
  const longTasks = complete
    .filter((ev) => ev.dur >= 50000)
    .sort((a, b) => b.dur - a.dur)
    .slice(0, 12)
    .map((ev) => ({
      name: ev.name,
      ms: Number((ev.dur / 1000).toFixed(2)),
      category: ev.cat,
    }));
  const totals = new Map();
  for (const ev of complete) {
    const name = ev.name || "unknown";
    totals.set(name, (totals.get(name) ?? 0) + ev.dur / 1000);
  }
  const topTotals = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, ms]) => ({ name, ms: Number(ms.toFixed(2)) }));
  return {
    scenarioResult,
    eventCount: events.length,
    longTaskCount: complete.filter((ev) => ev.dur >= 50000).length,
    maxTaskMs: Number(((longTasks[0]?.ms ?? 0)).toFixed(2)),
    longTasks,
    topTotals,
  };
}

async function runScenario(cdp, scenario) {
  let traceStream = null;
  cdp.on("Tracing.tracingComplete", (params) => {
    traceStream = params.stream;
  });
  await cdp.send("Tracing.start", {
    transferMode: "ReturnAsStream",
    categories: "devtools.timeline,disabled-by-default-devtools.timeline,blink,cc,gpu",
  });
  const result = await cdp.send("Runtime.evaluate", {
    expression: `(${scenarioRunner})(${JSON.stringify(scenario)})`,
    awaitPromise: true,
    returnByValue: true,
  });
  await cdp.send("Tracing.end");
  const deadline = Date.now() + 15000;
  while (!traceStream && Date.now() < deadline) await sleep(100);
  if (!traceStream) throw new Error(`No trace stream for ${scenario}`);
  const trace = await readTraceStream(cdp, traceStream);
  return summarizeTrace(trace, result.result.value);
}

async function main() {
  const chromePath = chromeCandidates.find(Boolean);
  if (!chromePath) throw new Error("No Chrome or Edge executable found. Set CHROME_PATH and retry.");
  const userDataDir = mkdtempSync(join(tmpdir(), "solar-profile-chrome-"));
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--headless=new",
    "--no-first-run",
    "--disable-background-networking",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--disable-extensions",
    "--window-size=1280,900",
    targetUrl,
  ], { stdio: "ignore" });

  try {
    await waitForCdp();
    const tabs = await fetchJson(`http://127.0.0.1:${port}/json`);
    const page = tabs.find((tab) => tab.type === "page") ?? tabs[0];
    const cdp = await createCdp(page.webSocketDebuggerUrl);
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    await cdp.send("Page.bringToFront");
    await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true });
    await cdp.send("Page.setWebLifecycleState", { state: "active" }).catch(() => {});
    await cdp.send("Page.navigate", { url: targetUrl });
    await sleep(1500);
    await cdp.send("Page.bringToFront");
    const scenarios = [];
    for (const scenario of ["rotate", "zoom", "mission", "safe", "quality"]) {
      scenarios.push({ scenario, ...(await runScenario(cdp, scenario)) });
    }
    console.log(JSON.stringify({ url: targetUrl, scenarios }, null, 2));
    cdp.close();
  } finally {
    chrome.kill();
    setTimeout(() => {
      try {
        rmSync(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 120 });
      } catch {}
    }, 300);
  }
}

main().catch((err) => {
  console.error(err?.stack ?? String(err));
  process.exit(1);
});
