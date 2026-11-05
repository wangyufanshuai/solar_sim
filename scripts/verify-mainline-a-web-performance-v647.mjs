import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeFile, sha256 } from "./mainline-a-release-evidence.mjs";

const SCHEMA = "mainline-a-web-performance-v647";
const RAW_SCHEMA = "mainline-a-web-frame-raw-v647";
const SAMPLE_COUNT = 120;
const EXPECTED_VIEWPORTS = Object.freeze({ desktop: [1280, 720], mobileViewport: [390, 844] });

function assert(value, code) { if (!value) throw new Error(`web-performance-v647:${code}`); }
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }

async function readPinned(root, relative, maxBytes = 2 * 1024 * 1024) {
  const file = await safeFile(root, relative);
  assert(file.stat.size > 0 && file.stat.size <= maxBytes, `size-invalid:${relative}`);
  const bytes = await readFile(file.absolute);
  return { raw: JSON.parse(bytes.toString("utf8")), descriptor: { path: file.relative, bytes: bytes.length, sha256: sha256(bytes) } };
}

function rounded(value) { return Number(value.toFixed(3)); }
function percentile(sorted, fraction) {
  const rank = Math.ceil(sorted.length * fraction) - 1;
  return rounded(sorted[Math.max(0, Math.min(sorted.length - 1, rank))]);
}

export function replayWebFrameSampleV647(raw, build, device) {
  assert(Object.hasOwn(EXPECTED_VIEWPORTS, device), `device-invalid:${device}`);
  assert(raw?.schema === RAW_SCHEMA && raw.surface === "Playwright CLI Chrome local", `schema-invalid:${device}`);
  assert(raw.visibility === "visible" && raw.atlasOpen === true, `surface-not-visible:${device}`);
  assert(same(raw.viewport, EXPECTED_VIEWPORTS[device]), `viewport-invalid:${device}`);
  assert(raw.runtimeBuildId === build.runtimeBuildId, `build-drift:${device}`);
  let url;
  try { url = new URL(raw.url); } catch { throw new Error(`web-performance-v647:url-invalid:${device}`); }
  assert(url.protocol === "http:" && url.hostname === "127.0.0.1" && url.pathname === "/", `url-invalid:${device}`);
  const started = Date.parse(raw.startedAt);
  const ended = Date.parse(raw.endedAt);
  assert(Number.isFinite(started) && Number.isFinite(ended) && ended > started, `duration-invalid:${device}`);
  assert(Array.isArray(raw.frameIntervalsMs) && raw.frameIntervalsMs.length === SAMPLE_COUNT,
    `sample-count-invalid:${device}`);
  assert(raw.frameIntervalsMs.every((value) => typeof value === "number" && Number.isFinite(value)
    && value > 0 && value < 1000), `sample-value-invalid:${device}`);
  const sorted = [...raw.frameIntervalsMs].sort((left, right) => left - right);
  const sum = sorted.reduce((total, value) => total + value, 0);
  const elapsed = ended - started;
  assert(sum >= elapsed * 0.6 && sum <= elapsed * 1.25, `sample-clock-drift:${device}`);
  assert(raw.claims?.productionPerformance === false
    && raw.claims?.realUserValidation === false
    && raw.claims?.scientificValidity === false
    && raw.claims?.legalClearance === false, `claim-promotion:${device}`);
  const heap = [raw.initialHeapBytes, raw.finalHeapBytes];
  assert(heap.every((value) => value === null || Number.isSafeInteger(value) && value >= 0),
    `heap-invalid:${device}`);
  return Object.freeze({
    device,
    viewport: raw.viewport,
    startedAt: raw.startedAt,
    endedAt: raw.endedAt,
    elapsedMs: elapsed,
    sampleCount: SAMPLE_COUNT,
    frameIntervalMs: Object.freeze({
      mean: rounded(sum / sorted.length),
      p50: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      max: rounded(sorted.at(-1)),
      above16_7ms: sorted.filter((value) => value > 16.7).length,
      above33_4ms: sorted.filter((value) => value > 33.4).length,
    }),
    jsHeap: Object.freeze({ initialBytes: heap[0], finalBytes: heap[1],
      deltaBytes: heap[0] === null || heap[1] === null ? null : heap[1] - heap[0] }),
  });
}

export async function buildWebPerformanceReceiptV647(root, paths) {
  const [buildFile, desktopFile, mobileFile] = await Promise.all([
    readPinned(root, paths.build, 2 * 1024 * 1024),
    readPinned(root, paths.desktopRaw),
    readPinned(root, paths.mobileRaw),
  ]);
  const build = buildFile.raw;
  assert(build.status === "passed" && build.exitCode === 0 && build.sourceStable === true,
    "build-not-passed");
  assert(build.inputBefore?.sha256 === build.inputAfterSha256, "build-source-drift");
  const current = await captureBuildInputs();
  assert(current.sha256 === build.inputAfterSha256, "current-source-drift");
  const desktop = replayWebFrameSampleV647(desktopFile.raw, build, "desktop");
  const mobileViewport = replayWebFrameSampleV647(mobileFile.raw, build, "mobileViewport");
  assert(Date.parse(mobileViewport.endedAt) <= Date.parse(desktop.startedAt), "capture-order-invalid");
  return {
    schema: SCHEMA,
    status: "measured-local",
    evidenceClass: "performance",
    sourceSha256: current.sha256,
    build: { buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
      report: buildFile.descriptor },
    raw: { desktop: desktopFile.descriptor, mobileViewport: mobileFile.descriptor },
    measurements: { desktop, mobileViewport },
    longRunStatus: "historical-needs-rerun-for-current-source",
    physicalMobile: "not-run",
    claims: { productionPerformance: false, realUserValidation: false,
      scientificValidity: false, legalClearance: false },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false },
  };
}

function args(argv) {
  const permitted = new Set(["build", "desktop-raw", "mobile-raw", "output", "check", "json"]);
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index]?.replace(/^--/, "");
    if (!argv[index]?.startsWith("--") || !permitted.has(key) || Object.hasOwn(options, key)) {
      throw new Error(`web-performance-v647:option-invalid:${argv[index]}`);
    }
    if (key === "check" || key === "json") options[key] = true;
    else options[key] = argv[++index];
  }
  for (const key of ["build", "desktop-raw", "mobile-raw", "output"]) {
    assert(typeof options[key] === "string" && options[key].length > 0, `missing-${key}`);
  }
  return options;
}

async function main() {
  const options = args(process.argv.slice(2));
  const root = process.cwd();
  const receipt = await buildWebPerformanceReceiptV647(root, {
    build: options.build, desktopRaw: options["desktop-raw"], mobileRaw: options["mobile-raw"],
  });
  const output = await safeFile(root, options.output).catch(() => null);
  if (options.check) {
    assert(output !== null && same(JSON.parse(await readFile(output.absolute, "utf8")), receipt), "receipt-replay-mismatch");
  } else {
    assert(output === null, "receipt-already-exists");
    const target = path.resolve(root, options.output);
    assert(target.startsWith(`${root}${path.sep}`), "output-escape");
    await writeFile(target, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  }
  console.log(options.json ? JSON.stringify(receipt, null, 2)
    : `Web performance V647: ${receipt.status}; desktop p95=${receipt.measurements.desktop.frameIntervalMs.p95}ms mobile p95=${receipt.measurements.mobileViewport.frameIntervalMs.p95}ms`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
