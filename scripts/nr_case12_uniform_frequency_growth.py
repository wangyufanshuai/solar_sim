"""Exact fixed-case12 full-frequency growth candidates, without new evolution.

All rational calculations belong to the owned worker. Metadata bridges use
only stdlib bytes, hashes, JSON and AST. Accepted parent identities are inherited;
no principal or energy matrix is rebuilt, expanded, sampled or diagonalised.
"""

import ast
import copy
import hashlib
import importlib
import json
from fractions import Fraction as F
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FREQUENCY_PARENT = "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015"

COORDINATE_PARENT = "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015"

ENERGY43_PARENT = "nr-k3-case12-polynomial-energy-controls-v2-20261014"

ENERGY58_PARENT = "nr-k3-case12-full58-factorized-energy-controls-v1-20261014"

INHERITED_PARENT_NAMES = (
    "division_gate.json",
    "division_worker.json",
    "division_replay.json",
    "division_source_bridge.json",
    "division_domain.json",
    "division_scalars.json",
    "Q0.json",
    "Q1.json",
    "Q2.json",
    "domain.json",
    "denominators.json",
    "coordinate_gate.json",
    "coordinate_worker.json",
    "coordinate_replay.json",
    "coordinate_source_bridge.json",
    "rT__p_m1.json",
    "rT__p_0.json",
    "rT__p_1.json",
    "rT__p_2.json",
    "rTi__p_m1.json",
    "rTi__p_0.json",
    "rTi__p_1.json",
    "rTi__p_2.json",
    "blocks_gate.json",
    "blocks_worker.json",
    "blocks_replay.json",
    "blocks_source_bridge.json",
    "Ab.json",
)

PARENT_GATES = {
    "nr-k3-case12-physical-closure-division-controls-v1-20261015": {
        "gate_sha256": "7fb40ea60452cd0c81e932802dfb5a2295a1375f3eda85c0c1cd5fda51270fe6",
        "worker_sha256": "d1f3655acbcc2ad2933c203d34162fe4720fa3526d434a75d9bdbf730e6017b6",
    },
    "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015": {
        "gate_sha256": "466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708",
        "worker_sha256": "9a0af8284a5cdd35c3723d3be5141f2659b4ee1ba6c77b1ba78923dcf1446811",
    },
    "nr-k3-case12-polynomial-blocks-controls-v1-20261014": {
        "gate_sha256": "426016d3bc774df001f10bbdab81475a1ad498ff6fbd43f76bd3d67d071e02c7",
        "worker_sha256": "6c6ee2e00809d64111c900a4eb61a0eb864e9ba8686988fdef4c944f3f003c1e",
    },
    "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015": {
        "gate_sha256": "5817e42e5c38ff682146acf3ce8eb5afe439b5cfadddf0dc1e27f91c6ab2688d",
        "worker_sha256": "c2739fbb4c40365cecb700c73522349bdcff0e116542b3d5ef2aa5280c3d9296",
    },
    "nr-k3-case12-polynomial-energy-controls-v2-20261014": {
        "gate_sha256": "df247bc18a9366efa076382ad0ecf350e807277dd0fb6d59296a45a68ec07ee1",
        "worker_sha256": "69fde64c207c93010fa6d0e1818fe29847e15521810d7ac83b8acc1b9bb3ebbd",
    },
    "nr-k3-case12-full58-factorized-energy-controls-v1-20261014": {
        "gate_sha256": "64bd6ca11c1ba12efa3f5e437be91aef46780c747a751f1d1706ff44786618d4",
        "worker_sha256": "35321c15846f5e47524e744a9da966f3bbb0ea24c1957a3c5ddda51283e00357",
    },
}

