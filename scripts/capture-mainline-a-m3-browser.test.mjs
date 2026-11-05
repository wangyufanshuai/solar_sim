import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rmdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { M3_A12, M3_OUTPUT, captureM3, inspectM3AssetRow, inspectM3FaultErrors, inspectM3Sources, inspectM3Viewer, m3PanInput, m3Scene, parseM3Options } from "./capture-mainline-a-m3-browser.mjs";

const bytes = Buffer.from("verified-local-image");
const row = { id: "m42", kind: "nebula", route: { assetPath: "public/textures/mainline-a/opo0205d.jpg",
  assetHash: createHash("sha256").update(bytes).digest("hex") }, scientificPayloadWriteback: false,
  runtimeAdmission: "candidate-only", status: "rights-pending", source: { sourceUrl: "https://esahubble.org/images/opo0205d/",
    credit: "NASA/ESA and C.R. O'Dell (Vanderbilt University)", license: "CC BY 4.0" } };

test("M3 fixes the canonical twelve nebulae and excludes Beta entries", () => {
  assert.equal(M3_A12.length, 12); assert.equal(new Set(M3_A12).size, 12);
  assert.equal(m3Scene("b33").selectedId, "nebula:b33");
  assert.throws(() => m3Scene("jellyfish-nebula"), /outside-a12/);
});

test("M3 reuses guarded local arguments but binds its own frozen baseline", () => {
  const args = ["--phase", "before", "--origin", "http://127.0.0.1:3146", "--build-receipt", "docs/release/build.json"];
  assert.ok(parseM3Options(args).baselineInputs.replaceAll("\\", "/").endsWith(`${M3_OUTPUT}/baseline-inputs.json`));
  assert.equal(parseM3Options(args).outputDir, M3_OUTPUT);
  assert.equal(parseM3Options([...args, "--output-dir", "output/playwright/mainline-a-m5-nebulae-20261015"]).outputDir,
    "output/playwright/mainline-a-m5-nebulae-20261015");
  for (const invalid of ["../outside", "output/playwright/../escape", "output/playwright/nested/child", "E:/outside", "output\\playwright\\nested"])
    assert.throws(() => parseM3Options([...args, "--output-dir", invalid]), /invalid-output-directory/);
  assert.throws(() => parseM3Options(args.map((arg) => arg === "http://127.0.0.1:3146" ? "https://example.org" : arg)));
});

test("M3 refuses to overwrite an existing canonical receipt or attempt before launching a browser", async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const relative = `output/playwright/m3-overwrite-test-${randomUUID()}`;
  const directory = path.join(root, relative, "after"); const attempt = path.join(directory, "attempts", "existing01");
  const options = parseM3Options(["--phase", "after", "--origin", "http://127.0.0.1:3149", "--build-receipt", "missing-unused-build.json",
    "--output-dir", relative, "--run-id", "existing01"]);
  const original = "immutable original evidence\n";
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(path.join(directory, "receipt.json"), original, { flag: "wx" });
    await assert.rejects(captureM3(options), /output-exists/);
    assert.equal(await readFile(path.join(directory, "receipt.json"), "utf8"), original);
    assert.deepEqual(await readdir(directory), ["receipt.json"]);
    await unlink(path.join(directory, "receipt.json"));
    await mkdir(attempt, { recursive: true }); await writeFile(path.join(attempt, "started.json"), original, { flag: "wx" });
    await assert.rejects(captureM3(options), { code: "EEXIST" });
    assert.equal(await readFile(path.join(attempt, "started.json"), "utf8"), original);
    assert.deepEqual(await readdir(attempt), ["started.json"]);
  } finally {
    await unlink(path.join(directory, "receipt.json")).catch(() => {});
    await unlink(path.join(attempt, "started.json")).catch(() => {});
    await rmdir(attempt).catch(() => {}); await rmdir(path.dirname(attempt)).catch(() => {});
    await rmdir(directory); await rmdir(path.dirname(directory));
  }
});

