import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import snapshot from "../data/mainlineAWebReadinessV663.generated.json";
import { currentReadinessV663, evaluateReadinessV663,
  filterReadinessV663, inspectReadinessV663 } from
  "./mainlineAWebReadinessV663";
import MainlineAWebReadinessPanelV663 from
  "../components/MainlineAWebReadinessPanelV663";
import { createReadinessResponseV663, GET } from
  "../api/atlas/mainline-a-web-readiness/route";

const fresh = () => structuredClone(snapshot);

describe("R76 web source and release readiness", () => {
  it("keeps 4 stellar components and 5 nebula images held", () => {
    const view = currentReadinessV663();
    expect(view.status).toBe("valid-candidate-hold");
    expect(view.rows).toHaveLength(9);
    expect(view.rows.filter((row) => row.group === "stellar-component"))
      .toHaveLength(4);
    expect(view.rows.filter((row) => row.group === "nebula-image"))
      .toHaveLength(5);
    expect(view.gates).toHaveLength(6);
    expect(view.gates.every((gate) => gate.status === "pending"))
      .toBe(true);
    expect(view.publicWebReleaseAllowed).toBe(false);
  });

  it("searches actual review targets without creating image requests", () => {
    const rows = currentReadinessV663().rows;
    expect(filterReadinessV663(rows, "stellar-component", "Polaris")
      .map((row) => row.id)).toEqual(["polaris"]);
    expect(filterReadinessV663(rows, "nebula-image", "target-identity")
      .map((row) => row.id)).toEqual(["cats-eye-nebula",
        "dumbbell-nebula"].sort().reverse());
    expect(rows.every((row) => row.requestExecuted === false
      && row.rightsSigned === false
      && row.runtimeAdmission === "candidate-only")).toBe(true);
    expect(rows.filter((row) => row.group === "stellar-component")
      .every((row) => row.responseCaptured === 1)).toBe(true);
    expect(rows.filter((row) => row.group === "nebula-image")
      .every((row) => row.responseCaptured === 0)).toBe(true);
  });

  it("rejects a forged image capture and public release flag", () => {
    const changed = fresh();
    Object.assign(changed.nebulae[0], { imageRequestExecuted: true,
      imageResponseCaptured: 1, rightsSigned: true });
    Object.assign(changed.gates, { publicWebReleaseAllowed: true });
    const issues = inspectReadinessV663(changed);
    expect(issues).toContain("nebula-invalid:ring-nebula");
    expect(issues).toContain("gate-count-or-promotion-invalid");
    expect(evaluateReadinessV663(changed).rows).toHaveLength(0);
  });

  it("rejects a forged component identity and erased source conflict", () => {
    const changed = fresh();
    Object.assign(changed.stars[0], { physicalComponentConfirmed: true });
    changed.nebulae.find((row) => row.id === "dumbbell-nebula")!
      .conflictingSources = [];
    const issues = inspectReadinessV663(changed);
    expect(issues).toContain("star-invalid:acrux");
    expect(issues).toContain("dumbbell-conflict-erased");
  });

  it("rejects foreign source URLs and missing source pins", () => {
    const changed = fresh();
    changed.nebulae[1].officialPageUrl =
      "https://example.invalid/dumbbell";
    changed.sourcePins.pop();
    const issues = inspectReadinessV663(changed);
    expect(issues).toContain("nebula-invalid:dumbbell-nebula");
    expect(issues).toContain("source-pin-coverage-invalid");
  });

  it("renders the nine-object hold board without image elements", () => {
    const html = renderToStaticMarkup(<MainlineAWebReadinessPanelV663 />);
    expect(html).toContain('data-mainline-a-r76-readiness="v663"');
    expect(html).toContain('data-mainline-a-r76-release="blocked"');
    expect(html).toContain("查看待审事项");
    expect(html).not.toContain("<img");
  });

  it("serves sanitized local HTTP state with explicit hold headers", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("x-mainline-a-release-admission"))
      .toBe("hold");
    expect(response.headers.get("x-scientific-payload-writeback"))
      .toBe("false");
    const body = await response.json();
    expect(body.items).toHaveLength(9);
    expect(body.gates).toHaveLength(6);
    expect(body.publicWebReleaseAllowed).toBe(false);
    expect(JSON.stringify(body)).not.toContain("rawArtifact");
  });

  it("returns 503 and no items when the generated decision is invalid", async () => {
    const invalid = evaluateReadinessV663({ schema: "forged" });
    const response = createReadinessResponseV663(invalid);
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("source-invalid-hold");
    expect(body.items).toEqual([]);
    expect(body.publicWebReleaseAllowed).toBe(false);
  });
});
