export const KERR_CALIBRATION_BUDGET_FRONTIER_VERSION_V527 = "v527-kerr-calibration-budget-frontier-v1" as const;
export const KERR_CALIBRATION_BUDGET_FRONTIER_API_VERSION_V527 = "v527-kerr-calibration-budget-frontier-api-v1" as const;
export const KERR_CALIBRATION_BUDGET_HUD_PROFILE_ID_V527 = "science-cinematic-v7r6-v527" as const;

export type KerrCalibrationBudgetHudModeV527 = "science" | "cinematic";
export type KerrCalibrationBudgetHudProfileV527 = Readonly<{
  id: typeof KERR_CALIBRATION_BUDGET_HUD_PROFILE_ID_V527;
  mode: KerrCalibrationBudgetHudModeV527;
  localShadowOnly: true;
  defaultApplied: false;
  panel: string;
  panelRaised: string;
  ink: string;
  muted: string;
  grid: string;
  stochastic: string;
  deterministic: string;
  stress: string;
  unavailable: string;
  railOpacity: number;
  curveGlowOpacity: number;
  scienceBoundary: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    numericScientificStyleInputCount: 0;
    frontierValueDrivesStyle: false;
    correlationDrivesStyle: false;
    scientificFieldMutation: false;
  }>;
  cinematicSeed: string | null;
}>;

export type KerrStochasticBudgetSampleV527 = Readonly<{
  index: number;
  scienceVarianceFraction: string;
  calibrationVarianceFraction: string;
  scienceSigmaPerTargetSigma: string;
  calibrationSigmaPerTargetSigma: string;
  qVariancePerTargetVariance: string;
  uVariancePerTargetVariance: string;
  quCovariancePerTargetVariance: string;
  physicalScaleAvailable: false;
}>;
export type KerrDeterministicBudgetSampleV527 = Readonly<{
  index: number;
  scienceBoundFraction: string;
  calibrationBoundFraction: string;
  scienceBoundPerTargetBound: string;
  calibrationBoundPerTargetBound: string;
  maximumQPerTargetBound: string;
  maximumUPerTargetBound: string;
  maximumJointL2PerTargetBound: string;
  vertexCount: 64;
  physicalScaleAvailable: false;
}>;
export type KerrCorrelationBudgetRowV527 = Readonly<{
  frontierIndex: number;
  constraintCorrelation: string;
  observableCovariancePerTargetVariance: string;
  majorEigenvaluePerTargetVariance: string;
  minorEigenvaluePerTargetVariance: string;
  stressSampleOnlyNotPrior: true;
}>;

