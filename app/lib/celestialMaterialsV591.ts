import { CELESTIAL_SURFACE_VERTEX_V590 } from "./celestialMaterialsV590";

export const CELESTIAL_SURFACE_VERTEX_V591 = CELESTIAL_SURFACE_VERTEX_V590;
export const CELESTIAL_PRESENTATION_EPOCH_V591 = 591.271_828 as const;

/**
 * Presentation-only finite lunar relief. The sampled LOLA value changes only
 * v591 mesh vertices; Orbit Atlas coordinates and scientific payload remain
 * untouched. Source samples use half-metre units before deterministic
 * resampling and 8-bit presentation-height quantization.
 */
export const MOON_SURFACE_VERTEX_V591 = /* glsl */ `
  precision highp float;
  #include <common>
  #include <logdepthbuf_pars_vertex>
  uniform sampler2D uHeight;
  uniform float uRadius;
  uniform float uHeightMinimumRaw;
  uniform float uHeightMaximumRaw;
  uniform float uHeightReferenceRaw;
  uniform float uHeightMetersPerRawUnit;
  uniform float uLunarRadiusMeters;
  uniform float uVertexReliefGain;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec3 localNormal = normalize(normal);
    float encodedHeight = texture2D(uHeight, uv).r;
    float rawHeight = mix(uHeightMinimumRaw, uHeightMaximumRaw, encodedHeight);
    float reliefMeters = (rawHeight - uHeightReferenceRaw) * uHeightMetersPerRawUnit;
    float displacement = uRadius * reliefMeters / uLunarRadiusMeters * uVertexReliefGain;
    vec3 displacedPosition = position + localNormal * displacement;
    vec3 localNorth = abs(localNormal.y) > 0.985 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 localTangent = normalize(cross(localNorth, localNormal));
    vec3 localBitangent = normalize(cross(localNormal, localTangent));
    mat3 worldLinear = mat3(modelMatrix);
    vec3 rawWorldTangent = worldLinear * localTangent;
    vec3 rawWorldBitangent = worldLinear * localBitangent;
    vec3 worldNormal = normalize(cross(rawWorldTangent, rawWorldBitangent));
    vec3 worldTangent = normalize(rawWorldTangent - worldNormal * dot(worldNormal, rawWorldTangent));

    vLocalNormal = localNormal;
    vLocalPosition = displacedPosition;
    vec4 world = modelMatrix * vec4(displacedPosition, 1.0);
    vWorldNormal = worldNormal;
    vWorldTangent = worldTangent;
    vWorldBitangent = normalize(cross(worldNormal, worldTangent));
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
    #include <logdepthbuf_vertex>
  }
`;

/**
 * Presentation-only MESSENGER relief. The signed metre DEM is encoded into a
 * bounded 8-bit display height; displacement never changes ephemerides,
 * coordinates, classification, or any scientific payload.
 */
export const MERCURY_SURFACE_VERTEX_V591 = /* glsl */ `
  precision highp float;
  #include <common>
  #include <logdepthbuf_pars_vertex>
  uniform sampler2D uHeight;
  uniform float uRadius;
  uniform float uHeightMinimumMeters;
  uniform float uHeightMaximumMeters;
  uniform float uHeightReferenceMeters;
  uniform float uMercuryRadiusMeters;
  uniform float uVertexReliefGain;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec3 localNormal = normalize(normal);
    float encodedHeight = texture2D(uHeight, uv).r;
    float heightMeters = mix(uHeightMinimumMeters, uHeightMaximumMeters, encodedHeight);
    float reliefMeters = heightMeters - uHeightReferenceMeters;
    float displacement = uRadius * reliefMeters / uMercuryRadiusMeters * uVertexReliefGain;
    vec3 displacedPosition = position + localNormal * displacement;
    vec3 localNorth = abs(localNormal.y) > 0.985 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 localTangent = normalize(cross(localNorth, localNormal));
    vec3 localBitangent = normalize(cross(localNormal, localTangent));
    mat3 worldLinear = mat3(modelMatrix);
    vec3 rawWorldTangent = worldLinear * localTangent;
    vec3 rawWorldBitangent = worldLinear * localBitangent;
    vec3 worldNormal = normalize(cross(rawWorldTangent, rawWorldBitangent));
    vec3 worldTangent = normalize(rawWorldTangent - worldNormal * dot(worldNormal, rawWorldTangent));
    vec4 world = modelMatrix * vec4(displacedPosition, 1.0);
    vWorldNormal = worldNormal;
    vWorldTangent = worldTangent;
    vWorldBitangent = normalize(cross(worldNormal, worldTangent));
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
    #include <logdepthbuf_vertex>
  }
`;

/**
 * Presentation-only MOLA relief. Height is decoded from the sealed global
 * -8177..21171 m range and applied relative to the measured mean. The small
 * visual displacement never changes Orbit Atlas coordinates or ephemerides.
 */
export const MARS_SURFACE_VERTEX_V591 = /* glsl */ `
  precision highp float;
  #include <common>
  #include <logdepthbuf_pars_vertex>
  uniform sampler2D uHeight;
  uniform float uRadius;
  uniform float uHeightMinimumMeters;
  uniform float uHeightMaximumMeters;
  uniform float uHeightReferenceMeters;
  uniform float uMarsRadiusMeters;
  uniform float uVertexReliefGain;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec3 localNormal = normalize(normal);
    float encodedHeight = texture2D(uHeight, uv).r;
    float heightMeters = mix(uHeightMinimumMeters, uHeightMaximumMeters, encodedHeight);
    float reliefMeters = heightMeters - uHeightReferenceMeters;
    float displacement = uRadius * reliefMeters / uMarsRadiusMeters * uVertexReliefGain;
    vec3 displacedPosition = position + localNormal * displacement;
    vec3 localNorth = abs(localNormal.y) > 0.985 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 localTangent = normalize(cross(localNorth, localNormal));
    vec3 localBitangent = normalize(cross(localNormal, localTangent));
    mat3 worldLinear = mat3(modelMatrix);
    vec3 rawWorldTangent = worldLinear * localTangent;
    vec3 rawWorldBitangent = worldLinear * localBitangent;
    vec3 worldNormal = normalize(cross(rawWorldTangent, rawWorldBitangent));
    vec3 worldTangent = normalize(rawWorldTangent - worldNormal * dot(worldNormal, rawWorldTangent));
    vec4 world = modelMatrix * vec4(displacedPosition, 1.0);

    vLocalNormal = localNormal;
    vWorldNormal = worldNormal;
    vWorldTangent = worldTangent;
    vWorldBitangent = normalize(cross(worldNormal, worldTangent));
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
    #include <logdepthbuf_vertex>
  }
`;

/** Venus Magellan relief is presentation-only. The admitted color/topography
 * mosaic is converted into a deliberately bounded normalized displacement;
 * it is not measured elevation and never feeds orbit or scientific state. */
export const VENUS_SURFACE_VERTEX_V591 = /* glsl */ `
  precision highp float;
  #include <common>
  #include <logdepthbuf_pars_vertex>
  uniform sampler2D uHeight;
  uniform float uRadius;
  uniform float uReliefScaleRadiusFraction;
  uniform float uVertexReliefGain;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vec3 localNormal = normalize(normal);
    float encodedRelief = texture2D(uHeight, uv).r * 2.0 - 1.0;
    float displacement = uRadius * encodedRelief * uReliefScaleRadiusFraction * uVertexReliefGain;
    vec3 displaced = position + localNormal * displacement;
    vec3 north = abs(localNormal.y) > 0.985 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 tangent = normalize(cross(north, localNormal));
    vec3 bitangent = normalize(cross(localNormal, tangent));
    mat3 linear = mat3(modelMatrix);
    vec3 worldTangentRaw = linear * tangent;
    vec3 worldBitangentRaw = linear * bitangent;
    vec3 worldNormal = normalize(cross(worldTangentRaw, worldBitangentRaw));
    vec3 worldTangent = normalize(worldTangentRaw - worldNormal * dot(worldNormal, worldTangentRaw));
    vec4 world = modelMatrix * vec4(displaced, 1.0);
    vLocalNormal = localNormal;
    vWorldNormal = worldNormal;
    vWorldTangent = worldTangent;
    vWorldBitangent = normalize(cross(worldNormal, worldTangent));
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
    #include <logdepthbuf_vertex>
  }
`;

const GLSL_LIGHTING_V591 = /* glsl */ `
  float saturateV591(float value) { return clamp(value, 0.0, 1.0); }
  float luminanceV591(vec3 color) { return dot(color, vec3(0.2126, 0.7152, 0.0722)); }
  vec3 tangentNormalV591(
    vec3 worldNormal,
    vec3 worldTangent,
    vec3 worldBitangent,
    vec3 encodedNormal,
    float strength
  ) {
    vec3 detail = encodedNormal * 2.0 - 1.0;
    vec3 tangentDetail = vec3(detail.xy * strength, max(detail.z, 0.08));
    return normalize(
      normalize(worldTangent) * tangentDetail.x
      + normalize(worldBitangent) * tangentDetail.y
      + normalize(worldNormal) * tangentDetail.z
    );
  }
  float hash31V591(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123); }
  float noise3V591(vec3 p) {
    vec3 cell = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash31V591(cell);
    float n100 = hash31V591(cell + vec3(1.0, 0.0, 0.0));
    float n010 = hash31V591(cell + vec3(0.0, 1.0, 0.0));
    float n110 = hash31V591(cell + vec3(1.0, 1.0, 0.0));
    float n001 = hash31V591(cell + vec3(0.0, 0.0, 1.0));
    float n101 = hash31V591(cell + vec3(1.0, 0.0, 1.0));
    float n011 = hash31V591(cell + vec3(0.0, 1.0, 1.0));
    float n111 = hash31V591(cell + vec3(1.0, 1.0, 1.0));
    return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
  }
`;

