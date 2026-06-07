import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const baseTargetUrl = process.argv[2] ?? process.env.SOLAR_VISUAL_URL ?? "http://127.0.0.1:3002/";
let targetUrl = process.env.SOLAR_VISUAL_TEST === "1"
  ? `${baseTargetUrl}${baseTargetUrl.includes("?") ? "&" : "?"}visualTest=1`
  : baseTargetUrl;
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
const cdpPort = Number(process.env.SOLAR_VISUAL_CDP_PORT ?? await findFreePort());
const outDir = resolve(process.env.SOLAR_VISUAL_OUT_DIR ?? ".visual-runs/latest");
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const scenarios = [
  { id: "balanced-wide", viewport: { width: 1280, height: 900 }, action: "balanced", expect: ["canvas"] },
  { id: "showcase-deep-sky", viewport: { width: 1280, height: 900 }, action: "showcase", expect: ["canvas", "showcase"] },
  { id: "mission-audit", viewport: { width: 1280, height: 900 }, action: "mission", expect: ["canvas", "missionAudit"] },
  { id: "spacecraft-gallery", viewport: { width: 1280, height: 900 }, action: "gallery", expect: ["canvas", "gallery"] },
  { id: "sun-closeup", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 0, expect: ["canvas"] },
  { id: "earth-closeup", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 3, expect: ["canvas"] },
  { id: "moon-closeup", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 4, expect: ["canvas"] },
  { id: "jupiter-closeup", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 6, expect: ["canvas"] },
  { id: "saturn-closeup", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 7, expect: ["canvas"] },
  { id: "mobile-mission", viewport: { width: 390, height: 844, mobile: true }, action: "mobileMission", expect: ["canvas", "missionAudit"] },
];

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
      const res = await fetch(url);
      if (res.ok || res.status === 404) return true;
      lastError = new Error(`${res.status}`);
    } catch (err) {
      lastError = err;
    }
    await sleep(500);
  }
  const detail = lastError?.cause?.message ?? lastError?.message ?? "unknown error";
  throw new Error(`${label} did not become reachable at ${url}: ${detail}`);
}

async function waitForCdp(chromeProcess) {
  const deadline = Date.now() + 12000;
  let lastError = null;
  while (Date.now() < deadline) {
    if (chromeProcess.exitState) {
      throw new Error(`Chrome exited before CDP was ready: ${JSON.stringify(chromeProcess.exitState)}`);
    }
    try {
      return await fetchJson(`http://127.0.0.1:${cdpPort}/json/version`);
    } catch (err) {
      lastError = err;
      await sleep(180);
    }
  }
  const detail = lastError?.cause?.message ?? lastError?.message ?? "unknown error";
  throw new Error(`Chrome DevTools endpoint did not start on port ${cdpPort}: ${detail}`);
}

function createCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (!msg.id) return;
    const item = pending.get(msg.id);
    if (!item) return;
    pending.delete(msg.id);
    if (msg.error) item.reject(new Error(msg.error.message ?? "CDP error"));
    else item.resolve(msg.result);
  });
  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const callId = ++id;
          ws.send(JSON.stringify({ id: callId, method, params }));
          return new Promise((res, rej) => pending.set(callId, { resolve: res, reject: rej }));
        },
        close() {
          ws.close();
        },
      });
    });
    ws.addEventListener("error", reject);
  });
}

async function runtime(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime evaluation failed");
  }
  return result.result.value;
}

async function startDevServerIfNeeded() {
  try {
    await waitForHttp(targetUrl, "Existing dev server", 5000);
    return null;
  } catch {}
  const devPort = await findFreePort();
  const target = new URL(targetUrl);
  target.hostname = "127.0.0.1";
  target.port = String(devPort);
  targetUrl = target.toString();
  const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", `npx next dev -H 127.0.0.1 -p ${devPort}`]
    : ["exec", "next", "dev", "-H", "127.0.0.1", "-p", String(devPort)];
  const proc = spawn(command, args, {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" },
  });
  let lastOutput = "";
  const remember = (chunk) => {
    lastOutput = `${lastOutput}${chunk.toString()}`.slice(-3000);
  };
  proc.stdout.on("data", remember);
  proc.stderr.on("data", remember);
  proc.on("exit", (code, signal) => {
    proc.exitState = { code, signal, lastOutput };
  });
  try {
    await waitForHttp(targetUrl, "Next dev server", 60000);
  } catch (err) {
    throw new Error(`${err.message}\nDev server output:\n${lastOutput}`);
  }
  return proc;
}