PARENT_FILES = {
    "division_gate.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "qualification-gate.json",
        "sha256": "7fb40ea60452cd0c81e932802dfb5a2295a1375f3eda85c0c1cd5fda51270fe6",
    },
    "division_worker.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "worker-result.json",
        "sha256": "d1f3655acbcc2ad2933c203d34162fe4720fa3526d434a75d9bdbf730e6017b6",
    },
    "division_replay.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "independent-replay.json",
        "sha256": "bd21c592008bf3b432267b355ee6f34948d7b00a3ef09500ff3afc7cc4ba9deb",
    },
    "division_source_bridge.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "source_bridge.json",
        "sha256": "03938b8c1b1a04e625f8f1a586d08f69e7fd67bb2342fa0bff0032332f2ce252",
    },
    "division_domain.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "domain.json",
        "sha256": "9622687bd5f246bd98794aa543a6628267484d113d29de1198c514fee40ec7eb",
    },
    "division_scalars.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "scalars.json",
        "sha256": "316b1c6553f9d912cf22d55fd9d6b24d919c8e9a58148ca64171e427bf5785a5",
    },
    "Q0.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "Q0.json",
        "sha256": "3cddc74765ece71528acd71ac9242a5a9561ffccb9c938f16c759e83adf688f7",
    },
    "Q1.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "Q1.json",
        "sha256": "9a372062e712650085372790768bd62fe26f1e74b84511fe0712f9ca82734a08",
    },
    "Q2.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "Q2.json",
        "sha256": "411902fe63bd4662fc432d7a42dfb379835126bb8d970bb629c5cdaf557c4bbb",
    },
    "domain.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "parent-inputs/domain.json",
        "sha256": "a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
    },
    "denominators.json": {
        "directory": "nr-k3-case12-physical-closure-division-controls-v1-20261015",
        "path": "parent-inputs/denominators.json",
        "sha256": "2c0e61d17a87d2757f92375efe24ad978fb5899da27d3072645934b27529a31a",
    },
    "coordinate_gate.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "qualification-gate.json",
        "sha256": "466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708",
    },
    "coordinate_worker.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "worker-result.json",
        "sha256": "9a0af8284a5cdd35c3723d3be5141f2659b4ee1ba6c77b1ba78923dcf1446811",
    },
    "coordinate_replay.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "independent-replay.json",
        "sha256": "7751521463cdade0039d8e36b405dac40f8faca3b98c9b02100c75165e370104",
    },
    "coordinate_source_bridge.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "source_bridge.json",
        "sha256": "9081f843df45d334fa98573479c413ad241e59ea85aa6b96b5359713c32b221d",
    },
    "rT__p_m1.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rT__p_m1.json",
        "sha256": "d1edaa7516d99e2386ef2ccd77c237550e6554fb1a94378b3b852ca3f1472460",
    },
    "rT__p_0.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rT__p_0.json",
        "sha256": "7fc024f496fafafcebbaac26e4b3dffd9991626def5cc734e05152f220e135ec",
    },
    "rT__p_1.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rT__p_1.json",
        "sha256": "6dac5f5b512ca1fe0fe21cebce9a1959edf6a2591a98b650addc1128fbeb5233",
    },
    "rT__p_2.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rT__p_2.json",
        "sha256": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    },
    "rTi__p_m1.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rTi__p_m1.json",
        "sha256": "cf1df8b421ce843cc811a83521aff806a5c63c1e2d1a6205efcdbc99219cf7f7",
    },
    "rTi__p_0.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rTi__p_0.json",
        "sha256": "80b7d080ce9048eefcb13d2165aeb27dc11403c69598eaaf1a64307b963bd1ba",
    },
    "rTi__p_1.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rTi__p_1.json",
        "sha256": "ef573448b902770bfb5aac677c8a208c2aa73b0faab9fc97e83a16ce470d6b64",
    },
    "rTi__p_2.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "rTi__p_2.json",
        "sha256": "02431c25a4601cad0204ad1e9f1078c18cae7726d8f6aec7eabbdbdfe53dc7d4",
    },
    "blocks_gate.json": {
        "directory": "nr-k3-case12-polynomial-blocks-controls-v1-20261014",
        "path": "qualification-gate.json",
        "sha256": "426016d3bc774df001f10bbdab81475a1ad498ff6fbd43f76bd3d67d071e02c7",
    },
    "blocks_worker.json": {
        "directory": "nr-k3-case12-polynomial-blocks-controls-v1-20261014",
        "path": "worker-result.json",
        "sha256": "6c6ee2e00809d64111c900a4eb61a0eb864e9ba8686988fdef4c944f3f003c1e",
    },
    "blocks_replay.json": {
        "directory": "nr-k3-case12-polynomial-blocks-controls-v1-20261014",
        "path": "independent-replay.json",
        "sha256": "b02a9efc391df7920856c9cd7a1fcd1d2e1e5f3544adacfb6f5b3502894d5ec1",
    },
    "blocks_source_bridge.json": {
        "directory": "nr-k3-case12-polynomial-blocks-controls-v1-20261014",
        "path": "source_bridge.json",
        "sha256": "a79314a5704b21c4d0d0365f215ce93c3ea3399af6d4bbeb5eef3050bdd23a2e",
    },
    "Ab.json": {
        "directory": "nr-k3-case12-polynomial-blocks-controls-v1-20261014",
        "path": "division_quotient.json",
        "sha256": "40c4811594ad4828f4a0562635ea78b98df23fdcd5b2bace6fe213a5f5a9fa96",
    },
    "frequency_gate.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "qualification-gate.json",
        "sha256": "5817e42e5c38ff682146acf3ce8eb5afe439b5cfadddf0dc1e27f91c6ab2688d",
    },
    "frequency_worker.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "worker-result.json",
        "sha256": "c2739fbb4c40365cecb700c73522349bdcff0e116542b3d5ef2aa5280c3d9296",
    },
    "frequency_replay.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "independent-replay.json",
        "sha256": "7df5f34321f744a41dce72687ad3f0511627bd0ac064a34be6d8a2f362f7802b",
    },
    "frequency_source_bridge.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "source_bridge.json",
        "sha256": "31c07259adf22fc5239f8655e53d2051f54f1c422ba2efaa749bdc17284fa84e",
    },
    "frequency_domain.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "domain.json",
        "sha256": "159df33b73c256708f93ee79755ea49495d3337ecab1495ae07c1cef6fd9b3b9",
    },
    "frequency_scalars.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "scalars.json",
        "sha256": "1f9a0926b4945ec3df88c11b033c70ebf39dece735432f3acfa1fcfd4ff90ca0",
    },
    "frequency_parent_provenance.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "parent_provenance.json",
        "sha256": "670f6c7b3cd02a9476e710c391656e19e3361213256f72dad45631749a756c6a",
    },
    "energy43_gate.json": {
        "directory": "nr-k3-case12-polynomial-energy-controls-v2-20261014",
        "path": "qualification-gate.json",
        "sha256": "df247bc18a9366efa076382ad0ecf350e807277dd0fb6d59296a45a68ec07ee1",
    },
    "energy43_worker.json": {
        "directory": "nr-k3-case12-polynomial-energy-controls-v2-20261014",
        "path": "worker-result.json",
        "sha256": "69fde64c207c93010fa6d0e1818fe29847e15521810d7ac83b8acc1b9bb3ebbd",
    },
    "energy43_replay.json": {
        "directory": "nr-k3-case12-polynomial-energy-controls-v2-20261014",
        "path": "independent-replay.json",
        "sha256": "fe9957094c2a8bb44613773f80cccdd2c8e1e4a2d49fd16cd3aa062fb5bd8ee9",
    },
    "energy43_source_bridge.json": {
        "directory": "nr-k3-case12-polynomial-energy-controls-v2-20261014",
        "path": "source_bridge.json",
        "sha256": "c6723d58941c9fad4cd858a1eb8b25c08a4d3d6187618f77d1a2fafffea85f28",
    },
    "energy43_domain.json": {
        "directory": "nr-k3-case12-polynomial-energy-controls-v2-20261014",
        "path": "domain_metadata.json",
        "sha256": "44d95b72c060fbe3f738bd7525390d4de403220e98e67a630c2e9b836eec83bf",
    },
    "energy43_bounds.json": {
        "directory": "nr-k3-case12-polynomial-energy-controls-v2-20261014",
        "path": "bounds.json",
        "sha256": "476c0141567c4b8ec8dd04423f68b934bb0b8d33975c4054d209731447ec17ca",
    },
    "energy43_parent_provenance.json": {
        "directory": "nr-k3-case12-polynomial-energy-controls-v2-20261014",
        "path": "parent_provenance.json",
        "sha256": "e720946a851c5dfa5b74613373ef770ab2ca048cd2d91898638aafb0465bf68d",
    },
    "energy58_gate.json": {
        "directory": "nr-k3-case12-full58-factorized-energy-controls-v1-20261014",
        "path": "qualification-gate.json",
        "sha256": "64bd6ca11c1ba12efa3f5e437be91aef46780c747a751f1d1706ff44786618d4",
    },
    "energy58_worker.json": {
        "directory": "nr-k3-case12-full58-factorized-energy-controls-v1-20261014",
        "path": "worker-result.json",
        "sha256": "35321c15846f5e47524e744a9da966f3bbb0ea24c1957a3c5ddda51283e00357",
    },
    "energy58_replay.json": {
        "directory": "nr-k3-case12-full58-factorized-energy-controls-v1-20261014",
        "path": "independent-replay.json",
        "sha256": "6408ac4ce3891266f2c0c571f92daeb8d33354a621f3e78a459221933948480d",
    },
    "energy58_source_bridge.json": {
        "directory": "nr-k3-case12-full58-factorized-energy-controls-v1-20261014",
        "path": "source_bridge.json",
        "sha256": "471f1c9c03a52fb2d00120ff895451aecee76aa17bebd759fb20ea2fd59944f9",
    },
    "energy58_domain.json": {
        "directory": "nr-k3-case12-full58-factorized-energy-controls-v1-20261014",
        "path": "domain_metadata.json",
        "sha256": "a286b43a9cddef1c50134ed7fc16b4c571dbede3bfab2f2000bef72bfbbfb1ca",
    },
    "energy58_bounds.json": {
        "directory": "nr-k3-case12-full58-factorized-energy-controls-v1-20261014",
        "path": "bounds.json",
        "sha256": "9359dc3a5b36e6ed267a88a31eb3198b1e1fc163d723814faf96251706f0a607",
    },
    "energy58_parent_provenance.json": {
        "directory": "nr-k3-case12-full58-factorized-energy-controls-v1-20261014",
        "path": "parent_provenance.json",
        "sha256": "ffb4e0627948714e7d1826f7a739445d92527fa32e2a1503944e1d1e7e91c585",
    },
    "Z__p_m2.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "Z__p_m2.json",
        "sha256": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    },
    "Z__p_m1.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "Z__p_m1.json",
        "sha256": "372952de2a403cf386375268e769eb71ff29ff446c77ca0ce13dde8611ece60e",
    },
    "Z__p_0.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "Z__p_0.json",
        "sha256": "f5fea9f8a8afdc3d19998c9a8c76c69fdf26978c8a4da89d78d919f031f5bfae",
    },
    "Z__p_1.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "Z__p_1.json",
        "sha256": "63db06601fcb9955d3d9f7ed2492aa54c0139d81f9afb1c0b05ed2fd72d0c811",
    },
    "Z__p_2.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "Z__p_2.json",
        "sha256": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    },
    "Z__p_3.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "Z__p_3.json",
        "sha256": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    },
    "Z__p_4.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "Z__p_4.json",
        "sha256": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    },
    "Z__p_5.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "Z__p_5.json",
        "sha256": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    },
    "Z__p_6.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "Z__p_6.json",
        "sha256": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    },
    "leading_residual.json": {
        "directory": "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015",
        "path": "leading_residual.json",
        "sha256": "9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f",
    },
    "J58.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "J.json",
        "sha256": "19addd44143b8c3d3b9a1829e4848b8b4631bdfd3f8b9502f496ef7d94cbcc8b",
    },
    "C0.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "C0.json",
        "sha256": "87d85210d4d0bae1b77278657bc0277711778332de32c0cfde4b61958d5df053",
    },
    "D39.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "D39.json",
        "sha256": "192be0c9626efe0476e14772d012003c17e64ac7130c12e7a129cc9b30b2cba7",
    },
    "S39.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "S39.json",
        "sha256": "0d29a0f21f5e925102a61d4de431b0c23a9088bb85ec25fba04357e731916b43",
    },
    "B39.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "B39.json",
        "sha256": "7b3493d00536c5627f16de4fae0700317846ba4de3523a6011e951ece6535912",
    },
    "off_image_ambiguity.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "off_image_ambiguity.json",
        "sha256": "341f12b079453cf3478c5e8183f12d1e5e5d01e2f636d7349a1fcd5cecc12607",
    },
    "zero_frequency.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "zero_frequency.json",
        "sha256": "9a6a29d983fcc926b504b22db2de5cb8f40abfe1878535de07273052f5c83940",
    },
    "zero_top_residual.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "zero_top_residual.json",
        "sha256": "899a91120f2faa810928d7c92b0453d4fc059a0ddeea93ebb74df82a628ae67b",
    },
    "zero_map_residual.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "zero_map_residual.json",
        "sha256": "f8010e38b401070fe7c3032d19c4a1ea8f794e124cc2d6f77fa9ebb62b59e9bc",
    },
    "zero_section_residual.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "zero_section_residual.json",
        "sha256": "256475fb684d40ffe1fe817c7f16dad0365d68dfebfdec88ad6752333ebe76a7",
    },
    "zero_transport_residual.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "zero_transport_residual.json",
        "sha256": "f8010e38b401070fe7c3032d19c4a1ea8f794e124cc2d6f77fa9ebb62b59e9bc",
    },
    "zero_ambiguity_residual.json": {
        "directory": "nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015",
        "path": "zero_ambiguity_residual.json",
        "sha256": "bb82b21d4b43b103c70d176b329bb4c4943d800c06abbf1703e1723c5794999b",
    },
    "K58.json": {
        "directory": "nr-k3-case12-full58-factorized-energy-controls-v1-20261014",
        "path": "parent-inputs/parent-inputs/K.json",
        "sha256": "e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283",
    },
}

