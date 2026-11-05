#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(".");
const output = resolve(root, "dist/science/strong-gravity-v278-shadow-evidence.json");
const canonical = (value) => JSON.stringify(value, (_, entry) => entry && typeof entry === "object" && !Array.isArray(entry)
  ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))) : entry);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const sourceSha = hash(await readFile(resolve(root, "app/lib/strongGravityRenderingV278.ts")));
const unsigned = {
  version: "v278-strong-gravity-rendering-shadow-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "implemented-awaiting-qualification",
  sourceSha256: sourceSha,
  scientificPayload: "v277-corrected-kerr-ray-payload-required",
  diskModel: "novikov-thorne-page-thorne-thin-optically-thick-profile",
  modes: {
    science: { randomNoise: false, bloom: false, fixedLinearSrgb: true },
    cinematic: { seededNoiseOnly: true, scientificClassificationMutation: false },
  },
  qualification: { v277ShortGate: "not-run", visualMatrix: "not-run", fitCampaign: "not-run" },
  boundary: "test-particle-analytic-thin-disk-not-grmhd",
  science: {
    defaultKernel: "legacy-eih-1pn",
    codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8",
    screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037",
    workerPhysicsMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrMutation: "not-applied",
  },
  release: { formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowPromotionApplied: false, publicDeploymentBlocked: true },
};
const evidence = { ...unsigned, evidenceSha256: hash(canonical(unsigned)) };
await mkdir(resolve(root, "dist/science"), { recursive: true });
const part = `${output}.part`;
await writeFile(part, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
await rename(part, output);
console.log(JSON.stringify({ output, status: evidence.status, evidenceSha256: evidence.evidenceSha256 }, null, 2));
