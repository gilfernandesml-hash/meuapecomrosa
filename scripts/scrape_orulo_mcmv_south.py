"""Coleta o catálogo público MCMV da Órulo para a Zona Sul de São Paulo.

O script não usa credenciais do projeto Gil Corretor SP, nunca persiste o
número do endereço e mantém o status/fase informado pela fonte. A saída padrão
é consumida pelo portal Meu Apê com Rosa.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

CATALOG_API = "https://www.orulo.com.br/api/elastic"
IMAGE_API = "https://www.orulo.com.br/api/portal/buildings/{building_id}/images"
DEFAULT_OUTPUT = Path("src/data/orulo-mcmv-zona-sul.json")
DEFAULT_CSV = Path("reports/orulo-mcmv-zona-sul.csv")

SORT_OPTIONS = (
    ("relevancy_order_order", "desc"),
    ("last_updated_date_order", "desc"),
    ("last_updated_date_order", "asc"),
    ("price_order", "asc"),
    ("price_order", "desc"),
    ("area_order", "asc"),
    ("area_order", "desc"),
    ("building_name_order", "asc"),
    ("building_name_order", "desc"),
    ("opening_date_order", "asc"),
    ("opening_date_order", "desc"),
)

SOUTH_AREAS = {
    "aeroporto", "alto da boa vista", "alto do ipiranga", "bosque da saude",
    "brooklin", "brooklin novo", "brooklin paulista", "campo belo",
    "campo grande", "campo limpo", "chacara flora", "chacara klabin",
    "chacara santo antonio (zona sul)", "cidade ademar", "cidade jardim",
    "cidade moncoes", "conceicao", "cupecê", "cupecê", "granja julieta",
    "interlagos", "indianopolis", "ipiranga", "jabaquara", "jardim aeroporto",
    "jardim caravelas", "jardim guedala", "jardim imperador (zona sul)",
    "jardim marajoara", "jardim prudencia", "jardim sao luis",
    "jardim taquaral", "jardim trussardi", "jardim ubirajara (zona sul)",
    "jurubatuba", "mirandopolis", "moema", "morumbi", "panamby", "paraiso",
    "parque colonial", "parque reboucas", "planalto paulista", "praca da arvore",
    "quinta da paineira", "real parque", "sacoma", "santo amaro", "saude",
    "socorro", "usina piratininga", "varzea de baixo", "vila andrade",
    "vila belezas", "vila clementino", "vila cruzeiro", "vila da saude",
    "vila das belezas", "vila do encontro", "vila firmiano pinto",
    "vila guarani (z sul)", "vila mariana", "vila mascote", "vila nova conceicao",
    "vila nova das belezas", "vila olimpia", "vila parque jabaquara",
    "vila santa catarina", "vila sofia",
}


def normalize(value: Any) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    return re.sub(r"\s+", " ", text.encode("ascii", "ignore").decode("ascii")).strip().lower()


def slugify(value: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", normalize(value))).strip("-")[:100]


def fetch_catalog(session: requests.Session) -> list[dict[str, Any]]:
    base_params = {
        "request_id": "1", "page": "1", "map_ne_lat": "-23.40313720703125",
        "map_ne_lng": "-46.37800216674805", "map_sw_lat": "-23.733217239379883",
        "map_sw_lng": "-46.99339294433594", "_orulo_session": "_",
    }
    buildings: dict[str, dict[str, Any]] = {}
    for sort_field, direction in SORT_OPTIONS:
        response = session.post(CATALOG_API, params={**base_params, sort_field: direction}, json={}, timeout=90)
        response.raise_for_status()
        for building in response.json().get("buildings", []):
            if building.get("id") is not None:
                buildings[str(building["id"])] = building
    return list(buildings.values())


def is_mcmv_south(building: dict[str, Any]) -> bool:
    address = building.get("address") or {}
    opportunity = building.get("opportunity") or {}
    area = normalize(address.get("area"))
    city = normalize(address.get("city"))
    lat = address.get("latitude")
    lng = address.get("longitude")
    return all((
        opportunity.get("social_housing_program") is True,
        city == "sao paulo",
        area in SOUTH_AREAS,
        isinstance(lat, (int, float)) and -24.0 < lat < -23.50,
        isinstance(lng, (int, float)) and -46.85 < lng < -46.55,
        "comercial" not in normalize(building.get("finality")),
    ))


def street_only(address: dict[str, Any]) -> str:
    street_type = re.sub(r"\s+", " ", str(address.get("street_type") or "")).strip()
    street = re.sub(r"\s+", " ", str(address.get("street") or "")).strip()
    source_number = str(address.get("number") or "").strip()
    if source_number:
        street = re.sub(rf"(?:,|\s)+{re.escape(source_number)}\s*$", "", street).strip(" ,-.")
    return " ".join(part for part in (street_type, street) if part).strip()


def public_address(address: dict[str, Any]) -> str:
    street = street_only(address)
    city = str(address.get("city") or "São Paulo").strip()
    state = str(address.get("state") or "SP").strip().upper()
    zipcode = str(address.get("zip_code") or "").strip()
    area = str(address.get("area") or "Zona Sul").strip()
    return ", ".join(part for part in (street, f"{city} - {state}", zipcode, area, city) if part)


def is_floor_plan(image: dict[str, Any]) -> bool:
    description = normalize(image.get("description"))
    return any(word in description for word in ("planta", "implantacao", "pavimento", "floor plan"))


def fetch_images(building_id: str) -> list[dict[str, Any]]:
    response = requests.get(
        IMAGE_API.format(building_id=building_id),
        params=[("dimensions", "520x280"), ("dimensions", "1024x1024")],
        timeout=45,
    )
    response.raise_for_status()
    return response.json().get("images", [])


def phase(value: Any) -> str:
    text = normalize(value)
    if "pronto" in text or "entregue" in text:
        return "Pronto"
    if "constr" in text or "obra" in text:
        return "Em construção"
    return "Lançamento"


def housing_flags(name: str) -> dict[str, bool]:
    label = normalize(name)
    return {
        "is_r2v": bool(re.search(r"\br2v\b", label)),
        "is_his2": bool(re.search(r"\bhis[\s-]*2\b", label)),
        "is_hmp": bool(re.search(r"\bhmp\b", label)),
        "is_nr": bool(re.search(r"\bnr\b", label)),
    }


def make_property(building: dict[str, Any], images: list[dict[str, Any]]) -> dict[str, Any]:
    address = building.get("address") or {}
    building_id = str(building["id"])
    name = re.sub(r"\s+", " ", str(building.get("name") or f"Empreendimento {building_id}")).strip()
    price = float(building.get("min_price") or 0)
    if price < 1000:
        price = 0
    photos = [image.get("1024x1024") or image.get("520x280") for image in images if not is_floor_plan(image)]
    floorplans = [image.get("1024x1024") or image.get("520x280") for image in images if is_floor_plan(image)]
    photos = list(dict.fromkeys(url for url in photos if url))
    floorplans = list(dict.fromkeys(url for url in floorplans if url))
    features = [str(item).strip() for item in building.get("features") or [] if str(item).strip()]
    min_area, max_area = building.get("min_area"), building.get("max_area")
    area_label = f"{min_area:g} a {max_area:g} m²" if min_area and max_area and min_area != max_area else (f"{min_area:g} m²" if min_area else "Área sob consulta")
    status_source = str(building.get("status") or building.get("stage") or "Sob consulta").strip()
    developer = str((building.get("developer") or {}).get("name") or "").strip()
    description = (
        f"{name} é um empreendimento na região de {address.get('area') or 'Zona Sul'}, em São Paulo. "
        f"Possui opções {area_label.lower()} e foi identificado pela Órulo como participante de programa habitacional. "
        "O enquadramento no Minha Casa Minha Vida, valores, disponibilidade, financiamento, subsídios e uso do FGTS "
        "estão sujeitos à confirmação e às regras vigentes das instituições responsáveis."
    )
    return {
        "slug": slugify(f"{name}-{address.get('area')}-{building_id}"),
        "code": f"ORULO-{building_id}", "external_id": building_id, "name": name,
        "neighborhood": str(address.get("area") or "Zona Sul").strip(), "city": "São Paulo",
        "state": str(address.get("state") or "SP").strip().upper(), "zipcode": str(address.get("zip_code") or "").strip(),
        "address": street_only(address), "public_address": public_address(address), "number": None,
        "latitude": address.get("latitude"), "longitude": address.get("longitude"),
        "phase": phase(status_source), "source_status": status_source,
        "source_active": building.get("active"), "source_publication_status": building.get("publication_status"),
        "area_min": min_area, "area_max": max_area, "area": area_label,
        "bedrooms_min": building.get("min_bedrooms"), "bedrooms_max": building.get("max_bedrooms"),
        "bathrooms_min": building.get("min_bathrooms"), "bathrooms_max": building.get("max_bathrooms"),
        "suites_min": building.get("min_suites"), "suites_max": building.get("max_suites"),
        "parking_min": building.get("min_parking"), "parking_max": building.get("max_parking"),
        "price": price or None, "price_label": f"A partir de R$ {price:,.0f}".replace(",", ".") if price else "Valor sob consulta",
        "property_type": str(building.get("finality") or "Residencial").strip(), "developer": developer,
        "mcmv": True, "fgts": True, **housing_flags(name), "description": description, "features": features,
        "photos": photos, "floorplans": floorplans,
        "source": "orulo", "source_url": str(building.get("orulo_url") or f"https://www.orulo.com.br/buildings/{building_id}"),
        "source_updated_at": building.get("updated_at"),
    }


def write_csv(path: Path, properties: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = ("external_id", "name", "source_status", "phase", "price", "area", "bedrooms_min", "address", "public_address", "neighborhood", "zipcode", "source_url")
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for item in properties:
            writer.writerow({field: item.get(field) for field in fields})


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()
    previous_codes: dict[str, str] = {}
    if args.out.exists():
        try:
            previous = json.loads(args.out.read_text(encoding="utf-8"))
            previous_codes = {str(item["external_id"]): str(item["code"]) for item in previous.get("properties", []) if re.fullmatch(r"RMA-\d{6}", str(item.get("code") or ""))}
        except (OSError, ValueError, KeyError):
            previous_codes = {}
    session = requests.Session()
    catalog = fetch_catalog(session)
    candidates = sorted((item for item in catalog if is_mcmv_south(item)), key=lambda item: (normalize((item.get("address") or {}).get("area")), normalize(item.get("name"))))
    media: dict[str, list[dict[str, Any]]] = {}
    errors: list[dict[str, str]] = []
    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 12))) as executor:
        jobs = {executor.submit(fetch_images, str(item["id"])): str(item["id"]) for item in candidates}
        for future in as_completed(jobs):
            building_id = jobs[future]
            try:
                media[building_id] = future.result()
            except Exception as exc:
                media[building_id] = []
                errors.append({"external_id": building_id, "error": str(exc)})
    properties = [make_property(item, media.get(str(item["id"]), [])) for item in candidates]
    used_sequences = [int(code.split("-")[1]) for code in previous_codes.values()]
    next_sequence = max(used_sequences, default=0) + 1
    for item in properties:
        code = previous_codes.get(item["external_id"])
        if not code:
            code = f"RMA-{next_sequence:06d}"
            next_sequence += 1
        item["code"] = code
    expected_streets = {str(item["id"]): street_only(item.get("address") or {}) for item in candidates}
    generated_at = datetime.now(timezone.utc).isoformat()
    payload = {
        "generated_at": generated_at, "source": "Órulo — catálogo público",
        "filters": {"program": "Minha Casa Minha Vida", "region": "Zona Sul de São Paulo", "source_status": "todos"},
        "count": len(properties), "properties": properties,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    write_csv(args.csv, properties)
    audit_path = args.csv.with_suffix(".audit.json")
    audit = {
        "generated_at": generated_at, "catalog_unique": len(catalog), "mcmv_south": len(properties),
        "with_photos": sum(bool(item["photos"]) for item in properties),
        "without_address_number": sum(item["number"] is None and item["address"] == expected_streets[item["external_id"]] for item in properties),
        "statuses": {status: sum(item["source_status"] == status for item in properties) for status in sorted({item["source_status"] for item in properties})},
        "media_errors": errors,
    }
    audit_path.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({**audit, "media_errors": len(errors), "output": str(args.out), "csv": str(args.csv)}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
