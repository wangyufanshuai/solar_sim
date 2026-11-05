#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(".");
const out = resolve(root, "dist/science/kerr-campaign-v279");
const statePath = resolve(out, "campaign-state.json");
const canonical = (value) => JSON.stringify(value, (_, entry) => entry && typeof entry === "object" && !Array.isArray(entry)
  ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))) : entry);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const unsigned = {
  version: "v279-kerr-dense-campaign",
  plannedRayCount: 3097,
  plannedShardCount: 49,
  shardSizeLimit: 64,
  executionsPerRay: 8,
  completedShardIndices: [],
  nextShardIndex: 0,
  status: "pending",
  failedShardIndex: null,
  failure: null,
  noAutomaticRetry: true,
  partialResultsAggregated: false,
  promotionDecision: "shadow-retained",
  screenManifestSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037",
  boundary: "serial-offline-corrected-kerr-campaign-no-runtime-promotion",
};
const state = { ...unsigned, stateSha256: hash(canonical(unsigned)) };
await mkdir(out, { recursive: true });
const part = `${statePath}.part`;
await writeFile(part, `${JSON.stringify(state, null, 2)}\n`, "utf8");
await rename(part, statePath);
console.log(JSON.stringify({ statePath, status: state.status, nextShardIndex: state.nextShardIndex, automaticExecution: false }, null, 2));
