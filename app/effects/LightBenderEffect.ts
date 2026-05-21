import {
  Effect,
  EffectAttribute,
  BlendFunction,
} from "postprocessing";
import { Matrix4, Uniform, Vector2, Vector3, Vector4 } from "three";
import {
  lightBenderBridgeState,
  METERS_PER_SCENE_UNIT,
  LIGHT_BENDER_MAX_BODIES,
} from "./lightBenderBridge";

const G_SI = 6.6743e-11;
const C2 = 299792458 * 299792458;

const fragmentShader = /* glsl */ `
uniform mat4 inverseProjectionMatrix;
uniform mat4 cameraWorldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;
uniform float lensingStrength;
uniform float stepCountFloat;
uniform float metersPerSceneUnit;
uniform float uvDeflectScale;
uniform float skyDepthStart;
uniform float skyDepthEnd;
uniform float GMs;
uniform float c2;
uniform float bodyCountFloat;
uniform float correlationRayDistance;
uniform vec2 sunUv;
uniform float sunRingValid;
uniform float tangentialRingBoost;
uniform float arcTapEnabled;
uniform float arcTapStrength;
uniform float arcTapThreshold;
uniform vec4 bodyData[${LIGHT_BENDER_MAX_BODIES}];

vec3 worldRayDir(vec2 uv) {
  vec2 ndc = uv * 2.0 - 1.0;
  vec4 clip = vec4(ndc, 0.5, 1.0);
  vec4 v = inverseProjectionMatrix * clip;
  vec3 viewDir = normalize(v.xyz / max(v.w, 1e-6));
  vec3 worldDir = normalize((cameraWorldMatrix * vec4(viewDir, 0.0)).xyz);
  return worldDir;
}

/** Perspective-correct UV delta from bent world ray vs original (weak-field visualization). */
vec2 worldDirsToUvDelta(vec3 w0, vec3 w1) {
  vec3 p0 = cameraPosition + w0 * correlationRayDistance;
  vec3 p1 = cameraPosition + w1 * correlationRayDistance;
  vec4 cl0 = projectionMatrix * viewMatrix * vec4(p0, 1.0);
  vec4 cl1 = projectionMatrix * viewMatrix * vec4(p1, 1.0);
  float iw0 = 1.0 / max(abs(cl0.w), 1e-5);
  float iw1 = 1.0 / max(abs(cl1.w), 1e-5);
  vec2 ndc0 = cl0.xy * iw0;
  vec2 ndc1 = cl1.xy * iw1;
  return (ndc1 - ndc0) * 0.5 * uvDeflectScale;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  if (lensingStrength < 1e-6 || bodyCountFloat < 0.5) {
    outputColor = inputColor;
    return;
  }

  float skyW = smoothstep(skyDepthStart, skyDepthEnd, depth);
  if (skyW < 1e-4) {
    outputColor = inputColor;
    return;
  }

  vec3 w0 = worldRayDir(uv);
  vec3 w = w0;
  float steps = max(4.0, min(16.0, stepCountFloat));

  for (int s = 0; s < 16; s++) {
    if (float(s) >= steps) break;

    for (int i = 0; i < ${LIGHT_BENDER_MAX_BODIES}; i++) {
      if (float(i) >= bodyCountFloat) continue;
      vec4 bd = bodyData[i];
      vec3 M = bd.xyz;
      float mass = bd.w;
      if (mass <= 0.0) continue;

      vec3 oc = M - cameraPosition;
      float tLine = dot(oc, w);
      vec3 closest = cameraPosition + w * tLine;
      float b = length(M - closest);
      b = max(b, 1e-5);
      float bMeters = b * metersPerSceneUnit;

      float dTheta = (4.0 * GMs * mass / (c2 * bMeters)) * lensingStrength;
      dTheta = clamp(dTheta, 0.0, 0.12);

      vec3 side = M - closest;
      float sl = length(side);
      if (sl < 1e-6) continue;
      side /= sl;
      w = normalize(w + dTheta * side);
    }
  }

  vec3 w1 = w;
  vec2 deltaUv = worldDirsToUvDelta(w0, w1);

  if (sunRingValid > 0.5 && tangentialRingBoost > 1e-4) {
    vec2 r = uv - sunUv;
    float rl = length(r);
    if (rl > 1e-4) {
      vec2 rad = r / rl;
      vec2 tang = vec2(-rad.y, rad.x);
      float dRad = dot(deltaUv, rad);
      float dTan = dot(deltaUv, tang);
      deltaUv = rad * dRad + tang * dTan * tangentialRingBoost;
    }
  }

  vec2 bentUv = clamp(uv + deltaUv, vec2(0.001), vec2(0.999));
  float dMag = length(deltaUv);
  vec4 bent;

  if (arcTapEnabled > 0.5 && dMag > arcTapThreshold) {
    vec2 tdir = vec2(-deltaUv.y, deltaUv.x);
    float tl = length(tdir);
    if (tl > 1e-5) {
      tdir /= tl;
    } else {
      tdir = vec2(1.0, 0.0);
    }
    float off = min(dMag, 0.07) * arcTapStrength;
    vec2 uP = clamp(uv + deltaUv + tdir * off, vec2(0.001), vec2(0.999));
    vec2 uM = clamp(uv + deltaUv - tdir * off, vec2(0.001), vec2(0.999));
    vec4 sP = texture2D(inputBuffer, uP);
    vec4 sM = texture2D(inputBuffer, uM);
    vec4 sC = texture2D(inputBuffer, bentUv);
    bent = sC * 0.5 + sP * 0.25 + sM * 0.25;
  } else {
    bent = texture2D(inputBuffer, bentUv);
  }

  outputColor = mix(inputColor, bent, skyW);
}
`;

