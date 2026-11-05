# IAU constellation boundary source cache (v607)

This note records the official IAU boundary endpoints needed by Mainline A stage A2. The endpoints are linked from the IAU constellation archive page:

- Orion (ORI): `https://iauarchive.eso.org/static/public/constellations/txt/ori.txt`
- Cassiopeia (CAS): `https://iauarchive.eso.org/static/public/constellations/txt/cas.txt`
- Scorpius (SCO): `https://iauarchive.eso.org/static/public/constellations/txt/sco.txt`
- Ursa Major (UMa/UMA): `https://iauarchive.eso.org/static/public/constellations/txt/uma.txt`

The files returned HTTP 200 as `text/plain; charset=utf-8`; the server reported `Last-Modified: Fri, 19 Feb 2010 09:18:20 GMT` for all four files during the v607 inventory check on 2026-09-09. The first records were:

```text
ORI: 04 43 24.5665|  0.2375014|ORI
CAS: 22 57 22.2843| 53.1680298|CAS
SCO: 16 01 44.9469| -8.3523235|SCO
UMA: 09 42 50.2171| 41.4316750|UMA
```

## Parsing contract

Each line is `HH MM SS.SSSS| DD.DDDDDDD|XXX`:

- right ascension is hours, minutes, seconds in J2000;
- declination is degrees in J2000;
- `XXX` is the IAU three-letter abbreviation;
- `|` is the field separator.

The coordinates describe the formal constellation boundary vertices. They are separate from the illustrative constellation stick-figure line definitions already used by the application.

## Rights and attribution

The IAU copyright page states that IAU web texts, images, and videos are released under the Creative Commons Attribution 4.0 International license, with the full credit retained and shown clearly. Treat these boundary text files as IAU web text for the A2 ingest, retain the source URL and retrieval date, and display an IAU attribution in any exported presentation. Do not infer that third-party chart/TIF assets share this license; those remain per-asset rights checks for A6.

Source pages:

- IAU constellation archive: <https://iauarchive.eso.org/public/themes/constellations/>
- IAU copyright and credit terms: <https://iauarchive.eso.org/copyright/>

