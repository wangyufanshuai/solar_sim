import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseR78WebEvidenceOptionsV665,
  verifyR78ScreenshotBytesV665 } from
  "./capture-mainline-a-r78-web-evidence-v665.mjs";

const browser = JSON.parse(await readFile(
  "docs/release/v607/mainline-a-r77-v664-matrix-browser-20261013v664r77web01.json",
  "utf8"));

test("parses only a bounded local two-server run", () => {
  const value = parseR78WebEvidenceOptionsV665([
    "--run-id", "20261013v665r78web01",
    "--enabled-port", "3132",
    "--default-off-port", "3133"]);
  assert.equal(value.enabledPort, 3132);
  assert.equal(value.defaultOffPort, 3133);
  assert.throws(() => parseR78WebEvidenceOptionsV665([
    "--run-id", "../outside",
    "--enabled-port", "3132",
    "--default-off-port", "3133"]));
  assert.throws(() => parseR78WebEvidenceOptionsV665([
    "--run-id", "20261013v665r78web01",
    "--enabled-port", "3132",
    "--default-off-port", "3132"]));
  assert.throws(() => parseR78WebEvidenceOptionsV665([
    "--run-id", "20261013v665r78web09",
    "--enabled-port", "3132",
    "--default-off-port", "3133"]));
});

test("recomputes a real screenshot byte hash and viewport", async () => {
  const meta = browser.mobileViewport.overview;
  const bytes = await readFile(meta.path);
  const result = verifyR78ScreenshotBytesV665(meta,
    "mobile", bytes);
  assert.equal(result.ok, true);
  assert.deepEqual([result.width, result.height],
    [390, 844]);
});

test("rejects changed pixels, wrong viewport, and forged hash", async () => {
  const meta = browser.desktop.overview;
  const bytes = await readFile(meta.path);
  const changed = Buffer.from(bytes);
  changed[changed.length - 16] ^= 1;
  assert.equal(verifyR78ScreenshotBytesV665(meta,
    "desktop", changed).ok, false);
  assert.equal(verifyR78ScreenshotBytesV665(meta,
    "mobile", bytes).ok, false);
  assert.equal(verifyR78ScreenshotBytesV665({ ...meta,
    sha256: "a".repeat(64) }, "desktop", bytes).ok,
  false);
});
