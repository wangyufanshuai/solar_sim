import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const targetUrl = process.argv[2] ?? process.env.SOLAR_PERF_URL ?? "http://127.0.0.1:3002/";
const port = Number(process.env.SOLAR_PERF_CDP_PORT ?? (9300 + Math.floor(Math.random() * 400)));

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

const pageProbe = String.raw`
async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let canvas = document.querySelector("canvas");
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => {
    errors.push(args.map(String).join(" "));
    originalError(...args);
  };
  function frameSample(durationMs, drive) {
    return new Promise((resolve) => {
      const samples = [];
      let last = performance.now();
      const start = last;
      let frame = 0;
      let done = false;
      const finish = (forced = false) => {
        if (done) return;
        done = true;
        const sorted = samples.slice().sort((a, b) => a - b);
        const avg = samples.reduce((a, b) => a + b, 0) / Math.max(1, samples.length);
        resolve({
          forced,
          frames: samples.length,
          avgMs: Number(avg.toFixed(2)),
          maxMs: Number((samples.length ? Math.max(...samples) : 0).toFixed(2)),
          p95Ms: Number((sorted[Math.floor(sorted.length * 0.95)] ?? 0).toFixed(2)),
          long50: samples.filter((v) => v > 50).length,
          long100: samples.filter((v) => v > 100).length,
          fpsApprox: Number((1000 / Math.max(avg, 1)).toFixed(1)),
        });
      };
      setTimeout(() => finish(true), durationMs + 5000);
      function tick(now) {
        if (done) return;
        const dt = Math.max(0, now - last);
        samples.push(dt);
        last = now;
        if (drive) drive(frame++, now - start);
        if (now - start < durationMs) {
          requestAnimationFrame(tick);
        } else {
          finish(false);
        }
      }
      requestAnimationFrame(tick);
    });
  }
  function pressText(text) {
    const candidates = Array.isArray(text) ? text : [text];
    const needles = candidates.map((item) => item.toLowerCase());
    const el = Array.from(document.querySelectorAll("button,[role=button]"))
      .find((node) => {
        const value = (node.textContent || "").toLowerCase();
        return needles.some((needle) => value.includes(needle));
      });
    if (el) {
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return true;
    }
    return false;
  }
  const canvasDeadline = performance.now() + 60000;
  while (!canvas && performance.now() < canvasDeadline) {
    await sleep(250);
    canvas = document.querySelector("canvas");
  }
  await sleep(1600);
  const idle = await frameSample(5000);
  const box = canvas?.getBoundingClientRect();
  const rotate = box ? await frameSample(7000, (frame) => {
    if (frame === 0) canvas.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 1, pointerType: "mouse", clientX: box.left + box.width * 0.5, clientY: box.top + box.height * 0.5, buttons: 1 }));
    const x = box.left + box.width * (0.42 + 0.26 * Math.sin(frame / 10));
    const y = box.top + box.height * (0.48 + 0.13 * Math.cos(frame / 15));
    canvas.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 1, pointerType: "mouse", clientX: x, clientY: y, buttons: 1 }));
    if (frame > 390) canvas.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1, pointerType: "mouse", clientX: x, clientY: y, buttons: 0 }));
  }) : null;
  const zoom = box ? await frameSample(5000, (frame) => {
    if (frame % 4 === 0) canvas.dispatchEvent(new WheelEvent("wheel", { bubbles: true, clientX: box.left + box.width * 0.5, clientY: box.top + box.height * 0.5, deltaY: frame % 8 === 0 ? -140 : 120, deltaMode: 0 }));
  }) : null;
  pressText(["Mission", "任务"]);
  await sleep(600);
  pressText(["Optimize", "优化"]);
  await sleep(2200);
  const missionRotate = box ? await frameSample(5000, (frame) => {
    if (frame === 0) canvas.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 2, pointerType: "mouse", clientX: box.left + box.width * 0.54, clientY: box.top + box.height * 0.5, buttons: 1 }));
    const x = box.left + box.width * (0.52 + 0.2 * Math.sin(frame / 11));
    const y = box.top + box.height * (0.48 + 0.1 * Math.cos(frame / 17));
    canvas.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 2, pointerType: "mouse", clientX: x, clientY: y, buttons: 1 }));
    if (frame > 280) canvas.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 2, pointerType: "mouse", clientX: x, clientY: y, buttons: 0 }));
  }) : null;
  pressText(["View", "视图", "图层"]);
  await sleep(200);
  const safeClicked = pressText("Safe");
  await sleep(800);
  const safeIdle = await frameSample(3000);
  console.error = originalError;
  return {
    url: location.href,
    canvasFound: Boolean(canvas),
    idle,
    rotate,
    zoom,
    missionRotate,
    safeClicked,
    safeIdle,
    errors: errors.slice(0, 10),
    textSample: document.body.innerText.slice(0, 700),
  };
}`;

async function main() {
  const chromePath = chromeCandidates.find(Boolean);
  if (!chromePath) {
    console.error("No Chrome or Edge executable found. Set CHROME_PATH and retry.");
    process.exit(1);
  }
  const userDataDir = mkdtempSync(join(tmpdir(), "solar-perf-chrome-"));
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
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
    if (!page?.webSocketDebuggerUrl) throw new Error("No debuggable page found");
    const cdp = await createCdp(page.webSocketDebuggerUrl);
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    await cdp.send("Page.bringToFront");
    await cdp.send("Page.navigate", { url: targetUrl });
    await sleep(1200);
    const result = await cdp.send("Runtime.evaluate", {
      expression: `(${pageProbe})()`,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log(JSON.stringify(result.result.value, null, 2));
    cdp.close();
  } finally {
    chrome.kill();
    setTimeout(() => {
      try {
        rmSync(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 120 });
      } catch {
        // Chrome can hold a cache file briefly after kill; leave the temp dir rather than fail the perf run.
      }
    }, 300);
  }
}

main().catch((err) => {
  console.error(err?.stack ?? String(err));
  process.exit(1);
});
