import { createHash } from "node:crypto";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statfsSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { freemem } from "node:os";
import { dirname, resolve } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  auditSvoVisibleProfileV382,
  MEASURED_VISIBLE_SOURCE_PLAN_V382,
  parseMeasuredVisibleSourceDossierV382,
  type MeasuredVisibleSourceRecordV382,
} from "../app/lib/measuredVisibleSourceDossierV382";

const root = process.cwd();
const base = "dist/staging/measured-authority-v382-visible";
const paths = {
  checkpoint: `${base}/checkpoint.json`,
  manifest: `${base}/manifest.json`,
  negative: `${base}/attempt-1-negative.json`,
};
const MAXIMUM_SOURCE_BYTES = 32 * 1024 * 1024;
const MINIMUM_FREE_MEMORY_BYTES = 3 * 1024 ** 3;
const MINIMUM_FREE_DISK_BYTES = 30 * 1024 ** 3;
const shaBytes = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(
              ([key]) =>
                !["generatedAt", "fetchedAt", "artifactSha256"].includes(key),
            )
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value: unknown) =>
  shaBytes(JSON.stringify(canonicalize(value)));
const atomicJson = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};
const fileSha = (path: string) => {
  const hash = createHash("sha256");
  const bytes = readFileSync(resolve(root, path));
  hash.update(bytes);
  return hash.digest("hex");
};

function diskFreeBytes() {
  const stats = statfsSync(root);
  return Number(stats.bavail) * Number(stats.bsize);
}

function validatePublishedSource(
  kind: (typeof MEASURED_VISIBLE_SOURCE_PLAN_V382)[number]["expectedContentKind"],
  path: string,
) {
  const bytes = readFileSync(resolve(root, path));
  if (bytes.byteLength <= 0 || bytes.byteLength > MAXIMUM_SOURCE_BYTES) {
    throw new Error(`v382-published-size:${path}`);
  }
  if (kind === "pdf" && bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error(`v382-pdf-magic:${path}`);
  }
  const text = kind === "pdf" ? "" : bytes.toString("utf8");
  if (kind === "votable") auditSvoVisibleProfileV382(text);
  if (kind === "html" && !/<html[\s>]/i.test(text)) {
    throw new Error(`v382-html-magic:${path}`);
  }
  if (path.endsWith("wfc3-uvis-field-of-view-and-distortion.html") && !/geometric distortion/i.test(text)) {
    throw new Error("v382-geometry-handbook-content");
  }
  if (path.endsWith("wfc3-uvis-detector-performance.html") && ![/read noise/i, /dark current/i, /gain/i].every((pattern) => pattern.test(text))) {
    throw new Error("v382-detector-handbook-content");
  }
  if (path.endsWith("wfc3-uvis-spectral-elements.html") && !/F350LP/i.test(text)) {
    throw new Error("v382-spectral-handbook-content");
  }
  if (path.endsWith("stsci-copyright.html") && !/copyright/i.test(text)) {
    throw new Error("v382-terms-content");
  }
}

