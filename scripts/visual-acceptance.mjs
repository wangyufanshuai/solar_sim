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
  { id: "showcase-tour", viewport: { width: 1280, height: 900 }, action: "tour", expect: ["canvas", "tour"] },
  { id: "mission-audit", viewport: { width: 1280, height: 900 }, action: "mission", expect: ["canvas", "missionAudit"] },
  { id: "spacecraft-gallery", viewport: { width: 1280, height: 900 }, action: "gallery", expect: ["canvas", "gallery"] },
  { id: "gallery-all-models", viewport: { width: 1280, height: 900 }, action: "galleryAll", expect: ["canvas", "gallery", "galleryAll"] },
  { id: "gallery-cover-v3", viewport: { width: 1280, height: 900 }, action: "galleryCoverV3", expect: ["canvas", "gallery", "galleryCoverV3"] },
  { id: "mission-compare", viewport: { width: 1280, height: 900 }, action: "missionCompare", expect: ["canvas", "missionCompare"] },
  { id: "ccsds-export", viewport: { width: 1280, height: 900 }, action: "ccsdsExport", expect: ["canvas", "ccsdsExport"] },
  { id: "mission-review", viewport: { width: 1280, height: 900 }, action: "missionReview", expect: ["canvas", "missionReview"] },
  { id: "trajectory-inspector", viewport: { width: 1280, height: 900 }, action: "trajectoryInspector", expect: ["canvas", "trajectoryInspector"] },
  { id: "cinematic-post", viewport: { width: 1280, height: 900 }, action: "cinematicPost", expect: ["canvas", "cinematicPost"] },
  { id: "sky-atlas-search", viewport: { width: 1280, height: 900 }, action: "skyAtlasSearch", expect: ["canvas", "skyAtlas"] },
  { id: "sky-atlas-route", viewport: { width: 1280, height: 900 }, action: "skyAtlasRoute", expect: ["canvas", "skyAtlas", "atlasRoute"] },
  { id: "sky-atlas-target-card", viewport: { width: 1280, height: 900 }, action: "skyAtlasTarget", expect: ["canvas", "skyAtlas", "atlasTarget"] },
  { id: "atlas-cover", viewport: { width: 1280, height: 900 }, action: "atlasCover", expect: ["canvas", "skyAtlas", "atlasCover"] },
  { id: "sky-atlas-map", viewport: { width: 1280, height: 900 }, action: "skyAtlasMap", expect: ["canvas", "skyAtlas", "atlasMap"] },
  { id: "sky-atlas-route-builder", viewport: { width: 1280, height: 900 }, action: "skyAtlasRouteBuilder", expect: ["canvas", "skyAtlas", "atlasRouteBuilder"] },
  { id: "sky-atlas-route-export", viewport: { width: 1280, height: 900 }, action: "skyAtlasRouteExport", expect: ["canvas", "skyAtlas", "atlasRouteExport"] },
  { id: "sky-atlas-map-target-sync", viewport: { width: 1280, height: 900 }, action: "skyAtlasMapTargetSync", expect: ["canvas", "skyAtlas", "atlasMap", "atlasTarget"] },
  { id: "atlas-cover-metadata", viewport: { width: 1280, height: 900 }, action: "atlasCoverMetadata", expect: ["canvas", "skyAtlas", "atlasCoverMetadata"] },
  { id: "sun-closeup", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 0, expect: ["canvas"] },
  { id: "earth-closeup", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 3, expect: ["canvas"] },
  { id: "moon-closeup", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 4, expect: ["canvas"] },
  { id: "jupiter-closeup", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 6, expect: ["canvas"] },
  { id: "saturn-closeup", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 7, expect: ["canvas"] },
  { id: "sun-closeup-v3", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 0, expect: ["canvas"] },
  { id: "earth-closeup-v3", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 3, expect: ["canvas"] },
  { id: "jupiter-closeup-v3", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 6, expect: ["canvas"] },
  { id: "saturn-closeup-v3", viewport: { width: 1280, height: 900 }, action: "focus", bodyIndex: 7, expect: ["canvas"] },
  { id: "mobile-mission", viewport: { width: 390, height: 844, mobile: true }, action: "mobileMission", expect: ["canvas", "missionAudit"] },
  { id: "mobile-atlas", viewport: { width: 390, height: 844, mobile: true }, action: "mobileAtlas", expect: ["canvas", "skyAtlas"] },
  { id: "sky-atlas-map-mobile", viewport: { width: 390, height: 844, mobile: true }, action: "skyAtlasMapMobile", expect: ["canvas", "skyAtlas", "atlasMap"] },
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

    await waitFor(() => document.querySelector("canvas"), 90000);
    if (scenarioArg.action === "balanced") {
      await waitFor(
        () => performance.getEntriesByType("mark").some((entry) =>
          entry.name === "solar:preview-sky-ready" || entry.name === "solar:sky-ready"
        ),
        45000,
      );
      await sleep(900);
    }
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
      await sleep(3600);
      pressText("report");
      await sleep(500);
    }
    if (scenarioArg.action === "tour") {
      press('[data-solar-section="tools"]');
      await sleep(350);
      if (new URLSearchParams(location.search).get("visualTest") === "1") {
        await sleep(900);
      } else {
        press('[data-solar-action="cinematic-tour"]');
        await sleep(4200);
      }
    }
    const visualTest = new URLSearchParams(location.search).get("visualTest") === "1";
    if (scenarioArg.action === "gallery" || scenarioArg.action === "galleryAll" || scenarioArg.action === "galleryCoverV3") {
      press('[data-solar-section="tools"]');
      await sleep(300);
      press('[data-solar-action="gallery-toggle"]');
      await waitFor(() => document.querySelectorAll("[data-solar-spacecraft]").length >= 8, 45000);
      const buttons = [...document.querySelectorAll("[data-solar-spacecraft]")];
      if (scenarioArg.action === "galleryAll") {
        if (!visualTest) {
          for (const button of buttons) {
            button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            await sleep(900);
            if (/Model preview unavailable/i.test(document.body.innerText)) break;
          }
        }
      } else {
        buttons[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await sleep(1200);
        buttons[7]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await sleep(2200);
      }
      if (scenarioArg.action === "galleryCoverV3") {
        await waitFor(() => Boolean(document.querySelector("[data-solar-gallery-metadata]")), 10000);
        await sleep(500);
      }
    }
    if (scenarioArg.action === "missionCompare") {
      press('[data-solar-section="mission"]');
      await sleep(400);
      press('[data-solar-action="mission-optimize"]');
      await sleep(4200);
      pressText("compare");
      await sleep(500);
    }
    if (scenarioArg.action === "ccsdsExport") {
      press('[data-solar-section="mission"]');
      await sleep(400);
      press('[data-solar-action="mission-optimize"]');
      await sleep(4200);
      pressText("report");
      await sleep(500);
      press('[data-solar-action="mission-export-oem"]');
      await sleep(250);
      press('[data-solar-action="mission-export-opm"]');
      await sleep(250);
    }
    if (scenarioArg.action === "missionReview" || scenarioArg.action === "trajectoryInspector") {
      press('[data-solar-section="mission"]');
      await sleep(400);
      press('[data-solar-action="mission-optimize"]');
      await sleep(4200);
      pressText("review");
      await sleep(500);
      press('[data-solar-action="mission-monte-carlo"]');
      await sleep(1200);
      if (scenarioArg.action === "trajectoryInspector") {
        press('[data-solar-action="mission-trajectory-inspect"]');
        await sleep(300);
      }
    }
    if (scenarioArg.action === "cinematicPost") {
      press('[data-solar-section="view"]');
      await sleep(350);
      if (!visualTest) {
        press('[data-solar-action="budget-quality"]');
        await sleep(900);
      }
      press('[data-solar-section="tools"]');
      await sleep(350);
      if (!visualTest) press('[data-solar-action="post-tour-cover"]');
      await sleep(1200);
    }
    if ([
      "skyAtlasSearch",
      "skyAtlasRoute",
      "skyAtlasTarget",
      "atlasCover",
      "mobileAtlas",
      "skyAtlasMap",
      "skyAtlasMapMobile",
      "skyAtlasRouteBuilder",
      "skyAtlasRouteExport",
      "skyAtlasMapTargetSync",
      "atlasCoverMetadata",
    ].includes(scenarioArg.action)) {
      press('[data-solar-section="atlas"]');
      await sleep(650);
      const input = document.querySelector('[data-solar-action="atlas-search-input"]');
      if (input && (scenarioArg.action === "skyAtlasSearch" || scenarioArg.action === "mobileAtlas" || scenarioArg.action === "skyAtlasMapMobile")) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        setter?.call(input, "orion");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(500);
      }
      if (scenarioArg.action === "skyAtlasMap") {
        press('[data-solar-action="atlas-projection-equatorial"]');
        await sleep(300);
        press('[data-solar-action="atlas-projection-galactic"]');
        await sleep(500);
      }
      if (scenarioArg.action === "skyAtlasRoute") {
        press('[data-solar-action="atlas-route-play"]');
        await sleep(1800);
      }
      if (scenarioArg.action === "skyAtlasRouteBuilder" || scenarioArg.action === "skyAtlasRouteExport") {
        press('[data-solar-action="atlas-route-add"]');
        await sleep(250);
        if (scenarioArg.action === "skyAtlasRouteExport") {
          press('[data-solar-action="atlas-route-export-json"]');
          await sleep(250);
          press('[data-solar-action="atlas-route-export-md"]');
          await sleep(250);
        }
      }
      if (scenarioArg.action === "skyAtlasMapTargetSync") {
        const first = document.querySelector("[data-solar-atlas-object]");
        first?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await sleep(600);
        if (!visualTest) press('[data-solar-action="atlas-fly-target"]');
        await sleep(1400);
      }
      if (scenarioArg.action === "skyAtlasTarget") {
        press('[data-solar-action="atlas-fly-target"]');
        await sleep(1600);
      }
      if (scenarioArg.action === "atlasCover" || scenarioArg.action === "atlasCoverMetadata") {
        press('[data-solar-action="atlas-cover"]');
        await sleep(350);
      }
    }
    if (scenarioArg.action === "focus") {
      await waitFor(
        () => performance.getEntriesByName("solar:preview-planets-ready", "mark").length > 0,
        45000,
      );
      window.dispatchEvent(new CustomEvent("solar-sim-camera-focus-body", {
        detail: { bodyIndex: scenarioArg.bodyIndex, mode: "inspect" },
      }));
      await sleep(new URLSearchParams(location.search).get("visualTest") === "1" ? 7600 : 3800);
    }

    const text = document.body.textContent ?? "";
    const canvases = [...document.querySelectorAll("canvas")].map((canvas) => {
      const rect = canvas.getBoundingClientRect();
      return { width: Math.round(rect.width), height: Math.round(rect.height), area: Math.round(rect.width * rect.height) };
    });
    const spacecraftButtons = document.querySelectorAll("[data-solar-spacecraft]").length;
    const galleryV2 = Boolean(document.querySelector('[data-solar-gallery="v2"], [data-solar-gallery="v3"]'));
    const galleryV3 = Boolean(document.querySelector('[data-solar-gallery="v3"]'));
    const galleryMetadata = Boolean(document.querySelector("[data-solar-gallery-metadata]"));
    const galleryCoverExport = Boolean(document.querySelector('[data-solar-action="gallery-cover-export"]'));
    const missionCompare = Boolean(document.querySelector("[data-solar-mission-compare]"));
    const missionReview = Boolean(document.querySelector("[data-solar-mission-review]"));
    const trajectoryButtons = document.querySelectorAll('[data-solar-action="mission-trajectory-inspect"]').length;
    const postButtons = document.querySelectorAll('[data-solar-action^="post-"]').length;
    const ccsdsButtons = document.querySelectorAll(
      '[data-solar-action="mission-export-oem"], [data-solar-action="mission-export-opm"]',
    ).length;
    const skyAtlasPanel = Boolean(document.querySelector('[data-solar-panel="sky-atlas"]'));
    const skyAtlasTargetCard = Boolean(document.querySelector("[data-solar-atlas-target-card]"));
    const skyAtlasHud = Boolean(document.querySelector("[data-solar-atlas-flight-hud]"));
    const skyAtlasObjects = document.querySelectorAll("[data-solar-atlas-object]").length;
    const skyAtlasCoverButton = Boolean(document.querySelector('[data-solar-action="atlas-cover"]'));
    const skyAtlasMap = Boolean(document.querySelector("[data-solar-atlas-map]"));
    const skyAtlasRouteBuilder = Boolean(document.querySelector("[data-solar-atlas-route-builder]"));
    const skyAtlasRouteExportButtons = document.querySelectorAll(
      '[data-solar-action="atlas-route-export-json"], [data-solar-action="atlas-route-export-md"]',
    ).length;
    const skyAtlasProjectionButtons = document.querySelectorAll('[data-solar-action^="atlas-projection-"]').length;
    const exportButtons = document.querySelectorAll("[data-solar-action*='export']").length;
    const hasFrameworkOverlay = /Unhandled Runtime Error|Build Error|Next\\.js|Hydration failed/i.test(text);
    return {
      text,
      canvases,
      spacecraftButtons,
      exportButtons,
      galleryV2,
      galleryV3,
      galleryMetadata,
      galleryCoverExport,
      missionCompare,
      missionReview,
      trajectoryButtons,
      postButtons,
      ccsdsButtons,
      skyAtlasPanel,
      skyAtlasTargetCard,
      skyAtlasHud,
      skyAtlasObjects,
      skyAtlasCoverButton,
      skyAtlasMap,
      skyAtlasRouteBuilder,
      skyAtlasRouteExportButtons,
      skyAtlasProjectionButtons,
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
    if (!/Mission Engineering (Audit|Workbench)/i.test(state.text)) failures.push("mission panel missing");
    if (!/SPICE table|JPL Horizons table interpolation|Ephemeris audit|Solver provenance/i.test(state.text)) {
      failures.push("ephemeris audit provenance missing");
    }
    if (state.exportButtons < 2) failures.push("mission report export buttons missing");
  }
  if (scenario.expect.includes("gallery")) {
    if (!/SPACECRAFT GALLERY/i.test(state.text)) failures.push("spacecraft gallery missing");
    if (!state.galleryV2) failures.push("spacecraft gallery marker missing");
    if (state.spacecraftButtons < 8) failures.push(`expected at least 8 spacecraft buttons, saw ${state.spacecraftButtons}`);
  }
  if (scenario.expect.includes("galleryCoverV3")) {
    if (!state.galleryV3) failures.push("spacecraft gallery v3 marker missing");
    if (!state.galleryMetadata) failures.push("gallery v3 metadata marker missing");
    if (!state.galleryCoverExport) failures.push("gallery cover export action missing");
    if (!/gallery-v3-studio|Export gallery cover/i.test(state.text)) failures.push("gallery v3 cover metadata copy missing");
  }
  if (scenario.expect.includes("galleryAll") && /Model preview unavailable|DRACOLoader/i.test(state.text)) {
    failures.push("one or more gallery models failed to decode");
  }
  if (scenario.expect.includes("missionCompare")) {
    if (!state.missionCompare) failures.push("mission compare workspace missing");
    if (!/Run compare/i.test(state.text)) failures.push("mission compare heading missing");
  }
  if (scenario.expect.includes("ccsdsExport")) {
    if (state.ccsdsButtons < 2) failures.push("CCSDS OEM/OPM export actions missing");
  }
  if (scenario.expect.includes("missionReview")) {
    if (!state.missionReview) failures.push("mission review workspace missing");
    if (!/Monte Carlo Lite|Top review risks|Run notebook/i.test(state.text)) failures.push("mission review sections missing");
    if (!/Review JSON|Review MD/i.test(state.text)) failures.push("review export actions missing");
  }
  if (scenario.expect.includes("trajectoryInspector")) {
    if (state.trajectoryButtons < 1) failures.push("trajectory inspector actions missing");
    if (!/Trajectory inspector|Epoch TDB JD|segment/i.test(state.text)) failures.push("trajectory inspector details missing");
  }
  if (scenario.expect.includes("cinematicPost")) {
    if (state.postButtons < 4) failures.push("cinematic post profile controls missing");
    if (!/POST PROFILE|Tour cover|Export cover frame/i.test(state.text)) failures.push("cinematic post UI missing");
  }
  if (scenario.expect.includes("tour")) {
    if (!/CINEMATIC PRESETS|SPACECRAFT GALLERY|HDR stage v2|Sky Atlas Explorer|Deep Sky Flight Route/i.test(state.text)) {
      failures.push("showcase tour controls missing");
    }
  }
  if (scenario.expect.includes("skyAtlas")) {
    if (!state.skyAtlasPanel) failures.push("Sky Atlas panel missing");
    if (state.skyAtlasObjects < 4) failures.push(`expected Sky Atlas objects, saw ${state.skyAtlasObjects}`);
    if (!/Sky Atlas Explorer|Deep Sky Flight Route|Curated visual atlas/i.test(state.text)) failures.push("Sky Atlas text missing");
  }
  if (scenario.expect.includes("atlasRoute") && !state.skyAtlasHud) {
    failures.push("Sky Atlas flight HUD missing after route play");
  }
  if (scenario.expect.includes("atlasTarget") && !state.skyAtlasTargetCard) {
    failures.push("Sky Atlas target card missing");
  }
  if (scenario.expect.includes("atlasCover") && !state.skyAtlasCoverButton) {
    failures.push("Sky Atlas cover action missing");
  }
  if (scenario.expect.includes("atlasMap")) {
    if (!state.skyAtlasMap) failures.push("Sky Atlas map missing");
    if (state.skyAtlasProjectionButtons < 2) failures.push("Sky Atlas projection controls missing");
    if (!/Atlas map|mag scale|distance guide/i.test(state.text)) failures.push("Sky Atlas map copy missing");
  }
  if (scenario.expect.includes("atlasRouteBuilder")) {
    if (!state.skyAtlasRouteBuilder) failures.push("Sky Atlas route builder missing");
    if (!/Custom route builder|Add target|Clear/i.test(state.text)) failures.push("Sky Atlas route builder copy missing");
  }
  if (scenario.expect.includes("atlasRouteExport") && state.skyAtlasRouteExportButtons < 2) {
    failures.push("Sky Atlas route export actions missing");
  }
  if (scenario.expect.includes("atlasCoverMetadata")) {
    if (!state.skyAtlasCoverButton) failures.push("Sky Atlas cover metadata action missing");
    if (!new RegExp("Why visit|Source / neighbors", "i").test(state.text)) failures.push("Sky Atlas target learning card missing");
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
      let state = null;
      let screenshotBytes = 0;
      let failures = [];
      const screenshotFile = `${scenario.id}.png`;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        await preparePage(cdp, scenario);
        state = await runScenarioAction(cdp, scenario);
        screenshotBytes = await captureScreenshot(cdp, join(outDir, screenshotFile));
        failures = checkScenario(scenario, state, screenshotBytes);
        const retryable = failures.some((failure) =>
          /canvas missing|framework error overlay|loading/i.test(failure),
        );
        if (!retryable || attempt === 1) break;
        await sleep(1200);
      }
      summary.scenarios.push({
        id: scenario.id,
        viewport: scenario.viewport,
        screenshotFile,
        screenshotBytes,
        canvasCount: state?.canvases.length ?? 0,
        biggestCanvasArea: Math.max(0, ...(state?.canvases ?? []).map((canvas) => canvas.area)),
        spacecraftButtons: state?.spacecraftButtons ?? 0,
        exportButtons: state?.exportButtons ?? 0,
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
