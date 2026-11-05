from __future__ import annotations
import bisect, hashlib, json, math, os
from pathlib import Path

ROOT = Path.cwd(); PHOTON = ROOT / "dist/science/kerr-science-photon-bands-v328/photon-radiance.json"; PROFILE = ROOT / "dist/science/measured-visible-throughput-v383/profile.csv"; SPECTRAL = ROOT / "dist/science/kerr-polarimeter-spectral-response-v413/spectral-response.json"; OUTPUT = ROOT / "dist/science/kerr-polarimeter-detector-count-v414/python-oracle.json"; EXPECTED_SPECTRAL = "f4a10d65ca5e0c49495cf5be6b3a27298a4048da7acbdaba264905d3cf4ccd6f"; H = 6.62607015e-34; C = 299792458.0; KB = 1.380649e-23; STOKES = [1.0, 0.08, -0.05, 0.01]; BASE = [[0.5,0.4,0,0],[0.5,-0.4,0,0],[0.5,0,0.4,0.2],[0.5,0,-0.4,0.2]]; ADJ = [[0.005,0.003,0.001,0],[-0.004,0.002,-0.001,0],[0.002,0.001,-0.002,0.0005],[-0.003,-0.001,-0.002,-0.0005]]; AREA=.5; SOLID=1e-12; EXPOSURE=120.0; QE=.82; DARK=.01; BACKGROUND=3.0; READ=2.0; GAIN=1.5
def canonicalize(value):
    if isinstance(value,list): return [canonicalize(entry) for entry in value]
    if isinstance(value,dict): return {key:canonicalize(value[key]) for key in sorted(value) if key not in {"generatedAt","artifactSha256"}}
    return value
def canonical_sha(value): return hashlib.sha256(json.dumps(canonicalize(value),separators=(",",":"),ensure_ascii=False).encode()).hexdigest()
def cross(value):
    if isinstance(value,bool) or value is None or isinstance(value,str): return value
    if isinstance(value,(int,float)):
        coefficient, exponent = format(0.0 if float(value)==0 else float(value),".16e").split("e"); return f"{coefficient}e{int(exponent):+d}"
    if isinstance(value,list): return [cross(entry) for entry in value]
    if isinstance(value,dict): return {key:cross(value[key]) for key in sorted(value) if key not in {"generatedAt","artifactSha256","crossLanguageCanonicalSha256"}}
    raise RuntimeError("v414-cross-type")
def cross_sha(value): return hashlib.sha256(json.dumps(cross(value),separators=(",",":"),ensure_ascii=False).encode()).hexdigest()
def transpose(matrix): return [list(column) for column in zip(*matrix)]
def multiply(left,right): return [[sum(left[row][inner]*right[inner][column] for inner in range(len(right))) for column in range(len(right[0]))] for row in range(len(left))]
def node_matrix(index):
    delta=index-2; return [[BASE[row][column]+delta*ADJ[row][column] for column in range(4)] for row in range(4)]
