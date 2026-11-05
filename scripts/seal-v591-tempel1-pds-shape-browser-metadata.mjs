import { createHash } from "node:crypto";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v591/metadata-probe-tempel-1-pds-sbn-shape-v2-browser.json");
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-14T00:00:00Z";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const part = `${path}.${process.pid}.part`;
  rmSync(part, { force: true });
  writeFileSync(part, bytes, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(part, path);
}

const unsigned = {
  version: "v591-tempel-1-pds-sbn-shape-v2-browser-metadata-v1",
  generatedAt,
  status: "metadata-candidate-confirmed-no-payload",
  target: "tempel-1",
  archiveIdentity: "NASA Planetary Data System Small Bodies Node",
  dataset: {
    id: "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0",
    title: "Deep Impact/Stardust-NExT Derived Shape Model of 9P/Tempel 1 v2.0",
    status: "ARCHIVED",
    abstract: "Plate shape model of comet 9P/Tempel 1, as derived from Deep Impact and Stardust NExT images obtained around the times of closest approach to the comet.",
    citation: "Farnham, T.L. and Thomas, P.C, PLATE SHAPE MODEL OF COMET 9P/TEMPEL 1 V2.0, DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-MODEL-V2.0, NASA Planetary Data System, 2013.",
    metadataUrl: "https://pdssbn.astro.umd.edu/holdings/dif-c-hriv_its_mri-5-tempel1-shape-v2.0/dataset.shtml",
    downloadIndexUrl: "https://pdssbn.astro.umd.edu/holdings/dif-c-hriv_its_mri-5-tempel1-shape-v2.0/DOWNLOAD/",
  },
  candidate: {
    packageName: "dimodl_0001.tgz",
    approximateSizeLabel: "3.0M",
    packageUrl: "https://pdssbn.astro.umd.edu/holdings/dif-c-hriv_its_mri-5-tempel1-shape-v2.0/DOWNLOAD/dimodl_0001.tgz",
    md5Name: "MD5SUM",
    md5Url: "https://pdssbn.astro.umd.edu/holdings/dif-c-hriv_its_mri-5-tempel1-shape-v2.0/DOWNLOAD/MD5SUM",
  },
  browserMetadataRequests: 2,
  browserIdentityVerified: true,
  payloadDownloaded: false,
  automaticRetryPerformed: false,
  automaticReplacementPerformed: false,
  authorityState: {
    presentationOnly: true,
    scientificAuthorityChanged: false,
    scientificPayloadWriteback: false,
    measuredAuthorityGranted: false,
  },
  license: { id: "NASA-PDS-SBN-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" },
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(outputPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
console.log(JSON.stringify({ status: receipt.status, datasetId: receipt.dataset.id, packageUrl: receipt.candidate.packageUrl, receiptSha256: receipt.receiptSha256 }, null, 2));
