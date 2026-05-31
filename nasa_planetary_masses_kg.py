"""
NASA Planetary Fact Sheet–style masses [kg] for the next-web solar system bodies.

Order matches `horizons_ephemeris.FRONTEND_BODIES` / `FRONTEND_BODY_IDS`.
Values from NASA fact sheets / JPL where cited; dwarf planets and large moons use
published GM/mass figures (approximate teaching values).
"""

from __future__ import annotations

import numpy as np

# kg — fact sheet / IAU-adopted where available
SUN_KG = 1.98847e30
MERCURY_KG = 3.30104e23
VENUS_KG = 4.86732e24
EARTH_KG = 5.97217e24
MOON_KG = 7.34579e22
MARS_KG = 6.4171e23
JUPITER_KG = 1.89813e27
SATURN_KG = 5.68319e26
URANUS_KG = 8.68103e25
NEPTUNE_KG = 1.02413e26
# Pluto system mass often quoted ~1.303e22; Pluto alone ~1.309e22 kg (teaching).
PLUTO_KG = 1.309e22
CERES_KG = 9.3835e20
IO_KG = 8.9319e22
EUROPA_KG = 4.7998e22
GANYMEDE_KG = 1.4819e23
CALLISTO_KG = 1.0759e23
TITAN_KG = 1.3452e23
ENCELADUS_KG = 1.0804e20
# Saturn moons (approx. published masses)
MIMAS_KG = 3.75e19
TETHYS_KG = 6.15e20
DIONE_KG = 1.095e21
RHEA_KG = 2.3065e21
HYPERION_KG = 5.6e18
IAPETUS_KG = 1.805e21
AMALTHEA_KG = 2.08e18
PHOBOS_KG = 1.0659e16
DEIMOS_KG = 1.4762e15
# Uranus moons
ARIEL_KG = 1.353e21
UMBRIEL_KG = 1.172e21
TITANIA_KG = 3.527e21
OBERON_KG = 3.014e21
MIRANDA_KG = 6.59e19
# Neptune
TRITON_KG = 2.14e22
PROTEUS_KG = 4.4e19
CHARON_KG = 1.52e21
# Dwarf planets / large asteroids (order-of-magnitude teaching values)
ERIS_KG = 1.6466e22
MAKEMAKE_KG = 3.1e21
HAUMEA_KG = 4.006e21
GONGGONG_KG = 1.75e21
QUAOAR_KG = 1.4e21
SEDNA_KG = 1e21
ORCUS_KG = 6.4e20
SALACIA_KG = 4.5e20
VESTA_KG = 2.59076e20
PALLAS_KG = 2.04e20
HYGIEA_KG = 8.67e19
# Extended moons / small bodies (~100-body pack; many masses order-of-magnitude)
THEBE_KG = 4.3e17
METIS_JUP_KG = 5e16
ADRASTEA_KG = 2e15
HIMALIA_KG = 6.7e18
ELARA_KG = 8.7e17
PASIPHAE_KG = 3e17
SINOPE_KG = 7.5e16
LYSITHEA_KG = 6.3e16
CARME_KG = 9e16
PHOEBE_KG = 8.29e18
JANUS_KG = 1.89e18
EPIMETHEUS_KG = 1.03e17
HELENE_KG = 2.5e16
TELESTO_KG = 7e15
CALYPSO_KG = 4e15
ATLAS_SAT_KG = 7e15
PROMETHEUS_KG = 1.6e17
PANDORA_KG = 1.37e17
PAN_SAT_KG = 5e15
DAPHNIS_KG = 1e14
CORDELIA_KG = 4e16
OPHELIA_KG = 5e16
BIANCA_KG = 9e15
PORTIA_KG = 1.7e18
PUCK_KG = 2.9e18
NAIAD_KG = 1.9e17
THALASSA_KG = 4e17
DESPINA_KG = 2.2e18
GALATEA_KG = 2.1e19
LARISSA_KG = 4.9e18
NIX_KG = 4.5e16
HYDRA_PLUTO_KG = 5e16
KERBEROS_KG = 1.6e16
STYX_KG = 7.5e15
JUNO_AST_KG = 2e18
HEBE_KG = 1.4e18
IRIS_KG = 2.9e18
FLORA_KG = 4.3e18
LUTETIA_KG = 1.7e18
DAPHNE_AST_KG = 6e17
KLEOPATRA_KG = 2.6e18
EROS_KG = 6.687e15
IDA_KG = 4.2e16
MATHILDE_KG = 1.033e17
ITOKAWA_KG = 3.51e10
STEINS_KG = 4e14
VARUNA_KG = 4e20
IXION_KG = 8e20
HUYA_KG = 7e18
VARDA_KG = 2.8e20
ALBION_KG = 7e18
LOGOS_KG = 4e17
DEUCALION_KG = 4e17
PHOLUS_KG = 6.7e16

