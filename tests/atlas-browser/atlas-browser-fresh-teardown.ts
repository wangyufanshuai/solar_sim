import { execFileSync } from "child_process";
import type { FullConfig } from "@playwright/test";

export default async function globalTeardown(config: FullConfig): Promise<void> {
  if (process.platform !== "win32") {
    return;
  }

  const configuredPort = Number(config.metadata.atlasFreshPort ?? 3015);
  const port = Number.isInteger(configuredPort) && configuredPort > 0 && configuredPort <= 65535
    ? configuredPort
    : 3015;

  const script = [
    `$line = netstat -ano | Select-String '127\\.0\\.0\\.1:${port}\\s+.*LISTENING' | Select-Object -First 1;`,
    "if ($line) {",
    "  $pidText = (($line.ToString() -split '\\s+') | Where-Object { $_ })[-1];",
    "  Stop-Process -Id ([int]$pidText) -Force -ErrorAction SilentlyContinue;",
    "}",
  ].join("\n");

  execFileSync("powershell", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    script,
  ]);
}
