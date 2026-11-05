import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import {
  prepareRuntimePayloadV636, materializeRuntimePayloadV636, verifyRuntimePayloadV636,
  runtimePayloadPathV636, RUNTIME_PAYLOAD_MANIFEST_V636,
} from "./mainline-a-runtime-payload-v636.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const serialized = (value) => `${JSON.stringify(value, null, 2)}\n`;
const stage = ".next-mainline-a-fixture";
const standalone = `${stage}/.next/standalone`;
const temporaryRoot = path.resolve("tmp", "runtime-payload-v636-tests");

async function fixture() {
  const workspace = path.join(temporaryRoot, randomUUID());
  await mkdir(workspace, { recursive: true });
  const put = async (relative, content) => {
    await mkdir(path.dirname(path.join(workspace, relative)), { recursive: true });
    await writeFile(path.join(workspace, relative), typeof content === "string" ? content : serialized(content));
  };
  await put(`${standalone}/server.js`, "// test-only minimal server entry\nconsole.log('fixture');\n");
  await put(`${standalone}/package.json`, { name: "test-only-solar-runtime", private: true });
  await put(`${standalone}/.next/BUILD_ID`, "fixture-build\n");
  await put(`${stage}/.next/BUILD_ID`, "fixture-build\n");
  await put(`${stage}/.next/static/chunks/main.js`, "/* test-only */globalThis.fixture=true;\n");
  await put(`${stage}/.next/next-server.js.nft.json`, { version: 1, files: ["../../node_modules/next/package.json"] });
  await put(`${stage}/.next/required-server-files.json`, { version: 1, config: { output: "standalone", distDir: ".next", env: {} }, files: [".next/BUILD_ID"] });
  await put("public/data/example.json", { fixture: true });
  await put("public/.env.local", "TEST_ONLY_SECRET=must-never-be-copied\n");
  for (const name of ["next", "react", "react-dom"]) {
    await put(`node_modules/${name}/package.json`, { name, version: "0.0.0-test-only", dependencies: {} });
    await put(`node_modules/${name}/index.js`, "module.exports={fixture:true};\n");
  }
  await put("app/page.tsx", "export const fixture=true;\n");
  const inputs = [{ path: "app/page.tsx", bytes: 27, sha256: hash("export const fixture=true;\n") }];
  const sourceSha256 = hash(JSON.stringify(inputs));
  const receipt = {
    status: "passed", exitCode: 0, sourceStable: true,
    workingDirectory: path.join(workspace, stage), distDir: `${stage}/.next`,
    buildId: "fixture-build", runtimeBuildId: `mainline-a-${sourceSha256.slice(0, 16)}`,
    branch: "codex/solar-sim-mainline-a", head: "a".repeat(40), profile: "vercel-lite",
    inputBefore: { inputs, count: inputs.length, sha256: sourceSha256 }, inputAfterSha256: sourceSha256,
  };
  const reference = { path: "build.json", sha256: "" };
  const saveReceipt = async () => { await put(reference.path, receipt); reference.sha256 = hash(serialized(receipt)); };
  await saveReceipt();
  const prepare = () => prepareRuntimePayloadV636({ workspace, buildReceipt: reference });
  const materialize = async (destination = "output") => materializeRuntimePayloadV636({ workspace, destination, plan: await prepare() });
  return { workspace, put, receipt, reference, saveReceipt, prepare, materialize };
}

async function verify(f, result, expectedBuild) {
  return verifyRuntimePayloadV636({ workspace: f.workspace, directory: result.directory, expectedManifestSha256: result.manifestSha256, expectedBuild });
}

async function reseal(f, result, mutate) {
  const manifest = structuredClone(result.manifest);
  mutate(manifest);
  await f.put(result.manifestPath, manifest);
  return { ...result, manifest, manifestSha256: hash(serialized(manifest)) };
}

