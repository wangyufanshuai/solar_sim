import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextConfig, { configureAtlasPreservedBuildCache } from "../next.config.mjs";
import {
  admittedLitePath, buildCacheObservation, buildDiskCacheMode, buildHeapMb, buildSlot,
  captureBuildInputs, hydrateStandaloneAssets, preparePreservedBuildStage,
  PRESERVED_BUILD_CACHE_LOG_PREFIX, readBuildDiskAvailability,
} from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STAGE = path.join(ROOT, buildSlot(66, "disk-mode-unit-test"));
const MIB = 1024 * 1024;
const diskStats = (bytes) => ({ bavail: BigInt(bytes), bsize: 1n });

test("preserved build only accepts new internal slot names", () => {
  assert.equal(buildSlot(64, "20260914-001"), ".next-mainline-a-r64-20260914-001");
  for (const value of ["../escape", "C:/temp", "normal;del", "a"]) {
    assert.throws(() => buildSlot(64, value));
  }
  assert.throws(() => buildSlot(1, "20260914-001"));
  assert.equal(buildHeapMb("8192"), 8192);
  assert.throws(() => buildHeapMb("32768"));
  assert.throws(() => buildHeapMb("invalid"));
  assert.equal(admittedLitePath("app/local-shadow-v562/page.tsx"), false);
  assert.equal(admittedLitePath("app/api/atlas/relativity-evidence/v595/route.ts"), false);
  assert.equal(admittedLitePath("app/api/atlas/relativity-evidence/route.ts"), true);
  assert.equal(admittedLitePath("app/page.tsx"), true);
});

test("source binding includes real app files and is deterministic without mutation", async () => {
  const first = await captureBuildInputs();
  const second = await captureBuildInputs();
  assert.equal(first.sha256, second.sha256);
  assert.ok(first.inputs.some((file) => file.path === "app/components/MainlineANebulaBatchPanelV624.tsx"));
  assert.ok(first.inputs.some((file) => file.path === "package-lock.json"));
  assert.ok(first.inputs.every((file) => !file.path.includes(".test.")));
});

test("standalone hydration requests immutable runtime asset copying using in-memory IO", async () => {
  const source = path.join(STAGE, ".next", "static");
  const target = path.join(STAGE, ".next", "standalone", ".next", "static");
  const files = new Map([[path.join(source, "chunks", "app.js"), "const served = true;\n"]]);
  const calls = [];
  const result = await hydrateStandaloneAssets(STAGE, {
    access: async (directory) => { assert.equal(directory, source); calls.push("access"); },
    mkdir: async (directory, options) => {
      assert.equal(directory, path.dirname(target));
      assert.deepEqual(options, { recursive: true });
      calls.push("mkdir");
    },
    cp: async (from, to, options) => {
      assert.equal(from, source);
      assert.equal(to, target);
      assert.deepEqual(options, { recursive: true, force: false, errorOnExist: false });
      calls.push("cp");
      for (const [name, content] of [...files]) files.set(path.join(to, path.relative(from, name)), content);
    },
  });
  assert.equal(result.copied, true);
  assert.equal(result.requiredForStandaloneRuntime, true);
  assert.deepEqual(calls, ["access", "mkdir", "cp"]);
  assert.equal(files.get(path.join(target, "chunks", "app.js")), files.get(path.join(source, "chunks", "app.js")));
});

test("missing standalone assets fail before any hydration write", async () => {
  const writes = [];
  await assert.rejects(hydrateStandaloneAssets(STAGE, {
    access: async () => { throw new Error("ENOENT"); },
    mkdir: async () => { writes.push("mkdir"); },
    cp: async () => { writes.push("cp"); },
  }), /did not emit/);
  assert.deepEqual(writes, []);
});

test("disk cache mode is explicit and rejects unsupported switches", () => {
  assert.equal(buildDiskCacheMode(), "default");
  assert.equal(buildDiskCacheMode("off"), "off");
  for (const value of ["", "false", "memory", "OFF", true, null]) {
    assert.throws(() => buildDiskCacheMode(value), /default or off/);
  }
});

test("disk preflight rejects insufficient space before any stage write", async () => {
  for (const [mode, threshold] of [["off", 256 * MIB], ["default", 1024 * MIB]]) {
    const events = [];
    await assert.rejects(preparePreservedBuildStage(STAGE, mode, {
      statfs: async (directory, options) => {
        assert.equal(directory, ROOT);
        assert.deepEqual(options, { bigint: true });
        events.push("statfs");
        return diskStats(threshold - 1);
      },
      mkdir: async () => { events.push("WRITE:mkdir"); },
    }), (error) => {
      assert.equal(error.code, "MAINLINE_A_BUILD_DISK_INSUFFICIENT");
      assert.equal(error.preflight.availableBytes, threshold - 1);
      assert.equal(error.preflight.minimumFreeBytes, threshold);
      assert.equal(error.preflight.peakUseGuaranteed, false);
      return true;
    });
    assert.deepEqual(events, ["statfs"]);
  }
});

test("sufficient disk space creates only the explicit new internal slot", async () => {
  const events = [];
  const report = await preparePreservedBuildStage(STAGE, "off", {
    statfs: async () => { events.push("statfs"); return diskStats(256 * MIB); },
    mkdir: async (directory, options) => {
      assert.equal(directory, STAGE);
      assert.deepEqual(options, { recursive: false });
      events.push("mkdir");
    },
  });
  assert.deepEqual(events, ["statfs", "mkdir"]);
  assert.equal(report.cacheMode, "off");
  assert.equal(report.minimumFreeBytes, 256 * MIB);
  assert.equal(report.availableBytes, 256 * MIB);
  assert.equal(report.spaceReserved, false);
});

