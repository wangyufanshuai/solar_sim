#include "fo_principal.hpp"

int main(int argc,char** argv) {
  try {
    nr_principal::require(argc==4 && std::string(argv[1])=="--lapack"
                          && std::string(argv[3])=="--assemble-split",
                          "usage: executable --lapack ABSOLUTE_DLL --assemble-split");
    nr_principal::classic_io();
    const nr_native::Lapack lapack{std::filesystem::path(argv[2])};
    const auto c=nr_principal::read_input(lapack);
    const auto principal=nr_principal::assemble(c);
    const auto groups=nr_principal::centered_roots(c);
    const double advection=c.beta[static_cast<std::size_t>(c.axis)];
    const auto split=nr_native::split47(lapack,principal,groups,advection);
    std::cout << "{\"schema\":\"nr-native-fo-principal-component-v1\",\"component_only\":true,"
              << "\"native_principal_assembly\":true,\"native_speed_families\":true,"
              << "\"evolution_backend\":false,\"physical_gate\":false,\"scientificPayloadWriteback\":false,"
              << "\"axis\":" << c.axis << ",\"metric_determinant\":" << c.determinant
              << ",\"advection\":" << advection << ",\"shift_f\":" << c.f << ",\"ordering_mu\":" << c.mu
              << ",\"condition\":" << split.condition << ",\"residual\":" << split.residual
              << ",\"symmetry_residual\":" << split.symmetry
              << ",\"minimum_energy_eigenvalue\":" << split.minimum_energy_eigenvalue
              << ",\"centered_root_groups\":[";
    for (std::size_t i=0; i<groups.size(); ++i) {
      if (i) std::cout << ',';
      std::cout << '[' << groups[i].value << ',' << groups[i].multiplicity << ']';
    }
    std::cout << "],\"principal\":";
    nr_principal::json_array(principal);
    std::cout << ",\"positive\":";
    nr_principal::json_array(split.positive);
    std::cout << ",\"negative\":";
    nr_principal::json_array(split.negative);
    std::cout << "}\n";
    return 0;
  } catch (const std::exception& error) {
    std::cerr << "native FO component rejected: " << error.what() << '\n';
    return 1;
  }
}
