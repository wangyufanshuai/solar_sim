import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-15T00:00:00Z";
const gaiaPath = "public/data/celestial-art-v589/gaia-lite-46000-v589.bin";
const outputPath = resolve(root, "public/data/living-universe-v592/stellar-heroes.json");
const generatedPath = resolve(root, "app/data/stellarHeroesV592.generated.ts");
const receiptPath = resolve(root, "docs/release/v592/stellar-hero-catalog-receipt-v592.json");
const expectedGaiaSha256 = "a312297456bac7190c7a347d281cea12681ad2bbc6c2458434fb882cf61aa802";

const stars = Object.freeze([
  ["sirius-a", "Sirius A", 101.287155, -16.716116, 2.637, -1.46, "A1V", 9_940, 25.4, 5.50, 1.00, ["sirius-b"]],
  ["canopus", "Canopus", 95.987958, -52.695661, 94.8, -0.74, "A9II", 7_350, 10_700, 130, 1.00, []],
  ["alpha-centauri-a", "Alpha Centauri A", 219.902058, -60.833993, 1.338, -0.01, "G2V", 5_790, 1.519, 28, 1.00, ["alpha-centauri-b", "proxima-centauri"]],
  ["alpha-centauri-b", "Alpha Centauri B", 219.900850, -60.835560, 1.338, 1.33, "K1V", 5_230, 0.500, 36, 1.00, ["alpha-centauri-a", "proxima-centauri"]],
  ["arcturus", "Arcturus", 213.915300, 19.182410, 11.26, -0.05, "K1.5III", 4_286, 170, 730, 1.00, []],
  ["vega", "Vega", 279.234735, 38.783689, 7.68, 0.03, "A0V", 9_602, 40.12, 0.678, 1.12, []],
  ["capella-a", "Capella A", 79.172327, 45.997991, 13.04, 0.08, "G8III", 4_970, 78.7, 104, 1.00, ["capella-b"]],
  ["rigel", "Rigel", 78.634467, -8.201639, 264, 0.13, "B8Ia", 12_100, 120_000, 25, 1.03, ["rigel-b"]],
  ["procyon-a", "Procyon A", 114.825493, 5.224993, 3.51, 0.34, "F5IV-V", 6_530, 6.93, 23, 1.00, ["procyon-b"]],
  ["betelgeuse", "Betelgeuse", 88.792939, 7.407064, 200, 0.42, "M1-2Ia-Iab", 3_500, 126_000, 12_950, 1.08, []],
  ["aldebaran", "Aldebaran", 68.980163, 16.509302, 20.01, 0.86, "K5III", 3_900, 439, 520, 1.00, []],
  ["antares", "Antares", 247.351915, -26.432002, 170, 1.06, "M1.5Iab-Ib", 3_660, 75_900, 2_080, 1.07, ["antares-b"]],
  ["achernar", "Achernar", 24.428523, -57.236753, 42.8, 0.46, "B6Vep", 15_000, 3_150, 2.04, 1.35, []],
  ["hadar", "Hadar", 210.955856, -60.373039, 120, 0.61, "B1III", 25_000, 41_700, 2.63, 1.06, ["hadar-b"]],
  ["altair", "Altair", 297.695827, 8.868322, 5.13, 0.77, "A7V", 7_550, 10.6, 0.367, 1.14, []],
  ["acrux", "Acrux A", 186.649563, -63.099093, 98.0, 0.76, "B0.5IV", 28_000, 25_000, 3.0, 1.04, ["acrux-b"]],
  ["spica", "Spica A", 201.298247, -11.161322, 77.1, 0.97, "B1III-IV", 25_300, 20_500, 4.0145, 1.08, ["spica-b"]],
  ["pollux", "Pollux", 116.328958, 28.026183, 10.36, 1.14, "K0III", 4_666, 43.0, 135, 1.00, []],
  ["fomalhaut", "Fomalhaut", 344.412750, -29.622236, 7.70, 1.16, "A3V", 8_590, 16.63, 1.0, 1.04, []],
  ["deneb", "Deneb", 310.357979, 45.280338, 802, 1.25, "A2Ia", 8_525, 196_000, 12, 1.03, []],
  ["regulus", "Regulus A", 152.092962, 11.967209, 24.3, 1.35, "B8IVn", 12_460, 347, 0.65, 1.32, ["regulus-b"]],
  ["polaris", "Polaris Aa", 37.954561, 89.264109, 133, 1.98, "F7Ib", 6_015, 1_260, 119, 1.00, ["polaris-ab", "polaris-b"]],
  ["bellatrix", "Bellatrix", 81.282764, 6.349703, 77, 1.64, "B2III", 22_000, 6_400, 2.0, 1.05, []],
  ["alnilam", "Alnilam", 84.053389, -1.201917, 606, 1.69, "B0Ia", 27_500, 537_000, 4.3, 1.04, []],
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
function decodeGaia(buffer) {
  if (buffer.byteLength !== 46_000 * 24) throw new Error(`v592-stellar-gaia-bytes:${buffer.byteLength}`);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const records = [];
  for (let offset = 0; offset < buffer.byteLength; offset += 24) {
    const color = view.getInt16(offset + 18, true);
    records.push({
      sourceId: view.getBigUint64(offset, true).toString(),
      raDeg: view.getUint32(offset + 8, true) / 0x1_0000_0000 * 360,
      decDeg: view.getUint32(offset + 12, true) / 0xffff_ffff * 180 - 90,
      magG: view.getUint16(offset + 16, true) / 1_000 - 5,
      colorBpRp: color === -0x8000 ? null : color / 1_000,
    });
  }
  return records;
}
function angularDistanceDeg(leftRa, leftDec, rightRa, rightDec) {
  const radians = Math.PI / 180;
  const leftDecRad = leftDec * radians;
  const rightDecRad = rightDec * radians;
  const deltaRa = (leftRa - rightRa) * radians;
  return Math.acos(Math.max(-1, Math.min(1, Math.sin(leftDecRad) * Math.sin(rightDecRad) + Math.cos(leftDecRad) * Math.cos(rightDecRad) * Math.cos(deltaRa)))) / radians;
}
function deriveRadiusSolar(temperatureK, luminositySolar) {
  return Math.sqrt(luminositySolar) / (temperatureK / 5_772) ** 2;
}
function shaderProfile(spectralType) {
  if (spectralType.startsWith("M")) return "cool-convective-supergranulation";
  if (spectralType.startsWith("K") || spectralType.startsWith("G")) return "solar-convective-granulation";
  if (spectralType.startsWith("F")) return "warm-radiative-convective";
  if (spectralType.startsWith("A")) return "hot-radiative-photosphere";
  return "blue-hot-radiative-wind";
}

const gaiaBytes = readFileSync(resolve(root, gaiaPath));
if (sha256(gaiaBytes) !== expectedGaiaSha256) throw new Error("v592-stellar-gaia-sha");
const gaia = decodeGaia(gaiaBytes);
const used = new Set();
const heroes = stars.map(([id, name, raDeg, decDeg, distancePc, magV, spectralType, temperatureK, luminositySolar, rotationPeriodDays, equatorialPolarRadiusRatio, companions]) => {
  const nearest = gaia
    .map((record) => ({ record, distance: angularDistanceDeg(record.raDeg, record.decDeg, raDeg, decDeg) }))
    .sort((left, right) => left.distance - right.distance || Number(left.record.sourceId < right.record.sourceId ? -1 : 1))
    .find((candidate) => !used.has(candidate.record.sourceId));
  if (!nearest || nearest.distance > 1.5) throw new Error(`v592-stellar-gaia-anchor:${id}:${nearest?.distance}`);
  used.add(nearest.record.sourceId);
  const crossmatchStatus = nearest.distance <= 0.02 ? "gaia-positional-crossmatch" : "gaia-render-anchor-only-not-identity-claim";
  return {
    id,
    name,
    gaiaSourceId: nearest.record.sourceId,
    gaiaCrossmatchStatus: crossmatchStatus,
    gaiaAnchorAngularDistanceDeg: nearest.distance,
    raDeg,
    decDeg,
    parallaxMas: 1_000 / distancePc,
    distancePc,
    apparentMagnitudeV: magV,
    gaiaAnchorMagnitudeG: nearest.record.magG,
    colorBpRp: nearest.record.colorBpRp,
    spectralType,
    temperatureK,
    radiusSolar: deriveRadiusSolar(temperatureK, luminositySolar),
    luminositySolar,
    rotationPeriodDays,
    equatorialPolarRadiusRatio,
    companions,
    shaderProfile: shaderProfile(spectralType),
    coronaModel: spectralType.startsWith("M") || spectralType.startsWith("K") || spectralType.startsWith("G") ? "magnetically-bounded-corona" : "radiative-wind-corona",
    authority: {
      gaiaAnchor: "catalog",
      raDec: "catalog-curated-j2000",
      parallax: "derived-from-curated-distance",
      distance: "catalog-curated-local-v22",
      spectralType: "catalog-curated-local-v22",
      temperature: "estimated-literature-consensus-v592",
      luminosity: "estimated-literature-consensus-v592",
      radius: "derived-stefan-boltzmann",
      rotationPeriod: "estimated-literature-consensus-v592",
      photosphere: "physics-generated-presentation-model-not-observation-texture",
    },
    presentationOnly: true,
    scientificPayloadWriteback: false,
  };
});
const packet = writeSealed(outputPath, {
  version: "v592-stellar-hero-catalog-v1",
  generatedAt,
  status: "24-of-24-catalog-packets-generated-runtime-visual-gate-pending",
  source: {
    gaiaLitePath: gaiaPath,
    gaiaLiteSha256: expectedGaiaSha256,
    gaiaLiteBytes: gaiaBytes.byteLength,
    gaiaCatalogVersion: "gaia-lite-46000-v589-readonly-v590",
    curatedParameterBaseline: "app/data/nearbyStars.ts-readonly-plus-explicit-v592-estimates",
  },
  policy: {
    remotePsfRemainsPointLike: true,
    closeupUsesPhysicsShader: true,
    noObservationSurfaceTextureClaim: true,
    noRandomTwinkle: true,
    sourceIdDoesNotChangeBrightnessClass: true,
    explicitAuthorityPerParameter: true,
  },
  heroes,
  admission: {
    catalogPacketCount: heroes.length,
    runtimeVisualAdmissionCount: 0,
    maximumGaiaAnchorDistanceDeg: Math.max(...heroes.map((hero) => hero.gaiaAnchorAngularDistanceDeg)),
    positionalCrossmatchCount: heroes.filter((hero) => hero.gaiaCrossmatchStatus === "gaia-positional-crossmatch").length,
    renderAnchorOnlyCount: heroes.filter((hero) => hero.gaiaCrossmatchStatus !== "gaia-positional-crossmatch").length,
  },
  authority: {
    scientificPayloadWriteback: false,
    scientificAuthorityChanged: false,
    measuredAuthorityGranted: false,
    observationTextureClaim: false,
  },
}, "packetSha256");

const generated = `// Generated by scripts/build-v592-stellar-hero-catalog.mjs. Do not edit.\n` +
  `export const STELLAR_HERO_PACKET_SHA256_V592 = ${JSON.stringify(packet.packetSha256)} as const;\n` +
  `export const STELLAR_HEROES_V592 = Object.freeze(${JSON.stringify(heroes, null, 2)} as const);\n`;
atomicWrite(generatedPath, generated);
const receipt = writeSealed(receiptPath, {
  version: "v592-stellar-hero-catalog-receipt-v1",
  generatedAt,
  status: packet.status,
  packetPath: "public/data/living-universe-v592/stellar-heroes.json",
  packetSha256: packet.packetSha256,
  generatedModulePath: "app/data/stellarHeroesV592.generated.ts",
  generatedModuleSha256: sha256(Buffer.from(generated, "utf8")),
  source: packet.source,
  admission: packet.admission,
  authority: packet.authority,
}, "receiptSha256");

console.log(JSON.stringify({
  status: packet.status,
  heroCount: heroes.length,
  maximumGaiaAnchorDistanceDeg: packet.admission.maximumGaiaAnchorDistanceDeg,
  positionalCrossmatchCount: packet.admission.positionalCrossmatchCount,
  renderAnchorOnlyCount: packet.admission.renderAnchorOnlyCount,
  packetSha256: packet.packetSha256,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
