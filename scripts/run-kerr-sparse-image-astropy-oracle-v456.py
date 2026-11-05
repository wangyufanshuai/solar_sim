from __future__ import annotations
import hashlib,json,os
from pathlib import Path
import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
ROOT=Path.cwd();SOURCE=ROOT/"dist/science/kerr-sparse-science-image-v456/header-fixture.json";OUT=ROOT/"dist/science/kerr-sparse-science-image-v456/astropy-oracle.json";fixture=json.loads(SOURCE.read_text(encoding="utf-8"));header=fits.Header()
for card in fixture["headerCards"]:header[card["keyword"]]=(card["value"],card["comment"])
serialized=header.tostring(sep="\n",endcard=True,padding=False);reparsed=fits.Header.fromstring(serialized,sep="\n");mismatches=[]
for card in fixture["headerCards"]:
    if reparsed[card["keyword"]]!=card["value"]:mismatches.append(card["keyword"])
wcs=WCS(header,naxis=2);world=np.array([[row["alphaM"],row["betaM"]] for row in fixture["worldRows"]],dtype=float);pixels=wcs.wcs_world2pix(world,1);expected=np.array([[row["continuousPixelX"],row["continuousPixelY"]] for row in fixture["coordinateRows"]],dtype=float);maximum=float(np.max(np.abs(pixels-expected)))
unsigned={"version":"v456-kerr-sparse-image-astropy-oracle-v1","generatedAt":"2026-07-30T00:00:00Z","status":"qualified-astropy-header-roundtrip-and-wcs-replay-no-hdu-written","astropyVersion":__import__("astropy").__version__,"headerCardCount":len(fixture["headerCards"]),"headerRoundtripMismatchCount":len(mismatches),"headerRoundtripMismatchKeywords":mismatches,"maximumPixelDifference":maximum,"wcsPixelRows":[{"rayId":fixture["coordinateRows"][index]["rayId"],"pixelX":float(pixel[0]),"pixelY":float(pixel[1])} for index,pixel in enumerate(pixels)],"fitsHduEmitted":False,"fitsFileEmitted":False,"pngEmitted":False,"scienceRasterAllowed":False};canonical=json.dumps({key:value for key,value in unsigned.items() if key!="generatedAt"},ensure_ascii=False,separators=(",",":"),sort_keys=True).encode("utf-8");artifact={**unsigned,"artifactSha256":hashlib.sha256(canonical).hexdigest()};OUT.parent.mkdir(parents=True,exist_ok=True);part=OUT.with_name(f"{OUT.name}.{os.getpid()}.part");part.write_text(json.dumps(artifact,ensure_ascii=False,indent=2)+"\n",encoding="utf-8");part.replace(OUT);print(json.dumps({"status":artifact["status"],"astropyVersion":artifact["astropyVersion"],"headerCards":artifact["headerCardCount"],"headerMismatchCount":len(mismatches),"maximumPixelDifference":maximum,"fitsFilesEmitted":0},indent=2))
