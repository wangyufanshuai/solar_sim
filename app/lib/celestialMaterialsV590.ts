import * as THREE from "three";

/**
 * The visual epoch is deliberately fixed.  v590 shaders may use it to break
 * up repeated bands, but it must never be replaced with wall-clock time in a
 * scientific render or a visual-regression capture.
 */
export const CELESTIAL_PRESENTATION_EPOCH_V590 = 590.271_828;

export const CELESTIAL_SURFACE_VERTEX_V590 = /* glsl */ `
  precision highp float;
  #include <common>
  #include <logdepthbuf_pars_vertex>
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
    vec3 localNorth = abs(localNormal.y) > 0.985 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 localTangent = normalize(cross(localNorth, localNormal));
    vec3 localBitangent = normalize(cross(localNormal, localTangent));
    mat3 worldLinear = mat3(modelMatrix);
    vec3 rawWorldTangent = worldLinear * localTangent;
    vec3 rawWorldBitangent = worldLinear * localBitangent;
    vec3 worldNormal = normalize(cross(rawWorldTangent, rawWorldBitangent));
    vec3 worldTangent = normalize(rawWorldTangent - worldNormal * dot(worldNormal, rawWorldTangent));

    vLocalNormal = localNormal;
    vLocalPosition = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldNormal = worldNormal;
    vWorldTangent = worldTangent;
    vWorldBitangent = normalize(cross(worldNormal, worldTangent));
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
    #include <logdepthbuf_vertex>
  }
`;

const GLSL_LIGHTING_V590 = /* glsl */ `
  float saturateV590(float value) {
    return clamp(value, 0.0, 1.0);
  }

  vec3 tangentNormalV590(
    vec3 worldNormal,
    vec3 worldTangent,
    vec3 worldBitangent,
    vec3 encodedNormal,
    float strength
  ) {
    vec3 detail = encodedNormal * 2.0 - 1.0;
    vec3 tangentDetail = vec3(detail.xy * strength, max(detail.z, 0.05));
    return normalize(
      normalize(worldTangent) * tangentDetail.x
      + normalize(worldBitangent) * tangentDetail.y
      + normalize(worldNormal) * tangentDetail.z
    );
  }

  float luminanceV590(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
  }
`;

const GLSL_FRAGMENT_PARS_V590 = /* glsl */ `
  #include <logdepthbuf_pars_fragment>
`;

const GLSL_FRAGMENT_BEGIN_V590 = /* glsl */ `
    #include <logdepthbuf_fragment>
`;

const GLSL_FRAGMENT_OUTPUT_V590 = /* glsl */ `
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <premultiplied_alpha_fragment>
`;

function celestialFragmentV590(source: string): string {
  const withPreamble = source.replace(
    "precision highp float;",
    `precision highp float;\n${GLSL_FRAGMENT_PARS_V590}\n${GLSL_LIGHTING_V590}`,
  );
  const withLogDepth = withPreamble.replace(
    "  void main() {",
    `  void main() {\n${GLSL_FRAGMENT_BEGIN_V590}`,
  );
  const mainEnd = withLogDepth.lastIndexOf("  }");
  if (mainEnd < 0) throw new Error("v590-fragment-main-end-missing");
  return `${withLogDepth.slice(0, mainEnd)}${GLSL_FRAGMENT_OUTPUT_V590}${withLogDepth.slice(mainEnd)}`;
}

