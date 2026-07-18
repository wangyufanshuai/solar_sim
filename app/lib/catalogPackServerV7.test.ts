import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  catalogPackManifestForClient,
  loadLocalCatalogPackDescriptor,
  resolveAllowedCatalogChunk,
  resolveLocalCatalogPackRoot,
} from "./catalogPackServerV7";

const projectRoot = process.cwd();

describe("local catalog pack delivery v156", () => {
  it("only enables the implicit dist root in development", () => {
    expect(resolveLocalCatalogPackRoot({ nodeEnv: "production", cwd: projectRoot })).toBeNull();
    expect(resolveLocalCatalogPackRoot({ nodeEnv: "development", cwd: projectRoot })).toBe(path.join(projectRoot, "dist", "catalog-million-v7"));
  });

  it("loads the real V7 manifest without moving the pack into public", async () => {
    const descriptor = await loadLocalCatalogPackDescriptor(path.join(projectRoot, "dist", "catalog-million-v7"));
    expect(descriptor.manifest.rowCount).toBe(1_224_219);
    expect(descriptor.manifest.parameterRichCount).toBe(218_617);
    expect(descriptor.allowedChunks.size).toBe(22);
    expect(catalogPackManifestForClient(descriptor).baseUrl).toBe("/api/atlas/catalog-pack/");
    expect(resolveAllowedCatalogChunk(descriptor, "../manifest.json")).toBeNull();
  });
});
