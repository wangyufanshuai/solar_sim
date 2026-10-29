"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CelestialModeV590 } from "../lib/celestialRenderingV590";

const JUPITER_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uAlbedo;
  uniform sampler2D uBandMask;
  uniform sampler2D uStormMask;
  uniform vec3 uSunWorld;
  uniform float uScience;
  uniform float uEpoch;
  uniform float uCinematicV593;
  uniform float uSeamBlendV593;
  uniform vec2 uBandTexelV593;

  float saturateV593(float value) { return clamp(value, 0.0, 1.0); }
  float luminanceV593(vec3 color) { return dot(color, vec3(0.2126, 0.7152, 0.0722)); }
  vec3 seamSafeRgbV593(sampler2D source, vec2 uv) {
    float longitude = uv.x;
    if (longitude < 0.0) longitude += 1.0;
    if (longitude > 1.0) longitude -= 1.0;
    vec3 primary = texture2D(source, vec2(longitude, uv.y)).rgb;
    float edgeDistance = min(longitude, 1.0 - longitude);
    float seamWeight = 1.0 - smoothstep(0.0, uSeamBlendV593, edgeDistance);
    float cleanInset = min(0.49, uSeamBlendV593 + edgeDistance * 0.48);
    vec3 cleanWest = texture2D(source, vec2(cleanInset, uv.y)).rgb;
    vec3 cleanEast = texture2D(source, vec2(1.0 - cleanInset, uv.y)).rgb;
    vec3 reconstructed = (cleanWest + cleanEast) * 0.5;
    return mix(primary, reconstructed, seamWeight);
  }
  float seamSafeChannelV593(sampler2D source, vec2 uv) {
    return seamSafeRgbV593(source, uv).r;
  }

  void main() {
    #include <logdepthbuf_fragment>
    float latitude = vUv.y * 2.0 - 1.0;
    float sourceBand = seamSafeChannelV593(uBandMask, vUv);
    float sourceStorm = seamSafeChannelV593(uStormMask, vUv);
    float zonalDirection = sin(latitude * 63.0 + sourceBand * 2.4);
    float zonalOffset = (1.0 - uScience)
      * (sourceBand - 0.5)
      * zonalDirection
      * (0.00064 + sourceStorm * 0.00038)
      * (0.92 + fract(uEpoch * 0.0001) * 0.08);
    vec2 observedUv = vec2(vUv.x + zonalOffset, vUv.y);
    vec3 observed = seamSafeRgbV593(uAlbedo, observedUv);
    float bandDetail = seamSafeChannelV593(uBandMask, observedUv);
    float stormDetail = seamSafeChannelV593(uStormMask, observedUv);
    float bandNorth = seamSafeChannelV593(uBandMask, observedUv + vec2(0.0, uBandTexelV593.y * 2.0));
    float bandSouth = seamSafeChannelV593(uBandMask, observedUv - vec2(0.0, uBandTexelV593.y * 2.0));
    float bandSlope = clamp((bandNorth - bandSouth) * 4.0, -1.0, 1.0);

    vec3 normal = normalize(vWorldNormal);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float nDotLRaw = dot(normal, lightDirection);
    float diffuse = saturateV593(nDotLRaw);
    float viewMu = saturateV593(dot(normal, viewDirection));
    float terminator = smoothstep(-0.09, 0.12, nDotLRaw);
    float limbDarkening = 0.29 + 0.71 * pow(viewMu, 0.44);
    float forwardScatter = pow(1.0 - saturateV593(dot(viewDirection, lightDirection)), 2.2);
    float multipleScattering = 0.035 + diffuse * 0.86 + (1.0 - diffuse) * 0.105;

    float observedLuma = luminanceV593(observed);
    vec3 scienceColor = observed;
    float stormEnvelope = smoothstep(0.18, 0.82, stormDetail);
    float stormCore = smoothstep(0.68, 0.97, stormDetail);
    vec3 cinematicColor = mix(vec3(observedLuma), observed, 1.12);
    cinematicColor *= 0.94 + (bandDetail - 0.5) * 0.245 + bandSlope * 0.052;
    cinematicColor = mix(cinematicColor, cinematicColor * vec3(1.18, 0.84, 0.66), stormEnvelope * 0.33);
    cinematicColor *= 1.0 + stormCore * 0.075;
    cinematicColor *= 1.0 + forwardScatter * 0.035 * uCinematicV593;
    vec3 albedo = mix(cinematicColor, scienceColor, uScience);
    vec3 radiance = albedo * multipleScattering * terminator * limbDarkening;
    gl_FragColor = vec4(radiance, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const SOLAR_PHOTOSPHERE_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uPhotosphere;
  uniform sampler2D uChromosphere;
  uniform float uCinematic;
  uniform float uEpoch;
  uniform float uPhysicalDaysV592;
  uniform vec2 uTexelSize;
  uniform float uSolarSeamBlendV593;

  float saturateV593(float value) { return clamp(value, 0.0, 1.0); }
  float luminanceV593(vec3 color) { return dot(color, vec3(0.2126, 0.7152, 0.0722)); }
  float hashV593(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  vec3 hash3V593(vec3 p) {
    return vec3(
      hashV593(p + vec3(17.0, 3.0, 11.0)),
      hashV593(p + vec3(5.0, 29.0, 7.0)),
      hashV593(p + vec3(13.0, 19.0, 23.0))
    );
  }
  vec2 solarCellV593(vec3 p) {
    vec3 cell = floor(p);
    vec3 local = fract(p);
    float nearest = 10.0;
    float second = 10.0;
    for (int x = -1; x <= 1; x += 1) {
      for (int y = -1; y <= 1; y += 1) {
        for (int z = -1; z <= 1; z += 1) {
          vec3 offset = vec3(float(x), float(y), float(z));
          vec3 feature = offset + hash3V593(cell + offset) - local;
          float distanceSquared = dot(feature, feature);
          if (distanceSquared < nearest) {
            second = nearest;
            nearest = distanceSquared;
          } else if (distanceSquared < second) {
            second = distanceSquared;
          }
        }
      }
    }
    return sqrt(vec2(nearest, second));
  }
  float noiseV593(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hashV593(i), hashV593(i + vec3(1,0,0)), f.x), mix(hashV593(i + vec3(0,1,0)), hashV593(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hashV593(i + vec3(0,0,1)), hashV593(i + vec3(1,0,1)), f.x), mix(hashV593(i + vec3(0,1,1)), hashV593(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }
  vec3 seamSafeSolarV593(sampler2D source, vec2 uv) {
    float longitude = fract(uv.x);
    float latitude = clamp(uv.y, 0.012, 0.988);
    vec3 primary = texture2D(source, vec2(longitude, latitude)).rgb;
    float seamDistance = min(longitude, 1.0 - longitude);
    float seamWeight = 1.0 - smoothstep(0.0, uSolarSeamBlendV593, seamDistance);
    float inset = min(0.49, uSolarSeamBlendV593 + seamDistance * 0.42);
    vec3 reconstructed = (
      texture2D(source, vec2(inset, latitude)).rgb
      + texture2D(source, vec2(1.0 - inset, latitude)).rgb
    ) * 0.5;
    float poleDistance = min(latitude, 1.0 - latitude);
    float poleWeight = 1.0 - smoothstep(0.0, 0.028, poleDistance);
    float poleLatitude = latitude < 0.5 ? 0.032 : 0.968;
    vec3 poleMean = (
      texture2D(source, vec2(0.125, poleLatitude)).rgb
      + texture2D(source, vec2(0.375, poleLatitude)).rgb
      + texture2D(source, vec2(0.625, poleLatitude)).rgb
      + texture2D(source, vec2(0.875, poleLatitude)).rgb
    ) * 0.25;
    return mix(mix(primary, reconstructed, seamWeight), poleMean, poleWeight * 0.82);
  }

  void main() {
    #include <logdepthbuf_fragment>
    vec3 localNormal = normalize(vLocalNormal);
    vec3 worldNormal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float mu = saturateV593(dot(worldNormal, viewDirection));
    float sinLatitude2 = localNormal.y * localNormal.y;
    float differentialRate = 14.713 - 2.396 * sinLatitude2 - 1.787 * sinLatitude2 * sinLatitude2;
    float longitudeOffset = uPhysicalDaysV592 * (differentialRate - 14.1844) / 360.0;
    vec2 solarUv = vec2(vUv.x + longitudeOffset, vUv.y);

    vec3 observed = seamSafeSolarV593(uPhotosphere, solarUv);
    vec3 activityObserved = seamSafeSolarV593(uChromosphere, solarUv);
    float activityLuma = luminanceV593(activityObserved);
    vec3 localFine = (
      seamSafeSolarV593(uPhotosphere, solarUv + vec2(uTexelSize.x * 3.0, 0.0))
      + seamSafeSolarV593(uPhotosphere, solarUv - vec2(uTexelSize.x * 3.0, 0.0))
      + seamSafeSolarV593(uPhotosphere, solarUv + vec2(0.0, uTexelSize.y * 3.0))
      + seamSafeSolarV593(uPhotosphere, solarUv - vec2(0.0, uTexelSize.y * 3.0))
    ) * 0.25;
    vec3 localBroad = (
      seamSafeSolarV593(uPhotosphere, solarUv + vec2(uTexelSize.x * 14.0, 0.0))
      + seamSafeSolarV593(uPhotosphere, solarUv - vec2(uTexelSize.x * 14.0, 0.0))
      + seamSafeSolarV593(uPhotosphere, solarUv + vec2(0.0, uTexelSize.y * 14.0))
      + seamSafeSolarV593(uPhotosphere, solarUv - vec2(0.0, uTexelSize.y * 14.0))
    ) * 0.25;
    float observedLuma = luminanceV593(observed);
    float fineMean = luminanceV593(localFine);
    float broadMean = luminanceV593(localBroad);
    float fineDetail = clamp((observedLuma - fineMean) / max(fineMean, 0.035), -0.42, 0.42);
    float broadDetail = clamp((fineMean - broadMean) / max(broadMean, 0.035), -0.34, 0.34);
    float sourceDeficit = clamp((broadMean - observedLuma) / max(broadMean, 0.035), 0.0, 1.0);
    float spotConfidence = sourceDeficit * mix(0.72, 1.0, smoothstep(0.11, 0.46, activityLuma));
    float penumbra = smoothstep(0.022, 0.105, spotConfidence);
    float umbra = smoothstep(0.085, 0.255, spotConfidence);

    float granule = noiseV593(localNormal * 176.0 + vec3(uEpoch * 0.00017));
    float intergranular = noiseV593(localNormal * 348.0 - vec3(uEpoch * 0.00011));
    float superGranule = noiseV593(localNormal * 31.0 + vec3(7.3, 3.7, 5.1));
    vec2 observedCell = solarCellV593(localNormal * 68.0 + vec3(2.7, 5.3, 7.9));
    float granuleInterior = 1.0 - smoothstep(0.20, 0.88, observedCell.x);
    float intergranularLane = 1.0 - smoothstep(0.025, 0.18, observedCell.y - observedCell.x);
    float cellularGranulation = granuleInterior * 0.096 - intergranularLane * 0.126;
    float boundedGranulation = (granule - 0.5) * 0.072
      + (intergranular - 0.5) * 0.027
      + (superGranule - 0.5) * 0.040
      + cellularGranulation * mix(0.54, 0.82, uCinematic);
    float activityMean = (
      luminanceV593(seamSafeSolarV593(uChromosphere, solarUv + vec2(uTexelSize.x * 8.0, 0.0)))
      + luminanceV593(seamSafeSolarV593(uChromosphere, solarUv - vec2(uTexelSize.x * 8.0, 0.0)))
      + luminanceV593(seamSafeSolarV593(uChromosphere, solarUv + vec2(0.0, uTexelSize.y * 8.0)))
      + luminanceV593(seamSafeSolarV593(uChromosphere, solarUv - vec2(0.0, uTexelSize.y * 8.0)))
    ) * 0.25;
    float activityDetail = clamp((activityLuma - activityMean) / max(activityMean, 0.025), -0.72, 0.72);
    float sourceContrast = fineDetail * mix(1.72, 2.36, uCinematic)
      + broadDetail * mix(0.86, 1.18, uCinematic)
      + activityDetail * mix(0.16, 0.27, uCinematic);
    float sourceRatio = clamp(observedLuma / max(broadMean, 0.035), 0.52, 1.42);
    float sourceStructure = pow(sourceRatio, mix(3.25, 4.35, uCinematic));
    float mappedStructure = saturateV593(
      0.54
      + sourceContrast * 0.94
      + (sourceStructure - 1.0) * 0.42
      + boundedGranulation * mix(0.72, 1.02, uCinematic)
    );
    vec3 continuumLane = vec3(0.60, 0.030, 0.0018);
    vec3 continuumCell = vec3(1.0, 0.51, 0.052);
    vec3 photosphere = mix(continuumLane, continuumCell, mappedStructure);
    photosphere *= 0.86 + sourceStructure * mix(0.17, 0.22, uCinematic);
    vec3 observedRatio = clamp(observed / max(broadMean, 0.035), vec3(0.55), vec3(1.45));
    photosphere *= mix(vec3(1.0), observedRatio, mix(0.22, 0.34, uCinematic));
    vec3 penumbraTint = vec3(0.46, 0.17, 0.035);
    vec3 umbraTint = vec3(0.095, 0.021, 0.006);
    photosphere = mix(photosphere, photosphere * penumbraTint, penumbra * 0.69);
    photosphere = mix(photosphere, umbraTint, umbra * 0.84);

    float facularSource = smoothstep(0.14, 0.50, activityLuma) * (1.0 - umbra);
    float facularLimb = pow(1.0 - mu, 1.48) * facularSource;
    photosphere += vec3(1.0, 0.54, 0.12) * facularLimb * mix(0.055, 0.105, uCinematic);
    float limb = clamp(0.30 + 0.93 * mu - 0.23 * mu * mu, 0.26, 1.0);
    float outputScale = mix(0.92, 1.07, uCinematic);
    gl_FragColor = vec4(max(photosphere, vec3(0.0)) * limb * outputScale, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const SOLAR_CHROMOSPHERE_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uChromosphere;
  uniform float uCinematic;
  uniform float uSolarSeamBlendV593;

  float saturateV593(float value) { return clamp(value, 0.0, 1.0); }
  float luminanceV593(vec3 color) { return dot(color, vec3(0.2126, 0.7152, 0.0722)); }
  float hashV593(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  vec3 seamSafeSolarV593(sampler2D source, vec2 uv) {
    float longitude = fract(uv.x);
    float latitude = clamp(uv.y, 0.012, 0.988);
    vec3 primary = texture2D(source, vec2(longitude, latitude)).rgb;
    float seamDistance = min(longitude, 1.0 - longitude);
    float seamWeight = 1.0 - smoothstep(0.0, uSolarSeamBlendV593, seamDistance);
    float inset = min(0.49, uSolarSeamBlendV593 + seamDistance * 0.42);
    vec3 reconstructed = (
      texture2D(source, vec2(inset, latitude)).rgb
      + texture2D(source, vec2(1.0 - inset, latitude)).rgb
    ) * 0.5;
    return mix(primary, reconstructed, seamWeight);
  }

  void main() {
    #include <logdepthbuf_fragment>
    vec3 worldNormal = normalize(vWorldNormal);
    vec3 localNormal = normalize(vLocalNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float mu = saturateV593(dot(worldNormal, viewDirection));
    float rim = pow(1.0 - mu, 2.05);
    vec3 observed = seamSafeSolarV593(uChromosphere, vUv);
    float structure = smoothstep(0.055, 0.48, luminanceV593(observed));
    float broad = hashV593(floor(localNormal * 29.0));
    float fine = hashV593(floor(localNormal * 83.0 + vec3(3.0, 7.0, 11.0)));
    float spicule = smoothstep(0.48, 0.88, broad * 0.68 + fine * 0.32);
    vec3 lowActivity = vec3(0.34, 0.006, 0.001);
    vec3 highActivity = vec3(1.0, 0.29, 0.025);
    vec3 color = mix(lowActivity, highActivity, structure);
    float alpha = rim * (0.018 + structure * mix(0.060, 0.135, uCinematic) + spicule * mix(0.012, 0.052, uCinematic));
    gl_FragColor = vec4(color, clamp(alpha, 0.0, mix(0.105, 0.235, uCinematic)));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const EARTH_SURFACE_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
  varying vec2 vUv;
  varying vec3 vLocalNormal;
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
  uniform float uScience;
  uniform float uEpoch;
  uniform float uCinematicV593;
  uniform float uEarthSeamBlendV593;

  const float PI_V593 = 3.141592653589793;
  float saturateV593(float value) { return clamp(value, 0.0, 1.0); }
  float luminanceV593(vec3 color) { return dot(color, vec3(0.2126, 0.7152, 0.0722)); }
  vec3 tangentNormalV593(
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
  vec3 seamSafeEarthRgbV593(sampler2D source, vec2 uv) {
    float longitude = fract(uv.x);
    float latitude = clamp(uv.y, 0.006, 0.994);
    vec3 primary = texture2D(source, vec2(longitude, latitude)).rgb;
    float seamDistance = min(longitude, 1.0 - longitude);
    float seamWidth = max(uEarthSeamBlendV593, 0.0001);
    float seamWeight = 1.0 - smoothstep(0.0, seamWidth, seamDistance);
    float seamTap = max(seamWidth * 0.44, 0.00032);
    vec3 reconstructed = (
      texture2D(source, vec2(fract(longitude - seamTap), latitude)).rgb
      + primary
      + texture2D(source, vec2(fract(longitude + seamTap), latitude)).rgb
    ) / 3.0;
    float poleDistance = min(latitude, 1.0 - latitude);
    float poleWeight = 1.0 - smoothstep(0.0, 0.024, poleDistance);
    float poleLatitude = latitude < 0.5 ? 0.028 : 0.972;
    vec3 poleMean = (
      texture2D(source, vec2(0.125, poleLatitude)).rgb
      + texture2D(source, vec2(0.375, poleLatitude)).rgb
      + texture2D(source, vec2(0.625, poleLatitude)).rgb
      + texture2D(source, vec2(0.875, poleLatitude)).rgb
    ) * 0.25;
    return mix(mix(primary, reconstructed, seamWeight), poleMean, poleWeight * 0.78);
  }
  float seamSafeEarthChannelV593(sampler2D source, vec2 uv) {
    return seamSafeEarthRgbV593(source, uv).r;
  }

  void main() {
    #include <logdepthbuf_fragment>
    vec3 sourceAlbedo = seamSafeEarthRgbV593(uAlbedo, vUv);
    vec3 encodedNormal = seamSafeEarthRgbV593(uNormal, vUv);
    float roughnessSignal = seamSafeEarthChannelV593(uRoughness, vUv);
    float blueDominance = sourceAlbedo.b - max(sourceAlbedo.r, sourceAlbedo.g) * 0.72;
    float ocean = smoothstep(0.018, 0.145, blueDominance);
    float normalStrength = mix(0.56, 0.12, ocean);
    float surfaceSeamDistance = min(fract(vUv.x), 1.0 - fract(vUv.x));
    float seamNormalTrust = smoothstep(
      0.0,
      max(uEarthSeamBlendV593 * 1.35, 0.0001),
      surfaceSeamDistance
    );
    normalStrength *= mix(0.035, 1.0, seamNormalTrust);
    vec3 normal = tangentNormalV593(
      normalize(vWorldNormal),
      normalize(vWorldTangent),
      normalize(vWorldBitangent),
      encodedNormal,
      normalStrength
    );
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 halfDirection = normalize(lightDirection + viewDirection);
    float nDotLRaw = dot(normal, lightDirection);
    float nDotL = saturateV593(nDotLRaw);
    float nDotV = max(0.001, saturateV593(dot(normal, viewDirection)));
    float nDotH = saturateV593(dot(normal, halfDirection));
    float vDotH = saturateV593(dot(viewDirection, halfDirection));

    vec2 shadowDirection = vec2(
      dot(lightDirection, normalize(vWorldTangent)),
      dot(lightDirection, normalize(vWorldBitangent))
    );
    shadowDirection /= max(length(shadowDirection), 0.001);
    float grazing = 1.0 - abs(dot(normalize(vWorldNormal), lightDirection));
    vec2 lowerShadowUv = vUv - shadowDirection * mix(0.0017, 0.0048, grazing);
    vec2 upperShadowUv = vUv - shadowDirection * mix(0.0032, 0.0074, grazing) + vec2(0.0083, 0.0017);
    float lowerCloudShadow = seamSafeEarthChannelV593(uCloudAlpha, lowerShadowUv);
    float upperCloudShadow = seamSafeEarthChannelV593(uCloudAlpha, upperShadowUv);
    float cloudOpticalDepth = saturateV593(lowerCloudShadow * 0.72 + upperCloudShadow * 0.30);
    float dayGate = smoothstep(-0.055, 0.095, nDotLRaw);
    float cloudTransmission = exp(-cloudOpticalDepth * mix(0.30, 0.46, uCinematicV593) * dayGate);

    float sourceLuma = luminanceV593(sourceAlbedo);
    vec3 landChromatic = mix(vec3(sourceLuma), sourceAlbedo, mix(0.91, 1.04, uCinematicV593));
    vec3 landColor = landChromatic * mix(vec3(0.91, 0.94, 0.93), vec3(1.03, 1.00, 0.93), roughnessSignal);
    vec3 oceanColor = mix(sourceAlbedo * vec3(0.22, 0.30, 0.43), vec3(0.0035, 0.018, 0.056), 0.61);
    vec3 baseColor = mix(landColor, oceanColor, ocean);

    float sigma = mix(0.60, 1.02, roughnessSignal);
    float sigma2 = sigma * sigma;
    float orenA = 1.0 - 0.50 * sigma2 / (sigma2 + 0.33);
    float orenB = 0.45 * sigma2 / (sigma2 + 0.09);
    vec3 projectedLight = normalize(lightDirection - normal * nDotL + vec3(0.00001));
    vec3 projectedView = normalize(viewDirection - normal * nDotV + vec3(0.00001));
    float azimuth = max(0.0, dot(projectedLight, projectedView));
    float sinAlpha = sqrt(max(0.0, 1.0 - min(nDotL, nDotV) * min(nDotL, nDotV)));
    float tanBeta = sqrt(max(0.0, 1.0 - max(nDotL, nDotV) * max(nDotL, nDotV))) / max(0.08, max(nDotL, nDotV));
    float landDiffuse = nDotL * (orenA + orenB * azimuth * sinAlpha * tanBeta);

    float oceanRoughness = mix(0.160, 0.240, roughnessSignal);
    float alpha2 = oceanRoughness * oceanRoughness;
    alpha2 *= alpha2;
    float denominator = nDotH * nDotH * (alpha2 - 1.0) + 1.0;
    float distribution = alpha2 / max(PI_V593 * denominator * denominator, 0.00001);
    float fresnel = 0.0204 + (1.0 - 0.0204) * pow(1.0 - vDotH, 5.0);
    float geometryK = oceanRoughness * oceanRoughness * 0.5;
    float geometryV = nDotV / max(nDotV * (1.0 - geometryK) + geometryK, 0.001);
    float geometryL = nDotL / max(nDotL * (1.0 - geometryK) + geometryK, 0.001);
    float oceanSpecular = distribution * fresnel * geometryV * geometryL / max(4.0 * nDotV * max(nDotL, 0.001), 0.001);
    oceanSpecular = min(oceanSpecular, mix(0.28, 0.45, uCinematicV593));

    vec3 day = baseColor * (0.0015 + landDiffuse * cloudTransmission * mix(1.08, 1.16, uCinematicV593)) * dayGate;
    day += vec3(0.69, 0.81, 0.92) * oceanSpecular * ocean * nDotL * cloudTransmission * mix(0.030, 0.055, uCinematicV593);
    float horizonFresnel = pow(1.0 - nDotV, 4.5) * ocean * dayGate;
    day += vec3(0.035, 0.12, 0.27) * horizonFresnel * mix(0.24, 0.38, uCinematicV593);
    day += vec3(0.012, 0.055, 0.13) * pow(1.0 - nDotV, 3.2) * dayGate * mix(0.18, 0.32, uCinematicV593);

    vec3 nightObserved = seamSafeEarthRgbV593(uNight, vUv);
    float nightMask = seamSafeEarthChannelV593(uNightMask, vUv);
    float nightGate = 1.0 - smoothstep(-0.13, 0.035, nDotLRaw);
    float cityLuma = luminanceV593(nightObserved) * nightMask;
    float citySignal = smoothstep(0.012, 0.34, cityLuma * 2.15);
    vec3 cityChromatic = mix(vec3(cityLuma), nightObserved, 0.84);
    cityChromatic *= mix(vec3(1.0), vec3(1.0, 0.71, 0.37), uCinematicV593 * 0.62);
    vec3 cityLights = cityChromatic * citySignal * nightGate * mix(0.44, 0.88, uCinematicV593);
    vec3 nightEarthshine = sourceAlbedo * nightGate * uCinematicV593 * 0.0065;
    float twilightBand = smoothstep(-0.20, -0.015, nDotLRaw) * (1.0 - smoothstep(-0.015, 0.10, nDotLRaw));
    vec3 twilight = vec3(0.025, 0.055, 0.11) * twilightBand * pow(1.0 - nDotV, 2.2) * mix(0.22, 0.39, uCinematicV593);
    vec3 radiance = day + cityLights + nightEarthshine + twilight;
    radiance *= mix(vec3(1.0), vec3(1.015, 0.995, 0.965), uCinematicV593);
    gl_FragColor = vec4(max(radiance, vec3(0.0)), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const EARTH_CLOUD_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uClouds;
  uniform sampler2D uCloudAlpha;
  uniform vec3 uSunWorld;
  uniform vec2 uUvOffset;
  uniform float uLayerOpacity;
  uniform float uScience;
  uniform float uCinematicV593;
  uniform float uEarthSeamBlendV593;

  float saturateV593(float value) { return clamp(value, 0.0, 1.0); }
  vec3 seamSafeEarthRgbV593(sampler2D source, vec2 uv) {
    float longitude = fract(uv.x);
    float latitude = clamp(uv.y, 0.006, 0.994);
    vec3 primary = texture2D(source, vec2(longitude, latitude)).rgb;
    float seamDistance = min(longitude, 1.0 - longitude);
    float seamWidth = max(uEarthSeamBlendV593, 0.0001);
    float seamWeight = 1.0 - smoothstep(0.0, seamWidth, seamDistance);
    float seamTap = max(seamWidth * 0.44, 0.00032);
    vec3 reconstructed = (
      texture2D(source, vec2(fract(longitude - seamTap), latitude)).rgb
      + primary
      + texture2D(source, vec2(fract(longitude + seamTap), latitude)).rgb
    ) / 3.0;
    return mix(primary, reconstructed, seamWeight);
  }
  float seamSafeEarthChannelV593(sampler2D source, vec2 uv) {
    return seamSafeEarthRgbV593(source, uv).r;
  }

  void main() {
    #include <logdepthbuf_fragment>
    vec2 uv = vUv + uUvOffset;
    float sourceMask = seamSafeEarthChannelV593(uCloudAlpha, uv);
    float adjacentMask = seamSafeEarthChannelV593(uCloudAlpha, uv + vec2(0.0009, -0.0006));
    float broadMask = seamSafeEarthChannelV593(uCloudAlpha, uv + vec2(-0.0021, 0.0014));
    float opticalDepth = smoothstep(0.018, 0.91, sourceMask * 0.72 + adjacentMask * 0.19 + broadMask * 0.09);
    if (opticalDepth < 0.006) discard;
    vec3 observed = seamSafeEarthRgbV593(uClouds, uv);
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float nDotLRaw = dot(normal, lightDirection);
    float nDotL = saturateV593(nDotLRaw);
    float nDotV = saturateV593(dot(normal, viewDirection));
    float forward = pow(saturateV593(dot(viewDirection, -lightDirection)), 8.0);
    float backward = pow(saturateV593(dot(viewDirection, lightDirection)), 3.0);
    float silverLining = pow(1.0 - nDotV, 3.6) * smoothstep(-0.08, 0.28, nDotLRaw);
    float selfShadow = mix(0.79, 1.0, 1.0 - broadMask * (1.0 - sourceMask));
    float lighting = 0.012
      + nDotL * mix(1.02, 1.15, uCinematicV593)
      + silverLining * mix(0.17, 0.31, uCinematicV593)
      + forward * mix(0.0, 0.10, uCinematicV593)
      + backward * 0.025;
    float observedLuma = dot(observed, vec3(0.2126, 0.7152, 0.0722));
    vec3 cloudColor = mix(vec3(observedLuma), observed, 0.30) * vec3(0.955, 0.978, 1.0);
    float dayVisibility = smoothstep(-0.14, 0.15, nDotLRaw + 0.08);
    float alpha = opticalDepth * uLayerOpacity * dayVisibility;
    gl_FragColor = vec4(cloudColor * lighting * selfShadow, clamp(alpha, 0.0, 0.91));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const EARTH_ATMOSPHERE_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uSunWorld;
  uniform vec3 uRayleighColor;
  uniform vec3 uMieColor;
  uniform float uDensity;
  uniform float uScience;
  uniform float uCinematicV593;

  float saturateV593(float value) { return clamp(value, 0.0, 1.0); }
  void main() {
    #include <logdepthbuf_fragment>
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    float viewMu = saturateV593(abs(dot(normal, viewDirection)));
    float sunAltitude = dot(normal, lightDirection);
    float horizonPath = pow(1.0 - viewMu, 2.35);
    float opticalPath = min(4.0, 1.0 / max(0.18, sqrt(max(viewMu, 0.0001))));
    float day = smoothstep(-0.22, 0.21, sunAltitude);
    float twilight = smoothstep(-0.31, -0.015, sunAltitude) * (1.0 - smoothstep(-0.015, 0.25, sunAltitude));
    float phaseCos = dot(viewDirection, -lightDirection);
    float rayleighPhase = 0.75 * (1.0 + phaseCos * phaseCos);
    float mieForward = pow(saturateV593(phaseCos), 18.0);
    float mieShoulder = pow(saturateV593(phaseCos * 0.5 + 0.5), 5.0);
    vec3 spectralRayleigh = uRayleighColor * vec3(0.52, 0.78, 1.18);
    vec3 sunsetMie = uMieColor * vec3(1.18, 0.68, 0.37);
    vec3 scatter = spectralRayleigh * rayleighPhase * (0.12 + day * 0.82);
    scatter += sunsetMie * twilight * mix(0.10, 0.19, uCinematicV593);
    scatter += uMieColor * (mieForward * mix(0.008, 0.055, uCinematicV593) + mieShoulder * 0.012) * day;
    float alpha = horizonPath * uDensity * opticalPath * (0.095 + day * 0.68 + twilight * 0.27);
    alpha = clamp(alpha, 0.0, mix(0.29, 0.47, uCinematicV593));
    gl_FragColor = vec4(max(scatter, vec3(0.0)), alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const SATURN_SURFACE_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
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
  uniform float uCinematicV593;
  uniform float uRingTexelV593;

  float saturateV593(float value) { return clamp(value, 0.0, 1.0); }
  float intervalV593(float value, float start, float end, float softness) {
    return smoothstep(start - softness, start + softness, value)
      * (1.0 - smoothstep(end - softness, end + softness, value));
  }
  float gapTransmissionV593(float radius) {
    float cassini = intervalV593(radius, uCassiniStart, uCassiniEnd, 0.0018);
    float encke = 1.0 - smoothstep(
      uEnckeHalfWidth * 0.42,
      uEnckeHalfWidth * 1.75,
      abs(radius - uEnckeCenter)
    );
    return (1.0 - cassini * 0.985) * (1.0 - encke * 0.94);
  }
  float ringOpacityV593(float radius) {
    float offset = max(uRingTexelV593, 0.00002) * 2.25;
    float source = (
      texture2D(uRingOpticalDepth, vec2(clamp(radius - offset * 2.0, 0.0, 1.0), 0.5)).r
      + texture2D(uRingOpticalDepth, vec2(clamp(radius - offset, 0.0, 1.0), 0.5)).r * 2.0
      + texture2D(uRingOpticalDepth, vec2(clamp(radius, 0.0, 1.0), 0.5)).r * 3.0
      + texture2D(uRingOpticalDepth, vec2(clamp(radius + offset, 0.0, 1.0), 0.5)).r * 2.0
      + texture2D(uRingOpticalDepth, vec2(clamp(radius + offset * 2.0, 0.0, 1.0), 0.5)).r
    ) / 9.0;
    return clamp(source * gapTransmissionV593(radius), 0.0, 0.992);
  }
  float ringShadowV593(vec3 localLight) {
    if (abs(localLight.y) < 0.00001) return 0.0;
    float intersection = -vLocalPosition.y / localLight.y;
    float travelGate = smoothstep(-0.06, 0.16, intersection);
    vec3 ringHit = vLocalPosition + localLight * max(intersection, 0.0);
    float normalizedRadius = (length(ringHit.xz) - uInnerRadius)
      / max(uOuterRadius - uInnerRadius, 0.0001);
    float radialGate = smoothstep(-0.018, 0.026, normalizedRadius)
      * (1.0 - smoothstep(0.974, 1.018, normalizedRadius));
    float opacity = ringOpacityV593(normalizedRadius);
    float opticalDepth = -log(max(1.0 - opacity, 0.008));
    float pathLength = 1.0 / max(abs(localLight.y), 0.075);
    return saturateV593((1.0 - exp(-opticalDepth * pathLength * 0.88)) * radialGate * travelGate);
  }

  void main() {
    #include <logdepthbuf_fragment>
    vec3 normal = normalize(vWorldNormal);
    vec3 localNormal = normalize(vLocalNormal);
    vec3 lightDirection = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float nDotLRaw = dot(normal, lightDirection);
    float diffuse = saturateV593(nDotLRaw);
    float viewMu = saturateV593(dot(normal, viewDirection));
    float terminator = smoothstep(-0.46, 0.38, nDotLRaw);
    float limbDarkening = 0.30 + 0.70 * pow(viewMu, 0.43);

    vec3 observed = texture2D(uAlbedo, vUv).rgb;
    float band = texture2D(uBands, vUv).r;
    float bandNorth = texture2D(uBands, vUv + vec2(0.0, 0.0024)).r;
    float bandSouth = texture2D(uBands, vUv - vec2(0.0, 0.0024)).r;
    float bandSlope = clamp((bandNorth - bandSouth) * 3.4, -1.0, 1.0);
    vec3 cinematic = observed * (0.955 + (band - 0.5) * 0.19 + bandSlope * 0.035);
    cinematic *= vec3(1.026, 0.994, 0.952);

    float polarGate = smoothstep(0.62, 0.88, localNormal.y);
    vec2 polarUv = localNormal.xz * 0.5 + 0.5;
    float polarDetail = texture2D(uPolarDetail, polarUv).r;
    cinematic *= 1.0 + (polarDetail - 0.5) * polarGate * 0.17;
    cinematic = mix(cinematic, cinematic * vec3(0.84, 0.91, 1.04), polarGate * 0.14);
    vec3 albedo = mix(cinematic, observed, uScience);

    vec3 localLight = normalize(uSunLocal - vLocalPosition);
    float ringShadow = ringShadowV593(localLight);
    float atmosphericPath = pow(1.0 - viewMu, 1.35);
    float multipleScattering = 0.050 + diffuse * 0.76 + terminator * 0.16;
    float twilightScatter = smoothstep(-0.68, -0.02, nDotLRaw) * (1.0 - terminator);
    float nightBounce = (0.026 + atmosphericPath * 0.038) * (1.0 - terminator);
    float shadowTransmission = mix(1.0, 0.34 + (1.0 - viewMu) * 0.07, ringShadow * 0.86);
    vec3 shadowTint = mix(vec3(1.0), vec3(0.82, 0.78, 0.72), ringShadow * 0.24);
    vec3 radiance = albedo * (
      multipleScattering * terminator
      + twilightScatter * (0.082 + atmosphericPath * 0.044) * vec3(0.88, 0.82, 0.74)
      + nightBounce * vec3(0.70, 0.76, 0.88)
    ) * limbDarkening;
    radiance *= shadowTransmission * shadowTint;
    radiance *= mix(1.0, 1.025, uCinematicV593);
    gl_FragColor = vec4(radiance, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const SATURN_RING_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
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
  uniform float uCinematicV593;
  uniform float uRingTexelV593;

  float saturateV593(float value) { return clamp(value, 0.0, 1.0); }
  float intervalV593(float value, float start, float end, float softness) {
    return smoothstep(start - softness, start + softness, value)
      * (1.0 - smoothstep(end - softness, end + softness, value));
  }
  float gapTransmissionV593(float radius) {
    float cassini = intervalV593(radius, uCassiniStart, uCassiniEnd, 0.0018);
    float encke = 1.0 - smoothstep(
      uEnckeHalfWidth * 0.42,
      uEnckeHalfWidth * 1.75,
      abs(radius - uEnckeCenter)
    );
    return (1.0 - cassini * 0.985) * (1.0 - encke * 0.94);
  }
  float sampleOpacityV593(float radius) {
    return texture2D(uRingOpticalDepth, vec2(clamp(radius, 0.0, 1.0), 0.5)).r
      * gapTransmissionV593(radius);
  }
  float henyeyGreensteinV593(float cosine, float asymmetry) {
    float gg = asymmetry * asymmetry;
    return (1.0 - gg) / pow(max(1.0 + gg - 2.0 * asymmetry * cosine, 0.008), 1.5);
  }
  float planetShadowV593(vec3 localLight) {
    float signedTowardPlanet = -dot(vLocalPosition, localLight);
    float directionGate = smoothstep(-uPlanetRadius * 0.16, uPlanetRadius * 0.32, signedTowardPlanet);
    float towardPlanet = max(signedTowardPlanet, 0.0);
    vec3 closest = vLocalPosition + localLight * towardPlanet;
    float distanceToAxis = length(closest);
    float penumbra = 1.0 - smoothstep(uPlanetRadius * 0.92, uPlanetRadius * 1.12, distanceToAxis);
    return penumbra * directionGate;
  }

  void main() {
    #include <logdepthbuf_fragment>
    float radius = clamp(vRingUv.x, 0.0, 1.0);
    float texel = max(uRingTexelV593, 0.00002);
    float edge = smoothstep(0.0, 0.012, radius) * (1.0 - smoothstep(0.987, 1.0, radius));
    vec3 sourceColor = (
      texture2D(uRingColor, vec2(clamp(radius - texel * 1.5, 0.0, 1.0), 0.5)).rgb
      + texture2D(uRingColor, vec2(radius, 0.5)).rgb * 2.0
      + texture2D(uRingColor, vec2(clamp(radius + texel * 1.5, 0.0, 1.0), 0.5)).rgb
    ) * 0.25;
    float opacityCenter = sampleOpacityV593(radius);
    float opacityInner = sampleOpacityV593(radius - texel * 2.5);
    float opacityOuter = sampleOpacityV593(radius + texel * 2.5);
    float sourceStructure = clamp((opacityCenter * 2.0 - opacityInner - opacityOuter) * 1.8, -0.22, 0.22);
    float opacity = clamp(opacityCenter + sourceStructure * (1.0 - uScience) * 0.18, 0.0, 0.995);
    float opticalDepth = -log(max(1.0 - opacity, 0.005));

    vec3 localLight = normalize(uSunLocal - vLocalPosition);
    vec3 worldLight = normalize(uSunWorld - vWorldPosition);
    vec3 viewDirection = normalize(uCameraWorld - vWorldPosition);
    vec3 normal = normalize(vWorldNormal);
    float lightMu = max(abs(dot(normal, worldLight)), 0.055);
    float viewMu = max(abs(dot(normal, viewDirection)), 0.045);
    float sameSide = step(0.0, dot(normal, worldLight) * dot(normal, viewDirection));
    float scatteringCosine = dot(-worldLight, viewDirection);
    float forward = henyeyGreensteinV593(scatteringCosine, 0.53);
    float backward = henyeyGreensteinV593(scatteringCosine, -0.24);
    float phase = mix(0.62 + backward * 0.20, 0.50 + backward * 0.23 + forward * 0.15, 1.0 - uScience);
    phase *= mix(1.10, 0.84, sameSide);

    float viewPath = 1.0 / viewMu;
    float lightPath = 1.0 / lightMu;
    float alpha = (1.0 - exp(-opticalDepth * viewPath * 0.76)) * edge;
    float illuminatedColumn = 1.0 - exp(-opticalDepth * lightPath * 0.58);
    float singleScattering = illuminatedColumn / max(opticalDepth * lightPath, 0.08);
    float planetShadow = planetShadowV593(localLight);
    float shadowTransmission = mix(1.0, 0.16, planetShadow);

    vec3 color = max(sourceColor, vec3(0.012));
    float grazingIllumination = sqrt(lightMu) * 0.43;
    float scatteredIllumination = singleScattering * phase * mix(1.04, 1.34, 1.0 - uScience);
    color *= 0.095 + grazingIllumination + scatteredIllumination;
    color *= shadowTransmission;
    color *= mix(vec3(1.0), vec3(1.035, 0.992, 0.925), (1.0 - uScience) * uCinematicV593);
    color *= 1.0 + sourceStructure * (1.0 - uScience) * 0.20;
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <premultiplied_alpha_fragment>
  }
`;

const STELLAR_SURFACE_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uPhotosphereColor;
  uniform float uGranulationScale;
  uniform float uSpotStrength;
  uniform float uFaculaStrength;
  uniform float uGiantFactor;
  uniform float uHotFactor;
  uniform float uGravityDarkening;
  uniform float uLimbStrength;
  uniform float uOutputScale;
  uniform float uCinematic;
  uniform float uSeed;
  uniform float uRadiativeScaleV593;
  uniform float uRadiativeContrastV593;

  float hashV593(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  vec3 hash3V593(vec3 p) {
    return vec3(
      hashV593(p + vec3(17.0, 3.0, 11.0)),
      hashV593(p + vec3(5.0, 29.0, 7.0)),
      hashV593(p + vec3(13.0, 19.0, 23.0))
    );
  }
  float valueNoiseV593(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hashV593(i), hashV593(i + vec3(1,0,0)), f.x), mix(hashV593(i + vec3(0,1,0)), hashV593(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hashV593(i + vec3(0,0,1)), hashV593(i + vec3(1,0,1)), f.x), mix(hashV593(i + vec3(0,1,1)), hashV593(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }
  float fbmV593(vec3 p) {
    float value = 0.0;
    float amplitude = 0.54;
    mat3 rotation = mat3(
      0.00, 0.80, 0.60,
      -0.80, 0.36, -0.48,
      -0.60, -0.48, 0.64
    );
    for (int octave = 0; octave < 5; octave += 1) {
      value += amplitude * valueNoiseV593(p);
      p = rotation * p * 2.03 + vec3(7.1, 3.7, 5.9);
      amplitude *= 0.47;
    }
    return value;
  }

  // Material contract: deterministic-domain-warped-multiscale-convection-no-hard-voronoi-cells.
  // This is deliberately a real fragment path (rather than a manifest/CSS marker):
  // the returned field contributes to the photosphere radiance below.  The domain
  // warp keeps the nested scales coherent on a sphere while the decorrelated
  // octaves avoid the hard polygonal cells that made the earlier archetypes read
  // as procedural balls.
  float deterministicDomainWarpedMultiscaleConvectionV593(
    vec3 normal,
    vec3 seedOffset,
    float granulationScale,
    float giantFactor
  ) {
    float scale = mix(granulationScale * 0.72, 2.72, giantFactor);
    vec3 base = normal * scale;
    vec3 warp = vec3(
      fbmV593(base * 0.57 + seedOffset.yzx),
      fbmV593(base * 0.63 - seedOffset.zxy),
      fbmV593(base * 0.51 + seedOffset.xyz)
    ) - 0.5;
    float warpStrength = mix(0.31, 1.08, giantFactor);
    vec3 warped = base + warp * warpStrength;
    float macro = fbmV593(warped + seedOffset * 0.31);
    float meso = fbmV593(warped * mix(1.82, 2.46, giantFactor) - seedOffset.zxy * 0.27);
    float micro = fbmV593(normal * granulationScale * 2.35 + seedOffset.xyz * 0.43);
    float fine = fbmV593(normal * mix(30.0, 43.0, giantFactor) + warp * 1.55 + seedOffset.zxy * 0.57);
    return clamp(
      macro * 0.34 + meso * 0.31 + micro * 0.17 + fine * 0.18,
      0.0,
      1.0
    );
  }

  void main() {
    #include <logdepthbuf_fragment>
    vec3 localNormal = normalize(vLocalNormal);
    vec3 worldNormal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float mu = clamp(dot(worldNormal, viewDirection), 0.0, 1.0);
    vec3 seedOffset = vec3(uSeed * 0.011, -uSeed * 0.007, uSeed * 0.017);
    float convectionScale = mix(uGranulationScale * 0.72, 2.72, uGiantFactor);
    vec3 base = localNormal * convectionScale;
    vec3 warp = vec3(
      fbmV593(base * 0.57 + seedOffset.yzx),
      fbmV593(base * 0.63 - seedOffset.zxy),
      fbmV593(base * 0.51 + seedOffset.xyz)
    ) - 0.5;
    float warpStrength = mix(0.31, 1.08, uGiantFactor);
    vec3 warped = base + warp * warpStrength;
    float macro = fbmV593(warped + seedOffset * 0.31);
    float broad = fbmV593(localNormal * mix(5.8, 2.15, uGiantFactor) - seedOffset.yzx * 0.19);
    float meso = fbmV593(warped * mix(1.82, 2.46, uGiantFactor) - seedOffset.zxy * 0.27);
    float micro = fbmV593(localNormal * uGranulationScale * 2.35 + seedOffset.xyz * 0.43);
    float fineField = fbmV593(
      localNormal * mix(30.0, 43.0, uGiantFactor) + warp * 1.55 + seedOffset.zxy * 0.57
    );
    // Red-supergiant convection is a hierarchy of soft, overlapping granules,
    // not a set of continent-sized color islands. These decorrelated fields
    // keep the pattern spherical and deterministic while adding close-up
    // breakup that survives a 100% crop.
    float granuleA = valueNoiseV593(
      localNormal * 15.0 + warp * 2.40 + seedOffset.yzx * 0.83
    );
    float granuleB = valueNoiseV593(
      localNormal.yzx * 23.0 - warp.zxy * 1.70 + seedOffset.zxy * 0.61
    );
    float granuleC = valueNoiseV593(
      localNormal.zxy * 37.0 + warp.yzx * 1.10 - seedOffset.xyz * 0.47
    );
    float granulePotential = clamp(
      granuleA * 0.48 + granuleB * 0.32 + granuleC * 0.20,
      0.0,
      1.0
    );
    float granuleCore = smoothstep(0.46, 0.79, granulePotential);
    float granuleRidge = pow(1.0 - abs(granuleC * 2.0 - 1.0), 2.35);
    float fineContourLane = 1.0 - smoothstep(
      0.014,
      0.065,
      min(abs(granuleA - 0.5), abs(granuleB - 0.5))
    );
    float granularRelief = clamp(
      granuleCore * (0.73 + granuleRidge * 0.27)
        - fineContourLane * 0.16,
      0.0,
      1.0
    );
    float radiativeMacro = fbmV593(
      localNormal * mix(7.4, 13.8, uRadiativeScaleV593) + seedOffset.yzx * 0.29
    );
    float radiativeMeso = fbmV593(
      localNormal * mix(17.0, 31.0, uRadiativeScaleV593) - seedOffset.zxy * 0.41
    );
    float radiativeFine = valueNoiseV593(
      localNormal * mix(42.0, 76.0, uRadiativeScaleV593) + seedOffset.xyz * 0.63
    );
    // Cool supergiants are intentionally not Voronoi/Worley cells. A warped
    // low-frequency field produces a handful of asymmetric plumes while a
    // broken iso-contour supplies narrow, non-uniform down-flow lanes.
    float giantPrimary = fbmV593(warped * 0.78 + seedOffset * 0.17);
    float giantSecondary = fbmV593(warped.yzx * 1.29 - seedOffset.zxy * 0.23);
    float giantTertiary = fbmV593(localNormal * 4.7 + warp.zxy * 0.68 + seedOffset.yzx * 0.29);
    float giantField = clamp(
      giantPrimary * 0.52 + giantSecondary * 0.27 + broad * 0.15 + (macro - 0.5) * 0.16,
      0.0,
      1.0
    );
    float shiftedPrimary = fbmV593(warped * 0.78 + vec3(0.17, -0.11, 0.13) + seedOffset * 0.17);
    float boundaryWarp = fbmV593(localNormal * 3.35 - seedOffset.yzx * 0.31);
    float laneCenter = 0.47 + (boundaryWarp - 0.5) * 0.19;
    float laneWidth = mix(0.024, 0.071, giantTertiary);
    float contourLane = 1.0 - smoothstep(laneWidth * 0.42, laneWidth, abs(giantField - laneCenter));
    float laneBreakup = smoothstep(0.20, 0.76, giantTertiary * 0.68 + micro * 0.32);
    float giantLane = contourLane * mix(0.22, 1.0, laneBreakup);
    float plume = pow(smoothstep(0.24, 0.84, giantField), 0.78);
    float plumeShoulder = smoothstep(0.18, 0.72, giantSecondary) * (1.0 - giantLane * 0.54);
    float giantConvection = plume * 0.27
      + giantPrimary * 0.11
      + broad * 0.08
      + plumeShoulder * 0.10
      + granularRelief * 0.44;
    float radiativeEnvelope = radiativeMacro * 0.36 + radiativeMeso * 0.44 + radiativeFine * 0.20;
    float quietConvection = meso * 0.60 + micro * 0.18 + radiativeEnvelope * 0.22;
    float convection = mix(quietConvection, giantConvection, uGiantFactor);
    convection = mix(convection, radiativeEnvelope, uHotFactor * 0.72);
    float deterministicConvection = deterministicDomainWarpedMultiscaleConvectionV593(
      localNormal,
      seedOffset,
      uGranulationScale,
      uGiantFactor
    );
    convection = mix(convection, deterministicConvection, 0.08 + 0.08 * uGiantFactor);
    float irregularBoundary = max(
      smoothstep(0.035, 0.155, abs(giantPrimary - shiftedPrimary)) * 0.27,
      giantLane * 0.66
    ) * uGiantFactor;
    float convectiveContrast = mix(0.052, 0.176, uGiantFactor);
    float radiativeContrast = mix(0.072, 0.105, uGiantFactor) * uRadiativeContrastV593;
    float contrast = mix(convectiveContrast, radiativeContrast, uHotFactor);
    float granulation = 1.0 + (convection - 0.5) * contrast * 2.05;
    granulation *= 1.0 - irregularBoundary * contrast * 0.82;
    float surfaceMottle = mix(
      radiativeMeso * 0.62 + radiativeFine * 0.38,
      granularRelief * 0.66 + granuleRidge * 0.20 + micro * 0.14,
      uGiantFactor
    );
    granulation *= mix(0.948, 1.054, surfaceMottle);
    granulation *= 1.0 + (fineField - 0.5) * mix(0.025, 0.105, uGiantFactor);
    float fineLane = 1.0 - smoothstep(
      0.012,
      mix(0.043, 0.074, uGiantFactor),
      abs(fineField - 0.5 + (giantTertiary - 0.5) * 0.075)
    );
    float laneModulation = mix(0.38, 1.0, smoothstep(0.18, 0.82, giantTertiary));
    float intergranularDarkening = uGiantFactor * laneModulation * giantLane * 0.118;
    float plumeBrightening = uGiantFactor * plume * (1.0 - giantLane) * 0.082;
    granulation *= 1.0 - intergranularDarkening + plumeBrightening;
    granulation *= 1.0 + (granularRelief - 0.5) * 0.22 * uGiantFactor;
    granulation *= 1.0 - fineContourLane * 0.055 * uGiantFactor;
    granulation = max(granulation, mix(0.68, 0.58, uGiantFactor));
    float radiativeRidge = smoothstep(0.035, 0.24, abs(radiativeMacro - radiativeMeso));
    float radiativeNetwork = (radiativeMacro - 0.5) * 0.42
      + (radiativeMeso - 0.5) * 0.35
      + (radiativeFine - 0.5) * 0.13
      + (radiativeRidge - 0.5) * 0.10;
    granulation *= 1.0 + radiativeNetwork * uHotFactor * 0.31 * uRadiativeContrastV593;

    float latitude = abs(localNormal.y);
    float spotField = fbmV593(localNormal * mix(13.0, 3.8, uGiantFactor) + seedOffset.zxy * 0.43);
    float spot = smoothstep(0.86, 0.965, spotField)
      * mix(smoothstep(0.96, 0.24, latitude), 1.0, uGiantFactor * 0.72)
      * uSpotStrength
      * mix(0.12, 0.15, uGiantFactor);
    float oneMinusMu = 1.0 - mu;
    float limbFloor = mix(0.12, 0.24, uGiantFactor);
    float limb = max(limbFloor, 1.0 - uLimbStrength * pow(oneMinusMu, 0.82) - 0.12 * oneMinusMu * oneMinusMu);
    float facula = pow(oneMinusMu, 1.65) * smoothstep(0.66, 0.91, micro) * uFaculaStrength;
    float polarWeight = pow(latitude, 1.5);
    float gravityBrightness = mix(1.0, mix(0.72, 1.18, polarWeight), uGravityDarkening);

    vec3 coolCellTint = mix(vec3(1.06, 0.90, 0.76), vec3(0.92, 0.97, 1.03), uHotFactor);
    vec3 hotCellTint = mix(vec3(1.075, 0.98, 0.86), vec3(0.95, 0.99, 1.05), uHotFactor);
    vec3 rawCellularTint = mix(coolCellTint, hotCellTint, smoothstep(0.17, 0.88, convection));
    vec3 cellularTint = mix(vec3(1.0), rawCellularTint, mix(0.20, 0.28, uGiantFactor));
    vec3 color = uPhotosphereColor * cellularTint * granulation;
    vec3 convectiveLaneTint = mix(vec3(0.48, 0.22, 0.12), vec3(0.62, 0.74, 0.96), uHotFactor);
    color = mix(color, color * convectiveLaneTint, clamp((intergranularDarkening + fineLane * 0.018 * uGiantFactor + fineContourLane * 0.034 * uGiantFactor) * 2.25, 0.0, 0.24));
    vec3 radiativeCool = vec3(0.86, 0.93, 1.09);
    vec3 radiativeWarm = vec3(1.06, 1.00, 0.92);
    vec3 radiativeTint = mix(radiativeCool, radiativeWarm, smoothstep(0.28, 0.76, radiativeMeso));
    color *= mix(vec3(1.0), radiativeTint, uHotFactor * 0.17 * uRadiativeContrastV593);
    vec3 spotTint = mix(vec3(0.72, 0.48, 0.30), vec3(0.62, 0.72, 0.90), uHotFactor);
    color = mix(color, color * spotTint, spot);
    vec3 spectralTint = mix(vec3(1.08, 0.82, 0.64), vec3(0.84, 0.94, 1.18), smoothstep(0.32, 0.90, uHotFactor));
    color *= spectralTint;
    float emissionScale = mix(1.08, 1.48, uHotFactor) * mix(1.0, 1.04, uGiantFactor);
    color *= limb * gravityBrightness * (1.0 + facula) * uOutputScale * emissionScale;
    color *= mix(0.99, 1.045, uCinematic);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const STELLAR_CORONA_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uCoronaColor;
  uniform float uSeed;
  uniform float uCoronaGainV593;
  float hashV593(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noiseV593(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hashV593(i), hashV593(i + vec3(1,0,0)), f.x), mix(hashV593(i + vec3(0,1,0)), hashV593(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hashV593(i + vec3(0,0,1)), hashV593(i + vec3(1,0,1)), f.x), mix(hashV593(i + vec3(0,1,1)), hashV593(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }
  void main() {
    #include <logdepthbuf_fragment>
    vec3 direction = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float mu = clamp(dot(direction, viewDirection), 0.0, 1.0);
    float rim = pow(1.0 - mu, 2.65);
    float broad = noiseV593(direction * 4.8 + vec3(uSeed * 0.013));
    float fine = noiseV593(direction * 15.0 - vec3(uSeed * 0.007));
    float streamer = pow(smoothstep(0.45, 0.82, broad * 0.78 + fine * 0.22), 1.75);
    float alpha = rim * (0.022 + streamer * 0.118) * uCoronaGainV593;
    gl_FragColor = vec4(uCoronaColor * mix(0.56, 1.34, streamer), alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const DEEP_SKY_SPHERE_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  varying vec3 vSkyDirection;
  uniform sampler2D uBase;
  uniform sampler2D uStars;
  uniform sampler2D uDust;
  uniform vec2 uBaseTexelV593;
  uniform vec2 uStarsTexelV593;
  uniform vec2 uDustTexelV593;
  uniform float uCinematic;
  uniform float uCloseup;

  vec2 wrapSkyUvV593(vec2 uv) {
    return vec2(fract(uv.x + 1.0), clamp(uv.y, 0.001, 0.999));
  }

  vec3 reconstructedSkyRgbV593(sampler2D source, vec2 uv, vec2 texel) {
    vec3 center = texture2D(source, wrapSkyUvV593(uv)).rgb;
    vec3 crossMean = (
      texture2D(source, wrapSkyUvV593(uv + vec2(texel.x, 0.0))).rgb
      + texture2D(source, wrapSkyUvV593(uv - vec2(texel.x, 0.0))).rgb
      + texture2D(source, wrapSkyUvV593(uv + vec2(0.0, texel.y))).rgb
      + texture2D(source, wrapSkyUvV593(uv - vec2(0.0, texel.y))).rgb
    ) * 0.25;
    vec3 diagonalMean = (
      texture2D(source, wrapSkyUvV593(uv + texel)).rgb
      + texture2D(source, wrapSkyUvV593(uv - texel)).rgb
      + texture2D(source, wrapSkyUvV593(uv + vec2(texel.x, -texel.y))).rgb
      + texture2D(source, wrapSkyUvV593(uv + vec2(-texel.x, texel.y))).rgb
    ) * 0.25;
    vec3 neighborhood = crossMean * 0.68 + diagonalMean * 0.32;
    float blockContrast = length(center - neighborhood);
    float reconstruction = mix(0.18, 0.42, smoothstep(0.025, 0.16, blockContrast));
    return max(mix(center, neighborhood, reconstruction), vec3(0.0));
  }

  float reconstructedSkyChannelV593(sampler2D source, vec2 uv, vec2 texel) {
    return reconstructedSkyRgbV593(source, uv, texel).r;
  }

  float hashDirectionV593(vec3 point) {
    return fract(sin(dot(point, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }

  float directionNoiseV593(vec3 point) {
    vec3 cell = floor(point);
    vec3 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    float n000 = hashDirectionV593(cell);
    float n100 = hashDirectionV593(cell + vec3(1.0, 0.0, 0.0));
    float n010 = hashDirectionV593(cell + vec3(0.0, 1.0, 0.0));
    float n110 = hashDirectionV593(cell + vec3(1.0, 1.0, 0.0));
    float n001 = hashDirectionV593(cell + vec3(0.0, 0.0, 1.0));
    float n101 = hashDirectionV593(cell + vec3(1.0, 0.0, 1.0));
    float n011 = hashDirectionV593(cell + vec3(0.0, 1.0, 1.0));
    float n111 = hashDirectionV593(cell + vec3(1.0, 1.0, 1.0));
    return mix(
      mix(mix(n000, n100, local.x), mix(n010, n110, local.x), local.y),
      mix(mix(n001, n101, local.x), mix(n011, n111, local.x), local.y),
      local.z
    );
  }

  void main() {
    const float PI = 3.141592653589793;
    const float TAU = 6.283185307179586;
    vec3 direction = normalize(vSkyDirection);
    float rightAscension = mod(atan(direction.z, direction.x) + TAU, TAU);
    vec2 skyUv = vec2(rightAscension / TAU, 0.5 + asin(clamp(direction.y, -1.0, 1.0)) / PI);
    vec3 base = reconstructedSkyRgbV593(uBase, skyUv, uBaseTexelV593);
    vec3 catalogStars = reconstructedSkyRgbV593(uStars, skyUv, uStarsTexelV593);
    float dust = clamp(reconstructedSkyChannelV593(uDust, skyUv, uDustTexelV593), 0.0, 1.0);
    float dustStructure = smoothstep(0.055, 0.88, dust);

    vec3 science = base * mix(0.34, 0.54, dustStructure) + catalogStars * 0.16;
    science = max(science - vec3(0.0024), vec3(0.0));

    float broad = directionNoiseV593(direction * 46.0);
    float fine = directionNoiseV593(direction * 137.0 + vec3(17.0, 31.0, 47.0));
    float sourceBoundMicrostructure = mix(0.965, 1.035, broad * 0.72 + fine * 0.28);
    vec3 dustTint = mix(vec3(0.69, 0.77, 0.91), vec3(1.09, 0.84, 0.63), dustStructure);
    vec3 photographicBase = pow(max(base * 0.78, vec3(0.0)), vec3(0.86));
    vec3 cinematic = photographicBase * dustTint * mix(0.76, 1.36, pow(dustStructure, 0.78));
    cinematic *= sourceBoundMicrostructure;
    cinematic += catalogStars * (0.24 + dustStructure * 0.12);
    cinematic += vec3(0.018, 0.027, 0.052) * pow(max(dustStructure - 0.22, 0.0), 1.42);
    cinematic = max(cinematic - vec3(0.0035), vec3(0.0));

    vec3 color = mix(science, cinematic, uCinematic);
    color *= mix(1.0, 0.17, uCloseup);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const DEEP_FIELD_VERTEX_V593 = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    #include <logdepthbuf_vertex>
  }
`;

const DEEP_FIELD_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform vec2 uTexelV593;
  uniform float uOpacityV593;
  uniform float uCinematicV593;
  uniform float uObservationKindV593;
  uniform float uSliceIndexV593;
  uniform vec3 uTintV593;

  float luminanceV593(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
  }

  vec4 sourceTapV593(vec2 offset) {
    return texture2D(uMap, clamp(vUv + offset * uTexelV593, 0.001, 0.999));
  }

  void main() {
    #include <logdepthbuf_fragment>
    vec4 center = texture2D(uMap, vUv);
    vec4 crossMean = (
      texture2D(uMap, clamp(vUv + vec2(uTexelV593.x, 0.0), 0.001, 0.999))
      + texture2D(uMap, clamp(vUv - vec2(uTexelV593.x, 0.0), 0.001, 0.999))
      + texture2D(uMap, clamp(vUv + vec2(0.0, uTexelV593.y), 0.001, 0.999))
      + texture2D(uMap, clamp(vUv - vec2(0.0, uTexelV593.y), 0.001, 0.999))
    ) * 0.25;
    vec4 diagonalMean = (
      texture2D(uMap, clamp(vUv + uTexelV593, 0.001, 0.999))
      + texture2D(uMap, clamp(vUv - uTexelV593, 0.001, 0.999))
      + texture2D(uMap, clamp(vUv + vec2(uTexelV593.x, -uTexelV593.y), 0.001, 0.999))
      + texture2D(uMap, clamp(vUv + vec2(-uTexelV593.x, uTexelV593.y), 0.001, 0.999))
    ) * 0.25;
    vec4 neighborhood = crossMean * 0.72 + diagonalMean * 0.28;
    float blockContrast = length(center.rgb - neighborhood.rgb);
    float reconstruction = mix(0.14, 0.36, smoothstep(0.025, 0.18, blockContrast));
    vec4 reconstructed = mix(center, neighborhood, reconstruction);

    float sourceLuma = luminanceV593(reconstructed.rgb);
    float localLuma = luminanceV593(neighborhood.rgb);
    vec4 sourceBackground = (
      texture2D(uMap, vec2(0.035, 0.035))
      + texture2D(uMap, vec2(0.500, 0.035))
      + texture2D(uMap, vec2(0.965, 0.035))
      + texture2D(uMap, vec2(0.035, 0.500))
      + texture2D(uMap, vec2(0.965, 0.500))
      + texture2D(uMap, vec2(0.035, 0.965))
      + texture2D(uMap, vec2(0.500, 0.965))
      + texture2D(uMap, vec2(0.965, 0.965))
    ) * 0.125;
    vec4 broadSource = (
      sourceTapV593(vec2(8.0, 0.0))
      + sourceTapV593(vec2(-8.0, 0.0))
      + sourceTapV593(vec2(0.0, 8.0))
      + sourceTapV593(vec2(0.0, -8.0))
      + sourceTapV593(vec2(5.0, 5.0))
      + sourceTapV593(vec2(-5.0, 5.0))
      + sourceTapV593(vec2(5.0, -5.0))
      + sourceTapV593(vec2(-5.0, -5.0))
    ) * 0.125;
    vec4 mediumSource = (
      sourceTapV593(vec2(3.0, 0.0))
      + sourceTapV593(vec2(-3.0, 0.0))
      + sourceTapV593(vec2(0.0, 3.0))
      + sourceTapV593(vec2(0.0, -3.0))
      + sourceTapV593(vec2(2.0, 2.0))
      + sourceTapV593(vec2(-2.0, 2.0))
      + sourceTapV593(vec2(2.0, -2.0))
      + sourceTapV593(vec2(-2.0, -2.0))
    ) * 0.125;
    float broadLuma = luminanceV593(broadSource.rgb);
    float mediumLuma = luminanceV593(mediumSource.rgb);
    vec3 sourcePlateSeparated = max(
      reconstructed.rgb - sourceBackground.rgb * mix(0.42, 0.08, uObservationKindV593),
      vec3(0.0)
    );
    float sourcePlateLuma = luminanceV593(sourcePlateSeparated);
    float sourceChromaticSeparation = length(reconstructed.rgb - sourceBackground.rgb);
    float sourceMorphology = smoothstep(
      0.0035,
      0.060,
      sourcePlateLuma
        + sourceChromaticSeparation * 0.16
        + abs(mediumLuma - broadLuma) * 0.34
    );
    float localContrast = clamp((sourceLuma - localLuma) * 0.42, -0.035, 0.055);
    vec3 color = max(reconstructed.rgb + localContrast * uCinematicV593, vec3(0.0)) * uTintV593;
    vec3 sourceFrequencyDepth = max(mediumSource.rgb - broadSource.rgb, vec3(0.0));
    vec3 nebulaColor = (
      sourcePlateSeparated
      + sourceFrequencyDepth * (0.18 + sourceMorphology * 0.16)
      + max(reconstructed.rgb - mediumSource.rgb, vec3(0.0)) * 0.10
    ) * uTintV593;
    color = mix(nebulaColor, color, uObservationKindV593);
    float sourceFilament = clamp(
      (sourceLuma - mediumLuma) * 0.34 + (mediumLuma - broadLuma) * 0.22,
      -0.018,
      0.052
    );
    color = max(color + color * sourceFilament * 1.65 * uCinematicV593, vec3(0.0));
    float blackIntegration = smoothstep(
      mix(0.0018, 0.0045, uObservationKindV593),
      mix(0.030, 0.070, uObservationKindV593),
      sourceLuma
    );
    float hasEncodedAlpha = 1.0 - step(0.999, center.a);
    float broadIntegration = smoothstep(
      mix(0.0035, 0.0075, uObservationKindV593),
      mix(0.095, 0.145, uObservationKindV593),
      broadLuma
    ) * uCinematicV593;
    float sourceAlpha = max(mix(blackIntegration, reconstructed.a, hasEncodedAlpha), broadIntegration * 0.28);
    vec2 centeredUv = vUv * 2.0 - 1.0;
    float edgeDistance = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float edge = smoothstep(0.0, mix(0.205, 0.165, uObservationKindV593), edgeDistance);
    float apertureRadius = length(centeredUv * vec2(1.0, mix(0.88, 1.04, uObservationKindV593)));
    float observationAperture = 1.0 - smoothstep(
      mix(0.76, 0.68, uObservationKindV593),
      mix(1.08, 0.98, uObservationKindV593),
      apertureRadius
    );
    float sourceBoundaryWarp = clamp(
      (mediumLuma - broadLuma) * 2.8 + (sourceLuma - localLuma) * 1.4,
      -0.070,
      0.075
    );
    float nebulaDistance = length(centeredUv * vec2(0.90, 1.08)) + sourceBoundaryWarp;
    float nebulaAperture = 1.0 - smoothstep(0.58, 1.10, nebulaDistance);
    float aperture = mix(nebulaAperture, observationAperture, uObservationKindV593);
    float sliceWeight = mix(
      1.0 / (1.0 + uSliceIndexV593 * 0.34),
      1.0 / (1.0 + uSliceIndexV593 * 0.62),
      uObservationKindV593
    );
    float morphologyAlpha = mix(0.08 + sourceMorphology * 0.92, 1.0, uObservationKindV593);
    float alpha = clamp(sourceAlpha * morphologyAlpha * edge * aperture * sliceWeight * uOpacityV593, 0.0, 1.0);
    if (alpha < 0.0015) discard;
    color += broadSource.rgb * broadIntegration * mix(0.078, 0.095, uObservationKindV593);
    color *= mix(0.91, 1.05, uCinematicV593);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

const DEEP_STAR_POINT_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
  varying vec3 vLinearRgb;
  varying float vFlux;
  uniform float uCinematic;
  uniform float uOpacity;
  void main() {
    #include <logdepthbuf_fragment>
    vec2 point = gl_PointCoord * 2.0 - 1.0;
    float radiusSquared = dot(point, point);
    if (radiusSquared > 1.0) discard;
    float radius = sqrt(radiusSquared);
    float core = pow(1.0 + radiusSquared * 12.5, -2.42);
    float airy = exp(-radius * 5.4) * (0.5 + 0.5 * cos(radius * 22.0));
    float response = log(1.0 + max(vFlux, 0.0) * 24.0) / log(25.0);
    float cinematicHalo = airy * 0.022 * uCinematic * smoothstep(0.24, 0.92, response);
    float alpha = clamp((core * (0.24 + response * 0.90) + cinematicHalo) * uOpacity, 0.0, 1.0);
    vec3 color = vLinearRgb * (0.46 + core * (0.98 + response * 0.88) + cinematicHalo * 0.24);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

const DEEP_STAR_PSF_FRAGMENT_V593 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
  varying vec2 vPsf;
  varying vec3 vLinearRgb;
  varying float vFlux;
  uniform float uCinematic;
  void main() {
    #include <logdepthbuf_fragment>
    float radius = length(vPsf);
    if (radius > 1.0) discard;
    float radiusSquared = radius * radius;
    float core = pow(1.0 + radiusSquared * 22.0, -2.48);
    float airy = exp(-radius * 5.2) * (0.5 + 0.5 * cos(radius * 27.0));
    float spikeX = exp(-abs(vPsf.x) * 62.0) * exp(-abs(vPsf.y) * 4.2);
    float spikeY = exp(-abs(vPsf.y) * 62.0) * exp(-abs(vPsf.x) * 4.2);
    float response = log(1.0 + max(vFlux, 0.0) * 112.0) / log(113.0);
    float presentation = (airy * 0.036 + (spikeX + spikeY) * 0.017)
      * uCinematic * smoothstep(0.26, 0.86, response);
    float alpha = clamp(core * (0.48 + response * 0.78) + presentation, 0.0, 1.0);
    vec3 color = vLinearRgb * (0.56 + core * (1.62 + response * 1.24) + presentation * 0.22);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

type PatchableObjectV593 = THREE.Mesh | THREE.Points;

type MaterialPatchV593 = Readonly<{
  mesh: PatchableObjectV593;
  original: THREE.Material;
  replacement: THREE.Material;
}>;

type TextureStateV593 = Readonly<{
  texture: THREE.Texture;
  wrapS: THREE.Wrapping;
  anisotropy: number;
}>;

function singleMaterialV593(mesh: PatchableObjectV593): THREE.Material | null {
  if (Array.isArray(mesh.material)) return null;
  return mesh.material;
}

function singleShaderMaterialV593(mesh: PatchableObjectV593): THREE.ShaderMaterial | null {
  if (Array.isArray(mesh.material) || !(mesh.material instanceof THREE.ShaderMaterial)) return null;
  return mesh.material;
}

function textureDimensionsV593(texture: THREE.Texture, fallback = 1_024): THREE.Vector2 {
  const image = texture.image as { width?: number; height?: number } | undefined;
  return new THREE.Vector2(
    1 / Math.max(1, image?.width ?? fallback),
    1 / Math.max(1, image?.height ?? fallback),
  );
}

function hasAncestorLayerV593(node: THREE.Object3D, layer: string): boolean {
  let current: THREE.Object3D | null = node;
  while (current) {
    if (current.userData.atlasLayer === layer) return true;
    if (!current.visible) return false;
    current = current.parent;
  }
  return false;
}

function isJupiterMaterialV593(material: THREE.ShaderMaterial): boolean {
  return Boolean(material.uniforms.uAlbedo && material.uniforms.uBandMask && material.uniforms.uStormMask);
}

function isSolarPhotosphereMaterialV593(material: THREE.ShaderMaterial): boolean {
  return Boolean(
    material.uniforms.uPhotosphere
    && material.uniforms.uChromosphere
    && material.uniforms.uTexelSize
    && !material.transparent
  );
}

function isSolarChromosphereMaterialV593(material: THREE.ShaderMaterial): boolean {
  return Boolean(
    !material.uniforms.uPhotosphere
    && material.uniforms.uChromosphere
    && material.uniforms.uCinematic
    && material.transparent
  );
}

function isEarthSurfaceMaterialV593(material: THREE.ShaderMaterial): boolean {
  return Boolean(
    material.uniforms.uAlbedo
    && material.uniforms.uNormal
    && material.uniforms.uRoughness
    && material.uniforms.uCloudAlpha
    && material.uniforms.uNight
    && material.uniforms.uNightMask
    && !material.transparent
  );
}

function isEarthCloudMaterialV593(material: THREE.ShaderMaterial): boolean {
  return Boolean(
    material.uniforms.uClouds
    && material.uniforms.uCloudAlpha
    && material.uniforms.uUvOffset
    && material.uniforms.uLayerOpacity
    && material.transparent
  );
}

function isEarthAtmosphereMaterialV593(material: THREE.ShaderMaterial): boolean {
  return Boolean(
    material.uniforms.uRayleighColor
    && material.uniforms.uMieColor
    && material.uniforms.uDensity
    && !material.uniforms.uClouds
    && material.transparent
  );
}

function isSaturnSurfaceMaterialV593(material: THREE.ShaderMaterial): boolean {
  return Boolean(
    material.uniforms.uAlbedo
    && material.uniforms.uBands
    && material.uniforms.uPolarDetail
    && material.uniforms.uRingOpticalDepth
    && material.uniforms.uInnerRadius
    && material.uniforms.uOuterRadius
  );
}

function isSaturnRingMaterialV593(material: THREE.ShaderMaterial): boolean {
  return Boolean(
    material.uniforms.uRingColor
    && material.uniforms.uRingOpticalDepth
    && material.uniforms.uCameraWorld
    && material.uniforms.uPlanetRadius
    && material.transparent
  );
}

function isStellarSurfaceMaterialV593(material: THREE.ShaderMaterial): boolean {
  return Boolean(material.uniforms.uPhotosphereColor && material.uniforms.uGranulationScale);
}

function isStellarCoronaMaterialV593(material: THREE.ShaderMaterial): boolean {
  return Boolean(material.uniforms.uCoronaColor && material.uniforms.uSeed && material.transparent);
}

const STELLAR_SIGNATURE_PROFILES_V593 = Object.freeze({
  "sirius-a": Object.freeze({ hotFactor: 0.82, outputScaleMultiplier: 0.90, radiativeScale: 1.0, radiativeContrast: 1.24, label: "hot-radiative-main-sequence" }),
  rigel: Object.freeze({ hotFactor: 0.96, outputScaleMultiplier: 0.88, radiativeScale: 0.34, radiativeContrast: 1.22, label: "hot-radiative-supergiant" }),
  betelgeuse: Object.freeze({ hotFactor: 0.02, outputScaleMultiplier: 0.94, radiativeScale: 0.0, radiativeContrast: 0.0, label: "cool-convective-supergiant" }),
  antares: Object.freeze({ hotFactor: 0.01, outputScaleMultiplier: 0.90, radiativeScale: 0.0, radiativeContrast: 0.0, label: "cool-convective-supergiant" }),
} as const);

const DEEP_SKY_SIGNATURE_FOCUS_IDS_V593 = new Set<string>([
  "milky-way-center",
  "galactic-anticenter",
  "orion",
  "ursa-major",
  "cassiopeia",
  "orion-nebula",
  "heart-nebula",
  "andromeda-galaxy",
  "pleiades",
]);
const DEEP_FIELD_CLOSEUP_FOCUS_IDS_V593 = new Set<string>([
  "orion-nebula",
  "heart-nebula",
  "andromeda-galaxy",
  "pleiades",
]);

function rootV593(): HTMLElement | null {
  return document.querySelector<HTMLElement>("section[data-atlas-v593-shell]");
}

function findFocusRootV593(scene: THREE.Scene, focusId: string): THREE.Object3D | null {
  let result: THREE.Object3D | null = null;
  scene.traverse((node) => {
    if (result) return;
    if (
      (focusId === "sun" || focusId === "earth" || focusId === "jupiter" || focusId === "saturn")
      && node.userData.atlasHeroBodyV591 === focusId
      && node.userData.atlasAdmission === "admitted"
    ) {
      result = node;
    } else if (node.userData.atlasStellarHeroV592 === focusId) {
      result = node;
    }
  });
  return result;
}

export default function SignatureArtDirectionBridgeV593({
  mode,
  focusId,
  framePresetId = "live-clock",
  enabled,
}: Readonly<{
  mode: CelestialModeV590;
  focusId: string;
  framePresetId: string;
  enabled: boolean;
}>) {
  const scene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const cameraSunward = useMemo(() => new THREE.Vector3(), []);
  const cameraTangent = useMemo(() => new THREE.Vector3(), []);
  const cameraOffset = useMemo(() => new THREE.Vector3(), []);
  const earthCameraLocal = useMemo(() => new THREE.Vector3(), []);
  const patches = useRef(new Map<string, MaterialPatchV593>());
  const textureStates = useRef(new Map<string, TextureStateV593>());
  const frame = useRef(0);
  const firstRotation = useRef<number | null>(null);
  const lastTelemetry = useRef(-1);

  const restore = useCallback(() => {
    for (const patch of patches.current.values()) {
      if (patch.mesh.material === patch.replacement) patch.mesh.material = patch.original;
      patch.replacement.dispose();
    }
    patches.current.clear();
    for (const state of textureStates.current.values()) {
      state.texture.wrapS = state.wrapS;
      state.texture.anisotropy = state.anisotropy;
      state.texture.needsUpdate = true;
      // Changing sampling state can leave the previous WebGL allocation alive
      // when the v591 owner unmounts in the same React commit. Force the old
      // allocation out now, then repeat after render-list detachment. If the
      // frozen source texture is still active (same-build baseline A/B), Three
      // deterministically uploads that same object once with restored state.
      state.texture.dispose();
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => state.texture.dispose()));
      }
    }
    textureStates.current.clear();
    firstRotation.current = null;
    const root = rootV593();
    if (root) {
      root.dataset.atlasV593SignatureBridge = "unmounted-or-restoring";
      root.dataset.atlasV593SignaturePatchCount = "0";
      root.dataset.atlasV593SignatureJupiter = "inactive";
      root.dataset.atlasV593SignatureSun = "inactive";
      root.dataset.atlasV593SunPhotospherePatchCount = "0";
      root.dataset.atlasV593SunChromospherePatchCount = "0";
      root.dataset.atlasV593SignatureEarth = "inactive";
      root.dataset.atlasV593EarthSurfacePatchCount = "0";
      root.dataset.atlasV593EarthCloudPatchCount = "0";
      root.dataset.atlasV593EarthAtmospherePatchCount = "0";
      root.dataset.atlasV593EarthCameraCenterU = "unavailable";
      root.dataset.atlasV593EarthSeamDistanceDeg = "unavailable";
      root.dataset.atlasV593EarthSeamFacingCamera = "false";
      root.dataset.atlasV593SignatureSaturn = "inactive";
      root.dataset.atlasV593SaturnSurfacePatchCount = "0";
      root.dataset.atlasV593SaturnRingPatchCount = "0";
      root.dataset.atlasV593SignatureStellar = "inactive";
      root.dataset.atlasV593StellarProfile = "inactive";
      root.dataset.atlasV593SignatureDeepSky = "inactive";
      root.dataset.atlasV593DeepSkySpherePatchCount = "0";
      root.dataset.atlasV593DeepSkyStarfieldPatchCount = "0";
      root.dataset.atlasV593DeepSkyNebulaPatchCount = "0";
      root.dataset.atlasV593DeepSkyObservationPatchCount = "0";
      root.dataset.atlasV593DeepSkyTargetMaterialReady = "false";
      root.dataset.atlasV593DeepSkySourceTargets = "none";
      root.dataset.atlasV593DeepSkySourceShas = "none";
      root.dataset.atlasV593DeepSkySourcePolicy = "inactive";
      root.dataset.atlasV593DeepSkyReconstructionPolicy = "inactive";
      root.dataset.atlasV593RotationVisualDeltaRad = "0.00000000";
      root.dataset.atlasV593SignatureCameraPolicy = "inherited-v591-camera";
    }
  }, []);

  useEffect(() => {
    restore();
    return restore;
  }, [enabled, focusId, mode, restore]);

  const prepareTexture = useCallback((texture: THREE.Texture) => {
    if (!textureStates.current.has(texture.uuid)) {
      textureStates.current.set(texture.uuid, {
        texture,
        wrapS: texture.wrapS,
        anisotropy: texture.anisotropy,
      });
    }
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
  }, [gl]);

  const patchMesh = useCallback((mesh: PatchableObjectV593, replacement: THREE.Material) => {
    if (patches.current.has(mesh.uuid)) {
      replacement.dispose();
      return;
    }
    const original = singleMaterialV593(mesh);
    if (!original) {
      replacement.dispose();
      return;
    }
    replacement.userData.atlasV593SignatureMaterial = true;
    replacement.userData.atlasV593SourceMaterialUuid = original.uuid;
    replacement.needsUpdate = true;
    patches.current.set(mesh.uuid, { mesh, original, replacement });
    mesh.material = replacement;
  }, []);

  const patchJupiter = useCallback((root: THREE.Object3D) => {
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const original = singleShaderMaterialV593(node);
      if (!original || !isJupiterMaterialV593(original) || patches.current.has(node.uuid)) return;
      const replacement = original.clone();
      const albedo = replacement.uniforms.uAlbedo?.value as THREE.Texture | undefined;
      const bandMask = replacement.uniforms.uBandMask?.value as THREE.Texture | undefined;
      const stormMask = replacement.uniforms.uStormMask?.value as THREE.Texture | undefined;
      for (const texture of [albedo, bandMask, stormMask]) if (texture) prepareTexture(texture);
      const bandHeight = Math.max(1, bandMask?.image?.height ?? 1024);
      replacement.fragmentShader = JUPITER_FRAGMENT_V593;
      replacement.uniforms.uCinematicV593 = { value: mode === "cinematic" ? 1 : 0 };
      replacement.uniforms.uSeamBlendV593 = { value: 0.018 };
      replacement.uniforms.uBandTexelV593 = { value: new THREE.Vector2(1 / Math.max(1, bandMask?.image?.width ?? 2048), 1 / bandHeight) };
      replacement.userData.atlasV593SignaturePass = "jupiter";
      replacement.userData.atlasV593SeamPolicy = "symmetric-clean-inset-reconstruction-6.48deg-repeat-sampling";
      patchMesh(node, replacement);
    });
  }, [mode, patchMesh, prepareTexture]);

  const patchSun = useCallback((root: THREE.Object3D) => {
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const original = singleShaderMaterialV593(node);
      if (!original || patches.current.has(node.uuid)) return;
      if (isSolarPhotosphereMaterialV593(original)) {
        const replacement = original.clone();
        const photosphere = replacement.uniforms.uPhotosphere?.value as THREE.Texture | undefined;
        const chromosphere = replacement.uniforms.uChromosphere?.value as THREE.Texture | undefined;
        for (const texture of [photosphere, chromosphere]) if (texture) prepareTexture(texture);
        if (!replacement.uniforms.uPhysicalDaysV592) replacement.uniforms.uPhysicalDaysV592 = { value: 0 };
        replacement.fragmentShader = SOLAR_PHOTOSPHERE_FRAGMENT_V593;
        replacement.uniforms.uCinematic.value = mode === "cinematic" ? 1 : 0;
        replacement.uniforms.uSolarSeamBlendV593 = { value: 0.018 };
        replacement.userData.atlasV593SignaturePass = "sun";
        replacement.userData.atlasV593SolarMaterialRole = "source-bound-photosphere";
        replacement.userData.atlasV593SolarPhotosphereModel = "sdo-hmi-source-local-contrast-observed-sunspot-limb-darkening";
        replacement.userData.atlasV593SolarDifferentialRotation = "v592-physical-days-latitude-law-preserved";
        patchMesh(node, replacement);
      } else if (isSolarChromosphereMaterialV593(original)) {
        const replacement = original.clone();
        const chromosphere = replacement.uniforms.uChromosphere?.value as THREE.Texture | undefined;
        if (chromosphere) prepareTexture(chromosphere);
        replacement.fragmentShader = SOLAR_CHROMOSPHERE_FRAGMENT_V593;
        replacement.uniforms.uCinematic.value = mode === "cinematic" ? 1 : 0;
        replacement.uniforms.uSolarSeamBlendV593 = { value: 0.018 };
        replacement.userData.atlasV593SignaturePass = "sun";
        replacement.userData.atlasV593SolarMaterialRole = "source-bound-chromosphere";
        replacement.userData.atlasV593SolarChromosphereModel = "sdo-aia-source-bounded-rim-and-spicules";
        patchMesh(node, replacement);
      }
    });
  }, [mode, patchMesh, prepareTexture]);

  const patchEarth = useCallback((root: THREE.Object3D) => {
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const original = singleShaderMaterialV593(node);
      if (!original || patches.current.has(node.uuid)) return;
      if (isEarthSurfaceMaterialV593(original)) {
        const replacement = original.clone();
        const textures = ["uAlbedo", "uNormal", "uRoughness", "uCloudAlpha", "uNight", "uNightMask"]
          .map((name) => replacement.uniforms[name]?.value as THREE.Texture | undefined);
        for (const texture of textures) if (texture) prepareTexture(texture);
        replacement.fragmentShader = EARTH_SURFACE_FRAGMENT_V593;
        replacement.uniforms.uCinematicV593 = { value: mode === "cinematic" ? 1 : 0 };
        replacement.uniforms.uEarthSeamBlendV593 = { value: 0.0045 };
        replacement.userData.atlasV593SignaturePass = "earth";
        replacement.userData.atlasV593EarthMaterialRole = "source-bound-surface-ocean-night";
        replacement.userData.atlasV593EarthSurfaceModel = "blue-marble-gebco-roughness-ggx-ocean-black-marble-terminator";
        replacement.userData.atlasV593EarthCloudShadow = "dual-source-alpha-sun-tangent-offset-optical-depth";
        patchMesh(node, replacement);
      } else if (isEarthCloudMaterialV593(original)) {
        const replacement = original.clone();
        const clouds = replacement.uniforms.uClouds?.value as THREE.Texture | undefined;
        const alpha = replacement.uniforms.uCloudAlpha?.value as THREE.Texture | undefined;
        for (const texture of [clouds, alpha]) if (texture) prepareTexture(texture);
        replacement.fragmentShader = EARTH_CLOUD_FRAGMENT_V593;
        replacement.uniforms.uCinematicV593 = { value: mode === "cinematic" ? 1 : 0 };
        replacement.uniforms.uEarthSeamBlendV593 = { value: 0.0045 };
        replacement.userData.atlasV593SignaturePass = "earth";
        replacement.userData.atlasV593EarthMaterialRole = replacement.uniforms.uUvOffset.value.x > 0
          ? "source-bound-upper-cloud"
          : "source-bound-lower-cloud";
        replacement.userData.atlasV593EarthCloudModel = "dual-layer-source-opacity-self-shadow-silver-lining";
        patchMesh(node, replacement);
      } else if (isEarthAtmosphereMaterialV593(original)) {
        const replacement = original.clone();
        replacement.fragmentShader = EARTH_ATMOSPHERE_FRAGMENT_V593;
        replacement.uniforms.uCinematicV593 = { value: mode === "cinematic" ? 1 : 0 };
        replacement.userData.atlasV593SignaturePass = "earth";
        replacement.userData.atlasV593EarthMaterialRole = "analytic-atmosphere-shell";
        replacement.userData.atlasV593EarthAtmosphereModel = "bounded-rayleigh-mie-optical-path-twilight";
        patchMesh(node, replacement);
      }
    });
  }, [mode, patchMesh, prepareTexture]);

  const patchSaturn = useCallback((root: THREE.Object3D) => {
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const original = singleShaderMaterialV593(node);
      if (!original || patches.current.has(node.uuid)) return;
      if (isSaturnSurfaceMaterialV593(original)) {
        const replacement = original.clone();
        const opticalDepth = replacement.uniforms.uRingOpticalDepth?.value as THREE.Texture | undefined;
        const ringWidth = Math.max(1, opticalDepth?.image?.width ?? 4096);
        replacement.fragmentShader = SATURN_SURFACE_FRAGMENT_V593;
        replacement.uniforms.uCinematicV593 = { value: mode === "cinematic" ? 1 : 0 };
        replacement.uniforms.uRingTexelV593 = { value: 1 / ringWidth };
        replacement.userData.atlasV593SignaturePass = "saturn";
        replacement.userData.atlasV593SaturnMaterialRole = "atmosphere-ring-shadow-receiver";
        replacement.userData.atlasV593RingToPlanetShadow = "optical-depth-ray-plane-transmission";
        patchMesh(node, replacement);
      } else if (isSaturnRingMaterialV593(original)) {
        const replacement = original.clone();
        const opticalDepth = replacement.uniforms.uRingOpticalDepth?.value as THREE.Texture | undefined;
        const ringWidth = Math.max(1, opticalDepth?.image?.width ?? 4096);
        replacement.fragmentShader = SATURN_RING_FRAGMENT_V593;
        replacement.uniforms.uCinematicV593 = { value: mode === "cinematic" ? 1 : 0 };
        replacement.uniforms.uRingTexelV593 = { value: 1 / ringWidth };
        replacement.userData.atlasV593SignaturePass = "saturn";
        replacement.userData.atlasV593SaturnMaterialRole = "ring-optical-depth-scattering";
        replacement.userData.atlasV593PlanetToRingShadow = "analytic-ray-sphere-penumbra";
        replacement.userData.atlasV593ScatteringModel = "bounded-henyey-greenstein-forward-backward";
        patchMesh(node, replacement);
      }
    });
  }, [mode, patchMesh]);

  const patchStellar = useCallback((root: THREE.Object3D) => {
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh) || patches.current.has(node.uuid)) return;
      const original = singleShaderMaterialV593(node);
      if (!original) return;
      if (isStellarSurfaceMaterialV593(original)) {
        const replacement = original.clone();
        const signatureProfile = STELLAR_SIGNATURE_PROFILES_V593[focusId as keyof typeof STELLAR_SIGNATURE_PROFILES_V593];
        replacement.fragmentShader = STELLAR_SURFACE_FRAGMENT_V593;
        replacement.uniforms.uCinematic.value = mode === "cinematic" ? 1 : 0;
        replacement.uniforms.uRadiativeScaleV593 = { value: signatureProfile?.radiativeScale ?? 0 };
        replacement.uniforms.uRadiativeContrastV593 = { value: signatureProfile?.radiativeContrast ?? 0 };
        if (signatureProfile) {
          replacement.uniforms.uHotFactor.value = signatureProfile.hotFactor;
          replacement.uniforms.uOutputScale.value *= signatureProfile.outputScaleMultiplier;
          replacement.userData.atlasV593StellarProfile = signatureProfile.label;
        }
        replacement.userData.atlasV593SignaturePass = "stellar-archetypes";
        replacement.userData.atlasV593PhotosphereModel = "deterministic-domain-warped-multiscale-convection-no-hard-voronoi-cells";
        patchMesh(node, replacement);
      } else if (isStellarCoronaMaterialV593(original)) {
        const replacement = original.clone();
        replacement.fragmentShader = STELLAR_CORONA_FRAGMENT_V593;
        const signatureProfile = STELLAR_SIGNATURE_PROFILES_V593[focusId as keyof typeof STELLAR_SIGNATURE_PROFILES_V593];
        replacement.uniforms.uCoronaGainV593 = {
          value: signatureProfile?.label.includes("cool") ? 1.32 : 0.94,
        };
        replacement.userData.atlasV593SignaturePass = "stellar-archetypes";
        replacement.userData.atlasV593CoronaModel = "bounded-deterministic-streamers";
        patchMesh(node, replacement);
      }
    });
  }, [focusId, mode, patchMesh]);

  const patchDeepSky = useCallback((root: THREE.Object3D) => {
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh) && !(node instanceof THREE.Points)) return;
      if (patches.current.has(node.uuid)) return;
      const layer = String(node.userData.atlasLayer ?? "");
      const original = singleMaterialV593(node);
      if (!original) return;

      if (layer === "fixed-inward-celestial-sphere" && original instanceof THREE.ShaderMaterial) {
        const base = original.uniforms.uBase?.value as THREE.Texture | undefined;
        const stars = original.uniforms.uStars?.value as THREE.Texture | undefined;
        const dust = original.uniforms.uDust?.value as THREE.Texture | undefined;
        if (!base || !stars || !dust) return;
        const replacement = original.clone();
        replacement.fragmentShader = DEEP_SKY_SPHERE_FRAGMENT_V593;
        replacement.uniforms.uBaseTexelV593 = { value: textureDimensionsV593(base, 8_192) };
        replacement.uniforms.uStarsTexelV593 = { value: textureDimensionsV593(stars, 4_096) };
        replacement.uniforms.uDustTexelV593 = { value: textureDimensionsV593(dust, 2_048) };
        replacement.uniforms.uCloseup.value = DEEP_FIELD_CLOSEUP_FOCUS_IDS_V593.has(focusId) ? 1 : 0;
        replacement.userData.atlasV593SignaturePass = "deep-sky";
        replacement.userData.atlasV593DeepSkyMaterialRole = "j2000-source-bound-inward-sphere";
        replacement.userData.atlasV593DeepSkyModel = "seam-safe-nine-tap-source-reconstruction-bounded-direction-microstructure";
        replacement.userData.atlasV593ObservationImageClaim = false;
        patchMesh(node, replacement);
        return;
      }

      if (hasAncestorLayerV593(node, "living-gaia-starfield-v592") && original instanceof THREE.ShaderMaterial) {
        if (node instanceof THREE.Points && original.uniforms.uOpacity && original.uniforms.uSizeGain) {
          const replacement = original.clone();
          replacement.fragmentShader = DEEP_STAR_POINT_FRAGMENT_V593;
          replacement.userData.atlasV593SignaturePass = "deep-sky";
          replacement.userData.atlasV593DeepSkyMaterialRole = "gaia-linear-faint-and-catalog-psf";
          replacement.userData.atlasV593DeepSkyModel = "gaia-flux-preserving-moffat-airy-no-random-twinkle";
          patchMesh(node, replacement);
          return;
        }
        if (node instanceof THREE.Mesh && original.uniforms.uViewport && original.uniforms.uSizeGain) {
          const replacement = original.clone();
          replacement.fragmentShader = DEEP_STAR_PSF_FRAGMENT_V593;
          replacement.userData.atlasV593SignaturePass = "deep-sky";
          replacement.userData.atlasV593DeepSkyMaterialRole = "gaia-bright-analytic-psf";
          replacement.userData.atlasV593DeepSkyModel = "gaia-flux-preserving-bounded-airy-spikes-no-random-twinkle";
          patchMesh(node, replacement);
          return;
        }
      }

      const sourceKind = layer === "verified-nasa-nebula-impostor"
        || layer === "verified-nasa-expanded-nebula-depth-impostor"
        ? "nebula"
        : layer === "j2000-focused-deep-space-observation-image"
          ? "observation"
          : null;
      if (!sourceKind || !(node instanceof THREE.Mesh) || !(original instanceof THREE.MeshBasicMaterial) || !original.map) return;
      const replacement = new THREE.ShaderMaterial({
        vertexShader: DEEP_FIELD_VERTEX_V593,
        fragmentShader: DEEP_FIELD_FRAGMENT_V593,
        uniforms: {
          uMap: { value: original.map },
          uTexelV593: { value: textureDimensionsV593(original.map, 2_048) },
          uOpacityV593: {
            value: (node.userData.atlasNebula === focusId || node.userData.atlasDeepSpaceObject === focusId)
              ? 0.94
              : original.opacity,
          },
          uCinematicV593: { value: mode === "cinematic" ? 1 : 0 },
          uObservationKindV593: { value: sourceKind === "observation" ? 1 : 0 },
          uSliceIndexV593: { value: Number(node.userData.atlasDepthIndex ?? 0) },
          uTintV593: {
            value: (node.userData.atlasNebula === focusId || node.userData.atlasDeepSpaceObject === focusId)
              ? new THREE.Color(1, 1, 1)
              : original.color.clone(),
          },
        },
        transparent: true,
        depthTest: original.depthTest,
        depthWrite: false,
        blending: THREE.NormalBlending,
        premultipliedAlpha: false,
        toneMapped: false,
        side: original.side,
      });
      replacement.userData.atlasV593SignaturePass = "deep-sky";
      replacement.userData.atlasV593DeepSkyMaterialRole = sourceKind === "nebula"
        ? "source-bound-nebula-depth-slice"
        : "source-bound-deep-field-observation-slice";
      replacement.userData.atlasV593DeepSkyModel = "source-background-separated-frequency-layered-organic-aperture-black-level-reconstruction";
      replacement.userData.atlasV593DeepSkySourceTarget = String(
        node.userData.atlasNebula ?? node.userData.atlasDeepSpaceObject ?? "unknown",
      );
      replacement.userData.atlasV593DeepSkySourceSha256 = String(
        node.userData.atlasNebulaTextureSha256
        ?? node.userData.atlasTextureSha256
        ?? original.map.userData.atlasContentSha256
        ?? "unavailable",
      );
      replacement.userData.atlasV593ObservationImageClaim = sourceKind === "observation";
      replacement.userData.atlasV593ScientificAuthority = false;
      patchMesh(node, replacement);
    });
  }, [focusId, mode, patchMesh]);

  useFrame(({ clock }) => {
    frame.current += 1;
    const focusRoot = findFocusRootV593(scene, focusId);
    if (enabled && focusRoot && frame.current % 12 === 1) {
      if (focusId === "sun") patchSun(focusRoot);
      else if (focusId === "earth") patchEarth(focusRoot);
      else if (focusId === "jupiter") patchJupiter(focusRoot);
      else if (focusId === "saturn") patchSaturn(focusRoot);
      else if (focusRoot.userData.atlasStellarHeroV592) patchStellar(focusRoot);
    }
    if (enabled && DEEP_SKY_SIGNATURE_FOCUS_IDS_V593.has(focusId) && frame.current % 12 === 1) {
      patchDeepSky(scene);
    }

    let cameraPolicy = "inherited-v591-camera";
    const deepFieldFov = focusId === "orion-nebula"
      ? 3.2
      : focusId === "heart-nebula"
        ? 8.0
      : focusId === "andromeda-galaxy"
          ? 5.8
          : focusId === "pleiades"
            ? 8.5
            : 42;
    if (Math.abs(camera.fov - deepFieldFov) > 1e-4) {
      camera.fov = deepFieldFov;
      camera.updateProjectionMatrix();
    }
    if (deepFieldFov !== 42) cameraPolicy = "fixed-J2000-source-bound-deep-field-closeup-fov";
    if (focusRoot && focusId === "saturn" && framePresetId.startsWith("saturn-cinematic-")) {
      focusRoot.getWorldPosition(cameraTarget);
      cameraSunward.copy(cameraTarget).multiplyScalar(-1);
      if (cameraSunward.lengthSq() < 1e-8) cameraSunward.set(0.36, 0.18, 0.92);
      cameraSunward.normalize();
      cameraTangent.crossVectors(THREE.Object3D.DEFAULT_UP, cameraSunward);
      if (cameraTangent.lengthSq() < 1e-8) cameraTangent.set(1, 0, 0);
      else cameraTangent.normalize();
      if (framePresetId === "saturn-cinematic-backlight") {
        cameraOffset.copy(cameraSunward).multiplyScalar(-0.82)
          .addScaledVector(cameraTangent, 0.12)
          .addScaledVector(THREE.Object3D.DEFAULT_UP, 0.55);
        cameraPolicy = "anti-solar-backscatter-fixed-camera";
      } else if (framePresetId === "saturn-cinematic-ring-shadow") {
        cameraOffset.copy(cameraSunward).multiplyScalar(0.32)
          .addScaledVector(cameraTangent, 0.50)
          .addScaledVector(THREE.Object3D.DEFAULT_UP, 0.82);
        cameraPolicy = "ring-plane-bidirectional-shadow-fixed-camera";
      } else {
        cameraOffset.copy(cameraSunward).multiplyScalar(0.56)
          .addScaledVector(cameraTangent, 0.76)
          .addScaledVector(THREE.Object3D.DEFAULT_UP, 0.28);
        cameraPolicy = "three-quarter-optical-depth-fixed-camera";
      }
      cameraOffset.normalize();
      camera.position.copy(cameraTarget).addScaledVector(cameraOffset, 6.42);
      camera.lookAt(cameraTarget);
      camera.updateMatrixWorld(true);
    } else if (focusRoot && focusId === "earth" && framePresetId.startsWith("earth-")) {
      focusRoot.getWorldPosition(cameraTarget);
      cameraSunward.copy(cameraTarget).multiplyScalar(-1);
      if (cameraSunward.lengthSq() < 1e-8) cameraSunward.set(0.36, 0.18, 0.92);
      cameraSunward.normalize();
      cameraTangent.crossVectors(THREE.Object3D.DEFAULT_UP, cameraSunward);
      if (cameraTangent.lengthSq() < 1e-8) cameraTangent.set(1, 0, 0);
      else cameraTangent.normalize();
      if (framePresetId === "earth-cinematic-night") {
        cameraOffset.copy(cameraSunward).multiplyScalar(-0.91)
          .addScaledVector(cameraTangent, 0.33)
          .addScaledVector(THREE.Object3D.DEFAULT_UP, 0.17);
        cameraPolicy = "anti-solar-night-lights-fixed-camera";
      } else if (framePresetId === "earth-science-limb") {
        cameraOffset.copy(cameraTangent)
          .addScaledVector(cameraSunward, 0.055)
          .addScaledVector(THREE.Object3D.DEFAULT_UP, 0.14);
        cameraPolicy = "terminator-atmospheric-limb-fixed-camera";
      } else {
        cameraOffset.copy(cameraSunward).multiplyScalar(0.84)
          .addScaledVector(cameraTangent, 0.46)
          .addScaledVector(THREE.Object3D.DEFAULT_UP, 0.20);
        cameraPolicy = "sunward-blue-marble-three-quarter-fixed-camera";
      }
      cameraOffset.normalize();
      camera.position.copy(cameraTarget).addScaledVector(cameraOffset, 2.72);
      camera.lookAt(cameraTarget);
      camera.updateMatrixWorld(true);
    }

    const root = rootV593();
    if (!root || clock.elapsedTime - lastTelemetry.current < 0.25) return;
    lastTelemetry.current = clock.elapsedTime;
    const rotation = focusRoot?.rotation.y ?? null;
    if (rotation !== null && firstRotation.current === null) firstRotation.current = rotation;
    const rotationDelta = rotation === null || firstRotation.current === null
      ? 0
      : THREE.MathUtils.euclideanModulo(rotation - firstRotation.current + Math.PI, Math.PI * 2) - Math.PI;
    let earthCameraCenterU: number | null = null;
    if (focusRoot && focusId === "earth") {
      earthCameraLocal.copy(camera.position);
      focusRoot.worldToLocal(earthCameraLocal);
      if (earthCameraLocal.lengthSq() > 1e-10) {
        earthCameraLocal.normalize();
        const earthCenterPhi = THREE.MathUtils.euclideanModulo(
          Math.atan2(earthCameraLocal.z, -earthCameraLocal.x),
          Math.PI * 2,
        );
        earthCameraCenterU = earthCenterPhi / (Math.PI * 2);
      }
    }
    root.dataset.atlasV593SignatureFocus = focusId;
    root.dataset.atlasV593SignatureBridge = enabled ? "mounted-r3f-webgl" : "mounted-baseline-camera-only";
    root.dataset.atlasV593SignaturePatchCount = String(patches.current.size);
    root.dataset.atlasV593SignatureJupiter = enabled && focusId === "jupiter" && patches.current.size > 0
      ? "implemented-code-gates-pending"
      : "inactive";
    const sunPatches = [...patches.current.values()].filter(
      (patch) => patch.replacement.userData.atlasV593SignaturePass === "sun",
    );
    root.dataset.atlasV593SignatureSun = enabled && focusId === "sun" && sunPatches.length === 2
      ? "implemented-code-gates-pending"
      : "inactive";
    root.dataset.atlasV593SunPhotospherePatchCount = String(sunPatches.filter(
      (patch) => patch.replacement.userData.atlasV593SolarMaterialRole === "source-bound-photosphere",
    ).length);
    root.dataset.atlasV593SunChromospherePatchCount = String(sunPatches.filter(
      (patch) => patch.replacement.userData.atlasV593SolarMaterialRole === "source-bound-chromosphere",
    ).length);
    const earthPatches = [...patches.current.values()].filter(
      (patch) => patch.replacement.userData.atlasV593SignaturePass === "earth",
    );
    root.dataset.atlasV593SignatureEarth = enabled && focusId === "earth" && earthPatches.length === 4
      ? "implemented-code-gates-pending"
      : "inactive";
    root.dataset.atlasV593EarthSurfacePatchCount = String(earthPatches.filter(
      (patch) => patch.replacement.userData.atlasV593EarthMaterialRole === "source-bound-surface-ocean-night",
    ).length);
    root.dataset.atlasV593EarthCloudPatchCount = String(earthPatches.filter(
      (patch) => String(patch.replacement.userData.atlasV593EarthMaterialRole).includes("cloud"),
    ).length);
    root.dataset.atlasV593EarthAtmospherePatchCount = String(earthPatches.filter(
      (patch) => patch.replacement.userData.atlasV593EarthMaterialRole === "analytic-atmosphere-shell",
    ).length);
    const earthSeamDistanceDeg = earthCameraCenterU === null
      ? null
      : Math.min(earthCameraCenterU, 1 - earthCameraCenterU) * 360;
    root.dataset.atlasV593EarthCameraCenterU = earthCameraCenterU?.toFixed(8) ?? "unavailable";
    root.dataset.atlasV593EarthSeamDistanceDeg = earthSeamDistanceDeg?.toFixed(6) ?? "unavailable";
    root.dataset.atlasV593EarthSeamFacingCamera = earthSeamDistanceDeg !== null && earthSeamDistanceDeg <= 1
      ? "true"
      : "false";
    const saturnPatches = [...patches.current.values()].filter(
      (patch) => patch.replacement.userData.atlasV593SignaturePass === "saturn",
    );
    root.dataset.atlasV593SignatureSaturn = enabled && focusId === "saturn" && saturnPatches.length === 2
      ? "implemented-code-gates-pending"
      : "inactive";
    root.dataset.atlasV593SaturnSurfacePatchCount = String(saturnPatches.filter(
      (patch) => patch.replacement.userData.atlasV593SaturnMaterialRole === "atmosphere-ring-shadow-receiver",
    ).length);
    root.dataset.atlasV593SaturnRingPatchCount = String(saturnPatches.filter(
      (patch) => patch.replacement.userData.atlasV593SaturnMaterialRole === "ring-optical-depth-scattering",
    ).length);
    root.dataset.atlasV593SignatureStellar = enabled && focusRoot?.userData.atlasStellarHeroV592 && patches.current.size > 0
      ? "implemented-code-gates-pending"
      : "inactive";
    root.dataset.atlasV593StellarProfile = [...patches.current.values()]
      .map((patch) => patch.replacement.userData.atlasV593StellarProfile)
      .find((profile) => typeof profile === "string") ?? "inactive";
    const deepSkyPatches = [...patches.current.values()].filter(
      (patch) => patch.replacement.userData.atlasV593SignaturePass === "deep-sky",
    );
    const deepSkySpherePatchCount = deepSkyPatches.filter(
      (patch) => patch.replacement.userData.atlasV593DeepSkyMaterialRole === "j2000-source-bound-inward-sphere",
    ).length;
    const deepSkyStarfieldPatchCount = deepSkyPatches.filter(
      (patch) => String(patch.replacement.userData.atlasV593DeepSkyMaterialRole).startsWith("gaia-"),
    ).length;
    const deepSkyNebulaPatchCount = deepSkyPatches.filter(
      (patch) => patch.replacement.userData.atlasV593DeepSkyMaterialRole === "source-bound-nebula-depth-slice",
    ).length;
    const deepSkyObservationPatchCount = deepSkyPatches.filter(
      (patch) => patch.replacement.userData.atlasV593DeepSkyMaterialRole === "source-bound-deep-field-observation-slice",
    ).length;
    const targetMaterialReady = mode === "science"
      ? true
      : focusId === "orion-nebula" || focusId === "heart-nebula"
        ? deepSkyNebulaPatchCount > 0
        : focusId === "andromeda-galaxy"
          ? deepSkyObservationPatchCount > 0
          : true;
    const deepSkySourceTargets = [...new Set(deepSkyPatches
      .map((patch) => patch.replacement.userData.atlasV593DeepSkySourceTarget)
      .filter((target): target is string => typeof target === "string" && target !== "unknown"))]
      .sort();
    const deepSkySourceShas = [...new Set(deepSkyPatches
      .map((patch) => patch.replacement.userData.atlasV593DeepSkySourceSha256)
      .filter((sha): sha is string => typeof sha === "string" && /^[a-f0-9]{64}$/.test(sha)))]
      .sort();
    root.dataset.atlasV593SignatureDeepSky = enabled
      && DEEP_SKY_SIGNATURE_FOCUS_IDS_V593.has(focusId)
      && deepSkyPatches.length >= 3
      && targetMaterialReady
      ? "implemented-code-gates-pending"
      : enabled && DEEP_SKY_SIGNATURE_FOCUS_IDS_V593.has(focusId)
        ? "blocked-target-source-layer-missing"
        : "inactive";
    root.dataset.atlasV593DeepSkySpherePatchCount = String(deepSkySpherePatchCount);
    root.dataset.atlasV593DeepSkyStarfieldPatchCount = String(deepSkyStarfieldPatchCount);
    root.dataset.atlasV593DeepSkyNebulaPatchCount = String(deepSkyNebulaPatchCount);
    root.dataset.atlasV593DeepSkyObservationPatchCount = String(deepSkyObservationPatchCount);
    root.dataset.atlasV593DeepSkyTargetMaterialReady = targetMaterialReady ? "true" : "false";
    root.dataset.atlasV593DeepSkySourceTargets = deepSkySourceTargets.join(",") || "none";
    root.dataset.atlasV593DeepSkySourceShas = deepSkySourceShas.join(",") || "none";
    root.dataset.atlasV593DeepSkySourcePolicy = mode === "science"
      ? "catalog-coordinate-and-linear-sky-no-observation-image"
      : "source-bound-presentation-image-with-band-disclosure";
    root.dataset.atlasV593DeepSkyReconstructionPolicy = deepSkyPatches.length > 0
      ? "source-bound-seam-safe-alpha-aware-no-coordinate-mutation"
      : "inactive";
    root.dataset.atlasV593RotationVisualDeltaRad = rotationDelta.toFixed(8);
    root.dataset.atlasV593RotationVisiblyAdvancing = Math.abs(rotationDelta) > 1e-5 ? "true" : "false";
    root.dataset.atlasV593MaterialRestorePolicy = "restore-original-on-focus-change-or-unmount";
    root.dataset.atlasV593SignatureCameraPolicy = cameraPolicy;
    root.dataset.atlasV593ScientificWriteback = "false";
  }, -0.25);

  return <group userData={{ atlasCandidate: "v593", atlasSignatureArtDirectionBridgeV593: true }} />;
}
