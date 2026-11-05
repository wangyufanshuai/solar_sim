export const NEBULA_RIGHTS_CLOSURE_SCHEMA_V627 = "mainline-a-nebula-rights-closure-v627" as const;
export const NEBULA_RIGHTS_CLOSURE_REPLAY_SCHEMA_V627 = "mainline-a-nebula-rights-closure-replay-v627" as const;
export const NEBULA_RIGHTS_CLOSURE_BOUNDARY_V627 = Object.freeze({
  candidateOnly: true,
  hold: true,
  notAdmitted: true,
  scientificPayloadWriteback: false,
  runtimeWrites: false,
  measurementWrites: false,
});

export const NEBULA_RIGHTS_STATUSES_V627 = ["pending", "verified", "rejected"] as const;
export type NebulaRightsStatusV627 = (typeof NEBULA_RIGHTS_STATUSES_V627)[number];
export const NEBULA_SIGNOFF_STATUSES_V627 = ["pending", "signed", "rejected"] as const;
export type NebulaSignoffStatusV627 = (typeof NEBULA_SIGNOFF_STATUSES_V627)[number];
export const NEBULA_CLOSURE_STATUSES_V627 = [
  "ready-for-signoff",
  "rights-signoff-pending",
  "source-pending",
  "artifact-pending",
  "blocked",
] as const;
export type NebulaClosureStatusV627 = (typeof NEBULA_CLOSURE_STATUSES_V627)[number];
export const NEBULA_CLOSURE_PHASES_V627 = ["source", "artifact", "payload", "rights", "visual", "admission"] as const;
export type NebulaClosurePhaseV627 = (typeof NEBULA_CLOSURE_PHASES_V627)[number];
export const NEBULA_CLOSURE_BLOCKERS_V627 = [
  "source-url-invalid",
  "source-page-missing",
  "source-credit-missing",
  "license-policy-missing",
  "license-identity-missing",
  "source-digest-invalid",
  "source-page-digest-invalid",
  "source-evidence-missing",
  "source-evidence-unverified",
  "source-evidence-binding-invalid",
  "artifact-missing",
  "artifact-path-invalid",
  "artifact-digest-invalid",
  "artifact-size-invalid",
  "artifact-dimensions-invalid",
  "artifact-format-invalid",
  "artifact-source-mismatch",
  "artifact-bytes-mismatch",
  "artifact-sha256-mismatch",
  "network-response-missing",
  "network-response-invalid",
  "network-error-present",
  "attempt-ledger-missing",
  "attempt-time-invalid",
  "request-fingerprint-invalid",
  "unsafe-redirect",
  "rights-review-pending",
  "rights-rejected",
  "rights-evidence-missing",
  "rights-evidence-path-invalid",
  "rights-evidence-unverified",
  "rights-evidence-digest-invalid",
  "rights-license-mismatch",
  "rights-policy-mismatch",
  "rights-reviewer-missing",
  "rights-reviewer-invalid",
  "rights-reviewed-at-missing",
  "rights-credit-unconfirmed",
  "rights-signoff-pending",
  "rights-signoff-rejected",
  "visual-signoff-pending",
  "visual-signoff-rejected",
  "synthetic-prohibited",
  "fixture-prohibited",
  "candidate-boundary-open",
  "scientific-writeback-open",
  "runtime-write-open",
  "duplicate-candidate-id",
  "schema-invalid",
] as const;
export type NebulaClosureBlockerV627 = (typeof NEBULA_CLOSURE_BLOCKERS_V627)[number];

export type NebulaClosureArtifactV627 = Readonly<{
  path: string | null;
  sha256: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  format: string | null;
  synthetic: boolean;
  fixture: boolean;
}>;

export type NebulaClosureAttemptV627 = Readonly<{
  fingerprintScheme?: "v623-get-accept" | "v624-canonical-headers" | "unknown";
  ledgerOrigin?: "v623" | "v624";
  attempt: number;
  startedAt: string;
  endedAt: string | null;
  timeout: boolean;
  retryCount: number;
  httpStatus: number | null;
  contentType: string | null;
  requestUrl: string;
  finalUrl: string | null;
  redirectChain: readonly string[];
  errorClass: string | null;
  requestFingerprint: string;
  responseCaptured: 0 | 1;
  responseBytes: number | null;
  rawArtifactPath: string | null;
  rawPageSha256: string | null;
}>;

export type NebulaClosureRightsV627 = Readonly<{
  declaredStatus?: NebulaRightsStatusV627;
  declaredSignoff?: NebulaSignoffStatusV627;
  status: NebulaRightsStatusV627;
  license: string | null;
  policyUrl: string | null;
  evidencePath: string | null;
  evidenceSha256: string | null;
  reviewer: string | null;
  reviewedAt: string | null;
  creditConfirmed: boolean;
  signoff: NebulaSignoffStatusV627;
  notes: string | null;
}>;

export type NebulaClosureInputV627 = Readonly<{
  sourceEvidence?: Readonly<{ path: string; sha256: string; candidateId: string; sourceUrl: string; sourcePageUrl: string }> | null;
  declaredVisualSignoff?: NebulaSignoffStatusV627;
  id: string;
  title: string;
  rank: number | null;
  sourceUrl: string;
  sourcePageUrl: string | null;
  sourcePageSha256: string | null;
  sourceCredit: string | null;
  declaredLicense: string | null;
  licensePolicyUrl: string | null;
  sourceSha256: string | null;
  artifact: NebulaClosureArtifactV627;
  attempts: readonly NebulaClosureAttemptV627[];
  rights: NebulaClosureRightsV627;
  visualSignoff: NebulaSignoffStatusV627;
  candidateOnly: boolean;
  runtimeAdmission: string;
  measurementAdmission: string;
  scientificPayloadWriteback: boolean;
  runtimeWrites: boolean;
  measurementWrites: boolean;
  sourceSchema: string | null;
  sourcePath: string | null;
}>;

export type NebulaClosureStateV627 = Readonly<{
  sourceEvidence?: NebulaClosureInputV627["sourceEvidence"];
  sourcePageSha256: string | null;
  declaredVisualSignoff?: NebulaSignoffStatusV627;
  evidenceScope: "metadata-only-no-disk-verification";
  schema: typeof NEBULA_RIGHTS_CLOSURE_SCHEMA_V627;
  id: string;
  title: string;
  rank: number | null;
  sourceUrl: string;
  sourcePageUrl: string | null;
  sourceCredit: string | null;
  declaredLicense: string | null;
  licensePolicyUrl: string | null;
  sourceSha256: string | null;
  artifact: NebulaClosureArtifactV627;
  attempts: readonly NebulaClosureAttemptV627[];
  rights: NebulaClosureRightsV627;
  visualSignoff: NebulaSignoffStatusV627;
  candidateOnly: boolean;
  runtimeAdmission: string;
  measurementAdmission: string;
  scientificPayloadWriteback: boolean;
  runtimeWrites: boolean;
  measurementWrites: boolean;
  sourceSchema: string | null;
  sourcePath: string | null;
  sourceClosure: "verified" | "pending" | "invalid";
  artifactClosure: "verified" | "pending" | "invalid";
  payloadIntegrity: "verified" | "pending" | "invalid";
  rightsClosure: "verified" | "pending" | "rejected";
  status: NebulaClosureStatusV627;
  blockers: readonly NebulaClosureBlockerV627[];
  fingerprint: string;
}>;

export type NebulaClosureAssessmentV627 = Readonly<{
  id: string;
  sourceClosure: NebulaClosureStateV627["sourceClosure"];
  artifactClosure: NebulaClosureStateV627["artifactClosure"];
  payloadIntegrity: NebulaClosureStateV627["payloadIntegrity"];
  rightsClosure: NebulaClosureStateV627["rightsClosure"];
  sourceVerified: boolean;
  rightsPending: boolean;
  rightsSigned: boolean;
  visualSigned: boolean;
  candidateOnly: boolean;
  status: NebulaClosureStatusV627;
  blockers: readonly NebulaClosureBlockerV627[];
  fingerprint: string;
}>;

