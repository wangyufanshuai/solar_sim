export type CelestialObjectKindV607 = "constellation" | "nebula" | "star";
export type ConfidenceV607 = "measured" | "catalog-derived" | "illustrative" | "unavailable";
export type CoordinateFrameV607 = "ICRS-J2000" | "galactic";

export type ProvenanceV607 = {
  sourceId: string;
  sourceUrl: string;
  retrievedAt: string;
  license: string;
  credit?: string;
};
export type PresentationProfileV607 = {
  visualMode: "line" | "marker" | "texture" | "photosphere";
  palette?: string;
  assetId?: string;
  assetStatus: "none" | "catalog-marker" | "manifest-candidate" | "licensed";
  confidence: ConfidenceV607;
  rightsStatus: "cleared" | "verify-per-image" | "pending-human-signoff" | "not-applicable";
};
export type NarrativeV607 = { titleCn: string; summaryCn: string; detailCn: string; caveatsCn: string[] };
export type ScienceFactsV607 = { coordinateFrame: CoordinateFrameV607; raDeg?: number; decDeg?: number; galLonDeg?: number; galLatDeg?: number; distancePc?: number; angularSizeArcmin?: number; spectralType?: string };
export type CelestialObjectContractV607 = { id: string; kind: CelestialObjectKindV607; displayName: string; science: ScienceFactsV607; presentation: PresentationProfileV607; narrative: NarrativeV607; provenance: ProvenanceV607[]; relatedObjectIds?: readonly string[]; relatedCatalogIds?: readonly string[] };

export type ConstellationMetadataV607 = CelestialObjectContractV607 & {
  kind: "constellation";
  /** Explicit bilingual identity used by the knowledge card and export layers. */
  nameEn: string;
  nameCn: string;
  /** Human-facing seasonal visibility guidance; this is presentation metadata, not a visibility solver. */
  visibleSeasonCn: string;
  /** Commonly used bright-star anchors for the illustrated asterism. */
  representativeStars: readonly string[];
  asterismWaypointsJ2000: [number, number][];
  boundaryJ2000: [number, number][][];
  boundaryStatus: "available" | "pending-source";
};
export type NebulaMetadataV607 = CelestialObjectContractV607 & { kind: "nebula"; catalogName: string; nebulaKind: string };
export type StarMetadataV607 = CelestialObjectContractV607 & { kind: "star"; gaiaSourceId?: string; apparentMagnitudeV?: number; temperatureK?: number };
export type StellarPresentationProfileV607 = {
  shaderProfile: string;
  colorTemperatureK: number;
  radiusSolar: number;
  luminositySolar: number;
  equatorialPolarRadiusRatio: number;
  representation: "parametric-photosphere";
};
/**
 * Explicit epistemic layers for a stellar introduction.  The first two layers
 * describe catalog evidence, while model and inference text are presentation
 * decisions and must not be promoted to measurements.
 */
export type StellarFactLayersV607 = {
  observed: readonly string[];
  catalogDerived: readonly string[];
  model: readonly string[];
  artisticInference: readonly string[];
};
/** An error bar belongs to its cited reference value, never to a render anchor. */
export type StellarReferenceQuantityV607 = {
  id: string;
  labelCn: string;
  value: number;
  unit: string;
  uncertainty: {
    status: "reported" | "propagated-first-order";
    plus: number;
    minus: number;
  } | {
    status: "not-provided";
    plus: null;
    minus: null;
  };
  sourceId: string;
  noteCn: string;
};
export type StellarEvidenceV607 = {
  gaiaAssociation: {
    sourceId: string;
    status: "positional-candidate" | "render-anchor";
    angularSeparationArcsec: number;
    namedStarIdentityConfirmed: false;
    measurementUncertainty: "not-recorded";
    noteCn: string;
  };
  referenceDistance: StellarReferenceQuantityV607 & {
    simbadIdentifier: string;
    parallaxMas: number;
    parallaxErrorMas: number;
    upstreamBibcode: string;
    upstreamSourceId: string;
  };
  literatureModel: readonly StellarReferenceQuantityV607[];
  modelUncertainties: readonly {
    field: "temperatureK" | "luminositySolar" | "radiusSolar";
    labelCn: string;
    status: "not-provided";
    noteCn: string;
  }[];
  sources: readonly ProvenanceV607[];
  scientificPayloadWriteback: false;
};
export type StarMetadataV607WithArtDirection = StarMetadataV607 & {
  artDirection: StellarPresentationProfileV607;
  factLayers: StellarFactLayersV607;
  evidence: StellarEvidenceV607;
};
export type NebulaObservationEncodingV607 = {
  bands: readonly string[];
  colorPolicy: string;
  nakedEyeRepresentationClaimed: boolean;
  scienceModePolicy: string;
  cinematicModePolicy: string;
};
export type NebulaMetadataV607WithEncoding = NebulaMetadataV607 & { observationEncoding: NebulaObservationEncodingV607 };
