import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const frozenPath = "public/data/celestial-art-v589/constellation-gaia-bindings-v589.json";
const packetPath = "public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json";
const generatedConstantsPath = "app/data/celestialConstellationsV591.generated.ts";
const fontSourcePath = "node_modules/@fontsource/ibm-plex-sans-condensed/files/ibm-plex-sans-condensed-latin-500-normal.woff2";
const fontRuntimePath = "public/fonts/candidate-v591/ibm-plex-sans-condensed-latin-500.woff2";
const fontLicenseSourcePath = "node_modules/@fontsource/ibm-plex-sans-condensed/LICENSE";
const fontLicenseRuntimePath = "public/fonts/candidate-v591/OFL-1.1.txt";
const labelAtlasMetadataPath = "public/data/celestial-convergence-v591/constellation-label-atlas-v591.json";
const expectedFrozenBytes = 145_613;
const expectedFrozenFileSha256 = "6c5aefed75d78f566fa598a2fe15bad5482af41f7a600d055c1554544012f5f5";
const expectedBindingSha256 = "5d5faefe782b221729084dc9796969579515151afab8c1ed377f0cbf718937a8";
const expectedFontBytes = 19_952;
const expectedFontSha256 = "e3b4fd97fd20bc70fda66d8d5f0745d8d6958068a024cb4724bbc1ffb6cbc183";
const expectedFontLicenseBytes = 4_314;
const expectedFontLicenseSha256 = "18aabf190848725e2576eefb5c29ba06aac1029d02132252a7f312eac2e50cf3";

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
  const temporary = `${path}.part`;
  writeFileSync(temporary, text);
  rmSync(path, { force: true });
  renameSync(temporary, path);
}
function atomicCopy(source, destination) {
  mkdirSync(dirname(destination), { recursive: true });
  const temporary = `${destination}.part`;
  copyFileSync(source, temporary);
  rmSync(destination, { force: true });
  renameSync(temporary, destination);
}

const frozenBytes = readFileSync(resolve(root, frozenPath));
assert(frozenBytes.byteLength === expectedFrozenBytes, "v591-constellation-frozen-bytes");
assert(sha256(frozenBytes) === expectedFrozenFileSha256, "v591-constellation-frozen-file-sha");
const frozen = JSON.parse(frozenBytes.toString("utf8"));
const frozenUnsigned = { ...frozen };
delete frozenUnsigned.bindingSha256;
assert(frozen.version === "v589-constellation-gaia-binding-v1", "v591-constellation-frozen-version");
assert(frozen.bindingSha256 === expectedBindingSha256, "v591-constellation-frozen-binding-sha");
assert(canonicalSha(frozenUnsigned) === expectedBindingSha256, "v591-constellation-frozen-canonical-sha");
assert(frozen.constellationCount === 88 && frozen.bindings?.length === 88, "v591-constellation-count");
assert(frozen.waypointCount === 484, "v591-constellation-waypoint-count");
assert(frozen.thresholdDeg === 1.5, "v591-constellation-threshold");
assert(frozen.maximumAngularDistanceDeg === 1.4008261815085659, "v591-constellation-maximum-error");
assert(frozen.medianAngularDistanceDeg === 0.4760630074038235, "v591-constellation-median-error");

