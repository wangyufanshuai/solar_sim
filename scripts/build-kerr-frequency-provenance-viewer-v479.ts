import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalKerrDualRenderPayloadV475,
} from "../app/lib/kerrDualRenderBoundaryV475";
import {
  canonicalKerrFrequencyProvenanceViewerV479,
  KERR_FREQUENCY_PROVENANCE_ARTIFACT_VERSION_V479,
  parseKerrFrequencyProvenanceArtifactV479,
  type KerrFrequencyProvenanceRowV479,
} from "../app/lib/kerrFrequencyProvenanceViewerV479";
import { canonicalKerrRadiativeTransferPayloadV466 } from "../app/lib/kerrRadiativeTransferV466";
import { canonicalKerrObservableUncertaintyPayloadV473 } from "../app/lib/kerrObservableUncertaintyV473";
import { canonicalKerrScienceProductAdmissionV476 } from "../app/lib/kerrScienceProductAdmissionV476";
import { canonicalKerrPhotonRadiometryTransferV477 } from "../app/lib/kerrPhotonRadiometryTransferV477";
import { canonicalKerrNormalizedFrequencyChartV478 } from "../app/lib/kerrNormalizedFrequencyChartV478";

type Json = Record<string, unknown>;
const root = process.cwd();
const paths = Object.freeze({
  v466: "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  v473: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
  v475: "dist/science/kerr-dual-render-boundary-v475/dual-render.json",
  v476: "dist/science/kerr-science-product-admission-v476/admission.json",
  v477: "dist/science/kerr-photon-radiometry-transfer-v477/transfer-payload.json",
  v478: "dist/science/kerr-normalized-frequency-chart-v478/frequency-chart.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json",
});
const read = (path: string): Json => JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const fileSha = (path: string) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const digest = (canonical: (value: unknown) => string, value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");
const canonicalSha = (value: unknown) => digest(canonicalKerrFrequencyProvenanceViewerV479, value);
const atomic = (path: string, value: unknown) => { const target=resolve(root,path); mkdirSync(dirname(target),{recursive:true}); const part=target+"."+process.pid+".part"; writeFileSync(part,JSON.stringify(value,null,2)+"\n","utf8"); renameSync(part,target); };
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;
const rows = (value: Json, key: string) => (value[key] ?? []) as Json[];

const v466=read(paths.v466), v473=read(paths.v473), v475=read(paths.v475), v476=read(paths.v476), v477=read(paths.v477), v478=read(paths.v478), dense=read(paths.dense), formal=read(paths.formal), formalEvidence=read(String(formal.source));
const v478Rows=rows(v478,"rows");
const v478Audit=nested(v478,"audit");
const v476Audit=nested(v476,"audit");
const formalEvidenceScience=nested(formalEvidence,"science");
const formalEvidenceContracts=nested(formalEvidence,"contracts");
if(v466.status!=="radiative-transfer-invariant-qualified-measured-input-blocked"||digest(canonicalKerrRadiativeTransferPayloadV466,v466)!==v466.artifactSha256||v473.status!=="observable-uncertainty-qualified-production-ledger-open-browser-pending"||digest(canonicalKerrObservableUncertaintyPayloadV473,v473)!==v473.artifactSha256||v475.status!=="dual-render-boundary-qualified-browser-pending"||digest(canonicalKerrDualRenderPayloadV475,v475)!==v475.artifactSha256||v476.status!=="science-product-admission-qualified-production-images-blocked-browser-pending"||digest(canonicalKerrScienceProductAdmissionV476,v476)!==v476.artifactSha256||v477.status!=="photon-radiometry-transfer-qualified-measured-radiance-unavailable-browser-pending"||digest(canonicalKerrPhotonRadiometryTransferV477,v477)!==v477.artifactSha256||v478.status!=="normalized-frequency-chart-qualified-physical-bandpass-unavailable-browser-pending"||digest(canonicalKerrNormalizedFrequencyChartV478,v478)!==v478.artifactSha256||digest(canonicalKerrNormalizedFrequencyChartV478,v478Rows)!==v478.payloadSha256||v478Rows.length!==4||v478Audit.sampleCount!==20||v478Audit.sciencePixelRows!==0||v476Audit.observedIntensityAvailable!==false||v476Audit.scienceRasterAllowed!==false||dense.status!=="incomplete-0-of-49"||dense.completedShardCount!==0||dense.attemptConsumed!==false||dense.aggregateAvailable!==false||formal.version!=="v263-current-product-evidence-pointer"||formalEvidenceScience.defaultKernel!=="legacy-eih-1pn"||formalEvidenceContracts.singleCanvas!==true||formalEvidenceContracts.legacyRootAttributes!==603||formalEvidenceContracts.evidenceLedgerClaims!==84) throw new Error("v479-upstream-boundary");

const sourceChain = Object.freeze([
  { id:"v466" as const, role:"redshift-definition-and-Liouville-invariant", artifactSha256:String(v466.artifactSha256), fileSha256:fileSha(paths.v466) },
  { id:"v473" as const, role:"redshift-uncertainty-ledger", artifactSha256:String(v473.artifactSha256), fileSha256:fileSha(paths.v473) },
  { id:"v475" as const, role:"science-cinematic-render-boundary", artifactSha256:String(v475.artifactSha256), fileSha256:fileSha(paths.v475) },
  { id:"v477" as const, role:"analytic-g-g3-g4-transfer", artifactSha256:String(v477.artifactSha256), fileSha256:fileSha(paths.v477) },
  { id:"v478" as const, role:"normalized-frequency-coordinate-chart", artifactSha256:String(v478.artifactSha256), fileSha256:fileSha(paths.v478) },
]);
const uncertaintyArtifactSha256 = String(v473.artifactSha256);
const provenance = Object.freeze(rows(v478,"rows").map((row)=>Object.freeze({
  rayId:String(row.rayId) as KerrFrequencyProvenanceRowV479["rayId"],
  sourceRowSha256:String(row.rowSha256),
  sampleIndices:[0,1,2,3,4] as [0,1,2,3,4],
  formulaIds:["redshift-factor","normalized-frequency-forward","normalized-frequency-inverse","first-order-redshift-uncertainty"] as ["redshift-factor","normalized-frequency-forward","normalized-frequency-inverse","first-order-redshift-uncertainty"],
  uncertaintyArtifactSha256,
  physicalApplicability:"normalized-coordinate-only-absolute-bandpass-unavailable" as const,
}))) as unknown as readonly KerrFrequencyProvenanceRowV479[];
const frequencyBuffer = rows(v478,"rows");
const sciencePresentation = nested(nested(v475,"presentation"),"science");
const cinematicPresentation = nested(nested(v475,"presentation"),"cinematic");
const presentation = {
  science:{ mode:"science" as const, linearDisplay:Boolean(sciencePresentation.linearDisplay), exposure:Number(sciencePresentation.exposure), bloomIntensity:Number(sciencePresentation.bloomIntensity), colorGradeIntensity:Number(sciencePresentation.colorGradeIntensity), grain:Number(sciencePresentation.grain), chromaticAberration:Number(sciencePresentation.chromaticAberration), seed:null, scientificFieldMutation:false as const, scienceWritebackAllowed:false as const },
  cinematic:{ mode:"cinematic" as const, linearDisplay:Boolean(cinematicPresentation.linearDisplay), exposure:Number(cinematicPresentation.exposure), bloomIntensity:Number(cinematicPresentation.bloomIntensity), colorGradeIntensity:Number(cinematicPresentation.colorGradeIntensity), grain:Number(cinematicPresentation.grain), chromaticAberration:Number(cinematicPresentation.chromaticAberration), seed:String(cinematicPresentation.seed), scientificFieldMutation:false as const, scienceWritebackAllowed:false as const },
};
const frequencyBufferSha256=String(v478.payloadSha256), provenanceSha256=canonicalSha(provenance);
const unsigned={
  version:KERR_FREQUENCY_PROVENANCE_ARTIFACT_VERSION_V479, generatedAt:"2026-07-30T00:00:00Z", status:"frequency-provenance-viewer-qualified-bandpass-blocked-browser-pending" as const,
  source:{v466:fileSha(paths.v466),v473:fileSha(paths.v473),v475:fileSha(paths.v475),v477:fileSha(paths.v477),v478:fileSha(paths.v478)}, sourceChain,
  contract:{frequencyBufferRowCount:4 as const,frequencyBufferSampleCount:20 as const,provenanceRowCount:4 as const,provenanceSampleCount:20 as const,sourceChainCount:5 as const,viewerModeCount:2 as const,presentationFieldCount:7 as const,presentationCannotContainScientificFields:true as const,sharedFrequencyBufferIdentityRequired:true as const,stableViewerCacheRequired:true as const,scienceWritebackForbidden:true as const,normalizedCoordinatesOnly:true as const,physicalBandpassAuthorityRequired:true as const,unavailableIsNotZero:true as const,boundedSummaryOnly:true as const,maximumResponseBytes:131072 as const,localShadowOnly:true as const,formalProductPointer:"v263" as const},
  frequencyBuffer, frequencyBufferSha256, provenance, provenanceSha256, presentation,
  audit:{sourceChainComplete:true as const,frequencyBufferCanonicalIdentityShared:true as const,scienceViewFrequencyBufferSha256:frequencyBufferSha256,cinematicViewFrequencyBufferSha256:frequencyBufferSha256,presentationScientificFieldCount:0 as const,frequencyBufferMutationCount:0 as const,scienceWritebackCount:0 as const,scienceEffectsZero:true as const,cinematicSeedDeterministic:true as const,absoluteFrequencyRows:0 as const,physicalBandpassRows:0 as const,sciencePixelRows:0 as const},
  lifecycle:{existingCanvasCount:1 as const,newCanvasCreated:false as const,sceneRevisionDelta:0 as const,workers:0 as const,gpuBuffers:0 as const,pipelines:0 as const,textures:0 as const,renderTargets:0 as const,typedArrayCaches:0 as const,objectUrls:0 as const,cameraLeases:0 as const,subscriptions:0 as const,allResourcesAtBaseline:true as const},
  boundary:{normalizedFrequencyAuthorityGranted:true as const,absoluteFrequencyAuthorityGranted:false as const,physicalBandpassAuthorityGranted:false as const,bandIntegratedRadianceAuthorityGranted:false as const,productionPayloadAllowed:false as const,sciencePixelRows:0 as const,imageProductsGenerated:false as const,frequencyBufferMutationAllowed:false as const,cinematicScienceWritebackAllowed:false as const,networkAttempted:false as const,automaticRetryApplied:false as const,denseShardRunAllowed:false as const,browserQualification:"not-run" as const,visualMatrixQualification:"not-run" as const,soakQualification:"not-run" as const,rtxWebGpuQualification:"not-run" as const}, formalProductPointer:"v263" as const, formalDefaultKernel:"legacy-eih-1pn" as const,
};
const artifact=parseKerrFrequencyProvenanceArtifactV479({...unsigned,artifactSha256:canonicalSha(unsigned)}); atomic(paths.output,artifact); console.log(JSON.stringify({status:artifact.status,artifactSha256:artifact.artifactSha256,frequencyBufferSha256:artifact.frequencyBufferSha256,provenanceSha256:artifact.provenanceSha256,sourceChain:5,rows:4,samples:20,presentationScientificFields:0,frequencyBufferMutationCount:0,absoluteFrequencyRows:0,physicalBandpassRows:0,sciencePixels:0,browserQualification:"not-run",formalProductPointer:"v263"},null,2));
