// Recomputed from retained official CDS V/50 bytes by collect-mainline-a-constellation-anchors-v638.mjs.
// Candidate presentation anchors only; source capture is not scientific identity confirmation.
export type MainlineAConstellationAnchorSupplementRecordV638 = Readonly<{
  id: string; name: string; nameCn: string; constellationCode: string; raDeg: number; decDeg: number; magV: number | null;
  sourceUrl: string; artifactPath: string; artifactSha256: string; bayerDesignation: string; coordinateFrame: string;
  displayLabelAuthority: string; matchPolicy: string; systemCentreClaimed: false;
  candidateOnly: true; reviewStatus: "hold"; admission: "not-admitted"; scientificPayloadWriteback: false; scientificIdentityConfirmed: false;
  source: Readonly<{ hr: number; rawName: string; ads: string | null; adsComponent: string | null; lineNumber: number;
    byteSpace: string; byteStart: number; byteEndExclusive: number; rawLineSha256: string;
    fields: Readonly<Record<string, Readonly<{ text: string; start: number; end: number }>>>; }>;
}>;

export const MAINLINE_A_CONSTELLATION_ANCHOR_SUPPLEMENT_BOUNDARY_V638 = {
  "candidateOnly": true,
  "reviewStatus": "hold",
  "admission": "not-admitted",
  "scientificPayloadWriteback": false,
  "scientificIdentityConfirmed": false
} as const;

