import { spawn } from "node:child_process";

const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "npm";
const args = process.platform === "win32"
  ? ["/d", "/s", "/c", "npm run visual:acceptance"]
  : ["run", "visual:acceptance"];

const child = spawn(command, args, {
  cwd: process.cwd(),
  stdio: "inherit",
  env: {
    ...process.env,
    SOLAR_VISUAL_OUT_DIR: process.env.SOLAR_VISUAL_OUT_DIR ?? ".visual-runs/tour",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`visual tour interrupted: ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});
