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
const close = (left, right, tolerance = 1e-28) => Math.abs(left - right) <= tolerance;

const ledgerPath = "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v473-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v473.json";
const ledger = read(ledgerPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v472-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v472.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const byId = new Map(ledger.entries.map((entry) => [entry.observableId, entry]));

if (
  canonicalSha(ledger) !== ledger.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  ledger.version !== "v473-kerr-observable-uncertainty-artifact-v1" ||
  ledger.status !== "observable-uncertainty-qualified-production-ledger-open-browser-pending" ||
  evidence.version !== "orbit-atlas-shadow-v473-evidence-v1" ||
  evidence.status !== "v473-observable-uncertainty-qualified-production-ledger-open-browser-pending" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v473" ||
  pointer.status !== evidence.status ||
  ledger.entries.length !== 13 ||
  ledger.entries.reduce((sum, entry) => sum + entry.components.length, 0) !== 16 ||
  ledger.summary.quantifiedEntryCount !== 9 ||
  ledger.summary.combinedEntryCount !== 8 ||
  ledger.summary.separateChannelEntryCount !== 1 ||
  ledger.summary.unavailableEntryCount !== 4 ||
  ledger.summary.numericAcceptanceCount !== 7 ||
  ledger.summary.sourceQualifiedWithoutNumericLimitCount !== 2 ||
  ledger.summary.linearSumEntryCount !== 3 ||
  ledger.summary.maximumEntryCount !== 1 ||
  ledger.summary.singleComponentEntryCount !== 4 ||
  ledger.summary.rssEntryCount !== 0 ||
  ledger.summary.productionBudgetClosedCount !== 0 ||
  ledger.entries.some(
    (entry) =>
      entry.independenceProven !== false ||
      entry.productionBudgetClosed !== false ||
      entry.combinationPolicy.includes("rss"),
  ) ||
  ledger.productionLedger.status !== "open" ||
  ledger.productionLedger.missingComponentIds.length !== 4 ||
  ledger.boundary.productionAuthorityGranted !== false ||
  ledger.boundary.sciencePixelRows !== 0 ||
  ledger.boundary.imageProductsGenerated !== false ||
  ledger.boundary.browserQualification !== "not-run" ||
  ledger.lifecycle.allResourcesAtBaseline !== true
) {
  throw new Error("v473-fail-closed-validation");
}

const screen = byId.get("screen-alpha-beta");
const wcs = byId.get("continuous-wcs-coordinate");
const basis = byId.get("orientation-basis");
const evpa = byId.get("evpa");
const radiance = byId.get("observed-radiance");
if (
  !screen ||
  !close(screen.combinedValue, screen.components.reduce((sum, item) => sum + item.value, 0)) ||
  screen.combinationPolicy !== "linear-sum-no-independence-proof" ||
  !wcs ||
  !close(wcs.combinedValue, wcs.components.reduce((sum, item) => sum + item.value, 0)) ||
  !basis ||
  !close(basis.combinedValue, basis.components.reduce((sum, item) => sum + item.value, 0)) ||
  !evpa ||
  !close(evpa.combinedValue, Math.max(...evpa.components.map((item) => item.value))) ||
  evpa.combinationPolicy !== "maximum-correlated-tolerances" ||
  !radiance ||
  radiance.combinationPolicy !== "separate-physical-channels" ||
  radiance.combinedValue !== null ||
  radiance.components.length !== 3 ||
  !ledger.entries.filter((entry) => entry.acceptance).every((entry) => {
    const gate = entry.acceptance;
    return gate.relation === "<" ? gate.observed < gate.limit : gate.observed <= gate.limit;
  })
) {
  throw new Error("v473-combination-policy-mismatch");
}

const upstream = {
  v312: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
  v313: "dist/science/kerr-reference-v313/polarization-short-gate.json",
  v419: "dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json",
  v420: "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json",
  v422: "dist/science/kerr-polarization-orientation-basis-v422/orientation-basis-catalog.json",
  v466: "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  v467: "dist/science/kerr-thin-disk-analytic-v467/thin-disk-analytic.json",
  v468: "dist/science/kerr-thin-disk-radiative-coupling-v468/radiative-coupling.json",
  v471: "dist/science/kerr-observable-provenance-v471/observable-matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
};
for (const [id, path] of Object.entries(upstream)) {
  if (ledger.source[id] !== fileSha(path)) throw new Error("v473-source-sha-mismatch:" + id);
}

if (
  evidence.dependency.v472EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v472PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v473LedgerArtifactSha256 !== ledger.artifactSha256 ||
  evidence.dependency.v473LedgerFileSha256 !== fileSha(ledgerPath) ||
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
  throw new Error("v473-continuity-boundary");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error("v473-source-manifest-mismatch:" + entry.path);
  }
}
if (canonicalSha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v473-source-manifest-canonical-mismatch");
}

const component = readFileSync(
  resolve(root, "app/components/KerrObservableUncertaintyLedgerV473.tsx"),
  "utf8",
);
const page = readFileSync(resolve(root, "app/local-shadow-v473/page.tsx"), "utf8");
if (
  !component.includes("误差不是一个数字，而是一组不能随意相加的收据") ||
  !component.includes("未证明独立性时线性相加") ||
  !component.includes("RSS") ||
  !component.includes("production ledger 继续保持 open") ||
  !page.includes("独立公式、容差收敛、坐标回放与 Python oracle 的逐项误差收据") ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  /\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/.test(component + "\n" + page)
) {
  throw new Error("v473-utf8-runtime-boundary");
}

const forbiddenImages = readdirSync(
  resolve(root, "dist/science/kerr-observable-uncertainty-v473"),
).filter((name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()));
if (forbiddenImages.length > 0) throw new Error("v473-forbidden-image-product");
const serialized = JSON.stringify({ ledger, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v473-transient-evidence-leak");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v473-low-memory-observable-uncertainty-fail-closed",
      artifactSha256: ledger.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      entryCount: 13,
      componentCount: 16,
      quantified: 9,
      linearSums: 3,
      correlatedMaximums: 1,
      separateChannels: 1,
      rssUsed: 0,
      productionLedger: "open",
      productionAuthority: false,
      sciencePixelRows: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