SOURCE_HASHES = {
    "scripts/nr_constraint_direction_section.py": "e73b54e528e635f51dc1e25af2489068fad0b26e89e1c85940ca7515c8b476c0",
    "scripts/nr_constraint_exact_coefficients.py": "ce7942fb31e40dcdc7984215318b6c10f62c02b1575f0df843acb62f3cad3fce",
    "scripts/nr_profile_exact_coefficients.py": "1c19244c4b4bd787fc389e8158aebc889c4d4ad8d556042866e9c7aa82056dbb",
    "scripts/nr_constraint_full_symbol.py": "053b70dd9136117dcfc8f2045b9953dc5ece6bfdf382eb1da12f33b9b8446042",
    "scripts/nr_constraint_laurent_energy.py": "4d73a28131a43c831488438cffaafaf056463d38a6477f316dbad036ae7eab4b",
}

DEPENDENCIES = {
    "scripts/nr_polynomial_certificate_replay.py": "36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
    "scripts/nr_case12_physical_frequency_reduction.py": "b561643f42cf90e8b1429c2a4fef6212e98c6895d9cdbf5be02cb266e3985927",
}

BOUND_HELPERS = {
    "scripts/nr_case12_polynomial_energy.py": "41e703c4c9f3c0186c64c4d847272f68c2d029ffe3e87fb3ac84ed6936eada6e",
    "scripts/nr_case12_full58_factorized_energy.py": "0c31512044e9a748533146c8feeec1c8efa196310678c51ad9025edd7bbe38b8",
}

AST_FUNCTIONS = {
    "scripts/nr_profile_exact_coefficients.py": (
        "normalized",
        "principal_rates",
        "matrix",
    ),
    "scripts/nr_constraint_full_symbol.py": ("source", "physical_coefficients"),
    "scripts/nr_constraint_exact_coefficients.py": ("leading", "normalized"),
    "scripts/nr_constraint_laurent_energy.py": (
        "factors",
        "bridge",
        "paired_energy",
        "growth_bounds",
        "normal_coordinates",
    ),
}