export const SOLAR_PHOTOSPHERE_FRAGMENT_V590 = celestialFragmentV590(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uPhotosphere;
  uniform float uCinematic;
  uniform float uEpoch;

  float hash31V590(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }

  float noise3V590(vec3 p) {
    vec3 cell = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash31V590(cell);
    float n100 = hash31V590(cell + vec3(1.0, 0.0, 0.0));
    float n010 = hash31V590(cell + vec3(0.0, 1.0, 0.0));
    float n110 = hash31V590(cell + vec3(1.0, 1.0, 0.0));
    float n001 = hash31V590(cell + vec3(0.0, 0.0, 1.0));
    float n101 = hash31V590(cell + vec3(1.0, 0.0, 1.0));
    float n011 = hash31V590(cell + vec3(0.0, 1.0, 1.0));
    float n111 = hash31V590(cell + vec3(1.0, 1.0, 1.0));
    return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
  }

  float granulationV590(vec3 p) {
    float result = noise3V590(p * 37.0 + uEpoch * 0.003);
    result = result * 0.62 + noise3V590(p * 91.0 - uEpoch * 0.002) * 0.28;
    result += noise3V590(p * 181.0) * 0.10;
    return result;
  }

  // The admitted SDO source is a photographed disk, not an equirectangular
  // map.  All three samples stay inside that disk and use continuously
  // normalized weights, avoiding the hard triplanar split visible in v589.
  vec3 seamSafePhotosphereV590(vec3 n) {
    vec3 weights = abs(n) + vec3(0.18);
    weights /= dot(weights, vec3(1.0));
    vec2 uvX = n.zy * 0.255 + 0.5;
    vec2 uvY = n.xz * 0.255 + 0.5;
    vec2 uvZ = n.xy * 0.255 + 0.5;
    return texture2D(uPhotosphere, uvX).rgb * weights.x
      + texture2D(uPhotosphere, uvY).rgb * weights.y
      + texture2D(uPhotosphere, uvZ).rgb * weights.z;
  }

  void main() {
    vec3 n = normalize(vLocalNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float mu = saturateV590(dot(normalize(vWorldNormal), viewDirection));
    vec3 source = seamSafePhotosphereV590(n);
    float sourceLight = dot(source, vec3(0.20, 0.64, 0.16));
    float cells = granulationV590(n);
    float darkFeature = 1.0 - smoothstep(0.08, 0.34, sourceLight);
    float limb = 0.38 + 0.62 * pow(mu, 0.42);
    vec3 coolCell = vec3(0.97, 0.20, 0.018);
    vec3 hotCell = vec3(1.0, 0.82, 0.29);
    vec3 photosphere = mix(coolCell, hotCell, saturateV590(cells * 0.72 + sourceLight * 0.54));
    photosphere *= mix(1.0, 0.34, darkFeature * 0.78);
    float radiance = limb * mix(1.18, 1.34, uCinematic);
    gl_FragColor = vec4(photosphere * radiance, 1.0);
  }
`);

export const SOLAR_CHROMOSPHERE_FRAGMENT_V590 = celestialFragmentV590(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uChromosphere;
  uniform float uCinematic;

  vec3 seamSafeChromosphereV590(vec3 n) {
    vec3 weights = abs(n) + vec3(0.18);
    weights /= dot(weights, vec3(1.0));
    return texture2D(uChromosphere, n.zy * 0.255 + 0.5).rgb * weights.x
      + texture2D(uChromosphere, n.xz * 0.255 + 0.5).rgb * weights.y
      + texture2D(uChromosphere, n.xy * 0.255 + 0.5).rgb * weights.z;
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float mu = saturateV590(dot(normal, viewDirection));
    float rim = pow(1.0 - mu, 2.7);
    vec3 source = seamSafeChromosphereV590(normalize(vLocalNormal));
    float filament = smoothstep(0.18, 0.72, luminanceV590(source));
    vec3 color = mix(vec3(1.0, 0.16, 0.018), vec3(1.0, 0.56, 0.10), filament);
    float alpha = rim * mix(0.07, 0.24, uCinematic) * (0.48 + filament * 0.52);
    gl_FragColor = vec4(color, alpha);
  }
`);

export const EARTH_SURFACE_FRAGMENT_V590 = celestialFragmentV590(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
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

  void main() {
    vec3 albedo = texture2D(uAlbedo, vUv).rgb;
    vec3 normalSample = texture2D(uNormal, vUv).xyz;
    vec3 normal = tangentNormalV590(
      normalize(vWorldNormal),
      normalize(vWorldTangent),
      normalize(vWorldBitangent),
      normalSample,
      0.22
    );
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 halfDirection = normalize(lightDirection + viewDirection);
    float nDotL = dot(normal, lightDirection);
    float nDotV = saturateV590(dot(normal, viewDirection));
    float diffuse = saturateV590(nDotL);
    float materialRoughness = texture2D(uRoughness, vUv).r;
    float blueDominance = albedo.b - max(albedo.r, albedo.g) * 0.72;
    float ocean = smoothstep(0.015, 0.22, blueDominance) * (1.0 - smoothstep(0.16, 0.78, materialRoughness));
    float landRoughness = mix(0.72, 0.96, materialRoughness);
    vec2 cloudOffset = vec2(uSunLocal.z, -uSunLocal.y) * 0.0042;
    float cloudShadow = texture2D(uCloudAlpha, fract(vUv + cloudOffset)).r;
    float shadowGate = smoothstep(-0.02, 0.22, nDotL);
    float cloudTransmission = 1.0 - cloudShadow * shadowGate * 0.24;
    float fresnel = pow(1.0 - nDotV, 5.0);
    float oceanGlint = pow(saturateV590(dot(normal, halfDirection)), 112.0)
      * smoothstep(0.01, 0.2, diffuse) * ocean;
    float landDiffuse = diffuse * mix(0.79, 0.96, 1.0 - landRoughness);
    vec3 day = albedo * (0.012 + landDiffuse * cloudTransmission * 1.12);
    day += vec3(0.53, 0.72, 0.88) * fresnel * ocean * (0.07 + diffuse * 0.12);
    day += vec3(1.0, 0.92, 0.72) * oceanGlint * mix(0.62, 0.82, 1.0 - uScience);
    vec3 night = texture2D(uNight, vUv).rgb;
    float nightMask = texture2D(uNightMask, vUv).r;
    float nightGate = 1.0 - smoothstep(-0.13, 0.045, nDotL);
    float citySignal = saturateV590(luminanceV590(night) * nightMask * 2.6);
    vec3 cityLights = night * citySignal * nightGate * mix(0.54, 1.12, 1.0 - uScience);
    gl_FragColor = vec4(day + cityLights, 1.0);
  }
`);

export const EARTH_CLOUD_FRAGMENT_V590 = celestialFragmentV590(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uClouds;
  uniform sampler2D uCloudAlpha;
  uniform vec3 uSunWorld;
  uniform float uScience;

  void main() {
    float mask = texture2D(uCloudAlpha, vUv).r;
    if (mask < 0.012) discard;
    vec3 cloud = texture2D(uClouds, vUv).rgb;
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float diffuse = saturateV590(dot(normalize(vWorldNormal), lightDirection));
    float forward = pow(saturateV590(dot(viewDirection, -lightDirection)), 5.0);
    float lighting = 0.075 + diffuse * 1.06 + forward * mix(0.02, 0.16, 1.0 - uScience);
    float alpha = mask * mix(0.48, 0.68, 1.0 - uScience);
    gl_FragColor = vec4(cloud * lighting, alpha);
  }
`);

export const ATMOSPHERE_FRAGMENT_V590 = celestialFragmentV590(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uRayleighColor;
  uniform vec3 uMieColor;
  uniform vec3 uSunWorld;
  uniform float uDensity;
  uniform float uScience;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    float mu = saturateV590(dot(normal, viewDirection));
    float rim = pow(1.0 - mu, 3.25);
    float day = smoothstep(-0.22, 0.30, dot(normal, lightDirection));
    float forward = pow(saturateV590(dot(viewDirection, -lightDirection)), 8.0);
    vec3 color = uRayleighColor * (0.38 + day * 0.74) + uMieColor * forward * mix(0.07, 0.32, 1.0 - uScience);
    float alpha = rim * uDensity * (0.26 + day * 0.74);
    gl_FragColor = vec4(color, saturateV590(alpha));
  }
`);

export const ROCKY_SURFACE_FRAGMENT_V590 = celestialFragmentV590(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uAlbedo;
  uniform sampler2D uNormal;
  uniform sampler2D uRoughness;
  uniform vec3 uSunWorld;
  uniform float uRelief;
  uniform float uScience;

  void main() {
    vec3 albedo = texture2D(uAlbedo, vUv).rgb;
    float roughness = max(0.62, texture2D(uRoughness, vUv).r);
    vec3 normal = tangentNormalV590(
      normalize(vWorldNormal),
      normalize(vWorldTangent),
      normalize(vWorldBitangent),
      texture2D(uNormal, vUv).xyz,
      uRelief
    );
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float nDotL = saturateV590(dot(normal, lightDirection));
    float nDotV = saturateV590(dot(normal, viewDirection));
    float sigma2 = roughness * roughness;
    float orenA = 1.0 - 0.50 * sigma2 / (sigma2 + 0.33);
    float orenB = 0.45 * sigma2 / (sigma2 + 0.09);
    float lunarBackscatter = pow(saturateV590(dot(lightDirection, viewDirection)), 10.0) * 0.08;
    float diffuse = nDotL * (orenA + orenB * sqrt(max((1.0 - nDotV) * (1.0 - nDotL), 0.0)));
    float cavity = mix(0.78, 1.08, luminanceV590(albedo));
    float fill = mix(0.028, 0.012, uScience);
    vec3 result = albedo * cavity * (fill + diffuse * 1.12 + lunarBackscatter * nDotL);
    gl_FragColor = vec4(result, 1.0);
  }
`);

