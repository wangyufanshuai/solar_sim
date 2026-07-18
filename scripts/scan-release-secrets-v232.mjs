import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".");
const roots = ["app", "scripts", "src-tauri", "docs", "tests"];
const rootFiles = [
  "package.json",
  "package-lock.json",
  "next.config.mjs",
  "proxy.ts",
  "vercel.json",
];
const textExtensions = new Set([
  ".cjs", ".css", ".html", ".js", ".json", ".md", ".mjs", ".ps1",
  ".rs", ".toml", ".ts", ".tsx", ".txt", ".yml", ".yaml",
]);
const checks = [
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["github-token", /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g],
  ["openai-key", /\bsk-[A-Za-z0-9_-]{24,}\b/g],
  ["aws-access-key", /\bAKIA[0-9A-Z]{16}\b/g],
  ["vercel-token", /\b(?:vercel_|vcp_)[A-Za-z0-9_-]{20,}\b/g],
  [
    "azure-client-secret-literal",
    /AZURE_CLIENT_SECRET\s*[=:]\s*["'][A-Za-z0-9~._-]{20,}["']/g,
  ],
];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", "target", ".next", "dist", "output", "test-results"].includes(entry.name)) continue;
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(candidate));
    else if (entry.isFile() && textExtensions.has(path.extname(entry.name).toLowerCase())) files.push(candidate);
  }
  return files;
}

const files = [];
for (const directory of roots) {
  const absolute = path.join(root, directory);
  if ((await stat(absolute).catch(() => null))?.isDirectory()) files.push(...await walk(absolute));
}
for (const file of rootFiles) {
  const absolute = path.join(root, file);
  if ((await stat(absolute).catch(() => null))?.isFile()) files.push(absolute);
}

const findings = [];
for (const file of files.sort()) {
  const source = await readFile(file, "utf8");
  for (const [kind, pattern] of checks) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      findings.push({
        kind,
        path: path.relative(root, file).replaceAll("\\", "/"),
        line: source.slice(0, match.index).split("\n").length,
      });
    }
  }
}

const report = {
  version: "v232-release-secret-scan",
  generatedAt: new Date().toISOString(),
  scannedFileCount: files.length,
  findingCount: findings.length,
  findings,
  excludedLocalEnvironmentFiles: [".env", ".env.local"],
  passed: findings.length === 0,
};
const output = path.join(root, "dist", "science", "secret-scan-v232.json");
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output, scannedFileCount: files.length, findingCount: findings.length, passed: report.passed }, null, 2));
if (!report.passed) process.exitCode = 1;

