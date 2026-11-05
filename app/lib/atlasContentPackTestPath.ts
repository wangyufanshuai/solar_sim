import path from "node:path";
import { atlasPackForAssetPath } from "./atlasAssetResolver";

const SCIENCE_FIXTURE_NAMES = /^(?:horizons|kerr-|observation-fixtures)/;

export function atlasContentPackTestPath(assetPath: string): string {
  const cleanPath = assetPath.replaceAll("\\", "/").replace(/^\/+/, "").split(/[?#]/, 1)[0] ?? "";
  const packId = cleanPath.startsWith("data/") && SCIENCE_FIXTURE_NAMES.test(cleanPath.slice("data/".length))
    ? "science-fixtures"
    : atlasPackForAssetPath(cleanPath);
  return path.resolve(process.cwd(), "dist", "content-packs", "files", packId, ...cleanPath.split("/"));
}
