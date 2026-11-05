import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const acceptance = readJson("docs/release/v607/mainline-a-stage-a1-acceptance.json");
const inventory = readJson("docs/release/v607/mainline-a-stage-a1-inventory.json");
const coverage = readJson("docs/release/v607/mainline-a-coverage-matrix.json");
const candidateAudit = readJson("docs/release/v607/mainline-a-stage-a3-candidate-audit.json");
const rightsReviewPath = "docs/release/v607/mainline-a-stage-a3-rights-review.json";
const localDeliveryPath = "docs/release/v607/mainline-a-stage-a3-local-delivery.json";
const acquisitionPath = "docs/release/v607/mainline-a-stage-a3-image-acquisition.json";
const rightsReview = readJson(rightsReviewPath);
const localDelivery = readJson(localDeliveryPath);
const acquisition = readJson(acquisitionPath);

const missingArtifacts = acceptance.artifacts.filter((relative) => !fs.existsSync(path.join(root, relative)));
const firstSet = acceptance.evidence.firstSet;
const firstSetTotal = firstSet.constellations + firstSet.nebulae + firstSet.stars;
const coverageRows = coverage.rows;
const candidateRows = candidateAudit.candidates;
const sameIdentity = (left, right) => left.objectId === right.objectId && left.imageId === right.imageId;
const isClearedRightsReview = (row) => {
  const review = row.rightsReview;
  const decision = rightsReview.candidates.find((candidate) => sameIdentity(candidate, row));
  return review?.policyId === "esa-hubble-cc-by-4.0"
    && review.status === "cleared"
    && review.fullCreditRequired === true
    && review.thirdPartyReviewRequired === true
    && review.thirdPartyReviewCompleted === true
    && review.evidencePath === rightsReviewPath
    && decision?.status === "cleared"
    && decision.license === "CC BY 4.0"
    && decision.sourcePage === row.sourcePage
    && decision.sourcePageStatus === 200
    && decision.credit === row.credit
    && decision.policyLinkedFromImagePage === true
    && decision.explicitException === null
    && /^[a-f0-9]{64}$/.test(decision.sourcePageHtmlSha256);
};
const hasVerifiedLocalImage = (row) => {
  const manifest = row.imageManifest;
  const asset = localDelivery.assets.find((candidate) => sameIdentity(candidate, row));
  const receipt = acquisition.candidates.find((candidate) => sameIdentity(candidate, row));
  const expectedPath = `public/textures/mainline-a/${row.imageId}.jpg`;
  if (manifest?.status !== "local-asset-acquired" || manifest.localPath !== expectedPath
    || !asset || !receipt || asset.localPath !== expectedPath || asset.src !== `/${expectedPath.slice(7)}`
    || asset.sourcePage !== row.sourcePage || asset.credit !== row.credit
    || asset.license !== "CC BY 4.0" || asset.rightsStatus !== "cleared"
    || asset.licenseUrl !== rightsReview.licenseUrl || asset.rightsPage !== rightsReview.rightsPage
    || asset.rightsReviewedAt !== rightsReview.reviewedAt
    || JSON.stringify(asset.bands) !== JSON.stringify(row.bands)
    || ![asset, receipt].every((candidate) => candidate.imageUrl === manifest.imageUrl
      && candidate.byteSize === manifest.byteSize && candidate.sha256 === manifest.sha256
      && candidate.dimensions?.width === manifest.dimensions?.width
      && candidate.dimensions?.height === manifest.dimensions?.height
      && candidate.retrievedAt === manifest.retrievedAt)) return false;
  if (!fs.existsSync(path.join(root, expectedPath))) return false;
  const bytes = fs.readFileSync(path.join(root, expectedPath));
  return bytes.length === manifest.byteSize
    && crypto.createHash("sha256").update(bytes).digest("hex") === manifest.sha256;
};
const licensedObjectIds = candidateRows.filter((row) => row.rightsStatus === "cleared").map((row) => row.objectId);
const localByteSize = localDelivery.assets.reduce((total, asset) => total + asset.byteSize, 0);
const failures = [
  ...(missingArtifacts.length ? [`missing artifacts: ${missingArtifacts.join(", ")}`] : []),
  ...(acceptance.evidence.artifactAudit?.artifactCount !== acceptance.artifacts.length ? ["acceptance artifact count is stale"] : []),
  ...(acceptance.evidence.artifactAudit?.missing !== missingArtifacts.length ? ["acceptance missing count is stale"] : []),
  ...(firstSet.registryObjects !== firstSetTotal ? ["first-set registry count does not equal category sum"] : []),
  ...(candidateRows.length !== inventory.existingAssets.nebulaSourcePageCandidatesFirstSet ? ["candidate audit count does not match inventory"] : []),
  ...(candidateRows.some((row) => row.httpStatus !== 200 || row.rightsStatus !== "cleared") ? ["candidate audit contains unreachable or uncleared delivery rows"] : []),
  ...(candidateAudit.rightsPolicy !== "esa-hubble-cc-by-4.0" ? ["candidate audit rights policy is missing or unexpected"] : []),
  ...(candidateRows.some((row) => !row.sourcePage?.startsWith("https://esahubble.org/images/") || !row.credit || !Array.isArray(row.bands)) ? ["candidate audit has incomplete source metadata"] : []),
  ...(rightsReview.status !== "cleared-under-published-license" || rightsReview.license !== "CC BY 4.0" || rightsReview.rightsPageHttpStatus !== 200 || rightsReview.licenseUrl !== "https://creativecommons.org/licenses/by/4.0/" || rightsReview.rightsPage !== "https://esahubble.org/copyright/" ? ["published rights-review policy is missing or invalid"] : []),
  ...(rightsReview.candidates.length !== candidateRows.length || localDelivery.assets.length !== candidateRows.length || new Set(candidateRows.map((row) => row.objectId)).size !== candidateRows.length ? ["per-image review or local-delivery identity count mismatch"] : []),
  ...(candidateRows.some((row) => !isClearedRightsReview(row)) ? ["candidate audit lacks matching per-image license clearance"] : []),
  ...(candidateRows.some((row) => !hasVerifiedLocalImage(row)) ? ["candidate audit has an unverified local JPEG or mismatched delivery metadata"] : []),
  ...(candidateAudit.localPayload?.acquired !== true || candidateAudit.localPayload?.licensed !== true || candidateAudit.rightsReview !== rightsReviewPath || candidateAudit.localDelivery !== localDeliveryPath ? ["candidate audit is not bound to the cleared local-delivery evidence"] : []),
  ...(localDelivery.localPayload?.acquired !== true || localDelivery.localPayload?.licensed !== true || localDelivery.rightsReview !== rightsReviewPath || localDelivery.historicalAcquisitionReceipt !== acquisitionPath || localDelivery.totalByteSize !== localByteSize ? ["local delivery evidence is incomplete"] : []),
  ...(acquisition.localPayload?.acquired !== false || acquisition.localPayload?.licensed !== false || acquisition.localPayload?.storage !== "ephemeral-memory-only" || acquisition.status !== "acquired-awaiting-rights-review" ? ["historical acquisition receipt was improperly promoted"] : []),
  ...(coverage.nebulaAssetCoverage?.licensed !== licensedObjectIds.length || coverage.nebulaAssetCoverage?.totalLocalByteSize !== localByteSize || JSON.stringify(coverage.nebulaAssetCoverage?.licensedObjectIds) !== JSON.stringify(licensedObjectIds) ? ["nebula coverage matrix is stale"] : []),
  ...(new Set(coverageRows.constellations).size !== coverageRows.constellations.length ? ["duplicate constellation coverage row"] : []),
  ...(new Set(coverageRows.nebulae).size !== coverageRows.nebulae.length ? ["duplicate nebula coverage row"] : []),
  ...(new Set(coverageRows.stars).size !== coverageRows.stars.length ? ["duplicate star coverage row"] : []),
];

const result = {
  status: failures.length ? "fail" : "pass",
  artifactCount: acceptance.artifacts.length,
  missingArtifacts,
  firstSet,
  candidateCount: candidateRows.length,
  licensedLocalAssetCount: licensedObjectIds.length,
  verifiedLocalByteSize: localByteSize,
  coverageRows: Object.fromEntries(Object.entries(coverageRows).map(([key, rows]) => [key, rows.length])),
  failures,
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
