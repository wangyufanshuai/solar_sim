import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { inflateSync } from "node:zlib";
import { jsonBytes, safeFile, sha256, writeExclusiveJson } from "./mainline-a-release-evidence.mjs";

export const BROWSER_RAW_SCHEMA_V645 = "mainline-a-browser-raw-dom-v645";
export const BROWSER_EVIDENCE_SCHEMA_V645 = "mainline-a-browser-evidence-v645";
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const DEVICES = Object.freeze({ desktop: "desktop", mobileViewport: "mobile viewport" });

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`missing-${field}`);
  return value;
}

function parseArgs(argv) {
  const allowed = new Set(["build", "desktop-raw", "desktop-shot", "mobile-raw", "mobile-shot", "output", "check", "json"]);
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const name = argv[i]?.replace(/^--/u, "");
    if (!argv[i]?.startsWith("--") || !allowed.has(name) || Object.hasOwn(options, name)) throw new Error(`invalid-option:${argv[i]}`);
    if (name === "check" || name === "json") options[name] = true;
    else options[name] = requiredText(argv[++i], name);
  }
  for (const name of ["build", "desktop-raw", "desktop-shot", "mobile-raw", "mobile-shot"]) requiredText(options[name], name);
  if (!options.check) requiredText(options.output, "output");
  return options;
}

async function readWorkspaceFile(workspace, requested, maxBytes = 16 * 1024 * 1024) {
  const file = await safeFile(workspace, requested);
  if (file.stat.size <= 0 || file.stat.size > maxBytes) throw new Error(`browser-file-size-invalid:${file.relative}`);
  const bytes = await readFile(file.absolute);
  return { ...file, bytes, reference: { path: file.relative, bytes: bytes.length, sha256: sha256(bytes) } };
}

function pngCrc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function pngDimensionsV645(bytes) {
  if (bytes.length < 68 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("screenshot-not-png");
  let offset = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  let ended = false;
  const imageData = [];
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (length > 16 * 1024 * 1024 || end > bytes.length) throw new Error("screenshot-chunk-invalid");
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const payload = bytes.subarray(offset + 8, offset + 8 + length);
    const actualCrc = pngCrc32(bytes.subarray(offset + 4, offset + 8 + length));
    if (actualCrc !== bytes.readUInt32BE(offset + 8 + length)) throw new Error("screenshot-crc-invalid");
    if (offset === 8 && (type !== "IHDR" || length !== 13)) throw new Error("screenshot-header-invalid");
    if (type === "IHDR") {
      if (offset !== 8 || length !== 13) throw new Error("screenshot-header-invalid");
      width = payload.readUInt32BE(0);
      height = payload.readUInt32BE(4);
      const depth = payload[8];
      const color = payload[9];
      channels = color === 2 ? 3 : color === 6 ? 4 : 0;
      if (width < 1 || height < 1 || width > 16384 || height > 16384) throw new Error("screenshot-dimensions-invalid");
      if (depth !== 8 || !channels || payload[10] !== 0 || payload[11] !== 0 || payload[12] !== 0) {
        throw new Error("screenshot-format-unsupported");
      }
    } else if (type === "IDAT") imageData.push(payload);
    else if (type === "IEND") {
      if (length !== 0 || end !== bytes.length) throw new Error("screenshot-end-invalid");
      ended = true;
      break;
    }
    offset = end;
  }
  if (!ended || !imageData.length) throw new Error("screenshot-image-data-missing");
  const expectedBytes = height * (1 + width * channels);
  if (expectedBytes > 256 * 1024 * 1024) throw new Error("screenshot-image-too-large");
  let pixels;
  try { pixels = inflateSync(Buffer.concat(imageData), { maxOutputLength: expectedBytes + 1 }); }
  catch { throw new Error("screenshot-image-data-invalid"); }
  if (pixels.length !== expectedBytes) throw new Error("screenshot-image-size-invalid");
  return [width, height];
}

function exactViewport(raw, device) {
  const viewport = raw?.viewport;
  const dom = raw?.dom;
  if (!Array.isArray(viewport) || viewport.length !== 2
    || viewport.some((value) => !Number.isSafeInteger(value) || value <= 0)
    || dom?.clientWidth !== viewport[0] || dom?.clientHeight !== viewport[1]
    || dom?.scrollWidth > viewport[0] || dom?.scrollHeight < viewport[1]) {
    throw new Error(`browser-viewport-invalid:${device}`);
  }
  if (device === "desktop" && viewport[0] < 1024) throw new Error("desktop-viewport-too-small");
  if (device === "mobileViewport" && (viewport[0] > 600 || viewport[1] < 600)) throw new Error("mobile-viewport-invalid");
  return viewport;
}

