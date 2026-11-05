import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import { BOUNDARY, captureCurrentInputs, INPUT_SCHEMA, jsonBytes, sha256 } from "./mainline-a-release-evidence.mjs";

export async function makeFixture() {
  const base = path.resolve(import.meta.dirname, "../tmp");
  await mkdir(base, { recursive: true });
  const workspace = await mkdtemp(path.join(base, "r66-evidence-test-"));
  await mkdir(path.join(workspace, "app"));
  await mkdir(path.join(workspace, "docs"));
  await writeFile(path.join(workspace, "app", "page.tsx"), "export default function Page() { return null; }\n");
  const packageValue = { name: "solar-next-web", mainlineAReleaseIdentity: "solar-sim-mainline-a" };
  for (const name of ["package.json", "package-lock.json", "next.config.mjs", "proxy.ts", "tsconfig.json", "tailwind.config.ts", "postcss.config.mjs", ".env.local"]) {
    await writeFile(path.join(workspace, name), name === "package.json" ? JSON.stringify(packageValue) : "{}\n");
  }
  const snapshot = await captureCurrentInputs(workspace);
  const identity = { buildId: "test-build-055", runtimeBuildId: `mainline-a-${snapshot.sha256.slice(0, 16)}`, branch: "codex/solar-sim-mainline-a", head: "test-head" };
  const input = { schema: INPUT_SCHEMA, mode: "fixture", entries: {} };
  const values = {};
  async function put(role, value, evidenceClass = "static") {
    const name = `docs/${role}.json`;
    const raw = jsonBytes(value);
    await writeFile(path.join(workspace, name), raw);
    input.entries[role] = { path: name, sha256: sha256(raw), evidenceClass };
    values[role] = value;
    await writeFile(path.join(workspace, "input.json"), jsonBytes(input));
  }
  async function save() { await writeFile(path.join(workspace, "input.json"), jsonBytes(input)); }
  await put("build", { ...identity, status: "passed", sourceStable: true, exitCode: 0, profile: "test", inputBefore: snapshot, inputAfterSha256: snapshot.sha256 });
  await put("http", { ...identity, status: "passed", pageStatus: 200, healthStatus: 200, allScriptAssetsOk: true, performanceClaim: false, scientificPayloadWriteback: false }, "http");
  await put("browser", { ...identity, schema: "mainline-a-browser-attempt-v633", status: "blocked-before-navigation", desktop: "not-run", mobileViewport: "not-run", toolResult: { isError: true }, boundary: BOUNDARY }, "browser");
  await put("performance", { ...identity, schema: "mainline-a-performance-evidence-v633", status: "not-run", runs: 0, boundary: BOUNDARY }, "performance");
  return { workspace, snapshot, identity, input, values, put, save };
}
