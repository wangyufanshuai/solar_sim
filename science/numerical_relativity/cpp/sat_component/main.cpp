#include "sat.hpp"
#include <cstdio>
#include <fcntl.h>
#include <io.h>

namespace {
using nr_sat::require;
struct Request {nr_sbp::Fields q;nr_sat::Targets targets;};
struct Input {nr_sbp::Grid grid;double dt;std::vector<Request> requests;};

void read_fields(nr_sbp::Fields& fields,std::size_t points) {
  for(auto& field:fields) {
    field.resize(points);
    require(bool(std::cin.read(reinterpret_cast<char*>(field.data()),static_cast<std::streamsize>(points*sizeof(double)))),
            "truncated canonical58 FP64 payload");
    require(nr_native::finite(field),"finite canonical58 payload required");
  }
}
Input read_input() {
  const std::uint16_t endian=1;
  require(*reinterpret_cast<const unsigned char*>(&endian)==1,"little-endian FP64 required");
  std::array<char,513> line{};
  require(bool(std::cin.getline(line.data(),static_cast<std::streamsize>(line.size()))),"bounded SAT header required");
  std::istringstream header(line.data());header.imbue(std::locale::classic());
  std::string schema,extra;
  int variables=0,requests=0;
  std::array<std::size_t,3> shape{};
  std::array<double,3> lower{},upper{};
  double dt=0.;
  require(bool(header>>schema>>variables>>requests>>shape[0]>>shape[1]>>shape[2]),"incomplete SAT header");
  require(schema=="nr-native-sat-input-v1" && variables==58 && requests>=1 && requests<=3,
          "explicit SAT canonical58 schema and1..3 independent requests required");
  for(double& value:lower) require(bool(header>>value),"invalid lower bound");
  for(double& value:upper) require(bool(header>>value),"invalid upper bound");
  require(bool(header>>dt) && !(header>>extra) && std::isfinite(dt) && dt>0.,"positive finite dt and no extra header required");
  Input input{nr_sbp::Grid(shape,lower,upper),dt,{}};
  input.requests.resize(static_cast<std::size_t>(requests));
  for(auto& request:input.requests) {
    read_fields(request.q,input.grid.cells());
    for(std::size_t a=0;a<3;++a) for(std::size_t s=0;s<2;++s)
      read_fields(request.targets[2*a+s],nr_sat::Face(input.grid,a,s).points());
  }
  char extra_byte=0;require(!std::cin.get(extra_byte),"trailing payload forbidden");
  return input;
}

std::string loaded_path(const std::wstring& module) {
  const auto handle=GetModuleHandleW(module.c_str());
  require(handle!=nullptr,"required runtime not loaded");
  std::array<wchar_t,32768> path{};
  const auto size=GetModuleFileNameW(handle,path.data(),static_cast<DWORD>(path.size()));
  require(size>0 && size<path.size(),"runtime identity unavailable");
  return std::filesystem::path(path.data()).u8string();
}

int team_size(const std::string& text) {
  std::size_t used=0;const int requested=std::stoi(text,&used);
  require(used==text.size() && (requested==1||requested==2||requested==4),"qualified thread counts are1,2,4");
  omp_set_dynamic(0);omp_set_num_threads(requested);
  int actual=0;
#pragma omp parallel
  {
#pragma omp single
    actual=omp_get_num_threads();
  }
  require(actual==requested,"OpenMP team mismatch");return actual;
}

void report_json(const nr_sat::StageReport& report) {
  std::cout<<"{\"cfl\":"<<report.cfl<<",\"axis_max_speeds\":["<<report.speeds[0]<<','<<report.speeds[1]<<','<<report.speeds[2]
    <<"],\"basis_builds\":"<<report.basis_builds<<",\"coefficients_sha256\":"<<std::quoted(report.coefficients_sha256)
    <<",\"max_basis_condition\":"<<report.max_condition<<",\"max_characteristic_residual\":"<<report.max_residual
    <<",\"min_lapse\":"<<report.min_lapse<<",\"min_chi\":"<<report.min_chi<<",\"det_h_max_error\":"<<report.det_error
    <<",\"sat_max_abs\":"<<*std::max_element(report.face_max.begin(),report.face_max.end())<<",\"faces\":[";
  for(std::size_t i=0;i<6;++i) {
    if(i) std::cout<<',';
    std::cout<<"{\"axis\":"<<i/2<<",\"side\":"<<i%2<<",\"sat_max_abs\":"<<report.face_max[i]<<'}';
  }
  std::cout<<"]}";
}

void output(const Input& input,const std::vector<nr_sat::StageResult>& results,int threads,
            const std::string& openmp,const std::string& blas,const std::string& config) {
  nr_sbp::Values packed;
  for(const auto& result:results) {
    for(const auto* fields:{&result.bulk,&result.coupled}) for(const auto& field:*fields)
      packed.insert(packed.end(),field.begin(),field.end());
    for(const auto& face:result.penalties) for(const auto& field:face)
      packed.insert(packed.end(),field.begin(),field.end());
  }
  require(nr_native::finite(packed),"nonfinite output forbidden");
  std::cout<<"{\"schema\":\"nr-native-sat-output-v1\",\"shape\":["<<input.grid.shape[0]<<','<<input.grid.shape[1]<<','<<input.grid.shape[2]
    <<"],\"spacing\":["<<input.grid.spacing[0]<<','<<input.grid.spacing[1]<<','<<input.grid.spacing[2]
    <<"],\"requests\":"<<results.size()<<",\"dt\":"<<input.dt<<",\"threads_observed\":"<<threads
    <<",\"openmp_version\":"<<_OPENMP<<",\"openmp_runtime\":"<<std::quoted(openmp)<<",\"blas_runtime\":"<<std::quoted(blas)
    <<",\"blas_config\":"<<std::quoted(config)<<",\"blas_threads\":1,\"values\":"<<packed.size()
    <<",\"encoding\":\"little-endian-float64\",\"payload_order\":\"per-request: bulk58,coupled58,axis0-left,right,axis1-left,right,axis2-left,right; slot-major\","
    <<"\"frozen_equation_sha256\":"<<std::quoted(nr_sbp::frozen_equation_sha)
    <<",\"coefficient_cache\":\"exact bytes within one RHS only\",\"tau_inverse\":1,\"sat_applied\":true,\"component_only\":true,"
    <<"\"evolution_backend\":false,\"native_checkpoint_supported\":false,\"physical_gate\":false,"
    <<"\"auxiliaries_reconstructed\":false,\"algebraic_projection\":false,\"fixed_halo\":false,"
    <<"\"common_symmetrizer_validated\":false,\"nonlinear_stability_validated\":false,\"scientificPayloadWriteback\":false,\"reports\":[";
  for(std::size_t i=0;i<results.size();++i) {if(i) std::cout<<',';report_json(results[i].report);}
  std::cout<<"]}\n";
  std::cout.write(reinterpret_cast<const char*>(packed.data()),static_cast<std::streamsize>(packed.size()*sizeof(double)));
  require(bool(std::cout),"SAT output stream failed");
}
} // namespace

