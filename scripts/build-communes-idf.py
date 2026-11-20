"""
Génère src/lib/geo/communes-idf.json : communes d'Île-de-France avec codes postaux et coordonnées.

Sources (données ouvertes) :
  - Référentiel des communes : @etalab/decoupage-administratif (data/communes.json) — Licence Ouverte 2.0
  - Codes postaux : codes-postaux (codes-postaux.json, base officielle La Poste) — Licence Ouverte
  - Coordonnées : GeoNames « cities1000 » via all-the-cities (cities.pbf) — CC BY 4.0, https://www.geonames.org
  - Arrondissements parisiens : centroïdes approximatifs saisis à la main

Usage : python3 -I scripts/build-communes-idf.py <communes.json> <codes-postaux.json> <idf_geonames.json> <sortie.json>
"""
import json, sys, unicodedata, re

def norm(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"^(le|la|les|l)[ '-]+", "", s)
    return re.sub(r"[^a-z0-9]+", "", s.replace("saint", "st").replace("sainte", "ste"))

communes_path, cp_path, geo_path, out_path = sys.argv[1:5]
communes = [c for c in json.load(open(communes_path)) if c.get("region") == "11" and c["type"] == "commune-actuelle"]
cps = {}
for row in json.load(open(cp_path)):
    cps.setdefault(row["codeCommune"], set()).add(row["codePostal"])
geo = {}
for g in json.load(open(geo_path)):
    for n in filter(None, [g["name"]] + (g["alt"] or "").split(",")):
        geo.setdefault(norm(n), []).append(g)

PARIS = {
    1: (48.8625, 2.3364), 2: (48.8683, 2.3428), 3: (48.8630, 2.3601), 4: (48.8543, 2.3576), 5: (48.8445, 2.3497),
    6: (48.8491, 2.3329), 7: (48.8562, 2.3122), 8: (48.8727, 2.3125), 9: (48.8770, 2.3375), 10: (48.8761, 2.3607),
    11: (48.8590, 2.3800), 12: (48.8400, 2.3880), 13: (48.8283, 2.3623), 14: (48.8292, 2.3266), 15: (48.8401, 2.2930),
    16: (48.8604, 2.2750), 17: (48.8873, 2.3067), 18: (48.8925, 2.3484), 19: (48.8871, 2.3848), 20: (48.8634, 2.4011),
}

# Communes absentes ou renommées dans GeoNames (centres approximatifs).
MANUAL = {"93070": (48.9118, 2.3335), "93039": (48.9372, 2.3376), "77316": (48.3725, 2.8167), "77291": (49.0167, 2.5945)}

out, missing = [], []
for c in communes:
    if c["code"] == "75056":
        for n, (lat, lon) in PARIS.items():
            codes = [f"750{n:02d}"] + (["75116"] if n == 16 else [])
            out.append({"i": f"751{n:02d}", "n": f"Paris {n}{'er' if n == 1 else 'e'}", "d": "75", "p": codes, "la": lat, "lo": lon})
        continue
    cands = geo.get(norm(c["nom"]), [])
    if not cands:
        # Communes nouvelles (ex. « Évry-Courcouronnes ») : on tente chaque partie significative du nom.
        for part in re.split(r"[- ]", c["nom"]):
            if len(part) > 4 and norm(part) not in ("st", "ste") and geo.get(norm(part)):
                cands = geo[norm(part)]
                break
    codes = sorted(cps.get(c["code"], c.get("codesPostaux", [])))
    # La base La Poste rattache quelques codes d'un autre département (ex. 75016 → Boulogne-Billancourt) : on les écarte.
    same_dep = [p for p in codes if p.startswith(c["departement"])]
    entry = {"i": c["code"], "n": c["nom"], "d": c["departement"], "p": same_dep or codes}
    if c["code"] in MANUAL:
        entry["la"], entry["lo"] = MANUAL[c["code"]]
    elif cands:
        best = min(cands, key=lambda g: abs((g["pop"] or 0) - (c.get("population") or 0)))
        entry["la"], entry["lo"] = best["lat"], best["lon"]
    out.append(entry)

# Repli : une commune sans coordonnées prend celles d'une commune géolocalisée partageant son code postal.
by_cp = {}
for e in out:
    if "la" in e:
        for p in e["p"]:
            by_cp.setdefault(p, e)
for e in out:
    if "la" not in e:
        ref = next((by_cp[p] for p in e["p"] if p in by_cp), None)
        if ref:
            e["la"], e["lo"], e["approx"] = ref["la"], ref["lo"], 1
        else:
            missing.append(e["n"])

out = [e for e in out if "la" in e]
for e in out:
    e["la"], e["lo"] = round(e["la"], 4), round(e["lo"], 4)
out.sort(key=lambda e: e["n"])
json.dump(out, open(out_path, "w"), ensure_ascii=False, separators=(",", ":"))
print("sans coordonnées :", ", ".join(missing))
print(f"{len(out)} communes écrites, {sum(1 for e in out if e.get('approx'))} approchées, {len(missing)} sans coordonnées")
