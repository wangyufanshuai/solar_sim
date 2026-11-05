import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  parseAtlasEvidenceObservatoryQualificationV405,
  parseAtlasLifecycleProvenanceDossierV405,
} from "../app/lib/atlasLifecycleProvenanceDossierV405";
import { parseAtlasObservationLifecycleReplaySummaryV404 } from "../app/lib/atlasObservationLifecycleReplaySummaryV404";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V400,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V405,
  resolveAtlasInitialVisualProfileV299,
  resolveAtlasVisualProfileV299,
} from "../app/lib/atlasVisualProfileV299";

const root = process.cwd();
const paths = {
  summary: "dist/science/atlas-observation-lifecycle-summary-v404/summary.json",
  evidence: "dist/science/orbit-atlas-shadow-v404-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v404.json",
  dossier: "dist/science/atlas-evidence-observatory-v405/portable-dossier.json",
  qualification: "dist/science/atlas-evidence-observatory-v405/qualification.json",
  component: "app/components/KerrEvidenceObservatoryV405.tsx",
  hub: "app/components/KerrObservationHubV400.tsx",
  ab: "app/components/AtlasVisualABControlV261.tsx",
} as const;
const bounded = (path: string, maximum = 128 * 1024) => { const target = resolve(root, path); const metadata = statSync(target); if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximum) throw new Error(`v405-input-size:${path}`); return readFileSync(target); };
const read = (path: string) => JSON.parse(bounded(path).toString("utf8"));
const shaBytes = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown, identityField: string): unknown => Array.isArray(value)
  ? value.map((entry) => canonicalize(entry, identityField))
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["generatedAt", identityField].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry, identityField)]));
const canonicalSha = (value: unknown, identityField: string) => shaBytes(JSON.stringify(canonicalize(value, identityField)));
const atomic = (path: string, value: unknown) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(temporary, target); };

const summary = parseAtlasObservationLifecycleReplaySummaryV404(read(paths.summary));
const evidence = read(paths.evidence) as { evidenceSha256?: string; dependency?: { summarySha256?: string } };
const pointer = read(paths.pointer) as { pointerSha256?: string; evidence?: { canonicalSha256?: string } };
if (!evidence.evidenceSha256 || !pointer.pointerSha256 || evidence.dependency?.summarySha256 !== summary.summarySha256 || pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256) throw new Error("v405-v404-identity");
const dossierUnsigned = {
  version: "v405-atlas-lifecycle-provenance-dossier-v1" as const,
  generatedAt: new Date().toISOString(),
  status: "portable-fixture-provenance-qualified-browser-soak-not-run" as const,
  source: Object.freeze({ v403ReplayArtifactSha256: summary.source.replayArtifactSha256, v404SummarySha256: summary.summarySha256, v404EvidenceSha256: evidence.evidenceSha256, v404PointerSha256: pointer.pointerSha256 }),
  lineage: Object.freeze({
    nodeCount: 4 as const,
    edgeCount: 3 as const,
    nodes: Object.freeze([
      Object.freeze({ id: "v403-replay" as const, contentClass: "fixture-replay" as const, sha256: summary.source.replayArtifactSha256 }),
      Object.freeze({ id: "v404-summary" as const, contentClass: "bounded-summary" as const, sha256: summary.summarySha256 }),
      Object.freeze({ id: "v404-evidence" as const, contentClass: "qualification-evidence" as const, sha256: evidence.evidenceSha256 }),
      Object.freeze({ id: "v404-pointer" as const, contentClass: "capability-pointer" as const, sha256: pointer.pointerSha256 }),
    ]),
    edges: Object.freeze([
      Object.freeze({ from: "v403-replay" as const, to: "v404-summary" as const, relation: "summarized-by" as const }),
      Object.freeze({ from: "v404-summary" as const, to: "v404-evidence" as const, relation: "qualified-by" as const }),
      Object.freeze({ from: "v404-evidence" as const, to: "v404-pointer" as const, relation: "selected-by" as const }),
    ]),
  }),
  replay: summary.replay,
  stages: summary.stages,
  qualification: Object.freeze({ fixtureReplayQualified: true as const, portableDossierQualified: true as const, browserSoakQualified: false as const, productionLifecycleQualified: false as const, scientificAuthorityChanged: false as const, cycleDetailsIncluded: false as const }),
  release: Object.freeze({ formalProductPointer: "v263" as const, ordinaryStandaloneProfile: "legacy-v9" as const, liteProfile: "legacy-v9" as const, localShadowDefaultProfile: "legacy-v9" as const, localShadowDefaultApplied: false as const, denseCampaignStatus: "incomplete-0-of-49" as const }),
};
const dossier = parseAtlasLifecycleProvenanceDossierV405({ ...dossierUnsigned, dossierSha256: canonicalSha(dossierUnsigned, "dossierSha256") });
if ("cycles" in dossier || JSON.stringify(dossier).includes('"cycle":')) throw new Error("v405-dossier-cycle-leak");
atomic(paths.dossier, dossier);