export type KerrCalibrationBudgetFrontierArtifactV527 = Readonly<{
  version: typeof KERR_CALIBRATION_BUDGET_FRONTIER_VERSION_V527;
  generatedAt: string;
  status: "normalized-budget-frontiers-qualified-physical-target-and-cost-model-unavailable";
  source: Readonly<{ v526ArtifactSha256: string; v511ArtifactSha256: string; v458ArtifactSha256: string; v314StateSha256: string }>;
  oracle: Readonly<{ backend: "mpmath-1.3.0"; decimalDigits: 80; matrixAndClosedFormCrossCheck: true; deterministicVertexEnumeration: true; randomnessUsed: false }>;
  sourceQuantizationAudit: Readonly<{ sourceSerializedDecimalDigits: 25; analyticRowsReconstructed: true; maximumSourceDecimalAbsolute: string; limit: string; includedInMultiprecisionOracleResidual: false }>;
  stochasticVarianceFrontier: Readonly<{ equation: string; normalization: "target-standard-deviation-equals-one"; sampleCount: 33; samples: readonly KerrStochasticBudgetSampleV527[]; selectedSampleIndex: null; selectionRequiresPhysicalTargetAndCostModel: true }>;
  deterministicBoundFrontier: Readonly<{ equation: string; normalization: "target-absolute-bound-equals-one"; sampleCount: 33; samples: readonly KerrDeterministicBudgetSampleV527[]; selectedSampleIndex: null; selectionRequiresPhysicalTargetAndCostModel: true }>;
  correlationStressSurface: Readonly<{ rhoSampleCount: 5; frontierSampleCount: 33; rowCount: 165; rows: readonly KerrCorrelationBudgetRowV527[]; closedForm: string; physicalCorrelationPriorAvailable: false }>;
  allocationBoundary: Readonly<{ physicalTargetStandardDeviationAvailable: false; physicalTargetAbsoluteBoundAvailable: false; scienceAcquisitionCostModelAvailable: false; calibrationAcquisitionCostModelAvailable: false; recommendedAllocationAvailable: false; automaticAllocationSelectionAllowed: false; normalizedFrontierReplacesMeasuredUncertainty: false }>;
  acquisitionBoundary: Readonly<{ requiredMeasuredFileCount: 6; readyMeasuredFileCount: 0; measuredCalibrationRowCount: 0; numericalScienceCovarianceAvailable: false; numericalScienceErrorBarsAvailable: false; scienceRecoveryExecutable: false }>;
  counts: Readonly<{ stochasticFrontierSampleCount: 33; deterministicFrontierSampleCount: 33; frontierSampleCount: 66; correlationSurfaceRowCount: 165; vertexEvaluations: 2112; measuredCalibrationFileCount: 0; requiredMeasuredCalibrationFileCount: 6; expectedElectronCountRowCount: 0; observedCountRowCount: 0; sciencePixelRowCount: 0 }>;
  maxima: Readonly<Record<string, string>>;
  limits: Readonly<{ multiprecisionResidual: string; sourceDecimalReconstruction: string }>;
  qualification: Readonly<{ stochasticVarianceFrontierQualified: true; deterministicBoundFrontierQualified: true; correlationStressSurfaceQualified: true; normalizedBudgetFrontierQualified: true; physicalBudgetQualified: false; measuredInstrumentQualified: false; scienceAuthorityPromotionAllowed: false }>;
  boundary: Readonly<{ normalizedCoefficientAuditOnly: true; physicalNoiseModelAvailable: false; physicalCalibrationPriorAvailable: false; measuredCalibrationAvailable: false; expectedElectronCountsAvailable: false; observedCountsAvailable: false; scienceRasterAuthorityAvailable: false; cinematicScienceWritebackAllowed: false; networkAttempted: false; automaticRetryApplied: false; denseCampaignStatus: "incomplete-0-of-49"; browserQualification: "not-run"; formalProductPointer: "v263"; formalDefaultKernel: "legacy-eih-1pn" }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type KerrCalibrationBudgetFrontierSummaryV527 = Readonly<{
  version: typeof KERR_CALIBRATION_BUDGET_FRONTIER_VERSION_V527;
  status: KerrCalibrationBudgetFrontierArtifactV527["status"];
  source: KerrCalibrationBudgetFrontierArtifactV527["source"];
  oracle: KerrCalibrationBudgetFrontierArtifactV527["oracle"];
  sourceQuantizationAudit: KerrCalibrationBudgetFrontierArtifactV527["sourceQuantizationAudit"];
  stochasticVarianceFrontier: KerrCalibrationBudgetFrontierArtifactV527["stochasticVarianceFrontier"];
  deterministicBoundFrontier: KerrCalibrationBudgetFrontierArtifactV527["deterministicBoundFrontier"];
  correlationStressSurface: Omit<KerrCalibrationBudgetFrontierArtifactV527["correlationStressSurface"], "rows"> & Readonly<{ balancedAllocationRows: readonly KerrCorrelationBudgetRowV527[] }>;
  allocationBoundary: KerrCalibrationBudgetFrontierArtifactV527["allocationBoundary"];
  acquisitionBoundary: KerrCalibrationBudgetFrontierArtifactV527["acquisitionBoundary"];
  counts: KerrCalibrationBudgetFrontierArtifactV527["counts"];
  maxima: KerrCalibrationBudgetFrontierArtifactV527["maxima"];
  limits: KerrCalibrationBudgetFrontierArtifactV527["limits"];
  qualification: KerrCalibrationBudgetFrontierArtifactV527["qualification"];
  boundary: KerrCalibrationBudgetFrontierArtifactV527["boundary"];
  artifactSha256: string;
}>;
export type KerrCalibrationBudgetFrontierApiV527 = Readonly<{ version: typeof KERR_CALIBRATION_BUDGET_FRONTIER_API_VERSION_V527; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt"; summary: KerrCalibrationBudgetFrontierSummaryV527 | null }>;

const scienceProfile: KerrCalibrationBudgetHudProfileV527 = Object.freeze({ id: KERR_CALIBRATION_BUDGET_HUD_PROFILE_ID_V527, mode: "science", localShadowOnly: true, defaultApplied: false, panel: "#02080c", panelRaised: "#06141a", ink: "#e1fbff", muted: "#78959e", grid: "rgba(105,226,239,.075)", stochastic: "#7ed8ff", deterministic: "#ffc982", stress: "#bd9cff", unavailable: "#ff91aa", railOpacity: 0.64, curveGlowOpacity: 0, scienceBoundary: Object.freeze({ linearDisplay: true, bloomIntensity: 0, colorGradeIntensity: 0, numericScientificStyleInputCount: 0, frontierValueDrivesStyle: false, correlationDrivesStyle: false, scientificFieldMutation: false }), cinematicSeed: null });
const cinematicProfile: KerrCalibrationBudgetHudProfileV527 = Object.freeze({ id: KERR_CALIBRATION_BUDGET_HUD_PROFILE_ID_V527, mode: "cinematic", localShadowOnly: true, defaultApplied: false, panel: "#0f0908", panelRaised: "#1b1210", ink: "#fff3db", muted: "#ae9179", grid: "rgba(255,193,110,.07)", stochastic: "#8fddff", deterministic: "#ffbd72", stress: "#c9a8ff", unavailable: "#ff91b4", railOpacity: 0.46, curveGlowOpacity: 0.19, scienceBoundary: Object.freeze({ linearDisplay: false, bloomIntensity: 0.09, colorGradeIntensity: 0.065, numericScientificStyleInputCount: 0, frontierValueDrivesStyle: false, correlationDrivesStyle: false, scientificFieldMutation: false }), cinematicSeed: "orbit-atlas-v527-budget-frontier-hud-seed-01" });
export const resolveKerrCalibrationBudgetHudProfileV527 = (mode: KerrCalibrationBudgetHudModeV527) => mode === "science" ? scienceProfile : cinematicProfile;

const SHA=/^[a-f0-9]{64}$/; const DECIMAL=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i; const transient=new Set(["generatedAt","artifactSha256","payloadSha256","evidenceSha256","pointerSha256","stageChainSha256"]); const isRecord=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value); const compareCodePoints=(left:string,right:string)=>left<right?-1:left>right?1:0; const canonicalize=(value:unknown):unknown=>Array.isArray(value)?value.map(canonicalize):!isRecord(value)?value:Object.fromEntries(Object.entries(value).filter(([key])=>!transient.has(key)).sort(([a],[b])=>compareCodePoints(a,b)).map(([key,entry])=>[key,canonicalize(entry)])); export const canonicalKerrCalibrationBudgetFrontierV527=(value:unknown)=>JSON.stringify(canonicalize(value)); const validDecimal=(value:unknown)=>typeof value==="string"&&DECIMAL.test(value)&&Number.isFinite(Number(value));
function validateCore(value:Partial<KerrCalibrationBudgetFrontierArtifactV527>){return value.version===KERR_CALIBRATION_BUDGET_FRONTIER_VERSION_V527&&value.status==="normalized-budget-frontiers-qualified-physical-target-and-cost-model-unavailable"&&Object.values(value.source??{}).every((entry)=>SHA.test(entry))&&value.oracle?.backend==="mpmath-1.3.0"&&value.oracle.decimalDigits===80&&value.oracle.randomnessUsed===false&&value.sourceQuantizationAudit?.analyticRowsReconstructed===true&&Number(value.sourceQuantizationAudit.maximumSourceDecimalAbsolute)<Number(value.sourceQuantizationAudit.limit)&&value.stochasticVarianceFrontier?.sampleCount===33&&value.stochasticVarianceFrontier.selectedSampleIndex===null&&value.deterministicBoundFrontier?.sampleCount===33&&value.deterministicBoundFrontier.selectedSampleIndex===null&&value.correlationStressSurface?.rowCount===165&&value.correlationStressSurface.physicalCorrelationPriorAvailable===false&&value.allocationBoundary?.recommendedAllocationAvailable===false&&value.allocationBoundary.automaticAllocationSelectionAllowed===false&&value.acquisitionBoundary?.readyMeasuredFileCount===0&&value.acquisitionBoundary.numericalScienceErrorBarsAvailable===false&&value.counts?.frontierSampleCount===66&&value.counts.correlationSurfaceRowCount===165&&value.counts.vertexEvaluations===2112&&Object.values(value.maxima??{}).every((entry)=>validDecimal(entry)&&Number(entry)<Number(value.limits?.multiprecisionResidual))&&value.qualification?.normalizedBudgetFrontierQualified===true&&value.qualification.physicalBudgetQualified===false&&value.qualification.measuredInstrumentQualified===false&&value.boundary?.measuredCalibrationAvailable===false&&value.boundary.scienceRasterAuthorityAvailable===false&&value.boundary.denseCampaignStatus==="incomplete-0-of-49"&&value.boundary.browserQualification==="not-run"&&value.boundary.formalProductPointer==="v263"&&value.boundary.formalDefaultKernel==="legacy-eih-1pn"&&SHA.test(value.artifactSha256??"");}
export function parseKerrCalibrationBudgetFrontierArtifactV527(value:unknown):KerrCalibrationBudgetFrontierArtifactV527{if(!isRecord(value))throw new Error("v527-budget-frontier-shape");const artifact=value as Partial<KerrCalibrationBudgetFrontierArtifactV527>;if(!validateCore(artifact)||artifact.stochasticVarianceFrontier?.samples.length!==33||artifact.deterministicBoundFrontier?.samples.length!==33||artifact.correlationStressSurface?.rows.length!==165||artifact.stochasticVarianceFrontier.samples.some((row)=>!validDecimal(row.scienceSigmaPerTargetSigma)||row.physicalScaleAvailable!==false)||artifact.deterministicBoundFrontier.samples.some((row)=>row.vertexCount!==64||!validDecimal(row.maximumQPerTargetBound)||row.physicalScaleAvailable!==false)||artifact.correlationStressSurface.rows.some((row)=>!validDecimal(row.observableCovariancePerTargetVariance)||row.stressSampleOnlyNotPrior!==true)||!Array.isArray(artifact.sourceManifest)||artifact.sourceManifest.some((entry)=>!entry.path||!SHA.test(entry.sha256))||!SHA.test(artifact.sourceSha256??""))throw new Error("v527-budget-frontier-boundary");return artifact as KerrCalibrationBudgetFrontierArtifactV527;}
export function createKerrCalibrationBudgetFrontierSummaryV527(value:unknown):KerrCalibrationBudgetFrontierSummaryV527{const artifact=parseKerrCalibrationBudgetFrontierArtifactV527(value),correlation=artifact.correlationStressSurface;return Object.freeze({version:artifact.version,status:artifact.status,source:artifact.source,oracle:artifact.oracle,sourceQuantizationAudit:artifact.sourceQuantizationAudit,stochasticVarianceFrontier:artifact.stochasticVarianceFrontier,deterministicBoundFrontier:artifact.deterministicBoundFrontier,correlationStressSurface:Object.freeze({rhoSampleCount:correlation.rhoSampleCount,frontierSampleCount:correlation.frontierSampleCount,rowCount:correlation.rowCount,closedForm:correlation.closedForm,physicalCorrelationPriorAvailable:correlation.physicalCorrelationPriorAvailable,balancedAllocationRows:correlation.rows.filter((row)=>row.frontierIndex===16)}),allocationBoundary:artifact.allocationBoundary,acquisitionBoundary:artifact.acquisitionBoundary,counts:artifact.counts,maxima:artifact.maxima,limits:artifact.limits,qualification:artifact.qualification,boundary:artifact.boundary,artifactSha256:artifact.artifactSha256});}
export function parseKerrCalibrationBudgetFrontierApiV527(value:unknown):KerrCalibrationBudgetFrontierApiV527{if(!isRecord(value)||value.version!==KERR_CALIBRATION_BUDGET_FRONTIER_API_VERSION_V527||typeof value.available!=="boolean"||!["ready","lite-boundary","local-shadow-only","evidence-corrupt"].includes(String(value.reason)))throw new Error("v527-api-boundary");if(value.available){if(!isRecord(value.summary)||value.summary.status!=="normalized-budget-frontiers-qualified-physical-target-and-cost-model-unavailable"||!SHA.test(String(value.summary.artifactSha256))||!isRecord(value.summary.stochasticVarianceFrontier)||!isRecord(value.summary.deterministicBoundFrontier))throw new Error("v527-api-summary");}else if(value.summary!==null)throw new Error("v527-api-unavailable-summary");return value as unknown as KerrCalibrationBudgetFrontierApiV527;}
export function createKerrCalibrationBudgetHudEncodingV527(summary:KerrCalibrationBudgetFrontierSummaryV527,mode:KerrCalibrationBudgetHudModeV527){if(!SHA.test(summary.artifactSha256))throw new Error("v527-hud-source");return Object.freeze({version:"v527-kerr-calibration-budget-hud-encoding-v1" as const,profileId:KERR_CALIBRATION_BUDGET_HUD_PROFILE_ID_V527,mode,scientificPayloadKey:summary.artifactSha256,scientificGeometry:Object.freeze({stochastic:Object.freeze(summary.stochasticVarianceFrontier.samples.map((row)=>Object.freeze({index:row.index,x:row.scienceSigmaPerTargetSigma,y:row.calibrationSigmaPerTargetSigma}))),deterministic:Object.freeze(summary.deterministicBoundFrontier.samples.map((row)=>Object.freeze({index:row.index,x:row.scienceBoundPerTargetBound,y:row.calibrationBoundPerTargetBound})))}),scientificGeometryInputCount:66 as const,numericScientificStyleInputCount:0 as const,frontierValueDrivesStyle:false as const,correlationDrivesStyle:false as const,scientificFieldMutation:false as const});}
export function compareKerrCalibrationBudgetHudEncodingsV527(science:ReturnType<typeof createKerrCalibrationBudgetHudEncodingV527>,cinematic:ReturnType<typeof createKerrCalibrationBudgetHudEncodingV527>){if(science.mode!=="science"||cinematic.mode!=="cinematic"||science.scientificPayloadKey!==cinematic.scientificPayloadKey||JSON.stringify(science.scientificGeometry)!==JSON.stringify(cinematic.scientificGeometry)||science.scientificGeometryInputCount!==66||cinematic.scientificGeometryInputCount!==66||science.numericScientificStyleInputCount!==0||cinematic.numericScientificStyleInputCount!==0)throw new Error("v527-hud-boundary");return Object.freeze({scientificPayloadStable:true as const,scientificGeometryStable:true as const,scientificGeometryInputCount:66 as const,numericScientificStyleInputCount:0 as const,scientificFieldMutation:false as const});}
