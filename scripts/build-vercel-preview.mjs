import { spawn } from "node:child_process";

process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
process.env.ATLAS_TEXTURE_PROXY = "off";

const npmExecPath = process.env.npm_execpath;
const command = npmExecPath ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
const args = npmExecPath ? [npmExecPath, "run", "build"] : ["run", "build"];
const child = spawn(command, args, {
  env: process.env,
  stdio: "inherit",
  shell: false,
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});