NASA_PLANETARY_MASSES_KG: np.ndarray = np.array(
    [
        SUN_KG,
        MERCURY_KG,
        VENUS_KG,
        EARTH_KG,
        MOON_KG,
        MARS_KG,
        JUPITER_KG,
        SATURN_KG,
        URANUS_KG,
        NEPTUNE_KG,
        PLUTO_KG,
        CERES_KG,
        IO_KG,
        EUROPA_KG,
        GANYMEDE_KG,
        CALLISTO_KG,
        TITAN_KG,
        ENCELADUS_KG,
        MIMAS_KG,
        TETHYS_KG,
        DIONE_KG,
        RHEA_KG,
        HYPERION_KG,
        IAPETUS_KG,
        AMALTHEA_KG,
        PHOBOS_KG,
        DEIMOS_KG,
        ARIEL_KG,
        UMBRIEL_KG,
        TITANIA_KG,
        OBERON_KG,
        MIRANDA_KG,
        TRITON_KG,
        PROTEUS_KG,
        CHARON_KG,
        ERIS_KG,
        MAKEMAKE_KG,
        HAUMEA_KG,
        GONGGONG_KG,
        QUAOAR_KG,
        SEDNA_KG,
        ORCUS_KG,
        SALACIA_KG,
        VESTA_KG,
        PALLAS_KG,
        HYGIEA_KG,
        THEBE_KG,
        METIS_JUP_KG,
        ADRASTEA_KG,
        HIMALIA_KG,
        ELARA_KG,
        PASIPHAE_KG,
        SINOPE_KG,
        LYSITHEA_KG,
        CARME_KG,
        PHOEBE_KG,
        JANUS_KG,
        EPIMETHEUS_KG,
        HELENE_KG,
        TELESTO_KG,
        CALYPSO_KG,
        ATLAS_SAT_KG,
        PROMETHEUS_KG,
        PANDORA_KG,
        PAN_SAT_KG,
        DAPHNIS_KG,
        CORDELIA_KG,
        OPHELIA_KG,
        BIANCA_KG,
        PORTIA_KG,
        PUCK_KG,
        NAIAD_KG,
        THALASSA_KG,
        DESPINA_KG,
        GALATEA_KG,
        LARISSA_KG,
        NIX_KG,
        HYDRA_PLUTO_KG,
        KERBEROS_KG,
        STYX_KG,
        JUNO_AST_KG,
        HEBE_KG,
        IRIS_KG,
        FLORA_KG,
        LUTETIA_KG,
        DAPHNE_AST_KG,
        KLEOPATRA_KG,
        EROS_KG,
        IDA_KG,
        MATHILDE_KG,
        ITOKAWA_KG,
        STEINS_KG,
        VARUNA_KG,
        IXION_KG,
        HUYA_KG,
        VARDA_KG,
        ALBION_KG,
        LOGOS_KG,
        DEUCALION_KG,
        PHOLUS_KG,
    ],
    dtype=np.float64,
)

FRONTEND_BODY_IDS = [
    "sun",
    "mercury",
    "venus",
    "earth",
    "moon",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
    "ceres",
    "io",
    "europa",
    "ganymede",
    "callisto",
    "titan",
    "enceladus",
    "mimas",
    "tethys",
    "dione",
    "rhea",
    "hyperion",
    "iapetus",
    "amalthea",
    "phobos",
    "deimos",
    "ariel",
    "umbriel",
    "titania",
    "oberon",
    "miranda",
    "triton",
    "proteus",
    "charon",
    "eris",
    "makemake",
    "haumea",
    "gonggong",
    "quaoar",
    "sedna",
    "orcus",
    "salacia",
    "vesta",
    "pallas",
    "hygiea",
    "thebe",
    "metis",
    "adrastea",
    "himalia",
    "elara",
    "pasiphae",
    "sinope",
    "lysithea",
    "carme",
    "phoebe",
    "janus",
    "epimetheus",
    "helene",
    "telesto",
    "calypso",
    "atlas",
    "prometheus",
    "pandora",
    "pan",
    "daphnis",
    "cordelia",
    "ophelia",
    "bianca",
    "portia",
    "puck",
    "naiad",
    "thalassa",
    "despina",
    "galatea",
    "larissa",
    "nix",
    "hydra",
    "kerberos",
    "styx",
    "juno",
    "hebe",
    "iris",
    "flora",
    "lutetia",
    "daphne",
    "kleopatra",
    "eros",
    "ida",
    "mathilde",
    "itokawa",
    "steins",
    "varuna",
    "ixion",
    "huya",
    "varda",
    "albion",
    "logos",
    "deucalion",
    "pholus",
]
