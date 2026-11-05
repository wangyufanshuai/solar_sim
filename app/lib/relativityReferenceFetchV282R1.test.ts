import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isBarycenterTargetIdentityV282R1, RELATIVITY_BARYCENTER_TARGETS_V282R1, RELATIVITY_REFERENCE_EPOCHS_V282R1 } from "./relativityReferenceFetchV282R1";

describe("v282r1 low-memory barycenter fetch", () => {
  it("keeps nine system barycenters separate from body centers", () => {
    expect(RELATIVITY_BARYCENTER_TARGETS_V282R1).toHaveLength(9);
    expect(isBarycenterTargetIdentityV282R1({ targetId: "jupiter", command: "5", naifTargetId: 5, targetKind: "planetary-system-barycenter" })).toBe(true);
    expect(isBarycenterTargetIdentityV282R1({ targetId: "jupiter", command: "599", naifTargetId: 599, targetKind: "body-center" })).toBe(false);
    expect(RELATIVITY_REFERENCE_EPOCHS_V282R1).toHaveLength(33);
  });

  it("contains one network call site and no retry loop", () => {
    const source = readFileSync(resolve(process.cwd(), "scripts/fetch-relativity-reference-v282r1.py"), "utf8");
    expect(source.match(/urlopen\(/g)).toHaveLength(1);
    expect(source).not.toContain("for attempt in range");
    expect(source).toContain("requestsPerTargetLimit\": 1");
    expect(source).toContain("automaticRetryApplied\": False");
  });
});