const v12 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V400);
const v13 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V405);
const v12ProfileSha256 = shaBytes(JSON.stringify(v12));
const v13ProfileSha256 = shaBytes(JSON.stringify(v13));
if (v12ProfileSha256 !== "55fadd945552dd26918eb1f4334e7cd7d015721a905d773ddda87d14cc2ac58c" || resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V405) !== v13 || v13.v12TokensApplied !== false || v13.v13TokensApplied !== true || v13.runtimeTokens.hud.evidenceObservatoryV13?.detailSeed !== 405 || v13.runtimeTokens.strongGravity.scienceDisplayTransform !== "linear-no-grade") throw new Error("v405-profile-boundary");
for (const build of ["formal", "standalone-full", "vercel-lite"] as const) { const initial = resolveAtlasInitialVisualProfileV299({ build }); if (initial.profile !== "legacy-v9" || initial.v13EvidenceObservatoryManualAbAvailable || initial.localShadowDefaultApplied) throw new Error(`v405-default:${build}`); }
const local = resolveAtlasInitialVisualProfileV299({ build: "local-shadow" });
if (local.profile !== "legacy-v9" || !local.v13EvidenceObservatoryManualAbAvailable || local.localShadowDefaultApplied) throw new Error("v405-local-shadow-boundary");
const component = bounded(paths.component, 128 * 1024).toString("utf8");
const hub = bounded(paths.hub, 128 * 1024).toString("utf8");
const ab = bounded(paths.ab, 128 * 1024).toString("utf8");
if (!component.includes("evidenceObservatoryV13") || !component.includes("useAtlasVisualRuntimeConsumerV300") || !component.includes('data-atlas-v405-cycle-details-in-react-state="false"') || !component.includes('data-atlas-v405-science-buffer-mutation="false"') || component.includes("Math.random") || component.includes("<canvas") || !hub.includes("<KerrEvidenceObservatoryV405 />") || !ab.includes("V13 Evidence Observatory · Shadow") || !ab.includes("id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V405 || localShadow")) throw new Error("v405-runtime-wiring");
const qualificationUnsigned = {
  version: "v405-atlas-evidence-observatory-qualification-v1" as const,
  generatedAt: new Date().toISOString(),
  status: "science-cinematic-v13-static-qualified-browser-pending" as const,
  source: Object.freeze({ v404SummarySha256: summary.summarySha256, v404EvidenceSha256: evidence.evidenceSha256, v404PointerSha256: pointer.pointerSha256, dossierSha256: dossier.dossierSha256, v12ProfileSha256, v13ProfileSha256 }),
  profile: Object.freeze({ id: "science-cinematic-v13-v405" as const, v12Frozen: true as const, stableReference: true as const, hudTokenConsumed: true as const, scienceDisplayTransform: "linear-no-grade" as const, localShadowManualOnly: true as const, defaultApplied: false as const }),
  runtime: Object.freeze({ portableDossierReadOnly: true as const, cycleDetailsInReactState: false as const, singleFlightRequest: true as const, canvasCreated: false as const, sceneRevisionMutation: false as const, physicsMutation: false as const, scienceBufferMutation: false as const, cinematicBufferMutation: false as const }),
  browserQualification: "not-run" as const,
  visualMatrixQualification: "not-run" as const,
  soakQualification: "not-run" as const,
  rtxWebGpuQualification: "not-run" as const,
};
const qualification = parseAtlasEvidenceObservatoryQualificationV405({ ...qualificationUnsigned, artifactSha256: canonicalSha(qualificationUnsigned, "artifactSha256") });
atomic(paths.qualification, qualification);
console.log(JSON.stringify({ status: qualification.status, dossierSha256: dossier.dossierSha256, qualificationSha256: qualification.artifactSha256, v12ProfileSha256, v13ProfileSha256, lineage: `${dossier.lineage.nodeCount}/${dossier.lineage.edgeCount}`, browser: qualification.browserQualification, dense: dossier.release.denseCampaignStatus }, null, 2));
