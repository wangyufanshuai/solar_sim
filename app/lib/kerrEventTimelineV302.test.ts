import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  KERR_EVENT_RADIUS_AGREEMENT_LIMIT_M_V302,
  createKerrEventTimelineViewV302,
  parseKerrEventTimelineViewV302,
} from "./kerrEventTimelineV302";

const geometry = () => JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"), "utf8"));

describe("v302 canonical Kerr event timelines", () => {
  it("locks all 16 rays, two independent formulas and earliest valid events", () => {
    const view = createKerrEventTimelineViewV302(geometry());
    expect(view).toMatchObject({
      version: "v302-kerr-canonical-event-timeline-v1",
      status: "canonical-event-timelines-qualified",
      rayCount: 16,
      classCounts: { capture: 6, escape: 6, "disk-hit": 4 },
      parameterComparisonBoundary: "formula-parameters-are-not-cross-compared",
      denseBoundary: "canonical-16-rays-not-dense-campaign",
    });
    expect(view.timelines.every((timeline) => timeline.classificationAgreement
      && timeline.selectedRadiusDifferenceM < KERR_EVENT_RADIUS_AGREEMENT_LIMIT_M_V302
      && timeline.carter.events.find((event) => event.valid)?.kind === timeline.classification
      && timeline.kerrSchild.events.find((event) => event.valid)?.kind === timeline.classification)).toBe(true);
    expect(view.timelines.some((timeline) => timeline.carter.events.some((event) => !event.valid))).toBe(true);
    expect(view.timelines.some((timeline) => timeline.carter.radialTurningPoints.length > 0)).toBe(true);
    expect(view.timelines.some((timeline) => timeline.kerrSchild.polarTurningPoints.length > 0)).toBe(true);
  });

  it("round-trips the bounded view without comparing unlike formula parameters", () => {
    const view = createKerrEventTimelineViewV302(geometry());
    expect(parseKerrEventTimelineViewV302(JSON.parse(JSON.stringify(view)))).toEqual(view);
    const escape = view.timelines.find((timeline) => timeline.rayId === "escape-00")!;
    expect(escape.carter.selectedEvent.parameter).not.toBe(escape.kerrSchild.selectedEvent.parameter);
    expect(escape.carter.selectedEvent.radiusM).toBeCloseTo(escape.kerrSchild.selectedEvent.radiusM, 12);
  });

  it("fails closed on invalid-event promotion, ordering and summary drift", () => {
    const invalidPromoted = geometry();
    const capture02 = invalidPromoted.executions.find((row: Record<string, unknown>) => row.rayId === "capture-02"
      && row.formulation === "carter-mino-dop853-constraint-stabilized-v296"
      && row.toleranceClass === "release" && row.branch === "A");
    capture02.events[0].valid = true;
    expect(() => createKerrEventTimelineViewV302(invalidPromoted))
      .toThrow("v302-earliest-valid-event-conservation-failed");

    const reordered = geometry();
    const capture03 = reordered.executions.find((row: Record<string, unknown>) => row.rayId === "capture-03"
      && row.formulation === "cartesian-kerr-schild-hamiltonian-dop853-v292"
      && row.toleranceClass === "release" && row.branch === "A");
    capture03.events.reverse();
    expect(() => createKerrEventTimelineViewV302(reordered)).toThrow("v302-event-order-invalid");

    const view = createKerrEventTimelineViewV302(geometry());
    expect(() => parseKerrEventTimelineViewV302({
      ...view,
      maxima: { ...view.maxima, eventsPerFormula: 99 },
    })).toThrow("v302-timeline-summary-conservation-failed");
  });

  it("loads the bounded timelines only behind Kerr geodesics intent", () => {
    const workbench = readFileSync(resolve(process.cwd(), "app/components/RelativityResearchWorkbenchV280.tsx"), "utf8");
    const timeline = readFileSync(resolve(process.cwd(), "app/components/KerrEventTimelineWorkbenchV302.tsx"), "utf8");
    expect(workbench).toContain('tab === "kerr-geodesics"');
    expect(workbench).toContain("<KerrEventTimelineWorkbenchV302");
    expect(timeline).toContain("/api/atlas/relativity-evidence/artifacts/v302-event-timelines");
    expect(timeline).toContain("MAX_RESPONSE_BYTES = 32 * 1024");
  });
});
