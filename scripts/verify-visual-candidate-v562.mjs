import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const file = "dist/science/atlas-visual-candidate-v562/manifest.json";
const transient = new Set(["generatedAt", "manifestSha256", "artifactSha256", "resultSha256"]);
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonical(entry)]));
const sha = (value) => createHash("sha256").update(typeof value === "string" ? value : value).digest("hex");
const canonicalSha = (value) => sha(JSON.stringify(canonical(value)));
const manifest = JSON.parse(readFileSync(resolve(root, file), "utf8"));
if (canonicalSha(manifest) !== manifest.manifestSha256 || manifest.version !== "v562-visual-candidate-ktx2-first" || manifest.status !== "candidate-qualified-history-immutable" || manifest.visualAuthority !== "candidate-only-not-v263-not-legacy-v9" || manifest.boundary.formalProductPointer !== "v263" || manifest.boundary.legacyV9Mutated !== false || manifest.boundary.historicalEvidenceRewritten !== false || manifest.boundary.sciencePayloadWriteback !== false || manifest.boundary.networkAttempted !== false || manifest.conversion.ktx2Primary !== true) throw new Error("v562-visual-candidate-boundary");
if (canonicalSha(manifest.sourceManifest) !== manifest.sourceSha256 || manifest.assets.length !== 9) throw new Error("v562-visual-candidate-source-manifest");
for (const asset of manifest.assets) {
  const source = resolve(root, asset.sourcePath);
  if (!statSync(source).isFile() || statSync(source).size !== asset.bytes || sha(readFileSync(source)) !== asset.sourceSha256 || asset.sha256 !== asset.sourceSha256) throw new Error(`v562-visual-candidate-asset:${asset.id}`);
}
console.log(JSON.stringify({ status: "passed-v562-visual-candidate", manifestSha256: manifest.manifestSha256, assets: manifest.assets.length, ktx2Primary: true, formalProductPointer: "v263", historicalEvidenceRewritten: false }, null, 2));