const codes = new Set();
const sourceIds = new Set();
let waypointCount = 0;
let observedMaximum = 0;
for (const binding of frozen.bindings) {
  assert(typeof binding.iauCode === "string" && binding.iauCode.length >= 3, "v591-constellation-iau-code");
  assert(!codes.has(binding.iauCode), "v591-constellation-duplicate-code");
  codes.add(binding.iauCode);
  assert(binding.presentationOnly === true && Array.isArray(binding.waypoints), "v591-constellation-binding-policy");
  for (const waypoint of binding.waypoints) {
    assert(/^[0-9]+$/.test(waypoint.sourceId), "v591-constellation-source-id");
    assert(Number.isInteger(waypoint.waypointIndex), "v591-constellation-waypoint-index");
    assert(Number.isFinite(waypoint.anchorRaDeg) && waypoint.anchorRaDeg >= 0 && waypoint.anchorRaDeg < 360, "v591-constellation-ra");
    assert(Number.isFinite(waypoint.anchorDecDeg) && waypoint.anchorDecDeg >= -90 && waypoint.anchorDecDeg <= 90, "v591-constellation-dec");
    assert(Number.isFinite(waypoint.angularDistanceDeg) && waypoint.angularDistanceDeg <= frozen.thresholdDeg, "v591-constellation-angular-error");
    sourceIds.add(waypoint.sourceId);
    observedMaximum = Math.max(observedMaximum, waypoint.angularDistanceDeg);
    waypointCount += 1;
  }
}
assert(waypointCount === 484, "v591-constellation-counted-waypoints");
assert(sourceIds.size === 420, "v591-constellation-unique-source-ids");
assert(Math.abs(observedMaximum - 1.400826182) <= 1e-9, "v591-constellation-observed-maximum");

const fontBytes = readFileSync(resolve(root, fontSourcePath));
assert(fontBytes.byteLength === expectedFontBytes, "v591-constellation-font-bytes");
assert(sha256(fontBytes) === expectedFontSha256, "v591-constellation-font-sha");
const fontLicenseBytes = readFileSync(resolve(root, fontLicenseSourcePath));
assert(fontLicenseBytes.byteLength === expectedFontLicenseBytes, "v591-constellation-font-license-bytes");
assert(sha256(fontLicenseBytes) === expectedFontLicenseSha256, "v591-constellation-font-license-sha");
atomicCopy(resolve(root, fontSourcePath), resolve(root, fontRuntimePath));
atomicCopy(resolve(root, fontLicenseSourcePath), resolve(root, fontLicenseRuntimePath));