export const VENUS_SURFACE_FRAGMENT_V590 = celestialFragmentV590(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uSurface;
  uniform sampler2D uClouds;
  uniform vec3 uSunWorld;
  uniform float uScience;
  uniform float uEpoch;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float diffuse = saturateV590(dot(normal, lightDirection));
    float limb = pow(saturateV590(dot(normal, viewDirection)), 0.22);
    vec2 flow = vec2(0.013 * sin(vUv.y * 19.0 + uEpoch), 0.0);
    vec3 surface = texture2D(uSurface, vUv).rgb;
    vec3 cloudsA = texture2D(uClouds, fract(vUv + flow)).rgb;
    vec3 cloudsB = texture2D(uClouds, fract(vUv - flow * 0.47)).rgb;
    float cloudStructure = smoothstep(0.18, 0.92, luminanceV590(mix(cloudsA, cloudsB, 0.42)));
    vec3 cloudColor = mix(vec3(0.76, 0.57, 0.31), vec3(1.0, 0.86, 0.58), cloudStructure);
    vec3 albedo = mix(surface * 0.34, cloudColor, 0.88);
    float light = mix(0.018, 0.031, 1.0 - uScience) + diffuse * 1.16;
    gl_FragColor = vec4(albedo * light * (0.72 + limb * 0.28), 1.0);
  }
