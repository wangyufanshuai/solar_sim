# S4 — solar-system integrator vs JPL Horizons (2026-11-05)

Script: `scripts/s4-horizons-error.mts` (`npx tsx scripts/s4-horizons-error.mts`).
Data: `docs/s4/horizons-error-20261105.json`, `docs/s4/horizons-error-sun-gm-iau-20261105.json`.
Reference: `public/data/horizons-validation-j2000.json` — JPL Horizons, heliocentric, ecliptic
J2000, geometric, at J2000, +30 d, +365 d and +10 y. Integrator: `SolarSystemPhysics`
(adaptive DP5(4)), full default body set (101 bodies), from the app's J2000 ephemeris.

## Mercury perihelion: passes

12 bodies (Sun, planets, Moon, Pluto, Ceres), 100 Julian years, daily osculating elements.

| Run | Longitude-of-perihelion rate |
| --- | ---: |
| Newton | 470.47″ / century |
| EIH 1PN | 513.45″ / century |
| **EIH − Newton** | **42.981″ / century** |
| GR prediction 6πGM/(c²a(1−e²)) per orbit | 42.985″ / century |

Relative difference −1.0e-4 (gate: ≤ 2 %). Open question, not investigated: the Newtonian
rate 470″/cy is below the commonly quoted ≈ 532″/cy planetary contribution.

## Positions: large error, dominated by the Sun's GM

Error |r_sim − r_Horizons| in km (Newton; EIH differs by < 0.5 %):

| Body | +30 d | +365 d | +10 y | +10 y with IAU GM☉ |
| --- | ---: | ---: | ---: | ---: |
| Mercury | 3,990 | 56,135 | 837,902 | 562 |
| Venus | 1,258 | 72,129 | 662,838 | 262 |
| Earth | 725 | 58,373 | 591,223 | 8,810 |
| Moon | 9,865 | 173,574 | 1,023,685 | — |
| Mars | 313 | 53,389 | 477,985 | 228 |
| Jupiter | 16 | 3,745 | 321,109 | 369 |
| Saturn | 9 | 1,090 | 140,271 | 262 |
| Uranus | 26 | 437 | 25,080 | — |
| Neptune | 8 | 183 | 10,471 | 565 |

The app computes the Sun's gravitational parameter as `G_SI × 1.98847e30 kg`
= 1.327153e20 m³ s⁻², 2.2e-5 above the IAU 2015 nominal GM☉ = 1.3271244e20 m³ s⁻²
(the quantity that is known precisely; G and the mass separately are known to ~1e-5).
With the initial velocities fixed, that shifts every mean motion by about 2 × 2.2e-5,
which predicts ~4e5 km (Earth) and ~7e5 km (Mercury) after 10 years — the size observed.
Re-running only with `mass[0] = GM☉ / G_SI` (`SUN_GM=iau`, diagnostic, app unchanged)
reduces the 10-year errors to 228–565 km for Mercury, Venus, Mars and the giant planets.
Earth keeps 8,810 km, presumably from the Earth/Moon masses or the Earth–Moon split.

## Conclusion

The EIH 1PN term is correct (Mercury advance to 1e-4). The position accuracy users see is
limited by the gravitational constants, not by the integrator or the relativity model:
switching body masses to GM-derived values would cut the 10-year error by about three orders
of magnitude for most planets. That change has not been made to the app.
