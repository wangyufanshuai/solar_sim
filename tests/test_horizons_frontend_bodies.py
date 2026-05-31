"""Sanity checks: frontend Horizons body list matches N-body slot count."""

from solar_sim.horizons_ephemeris import FRONTEND_BODIES
from solar_sim.nasa_planetary_masses_kg import FRONTEND_BODY_IDS


def test_frontend_bodies_length():
    assert len(FRONTEND_BODIES) == 10
    assert FRONTEND_BODIES[0] == ("Sun", 10)
    assert FRONTEND_BODIES[4] == ("Moon", 301)
    assert not any(name.lower() == "pluto" for name, _ in FRONTEND_BODIES)


def test_mass_ids_align_with_horizons_list():
    assert FRONTEND_BODY_IDS == [bid.lower() for bid, _ in FRONTEND_BODIES]
