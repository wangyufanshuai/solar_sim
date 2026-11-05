import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  R72_EXPANSION_PATH_V659, R72_LICENSE_PATH_V659,
  R72_SCHEMA_V659, artifactPathR72V659,
  fingerprintR72V659, inspectAssetR72V659, inspectJpegR72V659,
  inspectPageR72V659, inspectSearchR72V659,
  safeRequestUrlR72V659, sha256R72V659, validateInputsR72V659,
} from "./mainline-a-r72-source-contract-v659.mjs";
import { ledgerPathR72V659 } from "./collect-mainline-a-r72-source-v659.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STAGES = ["page", "search", "asset", "image"];
const SHA = /^[a-f0-9]{64}$/i;

function insideRoot(relative) {
  if (typeof relative !== "string" || !relative
    || relative.startsWith("/") || relative.includes("\\")
    || relative.split("/").some((part) => part === ".." || part === "")) {
    throw new Error("r72-source-v659:path-invalid");
  }
  const absolute = path.resolve(ROOT, relative);
  if (!absolute.startsWith(`${ROOT}${path.sep}`)) {
    throw new Error("r72-source-v659:path-escaped");
  }
  return absolute;
}

async function pin(relative) {
  const bytes = await readFile(insideRoot(relative));
  return { path: relative, bytes: bytes.length,
    sha256: sha256R72V659(bytes), body: bytes };
}

function samePin(actual, expected) {
  return actual?.path === expected?.path && actual?.bytes === expected?.bytes
    && actual?.sha256 === expected?.sha256;
}

function equalJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function stageUrl(row, kind) {
  if (kind === "page") return row.initialPageUrl;
  if (kind === "search") return row.searchUrl;
  if (kind === "asset") return row.assetUrl;
  if (kind === "image") return row.imageUrl;
  throw new Error("r72-source-v659:kind-invalid");
}

function successInspection(kind, bytes, row) {
  if (kind === "page") return inspectPageR72V659(bytes, row);
  if (kind === "search") return inspectSearchR72V659(bytes, row);
  if (kind === "asset") return inspectAssetR72V659(bytes, row);
  return inspectJpegR72V659(bytes);
}

export function validateSkippedImageR72V659(stage, row) {
  const issues = [];
  const expectedReason = row.imageAcquisitionAllowed
    ? "source-chain-incomplete"
    : "item-license-or-suitability-review-blocked";
  if (stage?.kind !== "image" || stage?.requestUrl !== row.imageUrl
    || stage?.requestExecuted !== false || stage?.responseCaptured !== 0
    || !Array.isArray(stage?.attempts) || stage.attempts.length !== 0
    || stage?.artifact !== null || stage?.inspection !== null
    || stage?.skipReason !== expectedReason
    || stage?.persistenceError !== null) {
    issues.push("skipped-image-shape-or-policy-invalid");
  }
  const expectedFingerprint = sha256R72V659(JSON.stringify({ method: "GET",
    url: row.imageUrl,
    headers: { accept: "image/jpeg",
      "user-agent": "SolarSim-MainlineA-R72-SourceAudit/1.0" } }));
  if (stage?.requestFingerprint !== expectedFingerprint) {
    issues.push("skipped-image-fingerprint-invalid");
  }
  return issues;
}

