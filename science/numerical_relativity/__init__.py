"""Numerical-relativity shadow kernels and validation oracles.

The package currently contains the NR-K0 exact Schwarzschild oracle, the
NR-K1 1-D CCZ4/BSSN reference, the NR-K2 C++ shadow envelope, and bounded
NR-K3 3-D state/benchmark, RHS, and AMR-transfer contracts.  The linearized
Z4c subsidiary shadow is an explicit closure/symmetrizer fixture, not a
projection or CPBC implementation for the 58-variable FO-CCZ4 state.  None is a production
3-D CCZ4 backend or a live-runtime replacement for the existing EIH 1PN model.
"""

from .schwarzschild_oracle import (
    ConstraintConvergenceReport,
    ConstraintSample,
    SchwarzschildIsotropicSlice,
    exact_hamiltonian_constraint,
    finite_difference_hamiltonian_constraint,
    run_constraint_convergence,
    schwarzschild_isotropic_lapse,
    schwarzschild_isotropic_slice,
    schwarzschild_isotropic_conformal_factor,
)
from .manifest import (
    FOCCZ4_CPP_PARAMETER_CONTRACT,
    NRRunManifest,
    manifest_from_bssn_state,
    manifest_from_constraint_report,
    manifest_from_3d_state,
    manifest_from_fo_ccz4_report,
    manifest_from_reference_state,
    validate_fo_ccz4_cpp_manifest,
)
from .ccz4_reference import (
    CCZ4_STATE_VARIABLES,
    CCZ4State1D,
    BoundaryConfig1D,
    ConstraintReport1D,
    GaugeConfig,
    GaugeWaveConstraintConvergence,
    GaugeWaveConstraintSample,
    GaugeRHS1D,
    Grid1D,
    ccz4_conformal_momentum_constraint,
    constraint_report,
    gauge_wave_constraint_convergence,
    gauge_wave_state,
    gauge_rhs,
)
from .bssn_rhs import BSSNRHS1D, advance_bssn_rk4, bssn_rhs_1d
from .ccz4_rhs import (
    CCZ4Config,
    CCZ4RHS1D,
    RobustStabilityReport,
    RobustStabilitySample,
    advance_ccz4_rk4,
    ccz4_rhs_1d,
    robust_stability_campaign,
)
from .nr3d import (
    ADMResult,
    AMRHierarchy3D,
    AMRLevel3D,
    ApparentHorizonResult,
    BSSNState3D,
    Grid3D,
    Psi4Result,
    Psi4ModeResult,
    Psi4SphereResult,
    Psi4TimeSeriesResult,
    StateApparentHorizonResult,
    StarShapedApparentHorizonResult,
    Weyl3DResult,
    adm_mass_from_state,
    adm_mass_extrapolated_from_state,
    adm_mass_from_isotropic_state,
    apply_sommerfeld_boundary_rhs,
    apparent_horizon_expansion_from_state,
    extract_psi4_from_weyl,
    extract_psi4_mode_on_sphere,
    extract_psi4_mode_time_series,
    extract_psi4_on_sphere,
    find_apparent_horizon_from_state,
    find_star_shaped_apparent_horizon_from_state,
    find_schwarzschild_apparent_horizon,
    outer_boundary_mask,
    prolongate_periodic_trilinear,
    prolongate_periodic_state,
    restrict_periodic_full_weighting,
    restrict_periodic_volume_average,
    restrict_periodic_state,
    schwarzschild_3d_benchmark,
    schwarzschild_adm_mass,
    schwarzschild_spherical_expansion,
    schwarzschild_weyl_psi4,
    weyl_electric_magnetic_from_state,
    project_psi4_mode,
    project_algebraic_constraints_3d,
)
from .bssn3d import BSSNRHS3D, advance_bssn_rk4_3d, bssn_rhs_3d
from .ccz4_3d import CCZ4RHS3D, advance_ccz4_rk4_3d, ccz4_rhs_3d
from .amr3d import AMRSubcycleReport3D, advance_two_level_periodic_amr
from .amr_patch3d import LocalAMRPatchReport3D, advance_local_patch_periodic_amr
from .boundary3d import (
    BoundaryMode3D,
    CharacteristicSpeedReport3D,
    apply_characteristic_penalty_rhs_3d,
    apply_inner_characteristic_penalty_rhs_3d,
    characteristic_speed_report_3d,
    inner_characteristic_speed_report_3d,
)
from .excision3d import (
    ExcisionCausalityReport3D,
    ExcisionShadowReport3D,
    advance_excision_characteristic_shadow_3d,
    advance_excision_shadow_3d,
    excision_causality_report_3d,
)
from .constraints3d import (
    ConstraintReport3D,
    ccz4_conformal_momentum_constraint_3d,
    constraint_report_3d,
)
from .principal_symbol3d import PrincipalSymbolReport3D, linearized_principal_symbol_3d
from .fo_ccz4 import (
    FOCCZ4_BASE_VARIABLES,
    FOCCZ4_AUXILIARY_VARIABLES,
    FOCCZ4_VARIABLE_ORDER,
    FOCCZ4_ODE_VARIABLES,
    FOCCZ4_PDE_VARIABLES,
    FOCCZ4Auxiliary3D,
    FOCCZ4OrderingReport3D,
    build_fo_ccz4_auxiliary_3d,
    fo_ccz4_ordering_constraints_3d,
    fo_ccz4_variable_contract_3d,
)
from .fo_ccz4_rhs import (
    FOCCZ4Config,
    FOCCZ4RHS3D,
    FOCCZ4RobustStabilityReport3D,
    FOCCZ4RobustStabilitySample3D,
    FOCCZ4State3D,
    advance_fo_ccz4_rk4_3d,
    fo_ccz4_robust_stability_campaign_3d,
    fo_ccz4_rhs_3d,
)
from .fo_ccz4_principal_symbol import (
    FOCCZ4PublishedSpeedFamily,
    FOCCZ4PrincipalSymbolReport3D,
    FOCCZ4PrincipalSymbolRaw3D,
    linearized_fo_ccz4_principal_symbol_3d,
    published_fo_ccz4_speed_family_contract,
)
from .fo_ccz4_cpbc_shadow import FOCCZ4CPBCAudit3D, linearized_fo_ccz4_cpbc_audit_3d
from .fo_ccz4_frozen_cpbc import (
    CPBCOrientation,
    FOCCZ4FrozenCPBCMap3D,
    linearized_fo_ccz4_frozen_cpbc_map_3d,
)
from .fo_ccz4_einstein_constraints import (
    linearized_fo_ccz4_einstein_constraint_rows_3d,
)
from .fo_ccz4_constraint_propagation import (
    FOCCZ4ConstraintPropagationAudit3D,
    linearized_fo_ccz4_constraint_propagation_audit_3d,
)
from .fo_ccz4_constraint_closure_shadow import (
    FOCCZ4ConstraintClosureMatrices3D,
    FOCCZ4ConstraintClosureShadow3D,
    linearized_fo_ccz4_constraint_closure_matrices_3d,
    linearized_fo_ccz4_constraint_closure_shadow_3d,
)
from .fo_ccz4_full_constraint_closure_shadow import (
    FOCCZ4FullConstraintClosureShadow3D,
    linearized_fo_ccz4_full_constraint_closure_shadow_3d,
)
from .fo_ccz4_constraint_envelope_cpbc_shadow import (
    CPBCEnvelopeOrientation,
    FOCCZ4ConstraintEnvelopeCPBCShadow3D,
    linearized_fo_ccz4_constraint_envelope_cpbc_shadow_3d,
)
from .fo_ccz4_constraint_envelope_boundary_shadow import (
    BoundaryShadowOrientation,
    FOCCZ4ConstraintEnvelopeBoundaryShadow3D,
    linearized_fo_ccz4_constraint_envelope_boundary_shadow_3d,
)
from .fo_ccz4_subsidiary_shadow import (
    FOCCZ4SubsidiaryShadow3D,
    SUBSIDIARY_STATE_ORDER,
    linearized_z4c_subsidiary_shadow_3d,
)
from .fo_ccz4_subsidiary_symmetrizer_shadow import (
    FOCCZ4SubsidiarySymmetrizerShadow3D,
    linearized_z4c_subsidiary_symmetrizer_shadow_3d,
)
from .fo_ccz4_subsidiary_cpbc_shadow import (
    FOCCZ4SubsidiaryCPBCShadow3D,
    SubsidiaryCPBCOrientation,
    linearized_z4c_subsidiary_cpbc_shadow_3d,
)
from .fo_ccz4_symmetrizer_shadow import (
    FOCCZ4NumericalSymmetrizerShadow3D,
    linearized_fo_ccz4_numerical_symmetrizer_shadow_3d,
)
from .fo_ccz4_source_energy_shadow import (
    FOCCZ4SourceEnergyShadow3D,
    linearized_fo_ccz4_source_energy_shadow_3d,
)
from .fo_ccz4_gauge_regime_shadow import (
    FOCCZ4GaugeRegimeCase3D,
    run_fo_ccz4_gauge_regime_sweep_3d,
)
from .fo_ccz4_full_cpbc_energy_shadow import (
    FOCCZ4FullCPBCEnergyShadow3D,
    FullCPBCOrientation,
    linearized_fo_ccz4_full_cpbc_energy_shadow_3d,
)
from .fo_ccz4_z4c_projection_audit import (
    FOCCZ4Z4CProjectionAudit3D,
    linearized_fo_ccz4_z4c_projection_audit_3d,
)
from .fo_ccz4_subsidiary_wave import (
    FOCCZ4SubsidiaryWaveShadow3D,
    SUBSIDIARY_WAVE_FIELDS,
    SUBSIDIARY_WAVE_STATE_ORDER,
    linearized_z4c_subsidiary_wave_shadow_3d,
)
from .fo_ccz4_analytic_contract import FOCCZ4ODEBlockAudit3D, audit_fo_ccz4_ode_block_3d
from .fo_ccz4_analytic_symbol import (
    analytic_fo_ccz4_principal_matrix_3d,
    fo_ccz4_frame_representation_3d,
    fo_ccz4_rotation_representation_3d,
)
from .fo_ccz4_rotated_symmetrizer_shadow import (
    FOCCZ4RotatedSymmetrizerShadow3D,
    rotated_fo_ccz4_numerical_symmetrizer_shadow_3d,
)
from .fo_ccz4_oblique_cpbc_energy_shadow import (
    FOCCZ4ObliqueCPBCEnergyShadow3D,
    ObliqueCPBCOrientation,
    linearized_fo_ccz4_oblique_cpbc_energy_shadow_3d,
)
from .fo_ccz4_characteristic_sat_shadow import (
    CharacteristicSATOrientation,
    FOCCZ4CharacteristicSATShadow3D,
    linearized_fo_ccz4_characteristic_sat_shadow_3d,
)
from .fo_ccz4_characteristic_boundary_shadow import (
    FOCCZ4GridSATApplication3D,
    apply_frozen_fo_ccz4_characteristic_sat_rhs_3d,
)
from .fo_ccz4_variable_coefficient_boundary_shadow import (
    FOCCZ4VariableCoefficientBoundaryAudit3D,
    audit_fo_ccz4_variable_coefficient_boundary_3d,
)
from .fo_ccz4_local_frame_shadow import (
    FOCCZ4LocalFrameAudit3D,
    audit_fo_ccz4_local_frame_3d,
    local_orthonormal_frame_from_metric_3d,
)
from .fo_ccz4_local_principal_proxy_shadow import (
    FOCCZ4LocalPrincipalProxy3D,
    linearized_fo_ccz4_local_principal_proxy_3d,
)
from .fo_ccz4_frozen_symbol import (
    frozen_fo_ccz4_principal_matrix_3d,
    probe_frozen_fo_ccz4_rhs_matrix_3d,
)
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_frozen_characteristics import (
    FrozenFOCCZ4EigenspaceAudit,
    audit_frozen_fo_ccz4_eigenspaces_3d,
)
from .fo_ccz4_characteristic_contract import (
    FOCCZ4CharacteristicPolynomialContract,
    characteristic_speed_multiset,
    flat_fo_ccz4_characteristic_polynomial_contract,
    published_characteristic_speed_collisions,
)