`);

export const GAS_GIANT_FRAGMENT_V590 = celestialFragmentV590(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uAlbedo;
  uniform sampler2D uBands;
  uniform vec3 uSunWorld;
  uniform float uFlowPhase;
  uniform float uScience;

  void main() {
    float latitude = (vUv.y - 0.5) * 3.14159265359;
    float bandMask = texture2D(uBands, vUv).r;
    float shear = sin(latitude * 21.0 + sin(latitude * 5.0) * 1.4) * 0.0018;
    vec2 advectedUv = vec2(fract(vUv.x + shear * uFlowPhase), vUv.y);
    vec3 baseA = texture2D(uAlbedo, advectedUv).rgb;
    vec3 baseB = texture2D(uAlbedo, vec2(fract(advectedUv.x - shear * 0.54), advectedUv.y)).rgb;
    vec3 albedo = mix(baseA, baseB, 0.18 + bandMask * 0.12);
    float redStorm = smoothstep(0.04, 0.25, albedo.r - albedo.g) * smoothstep(0.16, 0.72, albedo.r);
    albedo = mix(albedo, albedo * vec3(1.08, 0.91, 0.82), redStorm * 0.48);
    albedo *= mix(0.91, 1.08, bandMask * 0.42);
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float diffuse = saturateV590(dot(normal, lightDirection));
    float limb = pow(saturateV590(dot(normal, viewDirection)), 0.32);
    float lighting = mix(0.025, 0.048, 1.0 - uScience) + diffuse * 1.26;
    gl_FragColor = vec4(albedo * lighting * (0.61 + limb * 0.44), 1.0);
  }
`);

