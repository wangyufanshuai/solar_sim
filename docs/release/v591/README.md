# Orbit Atlas v591 governance

v591 is an additive 3A celestial-convergence candidate at
`/local-shadow-v591`. It owns a single-Canvas composition, consumes the sealed
v590 sky/body/orbit layers read-only, and adds no scientific authority.

P0 rules:

- v263, Legacy V9, `legacy-eih-1pn`, v559/v560 historical evidence and all
  v562-v590 sealed identities remain byte-frozen.
- `package.json`, `proxy.ts`, `app/lib/atlasProxyContractV562.ts` and
  `scripts/build-atlas-profile.mjs` are inherited from v590 and are not edited.
- v591 commands run directly with `node` or `npx`; package aliases are not a
  prerequisite for qualification.
- P1 currently admits six v591-owned Hero overrides: Sun, Earth, Moon, Mars,
  Jupiter, and Saturn.
  Sun uses NASA SDO/HMI and SDO/AIA 304 inputs; Earth reuses the exact-byte
  sealed v590 NASA/GSFC/GEBCO channels through a v591 overlay; Moon uses NASA
  SVS/LROC and LRO/LOLA products; Jupiter uses the NASA/JPL Cassini PIA07782
  global map plus deterministic source-derived band and Great Red Spot masks;
  Saturn uses Cassini PIA06193/PIA21617/PIA21628 for the global latitude
  profile, north-polar detail and radial optical-depth rings. Mars uses the
  public-domain USGS Viking 1024x512 color product as an explicitly bounded
  albedo source and NASA PDS MOLA for 4K normal, height and roughness. Its 8K
  albedo file is only a mipmapped delivery container, never a claim of native
  8K observation detail. The old v588 high-frequency residual experiment is
  rejected because its historical v49 product/license identity is incomplete.
- The Moon, Jupiter, and Saturn browser slices are self-sealed and bound into the
  candidate evidence chain. They cover ordered desktop Science/Cinematic, mobile
  Cinematic/Science, desktop-return replay, subject visibility, KTX2-first
  channel admission, payload immutability, performance, screenshots, and
  candidate-owned resource release.
- Science/Cinematic presentation cannot mutate the fixed scientific payload.
- No Git, deployment, dense/GPU science, measured payload acquisition or
  production promotion is authorized.

Current P0/P1 six-Hero commands:

```text
node scripts/build-v591-celestial-convergence-candidate.mjs
npx vitest run app/lib/celestialConvergenceV591.test.ts app/lib/useV591Texture.test.ts app/components/OrbitAtlasCelestialConvergenceV591.test.tsx --exclude tmp/** --exclude **/.next*/**
node scripts/build-atlas-v591-profile.mjs standalone-full
node scripts/build-atlas-v591-profile.mjs vercel-lite
node scripts/seal-v591-moon-browser-qualification.mjs
node scripts/seal-v591-mars-browser-qualification.mjs
node scripts/seal-v591-jupiter-browser-qualification.mjs
node scripts/seal-v591-saturn-browser-qualification.mjs
node scripts/seal-v591-celestial-convergence-candidate.mjs
node scripts/verify-v591-celestial-convergence-candidate.mjs
```
