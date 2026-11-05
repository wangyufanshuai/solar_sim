#include "volume.hpp"
#include <cstdio>
#include <fcntl.h>
#include <filesystem>
#include <iomanip>
#include <iostream>
#include <io.h>
#include <locale>
#include <sstream>
#include <windows.h>

namespace {
using namespace nr_sbp;
struct Input { Grid grid; double tau; Fields q; };

Input read_input(bool fields) {
  static_assert(sizeof(double)==8 && sizeof(void*)==8);
  const std::uint16_t word=1;
  require(*reinterpret_cast<const unsigned char*>(&word)==1, "little-endian FP64 component required");
  std::array<char,513> header_bytes{};
  require(bool(std::cin.getline(header_bytes.data(),static_cast<std::streamsize>(header_bytes.size()))), "bounded volume header required");
  const std::string header(header_bytes.data());
  std::istringstream stream(header);
  stream.imbue(std::locale::classic());
  std::string schema,extra;
  int count=0;
  std::array<std::size_t,3> shape{};
  std::array<double,3> lower{},upper{};
  double tau=-1.;
  require(bool(stream>>schema>>count>>shape[0]>>shape[1]>>shape[2]), "incomplete volume header");
  require(schema=="nr-native-sbp-volume-input-v1" && count==58, "explicit SBP volume canonical58 schema required");
  for (double& value:lower) require(bool(stream>>value), "invalid lower bound");
  for (double& value:upper) require(bool(stream>>value), "invalid upper bound");
  require(bool(stream>>tau) && !(stream>>extra), "explicit tau and no trailing header required");
  require(std::isfinite(tau) && tau>=0., "finite nonnegative tau required");
  Input input{Grid(shape,lower,upper),tau,{}};
  if (fields) {
    const auto bytes=static_cast<std::streamsize>(input.grid.cells()*sizeof(double));
    for (auto& field:input.q) {
      field.resize(input.grid.cells());
      require(bool(std::cin.read(reinterpret_cast<char*>(field.data()),bytes)), "truncated FP64 volume payload");
    }
    validate_fields(input.grid,input.q);
  }
  char extra_byte=0;
  require(!std::cin.get(extra_byte), "trailing payload bytes forbidden");
  return input;
}

int threads(int requested) {
  require(requested==1 || requested==2 || requested==4, "qualified thread counts are1,2,4");
  omp_set_dynamic(0);
  omp_set_num_threads(requested);
  int observed=0;
#pragma omp parallel
  {
#pragma omp single
    observed=omp_get_num_threads();
  }
  require(observed==requested, "OpenMP team size differs from requested");
  return observed;
}

void output(const Input& input,const std::string& mode,int observed,const Values& values) {
  for (double value:values) require(std::isfinite(value), "nonfinite output forbidden");
  const HMODULE runtime=GetModuleHandleW(L"vcomp140.dll");
  require(runtime!=nullptr, "qualified OpenMP runtime not loaded");
  std::array<wchar_t,32768> runtime_name{};
  const auto length=GetModuleFileNameW(runtime,runtime_name.data(),static_cast<DWORD>(runtime_name.size()));
  require(length>0 && length<runtime_name.size(), "OpenMP runtime identity unavailable");
  const auto runtime_path=std::filesystem::path(runtime_name.data()).u8string();
  std::cout << "{\"schema\":\"nr-native-sbp-volume-output-v1\",\"mode\":" << std::quoted(mode)
            << ",\"shape\":[" << input.grid.shape[0] << ',' << input.grid.shape[1] << ',' << input.grid.shape[2]
            << "],\"spacing\":[" << input.grid.spacing[0] << ',' << input.grid.spacing[1] << ',' << input.grid.spacing[2]
            << "],\"threads_observed\":" << observed << ",\"openmp_version\":" << _OPENMP
            << ",\"openmp_runtime\":" << std::quoted(runtime_path)
            << ",\"values\":" << values.size() << ",\"encoding\":\"little-endian-float64\","
            << "\"boundary\":\"sbp-volume\",\"interior_order\":4,\"boundary_order\":2,"
            << "\"tau_inverse\":" << input.tau << ",\"frozen_equation_sha256\":" << std::quoted(frozen_equation_sha)
            << ",\"component_only\":true,\"fixed_halo\":false,\"sat_applied\":false,"
            << "\"auxiliaries_reconstructed\":false,\"algebraic_projection\":false,"
            << "\"evolution_backend\":false,\"physical_gate\":false,\"scientificPayloadWriteback\":false}\n";
  std::cout.write(reinterpret_cast<const char*>(values.data()),static_cast<std::streamsize>(values.size()*sizeof(double)));
  require(bool(std::cout), "native volume output stream failed");
}
} // namespace

int main(int argc,char** argv) {
  try {
    require(argc==5 && std::string(argv[1])=="--mode" && std::string(argv[3])=="--threads",
            "usage: executable --mode operators|dx|dy|dz|rhs --threads1|2|4");
    const std::string mode=argv[2], thread_text=argv[4];
    require(mode=="operators" || mode=="dx" || mode=="dy" || mode=="dz" || mode=="rhs", "unknown SBP component mode");
    std::size_t consumed=0;
    const int requested=std::stoi(thread_text,&consumed);
    require(consumed==thread_text.size(), "invalid thread count");
    const int observed=threads(requested);
    require(_setmode(_fileno(stdin),_O_BINARY)!=-1 && _setmode(_fileno(stdout),_O_BINARY)!=-1,
            "binary FP64 pipe mode unavailable");
    std::cin.imbue(std::locale::classic());
    std::cout.imbue(std::locale::classic());
    std::cout << std::setprecision(17);
    auto input=read_input(mode!="operators");
    Values packed;
    if (mode=="operators") {
      for (std::size_t axis=0; axis<3; ++axis) {
        const auto op=input.grid.axis(axis);
        const auto matrix=op.matrix();
        packed.insert(packed.end(),matrix.begin(),matrix.end());
        for (std::size_t i=0; i<op.points; ++i) packed.push_back(op.weight(i));
      }
    } else {
      Fields result;
      if (mode=="rhs") {
        const State state(input.grid,std::move(input.q),input.tau);
        result=volume_rhs(state);
      } else {
        const std::size_t axis=mode=="dx" ? 0 : (mode=="dy" ? 1 : 2);
        result=differentiate(input.grid,input.q,axis);
      }
      packed.reserve(58*input.grid.cells());
      for (const auto& field:result) packed.insert(packed.end(),field.begin(),field.end());
    }
    output(input,mode,observed,packed);
    return 0;
  } catch (const std::exception& error) {
    std::cerr << "native SBP volume rejected: " << error.what() << '\n';
    return 1;
  }
}