export const SATURN_PLANET_FRAGMENT_V590 = celestialFragmentV590(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uAlbedo;
  uniform sampler2D uBands;
  uniform sampler2D uRingOpticalDepth;
  uniform vec3 uSunWorld;
  uniform vec3 uSunLocal;
  uniform float uInnerRadius;
  uniform float uOuterRadius;
  uniform float uScience;

  float ringProfileV590(float normalizedRadius) {
    float sourceRadius = mix(0.235, 0.49, saturateV590(normalizedRadius));
    float source = texture2D(uRingOpticalDepth, vec2(0.5 + sourceRadius, 0.5)).r;
    float cassini = 1.0 - smoothstep(0.006, 0.018, abs(normalizedRadius - 0.635));
    float encke = 1.0 - smoothstep(0.0025, 0.009, abs(normalizedRadius - 0.914));
    return source * (1.0 - cassini * 0.94) * (1.0 - encke * 0.84);
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float diffuse = saturateV590(dot(normal, lightDirection));
    float limb = pow(saturateV590(dot(normal, viewDirection)), 0.30);
    vec3 albedo = texture2D(uAlbedo, vUv).rgb;
    float band = texture2D(uBands, vUv).r;
    albedo *= mix(0.91, 1.075, band * 0.44);

    vec3 localLight = normalize(uSunLocal - vLocalPosition);
    float ringShadow = 0.0;
    if (abs(localLight.y) > 0.00001) {
      float t = -vLocalPosition.y / localLight.y;
      vec3 ringHit = vLocalPosition + localLight * t;
      float radial = length(ringHit.xz);
      float normalizedRadius = (radial - uInnerRadius) / max(uOuterRadius - uInnerRadius, 0.0001);
      if (t > 0.0 && normalizedRadius > 0.0 && normalizedRadius < 1.0) {
        ringShadow = ringProfileV590(normalizedRadius);
      }
    }
    float lighting = mix(0.024, 0.045, 1.0 - uScience) + diffuse * 1.22;
    lighting *= 1.0 - ringShadow * 0.73;
    gl_FragColor = vec4(albedo * lighting * (0.66 + limb * 0.39), 1.0);
  }
`);

export const RADIAL_RING_VERTEX_V590 = /* glsl */ `
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

export const SATURN_RING_FRAGMENT_V590 = celestialFragmentV590(/* glsl */ `
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
  uniform float uScience;

  float gapV590(float radius, float center, float halfWidth) {
    return 1.0 - smoothstep(halfWidth * 0.32, halfWidth, abs(radius - center));
  }

  void main() {
    float angle = vRingUv.y * 6.28318530718;
    float sourceRadius = mix(0.235, 0.49, vRingUv.x);
    vec2 sourceUv = vec2(0.5) + vec2(cos(angle), sin(angle)) * sourceRadius;
    vec3 color = texture2D(uRingColor, sourceUv).rgb;
    float opticalDepth = texture2D(uRingOpticalDepth, sourceUv).r;
    float cassiniTransmission = gapV590(vRingUv.x, 0.635, 0.018);
    float enckeTransmission = gapV590(vRingUv.x, 0.914, 0.009);
    opticalDepth *= (1.0 - cassiniTransmission * 0.96) * (1.0 - enckeTransmission * 0.88);
    float edge = smoothstep(0.0, 0.015, vRingUv.x) * (1.0 - smoothstep(0.985, 1.0, vRingUv.x));

    vec3 localLight = normalize(uSunLocal - vLocalPosition);
    float closestT = dot(-vLocalPosition, localLight);
    vec3 closest = vLocalPosition + localLight * max(closestT, 0.0);
    float planetShadow = step(0.0, closestT) * (1.0 - smoothstep(uPlanetRadius * 0.96, uPlanetRadius * 1.04, length(closest)));
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(uCameraWorld - vWorldPosition);
    float forwardScatter = pow(saturateV590(dot(viewDirection, -lightDirection)), 9.0);
    float backScatter = pow(saturateV590(dot(viewDirection, lightDirection)), 3.0);
    float illumination = mix(0.08, 0.12, 1.0 - uScience) + (1.0 - planetShadow * 0.88) * (0.72 + backScatter * 0.18);
    illumination += forwardScatter * mix(0.025, 0.25, 1.0 - uScience);
    float alpha = opticalDepth * edge * mix(0.78, 0.94, 1.0 - uScience);
    color = max(color, vec3(0.025)) * illumination;
    gl_FragColor = vec4(color, alpha);
  }
`);

export const ICE_GIANT_FRAGMENT_V590 = celestialFragmentV590(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uDeepColor;
  uniform vec3 uCloudColor;
  uniform vec3 uStormColor;
  uniform vec3 uSunWorld;
  uniform float uBandFrequency;
  uniform float uStormLatitude;
  uniform float uStormStrength;
  uniform float uEpoch;
  uniform float uScience;

  float hash21V590(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float bandNoiseV590(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21V590(cell), hash21V590(cell + vec2(1.0, 0.0)), f.x),
      mix(hash21V590(cell + vec2(0.0, 1.0)), hash21V590(cell + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main() {
    vec3 localNormal = normalize(vLocalNormal);
    float latitude = asin(clamp(localNormal.y, -1.0, 1.0));
    float longitude = atan(localNormal.z, localNormal.x);
    float band = sin(latitude * uBandFrequency + sin(latitude * 7.0) * 0.72) * 0.5 + 0.5;
    float fineBand = bandNoiseV590(vec2(longitude * 13.0 + uEpoch * 0.004, latitude * 82.0));
    float stormLatitudeGate = exp(-pow(latitude - uStormLatitude, 2.0) * 52.0);
    float stormLongitudeGate = smoothstep(0.82, 0.99, cos(longitude * 3.0 + latitude * 8.0 + uEpoch * 0.011));
    float storm = stormLatitudeGate * stormLongitudeGate * uStormStrength;
    vec3 albedo = mix(uDeepColor, uCloudColor, band * 0.12 + fineBand * 0.055);
    albedo = mix(albedo, uStormColor, storm * 0.38);
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float diffuse = saturateV590(dot(normal, lightDirection));
    float limb = pow(saturateV590(dot(normal, viewDirection)), 0.27);
    float lighting = mix(0.021, 0.041, 1.0 - uScience) + diffuse * 1.20;
    gl_FragColor = vec4(albedo * lighting * (0.62 + limb * 0.43), 1.0);
  }
`);

export const ICE_RING_FRAGMENT_V590 = celestialFragmentV590(/* glsl */ `
  precision highp float;
  varying vec2 vRingUv;
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  uniform vec3 uColor;
  uniform vec3 uSunWorld;
  uniform float uOpacity;

  void main() {
    float bands = 0.46 + 0.54 * sin(vRingUv.x * 187.0) * sin(vRingUv.x * 61.0);
    float sparse = smoothstep(0.73, 0.96, bands);
    float edge = smoothstep(0.0, 0.045, vRingUv.x) * (1.0 - smoothstep(0.955, 1.0, vRingUv.x));
    float light = 0.24 + abs(dot(normalize(vWorldNormal), normalize(uSunWorld - vWorldPosition))) * 0.55;
    float alpha = sparse * edge * uOpacity;
    gl_FragColor = vec4(uColor * light, alpha);
  }
`);

export const REGOLITH_FRAGMENT_V590 = celestialFragmentV590(/* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldBitangent;
  varying vec3 vWorldPosition;
  uniform sampler2D uDiffuse;
  uniform sampler2D uNormal;
  uniform sampler2D uRoughness;
  uniform vec3 uSunWorld;
  uniform float uScale;
  uniform float uScience;

  vec3 triplanarWeightsV590(vec3 normal) {
    vec3 weights = pow(abs(normal), vec3(5.0));
    return weights / max(dot(weights, vec3(1.0)), 0.0001);
  }

  vec3 triplanarV590(sampler2D map, vec3 position, vec3 weights) {
    return texture2D(map, position.yz * uScale).rgb * weights.x
      + texture2D(map, position.xz * uScale).rgb * weights.y
      + texture2D(map, position.xy * uScale).rgb * weights.z;
  }

  void main() {
    vec3 geometricNormal = normalize(vWorldNormal);
    vec3 weights = triplanarWeightsV590(normalize(vLocalNormal));
    vec3 microNormal = triplanarV590(uNormal, vLocalPosition, weights) * 2.0 - 1.0;
    vec3 normal = tangentNormalV590(
      geometricNormal,
      normalize(vWorldTangent),
      normalize(vWorldBitangent),
      microNormal * 0.5 + 0.5,
      0.095
    );
    vec3 source = triplanarV590(uDiffuse, vLocalPosition, weights);
    float roughness = triplanarV590(uRoughness, vLocalPosition, weights).r;
    float micro = mix(0.78, 1.16, luminanceV590(source));
    vec3 albedo = vec3(0.115, 0.108, 0.101) * micro;
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float diffuse = saturateV590(dot(normal, lightDirection));
    float opposition = pow(saturateV590(dot(lightDirection, viewDirection)), 12.0) * 0.055;
    float fill = mix(0.024, 0.011, uScience);
    vec3 result = albedo * (fill + diffuse * mix(0.92, 1.08, roughness) + opposition * diffuse);
    gl_FragColor = vec4(result, 1.0);
  }
`);

/** A stable body phase used for visual orientation only. */
export function deterministicBodyPhaseV590(bodyId: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < bodyId.length; index += 1) {
    hash ^= bodyId.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return ((hash >>> 0) / 0xffff_ffff) * Math.PI * 2;
}

/**
 * Builds an annulus whose U coordinate is true normalized radius and whose V
 * coordinate is azimuth.  Three's stock RingGeometry UVs are Cartesian and
 * cannot address a radial optical-depth profile without visible distortion.
 */
export function createRadialRingGeometryV590(
  innerRadius: number,
  outerRadius: number,
  thetaSegments = 320,
  radialSegments = 6,
): THREE.BufferGeometry {
  if (!(innerRadius > 0) || !(outerRadius > innerRadius)) {
    throw new Error("v590-ring-radius-invalid");
  }
  if (!Number.isInteger(thetaSegments) || thetaSegments < 16 || !Number.isInteger(radialSegments) || radialSegments < 1) {
    throw new Error("v590-ring-segments-invalid");
  }
  const verticesPerRow = thetaSegments + 1;
  const positions = new Float32Array((radialSegments + 1) * verticesPerRow * 3);
  const normals = new Float32Array((radialSegments + 1) * verticesPerRow * 3);
  const uvs = new Float32Array((radialSegments + 1) * verticesPerRow * 2);
  let positionOffset = 0;
  let uvOffset = 0;
  for (let radialIndex = 0; radialIndex <= radialSegments; radialIndex += 1) {
    const radialT = radialIndex / radialSegments;
    const radius = THREE.MathUtils.lerp(innerRadius, outerRadius, radialT);
    for (let thetaIndex = 0; thetaIndex <= thetaSegments; thetaIndex += 1) {
      const thetaT = thetaIndex / thetaSegments;
      const theta = thetaT * Math.PI * 2;
      positions[positionOffset] = Math.cos(theta) * radius;
      positions[positionOffset + 1] = 0;
      positions[positionOffset + 2] = Math.sin(theta) * radius;
      normals[positionOffset] = 0;
      normals[positionOffset + 1] = 1;
      normals[positionOffset + 2] = 0;
      uvs[uvOffset] = radialT;
      uvs[uvOffset + 1] = thetaT;
      positionOffset += 3;
      uvOffset += 2;
    }
  }
  const indexCount = radialSegments * thetaSegments * 6;
  const IndexArray = positions.length / 3 > 65_535 ? Uint32Array : Uint16Array;
  const indices = new IndexArray(indexCount);
  let indexOffset = 0;
  for (let radialIndex = 0; radialIndex < radialSegments; radialIndex += 1) {
    for (let thetaIndex = 0; thetaIndex < thetaSegments; thetaIndex += 1) {
      const lowerLeft = radialIndex * verticesPerRow + thetaIndex;
      const lowerRight = lowerLeft + 1;
      const upperLeft = lowerLeft + verticesPerRow;
      const upperRight = upperLeft + 1;
      indices[indexOffset] = lowerLeft;
      indices[indexOffset + 1] = upperLeft;
      indices[indexOffset + 2] = lowerRight;
      indices[indexOffset + 3] = lowerRight;
      indices[indexOffset + 4] = upperLeft;
      indices[indexOffset + 5] = upperRight;
      indexOffset += 6;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();
  geometry.userData = {
    atlasCandidate: "v590",
    atlasRadialUv: true,
    atlasInnerRadius: innerRadius,
    atlasOuterRadius: outerRadius,
    atlasPresentationOnly: true,
  };
  return geometry;
}

export function radialRingGapTransmissionV590(normalizedRadius: number): number {
  const smoothGap = (center: number, halfWidth: number): number => {
    const edge0 = halfWidth * 0.32;
    const edge1 = halfWidth;
    const distance = Math.abs(normalizedRadius - center);
    const t = THREE.MathUtils.clamp((distance - edge0) / (edge1 - edge0), 0, 1);
    const smooth = t * t * (3 - 2 * t);
    return 1 - smooth;
  };
  const cassini = smoothGap(0.635, 0.018);
  const encke = smoothGap(0.914, 0.009);
  return (1 - cassini * 0.96) * (1 - encke * 0.88);
}

export function sphereSegmentsV590(focused: boolean, mobile: boolean): readonly [number, number] {
  if (!focused) return mobile ? [40, 24] : [48, 32];
  return mobile ? [88, 56] : [128, 88];
}
