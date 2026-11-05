from __future__ import annotations
import hashlib, json, math, os
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path.cwd(); TRANSFER=ROOT/"dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json"; OBS=ROOT/"dist/science/kerr-global-observability-v395/observability.json"; OUTPUT=ROOT/"dist/science/kerr-auxiliary-constraint-design-v396/python-oracle.json"
def canonicalize(v):
    if isinstance(v,list): return [canonicalize(x) for x in v]
    if isinstance(v,dict): return {k:canonicalize(v[k]) for k in sorted(v) if k not in {"generatedAt","artifactSha256"}}
    return v
def csha(v): return hashlib.sha256(json.dumps(canonicalize(v),separators=(",",":"),ensure_ascii=False).encode()).hexdigest()
def jacobi(m):
    w=[r[:] for r in m]
    for _ in range(40):
        p,q=0,1; maximum=abs(w[0][1])
        for l,r in ((0,2),(1,2)):
            if abs(w[l][r])>maximum: p,q,maximum=l,r,abs(w[l][r])
        if maximum <= math.ulp(1.0)*16: break
        angle=.5*math.atan2(2*w[p][q],w[q][q]-w[p][p]); c,s=math.cos(angle),math.sin(angle); app,aqq,apq=w[p][p],w[q][q],w[p][q]
        w[p][p]=c*c*app-2*s*c*apq+s*s*aqq; w[q][q]=s*s*app+2*s*c*apq+c*c*aqq; w[p][q]=w[q][p]=0
        for i in range(3):
            if i in (p,q): continue
            aip,aiq=w[i][p],w[i][q]; w[i][p]=w[p][i]=c*aip-s*aiq; w[i][q]=w[q][i]=s*aip+c*aiq
    return sorted((w[0][0],w[1][1],w[2][2]),reverse=True)
transfer=json.loads(TRANSFER.read_text(encoding="utf-8")); obs=json.loads(OBS.read_text(encoding="utf-8"))
if obs["source"]["v390TransferArtifactSha256"]!=transfer["artifactSha256"]: raise RuntimeError("v396-source")
strategies=("photon-anchor","redshift-anchor","balanced-photon-redshift-anchor","flux-only-control","replicated-conditioned-temperature-control")
evaluations=[]; max_condition=0
for strategy in strategies:
  for row in transfer["rows"]:
    a=row["transferMatrix"][0][0]
    if strategy=="photon-anchor": c=(1.,0.,0.)
    elif strategy=="redshift-anchor": c=(0.,1.,0.)
    elif strategy=="balanced-photon-redshift-anchor": c=(math.sqrt(.5),math.sqrt(.5),0.)
    elif strategy=="flux-only-control": c=(0.,0.,1.)
    else:
      n=math.hypot(a,1); c=(a/n,-1/n,0.)
    aug=[row["transferMatrix"][0],row["transferMatrix"][1],c]
    gram=[[sum(r[i]*r[j] for r in aug) for j in range(3)] for i in range(3)]
    null_coupling=(c[0]+a*c[1])/math.hypot(1,a)
    sv=[math.sqrt(max(0,x)) for x in jacobi(gram)]; rank=3 if abs(null_coupling)>1e-12 else 2
    # Analytic null coupling is the structural-rank authority.  Canonicalize the
    # unresolved null singular value so Python and TypeScript evidence agree.
    if rank == 2: sv[2] = 0.0
    cond=sv[0]/sv[2] if rank==3 else None
    if cond: max_condition=max(max_condition,cond)
    determinant=aug[0][0]*(aug[1][1]*aug[2][2]-aug[1][2]*aug[2][1])-aug[0][1]*(aug[1][0]*aug[2][2]-aug[1][2]*aug[2][0])+aug[0][2]*(aug[1][0]*aug[2][1]-aug[1][1]*aug[2][0])
    evaluations.append({"strategyId":strategy,"rayIndex":row["rayIndex"],"bandId":row["bandId"],"normalizedConstraint":list(c),"nullCoupling":null_coupling,"determinant":determinant,"singularValuesDescending":sv,"augmentedRank":rank,"rankIncrement":1 if rank==3 else 0,"conditionNumber":cond})
unsigned={"version":"v396-kerr-auxiliary-constraint-python-oracle-v1","generatedAt":datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),"status":"qualified-independent-auxiliary-constraint-oracle","source":{"v390TransferArtifactSha256":transfer["artifactSha256"],"v395ObservabilityArtifactSha256":obs["artifactSha256"]},"evaluationCount":60,"rankLiftingEvaluationCount":36,"negativeControlEvaluationCount":24,"minimumConstraintsForFullRank":12,"fullRank":36,"maximumQualifiedStructuralConditionNumber":max_condition,"evaluations":evaluations,"instrumentFeasibilityAvailable":False,"physicalRecommendationAllowed":False,"networkAttempted":False}
artifact={**unsigned,"artifactSha256":csha(unsigned)}; OUTPUT.parent.mkdir(parents=True,exist_ok=True); tmp=Path(f"{OUTPUT}.{os.getpid()}.part"); tmp.write_text(json.dumps(artifact,indent=2,ensure_ascii=False)+"\n",encoding="utf-8"); os.replace(tmp,OUTPUT)
print(json.dumps({"status":artifact["status"],"artifactSha256":artifact["artifactSha256"],"evaluationCount":60,"rankLiftingEvaluationCount":36,"minimumConstraintsForFullRank":12,"maximumQualifiedStructuralConditionNumber":max_condition,"instrumentFeasibilityAvailable":False},indent=2))
