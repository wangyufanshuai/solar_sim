# Case12 exact energy and lower-order growth: bounded run result

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent, run mode.
- Origin Date: 2026-10-13 (Asia/Shanghai).
- Verification Status: ANALYZED. The authorized local batch passed, including
  its preregistered same-batch exact replay and post-run byte-integrity checks.
  Fresh-environment and independent external reproduction remain unverified.
- Version Label: case12_lower_energy_result_v1.
- AI-assisted implementation and interpretation; no external referee signoff.

## Result and scope

The ONE newly authorized case12 energy/lower-order batch completed successfully.
`case12_lower_energy_checked=true`. The terminal and worker both report
`passed=true`, `completed=true`, no errors, no retries and zero integration
steps. This is a local algebraic qualification of one frozen background and
one propagation ray, not qualification of the full Einstein solver.

`physical_gate`, `live_admission`, `scientificPayloadWriteback`,
`uniform_strong_hyperbolicity_validated`, `physical_boundary_validated`,
`constraint_convergence_validated`, `constraint_damping_proved`,
`unweighted_l2_wellposedness_proved`, `general_profile_qualified` and
`independent_external_review` remain false. The world-class NR goal is incomplete.

## Authority and execution

- Approval: question `call_914c06f42c9f45608d054f86527690da`, answer
  “同意，独立实现完成后按原预算验证（推荐）”.
- Preregistration: `EXPERIMENT-20261013-case12-lower-energy.md`, including the
  appended affirmative authorization and the previously documented26 controls.
- Working directory: `E:/86137/myai/solar_sim/next-web`.
- Command: `D:/python/python.exe -B scripts/run-nr-k3-case12-lower-energy.py --output-directory tmp/nr-shadow-evidence/nr-k3-case12-lower-energy-controls-v1-20261013`.
- Run ID: `d56bdd4f-8b4f-4740-bbb7-2575b7ad9393`.
- Terminal saved: 2026-10-13 19:32:40 +08:00.
- Supervisor elapsed:201.141 s; worker elapsed:184.859 s; exit code0.
- Python3.12.3, NumPy2.2.6, single-thread; Windows owned Job Object assigned.
- Cleanup verified; no matching Python process remained in the post-run check.

The previous full-symbol batch was not rerun. The registered replay below was
part of this one execution, not an automatic retry or a separate unbudgeted
experiment. No native C++ call, full66-background matrix, physical-time
evolution, AMR, GPU, frontend/art change, installation, cleanup or publication
was performed.

## Observed checks

| Check | Recorded outcome |
|---|---|
| Unit controls |26/26 passed,0 errors/failures/skips; pytest0.92 s |
| Exact identity relations in first construction |90 relations, all rational residual entries zero |
| Exact identity relations in registered replay |88 relations, all rational residual entries zero |
| Rational spectral ranks |ODE11, zero-speed12, paired branches8,4,8,0,0,0 |
| Positive energy certificate |Exact weighted-Gram identity; Hhat >= G/14 >= I/84 |
| Original normalized energy floor |Pullback retains I/14; no threshold relaxation |
| Zero-frequency physical image |Rank39, not43; full43 inverse flag false |
| Array-component comparisons |66/66 within the unchanged2e-12 relative threshold |
| Largest comparison residual |2.73129372010339e-13, saved paired projector `pair-1` |
| Saved energy residual |9.422981462901507e-14 |
| Decimal50/70 comparisons |Rounded binary64 results agreed for all registered comparisons |
| Comparator perturbations |38/38 rejected |
| End-to-end exact perturbations |3/3 rejected with nonzero witnesses |
| Same-batch replay |Complete Laurent maps, energy matrices, paired projectors and rational bounds matched exactly |

The66 comparisons are real/imaginary array-component comparisons in **case12
only**. They are not the paused66-background matrix. Registered frequencies
were0,1/8,1/4,1/2,1,2,4,8. No Laurent inverse was evaluated at zero or at the
two low-frequency sample points. The10 saved v3 energy/projector/principal
comparisons used original stored binary64 inputs, not substituted rational
design values. The local construction shares the separately audited58-variable
equation source; this is not an independent external NR-code comparison.

Exact-check records also contain the actual transformed matrices. Their
nonzero entries are not residual failures. The90 and88 counts above exclude
the `transformed-rows` and `transformed-symbol` matrix records and include only
identity residuals. Expected negative-control failures are reported separately.

### Complete reduction, without dropping lower terms

The persisted transformed subsidiary symbol retains powers-2 through6. Its
only nonzero coefficient powers are-1,0,1, containing18,764,596 nonzero entries
respectively. Power-2 and powers2 through6 vanish exactly. The inverse-frequency
term is genuinely nonzero and was included in the bound; it was not discarded.
Both transform inverse directions, the leading physical map, principal
quotient and full polynomial intertwining passed exact checks.

The end-to-end perturbations each added exactly1/1,000,000 at entry[4,4] of a
copy, leaving all original inputs untouched:

- Modified B0: polynomial intertwining rejected;1 nonzero residual entry.
- Modified intrinsic principal matrix: newly constructed projectors rejected
  at `projector-1-1`;132 nonzero residual entries.
- Modified energy: symmetrization rejected;8 nonzero residual entries.

These are validator-sensitivity controls, not physical perturbation evolutions.

