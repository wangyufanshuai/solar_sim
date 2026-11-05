import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";

export const MAINLINE_A6_PACKET_PATH = "dist/release-exports/mainline-a-v607/mainline-a-source-evidence.zip";
export const MAINLINE_A6_PACKET_RECEIPT_PATH = "docs/release/v607/mainline-a-stage-a6-release-packet.json";
const MANIFEST_ENTRY = "MAINLINE-A-MANIFEST.json";
const README_ENTRY = "REPRODUCE.md";
const FIXED_DOS_TIME = 0x00210000; // 1980-01-01 00:00:00; independent of local timezone.
const REQUIRED_SOURCE_PATHS = [
  "app/components/AtlasRuntimeWorkbenchSurface.tsx",
  "app/components/PostV593StellarRosterPanel.tsx",
  "app/lib/celestialCatalog.ts",
  "docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json",
  "app/lib/celestialObjectContractV607.ts",
  "app/components/CelestialObjectPassportPanel.tsx",
  "app/components/ConstellationLines.tsx",
  "app/components/AtlasRuntimePanelLayer.tsx",
  "app/components/AtlasUniverseSceneRuntime.tsx",
  "app/components/AtlasDeepSpacePresentationSubtreeV275.tsx",
  "app/lib/skyChartProjectionV607.ts",
  "app/data/constellationCatalog.ts",
  "app/data/brightStarCatalog.ts",
  "app/data/nebulaCatalog.ts",
  "app/components/MainlineStellarEvidencePanelV607.tsx",
  "package.json",
  "package-lock.json",
  "next.config.mjs",
  "tsconfig.json",
  "scripts/build-atlas-profile.mjs",
  "scripts/render-mainline-a4-portraits.ts",
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertPacketPath(value) {
  assert(typeof value === "string"
    && value.length > 0
    && !path.posix.isAbsolute(value)
    && !path.win32.isAbsolute(value)
    && !value.includes("\\")
    && !value.split("/").some((segment) => !segment || segment === "." || segment === ".."),
  `mainline-a6-unsafe-packet-path:${value}`);
}

function filesUnder(root, relative) {
  const directory = path.join(root, relative);
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = `${relative}/${entry.name}`;
    if (entry.isDirectory()) return filesUnder(root, file);
    return entry.isFile() ? [file] : [];
  });
}

/** Mainline A review/replay overlay; not a copy of every application source file. */
export function collectMainlineA6PacketSources(root) {
  const acceptance = JSON.parse(readFileSync(path.join(root, "docs/release/v607/mainline-a-stage-a1-acceptance.json"), "utf8"));
  return [...new Set([
    ...REQUIRED_SOURCE_PATHS,
    ...acceptance.artifacts,
    ...filesUnder(root, "public/textures/mainline-a"),
    ...["app/data", "app/lib", "app/components"].flatMap((directory) => filesUnder(root, directory))
      .filter((file) => /\/(?:mainlineA|MainlineA)[^/]*\.(?:ts|tsx)$/.test(file)),
    ...filesUnder(root, "scripts").filter((file) => /\/[^/]*mainline-a[^/]*\.mjs$/.test(file)),
    ...filesUnder(root, "docs/release/v607")
      .filter((file) => file !== MAINLINE_A6_PACKET_RECEIPT_PATH),
  ])].filter((file) => file !== MAINLINE_A6_PACKET_RECEIPT_PATH && file !== MAINLINE_A6_PACKET_PATH).sort().map((relative) => {
    assertPacketPath(relative);
    const bytes = readFileSync(path.join(root, relative));
    return { path: relative, bytes };
  });
}

