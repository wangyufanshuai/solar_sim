import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  canonicalKerrFrequencyProvenanceViewerV479,
  createKerrFrequencyProvenanceSummaryV479,
  parseKerrFrequencyProvenanceArtifactV479,
  type KerrFrequencyProvenanceArtifactV479,
  type KerrFrequencyProvenanceSummaryV479,
} from "./kerrFrequencyProvenanceViewerV479";

const ROOT="dist/science/kerr-frequency-provenance-viewer-v479";
const FILE=Object.freeze({name:"provenance-viewer.json",maxBytes:128*1024});
const digest=(value:Uint8Array|string)=>createHash("sha256").update(value).digest("hex");
export type KerrFrequencyProvenanceLoadedV479=Readonly<{artifact:KerrFrequencyProvenanceArtifactV479;summary:KerrFrequencyProvenanceSummaryV479;export:Readonly<{name:string;bytes:Uint8Array;fileSha256:string;contentType:"application/json; charset=utf-8"}>}>;
let cache:Readonly<{fingerprint:string;promise:Promise<KerrFrequencyProvenanceLoadedV479>}>|null=null;
export async function loadKerrFrequencyProvenanceV479(root=process.cwd()):Promise<KerrFrequencyProvenanceLoadedV479>{
  const target=resolve(root,ROOT,FILE.name), metadata=await stat(target); if(!metadata.isFile()||metadata.size<=0||metadata.size>FILE.maxBytes) throw new Error("v479-provenance-size");
  const bytes=new Uint8Array(await readFile(target)), fileSha256=digest(bytes), fingerprint=[target,metadata.mtimeMs,metadata.size,fileSha256].join(":"); if(cache?.fingerprint===fingerprint) return cache.promise;
  const promise=Promise.resolve().then(()=>{const artifact=parseKerrFrequencyProvenanceArtifactV479(JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes))); if(digest(canonicalKerrFrequencyProvenanceViewerV479(artifact))!==artifact.artifactSha256) throw new Error("v479-provenance-canonical-sha"); if(digest(canonicalKerrFrequencyProvenanceViewerV479(artifact.frequencyBuffer))!==artifact.frequencyBufferSha256) throw new Error("v479-frequency-buffer-sha"); if(digest(canonicalKerrFrequencyProvenanceViewerV479(artifact.provenance))!==artifact.provenanceSha256) throw new Error("v479-provenance-sha"); return Object.freeze({artifact,summary:createKerrFrequencyProvenanceSummaryV479(artifact),export:Object.freeze({name:FILE.name,bytes,fileSha256,contentType:"application/json; charset=utf-8" as const})});});
  cache=Object.freeze({fingerprint,promise}); try{return await promise;}catch(error){if(cache?.promise===promise) cache=null; throw error;}
}
export function resetKerrFrequencyProvenanceServerCacheForTestsV479():void{cache=null;}