test("prepare and materialize a standalone, complete public and explicit dependency closure", async () => {
  const f = await fixture();
  const plan = await f.prepare();
  assert.equal(plan.materialized, false);
  assert.ok(plan.manifest.files.some((file) => file.path === "public/data/example.json"));
  assert.ok(plan.manifest.files.some((file) => file.path === ".next/static/chunks/main.js"));
  assert.equal(plan.manifest.files.some((file) => file.path.includes(".env")), false);
  assert.ok(plan.manifest.exclusions.some((row) => row.path === "public/.env.local"));
  const result = await materializeRuntimePayloadV636({ workspace: f.workspace, destination: "output", plan });
  const observed = await verify(f, result, plan.build);
  assert.equal(observed.status, "verified");
  assert.equal(observed.hostCompatible, true);
  assert.equal(observed.boundary.releaseApproved, false);
  assert.deepEqual(observed.totals, plan.totals);
});

test("materializes allowed public and node_modules directory traces without whole node_modules", async () => {
  const f = await fixture();
  for (const name of ["node_modules", "public"]) {
    await symlink(path.join(f.workspace, name), path.join(f.workspace, stage, name), "junction");
    await symlink(path.join(f.workspace, name), path.join(f.workspace, standalone, name), "junction");
  }
  await f.put("node_modules/unrelated-private-tool/package.json", { name: "unrelated-private-tool" });
  await f.put(`${stage}/.next/next-server.js.nft.json`, { version: 1, files: ["../node_modules", "../public"] });
  const plan = await f.prepare();
  assert.equal(plan.manifest.resolvedLinks.length, 4);
  assert.equal(plan.manifest.files.some((file) => file.path.includes("unrelated-private-tool")), false);
  const result = await materializeRuntimePayloadV636({ workspace: f.workspace, destination: "output", plan });
  assert.equal((await verify(f, result)).status, "verified");
});

test("follows package dependencies and installed host optional dependencies", async () => {
  const f = await fixture();
  await f.put("node_modules/next/package.json", { name: "next", version: "1", dependencies: { helper: "1" }, optionalDependencies: { absent: "1", otherhost: "1", hostaddon: "1" } });
  for (const name of ["helper", "hostaddon"]) await f.put(`node_modules/${name}/package.json`, { name, version: "1" });
  await f.put("node_modules/otherhost/package.json", { name: "otherhost", version: "1", os: [`!${process.platform}`] });
  const plan = await f.prepare();
  assert.ok(plan.manifest.packages.some((row) => row.name === "helper"));
  assert.ok(plan.manifest.packages.some((row) => row.name === "hostaddon"));
  assert.ok(plan.manifest.exclusions.some((row) => row.path === "absent"));
  assert.ok(plan.manifest.exclusions.some((row) => row.path === "otherhost"));
});

test("copies only individually traced data/docs, not their whole directories", async () => {
  const f = await fixture();
  await f.put("docs/chosen.json", { fixture: true });
  await f.put("docs/not-requested.json", { fixture: true });
  await f.put(`${stage}/.next/next-server.js.nft.json`, { version: 1, files: ["../../docs/chosen.json"] });
  const plan = await f.prepare();
  assert.ok(plan.manifest.files.some((row) => row.path === "docs/chosen.json"));
  assert.equal(plan.manifest.files.some((row) => row.path === "docs/not-requested.json"), false);
});

test("rejects broad data directory trace", async () => {
  const f = await fixture();
  await f.put("data/a.json", {});
  await f.put(`${stage}/.next/next-server.js.nft.json`, { version: 1, files: ["../../data"] });
  await assert.rejects(f.prepare, /trace-directory-not-supported/);
});

for (const value of ["../outside", "/root", "C:/secret", "a\\b", "a//b", "a/./b", "a. ", "NUL.json", "a\0b"]) {
  test(`rejects unsafe relative path ${JSON.stringify(value)}`, () => assert.throws(() => runtimePayloadPathV636(value), /invalid-relative-path/));
}