const sdfBuild = spawnSync("python", ["scripts/build_v591_constellation_sdf.py"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
if (sdfBuild.status !== 0) throw new Error(`v591-constellation-sdf-build:${sdfBuild.stderr || sdfBuild.stdout}`);
const labelAtlasMetadataBytes = readFileSync(resolve(root, labelAtlasMetadataPath));
const labelAtlasMetadata = JSON.parse(labelAtlasMetadataBytes.toString("utf8"));
const labelAtlasPath = `public/${labelAtlasMetadata.atlas.path.replace(/^\/+/, "")}`;
const labelAtlasBytes = readFileSync(resolve(root, labelAtlasPath));
assert(labelAtlasMetadata.version === "v591-constellation-label-sdf-atlas-v1", "v591-constellation-sdf-version");
assert(labelAtlasMetadata.status === "generated-from-admitted-local-font", "v591-constellation-sdf-status");
assert(labelAtlasMetadata.entries?.length === 88 && labelAtlasMetadata.atlas?.entryCount === 88, "v591-constellation-sdf-count");
assert(labelAtlasMetadata.atlas.bytes === labelAtlasBytes.byteLength, "v591-constellation-sdf-bytes");
assert(labelAtlasMetadata.atlas.sha256 === sha256(labelAtlasBytes), "v591-constellation-sdf-sha");
assert(labelAtlasMetadata.policy?.runtimeFontWorkerRequired === false, "v591-constellation-sdf-worker-policy");

const packetUnsigned = {
  version: "v591-constellation-gaia-packet-v1",
  generatedAt,
  status: "admitted-presentation-only-frozen-gaia-binding",
  sourceCatalog: frozen.sourceCatalog,
  binaryCatalog: frozen.binaryCatalog,
  frozenSource: {
    path: frozenPath,
    bytes: frozenBytes.byteLength,
    fileSha256: expectedFrozenFileSha256,
    version: frozen.version,
    bindingSha256: expectedBindingSha256,
    exactBindingReuse: true,
    sourceBytesCopied: false,
    frozenSourceModified: false,
  },
  metrics: {
    constellationCount: frozen.constellationCount,
    waypointCount: frozen.waypointCount,
    uniqueGaiaSourceIdCount: sourceIds.size,
    maximumAngularDistanceDeg: frozen.maximumAngularDistanceDeg,
    medianAngularDistanceDeg: frozen.medianAngularDistanceDeg,
    thresholdDeg: frozen.thresholdDeg,
    allWaypointsWithinThreshold: true,
  },
  defaults: {
    desktop: 12,
    mobile: 8,
  },
  presentationPolicy: {
    presentationOnly: true,
    normalizedCelestialDirections: true,
    randomParallax: false,
    depthOcclusion: true,
    closeupSuppressesNonFocus: true,
    labels: "local-gpu-sdf-focus-or-overview",
    scientificPayloadWriteback: false,
  },
  labelFont: {
    family: "IBM Plex Sans Condensed",
    weight: 500,
    sourcePath: fontSourcePath,
    runtimePath: `/${fontRuntimePath.replace(/^public\//, "")}`,
    bytes: fontBytes.byteLength,
    sha256: expectedFontSha256,
    license: "OFL-1.1",
    licenseSourcePath: fontLicenseSourcePath,
    licenseRuntimePath: `/${fontLicenseRuntimePath.replace(/^public\//, "")}`,
    licenseBytes: fontLicenseBytes.byteLength,
    licenseSha256: expectedFontLicenseSha256,
    externalNetworkRequest: false,
  },
  labelAtlas: {
    metadataPath: labelAtlasMetadataPath,
    metadataBytes: labelAtlasMetadataBytes.byteLength,
    metadataFileSha256: sha256(labelAtlasMetadataBytes),
    ...labelAtlasMetadata.atlas,
    entries: labelAtlasMetadata.entries,
    presentationOnly: true,
    runtimeFontWorkerRequired: false,
    resourceOwner: "v591-celestial-convergence",
  },
  bindings: frozen.bindings,
};
const packet = { ...packetUnsigned, packetSha256: canonicalSha(packetUnsigned) };
const packetBytes = Buffer.from(`${JSON.stringify(packet, null, 2)}\n`, "utf8");
atomicWrite(resolve(root, packetPath), packetBytes);
atomicWrite(resolve(root, generatedConstantsPath), [
  "// Generated by scripts/build-v591-constellation-packet.mjs.",
  `export const CONSTELLATION_PACKET_FILE_SHA256_V591 = "${sha256(packetBytes)}" as const;`,
  `export const CONSTELLATION_PACKET_BYTES_V591 = ${packetBytes.byteLength} as const;`,
  `export const CONSTELLATION_PACKET_SHA256_V591 = "${packet.packetSha256}" as const;`,
  `export const CONSTELLATION_LABEL_ATLAS_FILE_SHA256_V591 = "${labelAtlasMetadata.atlas.sha256}" as const;`,
  `export const CONSTELLATION_LABEL_ATLAS_BYTES_V591 = ${labelAtlasMetadata.atlas.bytes} as const;`,
  `export const CONSTELLATION_LABEL_ATLAS_METADATA_FILE_SHA256_V591 = "${sha256(labelAtlasMetadataBytes)}" as const;`,
  "",
].join("\n"));

console.log(JSON.stringify({
  status: packet.status,
  packetPath,
  packetSha256: packet.packetSha256,
  packetFileSha256: sha256(packetBytes),
  frozenFileSha256: expectedFrozenFileSha256,
  bindingSha256: expectedBindingSha256,
  constellationCount: packet.metrics.constellationCount,
  waypointCount: packet.metrics.waypointCount,
  uniqueGaiaSourceIdCount: packet.metrics.uniqueGaiaSourceIdCount,
  fontSha256: expectedFontSha256,
}, null, 2));
