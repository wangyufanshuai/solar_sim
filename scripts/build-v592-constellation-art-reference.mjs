import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const packetPath = "public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json";
const implementationPath = "app/lib/constellationArtV592.ts";
const artRadius = 231.905;
const outputPath = resolve(root, "docs/release/v592/constellation-art-reference-receipt-v592.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function fileRecord(path) {
  const bytes = readFileSync(resolve(root, path));
  return { path, bytes: bytes.byteLength, sha256: sha256(bytes) };
}
function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.part`;
  writeFileSync(temporary, text);
  rmSync(path, { force: true });
  renameSync(temporary, path);
}
function direction(raDeg, decDeg) {
  const ra = raDeg * Math.PI / 180;
  const dec = decDeg * Math.PI / 180;
  const cosDec = Math.cos(dec);
  return [cosDec * Math.cos(ra), Math.sin(dec), cosDec * Math.sin(ra)];
}
function dot(left, right) {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}
function cross(left, right) {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}
function normalize(value) {
  const length = Math.hypot(...value) || 1;
  return value.map((component) => component / length);
}
function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}
function signature(code, values) {
  let hash = 0x811c9dc5;
  const bytes = `${code}|${values.map((point) => `${point.x.toFixed(6)},${point.y.toFixed(6)}`).join(";")}`;
  for (let index = 0; index < bytes.length; index += 1) {
    hash ^= bytes.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

const packetBytes = readFileSync(resolve(root, packetPath));
const packet = JSON.parse(packetBytes.toString("utf8"));
const entries = packet.bindings.map((binding) => {
  const sourceDirections = binding.waypoints.map((waypoint) => direction(waypoint.anchorRaDeg, waypoint.anchorDecDeg));
  const decodedDirections = sourceDirections.map((value) => normalize(value.map((component) => Math.fround(component * artRadius))));
  const directions = [...new Map(decodedDirections.map((value) => [value.map((component) => component.toFixed(6)).join(":"), value])).values()];
  const center = normalize(sourceDirections.reduce((sum, value) => [sum[0] + value[0], sum[1] + value[1], sum[2] + value[2]], [0, 0, 0]));
  const reference = Math.abs(center[1]) > 0.92 ? [1, 0, 0] : [0, 1, 0];
  const east = normalize(cross(reference, center));
  const north = normalize(cross(center, east));
  const projected = directions.map((value) => ({
    x: clamp(Math.atan2(dot(value, east), dot(value, center)), -1.35, 1.35),
    y: clamp(Math.atan2(dot(value, north), dot(value, center)), -1.35, 1.35),
  }));
  return {
    code: binding.iauCode,
    name: binding.name,
    sourceIdCount: new Set(binding.waypoints.map((waypoint) => waypoint.sourceId)).size,
    uniqueAnchorCount: new Set(directions.map((value) => value.map((component) => component.toFixed(6)).join(":"))).size,
    segmentCount: Math.max(0, sourceDirections.length - 1),
    signature: signature(binding.iauCode, projected),
    finite: projected.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)),
    presentationOnly: true,
    scientificPayloadWriteback: false,
  };
});
const signatures = new Set(entries.map((entry) => entry.signature));
if (
  entries.length !== 88
  || signatures.size !== 88
  || entries.some((entry) => entry.sourceIdCount < 2 || entry.uniqueAnchorCount < 2 || entry.segmentCount < 1 || !entry.finite)
) throw new Error("v592-constellation-art-reference-gate");

const unsigned = {
  version: "v592-constellation-art-reference-receipt-v1",
  generatedAt: "2026-08-15T00:00:00Z",
  status: "admitted-88-of-88-data-derived-observatory-engravings",
  source: {
    constellationPacket: { ...fileRecord(packetPath), packetSha256: packet.packetSha256 },
    implementation: fileRecord(implementationPath),
  },
  admission: {
    requiredCount: 88,
    admittedCount: entries.length,
    uniqueSignatureCount: signatures.size,
    externalIllustrationAssetCount: 0,
    proceduralFallbackAllowed: false,
    observationImageClaimed: false,
    presentationOnly: true,
    scientificPayloadWriteback: false,
    iauBoundaryAdmission: "blocked-source-not-admitted",
  },
  primaryModel: "deterministic-tangent-plane-celestial-engraving",
  entries,
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({
  status: receipt.status,
  receiptSha256: receipt.receiptSha256,
  admittedCount: receipt.admission.admittedCount,
  uniqueSignatureCount: receipt.admission.uniqueSignatureCount,
}, null, 2));
