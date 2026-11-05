import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canonicalNebulaRoutesV645,
  jpegFrameHeaderV645,
} from "./collect-mainline-a-canonical-assets-http-v645.mjs";

const coverage = JSON.parse(readFileSync(new URL("../app/data/mainlineACanonicalCoverageV622.generated.json", import.meta.url), "utf8"));
const image = readFileSync(new URL("../public/textures/mainline-a/opo0205d.jpg", import.meta.url));

test("canonical image HTTP collector derives exactly the manifest's twelve nebula routes", () => {
  const routes = canonicalNebulaRoutesV645(coverage);
  assert.equal(routes.length, 12);
  assert.equal(new Set(routes.map((route) => route.id)).size, 12);
  assert.ok(routes.every((route) => route.path.startsWith("public/textures/mainline-a/")));
  assert.equal(routes.find((route) => route.id === "m42")?.sha256,
    "35ce36bbff5099f2a6022bd47d5dfd78f2a55b09da98ffbdec7c98a6a85398e3");
});

test("local canonical JPEG exposes frame header dimensions without claiming a pixel decode", () => {
  assert.deepEqual(jpegFrameHeaderV645(image), { width: 1280, height: 1378, channels: 3, estimatedRasterBytes: 5291520 });
});

test("JPEG parser refuses missing signature and truncated segments", () => {
  assert.throws(() => jpegFrameHeaderV645(Buffer.alloc(20)), /jpeg-signature-invalid/);
  assert.throws(() => jpegFrameHeaderV645(image.subarray(0, 10)), /jpeg-signature-invalid|jpeg-segment-invalid|jpeg-frame-missing/);
  const corrupted = Buffer.from(image);
  corrupted[2] = 0;
  assert.throws(() => jpegFrameHeaderV645(corrupted), /jpeg-marker-invalid/);
});

test("canonical route validation refuses duplicate IDs and path traversal", () => {
  const duplicate = structuredClone(coverage);
  const rows = duplicate.records.filter((row) => row.kind === "nebula");
  rows[1].id = rows[0].id;
  assert.throws(() => canonicalNebulaRoutesV645(duplicate), /canonical-nebula-route-invalid/);
  const escaped = structuredClone(coverage);
  escaped.records.find((row) => row.kind === "nebula").route.assetPath = "public/textures/mainline-a/../secret.jpg";
  assert.throws(() => canonicalNebulaRoutesV645(escaped), /canonical-nebula-route-invalid/);
});

test("route count and scientific writeback are both fail closed", () => {
  const missing = structuredClone(coverage);
  missing.records.pop();
  assert.throws(() => canonicalNebulaRoutesV645(missing), /canonical-coverage-invalid/);
  const promoted = structuredClone(coverage);
  promoted.records.find((row) => row.kind === "nebula").scientificPayloadWriteback = true;
  assert.throws(() => canonicalNebulaRoutesV645(promoted), /canonical-nebula-route-invalid/);
});
