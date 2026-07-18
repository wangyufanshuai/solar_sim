import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const baseUrl = argument("--base-url", "http://127.0.0.1:3085").replace(/\/$/, "");
const output = resolve(argument("--output", "dist/science/production-security-v232.json"));
const rootResponse = await fetch(`${baseUrl}/`, { redirect: "manual" });
const html = await rootResponse.text();
const csp = rootResponse.headers.get("content-security-policy") ?? "";
const scriptTags = html.match(/<script\b[^>]*\bsrc=[^>]*>/gi) ?? [];
const sriTags = scriptTags.filter((tag) => /\bintegrity=["']sha384-[^"']+["']/i.test(tag));
const uncoveredScriptSources = scriptTags
  .filter((tag) => !/\bintegrity=["']sha384-[^"']+["']/i.test(tag))
  .map((tag) => tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ?? "unknown");
const debugResponse = await fetch(`${baseUrl}/api/debug-log`, {
  method: "POST",
  headers: { "content-type": "text/plain" },
  body: "v232-production-security-probe",
  redirect: "manual",
});
const healthResponse = await fetch(`${baseUrl}/api/health`, { redirect: "manual" });
const healthText = await healthResponse.text();

const checks = {
  root200: rootResponse.status === 200,
  cspEnforced: csp.length > 0,
  cspNoUnsafeEval: !csp.includes("'unsafe-eval'"),
  cspObjectNone: /(?:^|;)\s*object-src\s+'none'(?:;|$)/.test(csp),
  cspFrameNone: /(?:^|;)\s*frame-src\s+'none'(?:;|$)/.test(csp),
  cspWorkerRestricted: /(?:^|;)\s*worker-src\s+[^;]+/.test(csp),
  sriSha384Enabled: sriTags.length > 0,
  sriCoverageAtLeast80Percent: scriptTags.length > 0 && sriTags.length / scriptTags.length >= 0.8,
  nosniff: rootResponse.headers.get("x-content-type-options") === "nosniff",
  referrerPolicy: rootResponse.headers.get("referrer-policy") === "strict-origin-when-cross-origin",
  permissionsPolicy: (rootResponse.headers.get("permissions-policy") ?? "").includes("camera=()"),
  coop: rootResponse.headers.get("cross-origin-opener-policy") === "same-origin",
  coep: ["require-corp", "credentialless"].includes(
    rootResponse.headers.get("cross-origin-embedder-policy") ?? "",
  ),
  debugProduction404: debugResponse.status === 404,
  health200: healthResponse.status === 200,
};

const report = {
  version: "v232-production-security-verifier-v1",
  generatedAt: new Date().toISOString(),
  status: Object.values(checks).every(Boolean) ? "passed" : "failed",
  baseUrl,
  checks,
  evidence: {
    rootStatus: rootResponse.status,
    debugStatus: debugResponse.status,
    healthStatus: healthResponse.status,
    externalScriptCount: scriptTags.length,
    sha384SriScriptCount: sriTags.length,
    allExternalScriptsHaveSri: scriptTags.length > 0 && sriTags.length === scriptTags.length,
    uncoveredScriptSources,
    cspSha256: createHash("sha256").update(csp).digest("hex"),
    healthBodySha256: createHash("sha256").update(healthText).digest("hex"),
    headers: {
      contentSecurityPolicy: csp,
      xContentTypeOptions: rootResponse.headers.get("x-content-type-options"),
      referrerPolicy: rootResponse.headers.get("referrer-policy"),
      permissionsPolicy: rootResponse.headers.get("permissions-policy"),
      crossOriginOpenerPolicy: rootResponse.headers.get("cross-origin-opener-policy"),
      crossOriginEmbedderPolicy: rootResponse.headers.get("cross-origin-embedder-policy"),
    },
  },
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: report.status, checks }, null, 2));
if (report.status !== "passed") process.exitCode = 1;
