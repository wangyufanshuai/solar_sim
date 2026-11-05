const ALLOWED_ASSET_HOSTS_V592 = new Set(["images-api.nasa.gov", "images-assets.nasa.gov"]);

function assertV592(condition, message) {
  if (!condition) throw new Error(message);
}

function parseAllowedUrlV592(raw, policyLabel) {
  const url = new URL(raw);
  assertV592(ALLOWED_ASSET_HOSTS_V592.has(url.hostname), `v592-deep-space-${policyLabel}-host:${url.hostname}`);
  assertV592(!url.username && !url.password && !url.port, `v592-deep-space-${policyLabel}-credentials`);
  assertV592(url.hash === "", `v592-deep-space-${policyLabel}-fragment`);
  return url;
}

export function validateDeepSpaceAssetManifestUrlV592(raw) {
  const url = parseAllowedUrlV592(raw, "asset-manifest");
  assertV592(url.protocol === "https:", `v592-deep-space-asset-manifest-protocol:${url.protocol}`);
  assertV592(url.pathname.endsWith("/collection.json"), `v592-deep-space-asset-manifest-path:${url.pathname}`);
  return url;
}

function safeFilenameV592(url) {
  const encoded = url.pathname.split("/").pop() ?? "";
  const filename = decodeURIComponent(encoded);
  assertV592(filename.length > 0, "v592-deep-space-asset-file-empty-name");
  assertV592(!filename.includes("/") && !filename.includes("\\") && filename !== "." && filename !== "..", "v592-deep-space-asset-file-name");
  return filename;
}

export function classifyDeepSpaceAssetMetadataUrlV592(raw) {
  const url = parseAllowedUrlV592(raw, "asset-file-metadata");
  assertV592(url.protocol === "http:" || url.protocol === "https:", `v592-deep-space-asset-file-metadata-protocol:${url.protocol}`);
  const httpsCandidate = new URL(url.href);
  httpsCandidate.protocol = "https:";
  const lower = url.pathname.toLowerCase();
  return {
    url: url.href,
    host: url.hostname,
    filename: safeFilenameV592(url),
    candidateRole: lower.includes("~orig") ? "original"
      : lower.includes("~large") ? "large"
        : lower.includes("~medium") ? "medium"
          : lower.includes("~small") ? "small"
            : lower.includes("~thumb") ? "thumbnail" : "other",
    extension: lower.match(/\.([a-z0-9]+)$/)?.[1] ?? "unknown",
    metadataTransport: url.protocol === "https:" ? "https-metadata-url" : "insecure-metadata-url",
    httpsCandidate: httpsCandidate.href,
    httpsCandidateRequested: false,
    payloadAdmission: "requires-explicit-https-acquisition",
    metadataOnly: true,
  };
}

export function summarizeDeepSpaceAssetMetadataV592(files) {
  const candidates = files.filter((file) => file.candidateRole === "original" || file.candidateRole === "large");
  return {
    fileCount: files.length,
    originalCandidateCount: files.filter((file) => file.candidateRole === "original").length,
    largeCandidateCount: files.filter((file) => file.candidateRole === "large").length,
    insecureMetadataUrlCount: files.filter((file) => file.metadataTransport === "insecure-metadata-url").length,
    explicitHttpsAcquisitionCandidateCount: candidates.filter((file) => file.httpsCandidate.startsWith("https://")).length,
    payloadAdmission: candidates.length > 0 ? "requires-explicit-https-acquisition" : "blocked-no-original-or-large-candidate",
  };
}
