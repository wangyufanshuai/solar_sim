import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const ATLAS_LEGACY_COMMAND_MAP_VERSION = "v256-legacy-command-map";

/** The v256 JSON snapshot preserves all 353 exact pre-unification commands. */
export function loadAtlasLegacyCommandMapV256(projectRoot = process.cwd()) {
  const snapshot = JSON.parse(readFileSync(
    resolve(projectRoot, "scripts/atlas-legacy-command-map-v256.json"),
    "utf8",
  ));
  return Object.freeze({ ...snapshot });
}

/** Route nested references to removed package scripts back through the unified CLI. */
export function rewriteAtlasLegacyCommandReferencesV256(commandBody, legacy, modernScripts) {
  return commandBody.replace(/\bnpm run ([A-Za-z0-9:_-]+)/g, (match, script) => {
    if (Object.hasOwn(modernScripts, script) || !Object.hasOwn(legacy, script)) return match;
    return `npm run atlas -- legacy ${script}`;
  });
}
