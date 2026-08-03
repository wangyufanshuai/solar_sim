import { createHash } from "node:crypto";

export const KERR_POLARIMETER_CALIBRATION_VERSION_V411 = "v411-kerr-polarimeter-calibration-contract-v1" as const;
export const KERR_POLARIMETER_CALIBRATION_INSPECT_VERSION_V411 = "v411-kerr-polarimeter-calibration-inspect-v1" as const;
export const KERR_POLARIMETER_CALIBRATION_RESPONSE_VERSION_V411 = "v411-kerr-polarimeter-calibration-response-v1" as const;
export const KERR_IDEAL_POLARIMETER_ARTIFACT_SHA256_V410 = "5acfc19b1c1af8ac8f63c5d1a56e39f79501138fbe3b8b57a483b8771f949a22" as const;

export type PolarimeterCalibrationNodeV411 = Readonly<{
  wavelengthM: number;
  hwpRetardanceRad: number;
  hwpRetardanceStdRad: number;
  analyzerAngleZeroDeg: number;
  analyzerAngleZeroStdDeg: number;
  ordinaryThroughput: number;
  extraordinaryThroughput: number;
  beamThroughputRatio: number;
  extinctionRatio: number;
  instrumentMuellerMatrix: readonly (readonly number[])[];
  muellerCovariance: readonly (readonly number[])[];
  rawArtifactSha256: string;
}>;

export type PolarimeterCalibrationManifestV411 = Readonly<{
  version: typeof KERR_POLARIMETER_CALIBRATION_VERSION_V411;
  sourceKind: "test-fixture" | "measured-import";
  identity: Readonly<{
    measuredAcquisition: boolean;
    manufacturer: string;
    model: string;
    serialOrCampaignId: string;
    opticalArchitecture: string;
    performedAtUtc: string;
    laboratoryOrArchive: string;
    operatorOrArchive: string;
  }>;
  wavelengthDomainM: readonly [number, number];
  nodes: readonly PolarimeterCalibrationNodeV411[];
  provenance: Readonly<{
    sourceUrl: string;
    licenseOrTerms: string;
    identityFileSha256: string;
    calibrationTableFileSha256: string;
    rawBundleSha256: string;
    processingParametersSha256: string;
    attestation: "real-measured-polarimeter-acquisition-not-synthetic-or-example" | "declared-test-fixture-nonpublishable";
  }>;
}>;

export type PolarimeterCalibrationCompilationV411 = Readonly<{
  version: "v411-kerr-polarimeter-calibration-compilation-v1";
  status: "compiled-test-fixture-nonpublishable" | "compiled-measured-manifest-awaiting-independent-validation";
  sourceKind: PolarimeterCalibrationManifestV411["sourceKind"];
  manifest: PolarimeterCalibrationManifestV411;
  manifestCanonicalSha256: string;
  metrics: Readonly<{
    wavelengthNodeCount: number;
    wavelengthStrictlyIncreasing: true;
    maximumBeamRatioConsistencyRelative: number;
    maximumCovarianceSymmetryAbsolute: number;
    minimumCovarianceEigenvalue: number;
    covariancePositiveSemidefinite: boolean;
    maximumMuellerElementAbsolute: number;
  }>;
  independentScientificValidation: "pending";
  measuredAuthorityGranted: false;
  manifestPublishable: boolean;
  boundary: "compiler-checks-identity-units-matrix-covariance-and-provenance-but-never-grants-authority";
}>;

export type PolarimeterCalibrationAdmissionV411 = Readonly<{
  version: "v411-kerr-polarimeter-calibration-admission-v1";
  status: "blocked-input-unavailable" | "rejected-test-fixture-nonpublishable" | "blocked-independent-validation-not-qualified" | "qualified-measured-polarimeter-authority-local-shadow-only";
  authorityGranted: boolean;
  reasons: readonly string[];
  compilationStatus: PolarimeterCalibrationCompilationV411["status"] | "not-run";
  independentValidationStatus: "not-run" | "validation-failed" | "measured-validation-qualified";
  authorityScope: "local-shadow-measured-polarimeter-response-only";
  sciencePayloadMutationAllowed: false;
  cinematicMutationAllowed: false;
  productPromotionAllowed: false;
  formalProductPointer: "v263";
  boundary: "admission-never-mutates-manifest-science-cinematic-or-product-state";
}>;