async function fetchOnce(
  source: (typeof MEASURED_VISIBLE_SOURCE_PLAN_V382)[number],
): Promise<MeasuredVisibleSourceRecordV382> {
  const relativePath = `${base}/raw/${source.fileName}`;
  const target = resolve(root, relativePath);
  const temporary = `${target}.part`;
  mkdirSync(dirname(target), { recursive: true });
  if (existsSync(target) || existsSync(temporary)) {
    throw new Error(`v382-source-already-present:${source.id}`);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  let contentType = "";
  let bytes = 0;
  const hash = createHash("sha256");
  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "OrbitAtlas-v382-source-dossier/1.0" },
    });
    if (!response.ok || !response.body) {
      throw new Error(`v382-http:${source.id}:${response.status}`);
    }
    contentType = response.headers.get("content-type") ?? "";
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MAXIMUM_SOURCE_BYTES) {
      throw new Error(`v382-content-length:${source.id}`);
    }
    const meter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        bytes += chunk.byteLength;
        if (bytes > MAXIMUM_SOURCE_BYTES) {
          callback(new Error(`v382-stream-size:${source.id}`));
          return;
        }
        hash.update(chunk);
        callback(null, chunk);
      },
    });
    await pipeline(
      Readable.fromWeb(response.body as never),
      meter,
      createWriteStream(temporary, { flags: "wx" }),
    );
    if (bytes <= 0) throw new Error(`v382-empty:${source.id}`);
    renameSync(temporary, target);
    validatePublishedSource(source.expectedContentKind, relativePath);
    const record = Object.freeze({
      id: source.id,
      path: relativePath,
      sourceUrl: source.url,
      sourceRole: source.sourceRole,
      evidenceGrade: source.evidenceGrade,
      contentType,
      bytes,
      sha256: hash.digest("hex"),
      fetchedAt: new Date().toISOString(),
      validated: true as const,
    });
    atomicJson(`${relativePath}.sha256.json`, {
      version: "v382-source-sidecar-v1",
      sourceId: source.id,
      path: relativePath,
      bytes,
      sha256: record.sha256,
      sourceUrl: source.url,
    });
    return record;
  } catch (error) {
    if (existsSync(temporary)) {
      const metadata = statSync(temporary);
      if (metadata.size === 0) unlinkSync(temporary);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function validateExistingManifest() {
  const document = parseMeasuredVisibleSourceDossierV382(
    JSON.parse(readFileSync(resolve(root, paths.manifest), "utf8")),
  );
  if (canonicalSha(document) !== document.artifactSha256) {
    throw new Error("v382-existing-manifest-sha");
  }
  for (const record of document.sources) {
    if (!existsSync(resolve(root, record.path)) || fileSha(record.path) !== record.sha256) {
      throw new Error(`v382-existing-source-sha:${record.id}`);
    }
  }
  console.log(JSON.stringify({ status: document.status, artifactSha256: document.artifactSha256, sourceCount: document.sourceCount, profileRows: document.profile.rowCount, networkAttemptedThisRun: false, authorityGranted: document.authorityGranted }, null, 2));
}

async function main() {
  if (existsSync(resolve(root, paths.manifest))) {
    validateExistingManifest();
    return;
  }
  if (existsSync(resolve(root, paths.checkpoint))) {
    const checkpoint = JSON.parse(readFileSync(resolve(root, paths.checkpoint), "utf8"));
    if (checkpoint.attemptConsumed === true) {
      throw new Error("v382-attempt-already-consumed-no-automatic-retry");
    }
  }
  const memory = freemem();
  const disk = diskFreeBytes();
  if (memory < MINIMUM_FREE_MEMORY_BYTES || disk < MINIMUM_FREE_DISK_BYTES) {
    atomicJson(`${base}/preflight.json`, {
      version: "v382-source-preflight-v1",
      generatedAt: new Date().toISOString(),
      status: "resource-preflight-not-consumed",
      freeMemoryBytes: memory,
      freeDiskBytes: disk,
      minimumFreeMemoryBytes: MINIMUM_FREE_MEMORY_BYTES,
      minimumFreeDiskBytes: MINIMUM_FREE_DISK_BYTES,
      attemptConsumed: false,
      networkAttempted: false,
    });
    throw new Error("v382-resource-preflight-not-consumed");
  }
  const records: MeasuredVisibleSourceRecordV382[] = [];
  atomicJson(paths.checkpoint, {
    version: "v382-source-fetch-checkpoint-v1",
    generatedAt: new Date().toISOString(),
    status: "attempt-1-running",
    attemptConsumed: true,
    networkAttempted: false,
    automaticRetryApplied: false,
    completedSourceIds: [],
    nextSourceId: MEASURED_VISIBLE_SOURCE_PLAN_V382[0].id,
  });
  try {
    for (const source of MEASURED_VISIBLE_SOURCE_PLAN_V382) {
      const record = await fetchOnce(source);
      records.push(record);
      atomicJson(paths.checkpoint, {
        version: "v382-source-fetch-checkpoint-v1",
        generatedAt: new Date().toISOString(),
        status: records.length === MEASURED_VISIBLE_SOURCE_PLAN_V382.length ? "attempt-1-downloads-complete" : "attempt-1-running",
        attemptConsumed: true,
        networkAttempted: true,
        automaticRetryApplied: false,
        completedSourceIds: records.map((entry) => entry.id),
        nextSourceId: MEASURED_VISIBLE_SOURCE_PLAN_V382[records.length]?.id ?? null,
      });
    }
    const profilePath = records.find((record) => record.id === "svo-f350lp-profile")!.path;
    const profile = auditSvoVisibleProfileV382(readFileSync(resolve(root, profilePath), "utf8"));
    const unsigned = {
      version: "v382-visible-measured-source-dossier-v1" as const,
      generatedAt: new Date().toISOString(),
      status: "source-dossier-qualified-visible-normalization-pending-authority-not-granted" as const,
      candidate: Object.freeze({ bandId: "visible" as const, facility: "HST" as const, instrument: "WFC3/UVIS1" as const, spectralElement: "F350LP" as const, identityScope: "one-visible-detector-response-plus-matching-wfc3-uvis1-geometry" as const }),
      sources: Object.freeze(records),
      sourceCount: 7 as const,
      profile,
      sourceQuality: Object.freeze({ primaryCalibrationReportCount: 2 as const, officialHandbookSourceCount: 3 as const, curatedSecondaryProfileCount: 1 as const, governingTermsSourceCount: 1 as const, institutionalConflictDisclosed: "stsci-documents-and-calibrates-the-instrument-it-operates-for-nasa" as const, sourceExistenceVerified: true as const }),
      licenseBoundary: Object.freeze({ termsSourcePresent: true as const, stagingOnly: true as const, redistributionQualified: false as const, runtimePackagingAllowed: false as const, reason: "source-specific-redistribution-and-attribution-review-required-before-publication" as const }),
      missingForMeasuredAuthority: Object.freeze(["normalized-per-band-throughput-with-independent-reconstruction", "traceable-repeat-detector-noise-measurements", "traceable-repeat-collecting-area-and-plate-scale-measurements", "qualified-same-instrument-detector-and-geometry-authority-pointers"] as const),
      nextCommand: "npm run atlas -- relativity measurement-authority-v383-normalize-visible" as const,
      authorityGranted: false as const,
      measuredBandAuthorityCount: 0 as const,
      observedCountsAvailable: false as const,
      syntheticFallbackUsed: false as const,
      sciencePayloadMutationAllowed: false as const,
      cinematicConsumerAllowed: false as const,
      attemptConsumed: true as const,
      networkAttempted: true as const,
      automaticRetryApplied: false as const,
      formalProductPointer: "v263" as const,
      denseCampaignStatus: "incomplete-0-of-49" as const,
      browserQualification: "not-run" as const,
    };
    const dossier = parseMeasuredVisibleSourceDossierV382({ ...unsigned, artifactSha256: canonicalSha(unsigned) });
    atomicJson(paths.manifest, dossier);
    atomicJson(paths.checkpoint, {
      version: "v382-source-fetch-checkpoint-v1",
      generatedAt: new Date().toISOString(),
      status: "attempt-1-qualified-source-dossier",
      attemptConsumed: true,
      networkAttempted: true,
      automaticRetryApplied: false,
      completedSourceIds: records.map((entry) => entry.id),
      nextSourceId: null,
      manifestArtifactSha256: dossier.artifactSha256,
    });
    console.log(JSON.stringify({ status: dossier.status, artifactSha256: dossier.artifactSha256, sourceCount: dossier.sourceCount, profileRows: dossier.profile.rowCount, visibleCoverage400To700Nm: dossier.profile.visibleCoverage400To700Nm, measuredQeStatementPresent: dossier.profile.measuredQeStatementPresent, authorityGranted: dossier.authorityGranted, runtimePackagingAllowed: dossier.licenseBoundary.runtimePackagingAllowed }, null, 2));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown-v382-source-fetch-error";
    atomicJson(paths.negative, {
      version: "v382-visible-source-fetch-negative-v1",
      generatedAt: new Date().toISOString(),
      status: "attempt-1-failed-no-automatic-retry",
      reason,
      completedSources: records.map((record) => ({ id: record.id, path: record.path, bytes: record.bytes, sha256: record.sha256 })),
      attemptConsumed: true,
      networkAttempted: true,
      automaticRetryApplied: false,
      authorityGranted: false,
      runtimePackagingAllowed: false,
      formalProductPointer: "v263",
      denseCampaignStatus: "incomplete-0-of-49",
    });
    atomicJson(paths.checkpoint, {
      version: "v382-source-fetch-checkpoint-v1",
      generatedAt: new Date().toISOString(),
      status: "attempt-1-failed-no-automatic-retry",
      reason,
      attemptConsumed: true,
      networkAttempted: true,
      automaticRetryApplied: false,
      completedSourceIds: records.map((record) => record.id),
      nextSourceId: MEASURED_VISIBLE_SOURCE_PLAN_V382[records.length]?.id ?? null,
    });
    throw error;
  }
}

void main();