TABLE_SPECS = {
    "norm_J58": (58, 58, 0, 0),
    "norm_Q0": (43, 43, 0, 0),
    "norm_Q1": (43, 43, 1, 1),
    "norm_Q2": (43, 43, 2, 2),
    "norm_Z_m2": (43, 43, 2, None),
    "norm_Z_m1": (43, 43, 4, None),
    "norm_Z_0": (43, 43, 5, None),
    "norm_T_m1": (43, 43, 2, None),
    "norm_T_0": (43, 43, 3, None),
    "norm_T_1": (43, 43, 4, None),
    "norm_T_2": (43, 43, 5, None),
    "norm_Ti_m1": (43, 43, 0, None),
    "norm_Ti_0": (43, 43, 2, None),
    "norm_Ti_1": (43, 43, 3, None),
    "norm_Ti_2": (43, 43, 3, None),
}
TABLE_INPUTS = {
    "norm_J58": "J58.json",
    "norm_Q0": "Q0.json",
    "norm_Q1": "Q1.json",
    "norm_Q2": "Q2.json",
    "norm_Z_m2": "Z__p_m2.json",
    "norm_Z_m1": "Z__p_m1.json",
    "norm_Z_0": "Z__p_0.json",
    "norm_T_m1": "rT__p_m1.json",
    "norm_T_0": "rT__p_0.json",
    "norm_T_1": "rT__p_1.json",
    "norm_T_2": "rT__p_2.json",
    "norm_Ti_m1": "rTi__p_m1.json",
    "norm_Ti_0": "rTi__p_0.json",
    "norm_Ti_1": "rTi__p_1.json",
    "norm_Ti_2": "rTi__p_2.json",
}
TABLE_ORDER = tuple(TABLE_SPECS)
NEGATIVE_ORDER = ("mutant_J58", "norm_mutant_J58", "mutant_T2", "norm_mutant_T2")
METADATA = (
    "growth58",
    "growth43",
    "transform_bounds",
    "mutations",
    "acceptance",
    "stats",
    "domain",
    "source_bridge",
    "parent_provenance",
)
RECORD_ORDER = (
    "source_bridge",
    "parent_provenance",
    *TABLE_ORDER,
    "growth58",
    "growth43",
    "transform_bounds",
    *NEGATIVE_ORDER,
    "mutations",
    "domain",
    "stats",
    "acceptance",
)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def _registered_profile():
    expected = (
        ("norm_J58", "J58.json", (58, 58, 0, 0)),
        ("norm_Q0", "Q0.json", (43, 43, 0, 0)),
        ("norm_Q1", "Q1.json", (43, 43, 1, 1)),
        ("norm_Q2", "Q2.json", (43, 43, 2, 2)),
        ("norm_Z_m2", "Z__p_m2.json", (43, 43, 2, None)),
        ("norm_Z_m1", "Z__p_m1.json", (43, 43, 4, None)),
        ("norm_Z_0", "Z__p_0.json", (43, 43, 5, None)),
        ("norm_T_m1", "rT__p_m1.json", (43, 43, 2, None)),
        ("norm_T_0", "rT__p_0.json", (43, 43, 3, None)),
        ("norm_T_1", "rT__p_1.json", (43, 43, 4, None)),
        ("norm_T_2", "rT__p_2.json", (43, 43, 5, None)),
        ("norm_Ti_m1", "rTi__p_m1.json", (43, 43, 0, None)),
        ("norm_Ti_0", "rTi__p_0.json", (43, 43, 2, None)),
        ("norm_Ti_1", "rTi__p_1.json", (43, 43, 3, None)),
        ("norm_Ti_2", "rTi__p_2.json", (43, 43, 3, None)),
    )
    require(
        type(TABLE_SPECS) is dict
        and type(TABLE_INPUTS) is dict
        and TABLE_SPECS == {name: spec for name, _, spec in expected}
        and TABLE_INPUTS == {name: path for name, path, _ in expected}
        and type(TABLE_ORDER) is tuple
        and TABLE_ORDER == tuple(name for name, _, _ in expected),
        "fixed complete coefficient-table registration",
    )
    require(
        all(
            type(spec) is tuple
            and len(spec) == 4
            and all(type(x) is int for x in spec[:3])
            and (spec[3] is None or type(spec[3]) is int)
            for spec in TABLE_SPECS.values()
        ),
        "strict table degree registration",
    )
    require(
        NEGATIVE_ORDER
        == ("mutant_J58", "norm_mutant_J58", "mutant_T2", "norm_mutant_T2")
        and METADATA
        == (
            "growth58",
            "growth43",
            "transform_bounds",
            "mutations",
            "acceptance",
            "stats",
            "domain",
            "source_bridge",
            "parent_provenance",
        )
        and RECORD_ORDER
        == (
            "source_bridge",
            "parent_provenance",
            *TABLE_ORDER,
            "growth58",
            "growth43",
            "transform_bounds",
            *NEGATIVE_ORDER,
            "mutations",
            "domain",
            "stats",
            "acceptance",
        ),
        "fixed complete saved-output order",
    )


def verify_source(raw, source_name):
    expected = {**SOURCE_HASHES, **DEPENDENCIES, **BOUND_HELPERS}
    require(
        type(raw) is bytes and type(source_name) is str and source_name in expected,
        "registered source bytes required",
    )
    require(
        hashlib.sha256(raw).hexdigest() == expected[source_name],
        "frozen growth source drift: " + source_name,
    )


def _module(source_name):
    require(source_name in DEPENDENCIES, "registered metadata or codec dependency")
    verify_source((ROOT / source_name).read_bytes(), source_name)
    module = importlib.import_module(source_name.removesuffix(".py").replace("/", "."))
    require(
        Path(module.__file__).resolve() == (ROOT / source_name).resolve(),
        "frozen metadata or codec import path",
    )
    return module


def source_bridge_manifest():
    """Pure stdlib metadata; original formula ASTs are not executed or adapted."""
    _registered_profile()
    for name in {**SOURCE_HASHES, **DEPENDENCIES, **BOUND_HELPERS}:
        verify_source((ROOT / name).read_bytes(), name)
    bindings = {}
    for name, expected in AST_FUNCTIONS.items():
        tree = ast.parse((ROOT / name).read_bytes(), filename=name)
        nodes = [
            n
            for n in tree.body
            if isinstance(n, ast.FunctionDef) and n.name in expected
        ]
        require(
            len(nodes) == len(expected) and {n.name for n in nodes} == set(expected),
            "complete original growth source functions",
        )
        if name == "scripts/nr_constraint_full_symbol.py":
            source = next(n for n in nodes if n.name == "source")
            require(
                not any(
                    isinstance(n, ast.Attribute)
                    and n.attr
                    in ("ray", "ray_squared", "shift_ray", "metric_normal_squared")
                    for n in ast.walk(source)
                ),
                "J58 source is direction independent",
            )
        bindings[name] = dict(
            functions=[n.name for n in nodes],
            ast_sha256=hashlib.sha256(
                ast.dump(
                    ast.Module(body=nodes, type_ignores=[]), include_attributes=False
                ).encode()
            ).hexdigest(),
            edits=[],
            executed=False,
        )
    return dict(
        schema="nr-case12-uniform-frequency-growth-source-v1",
        source_hashes=SOURCE_HASHES.copy(),
        dependencies=DEPENDENCIES.copy(),
        bound_helpers=BOUND_HELPERS.copy(),
        bindings=bindings,
        original_state58=True,
        full58_state_similarity=False,
        full58_frequency="J58+i*rho*K58(n); n.n=1",
        original_shift_retained=True,
        geometric=False,
        constraint_frequency="zeta=i*rho; r=1",
        energy_parent_proofs_inherited=True,
        old_fixed_ray_growth_function_executed=False,
        original_matrices_rebuilt=False,
        expanded_energy_computed=False,
        direction_sampling=False,
        frequency_sampling=False,
        coefficient_bound="sum over every matrix cell and monomial of absolute exact coefficient",
        lower_energy="1/14",
        cutoff="1/2",
    )


def rational(value):
    require(type(value) is str, "canonical rational string required")
    try:
        result = F(value)
    except (ValueError, ZeroDivisionError):
        raise ValueError("canonical rational string required") from None
    require(str(result) == value, "reduced canonical rational string required")
    return result


