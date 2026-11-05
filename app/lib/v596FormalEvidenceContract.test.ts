import { describe, expect, it } from "vitest";
import { createAtlasV596BuildIdentity } from "./atlasV596BuildIdentity";
import { createV596FormalEvidenceReceipt } from "./v596FormalEvidenceContract";

describe("v596 formal evidence contract", () => {
  it("fails closed for an unbound final identity", () => {
    const identity = createAtlasV596BuildIdentity({ nodeEnv: "test" });
    expect(() => createV596FormalEvidenceReceipt({} as never, identity)).toThrow(
      "v596-formal-evidence-identity",
    );
  });
});

