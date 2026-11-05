import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrGridAxisInfluenceV533.tsx", "utf8");

describe("v533 Science Cinematic V8.2 HUD", () => {
  it("renders the eight summaries and all omission ledgers", () => {
    expect(source).toContain("stochasticAxisSummaries");
    expect(source).toContain("deterministicAxisSummaries");
    expect(source).toContain("stochasticOmissionRows");
    expect(source).toContain("deterministicOmissionRows");
    expect(source).toContain("scientificGeometryInputCount");
  });

  it("states the scientific boundary in valid UTF-8", () => {
    expect(source).toContain("这不是实测优先级，也不是推荐");
    expect(source).toContain("No metric utility, axis prior, probability");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });
});