def bound_table(
    record,
    *,
    shape,
    degree_cap,
    homogeneous_degree=None,
    guard=lambda: None,
    check=None,
):
    """Scan every polynomial coefficient and every zero cell; never sample n."""
    require(
        callable(guard) and (check is None or callable(check)),
        "callable budget controls",
    )
    require(
        type(degree_cap) is int and degree_cap >= 0,
        "nonnegative exact polynomial degree cap",
    )
    require(
        homogeneous_degree is None
        or (type(homogeneous_degree) is int and 0 <= homogeneous_degree <= degree_cap),
        "registered exact homogeneous degree",
    )
    check = guard if check is None else check
    guard()
    V = _module("scripts/nr_polynomial_certificate_replay.py")
    matrix = V.decode_matrix(record, shape=shape, max_degree=degree_cap)
    guard()
    entries, total, nonzero, coefficients, actual_degree = [], F(0), 0, 0, -1
    visits = 0
    for i, row in enumerate(matrix):
        guard()
        for j, poly in enumerate(row):
            value = F(0)
            for exponent, coefficient in poly.items():
                require(
                    homogeneous_degree is None or sum(exponent) == homogeneous_degree,
                    "nonzero coefficient has wrong homogeneous degree",
                )
                value += abs(coefficient)
                actual_degree = max(actual_degree, sum(exponent))
                visits += 1
                if visits % 256 == 0:
                    check()
            entries.append([i, j, str(value)])
            total += value
            nonzero += bool(poly)
            coefficients += len(poly)
        check()
    guard()
    return dict(
        schema="nr-case12-growth-coefficient-bound-v1",
        shape=list(shape),
        degree_cap=degree_cap,
        homogeneous_degree=homogeneous_degree,
        entries=entries,
        total=str(total),
        slots=len(entries),
        nonzero_slots=nonzero,
        coefficients=coefficients,
        max_degree=actual_degree,
        all_zero=nonzero == 0,
    )


def growth_from_totals(totals, C58, C43, *, lower=F(1, 14), cutoff=F(1, 2)):
    """Exact candidate constants; a nonzero T2 is retained as a failed premise."""
    _registered_profile()
    require(
        type(totals) is dict
        and set(totals) == set(TABLE_ORDER)
        and all(type(x) is F and x >= 0 for x in totals.values()),
        "all fifteen nonnegative explicit Fraction coefficient totals",
    )
    require(
        type(lower) is F
        and lower == F(1, 14)
        and type(cutoff) is F
        and cutoff == F(1, 2),
        "fixed positive energy floor and frequency cutoff",
    )
    require(
        type(C58) is F and type(C43) is F and C58 >= lower and C43 >= lower,
        "accepted exact upper bounds at least the energy lower bound",
    )
    j = totals["norm_J58"]
    high58, zero58 = 2 * C58 * j / lower, 2 * j
    low43 = 2 * sum((totals["norm_Q" + str(p)] * cutoff**p for p in range(3)), F(0))
    high43 = (
        2
        * C43
        / lower
        * (
            totals["norm_Z_0"]
            + totals["norm_Z_m1"] / cutoff
            + totals["norm_Z_m2"] / cutoff**2
        )
    )
    at = totals["norm_T_m1"] / cutoff + totals["norm_T_0"] + totals["norm_T_1"]
    ai = (
        totals["norm_Ti_m1"] / cutoff
        + totals["norm_Ti_0"]
        + totals["norm_Ti_1"]
        + totals["norm_Ti_2"]
    )
    require(at > 0 and ai > 0, "positive transform and inverse norm constants")
    return dict(
        growth58=dict(
            schema="nr-case12-full58-frequency-growth-v1",
            lower=str(lower),
            upper=str(C58),
            upper_global=str(max(C58, F(1))),
            source_norm=str(j),
            high_rate=str(high58),
            zero_rate=str(zero58),
            rate=str(max(high58, zero58)),
        ),
        growth43=dict(
            schema="nr-case12-physical43-frequency-growth-v1",
            lower=str(lower),
            upper=str(C43),
            cutoff=str(cutoff),
            low_rate=str(low43),
            high_rate=str(high43),
            rate=str(max(low43, high43)),
        ),
        transform_bounds=dict(
            schema="nr-case12-transform-frequency-bounds-v1",
            cutoff=str(cutoff),
            T_constant=str(at),
            Ti_constant=str(ai),
            T_power=1,
            Ti_power=2,
            energy_lower_coefficient=str(lower / ai**2),
            energy_lower_power=-4,
            energy_upper_coefficient=str(C43 * at**2),
            energy_upper_power=2,
            euclidean_flow_squared_prefactor=str(C43 / lower * at**2 * ai**2),
            euclidean_flow_squared_power=6,
            euclidean_flow_power=3,
            T2_zero=totals["norm_T_2"] == 0,
            plain_L2_uniform=False,
            no_derivative_loss=False,
        ),
    )


def reasoning_controls():
    """Actual exact counterexamples to two invalid inference rules, not case12."""
    h, j, state = F(1, 14), F(1), F(1)
    energy = h * state**2
    derivative = 2 * h * j * state**2
    bad_rate = 2 * h * abs(j)
    residual = derivative - bad_rate * energy
    rho, vector = F(2), [F(0), F(1)]
    t, ti = [[rho, F(0)], [F(0), 1 / rho]], [[1 / rho, F(0)], [F(0), rho]]
    transformed = [
        sum((a * b for a, b in zip(row, vector, strict=True)), F(0)) for row in t
    ]
    pullback = sum((x * x for x in transformed), F(0))
    claimed = sum((x * x for x in vector), F(0))
    return dict(
        missing_inverse_lower=dict(
            H=str(h),
            J=str(j),
            state=str(state),
            energy=str(energy),
            derivative=str(derivative),
            bad_rate=str(bad_rate),
            residual=str(residual),
            rejected=residual > 0,
        ),
        false_euclidean_lower=dict(
            rho=str(rho),
            T=[list(map(str, row)) for row in t],
            Ti=[list(map(str, row)) for row in ti],
            state=list(map(str, vector)),
            energy=str(pullback),
            claimed_lower=str(claimed),
            residual=str(pullback - claimed),
            rejected=pullback < claimed,
        ),
    )


