import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateRelativityReferenceTargetIdentityV287, type RelativityReferenceTargetIdentityV287 } from "./relativityReferenceV287";

describe("v287 Mercury barycenter identity", () => {
  it("separates the requested barycenter command from the Horizons reported id", () => {
    const identity: RelativityReferenceTargetIdentityV287 = {
      requestedBarycenterId: 1,
      requestedCommand: "1",
      reportedHorizonsId: 199,
      reportedName: "Mercury Barycenter",
      targetKind: "planetary-system-barycenter",
      identityResolution: "command-1-resolved-by-horizons-to-mercury-barycenter-199",
      bodyCenterFamily: "separate-not-merged",
      frame: "ICRF/J2000",
      origin: "solar-system-barycenter",
      timeScale: "TDB",
    };
    expect(validateRelativityReferenceTargetIdentityV287(identity)).toBe(true);
  });

  it("retains exactly one request and no automatic retry", () => {
    const source = readFileSync("scripts/fetch-relativity-reference-v287.py", "utf8");
    expect(source.match(/urllib\.request\.urlopen\(/g)).toHaveLength(1);
    expect(source).toContain('"requestLimit": 1');
    expect(source).toContain('"automaticRetryApplied": False');
    expect(source).not.toContain("for target");
  });
});
