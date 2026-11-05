import { spawnSync } from "node:child_process";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};

run("v415 detector likelihood chain", node, ["scripts/build-kerr-polarimeter-detector-likelihood-chain-v415.mjs"]);
run("v415 evidence and pointer", node, ["scripts/build-shadow-candidate-v415.mjs"]);
console.log(
  JSON.stringify(
    {
      status: "resealed-v415-lightweight-chain-with-v414-history-immutable",
      previousEvidenceResealed: false,
      independentOracleExecuted: true,
      measuredInputImported: false,
      networkAttempted: false,
      denseCampaignRun: false,
      browserRun: false,
    },
    null,
    2,
  ),
);
