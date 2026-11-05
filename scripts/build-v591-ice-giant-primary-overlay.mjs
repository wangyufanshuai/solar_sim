import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const outputPath = resolve(root, "public/data/celestial-convergence-v591/ice-giant-primary-overlay.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
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

function verifySealed(path, field, label) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned[field];
  assert(canonicalSha(unsigned) === document[field], `v591-ice-giant-${label}-seal`);
  return document;
}

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}

const v590Manifest = verifySealed(
  resolve(root, "public/data/celestial-rendering-v590/manifest.json"),
  "manifestSha256",
  "manifest",
);
const v590SourceManifest = verifySealed(
  resolve(root, "docs/release/v590/source-manifest-v590.json"),
  "receiptSha256",
  "source-manifest",
);

assert(v590Manifest.heroBodies?.uranus === "admitted" && v590Manifest.heroBodies?.neptune === "admitted", "v591-ice-giant-baseline-admission");
const sourcePaths = [
  "app/lib/celestialRenderingV590.ts",
  "app/lib/celestialMaterialsV590.ts",
  "app/components/CelestialBodiesV590.tsx",
];
const sourceRows = new Map(v590SourceManifest.files.map((row) => [row.path, row]));
const inheritedSources = sourcePaths.map((path) => {
  const row = sourceRows.get(path);
  assert(row?.status === "matched" && /^[a-f0-9]{64}$/.test(row.sha256), `v591-ice-giant-source-row:${path}`);
  const bytes = readFileSync(resolve(root, path));
  assert(bytes.byteLength === row.bytes && sha256(bytes) === row.sha256, `v591-ice-giant-source-drift:${path}`);
  return { path, bytes: row.bytes, sha256: row.sha256 };
});

const renderingContract = readFileSync(resolve(root, "app/lib/celestialRenderingV590.ts"), "utf8");
const materialContract = readFileSync(resolve(root, "app/lib/celestialMaterialsV590.ts"), "utf8");
const bodyContract = readFileSync(resolve(root, "app/components/CelestialBodiesV590.tsx"), "utf8");
for (const body of ["uranus", "neptune"]) {
  assert(renderingContract.includes(`id: "${body}"`) && renderingContract.includes("proceduralPrimaryAllowed: true"), `v591-ice-giant-registered-primary:${body}`);
}
assert(materialContract.includes("ICE_GIANT_FRAGMENT_V590") && bodyContract.includes("function IceGiantV590"), "v591-ice-giant-baseline-code-contract");

const bodies = [
  {
    body: "uranus",
    registeredMaterial: "ice-giant-flow-primary",
    paletteIdentity: "v590-voyager-calibrated-qualitative-palette-readonly",
    v591ShaderProfile: "subtle-zonal-clouds-polar-haze-methane-limb-faint-rings",
    stormPolicy: "low-amplitude-fixed-epoch",
  },
  {
    body: "neptune",
    registeredMaterial: "ice-giant-flow-primary",
    paletteIdentity: "v590-voyager-calibrated-qualitative-palette-readonly",
    v591ShaderProfile: "zonal-clouds-methane-limb-bounded-dark-storm-faint-rings",
    stormPolicy: "bounded-fixed-epoch",
  },
].map((body) => ({
  ...body,
  baselineAdmission: "admitted",
  v591Admission: "admitted-registered-procedural-primary",
  proceduralPrimary: true,
  proceduralFallback: false,
  observationTextureClaim: false,
  measuredPhotometryClaim: false,
  scientificGeometryMutation: false,
  scientificPayloadWriteback: false,
}));

const unsigned = {
  version: "v591-ice-giant-primary-overlay-v1",
  generatedAt,
  status: "ice-giant-registered-primary-ready-for-runtime-admission",
  baseline: {
    candidate: "v590-readonly",
    manifestPath: "public/data/celestial-rendering-v590/manifest.json",
    manifestSha256: v590Manifest.manifestSha256,
    sourceManifestPath: "docs/release/v590/source-manifest-v590.json",
    sourceManifestSha256: v590SourceManifest.receiptSha256,
  },
  noNetworkRequestsPerformed: true,
  noAssetBytesCopied: true,
  noTextureAssetsRequired: true,
  deterministicEpoch: 591.271828,
  modelPolicy: "registered-analytical-primary-not-observational-texture",
  inheritedSources,
  bodies,
  authorityState: {
    presentationOnly: true,
    scientificAuthorityChanged: false,
    scientificPayloadWriteback: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
  },
};
const overlay = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(outputPath, Buffer.from(`${JSON.stringify(overlay, null, 2)}\n`, "utf8"));

const overlayNames = ["SUN", "EARTH", "MOON", "MARS", "JUPITER", "SATURN", "BENNU"];
const overlays = Object.fromEntries(overlayNames.map((name) => {
  const path = resolve(root, `public/data/celestial-convergence-v591/${name.toLowerCase()}-asset-overlay.json`);
  assert(existsSync(path), `v591-ice-giant-existing-overlay:${name}`);
  return [name, verifySealed(path, "receiptSha256", `${name.toLowerCase()}-overlay`)];
}));
atomicWrite(generatedConstantsPath, Buffer.from([
  "// Generated from the sealed v591 Hero asset and registered-primary overlays.",
  ...Object.entries(overlays).map(([name, value]) => `export const CELESTIAL_CONVERGENCE_${name}_ASSET_OVERLAY_SHA256_V591 = "${value.receiptSha256}" as const;`),
  `export const CELESTIAL_CONVERGENCE_ICE_GIANT_PRIMARY_OVERLAY_SHA256_V591 = "${overlay.receiptSha256}" as const;`,
  "",
].join("\n"), "utf8"));

console.log(JSON.stringify({
  status: overlay.status,
  bodies: overlay.bodies.map(({ body, v591Admission, proceduralPrimary, proceduralFallback }) => ({ body, v591Admission, proceduralPrimary, proceduralFallback })),
  inheritedSources: overlay.inheritedSources.length,
  receiptSha256: overlay.receiptSha256,
}, null, 2));
