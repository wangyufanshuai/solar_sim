import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const graphPath = "dist/science/kerr-evidence-dependency-v470/dependency-graph.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v470-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v470.json";
const graph = read(graphPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v469-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v469.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const expectedRoots = ["v458-measured-intake", "v314-dense-campaign", "heavy-qualification"];
const nodeIds = graph.nodes.map((node) => node.id);
const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
const orderIndex = new Map(graph.analysis.topologicalOrder.map((id, index) => [id, index]));

if (
  canonicalSha(graph) !== graph.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  graph.version !== "v470-kerr-evidence-dependency-artifact-v1" ||
  graph.status !== "dependency-graph-qualified-authority-blocked-browser-pending" ||
  evidence.version !== "orbit-atlas-shadow-v470-evidence-v1" ||
  evidence.status !== "v470-dependency-graph-qualified-authority-blocked-browser-pending" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v470" ||
  pointer.status !== evidence.status ||
  graph.nodes.length !== 16 ||
  graph.edges.length !== 34 ||
  new Set(nodeIds).size !== 16 ||
  graph.analysis.acyclic !== true ||
  graph.analysis.topologicalOrder.length !== 16 ||
  new Set(graph.analysis.topologicalOrder).size !== 16 ||
  JSON.stringify(graph.analysis.rootBlockers.map((entry) => entry.nodeId)) !==
    JSON.stringify(expectedRoots) ||
  JSON.stringify(graph.analysis.rootBlockers.map((entry) => entry.blockedDescendantCount)) !==
    JSON.stringify([12, 2, 1]) ||
  graph.nodes.some(
    (node) =>
      node.authorityGranted !== false ||
      node.sciencePixelRows !== 0 ||
      !node.label ||
      !node.upstreamStatus,
  ) ||
  graph.analysis.authorityGrantedNodeCount !== 0 ||
  graph.analysis.sciencePixelRows !== 0 ||
  graph.outcomes.measuredAuthorityGranted !== false ||
  graph.outcomes.scienceRasterAuthorityGranted !== false ||
  graph.outcomes.localShadowPromotionAllowed !== false ||
  graph.outcomes.browserQualification !== "not-run" ||
  graph.outcomes.visualMatrixQualification !== "not-run" ||
  graph.outcomes.soakQualification !== "not-run" ||
  graph.outcomes.rtxWebGpuQualification !== "not-run" ||
  graph.lifecycle.existingCanvasCount !== 1 ||
  graph.lifecycle.newCanvasCreated !== false ||
  graph.lifecycle.sceneRevisionDelta !== 0 ||
  graph.lifecycle.allResourcesAtBaseline !== true ||
  graph.boundary.sciencePayloadMutationAllowed !== false ||
  graph.boundary.cinematicScienceWritebackAllowed !== false ||
  graph.boundary.fitsWriteAllowed !== false ||
  graph.boundary.pngWriteAllowed !== false ||
  graph.boundary.imageProductsGenerated !== false ||
  graph.boundary.denseShardRunAllowed !== false
) {
  throw new Error("v470-fail-closed-validation");
}

for (const edge of graph.edges) {
  if (
    !nodeById.has(edge.from) ||
    !nodeById.has(edge.to) ||
    (orderIndex.get(edge.from) ?? Infinity) >= (orderIndex.get(edge.to) ?? -1)
  ) {
    throw new Error("v470-dag-order-mismatch");
  }
}

const upstream = {
  "v458-measured-intake": "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  "v459-blind-validation":
    "dist/science/kerr-measured-detector-blind-validation-v459/blind-validation.json",
  "v460-blind-results":
    "dist/science/kerr-measured-detector-blind-results-v460/blind-results.json",
  "v461-residual-ledger":
    "dist/science/kerr-uncertainty-residual-ledger-v461/residual-ledger.json",
  "v462-atomic-join":
    "dist/science/kerr-scientific-measurement-join-v462/measurement-join.json",
  "v463-payload-admission":
    "dist/science/kerr-science-payload-admission-v463/payload-admission.json",
  "v464-provenance":
    "dist/science/kerr-measured-detector-provenance-v464/provenance-observatory.json",
  "v465-response": "dist/science/kerr-detector-response-v465/response-contract.json",
  "v466-radiative-transfer":
    "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  "v467-thin-disk":
    "dist/science/kerr-thin-disk-analytic-v467/thin-disk-analytic.json",
  "v468-coupling":
    "dist/science/kerr-thin-disk-radiative-coupling-v468/radiative-coupling.json",
  "v469-workbench": "dist/science/kerr-unified-workbench-v469/workbench.json",
};
for (const [nodeId, path] of Object.entries(upstream)) {
  const document = read(path);
  if (nodeById.get(nodeId)?.artifactSha256 !== document.artifactSha256) {
    throw new Error("v470-upstream-artifact-mismatch:" + nodeId);
  }
}

if (
  evidence.dependency.v469EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v469PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v470GraphArtifactSha256 !== graph.artifactSha256 ||
  evidence.dependency.v470GraphFileSha256 !== fileSha(graphPath) ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(evidencePath) ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v470-continuity-boundary");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error("v470-source-manifest-mismatch:" + entry.path);
  }
}
if (canonicalSha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v470-source-manifest-canonical-mismatch");
}

const forbiddenImages = readdirSync(
  resolve(root, "dist/science/kerr-evidence-dependency-v470"),
).filter((name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()));
if (forbiddenImages.length > 0) throw new Error("v470-forbidden-image-product");

const serialized = JSON.stringify({ graph, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v470-transient-evidence-leak");
}

const component = readFileSync(
  resolve(root, "app/components/KerrEvidenceDependencyRailV470.tsx"),
  "utf8",
);
const page = readFileSync(resolve(root, "app/local-shadow-v470/page.tsx"), "utf8");
if (
  !component.includes("不是一堵墙，而是三条可追溯的根阻塞") ||
  !component.includes("协议通过不等于生产资格") ||
  !component.includes("Science/Cinematic writeback isolated") ||
  !page.includes("从 measured intake 到科学像素与 local-shadow 晋级的只读因果轨道") ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  /\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/.test(component + "\n" + page)
) {
  throw new Error("v470-utf8-runtime-boundary");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v470-low-memory-causal-dependency-fail-closed",
      artifactSha256: graph.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      rootBlockers: graph.analysis.rootBlockers,
      authorityGranted: false,
      sciencePixelRows: 0,
      imageProductsGenerated: false,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
