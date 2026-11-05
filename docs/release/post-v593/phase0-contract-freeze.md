# Post-v593 Stellar / Relativity Excellence — Phase 0 Contract Freeze

Generated during the read-only discovery phase of
`post-v593-stellar-relativity-excellence-candidate`.

## Baseline identity

The current v593 verifier was re-run before this document was written and
returned `passed-readonly-qualified-additive-v593-visual-candidate`.

| Field | Current value |
| --- | --- |
| Candidate status | `qualified-additive-v593-visual-candidate` |
| Formal product pointer | `v263` |
| Candidate route | `/local-shadow-v593` |
| Candidate manifest | `31c708473846a62951f6aaa4d6cba8c6c6d895ee70035b038baef203a4c67a8d` |
| Scientific payload | `784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674` |
| Production authorization | `false` |
| Scientific/measured/GPU authority | `false / false / false` |
| Visual signoff | `approved-6/6` |
| Lifecycle | `16/16 same-realm scene-exit` |

Source: `docs/release/v593/current-state-receipt-v593.json` and the command
`npm run verify:atlas:final-art-v593`.

## Stellar authority matrix

### Current data facts

- The v592 packet contains 24 named heroes.
- Exactly one record is `gaia-positional-crossmatch`.
- 23 records are `gaia-render-anchor-only-not-identity-claim`.
- The maximum anchor separation is `1.204722875476472` degrees.
- The packet explicitly keeps `scientificPayloadWriteback=false`.
- The packet's five current shader labels are presentation profiles, not
  observational surface classes.

Source: `public/data/living-universe-v592/stellar-heroes.json` and
`scripts/build-v592-stellar-hero-catalog.mjs`.

### Required next contract

Every named hero must carry field-level provenance for identity, coordinates
and epoch, distance, spectral type, temperature, gravity, radius, luminosity,
rotation/orientation, variability/activity, companions, uncertainty, source
version and license. A field without a defensible source must be marked
`estimated`, `derived`, `presentation-only`, or `unknown`; it must not be
silently upgraded to measured authority.

The first implementation target is the existing 24-hero roster. An expansion
roster is a separate admission step and cannot bypass the identity gate.

## Allowed stellar APIs and patterns

The implementation may extend, rather than replace, these existing contracts:

- `STELLAR_HEROES_V592`, `STELLAR_HERO_BY_ID_V592`,
  `resolveStellarRotationPhaseV592`, `stellarTemperatureSrgbV592`, and
  `validateStellarHeroesV592` in `app/lib/stellarHeroesV592.ts`.
- The `StellarHeroV592` props and absolute-clock/lifecycle pattern in
  `app/components/StellarHeroV592.tsx`.
- The generated-catalog and receipt pattern in
  `scripts/build-v592-stellar-hero-catalog.mjs`.
- The v593 material clone/patch/restore pattern in
  `app/components/SignatureArtDirectionBridgeV593.tsx`.
- The V7 portrait profile DTOs as a reference only; they must be adapted to
  the v592 absolute clock and log-depth contract before use in the Hero path.

Generated TypeScript must remain generated; hand-editing generated catalog
files is prohibited.

## Relativity authority matrix

| Lane | Allowed current meaning | Promotion boundary |
| --- | --- | --- |
| `legacy-eih-1pn` runtime | Formal default solar-system kernel | Must remain default until the current promotion contract passes |
| RelativityForceModelV2 | Read-only 2PN/Lense–Thirring shadow comparison | Do not wire into `physicsEngine` or `physics.worker` |
| Existing Kerr geodesic UI | Interactive/teaching diagnostics | Not a complete 3D Kerr authority until theta and invariant contracts are independently proven |
| Kerr Science payload | Sparse, immutable test-particle/thin-disk science display | Never call it GRMHD or dense-complete without its signed campaign evidence |
| Kerr Cinematic/GPU | Presentation or differential eligibility | `authoritative=false`; CPU/reference remains the authority |
| v587 observation sidecar | Local presentation/reference projection | `measuredAuthorityGranted=false`, `radiativeTransferGranted=false`, `gpuAuthorityGranted=false` |

Required reference evidence includes per-body and aggregate comparisons,
effect isolation, step/resolution convergence, reverse-time reproducibility,
analytic Schwarzschild/Kerr anchors, energy/Lz/Carter-Q/Hamiltonian checks,
and explicit failure evidence. Failed dense shards must not be partially
aggregated.

## Anti-patterns

- Do not call a Gaia render anchor the identity of a named star.
- Do not call a generated photosphere an observation texture or resolved surface.
- Do not use `Math.random()` for stellar twinkle or evidence values.
- Do not replace remote point-like PSF with a close-up sphere.
- Do not hand-edit generated catalog output.
- Do not connect V2 shadow force deltas to live or Worker physics before
  promotion gates pass.
- Do not use a historical promotion helper to bypass the current promotion
  decision contract.
- Do not call cinematic RGBA, WebGPU fallback, or v587 projection measured,
  radiative-transfer, GPU-authoritative, or GRMHD.
- Do not advertise the current simplified Kerr track as a full 3D solver;
  hard-coded zero drift is not evidence.
- Do not replace the formal main app with `/local-shadow-v593`.

## Phase 0 exit gate

Phase 0 is complete when this document, the current identity receipts, and the
allowed API/anti-pattern lists are available to the implementation phases.
No source, scientific payload, formal product pointer, or production
authorization is changed by this phase.

## Known gaps

- External catalog/DOI verification has not yet been performed for all 24
  named stars.
- Only four stars are selectable in the v593 signature shell.
- The existing v593 human dossier does not constitute 24-target stellar
  signoff.
- The current Kerr and V2 evidence remains insufficient for scientific
  promotion.
- Real-device and production matrices remain outside the v593 closure.
