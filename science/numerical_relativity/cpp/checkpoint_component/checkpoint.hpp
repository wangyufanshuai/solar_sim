#pragma once
#include "../rk4_component/rk4.hpp"
#include "identity.hpp"
#include <fstream>
#include <cwctype>

namespace nr_checkpoint {
using nr_sbp::require;
using Bytes=std::vector<unsigned char>;
using Digest=std::array<unsigned char,32>;
using Path=std::filesystem::path;
inline constexpr char magic[]="NR-SBP42-CKPT-1\n";
inline constexpr char kernel_id[]="nr-k3-cpp-sbp42-sat-rk4-shadow";
inline constexpr std::uint64_t max_bytes=32ULL*1024*1024;
inline constexpr std::uint64_t c_floor=3ULL*1024*1024*1024;
inline constexpr std::uint64_t e_floor=4ULL*1024*1024*1024+32ULL*1024*1024;

struct Handle {
  HANDLE value=INVALID_HANDLE_VALUE;
  explicit Handle(HANDLE handle):value(handle) {require(value!=INVALID_HANDLE_VALUE,"Windows file open failed");}
  ~Handle(){if(value!=INVALID_HANDLE_VALUE) CloseHandle(value);}
  Handle(const Handle&)=delete;
  Handle& operator=(const Handle&)=delete;
};
inline Digest digest(const Bytes& data) {
  BCRYPT_ALG_HANDLE algorithm=nullptr;BCRYPT_HASH_HANDLE hash=nullptr;
  require(BCryptOpenAlgorithmProvider(&algorithm,BCRYPT_SHA256_ALGORITHM,nullptr,0)>=0,"SHA256 provider failed");
  try {
    require(BCryptCreateHash(algorithm,&hash,nullptr,0,nullptr,0,0)>=0,"SHA256 create failed");
    require(data.size()<=0xffffffffULL,"SHA256 size bound");
    require(BCryptHashData(hash,const_cast<PUCHAR>(data.data()),static_cast<ULONG>(data.size()),0)>=0,"SHA256 update failed");
    Digest out{};require(BCryptFinishHash(hash,out.data(),32,0)>=0,"SHA256 finish failed");
    BCryptDestroyHash(hash);BCryptCloseAlgorithmProvider(algorithm,0);return out;
  } catch(...) {if(hash) BCryptDestroyHash(hash);BCryptCloseAlgorithmProvider(algorithm,0);throw;}
}
inline std::string hex(const Digest& value) {
  std::ostringstream out;out<<std::hex<<std::setfill('0');
  for(auto byte:value) out<<std::setw(2)<<static_cast<unsigned int>(byte);
  return out.str();
}
inline bool is_sha(const std::string& value) {
  return value.size()==64 && std::all_of(value.begin(),value.end(),[](char c){return (c>='0'&&c<='9')||(c>='a'&&c<='f');});
}
inline void append(Bytes& out,const void* data,std::size_t count) {
  const auto* p=static_cast<const unsigned char*>(data);out.insert(out.end(),p,p+count);
}
inline void u64(Bytes& out,std::uint64_t value) {for(int i=0;i<8;++i) out.push_back(static_cast<unsigned char>(value>>(8*i)));}
inline Bytes state_bytes(const nr_sbp::Fields& q) {
  Bytes out;for(const auto& slot:q) append(out,slot.data(),slot.size()*sizeof(double));return out;
}
struct Reader {
  const Bytes& data;std::size_t offset=0;
  Bytes take(std::uint64_t count) {
    require(count<=data.size()-offset,"truncated checkpoint field");
    Bytes out(data.begin()+offset,data.begin()+offset+static_cast<std::size_t>(count));offset+=static_cast<std::size_t>(count);return out;
  }
  std::uint64_t number() {
    const auto b=take(8);std::uint64_t out=0;for(int i=0;i<8;++i) out|=std::uint64_t(b[i])<<(8*i);return out;
  }
};
inline std::wstring lower(std::wstring text) {for(auto& c:text)c=static_cast<wchar_t>(std::towlower(c));return text;}
inline Path safe_path(const Path& requested,bool directory=false) {
  require(requested.is_absolute(),"absolute local workspace tmp path required");
  const auto path=requested.lexically_normal();
  const auto name=lower(path.generic_wstring()),root=lower(Path(tmp_root).generic_wstring());
  require(name.size()>root.size() && name.substr(0,root.size()+1)==root+L"/","path must remain below workspace tmp");
  require(name.find(L':',2)==std::wstring::npos,"alternate stream forbidden");
  Path prefix;
  for(const auto& part:path) {
    prefix/=part;
    if(prefix==path.root_name()) continue;
    const auto flags=GetFileAttributesW(prefix.c_str());
    require(flags!=INVALID_FILE_ATTRIBUTES && !(flags&FILE_ATTRIBUTE_REPARSE_POINT),"existing non-reparse path required");
  }
  const auto flags=GetFileAttributesW(path.c_str());
  require(bool(flags&FILE_ATTRIBUTE_DIRECTORY)==directory,"file/directory type mismatch");
  require(lower(std::filesystem::canonical(path).generic_wstring())==name,"resolved path mismatch");
  return path;
}
inline Bytes read_file(const Path& path,std::uint64_t cap=max_bytes) {
  Handle h(CreateFileW(path.c_str(),GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_FLAG_OPEN_REPARSE_POINT,nullptr));
  BY_HANDLE_FILE_INFORMATION info{};require(GetFileInformationByHandle(h.value,&info)!=0,"file information failed");
  require(!(info.dwFileAttributes&(FILE_ATTRIBUTE_REPARSE_POINT|FILE_ATTRIBUTE_DIRECTORY)),"regular non-reparse file required");
  const auto size=(std::uint64_t(info.nFileSizeHigh)<<32)|info.nFileSizeLow;
  require(size>0 && size<=cap,"bounded nonempty file required");
  Bytes bytes(static_cast<std::size_t>(size));DWORD got=0;
  require(ReadFile(h.value,bytes.data(),static_cast<DWORD>(bytes.size()),&got,nullptr)!=0 && got==bytes.size(),"file read incomplete");return bytes;
}
inline void reserve(std::uint64_t extra) {
  ULARGE_INTEGER c{},e{};
  require(GetDiskFreeSpaceExW(L"C:\\",&c,nullptr,nullptr) && GetDiskFreeSpaceExW(L"E:\\",&e,nullptr,nullptr),"disk reserve unavailable");
  require(c.QuadPart>=c_floor,"C reserve reached");require(e.QuadPart>=e_floor+extra,"E reserve and checkpoint budget required");
  wchar_t fs[32]{};require(GetDriveTypeW(L"E:\\")==DRIVE_FIXED && GetVolumeInformationW(L"E:\\",nullptr,0,nullptr,nullptr,nullptr,fs,32),"local E volume required");
  require(std::wstring(fs)==L"NTFS","qualified local NTFS required");
}
inline std::uint64_t integer(const std::string& text) {
  require(!text.empty() && std::all_of(text.begin(),text.end(),[](char c){return c>='0'&&c<='9';}),"unsigned decimal required");
  std::size_t n=0;const auto out=std::stoull(text,&n);require(n==text.size(),"invalid integer");return out;
}
struct Plan {
  nr_sbp::Grid grid;std::uint64_t start,steps;double dt;
  nr_sbp::Fields initial;std::vector<nr_sat::Targets> targets;
};
inline std::string line(std::istream& in) {
  std::array<char,513> bytes{};require(bool(in.getline(bytes.data(),static_cast<std::streamsize>(bytes.size()))),"bounded complete plan header required");return bytes.data();
}
inline void fields(std::istream& in,nr_sbp::Fields& q,std::size_t cells) {
  for(auto& slot:q) {slot.resize(cells);require(bool(in.read(reinterpret_cast<char*>(slot.data()),static_cast<std::streamsize>(cells*8))),"truncated FP64 fields");require(nr_native::finite(slot),"finite fields required");}
}
inline Plan parse_plan(const Bytes& bytes) {
  require(bytes.size()<=16*1024*1024,"bounded plan required");
  std::istringstream in(std::string(bytes.begin(),bytes.end()),std::ios::binary);in.imbue(std::locale::classic());
  std::istringstream head(line(in));head.imbue(std::locale::classic());
  std::string schema,start,steps,extra;int variables=0;std::array<std::size_t,3> shape{};
  std::array<double,3> lo{},hi{};double dt=0;
  require(bool(head>>schema>>variables>>shape[0]>>shape[1]>>shape[2]) && schema=="nr-native-rk4-input-v1" && variables==58,"canonical58 qualified RK4 plan required");
  for(auto& x:lo) require(bool(head>>x),"invalid lower coordinate");
  for(auto& x:hi) require(bool(head>>x),"invalid upper coordinate");
  require(bool(head>>start>>steps>>dt) && !(head>>extra),"explicit plan indices/dt required");
  const auto n=integer(start),count=integer(steps);
  require(count>=1 && count<=4 && n<=(1ULL<<52)-count,"bounded1..4 plan steps required");
  require(std::isfinite(dt) && dt>0.,"positive finite dt required");
  Plan plan{nr_sbp::Grid(shape,lo,hi),n,count,dt,{}, {}};fields(in,plan.initial,plan.grid.cells());
  plan.targets.resize(static_cast<std::size_t>(2*count+1));
  for(std::size_t k=0;k<plan.targets.size();++k) {
    std::istringstream label(line(in));std::string tag,tick;
    require(bool(label>>tag>>tick) && !(label>>extra) && tag=="face-targets-v1" && integer(tick)==2*n+k,"exact contiguous boundary half-step labels required");
    for(std::size_t a=0;a<3;++a) for(std::size_t s=0;s<2;++s) fields(in,plan.targets[k][2*a+s],nr_sat::Face(plan.grid,a,s).points());
  }
  char surplus=0;require(!in.get(surplus),"trailing plan bytes forbidden");return plan;
}
inline std::string binding(const std::string& exe,const std::string& blas,const std::string& omp) {
  std::ostringstream out;out<<"release=solar-sim-mainline-a\nmethod="<<nr_rk4::method_id<<"\nkernel="<<kernel_id
    <<"\nversion=0.1.0\nsource="<<source_sha<<"\nexe="<<exe<<"\nblas="<<blas<<"\nopenmp="<<omp
    <<"\ncontract=canonical58;G=c=1;cartesian3d;SBP42;analyticSAT;RK4;no-projection;f=3alphaChi;mu=.2Chi;tau=1;strict-fp\nvariables=";
  for(std::size_t i=0;i<58;++i) {if(i)out<<',';out<<nr_sbp::kVariableNames[i];}out<<'\n';return out.str();
}
inline Bytes encode(const std::string& identity,std::uint64_t step,const Bytes& plan,const nr_sbp::Fields& q) {
  Bytes out;append(out,magic,16);u64(out,identity.size());append(out,identity.data(),identity.size());
  u64(out,step);u64(out,plan.size());append(out,plan.data(),plan.size());const auto state=state_bytes(q);
  u64(out,state.size());append(out,state.data(),state.size());const auto sha=digest(out);append(out,sha.data(),sha.size());
  require(out.size()<=max_bytes,"checkpoint size exceeds contract");return out;
}
struct Checkpoint {Bytes plan;std::uint64_t step;nr_sbp::Fields q;};
inline Checkpoint decode(const Bytes& bytes,const std::string& identity,const std::string& plan_sha,const nr_native::Lapack& lapack) {
  require(bytes.size()>=80 && bytes.size()<=max_bytes,"checkpoint size bound");
  const Bytes body(bytes.begin(),bytes.end()-32);const auto hash=digest(body);
  require(std::equal(hash.begin(),hash.end(),bytes.end()-32),"checkpoint SHA256 mismatch");
  Reader r{body};const auto tag=r.take(16);require(std::equal(tag.begin(),tag.end(),magic),"checkpoint method magic mismatch");
  const auto length=r.number();require(length<=4096,"binding length bound");const auto id=r.take(length);
  require(std::string(id.begin(),id.end())==identity,"checkpoint method/source/executable/runtime/ordering binding mismatch");
  const auto step=r.number(),plan_length=r.number();require(plan_length<=16*1024*1024,"plan size bound");auto raw=r.take(plan_length);
  require(hex(digest(raw))==plan_sha,"checkpoint origin plan SHA256 mismatch");const auto plan=parse_plan(raw);
  require(step>plan.start && step<=plan.start+plan.steps,"checkpoint accepted step outside plan");
  const auto size=r.number();require(size==58*plan.grid.cells()*8,"canonical58 endpoint size mismatch");
  const auto data=r.take(size);require(r.offset==body.size(),"trailing checkpoint bytes forbidden");
  std::istringstream stream(std::string(data.begin(),data.end()),std::ios::binary);nr_sbp::Fields q;fields(stream,q,plan.grid.cells());
  nr_rk4::validate_endpoint(lapack,plan.grid,q);return {std::move(raw),step,std::move(q)};
}
struct Fault {std::string phase="none";std::uint64_t step=0;};
inline void fault(const Fault& f,const char* phase,std::uint64_t step) {if(f.phase==phase && f.step==step) ExitProcess(86);}
inline Path filename(const Path& directory,std::uint64_t step) {
  std::ostringstream name;name<<"step-"<<std::setfill('0')<<std::setw(16)<<step<<".nrck";return directory/name.str();
}
inline void publish(const Path& final,const Bytes& data,const Fault& f,std::uint64_t step) {
  reserve(data.size()+1024*1024);
  require(GetFileAttributesW(final.c_str())==INVALID_FILE_ATTRIBUTES && GetLastError()==ERROR_FILE_NOT_FOUND,"checkpoint target already exists or inaccessible");
  const Path partial=final.wstring()+L".partial";
  Handle file(CreateFileW(partial.c_str(),GENERIC_READ|GENERIC_WRITE|DELETE,0,nullptr,CREATE_NEW,FILE_ATTRIBUTE_NORMAL,nullptr));
  const auto middle=static_cast<DWORD>(data.size()/2);DWORD written=0;
  require(WriteFile(file.value,data.data(),middle,&written,nullptr) && written==middle,"checkpoint first write failed");fault(f,"half-write",step);
  const auto tail=static_cast<DWORD>(data.size()-middle);
  require(WriteFile(file.value,data.data()+middle,tail,&written,nullptr) && written==tail,"checkpoint final write failed");
  require(FlushFileBuffers(file.value)!=0,"checkpoint flush failed");fault(f,"flushed",step);
  // The Win32 wrapper requires a NUL-terminated name even though Length excludes it.
  // Omitting this terminator can scan past the buffer and publish a different name.
  const auto wide=final.wstring();const auto count=offsetof(FILE_RENAME_INFO,FileName)+(wide.size()+1)*sizeof(wchar_t);
  std::vector<unsigned char> buffer(count,0);auto* rename=reinterpret_cast<FILE_RENAME_INFO*>(buffer.data());
  rename->ReplaceIfExists=FALSE;rename->RootDirectory=nullptr;rename->FileNameLength=static_cast<DWORD>(wide.size()*sizeof(wchar_t));
  std::memcpy(rename->FileName,wide.data(),wide.size()*sizeof(wchar_t));
  if(!SetFileInformationByHandle(file.value,FileRenameInfo,rename,static_cast<DWORD>(count)))
    throw std::runtime_error("checkpoint no-replace publication failed; Win32="+std::to_string(GetLastError()));
  std::array<wchar_t,32768> actual{};
  const auto length=GetFinalPathNameByHandleW(file.value,actual.data(),static_cast<DWORD>(actual.size()),FILE_NAME_NORMALIZED|VOLUME_NAME_DOS);
  require(length>0 && length<actual.size(),"published handle path unavailable");
  const std::wstring normalized(actual.data());
  require(normalized.substr(0,4)==L"\\\\?\\" && lower(Path(normalized.substr(4)).generic_wstring())==lower(final.generic_wstring()),"published handle path differs from exact requested checkpoint");
  // Tests exit this owned process here, never a user process or another run.
  fault(f,"published",step);
}
} // namespace nr_checkpoint
