import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadObservationGeometryRuntimePublicationInspectV374,
  resetObservationGeometryRuntimePublicationInspectServerV374CacheForTests,
} from "./observationGeometryRuntimePublicationInspectServerV374";

afterEach(() =>
  resetObservationGeometryRuntimePublicationInspectServerV374CacheForTests(),
);

describe("v374 observation geometry publication inspect server", () => {
  it("loads the bounded canonical artifact", async () => {
    const artifact = await loadObservationGeometryRuntimePublicationInspectV374();
    expect(artifact).toMatchObject({
      status: "blocked-publication-inputs-unavailable",
      presentInputCount: 0,
      publicationExecuted: false,
      runtimeGeometryPublished: false,
      measuredAuthorityAvailable: false,
      measuredExpectationAvailable: false,
    });
  });

  it("rejects a tampered artifact", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v374-"));
    const path = join(root, "dist/science/observation-geometry-v374/inspect.json");
    await mkdir(dirname(path), { recursive: true });
    const artifact = JSON.parse(
      await readFile(
        "dist/science/observation-geometry-v374/inspect.json",
        "utf8",
      ),
    );
    artifact.presentInputCount = 1;
    artifact.missingInputs = artifact.missingInputs.slice(1);
    await writeFile(path, JSON.stringify(artifact));
    await expect(
      loadObservationGeometryRuntimePublicationInspectV374(root),
    ).rejects.toThrow("v374-inspect-sha");
  });
});