export type PolarimeterCalibrationInspectV411 = Readonly<{
  version: typeof KERR_POLARIMETER_CALIBRATION_INSPECT_VERSION_V411;
  generatedAt: string;
  status: "qualified-calibration-schema-and-compiler-measured-polarimeter-unavailable";
  source: Readonly<{ v410IdealPolarimeterArtifactSha256: typeof KERR_IDEAL_POLARIMETER_ARTIFACT_SHA256_V410 }>;
  schema: Readonly<{
    wavelengthResolvedMuellerMatrix: true;
    wavelengthResolvedMuellerCovariance: true;
    hwpRetardanceRequired: true;
    beamThroughputRatioRequired: true;
    extinctionRatioRequired: true;
    analyzerAngleZeroRequired: true;
    rawArtifactShaRequired: true;
    measuredAttestationRequired: true;
    minimumWavelengthNodeCount: 5;
    matrixShape: readonly [4, 4];
    covarianceShape: readonly [16, 16];
  }>;
  requiredInputs: readonly ["identity-and-measured-attestation", "wavelength-domain", "wavelength-resolved-retardance", "analyzer-angle-zero", "ordinary-extraordinary-throughput", "extinction-ratio", "four-by-four-instrument-mueller-matrix", "sixteen-by-sixteen-mueller-covariance", "raw-artifact-sha", "processing-provenance", "independent-validation-and-conditioning"];
  current: Readonly<{
    measuredManifestPresent: false;
    measuredCalibrationRowCount: 0;
    compilerStatus: "not-run-input-unavailable";
    validationStatus: "not-run-input-unavailable";
    admission: PolarimeterCalibrationAdmissionV411;
    v410IdealOperatorRemainsQualified: true;
    detectorElectronProjectionAvailable: false;
  }>;
  templatePolicy: "schema-only-no-example-measurements-no-default-performance-values";
  wavelengthBoundary: "each-science-frequency-requires-in-domain-calibration-no-cross-band-hwp-assumption";
  attemptConsumed: false;
  networkAttempted: false;
  denseShardExecuted: false;
  browserQualification: "not-run";
  release: Readonly<{ formalProductPointer: "v263"; formalProductPointerAdvanced: false; defaultKernel: "legacy-eih-1pn"; workerPhysicsMutation: "not-applied"; localShadowDefaultApplied: false }>;
  boundary: "calibration-contract-and-dry-admission-only-no-measured-polarimeter-authority-electrons-or-product-promotion";
  artifactSha256: string;
}>;

export type PolarimeterCalibrationSummaryV411 = Readonly<{
  version: "v411-kerr-polarimeter-calibration-summary-v1";
  status: PolarimeterCalibrationInspectV411["status"];
  artifactSha256: string;
  v410IdealPolarimeterArtifactSha256: typeof KERR_IDEAL_POLARIMETER_ARTIFACT_SHA256_V410;
  schema: Readonly<{
    ready: true;
    requiredInputCount: 11;
    minimumWavelengthNodeCount: 5;
    matrixShape: readonly [4, 4];
    covarianceShape: readonly [16, 16];
  }>;
  measuredPack: Readonly<{
    present: false;
    rowCount: 0;
    compilerStatus: "not-run-input-unavailable";
    validationStatus: "not-run-input-unavailable";
  }>;
  admission: PolarimeterCalibrationAdmissionV411;
  v410IdealOperatorRemainsQualified: true;
  detectorElectronProjectionAvailable: false;
  fullInspectAvailable: true;
  scienceBufferMutationAllowed: false;
  cinematicBufferMutationAllowed: false;
  browserQualification: "not-run";
  boundary: "summary-only-schema-ready-measured-pack-absent-authority-blocked";
}>;

export type PolarimeterCalibrationResponseV411 = Readonly<{
  version: typeof KERR_POLARIMETER_CALIBRATION_RESPONSE_VERSION_V411;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: PolarimeterCalibrationSummaryV411 | null;
}>;

