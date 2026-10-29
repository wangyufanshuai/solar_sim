import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const args=process.argv.slice(2);
if(args.length && (args.length!==2 || args[0]!=='--asset-root'))throw Error('Usage: verify-server-assets.mjs [--asset-root directory]');
const root=path.resolve(args[1]||process.cwd());
const manifest=JSON.parse(await readFile('deploy/public-assets.json','utf8'));
const issues=[];
for(const item of manifest.files){
 const p=path.resolve(root,item.path);
 if(!p.startsWith(path.join(root,'public')+path.sep))throw Error('Invalid asset path');
 try{
  const info=await stat(p);
  if(info.size!==item.bytes){issues.push({path:item.path,reason:'size'});continue;}
  const h=createHash('sha256');for await(const b of createReadStream(p))h.update(b);
  if(h.digest('hex')!==item.sha256)issues.push({path:item.path,reason:'sha256'});
 }catch(e){issues.push({path:item.path,reason:e.code||e.message});}
}
console.log(JSON.stringify({status:issues.length?'assets-incomplete':'assets-verified',count:manifest.files.length,issues},null,2));
if(issues.length)process.exitCode=1;
