import { spawnSync } from "node:child_process";
const versions = ["299", ...Array.from({ length: 70 }, (_, index) => String(312 + index)), "382r1", ...Array.from({ length: 13 }, (_, index) => String(383 + index))];
for (const version of versions) {
  const result = spawnSync(process.execPath, [`scripts/build-shadow-candidate-v${version}.mjs`], { cwd: process.cwd(), stdio: "ignore", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`v395 evidence reseal failed at v${version}`);
}
console.log(JSON.stringify({ status: "resealed-v299-v395-lightweight-chain", first: "v299", last: "v395", versionCount: versions.length }, null, 2));