test("unreadable disk accounting and existing output slots are never bypassed", async () => {
  let writes = 0;
  await assert.rejects(preparePreservedBuildStage(STAGE, "off", {
    statfs: async () => { throw new Error("statfs unavailable"); },
    mkdir: async () => { writes += 1; },
  }), /statfs unavailable/);
  assert.equal(writes, 0);
  await assert.rejects(preparePreservedBuildStage(STAGE, "off", {
    statfs: async () => diskStats(512 * MIB),
    mkdir: async () => { throw Object.assign(new Error("slot exists"), { code: "EEXIST" }); },
  }), (error) => error.code === "EEXIST");
  await assert.rejects(preparePreservedBuildStage(path.join(ROOT, "..", "outside"), "off", {
    statfs: async () => { throw new Error("must not query outside"); },
  }), /immediate next-web/);
});

test("available disk bytes are precise and invalid counters fail closed", async () => {
  const report = await readBuildDiskAvailability({ statfs: async () => ({ bavail: 12345n, bsize: 4096n }) });
  assert.equal(report.availableBytes, 12345 * 4096);
  assert.equal(report.volumePath, ROOT);
  assert.ok(Number.isFinite(Date.parse(report.observedAt)));
  for (const stats of [diskStats(-1), diskStats(BigInt(Number.MAX_SAFE_INTEGER) + 1n), { bavail: 2n, bsize: 0n }]) {
    await assert.rejects(readBuildDiskAvailability({ statfs: async () => stats }), /available disk bytes/);
  }
});

test("cache override leaves ordinary production and every development configuration unchanged", () => {
  for (const [dev, environment] of [
    [false, {}],
    [false, { ATLAS_MAINLINE_A_DISK_CACHE: "off" }],
    [true, { ATLAS_MAINLINE_A_PRESERVED_BUILD: "1", ATLAS_MAINLINE_A_DISK_CACHE: "off" }],
  ]) {
    const cache = { type: "filesystem", cacheDirectory: "/existing-config" };
    const config = { cache };
    assert.equal(configureAtlasPreservedBuildCache(config, { dev, isServer: false }, environment), null);
    assert.equal(config.cache, cache);
  }
});

test("the actual Next webpack hook disables cache only for explicit preserved builds", () => {
  const names = ["ATLAS_MAINLINE_A_PRESERVED_BUILD", "ATLAS_MAINLINE_A_DISK_CACHE"];
  const previous = names.map((name) => process.env[name]);
  const originalLog = console.log;
  const logs = [];
  try {
    process.env.ATLAS_MAINLINE_A_PRESERVED_BUILD = "1";
    process.env.ATLAS_MAINLINE_A_DISK_CACHE = "off";
    console.log = (message) => { logs.push(message); };
    for (const context of [
      { dev: false, isServer: false },
      { dev: false, isServer: true, nextRuntime: "nodejs" },
      { dev: false, isServer: true, nextRuntime: "edge" },
    ]) {
      const config = { cache: { type: "filesystem" }, plugins: [] };
      const result = nextConfig.webpack(config, { ...context, webpack: { NormalModuleReplacementPlugin: class {} } });
      assert.equal(result, config);
      assert.equal(result.cache, false);
    }
  } finally {
    console.log = originalLog;
    names.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
  const receipt = buildCacheObservation(logs.join("\n"), "off");
  assert.equal(receipt.verified, true);
  assert.deepEqual(receipt.observedCacheTypes, ["disabled"]);
  assert.deepEqual(receipt.observations.map((record) => record.target), ["client", "nodejs", "edge"]);
});

test("default preserved mode reports the existing compiler cache without replacing it", () => {
  const cache = { type: "filesystem" };
  const config = { cache };
  const report = configureAtlasPreservedBuildCache(config, { dev: false, isServer: true }, {
    ATLAS_MAINLINE_A_PRESERVED_BUILD: "1", ATLAS_MAINLINE_A_DISK_CACHE: "default",
  });
  assert.equal(config.cache, cache);
  assert.equal(report.cacheType, "filesystem");
  assert.throws(() => configureAtlasPreservedBuildCache(config, { dev: false, isServer: true }, {
    ATLAS_MAINLINE_A_PRESERVED_BUILD: "1", ATLAS_MAINLINE_A_DISK_CACHE: "invalid",
  }), /Invalid/);
});

test("cache receipt cannot claim disabled from missing, conflicting or malformed observations", () => {
  const line = (target, cacheType = "disabled", requestedMode = "off") => PRESERVED_BUILD_CACHE_LOG_PREFIX
    + JSON.stringify({ target, cacheType, requestedMode });
  const valid = [line("client"), line("nodejs")].join("\n");
  assert.equal(buildCacheObservation(valid, "off").verified, true);
  for (const invalid of [
    "", line("client"), valid + "\n" + PRESERVED_BUILD_CACHE_LOG_PREFIX + "not json",
    valid + "\n" + line("edge", "filesystem"), valid + "\n" + line("edge", "disabled", "default"),
    valid + "\n" + line("unrecognized"),
  ]) assert.equal(buildCacheObservation(invalid, "off").verified, false);
});
