from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path

ROOT = Path.cwd()
SOURCE = ROOT / "dist/science/kerr-polarimeter-inversion-v412/generalized-inversion.json"
OUTPUT = ROOT / "dist/science/kerr-polarimeter-spectral-response-v413/python-oracle.json"
EXPECTED_SOURCE_SHA = "4a7c2cada728e33f84ca464fb13f3cebf586b03adb2c394da5cddddcf4ea8a1a"
BASE = [[0.5, 0.4, 0.0, 0.0], [0.5, -0.4, 0.0, 0.0], [0.5, 0.0, 0.4, 0.2], [0.5, 0.0, -0.4, 0.2]]
ADJUSTMENTS = [[0.005, 0.003, 0.001, 0.0], [-0.004, 0.002, -0.001, 0.0], [0.002, 0.001, -0.002, 0.0005], [-0.003, -0.001, -0.002, -0.0005]]
TRUTH = [1.0, 0.08, -0.05, 0.01]


def canonicalize(value):
    if isinstance(value, list): return [canonicalize(entry) for entry in value]
    if isinstance(value, dict): return {key: canonicalize(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    return value


def canonical_sha(value):
    return hashlib.sha256(json.dumps(canonicalize(value), separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


def cross_normalize(value):
    if isinstance(value, bool) or value is None or isinstance(value, str): return value
    if isinstance(value, (int, float)):
        coefficient, exponent = format(0.0 if float(value) == 0 else float(value), ".16e").split("e")
        return f"{coefficient}e{int(exponent):+d}"
    if isinstance(value, list): return [cross_normalize(entry) for entry in value]
    if isinstance(value, dict): return {key: cross_normalize(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256", "crossLanguageCanonicalSha256"}}
    raise RuntimeError("v413-cross-type")


def cross_sha(value):
    return hashlib.sha256(json.dumps(cross_normalize(value), separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


def transpose(matrix): return [list(column) for column in zip(*matrix)]
def multiply(left, right): return [[sum(left[row][inner] * right[inner][column] for inner in range(len(right))) for column in range(len(right[0]))] for row in range(len(left))]
def add(*matrices): return [[sum(matrix[row][column] for matrix in matrices) for column in range(len(matrices[0][0]))] for row in range(len(matrices[0]))]
def scale(matrix, factor): return [[entry * factor for entry in row] for row in matrix]


def inverse(matrix):
    size = len(matrix); work = [list(row) + [1.0 if index == column else 0.0 for column in range(size)] for index, row in enumerate(matrix)]
    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(work[row][column]))
        if abs(work[pivot][column]) <= math.ulp(1.0) * 64: raise RuntimeError("v413-oracle-singular")
        work[column], work[pivot] = work[pivot], work[column]; divisor = work[column][column]; work[column] = [entry / divisor for entry in work[column]]
        for row in range(size):
            if row == column: continue
            factor = work[row][column]; work[row] = [entry - factor * pivot_entry for entry, pivot_entry in zip(work[row], work[column])]
    return [row[size:] for row in work]


def one_norm(matrix): return max(sum(abs(matrix[row][column]) for row in range(len(matrix))) for column in range(len(matrix[0])))
def condition(matrix): return one_norm(matrix) * one_norm(inverse(matrix))
def node_matrix(index):
    delta = index - 2
    return [[BASE[row][column] + delta * ADJUSTMENTS[row][column] for column in range(4)] for row in range(4)]
def node_covariance(index): return [[1e-8 * (1 + index * 0.05) * (1 + row * 0.01) if row == column else 0.0 for column in range(16)] for row in range(16)]


with SOURCE.open("r", encoding="utf-8") as handle: source = json.load(handle)
if source.get("artifactSha256") != EXPECTED_SOURCE_SHA: raise RuntimeError("v413-oracle-v412-lock")
nodes = [{"wavelengthM": 4e-7 + index * 1e-7, "response": node_matrix(index), "covariance": node_covariance(index)} for index in range(5)]
cross = [[[0.2 * math.sqrt(nodes[index]["covariance"][row][row] * nodes[index + 1]["covariance"][row][row]) if row == column else 0.0 for column in range(16)] for row in range(16)] for index in range(4)]
rows = []
for sample_index in range(33):
    wavelength = 4e-7 + sample_index * (4e-7 / 32)
    interval = min(3, max(0, next((index for index in range(4) if nodes[index]["wavelengthM"] <= wavelength <= nodes[index + 1]["wavelengthM"]), 3)))
    weight = (wavelength - nodes[interval]["wavelengthM"]) / (nodes[interval + 1]["wavelengthM"] - nodes[interval]["wavelengthM"]); lower = 1 - weight
    response = add(scale(nodes[interval]["response"], lower), scale(nodes[interval + 1]["response"], weight))
    covariance = add(scale(nodes[interval]["covariance"], lower * lower), scale(nodes[interval + 1]["covariance"], weight * weight), scale(cross[interval], lower * weight), scale(transpose(cross[interval]), lower * weight))
    observation = [sum(response[row][column] * TRUTH[column] for column in range(4)) for row in range(4)]
    stokes = [row[0] for row in multiply(inverse(response), [[entry] for entry in observation])]
    rows.append({"wavelengthM": wavelength, "intervalIndex": interval, "weight": weight, "responseMatrix": response, "responseCovariance": covariance, "reconstructedStokes": stokes, "responseConditionNumber": condition(response)})

unsigned = {"version": "v413-kerr-polarimeter-spectral-python-oracle-v1", "generatedAt": source["generatedAt"], "status": "qualified-independent-spectral-fixture-oracle-not-measured-authority", "source": {"v412InversionArtifactSha256": EXPECTED_SOURCE_SHA}, "fixtureClass": "five-node-explicit-adjacent-cross-covariance", "rows": rows, "rowCount": 33, "measuredPackPresent": False, "measuredAuthorityGranted": False, "networkAttempted": False}
artifact = {**unsigned, "artifactSha256": canonical_sha(unsigned), "crossLanguageCanonicalSha256": cross_sha(unsigned)}
OUTPUT.parent.mkdir(parents=True, exist_ok=True); temporary = Path(f"{OUTPUT}.{os.getpid()}.part"); temporary.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"); os.replace(temporary, OUTPUT)
print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "rowCount": len(rows), "maximumResponseConditionNumber": max(row["responseConditionNumber"] for row in rows), "measuredAuthorityGranted": False}, indent=2))
