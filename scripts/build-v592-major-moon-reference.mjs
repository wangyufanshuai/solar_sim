import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-15T00:00:00Z";
const pckPath = "tools/science-cache/naif-v201/pck00011.tpc";
const horizonsPath = "public/data/horizons_reference.json";
const packetPath = resolve(root, "public/data/living-universe-v592/major-moons-reference.json");
const receiptPath = resolve(root, "docs/release/v592/major-moons-reference-receipt-v592.json");
const generatedPath = resolve(root, "app/data/majorMoonsV592.generated.ts");

const definitions = Object.freeze([
  { bodyId: "io", name: "Io", naifId: 501, parentBodyId: "jupiter" },
  { bodyId: "europa", name: "Europa", naifId: 502, parentBodyId: "jupiter" },
  { bodyId: "ganymede", name: "Ganymede", naifId: 503, parentBodyId: "jupiter" },
  { bodyId: "callisto", name: "Callisto", naifId: 504, parentBodyId: "jupiter" },
  { bodyId: "titan", name: "Titan", naifId: 606, parentBodyId: "saturn" },
  { bodyId: "enceladus", name: "Enceladus", naifId: 602, parentBodyId: "saturn" },
  { bodyId: "rhea", name: "Rhea", naifId: 605, parentBodyId: "saturn" },
  { bodyId: "iapetus", name: "Iapetus", naifId: 608, parentBodyId: "saturn" },
  { bodyId: "triton", name: "Triton", naifId: 801, parentBodyId: "neptune" },
  { bodyId: "miranda", name: "Miranda", naifId: 705, parentBodyId: "uranus" },
  { bodyId: "titania", name: "Titania", naifId: 703, parentBodyId: "uranus" },
  { bodyId: "charon", name: "Charon", naifId: 901, parentBodyId: "pluto" },
]);

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
function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, text);
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function writeSealed(path, unsigned, field) {
  const sealed = { ...unsigned, [field]: canonicalSha(unsigned) };
  atomicWrite(path, `${JSON.stringify(sealed, null, 2)}\n`);
  return sealed;
}
function parseCoefficients(text, naifId, field) {
  const match = text.match(new RegExp(`BODY${naifId}_${field}\\s*=\\s*\\(([^)]*)\\)`, "i"));
  assert(match, `v592-major-moon-pck-missing:${naifId}:${field}`);
  const values = match[1]
    .replaceAll(/D([+-]?\d+)/gi, "E$1")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(Number);
  assert(values.length >= 3 && values.every(Number.isFinite), `v592-major-moon-pck-values:${naifId}:${field}`);
  return values.slice(0, 3);
}

const pckBytes = readFileSync(resolve(root, pckPath));
const horizonsBytes = readFileSync(resolve(root, horizonsPath));
const pckSha256 = sha256(pckBytes);
const horizonsSha256 = sha256(horizonsBytes);
assert(pckSha256 === "3dff7b1dbeceaa01f25467767d3fa25816051c85d162d1edf04acb310ee28bb1", "v592-major-moon-pck-drift");
assert(horizonsSha256 === "680efb2b7800216d450f4f3adeb96bcfa171bc0fb73b800785c4e83f77aceb64", "v592-major-moon-horizons-drift");
const pck = pckBytes.toString("utf8");
const horizons = JSON.parse(horizonsBytes.toString("utf8"));
assert(horizons.epochJdTdb === 2_451_545 && horizons.source === "JPL Horizons via astroquery", "v592-major-moon-horizons-identity");
const horizonsById = new Map(horizons.bodies.map((body) => [body.id, body]));

const moons = definitions.map((definition) => {
  const orbit = horizonsById.get(definition.bodyId);
  assert(orbit, `v592-major-moon-horizons-body:${definition.bodyId}`);
  const poleRaDeg = parseCoefficients(pck, definition.naifId, "POLE_RA");
  const poleDecDeg = parseCoefficients(pck, definition.naifId, "POLE_DEC");
  const primeMeridianDeg = parseCoefficients(pck, definition.naifId, "PM");
  return {
    ...definition,
    rotation: {
      status: "rotation-admitted-iau-linear-reference",
      absolutePrimeMeridian: true,
      poleRaDeg,
      poleDecDeg,
      primeMeridianDeg,
      signedRotationDegPerDay: primeMeridianDeg[1],
      siderealRotationPeriodDays: 360 / Math.abs(primeMeridianDeg[1]),
      direction: primeMeridianDeg[1] < 0 ? "retrograde" : "prograde",
      referenceFrame: "J2000",
      periodicTermsApplied: false,
    },
    orbitStateAtJ2000: {
      epochJdTdb: horizons.epochJdTdb,
      origin: horizons.origin,
      referencePlane: horizons.refplane,
      aberrations: horizons.aberrations,
      positionAu: [orbit.x_au, orbit.y_au, orbit.z_au],
      velocityAuPerDay: [orbit.vx_au_d, orbit.vy_au_d, orbit.vz_au_d],
      parentBodyId: definition.parentBodyId,
      relationshipStatus: "existing-horizons-state-and-parent-identity-admitted",
    },
    visualAsset: {
      status: "asset-blocked",
      reason: "no-v592-public-domain-or-cc0-observation-asset-admitted",
      proceduralFallbackAllowed: false,
      coloredPlaceholderAllowed: false,
      requiredBeforeHeroAdmission: ["global-albedo-or-registered-3d-model", "license", "source-sha", "derived-sha"],
    },
    presentationModels: {
      ioVolcanism: definition.bodyId === "io" ? "blocked-until-sourced-or-explicit-presentation-model" : "not-applicable",
      titanAtmosphere: definition.bodyId === "titan" ? "blocked-until-sourced-or-explicit-presentation-model" : "not-applicable",
      enceladusPlume: definition.bodyId === "enceladus" ? "blocked-until-sourced-or-explicit-presentation-model" : "not-applicable",
    },
    scientificPayloadWriteback: false,
  };
});

