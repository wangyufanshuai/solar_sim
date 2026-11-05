import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v404 replay summary surfaces", () => {
  it("shares one bounded client between Workbench and Audit Rail without cycle state", () => {
    const source = readFileSync("app/components/KerrLifecycleReplaySummaryV404.tsx", "utf8");
    const client = readFileSync("app/lib/relativityLifecycleEvidenceClientV404.ts", "utf8");
    const rail = readFileSync("app/components/KerrLifecycleAuditRailV403.tsx", "utf8");
    const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    expect(source).toContain("fixture only · browser soak not run");
    expect(source).toContain('data-atlas-v404-cycle-details-in-react-state="false"');
    expect(source).toContain('data-atlas-v404-science-buffer-mutation="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useState");
    expect(source).not.toContain("<canvas");
    expect(client).toContain("if (requestPromise) return requestPromise");
    expect(client).toContain("summary: result.summary");
    expect(client).not.toContain("automaticRetry");
    expect(rail).toContain('<KerrLifecycleReplaySummaryV404 surface="audit-rail" />');
    expect(workbench).toContain('<KerrLifecycleReplaySummaryV404 surface="workbench" />');
  });
});
