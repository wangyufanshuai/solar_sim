import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";

let targetUrl = process.argv[2] ?? process.env.SOLAR_PERF_URL ?? "http://127.0.0.1:3002/";
async function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const freePort = typeof address === "object" && address ? address.port : 0;
      server.close((error) => error ? reject(error) : resolve(freePort));
    });
  });
}
const port = Number(process.env.SOLAR_PERF_CDP_PORT ?? await findFreePort());
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

async function waitForHttp(url, label, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) return;
      lastError = new Error(`${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(500);
  }
  const detail = lastError?.cause?.message ?? lastError?.message ?? "unknown error";
  throw new Error(`${label} did not become reachable at ${url}: ${detail}`);
}

async function startDevServerIfNeeded() {
  try {
    await waitForHttp(targetUrl, "Existing dev server", 5000);
    return null;
  } catch {}
  const devPort = await findFreePort();
  targetUrl = `http://127.0.0.1:${devPort}/`;
  const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", `npx next dev -H 127.0.0.1 -p ${devPort}`]
    : ["exec", "next", "dev", "-H", "127.0.0.1", "-p", String(devPort)];
  const processHandle = spawn(command, args, {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" },
  });
  let lastOutput = "";
  const remember = (chunk) => {
    lastOutput = `${lastOutput}${chunk.toString()}`.slice(-3000);
  };
  processHandle.stdout.on("data", remember);
  processHandle.stderr.on("data", remember);
  try {
    await waitForHttp(targetUrl, "Next dev server", 60000);
  } catch (error) {
    throw new Error(`${error.message}\nDev server output:\n${lastOutput}`);
  }
  return processHandle;
}

