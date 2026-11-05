import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import overlayJson from "../data/mainlineANebulaR74AlternativesV661.generated.json";
import MainlineANebulaR74AlternativePanelV661
  from "../components/MainlineANebulaR74AlternativePanelV661";
import {
  inspectR74OverlayV661, r74NextActionV661,
  r74SourceStatusLabelV661, r74TargetLabelV661,
  visibleR74TargetsV661, type R74OverlayV661,
} from "./mainlineANebulaR74AlternativesV661";

const overlay = overlayJson as R74OverlayV661;

function copy(): R74OverlayV661 {
  return structuredClone(overlay);
}

describe("R74 five held nebulae official-page overlay", () => {
  it("keeps page, image, rights and runtime counts separate", () => {
    const checked = inspectR74OverlayV661(overlay);
    expect(checked.ok).toBe(true);
    expect(checked.issues).toEqual([]);
    expect(overlay.counts.officialPagesCaptured).toBe(6);
    expect(overlay.counts.heldTargets).toBe(5);
    expect(overlay.counts.conflictingPages).toBe(1);
    expect(overlay.counts.imageRequestsExecuted).toBe(0);
    expect(overlay.counts.imageResponsesCaptured).toBe(0);
    expect(overlay.counts.rightsSigned).toBe(0);
    expect(overlay.counts.runtimeAdmitted).toBe(0);
    expect(overlay.boundary.scientificPayloadWriteback).toBe(false);
  });

  it("preserves the Dumbbell target conflict while preferring its separate Hubble page", () => {
    const row = overlay.rows.find((item) => item.id === "dumbbell-nebula");
    expect(row?.conflicts).toEqual(["dumbbell-spitzer"]);
    expect(row?.preferredSourceKey).toBe("dumbbell-hubble");
    expect(row?.alternatives[0].target).toBe("Helix Nebula");
    expect(row?.alternatives[0].identityState).toBe("identity-conflict");
    expect(row?.alternatives[1].objectName).toBe("Dumbbell Nebula, M27, NGC 6853");
    expect(row?.imageRequestExecuted).toBe(false);
    expect(row?.rightsSigned).toBe(false);
    expect(r74NextActionV661(row!)).toContain("排除冲突页面");
    expect(r74SourceStatusLabelV661(row!.alternatives[0])).toContain("冲突");
  });

  it("provides useful search and conflict filters without changing evidence state", () => {
    expect(visibleR74TargetsV661(overlay.rows, "all", "")).toHaveLength(5);
    expect(visibleR74TargetsV661(overlay.rows, "identity-conflict", "")
      .map((row) => row.id)).toEqual(["dumbbell-nebula"]);
    expect(visibleR74TargetsV661(overlay.rows, "all", "PIA11827")
      .map((row) => row.id)).toEqual(["cats-eye-nebula"]);
    expect(visibleR74TargetsV661(overlay.rows, "page-candidate", "STScI")
      .map((row) => row.id)).toEqual(["dumbbell-nebula", "bubble-nebula"]);
    expect(r74TargetLabelV661("omega-nebula")).toContain("Omega");
  });

  it("rejects rights or image promotion in a generated overlay", () => {
    const promoted = copy();
    promoted.counts.rightsSigned = 1 as 0;
    promoted.rows[0].imageRequestExecuted = true as false;
    promoted.rows[0].rightsSigned = true as false;
    const checked = inspectR74OverlayV661(promoted);
    expect(checked.ok).toBe(false);
    expect(checked.issues).toContain("overlay-counts-or-boundary-invalid");
    expect(checked.issues).toContain("ring-nebula:target-contract-invalid");
  });

  it("rejects erasing the NASA Target mismatch", () => {
    const forged = copy();
    const dumbbell = forged.rows[1];
    dumbbell.conflicts = [];
    dumbbell.alternatives[0].identityState = "page-identity-confirmed";
    dumbbell.alternatives[0].inspectionIssues = [];
    const checked = inspectR74OverlayV661(forged);
    expect(checked.ok).toBe(false);
    expect(checked.issues).toContain("known-dumbbell-target-conflict-missing");
    expect(checked.issues.some((issue) =>
      issue.includes("identity-conflict-erased"))).toBe(true);
  });

  it("rejects foreign download links and fabricated response pins", () => {
    const forged = copy();
    forged.rows[4].alternatives[0].downloads[0].url = "https://example.org/fake.jpg";
    forged.rows[2].alternatives[0].rawArtifact = null;
    const checked = inspectR74OverlayV661(forged);
    expect(checked.ok).toBe(false);
    expect(checked.issues.some((item) => item.includes("download-link-not-official")))
      .toBe(true);
    expect(checked.issues.some((item) => item.includes("captured-page-invalid")))
      .toBe(true);
  });

  it("server renders a guarded source panel without remote image requests", () => {
    const html = renderToStaticMarkup(createElement(
      MainlineANebulaR74AlternativePanelV661));
    expect(html).toContain('data-mainline-a-r74-panel="v661"');
    expect(html).toContain('data-mainline-a-r74-status="verified-candidate-hold"');
    expect(html).toContain('data-mainline-a-r74-image-requests="0"');
    expect(html).toContain("五项受阻星云");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("assets.science.nasa.gov");
  });
});