const packet = writeSealed(packetPath, {
  version: "v592-major-moon-reference-v1",
  generatedAt,
  status: "12-of-12-motion-reference-admitted-0-of-12-visual-assets-admitted",
  sources: {
    rotation: {
      path: pckPath,
      bytes: pckBytes.byteLength,
      sha256: pckSha256,
      origin: "NASA-JPL-NAIF-generic-kernels",
      license: "NASA-JPL-public-domain",
    },
    orbit: {
      path: horizonsPath,
      bytes: horizonsBytes.byteLength,
      sha256: horizonsSha256,
      origin: horizons.source,
      epochJdTdb: horizons.epochJdTdb,
      reusePolicy: "existing-readonly-current-worktree-reference-no-network-request",
    },
  },
  policy: {
    motionReferenceIsScientificInput: true,
    visualAssetAdmissionIndependent: true,
    missingVisualAssetBehavior: "asset-blocked",
    proceduralFallbackAllowed: false,
    coloredPlaceholderAllowed: false,
    presentationOnlyEffectsWritebackAllowed: false,
  },
  moons,
  admission: {
    requiredCount: definitions.length,
    motionReferenceAdmittedCount: moons.filter((moon) => moon.rotation.status === "rotation-admitted-iau-linear-reference").length,
    orbitReferenceAdmittedCount: moons.filter((moon) => moon.orbitStateAtJ2000.relationshipStatus.endsWith("admitted")).length,
    visualAssetAdmittedCount: moons.filter((moon) => moon.visualAsset.status === "asset-admitted").length,
    heroAdmittedCount: 0,
    assetBlockedBodies: moons.filter((moon) => moon.visualAsset.status === "asset-blocked").map((moon) => moon.bodyId),
  },
  authority: {
    scientificPayloadWriteback: false,
    scientificAuthorityChanged: false,
    measuredAuthorityGranted: false,
    productionPromotionAllowed: false,
  },
}, "packetSha256");

const generated = `// Generated by scripts/build-v592-major-moon-reference.mjs. Do not edit.\n` +
  `export const MAJOR_MOON_PACKET_SHA256_V592 = ${JSON.stringify(packet.packetSha256)} as const;\n` +
  `export const MAJOR_MOON_MOTION_REFERENCE_COUNT_V592 = ${packet.admission.motionReferenceAdmittedCount} as const;\n` +
  `export const MAJOR_MOON_VISUAL_ASSET_ADMISSION_COUNT_V592 = ${packet.admission.visualAssetAdmittedCount} as const;\n` +
  `export const MAJOR_MOON_MODELS_V592 = Object.freeze(${JSON.stringify(moons, null, 2)} as const);\n`;
atomicWrite(generatedPath, generated);

const receipt = writeSealed(receiptPath, {
  version: "v592-major-moon-reference-receipt-v1",
  generatedAt,
  status: packet.status,
  packetPath: "public/data/living-universe-v592/major-moons-reference.json",
  packetSha256: packet.packetSha256,
  generatedModulePath: "app/data/majorMoonsV592.generated.ts",
  generatedModuleSha256: sha256(Buffer.from(generated, "utf8")),
  sourceSha256: {
    rotation: pckSha256,
    orbit: horizonsSha256,
  },
  admission: packet.admission,
  blockedGate: "12-public-domain-or-cc0-visual-assets-not-yet-admitted",
  networkRequested: false,
  scientificPayloadWriteback: false,
}, "receiptSha256");

console.log(JSON.stringify({
  status: packet.status,
  motionReferenceAdmission: `${packet.admission.motionReferenceAdmittedCount}/12`,
  orbitReferenceAdmission: `${packet.admission.orbitReferenceAdmittedCount}/12`,
  visualAssetAdmission: `${packet.admission.visualAssetAdmittedCount}/12`,
  packetSha256: packet.packetSha256,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
