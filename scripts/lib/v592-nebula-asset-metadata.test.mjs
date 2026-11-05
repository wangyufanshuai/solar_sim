import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyAssetMetadataUrlV592,
  summarizeAssetMetadataFilesV592,
  validateAssetManifestUrlV592,
} from "./v592-nebula-asset-metadata.mjs";

test("v592 manifest requests remain HTTPS-only", () => {
  assert.equal(
    validateAssetManifestUrlV592("https://images-assets.nasa.gov/image/PIA03515/collection.json").href,
    "https://images-assets.nasa.gov/image/PIA03515/collection.json",
  );
  assert.throws(
    () => validateAssetManifestUrlV592("http://images-assets.nasa.gov/image/PIA03515/collection.json"),
    /asset-manifest-protocol:http:/,
  );
  assert.throws(
    () => validateAssetManifestUrlV592("https://example.org/image/PIA03515/collection.json"),
    /asset-manifest-host:example\.org/,
  );
});

test("v592 records NASA HTTP file links as metadata without admitting payload", () => {
  const file = classifyAssetMetadataUrlV592("http://images-assets.nasa.gov/image/PIA03515/PIA03515~orig.jpg");
  assert.equal(file.metadataTransport, "insecure-metadata-url");
  assert.equal(file.httpsCandidate, "https://images-assets.nasa.gov/image/PIA03515/PIA03515~orig.jpg");
  assert.equal(file.httpsCandidateRequested, false);
  assert.equal(file.payloadAdmission, "requires-explicit-https-acquisition");
  assert.equal(file.metadataOnly, true);
  assert.equal(file.candidateRole, "original");
});

test("v592 keeps HTTPS metadata read-only until explicit acquisition", () => {
  const file = classifyAssetMetadataUrlV592("https://images-assets.nasa.gov/image/PIA03515/PIA03515~large.png");
  assert.equal(file.metadataTransport, "https-metadata-url");
  assert.equal(file.httpsCandidateRequested, false);
  assert.equal(file.payloadAdmission, "requires-explicit-https-acquisition");
  assert.equal(file.candidateRole, "large");
});

test("v592 rejects non-NASA metadata hosts, credentials, ports and unsafe schemes", () => {
  assert.throws(() => classifyAssetMetadataUrlV592("https://example.org/a.jpg"), /asset-file-metadata-host/);
  assert.throws(() => classifyAssetMetadataUrlV592("https://user@images-assets.nasa.gov/a.jpg"), /asset-file-metadata-credentials/);
  assert.throws(() => classifyAssetMetadataUrlV592("https://images-assets.nasa.gov:444/a.jpg"), /asset-file-metadata-credentials/);
  assert.throws(() => classifyAssetMetadataUrlV592("ftp://images-assets.nasa.gov/a.jpg"), /asset-file-metadata-protocol/);
});

test("v592 aggregate summary never promotes metadata to payload admission", () => {
  const summary = summarizeAssetMetadataFilesV592([
    classifyAssetMetadataUrlV592("http://images-assets.nasa.gov/image/PIA03515/PIA03515~orig.jpg"),
    classifyAssetMetadataUrlV592("https://images-assets.nasa.gov/image/PIA03515/PIA03515~large.png"),
  ]);
  assert.deepEqual(summary, {
    fileCount: 2,
    originalCandidateCount: 1,
    largeCandidateCount: 1,
    insecureMetadataUrlCount: 1,
    explicitHttpsAcquisitionCandidateCount: 2,
    payloadAdmission: "requires-explicit-https-acquisition",
  });
});
