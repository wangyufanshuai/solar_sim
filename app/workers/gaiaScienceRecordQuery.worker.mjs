import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parentPort } from "node:worker_threads";
import { DatabaseSync } from "node:sqlite";

const PROJECT_ROOT = process.env.ATLAS_PROJECT_ROOT?.trim() || process.cwd();
const DATABASE_PATH = resolve(PROJECT_ROOT, "dist/gaia-science-v8/gaia-science-v8.sqlite");
const MANIFEST_PATH = resolve(PROJECT_ROOT, "dist/gaia-science-v8/gaia-science-v8.manifest.json");
let database = null;
let manifest = null;

function ensureFrozenSource() {
  if (database && manifest) return;
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  database = new DatabaseSync(DATABASE_PATH, { readOnly: true });
}

parentPort?.on("message", ({ id, sourceId }) => {
  try {
    ensureFrozenSource();
    const statement = database.prepare("SELECT * FROM gaia_science WHERE source_id = ?");
    statement.setReadBigInts(true);
    const row = statement.get(BigInt(sourceId));
    parentPort.postMessage({
      id,
      ok: true,
      row: row ?? null,
      sourceSha256: manifest?.output?.sha256 ?? "",
      retrievedAt: manifest?.retrievedAt ?? "",
    });
  } catch {
    parentPort.postMessage({ id, ok: false, error: "frozen-source-unavailable" });
  }
});