def mutation_witness(
    Jrecord,
    T2record,
    baseline_J_table,
    baseline_T2_table,
    *,
    guard=lambda: None,
    check=None,
    sink=lambda name, record: None,
):
    """Perturb actual inputs and retain all changed matrices and coefficient sums."""
    require(
        callable(guard) and callable(sink) and (check is None or callable(check)),
        "callable mutation controls",
    )
    check = guard if check is None else check
    V = _module("scripts/nr_polynomial_certificate_replay.py")
    originals, tables = {}, {}
    for name, record, baseline, cap, homogeneous in (
        ("J58", Jrecord, baseline_J_table, 0, 0),
        ("T2", T2record, baseline_T2_table, 5, None),
    ):
        shape = record.get("shape") if type(record) is dict else None
        actual = bound_table(
            record,
            shape=shape,
            degree_cap=cap,
            homogeneous_degree=homogeneous,
            guard=guard,
            check=check,
        )
        require(
            json.dumps(baseline, sort_keys=True, separators=(",", ":"))
            == json.dumps(actual, sort_keys=True, separators=(",", ":")),
            "mutation baseline is the actual complete coefficient table",
        )
        require(shape[0] == shape[1], "square mutation matrix")
        originals[name] = V.decode_matrix(record, shape=shape, max_degree=cap)
        tables[name] = actual
    n = len(originals["J58"])
    mutated_j = copy.deepcopy(originals["J58"])
    original_zero = not mutated_j[n - 1][n - 1]
    cell = mutated_j[n - 1][n - 1]
    exponent = (0, 0, 0)
    cell[exponent] = cell.get(exponent, F(0)) + F(1)
    if not cell[exponent]:
        del cell[exponent]
    jrecord = V.encode_matrix(mutated_j)
    guard()
    sink("mutant_J58", jrecord)
    guard()
    jtable = bound_table(
        jrecord,
        shape=(n, n),
        degree_cap=0,
        homogeneous_degree=0,
        guard=guard,
        check=check,
    )
    guard()
    sink("norm_mutant_J58", jtable)
    guard()
    differences = []
    for before, after in zip(tables["J58"]["entries"], jtable["entries"], strict=True):
        check()
        differences.append(
            [before[0], before[1], str(rational(after[2]) - rational(before[2]))]
        )
    changed = sum(rational(row[2]) != 0 for row in differences)
    total_delta = rational(jtable["total"]) - rational(tables["J58"]["total"])
    m = len(originals["T2"])
    mutated_t = copy.deepcopy(originals["T2"])
    exponent = (2, 0, 0)
    cell = mutated_t[0][0]
    cell[exponent] = cell.get(exponent, F(0)) + F(1)
    if not cell[exponent]:
        del cell[exponent]
    trecord = V.encode_matrix(mutated_t)
    guard()
    sink("mutant_T2", trecord)
    guard()
    ttable = bound_table(trecord, shape=(m, m), degree_cap=5, guard=guard, check=check)
    guard()
    sink("norm_mutant_T2", ttable)
    guard()
    controls = reasoning_controls()
    result = dict(
        schema="nr-case12-frequency-growth-mutations-v1",
        J=dict(
            name="add-one-to-J58-last-diagonal",
            entry=[n - 1, n - 1],
            original_slot_zero=original_zero,
            delta_entries=differences,
            changed_slots=changed,
            total_delta=str(total_delta),
            rejected=original_zero and changed > 0 and total_delta != 0,
        ),
        T2=dict(
            name="add-x2-to-T2-00",
            entry=[0, 0],
            baseline_zero=tables["T2"]["all_zero"],
            mutant_nonzero_slots=ttable["nonzero_slots"],
            mutant_coefficients=ttable["coefficients"],
            rejected=tables["T2"]["all_zero"] and not ttable["all_zero"],
        ),
        reasoning_controls=controls,
    )
    result["accepted"] = (
        result["J"]["rejected"]
        and result["T2"]["rejected"]
        and all(row["rejected"] for row in controls.values())
    )
    guard()
    return result