int main(int argc,char** argv) {
  try {
    require(argc==7 && std::string(argv[1])=="--lapack" && std::string(argv[3])=="--mode"
            && std::string(argv[4])=="rhs" && std::string(argv[5])=="--threads",
            "usage: executable --lapack ABSOLUTE_DLL --mode rhs --threads1|2|4");
    const auto threads=team_size(argv[6]);
    require(_setmode(_fileno(stdin),_O_BINARY)!=-1 && _setmode(_fileno(stdout),_O_BINARY)!=-1,"binary pipe mode unavailable");
    nr_principal::classic_io();
    const std::filesystem::path library(argv[2]);
    const nr_native::Lapack lapack(library);
    const auto blas=loaded_path(library.filename().wstring());
    require(std::filesystem::equivalent(library,std::filesystem::path(blas)),"loaded LAPACK identity differs from request");
    const auto openmp=loaded_path(L"vcomp140.dll");
    auto input=read_input();
    std::vector<nr_sat::StageResult> results;
    for(auto& request:input.requests) {
      const nr_sbp::State state(input.grid,std::move(request.q),1.);
      results.push_back(nr_sat::rhs(lapack,state,request.targets,input.dt));
    }
    output(input,results,threads,openmp,blas,lapack.config());
    return 0;
  } catch(const std::exception& error) {
    std::cerr<<"native SAT component rejected: "<<error.what()<<'\n';return 1;
  }
}
