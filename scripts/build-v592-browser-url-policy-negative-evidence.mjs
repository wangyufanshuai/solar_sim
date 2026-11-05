import { createHash } from "node:crypto";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v592/browser-url-policy-negative-evidence-v592.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.part`;
  writeFileSync(temporary, text);
  rmSync(path, { force: true });
  renameSync(temporary, path);
}

const unsigned = {
  version: "v592-browser-url-policy-negative-evidence-v1",
  generatedAt: "2026-08-15T00:00:00Z",
  status: "blocked-browser-url-policy-manual-open-required",
  browser: "Codex built-in browser",
  route: "http://127.0.0.1:3016/local-shadow-v592",
  attemptCount: 1,
  attempts: [{
    action: "reload-current-v592-tab-after-local-dev-restart",
    result: "rejected",
    reason: "The browser URL policy blocks this action. Browser use cannot visit the requested page because its URL is blocked by the Browser use URL policy.",
  }],
  policyCompliance: {
    automaticRetryPerformed: false,
    alternateBrowserUsed: false,
    rawCdpOrBrowserCommandUsed: false,
    policyCircumventionAttempted: false,
  },
  affectedGates: [
    "gaia-60000-runtime-browser-verification",
    "constellation-88-runtime-browser-verification",
    "post-change-console-page-webgl-audit",
    "post-change-resource-release-audit",
  ],
  unaffectedEvidence: [
    "stellar-24-two-mode-48-frame-browser-matrix-captured-before-policy-block",
    "typescript-eslint-focused-vitest",
    "gaia-supplement-double-build-byte-identity",
    "read-only-candidate-verifier",
    "frozen-boundary-sha-audit",
  ],
  requiredUserAction: "Manually open the route in the Codex built-in browser and tell Codex when it is visible; do not switch browser surfaces.",
  authority: {
    browserGatePassed: false,
    candidatePromotionAllowed: false,
    productionReleaseAuthorized: false,
    scientificPayloadWriteback: false,
  },
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256, route: receipt.route }, null, 2));
