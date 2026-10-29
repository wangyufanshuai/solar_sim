export const KERR_PRODUCT_UNCERTAINTY_ELIGIBILITY_VERSION_V513 =
  "v513-kerr-product-uncertainty-eligibility-v1" as const;
export const KERR_PRODUCT_UNCERTAINTY_ELIGIBILITY_API_VERSION_V513 =
  "v513-kerr-product-uncertainty-eligibility-api-v1" as const;

export type KerrProductUncertaintyLayerV513 = Readonly<{
  id:
    | "deterministic-band-envelope"
    | "conditional-response-envelope"
    | "synthetic-covariance-propagation"
    | "computational-error-budget"
    | "detector-calibration-systematics"
    | "source-model-systematics"
    | "selection-bias"
    | "dense-sampling-completeness"
    | "heavy-runtime-qualification";
  status: "qualified" | "validation-only" | "unavailable" | "unquantified" | "not-run";
  artifactSha256: string;
  applicability: "four-sparse-rays" | "twelve-band-rows" | "detector-image" | "product";
  maximumRelative: number | null;
  confidenceInterpretationAllowed: false;
  reason: string;
}>;

export type KerrProductUncertaintyEligibilityArtifactV513 = Readonly<{
  version: typeof KERR_PRODUCT_UNCERTAINTY_ELIGIBILITY_VERSION_V513;
  generatedAt: string;
  status: "product-uncertainty-eligibility-qualified-absolute-budget-unavailable";
  source: Readonly<{
    v325ArtifactSha256: string;
    v352ArtifactSha256: string;
    v358ArtifactSha256: string;
    v385ArtifactSha256: string;
    v455ArtifactSha256: string;
    v512GraphArtifactSha256: string;
    v512EvidenceSha256: string;
    v512PointerSha256: string;
  }>;
  layers: readonly KerrProductUncertaintyLayerV513[];
  combination: Readonly<{
    knownNumericalTerms: "linear-sum-without-independence-claim";
    rssApplied: false;
    unknownTermsTreatedAsZero: false;
    syntheticCovarianceMayPromoteMeasuredConfidence: false;
    deterministicEnvelopeIsConfidenceInterval: false;
    crossLayerTotalComputed: false;
  }>;
  counts: Readonly<{
    layerCount: 9;
    qualifiedLayerCount: 2;
    validationOnlyLayerCount: 2;
    unavailableLayerCount: 3;
    unquantifiedLayerCount: 1;
    notRunLayerCount: 1;
    rayCount: 4;
    bandRowCount: 12;
    detectorImageRowCount: 0;
    observedCountRowCount: 0;
    scienceRasterRowCount: 0;
  }>;
  maxima: Readonly<{
    deterministicBandEnvelopeRelative: number;
    conditionalCommonModePhotonRelative: number;
    syntheticCombinedRelativeSigma: number;
    knownComputationalUpperBoundRelative: number;
  }>;
  eligibility: Readonly<{
    deterministicComputationalEnvelopeDisplayAllowed: true;
    conditionalResponseAuditDisplayAllowed: true;
    syntheticCovarianceFixtureDisplayAllowed: true;
    statisticalConfidenceClaimAllowed: false;
    absoluteScientificUncertaintyAvailable: false;
    detectorImageUncertaintyAvailable: false;
    selectionBiasQuantified: false;
    scienceProductPromotionAllowed: false;
  }>;
  visualBoundary: Readonly<{
    profileId: "science-cinematic-v7-v457";
    uncertaintyMayDriveScienceHud: true;
    uncertaintyMayDriveCinematicColor: false;
    uncertaintyMayDriveCinematicBloom: false;
    scientificFieldMutationAllowed: false;
    localShadowOnly: true;
    defaultApplied: false;
  }>;
  boundary: Readonly<{
    detectorResponseAvailable: false;
    observedCountsAvailable: false;
    scienceRasterAvailable: false;
    fitsWriteAllowed: false;
    pngWriteAllowed: false;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
    formalProductPointer: "v263";
    formalDefaultKernel: "legacy-eih-1pn";
  }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type KerrProductUncertaintyEligibilitySummaryV513 = Pick<
  KerrProductUncertaintyEligibilityArtifactV513,
  "version" | "status" | "source" | "layers" | "combination" | "counts" | "maxima" | "eligibility" | "visualBoundary" | "boundary" | "artifactSha256"
>;
export type KerrProductUncertaintyEligibilityApiV513 = Readonly<{
  version: typeof KERR_PRODUCT_UNCERTAINTY_ELIGIBILITY_API_VERSION_V513;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrProductUncertaintyEligibilitySummaryV513 | null;
}>;
const SHA=/^[a-f0-9]{64}$/;const TRANSIENT=new Set(["generatedAt","artifactSha256","evidenceSha256","pointerSha256"]);const record=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);const canonicalize=(value:unknown):unknown=>Array.isArray(value)?value.map(canonicalize):!record(value)?value:Object.fromEntries(Object.entries(value).filter(([key])=>!TRANSIENT.has(key)).sort(([a],[b])=>a.localeCompare(b)).map(([key,entry])=>[key,canonicalize(entry)]));
export const canonicalKerrProductUncertaintyEligibilityV513=(value:unknown):string=>JSON.stringify(canonicalize(value));
export function parseKerrProductUncertaintyEligibilityArtifactV513(value:unknown):KerrProductUncertaintyEligibilityArtifactV513{if(!record(value))throw new Error("v513-uncertainty-shape");const a=value as Partial<KerrProductUncertaintyEligibilityArtifactV513>;if(a.version!==KERR_PRODUCT_UNCERTAINTY_ELIGIBILITY_VERSION_V513||a.status!=="product-uncertainty-eligibility-qualified-absolute-budget-unavailable"||!record(a.source)||Object.values(a.source).some(entry=>!SHA.test(String(entry)))||!Array.isArray(a.layers)||a.layers.length!==9||a.layers.some(layer=>!SHA.test(layer.artifactSha256)||layer.confidenceInterpretationAllowed!==false||(layer.maximumRelative!==null&&(!Number.isFinite(layer.maximumRelative)||layer.maximumRelative<0)))||a.layers.filter(layer=>layer.status==="qualified").length!==2||a.layers.filter(layer=>layer.status==="validation-only").length!==2||a.layers.filter(layer=>layer.status==="unavailable").length!==3||a.layers.filter(layer=>layer.status==="unquantified").length!==1||a.layers.filter(layer=>layer.status==="not-run").length!==1||a.combination?.knownNumericalTerms!=="linear-sum-without-independence-claim"||a.combination.rssApplied!==false||a.combination.unknownTermsTreatedAsZero!==false||a.combination.syntheticCovarianceMayPromoteMeasuredConfidence!==false||a.combination.deterministicEnvelopeIsConfidenceInterval!==false||a.combination.crossLayerTotalComputed!==false||a.counts?.layerCount!==9||a.counts.qualifiedLayerCount!==2||a.counts.validationOnlyLayerCount!==2||a.counts.unavailableLayerCount!==3||a.counts.unquantifiedLayerCount!==1||a.counts.notRunLayerCount!==1||a.counts.rayCount!==4||a.counts.bandRowCount!==12||a.counts.detectorImageRowCount!==0||a.counts.observedCountRowCount!==0||a.counts.scienceRasterRowCount!==0||!a.maxima||Object.values(a.maxima).some(entry=>!Number.isFinite(entry)||entry<0)||a.eligibility?.deterministicComputationalEnvelopeDisplayAllowed!==true||a.eligibility.conditionalResponseAuditDisplayAllowed!==true||a.eligibility.syntheticCovarianceFixtureDisplayAllowed!==true||a.eligibility.statisticalConfidenceClaimAllowed!==false||a.eligibility.absoluteScientificUncertaintyAvailable!==false||a.eligibility.detectorImageUncertaintyAvailable!==false||a.eligibility.selectionBiasQuantified!==false||a.eligibility.scienceProductPromotionAllowed!==false||a.visualBoundary?.profileId!=="science-cinematic-v7-v457"||a.visualBoundary.uncertaintyMayDriveScienceHud!==true||a.visualBoundary.uncertaintyMayDriveCinematicColor!==false||a.visualBoundary.uncertaintyMayDriveCinematicBloom!==false||a.visualBoundary.scientificFieldMutationAllowed!==false||a.visualBoundary.localShadowOnly!==true||a.visualBoundary.defaultApplied!==false||a.boundary?.detectorResponseAvailable!==false||a.boundary.observedCountsAvailable!==false||a.boundary.scienceRasterAvailable!==false||a.boundary.fitsWriteAllowed!==false||a.boundary.pngWriteAllowed!==false||a.boundary.denseCampaignStatus!=="incomplete-0-of-49"||a.boundary.browserQualification!=="not-run"||a.boundary.formalProductPointer!=="v263"||a.boundary.formalDefaultKernel!=="legacy-eih-1pn"||!Array.isArray(a.sourceManifest)||a.sourceManifest.some(entry=>!entry.path||!SHA.test(entry.sha256))||!SHA.test(a.sourceSha256??"")||!SHA.test(a.artifactSha256??""))throw new Error("v513-product-uncertainty-boundary");return a as KerrProductUncertaintyEligibilityArtifactV513;}
export function createKerrProductUncertaintyEligibilitySummaryV513(value:unknown):KerrProductUncertaintyEligibilitySummaryV513{const a=parseKerrProductUncertaintyEligibilityArtifactV513(value);return Object.freeze({version:a.version,status:a.status,source:a.source,layers:a.layers,combination:a.combination,counts:a.counts,maxima:a.maxima,eligibility:a.eligibility,visualBoundary:a.visualBoundary,boundary:a.boundary,artifactSha256:a.artifactSha256});}
const validateSummary=(value:unknown)=>{if(!record(value))throw new Error("v513-summary-shape");parseKerrProductUncertaintyEligibilityArtifactV513({...value,generatedAt:"summary-validation-only",sourceManifest:[],sourceSha256:"0".repeat(64)});};
export function parseKerrProductUncertaintyEligibilityApiV513(value:unknown):KerrProductUncertaintyEligibilityApiV513{if(!record(value)||value.version!==KERR_PRODUCT_UNCERTAINTY_ELIGIBILITY_API_VERSION_V513||typeof value.available!=="boolean"||!["ready","lite-boundary","local-shadow-only","evidence-corrupt"].includes(String(value.reason)))throw new Error("v513-api-boundary");if(value.available)validateSummary(value.summary);else if(value.summary!==null)throw new Error("v513-api-unavailable-summary");return value as unknown as KerrProductUncertaintyEligibilityApiV513;}
