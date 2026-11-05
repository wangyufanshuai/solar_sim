import { afterEach, describe, expect, it } from "vitest";

import {
  loadKerrDetectorInputAdmissionV451,
  resetKerrDetectorInputAdmissionServerCacheForTestsV451,
} from "./kerrDetectorInputAdmissionServerV451";

afterEach(() => resetKerrDetectorInputAdmissionServerCacheForTestsV451());

describe("v451 detector admission server", () => {
  it("single-flights a bounded qualification artifact and never exposes staging files", async () => {
    const first = loadKerrDetectorInputAdmissionV451();
    const second = loadKerrDetectorInputAdmissionV451();
    const [loaded, replay] = await Promise.all([first, second]);
    expect(replay.artifact.artifactSha256).toBe(loaded.artifact.artifactSha256);
    expect(loaded.summary.detector.files).toHaveLength(6);
    expect(loaded.export.name).toBe("input-admission-qualification.json");
    expect(loaded.export.bytes.byteLength).toBeLessThan(128 * 1024);
  });
});