function makeBodyData(): Vector4[] {
  const a: Vector4[] = [];
  for (let i = 0; i < LIGHT_BENDER_MAX_BODIES; i++) {
    a.push(new Vector4(0, 0, 0, 0));
  }
  return a;
}

export class LightBenderEffectImpl extends Effect {
  private readonly bodyData: Vector4[];

  constructor({
    blendFunction = BlendFunction.NORMAL,
    lensingStrength = 1,
    stepCount = 10,
    uvDeflectScale = 5,
    skyDepthStart = 0.985,
    skyDepthEnd = 0.9995,
  } = {}) {
    const bodyData = makeBodyData();
    super("LightBenderEffect", fragmentShader, {
      blendFunction,
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, Uniform>([
        ["inverseProjectionMatrix", new Uniform(new Matrix4())],
        ["cameraWorldMatrix", new Uniform(new Matrix4())],
        ["projectionMatrix", new Uniform(new Matrix4())],
        ["viewMatrix", new Uniform(new Matrix4())],
        ["cameraPosition", new Uniform(new Vector3())],
        ["lensingStrength", new Uniform(lensingStrength)],
        ["stepCountFloat", new Uniform(stepCount)],
        ["metersPerSceneUnit", new Uniform(METERS_PER_SCENE_UNIT)],
        ["uvDeflectScale", new Uniform(uvDeflectScale)],
        ["skyDepthStart", new Uniform(skyDepthStart)],
        ["skyDepthEnd", new Uniform(skyDepthEnd)],
        ["GMs", new Uniform(G_SI)],
        ["c2", new Uniform(C2)],
        ["bodyCountFloat", new Uniform(0)],
        ["correlationRayDistance", new Uniform(9500)],
        ["sunUv", new Uniform(new Vector2(0.5, 0.5))],
        ["sunRingValid", new Uniform(0)],
        ["tangentialRingBoost", new Uniform(1.15)],
        ["arcTapEnabled", new Uniform(1)],
        ["arcTapStrength", new Uniform(0.85)],
        ["arcTapThreshold", new Uniform(0.002)],
        ["bodyData", new Uniform(bodyData)],
      ]),
    });
    this.bodyData = bodyData;
  }

  update(): void {
    const st = lightBenderBridgeState;
    const u = this.uniforms;
    (u.get("inverseProjectionMatrix")!.value as Matrix4).copy(
      st.inverseProjectionMatrix,
    );
    (u.get("cameraWorldMatrix")!.value as Matrix4).copy(st.cameraWorldMatrix);
    (u.get("projectionMatrix")!.value as Matrix4).copy(st.projectionMatrix);
    (u.get("viewMatrix")!.value as Matrix4).copy(st.viewMatrix);
    (u.get("cameraPosition")!.value as Vector3).copy(st.cameraPosition);
    u.get("lensingStrength")!.value = st.enabled ? st.lensingStrength : 0;
    u.get("stepCountFloat")!.value = st.stepCount;
    u.get("uvDeflectScale")!.value = st.uvDeflectScale;
    u.get("skyDepthStart")!.value = st.skyDepthStart;
    u.get("skyDepthEnd")!.value = st.skyDepthEnd;
    u.get("bodyCountFloat")!.value = st.enabled ? st.bodyCount : 0;
    u.get("correlationRayDistance")!.value = st.correlationRayDistance;
    (u.get("sunUv")!.value as Vector2).copy(st.sunUv);
    u.get("sunRingValid")!.value = st.sunRingValid;
    u.get("tangentialRingBoost")!.value = st.tangentialRingBoost;
    u.get("arcTapEnabled")!.value = st.arcTapEnabled;
    u.get("arcTapStrength")!.value = st.arcTapStrength;
    u.get("arcTapThreshold")!.value = st.arcTapThreshold;

    for (let i = 0; i < LIGHT_BENDER_MAX_BODIES; i++) {
      const p = st.bodyPos[i]!;
      const m = st.bodyMass[i]!;
      this.bodyData[i]!.set(p.x, p.y, p.z, m);
    }
  }
}