function killProcessTree(proc) {
  if (!proc || proc.killed) return;
  if (process.platform === "win32" && proc.pid) {
    spawn(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `taskkill /pid ${proc.pid} /t /f`], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }
  proc.kill();
}

async function preparePage(cdp, scenario) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: scenario.viewport.width,
    height: scenario.viewport.height,
    deviceScaleFactor: 1,
    mobile: Boolean(scenario.viewport.mobile),
  });
  await cdp.send("Page.navigate", { url: targetUrl });
  await cdp.send("Page.loadEventFired").catch(() => {});
  await sleep(1200);
}

async function runScenarioAction(cdp, scenario) {
  return runtime(cdp, `(${String(async (scenarioArg) => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const press = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return true;
    };
    const pressText = (text) => {
      const wanted = text.toLowerCase();
      const buttons = [...document.querySelectorAll("button")];
      const button = buttons.find((item) => (item.textContent ?? "").trim().toLowerCase() === wanted);
      if (!button) return false;
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return true;
    };
    const waitFor = async (fn, timeoutMs = 30000) => {
      const deadline = performance.now() + timeoutMs;
      while (performance.now() < deadline) {
        const value = fn();
        if (value) return value;
        await sleep(250);
      }
      return null;
    };

    await waitFor(() => document.querySelector("canvas"));
    if (scenarioArg.action === "showcase") {
      press('[data-solar-section="view"]');
      await sleep(350);
      press('[data-solar-action="budget-quality"]');
      await sleep(2600);
    }
    if (scenarioArg.action === "mission" || scenarioArg.action === "mobileMission") {
      press('[data-solar-section="mission"]');
      await sleep(400);
      press('[data-solar-action="mission-optimize"]');
      await sleep(1900);
      pressText("audit");
      await sleep(500);
    }
    if (scenarioArg.action === "gallery") {
      press('[data-solar-section="tools"]');
      await waitFor(() => document.querySelectorAll("[data-solar-spacecraft]").length >= 8, 45000);
      const buttons = [...document.querySelectorAll("[data-solar-spacecraft]")];
      buttons[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await sleep(1200);
      buttons[7]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await sleep(2200);
    }
    if (scenarioArg.action === "focus") {
      await waitFor(
        () => performance.getEntriesByName("solar:preview-planets-ready", "mark").length > 0,
        45000,
      );
      window.dispatchEvent(new CustomEvent("solar-sim-camera-focus-body", {
        detail: { bodyIndex: scenarioArg.bodyIndex, mode: "inspect" },
      }));
      await sleep(3800);
    }

    const text = document.body.textContent ?? "";
    const canvases = [...document.querySelectorAll("canvas")].map((canvas) => {
      const rect = canvas.getBoundingClientRect();
      return { width: Math.round(rect.width), height: Math.round(rect.height), area: Math.round(rect.width * rect.height) };
    });
    const spacecraftButtons = document.querySelectorAll("[data-solar-spacecraft]").length;
    const exportButtons = document.querySelectorAll("[data-solar-action*='export']").length;
    const hasFrameworkOverlay = /Unhandled Runtime Error|Build Error|Next\\.js|Hydration failed/i.test(text);
    return {
      text,
      canvases,
      spacecraftButtons,
      exportButtons,
      hasFrameworkOverlay,
      url: location.href,
      title: document.title,
    };
  })})(${JSON.stringify(scenario)})`);
}

