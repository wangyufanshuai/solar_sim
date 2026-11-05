import { spawnSync } from "node:child_process";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};

run("v416 Stokes ensemble chain", node, ["scripts/build-kerr-polarimeter-stokes-ensemble-chain-v416.mjs"]);
run("v416 evidence and pointer", node, ["scripts/build-shadow-candidate-v416.mjs"]);
console.log(
  JSON.stringify(
    {
      status: "resealed-v416-lightweight-chain-with-v415-history-immutable",
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
