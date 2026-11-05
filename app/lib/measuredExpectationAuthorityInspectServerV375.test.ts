import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadMeasuredExpectationAuthorityInspectV375,
  resetMeasuredExpectationAuthorityInspectServerV375CacheForTests,
} from "./measuredExpectationAuthorityInspectServerV375";

afterEach(() => resetMeasuredExpectationAuthorityInspectServerV375CacheForTests());

describe("v375 measured expectation inspect server", () => {
  it("loads the bounded one-of-eight artifact", async () => {
    const artifact = await loadMeasuredExpectationAuthorityInspectV375();
    expect(artifact).toMatchObject({
      status: "blocked-dual-authority-inputs-unavailable",
      presentInputCount: 1,
      photonInputQualified: true,
      detectorAuthorityQualified: false,
      geometryAuthorityQualified: false,
      measuredExpectationAvailable: false,
    });
  });

  it("rejects a tampered artifact", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v375-"));
    const path = join(root, "dist/science/measured-expectation-v375/inspect.json");
    await mkdir(dirname(path), { recursive: true });
    const artifact = JSON.parse(
      await readFile("dist/science/measured-expectation-v375/inspect.json", "utf8"),
    );
    artifact.expectationRowCount = 1;
    await writeFile(path, JSON.stringify(artifact));
    await expect(loadMeasuredExpectationAuthorityInspectV375(root)).rejects.toThrow();
  });
});