def parent_provenance_manifest(parent_inputs):
    """Pure supplied bytes/SHA/JSON validation: no source reads or arithmetic."""
    require(
        type(parent_inputs) is dict and set(parent_inputs) == set(PARENT_FILES),
        "all seventy-two immutable growth parent inputs",
    )
    records = {}
    for name, spec in PARENT_FILES.items():
        raw = parent_inputs[name]
        require(
            type(raw) is bytes and hashlib.sha256(raw).hexdigest() == spec["sha256"],
            "growth parent byte drift: " + name,
        )
        records[name] = json.loads(raw)
    groups = (
        (
            "division",
            "nr-k3-case12-physical-closure-division-controls-v1-20261015",
            "nr-case12-physical-closure-division-controls-v1",
            (
                "physical_direction_polynomial_generator_validated",
                "fixed_background_local_symbol_validated",
            ),
        ),
        (
            "coordinate",
            COORDINATE_PARENT,
            "nr-case12-physical-coordinate-bridge-controls-v1",
            (
                "physical_coordinate_bridge_validated",
                "zero_frequency_physical39_validated",
            ),
        ),
        (
            "blocks",
            "nr-k3-case12-polynomial-blocks-controls-v1-20261014",
            "nr-case12-polynomial-blocks-controls-v1",
            ("exact_quotient_cancellation_validated", "ode_blocks_validated"),
        ),
        (
            "frequency",
            FREQUENCY_PARENT,
            "nr-case12-physical-frequency-reduction-controls-v1",
            (
                "physical_frequency_reduction_validated",
                "physical_reduced_principal_bridge_validated",
            ),
        ),
        (
            "energy43",
            ENERGY43_PARENT,
            "nr-case12-polynomial-energy-controls-v2",
            (
                "direction_uniform_energy_validated",
                "uniform_strong_hyperbolicity_validated",
            ),
        ),
        (
            "energy58",
            ENERGY58_PARENT,
            "nr-case12-full58-factorized-energy-controls-v1",
            (
                "full58_principal_factorized_energy_validated",
                "full58_principal_energy_validated",
                "direction_uniform_energy_validated",
                "uniform_strong_hyperbolicity_validated",
            ),
        ),
    )
    for prefix, directory, schema, flags in groups:
        gate, worker, replay = (
            records[prefix + suffix + ".json"]
            for suffix in ("_gate", "_worker", "_replay")
        )
        require(
            PARENT_FILES[prefix + "_gate.json"]["sha256"]
            == PARENT_GATES[directory]["gate_sha256"]
            and PARENT_FILES[prefix + "_worker.json"]["sha256"]
            == PARENT_GATES[directory]["worker_sha256"],
            "fixed mathematical-parent terminal identity",
        )
        for record in (gate, worker):
            require(
                record["schema"] == schema
                and record["passed"] is record["completed"] is True
                and record["errors"] == []
                and record["case_indices"] == [12]
                and all(record[flag] is True for flag in flags),
                "accepted complete fixed-case parent: " + prefix,
            )
            require(
                all(
                    record[flag] is False
                    for flag in (
                        "physical_gate",
                        "live_admission",
                        "scientificPayloadWriteback",
                    )
                ),
                "parents retain shadow-only qualification",
            )
        require(
            gate["supervisor"]["cleanup_verified"] is True
            and worker["source_before"] == worker["source_after"],
            "parent cleanup and source closure",
        )
        require(
            gate["replay"] == worker["replay"] == replay and replay["passed"] is True,
            "complete accepted independent parent replay",
        )
        for name, spec in PARENT_FILES.items():
            if (
                spec["directory"] == directory
                and spec["path"] != "qualification-gate.json"
            ):
                require(
                    gate["artifact_hashes"][spec["path"]] == spec["sha256"],
                    "qualified actual parent artifact: " + name,
                )
    frequency = records["frequency_replay.json"]
    require(
        frequency["matrix_count"] == 20
        and frequency["matrix_slots"] == 36980
        and frequency["residual_slots"] == 11094
        and frequency["residual_nonzero_slots"] == 0
        and frequency["acceptance"]["accepted"] is True
        and frequency["acceptance"]["above_first_order_zero"] is True
        and frequency["acceptance"]["leading_principal_match"] is True,
        "full transformed frequency support and principal bridge",
    )
    coordinate = records["coordinate_replay.json"]
    require(
        coordinate["matrix_count"] == 78
        and coordinate["residual_slots"] == 82569
        and coordinate["residual_nonzero_slots"] == 0
        and coordinate["acceptance"]["inverse_relations"] is True
        and coordinate["acceptance"]["zero_frequency_image"] is True,
        "coordinate inverse and actual zero-frequency image proofs",
    )
    division = records["division_replay.json"]
    require(
        division["acceptance"]["quotient_homogeneity"] is True
        and division["acceptance"]["direct_closure"] is True
        and division["residual_nonzero_slots"] == 0,
        "accepted local polynomial physical symbol",
    )
    require(
        records["blocks_replay.json"]["acceptance"]["accepted"] is True,
        "accepted original principal quotient numerator",
    )
    for prefix, lower_name, scope in (
        ("energy58", "lower", 58),
        ("energy43", "lower_energy", 43),
    ):
        bounds, replay = (
            records[prefix + "_bounds.json"],
            records[prefix + "_replay.json"],
        )
        require(
            bounds[lower_name] == replay["uniform_lower"] == "1/14"
            and type(bounds["upper"]) is str
            and bounds["upper"] == replay["uniform_upper"]
            and bounds["shape"] == [scope, scope]
            and replay["acceptance"]["accepted"] is True,
            "actual accepted energy-bound field identity: " + prefix,
        )
        require(
            records[prefix + "_domain.json"] == replay["domain_metadata"],
            "accepted energy-domain metadata",
        )
    require(
        records["energy58_replay.json"]["formal_zero_slots"] == 784
        and records["energy58_replay.json"]["relations"] == 69
        and records["energy43_replay.json"]["residual_slots"] == 7396,
        "complete inherited principal energy proofs",
    )
    source_ledger = records["frequency_worker.json"]["source_before"]
    for name, digest in {**SOURCE_HASHES, **DEPENDENCIES, **BOUND_HELPERS}.items():
        require(
            source_ledger[name] == digest, "current accepted formula identity: " + name
        )
    bridge = records["frequency_source_bridge.json"]
    require(
        bridge["source_hashes"] == SOURCE_HASHES
        and bridge["original_shift_retained"] is True
        and bridge["geometric"] is False
        and bridge["leading_identity"] == "Z[1]-r*Ab=0; Khat43=Ab/r",
        "same original shifted principal and physical coordinates",
    )
    require(
        records["energy43_source_bridge.json"]["paired_energy"]["source_sha256"]
        == SOURCE_HASHES["scripts/nr_constraint_laurent_energy.py"]
        and records["energy58_source_bridge.json"]["bindings"][
            "scripts/nr_constraint_laurent_energy.py"
        ]["source_sha256"]
        == SOURCE_HASHES["scripts/nr_constraint_laurent_energy.py"],
        "same original energy formula family",
    )
    inherited = records["frequency_parent_provenance.json"]
    require(
        set(inherited["files"]) == set(INHERITED_PARENT_NAMES)
        and all(
            inherited["files"][name] == PARENT_FILES[name]
            and inherited["input_hashes"][name] == PARENT_FILES[name]["sha256"]
            for name in INHERITED_PARENT_NAMES
        ),
        "complete unchanged frequency-parent ancestry",
    )
    zero = records["zero_frequency.json"]
    require(
        zero["schema"] == "nr-case12-physical-zero-image-v1"
        and zero["accepted"]
        is zero["right_section_verified"]
        is zero["invariant_image_verified"]
        is True
        and zero["reachable_rank"] == 39
        and zero["zero_rows"] == [0, 1, 2, 3]
        and zero["full43_right_inverse_exists"] is False
        and zero["laurent_evaluated_at_zero"] is False,
        "physical zero-frequency reachable image only",
    )
    return dict(
        schema="nr-case12-uniform-frequency-growth-parent-v1",
        parent_gates=copy.deepcopy(PARENT_GATES),
        files=copy.deepcopy(PARENT_FILES),
        input_hashes={name: spec["sha256"] for name, spec in PARENT_FILES.items()},
        complete_frequency_reduction_inherited=True,
        original58_principal_energy_inherited=True,
        principal43_energy_inherited=True,
        zero_frequency_reachable_rank=39,
        external_parent_reads=False,
        parent_matrices_rebuilt=False,
        old_results_regraded=False,
    )


def energy_bounds(bounds58, bounds43, replay58, replay43):
    """Owned-worker canonical rational interpretation of accepted bounds."""
    for value in (bounds58, bounds43, replay58, replay43):
        require(type(value) is dict, "explicit energy metadata dictionaries")
    require(
        bounds58.get("schema") == "nr-case12-full58-factorized-bound-v1"
        and bounds43.get("schema") == "nr-case12-energy-coefficient-bound-v1",
        "registered energy bound schemas",
    )
    for value, shape in ((bounds58, [58, 58]), (bounds43, [43, 43])):
        require(
            type(value.get("shape")) is list
            and value["shape"] == shape
            and all(type(x) is int for x in value["shape"]),
            "exact energy matrix shape",
        )
    require(
        bounds58.get("accepted") is True
        and bounds43.get("consistent_lower_upper") is True
        and bounds58.get("sphere") == "r=1"
        and bounds58.get("m") == bounds43.get("g_lower") == "5/6"
        and bounds43.get("denominator_power") == 6
        and type(bounds43["denominator_power"]) is int,
        "accepted sphere energy-bound assumptions",
    )
    require(
        rational(bounds58["lower"]) == rational(bounds43["lower_energy"]) == F(1, 14),
        "original common positive energy floor",
    )
    upper58, upper43 = rational(bounds58["upper"]), rational(bounds43["upper"])
    require(upper58 >= F(1, 14) and upper43 >= F(1, 14), "energy upper at least lower")
    for upper, replay in ((upper58, replay58), (upper43, replay43)):
        require(
            replay.get("passed") is True
            and replay["acceptance"]["accepted"] is True
            and rational(replay["uniform_lower"]) == F(1, 14)
            and rational(replay["uniform_upper"]) == upper,
            "independently accepted canonical energy bounds",
        )
    return upper58, upper43


