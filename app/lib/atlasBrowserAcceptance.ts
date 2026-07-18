import type {
  AtlasBrowserAcceptanceSummary,
  AtlasBrowserAcceptanceVersion,
  AtlasBrowserAcceptanceViewport,
} from "./simulationDiagnosticsTypes";

export const ATLAS_BROWSER_ACCEPTANCE_VERSION: AtlasBrowserAcceptanceVersion =
  "v38-browser-acceptance-harness";

export const ATLAS_BROWSER_ACCEPTANCE_BOUNDARY =
  "Local browser acceptance harness metadata only. The runtime UI does not claim the latest command result, CI certification, online validation, scientific certification, or physics mutation.";

const ATLAS_BROWSER_ACCEPTANCE_VIEWPORTS: readonly AtlasBrowserAcceptanceViewport[] = [
  {
    id: "desktop-chrome-1440x900",
    label: "Desktop Chrome 1440x900",
    width: 1440,
    height: 900,
  },
  {
    id: "mobile-chrome-390x844",
    label: "Mobile Chrome viewport 390x844",
    width: 390,
    height: 844,
  },
];

const CHECKED_CONTRACTS = [
  "v36 release-gate root markers and Validation Console domain",
  "v37 Relativity Observable Atlas root markers and observable rows",
  "v39 Relativity Observable Explainer root markers and derivation cards",
  "v40 Relativity Guided Tour root markers and workflow steps",
  "v41 Accessible Atlas Workbench root and scoped surface markers",
  "v42 Cinematic Scientific Workbench root and visual-system markers",
  "v43 Planetary Visual Fidelity root markers and selected-body close-up states",
  "v44 Cinematic Lighting Composition root markers and body-specific close-up lighting profiles",
  "v35 Kerr Relativity Studio markers and eih-1pn+kerr-geodesic-v17 kernel id",
  "v114 Visual Launch Performance root markers and launch runtime quality markers",
  "desktop/mobile no-horizontal-overflow checks",
  "console error and page error capture",
] as const;

export function createAtlasBrowserAcceptanceSummary(): AtlasBrowserAcceptanceSummary {
  return {
    version: ATLAS_BROWSER_ACCEPTANCE_VERSION,
    status: "informational",
    command: "npm run test:atlas:browser",
    fullGateCommand: "npm run verify:atlas:full",
    runtimeCommandStatus: "not-claimed-in-app",
    browser: "system-chrome",
    viewportCount: ATLAS_BROWSER_ACCEPTANCE_VIEWPORTS.length,
    viewports: ATLAS_BROWSER_ACCEPTANCE_VIEWPORTS,
    checkedContracts: CHECKED_CONTRACTS,
    primaryMetric:
      "Local Playwright acceptance harness over system Chrome; 2 viewports; runtime result not claimed in app.",
    trustedBoundary: ATLAS_BROWSER_ACCEPTANCE_BOUNDARY,
  };
}
