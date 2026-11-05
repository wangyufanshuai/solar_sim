import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INPUTS = Object.freeze({
  itemPolicy: "docs/release/v592/nebula-item-license-review-v592.json",
  alternatives: "app/data/mainlineANebulaR74AlternativesV661.generated.json",
  componentTap: "docs/release/v607/stellar-component-tap-v646/analysis-r66-tap-20261007-001.json",
  componentReview: "docs/release/v607/mainline-a-r66-stellar-component-review-packet-20261007.json",
  previousRound: "docs/release/v607/mainline-a-r75-v662-round-20261013.json",
  visualReview: "docs/release/v607/mainline-a-r75-v662-visual-20261013v662r75web02.json",
});
export const R76_OUTPUT_V663 =
  "app/data/mainlineAWebReadinessV663.generated.json";
export const R76_STAR_IDS_V663 = Object.freeze([
  "acrux", "spica", "regulus", "polaris",
]);
export const R76_NEBULA_IDS_V663 = Object.freeze([
  "ring-nebula", "dumbbell-nebula", "bubble-nebula",
  "cats-eye-nebula", "omega-nebula",
]);
const SHA = /^[a-f0-9]{64}$/;

function check(condition, code, detail) {
  if (!condition) throw new Error(`r76-readiness:${code}${detail
    ? `:${JSON.stringify(detail)}` : ""}`);
}
export function sha256R76V663(value) {
  return createHash("sha256").update(value).digest("hex");
}
export function safePathR76V663(relative) {
  check(typeof relative === "string" && relative.length > 0
    && !relative.includes("\\") && !relative.startsWith("/")
    && !/^[a-z]:/i.test(relative)
    && relative.split("/").every((part) => part && part !== "."
      && part !== ".."), "unsafe-path", relative);
  const absolute = path.resolve(ROOT, relative);
  check(absolute.startsWith(`${ROOT}${path.sep}`), "path-escaped", relative);
  return absolute;
}
export async function pinR76V663(relative) {
  const body = await readFile(safePathR76V663(relative));
  check(body.length > 0, "empty-artifact", relative);
  return { path: relative, bytes: body.length,
    sha256: sha256R76V663(body) };
}
async function readJsonWithPin(relative) {
  const bytes = await readFile(safePathR76V663(relative));
  return { value: JSON.parse(bytes.toString("utf8")),
    pin: { path: relative, bytes: bytes.length,
      sha256: sha256R76V663(bytes) } };
}
function sameIds(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}
function preferredDownload(source) {
  const candidates = source?.downloads ?? [];
  const jpeg = candidates.find((row) => /jpe?g/i.test(row.format ?? "")
    || /\.jpe?g(?:\?|$)/i.test(row.url ?? ""));
  if (!jpeg) return null;
  const parsed = new URL(jpeg.url);
  check(parsed.protocol === "https:"
    && parsed.hostname === "assets.science.nasa.gov"
    && parsed.username === "" && parsed.password === ""
    && parsed.hash === "", "image-intent-url-invalid", jpeg.url);
  return { url: jpeg.url, listedFormat: jpeg.format,
    listedDimensions: jpeg.size ?? null, requestExecuted: false,
    responseCaptured: 0, rawArtifact: null };
}
function checkInputs(inputs) {
  const { itemPolicy, alternatives, componentTap,
    componentReview, previousRound, visualReview } = inputs;
  check(itemPolicy?.version === "v592-nebula-item-license-review-v1"
    && itemPolicy.policy?.automaticRetryAllowed === false
    && itemPolicy.policy?.visualAssetAdmissionGranted === false
    && sameIds(itemPolicy.blockedTargets, R76_NEBULA_IDS_V663),
  "item-policy-drift");
  check(alternatives?.schema === "mainline-a-r74-alternative-overlay-v661"
    && alternatives.counts?.heldTargets === 5
    && alternatives.counts?.officialPagesCaptured === 6
    && alternatives.counts?.imageRequestsExecuted === 0
    && alternatives.counts?.imageResponsesCaptured === 0
    && alternatives.counts?.rightsSigned === 0
    && alternatives.boundary?.scientificPayloadWriteback === false,
  "alternative-source-boundary-drift");
  check(componentTap?.summary?.responseCaptured === 4
    && componentTap.summary.physicalComponentIdentitiesConfirmed === 0
    && componentTap.summary.heroToWdsPrimaryCrossIdsMatched === 4,
  "component-tap-boundary-drift");
  check(componentReview?.summary?.structuredResponsesCaptured === 4
    && componentReview.summary.rawPairRowsRecomputed === 25
    && componentReview.summary.componentIdentitiesConfirmed === 0,
  "component-review-boundary-drift");
  check(previousRound?.schema === "mainline-a-r75-web-round-v662"
    && previousRound.status
      === "local-current-source-web-candidate-verified-public-release-blocked"
    && previousRound.coverage?.aNebulaRightsSigned === 0
    && previousRound.coverage?.betaNebulaRightsSigned === 0
    && previousRound.evidence?.performance?.durationMs?.length === 2
    && previousRound.claims?.publicWebReleaseApproved === false,
  "previous-round-identity-drift");
  check(visualReview?.coverage?.screenshotCount === 88
    && visualReview.claims?.humanPerItemSignoff === false,
  "visual-review-boundary-drift");
}
function starRows(inputs) {
  const tap = inputs.componentTap.records;
  const review = inputs.componentReview.records;
  check(Array.isArray(tap) && Array.isArray(review)
    && sameIds(tap.map((row) => row.id), R76_STAR_IDS_V663)
    && sameIds(review.map((row) => row.id), R76_STAR_IDS_V663),
  "star-set-drift");
  return R76_STAR_IDS_V663.map((id) => {
    const cross = tap.find((row) => row.id === id);
    const decision = review.find((row) => row.id === id);
    check(cross?.wdsSystemId === decision?.wdsSystemId
      && cross.heroAndWdsPrimarySameSimbadObject === true
      && cross.componentIdentityConfirmed === false
      && cross.physicalComponentIdentityStatus === "review-required"
      && decision.componentIdentityConfirmed === false
      && decision.scientificPayloadWriteback === false
      && Number.isInteger(decision.pairCount)
      && decision.pairCount > 0
      && typeof decision.reviewQuestion === "string"
      && decision.reviewQuestion.length > 30
      && SHA.test(cross.rawCsv?.sha256 ?? "")
      && SHA.test(decision.sourceArtifact?.sha256 ?? ""),
    "star-evidence-invalid", id);
    return { id, wdsSystemId: cross.wdsSystemId,
      heroIdentifier: cross.heroIdentifier,
      primaryCrossId: cross.wdsPrimaryCrossId,
      crossIdMatched: true, rawCsv: cross.rawCsv,
      pairCount: decision.pairCount,
      pairArtifact: decision.sourceArtifact,
      reviewQuestion: decision.reviewQuestion,
      warningCodes: cross.warnings,
      physicalComponentConfirmed: false,
      state: "component-review-hold",
      runtimeAdmission: "candidate-only", hold: true,
      notAdmitted: true, scientificPayloadWriteback: false };
  });
}
function nebulaRows(inputs) {
  const policy = inputs.itemPolicy;
  const rows = inputs.alternatives.rows;
  check(Array.isArray(rows)
    && sameIds(rows.map((row) => row.id), R76_NEBULA_IDS_V663),
  "nebula-set-drift");
  return R76_NEBULA_IDS_V663.map((id) => {
    const row = rows.find((item) => item.id === id);
    const review = policy.reviews.find((item) => item.target === id);
    const source = row?.alternatives?.find((item) =>
      item.sourceKey === row.preferredSourceKey);
    check(row?.imageRequestExecuted === false
      && row.imageResponseCaptured === 0
      && row.rightsSigned === false
      && row.hold === true && row.notAdmitted === true
      && row.scientificPayloadWriteback === false
      && review?.status
        === "blocked-item-license-identity-or-texture-suitability-review"
      && review.visualAssetAdmitted === false
      && review.sourceImage?.requested === false
      && Array.isArray(review.blocker)
      && review.blocker.length > 0
      && source?.identityState === "page-identity-confirmed"
      && source.responseCaptured === 1
      && source.rawArtifact?.path?.endsWith(`${source.rawArtifact.sha256}.html`)
      && source.rightsStatus === "pending"
      && source.imageRequestExecuted === false,
    "nebula-evidence-invalid", id);
    const conflicts = row.alternatives.filter((item) =>
      item.identityState === "identity-conflict").map((item) => ({
      sourceKey: item.sourceKey, pageUrl: item.sourceUrl,
      issueCodes: item.inspectionIssues,
    }));
    check(sameIds(conflicts.map((item) => item.sourceKey), row.conflicts),
      "identity-conflict-erased", id);
    return { id, sourceKey: source.sourceKey,
      officialPageUrl: source.sourceUrl,
      officialPageRaw: source.rawArtifact,
      title: source.title, credit: source.credit,
      partnerMarkers: source.partnerMarkers,
      pageIdentity: source.identityState,
      conflictingSources: conflicts,
      imageRequestIntent: preferredDownload(source),
      oldItemPolicyBlockers: review.blocker,
      imageAcquisitionAllowed: false, imageRequestExecuted: false,
      imageResponseCaptured: 0, rightsSigned: false,
      visualSignoff: false, state: "image-acquisition-policy-hold",
      runtimeAdmission: "candidate-only", hold: true,
      notAdmitted: true, scientificPayloadWriteback: false };
  });
}
export function assembleR76ReadinessV663(inputs, inputPins, rawPins) {
  checkInputs(inputs);
  const stars = starRows(inputs);
  const nebulae = nebulaRows(inputs);
  const allPins = [...inputPins, ...rawPins];
  check(new Set(allPins.map((pin) => pin.path)).size === allPins.length,
    "duplicate-source-pin");
  const gates = { aLineRuntimeObjects: 36,
    betaStarEntries: 24, betaConstellationEntries: 12,
    betaNebulaEntries: 24, identityReviewsPending: stars.length,
    blockedImageAcquisitions: nebulae.length,
    rawImagesCapturedForBlockedTargets: 0,
    aNebulaRightsSigned: 0, betaNebulaRightsSigned: 0,
    humanVisualSignoffs: 0, localLongRuns: 2,
    physicalMobileRuns: 0, publicWebReleaseAllowed: false };
  const stable = { schema: "mainline-a-r76-web-readiness-v663",
    evidenceClass: "offline-replayed-current-web-release-gates",
    sourcePins: allPins, stars, nebulae, gates,
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimeWrites: false,
      measurementWrites: false, publicWebReleaseApproved: false },
    claims: { copyrightApproval: false, scientificValidity: false,
      productionPerformance: false, realUserValidation: false,
      physicalMobile: false, publicWebReleaseApproved: false } };
  return { ...stable,
    fingerprint: sha256R76V663(JSON.stringify(stable)) };
}
export async function buildR76ReadinessV663() {
  const pairs = await Promise.all(Object.entries(INPUTS).map(async ([role,
    relative]) => [role, await readJsonWithPin(relative)]));
  const inputs = Object.fromEntries(pairs.map(([role, record]) =>
    [role, record.value]));
  const inputPins = pairs.map(([role, record]) => ({
    role, ...record.pin }));
  const paths = [
    ...inputs.alternatives.rows.flatMap((row) => row.alternatives
      .filter((item) => item.rawArtifact)
      .map((item) => item.rawArtifact.path)),
    ...inputs.componentTap.records.map((row) => row.rawCsv.path),
    ...inputs.componentReview.records.map((row) =>
      row.sourceArtifact.path),
  ];
  const rawPins = await Promise.all(paths.map(pinR76V663));
  const expected = new Map([
    ...inputs.alternatives.rows.flatMap((row) => row.alternatives
      .filter((item) => item.rawArtifact)
      .map((item) => [item.rawArtifact.path,
        item.rawArtifact])),
    ...inputs.componentTap.records.map((row) =>
      [row.rawCsv.path, row.rawCsv]),
    ...inputs.componentReview.records.map((row) =>
      [row.sourceArtifact.path, row.sourceArtifact]),
  ]);
  for (const pin of rawPins) {
    const prior = expected.get(pin.path);
    check(prior?.bytes === pin.bytes && prior?.sha256 === pin.sha256,
      "raw-source-drift", pin.path);
  }
  return assembleR76ReadinessV663(inputs, inputPins, rawPins);
}
export function parseR76OptionsV663(argv) {
  check(argv.length === 1 && ["--write", "--check"].includes(argv[0]),
    "usage");
  return argv[0];
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  const mode = parseR76OptionsV663(process.argv.slice(2));
  const snapshot = await buildR76ReadinessV663();
  if (mode === "--write") {
    await writeFile(safePathR76V663(R76_OUTPUT_V663),
      `${JSON.stringify({ ...snapshot,
        generatedAt: new Date().toISOString() }, null, 2)}\n`,
    { flag: "wx" });
  } else {
    const saved = JSON.parse(await readFile(
      safePathR76V663(R76_OUTPUT_V663), "utf8"));
    check(saved.fingerprint === snapshot.fingerprint,
      "saved-output-drift");
  }
  console.log(JSON.stringify({ status: mode === "--write"
    ? "written-candidate-hold" : "verified-candidate-hold",
  stars: snapshot.stars.length, nebulae: snapshot.nebulae.length,
  sourcePins: snapshot.sourcePins.length,
  fingerprint: snapshot.fingerprint, output: R76_OUTPUT_V663 }));
}
