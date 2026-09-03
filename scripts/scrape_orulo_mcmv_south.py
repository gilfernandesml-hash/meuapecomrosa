"""Coleta os empreendimentos da Plano & Plano na Zona Sul via Órulo.

A coleta usa somente endpoints públicos, mantém todas as mídias disponíveis e
nunca persiste o número do endereço. A saída é consumida pelo Meu Apê com Rosa.
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import re
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests

CATALOG_API = "https://www.orulo.com.br/api/elastic"
DETAIL_API = "https://www.orulo.com.br/api/portal/buildings/{building_id}"
IMAGE_API = "https://www.orulo.com.br/api/portal/buildings/{building_id}/images"
FLOORPLAN_API = "https://www.orulo.com.br/api/portal/buildings/{building_id}/floor_plans"
DEVELOPER_ID = "674"
DEVELOPER_LABEL = "Plano & Plano"
DEFAULT_OUTPUT = Path("src/data/orulo-plano-plano-zona-sul.json")
LEGACY_OUTPUT = Path("src/data/orulo-mcmv-zona-sul.json")
DEFAULT_CSV = Path("reports/orulo-plano-plano-zona-sul.csv")

# Bairros e regiões reconhecidos pela Órulo como pertencentes à Zona Sul.
# Os nomes abaixo já estão normalizados (sem acentos e em minúsculas).
SOUTH_AREAS = {
    "aeroporto", "alto da boa vista", "alto do ipiranga", "bosque da saude",
    "brooklin", "brooklin novo", "brooklin paulista", "campo belo",
    "campo grande", "campo limpo", "chacara flora", "chacara klabin",
    "chacara santo antonio (zona sul)", "cidade ademar", "cidade jardim",
    "cidade moncoes", "conceicao", "cupece", "granja julieta", "horto do ipe",
    "indianopolis", "interlagos", "ipiranga", "jabaquara", "jardim aeroporto",
    "jardim caravelas", "jardim guedala", "jardim imperador (zona sul)",
    "jardim marajoara", "jardim prudencia", "jardim sao luis", "jardim taquaral",
    "jardim trussardi", "jardim ubirajara (zona sul)", "jurubatuba",
    "mirandopolis", "moema", "morumbi", "panamby", "paraiso", "parque colonial",
    "parque reboucas", "planalto paulista", "praca da arvore", "quinta da paineira",
    "real parque", "sacoma", "santo amaro", "saude", "socorro",
    "usina piratininga", "varzea de baixo", "vila andrade", "vila belezas",
    "vila clementino", "vila cruzeiro", "vila da saude", "vila das belezas",
    "vila do encontro", "vila emir", "vila firmiano pinto", "vila guarani (z sul)",
    "vila mariana", "vila mascote", "vila nova conceicao", "vila nova das belezas",
    "vila olimpia", "vila parque jabaquara", "vila santa catarina", "vila sofia",
}


def normalize(value: Any) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    return re.sub(r"\s+", " ", text.encode("ascii", "ignore").decode("ascii")).strip().lower()


def slugify(value: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", normalize(value))).strip("-")[:100]


def clean_text(value: Any) -> str:
    text = re.sub(r"<[^>]+>", " ", html.unescape(str(value or "")))
    return re.sub(r"\s+", " ", text).strip()


def truncate(value: str, limit: int) -> str:
    if len(value) <= limit:
        return value
    shortened = value[: limit + 1].rsplit(" ", 1)[0].rstrip(" ,.;:-")
    return f"{shortened}…"


def valid_public_url(value: Any) -> str | None:
    url = str(value or "").strip()
    parsed = urlparse(url)
    return url if parsed.scheme in {"http", "https"} and parsed.netloc else None


def fetch_catalog(session: requests.Session) -> list[dict[str, Any]]:
    base_params = {
        "request_id": "1",
        "page": "1",
        "map_ne_lat": "-23.40313720703125",
        "map_ne_lng": "-46.37800216674805",
        "map_sw_lat": "-23.733217239379883",
        "map_sw_lng": "-46.99339294433594",
        "_orulo_session": "_",
        "developer_id": DEVELOPER_ID,
    }
    response = session.post(CATALOG_API, params=base_params, json={}, timeout=90)
    response.raise_for_status()
    first_page = response.json()
    buildings = {str(item["id"]): item for item in first_page.get("buildings", []) if item.get("id") is not None}
    total_pages = max(1, int(first_page.get("total_pages") or 1))
    for page in range(2, total_pages + 1):
        response = session.post(CATALOG_API, params={**base_params, "page": page}, json={}, timeout=90)
        response.raise_for_status()
        for item in response.json().get("buildings", []):
            if item.get("id") is not None:
                buildings[str(item["id"])] = item
    return list(buildings.values())


def is_plan_south(building: dict[str, Any]) -> bool:
    address = building.get("address") or {}
    developer = building.get("developer") or {}
    area = normalize(address.get("area"))
    city = normalize(address.get("city"))
    lat = address.get("latitude")
    lng = address.get("longitude")
    return all((
        str(developer.get("id") or "") == DEVELOPER_ID,
        "plano&plano" in normalize(developer.get("name")),
        city == "sao paulo",
        area in SOUTH_AREAS,
        isinstance(lat, (int, float)) and -24.0 < lat < -23.50,
        isinstance(lng, (int, float)) and -46.85 < lng < -46.55,
        building.get("active") == "active",
        building.get("publication_status") == "publicado",
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
    area = str(address.get("area") or "Zona Sul").strip()
    city = str(address.get("city") or "São Paulo").strip()
    state = str(address.get("state") or "SP").strip().upper()
    zipcode = str(address.get("zip_code") or "").strip()
    return ", ".join(part for part in (street, area, f"{city} - {state}", zipcode) if part)


def redact_address_number(value: Any, address: dict[str, Any]) -> str:
    text = clean_text(value)
    source_number = str(address.get("number") or "").strip()
    if source_number:
        text = re.sub(rf"(?<!\d){re.escape(source_number)}(?!\d)", "", text)
    return re.sub(r"\s+([,.;:])", r"\1", re.sub(r"\s+", " ", text)).strip(" ,-.")


def fetch_media_bundle(building: dict[str, Any]) -> dict[str, Any]:
    building_id = str(building["id"])
    dimensions = [("dimensions[]", "1024x1024"), ("dimensions[]", "2280x1800")]
    result: dict[str, Any] = {"detail": building, "images": [], "floor_plans": [], "errors": []}
    endpoints = (
        ("detail", DETAIL_API.format(building_id=building_id), None, None),
        ("images", IMAGE_API.format(building_id=building_id), dimensions, "images"),
        ("floor_plans", FLOORPLAN_API.format(building_id=building_id), dimensions, "floor_plans"),
    )
    for kind, url, params, collection_key in endpoints:
        try:
            response = requests.get(url, params=params, timeout=60)
            response.raise_for_status()
            payload = response.json()
            result[kind] = payload.get(collection_key, []) if collection_key else payload
        except Exception as exc:
            result["errors"].append({"external_id": building_id, "kind": kind, "error": str(exc)})
    return result


def phase(value: Any) -> str:
    text = normalize(value)
    if "pronto" in text or "entregue" in text:
        return "Pronto"
    if "lanc" in text:
        return "Lançamento"
    if "constr" in text or "obra" in text:
        return "Em construção"
    return "Sob consulta"


def housing_flags(name: str) -> dict[str, bool]:
    label = normalize(name)
    return {
        "is_r2v": bool(re.search(r"\br2v\b", label)),
        "is_his2": bool(re.search(r"\bhis[\s-]*2\b", label)),
        "is_hmp": bool(re.search(r"\bhmp\b", label)),
        "is_nr": bool(re.search(r"\bnr\b", label)),
    }


def number_range(minimum: Any, maximum: Any, singular: str, plural: str) -> str:
    if minimum is None and maximum is None:
        return ""
    if minimum is not None and maximum is not None and minimum != maximum:
        return f"de {minimum:g} a {maximum:g} {plural}"
    value = minimum if minimum is not None else maximum
    return f"{value:g} {singular if value == 1 else plural}"


def media_items(items: list[dict[str, Any]]) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    seen: set[str] = set()
    for item in items:
        url = valid_public_url(item.get("2280x1800") or item.get("1024x1024") or item.get("520x280"))
        if not url or url in seen:
            continue
        seen.add(url)
        result.append({"url": url, "description": clean_text(item.get("description"))})
    return result


def videos_from(detail: dict[str, Any]) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    seen: set[str] = set()
    for item in detail.get("videos") or []:
        video = item if isinstance(item, dict) else {"url": item}
        url = valid_public_url(video.get("url"))
        if not url or url in seen:
            continue
        seen.add(url)
        result.append({
            "url": url,
            "source": clean_text(video.get("source")),
            "description": clean_text(video.get("description")) or "Vídeo do empreendimento",
        })
    return result


def virtual_tours_from(detail: dict[str, Any]) -> list[str]:
    raw = detail.get("virtual_tours") or detail.get("virtual_tour") or []
    items = raw if isinstance(raw, list) else [raw]
    urls: list[str] = []
    for item in items:
        value = item.get("url") if isinstance(item, dict) else item
        url = valid_public_url(value)
        if url and url not in urls:
            urls.append(url)
    return urls


def source_typologies(detail: dict[str, Any]) -> list[dict[str, Any]]:
    fields = ("type", "private_area", "bedrooms", "bathrooms", "suites", "parking", "stock")
    return [{field: item.get(field) for field in fields} for item in detail.get("typologies") or []]


def detailed_description(detail: dict[str, Any], address: dict[str, Any], features: list[str], price_label: str) -> str:
    name = clean_text(detail.get("name"))
    area = clean_text(address.get("area")) or "Zona Sul"
    property_phase = phase(detail.get("stage") or detail.get("status"))
    area_range = number_range(detail.get("min_area"), detail.get("max_area"), "m²", "m²")
    bedroom_range = number_range(detail.get("min_bedrooms"), detail.get("max_bedrooms"), "dormitório", "dormitórios")
    bathroom_range = number_range(detail.get("min_bathrooms"), detail.get("max_bathrooms"), "banheiro", "banheiros")
    parking_range = number_range(detail.get("min_parking"), detail.get("max_parking"), "vaga", "vagas")
    specifications = ", ".join(value for value in (area_range, bedroom_range, bathroom_range, parking_range) if value)
    paragraphs = [
        f"{name} é um empreendimento da Plano & Plano em {area}, na Zona Sul de São Paulo. "
        f"O projeto está na fase {property_phase.lower()} e apresenta opções {specifications or 'com tipologias sob consulta'}. "
        f"O valor divulgado é {price_label.lower()}.",
    ]
    source_description = redact_address_number(detail.get("description"), address)
    if source_description:
        paragraphs.append(source_description)
    if features:
        highlights = ", ".join(features[:10])
        paragraphs.append(f"Entre os diferenciais informados estão {highlights}. A disponibilidade de cada item pode variar conforme a unidade e a fase do condomínio.")
    opening_date = clean_text(detail.get("opening_date"))
    if opening_date:
        paragraphs.append(f"A previsão de entrega informada pela fonte é {opening_date}. Datas e cronogramas podem ser atualizados pela incorporadora.")
    paragraphs.append(
        "Para preservar o atendimento da corretora responsável, o número do endereço não é exibido. "
        "Fale com Rosa Oliveira para confirmar a localização completa, unidades disponíveis, condições comerciais, financiamento e agendamento de visita."
    )
    return "\n\n".join(paragraphs)


def make_property(building: dict[str, Any], bundle: dict[str, Any]) -> dict[str, Any]:
    detail = bundle.get("detail") or building
    address = detail.get("address") or building.get("address") or {}
    building_id = str(building["id"])
    name = clean_text(detail.get("name") or building.get("name") or f"Empreendimento {building_id}")
    price = float(detail.get("min_price") or building.get("min_price") or 0)
    if price < 1000:
        price = 0
    price_label = f"A partir de R$ {price:,.0f}".replace(",", ".") if price else "Valor sob consulta"
    photo_media = media_items(bundle.get("images") or [])
    floorplan_media = media_items(bundle.get("floor_plans") or [])
    features = [clean_text(item) for item in detail.get("features") or building.get("features") or [] if clean_text(item)]
    min_area, max_area = detail.get("min_area"), detail.get("max_area")
    area_label = f"{min_area:g} a {max_area:g} m²" if min_area and max_area and min_area != max_area else (f"{min_area:g} m²" if min_area else "Área sob consulta")
    status_source = clean_text(detail.get("status") or building.get("status") or "Sob consulta")
    developer = clean_text((detail.get("developer") or building.get("developer") or {}).get("name"))
    social_housing = bool((detail.get("opportunity") or building.get("opportunity") or {}).get("social_housing_program"))
    description = detailed_description(detail, address, features, price_label)
    bedroom_label = number_range(detail.get("min_bedrooms"), detail.get("max_bedrooms"), "dormitório", "dormitórios") or "tipologias variadas"
    short_description = truncate(
        f"{name} em {address.get('area') or 'Zona Sul'}: {area_label}, {bedroom_label} e {price_label.lower()}. Veja fotos, plantas e detalhes com Rosa Oliveira.",
        280,
    )
    seo_description = truncate(
        f"Conheça {name}, Plano & Plano em {address.get('area') or 'Zona Sul de São Paulo'}: {area_label}, {bedroom_label}, {price_label.lower()}, fotos, plantas e localização.",
        158,
    )
    seo_title = truncate(f"{name} em {address.get('area')}: preços e plantas", 62)
    finality = clean_text(detail.get("finality") or building.get("finality") or "Residencial")
    property_type = "commercial" if "comercial" in normalize(finality) else "apartment"
    keywords = [
        name, "Plano & Plano", f"Plano & Plano {address.get('area')}",
        f"imóveis em {address.get('area')}", "imóveis na Zona Sul de São Paulo",
        f"apartamento {address.get('area')}", phase(detail.get("stage") or status_source),
    ]
    if social_housing:
        keywords.extend(["Minha Casa Minha Vida", "apartamento com FGTS"])
    return {
        "slug": slugify(f"{name}-{address.get('area')}-{building_id}"),
        "code": f"ORULO-{building_id}", "external_id": building_id, "name": name,
        "short_description": short_description, "seo_title": seo_title,
        "seo_description": seo_description, "keywords": list(dict.fromkeys(keywords)),
        "neighborhood": clean_text(address.get("area")) or "Zona Sul", "city": "São Paulo",
        "state": clean_text(address.get("state")) or "SP", "zipcode": clean_text(address.get("zip_code")),
        "address": street_only(address), "public_address": public_address(address), "number": None,
        "latitude": address.get("latitude"), "longitude": address.get("longitude"),
        "phase": phase(detail.get("stage") or status_source), "source_status": status_source,
        "source_active": building.get("active"), "source_publication_status": building.get("publication_status"),
        "launch_date": clean_text(detail.get("launch_date")) or None,
        "opening_date": clean_text(detail.get("opening_date")) or None,
        "area_min": min_area, "area_max": max_area, "area": area_label,
        "bedrooms_min": detail.get("min_bedrooms"), "bedrooms_max": detail.get("max_bedrooms"),
        "bathrooms_min": detail.get("min_bathrooms"), "bathrooms_max": detail.get("max_bathrooms"),
        "suites_min": detail.get("min_suites"), "suites_max": detail.get("max_suites"),
        "parking_min": detail.get("min_parking"), "parking_max": detail.get("max_parking"),
        "total_units": detail.get("total_units"), "stock": detail.get("stock"),
        "number_of_floors": detail.get("number_of_floors"), "number_of_towers": detail.get("number_of_towers"),
        "typologies": source_typologies(detail),
        "price": price or None, "price_label": price_label,
        "property_type": property_type, "finality": finality, "developer": developer,
        "mcmv": social_housing, "fgts": social_housing, **housing_flags(name),
        "description": description, "source_description": redact_address_number(detail.get("description"), address),
        "features": features,
        "photos": [item["url"] for item in photo_media], "photo_media": photo_media,
        "floorplans": [item["url"] for item in floorplan_media], "floorplan_media": floorplan_media,
        "videos": videos_from(detail), "virtual_tours": virtual_tours_from(detail),
        "source": "orulo", "source_url": valid_public_url(detail.get("orulo_url")) or f"https://www.orulo.com.br/buildings/{building_id}",
        "developer_url": valid_public_url(detail.get("webpage")),
        "source_updated_at": detail.get("updated_at") or building.get("updated_at"),
    }


def previous_codes(paths: list[Path]) -> dict[str, str]:
    result: dict[str, str] = {}
    for path in paths:
        if not path.exists():
            continue
        try:
            previous = json.loads(path.read_text(encoding="utf-8"))
            for item in previous.get("properties", []):
                if re.fullmatch(r"RMA-\d{6}", str(item.get("code") or "")):
                    result[str(item["external_id"])] = str(item["code"])
        except (OSError, ValueError, KeyError):
            continue
    return result


def write_csv(path: Path, properties: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = (
        "external_id", "name", "developer", "source_status", "phase", "price", "price_label",
        "area", "bedrooms_min", "address", "public_address", "neighborhood", "zipcode",
        "mcmv", "source_url",
    )
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
    codes = previous_codes([args.out, LEGACY_OUTPUT])
    session = requests.Session()
    catalog = fetch_catalog(session)
    candidates = sorted(
        (item for item in catalog if is_plan_south(item)),
        key=lambda item: (normalize((item.get("address") or {}).get("area")), normalize(item.get("name"))),
    )
    media: dict[str, dict[str, Any]] = {}
    errors: list[dict[str, str]] = []
    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 12))) as executor:
        jobs = {executor.submit(fetch_media_bundle, item): str(item["id"]) for item in candidates}
        for future in as_completed(jobs):
            building_id = jobs[future]
            try:
                media[building_id] = future.result()
                errors.extend(media[building_id].get("errors") or [])
            except Exception as exc:
                media[building_id] = {"detail": next(item for item in candidates if str(item["id"]) == building_id)}
                errors.append({"external_id": building_id, "kind": "bundle", "error": str(exc)})
    properties = [make_property(item, media.get(str(item["id"]), {"detail": item})) for item in candidates]
    used_sequences = [int(code.split("-")[1]) for code in codes.values()]
    next_sequence = max(used_sequences, default=0) + 1
    for item in properties:
        code = codes.get(item["external_id"])
        if not code:
            code = f"RMA-{next_sequence:06d}"
            next_sequence += 1
        item["code"] = code
    source_numbers = {str(item["id"]): str((item.get("address") or {}).get("number") or "") for item in candidates}
    generated_at = datetime.now(timezone.utc).isoformat()
    payload = {
        "generated_at": generated_at,
        "source": "Órulo — catálogo público",
        "filters": {
            "developer": DEVELOPER_LABEL,
            "developer_id": DEVELOPER_ID,
            "region": "Zona Sul de São Paulo",
            "availability": "ativos e publicados",
        },
        "count": len(properties),
        "properties": properties,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    write_csv(args.csv, properties)
    audit_path = args.csv.with_suffix(".audit.json")
    number_leaks = []
    for item in properties:
        number = source_numbers.get(item["external_id"], "")
        searchable = " ".join((item["address"], item["public_address"], item["description"]))
        if number and re.search(rf"(?<!\d){re.escape(number)}(?!\d)", searchable):
            number_leaks.append(item["external_id"])
    audit = {
        "generated_at": generated_at,
        "catalog_from_developer": len(catalog),
        "plano_plano_south": len(properties),
        "neighborhoods": sorted({item["neighborhood"] for item in properties}),
        "mcmv": sum(item["mcmv"] for item in properties),
        "photos": sum(len(item["photos"]) for item in properties),
        "floorplans": sum(len(item["floorplans"]) for item in properties),
        "videos": sum(len(item["videos"]) for item in properties),
        "virtual_tours": sum(len(item["virtual_tours"]) for item in properties),
        "with_photos": sum(bool(item["photos"]) for item in properties),
        "with_floorplans": sum(bool(item["floorplans"]) for item in properties),
        "without_address_number": sum(item["number"] is None for item in properties),
        "address_number_leaks": number_leaks,
        "statuses": {
            status: sum(item["source_status"] == status for item in properties)
            for status in sorted({item["source_status"] for item in properties})
        },
        "media_errors": errors,
    }
    audit_path.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({**audit, "media_errors": len(errors), "output": str(args.out), "csv": str(args.csv)}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