function celestialFragmentV591(source: string): string {
  const withPreamble = source.replace(
    "precision highp float;",
    `precision highp float;\n#include <logdepthbuf_pars_fragment>\n${GLSL_LIGHTING_V591}`,
  );
  const withLogDepth = withPreamble.replace("  void main() {", "  void main() {\n#include <logdepthbuf_fragment>");
  const mainEnd = withLogDepth.lastIndexOf("  }");
  if (mainEnd < 0) throw new Error("v591-fragment-main-end-missing");
  return `${withLogDepth.slice(0, mainEnd)}#include <tonemapping_fragment>\n#include <colorspace_fragment>\n#include <premultiplied_alpha_fragment>\n${withLogDepth.slice(mainEnd)}`;
}

export const SOLAR_PHOTOSPHERE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uPhotosphere;
  uniform sampler2D uChromosphere;
  uniform float uCinematic;
  uniform float uEpoch;
  uniform vec2 uTexelSize;

  void main() {
    vec3 n = normalize(vLocalNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float mu = saturateV591(dot(normalize(vWorldNormal), viewDirection));
    vec3 observed = texture2D(uPhotosphere, vUv).rgb;
    vec3 activityObserved = texture2D(uChromosphere, vUv).rgb;
    vec3 localMean = (
      texture2D(uPhotosphere, vUv + vec2(uTexelSize.x * 5.0, 0.0)).rgb
      + texture2D(uPhotosphere, vUv - vec2(uTexelSize.x * 5.0, 0.0)).rgb
      + texture2D(uPhotosphere, vUv + vec2(0.0, uTexelSize.y * 5.0)).rgb
      + texture2D(uPhotosphere, vUv - vec2(0.0, uTexelSize.y * 5.0)).rgb
    ) * 0.25;
    float observedLuma = luminanceV591(observed);
    float localLuma = luminanceV591(localMean);
    float observedDetail = clamp((observedLuma - localLuma) * 5.0, -0.20, 0.20);
    float cells = noise3V591(n * 82.0 + uEpoch * 0.0017) * 0.60
      + noise3V591(n * 173.0 - uEpoch * 0.0011) * 0.28
      + noise3V591(n * 337.0 + uEpoch * 0.0004) * 0.12;
    float superCells = noise3V591(n * 18.0 - uEpoch * 0.0005);
    float activity = smoothstep(0.045, 0.34, luminanceV591(activityObserved));
    float localDeficit = smoothstep(0.018, 0.115, localLuma - observedLuma);
    float darkCore = (1.0 - smoothstep(0.035, 0.19, observedLuma)) * smoothstep(0.11, 0.34, localLuma);
    float sunspot = max(localDeficit, darkCore);
    float structure = saturateV591(observedLuma * 0.90 + observedDetail * 0.72 + (cells - 0.5) * 0.15 + (superCells - 0.5) * 0.035);
    vec3 cool = vec3(0.66, 0.045, 0.0022);
    vec3 hot = vec3(1.0, 0.61, 0.095);
    vec3 photosphere = mix(cool, hot, structure);
    photosphere *= 0.91 + smoothstep(0.20, 0.80, cells) * 0.18;
    photosphere += activityObserved * activity * mix(0.035, 0.075, uCinematic);
    photosphere *= mix(1.0, 0.12, sunspot * 0.94);
    float limb = 0.34 + 0.66 * pow(mu, 0.44);
    float radiance = limb * mix(0.96, 1.08, uCinematic);
    gl_FragColor = vec4(photosphere * radiance, 1.0);
  }
`);

export const SOLAR_CHROMOSPHERE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uChromosphere;
  uniform float uCinematic;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float mu = saturateV591(dot(normalize(vWorldNormal), viewDirection));
    float rim = pow(1.0 - mu, 2.25);
    vec3 observed = texture2D(uChromosphere, vUv).rgb;
    float structure = smoothstep(0.035, 0.62, luminanceV591(observed));
    vec3 color = mix(vec3(0.48, 0.018, 0.002), vec3(1.0, 0.24, 0.025), structure);
    float alpha = rim * structure * mix(0.08, 0.19, uCinematic);
    gl_FragColor = vec4(color, alpha);
  }
`);

export const SOLAR_CORONA_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform float uCinematic;
  uniform float uEpoch;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float mu = saturateV591(dot(normalize(vWorldNormal), viewDirection));
    float rim = pow(1.0 - mu, 3.2);
    float plume = noise3V591(normalize(vLocalNormal) * 8.0 + uEpoch * 0.0007);
    float alpha = rim * mix(0.025, 0.075, plume) * uCinematic;
    vec3 color = mix(vec3(1.0, 0.28, 0.035), vec3(1.0, 0.72, 0.30), plume);
    gl_FragColor = vec4(color, alpha);
  }
`);

export const EARTH_SURFACE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uAlbedo;
  uniform sampler2D uNormal;
  uniform sampler2D uRoughness;
  uniform sampler2D uCloudAlpha;
  uniform sampler2D uNight;
  uniform sampler2D uNightMask;
  uniform vec3 uSunWorld;
  uniform vec3 uSunLocal;
  uniform float uScience;
  uniform float uEpoch;

  void main() {
    vec3 observedAlbedo = texture2D(uAlbedo, vUv).rgb;
    float roughnessSignal = texture2D(uRoughness, vUv).r;
    vec3 normal = tangentNormalV591(
      normalize(vWorldNormal),
      normalize(vWorldTangent),
      normalize(vWorldBitangent),
      texture2D(uNormal, vUv).xyz,
      0.31
    );
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 halfDirection = normalize(lightDirection + viewDirection);
    float nDotLRaw = dot(normal, lightDirection);
    float nDotL = saturateV591(nDotLRaw);
    float nDotV = saturateV591(dot(normal, viewDirection));

    float blueDominance = observedAlbedo.b - max(observedAlbedo.r, observedAlbedo.g) * 0.76;
    float ocean = smoothstep(0.015, 0.17, blueDominance);
    vec3 oceanColor = mix(observedAlbedo * vec3(0.22, 0.26, 0.32), vec3(0.006, 0.025, 0.068), 0.60);
    vec3 landColor = observedAlbedo * mix(vec3(0.86, 0.88, 0.90), vec3(1.03, 1.00, 0.94), roughnessSignal);
    vec3 baseColor = mix(landColor, oceanColor, ocean);

    vec2 sunTangent = normalize(vec2(uSunLocal.z, -uSunLocal.y) + vec2(0.00001));
    vec2 lowerShadowUv = fract(vUv + sunTangent * 0.0038);
    vec2 upperShadowUv = fract(vUv + sunTangent * 0.0061 + vec2(0.0083, 0.0017));
    float lowerCloudShadow = texture2D(uCloudAlpha, lowerShadowUv).r;
    float upperCloudShadow = texture2D(uCloudAlpha, upperShadowUv).r;
    float cloudShadow = saturateV591(lowerCloudShadow * 0.68 + upperCloudShadow * 0.31);
    float terminator = smoothstep(-0.055, 0.105, nDotLRaw);
    float cloudTransmission = 1.0 - cloudShadow * terminator * 0.31;

    float sigma2 = roughnessSignal * roughnessSignal;
    float orenA = 1.0 - 0.50 * sigma2 / (sigma2 + 0.33);
    float orenB = 0.45 * sigma2 / (sigma2 + 0.09);
    float landDiffuse = nDotL * (orenA + orenB * sqrt(max((1.0 - nDotV) * (1.0 - nDotL), 0.0)));
    float fresnel = 0.02 + 0.98 * pow(1.0 - nDotV, 5.0);
    float oceanHalf = saturateV591(dot(normal, halfDirection));
    float waveFacet = noise3V591(normalize(vWorldPosition) * 139.0 + vec3(uEpoch * 0.000013));
    float waveFacetFine = noise3V591(normalize(vWorldPosition) * 317.0 - vec3(uEpoch * 0.000009));
    float facetResponse = mix(0.28, 1.0, smoothstep(0.46, 0.91, waveFacet * 0.66 + waveFacetFine * 0.34));
    float oceanGlint = pow(oceanHalf, mix(720.0, 1320.0, 1.0 - roughnessSignal))
      * nDotL * ocean * facetResponse;
    vec3 day = baseColor * (0.003 + landDiffuse * cloudTransmission * 1.02) * terminator;
    day += vec3(0.12, 0.25, 0.40) * fresnel * ocean * terminator * (0.04 + nDotL * 0.12);
    day += vec3(0.88, 0.93, 0.98) * oceanGlint * mix(0.016, 0.046, 1.0 - uScience);

    vec3 nightObserved = texture2D(uNight, vUv).rgb;
    float nightMask = texture2D(uNightMask, vUv).r;
    float nightGate = 1.0 - smoothstep(-0.16, 0.035, nDotLRaw);
    float citySignal = smoothstep(0.018, 0.48, luminanceV591(nightObserved) * nightMask * 2.0);
    vec3 cityLights = nightObserved * citySignal * nightGate * mix(0.52, 0.94, 1.0 - uScience);
    float deterministicExposure = 1.0 + (noise3V591(normalize(vWorldPosition) * 0.7 + uEpoch * 0.00001) - 0.5) * 0.006 * (1.0 - uScience);
    gl_FragColor = vec4((day + cityLights) * deterministicExposure, 1.0);
  }
`);