__all__ = [
    "ConstraintConvergenceReport",
    "ConstraintSample",
    "SchwarzschildIsotropicSlice",
    "exact_hamiltonian_constraint",
    "finite_difference_hamiltonian_constraint",
    "run_constraint_convergence",
    "schwarzschild_isotropic_lapse",
    "schwarzschild_isotropic_slice",
    "schwarzschild_isotropic_conformal_factor",
    "NRRunManifest",
    "FOCCZ4_CPP_PARAMETER_CONTRACT",
    "manifest_from_constraint_report",
    "manifest_from_bssn_state",
    "manifest_from_reference_state",
    "manifest_from_3d_state",
    "manifest_from_fo_ccz4_report",
    "validate_fo_ccz4_cpp_manifest",
    "CCZ4_STATE_VARIABLES",
    "CCZ4State1D",
    "BoundaryConfig1D",
    "ConstraintReport1D",
    "GaugeConfig",
    "GaugeWaveConstraintConvergence",
    "GaugeWaveConstraintSample",
    "GaugeRHS1D",
    "Grid1D",
    "constraint_report",
    "gauge_wave_constraint_convergence",
    "gauge_wave_state",
    "gauge_rhs",
    "BSSNRHS1D",
    "advance_bssn_rk4",
    "bssn_rhs_1d",
    "CCZ4Config",
    "CCZ4RHS1D",
    "advance_ccz4_rk4",
    "ccz4_rhs_1d",
    "RobustStabilityReport",
    "RobustStabilitySample",
    "robust_stability_campaign",
    "Grid3D",
    "BSSNState3D",
    "AMRLevel3D",
    "AMRHierarchy3D",
    "ApparentHorizonResult",
    "StateApparentHorizonResult",
    "StarShapedApparentHorizonResult",
    "find_schwarzschild_apparent_horizon",
    "outer_boundary_mask",
    "apply_sommerfeld_boundary_rhs",
    "apparent_horizon_expansion_from_state",
    "find_apparent_horizon_from_state",
    "find_star_shaped_apparent_horizon_from_state",
    "project_algebraic_constraints_3d",
    "prolongate_periodic_trilinear",
    "prolongate_periodic_state",
    "restrict_periodic_full_weighting",
    "restrict_periodic_volume_average",
    "restrict_periodic_state",
    "schwarzschild_spherical_expansion",
    "ADMResult",
    "adm_mass_from_state",
    "adm_mass_extrapolated_from_state",
    "adm_mass_from_isotropic_state",
    "schwarzschild_adm_mass",
    "Psi4Result",
    "Psi4ModeResult",
    "Psi4SphereResult",
    "Psi4TimeSeriesResult",
    "Weyl3DResult",
    "extract_psi4_from_weyl",
    "extract_psi4_mode_on_sphere",
    "extract_psi4_mode_time_series",
    "extract_psi4_on_sphere",
    "project_psi4_mode",
    "schwarzschild_weyl_psi4",
    "weyl_electric_magnetic_from_state",
    "schwarzschild_3d_benchmark",
    "BSSNRHS3D",
    "bssn_rhs_3d",
    "advance_bssn_rk4_3d",
    "CCZ4RHS3D",
    "ccz4_rhs_3d",
    "advance_ccz4_rk4_3d",
    "AMRSubcycleReport3D",
    "advance_two_level_periodic_amr",
    "LocalAMRPatchReport3D",
    "advance_local_patch_periodic_amr",
    "BoundaryMode3D",
    "CharacteristicSpeedReport3D",
    "apply_characteristic_penalty_rhs_3d",
    "apply_inner_characteristic_penalty_rhs_3d",
    "characteristic_speed_report_3d",
    "inner_characteristic_speed_report_3d",
    "ExcisionCausalityReport3D",
    "ExcisionShadowReport3D",
    "advance_excision_characteristic_shadow_3d",
    "advance_excision_shadow_3d",
    "excision_causality_report_3d",
    "ConstraintReport3D",
    "ccz4_conformal_momentum_constraint",
    "ccz4_conformal_momentum_constraint_3d",
    "constraint_report_3d",
    "PrincipalSymbolReport3D",
    "linearized_principal_symbol_3d",
    "FOCCZ4_AUXILIARY_VARIABLES",
    "FOCCZ4_BASE_VARIABLES",
    "FOCCZ4_VARIABLE_ORDER",
    "FOCCZ4_ODE_VARIABLES",
    "FOCCZ4_PDE_VARIABLES",
    "FOCCZ4Auxiliary3D",
    "FOCCZ4OrderingReport3D",
    "build_fo_ccz4_auxiliary_3d",
    "fo_ccz4_ordering_constraints_3d",
    "fo_ccz4_variable_contract_3d",
    "FOCCZ4Config",
    "FOCCZ4RHS3D",
    "FOCCZ4RobustStabilityReport3D",
    "FOCCZ4RobustStabilitySample3D",
    "FOCCZ4State3D",
    "advance_fo_ccz4_rk4_3d",
    "fo_ccz4_robust_stability_campaign_3d",
    "fo_ccz4_rhs_3d",
    "FOCCZ4PrincipalSymbolReport3D",
    "FOCCZ4PrincipalSymbolRaw3D",
    "FOCCZ4PublishedSpeedFamily",
    "linearized_fo_ccz4_principal_symbol_3d",
    "published_fo_ccz4_speed_family_contract",
    "FOCCZ4CPBCAudit3D",
    "linearized_fo_ccz4_cpbc_audit_3d",
    "CPBCOrientation",
    "FOCCZ4FrozenCPBCMap3D",
    "linearized_fo_ccz4_frozen_cpbc_map_3d",
    "linearized_fo_ccz4_einstein_constraint_rows_3d",
    "FOCCZ4ConstraintPropagationAudit3D",
    "linearized_fo_ccz4_constraint_propagation_audit_3d",
    "FOCCZ4ConstraintClosureShadow3D",
    "FOCCZ4ConstraintClosureMatrices3D",
    "linearized_fo_ccz4_constraint_closure_matrices_3d",
    "linearized_fo_ccz4_constraint_closure_shadow_3d",
    "FOCCZ4FullConstraintClosureShadow3D",
    "linearized_fo_ccz4_full_constraint_closure_shadow_3d",
    "CPBCEnvelopeOrientation",
    "FOCCZ4ConstraintEnvelopeCPBCShadow3D",
    "linearized_fo_ccz4_constraint_envelope_cpbc_shadow_3d",
    "BoundaryShadowOrientation",
    "FOCCZ4ConstraintEnvelopeBoundaryShadow3D",
    "linearized_fo_ccz4_constraint_envelope_boundary_shadow_3d",
    "FOCCZ4SubsidiaryShadow3D",
    "SUBSIDIARY_STATE_ORDER",
    "linearized_z4c_subsidiary_shadow_3d",
    "FOCCZ4SubsidiarySymmetrizerShadow3D",
    "linearized_z4c_subsidiary_symmetrizer_shadow_3d",
    "FOCCZ4SubsidiaryCPBCShadow3D",
    "SubsidiaryCPBCOrientation",
    "linearized_z4c_subsidiary_cpbc_shadow_3d",
    "FOCCZ4NumericalSymmetrizerShadow3D",
    "linearized_fo_ccz4_numerical_symmetrizer_shadow_3d",
    "FOCCZ4SourceEnergyShadow3D",
    "linearized_fo_ccz4_source_energy_shadow_3d",
    "FOCCZ4GaugeRegimeCase3D",
    "run_fo_ccz4_gauge_regime_sweep_3d",
    "FOCCZ4FullCPBCEnergyShadow3D",
    "FullCPBCOrientation",
    "linearized_fo_ccz4_full_cpbc_energy_shadow_3d",
    "FOCCZ4Z4CProjectionAudit3D",
    "linearized_fo_ccz4_z4c_projection_audit_3d",
    "FOCCZ4SubsidiaryWaveShadow3D",
    "SUBSIDIARY_WAVE_FIELDS",
    "SUBSIDIARY_WAVE_STATE_ORDER",
    "linearized_z4c_subsidiary_wave_shadow_3d",
    "FOCCZ4ODEBlockAudit3D",
    "audit_fo_ccz4_ode_block_3d",
    "analytic_fo_ccz4_principal_matrix_3d",
    "fo_ccz4_frame_representation_3d",
    "fo_ccz4_rotation_representation_3d",
    "FOCCZ4RotatedSymmetrizerShadow3D",
    "rotated_fo_ccz4_numerical_symmetrizer_shadow_3d",
    "FOCCZ4ObliqueCPBCEnergyShadow3D",
    "ObliqueCPBCOrientation",
    "linearized_fo_ccz4_oblique_cpbc_energy_shadow_3d",
    "CharacteristicSATOrientation",
    "FOCCZ4CharacteristicSATShadow3D",
    "linearized_fo_ccz4_characteristic_sat_shadow_3d",
    "FOCCZ4GridSATApplication3D",
    "apply_frozen_fo_ccz4_characteristic_sat_rhs_3d",
    "FOCCZ4VariableCoefficientBoundaryAudit3D",
    "audit_fo_ccz4_variable_coefficient_boundary_3d",
    "FOCCZ4LocalFrameAudit3D",
    "audit_fo_ccz4_local_frame_3d",
    "local_orthonormal_frame_from_metric_3d",
    "FOCCZ4LocalPrincipalProxy3D",
    "linearized_fo_ccz4_local_principal_proxy_3d",
    "frozen_fo_ccz4_principal_matrix_3d",
    "probe_frozen_fo_ccz4_rhs_matrix_3d",
    "FOCCZ4GaugeProfile",
    "FrozenFOCCZ4EigenspaceAudit",
    "audit_frozen_fo_ccz4_eigenspaces_3d",
    "FOCCZ4CharacteristicPolynomialContract",
    "characteristic_speed_multiset",
    "flat_fo_ccz4_characteristic_polynomial_contract",
    "published_characteristic_speed_collisions",
]
