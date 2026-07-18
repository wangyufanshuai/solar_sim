import type {
  AtlasInstrumentPanelKind,
  AtlasInstrumentUiVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_INSTRUMENT_UI_VERSION: AtlasInstrumentUiVersion =
  "v32-instrument-polish";

export const ATLAS_INSTRUMENT_PANEL_KINDS: readonly AtlasInstrumentPanelKind[] = [
  "mission-hub",
  "observatory-deck",
  "validation-console",
  "report-studio",
  "relativity-observables",
];
