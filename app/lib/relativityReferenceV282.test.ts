import { describe, expect, it } from "vitest";
import { validateRelativityReferenceIdentityV282, type RelativityReferenceBodyIdentityV282 } from "./relativityReferenceV282";

const jupiter: RelativityReferenceBodyIdentityV282 = { id: "jupiter", naifTargetId: 5, horizonsCommand: "@5", targetKind: "planetary-system-barycenter", frame: "ICRF/J2000", origin: "solar-system-barycenter", timeScale: "TDB" };

describe("v282 reference identity boundary", () => {
  it("rejects a body-centre query when the campaign requires a barycentre", () => {
    const result = validateRelativityReferenceIdentityV282({ expected: [jupiter], sourceQueries: { jupiter: "599" } });
    expect(result.status).toBe("blocked-target-identity-mismatch");
  });

  it("accepts matching barycentre identity", () => {
    expect(validateRelativityReferenceIdentityV282({ expected: [jupiter], sourceQueries: { jupiter: "@5" } }).status).toBe("passed");
  });
});
