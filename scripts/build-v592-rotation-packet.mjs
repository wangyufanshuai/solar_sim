import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-15T00:00:00Z";
const pckPath = "tools/science-cache/naif-v201/pck00011.tpc";
const pckAbsolute = resolve(root, pckPath);
const outputPath = resolve(root, "public/data/living-universe-v592/rotation-reference.json");
const generatedPath = resolve(root, "app/data/celestialRotationV592.generated.ts");
const receiptPath = resolve(root, "docs/release/v592/rotation-reference-receipt-v592.json");
const smallBodyMetadataReceiptPath = resolve(root, "docs/release/v592/acquisition-receipt-small-body-rotation-metadata-v592.json");

const definitions = Object.freeze([
  ["sun", 10],
  ["mercury", 199],
  ["venus", 299],
  ["earth", 399],
  ["moon", 301],
  ["mars", 499],
  ["jupiter", 599],
  ["saturn", 699],
  ["uranus", 799],
  ["neptune", 899],
  ["ceres", 2_000_001],
  ["vesta", 2_000_004],
  ["bennu", 2_101_955],
  ["eros", 2_000_433],
  ["kleopatra", 2_000_216],
  ["tempel-1", 1_000_093],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.part`;
  writeFileSync(temporary, text);
  rmSync(path, { force: true });
  renameSync(temporary, path);
}
function writeSealed(path, unsigned, field) {
  const sealed = { ...unsigned, [field]: canonicalSha(unsigned) };
  atomicWrite(path, `${JSON.stringify(sealed, null, 2)}\n`);
  return sealed;
}
function verifySealed(path, field) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned[field];
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`v592-rotation-supplement-seal:${path}`);
  return document;
}
function parseCoefficients(text, naifId, field) {
  const expression = new RegExp(`BODY${naifId}_${field}\\s*=\\s*\\(([^)]*)\\)`, "i");
  const match = text.match(expression);
  if (!match) return null;
  const values = match[1]
    .replaceAll(/D([+-]?\d+)/gi, "E$1")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(Number);
  if (values.length < 3 || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`v592-rotation-pck-coefficients:${naifId}:${field}`);
  }
  return values.slice(0, 3);
}

if (!existsSync(pckAbsolute)) throw new Error("v592-rotation-local-naif-pck-missing");
const pckBytes = readFileSync(pckAbsolute);
const pckSha256 = sha256(pckBytes);
if (pckSha256 !== "3dff7b1dbeceaa01f25467767d3fa25816051c85d162d1edf04acb310ee28bb1") {
  throw new Error(`v592-rotation-local-naif-pck-drift:${pckSha256}`);
}
const pck = pckBytes.toString("utf8");
const smallBodyMetadataReceipt = existsSync(smallBodyMetadataReceiptPath)
  ? verifySealed(smallBodyMetadataReceiptPath, "receiptSha256")
  : null;
const smallBodyMetadata = new Map();
for (const asset of smallBodyMetadataReceipt?.assets ?? []) {
  const path = resolve(root, asset.outputPath);
  if (!existsSync(path)) throw new Error(`v592-rotation-supplement-missing:${asset.bodyId}`);
  const bytes = readFileSync(path);
  if (bytes.byteLength !== asset.bytes || sha256(bytes) !== asset.sha256) throw new Error(`v592-rotation-supplement-drift:${asset.bodyId}`);
  const document = JSON.parse(bytes.toString("utf8"));
  const physical = new Map((document.phys_par ?? []).map((entry) => [entry.name, entry]));
  const poleText = String(physical.get("pole")?.value ?? "");
  const pole = poleText.split(/[,/]/).map((value) => Number(value.trim()));
  const periodHours = Number(physical.get("rot_per")?.value);
  if (pole.length !== 2 || pole.some((value) => !Number.isFinite(value)) || !Number.isFinite(periodHours) || periodHours <= 0) {
    throw new Error(`v592-rotation-supplement-parameters:${asset.bodyId}`);
  }
  smallBodyMetadata.set(asset.bodyId, {
    poleRaDeg: [pole[0], 0, 0],
    poleDecDeg: [pole[1], 0, 0],
    primeMeridianDeg: [0, 360 * 24 / periodHours, 0],
    periodHours,
    asset,
    poleReference: physical.get("pole")?.ref ?? null,
    periodReference: physical.get("rot_per")?.ref ?? null,
  });
}
const bodies = definitions.map(([bodyId, naifId]) => {
  const pckPoleRaDeg = parseCoefficients(pck, naifId, "POLE_RA");
  const pckPoleDecDeg = parseCoefficients(pck, naifId, "POLE_DEC");
  const pckPrimeMeridianDeg = parseCoefficients(pck, naifId, "PM");
  const pckAdmitted = Boolean(pckPoleRaDeg && pckPoleDecDeg && pckPrimeMeridianDeg);
  const supplement = smallBodyMetadata.get(bodyId);
  const poleRaDeg = pckPoleRaDeg ?? supplement?.poleRaDeg ?? null;
  const poleDecDeg = pckPoleDecDeg ?? supplement?.poleDecDeg ?? null;
  const primeMeridianDeg = pckPrimeMeridianDeg ?? supplement?.primeMeridianDeg ?? null;
  const kinematicAdmitted = Boolean(poleRaDeg && poleDecDeg && primeMeridianDeg);
  return {
    bodyId,
    naifId,
    status: pckAdmitted ? "rotation-admitted-iau-linear-reference" : "rotation-authority-incomplete",
    kinematicStatus: pckAdmitted
      ? "rotation-kinematics-admitted-iau-linear-reference"
      : kinematicAdmitted
        ? "rotation-kinematics-admitted-catalog-pole-native-model-meridian"
        : "rotation-kinematics-incomplete",
    absolutePrimeMeridian: pckAdmitted,
    poleRaDeg,
    poleDecDeg,
    primeMeridianDeg,
    coefficientPolicy: pckAdmitted
      ? "NAIF-PCK-linear-polynomial;periodic-nutation-libration-not-applied"
      : kinematicAdmitted
        ? "JPL-SBDB-catalog-pole-and-period;native-v591-model-x-axis-is-derived-W0-at-J2000;absolute-prime-meridian-not-claimed"
        : "no-prime-meridian-model-admitted",
    supplementalCatalog: supplement ? {
      path: supplement.asset.outputPath,
      sha256: supplement.asset.sha256,
      bytes: supplement.asset.bytes,
      sourceUrl: supplement.asset.url,
      poleReference: supplement.poleReference,
      periodReference: supplement.periodReference,
      periodHours: supplement.periodHours,
    } : null,
    referenceFrame: "J2000",
    textureLongitudeCalibration: "v591-readonly-asset-native-meridian;no-observation-claim",
    scientificPayloadWriteback: false,
  };
});
const admitted = bodies.filter((body) => body.status.startsWith("rotation-admitted"));
const incomplete = bodies.filter((body) => body.status === "rotation-authority-incomplete");
const kinematicAdmitted = bodies.filter((body) => body.kinematicStatus.startsWith("rotation-kinematics-admitted"));
const packet = writeSealed(outputPath, {
  version: "v592-celestial-rotation-reference-v1",
  generatedAt,
  status: incomplete.length === 0 ? "16-of-16-absolute-rotation-admitted" : `${admitted.length}-of-16-absolute-rotation-admitted-${kinematicAdmitted.length}-of-16-kinematics-admitted`,
  source: {
    path: pckPath,
    sha256: pckSha256,
    bytes: pckBytes.byteLength,
    origin: "NASA-JPL-NAIF-generic-kernels",
    originUrl: "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc",
    license: "NASA-JPL-public-domain",
    reusePolicy: "existing-local-exact-byte-reference;no-network-request",
  },
  model: {
    polePolynomialIndependentVariable: "Julian-centuries-from-J2000",
    primeMeridianPolynomialIndependentVariable: "days-from-J2000",
    absoluteTime: true,
    perFrameIntegration: false,
    periodicTermsApplied: false,
    sunDifferentialRotation: {
      status: "presentation-physics-model-pending-runtime-bridge",
      observationTextureClaim: false,
    },
  },
  bodies,
  admission: {
    admittedCount: admitted.length,
    absoluteAdmittedCount: admitted.length,
    kinematicAdmittedCount: kinematicAdmitted.length,
    requiredCount: 16,
    admittedBodies: admitted.map((body) => body.bodyId),
    incompleteBodies: incomplete.map((body) => body.bodyId),
    kinematicBodies: kinematicAdmitted.map((body) => body.bodyId),
  },
  authority: {
    scientificPayloadWriteback: false,
    scientificAuthorityChanged: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
  },
}, "packetSha256");

const generated = `// Generated by scripts/build-v592-rotation-packet.mjs. Do not edit.\n` +
  `export const CELESTIAL_ROTATION_PACKET_SHA256_V592 = ${JSON.stringify(packet.packetSha256)} as const;\n` +
  `export const CELESTIAL_ROTATION_SOURCE_SHA256_V592 = ${JSON.stringify(pckSha256)} as const;\n` +
  `export const CELESTIAL_ROTATION_SOURCE_PATH_V592 = ${JSON.stringify(pckPath)} as const;\n` +
  `export const CELESTIAL_ROTATION_MODELS_V592 = Object.freeze(${JSON.stringify(bodies, null, 2)} as const);\n`;
atomicWrite(generatedPath, generated);

const receipt = writeSealed(receiptPath, {
  version: "v592-rotation-reference-receipt-v1",
  generatedAt,
  status: packet.status,
  packetPath: "public/data/living-universe-v592/rotation-reference.json",
  packetSha256: packet.packetSha256,
  generatedModulePath: "app/data/celestialRotationV592.generated.ts",
  generatedModuleSha256: sha256(Buffer.from(generated, "utf8")),
  source: packet.source,
  admission: packet.admission,
  unresolvedGate: incomplete.length === 0 ? null : "missing-authoritative-absolute-prime-meridian;catalog-kinematics-use-disclosed-native-model-W0",
  authority: packet.authority,
}, "receiptSha256");

console.log(JSON.stringify({
  status: packet.status,
  admittedCount: admitted.length,
  kinematicAdmittedCount: kinematicAdmitted.length,
  incompleteBodies: packet.admission.incompleteBodies,
  packetSha256: packet.packetSha256,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
