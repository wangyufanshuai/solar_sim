import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const artifactRoot = "dist/science/kerr-science-product-promotion-gate-v457";
const artifact = read(`${artifactRoot}/science-product-promotion-gate.json`);
const evidence = read("dist/science/orbit-atlas-shadow-v457-evidence.json");
const pointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v457.json");
const previousEvidence = read("dist/science/orbit-atlas-shadow-v456-evidence.json");
const previousPointer = read(
  "dist/release/orbit-atlas-current-local-shadow-candidate-v456.json",
);
const v451 = read(
  "dist/science/kerr-detector-input-admission-v451/input-admission-qualification.json",
);
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const forbiddenProducts = readdirSync(resolve(root, artifactRoot)).filter((name) =>
  [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()),
);
const gateById = Object.fromEntries(artifact.gates.map((gate) => [gate.id, gate]));

if (
  canonicalSha(artifact) !== artifact.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  artifact.gates.length !== 10 ||
  artifact.counts.qualifiedCount !== 2 ||
  artifact.counts.blockerCount !== 8 ||
  artifact.counts.measuredDetectorReady !== 0 ||
  artifact.counts.denseShardsCompleted !== 0 ||
  gateById["fits-header"]?.status !== "qualified" ||
  gateById["provenance-graph"]?.status !== "qualified" ||
  gateById["measured-detector-inputs"]?.status !== "blocked" ||
  gateById["detector-pixel-values"]?.status !== "blocked" ||
  gateById["dense-aggregate"]?.status !== "incomplete" ||
  gateById["selection-bias"]?.status !== "unquantified" ||
  gateById.browser?.status !== "not-run" ||
  gateById["visual-matrix"]?.status !== "not-run" ||
  gateById.soak?.status !== "not-run" ||
  gateById["rtx-webgpu"]?.status !== "not-run" ||
  artifact.decisions.promotionAllowed !== false ||
  artifact.decisions.fitsWriteAllowed !== false ||
  artifact.decisions.pngWriteAllowed !== false ||
  artifact.decisions.localShadowDefaultApplied !== false ||
  artifact.decisions.blockerIds.length !== 8 ||
  artifact.visualProfile.profileId !== "science-cinematic-v7-v457" ||
  artifact.visualProfile.scienceLinearDisplay !== true ||
  artifact.visualProfile.scienceBloomDisabled !== true ||
  artifact.visualProfile.scienceGradeDisabled !== true ||
  artifact.visualProfile.scientificFieldMutation !== false ||
  artifact.visualProfile.defaultApplied !== false ||
  artifact.boundary.scienceProductAuthority !== false ||
  artifact.boundary.fitsHduEmitted !== false ||
  artifact.boundary.pngEmitted !== false ||
  pointer.capabilities.v457ScienceProductPromotion !== "blocked-fail-closed" ||
  pointer.capabilities.v457ScienceCinematicV7 !==
    "implemented-awaiting-browser-qualification" ||
  pointer.promotion.promotionAllowed !== false ||
  pointer.promotion.fitsWriteAllowed !== false ||
  pointer.promotion.pngWriteAllowed !== false ||
  forbiddenProducts.length !== 0 ||
  v451.detector.readyFileCount !== 0 ||
  v451.detector.requiredFileCount !== 6 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.runNextAuthorized !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  evidence.dependency.v456EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v456PointerSha256 !== previousPointer.pointerSha256
) {
  throw new Error("v457-fail-closed-validation");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v457-source-manifest-mismatch:${entry.path}`);
  }
}
if (
  /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(
    JSON.stringify({ artifact, evidence, pointer }),
  )
) {
  throw new Error("v457-transient-evidence-leak");
}
const componentSource = readFileSync(
  resolve(root, "app/components/ScienceProductQualificationConsoleV457.tsx"),
  "utf8",
);
if (
  !componentSource.includes("结构已经合格，像素仍未获得科学身份") ||
  /鍧|銆|鏁|绱|锛/.test(componentSource)
) {
  throw new Error("v457-utf8-console-validation");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v457-low-memory-promotion-fail-closed",
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      qualifiedCount: 2,
      blockerCount: 8,
      measuredDetectorInputs: "0/6",
      denseCampaign: "0/49",
      promotionAllowed: false,
      fitsWriteAllowed: false,
      pngWriteAllowed: false,
      forbiddenImageProducts: forbiddenProducts.length,
      profile: "science-cinematic-v7-v457",
      scientificFieldMutation: false,
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
