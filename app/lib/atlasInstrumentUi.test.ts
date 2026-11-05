import { describe, expect, it } from "vitest";
import {
  ATLAS_INSTRUMENT_PANEL_KINDS,
  ATLAS_INSTRUMENT_UI_VERSION,
} from "./atlasInstrumentUi";
import { ATLAS_WORKBENCH_ACCESSIBILITY_SURFACES } from "./atlasWorkbenchAccessibility";

describe("Atlas Instrument UI v32", () => {
  it("exposes stable version and workbench panel kinds", () => {
    expect(ATLAS_INSTRUMENT_UI_VERSION).toBe("v32-instrument-polish");
    expect(ATLAS_INSTRUMENT_PANEL_KINDS).toEqual([
      "mission-hub",
      "observatory-deck",
      "validation-console",
      "report-studio",
      "relativity-observables",
    ]);
  });

  it("keeps every instrument panel within the v41 accessibility workbench scope", () => {
    expect(
      ATLAS_INSTRUMENT_PANEL_KINDS.every((panelKind) =>
        ATLAS_WORKBENCH_ACCESSIBILITY_SURFACES.includes(panelKind),
      ),
    ).toBe(true);
  });
});
