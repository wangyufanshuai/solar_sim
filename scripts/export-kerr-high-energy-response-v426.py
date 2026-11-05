from __future__ import annotations

import csv
import hashlib
import json
import os
from pathlib import Path

import numpy as np
from astropy.io import fits
from PIL import Image, ImageDraw, ImageFont


ROOT=Path.cwd();OUT=ROOT/"dist/science/kerr-high-energy-response-v426";ARTIFACT=OUT/"response-contract.json";CSV_PATH=OUT/"fixture-response-structure.csv";FITS_PATH=OUT/"fixture-response-structure.fits";PNG_PATH=OUT/"response-architecture-diagnostic.png";MANIFEST=OUT/"export-manifest.json"
def file_sha(path:Path)->str:
    digest=hashlib.sha256()
    with path.open("rb") as handle:
        while chunk:=handle.read(1024*1024):digest.update(chunk)
    return digest.hexdigest()
def atomic(path:Path,payload:bytes)->None:
    temporary=path.with_name(f"{path.name}.{os.getpid()}.part");temporary.write_bytes(payload);temporary.replace(path)
def validate_csv()->None:
    with CSV_PATH.open("r",encoding="utf-8",newline="") as handle:rows=list(csv.DictReader(handle))
    if len(rows)!=6 or any(row["source_kind"]!="test-fixture" or row["measured_authority"]!="false" or row["science_response_application_allowed"]!="false" or abs(float(row["redistribution_row_sum"])-1)>=1e-12 for row in rows):raise RuntimeError("v426-csv-boundary")
def write_fits(view:dict[str,object])->None:
    manifest=view["fixture"]["manifest"];response=manifest["response"]
    primary=fits.PrimaryHDU();primary.header["HASIMAGE"]=(False,"No science response image");primary.header["FIXTURE"]=(True,"Nonpublishable compiler fixture");primary.header["MEASURED"]=(False,"No measured response pack");primary.header["SCIAPPL"]=(False,"No science response application");primary.header["COUNTS"]=(False,"No detector count product");primary.header["DENSE"]=(False,"Dense campaign 0/49")
    columns=[
        fits.Column(name="E_TRUE_LO",format="D",unit="eV",array=np.asarray(manifest["trueEnergyEdgesEv"][:-1],dtype=np.float64)),
        fits.Column(name="E_TRUE_HI",format="D",unit="eV",array=np.asarray(manifest["trueEnergyEdgesEv"][1:],dtype=np.float64)),
        fits.Column(name="CHAN_LO",format="D",unit="eV",array=np.asarray(manifest["detectorChannelEdgesEv"][:-1],dtype=np.float64)),
        fits.Column(name="CHAN_HI",format="D",unit="eV",array=np.asarray(manifest["detectorChannelEdgesEv"][1:],dtype=np.float64)),
        fits.Column(name="EFF_AREA",format="D",unit="m2",array=np.asarray(response["effectiveAreaM2"],dtype=np.float64)),
        fits.Column(name="MOD_FACTOR",format="D",array=np.asarray(response["modulationFactor"],dtype=np.float64)),
        fits.Column(name="ANGLE0",format="D",unit="deg",array=np.asarray(response["polarizationAngleZeroDeg"],dtype=np.float64)),
        fits.Column(name="BACKGROUND",format="D",unit="count/s",array=np.asarray(response["backgroundRateCountsPerS"],dtype=np.float64)),
        fits.Column(name="REDIST",format="6D",array=np.asarray(response["redistributionMatrix"],dtype=np.float64)),
        fits.Column(name="MEASURED",format="L",array=np.zeros(6,dtype=bool)),
        fits.Column(name="SCI_APPL",format="L",array=np.zeros(6,dtype=bool)),
    ]
    table=fits.BinTableHDU.from_columns(columns,name="RESPONSE_FIXTURE");table.header["NONPUB"]=(True,"Fixture is not publishable authority");temporary=FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part");fits.HDUList([primary,table]).writeto(temporary,overwrite=True);temporary.replace(FITS_PATH)
    with fits.open(FITS_PATH) as opened:
        if len(opened)!=2 or opened[0].data is not None or opened[0].header["HASIMAGE"] or not opened[0].header["FIXTURE"] or opened[0].header["MEASURED"] or opened[0].header["SCIAPPL"] or opened[0].header["COUNTS"] or opened[0].header["DENSE"] or len(opened[1].data)!=6 or np.any(opened[1].data["MEASURED"]) or np.any(opened[1].data["SCI_APPL"]):raise RuntimeError("v426-fits-boundary")
