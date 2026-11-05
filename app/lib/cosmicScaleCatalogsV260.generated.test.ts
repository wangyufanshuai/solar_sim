import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

type CatalogManifest = {
  license?: { id: string; attributionRequired: boolean };
  publicDeploymentBlocked: boolean;
  litePackageApplied?: boolean;
  output: { bytes?: number; sha256: string };
};

describe("generated v260 real-data cosmic catalogs", () => {
  it("freezes OpenNGC with CC-BY-SA attribution into the public data layer", () => {
    const root = resolve(process.cwd(), "public/data/openngc-v260");
    const manifest = JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf8")) as CatalogManifest;
    const catalog = resolve(root, "openngc-v260.json.gz");
    const rows = JSON.parse(gunzipSync(readFileSync(catalog)).toString("utf8")) as unknown[];
    expect(rows).toHaveLength(13_962);
    expect(manifest.license).toMatchObject({ id: "CC-BY-SA-4.0", attributionRequired: true });
    expect(manifest.publicDeploymentBlocked).toBe(false);
    expect(statSync(catalog).size).toBe(manifest.output.bytes);
    expect(sha256(catalog)).toBe(manifest.output.sha256);
  });

  it("keeps all 55,877 Cosmicflows-4 rows local and blocks public bundling", () => {
    const root = resolve(process.cwd(), "dist/local-candidate/cosmicflows4-v260");
    const manifest = JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf8")) as CatalogManifest;
    const catalog = resolve(root, "cosmicflows4-v260.csv.gz");
    const lineCount = gunzipSync(readFileSync(catalog)).toString("utf8").trim().split(/\r?\n/).length - 1;
    expect(lineCount).toBe(55_877);
    expect(manifest.publicDeploymentBlocked).toBe(true);
    expect(manifest.litePackageApplied).toBe(false);
    expect(sha256(catalog)).toBe(manifest.output.sha256);
    expect(existsSync(resolve(process.cwd(), "public/data/cosmicflows4-v260"))).toBe(false);
  });
});
