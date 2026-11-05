import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadExpectedElectronScienceImageInspectV376,
  resetExpectedElectronScienceImageInspectServerV376CacheForTests,
} from "./expectedElectronScienceImageInspectServerV376";

afterEach(() => resetExpectedElectronScienceImageInspectServerV376CacheForTests());

describe("v376 expected electron image inspect server", () => {
  it("loads the bounded unavailable artifact", async () => {
    expect(await loadExpectedElectronScienceImageInspectV376()).toMatchObject({
      status: "blocked-envelope-unavailable",
      presentInputCount: 0,
      imageAvailable: false,
      zeroImageFallbackUsed: false,
      observedCountsAvailable: false,
    });
  });

  it("rejects a tampered artifact", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v376-"));
    const path = join(root, "dist/science/expected-electron-image-v376/inspect.json");
    await mkdir(dirname(path), { recursive: true });
    const artifact = JSON.parse(
      await readFile(
        "dist/science/expected-electron-image-v376/inspect.json",
        "utf8",
      ),
    );
    artifact.zeroImageFallbackUsed = true;
    await writeFile(path, JSON.stringify(artifact));
    await expect(loadExpectedElectronScienceImageInspectV376(root)).rejects.toThrow();
  });
});