## Growth bounds and scientific interpretation

The exact rational values are in the run's `growth-bounds.json`. Rounded values
below only format those saved scalars; no new numerical replay was launched.

| Domain, fixed case12 and n=(1,2,-1)/sqrt(6) | Energy growth upper bound |
|---|---|
|0 <= rho <1/2, physical-variable Euclidean energy |Gamma_low approximately86.9143260435 |
|rho >=1/2, transformed frequency-weighted energy |Gamma_high approximately4,869,598.13426 |
|rho=0, reachable39-dimensional physical image |Gamma_zero=16.595626048 |

The all-frequency fixed-ray statement follows from the exact principal
symmetrization/coercivity identities and the stated analytic entry-norm bounds,
not interpolation between sampled frequencies. The cutoff1/2 was preregistered.
The high-frequency bound includes the inverse-frequency coefficient and uses
the proved energy floor1/84. The low-frequency construction avoids a singular
change of coordinates at zero.

These are **positive, very conservative upper bounds**, especially at high
frequency. They do not establish decay, an accurate physical growth rate, a
useful timestep limit, a sharp long-time estimate, or a numerical performance
advantage. The result concerns its explicitly frequency-weighted norm. Uniform
equivalence to unweighted L2, a direction-uniform theorem, variable-background
or nonlinear stability, a boundary estimate and discretization stability remain
unproved. The zero-frequency rank must not be inflated to43.

This closes the local fixed-ray energy/lower-order subgate. It does not close
the goal's general-background A gate or full constraint/boundary B gate, much
less convergence, long black-hole evolution, AMR, waveform or GPU gates.

## Reproducibility and immutable evidence

Evidence directory:
`tmp/nr-shadow-evidence/nr-k3-case12-lower-energy-controls-v1-20261013`.

-551 snapshotted source files,4,857,759 bytes, within8 MiB.
-15 input files admitted from one immutable read each, hashed before parsing.
-4,117 prior files in seven evidence directories unchanged across the batch.
-1,035 final batch files totaling18,931,009 bytes (approximately18.054 MiB),
  including both preallocated terminal slots, within64 MiB total output.
-2 MiB terminal headroom preserved;600 s hard wall-time limit unchanged.
-Post-run read-only rehash matched all1,034 artifact entries, with no missing or
  extra files. The terminal file was accounted for separately.
-Post-run terminal self-digest checked directly from the saved canonical bytes;
  the stored digest matched. These were byte/receipt checks, not numerical tests.

| Artifact identity | SHA-256 |
|---|---|
|Terminal file, including reserved padding |`668ff3638c47d34f5331cbba3aeeb3c207d890236d9e189f0a792fb6c0fa886d` |
|Terminal canonical-body self-digest |`9beb719312fe72f2e3525de84b421b24e3a047b943aea4c38be56832b51e381b` |
|Worker result |`01e6642c5f21c91b09880f172615f90c08bfb536d3dfe8bb99b2f2dd699c0bf4` |
|Growth bounds |`1351fb809d60eb506f6e649ee88f989499ab4cf3d5b67351e0c645be9ed4e789` |
|Exact-check index |`6cc9c0ff8745e455df766a859feb5e4dc015f622b681e81c42a70e0e76390794` |
|Frozen preregistration with approval |`239c196c0721483cb74f486e18de916311d8ba4a7b00e46ae68d3a73920a8fff` |

This post-run report is additive and outside the frozen551-file source closure;
it does not rewrite the accepted derivation, preregistration or any old receipt.

## Post-completion disk alert and next gate

Startup read-only preflight measured C:14,981,873,664 bytes (13.953 GiB) and
E:11,372,093,440 bytes (10.591 GiB), above the existing floors plus prospective
64 MiB output. One intermediate observation measured E at11,341,553,664 bytes
(about10.56 GiB). The supervisor completed with no resource error and saved a
passing terminal; this does not establish that free space stayed above10 GiB
throughout the run.

After that terminal had been saved, a post-run observation measured E at
1,022,279,680 bytes (0.952 GiB). Separate Windows disk APIs then agreed on
885,755,904 bytes (0.825 GiB). At19:36:54 +08:00, E was967,389,184 bytes
(0.901 GiB), still below4 GiB+32 MiB. C remained above3 GiB.

The approximately18 MiB batch output does not explain this whole-volume drop.
Its cause and exact onset were not established. No unrelated directory or
process was investigated, no files were cleaned, and no new computation was
started after the alert. Current low capacity blocks further execution; it
does not retroactively replace this already saved batch result. Passing
resource checks are not a continuous historical free-space telemetry record.

Before another64 MiB batch, the user must restore and confirm free space;
fresh preflight must require C>=3 GiB and E>=4 GiB+32 MiB+64 MiB (4.09375 GiB).
The completed one-shot permission must not be reused. New execution requires
a separately bounded, explicitly authorized plan.

The next scientific dependency is direction-uniform/domain-qualified energy
control at the fixed case12 background, including characteristic degeneracies
and norm equivalence, followed by constraint-compatible boundary estimates.
It should begin with a derivation and source audit, not another arbitrary
single-ray success count. General-background, full66, nonlinear evolution and
GPU campaigns remain separately gated. Do not tune thresholds or hide failed
evidence to obtain a passing result.
