import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { parseDetectorCalibrationManifestV361 } from "../app/lib/detectorCalibrationAdmissionV361";
import {
  parseDetectorCalibrationAuthorityEnvelopeV367,
  parseDetectorCalibrationAuthorityPointerV367,
  validateMeasuredDetectorAuthorityChainV368,
} from "../app/lib/detectorResponseAuthorityGateV368";
import { parseKerrSciencePhotonBandViewV328 } from "../app/lib/kerrSciencePhotonBandsV328";
import {
  createMeasuredExpectationAuthorityEnvelopeV375,
  validateMeasuredGeometryAuthorityChainV375,
  type ObservationGeometryPublicationReceiptV375,
} from "../app/lib/measuredExpectationAuthorityV375";
import {
  createMeasuredPhotonExpectationV369,
  parseMeasuredObservationGeometryV369,
} from "../app/lib/measuredPhotonExpectationV369";
import type {
  ObservationGeometryAdmissionArtifactV374,
  ObservationGeometryAuthorityPointerV374,
} from "../app/lib/observationGeometryRuntimePublicationV374";
import { assertMeasuredAuthorityInputSizeV380 } from "../app/lib/measuredAuthorityInputGuardV380";

const root = process.cwd();
const paths = {
  detectorAdmission: "dist/science/detector-calibration-v367/admission.json",
  detectorPointer: "dist/release/orbit-atlas-detector-calibration-authority-v367.json",
  detectorManifest: "dist/staging/detector-calibration-v361/manifest.json",
  geometryAdmission: "dist/science/observation-geometry-v373/admission.json",
  geometryPointer: "dist/release/orbit-atlas-observation-geometry-authority-v373.json",
  geometryReceipt: "dist/science/observation-geometry-v374/publication.json",
  geometry: "dist/staging/detector-calibration-v369/observation-geometry.json",
  photon: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  output: "dist/science/measured-expectation-v375/envelope.json",
} as const;
const MAXIMUM_BYTES_BY_PATH: Readonly<Record<string, number>> = Object.freeze({
  [paths.detectorAdmission]: 512 * 1024,
  [paths.detectorPointer]: 64 * 1024,
  [paths.detectorManifest]: 1024 * 1024,
  [paths.geometryAdmission]: 256 * 1024,
  [paths.geometryPointer]: 64 * 1024,
  [paths.geometryReceipt]: 256 * 1024,
  [paths.geometry]: 64 * 1024,
  [paths.photon]: 512 * 1024,
});
const read = (path: string) => {
  const maximumBytes = MAXIMUM_BYTES_BY_PATH[path];
  if (!maximumBytes) throw new Error(`v375-unregistered-input:${path}`);
  const absolute = resolve(root, path);
  const metadata = statSync(absolute);
  if (!metadata.isFile()) throw new Error(`v375-input-file:${path}`);
  assertMeasuredAuthorityInputSizeV380({ path, size: metadata.size, maximumBytes });
  return readFileSync(absolute);
};
const fileSha = (path: string) =>
  createHash("sha256").update(read(path)).digest("hex");
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
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

if (existsSync(resolve(root, paths.output))) {
  throw new Error("v375-refuse-overwrite-existing-envelope");
}
const detectorAdmission = parseDetectorCalibrationAuthorityEnvelopeV367(
  JSON.parse(read(paths.detectorAdmission).toString("utf8")),
);
const detectorPointer = parseDetectorCalibrationAuthorityPointerV367(
  JSON.parse(read(paths.detectorPointer).toString("utf8")),
);
const detectorManifest = parseDetectorCalibrationManifestV361(
  JSON.parse(read(paths.detectorManifest).toString("utf8")),
);
const detectorManifestCanonicalSha256 = sha(detectorManifest);
const detectorAuthority = validateMeasuredDetectorAuthorityChainV368({
  admission: detectorAdmission,
  authorityPointer: detectorPointer,
  manifest: detectorManifest,
  verifiedManifestFileSha256: fileSha(paths.detectorManifest),
  verifiedManifestCanonicalSha256: detectorManifestCanonicalSha256,
});
if (!detectorAuthority) throw new Error("v375-detector-authority-unavailable");

const geometryAdmission = JSON.parse(
  read(paths.geometryAdmission).toString("utf8"),
) as ObservationGeometryAdmissionArtifactV374;
const geometryPointer = JSON.parse(
  read(paths.geometryPointer).toString("utf8"),
) as ObservationGeometryAuthorityPointerV374;
const geometryReceipt = JSON.parse(
  read(paths.geometryReceipt).toString("utf8"),
) as ObservationGeometryPublicationReceiptV375;
const geometry = parseMeasuredObservationGeometryV369(
  JSON.parse(read(paths.geometry).toString("utf8")),
);
const geometryAuthority = validateMeasuredGeometryAuthorityChainV375({
  authorityPointer: geometryPointer,
  admission: geometryAdmission,
  receipt: geometryReceipt,
  geometry,
  verifiedAuthorityPointerFileSha256: fileSha(paths.geometryPointer),
  verifiedAuthorityPointerCanonicalSha256: sha(geometryPointer),
  verifiedAdmissionCanonicalSha256: sha(geometryAdmission),
  verifiedReceiptCanonicalSha256: sha(geometryReceipt),
  verifiedGeometryFileSha256: fileSha(paths.geometry),
  verifiedGeometryCanonicalSha256: sha(geometry),
});
const photonArtifact = JSON.parse(read(paths.photon).toString("utf8")) as {
  view?: unknown;
  artifactSha256?: string;
};
if (!photonArtifact.view || sha(photonArtifact) !== photonArtifact.artifactSha256) {
  throw new Error("v375-photon-artifact-sha");
}
const photonView = parseKerrSciencePhotonBandViewV328(photonArtifact.view);
const expectation = createMeasuredPhotonExpectationV369({
  photonView,
  admission: detectorAdmission,
  authorityPointer: detectorPointer,
  manifest: detectorManifest,
  verifiedManifestFileSha256: fileSha(paths.detectorManifest),
  verifiedManifestCanonicalSha256: detectorManifestCanonicalSha256,
  observationGeometry: geometry,
});
const envelope = createMeasuredExpectationAuthorityEnvelopeV375({
  expectation,
  detectorAuthorityQualified: true,
  geometryAuthority,
  detectorInstrumentSerialOrCampaignId:
    detectorManifest.instrument.serialOrCampaignId,
  detectorAuthorityPointerSha256: detectorPointer.pointerSha256,
  detectorAdmissionArtifactSha256: detectorAdmission.artifactSha256,
  photonArtifactSha256: photonArtifact.artifactSha256,
});
if (
  envelope.status !== "qualified-dual-authority-measured-expectation" ||
  !envelope.measuredExpectationAvailable ||
  envelope.counts.expectationRowCount !== 12
) {
  throw new Error("v375-envelope-not-qualified");
}
const unsigned = {
  ...envelope,
  generatedAt: new Date().toISOString(),
  attemptConsumed: true,
  networkAttempted: false,
  automaticPromotionApplied: false,
};
atomic(paths.output, { ...unsigned, artifactSha256: sha(unsigned) });
console.log(
  JSON.stringify(
    {
      status: envelope.status,
      detectorAuthorityQualified: envelope.detectorAuthorityQualified,
      geometryAuthorityQualified: envelope.geometryAuthorityQualified,
      instrumentIdentityMatched: envelope.instrumentIdentityMatched,
      expectationRows: envelope.counts.expectationRowCount,
      observedCounts: envelope.observedCounts,
      syntheticFallbackUsed: envelope.syntheticFallbackUsed,
    },
    null,
    2,
  ),
);
