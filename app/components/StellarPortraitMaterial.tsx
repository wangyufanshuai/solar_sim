"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { StellarMaterialProfile } from "../lib/stellarMaterialProfile";
import type { StellarPortraitProfileV2 } from "../lib/stellarPortraitProfileV2";
import type { StellarPortraitProfileV3 } from "../lib/stellarPortraitProfileV3";
import type { StellarPortraitProfileV4 } from "../lib/stellarPortraitProfileV4";
import type { StellarPortraitProfileV5 } from "../lib/stellarPortraitProfileV5";
import type { StellarPortraitProfileV6 } from "../lib/stellarPortraitProfileV6";
import type { StellarPortraitProfileV7 } from "../lib/stellarPortraitProfileV7";

type StellarPortraitProfile = StellarPortraitProfileV2 | StellarPortraitProfileV3 | StellarPortraitProfileV4 | StellarPortraitProfileV5 | StellarPortraitProfileV6 | StellarPortraitProfileV7;

const VERTEX_SHADER = `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const CORONA_VERTEX_SHADER = `
varying vec3 vNormalView;
varying vec3 vPosition;
void main(){vNormalView=normalize(normalMatrix*normal);vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`;
const CORONA_FRAGMENT_SHADER = `
uniform float uTime;uniform float uStrength;uniform float uLayers;uniform float uSoftness;uniform float uFalloff;uniform vec3 uColor;varying vec3 vNormalView;varying vec3 vPosition;
float hash(vec3 p){return fract(sin(dot(p,vec3(17.1,61.7,13.9)))*43758.5453);}
void main(){float fresnel=pow(clamp(1.0-abs(vNormalView.z),0.0,1.0),uFalloff);float az=atan(vPosition.y,vPosition.x);float flow=.48+.2*sin(az*9.0+uTime*.28+hash(floor(normalize(vPosition)*7.0))*2.0)+.12*sin(az*(5.0+uLayers*1.4)-uTime*.17);float dither=hash(vec3(gl_FragCoord.xy*.12,floor(uTime*8.0)));float brokenFlow=smoothstep(.18,.86,flow+dither*.14);float alpha=fresnel*brokenFlow*(.012+uStrength*.038);gl_FragColor=vec4(uColor*(.38+fresnel*.34),alpha);}
`;

export const STELLAR_HALO_FRAGMENT_SHADER = `
uniform vec3 uColor;
uniform float uStrength;
varying vec2 vUv;
void main(){
  vec2 p=vUv-0.5;
  float radius=length(p)*2.0;
  float inner=exp(-radius*radius*3.8);
  float outer=exp(-radius*2.65);
  float feather=1.0-smoothstep(.5,1.0,radius);
  float alpha=(inner*.1+outer*.32)*uStrength*feather;
  gl_FragColor=vec4(uColor*(.38+inner*.28),alpha);
}`;

const FRAGMENT_SHADER = `
uniform float uTime;
uniform float uSeed;
uniform float uGranulation;
uniform float uActivity;
uniform float uSpots;
uniform float uContrast;
uniform float uFacula;
uniform float uRotation;
uniform float uActiveLatitude;
uniform float uLimb;
uniform float uConvectiveWarp;
uniform float uSpotClusters;
uniform float uGranuleBoundary;
uniform float uDifferentialShear;
uniform float uActiveLatitudeWidth;
uniform float uRadiance;
uniform float uToneMapShoulder;
uniform vec3 uSceneLinearColor;
uniform vec3 uCore;
uniform vec3 uSurface;
uniform vec3 uCorona;
varying vec3 vNormal;
varying vec3 vPosition;
float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.17, 0.31, 0.53) * uSeed);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y), mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vec3 n = normalize(vPosition);
  float rotationAngle = uTime * uRotation * (1.0 - uDifferentialShear * n.y * n.y);
  n.xz = mat2(cos(rotationAngle), -sin(rotationAngle), sin(rotationAngle), cos(rotationAngle)) * n.xz;
  float t = uTime * (0.025 + uActivity * 0.04);
  float warpDriver = noise(n * 2.1 + vec3(uSeed, t * .12, 0.0)) - .5;
  vec3 convectionN = normalize(n + vec3(warpDriver, -warpDriver * .45, warpDriver * .7) * uConvectiveWarp);
  float cells = noise(convectionN * uGranulation + vec3(t, -t * 0.7, t * 0.35));
  float fine = noise(n * uGranulation * 2.4 - vec3(t * 0.5));
  float micro = noise(n * uGranulation * 5.6 + vec3(-t * .72, t * .31, t * .18));
  float warped = noise(n * (uGranulation * 0.46) + vec3(cells * 1.8, fine, -cells));
  float cellField = cells * .46 + fine * .27 + warped * .22 + micro * .11;
  float granules = smoothstep(.25, .78, cellField);
  float cellBoundary = 1.0 - smoothstep(.055, .19, abs(cells - fine));
  float surfaceStructure = clamp(granules * .78 + micro * .16 - cellBoundary * uGranuleBoundary, 0.0, 1.0);
  float spotNoise = noise(n * (2.4 + uSpotClusters * .24) + vec3(uSeed * 8.0, t * 0.2, 0.0));
  float activeBand = exp(-pow((abs(n.y) - uActiveLatitude) / max(.08,uActiveLatitudeWidth), 2.0));
  float spotAmplitude = clamp(uSpots * 7.0, 0.0, 1.0) * activeBand;
  float spots = 1.0 - smoothstep(0.82 - uSpots * 0.35, 0.91, spotNoise) * spotAmplitude * (0.35 + uActivity * 0.35);
  float facing = clamp(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
  float limb = mix(1.0 - uLimb, 1.0, pow(facing, 0.62));
  float rim = pow(1.0 - facing, 3.0);
  float facula = smoothstep(0.74, 0.94, fine) * uFacula;
  vec3 anchor = mix(uSurface * uSceneLinearColor, uSceneLinearColor, 0.94);
  vec3 hotCell = mix(anchor, uCore * uSceneLinearColor, .2);
  vec3 color = mix(anchor * (.66 - uContrast * .08), hotCell, .18 + surfaceStructure * (.48 + uContrast * .28)) * spots * limb;
  color += mix(anchor, uCore * uSceneLinearColor, .28) * facula * facing;
  color += uCorona * rim * (0.2 + uActivity * 0.16);
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = max(vec3(0.0), mix(vec3(luminance), color, 1.56) * uRadiance);
  color = color / (color + vec3(uToneMapShoulder));
  gl_FragColor = vec4(color, 1.0);
}`;

export default function StellarPortraitMaterial({ portrait }: {
  material: StellarMaterialProfile;
  portrait: StellarPortraitProfile;
}) {
  const shader = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: portrait.seed },
      uGranulation: { value: portrait.granulationScale },
      uActivity: { value: portrait.activity },
      uSpots: { value: portrait.spotCoverage },
      uContrast: { value: portrait.granulationContrast },
      uFacula: { value: portrait.faculaStrength },
      uRotation: { value: "rotationRate" in portrait ? portrait.rotationRate : 0.035 },
      uActiveLatitude: { value: "activeLatitude" in portrait ? portrait.activeLatitude : 0.36 },
      uLimb: { value: portrait.limbDarkening },
      uConvectiveWarp: { value: "convectiveWarp" in portrait ? portrait.convectiveWarp : 0.3 },
      uSpotClusters: { value: "spotClusterCount" in portrait ? portrait.spotClusterCount : 2 },
      uGranuleBoundary: { value: "granuleBoundaryStrength" in portrait ? portrait.granuleBoundaryStrength : 0.12 },
      uDifferentialShear: { value: "differentialRotationShear" in portrait ? portrait.differentialRotationShear : 0.14 },
      uActiveLatitudeWidth: { value: "activeLatitudeWidth" in portrait ? portrait.activeLatitudeWidth : 0.28 },
      uRadiance: { value: "surfaceRadiance" in portrait ? portrait.surfaceRadiance : 0.78 },
      uToneMapShoulder: { value: "toneMapShoulder" in portrait ? portrait.toneMapShoulder : 0.7 },
      uSceneLinearColor: { value: new THREE.Color().fromArray("sceneLinearColor" in portrait ? [...portrait.sceneLinearColor] : [0.86, 0.78, 0.68]) },
      uCore: { value: new THREE.Color(portrait.coreColor) },
      uSurface: { value: new THREE.Color(portrait.displayColor) },
      uCorona: { value: new THREE.Color(portrait.coronaColor) },
    },
    transparent: false,
    depthWrite: true,
    blending: THREE.NormalBlending,
    toneMapped: false,
  }), [portrait]);
  const shaderRef = useRef(shader);
  shaderRef.current = shader;
  useFrame((state) => { shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime; });
  useEffect(() => () => shader.dispose(), [shader]);
  return <primitive object={shader} attach="material" />;
}

export function StellarCoronaMaterial({portrait}:{portrait:StellarPortraitProfile}) {
  const shader=useMemo(()=>new THREE.ShaderMaterial({vertexShader:CORONA_VERTEX_SHADER,fragmentShader:CORONA_FRAGMENT_SHADER,uniforms:{uTime:{value:0},uStrength:{value:portrait.coronaStrength},uLayers:{value:"coronaLayerCount" in portrait?portrait.coronaLayerCount:1},uSoftness:{value:"coronaSoftness" in portrait?portrait.coronaSoftness:.78},uFalloff:{value:"coronaFalloff" in portrait?portrait.coronaFalloff:2.9},uColor:{value:new THREE.Color(portrait.coronaColor)}},transparent:true,depthWrite:false,depthTest:true,side:THREE.FrontSide,blending:THREE.AdditiveBlending,toneMapped:true}),[portrait]);
  const ref=useRef(shader);ref.current=shader;
  useFrame((state)=>{ref.current.uniforms.uTime.value=state.clock.elapsedTime});
  useEffect(()=>()=>shader.dispose(),[shader]);
  return <primitive object={shader} attach="material"/>;
}

export function StellarHaloMaterial({ portrait }: { portrait: StellarPortraitProfileV5 | StellarPortraitProfileV6 | StellarPortraitProfileV7 }) {
  const shader = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: STELLAR_HALO_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: new THREE.Color().fromArray([...portrait.sceneLinearColor]) },
      uStrength: { value: "haloStrength" in portrait ? portrait.haloStrength : 0.68 + portrait.activity * 0.12 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }), [portrait]);
  useEffect(() => () => shader.dispose(), [shader]);
  return <primitive object={shader} attach="material" />;
}