const SHA=/^[a-f0-9]{64}$/;const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;const object=(value:unknown,label:string):Record<string,unknown>=>{if(!value||typeof value!=="object"||Array.isArray(value))throw new Error(`v411-${label}`);return value as Record<string,unknown>;};const text=(value:unknown,label:string)=>{if(typeof value!=="string"||value.trim().length<2||value.length>512)throw new Error(`v411-${label}`);return value.trim();};
function symmetricEigenvalues(matrix:readonly(readonly number[])[]):number[]{const values=matrix.map(row=>[...row]);const size=values.length;for(let iteration=0;iteration<size*size*128;iteration+=1){let p=0,q=1,maximum=0;for(let row=0;row<size;row+=1)for(let column=row+1;column<size;column+=1)if(Math.abs(values[row][column])>maximum){maximum=Math.abs(values[row][column]);p=row;q=column;}if(maximum<1e-16)break;const angle=.5*Math.atan2(2*values[p][q],values[q][q]-values[p][p]),c=Math.cos(angle),s=Math.sin(angle),app=values[p][p],aqq=values[q][q],apq=values[p][q];values[p][p]=c*c*app-2*s*c*apq+s*s*aqq;values[q][q]=s*s*app+2*s*c*apq+c*c*aqq;values[p][q]=0;values[q][p]=0;for(let index=0;index<size;index+=1)if(index!==p&&index!==q){const aip=values[index][p],aiq=values[index][q];values[index][p]=c*aip-s*aiq;values[p][index]=values[index][p];values[index][q]=s*aip+c*aiq;values[q][index]=values[index][q];}}return values.map((row,index)=>row[index]).sort((a,b)=>b-a);}
const relative=(a:number,b:number)=>Math.abs(a-b)/Math.max(1e-300,Math.abs(a),Math.abs(b));