test("nebula assets require exact local bytes and the existing candidate boundary", () => {
  assert.deepEqual(inspectM3AssetRow(row, bytes, { width: 1280, height: 1378 }), []);
  assert.ok(inspectM3AssetRow(row, Buffer.from("modified"), { width: 1280, height: 1378 }).includes("asset-sha256-mismatch"));
  assert.ok(inspectM3AssetRow({ ...row, scientificPayloadWriteback: true }, bytes, { width: 1280, height: 1378 }).includes("asset-boundary-invalid"));
  assert.ok(inspectM3AssetRow(row, bytes, { width: 4096, height: 1378 }).includes("asset-dimensions-invalid"));
});

test("source capture verifies full credit and license plus actual access and 2D disclosure", () => {
  const source = { sourceHref: row.source.sourceUrl, credit: row.source.credit, license: row.source.license,
    licenseHref: "https://creativecommons.org/licenses/by/4.0/", dimensionText: "二维图像不表示三维深度",
    expanded: true, creditVisible: true, sourceFocused: true, rights: "pending", admission: "candidate-only" };
  assert.deepEqual(inspectM3Sources(source, row), []);
  for (const patch of [{ credit: "NASA" }, { sourceHref: "https://wrong.example/" }, { creditVisible: false },
    { sourceFocused: false }, { rights: "signed" }, { dimensionText: "" }]) assert.ok(inspectM3Sources({ ...source, ...patch }, row).length);
});

test("fault cases allow only errors for the exact controlled image URL", () => {
  const url = "http://127.0.0.1:3147/textures/mainline-a/opo0205d.jpg";
  const expected = { type: "console", message: "Failed to load resource: 503", url: `${url}?sha256=abc` };
  assert.deepEqual(inspectM3FaultErrors([expected], url), []);
  for (const patch of [{ type: "pageerror" }, { url: `${url}-unrelated` }, { url: "https://other.example/opo0205d.jpg" },
    { message: "Unhandled application failure" }, { url: undefined }]) {
    assert.equal(inspectM3FaultErrors([{ ...expected, ...patch }], url).length, 1);
  }
});

test("pan probes use the larger scrollable axis and turn away from the boundary", () => {
  assert.deepEqual(m3PanInput({ left: 110, top: 312, maxLeft: 110, maxTop: 496 }, 40),
    { horizontal: false, amount: -40, key: "ArrowUp" });
  assert.equal(m3PanInput({ left: 496, top: 0, maxLeft: 496, maxTop: 0 }, 40).amount, -40);
  assert.equal(m3PanInput({ left: 0, top: 0, maxLeft: 496, maxTop: 0 }, 40).amount, 40);
  assert.throws(() => m3PanInput({ left: 0, top: 0, maxLeft: 0, maxTop: 0 }, 40), /no-pannable-axis/);
});

test("viewer full-composition proof rejects crop, wrong image, added canvas, filtering and viewport overflow", () => {
  const asset = { id: row.id, sha256: row.route.assetHash, width: 1280, height: 1378, source: row.source };
  const view = { open: true, id: row.id, zoom: 1, sha256: asset.sha256, imageSha256: asset.sha256,
    source: asset.source.sourceUrl, complete: true, naturalWidth: 1280, naturalHeight: 1378, canvasCount: 1,
    filter: "none", opacity: 1, documentWidth: 390, viewportWidth: 390, viewportHeight: 844,
    dialogBounds: { left: 0, top: 0, right: 390, bottom: 844 }, visibleRatio: 1, left: 0, top: 0 };
  assert.deepEqual(inspectM3Viewer(view, asset, 1), []);
  for (const patch of [{ visibleRatio: .8 }, { left: 20 }, { imageSha256: "wrong" }, { naturalWidth: 640 },
    { canvasCount: 2 }, { filter: "brightness(1.2)" }, { documentWidth: 400 }]) {
    assert.ok(inspectM3Viewer({ ...view, ...patch }, asset, 1).length);
  }
  assert.deepEqual(inspectM3Viewer({ ...view, zoom: 2, visibleRatio: .5, left: 80 }, asset, 2), []);
});
