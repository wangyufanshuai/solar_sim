# Post-v593 stellar source-intake contract

This additive candidate seals a field-level provenance document for all 24
first-roster stellar heroes. Every field carries an explicit status, value,
unit, epoch, uncertainty object, citations, source version, license boundary,
and measurement-admission bit. `unknown` and `search-not-found` always carry a
JSON `null` value; neither status may be represented by numeric zero or
boolean false.

## Intake result

- The recoverable Exa replay contains 26 explicit queries with
  `requestedNumResults=5` each: `sources_reviewed=130`, 130 returned result
  slots, 101 exact-normalized unique URLs, 29 duplicate slots, and 15 admitted
  official-source or primary-literature references. Every slot seals its
  URL/title, source class, keep/drop reason, and dedupe target.
- The earlier reported 259 aggregate has no retained per-result history and
  is therefore sealed only as `unverifiable-historical-aggregate`; it is not
  consumed as build authority.
- The sealed SIMBAD resolver snapshot contains 24/24 resolved queries.
- 20/24 heroes are bound to an exact named-star or component identity.
- `capella-a`, `spica`, `regulus`, and `polaris` remain
  `render-anchor-only`: the resolver returned a system record without enough
  component-specific evidence to bind the roster identity.
- 24/24 heroes are `schema-complete` and presentation-admitted.
- 0/24 heroes are measurement- or provenance-admitted because at least one
  required field remains non-measurement-admitted for every hero.
- Vega, Altair, Achernar, and Regulus contain scoped interferometric values
  sealed directly from their cited primary-paper tables. Admission applies
  only to those individual fields and their recorded model ranges.

SIMBAD is used for name resolution, cross-identifiers, and basic data carrying
upstream bibcodes. It is not a catalogue or measurement authority. Direct
SIMBAD fields use the explicit `meta-resolver-basic-data` authority class and
no SIMBAD-sourced field is measurement-admitted. The offline intake contract
requests every parsed VOTable column, including `coo_err_angle` and
`coo_wavelength`; a missing result column blocks the intake before a snapshot
can be written. The old Gaia render anchor remains a presentation locator and
is never used as named-star identity evidence. Acrux's returned parallax value
of zero is explicitly invalid for distance derivation, so its distance remains
`search-not-found`; no infinite or zero physical distance is exported.

Achernar's primary-paper luminosity is preserved in the paper's logarithmic
shape, `{ "log10Solar": 3.48 }`, with unit
`log10-solar-luminosity`; it is not mislabeled as a linear solar luminosity.
Reverse registry-use validation removes two unused ADS pointers
(`1953ApJ...117..313J` and `1993ASPC...45...59L`) and rejects any remaining
registry row without a field/citation or explicit policy/derivation use.
`vizier-usage` is retained through an explicit `license-policy`
`registryUse` record.

## Required-field coverage

The 13 required fields produce 312 field records:

| Field | Direct | Derived | Presentation-only | Unknown | Search-not-found |
| --- | ---: | ---: | ---: | ---: | ---: |
| identity | 20 | 0 | 0 | 0 | 4 |
| raDec | 20 | 0 | 4 | 0 | 0 |
| epoch | 0 | 0 | 0 | 24 | 0 |
| distance | 0 | 19 | 0 | 0 | 5 |
| spectralType | 20 | 0 | 4 | 0 | 0 |
| temperature | 4 | 0 | 20 | 0 | 0 |
| logg | 1 | 0 | 0 | 0 | 23 |
| radius | 4 | 20 | 0 | 0 | 0 |
| luminosity | 2 | 0 | 22 | 0 | 0 |
| rotation | 4 | 0 | 20 | 0 | 0 |
| orientation | 4 | 0 | 0 | 0 | 20 |
| variability | 12 | 0 | 0 | 0 | 12 |
| companions | 22 | 0 | 0 | 0 | 2 |
| **Total** | **113** | **39** | **70** | **24** | **66** |

No required field is currently classified as `estimated`. The generated
manifest also seals this matrix under `coverage.fields` and the aggregate
counts under `coverage.requiredFieldStatusCounts`.

## Per-hero unknown/search-not-found ledger

- `sirius-a`: epoch, logg, orientation, variability
- `canopus`: epoch, logg, orientation, variability, companions
- `alpha-centauri-a`: epoch, logg, orientation, variability
- `alpha-centauri-b`: epoch, logg, orientation, variability
- `arcturus`: epoch, logg, orientation, variability
- `vega`: epoch, logg
- `capella-a`: identity, epoch, distance, logg, orientation, variability
- `rigel`: epoch, logg, orientation
- `procyon-a`: epoch, logg, orientation, variability
- `betelgeuse`: epoch, logg, orientation
- `aldebaran`: epoch, logg, orientation
- `antares`: epoch, logg, orientation
- `achernar`: epoch, companions
- `hadar`: epoch, logg, orientation
- `altair`: epoch, logg
- `acrux`: epoch, distance, logg, orientation, variability
- `spica`: identity, epoch, distance, logg, orientation
- `pollux`: epoch, logg, orientation, variability
- `fomalhaut`: epoch, logg, orientation, variability
- `deneb`: epoch, logg, orientation
- `regulus`: identity, epoch, distance, logg, variability
- `polaris`: identity, epoch, distance, logg, orientation
- `bellatrix`: epoch, logg, orientation, variability
- `alnilam`: epoch, logg, orientation

This ledger records an intake outcome, not physical absence. In particular,
`search-not-found` means that this sealed pass did not admit a sufficiently
specific source row; it is not a claim that the property does not exist.

Presentation profiles remain deterministic, parameter-derived display models.
They are not observation textures, resolved stellar surfaces, measured or
scientific authority, GPU authority, or scientific-payload writeback. The
formal product pointer remains `v263`; this intake neither migrates v593
signoff/challenge evidence nor authorizes production release.