export function validateBrowserRawV645(raw, build, device) {
  if (raw?.schema !== BROWSER_RAW_SCHEMA_V645 || raw.surface !== "Playwright CLI Chrome local") {
    throw new Error(`browser-raw-schema-invalid:${device}`);
  }
  if (!Number.isFinite(Date.parse(raw.capturedAt)) || raw.documentVisibility !== "visible") {
    throw new Error(`browser-not-visible:${device}`);
  }
  const url = new URL(raw.url);
  if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || url.pathname !== "/") {
    throw new Error(`browser-url-invalid:${device}`);
  }
  const viewport = exactViewport(raw, device);
  const dom = raw.dom;
  if (dom.markers?.shell !== true || dom.markers?.scientificPayloadWriteback !== "false"
    || dom.markers?.releaseBoundary !== "candidate-only-hold-not-admitted") {
    throw new Error(`browser-boundary-invalid:${device}`);
  }
  const identity = dom.build;
  if (identity?.runtimeBuildId !== build.runtimeBuildId || identity?.branch !== build.branch || identity?.head !== build.head) {
    throw new Error(`browser-build-mismatch:${device}`);
  }
  if (raw.claims?.productionPerformance !== false || raw.claims?.realUserValidation !== false
    || raw.claims?.scientificValidity !== false || raw.claims?.legalClearance !== false) {
    throw new Error(`browser-claim-promotion:${device}`);
  }
  return { viewport, dom, url: raw.url };
}

export async function collectBrowserDeviceV645(workspace, build, device, rawPath, screenshotPath) {
  if (!Object.hasOwn(DEVICES, device)) throw new Error(`unsupported-device:${device}`);
  const rawFile = await readWorkspaceFile(workspace, rawPath, 2 * 1024 * 1024);
  const screenshot = await readWorkspaceFile(workspace, screenshotPath);
  const raw = JSON.parse(rawFile.bytes.toString("utf8"));
  const verified = validateBrowserRawV645(raw, build, device);
  const imageSize = pngDimensionsV645(screenshot.bytes);
  if (imageSize[0] !== verified.viewport[0] || imageSize[1] !== verified.viewport[1]) {
    throw new Error(`screenshot-viewport-mismatch:${device}`);
  }
  return {
    status: "passed", device: DEVICES[device], viewport: verified.viewport,
    url: verified.url, capturedAt: raw.capturedAt, dom: verified.dom,
    screenshot: { ...screenshot.reference, imageSize },
    rawCapture: rawFile.reference,
    sceneActivity: raw.sceneActivity ?? null,
  };
}

export async function collectBrowserEvidenceV645(workspace, paths) {
  const buildFile = await readWorkspaceFile(workspace, paths.build);
  const build = JSON.parse(buildFile.bytes.toString("utf8"));
  if (build.status !== "passed" || build.exitCode !== 0 || build.sourceStable !== true
    || !build.runtimeBuildId || !build.buildId || !build.head || !build.branch) {
    throw new Error("build-receipt-not-passed");
  }
  const desktop = await collectBrowserDeviceV645(workspace, build, "desktop", paths.desktopRaw, paths.desktopShot);
  const mobileViewport = await collectBrowserDeviceV645(workspace, build, "mobileViewport", paths.mobileRaw, paths.mobileShot);
  if (desktop.url !== mobileViewport.url) throw new Error("browser-device-url-drift");
  if (Date.parse(mobileViewport.capturedAt) <= Date.parse(desktop.capturedAt)) throw new Error("browser-capture-order-invalid");
  return {
    schema: BROWSER_EVIDENCE_SCHEMA_V645, status: "passed", generatedAt: new Date().toISOString(),
    evidenceClass: "browser", browser: "Playwright CLI Chrome local", browserPermissionBypass: false,
    toolResult: { isError: false, source: "local-playwright-cli-eval-and-screenshot", rawOutputsPinned: true },
    navigationSucceeded: true, domInspection: "observed", url: desktop.url,
    build: { buildId: build.buildId, runtimeBuildId: build.runtimeBuildId, branch: build.branch, head: build.head },
    buildReceipt: buildFile.reference,
    desktop, mobileViewport, physicalMobile: "not-run",
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false,
      parentGitMutation: false, physicsKernelMutation: false },
    claims: { realUserValidation: false, productionPerformance: false, scientificValidity: false, legalClearance: false },
    notes: ["Local browser DOM and PNG dimensions are cross-checked against one preserved build.",
      "This receipt does not establish a 30-minute performance result, physical-device result, rights approval or real-user validation."],
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const workspace = process.cwd();
  const receipt = await collectBrowserEvidenceV645(workspace, {
    build: options.build, desktopRaw: options["desktop-raw"], desktopShot: options["desktop-shot"],
    mobileRaw: options["mobile-raw"], mobileShot: options["mobile-shot"],
  });
  if (!options.check) await writeExclusiveJson(workspace, options.output, receipt);
  console.log(options.json ? JSON.stringify(receipt, null, 2) : `R66 browser: ${receipt.status} desktop=${receipt.desktop.viewport.join("x")} mobile=${receipt.mobileViewport.viewport.join("x")} sha256=${sha256(jsonBytes(receipt))}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