export function inspectAttemptR72V659(stage, row, kind) {
  const issues = [];
  const attempt = stage?.attempts?.[0];
  const url = stageUrl(row, kind);
  if (stage?.kind !== kind || stage?.requestUrl !== url
    || stage?.requestExecuted !== true || !Array.isArray(stage?.attempts)
    || stage.attempts.length !== 1 || stage?.skipReason !== null
    || stage?.requestFingerprint !== fingerprintR72V659(kind, url, row)) {
    return ["stage-request-contract-invalid"];
  }
  if (attempt?.kind !== kind || attempt?.requestUrl !== url
    || attempt?.number !== 1 || attempt?.retryCount !== 0
    || attempt?.requestExecuted !== true || !attempt?.collectionId
    || attempt?.requestFingerprint !== stage.requestFingerprint
    || !Number.isInteger(attempt?.timeoutMs) || attempt.timeoutMs < 1
    || attempt.timeoutMs > 120_000
    || !Number.isFinite(Date.parse(attempt?.startedAt))
    || !Number.isFinite(Date.parse(attempt?.endedAt))
    || Date.parse(attempt.startedAt) > Date.parse(attempt.endedAt)
    || !Array.isArray(attempt?.redirectChain)
    || attempt.redirectChain[0] !== url
    || !Array.isArray(attempt?.redirects)
    || attempt.redirects.length !== attempt.redirectChain.length - 1
    || attempt.redirectChain.some((item) =>
      !safeRequestUrlR72V659(kind, item, row))
    || attempt.redirects.some((item, index) =>
      item?.from !== attempt.redirectChain[index]
      || item?.to !== attempt.redirectChain[index + 1]
      || ![301, 302, 303, 307, 308].includes(item?.status))) {
    issues.push("attempt-timing-redirect-or-fingerprint-invalid");
  }
  if (stage.responseCaptured === 1) {
    if (attempt?.responseCaptured !== 1 || attempt?.httpStatus !== 200
      || attempt?.errorClass !== null || attempt?.errorMessage !== null
      || attempt?.timeout !== false || stage?.artifact == null
      || attempt?.rawArtifactPath !== stage?.artifact?.path
      || attempt?.rawSha256 !== stage?.artifact?.sha256
      || attempt?.responseBytes !== stage?.artifact?.bytes
      || attempt?.finalUrl !== stage?.artifact?.finalUrl
      || stage?.persistenceError !== null) issues.push("captured-attempt-invalid");
  } else if (stage.responseCaptured === 0) {
    if (attempt?.responseCaptured !== 0 || stage?.artifact !== null
      || stage?.inspection !== null || attempt?.rawArtifactPath !== null
      || attempt?.rawSha256 !== null || attempt?.responseBytes !== null
      || !attempt?.errorClass
      || attempt?.timeout !== (attempt?.errorClass === "timeout")) {
      issues.push("failed-attempt-fabricated-response");
    }
  } else issues.push("response-captured-invalid");
  return issues;
}

async function verifyStage(stage, row, kind) {
  if (kind === "image" && stage?.requestExecuted === false) {
    const issues = validateSkippedImageR72V659(stage, row);
    return { ok: issues.length === 0,
      issues, pin: null,
      inspection: null };
  }
  const issues = inspectAttemptR72V659(stage, row, kind);
  if (stage?.responseCaptured !== 1) {
    return { ok: issues.length === 0, issues, pin: null,
      inspection: null };
  }
  if (!stage?.artifact?.path || !SHA.test(stage?.artifact?.sha256 ?? "")) {
    return { ok: false, issues: [...issues, "artifact-pin-missing"],
      pin: null, inspection: null };
  }
  let raw = null;
  try { raw = await pin(stage.artifact.path); }
  catch { issues.push("raw-artifact-missing-or-unsafe"); }
  if (raw) {
    const expectedPath = artifactPathR72V659(row.id, kind, raw.sha256);
    if (!samePin(raw, stage.artifact) || raw.path !== expectedPath) {
      issues.push("raw-artifact-pin-mismatch");
    }
  }
  const observed = raw ? successInspection(kind, raw.body, row) : null;
  if (observed && !equalJson(observed, stage.inspection)) {
    issues.push("stored-inspection-drift");
  }
  if (observed && !observed.ok) issues.push("raw-inspection-invalid");
  if (raw && stage.artifact.contentType !== stage.attempts[0].contentType) {
    issues.push("content-type-drift");
  }
  if (raw && stage.artifact.finalUrl !== stage.attempts[0].finalUrl) {
    issues.push("final-url-drift");
  }
  return { ok: issues.length === 0, issues,
    pin: raw ? { path: raw.path, bytes: raw.bytes,
      sha256: raw.sha256 } : null, inspection: observed };
}

async function decodedPixels(relative) {
  const bytes = await readFile(insideRoot(relative));
  const image = sharp(bytes, { failOn: "error" });
  const metadata = await image.metadata();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height,
    channels: info.channels, decodedBytes: data.length,
    pixelSha256: sha256R72V659(data), format: metadata.format };
}

async function verifyCalifornia(row, expected) {
  const issues = [];
  if (!row.imageAcquisitionAllowed || !row.historicalLocal
    || expected.image?.pin == null) return { ok: false,
    issues: ["california-image-or-history-missing"] };
  let localPin = null;
  let officialPixels = null;
  let localPixels = null;
  try {
    localPin = await pin(row.historicalLocal.path);
    officialPixels = await decodedPixels(expected.image.pin.path);
    localPixels = await decodedPixels(row.historicalLocal.path);
  } catch (error) {
    issues.push(`image-decode-or-history-failed:${String(error?.message ?? error)}`);
  }
  if (localPin && (localPin.sha256 !== row.historicalLocal.sha256
    || localPin.bytes !== row.historicalLocal.bytes)) {
    issues.push("historical-local-pin-drift");
  }
  if (officialPixels && localPixels) {
    if (officialPixels.format !== "jpeg" || localPixels.format !== "jpeg"
      || officialPixels.width !== row.historicalLocal.width
      || officialPixels.height !== row.historicalLocal.height
      || officialPixels.width !== localPixels.width
      || officialPixels.height !== localPixels.height
      || officialPixels.channels !== localPixels.channels
      || officialPixels.pixelSha256 !== localPixels.pixelSha256) {
      issues.push("decoded-pixels-or-dimensions-mismatch");
    }
  }
  return { ok: issues.length === 0, issues,
    officialPixels, historicalPixels: localPixels,
    rawByteIdentical: Boolean(localPin
      && localPin.sha256 === expected.image.pin.sha256),
    decodedPixelIdentical: Boolean(officialPixels && localPixels
      && officialPixels.pixelSha256 === localPixels.pixelSha256) };
}

