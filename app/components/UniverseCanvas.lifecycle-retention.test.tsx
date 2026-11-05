import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v594 renderer ownership cut", () => {
  it("clears the lifecycle controller ref before scheduling host-unmount observation", () => {
    const source = readFileSync("app/components/UniverseCanvas.tsx", "utf8");
    const cleanup = source.slice(
      source.indexOf("useEffect(() => () => {"),
      source.indexOf("return (", source.indexOf("useEffect(() => () => {")),
    );
    expect(cleanup).toContain("const controller = lifecycleAuditControllerRef.current;");
    expect(cleanup).toContain("lifecycleAuditControllerRef.current = null;");
    expect(cleanup.indexOf("lifecycleAuditControllerRef.current = null;"))
      .toBeLessThan(cleanup.indexOf("controller?.scheduleHostUnmountObservation();"));
  });
});