def node_cov(index): return [[1e-8*(1+index*.05)*(1+row*.01) if row==column else 0.0 for column in range(16)] for row in range(16)]
def response(wavelength):
    interval=min(3,max(0,int((wavelength-4e-7)//1e-7))); lower=4e-7+interval*1e-7; weight=(wavelength-lower)/1e-7; weight=max(0.0,min(1.0,weight)); matrices=[node_matrix(interval),node_matrix(interval+1)]; matrix=[[matrices[0][row][column]*(1-weight)+matrices[1][row][column]*weight for column in range(4)] for row in range(4)]; return interval,weight,matrix
with SPECTRAL.open(encoding="utf-8") as handle: spectral=json.load(handle)
with PHOTON.open(encoding="utf-8") as handle: photon=json.load(handle)
if spectral.get("artifactSha256")!=EXPECTED_SPECTRAL: raise RuntimeError("v414-v413-lock")
profile=[]
for line in PROFILE.read_text(encoding="utf-8").splitlines()[1:]:
    wavelength,throughput=line.split(","); profile.append((float(wavelength),float(throughput)))
wavelengths=[row[0] for row in profile]
def throughput(wavelength):
    index=bisect.bisect_left(wavelengths,wavelength)
    if index<=0:return profile[0][1]
    if index>=len(profile):return profile[-1][1]
    left,right=profile[index-1],profile[index]; fraction=(wavelength-left[0])/(right[0]-left[0]); return left[1]+fraction*(right[1]-left[1])
def photon_spectral(wavelength,temperature,redshift):
    observed=C/wavelength; emitted=observed/redshift; emitted_energy=2*H*emitted**3/(C**2*math.expm1(H*emitted/(KB*temperature))); observed_energy=redshift**3*emitted_energy; return observed_energy/(H*observed)*C/wavelength**2
nodes=[node_cov(index) for index in range(5)]; crosses=[[[.2*math.sqrt(nodes[index][row][row]*nodes[index+1][row][row]) if row==column else 0.0 for column in range(16)] for row in range(16)] for index in range(4)]; joint=[[0.0]*80 for _ in range(80)]
for node in range(5):
    for row in range(16):
        for column in range(16):joint[node*16+row][node*16+column]=nodes[node][row][column]
for interval in range(4):
    for row in range(16):
        for column in range(16):joint[interval*16+row][(interval+1)*16+column]=crosses[interval][row][column];joint[(interval+1)*16+column][interval*16+row]=crosses[interval][row][column]
def integrate(ray):
    steps=32768; lower=4e-7; upper=7e-7; width=(upper-lower)/steps; channel_sum=[0.0]*4; jacobian=[[0.0]*80 for _ in range(4)]
    for index in range(steps+1):
        wavelength=lower+index*width; simpson=1 if index in (0,steps) else 2 if index%2==0 else 4; interval,weight,matrix=response(wavelength); base=photon_spectral(wavelength,ray["effectiveTemperatureK"],ray["redshiftFactor"])*throughput(wavelength); lower_weight=1-weight
        for channel in range(4):
            channel_sum[channel]+=simpson*base*sum(matrix[channel][component]*STOKES[component] for component in range(4))
            for component in range(4):
                jacobian[channel][interval*16+channel*4+component]+=simpson*base*lower_weight*STOKES[component]
                jacobian[channel][(interval+1)*16+channel*4+component]+=simpson*base*weight*STOKES[component]
    channel_integrals=[value*width/3 for value in channel_sum]; jacobian=[[value*width/3*AREA*SOLID*EXPOSURE*QE for value in row] for row in jacobian]; calibration=multiply(multiply(jacobian,joint),transpose(jacobian)); rows=[]
    for channel in range(4):
        photons=channel_integrals[channel]*AREA*SOLID*EXPOSURE; electrons=photons*QE; dark=DARK*EXPOSURE; total=electrons+dark+BACKGROUND; counting=electrons+dark+BACKGROUND+READ**2; rows.append({"rayIndex":ray["rayIndex"],"channelIndex":channel,"sourcePhotonExpectation":photons,"sourceElectronExpectation":electrons,"totalElectronExpectation":total,"expectedAdu":total/GAIN,"countingVarianceElectronSquared":counting,"calibrationVarianceElectronSquared":calibration[channel][channel]})
    return {"rayIndex":ray["rayIndex"],"rows":rows,"calibrationCovarianceElectronSquared":calibration}
rays=[integrate(ray) for ray in photon["view"]["rays"]]
unsigned={"version":"v414-kerr-polarimeter-detector-count-python-oracle-v1","generatedAt":spectral["generatedAt"],"status":"qualified-independent-detector-count-fixture-oracle-not-measured-authority","source":{"v413SpectralArtifactSha256":EXPECTED_SPECTRAL},"quadrature":"frequency-independent-wavelength-simpson-32768-with-linear-throughput-and-response","rays":rays,"rayCount":4,"rowCount":16,"measuredDetectorAuthorityGranted":False,"observedCountsAvailable":False,"networkAttempted":False}; artifact={**unsigned,"artifactSha256":canonical_sha(unsigned),"crossLanguageCanonicalSha256":cross_sha(unsigned)}; OUTPUT.parent.mkdir(parents=True,exist_ok=True); temporary=Path(f"{OUTPUT}.{os.getpid()}.part"); temporary.write_text(json.dumps(artifact,indent=2)+"\n",encoding="utf-8"); os.replace(temporary,OUTPUT); print(json.dumps({"status":artifact["status"],"artifactSha256":artifact["artifactSha256"],"rowCount":16,"maximumExpectedElectron":max(row["totalElectronExpectation"] for ray in rays for row in ray["rows"]),"measuredAuthorityGranted":False},indent=2))