function expectedCounts(rows) {
  return { targets: rows.length,
    pagesCaptured: rows.filter((row) => row.page.artifact).length,
    pageIdentityVerified: rows.filter((row) =>
      row.page.inspection?.identityVerified).length,
    structuredSearchCaptured: rows.filter((row) => row.search.artifact).length,
    structuredSearchVerified: rows.filter((row) => row.search.inspection?.ok).length,
    assetManifestsCaptured: rows.filter((row) => row.asset.artifact).length,
    assetManifestsVerified: rows.filter((row) => row.asset.inspection?.ok).length,
    imageRequestsExecuted: rows.filter((row) => row.image.requestExecuted).length,
    imagesCaptured: rows.filter((row) => row.image.artifact).length,
    policyBlockedImageRequests: rows.filter((row) =>
      row.image.skipReason === "item-license-or-suitability-review-blocked").length,
    rightsSigned: 0, runtimeAdmitted: 0 };
}

function boundaryValid(boundary) {
  return boundary?.candidateOnly === true && boundary?.hold === true
    && boundary?.notAdmitted === true
    && boundary?.scientificPayloadWriteback === false
    && boundary?.rightsSignoff === "pending"
    && boundary?.publicWebRelease === "blocked";
}

export async function auditR72V659(ledgerRelative) {
  const issues = [];
  let ledgerPin = null;
  let ledger = null;
  try {
    ledgerPin = await pin(ledgerRelative);
    ledger = JSON.parse(ledgerPin.body.toString("utf8"));
  } catch (error) {
    return { schema: "mainline-a-r72-source-audit-v659",
      status: "blocked", issues: [`ledger-unreadable:${String(error?.message ?? error)}`],
      rows: [], counts: null };
  }
  const [expansionPin, licensePin] = await Promise.all([
    pin(R72_EXPANSION_PATH_V659), pin(R72_LICENSE_PATH_V659)]);
  const inputs = validateInputsR72V659(
    JSON.parse(expansionPin.body.toString("utf8")),
    JSON.parse(licensePin.body.toString("utf8")));
  if (!inputs.ok) issues.push(...inputs.issues);
  if (ledger.schema !== R72_SCHEMA_V659
    || ledgerRelative !== ledgerPathR72V659(ledger.runId)
    || !Number.isFinite(Date.parse(ledger.startedAt))
    || !Number.isFinite(Date.parse(ledger.endedAt))
    || Date.parse(ledger.startedAt) > Date.parse(ledger.endedAt)
    || !Array.isArray(ledger.rows) || ledger.rows.length !== 6
    || !boundaryValid(ledger.boundary)
    || !samePin(expansionPin, ledger.inputs?.expansion)
    || !samePin(licensePin, ledger.inputs?.license)) {
    issues.push("ledger-identity-input-or-boundary-invalid");
  }
  if (!equalJson(expectedCounts(ledger.rows ?? []), ledger.counts)) {
    issues.push("ledger-counts-invalid");
  }
  const metadataPins = [];
  for (const row of inputs.rows) {
    try {
      const current = await pin(row.metadata.path);
      metadataPins.push({ path: current.path, bytes: current.bytes,
        sha256: current.sha256 });
      if (current.sha256 !== row.metadata.sha256) {
        issues.push(`${row.id}:historical-metadata-drift`);
      }
    } catch { issues.push(`${row.id}:historical-metadata-missing`); }
  }
  if (!equalJson(metadataPins, ledger.inputs?.sourceMetadata)) {
    issues.push("historical-metadata-pins-invalid");
  }
  const auditedRows = [];
  for (const [index, row] of inputs.rows.entries()) {
    const recorded = ledger.rows?.[index];
    const rowIssues = [];
    if (recorded?.id !== row.id || recorded?.nasaId !== row.nasaId
      || recorded?.title !== row.title || recorded?.rank !== row.rank
      || recorded?.expectedCredit !== row.expectedCredit
      || recorded?.pageKind !== row.pageKind
      || recorded?.pageUrl !== row.pageUrl
      || recorded?.sourceImageUrl !== row.imageUrl
      || !equalJson(recorded?.historicalLocal, row.historicalLocal)
      || !equalJson(recorded?.sourceMetadata, row.metadata)
      || !equalJson(recorded?.blockers, row.blockers)
      || recorded?.imageAcquisitionAllowed !== row.imageAcquisitionAllowed
      || recorded?.acquisitionDecision !== row.acquisitionDecision
      || recorded?.rightsStatus !== "pending"
      || recorded?.runtimeAdmission !== "candidate-only"
      || recorded?.hold !== true || recorded?.notAdmitted !== true
      || recorded?.scientificPayloadWriteback !== false) {
      rowIssues.push("row-identity-policy-or-boundary-invalid");
    }
    const stages = {};
    for (const kind of STAGES) {
      stages[kind] = await verifyStage(recorded?.[kind], row, kind);
      rowIssues.push(...stages[kind].issues.map((issue) => `${kind}:${issue}`));
    }
    const image = row.imageAcquisitionAllowed
      ? await verifyCalifornia(row, stages)
      : { ok: recorded?.image?.requestExecuted === false,
        issues: recorded?.image?.requestExecuted === false ? []
          : ["blocked-image-request-executed"] };
    rowIssues.push(...image.issues);
    const expectedStatus = stages.image.pin && image.ok
      ? "source-and-image-captured-candidate"
      : stages.search.inspection?.ok && stages.asset.inspection?.ok
        && stages.page.inspection?.ok
        ? "structured-source-captured-image-hold"
        : "partial-source-attempt-ledger";
    if (recorded?.status !== expectedStatus) rowIssues.push("row-status-invalid");
    auditedRows.push({ id: row.id, nasaId: row.nasaId,
      title: row.title, rank: row.rank, expectedCredit: row.expectedCredit,
      pageKind: row.pageKind, pageUrl: row.pageUrl,
      imageUrl: row.imageUrl,
      imageAcquisitionAllowed: row.imageAcquisitionAllowed,
      blockers: row.blockers, status: expectedStatus,
      page: { pin: stages.page.pin, inspection: stages.page.inspection,
        attemptCount: recorded?.page?.attempts?.length ?? 0 },
      search: { pin: stages.search.pin, inspection: stages.search.inspection,
        attemptCount: recorded?.search?.attempts?.length ?? 0 },
      asset: { pin: stages.asset.pin, inspection: stages.asset.inspection,
        attemptCount: recorded?.asset?.attempts?.length ?? 0 },
      image: { pin: stages.image.pin,
        inspection: stages.image.inspection,
        requestExecuted: recorded?.image?.requestExecuted ?? false,
        skipReason: recorded?.image?.skipReason ?? null,
        attemptCount: recorded?.image?.attempts?.length ?? 0,
        comparison: row.imageAcquisitionAllowed ? image : null },
      historicalLocal: row.historicalLocal,
      rightsStatus: "pending", runtimeAdmission: "candidate-only",
      hold: true, notAdmitted: true, scientificPayloadWriteback: false,
      issues: rowIssues });
    issues.push(...rowIssues.map((issue) => `${row.id}:${issue}`));
  }
  const counts = { targets: auditedRows.length,
    structuredSearchVerified: auditedRows.filter((row) =>
      row.search.inspection?.ok).length,
    assetManifestsVerified: auditedRows.filter((row) =>
      row.asset.inspection?.ok).length,
    photojournalPageIdentities: auditedRows.filter((row) =>
      row.page.inspection?.identityVerified).length,
    genericLibraryPageShells: auditedRows.filter((row) =>
      row.pageKind === "library-shell" && row.page.pin).length,
    imagesCaptured: auditedRows.filter((row) => row.image.pin).length,
    blockedImageRequestsUnexecuted: auditedRows.filter((row) =>
      !row.imageAcquisitionAllowed && !row.image.requestExecuted).length,
    decodedPixelMatches: auditedRows.filter((row) =>
      row.image.comparison?.decodedPixelIdentical).length,
    rawByteMatches: auditedRows.filter((row) =>
      row.image.comparison?.rawByteIdentical).length,
    rightsSigned: 0, runtimeAdmitted: 0 };
  const full = issues.length === 0
    && counts.structuredSearchVerified === 6
    && counts.assetManifestsVerified === 6
    && counts.photojournalPageIdentities === 3
    && counts.genericLibraryPageShells === 3
    && counts.imagesCaptured === 1
    && counts.blockedImageRequestsUnexecuted === 5
    && counts.decodedPixelMatches === 1;
  return { schema: "mainline-a-r72-source-audit-v659",
    status: full ? "verified-six-structured-one-image-five-policy-holds-candidate"
      : "blocked-or-partial-candidate",
    issues, inputPins: { ledger: { path: ledgerPin.path,
      bytes: ledgerPin.bytes, sha256: ledgerPin.sha256 },
      expansion: { path: expansionPin.path, bytes: expansionPin.bytes,
        sha256: expansionPin.sha256 },
      license: { path: licensePin.path, bytes: licensePin.bytes,
        sha256: licensePin.sha256 }, sourceMetadata: metadataPins },
    decoder: { library: "sharp", sharpVersion: sharp.versions.sharp,
      vipsVersion: sharp.versions.vips, nodeVersion: process.version,
      platform: process.platform, architecture: process.arch },
    counts, rows: auditedRows,
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, rightsSignoff: "pending",
      publicWebRelease: "blocked" },
    claims: { copyrightApproval: false, scientificValidity: false,
      productionPerformance: false, realUserValidation: false,
      physicalMobile: false, publicWebReleaseApproved: false } };
}