function killProcessTree(processHandle) {
  if (!processHandle || processHandle.killed) return;
  if (process.platform === "win32" && processHandle.pid) {
    spawn(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `taskkill /pid ${processHandle.pid} /t /f`], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }
  processHandle.kill();
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
  const detail = lastError?.cause?.message ?? lastError?.message ?? "unknown error";
  throw new Error(`Chrome DevTools endpoint did not start on port ${port}: ${detail}`);
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
  const pressText = (text) => {
    const wanted = text.toLowerCase();
    const button = [...document.querySelectorAll("button")]
      .find((item) => (item.textContent ?? "").trim().toLowerCase() === wanted);
    if (!button) return false;
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
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
  const observedLongTasks = [];
  let longTaskObserver = null;
  if ("PerformanceObserver" in window) {
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          observedLongTasks.push({
            name: entry.name,
            ms: Number(entry.duration.toFixed(2)),
            startMs: Number(entry.startTime.toFixed(1)),
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
    } catch {}
  }
  if (scenario === "mission" || scenario === "mission-run-worker") {
    press('[data-solar-section="mission"]');
    await sleep(900);
  }
  if (scenario === "mission-run-worker") {
    press('[data-solar-action="mission-optimize"]');
    await sleep(100);
  }
  if (scenario === "quality") {
    press('[data-solar-section="view"]');
    await sleep(200);
    press('[data-solar-action="budget-quality"]');
    await sleep(1200);
  }
  if (scenario === "showcase-tour") {
    press('[data-solar-section="view"]');
    await sleep(200);
    press('[data-solar-action="budget-quality"]');
    await sleep(700);
    press('[data-solar-section="tools"]');
    await sleep(250);
    press('[data-solar-action="cinematic-tour"]');
    await sleep(300);
  }
  if (scenario === "gallery-open") {
    press('[data-solar-section="tools"]');
    await sleep(250);
    press('[data-solar-action="gallery-toggle"]');
    const deadline = performance.now() + 45000;
    while (document.querySelectorAll("[data-solar-spacecraft]").length < 8 && performance.now() < deadline) {
      await sleep(250);
    }
    await sleep(1200);
  }
  if (scenario === "gallery-all-models") {
    press('[data-solar-section="tools"]');
    await sleep(250);
    press('[data-solar-action="gallery-toggle"]');
    const deadline = performance.now() + 45000;
    while (document.querySelectorAll("[data-solar-spacecraft]").length < 8 && performance.now() < deadline) {
      await sleep(250);
    }
    for (const button of [...document.querySelectorAll("[data-solar-spacecraft]")]) {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const modelDeadline = performance.now() + 15000;
      while (/Loading model/i.test(document.querySelector('[data-solar-gallery="v2"]')?.textContent ?? "") && performance.now() < modelDeadline) {
        await sleep(120);
      }
      await sleep(240);
    }
  }
  if (scenario === "mission-compare") {
    press('[data-solar-section="mission"]');
    await sleep(400);
    pressText("compare");
    await sleep(300);
  }
  if (scenario === "ccsds-export") {
    press('[data-solar-section="mission"]');
    await sleep(300);
    pressText("report");
    await sleep(250);
    press('[data-solar-action="mission-export-oem"]');
    press('[data-solar-action="mission-export-opm"]');
  }
  if (scenario === "monte-carlo-worker") {
    press('[data-solar-section="mission"]');
    await sleep(300);
    pressText("review");
    await sleep(250);
    press('[data-solar-action="mission-monte-carlo"]');
    await sleep(250);
  }
  if (scenario === "review-export") {
    press('[data-solar-section="mission"]');
    await sleep(300);
    pressText("review");
    await sleep(250);
    press('[data-solar-action="mission-review-export-json"]');
    press('[data-solar-action="mission-review-export-md"]');
  }
  if (scenario === "trajectory-inspector") {
    press('[data-solar-section="mission"]');
    await sleep(300);
    pressText("review");
    await sleep(250);
    press('[data-solar-action="mission-trajectory-inspect"]');
  }
  if (scenario === "cinematic-post") {
    press('[data-solar-section="view"]');
    await sleep(200);
    press('[data-solar-action="budget-quality"]');
    await sleep(500);
    press('[data-solar-section="tools"]');
    await sleep(250);
    press('[data-solar-action="post-tour-cover"]');
    await sleep(400);
  }
  if (scenario === "sky-atlas-open" || scenario === "sky-atlas-route" || scenario === "atlas-cover") {
    press('[data-solar-section="atlas"]');
    await sleep(650);
    if (scenario === "sky-atlas-route") {
      press('[data-solar-action="atlas-route-play"]');
      await sleep(900);
    }
    if (scenario === "atlas-cover") {
      press('[data-solar-action="atlas-cover"]');
      await sleep(250);
    }
  }
  if (scenario === "safe") {
    press('[data-solar-section="view"]');
    await sleep(200);
    press('[data-solar-action="budget-safe"]');
    await sleep(800);
  }
  const durationMs =
    scenario === "zoom" ? 4500 :
    scenario === "mission-run-worker" ? 1800 :
    scenario === "gallery-open" ? 3500 :
    scenario === "gallery-all-models" ? 3000 :
    scenario === "mission-compare" ? 2400 :
    scenario === "ccsds-export" ? 1800 :
    scenario === "monte-carlo-worker" ? 2600 :
    scenario === "review-export" ? 1800 :
    scenario === "trajectory-inspector" ? 1800 :
    scenario === "cinematic-post" ? 3000 :
    scenario === "sky-atlas-open" ? 2200 :
    scenario === "sky-atlas-route" ? 3600 :
    scenario === "atlas-cover" ? 1600 :
    scenario === "showcase-tour" ? 5000 :
    6000;
  const result = await sample(durationMs, (frame) => {
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
  const assetMarks = performance
    .getEntriesByType("mark")
    .filter((entry) => entry.name.startsWith("solar:"))
    .map((entry) => ({
      name: entry.name.replace("solar:", ""),
      ms: Number(entry.startTime.toFixed(1)),
    }));
  const missionStatus = document.querySelector('[data-solar-panel="mission"]')?.textContent ?? "";
  const galleryStatus = document.querySelector('[data-solar-gallery="v2"]')?.textContent ?? "";
  longTaskObserver?.disconnect();
  const observedLongTaskMaxMs = observedLongTasks.reduce((max, item) => Math.max(max, item.ms), 0);
  return {
    ok: true,
    scenario,
    ...result,
    assetMarks,
    missionStatus: missionStatus.slice(0, 240),
    galleryStatus: galleryStatus.slice(0, 180),
    observedLongTaskMaxMs,
    observedLongTasks: observedLongTasks.slice(-12),
  };
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
  const observedMissionWorkerMax =
    scenarioResult?.scenario === "mission-run-worker" &&
    Number.isFinite(scenarioResult?.observedLongTaskMaxMs)
      ? Number(scenarioResult.observedLongTaskMaxMs.toFixed(2))
      : null;
  return {
    scenarioResult,
    eventCount: events.length,
    longTaskCount: observedMissionWorkerMax === null
      ? complete.filter((ev) => ev.dur >= 50000).length
      : scenarioResult.observedLongTasks.length,
    maxTaskMs: observedMissionWorkerMax ?? Number(((longTasks[0]?.ms ?? 0)).toFixed(2)),
    longTasks: observedMissionWorkerMax === null ? longTasks : scenarioResult.observedLongTasks,
    topTotals,
  };
}

async function runScenario(cdp, scenario) {
  let traceStream = null;
  cdp.on("Tracing.tracingComplete", (params) => {
    traceStream = params.stream;
  });
  if (["mission-compare", "monte-carlo-worker", "review-export", "trajectory-inspector"].includes(scenario)) {
    await cdp.send("Runtime.evaluate", {
      expression: `(${String(async () => {
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        document.querySelector('[data-solar-section="mission"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await sleep(350);
        document.querySelector('[data-solar-action="mission-optimize"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await sleep(4200);
      })})()`,
      awaitPromise: true,
    });
  }
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
  const server = await startDevServerIfNeeded();
  const chromePath = chromeCandidates.find((candidate) => existsSync(candidate));
  if (!chromePath) throw new Error("No Chrome or Edge executable found. Set CHROME_PATH and retry.");
  const userDataDir = mkdtempSync(join(tmpdir(), "solar-profile-chrome-"));
  let chromeExit = null;
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
  chrome.on("exit", (code, signal) => {
    chromeExit = { code, signal };
  });

  try {
    await waitForCdp();
    if (chromeExit) throw new Error(`Chrome exited before CDP was ready: ${JSON.stringify(chromeExit)}`);
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
    const requestedScenarios = process.env.SOLAR_PERF_SCENARIOS
      ? process.env.SOLAR_PERF_SCENARIOS.split(",").map((value) => value.trim()).filter(Boolean)
      : ["rotate", "zoom", "mission", "mission-run-worker", "safe", "quality", "showcase-tour", "gallery-open", "gallery-all-models", "mission-compare", "ccsds-export", "monte-carlo-worker", "review-export", "trajectory-inspector", "cinematic-post", "sky-atlas-open", "sky-atlas-route", "atlas-cover"];
    for (const scenario of requestedScenarios) {
      scenarios.push({ scenario, ...(await runScenario(cdp, scenario)) });
    }
    console.log(JSON.stringify({ url: targetUrl, scenarios }, null, 2));
    cdp.close();
  } finally {
    chrome.kill();
    killProcessTree(server);
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
