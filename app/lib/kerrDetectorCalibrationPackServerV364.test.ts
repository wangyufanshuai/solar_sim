import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadKerrDetectorCalibrationPackV364, resetKerrDetectorCalibrationPackServerV364CacheForTests } from "./kerrDetectorCalibrationPackServerV364";

describe("v364 calibration pack server", () => {
  it("validates pack SHA and every published file SHA", async () => {
    resetKerrDetectorCalibrationPackServerV364CacheForTests();
    const first = await loadKerrDetectorCalibrationPackV364(); const second = await loadKerrDetectorCalibrationPackV364();
    expect(first).toBe(second);
    for (const file of first.files) expect(createHash("sha256").update(readFileSync(`dist/science/kerr-detector-calibration-pack-v364/${file.relativePath}`)).digest("hex")).toBe(file.sha256);
  });
});
