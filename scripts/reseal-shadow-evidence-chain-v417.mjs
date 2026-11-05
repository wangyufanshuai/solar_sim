import { spawnSync } from "node:child_process";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v417 nonlinear chain", node, ["scripts/build-kerr-polarimeter-nonlinear-chain-v417.mjs"]);
run("v417 evidence and pointer", node, ["scripts/build-shadow-candidate-v417.mjs"]);
console.log(
  JSON.stringify(
    {
      status: "resealed-v417-lightweight-chain-with-v416-history-immutable",
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