export const EARTH_CLOUD_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uClouds;
  uniform sampler2D uCloudAlpha;
  uniform vec3 uSunWorld;
  uniform vec2 uUvOffset;
  uniform float uLayerOpacity;
  uniform float uScience;

  void main() {
    vec2 uv = fract(vUv + uUvOffset);
    float maskA = texture2D(uCloudAlpha, uv).r;
    float maskB = texture2D(uCloudAlpha, fract(uv * vec2(1.007, 0.996) + vec2(0.003, -0.002))).r;
    float mask = smoothstep(0.018, 0.92, mix(maskA, maskB, 0.18));
    if (mask < 0.008) discard;
    vec3 observed = texture2D(uClouds, uv).rgb;
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float nDotLRaw = dot(normal, lightDirection);
    float diffuse = saturateV591(nDotLRaw);
    float silverLining = pow(1.0 - saturateV591(dot(normal, viewDirection)), 3.2) * smoothstep(-0.05, 0.32, nDotLRaw);
    float forward = pow(saturateV591(dot(viewDirection, -lightDirection)), 7.0);
    float lighting = 0.018 + diffuse * 1.05 + silverLining * 0.28 + forward * mix(0.0, 0.11, 1.0 - uScience);
    vec3 cloudColor = mix(vec3(luminanceV591(observed)), observed, 0.22) * vec3(0.96, 0.98, 1.0);
    float alpha = mask * uLayerOpacity * smoothstep(-0.12, 0.18, nDotLRaw + 0.10);
    gl_FragColor = vec4(cloudColor * lighting, alpha);
  }
`);

export const EARTH_ATMOSPHERE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uSunWorld;
  uniform vec3 uRayleighColor;
  uniform vec3 uMieColor;
  uniform float uDensity;
  uniform float uScience;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    float viewMu = saturateV591(abs(dot(normal, viewDirection)));
    float horizon = pow(1.0 - viewMu, 2.15);
    float sunAltitude = dot(normal, lightDirection);
    float day = smoothstep(-0.28, 0.24, sunAltitude);
    float twilight = smoothstep(-0.30, 0.04, sunAltitude) * (1.0 - smoothstep(0.02, 0.36, sunAltitude));
    float forward = pow(saturateV591(dot(viewDirection, -lightDirection)), 10.0);
    vec3 rayleigh = uRayleighColor * (0.20 + day * 0.88);
    vec3 mie = uMieColor * (twilight * 0.18 + forward * mix(0.015, 0.09, 1.0 - uScience));
    float alpha = horizon * uDensity * (0.15 + day * 0.72 + twilight * 0.28);
    gl_FragColor = vec4(rayleigh + mie, saturateV591(alpha));
  }
`);

export const MOON_SURFACE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uAlbedo;
  uniform sampler2D uNormal;
  uniform sampler2D uRoughness;
  uniform vec3 uSunWorld;
  uniform float uScience;

  void main() {
    vec3 observed = texture2D(uAlbedo, vUv).rgb;
    float observedLuma = luminanceV591(observed);
    vec3 regolithAlbedo = mix(vec3(observedLuma), observed, 0.32);
    regolithAlbedo *= vec3(0.91, 0.90, 0.87);
    float roughnessSignal = texture2D(uRoughness, vUv).r;
    vec3 normal = tangentNormalV591(
      normalize(vWorldNormal),
      normalize(vWorldTangent),
      normalize(vWorldBitangent),
      texture2D(uNormal, vUv).xyz,
      0.96
    );
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float nDotLRaw = dot(normal, lightDirection);
    float nDotL = saturateV591(nDotLRaw);
    float nDotV = saturateV591(dot(normal, viewDirection));

    float sigma = mix(0.72, 1.08, roughnessSignal);
    float sigma2 = sigma * sigma;
    float orenA = 1.0 - 0.50 * sigma2 / (sigma2 + 0.33);
    float orenB = 0.45 * sigma2 / (sigma2 + 0.09);
    vec3 projectedLight = normalize(lightDirection - normal * nDotL + vec3(0.00001));
    vec3 projectedView = normalize(viewDirection - normal * nDotV + vec3(0.00001));
    float azimuth = max(0.0, dot(projectedLight, projectedView));
    float sinAlpha = sqrt(max(0.0, 1.0 - min(nDotL, nDotV) * min(nDotL, nDotV)));
    float tanBeta = sqrt(max(0.0, 1.0 - max(nDotL, nDotV) * max(nDotL, nDotV)))
      / max(0.08, max(nDotL, nDotV));
    float orenNayar = nDotL * (orenA + orenB * azimuth * sinAlpha * tanBeta);
    float microHorizon = smoothstep(-0.018, 0.055, nDotLRaw);
    float opposition = pow(saturateV591(dot(lightDirection, viewDirection)), 22.0) * 0.075;
    float powderBackscatter = pow(1.0 - nDotV, 1.8) * nDotL * 0.025;
    float exposure = mix(1.0, 1.075, 1.0 - uScience);
    vec3 cinematicWarmth = mix(vec3(1.0), vec3(1.025, 0.995, 0.95), 1.0 - uScience);
    vec3 radiance = regolithAlbedo * (
      0.0015
      + orenNayar * microHorizon * (0.93 + opposition)
      + powderBackscatter
    );
    gl_FragColor = vec4(radiance * cinematicWarmth * exposure, 1.0);
  }
`);

/**
 * NASA PIA15063 albedo with independently observed MESSENGER topography.
 * Rough Oren-Nayar response and bounded opposition preserve crater relief
 * without a camera-facing glossy lobe.
 */
export const MERCURY_SURFACE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uAlbedo;
  uniform sampler2D uNormal;
  uniform sampler2D uRoughness;
  uniform vec3 uSunWorld;
  uniform float uScience;

  void main() {
    vec3 observed = texture2D(uAlbedo, vUv).rgb;
    float roughnessSignal = texture2D(uRoughness, vUv).r;
    vec3 normal = tangentNormalV591(
      normalize(vWorldNormal),
      normalize(vWorldTangent),
      normalize(vWorldBitangent),
      texture2D(uNormal, vUv).xyz,
      1.04
    );
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float nDotLRaw = dot(normal, lightDirection);
    float nDotL = saturateV591(nDotLRaw);
    float nDotV = saturateV591(dot(normal, viewDirection));
    float sigma = mix(0.84, 1.16, roughnessSignal);
    float sigma2 = sigma * sigma;
    float orenA = 1.0 - 0.50 * sigma2 / (sigma2 + 0.33);
    float orenB = 0.45 * sigma2 / (sigma2 + 0.09);
    vec3 projectedLight = normalize(lightDirection - normal * nDotL + vec3(0.00001));
    vec3 projectedView = normalize(viewDirection - normal * nDotV + vec3(0.00001));
    float azimuth = max(0.0, dot(projectedLight, projectedView));
    float sinAlpha = sqrt(max(0.0, 1.0 - min(nDotL, nDotV) * min(nDotL, nDotV)));
    float tanBeta = sqrt(max(0.0, 1.0 - max(nDotL, nDotV) * max(nDotL, nDotV))) / max(0.08, max(nDotL, nDotV));
    float diffuse = nDotL * (orenA + orenB * azimuth * sinAlpha * tanBeta);
    float terrainOcclusion = mix(0.82, 1.0, texture2D(uNormal, vUv).b);
    float microHorizon = smoothstep(-0.02, 0.055, nDotLRaw);
    float opposition = pow(saturateV591(dot(lightDirection, viewDirection)), 28.0) * 0.055;
    float observedLuma = luminanceV591(observed);
    vec3 scienceColor = mix(vec3(observedLuma), observed, 0.42) * vec3(0.92, 0.90, 0.86);
    vec3 cinematicColor = mix(vec3(observedLuma), observed, 0.55) * vec3(0.985, 0.93, 0.84);
    vec3 albedo = mix(cinematicColor, scienceColor, uScience);
    float presentationDiffuse = mix(1.18, 1.0, uScience);
    vec3 radiance = albedo * (
      mix(0.0024, 0.0012, uScience)
      + diffuse * terrainOcclusion * microHorizon * (0.96 + opposition) * presentationDiffuse
    );
    gl_FragColor = vec4(radiance * mix(1.10, 1.0, uScience), 1.0);
  }
`);

/**
 * USGS Viking color plus independently observed MOLA terrain. The material is
 * deliberately rough and contains no specular lobe; Science stays linear,
 * while Cinematic may apply only a bounded warm presentation response.
 */