export function parsePolarimeterCalibrationManifestV411(value:unknown):PolarimeterCalibrationManifestV411{const source=object(value,"manifest");const identity=object(source.identity,"identity");const provenance=object(source.provenance,"provenance");const nodes=source.nodes;if(source.version!==KERR_POLARIMETER_CALIBRATION_VERSION_V411||!["test-fixture","measured-import"].includes(String(source.sourceKind))||typeof identity.measuredAcquisition!=="boolean"||text(identity.manufacturer,"manufacturer").length<2||text(identity.model,"model").length<2||text(identity.serialOrCampaignId,"serial").length<3||text(identity.opticalArchitecture,"architecture").length<3||!ISO.test(String(identity.performedAtUtc??""))||text(identity.laboratoryOrArchive,"laboratory").length<2||text(identity.operatorOrArchive,"operator").length<2||!Array.isArray(source.wavelengthDomainM)||source.wavelengthDomainM.length!==2||!(Number(source.wavelengthDomainM[0])>0)||!(Number(source.wavelengthDomainM[1])>Number(source.wavelengthDomainM[0]))||!Array.isArray(nodes)||nodes.length<5||nodes.length>256||!/^https:\/\//.test(String(provenance.sourceUrl??""))||text(provenance.licenseOrTerms,"terms").length<3||![provenance.identityFileSha256,provenance.calibrationTableFileSha256,provenance.rawBundleSha256,provenance.processingParametersSha256].every(entry=>SHA.test(String(entry??""))))throw new Error("v411-manifest-identity");if(source.sourceKind==="measured-import"&&(identity.measuredAcquisition!==true||provenance.attestation!=="real-measured-polarimeter-acquisition-not-synthetic-or-example"))throw new Error("v411-measured-attestation");if(source.sourceKind==="test-fixture"&&(identity.measuredAcquisition!==false||provenance.attestation!=="declared-test-fixture-nonpublishable"))throw new Error("v411-fixture-attestation");let previous=0;for(const entry of nodes){const node=object(entry,"node");const matrix=node.instrumentMuellerMatrix,covariance=node.muellerCovariance;if(!(Number(node.wavelengthM)>previous)||Number(node.wavelengthM)<Number(source.wavelengthDomainM[0])||Number(node.wavelengthM)>Number(source.wavelengthDomainM[1])||!Number.isFinite(Number(node.hwpRetardanceRad))||!(Number(node.hwpRetardanceStdRad)>=0)||!Number.isFinite(Number(node.analyzerAngleZeroDeg))||!(Number(node.analyzerAngleZeroStdDeg)>=0)||!(Number(node.ordinaryThroughput)>=0&&Number(node.ordinaryThroughput)<=1)||!(Number(node.extraordinaryThroughput)>=0&&Number(node.extraordinaryThroughput)<=1)||!(Number(node.beamThroughputRatio)>0)||!(Number(node.extinctionRatio)>1)||!SHA.test(String(node.rawArtifactSha256??""))||!Array.isArray(matrix)||matrix.length!==4||matrix.some(row=>!Array.isArray(row)||row.length!==4||row.some(value=>!Number.isFinite(value)))||!Array.isArray(covariance)||covariance.length!==16||covariance.some(row=>!Array.isArray(row)||row.length!==16||row.some(value=>!Number.isFinite(value))))throw new Error("v411-node-identity");previous=Number(node.wavelengthM);}return value as PolarimeterCalibrationManifestV411;}

export function compilePolarimeterCalibrationV411(value:unknown):PolarimeterCalibrationCompilationV411{const manifest=parsePolarimeterCalibrationManifestV411(value);let ratioResidual=0,symmetry=0,minimumEigenvalue=Number.POSITIVE_INFINITY,maximumMueller=0;for(const node of manifest.nodes){ratioResidual=Math.max(ratioResidual,relative(node.beamThroughputRatio,node.ordinaryThroughput/node.extraordinaryThroughput));for(let row=0;row<16;row+=1)for(let column=0;column<16;column+=1)symmetry=Math.max(symmetry,Math.abs(node.muellerCovariance[row][column]-node.muellerCovariance[column][row]));const eigenvalues=symmetricEigenvalues(node.muellerCovariance);minimumEigenvalue=Math.min(minimumEigenvalue,eigenvalues[eigenvalues.length-1]);maximumMueller=Math.max(maximumMueller,...node.instrumentMuellerMatrix.flat().map(Math.abs));}if(ratioResidual>=1e-10||symmetry>=1e-12||minimumEigenvalue< -1e-12||maximumMueller>2)throw new Error("v411-calibration-physical-validation");const canonical=JSON.stringify(canonicalize(manifest));return Object.freeze({version:"v411-kerr-polarimeter-calibration-compilation-v1",status:manifest.sourceKind==="measured-import"?"compiled-measured-manifest-awaiting-independent-validation":"compiled-test-fixture-nonpublishable",sourceKind:manifest.sourceKind,manifest,manifestCanonicalSha256:sha(canonical),metrics:Object.freeze({wavelengthNodeCount:manifest.nodes.length,wavelengthStrictlyIncreasing:true as const,maximumBeamRatioConsistencyRelative:ratioResidual,maximumCovarianceSymmetryAbsolute:symmetry,minimumCovarianceEigenvalue:minimumEigenvalue,covariancePositiveSemidefinite:minimumEigenvalue>=-1e-12,maximumMuellerElementAbsolute:maximumMueller}),independentScientificValidation:"pending" as const,measuredAuthorityGranted:false as const,manifestPublishable:manifest.sourceKind==="measured-import",boundary:"compiler-checks-identity-units-matrix-covariance-and-provenance-but-never-grants-authority" as const});}

export function evaluatePolarimeterCalibrationAdmissionV411(compilation:PolarimeterCalibrationCompilationV411|null,independentValidationStatus:"not-run"|"validation-failed"|"measured-validation-qualified"):PolarimeterCalibrationAdmissionV411{const reasons:string[]=[];if(!compilation)reasons.push("measured-manifest-input-unavailable");else if(compilation.sourceKind==="test-fixture")reasons.push("test-fixture-nonpublishable");else if(independentValidationStatus!=="measured-validation-qualified")reasons.push("independent-validation-not-qualified");const status:PolarimeterCalibrationAdmissionV411["status"]=!compilation?"blocked-input-unavailable":compilation.sourceKind==="test-fixture"?"rejected-test-fixture-nonpublishable":independentValidationStatus!=="measured-validation-qualified"?"blocked-independent-validation-not-qualified":"qualified-measured-polarimeter-authority-local-shadow-only";return Object.freeze({version:"v411-kerr-polarimeter-calibration-admission-v1",status,authorityGranted:status==="qualified-measured-polarimeter-authority-local-shadow-only",reasons:Object.freeze(reasons),compilationStatus:compilation?.status??"not-run",independentValidationStatus,authorityScope:"local-shadow-measured-polarimeter-response-only",sciencePayloadMutationAllowed:false,cinematicMutationAllowed:false,productPromotionAllowed:false,formalProductPointer:"v263",boundary:"admission-never-mutates-manifest-science-cinematic-or-product-state"});}

const canonicalize=(value:unknown):unknown=>Array.isArray(value)?value.map(canonicalize):!value||typeof value!=="object"?value:Object.fromEntries(Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([key,entry])=>[key,canonicalize(entry)]));const sha=(value:string)=>createHash("sha256").update(value).digest("hex");
export function createPolarimeterCalibrationInspectV411(generatedAt:string):Omit<PolarimeterCalibrationInspectV411,"artifactSha256">{return Object.freeze({version:KERR_POLARIMETER_CALIBRATION_INSPECT_VERSION_V411,generatedAt,status:"qualified-calibration-schema-and-compiler-measured-polarimeter-unavailable",source:Object.freeze({v410IdealPolarimeterArtifactSha256:KERR_IDEAL_POLARIMETER_ARTIFACT_SHA256_V410}),schema:Object.freeze({wavelengthResolvedMuellerMatrix:true as const,wavelengthResolvedMuellerCovariance:true as const,hwpRetardanceRequired:true as const,beamThroughputRatioRequired:true as const,extinctionRatioRequired:true as const,analyzerAngleZeroRequired:true as const,rawArtifactShaRequired:true as const,measuredAttestationRequired:true as const,minimumWavelengthNodeCount:5 as const,matrixShape:Object.freeze([4,4] as const),covarianceShape:Object.freeze([16,16] as const)}),requiredInputs:Object.freeze(["identity-and-measured-attestation","wavelength-domain","wavelength-resolved-retardance","analyzer-angle-zero","ordinary-extraordinary-throughput","extinction-ratio","four-by-four-instrument-mueller-matrix","sixteen-by-sixteen-mueller-covariance","raw-artifact-sha","processing-provenance","independent-validation-and-conditioning"] as const),current:Object.freeze({measuredManifestPresent:false as const,measuredCalibrationRowCount:0 as const,compilerStatus:"not-run-input-unavailable" as const,validationStatus:"not-run-input-unavailable" as const,admission:evaluatePolarimeterCalibrationAdmissionV411(null,"not-run"),v410IdealOperatorRemainsQualified:true as const,detectorElectronProjectionAvailable:false as const}),templatePolicy:"schema-only-no-example-measurements-no-default-performance-values",wavelengthBoundary:"each-science-frequency-requires-in-domain-calibration-no-cross-band-hwp-assumption",attemptConsumed:false,networkAttempted:false,denseShardExecuted:false,browserQualification:"not-run",release:Object.freeze({formalProductPointer:"v263" as const,formalProductPointerAdvanced:false as const,defaultKernel:"legacy-eih-1pn" as const,workerPhysicsMutation:"not-applied" as const,localShadowDefaultApplied:false as const}),boundary:"calibration-contract-and-dry-admission-only-no-measured-polarimeter-authority-electrons-or-product-promotion"});}
export function parsePolarimeterCalibrationInspectV411(value:unknown):PolarimeterCalibrationInspectV411{const s=object(value,"inspect") as Partial<PolarimeterCalibrationInspectV411>;if(s.version!==KERR_POLARIMETER_CALIBRATION_INSPECT_VERSION_V411||s.status!=="qualified-calibration-schema-and-compiler-measured-polarimeter-unavailable"||s.source?.v410IdealPolarimeterArtifactSha256!==KERR_IDEAL_POLARIMETER_ARTIFACT_SHA256_V410||s.schema?.minimumWavelengthNodeCount!==5||s.schema.matrixShape.join(",")!=="4,4"||s.schema.covarianceShape.join(",")!=="16,16"||s.requiredInputs?.length!==11||s.current?.measuredManifestPresent!==false||s.current.measuredCalibrationRowCount!==0||s.current.admission.status!=="blocked-input-unavailable"||s.current.admission.authorityGranted!==false||s.current.v410IdealOperatorRemainsQualified!==true||s.current.detectorElectronProjectionAvailable!==false||s.templatePolicy!=="schema-only-no-example-measurements-no-default-performance-values"||s.wavelengthBoundary!=="each-science-frequency-requires-in-domain-calibration-no-cross-band-hwp-assumption"||s.attemptConsumed!==false||s.networkAttempted!==false||s.denseShardExecuted!==false||s.browserQualification!=="not-run"||s.release?.formalProductPointer!=="v263"||s.release.formalProductPointerAdvanced!==false||s.release.defaultKernel!=="legacy-eih-1pn"||s.release.workerPhysicsMutation!=="not-applied"||s.release.localShadowDefaultApplied!==false||s.boundary!=="calibration-contract-and-dry-admission-only-no-measured-polarimeter-authority-electrons-or-product-promotion"||!SHA.test(s.artifactSha256??""))throw new Error("v411-inspect-identity");return value as PolarimeterCalibrationInspectV411;}

export function createPolarimeterCalibrationSummaryV411(value: unknown): PolarimeterCalibrationSummaryV411 {
  const inspect = parsePolarimeterCalibrationInspectV411(value);
  return Object.freeze({
    version: "v411-kerr-polarimeter-calibration-summary-v1",
    status: inspect.status,
    artifactSha256: inspect.artifactSha256,
    v410IdealPolarimeterArtifactSha256: inspect.source.v410IdealPolarimeterArtifactSha256,
    schema: Object.freeze({ ready: true as const, requiredInputCount: 11 as const, minimumWavelengthNodeCount: inspect.schema.minimumWavelengthNodeCount, matrixShape: inspect.schema.matrixShape, covarianceShape: inspect.schema.covarianceShape }),
    measuredPack: Object.freeze({ present: inspect.current.measuredManifestPresent, rowCount: inspect.current.measuredCalibrationRowCount, compilerStatus: inspect.current.compilerStatus, validationStatus: inspect.current.validationStatus }),
    admission: inspect.current.admission,
    v410IdealOperatorRemainsQualified: inspect.current.v410IdealOperatorRemainsQualified,
    detectorElectronProjectionAvailable: inspect.current.detectorElectronProjectionAvailable,
    fullInspectAvailable: true as const,
    scienceBufferMutationAllowed: false as const,
    cinematicBufferMutationAllowed: false as const,
    browserQualification: inspect.browserQualification,
    boundary: "summary-only-schema-ready-measured-pack-absent-authority-blocked" as const,
  });
}

export function parsePolarimeterCalibrationSummaryV411(value: unknown): PolarimeterCalibrationSummaryV411 {
  const source = object(value, "summary") as Partial<PolarimeterCalibrationSummaryV411>;
  if (source.version !== "v411-kerr-polarimeter-calibration-summary-v1" || source.status !== "qualified-calibration-schema-and-compiler-measured-polarimeter-unavailable" || !SHA.test(source.artifactSha256 ?? "") || source.v410IdealPolarimeterArtifactSha256 !== KERR_IDEAL_POLARIMETER_ARTIFACT_SHA256_V410 || source.schema?.ready !== true || source.schema.requiredInputCount !== 11 || source.schema.minimumWavelengthNodeCount !== 5 || source.schema.matrixShape.join(",") !== "4,4" || source.schema.covarianceShape.join(",") !== "16,16" || source.measuredPack?.present !== false || source.measuredPack.rowCount !== 0 || source.measuredPack.compilerStatus !== "not-run-input-unavailable" || source.measuredPack.validationStatus !== "not-run-input-unavailable" || source.admission?.status !== "blocked-input-unavailable" || source.admission.authorityGranted !== false || source.v410IdealOperatorRemainsQualified !== true || source.detectorElectronProjectionAvailable !== false || source.fullInspectAvailable !== true || source.scienceBufferMutationAllowed !== false || source.cinematicBufferMutationAllowed !== false || source.browserQualification !== "not-run" || source.boundary !== "summary-only-schema-ready-measured-pack-absent-authority-blocked" || Object.hasOwn(source, "requiredInputs")) throw new Error("v411-summary-identity");
  return value as PolarimeterCalibrationSummaryV411;
}

export function parsePolarimeterCalibrationResponseV411(value: unknown): PolarimeterCalibrationResponseV411 {
  const source = object(value, "response") as Partial<PolarimeterCalibrationResponseV411>;
  if (source.version !== KERR_POLARIMETER_CALIBRATION_RESPONSE_VERSION_V411) throw new Error("v411-response-version");
  if (source.available === true && source.reason === "ready" && source.summary) return { version: KERR_POLARIMETER_CALIBRATION_RESPONSE_VERSION_V411, available: true, reason: "ready", summary: parsePolarimeterCalibrationSummaryV411(source.summary) };
  if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(String(source.reason))) return source as PolarimeterCalibrationResponseV411;
  throw new Error("v411-response-identity");
}
