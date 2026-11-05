import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const OUT=path.resolve("public/data/exoplanets"),BASE="https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
const FIELDS="hostname,pl_name,sy_pnum,st_mass,st_teff,st_rad,ra,dec,pl_orbsmax,pl_orbper,pl_orbeccen,pl_orbincl,pl_orblper,pl_rade,pl_bmasse,disc_year";
const q=`select ${FIELDS} from pscomppars`,url=`${BASE}?query=${encodeURIComponent(q)}&format=json`;
const finite=v=>v==null||v===""||!Number.isFinite(Number(v))?null:Number(v),hash=s=>createHash("sha256").update(s).digest("hex");
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
async function main(){
 await mkdir(OUT,{recursive:true});const response=await fetch(url,{signal:AbortSignal.timeout(180000)});
 if(!response.ok)throw new Error(`NASA TAP ${response.status}: ${(await response.text()).slice(0,300)}`);
 const raw=await response.text(),rows=JSON.parse(raw),systems=new Map(),retrievedAt=new Date().toISOString();
 for(const r of rows){const host=String(r.hostname),id=slug(host);
  if(!systems.has(id))systems.set(id,{id,hostName:host,aliases:[],raDeg:finite(r.ra),decDeg:finite(r.dec),stellarMassSolar:finite(r.st_mass),stellarTeffK:finite(r.st_teff),stellarRadiusSolar:finite(r.st_rad),planets:[],source:"NASA Exoplanet Archive pscomppars",retrievedAt});
  const period=finite(r.pl_orbper),mass=finite(r.st_mass),reportedA=finite(r.pl_orbsmax),derived=reportedA==null&&period!=null&&mass!=null?Math.cbrt(mass*(period/365.25)**2):null,ecc=finite(r.pl_orbeccen),incl=finite(r.pl_orbincl);
  systems.get(id).planets.push({id:slug(String(r.pl_name)),name:String(r.pl_name),semiMajorAxisAu:reportedA??derived,periodDays:period,eccentricity:ecc,inclinationDeg:incl,ascendingNodeDeg:null,argumentPeriastronDeg:finite(r.pl_orblper),radiusEarth:finite(r.pl_rade),massEarth:finite(r.pl_bmasse),discoveryYear:finite(r.disc_year),geometryProvenance:reportedA!=null?"reported":derived!=null?"derived-kepler-display":"layout-only",eccentricityProvenance:ecc==null?"unknown-dashed-layout":"reported",orientationProvenance:incl==null?"display-orientation":"reported",phaseProvenance:"display-phase"});
 }
 const documents=[...systems.values()].filter(s=>s.planets.length),body=JSON.stringify(documents);await writeFile(path.join(OUT,"systems.json"),body);
 const manifest={version:"v123-exoplanet-systems-orbit-director",rowCount:documents.length,planetCount:documents.reduce((n,s)=>n+s.planets.length,0),path:"/data/exoplanets/systems.json",runtimePolicy:"offline-local-catalog",generatedAt:retrievedAt,provenance:{source:"NASA Exoplanet Archive",table:"pscomppars",url:BASE,query:q,sha256:hash(raw)},checksum:hash(body)};
 await writeFile(path.join(OUT,"manifest.json"),JSON.stringify(manifest,null,2));console.log(`exoplanets systems=${manifest.rowCount} planets=${manifest.planetCount}`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