export const MARS_SURFACE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uAlbedo;
  uniform sampler2D uNormal;
  uniform sampler2D uRoughness;
  uniform vec3 uSunWorld;
  uniform float uScience;

  void main() {
    vec3 observed = texture2D(uAlbedo, vUv).rgb;
    float roughnessSignal = texture2D(uRoughness, vUv).r;
    vec3 normal = tangentNormalV591(
      normalize(vWorldNormal),
      normalize(vWorldTangent),
      normalize(vWorldBitangent),
      texture2D(uNormal, vUv).xyz,
      0.88
    );
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float nDotLRaw = dot(normal, lightDirection);
    float nDotL = saturateV591(nDotLRaw);
    float nDotV = saturateV591(dot(normal, viewDirection));
    float terminator = smoothstep(-0.035, 0.075, nDotLRaw);

    float sigma = mix(0.86, 1.18, roughnessSignal);
    float sigma2 = sigma * sigma;
    float orenA = 1.0 - 0.50 * sigma2 / (sigma2 + 0.33);
    float orenB = 0.45 * sigma2 / (sigma2 + 0.09);
    vec3 projectedLight = normalize(lightDirection - normal * nDotL + vec3(0.00001));
    vec3 projectedView = normalize(viewDirection - normal * nDotV + vec3(0.00001));
    float azimuth = max(0.0, dot(projectedLight, projectedView));
    float sinAlpha = sqrt(max(0.0, 1.0 - min(nDotL, nDotV) * min(nDotL, nDotV)));
    float tanBeta = sqrt(max(0.0, 1.0 - max(nDotL, nDotV) * max(nDotL, nDotV)))
      / max(0.08, max(nDotL, nDotV));
    float diffuse = nDotL * (orenA + orenB * azimuth * sinAlpha * tanBeta);
    float powderBackscatter = pow(1.0 - nDotV, 1.55) * nDotL * 0.035;
    float terrainOcclusion = mix(0.89, 1.0, texture2D(uNormal, vUv).b);
    float observedLuma = luminanceV591(observed);
    vec3 scienceColor = mix(vec3(observedLuma), observed, 0.92);
    vec3 cinematicColor = observed * vec3(1.035, 0.985, 0.925);
    cinematicColor = mix(vec3(luminanceV591(cinematicColor)), cinematicColor, 1.04);
    vec3 albedo = mix(cinematicColor, scienceColor, uScience);
    vec3 radiance = albedo * (0.0015 + (diffuse * terrainOcclusion + powderBackscatter) * terminator);
    gl_FragColor = vec4(radiance * mix(1.055, 1.0, uScience), 1.0);
  }
`);

export const MARS_ATMOSPHERE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uSunWorld;
  uniform float uScience;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    float viewMu = saturateV591(abs(dot(normal, viewDirection)));
    float horizon = pow(1.0 - viewMu, 2.65);
    float sunAltitude = dot(normal, lightDirection);
    float day = smoothstep(-0.20, 0.18, sunAltitude);
    float twilight = smoothstep(-0.26, 0.02, sunAltitude) * (1.0 - smoothstep(0.015, 0.30, sunAltitude));
    float forward = pow(saturateV591(dot(viewDirection, -lightDirection)), 12.0);
    vec3 dust = vec3(0.78, 0.25, 0.085) * (0.12 + day * 0.48 + twilight * 0.22);
    vec3 highHaze = vec3(0.18, 0.29, 0.46) * (0.035 + twilight * 0.12);
    float cinematicForward = forward * 0.055 * (1.0 - uScience);
    float alpha = horizon * (0.018 + day * 0.040 + twilight * 0.026);
    gl_FragColor = vec4(dust + highHaze + vec3(0.74, 0.36, 0.14) * cinematicForward, alpha);
  }
`);

/** Magellan surface plus a declared physical-inspired cloud deck. The cloud
 * field is deterministic presentation state, explicitly not an observation
 * texture and never a missing-asset fallback. */
export const VENUS_SURFACE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uSurface;
  uniform sampler2D uNormal;
  uniform sampler2D uRoughness;
  uniform sampler2D uHeight;
  uniform vec3 uSunWorld;
  uniform float uScience;
  uniform float uEpoch;
  float cloudBandV591(vec3 n) {
    float latitude = asin(clamp(n.y, -1.0, 1.0));
    float longitude = atan(n.z, n.x);
    float broad = sin(latitude * 74.0 + longitude * 1.7 + uEpoch * 0.0012) * 0.5 + 0.5;
    float fine = noise3V591(n * 58.0 + vec3(uEpoch * 0.0003)) * 0.22;
    return smoothstep(0.38, 0.72, broad * 0.78 + fine);
  }
  void main() {
    vec3 surface = texture2D(uSurface, vUv).rgb;
    vec3 normal = tangentNormalV591(normalize(vWorldNormal), normalize(vWorldTangent), normalize(vWorldBitangent), texture2D(uNormal, vUv).rgb, 0.24);
    float roughness = texture2D(uRoughness, vUv).r;
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float nDotLRaw = dot(normal, lightDirection);
    float nDotL = saturateV591(nDotLRaw);
    float nDotV = saturateV591(dot(normal, viewDirection));
    float terminator = smoothstep(-0.18, 0.15, nDotLRaw);
    float cloud = cloudBandV591(normalize(vLocalNormal));
    vec3 cloudColor = mix(vec3(0.76, 0.64, 0.47), vec3(1.0, 0.88, 0.69), cloud);
    vec3 mutedSurface = mix(surface * vec3(0.68, 0.60, 0.48), surface * vec3(0.88, 0.73, 0.54), 0.36);
    vec3 albedo = mix(mutedSurface, cloudColor, 0.78);
    float sigma = mix(0.74, 1.02, roughness);
    float sigma2 = sigma * sigma;
    float orenA = 1.0 - 0.50 * sigma2 / (sigma2 + 0.33);
    float orenB = 0.45 * sigma2 / (sigma2 + 0.09);
    float diffuse = nDotL * (orenA + orenB * sqrt(max((1.0 - nDotV) * (1.0 - nDotL), 0.0)));
    float limb = 0.36 + 0.64 * pow(nDotV, 0.30);
    float cloudSilver = pow(1.0 - nDotV, 2.8) * mix(0.01, 0.055, 1.0 - uScience);
    vec3 radiance = albedo * (0.015 + diffuse * 1.08) * terminator * limb;
    radiance += cloudColor * cloudSilver * terminator;
    gl_FragColor = vec4(radiance, 1.0);
  }
`);

export const VENUS_ATMOSPHERE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uSunWorld;
  uniform float uScience;
  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    float horizon = pow(1.0 - saturateV591(abs(dot(normal, viewDirection))), 2.15);
    float sunMu = dot(normal, lightDirection);
    float day = smoothstep(-0.26, 0.22, sunMu);
    float twilight = smoothstep(-0.32, 0.04, sunMu) * (1.0 - smoothstep(0.02, 0.35, sunMu));
    vec3 sulfur = vec3(0.92, 0.57, 0.24) * (0.12 + day * 0.34);
    vec3 cool = vec3(0.63, 0.49, 0.33) * (twilight * 0.11 + horizon * 0.07);
    float alpha = horizon * (0.035 + day * 0.075 + twilight * 0.04) * mix(0.70, 1.0, 1.0 - uScience);
    gl_FragColor = vec4(sulfur + cool, alpha);
  }
`);

/**
 * Cassini-derived Jupiter presentation material. Science samples the admitted
 * cylindrical source without UV motion. Cinematic mode may apply only the
 * fixed-epoch, source-mask-bounded zonal offset below; neither path contains a
 * specular lobe, so the gas giant cannot collapse into a plastic highlight.
 */
export const JUPITER_SURFACE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uAlbedo;
  uniform sampler2D uBandMask;
  uniform sampler2D uStormMask;
  uniform vec3 uSunWorld;
  uniform float uScience;
  uniform float uEpoch;

  void main() {
    float latitude = vUv.y * 2.0 - 1.0;
    float sourceBand = texture2D(uBandMask, vUv).r;
    float sourceStorm = texture2D(uStormMask, vUv).r;
    float zonalDirection = sin(latitude * 63.0 + sourceBand * 2.4);
    float zonalOffset = (1.0 - uScience)
      * (sourceBand - 0.5)
      * zonalDirection
      * (0.00075 + sourceStorm * 0.00042)
      * (0.92 + fract(uEpoch * 0.0001) * 0.08);
    vec2 observedUv = vec2(fract(vUv.x + zonalOffset), vUv.y);
    vec3 observed = texture2D(uAlbedo, observedUv).rgb;
    float bandDetail = texture2D(uBandMask, observedUv).r;
    float stormDetail = texture2D(uStormMask, observedUv).r;

    vec3 normal = normalize(vWorldNormal);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float nDotLRaw = dot(normal, lightDirection);
    float diffuse = saturateV591(nDotLRaw);
    float viewMu = saturateV591(dot(normal, viewDirection));
    float terminator = smoothstep(-0.075, 0.10, nDotLRaw);
    float limbDarkening = 0.34 + 0.66 * pow(viewMu, 0.46);
    float multipleScattering = diffuse * (0.90 + (1.0 - diffuse) * 0.12);

    float observedLuma = luminanceV591(observed);
    vec3 scienceColor = observed;
    vec3 cinematicColor = mix(vec3(observedLuma), observed, 1.055);
    cinematicColor *= 0.975 + (bandDetail - 0.5) * 0.075;
    cinematicColor = mix(cinematicColor, cinematicColor * vec3(1.055, 0.965, 0.90), stormDetail * 0.14);
    vec3 albedo = mix(cinematicColor, scienceColor, uScience);
    vec3 radiance = albedo * (0.0025 + multipleScattering * terminator) * limbDarkening;
    gl_FragColor = vec4(radiance, 1.0);
  }