export const MAINLINE_A_CONSTELLATION_ANCHOR_SUPPLEMENT_V638 = [
  {
    "id": "delta_cyg",
    "name": "Delta Cygni (Fawaris)",
    "nameCn": "天鹅座 δ",
    "constellationCode": "Cyg",
    "raDeg": 296.24375,
    "decDeg": 45.130833333333,
    "magV": 2.87,
    "bayerDesignation": "Del Cyg",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "unique-exact-bayer-designation",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 7528,
      "rawName": " 18Del Cyg",
      "ads": "12880",
      "adsComponent": null,
      "lineNumber": 7528,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 1409158,
      "byteEndExclusive": 1409355,
      "rawLineSha256": "9a8ee88db607d371eb0b5a06a3675155cf93a8180e731d44853254ab0fc35309",
      "fields": {
        "HR": {
          "text": "7528",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": " 18Del Cyg",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "12880",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "  ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "19",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "44",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "58.5",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "+",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "45",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "07",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "51",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 2.87",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": " ",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  },
  {
    "id": "epsilon_cyg",
    "name": "Epsilon Cygni (Aljanah)",
    "nameCn": "天鹅座 ε",
    "constellationCode": "Cyg",
    "raDeg": 311.552916666667,
    "decDeg": 33.970277777778,
    "magV": 2.46,
    "bayerDesignation": "Eps Cyg",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "unique-exact-bayer-designation",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 7949,
      "rawName": " 53Eps Cyg",
      "ads": "14274",
      "adsComponent": null,
      "lineNumber": 7949,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 1488394,
      "byteEndExclusive": 1488591,
      "rawLineSha256": "3211b78dd57d19ff4b283b45886b606eb731636f4f84e19d5130b5234a5e35ce",
      "fields": {
        "HR": {
          "text": "7949",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": " 53Eps Cyg",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "14274",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "  ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "20",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "46",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "12.7",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "+",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "33",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "58",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "13",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 2.46",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": " ",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  },
  {
    "id": "imai",
    "name": "Delta Crucis (Imai)",
    "nameCn": "南十字座 δ",
    "constellationCode": "Cru",
    "raDeg": 183.78625,
    "decDeg": -58.748888888889,
    "magV": 2.8,
    "bayerDesignation": "Del Cru",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "unique-exact-bayer-designation",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 4656,
      "rawName": "   Del Cru",
      "ads": null,
      "adsComponent": null,
      "lineNumber": 4656,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 871314,
      "byteEndExclusive": 871511,
      "rawLineSha256": "79b33661f73795dac0187a34b363ba5969a046449b134f67e4699f5a5e2974c3",
      "fields": {
        "HR": {
          "text": "4656",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": "   Del Cru",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "     ",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "  ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "12",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "15",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "08.7",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "-",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "58",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "44",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "56",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 2.80",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": " ",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  },
  {
    "id": "zeta1_lyr",
    "name": "Zeta1 Lyrae",
    "nameCn": "天琴座 ζ¹",
    "constellationCode": "Lyr",
    "raDeg": 281.193333333333,
    "decDeg": 37.605,
    "magV": 4.36,
    "bayerDesignation": "Zet1 Lyr",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "unique-exact-bayer-designation",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 7056,
      "rawName": "  6Zet1Lyr",
      "ads": "11639",
      "adsComponent": "A",
      "lineNumber": 7056,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 1320906,
      "byteEndExclusive": 1321103,
      "rawLineSha256": "75d713cd38dab34361d8c8217a04f1d1a679303407c18c253ed3788be63499d6",
      "fields": {
        "HR": {
          "text": "7056",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": "  6Zet1Lyr",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "11639",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "A ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "18",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "44",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "46.4",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "+",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "37",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "36",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "18",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 4.36",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": " ",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  },
  {
    "id": "delta2_lyr",
    "name": "Delta2 Lyrae",
    "nameCn": "天琴座 δ²",
    "constellationCode": "Lyr",
    "raDeg": 283.625833333333,
    "decDeg": 36.898888888889,
    "magV": 4.3,
    "bayerDesignation": "Del2 Lyr",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "unique-exact-bayer-designation",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 7139,
      "rawName": " 12Del2Lyr",
      "ads": "11825",
      "adsComponent": null,
      "lineNumber": 7139,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 1336277,
      "byteEndExclusive": 1336474,
      "rawLineSha256": "1691a871e265f3cee70e1e6324fd0a596eb5fbe599c6602b34047a0d946e6967",
      "fields": {
        "HR": {
          "text": "7139",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": " 12Del2Lyr",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "11825",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "  ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "18",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "54",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "30.2",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "+",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "36",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "53",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "56",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 4.30",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": " ",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  },
  {
    "id": "epsilon1_lyr",
    "name": "Epsilon1 Lyrae / HR7051 / catalogue component A",
    "nameCn": "天琴座 ε¹ · HR7051／目录组件A",
    "constellationCode": "Lyr",
    "raDeg": 281.085,
    "decDeg": 39.67,
    "magV": 5.06,
    "bayerDesignation": "Eps1 Lyr",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "explicit-hr-name-ads-component-presentation-rule",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 7051,
      "rawName": "  4Eps1Lyr",
      "ads": "11635",
      "adsComponent": "A",
      "lineNumber": 7051,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 1319916,
      "byteEndExclusive": 1320113,
      "rawLineSha256": "e3ff7523b2cf547717d7945c6ae5a06d2a6b45e90c6e2bb3fa5efbf9023a1092",
      "fields": {
        "HR": {
          "text": "7051",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": "  4Eps1Lyr",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "11635",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "A ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "18",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "44",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "20.4",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "+",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "39",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "40",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "12",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 5.06",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": "H",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  },
  {
    "id": "delta_aql",
    "name": "Delta Aquilae",
    "nameCn": "天鹰座 δ",
    "constellationCode": "Aql",
    "raDeg": 291.374583333333,
    "decDeg": 3.114722222222,
    "magV": 3.36,
    "bayerDesignation": "Del Aql",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "unique-exact-bayer-designation",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 7377,
      "rawName": " 30Del Aql",
      "ads": null,
      "adsComponent": null,
      "lineNumber": 7377,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 1380867,
      "byteEndExclusive": 1381064,
      "rawLineSha256": "7fcebfe0cd1097ea29b94ac95997707812e177f64767852524cc2402db5c96e9",
      "fields": {
        "HR": {
          "text": "7377",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": " 30Del Aql",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "     ",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "  ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "19",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "25",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "29.9",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "+",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "03",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "06",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "53",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 3.36",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": " ",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  },
  {
    "id": "zeta_aql",
    "name": "Zeta Aquilae",
    "nameCn": "天鹰座 ζ",
    "constellationCode": "Aql",
    "raDeg": 286.3525,
    "decDeg": 13.863333333333,
    "magV": 2.99,
    "bayerDesignation": "Zet Aql",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "unique-exact-bayer-designation",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 7235,
      "rawName": " 17Zet Aql",
      "ads": "12026",
      "adsComponent": null,
      "lineNumber": 7235,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 1354330,
      "byteEndExclusive": 1354527,
      "rawLineSha256": "c221972231c6d6ff5a4be91ac3437542836a5886e064739ad29e7c80ed1c715d",
      "fields": {
        "HR": {
          "text": "7235",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": " 17Zet Aql",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "12026",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "  ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "19",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "05",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "24.6",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "+",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "13",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "51",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "48",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 2.99",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": " ",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  },
  {
    "id": "lambda_aql",
    "name": "Lambda Aquilae",
    "nameCn": "天鹰座 λ",
    "constellationCode": "Aql",
    "raDeg": 286.562083333333,
    "decDeg": -4.8825,
    "magV": 3.44,
    "bayerDesignation": "Lam Aql",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "unique-exact-bayer-designation",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 7236,
      "rawName": " 16Lam Aql",
      "ads": null,
      "adsComponent": null,
      "lineNumber": 7236,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 1354528,
      "byteEndExclusive": 1354707,
      "rawLineSha256": "1a60a83addb8a31e81a9fc07bf282e2d9aecebdb9f4fa049678aca7edca003b2",
      "fields": {
        "HR": {
          "text": "7236",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": " 16Lam Aql",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "     ",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "  ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "19",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "06",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "14.9",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "-",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "04",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "52",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "57",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 3.44",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": " ",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  },
  {
    "id": "theta_aql",
    "name": "Theta Aquilae",
    "nameCn": "天鹰座 θ",
    "constellationCode": "Aql",
    "raDeg": 302.82625,
    "decDeg": -0.821388888889,
    "magV": 3.23,
    "bayerDesignation": "The Aql",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "unique-exact-bayer-designation",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 7710,
      "rawName": " 65The Aql",
      "ads": null,
      "adsComponent": null,
      "lineNumber": 7710,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 1443560,
      "byteEndExclusive": 1443757,
      "rawLineSha256": "8b01e84e19f10231ed57f886cfe8b120edd96225d8ad200c48a364057cfe803f",
      "fields": {
        "HR": {
          "text": "7710",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": " 65The Aql",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "     ",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "  ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "20",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "11",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "18.3",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "-",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "00",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "49",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "17",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 3.23",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": " ",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  },
  {
    "id": "eta_aql",
    "name": "Eta Aquilae",
    "nameCn": "天鹰座 η",
    "constellationCode": "Aql",
    "raDeg": 298.118333333333,
    "decDeg": 1.005555555556,
    "magV": 3.9,
    "bayerDesignation": "Eta Aql",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "unique-exact-bayer-designation",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 7570,
      "rawName": " 55Eta Aql",
      "ads": null,
      "adsComponent": null,
      "lineNumber": 7570,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 1417180,
      "byteEndExclusive": 1417377,
      "rawLineSha256": "b9058a686667280369da71056fc143c849f7df03f4bbc3f0f725510b5c7caabd",
      "fields": {
        "HR": {
          "text": "7570",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": " 55Eta Aql",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "     ",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "  ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "19",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "52",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "28.4",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "+",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "01",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "00",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "20",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 3.90",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": " ",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  },
  {
    "id": "zeta_tau",
    "name": "Zeta Tauri",
    "nameCn": "金牛座 ζ",
    "constellationCode": "Tau",
    "raDeg": 84.41125,
    "decDeg": 21.1425,
    "magV": 3,
    "bayerDesignation": "Zet Tau",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "unique-exact-bayer-designation",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 1910,
      "rawName": "123Zet Tau",
      "ads": null,
      "adsComponent": null,
      "lineNumber": 1910,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 358695,
      "byteEndExclusive": 358892,
      "rawLineSha256": "0cbb0fc04b0b22190157993b8d966d29cd40a27bf87f6557dae36387831f177d",
      "fields": {
        "HR": {
          "text": "1910",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": "123Zet Tau",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "     ",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "  ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "05",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "37",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "38.7",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "+",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "21",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "08",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "33",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 3.00",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": " ",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  },
  {
    "id": "gamma_tau",
    "name": "Gamma Tauri",
    "nameCn": "金牛座 γ",
    "constellationCode": "Tau",
    "raDeg": 64.948333333333,
    "decDeg": 15.6275,
    "magV": 3.65,
    "bayerDesignation": "Gam Tau",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "unique-exact-bayer-designation",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 1346,
      "rawName": " 54Gam Tau",
      "ads": null,
      "adsComponent": null,
      "lineNumber": 1346,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 252321,
      "byteEndExclusive": 252518,
      "rawLineSha256": "3ad8fcca59310ec4b7d9426de831f347b96cd5ad74f9e90516f0d6af03028600",
      "fields": {
        "HR": {
          "text": "1346",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": " 54Gam Tau",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "     ",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "  ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "04",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "19",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "47.6",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "+",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "15",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "37",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "39",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 3.65",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": " ",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  },
  {
    "id": "delta1_tau",
    "name": "Delta1 Tauri",
    "nameCn": "金牛座 δ¹",
    "constellationCode": "Tau",
    "raDeg": 65.73375,
    "decDeg": 17.5425,
    "magV": 3.76,
    "bayerDesignation": "Del1 Tau",
    "coordinateFrame": "equatorial-equinox-J2000-epoch-2000.0",
    "displayLabelAuthority": "requested-display-label-not-IAU-name-verification",
    "matchPolicy": "unique-exact-bayer-designation",
    "systemCentreClaimed": false,
    "candidateOnly": true,
    "reviewStatus": "hold",
    "admission": "not-admitted",
    "scientificPayloadWriteback": false,
    "scientificIdentityConfirmed": false,
    "source": {
      "hr": 1373,
      "rawName": " 61Del1Tau",
      "ads": null,
      "adsComponent": null,
      "lineNumber": 1373,
      "byteSpace": "gzip-decompressed-catalogue-ascii",
      "byteStart": 257568,
      "byteEndExclusive": 257765,
      "rawLineSha256": "c1099b370fdd092dc46c99d74e1dbbeaaad57d57e83741dd7d82dafb4ab04c9e",
      "fields": {
        "HR": {
          "text": "1373",
          "start": 1,
          "end": 4
        },
        "Name": {
          "text": " 61Del1Tau",
          "start": 5,
          "end": 14
        },
        "ADS": {
          "text": "     ",
          "start": 45,
          "end": 49
        },
        "ADScomp": {
          "text": "  ",
          "start": 50,
          "end": 51
        },
        "RAh": {
          "text": "04",
          "start": 76,
          "end": 77
        },
        "RAm": {
          "text": "22",
          "start": 78,
          "end": 79
        },
        "RAs": {
          "text": "56.1",
          "start": 80,
          "end": 83
        },
        "DE-": {
          "text": "+",
          "start": 84,
          "end": 84
        },
        "DEd": {
          "text": "17",
          "start": 85,
          "end": 86
        },
        "DEm": {
          "text": "32",
          "start": 87,
          "end": 88
        },
        "DEs": {
          "text": "33",
          "start": 89,
          "end": 90
        },
        "Vmag": {
          "text": " 3.76",
          "start": 103,
          "end": 107
        },
        "n_Vmag": {
          "text": " ",
          "start": 108,
          "end": 108
        },
        "u_Vmag": {
          "text": " ",
          "start": 109,
          "end": 109
        }
      }
    },
    "sourceUrl": "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz",
    "artifactPath": "docs/release/v607/mainline-a-constellation-source-20260928-081/raw/catalog-attempt-01.raw",
    "artifactSha256": "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed"
  }
] as const satisfies readonly MainlineAConstellationAnchorSupplementRecordV638[];