export type NebulaClosureReplayRowV627 = Readonly<{
  id: string;
  phase: NebulaClosurePhaseV627;
  state: "verified" | "pending" | "rejected" | "closed";
  observed: string;
  blockers: readonly NebulaClosureBlockerV627[];
  fingerprint: string;
}>;

export type NebulaClosureReplayV627 = Readonly<{
  schema: typeof NEBULA_RIGHTS_CLOSURE_REPLAY_SCHEMA_V627;
  generatedAt: string;
  closureDigest: string;
  rows: readonly NebulaClosureReplayRowV627[];
  counts: Readonly<{
    candidates: number;
    sourceVerified: number;
    artifactVerified: number;
    payloadVerified: number;
    rightsVerified: number;
    rightsPending: number;
    signoffPending: number;
    blocked: number;
  }>;
  boundary: typeof NEBULA_RIGHTS_CLOSURE_BOUNDARY_V627;
}>;

export type NebulaClosureBatchV627 = Readonly<{
  schema: typeof NEBULA_RIGHTS_CLOSURE_SCHEMA_V627;
  generatedAt: string;
  source: Readonly<{ path: string | null; schema: string | null }>;
  records: readonly NebulaClosureStateV627[];
  replay: NebulaClosureReplayV627;
  digest: string;
  boundary: typeof NEBULA_RIGHTS_CLOSURE_BOUNDARY_V627;
}>;

const SHA256_V627 = /^[a-f0-9]{64}$/i;
const DATE_V627 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const IMAGE_MIME_V627 = /^image\/(?:jpeg|jpg|png|webp|tiff)(?:;|$)/i;
const HTTPS_V627 = /^https:\/\//i;
const NASA_HOST_V627 = "images-assets.nasa.gov";
const NASA_POLICY_V627 = "https://www.nasa.gov/nasa-brand-center/images-and-media/";
const ARTIFACT_ROOT_V627 = "docs/release/v607/nebula-image-artifacts/";
const POSITIVE_FORMATS_V627 = new Set(["jpg", "jpeg", "png", "webp", "tiff"]);
const ALLOWED_NETWORK_ERROR_V627 = new Set(["timeout", "dns", "tls", "http", "content-type", "payload", "unknown", "network-not-run"]);

function freeze<T>(value: T): T {
  return Object.freeze(value);
}

function unique<T>(values: readonly T[]): T[] {
  return values.filter((value, index, list) => list.indexOf(value) === index);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nullableText(value: unknown): string | null {
  return hasText(value) ? value.trim() : null;
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function safeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function validSha(value: string | null): boolean {
  return value !== null && SHA256_V627.test(value);
}

function validHttps(value: string | null): boolean {
  if (!value || !HTTPS_V627.test(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname.length > 0 && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function validSourceHost(value: string | null): boolean {
  try {
    const url = new URL(value as string);
    return validHttps(value) && url.hostname.toLocaleLowerCase() === NASA_HOST_V627 && !url.port && !url.hash;
  } catch {
    return false;
  }
}

function validSourcePage(value: string): boolean {
  if (!validHttps(value)) return false;
  const url = new URL(value);
  return (url.hostname === "nasa.gov" || url.hostname.endsWith(".nasa.gov"))
    && !url.port && !url.hash && !/(?:fixture|mock|placeholder|example|synthetic)/i.test(url.pathname);
}

function validEvidencePath(value: string): boolean {
  return value.startsWith("docs/release/") && !/[\\\\:\u0000-\u001f%]/.test(value)
    && value.split("/").every((part) => part !== "." && part !== ".." && part.length > 0);
}

function validPolicyUrl(value: string | null): boolean {
  return validHttps(value) && value?.replace(/\/$/, "") === NASA_POLICY_V627.replace(/\/$/, "");
}

function validArtifactPath(value: string | null): boolean {
  if (!value || value.includes("\\") || value.includes(":")) return false;
  if (!value.startsWith(ARTIFACT_ROOT_V627)) return false;
  return value.split("/").every((part) => part.length > 0 && part !== "." && part !== "..");
}

function normalizedFormat(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.toLocaleLowerCase().replace(/^image\//, "").split(";")[0].trim();
  return POSITIVE_FORMATS_V627.has(normalized) ? normalized : null;
}

function sortedValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedValue);
  if (!value || typeof value !== "object") return value;
  const object = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, sortedValue(object[key])]));
}

const SHA256_K_V627 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function sha256BytesV627(input: Uint8Array): Uint8Array {
  const bitLength = input.length * 8;
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);
  let h0 = 0x6a09e667; let h1 = 0xbb67ae85; let h2 = 0x3c6ef372; let h3 = 0xa54ff53a;
  let h4 = 0x510e527f; let h5 = 0x9b05688c; let h6 = 0x1f83d9ab; let h7 = 0x5be0cd19;
  const words = new Uint32Array(64);
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4);
    for (let index = 16; index < 64; index += 1) {
      const value = words[index - 15]; const right = words[index - 2];
      const sigma0 = ((value >>> 7) | (value << 25)) ^ ((value >>> 18) | (value << 14)) ^ (value >>> 3);
      const sigma1 = ((right >>> 17) | (right << 15)) ^ ((right >>> 19) | (right << 13)) ^ (right >>> 10);
      words[index] = (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
    }
    let a = h0; let b = h1; let c = h2; let d = h3; let e = h4; let f = h5; let g = h6; let h = h7;
    for (let index = 0; index < 64; index += 1) {
      const sigma1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const choose = (e & f) ^ (~e & g);
      const temp1 = (h + sigma1 + choose + SHA256_K_V627[index] + words[index]) >>> 0;
      const sigma0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sigma0 + majority) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  const output = new Uint8Array(32); const result = [h0, h1, h2, h3, h4, h5, h6, h7];
  result.forEach((word, index) => { output[index * 4] = word >>> 24; output[index * 4 + 1] = word >>> 16; output[index * 4 + 2] = word >>> 8; output[index * 4 + 3] = word; });
  return output;
}

export function nebulaRightsClosureDigestV627(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(sortedValue(value)));
  return nebulaRightsClosureBytesSha256V627(bytes);
}

export function nebulaRightsClosureBytesSha256V627(bytes: Uint8Array): string {
  return Array.from(sha256BytesV627(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function nebulaRightsClosureV623RequestFingerprintV627(url: string): string {
  return nebulaRightsClosureBytesSha256V627(new TextEncoder().encode(`GET ${url} accept=image/jpeg,image/png,image/*`));
}

export function nebulaRightsClosureRequestFingerprintV627(url: string): string {
  return nebulaRightsClosureDigestV627({ method: "GET", url, headers: { accept: "image/jpeg,image/png,image/webp", "user-agent": "SolarSim-MainlineA-R64/1.0" } });
}

function readObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}: object required`);
  return value as Record<string, unknown>;
}

function readArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label}: array required`);
  return value;
}

function readStatus(value: unknown): NebulaRightsStatusV627 {
  return NEBULA_RIGHTS_STATUSES_V627.includes(value as NebulaRightsStatusV627) ? value as NebulaRightsStatusV627 : "pending";
}

function readSignoff(value: unknown): NebulaSignoffStatusV627 {
  return NEBULA_SIGNOFF_STATUSES_V627.includes(value as NebulaSignoffStatusV627) ? value as NebulaSignoffStatusV627 : "pending";
}

function normalizeArtifact(value: unknown): NebulaClosureArtifactV627 {
  const object = readObject(value, "artifact");
  return freeze({
    path: nullableText(object.path ?? object.localPath),
    sha256: nullableText(object.sha256),
    bytes: safeInteger(object.bytes) ? object.bytes as number : null,
    width: safeInteger(object.width) ? object.width as number : null,
    height: safeInteger(object.height) ? object.height as number : null,
    format: nullableText(object.format),
    synthetic: object.synthetic === true,
    fixture: object.fixture === true,
  });
}

