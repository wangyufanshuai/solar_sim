import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import AdmZip from "adm-zip";
import { createMainlineA6Packet, verifyMainlineA6Packet } from "./build-mainline-a6-release-packet.mjs";

const sources = [
  { path: "docs/source-credit.txt", bytes: Buffer.from("ESA/Hubble & NASA\n") },
  { path: "app/mainlineA.ts", bytes: Buffer.from("export const layers = 4;\n") },
];

test("A6 packet bytes are reproducible regardless of input enumeration order", () => {
  const first = createMainlineA6Packet(sources);
  const second = createMainlineA6Packet([...sources].reverse());
  assert.deepEqual(first.bytes, second.bytes);
  assert.equal(verifyMainlineA6Packet(first.bytes).sourceFileCount, 2);
  assert.equal(first.manifest.standaloneDeploymentBundle, false);
});

test("A6 packet rejects changed payloads and undeclared archive entries", () => {
  const original = createMainlineA6Packet(sources);
  const changed = new AdmZip(original.bytes);
  changed.updateFile("docs/source-credit.txt", Buffer.from("changed credit\n"));
  changed.getEntry("docs/source-credit.txt").header.method = 0;
  assert.throws(() => verifyMainlineA6Packet(changed.toBuffer()), /file-integrity/);
  const extra = new AdmZip(original.bytes);
  extra.addFile("unrecorded.txt", Buffer.from("unrecorded"));
  assert.throws(() => verifyMainlineA6Packet(extra.toBuffer()), /entry-count/);
});

test("A6 packet rejects traversal, absolute and duplicate source paths", () => {
  for (const unsafe of ["../outside", "/absolute", "C:/absolute", "folder\\file", "a/../b"]) {
    assert.throws(() => createMainlineA6Packet([{ path: unsafe, bytes: Buffer.from("x") }]), /unsafe-packet-path/);
  }
  assert.throws(() => createMainlineA6Packet([...sources, sources[0]]), /duplicate-packet-path/);
});

test("A6 current-source verification detects worktree drift after packaging", () => {
  const root = mkdtempSync(path.join(tmpdir(), "mainline-a6-packet-test-"));
  try {
    for (const file of sources) {
      mkdirSync(path.dirname(path.join(root, file.path)), { recursive: true });
      writeFileSync(path.join(root, file.path), file.bytes);
    }
    const packet = createMainlineA6Packet(sources);
    assert.equal(verifyMainlineA6Packet(packet.bytes, { root }).worktreeMatched, true);
    writeFileSync(path.join(root, sources[0].path), "drift");
    assert.throws(() => verifyMainlineA6Packet(packet.bytes, { root }), /source-drift/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
