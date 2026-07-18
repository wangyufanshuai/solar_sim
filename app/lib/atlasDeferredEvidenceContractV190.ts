import type {
  AtlasObservatoryDeckSummary,
  AtlasObservatoryDeckVersion,
  AtlasReportSectionId,
  AtlasReportStudioSummary,
  AtlasReportStudioVersion,
  AtlasScientificReportSummary,
  AtlasScientificReportVersion,
  AtlasValidationConsoleSummary,
  AtlasValidationConsoleVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_SCIENTIFIC_REPORT_VERSION: AtlasScientificReportVersion =
  "v28-scientific-report";
export const ATLAS_REPORT_STUDIO_VERSION: AtlasReportStudioVersion =
  "v29-report-studio";
export const ATLAS_VALIDATION_CONSOLE_VERSION: AtlasValidationConsoleVersion =
  "v30-validation-console";
export const ATLAS_OBSERVATORY_DECK_VERSION: AtlasObservatoryDeckVersion =
  "v31-observatory-deck";

const DEFAULT_REPORT_SECTION_IDS: readonly AtlasReportSectionId[] = [
  "session-overview",
  "mission-capsule",
  "evidence-claims",
  "selected-target",
  "workflow-context",
  "relativity-observables",
  "kerr-lab",
  "trusted-boundaries",
  "excluded-state",
];

// These compatibility values are the established closed-panel root contract.
// Full report, validation and observatory models are loaded when one of their
// panels is requested; this keeps detailed evidence out of the cold Canvas path.
export const ATLAS_COMPACT_SCIENTIFIC_REPORT_V190 = {
  version: ATLAS_SCIENTIFIC_REPORT_VERSION,
  sectionCount: 8,
  sections: [],
  excludedState: [],
} as unknown as AtlasScientificReportSummary;

export const ATLAS_COMPACT_REPORT_STUDIO_V190 = {
  version: ATLAS_REPORT_STUDIO_VERSION,
  reportVersion: ATLAS_SCIENTIFIC_REPORT_VERSION,
  settings: {
    templateId: "mission-dossier",
    includedSectionIds: DEFAULT_REPORT_SECTION_IDS,
    exportFormat: "markdown",
  },
  includedSectionIds: DEFAULT_REPORT_SECTION_IDS,
  includedSectionCount: DEFAULT_REPORT_SECTION_IDS.length,
  totalSectionCount: DEFAULT_REPORT_SECTION_IDS.length,
  includedSections: [],
  sectionToggles: [],
  templates: [],
  excludedStateIncluded: true,
} as unknown as AtlasReportStudioSummary;

export const ATLAS_COMPACT_VALIDATION_CONSOLE_V190 = {
  version: ATLAS_VALIDATION_CONSOLE_VERSION,
  status: "pending",
  readyCount: 1,
  pendingCount: 2,
  failedCount: 0,
  informationalCount: 0,
  blockerCount: 0,
  warningCount: 1,
  infoCount: 0,
  selectedDefaultDomainId: "evidence-ledger",
  domains: [],
  issues: [],
  releaseGate: {
    version: "v36-release-candidate-gate",
    status: "pending",
    blockerCount: 0,
    warningCount: 1,
  },
  context: {},
} as unknown as AtlasValidationConsoleSummary;

export const ATLAS_COMPACT_OBSERVATORY_DECK_V190 = {
  version: ATLAS_OBSERVATORY_DECK_VERSION,
  zoneCount: 4,
  zones: [],
  currentKind: "",
  currentId: "",
  readinessStatus: "pending",
} as unknown as AtlasObservatoryDeckSummary;

