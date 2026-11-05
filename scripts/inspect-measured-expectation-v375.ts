import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { parseKerrSciencePhotonBandViewV328 } from "../app/lib/kerrSciencePhotonBandsV328";
import {
  MEASURED_EXPECTATION_AUTHORITY_INPUTS_V375,
  parseMeasuredExpectationAuthorityInspectV375,
} from "../app/lib/measuredExpectationAuthorityInspectV375";

const root = process.cwd();
const output = "dist/science/measured-expectation-v375/inspect.json";
const inputs = [
  {
    id: "v367-detector-admission",
    path: "dist/science/detector-calibration-v367/admission.json",
  },
  {
    id: "v367-detector-authority-pointer",
    path: "dist/release/orbit-atlas-detector-calibration-authority-v367.json",
  },
  {
    id: "v361-detector-manifest",
    path: "dist/staging/detector-calibration-v361/manifest.json",
  },
  {
    id: "v373-geometry-admission",
    path: "dist/science/observation-geometry-v373/admission.json",
  },
  {
    id: "v373-geometry-authority-pointer",
    path: "dist/release/orbit-atlas-observation-geometry-authority-v373.json",
  },
  {
    id: "v374-geometry-publication-receipt",
    path: "dist/science/observation-geometry-v374/publication.json",
  },
  {
    id: "v369-runtime-observation-geometry",
    path: "dist/staging/detector-calibration-v369/observation-geometry.json",
  },
  {
    id: "v328-photon-radiance",
    path: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  },
] as const;
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(
              ([key]) =>
                !["generatedAt", "artifactSha256", "pointerSha256"].includes(key),
            )
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const present = inputs
  .filter((entry) => existsSync(resolve(root, entry.path)))
  .map((entry) => entry.id);
const missing = inputs
  .filter((entry) => !present.includes(entry.id))
  .map((entry) => entry.id);
let photonInputQualified = false;
let invalidReason: string | null = null;
const photonEntry = inputs[7];
if (present.includes(photonEntry.id)) {
  try {
    const artifact = JSON.parse(
      readFileSync(resolve(root, photonEntry.path), "utf8"),
    ) as { view?: unknown; artifactSha256?: string };
    if (!artifact.view || sha(artifact) !== artifact.artifactSha256) {
      throw new Error("v375-photon-artifact-sha");
    }
    parseKerrSciencePhotonBandViewV328(artifact.view);
    photonInputQualified = true;
  } catch (error) {
    invalidReason = error instanceof Error ? error.message.slice(0, 160) : "v375-photon-invalid";
  }
}
const status = invalidReason
  ? "blocked-dual-authority-inputs-invalid"
  : missing.length
    ? "blocked-dual-authority-inputs-unavailable"
    : "ready-for-explicit-measured-expectation-build";
const unsigned = {
  version: "v375-dual-authority-measured-expectation-inspect-v1" as const,
  generatedAt: new Date().toISOString(),
  status,
  expectedInputs: MEASURED_EXPECTATION_AUTHORITY_INPUTS_V375,
  presentInputCount: present.length,
  missingInputs: missing,
  invalidReason,
  envelopeBuilderImplemented: true as const,
  buildCommand: "npm run atlas -- relativity measured-expectation-v375-build" as const,
  buildExecuted: false as const,
  photonInputQualified,
  detectorAuthorityQualified: false as const,
  geometryAuthorityQualified: false as const,
  measuredExpectationAvailable: false as const,
  expectationRowCount: 0 as const,
  attemptConsumed: false as const,
  networkAttempted: false as const,
  automaticPromotionAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseMeasuredExpectationAuthorityInspectV375({
  ...unsigned,
  artifactSha256: sha(unsigned),
});
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      present: artifact.presentInputCount,
      missing: artifact.missingInputs,
      photonInputQualified: artifact.photonInputQualified,
      detectorAuthorityQualified: artifact.detectorAuthorityQualified,
      geometryAuthorityQualified: artifact.geometryAuthorityQualified,
      expectationAvailable: artifact.measuredExpectationAvailable,
      expectationRows: artifact.expectationRowCount,
      attemptConsumed: artifact.attemptConsumed,
    },
    null,
    2,
  ),
);
