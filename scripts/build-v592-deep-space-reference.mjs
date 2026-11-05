import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { gunzipSync } from "node:zlib";

const root = process.cwd();
const generatedAt = "2026-08-19T00:00:00Z";
const definitionsPath = "scripts/v592-deep-space-reference-definitions.json";
const openNgcManifestPath = "public/data/openngc-v260/manifest.json";
const openNgcDataPath = "public/data/openngc-v260/openngc-v260.json.gz";
const openNgcLicensePath = "public/data/openngc-v260/CC-BY-SA-4.0.txt";
const galaxyDistanceSourcePath = "app/data/brightGalaxyCatalog.ts";
const clusterDistanceSourcePath = "app/data/starClusterCatalog.ts";
const outputPath = "public/data/living-universe-v592/deep-space-reference.json";
const receiptPath = "docs/release/v592/deep-space-reference-receipt-v592.json";
const generatedPath = "app/data/deepSpaceReferenceV592.generated.ts";

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
function atomicWrite(relativePath, text) {
  const path = resolve(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, text);
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function writeSealed(relativePath, unsigned, field) {
  const sealed = { ...unsigned, [field]: canonicalSha(unsigned) };
  atomicWrite(relativePath, `${JSON.stringify(sealed, null, 2)}\n`);
  return sealed;
}
function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
}
function verifySealed(relativePath) {
  const document = readJson(relativePath);
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-deep-space-reference-input-seal:${relativePath}`);
  return document;
}
function fileRecord(path) {
  const bytes = readFileSync(resolve(root, path));
  return { path, bytes: bytes.byteLength, sha256: sha256(bytes) };
}
function vectorFromRaDec(raDeg, decDeg) {
  const ra = raDeg * Math.PI / 180;
  const dec = decDeg * Math.PI / 180;
  const cosDec = Math.cos(dec);
  return [cosDec * Math.cos(ra), Math.sin(dec), cosDec * Math.sin(ra)];
}
function raDecFromVector(vector) {
  const length = Math.hypot(...vector);
  const x = vector[0] / length;
  const y = vector[1] / length;
  const z = vector[2] / length;
  return {
    raDeg: (Math.atan2(z, x) * 180 / Math.PI + 360) % 360,
    decDeg: Math.asin(y) * 180 / Math.PI,
  };
}
function galacticToIcrs(lDeg, bDeg) {
  const l = lDeg * Math.PI / 180;
  const b = bDeg * Math.PI / 180;
  const galactic = [Math.cos(b) * Math.cos(l), Math.cos(b) * Math.sin(l), Math.sin(b)];
  const xEq = -0.0548755604 * galactic[0] + 0.4941094279 * galactic[1] - 0.8676661490 * galactic[2];
  const yEq = -0.8734370902 * galactic[0] - 0.4448296300 * galactic[1] - 0.1980763734 * galactic[2];
  const zEq = -0.4838350155 * galactic[0] + 0.7469822445 * galactic[1] + 0.4559837762 * galactic[2];
  return raDecFromVector([xEq, zEq, yEq]);
}
function matchesIdentity(candidate, groups) {
  const text = `${candidate.title ?? ""} ${candidate.description ?? ""} ${(candidate.keywords ?? []).join(" ")}`.toLowerCase();
  return groups.every((group) => group.some((term) => text.includes(term.toLowerCase())));
}

const definitionsBytes = readFileSync(resolve(root, definitionsPath));
const definitions = JSON.parse(definitionsBytes.toString("utf8"));
const openNgcManifestBytes = readFileSync(resolve(root, openNgcManifestPath));
const openNgcManifest = JSON.parse(openNgcManifestBytes.toString("utf8"));
const openNgcBytes = readFileSync(resolve(root, openNgcDataPath));
const openNgcLicenseBytes = readFileSync(resolve(root, openNgcLicensePath));
const openNgcRows = JSON.parse(gunzipSync(openNgcBytes).toString("utf8"));
const openNgcById = new Map(openNgcRows.map((row) => [row.id, row]));
assert(definitions.version === "v592-deep-space-reference-definitions-v1", "v592-deep-space-reference-definitions-version");
assert(definitions.objects.length === 24, "v592-deep-space-reference-count");
assert(new Set(definitions.objects.map((entry) => entry.id)).size === 24, "v592-deep-space-reference-unique-id");
assert(definitions.objects.filter((entry) => entry.category === "galaxy").length === 12, "v592-deep-space-reference-galaxy-count");
assert(definitions.objects.filter((entry) => entry.category === "cluster").length === 12, "v592-deep-space-reference-cluster-count");
assert(openNgcManifest.output.path === "data/openngc-v260/openngc-v260.json.gz", "v592-deep-space-reference-openngc-path");
assert(openNgcBytes.byteLength === openNgcManifest.output.bytes && sha256(openNgcBytes) === openNgcManifest.output.sha256, "v592-deep-space-reference-openngc-data");
assert(sha256(openNgcLicenseBytes) === openNgcManifest.license.sha256, "v592-deep-space-reference-openngc-license");

const metadataFiles = new Map();
const objects = definitions.objects.map((definition) => {
  const rows = (definition.openNgcIds ?? []).map((id) => {
    const row = openNgcById.get(id);
    assert(row, `v592-deep-space-reference-openngc-id:${definition.id}:${id}`);
    return row;
  });
  let coordinate;
  let coordinateDerivation;
  if (rows.length > 0) {
    const mean = rows.map((row) => vectorFromRaDec(row.raDeg, row.decDeg)).reduce((sum, value) => [sum[0] + value[0], sum[1] + value[1], sum[2] + value[2]], [0, 0, 0]);
    coordinate = raDecFromVector(mean);
    coordinateDerivation = rows.length === 1 ? "openngc-direct-icrs-j2000" : "openngc-spherical-mean-icrs-j2000";
  } else {
    assert(Array.isArray(definition.galacticCenterDeg) && definition.galacticCenterDeg.length === 2, `v592-deep-space-reference-coordinate:${definition.id}`);
    coordinate = galacticToIcrs(definition.galacticCenterDeg[0], definition.galacticCenterDeg[1]);
    coordinateDerivation = "iau-galactic-to-icrs-j2000-transform-of-inherited-center";
  }
  const angularSizeArcmin = definition.angularSizeArcmin
    ?? (rows.length === 1 ? rows[0].majorAxisArcmin : Math.max(...rows.map((row) => row.majorAxisArcmin ?? 0)) * 2.05);
  const minorAxisArcmin = definition.category === "galaxy"
    ? rows[0].minorAxisArcmin ?? angularSizeArcmin
    : angularSizeArcmin;
  const positionAngleDeg = definition.category === "galaxy" ? rows[0].positionAngleDeg : null;
  assert(Number.isFinite(coordinate.raDeg) && coordinate.raDeg >= 0 && coordinate.raDeg < 360, `v592-deep-space-reference-ra:${definition.id}`);
  assert(Number.isFinite(coordinate.decDeg) && coordinate.decDeg >= -90 && coordinate.decDeg <= 90, `v592-deep-space-reference-dec:${definition.id}`);
  assert(Number.isFinite(angularSizeArcmin) && angularSizeArcmin > 0, `v592-deep-space-reference-angular-size:${definition.id}`);
  assert(Number.isFinite(definition.distancePc) && definition.distancePc > 0, `v592-deep-space-reference-distance:${definition.id}`);

  const probes = definition.visualProbePaths.map((filename) => {
    const path = `docs/release/v592/metadata-probe-deep-space/${filename}`;
    const receipt = verifySealed(path);
    assert(receipt.target === definition.id || definition.id === "sunflower-galaxy" && receipt.target === "whirlpool-galaxy", `v592-deep-space-reference-probe-target:${definition.id}:${filename}`);
    assert(receipt.policy.requestCount === 1 && receipt.policy.automaticRetryPerformed === false && receipt.policy.automaticReplacementPerformed === false && receipt.policy.payloadDownloaded === false, `v592-deep-space-reference-probe-policy:${definition.id}:${filename}`);
    assert(receipt.scientificPayloadWriteback === false, `v592-deep-space-reference-probe-writeback:${definition.id}:${filename}`);
    metadataFiles.set(path, fileRecord(path));
    return receipt;
  });
  const matchingCandidates = probes.flatMap((receipt) => receipt.candidates)
    .filter((candidate, index, values) => matchesIdentity(candidate, definition.visualIdentityTermGroups)
      && values.findIndex((entry) => entry.nasaId === candidate.nasaId) === index);
  return Object.freeze({
    id: definition.id,
    category: definition.category,
    clusterKind: definition.clusterKind ?? null,
    catalogName: definition.catalogName,
    commonName: definition.commonName,
    labelZh: definition.labelZh,
    coordinateFrame: "ICRS/J2000",
    raDeg: Number(coordinate.raDeg.toFixed(9)),
    decDeg: Number(coordinate.decDeg.toFixed(9)),
    angularSize: {
      majorArcmin: Number(angularSizeArcmin.toFixed(6)),
      minorArcmin: Number(minorAxisArcmin.toFixed(6)),
      positionAngleDeg: positionAngleDeg === null || positionAngleDeg === undefined ? null : Number(positionAngleDeg.toFixed(6)),
      orientationPolicy: definition.category === "galaxy" ? "openngc-east-of-north" : "radial-or-not-published-not-fabricated",
    },
    distancePc: definition.distancePc,
    distanceAuthority: definitions.distancePolicy,
    coordinateDerivation,
    openNgcIds: definition.openNgcIds ?? [],
    inheritedDistanceSource: {
      path: definition.category === "galaxy" ? galaxyDistanceSourcePath : clusterDistanceSourcePath,
      id: definition.distanceSourceId,
    },
    visualMetadata: {
      status: matchingCandidates.length > 0 ? "candidate-present-payload-not-acquired" : "blocked-no-identity-matched-nasa-library-candidate",
      candidateCount: matchingCandidates.length,
      candidateNasaIds: matchingCandidates.map((candidate) => candidate.nasaId),
      probeReceiptSha256: probes.map((receipt) => receipt.receiptSha256),
      payloadDownloaded: false,
      visualAssetAdmitted: false,
    },
    presentationOnly: true,
    scientificAuthority: false,
    scientificPayloadWriteback: false,
  });
});

const galaxyCount = objects.filter((entry) => entry.category === "galaxy").length;
const clusterCount = objects.filter((entry) => entry.category === "cluster").length;
const visualMetadataCandidateCount = objects.filter((entry) => entry.visualMetadata.candidateCount > 0).length;
const blockedVisualMetadataIds = objects.filter((entry) => entry.visualMetadata.candidateCount === 0).map((entry) => entry.id);
const pleiades = objects.find((entry) => entry.id === "pleiades");
const hyades = objects.find((entry) => entry.id === "hyades");
assert(pleiades.raDeg > 50 && pleiades.raDeg < 65 && pleiades.decDeg > 18 && pleiades.decDeg < 30, "v592-deep-space-reference-pleiades-transform");
assert(hyades.raDeg > 60 && hyades.raDeg < 75 && hyades.decDeg > 10 && hyades.decDeg < 22, "v592-deep-space-reference-hyades-transform");
const packet = writeSealed(outputPath, {
  version: "v592-deep-space-reference-v1",
  generatedAt,
  status: "reference-24-of-24-visual-metadata-partial",
  coordinateFrame: "ICRS/J2000",
  policy: {
    catalogReferenceOnly: true,
    fixedCelestialDirections: true,
    scienceModePolicy: "catalog-marker-and-source-backed-footprint-only",
    cinematicModePolicy: "presentation-model-or-admitted-imagery-only",
    observationImageClaimRequiresAssetAdmission: true,
    automaticRetryAllowed: false,
    automaticReplacementAllowed: false,
    payloadDownloadPerformed: false,
    scientificPayloadWriteback: false,
  },
  sources: {
    openNgc: {
      manifestPath: openNgcManifestPath,
      manifestSha256: sha256(openNgcManifestBytes),
      dataPath: openNgcDataPath,
      dataBytes: openNgcBytes.byteLength,
      dataSha256: sha256(openNgcBytes),
      licensePath: openNgcLicensePath,
      licenseSha256: sha256(openNgcLicenseBytes),
      license: openNgcManifest.license.id,
      sourceUrl: openNgcManifest.sourceUrl,
    },
    inheritedDistances: {
      galaxies: fileRecord(galaxyDistanceSourcePath),
      clusters: fileRecord(clusterDistanceSourcePath),
      authority: definitions.distancePolicy,
    },
  },
  admission: {
    requiredGalaxyCount: 12,
    admittedGalaxyReferenceCount: galaxyCount,
    requiredClusterCount: 12,
    admittedClusterReferenceCount: clusterCount,
    visualMetadataCandidateCount,
    visualMetadataBlockedCount: blockedVisualMetadataIds.length,
    blockedVisualMetadataIds,
    visualAssetAdmittedCount: 0,
  },
  objects,
}, "packetSha256");

const sourceFiles = [
  { path: definitionsPath, bytes: definitionsBytes.byteLength, sha256: sha256(definitionsBytes) },
  fileRecord("scripts/v592-deep-space-metadata-probes.json"),
  fileRecord("scripts/probe-v592-deep-space-metadata.mjs"),
  fileRecord("scripts/build-v592-deep-space-reference.mjs"),
  fileRecord(openNgcManifestPath),
  fileRecord(openNgcDataPath),
  fileRecord(openNgcLicensePath),
  fileRecord(galaxyDistanceSourcePath),
  fileRecord(clusterDistanceSourcePath),
  ...[...metadataFiles.values()].sort((left, right) => left.path.localeCompare(right.path)),
];
const receipt = writeSealed(receiptPath, {
  version: "v592-deep-space-reference-receipt-v1",
  generatedAt,
  status: "admitted-12-galaxy-and-12-cluster-reference-packets",
  packetPath: outputPath,
  packetBytes: readFileSync(resolve(root, outputPath)).byteLength,
  packetSha256: packet.packetSha256,
  admission: packet.admission,
  coordinateFrame: packet.coordinateFrame,
  sourceFiles,
  scientificPayloadWriteback: false,
}, "receiptSha256");

const generated = `// Generated by scripts/build-v592-deep-space-reference.mjs.\n`
  + `export const DEEP_SPACE_REFERENCE_PACKET_SHA256_V592 = ${JSON.stringify(packet.packetSha256)} as const;\n`
  + `export const DEEP_SPACE_REFERENCE_RECEIPT_SHA256_V592 = ${JSON.stringify(receipt.receiptSha256)} as const;\n`
  + `export const DEEP_SPACE_REFERENCE_OBJECTS_V592 = ${JSON.stringify(objects)} as const;\n`;
atomicWrite(generatedPath, generated);

console.log(JSON.stringify({
  status: receipt.status,
  packetSha256: packet.packetSha256,
  receiptSha256: receipt.receiptSha256,
  galaxyReferences: `${galaxyCount}/12`,
  clusterReferences: `${clusterCount}/12`,
  visualMetadataCandidates: `${visualMetadataCandidateCount}/24`,
  blockedVisualMetadataIds,
}, null, 2));
