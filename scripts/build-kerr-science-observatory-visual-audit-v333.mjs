import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const output = "dist/science/kerr-science-observatory-v333/visual-audit.json";
const files = [
  "app/components/KerrScienceObservatoryHeaderV333.tsx",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandUncertaintyV325.tsx",
  "app/components/KerrScienceCinematicABV327.tsx",
  "app/components/KerrSciencePhotonBandsV328.tsx",
];
const bytes = (relative) => readFileSync(resolve(root, relative));
const text = (relative) => bytes(relative).toString("utf8");
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "auditSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const sources = files.map(text);
const combined = sources.join("\n");
const header = sources[0];
const hud = sources[1];
const expectedCodePoints = [0x00b7, 0x2194, 0x0394, 0x03bd, 0x207b, 0x00b9, 0x00b2];
const forbiddenCharacters = /[鈥宦谓螖虅搟虏�]/u;
const unicodeCodePoints = [...new Set([...combined].filter((character) => character.codePointAt(0) > 127).map((character) => character.codePointAt(0)))].sort((left, right) => left - right);
const checks = {
  singleHeaderRuntimeConsumer: (hud.match(/<KerrScienceObservatoryHeaderV333/g) ?? []).length === 1,
  precisionDirectionWired: header.includes("deep-space-precision-instrument"),
  spectralRailComplete: ["visible", "euv", "soft-x-ray"].every((band) => header.includes(`\"${band}\"`)),
  authorityBoundaryVisible: header.includes("CPU float64 authority") && header.includes("browser qualification not run"),
  denseBoundaryVisible: header.includes("0/49 · incomplete · aggregate unavailable"),
  unicodeSemanticsComplete: expectedCodePoints.every((codePoint) => unicodeCodePoints.includes(codePoint)),
  noMojibake: !forbiddenCharacters.test(combined),
  noCanvas: !combined.includes("<canvas"),
  noNetwork: !combined.includes("fetch("),
  noRandomness: !combined.includes("Math.random"),
  noPhysicsMutationSurface: !combined.includes("physicsEngine") && !combined.includes("sceneRevision") && !combined.includes("setState("),
  scienceCinematicBoundaryVisible: header.includes("measurement buffers isolated from presentation") && header.includes("cinematic copies distinct"),
  accessibilitySignals: header.includes("aria-live=\"polite\"") && header.includes("aria-hidden=\"true\"") && header.includes("aria-label=\"Fixed scientific observing bands\""),
};
if (Object.values(checks).some((value) => value !== true)) throw new Error(`v333 visual audit failed:${JSON.stringify(checks)}`);

const unsigned = {
  version: "v333-kerr-science-observatory-visual-audit-v1",
  generatedAt: new Date().toISOString(),
  status: "qualified-static-precision-console-browser-pending",
  visualDirection: "deep-space-precision-instrument",
  scienceBoundary: "telemetry-only-linear-no-grade-no-science-mutation",
  cinematicBoundary: "presentation-copy-disjoint",
  denseBoundary: "incomplete-0-of-49-aggregate-unavailable",
  spectralRail: ["visible", "euv", "soft-x-ray"],
  checks,
  unicodeCodePoints: unicodeCodePoints.map((codePoint) => `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`),
  sourceManifest: files.map((path) => ({ path, sha256: fileSha(path) })),
  browserQualification: "not-run",
};
const audit = { ...unsigned, auditSha256: sha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(audit, null, 2)}\n`);
renameSync(temporary, target);
console.log(JSON.stringify({ status: audit.status, auditSha256: audit.auditSha256, checks: Object.keys(checks).length, unicodeCodePoints: audit.unicodeCodePoints, browserQualification: audit.browserQualification }, null, 2));