function createReadme(manifest) {
  return `# Mainline A v607 source and evidence packet\n\n`
    + `This archive is a review and replay overlay for the existing solar-next-web repository. It contains ${manifest.files.length} source/evidence files and their SHA-256 hashes. It is not a standalone application or a deployment bundle. The complete repository and its existing runtime data remain prerequisites.\n\n`
    + `The packet does not grant image rights or mark A6 performance, current-source build, or final acceptance complete. Read the stage evidence files for the current status.\n\n`
    + `From the repository root, using Node 24.x:\n\n`
    + "```text\nnpm ci\nnode scripts/verify-mainline-a1.mjs\nnode --test scripts/acquire-mainline-a3-image-receipts.test.mjs scripts/verify-mainline-a1.test.mjs scripts/build-mainline-a6-release-packet.test.mjs\nnpx vitest run app/data/mainlineAMetadataV607.test.ts app/data/mainlineAConstellationBoundaryV607.test.ts app/data/mainlineAConstellationFiguresV607.test.ts app/data/mainlineAFirstSetNebulaCandidatesV607.test.ts app/data/mainlineAStellarEvidenceV607.test.ts app/data/mainlineARelationV607.test.ts --pool=threads --maxWorkers=1\nnode node_modules/tsx/dist/cli.mjs scripts/render-mainline-a4-portraits.ts\nnpx tsc --noEmit --incremental false\nnode scripts/build-atlas-profile.mjs --profile vercel-lite --dist-dir .next-mainline-a-v607-a6 --previous-dist-dir .next-mainline-a-v607-a6-previous\nnode scripts/build-mainline-a6-release-packet.mjs\nnode scripts/build-mainline-a6-release-packet.mjs --verify-existing\n```\n\n"
    + `Full-repository typechecking currently requires the missing historical v560 science manifest; the successful vercel-lite build uses a filtered TypeScript configuration and is separate evidence.\n\n`
    + `Use ATLAS_BUILD_RECEIPT_NAME=atlas-mainline-a-v607-lite-build.json when rerunning the build so its receipt remains separate from historical release records. The build helper restores its temporary route overlay after completion.\n\n`
    + `The archive uses sorted POSIX paths, fixed ZIP timestamps, fixed platform/permissions, and uncompressed entries. Rebuilding unchanged inputs with the pinned dependency produces identical archive bytes. The verifier checks every archived byte and compares every source file against the current worktree.\n`;
}

/** Produce deterministic bytes; callers decide where to write them. */
export function createMainlineA6Packet(files) {
  const ordered = [...files].sort((left, right) => left.path.localeCompare(right.path, "en"));
  const seen = new Set();
  const rows = ordered.map((file) => {
    assertPacketPath(file.path);
    assert(!seen.has(file.path), `mainline-a6-duplicate-packet-path:${file.path}`);
    assert(file.path !== MANIFEST_ENTRY && file.path !== README_ENTRY, `mainline-a6-reserved-packet-path:${file.path}`);
    seen.add(file.path);
    const bytes = Buffer.from(file.bytes);
    return { path: file.path, bytes: bytes.length, sha256: sha256(bytes) };
  });
  const manifest = {
    schema: "mainline-a6-source-evidence-packet-v1",
    scope: "source-and-evidence-overlay-requires-complete-repository",
    standaloneDeploymentBundle: false,
    physicsKernelMutation: false,
    reproducibility: "sorted-paths-fixed-dos-time-fixed-platform-stored-entries-v1",
    sourceSetSha256: sha256(serialize(rows)),
    files: rows,
  };
  const zip = new AdmZip();
  const contents = [
    ...ordered,
    { path: MANIFEST_ENTRY, bytes: Buffer.from(serialize(manifest)) },
    { path: README_ENTRY, bytes: Buffer.from(createReadme(manifest)) },
  ].sort((left, right) => left.path.localeCompare(right.path, "en"));
  for (const file of contents) {
    const entry = zip.addFile(file.path, Buffer.from(file.bytes), "", 0o644);
    entry.header.timeval = FIXED_DOS_TIME;
    entry.header.made = 0x0314; // ZIP 2.0, Unix metadata; constant across hosts.
    entry.header.method = 0;
  }
  return { bytes: zip.toBuffer(), manifest };
}

