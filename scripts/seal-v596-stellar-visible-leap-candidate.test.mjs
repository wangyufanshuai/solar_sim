import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";

import {
  parseV596ResealArgs,
  runV596IsolatedResealPasses,
  V596_RESEAL_STATUS,
  V596_RESEAL_VERSION,
} from "./seal-v596-stellar-visible-leap-candidate.mjs";

const rebuilt = Object.freeze([
  "docs/release/v596/source-manifest-v596.json",
  "public/data/stellar-visible-leap-v596/manifest.json",
]);
const retained = Object.freeze([
  "docs/release/v596/human-visual-signoff-v596.json",
  "docs/release/v596/release-export-v596.json",
  "tmp/v596-evidence/frame.png",
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

test("v596 reseal exposes an explicit qualified double-pass contract", () => {
  assert.equal(V596_RESEAL_VERSION, "v596-stellar-visible-leap-reseal-receipt-v1");
  assert.equal(V596_RESEAL_STATUS, "passed-double-byte-identical-current-v596-reseal");
});

test("v596 reseal derives two isolated byte-identical passes and retains validated evidence", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v596-reseal-formal-"));
  try {
    await seed(root);
    const result = await runV596IsolatedResealPasses({
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

test("v596 reseal derivation drift leaves every formal output byte-identical", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v596-reseal-drift-"));
  let pass = 0;
  try {
    await seed(root);
    const before = await Promise.all(
      tracked.map((path) => readFile(resolve(root, path))),
    );
    await assert.rejects(runV596IsolatedResealPasses({
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

test("v596 reseal detects a formal write performed by an injected derivation", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v596-reseal-write-"));
  try {
    await seed(root);
    await assert.rejects(runV596IsolatedResealPasses({
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

test("v596 reseal rejects aliases, untracked rebuilt paths, and path escape", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v596-reseal-boundary-"));
  try {
    await seed(root);
    await assert.rejects(runV596IsolatedResealPasses({
      root,
      trackedPaths: [tracked[0], tracked[0]],
      rebuiltPaths: [tracked[0]],
      buildCandidate: buildStable,
    }), /path-alias/);
    await assert.rejects(runV596IsolatedResealPasses({
      root,
      trackedPaths: tracked,
      rebuiltPaths: [...rebuilt, "docs/release/v596/untracked.json"],
      buildCandidate: buildStable,
    }), /rebuilt-not-tracked/);
    await assert.rejects(runV596IsolatedResealPasses({
      root,
      trackedPaths: ["../outside.json"],
      rebuiltPaths: [],
      buildCandidate: async () => {},
    }), /formal-path|boundary/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v596 reseal CLI has no production or decision generation switch", () => {
  assert.deepEqual(parseV596ResealArgs([
    "--output", "docs/release/v596/custom-reseal.json",
  ]), { output: "docs/release/v596/custom-reseal.json" });
  assert.throws(() => parseV596ResealArgs(["--deploy-production"]), /argument/);
  assert.throws(() => parseV596ResealArgs(["--generate-decision"]), /argument/);
});
