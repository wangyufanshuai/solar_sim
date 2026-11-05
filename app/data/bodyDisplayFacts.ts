/**
 * Static display numbers for the body sidebar (approximate reference values).
 * Dynamics (位置、速度) come from the live integrator.
 */

export type BodyDisplayFacts = {
  /** Mean / equatorial radius */
  equatorialRadiusKm: number;
  densityGcm3: number;
  surfaceGravityMs2: number;
  /** Synodic/sidereal rotation period (Earth: hours). */
  rotationPeriodHours: number;
  meanTempC: number;
  /** Rough heliocentric period for major planets (years); Moon = months→years fraction. */
  approximateOrbitalPeriodYears?: number;
  ageGyears: number;
};

export const BODY_DISPLAY_FACTS: Record<string, BodyDisplayFacts> = {
  sun: {
    equatorialRadiusKm: 696_000,
    densityGcm3: 1.41,
    surfaceGravityMs2: 274,
    rotationPeriodHours: 609.12,
    meanTempC: 5500,
    ageGyears: 4.6,
  },
  mercury: {
    equatorialRadiusKm: 2440,
    densityGcm3: 5.43,
    surfaceGravityMs2: 3.7,
    rotationPeriodHours: 1407.6,
    meanTempC: 167,
    approximateOrbitalPeriodYears: 0.241,
    ageGyears: 4.5,
  },
  venus: {
    equatorialRadiusKm: 6052,
    densityGcm3: 5.24,
    surfaceGravityMs2: 8.87,
    rotationPeriodHours: 2802,
    meanTempC: 464,
    approximateOrbitalPeriodYears: 0.615,
    ageGyears: 4.5,
  },
  earth: {
    equatorialRadiusKm: 6371,
    densityGcm3: 5.51,
    surfaceGravityMs2: 9.81,
    rotationPeriodHours: 23.93,
    meanTempC: 15,
    approximateOrbitalPeriodYears: 1,
    ageGyears: 4.5,
  },
  moon: {
    equatorialRadiusKm: 1737,
    densityGcm3: 3.34,
    surfaceGravityMs2: 1.62,
    rotationPeriodHours: 655.7,
    meanTempC: -20,
    approximateOrbitalPeriodYears: 0.0748,
    ageGyears: 4.5,
  },
  mars: {
    equatorialRadiusKm: 3390,
    densityGcm3: 3.93,
    surfaceGravityMs2: 3.71,
    rotationPeriodHours: 24.6,
    meanTempC: -65,
    approximateOrbitalPeriodYears: 1.88,
    ageGyears: 4.5,
  },
  jupiter: {
    equatorialRadiusKm: 69_911,
    densityGcm3: 1.33,
    surfaceGravityMs2: 24.79,
    rotationPeriodHours: 9.92,
    meanTempC: -110,
    approximateOrbitalPeriodYears: 11.9,
    ageGyears: 4.6,
  },
  saturn: {
    equatorialRadiusKm: 58_232,
    densityGcm3: 0.69,
    surfaceGravityMs2: 10.44,
    rotationPeriodHours: 10.7,
    meanTempC: -140,
    approximateOrbitalPeriodYears: 29.5,
    ageGyears: 4.5,
  },
  uranus: {
    equatorialRadiusKm: 25_362,
    densityGcm3: 1.27,
    surfaceGravityMs2: 8.87,
    rotationPeriodHours: 17.24,
    meanTempC: -195,
    approximateOrbitalPeriodYears: 84,
    ageGyears: 4.5,
  },
  neptune: {
    equatorialRadiusKm: 24_622,
    densityGcm3: 1.64,
    surfaceGravityMs2: 11.15,
    rotationPeriodHours: 16.11,
    meanTempC: -200,
    approximateOrbitalPeriodYears: 164.8,
    ageGyears: 4.5,
  },
  pluto: {
    equatorialRadiusKm: 1188,
    densityGcm3: 1.85,
    surfaceGravityMs2: 0.62,
    rotationPeriodHours: 153.3,
    meanTempC: -230,
    approximateOrbitalPeriodYears: 247.9,
    ageGyears: 4.6,
  },
  ceres: {
    equatorialRadiusKm: 473,
    densityGcm3: 2.16,
    surfaceGravityMs2: 0.27,
    rotationPeriodHours: 9.07,
    meanTempC: -106,
    approximateOrbitalPeriodYears: 4.6,
    ageGyears: 4.5,
  },
  io: {
    equatorialRadiusKm: 1821,
    densityGcm3: 3.53,
    surfaceGravityMs2: 1.8,
    rotationPeriodHours: 42.46,
    meanTempC: -130,
    approximateOrbitalPeriodYears: 0.00485,
    ageGyears: 4.5,
  },
  europa: {
    equatorialRadiusKm: 1561,
    densityGcm3: 3.01,
    surfaceGravityMs2: 1.31,
    rotationPeriodHours: 85.23,
    meanTempC: -160,
    approximateOrbitalPeriodYears: 0.00992,
    ageGyears: 4.5,
  },
  ganymede: {
    equatorialRadiusKm: 2634,
    densityGcm3: 1.94,
    surfaceGravityMs2: 1.43,
    rotationPeriodHours: 171.7,
    meanTempC: -160,
    approximateOrbitalPeriodYears: 0.0196,
    ageGyears: 4.5,
  },
  callisto: {
    equatorialRadiusKm: 2410,
    densityGcm3: 1.83,
    surfaceGravityMs2: 1.24,
    rotationPeriodHours: 400.54,
    meanTempC: -139,
    approximateOrbitalPeriodYears: 0.0459,
    ageGyears: 4.5,
  },
  titan: {
    equatorialRadiusKm: 2575,
    densityGcm3: 1.88,
    surfaceGravityMs2: 1.35,
    rotationPeriodHours: 382.7,
    meanTempC: -179,
    approximateOrbitalPeriodYears: 0.0436,
    ageGyears: 4.5,
  },
  enceladus: {
    equatorialRadiusKm: 252,
    densityGcm3: 1.61,
    surfaceGravityMs2: 0.11,
    rotationPeriodHours: 32.88,
    meanTempC: -200,
    approximateOrbitalPeriodYears: 0.00452,
    ageGyears: 4.5,
  },
};