export function overlayR72V659(audit, auditPin) {
  if (audit.status !== "verified-six-structured-one-image-five-policy-holds-candidate"
    || audit.rows.length !== 6 || audit.counts.imagesCaptured !== 1) {
    throw new Error("r72-source-v659:audit-not-admissible-as-candidate-overlay");
  }
  return { schema: "mainline-a-r72-expansion-overlay-v659",
    status: audit.status, audit: auditPin, counts: audit.counts,
    rows: audit.rows.map((row) => ({ id: row.id, nasaId: row.nasaId,
      title: row.title, rank: row.rank, expectedCredit: row.expectedCredit,
      pageKind: row.pageKind, pageUrl: row.pageUrl,
      imageUrl: row.imageUrl,
      imageAcquisitionAllowed: row.imageAcquisitionAllowed,
      blockers: row.blockers, status: row.status,
      pageIdentityVerified: row.page.inspection?.identityVerified ?? false,
      pageRaw: row.page.pin, searchRaw: row.search.pin,
      assetRaw: row.asset.pin,
      structuredSourceIdentityVerified: Boolean(row.search.inspection?.ok
        && row.asset.inspection?.ok),
      currentStructuredCreditVerified:
        row.search.inspection?.creditVerified ?? false,
      currentStructuredCreditLimitation:
        row.search.inspection?.creditLimitation ?? null,
      imageRaw: row.image.pin,
      imageRequestExecuted: row.image.requestExecuted,
      imageSkipReason: row.image.skipReason,
      imageAttemptCount: row.image.attemptCount,
      originalWidth: row.image.comparison?.officialPixels?.width ?? null,
      originalHeight: row.image.comparison?.officialPixels?.height ?? null,
      rawByteIdentical:
        row.image.comparison?.rawByteIdentical ?? false,
      decodedPixelIdentical:
        row.image.comparison?.decodedPixelIdentical ?? false,
      rightsStatus: "pending", runtimeAdmission: "candidate-only",
      hold: true, notAdmitted: true,
      scientificPayloadWriteback: false })),
    boundary: audit.boundary };
}

function argument(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1] ?? null;
}

async function cli(args) {
  const ledger = argument(args, "--ledger");
  if (!ledger) throw new Error("r72-source-v659:ledger-required");
  const result = await auditR72V659(ledger);
  const replay = argument(args, "--replay");
  if (replay) {
    const stored = JSON.parse((await readFile(insideRoot(replay))).toString("utf8"));
    if (!equalJson(stored, result)) {
      throw new Error("r72-source-v659:replay-drift");
    }
  }
  const output = argument(args, "--audit");
  if (output) {
    await writeFile(insideRoot(output), `${JSON.stringify(result, null, 2)}\n`,
      { flag: "wx" });
  }
  const overlay = argument(args, "--overlay");
  if (overlay) {
    if (!output) throw new Error("r72-source-v659:audit-output-required");
    const current = await pin(output);
    const projected = overlayR72V659(result,
      { path: output, bytes: current.bytes, sha256: current.sha256 });
    await writeFile(insideRoot(overlay), `${JSON.stringify(projected, null, 2)}\n`,
      { flag: "wx" });
  }
  process.stdout.write(`${JSON.stringify({ status: result.status,
    issues: result.issues, counts: result.counts,
    replay: Boolean(replay) })}\n`);
  if (result.issues.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
