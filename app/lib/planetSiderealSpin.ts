import { BODY_DISPLAY_FACTS } from "../data/bodyDisplayFacts";

/**
 * Radians advanced per **simulated day** for a rigid body with given sidereal period (hours).
 */
export function siderealSpinRadPerSimDay(
  rotationPeriodHours: number,
  retrograde = false,
): number {
  if (!Number.isFinite(rotationPeriodHours) || rotationPeriodHours <= 0) {
    return 0;
  }
  const periodDays = rotationPeriodHours / 24;
  const rad = (2 * Math.PI) / periodDays;
  return retrograde ? -rad : rad;
}

/** `null` when the body has no display facts (no spin). Venus uses retrograde. */
export function siderealSpinRadPerSimDayForBodyId(id: string): number | null {
  const facts = BODY_DISPLAY_FACTS[id];
  if (!facts) return null;
  const retrograde = id === "venus";
  return siderealSpinRadPerSimDay(facts.rotationPeriodHours, retrograde);
}