function normalizeAttempt(value: unknown, index: number, sourceUrl: string, scheme: NebulaClosureAttemptV627["fingerprintScheme"]): NebulaClosureAttemptV627 {
  const object = readObject(value, `attempt[${index}]`);
  const attempt = safeInteger(object.attempt) ? object.attempt as number : index + 1;
  const requestUrl = nullableText(object.requestUrl) ?? sourceUrl;
  return freeze({
    fingerprintScheme: object.fingerprintScheme === "v623-get-accept" || object.fingerprintScheme === "v624-canonical-headers" ? object.fingerprintScheme : scheme ?? "unknown",
    ledgerOrigin: object.ledgerOrigin === "v623" || scheme === "v623-get-accept" ? "v623" : "v624",
    attempt,
    startedAt: nullableText(object.startedAt) ?? "",
    endedAt: nullableText(object.endedAt),
    timeout: object.timeout === true,
    retryCount: safeInteger(object.retryCount) ? object.retryCount as number : Math.max(0, attempt - 1),
    httpStatus: safeInteger(object.httpStatus) ? object.httpStatus as number : null,
    contentType: nullableText(object.contentType),
    requestUrl,
    finalUrl: nullableText(object.finalUrl),
    redirectChain: freeze(Array.isArray(object.redirectChain) ? object.redirectChain.filter(hasText).map((entry) => entry.trim()) : []),
    errorClass: nullableText(object.errorClass),
    requestFingerprint: nullableText(object.requestFingerprint) ?? "",
    responseCaptured: object.responseCaptured === 1 ? 1 : 0,
    responseBytes: safeInteger(object.responseBytes) ? object.responseBytes as number : null,
    rawArtifactPath: nullableText(object.rawArtifactPath),
    rawPageSha256: nullableText(object.rawPageSha256),
  });
}

function normalizeRights(value: unknown): NebulaClosureRightsV627 {
  const object = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const declaredStatus = readStatus(object.declaredStatus ?? object.status);
  const declaredSignoff = readSignoff(object.declaredSignoff ?? object.signoff ?? (object.decision === "cleared" ? "signed" : undefined));
  return freeze({
    declaredStatus,
    declaredSignoff,
    status: declaredStatus === "rejected" ? "rejected" : "pending",
    license: nullableText(object.license ?? object.declaredLicense),
    policyUrl: nullableText(object.policyUrl ?? object.licenseUrl),
    evidencePath: nullableText(object.evidencePath ?? object.rightsEvidencePath),
    evidenceSha256: nullableText(object.evidenceSha256 ?? object.rightsPageHtmlSha256),
    reviewer: nullableText(object.reviewer ?? object.owner),
    reviewedAt: nullableText(object.reviewedAt),
    creditConfirmed: object.creditConfirmed === true,
    signoff: declaredSignoff === "rejected" ? "rejected" : "pending",
    notes: nullableText(object.notes),
  });
}

export function normalizeNebulaRightsClosureInputV627(value: unknown): NebulaClosureInputV627 {
  const object = readObject(value, "nebula closure input");
  const source = object.source && typeof object.source === "object" ? object.source as Record<string, unknown> : object;
  const network = object.network && typeof object.network === "object" ? object.network as Record<string, unknown> : object;
  const sourceUrl = nullableText(source.url ?? source.sourceUrl) ?? "";
  const artifact = normalizeArtifact(object.artifact ?? network.artifact ?? {});
  const attemptsRaw = Array.isArray(network.attempts) ? network.attempts : (Array.isArray(object.attempts) ? object.attempts : []);
  const sourceSchema = nullableText(object.sourceSchema ?? object.schema);
  const scheme = sourceSchema?.startsWith("mainline-a-nebula-image-attempt-ledger-v623") ? "v623-get-accept" : sourceSchema?.startsWith("mainline-a-nebula-batch-v624") ? "v624-canonical-headers" : "unknown";
  const attempts = freeze(attemptsRaw.map((attempt, index) => normalizeAttempt(attempt, index, sourceUrl, scheme)));
  const rights = normalizeRights(object.rights);
  const nestedBoundary = object.boundary && typeof object.boundary === "object" ? object.boundary as Record<string, unknown> : {};
  const boundaryLayers = [object, nestedBoundary];
  const rawEvidence = source.sourceEvidence ?? object.sourceEvidence;
  const evidence = rawEvidence && typeof rawEvidence === "object" ? rawEvidence as Record<string, unknown> : null;
  const declaredVisualSignoff = readSignoff(object.declaredVisualSignoff ?? object.visualSignoff ?? (object.visual && typeof object.visual === "object" ? (object.visual as Record<string, unknown>).signoff : undefined));
  return freeze({
    sourceEvidence: evidence ? freeze({ path: String(evidence.path ?? ""), sha256: String(evidence.sha256 ?? ""), candidateId: String(evidence.candidateId ?? ""), sourceUrl: String(evidence.sourceUrl ?? ""), sourcePageUrl: String(evidence.sourcePageUrl ?? "") }) : null,
    declaredVisualSignoff,
    id: nullableText(object.id ?? object.candidateId) ?? "",
    title: nullableText(object.title ?? object.displayName ?? object.catalogName) ?? "",
    rank: safeInteger(object.rank) ? object.rank as number : null,
    sourceUrl,
    sourcePageUrl: nullableText(source.sourcePage ?? source.sourcePageUrl ?? source.pageUrl),
    sourcePageSha256: nullableText(source.sourcePageSha256 ?? source.pageSha256),
    sourceCredit: nullableText(source.credit ?? source.sourceCredit),
    declaredLicense: nullableText(source.declaredLicense ?? source.license ?? source.sourceLicense),
    licensePolicyUrl: nullableText(source.licenseUrl ?? source.licensePolicyUrl ?? source.policyUrl),
    sourceSha256: nullableText(source.sha256 ?? source.sourceSha256),
    artifact,
    attempts,
    rights,
    visualSignoff: declaredVisualSignoff === "rejected" ? "rejected" : "pending",
    candidateOnly: boundaryLayers.every((layer) => layer.candidateOnly !== false && layer.hold !== false && layer.notAdmitted !== false),
    runtimeAdmission: boundaryLayers.some((layer) => layer.runtimeAdmission !== undefined && layer.runtimeAdmission !== "candidate-only") ? "boundary-invalid" : "candidate-only",
    measurementAdmission: boundaryLayers.some((layer) => layer.measurementAdmission !== undefined && layer.measurementAdmission !== "not-admitted") ? "boundary-invalid" : "not-admitted",
    scientificPayloadWriteback: boundaryLayers.some((layer) => layer.scientificPayloadWriteback !== undefined && layer.scientificPayloadWriteback !== false),
    runtimeWrites: boundaryLayers.some((layer) => layer.runtimeWrites !== undefined && layer.runtimeWrites !== false),
    measurementWrites: boundaryLayers.some((layer) => layer.measurementWrites !== undefined && layer.measurementWrites !== false),
    sourceSchema,
    sourcePath: nullableText(object.sourcePath),
  });
}

