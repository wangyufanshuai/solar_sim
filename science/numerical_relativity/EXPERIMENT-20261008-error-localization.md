# Retained Schwarzschild error localization v1

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: declared post-hoc analysis of immutable retained checkpoints
- Origin Date: 2026-10-08
- Verification Status: UNVERIFIED (analysis design fixed before execution)
- Version Label: nr-schwarzschild-error-localization-v1

## Question and exclusions

The upper-only experiment is complete and failed its H/Ricci spatial gates.
Its retained receipt SHA256 is
`ac35d3e159b9c0ad603f7bde4068171f2a396a4a690799b5c0ccc42462e33da7`,
with audit SHA256
`37cf4c470b614fbfa226999eaefa62b0162fa7fcc7b1c28de0c18ef2ad7813ff`.

Localize the signed initial/evolution diagnostic cancellation across the SAME
125 core points, three spacings, three retained domains, and four retained
times. No evolution, equation, gauge, dissipation, boundary or diagnostic
operator change. This is post-hoc hypothesis refinement, NOT a new physical
acceptance gate or a reason to rescore any predecessor failure.

## Fixed inventory

- Domains: original [1,3]^3, upper-only [1,3.5]^3, both-expanded [.5,3.5]^3.
- Matching point counts: (17,21,25), (25,31,37), (33,41,49).
- Spacings: 1/8, 1/12, 1/16; FD4, dt=1/256, same native 0.5.0 identity.
- Times: 0, .125, .25, .5, 1; exactly 45 distinct retained checkpoints.
- Metrics: Hamiltonian H and coordinate-component Ricci error.
- Reconstruct using the frozen metric-based audit, not evolved auxiliaries.
- No interpolation or newly selected points. All 125 nodes remain in every
  whole-core statistic; each axis has the same five coordinate planes.

For each node x, define d_low=min(x)-1 and d_high=3-max(x), relative to the
ORIGINAL cube. Disjoint regions are d_low<d_high (44 nodes), equality (37),
and d_low>d_high (44). These labels do not change with the expanded domain;
they are geometric location labels, not proven causal domains of dependence.

## Analysis and checks

1. Record total squared norm, initial squared norm, evolution-change squared
   norm and signed cross term in each region and all 15 coordinate planes.
2. Check the additive squared-norm identity and weighted regional recovery
   of the whole-core quantities. Independently recompute reductions with
   scalar math.fsum from the original components (not from regional totals).
3. Record where negative cross terms reduce the total diagnostic norm.
   Squared diagnostic norm shares are NOT physical energy or boundary flux.
4. Compare signed fields upper-minus-original and both-minus-upper on the
   same nodes/times/spacings; do not subtract RMS norms.
5. Require 72 domain/time/metric profiles and 48 pair/time/metric profiles,
   as well as all 45 checkpoint identities, without selective omissions.
6. Verify all shared initial H/Ricci fields are identical; preserve old
   acceptance decisions, source/binary hashes and all false admission flags.

Numerical reduction tolerance is 128 binary64 eps times the local squared-
norm scale; this is an arithmetic check, not a scientific tolerance. Zero
evolution changes have undefined angle/share, represented by null, not a
fabricated measured zero. Nonfinite values, complex fields, wrong coverage,
hash drift, source drift and norm overflow fail closed.

Spatial concentration or time variation may guide the next experiment but
does not prove reflection, characteristic speed or a unique causal mechanism.
Even concentration near the original lower faces is confounded with stronger
background curvature. No frontier, black-hole or waveform claim is made.

## Resource and output contract

Entry: `D:\python\python.exe -B scripts/analyze-nr-k3-schwarzschild-error-localization.py`
with a fresh `--output-directory` below the workspace `tmp/nr-shadow-evidence`.
Windows/Python/NumPy already installed; no dependencies installed.

Budget: 240 seconds for the analysis, 16 MiB output including source snapshots;
check before each checkpoint. Preserve C>=3 GiB and E>=4 GiB+32 MiB plus
16 MiB output headroom. No native simulation or full checkpoint copying.
New files only on E; old evidence remains in place. No silent retry after an
execution failure. Poll the same process handle and report progress within 60s.

Outputs: analysis.json with complete or partial coverage/errors, retained
input hashes, before/after source identity, profile arrays, reduction checks,
elapsed time and eight false admission flags. Snapshot analysis source and
protocol before execution. Unit tests use synthetic data and are separate
from the retained physical-checkpoint analysis.