test("rejects an unpinned receipt and failed or unstable build", async () => {
  const f = await fixture();
  await assert.rejects(() => prepareRuntimePayloadV636({ workspace: f.workspace, buildReceipt: { ...f.reference, sha256: "0".repeat(64) } }), /build-receipt-sha-mismatch/);
  f.receipt.exitCode = 1;
  await f.saveReceipt();
  await assert.rejects(f.prepare, /build-not-passed/);
});

test("rejects a forged source snapshot hash", async () => {
  const f = await fixture();
  f.receipt.inputBefore.inputs[0].sha256 = "1".repeat(64);
  await f.saveReceipt();
  await assert.rejects(f.prepare, /build-source-binding-invalid/);
});

test("rejects mismatched BUILD_ID", async () => {
  const f = await fixture();
  await f.put(`${stage}/.next/BUILD_ID`, "different-build");
  await assert.rejects(f.prepare, /build-id-file-mismatch/);
});

test("rejects nonallowlisted standalone links and public descendant links", async () => {
  const f = await fixture();
  await symlink(path.join(f.workspace, "public"), path.join(f.workspace, standalone, "custom"), "junction");
  await assert.rejects(f.prepare, /standalone-link-not-allowlisted/);
  const second = await fixture();
  await symlink(path.join(second.workspace, "app"), path.join(second.workspace, "public", "escape"), "junction");
  await assert.rejects(second.prepare, /symlink-rejected/);
});

test("rejects allowlisted mount names pointing at the wrong directory", async () => {
  const f = await fixture();
  await symlink(path.join(f.workspace, "app"), path.join(f.workspace, standalone, "public"), "junction");
  await assert.rejects(f.prepare, /link-target-not-allowlisted/);
});

test("rejects traced filesystem escape before reading it", async () => {
  const f = await fixture();
  await f.put(`${stage}/.next/next-server.js.nft.json`, { version: 1, files: ["../../../../escape"] });
  await assert.rejects(f.prepare, /invalid-relative-path/);
});

test("rejects missing required package and serialized config environment", async () => {
  const f = await fixture();
  await f.put("node_modules/next/package.json", { name: "next", version: "1", dependencies: { missing: "1" } });
  await assert.rejects(f.prepare, /runtime-package-missing/);
  const second = await fixture();
  await second.put(`${stage}/.next/required-server-files.json`, { config: { output: "standalone", distDir: ".next", env: { TEST_ONLY: "not-for-export" } }, files: [".next/BUILD_ID"] });
  await assert.rejects(second.prepare, /serialized-config-not-portable-or-env-present/);
});

test("enforces payload budget before materialization", async () => {
  const f = await fixture();
  await assert.rejects(() => prepareRuntimePayloadV636({ workspace: f.workspace, buildReceipt: f.reference, limits: { maxBytes: 1 } }), /payload-limit-exceeded/);
});

test("rejects changed source and receipt after prepare", async () => {
  const f = await fixture();
  const plan = await f.prepare();
  await f.put(`${standalone}/server.js`, "// changed test-only entry\n");
  await assert.rejects(() => materializeRuntimePayloadV636({ workspace: f.workspace, destination: "changed", plan }), /source-changed-after-prepare/);
  const second = await fixture();
  const secondPlan = await second.prepare();
  second.receipt.buildId = "changed";
  await second.saveReceipt();
  await assert.rejects(() => materializeRuntimePayloadV636({ workspace: second.workspace, destination: "changed", plan: secondPlan }), /build-receipt-changed-after-prepare/);
});

test("refuses existing output and linked output ancestors", async () => {
  const f = await fixture();
  const plan = await f.prepare();
  await mkdir(path.join(f.workspace, "existing"));
  await assert.rejects(() => materializeRuntimePayloadV636({ workspace: f.workspace, destination: "existing", plan }), { code: "EEXIST" });
  await symlink(path.join(f.workspace, "public"), path.join(f.workspace, "linked-output"), "junction");
  await assert.rejects(() => materializeRuntimePayloadV636({ workspace: f.workspace, destination: "linked-output/new", plan }), /output-parent-not-plain/);
});

