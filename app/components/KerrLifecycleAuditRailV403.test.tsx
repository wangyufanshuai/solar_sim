import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v403 lifecycle audit rail", () => {
  it("renders sanitized lifecycle counts without fetching, Canvas, or science mutation", () => {
    const source = readFileSync("app/components/KerrLifecycleAuditRailV403.tsx", "utf8");
    const hub = readFileSync("app/components/KerrObservationHubV400.tsx", "utf8");
    expect(source).toContain("Lifecycle audit rail");
    expect(source).toContain("snapshot.stages");
    expect(source).toContain("audit.successCount");
    expect(source).toContain("audit.failureCount");
    expect(source).toContain("audit.releasedPendingCount");
    expect(source).toContain('data-atlas-v403-browser-soak-qualified="false"');
    expect(source).toContain('data-atlas-v403-science-buffer-mutation="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useState");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(hub).toContain("<KerrLifecycleAuditRailV403 snapshot={evidenceLifecycle} />");
  });
});
