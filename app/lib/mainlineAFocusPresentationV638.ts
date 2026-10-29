import type { AtlasScaleBand } from "./atlasRuntimeStateV256";
import type { AtlasRuntimeStoreState } from "./atlasRuntimeStore";
import type { SimulationViewSettings } from "./simulationViewSettings";
import { STELLAR_HERO_BY_ID_V592 } from "./stellarHeroesV592";

export type MainlineAFocusKindV638 = "star" | "nearby-star" | "bright-star" | "nebula" | "constellation";
export type MainlineAFocusScaleV638 = {
  scaleBand: AtlasScaleBand;
  scaleJourney: { requestId: number; lifecycle: string };
};
type Host = {
  read: () => MainlineAFocusScaleV638;
  setBand: (band: AtlasScaleBand) => void;
};
type OwnedFocus = {
  objectId: string;
  kind: MainlineAFocusKindV638;
  originalBand: AtlasScaleBand;
  appliedBand: AtlasScaleBand;
  requestId: number;
};
const KINDS = new Set(["star", "nearby-star", "bright-star", "nebula", "constellation"]);
const BANDS = new Set(["solar", "stellar", "galactic", "local-group", "near-universe"]);

export function knownStellarFocusV638(catalogId: string): boolean {
  const id = catalogId.startsWith("stellar-hero:") ? catalogId.slice(13) : catalogId;
  return Object.hasOwn(STELLAR_HERO_BY_ID_V592, id);
}

export function mainlineAFocusBandV638(kind: string, current: AtlasScaleBand): AtlasScaleBand | null {
  if (!KINDS.has(kind) || !BANDS.has(current)) return null;
  return current === "galactic" ? "galactic" : "stellar";
}

type SolarAnnotationFocusStateV638 = Pick<AtlasRuntimeStoreState,
  "sceneMode" | "experienceMode" | "researchOverlay" | "observerPresentation" | "scaleBand" | "scaleJourney"
  | "selectedObjectId" | "focusRequestId" | "focusTransition" | "focusCommand">;
export type MainlineASolarAnnotationGateV638 = Readonly<{
  selectedCatalogId: string;
  sceneMode: string;
  researchDiagnosticsActive: boolean;
  captureActive: boolean;
  launchActive: boolean;
  kerrActive: boolean;
  closeupActive: boolean;
}>;

/** Hide only solar annotations while the current sky object owns an ordinary focus. */
export function mainlineASolarAnnotationsSuppressedV638(
  state: SolarAnnotationFocusStateV638,
  gate: MainlineASolarAnnotationGateV638,
): boolean {
  if ((gate.sceneMode !== "atlas" && gate.sceneMode !== "inspect")
    || (state.sceneMode !== "atlas" && state.sceneMode !== "inspect")
    || state.experienceMode === "research" || state.researchOverlay !== "none"
    || state.observerPresentation.enabled
    || gate.researchDiagnosticsActive || gate.captureActive || gate.launchActive
    || gate.kerrActive || gate.closeupActive
    || (state.scaleBand !== "stellar" && state.scaleBand !== "galactic")
    || state.scaleJourney.lifecycle !== "idle" || !gate.selectedCatalogId) return false;
  const command = state.focusCommand;
  if (!command || command.phase === "idle" || command.phase !== state.focusTransition
    || command.requestId !== state.focusRequestId) return false;
  const target = command.target;
  return (target.kind === "catalog-object" || target.kind === "stellar")
    && target.catalogId === gate.selectedCatalogId
    && target.objectId === state.selectedObjectId;
}

/** Derive render props from the latest preference; never borrow or overwrite saved settings. */
export function mainlineAFocusBodyViewSettingsV638(
  settings: SimulationViewSettings,
  annotationsSuppressed: boolean,
): SimulationViewSettings {
  return annotationsSuppressed && settings.showBodyLabels
    ? { ...settings, showBodyLabels: false }
    : settings;
}

function validScale(value: MainlineAFocusScaleV638): boolean {
  return BANDS.has(value.scaleBand) && Number.isSafeInteger(value.scaleJourney.requestId)
    && value.scaleJourney.requestId >= 0;
}

/** A focus may borrow a visible scale, but never undo a later manual scale choice. */
export function createMainlineAFocusPresentationV638(host: Host) {
  let owned: OwnedFocus | null = null;
  function owns(current: MainlineAFocusScaleV638): boolean {
    return owned !== null && current.scaleBand === owned.appliedBand
      && current.scaleJourney.requestId === owned.requestId
      && current.scaleJourney.lifecycle === "idle";
  }
  function release(): boolean {
    const previous = owned;
    const current = host.read();
    const restore = previous !== null && validScale(current) && owns(current)
      && current.scaleBand !== previous.originalBand;
    owned = null;
    if (restore) host.setBand(previous!.originalBand);
    return restore;
  }
  return {
    focus(objectId: string, kind: string): boolean {
      const current = host.read();
      const band = mainlineAFocusBandV638(kind, current.scaleBand);
      if (!validScale(current) || !band || !objectId || objectId.length > 256
        || /[\u0000-\u001f]/u.test(objectId)) return false;
      const originalBand = owns(current) ? owned!.originalBand : current.scaleBand;
      if (current.scaleBand !== band || current.scaleJourney.lifecycle !== "idle") host.setBand(band);
      const after = host.read();
      if (!validScale(after) || after.scaleBand !== band || after.scaleJourney.lifecycle !== "idle") {
        owned = null;
        return false;
      }
      owned = { objectId, kind: kind as MainlineAFocusKindV638, originalBand,
        appliedBand: band, requestId: after.scaleJourney.requestId };
      return true;
    },
    release,
    snapshot: (): OwnedFocus | null => owned ? { ...owned } : null,
  };
}