function checkScenario(scenario, state, screenshotBytes) {
  const failures = [];
  const biggestCanvas = Math.max(0, ...state.canvases.map((canvas) => canvas.area));
  if (scenario.expect.includes("canvas") && biggestCanvas < 10000) failures.push("canvas missing or too small");
  if (state.hasFrameworkOverlay) failures.push("framework error overlay detected");
  if (screenshotBytes < 12000) failures.push("screenshot is unexpectedly small");
  if (scenario.expect.includes("showcase") && !/Showcase|Render showcase|Deep sky/i.test(state.text)) {
    failures.push("showcase UI text missing");
  }
  if (scenario.expect.includes("missionAudit")) {
    if (!/Mission Engineering Audit/i.test(state.text)) failures.push("mission panel missing");
    if (!/SPICE table|JPL Horizons table interpolation|Ephemeris audit|Solver provenance/i.test(state.text)) {
      failures.push("ephemeris audit provenance missing");
    }
    if (state.exportButtons < 2) failures.push("mission report export buttons missing");
  }
  if (scenario.expect.includes("gallery")) {
    if (!/SPACECRAFT GALLERY/i.test(state.text)) failures.push("spacecraft gallery missing");
    if (state.spacecraftButtons < 8) failures.push(`expected at least 8 spacecraft buttons, saw ${state.spacecraftButtons}`);
  }
  return failures;
}

async function captureScreenshot(cdp, filename) {
  const capture = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const data = Buffer.from(capture.data, "base64");
  writeFileSync(filename, data);
  return data.length;
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const server = await startDevServerIfNeeded();
  const chromePath = chromeCandidates.find((candidate) => existsSync(candidate));
  if (!chromePath) throw new Error("No Chrome or Edge executable found. Set CHROME_PATH and retry.");

  const userDataDir = mkdtempSync(join(tmpdir(), "solar-visual-chrome-"));
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
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
    chrome.exitState = { code, signal };
  });

  const summary = {
    url: targetUrl,
    generatedAt: new Date().toISOString(),
    outDir,
    scenarios: [],
  };

  try {
    await waitForCdp(chrome);
    const tabs = await fetchJson(`http://127.0.0.1:${cdpPort}/json`);
    const page = tabs.find((tab) => tab.type === "page") ?? tabs[0];
    const cdp = await createCdp(page.webSocketDebuggerUrl);
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    if (process.env.SOLAR_VISUAL_TEST === "1") {
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
        source: `
          (() => {
            let seed = 0x5eed1234;
            Math.random = () => {
              seed = (1664525 * seed + 1013904223) >>> 0;
              return seed / 4294967296;
            };
          })();
        `,
      });
    }
    await cdp.send("Page.bringToFront");
    await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true });

    for (const scenario of scenarios) {
      await preparePage(cdp, scenario);
      const state = await runScenarioAction(cdp, scenario);
      const screenshotFile = `${scenario.id}.png`;
      const screenshotBytes = await captureScreenshot(cdp, join(outDir, screenshotFile));
      const failures = checkScenario(scenario, state, screenshotBytes);
      summary.scenarios.push({
        id: scenario.id,
        viewport: scenario.viewport,
        screenshotFile,
        screenshotBytes,
        canvasCount: state.canvases.length,
        biggestCanvasArea: Math.max(0, ...state.canvases.map((canvas) => canvas.area)),
        spacecraftButtons: state.spacecraftButtons,
        exportButtons: state.exportButtons,
        ok: failures.length === 0,
        failures,
      });
      console.log(`${failures.length === 0 ? "PASS" : "FAIL"} ${scenario.id}`);
      if (failures.length) console.log(`  ${failures.join("; ")}`);
    }
    cdp.close();
  } finally {
    writeFileSync(join(outDir, "visual-summary.json"), JSON.stringify(summary, null, 2));
    chrome.kill();
    killProcessTree(server);
    setTimeout(() => {
      try {
        rmSync(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 120 });
      } catch {}
    }, 300);
  }

  const failed = summary.scenarios.filter((scenario) => !scenario.ok);
  if (failed.length) {
    console.error(`Visual acceptance failed: ${failed.map((scenario) => scenario.id).join(", ")}`);
    process.exit(1);
  }
  console.log(`Visual acceptance passed. Artifacts: ${outDir}`);
}

main().catch((err) => {
  console.error(err?.stack ?? String(err));
  process.exit(1);
});