`);

/**
 * Saturn presentation shaders.  The atmosphere is driven by a source-derived
 * Cassini latitude profile, with the north-polar detail map gated to the
 * observed cap.  Ring UV is radial by construction; all gap and shadow terms
 * are deterministic presentation parameters and never enter scientific state.
 */
export const SATURN_SURFACE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uAlbedo;
  uniform sampler2D uBands;
  uniform sampler2D uPolarDetail;
  uniform sampler2D uRingOpticalDepth;
  uniform vec3 uSunWorld;
  uniform vec3 uSunLocal;
  uniform float uInnerRadius;
  uniform float uOuterRadius;
  uniform float uCassiniStart;
  uniform float uCassiniEnd;
  uniform float uEnckeCenter;
  uniform float uEnckeHalfWidth;
  uniform float uScience;

  float ringTauV591(float normalizedRadius) {
    float source = texture2D(uRingOpticalDepth, vec2(clamp(normalizedRadius, 0.0, 1.0), 0.5)).r;
    float cassini = 1.0 - smoothstep(0.002, 0.009, abs(normalizedRadius - mix(uCassiniStart, uCassiniEnd, 0.5)));
    float encke = 1.0 - smoothstep(uEnckeHalfWidth * 0.35, uEnckeHalfWidth * 1.8, abs(normalizedRadius - uEnckeCenter));
    return source * (1.0 - cassini * 0.96) * (1.0 - encke * 0.90);
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 localNormal = normalize(vLocalNormal);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float nDotLRaw = dot(normal, lightDirection);
    float nDotL = saturateV591(nDotLRaw);
    float nDotV = saturateV591(dot(normal, viewDirection));
    float terminator = smoothstep(-0.10, 0.16, nDotLRaw);
    float limbDarkening = 0.32 + 0.68 * pow(nDotV, 0.42);
    float band = texture2D(uBands, vUv).r;
    vec3 albedo = texture2D(uAlbedo, vUv).rgb;
    albedo *= 0.94 + (band - 0.5) * 0.13;

    float polarGate = smoothstep(0.64, 0.88, localNormal.y);
    vec2 polarUv = localNormal.xz * 0.5 + 0.5;
    float polarDetail = texture2D(uPolarDetail, polarUv).r;
    albedo *= 1.0 + (polarDetail - 0.5) * polarGate * 0.12;
    albedo = mix(albedo, albedo * vec3(0.86, 0.93, 1.04), polarGate * 0.16);

    vec3 localLight = normalize(uSunLocal - vLocalPosition);
    float ringShadow = 0.0;
    if (abs(localLight.y) > 0.00001) {
      float intersection = -vLocalPosition.y / localLight.y;
      vec3 ringHit = vLocalPosition + localLight * intersection;
      float radial = length(ringHit.xz);
      float normalizedRadius = (radial - uInnerRadius) / max(uOuterRadius - uInnerRadius, 0.0001);
      if (intersection > 0.0 && normalizedRadius > 0.0 && normalizedRadius < 1.0) {
        ringShadow = ringTauV591(normalizedRadius);
      }
    }
    float multipleScattering = 0.06 + nDotL * 0.88 + (1.0 - nDotL) * 0.08;
    float shadowed = 1.0 - ringShadow * mix(0.74, 0.84, 1.0 - uScience);
    vec3 cinematicWarmth = mix(vec3(1.0), vec3(1.018, 0.992, 0.955), 1.0 - uScience);
    vec3 radiance = albedo * multipleScattering * terminator * shadowed * limbDarkening;
    gl_FragColor = vec4(radiance * cinematicWarmth, 1.0);
  }
`);

export const SATURN_ATMOSPHERE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uSunWorld;
  uniform float uScience;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    float horizon = pow(1.0 - saturateV591(abs(dot(normal, viewDirection))), 2.35);
    float sunAltitude = dot(normal, lightDirection);
    float day = smoothstep(-0.22, 0.22, sunAltitude);
    float twilight = smoothstep(-0.30, 0.04, sunAltitude) * (1.0 - smoothstep(0.02, 0.34, sunAltitude));
    vec3 warm = vec3(0.86, 0.77, 0.60) * (0.18 + day * 0.54);
    vec3 cool = vec3(0.48, 0.63, 0.82) * (twilight * 0.15 + pow(1.0 - saturateV591(dot(normal, viewDirection)), 3.0) * 0.05);
    float alpha = horizon * (0.045 + day * 0.12 + twilight * 0.06);
    gl_FragColor = vec4(warm + cool, alpha * mix(0.72, 1.0, 1.0 - uScience));
  }
`);

export const SATURN_RING_VERTEX_V591 = /* glsl */ `
  precision highp float;
  #include <common>
  #include <logdepthbuf_pars_vertex>
  varying vec2 vRingUv;
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vRingUv = uv;
    vLocalPosition = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
    #include <logdepthbuf_vertex>
  }
`;

export const SATURN_RING_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec2 vRingUv;
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  uniform sampler2D uRingColor;
  uniform sampler2D uRingOpticalDepth;
  uniform vec3 uSunWorld;
  uniform vec3 uSunLocal;
  uniform vec3 uCameraWorld;
  uniform float uPlanetRadius;
  uniform float uCassiniStart;
  uniform float uCassiniEnd;
  uniform float uEnckeCenter;
  uniform float uEnckeHalfWidth;
  uniform float uScience;

  float gapTransmissionV591(float radius) {
    float cassini = 1.0 - smoothstep(0.004, 0.012, abs(radius - mix(uCassiniStart, uCassiniEnd, 0.5)));
    float encke = 1.0 - smoothstep(uEnckeHalfWidth * 0.35, uEnckeHalfWidth * 1.8, abs(radius - uEnckeCenter));
    return (1.0 - cassini * 0.97) * (1.0 - encke * 0.92);
  }

  void main() {
    float radius = clamp(vRingUv.x, 0.0, 1.0);
    float edge = smoothstep(0.0, 0.016, radius) * (1.0 - smoothstep(0.985, 1.0, radius));
    vec3 color = texture2D(uRingColor, vec2(radius, 0.5)).rgb;
    float opticalDepth = texture2D(uRingOpticalDepth, vec2(radius, 0.5)).r * gapTransmissionV591(radius);
    vec3 localLight = normalize(uSunLocal - vLocalPosition);
    vec3 viewDirection = normalize(uCameraWorld - vWorldPosition);
    float illuminationCosine = abs(dot(normalize(vWorldNormal), localLight));
    float along = dot(-vLocalPosition, localLight);
    vec3 closest = vLocalPosition + localLight * max(along, 0.0);
    float planetShadow = step(0.0, along) * (1.0 - smoothstep(uPlanetRadius * 0.94, uPlanetRadius * 1.06, length(closest)));
    float forwardScatter = pow(saturateV591(dot(viewDirection, -localLight)), 10.0);
    float backScatter = pow(saturateV591(dot(viewDirection, localLight)), 3.0);
    float pathLength = 1.0 / max(0.11, illuminationCosine);
    float alpha = (1.0 - exp(-opticalDepth * pathLength * 2.4)) * edge;
    float lighting = 0.18 + illuminationCosine * 0.72 + backScatter * 0.14;
    lighting *= 1.0 - planetShadow * 0.90;
    lighting += forwardScatter * mix(0.018, 0.16, 1.0 - uScience);
    color = max(color, vec3(0.018)) * lighting;
    color *= mix(vec3(1.0), vec3(1.025, 0.99, 0.93), 1.0 - uScience);
    gl_FragColor = vec4(color * alpha, alpha);
  }
`);

/**
 * Registered analytical ice-giant primary. This is a presentation model with
 * a fixed epoch, not an observational texture or measured photometric field.
 * Science keeps the same geometry and deterministic bands while removing the
 * cinematic contrast lift. No camera-facing specular term is present.
 */
