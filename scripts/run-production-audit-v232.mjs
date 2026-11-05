import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("dist/science/production-audit-v232.json");
const npmArguments = ["audit", "--omit=dev", "--registry=https://registry.npmjs.org", "--json"];
const child = process.platform === "win32"
  ? spawn(process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe", [
      "/d", "/s", "/c", `npm ${npmArguments.join(" ")}`,
    ], { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"], windowsHide: true })
  : spawn("npm", npmArguments, { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });

let stdout = "";
let stderr = "";
child.stdout.setEncoding("utf8");
child.stderr.setEncoding("utf8");
child.stdout.on("data", (chunk) => { stdout += chunk; });
child.stderr.on("data", (chunk) => { stderr += chunk; });
const exitCode = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("close", resolve);
});

let audit;
try {
  audit = JSON.parse(stdout);
} catch {
  audit = { parseError: true, stdout };
}
const vulnerabilities = audit?.metadata?.vulnerabilities ?? {};
const total = Number(vulnerabilities.total ?? Number.NaN);
const report = {
  version: "v232-production-npm-audit",
  generatedAt: new Date().toISOString(),
  registry: "https://registry.npmjs.org",
  omit: "dev",
  exitCode,
  vulnerabilities,
  dependencyCounts: audit?.metadata?.dependencies ?? null,
  stderr: stderr.trim(),
  passed: exitCode === 0 && total === 0,
};
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
