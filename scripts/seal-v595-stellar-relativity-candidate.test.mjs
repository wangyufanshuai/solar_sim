import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";

import {
  parseV595ResealArgs,
  runV595IsolatedResealPasses,
  V595_RESEAL_STATUS,
  V595_RESEAL_VERSION,
} from "./seal-v595-stellar-relativity-candidate.mjs";

const rebuilt = Object.freeze([
  "docs/release/v595/source-manifest-v595.json",
  "public/data/stellar-relativity-v595/manifest.json",
]);
const retained = Object.freeze([
  "docs/release/v595/human-visual-signoff-v595.json",
  "docs/release/v595/release-export-v595.json",
  "tmp/v595-evidence/frame.png",
]);
const tracked = Object.freeze([...rebuilt, ...retained]);

async function seed(root) {
  for (const path of tracked) {
    const absolute = resolve(root, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(
      absolute,
      rebuilt.includes(path) ? "stable-derived\n" : `retained:${path}\n`,
      "utf8",
    );
  }
}

async function buildStable({ outputRoot }) {
  for (const path of rebuilt) {
    const absolute = resolve(outputRoot, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, "stable-derived\n", "utf8");
  }
}

test("v595 reseal exposes an explicit qualified double-pass contract", () => {
  assert.equal(V595_RESEAL_VERSION, "v595-stellar-relativity-reseal-receipt-v1");
  assert.equal(V595_RESEAL_STATUS, "passed-double-byte-identical-current-v595-reseal");
});

test("v595 reseal derives two isolated byte-identical passes and retains validated evidence", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v595-reseal-formal-"));
  try {
    await seed(root);
    const result = await runV595IsolatedResealPasses({
      root,
      trackedPaths: tracked,
      rebuiltPaths: rebuilt,
      buildCandidate: buildStable,
    });
    assert.deepEqual(result.firstPass, result.secondPass);
    assert.deepEqual(result.outputs, result.formalBefore);
    assert.deepEqual(result.rebuiltPaths, rebuilt);
    assert.deepEqual(result.retainedPaths, retained);
    assert.equal(
      await readFile(resolve(root, rebuilt[0]), "utf8"),
      "stable-derived\n",
    );
    assert.equal(
      await readFile(resolve(root, retained[0]), "utf8"),
      `retained:${retained[0]}\n`,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v595 reseal derivation drift leaves every formal output byte-identical", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v595-reseal-drift-"));
  let pass = 0;
  try {
    await seed(root);
    const before = await Promise.all(
      tracked.map((path) => readFile(resolve(root, path))),
    );
    await assert.rejects(runV595IsolatedResealPasses({
      root,
      trackedPaths: tracked,
      rebuiltPaths: rebuilt,
      buildCandidate: async ({ outputRoot }) => {
        pass += 1;
        for (const path of rebuilt) {
          const absolute = resolve(outputRoot, path);
          await mkdir(dirname(absolute), { recursive: true });
          await writeFile(absolute, `drift:${pass}\n`, "utf8");
        }
      },
    }), /byte-drift|formal-derived-output-drift/);
    const after = await Promise.all(
      tracked.map((path) => readFile(resolve(root, path))),
    );
    assert.deepEqual(after, before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v595 reseal detects a formal write performed by an injected derivation", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v595-reseal-write-"));
  try {
    await seed(root);
    await assert.rejects(runV595IsolatedResealPasses({
      root,
      trackedPaths: tracked,
      rebuiltPaths: rebuilt,
      buildCandidate: async ({ outputRoot }) => {
        await buildStable({ outputRoot });
        await writeFile(resolve(root, retained[0]), "mutated\n", "utf8");
      },
    }), /formal-derived-output-drift|formal-output-mutated/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v595 reseal rejects aliases, untracked rebuilt paths, and path escape", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v595-reseal-boundary-"));
  try {
    await seed(root);
    await assert.rejects(runV595IsolatedResealPasses({
      root,
      trackedPaths: [tracked[0], tracked[0]],
      rebuiltPaths: [tracked[0]],
      buildCandidate: buildStable,
    }), /path-alias/);
    await assert.rejects(runV595IsolatedResealPasses({
      root,
      trackedPaths: tracked,
      rebuiltPaths: [...rebuilt, "docs/release/v595/untracked.json"],
      buildCandidate: buildStable,
    }), /rebuilt-not-tracked/);
    await assert.rejects(runV595IsolatedResealPasses({
      root,
      trackedPaths: ["../outside.json"],
      rebuiltPaths: [],
      buildCandidate: async () => {},
    }), /formal-path|boundary/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v595 reseal CLI has no production or decision generation switch", () => {
  assert.deepEqual(parseV595ResealArgs([
    "--output", "docs/release/v595/custom-reseal.json",
  ]), { output: "docs/release/v595/custom-reseal.json" });
  assert.throws(() => parseV595ResealArgs(["--deploy-production"]), /argument/);
  assert.throws(() => parseV595ResealArgs(["--generate-decision"]), /argument/);
});
