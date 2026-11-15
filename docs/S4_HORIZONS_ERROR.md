# S4 — solar-system integrator vs JPL Horizons (2026-11-05)

This opening section is the historical pre-adoption result. The default solar
parameter was corrected on 2026-11-13; see the new run below. Historical JSON
and the earlier diagnostic have not been overwritten.

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

## Default solar GM adopted and recomputed (2026-11-13)

Roadmap S4 acceptance: report reference errors in the app's physical panel with
the actual reference source. The user authorized changing the default solar
parameter. `physicalConstants.ts` now defines the IAU 2015 B3 nominal value
GM☉ = 1.3271244e20 m³/s², and the default body catalogue uses GM☉ / G_SI
as its equivalent solar mass. The original NASA mass table and all other body
masses remain unchanged. This changes both main-thread and worker dynamics
through their shared body catalogue, including resets; it changes orbit positions.
Source: [IAU 2015 B3](https://iauarchive.eso.org/static/resolutions/IAU2015_English.pdf).
The nominal parameter is a defined conversion constant, not the exact GM fitted
in a JPL ephemeris.

New result: `app/data/s4Horizons.generated.json`. The actual 101-body DP5(4)
integrator was rerun in Newton and EIH 1PN modes at J2000, +30 d, +365 d and
+10 y, using the unchanged `public/data/horizons-validation-j2000.json` vectors.
Both modes used the default mass, without replacing it inside the experiment.
The initial frame is heliocentric geometric ecliptic J2000; errors are norms
of heliocentric position differences in km. This is a fixed-checkpoint
comparison, not a maximum-error bound over the interval or a prediction of
the user's arbitrary live trajectory.

| Body | Old Newton +10 y (km) | New Newton +10 y (km) | New EIH +10 y (km) |
| --- | ---: | ---: | ---: |
| Mercury | 837,902 | 562 | 2,385 |
| Venus | 662,838 | 262 | 638 |
| Earth | 591,223 | 8,810 | 8,934 |
| Moon | 1,023,685 | 721,152 | 721,021 |
| Mars | 477,985 | 228 | 115 |
| Jupiter | 321,109 | 369 | 321 |
| Saturn | 140,271 | 262 | 255 |
| Uranus | 25,080 | 2,978 | 2,977 |
| Neptune | 10,471 | 565 | 565 |
| Pluto | 336,624 | 331,371 | 331,471 |
| Ceres | 367,923 | 125 | 29 |

The remaining Earth/Moon, Uranus and Pluto errors are explicitly retained.
Mercury's EIH position error is greater than its Newton error at this checkpoint;
the old approximately 500 km diagnostic must not be generalized to every body
or to the EIH mode. The 100-year perihelion experiment was not rerun; `/lab`
labels its retained perihelion value as the old-parameter run.

Runtime observations: Newton 70.0 s, EIH 268.2 s; supervision total 338.5 s,
peak process RSS 86,466,560 bytes. The run completed with exit 0 without a
resource abort under 600 s, a 768 MiB process cap, 1 GiB available RAM reserve,
3 GiB system disk reserve and a 64 MiB output cap. These observations are for
this S4 run, not the NR campaign or a future simulation performance guarantee.

The shared `SolarSystemReferenceErrors` component is shown in body observation,
orbit analysis and `/lab`. It displays both modes, units, the checkpoint and
frame, run date, remaining residuals and links to JPL and the raw reference.
It never fetches or recomputes a new ephemeris when a user opens a panel.

Verification: 33 tests passed (solar GM/reset/record/UI controls, existing
physics runtime/metrics, numerical integrity, orbital elements and Kerr analytic tests); the changed dependency
closure passes TypeScript checking. The unchanged Kerr validator was rerun
at 128×128 on the RTX 4060: three configurations have 100% classification
agreement, the extreme-spin case 99.9756%, matching the existing record.
Its one exhausted GPU ray remains visible; this is not a claim of exact
agreement. New raw Kerr comparison: `docs/s4/kerr-reference-check.json`.

UI screenshots: `docs/screenshots/s4-reference/`, desktop 1280×900 and phone
390×844. These are an isolated server-rendered preview of the actual
`BodyDetailSidebar`, fixed to Earth at J2000, with the real global stylesheet.
They do not show a full Three.js scene, hydrated interactions, a production
build, or a deployed change. Reproduce the panel preview with
`node scripts/s4-panel-preview.cjs`, then visit port 3002 `/before` or `/after`.

To recompute a fresh numerical result in PowerShell:

```powershell
$env:S4_PART2 = '0'
$env:S4_OUTPUT = 'output/s4/new-default-run.json' # Must not already exist.
node --max-old-space-size=384 --import tsx scripts/s4-horizons-error.mts
```

`SUN_GM=legacy` explicitly restores the old rounded mass for a separate
comparison; unset it to run the current application parameter. Do not
overwrite `app/data/s4Horizons.generated.json` without reviewing a new run.

The registered Earth–Moon comparison is saved in
`docs/s4/moon-comparison-20261113.json`. The 1 km softening case reduced the
10-year lunar geocentric error to 42.5 km, but increased Mercury's error from
562 km to 1,814 km; it is rejected. DE440 Earth/Moon GM alone left the lunar
geocentric error at 729,929 km, essentially unchanged. A separately registered
follow-up completed the combined DE440 + 1 km case: lunar geocentric error was
155.7 km and Mercury remained at 1,814 km. It therefore does not satisfy the
no-other-body-worsening criterion, and no new default was adopted. All four
cases used the observed `dp`, then `rk4-fallback`, `rk4-fallback` mode sequence.

## Earth–Moon diagnosis registration (2026-11-13, before these comparisons)

An additional plausible cause was found by reading the force law: the default
Plummer length is 1e-4 AU = 14,959.8 km. At the mean lunar distance this reduces
the Newtonian Earth–Moon force by approximately 0.227%. The old default-GM run
has Earth error about Moon error / 81, consistent with a lunar relative-phase
error rather than a comparable Earth–Moon barycenter error. These are hypotheses,
not measured causal results yet. JPL's DE440 parameters are Earth GM =
398600.435507 and Moon GM = 4902.800118 km³/s²
([JPL table](https://ssd.jpl.nasa.gov/astro_par.html)). They are central-body
parameters, not an Earth–Moon-barycenter mass assigned to Earth.

Compare the full 101-body Newton calculation in four registered combinations:
catalogue/DE440 Earth–Moon GM crossed with old/1 km Plummer length. Keep the
initial state, solar GM, derivative/time algorithm and Horizons vectors fixed.
The 1 km length makes softening negligible at lunar distances; it is not fitted
to a desired final phase. Report all four checkpoints, integration modes,
heliocentric errors, lunar geocentric error and Earth–Moon barycenter error
using identical DE440 weights for both simulated and reference positions.

Adoption criterion: finite results; geocentric lunar error improves at each
nonzero checkpoint; Earth and Moon heliocentric ten-year errors improve; no
other sampled body's checkpoint error worsens by more than max(10%, 1 km)
against the old-softening baseline. If no candidate satisfies this criterion,
retain the current default and the failed comparison. Only an eligible candidate
will receive an additional full EIH check; the same criteria must hold against
the earlier default-GM EIH record before changing the default. Existing outputs
are never overwritten. This is an exploratory causal comparison registered after
the 2026-11-13 solar-GM result; it is not an independent blind validation.

### Registered follow-up: Earth–Moon pair softening

Reduce the Plummer length to 1 km in both directions of the Earth–Moon
interaction only. Keep the catalogue GM values and the original Plummer
length for every other pair. This tests whether localizing the force change
preserves the lunar improvement while avoiding the errors caused by the
global candidate. Use the same initial state, Horizons checkpoints, step
scheduling, and adoption criteria as the four-case comparison. Check Newton
first. If eligible, also run EIH with the pair-specific length in the direct
force and in the Newtonian accelerations and potentials used by the EIH term.
Keep the result as an experiment until both modes satisfy the original gate.

### Pair comparison result

Both Newton and EIH passed the registered gate. The full records, step modes,
independent gate arithmetic, resource receipts and earlier stopped attempts are
in `docs/s4/earth-moon-pair.json`. The correction is delivered through the
explicit `earthMoonSofteningMeters` option and the command below.

| Mode | Earth +10 y heliocentric error (km) | Moon +10 y heliocentric error (km) | Moon +10 y geocentric error (km) |
| --- | ---: | ---: | ---: |
| Newton | 312.240 | 339.604 | 42.602 |
| EIH | 296.728 | 315.302 | 40.921 |

Every nonzero lunar checkpoint improves. For each checkpoint, the candidate
geocentric error is smaller than `abs(old Moon error - old Earth error)`.
The reverse triangle inequality makes that quantity a lower bound on the
original geocentric error, so this proves improvement even though the original
EIH record did not save its geocentric error directly. All 27 other-body
nonzero checkpoints per mode meet the original max(10%, 1 km) tolerance.
Both modes observed `dp / rk4-fallback / rk4-fallback`.

Newton completed in 96.7 s with 101.8 MiB peak observed RSS. EIH completed in
341.8 s with 92.8 MiB peak observed RSS. Each produced under 8 KiB of output.
The 600 s and 64 MiB limits were retained. After two EIH attempts stopped on
available RAM, the final operational reserve was 256 MiB, with a tighter
256 MiB process RSS cap. The stopped attempts remain in the record.
This changed the execution envelope, with the numerical inputs and gates held fixed.

```powershell
$env:S4_EARTH_MOON_SOFTENING_M = '1000'
$env:S4_PART2 = '0'
$env:S4_MODES = 'newton,eih'
$env:S4_OUTPUT = 'output/s4/pair-new.json'
node --max-old-space-size=384 --import tsx scripts/s4-horizons-error.mts
```

Use a fresh output path and clear `SUN_GM`, `S4_SOFTENING_M` and
`S4_EARTH_MOON_GM` when reproducing this comparison. Run modes separately
if applying the 600 s envelope per process. The pair model is a Plummer
regularization approximation. Its validation covers these fixed checkpoints
and 11 reference bodies from the 101 evolved bodies. Application defaults
continue to use the adopted solar GM and the original uniform softening.
The live panel therefore continues displaying the solar-GM-only record.

### Integration verification

The real Next development routes `/` and `/lab` returned HTTP 200 with COOP
and COEP. Headless Chrome observed the actual shared-buffer physics worker
initialize and finish a step with solar GM = 1.3271244e20 m³/s². Selecting
Earth through search and opening orbit analysis displayed the same 8,810 /
8,934 km recorded values as `/lab`. The raw observation is
`docs/s4/browser-integration.json`. The browser run recorded zero page errors.
The layer button was covered by the existing Beta intake overlay at this
viewport, so the check used keyboard activation to open the analysis menu.

The detector API parser split passes a browser-target bundle check and
self-contained compatibility tests. Three older fixture-based tests could
not run because their local `dist/science` fixture files are absent. A full
production build has no successful receipt in this worktree. This local
integration check used `ATLAS_VISUAL_QA_ONLY=1`; production packaging and
the unavailable content-pack/texture services still need release verification.

Final scoped verification passed 52 tests across the physical model,
main-frame and actual worker wiring, saved reference gates, API parsing,
runtime and Kerr reference checks. The changed dependency closure also
passed TypeScript. The main-scene panel capture is
`docs/screenshots/s4-reference/main-scene-panel.png`. The S3 before/after
captures under `docs/screenshots/s3-gauge-wave/` use 1280×900 and 390×844
viewports, each scrolled to the same S2-c section boundary. The source
before S3 is commit `c7169adf`; the after source includes the B1 export.