/** Verify hashes, unexpected entries, and optionally worktree drift without extracting files. */
export function verifyMainlineA6Packet(bytes, { root } = {}) {
  const zip = new AdmZip(bytes);
  const manifestEntry = zip.getEntry(MANIFEST_ENTRY);
  assert(manifestEntry, "mainline-a6-packet-manifest-missing");
  const manifest = JSON.parse(manifestEntry.getData().toString("utf8"));
  assert(manifest.schema === "mainline-a6-source-evidence-packet-v1"
    && manifest.standaloneDeploymentBundle === false
    && Array.isArray(manifest.files), "mainline-a6-packet-manifest-invalid");
  assert(manifest.sourceSetSha256 === sha256(serialize(manifest.files)), "mainline-a6-source-list-digest");
  const expected = new Set([MANIFEST_ENTRY, README_ENTRY, ...manifest.files.map((file) => file.path)]);
  const entries = zip.getEntries();
  assert(expected.size === manifest.files.length + 2 && entries.length === expected.size,
    "mainline-a6-packet-entry-count");
  assert(new Set(entries.map((entry) => entry.entryName)).size === entries.length,
    "mainline-a6-packet-duplicate-entry");
  for (const entry of entries) {
    assertPacketPath(entry.entryName);
    assert(expected.has(entry.entryName), `mainline-a6-packet-unexpected-entry:${entry.entryName}`);
    assert(entry.header.timeval === FIXED_DOS_TIME && entry.header.method === 0,
      `mainline-a6-packet-entry-metadata:${entry.entryName}`);
  }
  assert(zip.getEntry(README_ENTRY)?.getData().toString("utf8") === createReadme(manifest),
    "mainline-a6-packet-reproduction-guide");
  for (const file of manifest.files) {
    assertPacketPath(file.path);
    assert(Number.isSafeInteger(file.bytes) && file.bytes >= 0 && /^[a-f0-9]{64}$/.test(file.sha256),
      `mainline-a6-packet-file-record:${file.path}`);
    const data = zip.getEntry(file.path)?.getData();
    assert(data && data.length === file.bytes && sha256(data) === file.sha256,
      `mainline-a6-packet-file-integrity:${file.path}`);
    if (root) {
      const sourcePath = path.join(root, file.path);
      assert(existsSync(sourcePath) && sha256(readFileSync(sourcePath)) === file.sha256,
        `mainline-a6-packet-source-drift:${file.path}`);
    }
  }
  return {
    status: "verified",
    sourceFileCount: manifest.files.length,
    archiveEntries: entries.length,
    sourceBytes: manifest.files.reduce((sum, file) => sum + file.bytes, 0),
    archiveBytes: bytes.length,
    archiveSha256: sha256(bytes),
    sourceSetSha256: manifest.sourceSetSha256,
    worktreeMatched: Boolean(root),
  };
}

export function writeMainlineA6Packet(root = process.cwd()) {
  const { bytes, manifest } = createMainlineA6Packet(collectMainlineA6PacketSources(root));
  const verification = verifyMainlineA6Packet(bytes, { root });
  const archivePath = path.join(root, MAINLINE_A6_PACKET_PATH);
  mkdirSync(path.dirname(archivePath), { recursive: true });
  writeFileSync(archivePath, bytes);
  const receipt = {
    schema: "mainline-a6-source-evidence-packet-receipt-v1",
    ...verification,
    archivePath: MAINLINE_A6_PACKET_PATH,
    manifestEntry: MANIFEST_ENTRY,
    sourceManifest: manifest,
    releaseStatus: "review-packet-only-final-runtime-acceptance-pending",
  };
  writeFileSync(path.join(root, MAINLINE_A6_PACKET_RECEIPT_PATH), serialize(receipt));
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const result = process.argv.includes("--verify-existing")
    ? verifyMainlineA6Packet(readFileSync(path.join(root, MAINLINE_A6_PACKET_PATH)), { root })
    : writeMainlineA6Packet(root);
  console.log(JSON.stringify({
    status: result.status,
    sourceFileCount: result.sourceFileCount,
    archiveBytes: result.archiveBytes,
    archiveSha256: result.archiveSha256,
    worktreeMatched: result.worktreeMatched,
    archivePath: MAINLINE_A6_PACKET_PATH,
  }, null, 2));
}
