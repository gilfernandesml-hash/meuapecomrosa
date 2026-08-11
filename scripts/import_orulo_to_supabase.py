"""Importa o JSON Órulo no Supabase exclusivo do Meu Apê com Rosa.

Executa dry-run por padrão. Use --apply somente depois de configurar o arquivo
.env.local deste projeto; credenciais de outros projetos nunca são lidas.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests

DEFAULT_INPUT = Path("src/data/orulo-mcmv-zona-sul.json")


def load_env(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    result: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        text = line.strip()
        if not text or text.startswith("#") or "=" not in text:
            continue
        key, value = text.split("=", 1)
        result[key.strip()] = value.strip().strip('"').strip("'")
    return result


class SupabaseRest:
    def __init__(self, url: str, key: str) -> None:
        self.base = url.rstrip("/") + "/rest/v1"
        self.headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}

    def request(self, method: str, path: str, payload: Any | None = None, prefer: str | None = None) -> Any:
        headers = dict(self.headers)
        if prefer:
            headers["Prefer"] = prefer
        response = requests.request(method, f"{self.base}/{path}", headers=headers, json=payload, timeout=60)
        if not response.ok:
            raise RuntimeError(f"Supabase REST {response.status_code}: {response.text}")
        return response.json() if response.text else None


def parse_source_datetime(value: str | None) -> str | None:
    if not value:
        return None
    return datetime.strptime(value, "%d/%m/%Y %H:%M:%S").isoformat()


def property_payload(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": item["name"], "full_name": item["name"], "slug": item["slug"], "seo_slug": item["slug"],
        "description": item["description"], "short_description": item["description"][:280],
        "property_type": "apartment", "profile": "mcmv", "phase": item["phase"], "purpose": "sale",
        "builder": item.get("developer") or None, "developer": item.get("developer") or None,
        "address": item["address"], "number": None, "neighborhood": item["neighborhood"], "city": item["city"],
        "state": item["state"], "zipcode": item["zipcode"], "latitude": item.get("latitude"), "longitude": item.get("longitude"),
        "area_min": item.get("area_min"), "area_max": item.get("area_max"),
        "bedrooms_min": item.get("bedrooms_min"), "bedrooms_max": item.get("bedrooms_max"),
        "suites_min": item.get("suites_min"), "suites_max": item.get("suites_max"),
        "bathrooms_min": item.get("bathrooms_min"), "bathrooms_max": item.get("bathrooms_max"),
        "parking_min": item.get("parking_min"), "parking_max": item.get("parking_max"),
        "price": item.get("price"), "price_label": item["price_label"], "featured": False,
        "status": "available" if item.get("source_active") == "active" and item.get("source_publication_status") == "publicado" else "draft",
        "is_mcmv": True, "is_his2": bool(item.get("is_his2")), "is_hmp": bool(item.get("is_hmp")),
        "is_r2v": bool(item.get("is_r2v")), "is_nr": bool(item.get("is_nr")), "fgts_possible": True,
        "source": "orulo", "source_id": item["external_id"],
        "source_url": item["source_url"], "last_synced_at": parse_source_datetime(item.get("source_updated_at")),
        "meta_title": f"{item['name']} em {item['neighborhood']}"[:70],
        "meta_description": item["description"][:160], "keywords": [item["name"], item["neighborhood"], "Minha Casa Minha Vida", "Zona Sul de São Paulo"],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    data = json.loads(args.input.read_text(encoding="utf-8"))
    items = data.get("properties", [])
    if not args.apply:
        print(json.dumps({"mode": "dry-run", "candidates": len(items), "addresses_without_number": sum(item.get("number") is None for item in items)}, ensure_ascii=False, indent=2))
        return 0
    env = load_env(Path(".env.local"))
    url, key = env.get("NEXT_PUBLIC_SUPABASE_URL", ""), env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise RuntimeError("Configure o Supabase exclusivo do Meu Apê com Rosa em .env.local antes de usar --apply")
    client = SupabaseRest(url, key)
    inserted = updated = images_written = features_written = 0
    for item in items:
        source_id = quote(str(item["external_id"]), safe="")
        existing = client.request("GET", f"properties?source=eq.orulo&source_id=eq.{source_id}&select=id,is_his2,is_hmp,is_r2v,is_nr&limit=1") or []
        payload = property_payload(item)
        if existing:
            property_id = existing[0]["id"]
            for flag in ("is_his2", "is_hmp", "is_r2v", "is_nr"):
                payload[flag] = bool(payload[flag] or existing[0].get(flag))
            client.request("PATCH", f"properties?id=eq.{property_id}", payload, "return=minimal")
            updated += 1
        else:
            created = client.request("POST", "properties?select=id", payload, "return=representation")
            property_id = created[0]["id"]
            inserted += 1
        client.request("DELETE", f"property_images?property_id=eq.{property_id}", prefer="return=minimal")
        client.request("DELETE", f"property_floorplans?property_id=eq.{property_id}", prefer="return=minimal")
        client.request("DELETE", f"property_features?property_id=eq.{property_id}", prefer="return=minimal")
        image_rows = [{"property_id": property_id, "storage_path": url, "public_url": url, "caption": None, "alt_text": f"{item['name']} — imagem {index + 1}", "is_cover": index == 0, "sort_order": index} for index, url in enumerate(item.get("photos", []))]
        floor_rows = [{"property_id": property_id, "storage_path": url, "public_url": url, "name": f"Planta {index + 1}", "caption": None, "alt_text": f"Planta do {item['name']}", "sort_order": index} for index, url in enumerate(item.get("floorplans", []))]
        feature_rows = [{"property_id": property_id, "category": "general", "name": name, "sort_order": index} for index, name in enumerate(item.get("features", []))]
        if image_rows:
            client.request("POST", "property_images", image_rows, "return=minimal"); images_written += len(image_rows)
        if floor_rows:
            client.request("POST", "property_floorplans", floor_rows, "return=minimal")
        if feature_rows:
            client.request("POST", "property_features", feature_rows, "return=minimal"); features_written += len(feature_rows)
    print(json.dumps({"mode": "apply", "inserted": inserted, "updated": updated, "images": images_written, "features": features_written}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