export const ICE_GIANT_SURFACE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uEquatorialColor;
  uniform vec3 uPolarColor;
  uniform vec3 uCloudColor;
  uniform vec3 uStormColor;
  uniform vec3 uSunWorld;
  uniform float uBandFrequency;
  uniform float uStormLatitude;
  uniform float uStormStrength;
  uniform float uPolarHaze;
  uniform float uBodyKind;
  uniform float uEpoch;
  uniform float uScience;

  float iceNoiseV591(vec2 coordinate) {
    vec2 cell = floor(coordinate);
    vec2 fraction = fract(coordinate);
    fraction = fraction * fraction * (3.0 - 2.0 * fraction);
    float a = hash31V591(vec3(cell, 0.0));
    float b = hash31V591(vec3(cell + vec2(1.0, 0.0), 0.0));
    float c = hash31V591(vec3(cell + vec2(0.0, 1.0), 0.0));
    float d = hash31V591(vec3(cell + vec2(1.0), 0.0));
    return mix(mix(a, b, fraction.x), mix(c, d, fraction.x), fraction.y);
  }

  void main() {
    vec3 localNormal = normalize(vLocalNormal);
    float latitude = asin(clamp(localNormal.y, -1.0, 1.0));
    float longitude = atan(localNormal.z, localNormal.x);
    float absoluteLatitude = abs(latitude) / 1.57079632679;
    float deterministicPhase = uEpoch * 0.0027;
    float broadBand = sin(latitude * uBandFrequency + sin(latitude * 7.0) * 0.62) * 0.5 + 0.5;
    float fineBand = sin(latitude * (uBandFrequency * 2.45) + longitude * 0.72 + deterministicPhase) * 0.5 + 0.5;
    float cloudNoise = iceNoiseV591(vec2(longitude * 9.0 + deterministicPhase, latitude * 58.0));
    float bandDetail = (broadBand - 0.5) * 0.085 + (fineBand - 0.5) * 0.032 + (cloudNoise - 0.5) * 0.026;
    float polarWeight = smoothstep(0.42, 0.94, absoluteLatitude);
    vec3 albedo = mix(uEquatorialColor, uPolarColor, polarWeight * uPolarHaze);
    albedo = mix(albedo, uCloudColor, clamp(0.16 + bandDetail, 0.03, 0.32));

    float stormLatitudeGate = exp(-pow(latitude - uStormLatitude, 2.0) * mix(74.0, 48.0, uBodyKind));
    float stormLongitudeGate = smoothstep(0.70, 0.985, cos(longitude * mix(2.0, 3.0, uBodyKind) + latitude * 9.0 + deterministicPhase * 1.7));
    float storm = stormLatitudeGate * stormLongitudeGate * uStormStrength;
    albedo = mix(albedo, uStormColor, storm * mix(0.18, 0.42, uBodyKind));

    vec3 normal = normalize(vWorldNormal);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float nDotL = saturateV591(dot(normal, lightDirection));
    float nDotV = saturateV591(dot(normal, viewDirection));
    float terminator = smoothstep(-0.10, 0.18, dot(normal, lightDirection));
    float methaneLimb = pow(nDotV, mix(0.34, 0.28, uBodyKind));
    float multipleScattering = mix(0.026, 0.042, 1.0 - uScience) + nDotL * 1.08 + (1.0 - nDotL) * 0.035;
    float cinematicContrast = mix(1.0, 1.075, 1.0 - uScience);
    vec3 radiance = albedo * multipleScattering * terminator * (0.56 + methaneLimb * 0.49) * cinematicContrast;
    gl_FragColor = vec4(radiance, 1.0);
  }
`);

export const ICE_GIANT_ATMOSPHERE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uRayleighColor;
  uniform vec3 uMieColor;
  uniform vec3 uSunWorld;
  uniform float uBodyKind;
  uniform float uScience;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    float viewMu = saturateV591(dot(normal, viewDirection));
    float sunMu = dot(normal, lightDirection);
    float horizon = pow(1.0 - viewMu, mix(2.7, 2.25, uBodyKind));
    float day = smoothstep(-0.20, 0.18, sunMu);
    float twilight = smoothstep(-0.34, 0.02, sunMu) * (1.0 - smoothstep(0.03, 0.34, sunMu));
    vec3 color = uRayleighColor * (0.10 + day * 0.58) + uMieColor * twilight * 0.22;
    float alpha = horizon * (0.035 + day * mix(0.105, 0.135, uBodyKind) + twilight * 0.055);
    gl_FragColor = vec4(color, alpha * mix(0.74, 1.0, 1.0 - uScience));
  }
`);

export const ICE_GIANT_RING_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec2 vRingUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  uniform vec3 uRingColor;
  uniform vec3 uSunWorld;
  uniform float uBodyKind;
  uniform float uScience;

  void main() {
    float radius = clamp(vRingUv.x, 0.0, 1.0);
    float narrowBands = sin(radius * mix(410.0, 286.0, uBodyKind)) * sin(radius * mix(173.0, 119.0, uBodyKind));
    float transmission = smoothstep(0.34, 0.92, narrowBands * 0.5 + 0.5);
    float edge = smoothstep(0.0, 0.035, radius) * (1.0 - smoothstep(0.965, 1.0, radius));
    float illumination = 0.15 + abs(dot(normalize(vWorldNormal), normalize(uSunWorld - vWorldPosition))) * 0.52;
    float baseOpacity = mix(0.19, 0.075, uBodyKind);
    float alpha = transmission * edge * baseOpacity * mix(0.78, 1.0, 1.0 - uScience);
    gl_FragColor = vec4(uRingColor * illumination * alpha, alpha);
  }
`);

/**
 * Bennu keeps the NASA shape model as its macro-geometry. Poly Haven CC0
 * channels contribute only bounded, grayscale triplanar microvariation; they
 * are never treated as Bennu albedo, topography, or photometry.
 */
export const BENNU_REGOLITH_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uMicroAlbedo;
  uniform sampler2D uMicroNormal;
  uniform sampler2D uMicroRoughness;
  uniform vec3 uSunWorld;
  uniform float uTextureScale;
  uniform float uScience;

  vec3 triplanarWeightsV591(vec3 normal) {
    vec3 weights = pow(max(abs(normal), vec3(0.0001)), vec3(7.0));
    return weights / max(dot(weights, vec3(1.0)), 0.0001);
  }

  vec3 triplanarSampleV591(sampler2D source, vec3 position, vec3 weights) {
    vec3 x = texture2D(source, position.yz * uTextureScale).rgb;
    vec3 y = texture2D(source, position.xz * uTextureScale).rgb;
    vec3 z = texture2D(source, position.xy * uTextureScale).rgb;
    return x * weights.x + y * weights.y + z * weights.z;
  }

  float orenNayarV591(vec3 normal, vec3 lightDirection, vec3 viewDirection, float roughness) {
    float nDotL = saturateV591(dot(normal, lightDirection));
    float nDotV = saturateV591(dot(normal, viewDirection));
    float sigma = mix(0.62, 1.02, saturateV591(roughness));
    float sigma2 = sigma * sigma;
    float a = 1.0 - 0.5 * sigma2 / (sigma2 + 0.33);
    float b = 0.45 * sigma2 / (sigma2 + 0.09);
    vec3 lightPlane = normalize(lightDirection - normal * nDotL + vec3(0.000001));
    vec3 viewPlane = normalize(viewDirection - normal * nDotV + vec3(0.000001));
    float azimuth = max(0.0, dot(lightPlane, viewPlane));
    float sinAlpha = sqrt(max(0.0, 1.0 - min(nDotL, nDotV) * min(nDotL, nDotV)));
    float tanBeta = sqrt(max(0.0, 1.0 - max(nDotL, nDotV) * max(nDotL, nDotV))) / max(max(nDotL, nDotV), 0.08);
    return nDotL * (a + b * azimuth * sinAlpha * tanBeta);
  }

  void main() {
    vec3 weights = triplanarWeightsV591(normalize(vLocalNormal));
    vec3 microColor = triplanarSampleV591(uMicroAlbedo, vLocalPosition, weights);
    vec3 encodedNormal = triplanarSampleV591(uMicroNormal, vLocalPosition, weights) * 2.0 - 1.0;
    float roughness = triplanarSampleV591(uMicroRoughness, vLocalPosition, weights).r;
    vec3 normal = normalize(
      normalize(vWorldNormal)
      + normalize(vWorldTangent) * encodedNormal.x * 0.12
      + normalize(vWorldBitangent) * encodedNormal.y * 0.12
    );
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float diffuse = orenNayarV591(normal, lightDirection, viewDirection, roughness);
    float phaseAlignment = saturateV591(dot(lightDirection, viewDirection));
    float opposition = pow(phaseAlignment, 28.0) * mix(0.08, 0.13, 1.0 - uScience);
    float microLuminance = luminanceV591(microColor);
    float microVariation = clamp(0.82 + (microLuminance - 0.5) * 0.34, 0.72, 1.08);
    vec3 carbonaceousSubstrate = vec3(0.052, 0.049, 0.046) * microVariation;
    float deterministicFill = mix(0.022, 0.034, 1.0 - uScience);
    vec3 radiance = carbonaceousSubstrate * (deterministicFill + diffuse * 1.52 + opposition);
    gl_FragColor = vec4(radiance, 1.0);
  }
`);

/**
 * Vesta keeps the NASA global shape model as macro-geometry. The shared CC0
 * regolith set supplies only bounded triplanar microstructure; the neutral
 * achondrite substrate is a declared presentation reference, not measured
 * Vesta photometry.
 */