export function parseNebulaRightsClosureInputV627(serialized: string): NebulaClosureInputV627 {
  try {
    return normalizeNebulaRightsClosureInputV627(JSON.parse(serialized) as unknown);
  } catch (error) {
    throw new Error(`Nebula closure input invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function normalizeInputBatch(value: unknown): readonly NebulaClosureInputV627[] {
  if (Array.isArray(value)) return freeze(value.map(normalizeNebulaRightsClosureInputV627));
  const object = readObject(value, "nebula closure batch");
  const rows = Array.isArray(object.records) ? object.records : Array.isArray(object.rows) ? object.rows : [];
  return freeze(rows.map((row) => normalizeNebulaRightsClosureInputV627(row)));
}

export function adaptNebulaV624BatchRowV627(row: unknown, ledgerRecord?: unknown): NebulaClosureInputV627 {
  const object = readObject(row, "V624 batch row");
  const network = object.network && typeof object.network === "object" ? object.network as Record<string, unknown> : {};
  const source = object.source && typeof object.source === "object" ? object.source as Record<string, unknown> : {};
  const rights = object.rights && typeof object.rights === "object" ? object.rights as Record<string, unknown> : {};
  const merged = {
    ...object,
    id: object.id,
    title: object.title,
    rank: object.rank,
    source: {
      ...source,
      url: source.url,
      credit: source.credit,
      licenseUrl: source.licenseUrl,
      declaredLicense: source.declaredLicense,
    },
    network,
    artifact: network.artifact ?? {},
    rights,
    runtimeAdmission: object.runtimeAdmission,
    measurementAdmission: object.measurementAdmission,
    scientificPayloadWriteback: object.scientificPayloadWriteback,
    sourceSchema: "mainline-a-nebula-batch-v624",
    sourcePath: "app/data/mainlineANebulaBatchV624.generated.json",
  };
  if (ledgerRecord && typeof ledgerRecord === "object") {
    throw new Error(`Duplicate candidate across V624 batch and V623 ledger: ${String(object.id)}`);
  }
  return normalizeNebulaRightsClosureInputV627(merged);
}

export function adaptNebulaV624BatchV627(batch: unknown, ledger?: unknown): readonly NebulaClosureInputV627[] {
  const object = readObject(batch, "V624 batch");
  assertDeclaredBoundaryV627(object);
  const rows = readArray(object.rows, "V624 batch rows");
  const ledgerObject = ledger && typeof ledger === "object" ? ledger as Record<string, unknown> : null;
  const ledgerRows = ledgerObject && Array.isArray(ledgerObject.records) ? ledgerObject.records : [];
  if (ledgerObject && ledgerObject.schema !== "mainline-a-nebula-image-attempt-ledger-v623") throw new Error("V623 ledger schema invalid");
  if (ledgerObject) assertDeclaredBoundaryV627(ledgerObject);
  const inputs = [...rows.map((row) => adaptNebulaV624BatchRowV627(row)), ...ledgerRows.map(adaptNebulaV623LedgerRecordV627)];
  const seen = new Set<string>();
  for (const input of inputs) {
    if (!input.id || seen.has(input.id)) throw new Error(`Duplicate or missing nebula closure candidate: ${input.id}`);
    seen.add(input.id);
  }
  return freeze(inputs);
}

function assertDeclaredBoundaryV627(object: Record<string, unknown>): void {
  const layers = [object, object.boundary].filter((value): value is Record<string, unknown> => Boolean(value) && typeof value === "object");
  for (const layer of layers) {
    for (const [key, expected] of Object.entries(NEBULA_RIGHTS_CLOSURE_BOUNDARY_V627)) {
      if (key in layer && layer[key] !== expected) throw new Error(`Nebula input boundary is open: ${key}`);
    }
  }
}

export function adaptNebulaV623LedgerRecordV627(value: unknown): NebulaClosureInputV627 {
  const record = readObject(value, "V623 ledger record");
  if (record.id !== record.candidateId) throw new Error("V623 ledger candidate identity mismatch");
  const payload = record.payload && typeof record.payload === "object" ? record.payload as Record<string, unknown> : {};
  return normalizeNebulaRightsClosureInputV627({
    ...record,
    title: record.title ?? record.id,
    source: { url: record.sourceUrl },
    artifact: { ...payload, path: payload.localPath ?? null },
    rights: { status: record.rightsStatus === "rejected" ? "rejected" : "pending", signoff: "pending" },
    sourceSchema: "mainline-a-nebula-image-attempt-ledger-v623",
    sourcePath: "app/data/mainlineANebulaImageAttemptLedgerV623.generated.json",
  });
}

export function applyNebulaV613RightsPackV627(inputs: readonly NebulaClosureInputV627[], rightsPack: unknown): readonly NebulaClosureInputV627[] {
  const pack = readObject(rightsPack, "V613 rights pack");
  const rows = Array.isArray(pack.records) ? pack.records : [];
  const byId = new Map(rows.map((row) => {
    const object = row && typeof row === "object" ? row as Record<string, unknown> : {};
    return [String(object.candidateId ?? object.id ?? ""), object] as const;
  }));
  return freeze(inputs.map((input) => {
    const row = byId.get(input.id);
    if (!row) return input;
    const evidence = row.evidence && typeof row.evidence === "object" ? row.evidence as Record<string, unknown> : row;
    if (row.sourceUrl !== input.sourceUrl || evidence.sourceUrl !== input.sourceUrl || evidence.candidateId !== input.id) throw new Error(`V613 rights source identity mismatch: ${input.id}`);
    const sourceSha256 = nullableText(evidence.sourceSha256);
    const sourceCredit = nullableText(evidence.sourceCredit ?? row.sourceCredit) ?? input.sourceCredit;
    const declaredLicense = nullableText(evidence.sourceLicense ?? row.sourceLicense) ?? input.declaredLicense;
    const licensePolicyUrl = nullableText(evidence.sourceLicenseUrl ?? row.sourceLicenseUrl) ?? input.licensePolicyUrl;
    const rights: NebulaClosureRightsV627 = normalizeRights({
      ...input.rights,
      ...evidence,
      license: evidence.sourceLicense ?? input.rights.license,
      policyUrl: evidence.sourceLicenseUrl ?? input.rights.policyUrl,
    });
    return freeze({ ...input, sourceSha256: sourceSha256 ?? input.sourceSha256, sourceCredit, declaredLicense, licensePolicyUrl, rights, sourceSchema: `${input.sourceSchema ?? ""}+mainline-a-nebula-rights-pack-v613` });
  }));
}

function attemptIssues(input: NebulaClosureInputV627): NebulaClosureBlockerV627[] {
  const issues: NebulaClosureBlockerV627[] = [];
  if (input.attempts.length === 0) issues.push("attempt-ledger-missing");
  input.attempts.forEach((attempt, index) => {
    if (!safeInteger(attempt.attempt) || attempt.attempt !== index + 1) issues.push("attempt-time-invalid");
    if (!safeInteger(attempt.retryCount) || attempt.retryCount < 0) issues.push("attempt-time-invalid");
    const start = Date.parse(attempt.startedAt);
    const end = Date.parse(attempt.endedAt ?? "");
    if (!DATE_V627.test(attempt.startedAt) || !attempt.endedAt || !DATE_V627.test(attempt.endedAt) || !Number.isFinite(start) || !Number.isFinite(end) || end < start) issues.push("attempt-time-invalid");
    if (attempt.requestUrl !== input.sourceUrl || !validSourceHost(attempt.requestUrl)) issues.push("source-url-invalid");
    const scheme = attempt.fingerprintScheme ?? (input.sourceSchema?.startsWith("mainline-a-nebula-image-attempt-ledger-v623") ? "v623-get-accept" : input.sourceSchema?.startsWith("mainline-a-nebula-batch-v624") ? "v624-canonical-headers" : "unknown");
    const expectedFingerprint = scheme === "v623-get-accept" ? nebulaRightsClosureV623RequestFingerprintV627(input.sourceUrl) : scheme === "v624-canonical-headers" ? nebulaRightsClosureRequestFingerprintV627(input.sourceUrl) : null;
    if (!expectedFingerprint || attempt.requestFingerprint !== expectedFingerprint) issues.push("request-fingerprint-invalid");
    if (attempt.redirectChain.some((url) => !validSourceHost(url))) issues.push("unsafe-redirect");
    if (attempt.responseCaptured === 1) {
      if (attempt.httpStatus !== 200 || !IMAGE_MIME_V627.test(attempt.contentType ?? "")) issues.push("network-response-invalid");
      if (attempt.timeout || attempt.errorClass !== null || !validSourceHost(attempt.finalUrl)) issues.push("network-error-present");
      if (!validArtifactPath(attempt.rawArtifactPath) || !validSha(attempt.rawPageSha256)) issues.push("artifact-digest-invalid");
      if (!positiveInteger(attempt.responseBytes)) issues.push("artifact-size-invalid");
    }
    if (attempt.responseCaptured === 0 && (attempt.rawArtifactPath !== null || attempt.rawPageSha256 !== null || attempt.responseBytes !== null)) issues.push("network-response-invalid");
    if (attempt.errorClass !== null && !ALLOWED_NETWORK_ERROR_V627.has(attempt.errorClass)) issues.push("network-error-present");
  });
  return issues;
}

function sourceIssues(input: NebulaClosureInputV627): NebulaClosureBlockerV627[] {
  const issues: NebulaClosureBlockerV627[] = [];
  if (!validSourceHost(input.sourceUrl)) issues.push("source-url-invalid");
  if (!input.sourcePageUrl) issues.push("source-page-missing");
  else if (!validSourcePage(input.sourcePageUrl)) issues.push("source-url-invalid");
  if (!hasText(input.sourceCredit)) issues.push("source-credit-missing");
  if (!validPolicyUrl(input.licensePolicyUrl)) issues.push("license-policy-missing");
  if (!hasText(input.declaredLicense)) issues.push("license-identity-missing");
  if (input.sourceSha256 !== null && !validSha(input.sourceSha256)) issues.push("source-digest-invalid");
  if (input.sourcePageSha256 !== null && !validSha(input.sourcePageSha256)) issues.push("source-page-digest-invalid");
  if (!input.sourcePageSha256 || !input.sourceEvidence) issues.push("source-evidence-missing");
  else if (!validEvidencePath(input.sourceEvidence.path) || input.sourceEvidence.sha256 !== input.sourcePageSha256 || input.sourceEvidence.candidateId !== input.id || input.sourceEvidence.sourceUrl !== input.sourceUrl || input.sourceEvidence.sourcePageUrl !== input.sourcePageUrl) issues.push("source-evidence-binding-invalid");
  issues.push("source-evidence-unverified");
  return issues;
}

function artifactIssues(input: NebulaClosureInputV627): NebulaClosureBlockerV627[] {
  const artifact = input.artifact;
  const issues: NebulaClosureBlockerV627[] = [];
  if (!artifact.path) issues.push("artifact-missing");
  else if (!validArtifactPath(artifact.path)) issues.push("artifact-path-invalid");
  const supplied = artifact.path !== null || artifact.sha256 !== null || artifact.bytes !== null || artifact.width !== null || artifact.height !== null || artifact.format !== null;
  if (supplied && !validSha(artifact.sha256)) issues.push("artifact-digest-invalid");
  if (supplied && !positiveInteger(artifact.bytes)) issues.push("artifact-size-invalid");
  if (supplied && (!positiveInteger(artifact.width) || !positiveInteger(artifact.height) || (artifact.width ?? 0) < 64 || (artifact.height ?? 0) < 64)) issues.push("artifact-dimensions-invalid");
  if (supplied && !normalizedFormat(artifact.format)) issues.push("artifact-format-invalid");
  if (artifact.synthetic) issues.push("synthetic-prohibited");
  if (artifact.fixture) issues.push("fixture-prohibited");
  const successful = input.attempts.filter((attempt) => attempt.responseCaptured === 1 && attempt.errorClass === null);
  if (successful.length === 0) issues.push("network-response-missing");
  const linked = successful.some((attempt) => attempt.rawArtifactPath === artifact.path && attempt.rawPageSha256 === artifact.sha256 && attempt.responseBytes === artifact.bytes);
  if (successful.length > 0 && !linked) issues.push("artifact-source-mismatch");
  return issues;
}

function rightsIssues(input: NebulaClosureInputV627): NebulaClosureBlockerV627[] {
  const rights = input.rights;
  const issues: NebulaClosureBlockerV627[] = [];
  const declaredStatus = rights.declaredStatus ?? rights.status;
  const declaredSignoff = rights.declaredSignoff ?? rights.signoff;
  if (declaredStatus === "pending") issues.push("rights-review-pending");
  if (declaredStatus === "rejected" || declaredSignoff === "rejected") issues.push("rights-rejected");
  if (declaredStatus === "verified" && !rights.evidencePath) issues.push("rights-evidence-missing");
  if (declaredStatus === "verified" && rights.evidencePath && !validEvidencePath(rights.evidencePath)) issues.push("rights-evidence-path-invalid");
  if (declaredStatus === "verified" && !validSha(rights.evidenceSha256)) issues.push("rights-evidence-digest-invalid");
  if (declaredStatus === "verified" && (!hasText(rights.reviewer) || /fixture|mock|placeholder|synthetic|example/i.test(rights.reviewer ?? ""))) issues.push("rights-reviewer-invalid");
  if (declaredStatus === "verified" && (!rights.reviewedAt || !DATE_V627.test(rights.reviewedAt))) issues.push("rights-reviewed-at-missing");
  if (declaredStatus === "verified" && !rights.creditConfirmed) issues.push("rights-credit-unconfirmed");
  if (declaredStatus === "verified" || declaredSignoff === "signed") issues.push("rights-evidence-unverified");
  if (rights.license !== null && rights.license !== input.declaredLicense) issues.push("rights-license-mismatch");
  if (rights.policyUrl !== null && rights.policyUrl.replace(/\/$/, "") !== (input.licensePolicyUrl ?? "").replace(/\/$/, "")) issues.push("rights-policy-mismatch");
  if (declaredSignoff === "pending") issues.push("rights-signoff-pending");
  if (declaredSignoff === "rejected") issues.push("rights-signoff-rejected");
  return issues;
}

function boundaryIssues(input: NebulaClosureInputV627): NebulaClosureBlockerV627[] {
  const issues: NebulaClosureBlockerV627[] = [];
  if (!input.candidateOnly || input.runtimeAdmission !== "candidate-only" || input.measurementAdmission !== "not-admitted") issues.push("candidate-boundary-open");
  if (input.scientificPayloadWriteback) issues.push("scientific-writeback-open");
  if (input.runtimeWrites || input.measurementWrites) issues.push("runtime-write-open");
  return issues;
}

function closureStatus(source: NebulaClosureStateV627["sourceClosure"], artifact: NebulaClosureStateV627["artifactClosure"], payload: NebulaClosureStateV627["payloadIntegrity"], rights: NebulaClosureStateV627["rightsClosure"], visual: NebulaSignoffStatusV627, blockers: readonly NebulaClosureBlockerV627[]): NebulaClosureStatusV627 {
  if (blockers.some((blocker) => /invalid|mismatch|unsafe|prohibited|rejected|open/.test(blocker))) return "blocked";
  if (blockers.some((blocker) => ["source-url-invalid", "artifact-digest-invalid", "artifact-source-mismatch", "network-response-invalid", "rights-rejected", "rights-signoff-rejected", "synthetic-prohibited", "fixture-prohibited", "candidate-boundary-open", "scientific-writeback-open", "runtime-write-open"].includes(blocker))) return "blocked";
  if (source === "invalid" || artifact === "invalid" || payload === "invalid") return "blocked";
  if (source !== "verified") return "source-pending";
  if (artifact !== "verified" || payload !== "verified") return "artifact-pending";
  if (rights !== "verified" || visual !== "signed") return rights === "rejected" ? "blocked" : "rights-signoff-pending";
  return blockers.length === 0 ? "ready-for-signoff" : "rights-signoff-pending";
}

export function assessNebulaRightsClosureV627(input: NebulaClosureInputV627): NebulaClosureStateV627 {
  const sourceProblems = sourceIssues(input);
  const attemptProblems = attemptIssues(input);
  const artifactProblems = artifactIssues(input);
  const rightsProblems = rightsIssues(input);
  const boundaryProblems = boundaryIssues(input);
  const visualProblems: NebulaClosureBlockerV627[] = input.declaredVisualSignoff === "rejected" ? ["visual-signoff-rejected"] : ["visual-signoff-pending"];
  const blockers = unique([...sourceProblems, ...attemptProblems, ...artifactProblems, ...rightsProblems, ...visualProblems, ...boundaryProblems]);
  const sourceClosure = sourceProblems.length === 0 ? "verified" : sourceProblems.includes("source-url-invalid") ? "invalid" : "pending";
  const artifactClosure = artifactProblems.length === 0 && attemptProblems.length === 0 ? "verified" : artifactProblems.some((issue) => ["artifact-digest-invalid", "artifact-source-mismatch", "synthetic-prohibited", "fixture-prohibited"].includes(issue)) ? "invalid" : "pending";
  const payloadIntegrity = artifactClosure === "verified" && input.sourceSha256 !== null && input.sourceSha256 === input.artifact.sha256 ? "verified" : artifactClosure === "invalid" ? "invalid" : "pending";
  const rightsClosure = input.rights.status === "rejected" || input.rights.signoff === "rejected" ? "rejected" : "pending";
  const status = closureStatus(sourceClosure, artifactClosure, payloadIntegrity, rightsClosure, input.visualSignoff, blockers);
  const state = {
    schema: NEBULA_RIGHTS_CLOSURE_SCHEMA_V627,
    ...input,
    evidenceScope: "metadata-only-no-disk-verification",
    sourceClosure,
    artifactClosure,
    payloadIntegrity,
    rightsClosure,
    status,
    blockers: freeze(blockers),
    fingerprint: "",
  } satisfies Omit<NebulaClosureStateV627, "fingerprint"> & { fingerprint: string };
  const fingerprint = nebulaRightsClosureDigestV627({ ...state, fingerprint: undefined });
  return freeze({ ...state, fingerprint });
}

export function createNebulaRightsClosureRecordV627(value: unknown): NebulaClosureStateV627 {
  return assessNebulaRightsClosureV627(normalizeNebulaRightsClosureInputV627(value));
}

export function createNebulaRightsClosureBatchV627(values: unknown): NebulaClosureBatchV627 {
  const inputs = normalizeInputBatch(values);
  const seen = new Set<string>();
  const records = inputs.map((input) => {
    if (!input.id) throw new Error("Nebula closure candidate id missing");
    if (seen.has(input.id)) throw new Error(`Duplicate nebula closure candidate: ${input.id}`);
    seen.add(input.id);
    return assessNebulaRightsClosureV627(input);
  });
  const replay = replayNebulaRightsClosureV627(records, "2026-09-21T00:00:00.000Z");
  const digest = nebulaRightsClosureDigestV627({ records, replay: { ...replay, generatedAt: undefined } });
  return freeze({ schema: NEBULA_RIGHTS_CLOSURE_SCHEMA_V627, generatedAt: new Date().toISOString(), source: { path: null, schema: null }, records: freeze(records), replay, digest, boundary: NEBULA_RIGHTS_CLOSURE_BOUNDARY_V627 });
}

export function assessNebulaRightsClosureBatchV627(inputs: readonly NebulaClosureInputV627[]): readonly NebulaClosureStateV627[] {
  const seen = new Set<string>();
  return freeze(inputs.map((input) => {
    if (seen.has(input.id)) throw new Error(`Duplicate nebula closure candidate: ${input.id}`);
    seen.add(input.id);
    return assessNebulaRightsClosureV627(input);
  }));
}

export function nebulaClosureAssessmentV627(record: NebulaClosureStateV627): NebulaClosureAssessmentV627 {
  return freeze({
    id: record.id,
    sourceClosure: record.sourceClosure,
    artifactClosure: record.artifactClosure,
    payloadIntegrity: record.payloadIntegrity,
    rightsClosure: record.rightsClosure,
    sourceVerified: record.sourceClosure === "verified",
    rightsPending: record.rightsClosure === "pending",
    rightsSigned: record.rightsClosure === "verified",
    visualSigned: record.visualSignoff === "signed",
    candidateOnly: record.candidateOnly && record.runtimeAdmission === "candidate-only",
    status: record.status,
    blockers: record.blockers,
    fingerprint: record.fingerprint,
  });
}

export function nebulaClosureBlockerCountsV627(records: readonly NebulaClosureStateV627[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  records.forEach((record) => record.blockers.forEach((blocker) => { counts[blocker] = (counts[blocker] ?? 0) + 1; }));
  return freeze(counts);
}

export function nebulaClosureSummaryV627(records: readonly NebulaClosureStateV627[]) {
  return freeze({
    total: records.length,
    sourceVerified: records.filter((record) => record.sourceClosure === "verified").length,
    sourcePending: records.filter((record) => record.sourceClosure === "pending").length,
    artifactVerified: records.filter((record) => record.artifactClosure === "verified").length,
    artifactPending: records.filter((record) => record.artifactClosure === "pending").length,
    payloadVerified: records.filter((record) => record.payloadIntegrity === "verified").length,
    rightsVerified: records.filter((record) => record.rightsClosure === "verified").length,
    rightsPending: records.filter((record) => record.rightsClosure === "pending").length,
    signoffPending: records.filter((record) => record.rights.signoff === "pending" || record.visualSignoff === "pending").length,
    blocked: records.filter((record) => record.status === "blocked").length,
    candidateOnly: records.filter((record) => record.candidateOnly).length,
    scientificPayloadWriteback: false as const,
  });
}

export function replayNebulaRightsClosureV627(records: readonly NebulaClosureStateV627[], generatedAt = new Date().toISOString()): NebulaClosureReplayV627 {
  const rows: NebulaClosureReplayRowV627[] = [];
  for (const record of records) {
    const replayState = (value: string): NebulaClosureReplayRowV627["state"] => value === "verified" ? "verified" : value === "rejected" || value === "invalid" ? "rejected" : "pending";
    const phases: readonly [NebulaClosurePhaseV627, string, NebulaClosureReplayRowV627["state"]][] = [
      ["source", record.sourceUrl, replayState(record.sourceClosure)],
      ["artifact", record.artifact.path ?? "", replayState(record.artifactClosure)],
      ["payload", record.artifact.sha256 ?? "", replayState(record.payloadIntegrity)],
      ["rights", record.rights.license ?? "", replayState(record.rightsClosure)],
      ["visual", record.visualSignoff, record.visualSignoff === "signed" ? "verified" : record.visualSignoff === "rejected" ? "rejected" : "pending"],
      ["admission", record.runtimeAdmission, record.candidateOnly ? "closed" : "rejected"],
    ];
    phases.forEach(([phase, observed, state]) => rows.push(freeze({ id: record.id, phase, observed, state, blockers: record.blockers, fingerprint: record.fingerprint })));
  }
  const closureDigest = nebulaRightsClosureDigestV627(records.map((record) => ({ id: record.id, fingerprint: record.fingerprint })));
  return freeze({
    schema: NEBULA_RIGHTS_CLOSURE_REPLAY_SCHEMA_V627,
    generatedAt,
    closureDigest,
    rows: freeze(rows),
    counts: freeze({
      candidates: records.length,
      sourceVerified: records.filter((record) => record.sourceClosure === "verified").length,
      artifactVerified: records.filter((record) => record.artifactClosure === "verified").length,
      payloadVerified: records.filter((record) => record.payloadIntegrity === "verified").length,
      rightsVerified: records.filter((record) => record.rightsClosure === "verified").length,
      rightsPending: records.filter((record) => record.rightsClosure === "pending").length,
      signoffPending: records.filter((record) => record.rights.signoff === "pending" || record.visualSignoff === "pending").length,
      blocked: records.filter((record) => record.status === "blocked").length,
    }),
    boundary: NEBULA_RIGHTS_CLOSURE_BOUNDARY_V627,
  });
}

export function nebulaClosureReplayRowsV627(replay: NebulaClosureReplayV627): readonly NebulaClosureReplayRowV627[] {
  return replay.rows;
}

function csvEscapeV627(value: unknown): string {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function nebulaClosureCsvV627(records: readonly NebulaClosureStateV627[]): string {
  const rows = ["id,status,sourceClosure,artifactClosure,payloadIntegrity,rightsClosure,visualSignoff,sourceUrl,artifactSha256,artifactBytes,blockers,fingerprint"];
  records.forEach((record) => rows.push([record.id, record.status, record.sourceClosure, record.artifactClosure, record.payloadIntegrity, record.rightsClosure, record.visualSignoff, record.sourceUrl, record.artifact.sha256 ?? "", record.artifact.bytes ?? "", record.blockers.join("|"), record.fingerprint].map(csvEscapeV627).join(",")));
  return `${rows.join("\n")}\n`;
}

export function nebulaClosureJsonlV627(records: readonly NebulaClosureStateV627[]): string {
  return `${records.map((record) => JSON.stringify({ record, assessment: nebulaClosureAssessmentV627(record) })).join("\n")}\n`;
}

export function nebulaClosureReplayCsvV627(replay: NebulaClosureReplayV627): string {
  const rows = ["id,phase,state,observed,blockers,fingerprint"];
  replay.rows.forEach((row) => rows.push([row.id, row.phase, row.state, row.observed, row.blockers.join("|"), row.fingerprint].map(csvEscapeV627).join(",")));
  return `${rows.join("\n")}\n`;
}

export function nebulaClosureReplayJsonlV627(replay: NebulaClosureReplayV627): string {
  return `${replay.rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
}

export function serializeNebulaRightsClosureV627(batch: NebulaClosureBatchV627): string {
  assertNebulaRightsClosureBoundaryV627(batch);
  return JSON.stringify(batch, null, 2);
}

export function parseNebulaRightsClosureV627(serialized: string): NebulaClosureBatchV627 {
  let value: unknown;
  try { value = JSON.parse(serialized) as unknown; } catch (error) { throw new Error(`Nebula closure JSON invalid: ${error instanceof Error ? error.message : String(error)}`); }
  const object = readObject(value, "nebula closure receipt");
  if (object.schema !== NEBULA_RIGHTS_CLOSURE_SCHEMA_V627) throw new Error("Nebula closure schema invalid");
  const records = normalizeInputBatch(object.records).map(assessNebulaRightsClosureV627);
  const replay = replayNebulaRightsClosureV627(records, typeof object.generatedAt === "string" ? object.generatedAt : undefined);
  const batch = freeze({ schema: NEBULA_RIGHTS_CLOSURE_SCHEMA_V627, generatedAt: String(object.generatedAt ?? ""), source: object.source as NebulaClosureBatchV627["source"], records: freeze(records), replay, digest: String(object.digest ?? ""), boundary: NEBULA_RIGHTS_CLOSURE_BOUNDARY_V627 });
  assertNebulaRightsClosureBoundaryV627(batch);
  if (batch.digest !== nebulaRightsClosureDigestV627({ records: batch.records, replay: { ...batch.replay, generatedAt: undefined } })) throw new Error("Nebula closure digest mismatch");
  return batch;
}

export function verifyNebulaArtifactBytesV627(record: NebulaClosureStateV627, bytes: Uint8Array): readonly NebulaClosureBlockerV627[] {
  const issues: NebulaClosureBlockerV627[] = [];
  const digest = Array.from(sha256BytesV627(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (record.artifact.bytes !== bytes.byteLength) issues.push("artifact-bytes-mismatch");
  if (record.artifact.sha256 !== digest) issues.push("artifact-sha256-mismatch");
  return freeze(issues);
}

export function assertNebulaRightsClosureBoundaryV627(value: { boundary?: Partial<typeof NEBULA_RIGHTS_CLOSURE_BOUNDARY_V627>; records?: readonly NebulaClosureStateV627[] }): void {
  const boundary = value.boundary;
  if (!boundary || boundary.candidateOnly !== true || boundary.hold !== true || boundary.notAdmitted !== true || boundary.scientificPayloadWriteback !== false || boundary.runtimeWrites !== false || boundary.measurementWrites !== false) throw new Error("Nebula rights closure boundary is open");
  for (const record of value.records ?? []) {
    if (!record.candidateOnly || record.runtimeAdmission !== "candidate-only" || record.measurementAdmission !== "not-admitted" || record.scientificPayloadWriteback !== false || record.runtimeWrites || record.measurementWrites) throw new Error(`Nebula rights closure record boundary is open: ${record.id}`);
  }
}

export function nebulaClosureHasOnlyCandidateBoundaryV627(records: readonly NebulaClosureStateV627[]): boolean {
  try { assertNebulaRightsClosureBoundaryV627({ boundary: NEBULA_RIGHTS_CLOSURE_BOUNDARY_V627, records }); return true; } catch { return false; }
}

export function nebulaClosureSourceVerifiedV627(record: NebulaClosureStateV627): boolean {
  return record.sourceClosure === "verified";
}

export function nebulaClosureRightsPendingV627(record: NebulaClosureStateV627): boolean {
  return record.rightsClosure === "pending" || record.rights.signoff === "pending";
}

export function nebulaClosureSignoffReadyV627(record: NebulaClosureStateV627): boolean {
  return record.rightsClosure === "verified" && record.visualSignoff === "signed" && record.blockers.length === 0;
}

export function nebulaClosureRuntimeAdmissionV627(record: NebulaClosureStateV627): "candidate-only" {
  if (record.runtimeAdmission !== "candidate-only" || !record.candidateOnly) throw new Error(`Runtime admission closed for ${record.id}`);
  return "candidate-only";
}

export function nebulaClosureStatusLabelV627(status: NebulaClosureStatusV627): string {
  return ({
    "ready-for-signoff": "证据完整，等待最终签署",
    "rights-signoff-pending": "来源与权利待签署",
    "source-pending": "来源证据待补",
    "artifact-pending": "原始 artifact 待闭合",
    blocked: "闭包阻塞",
  } satisfies Record<NebulaClosureStatusV627, string>)[status];
}

export function nebulaClosureBlockerLabelV627(blocker: NebulaClosureBlockerV627): string {
  const labels: Record<NebulaClosureBlockerV627, string> = {
    "source-url-invalid": "来源 URL 不安全或不在允许域",
    "source-page-missing": "官方来源页面缺失",
    "source-credit-missing": "图片署名缺失",
    "license-policy-missing": "许可政策 URL 缺失或不规范",
    "license-identity-missing": "许可身份缺失",
    "source-digest-invalid": "来源摘要无效",
    "source-page-digest-invalid": "来源页面摘要无效",
    "source-evidence-missing": "来源证据缺失",
    "source-evidence-unverified": "来源页面仅有 metadata，未完成磁盘验证",
    "source-evidence-binding-invalid": "来源证据绑定不一致",
    "artifact-missing": "原始 artifact 缺失",
    "artifact-path-invalid": "artifact 路径越界",
    "artifact-digest-invalid": "artifact SHA-256 无效",
    "artifact-size-invalid": "artifact 字节数无效",
    "artifact-dimensions-invalid": "artifact 尺寸无效",
    "artifact-format-invalid": "artifact 格式无效",
    "artifact-source-mismatch": "artifact 与网络捕获不匹配",
    "artifact-bytes-mismatch": "artifact 字节重算不一致",
    "artifact-sha256-mismatch": "artifact SHA-256 重算不一致",
    "network-response-missing": "网络响应捕获缺失",
    "network-response-invalid": "网络响应无效",
    "network-error-present": "网络尝试存在错误",
    "attempt-ledger-missing": "尝试 ledger 缺失",
    "attempt-time-invalid": "尝试时间或重试计数无效",
    "request-fingerprint-invalid": "请求 fingerprint 无效",
    "unsafe-redirect": "重定向越界",
    "rights-review-pending": "逐图权利审核待完成",
    "rights-rejected": "逐图权利审核被拒",
    "rights-evidence-missing": "权利证据路径缺失",
    "rights-evidence-path-invalid": "权利证据路径越界或不安全",
    "rights-evidence-unverified": "权利证据仅为 metadata，未完成磁盘验证",
    "rights-evidence-digest-invalid": "权利证据 SHA-256 无效",
    "rights-license-mismatch": "权利证据许可不匹配",
    "rights-policy-mismatch": "权利政策 URL 不匹配",
    "rights-reviewer-missing": "权利审核人缺失",
    "rights-reviewer-invalid": "权利审核人标识不可信",
    "rights-reviewed-at-missing": "权利审核时间缺失",
    "rights-credit-unconfirmed": "署名确认缺失",
    "rights-signoff-pending": "权利最终签署待完成",
    "rights-signoff-rejected": "权利最终签署被拒",
    "visual-signoff-pending": "视觉签署待完成",
    "visual-signoff-rejected": "视觉签署被拒",
    "synthetic-prohibited": "合成 payload 禁止",
    "fixture-prohibited": "fixture payload 禁止",
    "candidate-boundary-open": "候选边界被打开",
    "scientific-writeback-open": "科学载荷回写被打开",
    "runtime-write-open": "运行时写入被打开",
    "duplicate-candidate-id": "候选 ID 重复",
    "schema-invalid": "schema 无效",
  };
  return labels[blocker];
}

export function nebulaClosurePhaseLabelV627(phase: NebulaClosurePhaseV627): string {
  return ({ source: "来源", artifact: "原始 artifact", payload: "payload 完整性", rights: "权利", visual: "视觉签署", admission: "运行时准入" } satisfies Record<NebulaClosurePhaseV627, string>)[phase];
}

export function nebulaClosureProgressV627(records: readonly NebulaClosureStateV627[]): number {
  if (records.length === 0) return 0;
  const complete = records.filter((record) => nebulaClosureSignoffReadyV627(record)).length;
  return Math.round((complete / records.length) * 100);
}

export function nebulaClosureDiffV627(left: readonly NebulaClosureStateV627[], right: readonly NebulaClosureStateV627[]) {
  const a = new Map(left.map((record) => [record.id, record.fingerprint]));
  const b = new Map(right.map((record) => [record.id, record.fingerprint]));
  return freeze({ added: freeze([...b.keys()].filter((id) => !a.has(id)).sort()), removed: freeze([...a.keys()].filter((id) => !b.has(id)).sort()), changed: freeze([...b.keys()].filter((id) => a.has(id) && a.get(id) !== b.get(id)).sort()) });
}

export function nebulaClosureStableV627(left: readonly NebulaClosureStateV627[], right: readonly NebulaClosureStateV627[]): boolean {
  const diff = nebulaClosureDiffV627(left, right);
  return diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0;
}

export function nebulaClosureIdsV627(records: readonly NebulaClosureStateV627[]): readonly string[] {
  return freeze(records.map((record) => record.id));
}

export function nebulaClosureFindV627(records: readonly NebulaClosureStateV627[], id: string): NebulaClosureStateV627 | undefined {
  return records.find((record) => record.id === id);
}

export function nebulaClosureFilterByStatusV627(records: readonly NebulaClosureStateV627[], status: NebulaClosureStatusV627): readonly NebulaClosureStateV627[] {
  return freeze(records.filter((record) => record.status === status));
}

export function nebulaClosureFilterRightsPendingV627(records: readonly NebulaClosureStateV627[]): readonly NebulaClosureStateV627[] {
  return freeze(records.filter(nebulaClosureRightsPendingV627));
}

export function nebulaClosureSortV627(records: readonly NebulaClosureStateV627[]): readonly NebulaClosureStateV627[] {
  return freeze([...records].sort((left, right) => (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER) || left.id.localeCompare(right.id)));
}

export function nebulaClosureDigestMatchesV627(batch: NebulaClosureBatchV627): boolean {
  return batch.digest === nebulaRightsClosureDigestV627({ records: batch.records, replay: { ...batch.replay, generatedAt: undefined } });
}

export function nebulaClosureBoundaryProjectionV627(records: readonly NebulaClosureStateV627[]) {
  return freeze({ candidateOnly: records.every((record) => record.candidateOnly), hold: true as const, notAdmitted: true as const, scientificPayloadWriteback: false as const, runtimeWrites: false as const, measurementWrites: false as const });
}

export function nebulaClosureExportV627(records: readonly NebulaClosureStateV627[]) {
  const replay = replayNebulaRightsClosureV627(records);
  return freeze({ schema: NEBULA_RIGHTS_CLOSURE_SCHEMA_V627, digest: nebulaRightsClosureDigestV627(records), summary: nebulaClosureSummaryV627(records), rows: records.map(nebulaClosureAssessmentV627), replay, csv: nebulaClosureCsvV627(records), jsonl: nebulaClosureJsonlV627(records), replayCsv: nebulaClosureReplayCsvV627(replay), replayJsonl: nebulaClosureReplayJsonlV627(replay), boundary: nebulaClosureBoundaryProjectionV627(records) });
}

export type NebulaRightsClosureRecordV627 = NebulaClosureStateV627;
export type NebulaRightsClosurePackV627 = NebulaClosureBatchV627;

function isClosurePackV627(value: NebulaRightsClosurePackV627 | readonly NebulaRightsClosureRecordV627[]): value is NebulaRightsClosurePackV627 {
  return !Array.isArray(value);
}

export function buildNebulaRightsClosureV627(batch: unknown, ledger?: unknown, rightsPack?: unknown): NebulaRightsClosurePackV627 {
  const baseInputs = adaptNebulaV624BatchV627(batch, ledger);
  const inputs = rightsPack ? applyNebulaV613RightsPackV627(baseInputs, rightsPack) : baseInputs;
  const records = assessNebulaRightsClosureBatchV627(inputs);
  const sourceObject = batch && typeof batch === "object" ? batch as Record<string, unknown> : {};
  const source = freeze({
    path: hasText(sourceObject.sourcePath) ? sourceObject.sourcePath : "app/data/mainlineANebulaBatchV624.generated.json",
    schema: hasText(sourceObject.schema) ? sourceObject.schema : "mainline-a-nebula-batch-v624",
  });
  const replay = replayNebulaRightsClosureV627(records);
  const digest = nebulaRightsClosureDigestV627({ records, replay: { ...replay, generatedAt: undefined } });
  return freeze({ schema: NEBULA_RIGHTS_CLOSURE_SCHEMA_V627, generatedAt: new Date().toISOString(), source, records, replay, digest, boundary: NEBULA_RIGHTS_CLOSURE_BOUNDARY_V627 });
}

export function summarizeNebulaRightsClosureV627(pack: NebulaRightsClosurePackV627 | readonly NebulaRightsClosureRecordV627[]) {
  return nebulaClosureSummaryV627(isClosurePackV627(pack) ? pack.records : pack);
}

export function rightsClosureBoundaryValidV627(pack: NebulaRightsClosurePackV627 | readonly NebulaRightsClosureRecordV627[]): boolean {
  const records = isClosurePackV627(pack) ? pack.records : pack;
  try {
    assertNebulaRightsClosureBoundaryV627({ boundary: isClosurePackV627(pack) ? pack.boundary : NEBULA_RIGHTS_CLOSURE_BOUNDARY_V627, records });
    return true;
  } catch {
    return false;
  }
}

export function rightsClosureNextActionV627(value: NebulaRightsClosurePackV627 | NebulaRightsClosureRecordV627): string {
  if ("records" in value) {
    const summary = summarizeNebulaRightsClosureV627(value);
    if (summary.blocked > 0) return "修复阻塞字段并重新计算 SHA-256";
    if (summary.rightsPending > 0) return "完成逐图权利证据与最终签署";
    if (summary.signoffPending > 0) return "完成视觉和权利签署";
    return "保持候选状态，等待发布门禁";
  }
  if (value.status === "blocked") return "修复阻塞字段并重放 closure";
  if (value.sourceClosure !== "verified") return "补齐官方来源页面证据";
  if (value.artifactClosure !== "verified" || value.payloadIntegrity !== "verified") return "完成原始 artifact 捕获与 SHA-256 重算";
  if (value.rightsClosure !== "verified") return "完成逐图权利审核与 signoff";
  if (value.visualSignoff !== "signed") return "完成视觉 signoff";
  return "保持 candidate-only，等待独立运行时门禁";
}

export function rightsClosureGateLabelV627(value: NebulaRightsClosurePackV627 | NebulaRightsClosureRecordV627): string {
  if ("records" in value) {
    const summary = summarizeNebulaRightsClosureV627(value);
    return `${summary.rightsVerified}/${summary.total} rights verified · ${summary.rightsPending}/${summary.total} rights pending · candidate-only`;
  }
  return `${nebulaClosureStatusLabelV627(value.status)} · ${value.blockers.length} blockers`;
}
