import path from "node:path";
import { pathToFileURL } from "node:url";

export function isIgnorableClosedResponseController(error) {
  return error?.code === "ERR_INVALID_STATE" &&
    String(error?.message ?? "").includes("Controller is already closed");
}

export function installAtlasServerErrorPolicy() {
  if (process.hasUncaughtExceptionCaptureCallback?.()) return;
  process.setUncaughtExceptionCaptureCallback?.((error) => {
    if (isIgnorableClosedResponseController(error)) return;
    console.error("Orbit Atlas server uncaught exception", error);
    process.exit(1);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  installAtlasServerErrorPolicy();
  const serverPath = path.resolve(process.argv[2] ?? "server.js");
  await import(pathToFileURL(serverPath).href);
}

