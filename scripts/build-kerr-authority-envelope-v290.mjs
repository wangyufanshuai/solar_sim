#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const SHORT_GATE = "dist/science/kerr-reference-v288/short-gate-evidence.json";
const CAMPAIGN = "dist/science/kerr-campaign-v288r1/campaign-state.json";
const OUTPUT = "dist/science/kerr-reference-v288/portable-envelope-v290.json";
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "pid", "host", "absolutePath"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)])) : value;
const valueSha = (value) => sha(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const shortBytes = await readFile(resolve(ROOT, SHORT_GATE));
const campaignBytes = await readFile(resolve(ROOT, CAMPAIGN));
const shortGate = JSON.parse(shortBytes);
const campaign = JSON.parse(campaignBytes);
if (shortGate.version !== "v288-corrected-kerr-authority-short-gate-v1" || shortGate.executionCount !== 128 || shortGate.criticalBracketCount !== 40) throw new Error("unexpected v288 short-gate payload");
if (campaign.version !== "v288r1-corrected-kerr-dense-campaign-state-v1") throw new Error("unexpected v288 campaign state");
const unsigned = {
  version: "v290-kerr-v288-portable-evidence-envelope-v1", generatedAt: new Date().toISOString(),
  shortGate: {
    version: shortGate.version, status: shortGate.status, gatePassed: shortGate.gatePassed,
    executionCount: shortGate.executionCount, criticalBracketCount: shortGate.criticalBracketCount,
    classCounts: shortGate.classCounts, failureReasons: shortGate.failureReasons,
    rawEvidenceSha256: shortGate.evidenceSha256, fileSha256: sha(shortBytes),
  },
  campaign: {
    version: campaign.version, status: campaign.status, completedShardCount: campaign.completedShardCount,
    plannedShardCount: campaign.plannedShardCount, nextShardIndex: campaign.nextShardIndex,
    authorityEvidenceSha256: campaign.authorityEvidenceSha256, rawStateSha256: campaign.stateSha256,
    fileSha256: sha(campaignBytes), shardAttempted: campaign.completedShardCount > 0 || campaign.failedShardIndex != null,
  },
  formalProductPointer: "v263", defaultKernel: "legacy-eih-1pn",
  boundary: "portable-js-canonical-envelope-does-not-rewrite-python-authority-evidence",
};
const envelope = { ...unsigned, evidenceSha256: valueSha(unsigned) };
await writeFile(resolve(ROOT, OUTPUT), `${JSON.stringify(envelope, null, 2)}\n`);
console.log(JSON.stringify({ status: envelope.shortGate.status, campaign: envelope.campaign.status, evidenceSha256: envelope.evidenceSha256 }, null, 2));
