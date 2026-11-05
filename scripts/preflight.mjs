// Resource preflight for long builds and experiments (roadmap E0, AGENTS.md rule 7).
// Reads free physical memory (os.freemem) and free space on the volume that holds
// the working directory (fs.statfsSync), compares them with the requested minimums
// and exits 1 when either is below its minimum.
//
// Usage: node scripts/preflight.mjs [--mem-gib 2] [--disk-gib 20] [--path .]
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const GIB = 1024 ** 3;

function readArg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : fallback;
}

const minMemGib = Number(readArg("mem-gib", "2"));
const minDiskGib = Number(readArg("disk-gib", "20"));
const target = path.resolve(readArg("path", "."));

const freeMemGib = os.freemem() / GIB;
const stats = fs.statfsSync(target);
const freeDiskGib = (stats.bavail * stats.bsize) / GIB;

const rows = [
  ["memory", freeMemGib, minMemGib],
  ["disk", freeDiskGib, minDiskGib],
];
let ok = true;
for (const [label, free, min] of rows) {
  const pass = free >= min;
  ok &&= pass;
  console.log(`${pass ? "ok  " : "FAIL"} ${label.padEnd(6)} free ${free.toFixed(2)} GiB, need ${min} GiB`);
}
console.log(`volume: ${target}`);
process.exit(ok ? 0 : 1);