export const VESTA_REGOLITH_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uMicroAlbedo;
  uniform sampler2D uMicroNormal;
  uniform sampler2D uMicroRoughness;
  uniform vec3 uSunWorld;
  uniform float uTextureScale;
  uniform float uScience;

  vec3 vestaTriplanarWeightsV591(vec3 normal) {
    vec3 weights = pow(max(abs(normal), vec3(0.0001)), vec3(7.0));
    return weights / max(dot(weights, vec3(1.0)), 0.0001);
  }

  vec3 vestaTriplanarSampleV591(sampler2D source, vec3 position, vec3 weights) {
    vec3 x = texture2D(source, position.yz * uTextureScale).rgb;
    vec3 y = texture2D(source, position.xz * uTextureScale).rgb;
    vec3 z = texture2D(source, position.xy * uTextureScale).rgb;
    return x * weights.x + y * weights.y + z * weights.z;
  }

  float vestaOrenNayarV591(vec3 normal, vec3 lightDirection, vec3 viewDirection, float roughness) {
    float nDotL = saturateV591(dot(normal, lightDirection));
    float nDotV = saturateV591(dot(normal, viewDirection));
    float sigma = mix(0.52, 0.94, saturateV591(roughness));
    float sigma2 = sigma * sigma;
    float a = 1.0 - 0.5 * sigma2 / (sigma2 + 0.33);
    float b = 0.45 * sigma2 / (sigma2 + 0.09);
    vec3 lightPlane = normalize(lightDirection - normal * nDotL + vec3(0.000001));
    vec3 viewPlane = normalize(viewDirection - normal * nDotV + vec3(0.000001));
    float azimuth = max(0.0, dot(lightPlane, viewPlane));
    float sinAlpha = sqrt(max(0.0, 1.0 - min(nDotL, nDotV) * min(nDotL, nDotV)));
    float tanBeta = sqrt(max(0.0, 1.0 - max(nDotL, nDotV) * max(nDotL, nDotV))) / max(max(nDotL, nDotV), 0.08);
    return nDotL * (a + b * azimuth * sinAlpha * tanBeta);
  }

  void main() {
    vec3 localNormal = normalize(vLocalNormal);
    vec3 weights = vestaTriplanarWeightsV591(localNormal);
    vec3 microColor = vestaTriplanarSampleV591(uMicroAlbedo, vLocalPosition, weights);
    vec3 encodedNormal = vestaTriplanarSampleV591(uMicroNormal, vLocalPosition, weights) * 2.0 - 1.0;
    float roughness = vestaTriplanarSampleV591(uMicroRoughness, vLocalPosition, weights).r;
    vec3 normal = normalize(
      normalize(vWorldNormal)
      + normalize(vWorldTangent) * encodedNormal.x * 0.085
      + normalize(vWorldBitangent) * encodedNormal.y * 0.085
    );
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float diffuse = vestaOrenNayarV591(normal, lightDirection, viewDirection, roughness);
    float phaseAlignment = saturateV591(dot(lightDirection, viewDirection));
    float opposition = pow(phaseAlignment, 32.0) * mix(0.055, 0.085, 1.0 - uScience);
    float microLuminance = luminanceV591(microColor);
    float microVariation = clamp(0.91 + (microLuminance - 0.5) * 0.22, 0.78, 1.10);
    float southernBasin = smoothstep(-0.16, -0.58, normalize(vLocalPosition).y);
    float longitudeFacet = 0.5 + 0.5 * sin(atan(vLocalPosition.z, vLocalPosition.x) * 3.0 + 0.7);
    vec3 neutralEucrite = mix(vec3(0.205, 0.194, 0.178), vec3(0.245, 0.226, 0.199), 1.0 - uScience);
    vec3 basinSubstrate = vec3(0.143, 0.139, 0.132);
    vec3 substrate = mix(neutralEucrite, basinSubstrate, southernBasin * (0.22 + longitudeFacet * 0.12)) * microVariation;
    float deterministicFill = mix(0.026, 0.040, 1.0 - uScience);
    vec3 radiance = substrate * (deterministicFill + diffuse * 1.34 + opposition);
    gl_FragColor = vec4(radiance, 1.0);
  }
`);

/**
 * Ceres uses the Dawn/PDS SPC radius mesh as macro-geometry and the co-registered
 * global relative-albedo/radius derivatives as its spherical material. The
 * reused CC0 regolith channels contribute only low-amplitude microstructure;
 * they are explicitly not Ceres observation data or measured photometry.
 */
export const CERES_SURFACE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uAlbedo;
  uniform sampler2D uMacroNormal;
  uniform sampler2D uRoughness;
  uniform sampler2D uHeight;
  uniform sampler2D uMicroAlbedo;
  uniform sampler2D uMicroNormal;
  uniform sampler2D uMicroRoughness;
  uniform vec3 uSunWorld;
  uniform float uTextureScale;
  uniform float uScience;

  vec2 ceresSphericalUvV591(vec3 position) {
    vec3 direction = normalize(position);
    float longitude = atan(direction.z, direction.x);
    return vec2(fract(longitude / 6.28318530718 + 1.0), acos(clamp(direction.y, -1.0, 1.0)) / 3.14159265359);
  }

  vec3 ceresTriplanarWeightsV591(vec3 normal) {
    vec3 weights = pow(max(abs(normal), vec3(0.0001)), vec3(7.0));
    return weights / max(dot(weights, vec3(1.0)), 0.0001);
  }

  vec3 ceresTriplanarSampleV591(sampler2D source, vec3 position, vec3 weights) {
    vec3 x = texture2D(source, position.yz * uTextureScale).rgb;
    vec3 y = texture2D(source, position.xz * uTextureScale).rgb;
    vec3 z = texture2D(source, position.xy * uTextureScale).rgb;
    return x * weights.x + y * weights.y + z * weights.z;
  }

  float ceresOrenNayarV591(vec3 normal, vec3 lightDirection, vec3 viewDirection, float roughness) {
    float nDotL = saturateV591(dot(normal, lightDirection));
    float nDotV = saturateV591(dot(normal, viewDirection));
    float sigma = mix(0.56, 1.02, saturateV591(roughness));
    float sigma2 = sigma * sigma;
    float a = 1.0 - 0.5 * sigma2 / (sigma2 + 0.33);
    float b = 0.45 * sigma2 / (sigma2 + 0.09);
    vec3 lightPlane = normalize(lightDirection - normal * nDotL + vec3(0.000001));
    vec3 viewPlane = normalize(viewDirection - normal * nDotV + vec3(0.000001));
    float azimuth = max(0.0, dot(lightPlane, viewPlane));
    float sinAlpha = sqrt(max(0.0, 1.0 - min(nDotL, nDotV) * min(nDotL, nDotV)));
    float tanBeta = sqrt(max(0.0, 1.0 - max(nDotL, nDotV) * max(nDotL, nDotV))) / max(max(nDotL, nDotV), 0.08);
    return nDotL * (a + b * azimuth * sinAlpha * tanBeta);
  }

  void main() {
    vec3 localNormal = normalize(vLocalNormal);
    vec2 sphericalUv = ceresSphericalUvV591(vLocalPosition);
    vec3 observedAlbedo = texture2D(uAlbedo, sphericalUv).rgb;
    vec3 macroNormal = texture2D(uMacroNormal, sphericalUv).rgb * 2.0 - 1.0;
    float observedRoughness = texture2D(uRoughness, sphericalUv).r;
    float observedHeight = texture2D(uHeight, sphericalUv).r;
    vec3 weights = ceresTriplanarWeightsV591(localNormal);
    vec3 microColor = ceresTriplanarSampleV591(uMicroAlbedo, vLocalPosition, weights);
    vec3 microNormalSample = ceresTriplanarSampleV591(uMicroNormal, vLocalPosition, weights) * 2.0 - 1.0;
    float microRoughness = ceresTriplanarSampleV591(uMicroRoughness, vLocalPosition, weights).r;
    vec3 normal = normalize(
      normalize(vWorldNormal)
      - normalize(vWorldTangent) * macroNormal.x * 0.42
      + normalize(vWorldBitangent) * macroNormal.y * 0.42
      + normalize(vWorldTangent) * microNormalSample.x * 0.035
      + normalize(vWorldBitangent) * microNormalSample.y * 0.035
    );
    float roughness = clamp(mix(observedRoughness, microRoughness, 0.10), 0.70, 0.97);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float diffuse = ceresOrenNayarV591(normal, lightDirection, viewDirection, roughness);
    float phaseAlignment = saturateV591(dot(lightDirection, viewDirection));
    float opposition = pow(phaseAlignment, 34.0) * mix(0.045, 0.072, 1.0 - uScience);
    float microLuminance = luminanceV591(microColor);
    float microVariation = clamp(0.985 + (microLuminance - 0.5) * 0.08, 0.94, 1.04);
    float reliefVariation = mix(0.965, 1.025, observedHeight);
    vec3 substrate = observedAlbedo * microVariation * reliefVariation;
    float deterministicFill = mix(0.024, 0.038, 1.0 - uScience);
    vec3 radiance = substrate * (deterministicFill + diffuse * 1.36 + opposition);
    gl_FragColor = vec4(radiance, 1.0);
  }
`);

/**
 * NASA Eros/Kleopatra shape models remain the macro-geometry authority for
 * this additive visual candidate. The shared Poly Haven channels are bounded
 * presentation microstructure only. uBodyKind=0 is the declared S-type Eros
 * reference; uBodyKind=1 is the muted M-type Kleopatra reference. Neither
 * branch claims measured albedo or photometry, and neither uses a glossy lobe.
 */
