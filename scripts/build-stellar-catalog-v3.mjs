import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const HYG_URL = "https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv";
const OUT = path.resolve("public/data/stellar-search-v3");
const V2 = path.resolve("public/data/stellar-search");
const HYG_CACHE = path.resolve("tools/asset-cache/hygdata_v41.csv");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const num = (v) => v === "" || !Number.isFinite(Number(v)) ? null : Number(v);

function parseCsv(text) {
  const rows=[]; let row=[]; let value=""; let quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i]; if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===","&&!quoted){row.push(value);value="";}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&text[i+1]==="\n")i++;row.push(value);if(row.some(Boolean))rows.push(row);row=[];value="";}else value+=c;}
  const headers=rows.shift(); return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]??""])));
}
function aliases(r){ return [r.proper, r.bayer ? `${r.bayer} ${r.con}` : "", r.flam ? `${r.flam} ${r.con}` : "", r.hd&&`HD ${r.hd}`,r.hip&&`HIP ${r.hip}`,r.hr&&`HR ${r.hr}`,r.gl&&`GJ ${r.gl}`,r.gaia&&`Gaia DR3 ${r.gaia}`,r.bf].filter(Boolean); }
function prefix(value){const n=value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\u4e00-\u9fff]+/g,"");return /^[a-z0-9]/.test(n)?n[0]:"unicode";}

async function main(){
  await mkdir(OUT,{recursive:true});
  let csv;
  try { csv = await readFile(HYG_CACHE, "utf8"); }
  catch {
    const response=await fetch(HYG_URL,{signal:AbortSignal.timeout(120000)}); if(!response.ok) throw new Error(`HYG ${response.status}`);
    csv=await response.text();
  }
  const hygRows=parseCsv(csv); const groups=new Map(); let named=0;
  for(const r of hygRows){const a=aliases(r); if(a.length) named++; const display=r.proper||a[0]||`HYG ${r.id}`; const doc={sourceId:`hyg:${r.id}`,catalogKey:`hyg:${r.id}`,gaiaSourceId:r.gaia||null,designation:`HYG ${r.id}`,displayName:display,aliases:a,raDeg:(num(r.ra)??0)*15,decDeg:num(r.dec)??0,parallaxMas:num(r.dist)&&Number(r.dist)>0?1000/Number(r.dist):null,magG:num(r.mag)??99,bpRp:num(r.ci),ruwe:null,teffK:null,logg:null,radiusSolar:null,variable:!!r.var,spectralType:r.spect||null,properMotionRaMasYr:num(r.pmra),properMotionDecMasYr:num(r.pmdec),radialVelocityKmS:num(r.rv),source:"curated-local",provenance:["hyg-v4.1"]}; const keys=new Set([display,...a].map(prefix)); for(const key of keys){if(!groups.has(key))groups.set(key,[]);groups.get(key).push(doc);}}
  const prefixShards=[]; for(const [key,docs] of [...groups].sort()){const postings=[];for(const d of docs)for(const alias of [d.displayName,...d.aliases])postings.push({alias:alias.toLowerCase(),documentKey:d.catalogKey}); const body=JSON.stringify(docs);const post=JSON.stringify(postings);await writeFile(path.join(OUT,`documents-${key}.json`),body);await writeFile(path.join(OUT,`postings-${key}.json`),post);prefixShards.push({prefix:key,documentPath:`/data/stellar-search-v3/documents-${key}.json`,postingPath:`/data/stellar-search-v3/postings-${key}.json`,rowCount:docs.length,aliasCount:postings.length,sha256:sha(body+post)});}
  const v2=JSON.parse(await readFile(path.join(V2,"manifest.json"),"utf8")); const manifest={version:"v121-named-stellar-catalog-v3",rowCount:v2.rowCount+hygRows.length,namedCatalogCount:named,runtimePolicy:"offline-prefix-and-source-range-shards",generatedAt:new Date().toISOString(),gaiaManifestPath:"/data/stellar-search/manifest.json",provenance:[{source:"HYG v4.1",url:HYG_URL,license:"CC BY-SA 4.0",sha256:sha(csv)},{source:"Gaia DR3 local V2",url:v2.sourceUrl,license:"ESA Gaia archive terms",sha256:sha(JSON.stringify(v2))}],prefixShards};
  if(manifest.rowCount<200000||named<115000)throw new Error(`catalog gate failed rows=${manifest.rowCount} named=${named}`); await writeFile(path.join(OUT,"manifest.json"),JSON.stringify(manifest,null,2)); console.log(`stellar-v3 rows=${manifest.rowCount} named=${named} shards=${prefixShards.length}`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
