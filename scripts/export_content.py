#!/usr/bin/env python3
"""Turn an export of the live atlas database into the site's content files.

Claude runs this after pulling the four collections from the private atlas
(entities, tok_entities, moves, tok_moves) into one folder, one JSON file per
document. Usage:

    python3 scripts/export_content.py /path/to/export

It rewrites content/stablecoins/*.json and content/tokenization/*.json.
Atlas configuration (layers, groups, filters) and site copy are never
touched, so your edits to those files are safe.
"""
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRIVATE_FIELDS = {"moonpay", "moonpayNote", "_id"}  # internal-only fields kept out of the public site

ATLASES = {
    "stablecoins": ("entities", "moves"),
    "tokenization": ("tok_entities", "tok_moves"),
    "ai": ("ai_entities", "ai_moves"),
}


def load(folder: Path):
    docs = []
    for f in sorted(folder.glob("*.json")):
        doc = json.loads(f.read_text(encoding="utf-8"))
        doc.setdefault("id", f.stem)
        docs.append({k: v for k, v in doc.items() if k not in PRIVATE_FIELDS})
    return docs


def main(export_dir: str) -> None:
    src = Path(export_dir)
    stamp = date.today().isoformat()
    for atlas, (players_col, moves_col) in ATLASES.items():
        out = ROOT / "content" / atlas
        out.mkdir(parents=True, exist_ok=True)
        players = sorted(load(src / players_col), key=lambda d: d.get("name", "").lower())
        moves = sorted(load(src / moves_col), key=lambda d: d.get("date", ""), reverse=True)
        (out / "players.json").write_text(json.dumps({"updated": stamp, "players": players}, ensure_ascii=False, indent=1), encoding="utf-8")
        (out / "initiatives.json").write_text(json.dumps({"updated": stamp, "initiatives": moves}, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"{atlas}: {len(players)} players, {len(moves)} corporate initiatives")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
