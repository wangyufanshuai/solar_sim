import {spawnSync,execFileSync} from 'node:child_process';
import {access,cp,readFile,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
if(Number(process.versions.node.split('.')[0])!==24)throw Error('Use Node.js 24.x');
const snapshot=JSON.parse(await readFile('deploy/source-snapshot.json','utf8'));
const verified=spawnSync(process.execPath,['scripts/verify-server-assets.mjs'],{stdio:'inherit'});
if(verified.status!==0)process.exit(verified.status||1);
try{await access('.next/BUILD_ID');throw Error('Existing build found. Build in a new release directory.');}catch(e){if(e.code!=='ENOENT')throw e;}
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const cpus=process.env.ATLAS_BUILD_CPUS||'1';
const heap=Number(process.env.ATLAS_SERVER_BUILD_HEAP_MB||4096);
if(!Number.isInteger(heap)||heap<2048||heap>8192)throw Error('Invalid build heap');
const env={...process.env,ATLAS_NEXT_DIST_DIR:'.next',ATLAS_TSCONFIG_PATH:'tsconfig.server.json',ATLAS_BUILD_CPUS:cpus,ATLAS_LOCAL_ASSET_PACK_ROOT:'off',ATLAS_TEXTURE_PROXY:'off',NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE:'vercel-lite',NEXT_PUBLIC_MAINLINE_A_BUILD_ID:'mainline-a-'+snapshot.sourceSha256.slice(0,16),NEXT_PUBLIC_MAINLINE_A_BRANCH:'codex/mainline-a-server-candidate',NEXT_PUBLIC_MAINLINE_A_HEAD:head,NODE_OPTIONS:'--max-old-space-size='+heap};
const build=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build','--webpack'],{cwd:root,env,stdio:'inherit',windowsHide:true});
if(build.status!==0)process.exit(build.status||1);
// A standalone build does not include static/public files automatically.
const standalone=path.join(root,'.next/standalone');
await stat(path.join(standalone,'server.js'));
await cp('public',path.join(standalone,'public'),{recursive:true});
await cp('.next/static',path.join(standalone,'.next/static'),{recursive:true});
await writeFile('deploy/linux-build-receipt.json',JSON.stringify({at:new Date().toISOString(),head,sourceSnapshot:snapshot.sourceSha256,buildId:(await readFile('.next/BUILD_ID','utf8')).trim(),platform:process.platform,arch:process.arch,node:process.version,status:'production-build-and-assets-only',browserValidation:'not-run',candidateOnly:true,publicReleaseApproved:false},null,2)+'\n');
console.log('Standalone candidate prepared at .next/standalone/server.js');
