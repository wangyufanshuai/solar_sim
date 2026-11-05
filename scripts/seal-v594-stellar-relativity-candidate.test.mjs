import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";

import { runV594IsolatedResealPasses } from "./seal-v594-stellar-relativity-candidate.mjs";

const rebuilt = Object.freeze([
  "docs/release/v594/source-manifest-v594.json",
  "public/data/stellar-relativity-v594/manifest.json",
]);
const retained = "docs/release/v594/release-export-v594.json";
const tracked = Object.freeze([...rebuilt, retained]);

async function seed(root) {
  for (const path of tracked) {
    const absolute = resolve(root, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, path === retained ? "retained\n" : "stable\n", "utf8");
  }
}

async function buildStable({ outputRoot }) {
  for (const path of rebuilt) {
    const absolute = resolve(outputRoot, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, "stable\n", "utf8");
  }
}

test("v594 reseal derives two byte-identical passes outside formal paths", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v594-reseal-formal-"));
  try {
    await seed(root);
    const result = await runV594IsolatedResealPasses({
      root,
      trackedPaths: tracked,
      rebuiltPaths: rebuilt,
      buildCandidate: buildStable,
    });
    assert.deepEqual(result.firstPass, result.secondPass);
    assert.equal((await readFile(resolve(root, rebuilt[0]), "utf8")), "stable\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v594 reseal failure leaves every formal output byte-identical", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v594-reseal-formal-failure-"));
  let call = 0;
  try {
    await seed(root);
    const before = await Promise.all(tracked.map((path) => readFile(resolve(root, path))));
    await assert.rejects(runV594IsolatedResealPasses({
      root,
      trackedPaths: tracked,
      rebuiltPaths: rebuilt,
      buildCandidate: async ({ outputRoot }) => {
        call += 1;
        for (const path of rebuilt) {
          const absolute = resolve(outputRoot, path);
          await mkdir(dirname(absolute), { recursive: true });
          await writeFile(absolute, `drift-${call}\n`, "utf8");
        }
      },
    }), /byte-drift|formal-derived-output-drift/);
    const after = await Promise.all(tracked.map((path) => readFile(resolve(root, path))));
    assert.deepEqual(after, before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
