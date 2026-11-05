import assert from "node:assert/strict";
import test from "node:test";
import { crc32, deflateSync } from "node:zlib";
import {
  BROWSER_RAW_SCHEMA_V645,
  pngDimensionsV645,
  validateBrowserRawV645,
} from "./collect-mainline-a-r66-browser-evidence-v645.mjs";

const BUILD = Object.freeze({
  runtimeBuildId: "mainline-a-0123456789abcdef",
  branch: "codex/solar-sim-mainline-a",
  head: "156ec7790a99be2f89f5d8f44831cb118c9437e1",
});

function rawCapture(viewport = [1280, 720]) {
  return {
    schema: BROWSER_RAW_SCHEMA_V645,
    capturedAt: "2026-10-07T04:30:48.699Z",
    surface: "Playwright CLI Chrome local",
    url: "http://127.0.0.1:3088/",
    documentVisibility: "visible",
    viewport,
    dom: {
      clientWidth: viewport[0],
      clientHeight: viewport[1],
      scrollWidth: viewport[0],
      scrollHeight: viewport[1],
      markers: {
        shell: true,
        scientificPayloadWriteback: "false",
        releaseBoundary: "candidate-only-hold-not-admitted",
      },
      build: { ...BUILD },
    },
    claims: {
      productionPerformance: false,
      realUserValidation: false,
      scientificValidity: false,
      legalClearance: false,
    },
  };
}

test("desktop and simulated mobile raw DOM must bind the exact build and visible viewport", () => {
  const desktop = validateBrowserRawV645(rawCapture(), BUILD, "desktop");
  const mobile = validateBrowserRawV645(rawCapture([390, 844]), BUILD, "mobileViewport");
  assert.deepEqual(desktop.viewport, [1280, 720]);
  assert.deepEqual(mobile.viewport, [390, 844]);
  assert.equal(desktop.dom.markers.scientificPayloadWriteback, "false");
});

test("browser evidence refuses a build substitution or missing boundary marker", () => {
  const wrongBuild = rawCapture();
  wrongBuild.dom.build.runtimeBuildId = "mainline-a-another-build";
  assert.throws(() => validateBrowserRawV645(wrongBuild, BUILD, "desktop"), /browser-build-mismatch/);
  const promoted = rawCapture();
  promoted.dom.markers.scientificPayloadWriteback = "true";
  assert.throws(() => validateBrowserRawV645(promoted, BUILD, "desktop"), /browser-boundary-invalid/);
});

test("browser evidence refuses overflow, viewport aliases and a hidden page", () => {
  const overflow = rawCapture();
  overflow.dom.scrollWidth += 1;
  assert.throws(() => validateBrowserRawV645(overflow, BUILD, "desktop"), /browser-viewport-invalid/);
  const alias = rawCapture([390, 844]);
  alias.dom.clientWidth = 1280;
  assert.throws(() => validateBrowserRawV645(alias, BUILD, "mobileViewport"), /browser-viewport-invalid/);
  const hidden = rawCapture();
  hidden.documentVisibility = "hidden";
  assert.throws(() => validateBrowserRawV645(hidden, BUILD, "desktop"), /browser-not-visible/);
});

test("browser evidence refuses remote URL and a promoted claim", () => {
  const remote = rawCapture();
  remote.url = "https://example.org/";
  assert.throws(() => validateBrowserRawV645(remote, BUILD, "desktop"), /browser-url-invalid/);
  const production = rawCapture();
  production.claims.productionPerformance = true;
  assert.throws(() => validateBrowserRawV645(production, BUILD, "desktop"), /browser-claim-promotion/);
});

test("PNG inspector reads IHDR dimensions and refuses non-PNG data", () => {
  const chunk = (name, data) => {
    const type = Buffer.from(name, "ascii");
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(Buffer.concat([type, data])));
    return Buffer.concat([length, type, data, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(2, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.from([0, 255, 0, 0, 0, 255, 0]))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  assert.deepEqual(pngDimensionsV645(png), [2, 1]);
  assert.throws(() => pngDimensionsV645(Buffer.alloc(40)), /screenshot-not-png/);
  const corrupted = Buffer.from(png);
  corrupted[43] ^= 1;
  assert.throws(() => pngDimensionsV645(corrupted), /screenshot-crc-invalid/);
  assert.throws(() => pngDimensionsV645(png.subarray(0, png.length - 4)), /screenshot-(chunk-invalid|image-data-missing)/);
});
