import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasVisualAssetManifestV274 } from "./atlasVisualAssetManifestV274";

const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;

describe("generated v274 visual asset pack", () => {
  it("is content addressed, licensed and byte-conserving", () => {
    const root = resolve("dist/science-cinematic-v3-v274-assets");
    const manifest = parseAtlasVisualAssetManifestV274(JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf8")));
    const canonical = Object.fromEntries(Object.entries(manifest).filter(([key]) => !["generatedAt", "canonicalSha256", "contentRoot"].includes(key)));
    expect(sha256(JSON.stringify(canonicalize(canonical)))).toBe(manifest.canonicalSha256);
    expect(manifest.entries.reduce((sum, entry) => sum + entry.outputBytes, 0)).toBe(manifest.installedBytes);
    for (const entry of manifest.entries) {
      const bytes = readFileSync(resolve(root, manifest.canonicalSha256, "files", entry.outputPath));
      expect(bytes.byteLength, entry.id).toBe(entry.outputBytes);
      expect(sha256(bytes), entry.id).toBe(entry.outputSha256);
      expect(entry.license.status, entry.id).toBe("approved-runtime");
    }
  });
});