def write_png(view:dict[str,object])->None:
    manifest=view["fixture"]["manifest"];response=manifest["response"];width,height=1600,980;image=Image.new("RGB",(width,height),(2,7,9));draw=ImageDraw.Draw(image);font=ImageFont.load_default();draw.rectangle((0,0,width-1,height-1),outline=(55,96,105),width=1);draw.text((42,28),"V426 HIGH-ENERGY POLARIMETER RESPONSE CONTRACT",fill=(220,245,240),font=font);draw.text((42,51),"SCHEMA + COMPILER + NONPUBLISHABLE FIXTURE | MEASURED RESPONSE / SCIENCE PROJECTION UNAVAILABLE",fill=(251,191,36),font=font)
    rail=(65,120,1535,340);draw.rectangle(rail,fill=(3,13,17),outline=(46,85,94),width=1);draw.text((rail[0]+18,rail[1]+16),"TRUE-ENERGY / DETECTOR-CHANNEL GRID / 30 eV - 5 keV",fill=(117,181,181),font=font);edges=manifest["trueEnergyEdgesEv"]
    def x(value:float)->float:return rail[0]+70+(np.log10(value)-np.log10(30))/(np.log10(5000)-np.log10(30))*(rail[2]-rail[0]-140)
    y=245;draw.line((rail[0]+70,y,rail[2]-70,y),fill=(102,149,155),width=2)
    for index,edge in enumerate(edges):
        cursor=x(edge);draw.line((cursor,y-20,cursor,y+20),fill=(103,232,249),width=2);draw.text((cursor-18,y+34),f"{edge:g}",fill=(116,181,188),font=font)
        if index<6:
            center=(x(edges[index])+x(edges[index+1]))/2;draw.rectangle((center-15,y-65,center+15,y-35),fill=(251,191-int(index*12),36+index*15),outline=(254,243,199),width=1)
    draw.text((rail[2]-190,rail[3]-30),"energy eV / log rail",fill=(86,135,141),font=font)
    heat=(65,395,715,895);draw.rectangle(heat,fill=(3,13,17),outline=(46,85,94),width=1);draw.text((heat[0]+18,heat[1]+16),"6 x 6 REDISTRIBUTION / ROW-STOCHASTIC",fill=(117,181,181),font=font);matrix=response["redistributionMatrix"];cell=58;start_x,start_y=heat[0]+145,heat[1]+85
    for row in range(6):
        for column in range(6):
            value=matrix[row][column];color=(int(10+90*value),int(35+170*value),int(45+185*value));draw.rectangle((start_x+column*cell,start_y+row*cell,start_x+(column+1)*cell-3,start_y+(row+1)*cell-3),fill=color);draw.text((start_x+column*cell+15,start_y+row*cell+22),f"{value:.1f}",fill=(224,252,247),font=font)
    draw.text((start_x,start_y+6*cell+20),"true-energy rows -> detector-channel columns",fill=(91,145,150),font=font)
    schema=(760,395,1535,895);draw.rectangle(schema,fill=(3,13,17),outline=(46,85,94),width=1);draw.text((schema[0]+18,schema[1]+16),"ADMISSION CHECKLIST / 13 REQUIRED GROUPS",fill=(117,181,181),font=font);items=["band-appropriate architecture","energy domain + bin edges","effective area + QE declaration","modulation factor","polarization angle zero","redistribution matrix","background spectrum","full response covariance","redistribution simplex covariance","exposure + temperature","dead-time + pileup models","raw artifact SHA provenance","measured attestation + validation"]
    for index,item in enumerate(items):
        yy=schema[1]+58+index*29;draw.rectangle((schema[0]+22,yy,schema[0]+31,yy+9),fill=(190,242,100));draw.text((schema[0]+45,yy-1),item,fill=(169,211,205),font=font)
    draw.text((schema[0]+22,schema[3]-54),"FIXTURE COMPILES / ADMISSION REJECTS",fill=(251,191,36),font=font);draw.text((42,935),"FIXTURE VALUES NEVER ENTER SCIENCE PAYLOAD | NO MEASURED RESPONSE | NO COUNTS | NO PIXEL, RASTER OR DENSE AUTHORITY",fill=(139,181,184),font=font);temporary=PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part");image.save(temporary,format="PNG",optimize=False,compress_level=9);temporary.replace(PNG_PATH)
def main()->None:
    artifact=json.loads(ARTIFACT.read_text(encoding="utf-8"));view=artifact.get("view",{})
    if artifact.get("version")!="v426-kerr-high-energy-instrument-response-contract-artifact-v1" or view.get("counts",{}).get("fixtureTrueEnergyBinCount")!=6 or view.get("counts",{}).get("scienceResponseApplicationCount")!=0 or view.get("fixture",{}).get("admission",{}).get("authorityGranted") is not False:raise RuntimeError("v426-artifact-boundary")
    validate_csv();write_fits(view);write_png(view);manifest={"version":"v426-kerr-high-energy-response-export-manifest-v1","artifactSha256":artifact["artifactSha256"],"exports":{"json":{"path":ARTIFACT.name,"sha256":file_sha(ARTIFACT),"semantic":"response-schema-fixture-compilation-and-admission"},"csv":{"path":CSV_PATH.name,"sha256":file_sha(CSV_PATH),"semantic":"six-bin-nonpublishable-fixture-structure-table"},"fits":{"path":FITS_PATH.name,"sha256":file_sha(FITS_PATH),"semantic":"fixture-response-structure-binary-table-no-science-projection"},"png":{"path":PNG_PATH.name,"sha256":file_sha(PNG_PATH),"semantic":"high-energy-response-architecture-diagnostic-not-detector-image"}},"contractAuthority":"qualified","fixturePerformanceAuthority":"unavailable","measuredResponseAuthority":"unavailable","scienceResponseApplicationCount":0,"detectorCountProduct":"unavailable","pixelRasterAuthority":"unavailable","denseShardExecuted":False};atomic(MANIFEST,(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n").encode("utf-8"));print(json.dumps({"status":"exported-v426-high-energy-response-contract-products","artifactSha256":artifact["artifactSha256"],"bins":6,"scienceResponseApplicationCount":0,"admission":view["fixture"]["admission"]["status"]},indent=2))
if __name__=="__main__":main()