export const NASA_SMALL_BODY_REGOLITH_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uMicroAlbedo;
  uniform sampler2D uMicroNormal;
  uniform sampler2D uMicroRoughness;
  uniform vec3 uSunWorld;
  uniform float uTextureScale;
  uniform float uScience;
  uniform float uBodyKind;

  vec3 nasaSmallBodyWeightsV591(vec3 normal) {
    vec3 weights = pow(max(abs(normal), vec3(0.0001)), vec3(7.0));
    return weights / max(dot(weights, vec3(1.0)), 0.0001);
  }

  vec3 nasaSmallBodySampleV591(sampler2D source, vec3 position, vec3 weights) {
    vec3 x = texture2D(source, position.yz * uTextureScale).rgb;
    vec3 y = texture2D(source, position.xz * uTextureScale).rgb;
    vec3 z = texture2D(source, position.xy * uTextureScale).rgb;
    return x * weights.x + y * weights.y + z * weights.z;
  }

  float nasaSmallBodyOrenNayarV591(vec3 normal, vec3 lightDirection, vec3 viewDirection, float roughness) {
    float nDotL = saturateV591(dot(normal, lightDirection));
    float nDotV = saturateV591(dot(normal, viewDirection));
    float sigma = mix(0.58, 1.04, saturateV591(roughness));
    float sigma2 = sigma * sigma;
    float a = 1.0 - 0.5 * sigma2 / (sigma2 + 0.33);
    float b = 0.45 * sigma2 / (sigma2 + 0.09);
    vec3 lightPlane = normalize(lightDirection - normal * nDotL + vec3(0.000001));
    vec3 viewPlane = normalize(viewDirection - normal * nDotV + vec3(0.000001));
    float azimuth = max(0.0, dot(lightPlane, viewPlane));
    float sinAlpha = sqrt(max(0.0, 1.0 - min(nDotL, nDotV) * min(nDotL, nDotV)));
    float tanBeta = sqrt(max(0.0, 1.0 - max(nDotL, nDotV) * max(nDotL, nDotV))) / max(max(nDotL, nDotV), 0.08);
    return nDotL * (a + b * azimuth * sinAlpha * tanBeta);
  }

  void main() {
    vec3 localNormal = normalize(vLocalNormal);
    vec3 weights = nasaSmallBodyWeightsV591(localNormal);
    vec3 microColor = nasaSmallBodySampleV591(uMicroAlbedo, vLocalPosition, weights);
    vec3 encodedNormal = nasaSmallBodySampleV591(uMicroNormal, vLocalPosition, weights) * 2.0 - 1.0;
    float roughness = nasaSmallBodySampleV591(uMicroRoughness, vLocalPosition, weights).r;
    float normalStrength = mix(0.105, 0.072, uBodyKind);
    vec3 normal = normalize(
      normalize(vWorldNormal)
      + normalize(vWorldTangent) * encodedNormal.x * normalStrength
      + normalize(vWorldBitangent) * encodedNormal.y * normalStrength
    );
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float nDotL = saturateV591(dot(normal, lightDirection));
    float nDotV = saturateV591(dot(normal, viewDirection));
    float diffuse = nasaSmallBodyOrenNayarV591(normal, lightDirection, viewDirection, roughness);
    float phaseAlignment = saturateV591(dot(lightDirection, viewDirection));
    float opposition = pow(phaseAlignment, mix(30.0, 24.0, uBodyKind)) * mix(0.058, 0.084, 1.0 - uScience);
    float microLuminance = luminanceV591(microColor);
    float microVariation = clamp(0.90 + (microLuminance - 0.5) * mix(0.30, 0.20, uBodyKind), 0.76, 1.10);
    vec3 erosSilicate = mix(vec3(0.158, 0.127, 0.101), vec3(0.205, 0.151, 0.108), 1.0 - uScience);
    vec3 kleopatraMetalRich = mix(vec3(0.112, 0.101, 0.091), vec3(0.151, 0.119, 0.095), 1.0 - uScience);
    vec3 substrate = mix(erosSilicate, kleopatraMetalRich, uBodyKind) * microVariation;
    float broadMetalEdge = uBodyKind * pow(1.0 - nDotV, 2.4) * nDotL * mix(0.018, 0.032, 1.0 - uScience);
    vec3 edgeEnergy = vec3(0.145, 0.119, 0.098) * broadMetalEdge;
    float deterministicFill = mix(0.024, 0.038, 1.0 - uScience);
    vec3 radiance = substrate * (deterministicFill + diffuse * mix(1.38, 1.26, uBodyKind) + opposition) + edgeEnergy;
    gl_FragColor = vec4(radiance, 1.0);
  }
`);

/**
 * Tempel 1 uses the PDS simple-cylindrical MRI/ITS/Navcam mosaic only where
 * its independently derived coverage mask is valid. Exact-zero source pixels
 * are unobserved, not dark terrain. Those areas receive the declared Poly
 * Haven CC0 substrate below; the substitution is presentation-only and never
 * represented as Tempel 1 observation or measured photometry.
 */
export const TEMPEL1_SURFACE_FRAGMENT_V591 = celestialFragmentV591(/* glsl */ `
  precision highp float;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uObservation;
  uniform sampler2D uCoverageMask;
  uniform sampler2D uMicroAlbedo;
  uniform sampler2D uMicroNormal;
  uniform sampler2D uMicroRoughness;
  uniform vec3 uSunWorld;
  uniform float uTextureScale;
  uniform float uScience;

  vec3 tempelWeightsV591(vec3 normal) {
    vec3 weights = pow(max(abs(normal), vec3(0.0001)), vec3(7.0));
    return weights / max(dot(weights, vec3(1.0)), 0.0001);
  }

  vec3 tempelTriplanarV591(sampler2D source, vec3 position, vec3 weights) {
    vec3 x = texture2D(source, position.yz * uTextureScale).rgb;
    vec3 y = texture2D(source, position.xz * uTextureScale).rgb;
    vec3 z = texture2D(source, position.xy * uTextureScale).rgb;
    return x * weights.x + y * weights.y + z * weights.z;
  }

  float tempelOrenNayarV591(vec3 normal, vec3 lightDirection, vec3 viewDirection, float roughness) {
    float nDotL = saturateV591(dot(normal, lightDirection));
    float nDotV = saturateV591(dot(normal, viewDirection));
    float sigma = mix(0.62, 1.06, saturateV591(roughness));
    float sigma2 = sigma * sigma;
    float a = 1.0 - 0.5 * sigma2 / (sigma2 + 0.33);
    float b = 0.45 * sigma2 / (sigma2 + 0.09);
    vec3 lightPlane = normalize(lightDirection - normal * nDotL + vec3(0.000001));
    vec3 viewPlane = normalize(viewDirection - normal * nDotV + vec3(0.000001));
    float azimuth = max(0.0, dot(lightPlane, viewPlane));
    float sinAlpha = sqrt(max(0.0, 1.0 - min(nDotL, nDotV) * min(nDotL, nDotV)));
    float tanBeta = sqrt(max(0.0, 1.0 - max(nDotL, nDotV) * max(nDotL, nDotV))) / max(max(nDotL, nDotV), 0.08);
    return nDotL * (a + b * azimuth * sinAlpha * tanBeta);
  }

  void main() {
    vec3 localDirection = normalize(vLocalPosition);
    float longitude = atan(localDirection.z, localDirection.x);
    float latitude = asin(clamp(localDirection.y, -1.0, 1.0));
    vec2 observationUv = vec2(fract(longitude / 6.283185307179586 + 0.5), 0.5 - latitude / 3.141592653589793);
    float observed = texture2D(uObservation, observationUv).r;
    float coverage = smoothstep(0.08, 0.92, texture2D(uCoverageMask, observationUv).r);

    vec3 weights = tempelWeightsV591(normalize(vLocalNormal));
    vec3 microColor = tempelTriplanarV591(uMicroAlbedo, vLocalPosition, weights);
    vec3 encodedNormal = tempelTriplanarV591(uMicroNormal, vLocalPosition, weights) * 2.0 - 1.0;
    float roughness = tempelTriplanarV591(uMicroRoughness, vLocalPosition, weights).r;
    vec3 normal = normalize(
      normalize(vWorldNormal)
      + normalize(vWorldTangent) * encodedNormal.x * mix(0.088, 0.048, coverage)
      + normalize(vWorldBitangent) * encodedNormal.y * mix(0.088, 0.048, coverage)
    );
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float diffuse = tempelOrenNayarV591(normal, lightDirection, viewDirection, roughness);
    float phaseAlignment = saturateV591(dot(lightDirection, viewDirection));
    float opposition = pow(phaseAlignment, 30.0) * mix(0.050, 0.076, 1.0 - uScience);

    float microLuma = luminanceV591(microColor);
    float substrateVariation = clamp(0.88 + (microLuma - 0.5) * 0.30, 0.74, 1.10);
    vec3 unobservedSubstrate = mix(vec3(0.095, 0.091, 0.087), vec3(0.128, 0.112, 0.096), 1.0 - uScience) * substrateVariation;
    vec3 observedNeutral = vec3(observed) * mix(vec3(0.92), vec3(1.015, 0.975, 0.915), 1.0 - uScience);
    observedNeutral *= mix(0.90, 1.06, clamp((microLuma - 0.5) * 0.36 + 0.5, 0.0, 1.0));
    vec3 substrate = mix(unobservedSubstrate, observedNeutral, coverage);
    float deterministicFill = mix(0.022, 0.034, 1.0 - uScience);
    vec3 radiance = substrate * (deterministicFill + diffuse * 1.34 + opposition);
    gl_FragColor = vec4(radiance, 1.0);
  }
`);