test("verifies a second independently copied directory without consulting sources", async () => {
  const f = await fixture();
  const result = await f.materialize();
  for (const file of result.manifest.files) {
    await mkdir(path.dirname(path.join(f.workspace, "restored", file.path)), { recursive: true });
    await copyFile(path.join(f.workspace, result.directory, file.path), path.join(f.workspace, "restored", file.path));
  }
  await f.put(`restored/${RUNTIME_PAYLOAD_MANIFEST_V636}`, await readFile(path.join(f.workspace, result.manifestPath), "utf8"));
  await f.put(`${standalone}/server.js`, "changed source does not change sealed payload");
  const replay = await verifyRuntimePayloadV636({ workspace: f.workspace, directory: "restored", expectedManifestSha256: result.manifestSha256 });
  assert.equal(replay.status, "verified");
});

for (const variant of ["extra-file", "extra-empty-directory", "tamper", "symlink"]) {
  test(`rejects restored payload ${variant}`, async () => {
    const f = await fixture();
    const result = await f.materialize();
    if (variant === "extra-file") await f.put("output/unlisted.txt", "not listed");
    if (variant === "extra-empty-directory") await mkdir(path.join(f.workspace, "output/empty"));
    if (variant === "tamper") await f.put("output/server.js", "tampered test-only\n");
    if (variant === "symlink") await symlink(path.join(f.workspace, "public"), path.join(f.workspace, "output/linked"), "junction");
    await assert.rejects(() => verify(f, result), /unexpected-file|unexpected-directory|output-file-mismatch|symlink-rejected/);
  });
}

test("rejects missing file without deleting any fixture files", async () => {
  const f = await fixture();
  const result = await f.materialize();
  for (const file of result.manifest.files.filter((row) => row.path !== "server.js")) {
    await mkdir(path.dirname(path.join(f.workspace, "incomplete", file.path)), { recursive: true });
    await copyFile(path.join(f.workspace, result.directory, file.path), path.join(f.workspace, "incomplete", file.path));
  }
  await f.put(`incomplete/${RUNTIME_PAYLOAD_MANIFEST_V636}`, result.manifest);
  await assert.rejects(() => verifyRuntimePayloadV636({ workspace: f.workspace, directory: "incomplete", expectedManifestSha256: result.manifestSha256 }), /missing-file/);
});

test("rejects manifest unpinned bytes and build substitution", async () => {
  const f = await fixture();
  const result = await f.materialize();
  await assert.rejects(() => verify(f, result, { buildId: "other" }), /expected-build-mismatch/);
  await f.put(result.manifestPath, { ...result.manifest, unexpected: true });
  await assert.rejects(() => verify(f, result), /manifest-pin-mismatch/);
});

for (const variant of ["required-entry", "case-duplicate", "private-source", "rights-claim", "boundary", "host"]) {
  test(`rejects resealed ${variant} manifest`, async () => {
    const f = await fixture();
    const result = await f.materialize();
    const bad = await reseal(f, result, (manifest) => {
      if (variant === "required-entry") manifest.files = manifest.files.filter((file) => file.path !== "server.js");
      if (variant === "case-duplicate") manifest.files.push({ ...manifest.files.find((file) => file.path === "server.js"), path: "SERVER.JS" });
      if (variant === "private-source") manifest.files[0].sourcePath = ".env.local";
      if (variant === "rights-claim") manifest.claims.copyrightApproval = true;
      if (variant === "boundary") manifest.boundary.scientificPayloadWriteback = true;
      if (variant === "host") manifest.host.arch = "unknown-arch";
    });
    await assert.rejects(() => verify(f, bad), /required-runtime-file-missing|manifest-case-duplicate|forbidden-manifest-file|manifest-claim-open|boundary-open|host-runtime-incompatible/);
  });
}
