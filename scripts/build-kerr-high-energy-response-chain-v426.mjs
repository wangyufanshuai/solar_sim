import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const root=process.cwd(),node=process.execPath;const run=(label,command,args)=>{const result=spawnSync(command,args,{cwd:root,stdio:"inherit",shell:false});if(result.error)throw result.error;if(result.status!==0)throw new Error(`${label} failed with ${result.status}`);};
run("v426 independent high-energy response Python oracle","python",["scripts/run-kerr-high-energy-response-oracle-v426.py"]);
run("v426 TypeScript response compiler",node,[resolve(root,"node_modules/tsx/dist/cli.mjs"),"scripts/build-kerr-high-energy-response-v426.ts"]);
run("v426 FITS structure and architecture diagnostic","python",["scripts/export-kerr-high-energy-response-v426.py"]);
