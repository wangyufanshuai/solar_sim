import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadObservationGeometryAuthorityInspectV373,
  resetObservationGeometryAuthorityInspectServerV373CacheForTests,
} from "./observationGeometryAuthorityInspectServerV373";

afterEach(() => resetObservationGeometryAuthorityInspectServerV373CacheForTests());

describe("v373 observation geometry authority inspect server", () => {
  it("loads the bounded canonical artifact", async () => {
    const artifact = await loadObservationGeometryAuthorityInspectV373();
    expect(artifact).toMatchObject({
      status: "blocked-admission-inputs-unavailable",
      presentInputCount: 0,
      admissionExecuted: false,
      authorityPointerPublished: false,
      runtimeGeometryPublished: false,
      measuredAuthorityGranted: false,
    });
  });

  it("rejects a tampered artifact", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v373-"));
    const path = join(root, "dist/science/observation-geometry-v373/inspect.json");
    await mkdir(dirname(path), { recursive: true });
    const artifact = JSON.parse(
      await readFile(
        "dist/science/observation-geometry-v373/inspect.json",
        "utf8",
      ),
    );
    artifact.presentInputCount = 1;
    artifact.missingInputs = artifact.missingInputs.slice(1);
    await writeFile(path, JSON.stringify(artifact));
    await expect(loadObservationGeometryAuthorityInspectV373(root)).rejects.toThrow(
      "v373-inspect-sha",
    );
  });
});
