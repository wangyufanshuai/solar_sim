import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v591/human-visual-signoff-v591.json");
const decision = process.env.ATLAS_V591_HUMAN_SIGNOFF;
const signedAt = process.env.ATLAS_V591_HUMAN_SIGNOFF_AT;
const reviewer = process.env.ATLAS_V591_HUMAN_REVIEWER ?? "workspace-owner";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
async function readSealed(relativePath, field = "receiptSha256") {
  const value = JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
  const unsigned = { ...value };
  delete unsigned[field];
  assert(canonicalSha(unsigned) === value[field], `v591-signoff-seal:${relativePath}`);
  return value;
}
async function atomicWrite(path, bytes) {
  await mkdir(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  await writeFile(partial, bytes);
  await rm(path, { force: true });
  await rename(partial, path);
}

assert(decision === "approved", "v591-signoff-explicit-user-approval-required");
assert(typeof signedAt === "string" && !Number.isNaN(Date.parse(signedAt)), "v591-signoff-time-required");
assert(reviewer === "workspace-owner", "v591-signoff-reviewer");

const manifest = await readSealed("public/data/celestial-convergence-v591/manifest.json", "manifestSha256");
const sourceManifest = await readSealed("docs/release/v591/source-manifest-v591.json");
const matrix = await readSealed("docs/release/v591/browser-qualification-global-matrix-v591.json");
const soak = await readSealed("docs/release/v591/browser-soak-qualification-v591.json");
assert(matrix.status === "automated-global-visual-matrix-passed-human-signoff-pending", "v591-signoff-matrix");
assert(soak.status === "passed-30-minute-browser-soak" && soak.matrixReceiptSha256 === matrix.receiptSha256, "v591-signoff-soak");
assert(matrix.build.sourceManifestSha256 === sourceManifest.receiptSha256 && soak.build.sourceManifestSha256 === sourceManifest.receiptSha256, "v591-signoff-source");

const unsigned = {
  version: "v591-human-visual-signoff-v1",
  signedAt,
  status: "approved-by-workspace-owner",
  reviewer,
  statement: "Orbit Atlas v591 additive visual candidate is visually approved against the sealed current-build screenshot matrix; this approval does not migrate v263, authorize production deployment, or change scientific authority.",
  candidate: { route: "/local-shadow-v591", manifestSha256: manifest.manifestSha256, sourceManifestSha256: sourceManifest.receiptSha256, formalProductPointer: "v263" },
  evidence: { globalVisualMatrixReceiptSha256: matrix.receiptSha256, browserSoakReceiptSha256: soak.receiptSha256, totalScreenshots: matrix.matrix.totalScreenshots },
  authority: { scientificPayloadWriteback: false, scientificAuthorityChanged: false, productionReleaseAuthorized: false },
};
const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
await atomicWrite(outputPath, Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8"));
console.log(JSON.stringify({ status: sealed.status, receiptSha256: sealed.receiptSha256, manifestSha256: manifest.manifestSha256, sourceManifestSha256: sourceManifest.receiptSha256, productionReleaseAuthorized: false }, null, 2));
