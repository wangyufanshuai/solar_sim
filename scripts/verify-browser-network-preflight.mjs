import http from "node:http";
import https from "node:https";

const target = new URL(process.env.ATLAS_PREVIEW_URL || "http://127.0.0.1:3017/");
const transport = target.protocol === "https:" ? https : http;

const result = await new Promise((resolve) => {
  const request = transport.get(target, { timeout: 5_000 }, (response) => {
    response.resume();
    response.on("end", () => resolve({ ok: (response.statusCode ?? 0) >= 200 && (response.statusCode ?? 0) < 500, status: response.statusCode ?? 0 }));
  });
  request.on("timeout", () => request.destroy(new Error("timeout")));
  request.on("error", (error) => resolve({ ok: false, error: error.message, code: error.code ?? "unknown" }));
});

console.log(JSON.stringify({ version: "v166-browser-network-preflight", target: target.href, ...result }));
if (!result.ok) process.exitCode = 1;
