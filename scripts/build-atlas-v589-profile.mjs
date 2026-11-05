import { spawn } from "node:child_process";

const requested = process.argv[2];
if (!new Set(["standalone-full", "vercel-lite"]).has(requested)) {
  throw new Error("usage: build-atlas-v589-profile.mjs <standalone-full|vercel-lite>");
}

const suffix = requested === "vercel-lite" ? "lite" : "standalone";
const child = spawn(process.execPath, [
  "scripts/build-atlas-profile.mjs",
  "--profile", "local-shadow",
  "--dist-dir", `.next-atlas-v589-${suffix}-current`,
  "--previous-dist-dir", `.next-atlas-v589-${suffix}-previous`,
  "--rotate",
], {
  cwd: process.cwd(),
  stdio: "inherit",
  windowsHide: true,
  env: {
    ...process.env,
    ATLAS_LOCAL_SHADOW_ROUTE_VERSION: "v589",
    ATLAS_NODE_HEAP_MB: "8192",
    NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER: requested,
  },
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`v589-${suffix}-build-signal:${signal}`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
