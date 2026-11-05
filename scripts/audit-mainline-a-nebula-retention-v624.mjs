import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { auditNebulaBatchV624 } from "../app/lib/mainlineANebulaBatchAuditV624.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INPUT = "app/data/mainlineANebulaBatchV624.generated.json";
const ARTIFACT_ROOT = "docs/release/v607/nebula-image-artifacts/r64";
const REPORT = "docs/release/v607/mainline-a-r64-retention-audit.json";

function digest(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function containedArtifact(root, candidate) {
  if (typeof candidate !== "string" || candidate.includes("\\") || candidate.includes(":")) return null;
  if (candidate.split("/").some((part) => part === "." || part === ".." || !part)) return null;
  const base = path.resolve(root, ARTIFACT_ROOT);
  const absolute = path.resolve(root, candidate);
  return absolute.startsWith(base + path.sep) ? absolute : null;
}

export async function inspectRetainedArtifact(root, entry) {
  const absolute = containedArtifact(root, entry.path);
  if (!absolute) return { path: entry.path, status: "invalid-path", issues: ["path-outside-root"] };
  try {
    const base = await fs.realpath(path.resolve(root, ARTIFACT_ROOT));
    const real = await fs.realpath(absolute);
    if (!real.startsWith(base + path.sep)) {
      return { path: entry.path, status: "invalid-path", issues: ["symlink-outside-root"] };
    }
    const info = await fs.stat(real);
    if (!info.isFile()) return { path: entry.path, status: "not-file", issues: ["artifact-not-file"] };
    const bytes = await fs.readFile(real);
    const sha256 = digest(bytes);
    const issues = [];
    if (sha256 !== entry.sha256) issues.push("sha256-mismatch");
    if (bytes.length !== entry.bytes) issues.push("byte-count-mismatch");
    if (entry.action === "quarantine") issues.push("ledger-reference-quarantined");
    return {
      path: entry.path,
      status: issues.length ? "mismatch" : "verified",
      sha256,
      bytes: bytes.length,
      references: entry.references,
      issues,
    };
  } catch (error) {
    return {
      path: entry.path,
      status: error.code === "ENOENT" ? "missing" : "read-error",
      issues: [error.code ?? "unknown-read-error"],
    };
  }
}

export async function auditRetention(root = ROOT) {
  const inputBytes = await fs.readFile(path.join(root, INPUT));
  const batch = JSON.parse(inputBytes);
  const ledger = auditNebulaBatchV624(batch);
  const artifacts = [];
  for (const entry of ledger.retention) artifacts.push(await inspectRetainedArtifact(root, entry));
  const inventory = [];
  const base = path.join(root, ARTIFACT_ROOT);
  const files = await fs.readdir(base, { withFileTypes: true });
  const referenced = new Set(ledger.retention.map((entry) => entry.path));
  for (const entry of files.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = ARTIFACT_ROOT + "/" + entry.name;
    if (referenced.has(relative)) continue;
    inventory.push({
      path: relative,
      entryType: entry.isFile() ? "file" : entry.isSymbolicLink() ? "symlink" : "directory",
      action: "retain-unreferenced",
      reason: "May belong to earlier collection runs; no deletion is authorized or performed.",
    });
  }
  const invalidArtifacts = artifacts.filter((entry) => entry.status !== "verified");
  return {
    schema: "mainline-a-nebula-retention-audit-v624",
    source: INPUT,
    sourceSha256: digest(inputBytes),
    ledger,
    artifacts,
    unreferencedEntries: inventory,
    status: ledger.counts.blockingFindings || invalidArtifacts.length ? "invalid" : "verified-retention-only",
    counts: {
      referenced: artifacts.length,
      verified: artifacts.length - invalidArtifacts.length,
      unreferenced: inventory.length,
      rightsUncleared: ledger.counts.rightsUncleared,
    },
    boundary: {
      cleanup: "report-only",
      filesDeleted: 0,
      runtimeAdmission: "candidate-only",
      scientificPayloadWriteback: false,
      copyrightApproval: false,
      externalSourceAuthenticity: "not-established-by-local-hashes",
    },
  };
}

export async function runRetentionAudit({ root = ROOT, check = false } = {}) {
  const report = await auditRetention(root);
  if (report.status === "invalid") throw new Error("R64 retention audit failed: inconsistent ledger or artifact bytes");
  const text = JSON.stringify(report, null, 2) + "\n";
  if (check) {
    const saved = await fs.readFile(path.join(root, REPORT), "utf8");
    if (saved !== text) throw new Error("R64 retention report is stale");
  } else {
    await fs.writeFile(path.join(root, REPORT), text);
  }
  return { status: report.status, counts: report.counts, sourceSha256: report.sourceSha256 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runRetentionAudit({ check: process.argv.includes("--check") })
    .then((report) => console.log(JSON.stringify(report, null, 2)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
