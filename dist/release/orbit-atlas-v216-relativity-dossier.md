# Orbit Atlas v216 reproducible relativity research dossier

Status: **relativity-v10-research-candidate-shadow-retained**

This is a reproducible research package, not a scientific promotion and not GA. The default runtime kernel remains `legacy-eih-1pn`.

## Weak-field result

- The dual-source ICRF/J2000 TDB bundle contains 68 epochs: 34 DE440/NAIF and 34 frozen Horizons epochs.
- Original-response hashes and converted-state hashes are stored separately.
- Two complete STM reruns match canonical SHA-256 `bc988a8800498ae1bb6e9223d6eb5213617a38dcd2f7bf6c8f1f531585f9a87e`.
- The fit contains a 66-parameter covariance diagonal and a 30-day regularized grouped-PRESS diagnostic.
- Legacy 365-day position RMS changes from 660.960 km raw to 664.906 km fitted.
- Legacy ten-year position RMS changes from 679.483 km raw to 714.040 km fitted.
- The blind holdout is therefore a reproducible negative result; raw propagation is not replaced.
- The 36525-day program is explicitly diagnostic-only and is excluded from qualification.

## Strong-field result

- Two Kerr-Schild reruns match canonical SHA-256 `bc857ceb990c45b4a45b858c052bf02aa2f4039380ca085acf00260197ed626b`.
- Carter/Mino and Kerr-Schild captured/not-captured classification agrees for 100.0% of 25 rays.
- The invariant gate remains failed: Kerr-Schild `5.900782e-10`, Carter `7.648807e-10`.
- Redshift and Walker-Penrose polarization cross-validation remain incomplete.

## Blockers

- The nonlinear STM calibration is deterministic, but the 365-day and ten-year blind holdouts are worse than raw propagation.
- Kerr-Schild maximum normalized null drift is 5.900782e-10, above the 1e-10 reference gate.
- The Carter cross-grid maximum null diagnostic is 7.648807e-10, above the 1e-10 reference gate.
- Kerr redshift and Walker-Penrose polarization have not yet been independently cross-validated.
- Cold Canvas-ready JavaScript has only 396 B standalone and 395 B Lite margin below the 624640 B gate.
- The 100-year program is diagnostic-only and cannot be used as a promotion gate.
- External clean-Windows MSI/NSIS installation, uninstall and reinstall evidence remains pending.

## Boundary

The strong-field work is test-particle Kerr geometry with an analytic teaching thin disk. It is not numerical relativity, a merger simulation or GRMHD. No runtime physics, Worker protocol or frozen scientific gate was changed.
