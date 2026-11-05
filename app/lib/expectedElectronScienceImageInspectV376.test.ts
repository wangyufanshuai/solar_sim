import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseExpectedElectronScienceImageInspectV376 } from "./expectedElectronScienceImageInspectV376";

describe("v376 expected electron image inspect", () => {
  it("reports no envelope and no zero-image fallback", () => {
    expect(
      parseExpectedElectronScienceImageInspectV376(
        JSON.parse(
          readFileSync(
            "dist/science/expected-electron-image-v376/inspect.json",
            "utf8",
          ),
        ),
      ),
    ).toMatchObject({
      status: "blocked-envelope-unavailable",
      presentInputCount: 0,
      missingInputs: ["v375-dual-authority-envelope"],
      compilerImplemented: true,
      buildExecuted: false,
      imageAvailable: false,
      jsonPublished: false,
      csvPublished: false,
      zeroImageFallbackUsed: false,
      observedCountsAvailable: false,
      attemptConsumed: false,
      networkAttempted: false,
    });
  });
});
