# Post-hoc separation of initial metric-constraint error

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: explicitly post-hoc saved-state analysis
- Origin Date: 2026-10-09
- Verification Status: EXPLORATORY; DOES NOT CHANGE ACCEPTANCE
- Version Label: nr-refinement-initial-error-v1

This analysis was selected AFTER the preliminary independent spatial
reconstruction showed H orders about 1.40 and 1.45, below the frozen 1.5
threshold. Do not describe it as a pre-registered primary outcome. The six
original cases and all acceptance criteria continue unchanged.

After the full campaign and independent audit, reconstruct initial/final
metric H and M from the saved static N9/13/17 arrays. At every node write
final = initial + change and compute the signed SBP-weighted inner product.
Report initial/final/change RMS and verify

    ||final||^2 = ||initial||^2 + ||change||^2 + 2<initial,change>.

Use component-averaged norms, as in the frozen experiment. Also report
change RMS / initial RMS and the initial-error grid orders. Similar norms
alone do not prove similar fields; the signed difference is necessary.
This may identify initial diagnostic truncation as a dominant contribution,
but it does not prove a unique cause, validate a boundary, or repair either
the current H failure or the older fixed-halo T=1M failure.

No new evolution, retuned coefficients, clipped data, reconstructed auxiliary
fields, or altered norm/region is allowed. Bind the complete campaign and its
independent audit by hash. Retain source hashes and all admission flags false.
Fresh workspace E JSON only, original C/E reserves unchanged.
