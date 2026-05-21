/**
 * SI constants for N-body integrator.
 * G: CODATA 2018 recommended value (NIST / PDG scale), m^3 kg^-1 s^-2.
 * c: exact definition (SI), m/s.
 * AU: IAU 2012 nominal astronomical unit, m.
 */
export const G_SI = 6.6743e-11;
export const C_LIGHT = 299792458;
export const AU_METERS = 1.495978707e11;
export const DAY_SECONDS = 86400;

/** c in AU/day — useful for AU/day ↔ SI checks and docs (~173.144…). */
export const C_AU_PER_DAY = (C_LIGHT * DAY_SECONDS) / AU_METERS;