def domain_metadata():
    return dict(
        schema="nr-case12-uniform-frequency-growth-domain-v1",
        fixed_case=12,
        geometric=False,
        background="constant",
        direction="real unit n; n.n=1",
        radial_frequency="rho>=0",
        cutoff="1/2",
        low_interval="0<=rho<1/2",
        high_interval="rho>=1/2",
        fourier_indeterminate="zeta=i*rho; r=1",
        conjugate_transpose=True,
        frequency_fixed_in_time=True,
        cutoff_multiplier_continuity_required=False,
        full58_operator="J58+i*rho*K58(n)",
        full58_state_similarity=False,
        original_shift_retained=True,
        J58_direction_independent=True,
        full58_nonzero_energy="y*H58(n)y",
        full58_zero_energy="y*y",
        full58_global_upper="max(C58,1)",
        physical43_low_energy="c*c",
        physical43_high_energy="(T*c)*H43(n)*(T*c)",
        physical43_reduced_principal="Khat43=Ab/r; r=1",
        complete_Z_powers=list(range(-2, 7)),
        complete_T_powers=[-1, 0, 1, 2],
        complete_Ti_powers=[-1, 0, 1, 2],
        T2_required_zero=True,
        zero_frequency_reachable_rank=39,
        zero_frequency_full43_inverse_exists=False,
        laurent_evaluated_at_zero=False,
        physical43_uniform_euclidean_growth_validated=False,
        constraint_derivative_loss_absent_proved=False,
        euclidean_three_derivative_reserve_is_optimal=False,
        variable_background_energy_validated=False,
        actual_nonlinear_rhs_bridge_proved=False,
        boundary_well_posedness_proved=False,
        coefficient_bounds_are_sharp=False,
        stable_timestep_proved=False,
    )


def _parent_structure(records, *, guard, check):
    """Decode inherited complete residuals/maps; no inherited product is rerun."""
    V = _module("scripts/nr_polynomial_certificate_replay.py")
    caps = (2, 4, 5, 6, 7, 8, 9, 10, 10)
    reduction_ok = True
    for power, cap in zip(range(-2, 7), caps, strict=True):
        guard()
        tag = "m" + str(-power) if power < 0 else str(power)
        matrix = V.decode_matrix(
            records["Z__p_" + tag + ".json"], shape=(43, 43), max_degree=cap
        )
        if power > 1:
            reduction_ok = reduction_ok and not any(
                poly for row in matrix for poly in row
            )
        check()
    leading = V.decode_matrix(
        records["leading_residual.json"], shape=(43, 43), max_degree=6
    )
    reduction_ok = reduction_ok and not any(poly for row in leading for poly in row)
    k58 = V.decode_matrix(records["K58.json"], shape=(58, 58), max_degree=1)
    for i, row in enumerate(k58):
        guard()
        for j, poly in enumerate(row):
            require(
                all(sum(power) == 1 for power in poly),
                "original K58 is homogeneous linear",
            )
            require(
                i >= 11 and j >= 11 or not poly,
                "complete original K58 zero-base structure",
            )
    maps = {}
    for name, shape in (
        ("C0", (43, 58)),
        ("D39", (39, 58)),
        ("S39", (58, 39)),
        ("B39", (39, 39)),
        ("off_image_ambiguity", (43, 43)),
    ):
        guard()
        maps[name] = V.decode_matrix(records[name + ".json"], shape=shape, max_degree=0)
    zero_ok = (
        maps["C0"][4:] == maps["D39"]
        and not any(poly for row in maps["C0"][:4] for poly in row)
        and any(poly for row in maps["off_image_ambiguity"] for poly in row)
    )
    for name, shape in (
        ("zero_top_residual", (4, 58)),
        ("zero_map_residual", (39, 58)),
        ("zero_section_residual", (39, 39)),
        ("zero_transport_residual", (39, 58)),
        ("zero_ambiguity_residual", (43, 58)),
    ):
        guard()
        matrix = V.decode_matrix(records[name + ".json"], shape=shape, max_degree=0)
        zero_ok = zero_ok and not any(poly for row in matrix for poly in row)
    guard()
    return bool(reduction_ok), bool(zero_ok)


def build_certificate(
    parent_inputs, *, guard=lambda: None, check=None, sink=lambda name, record: None
):
    """The only complete owned-worker path; every candidate output is retained."""
    require(
        callable(guard) and callable(sink) and (check is None or callable(check)),
        "callable complete-certificate controls",
    )
    check = guard if check is None else check
    guard()
    saved = {}

    def save(name, record):
        guard()
        require(
            len(saved) < len(RECORD_ORDER) and name == RECORD_ORDER[len(saved)],
            "complete unique ordered growth records",
        )
        sink(name, record)
        saved[name] = record
        guard()

    save("source_bridge", source_bridge_manifest())
    save("parent_provenance", parent_provenance_manifest(parent_inputs))
    records = {name: json.loads(raw) for name, raw in parent_inputs.items()}
    upper58, upper43 = energy_bounds(
        records["energy58_bounds.json"],
        records["energy43_bounds.json"],
        records["energy58_replay.json"],
        records["energy43_replay.json"],
    )
    reduction_ok, zero_ok = _parent_structure(records, guard=guard, check=check)
    totals = {}
    for name in TABLE_ORDER:
        rows, columns, cap, homogeneous = TABLE_SPECS[name]
        table = bound_table(
            records[TABLE_INPUTS[name]],
            shape=(rows, columns),
            degree_cap=cap,
            homogeneous_degree=homogeneous,
            guard=guard,
            check=check,
        )
        save(name, table)
        totals[name] = rational(table["total"])
    growth = growth_from_totals(totals, upper58, upper43)
    for name in ("growth58", "growth43", "transform_bounds"):
        save(name, growth[name])
    mutations = mutation_witness(
        records["J58.json"],
        records["rT__p_2.json"],
        saved["norm_J58"],
        saved["norm_T_2"],
        guard=guard,
        check=check,
        sink=save,
    )
    save("mutations", mutations)
    save("domain", domain_metadata())
    save(
        "stats",
        dict(
            main_tables=len(TABLE_ORDER),
            main_table_slots=sum(saved[n]["slots"] for n in TABLE_ORDER),
            negative_tables=2,
            negative_table_slots=saved["norm_mutant_J58"]["slots"]
            + saved["norm_mutant_T2"]["slots"],
            mutation_matrices=2,
            mutation_matrix_slots=len(saved["mutant_J58"]["entries"])
            + len(saved["mutant_T2"]["entries"]),
            outputs=len(RECORD_ORDER),
            parent_files=len(PARENT_FILES),
            matrix_products=0,
        ),
    )
    acceptance = dict(
        parent_principal_energies=True,
        coefficient_tables=all(
            rational(saved[name]["total"]) >= 0 for name in TABLE_ORDER
        ),
        zero_T2=saved["norm_T_2"]["all_zero"],
        complete_reduction_residuals=reduction_ok,
        zero_frequency_image=zero_ok,
        full58_growth_bound=upper58 >= F(1, 14),
        physical43_weighted_growth_bound=(
            upper43 >= F(1, 14)
            and reduction_ok
            and zero_ok
            and saved["norm_T_2"]["all_zero"]
        ),
        mutations_rejected=mutations["J"]["rejected"] and mutations["T2"]["rejected"],
        reasoning_controls_rejected=all(
            row["rejected"] for row in mutations["reasoning_controls"].values()
        ),
    )
    acceptance["accepted"] = all(acceptance.values())
    save("acceptance", acceptance)
    require(tuple(saved) == RECORD_ORDER, "all growth evidence saved")
    return saved
