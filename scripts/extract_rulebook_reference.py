#!/usr/bin/env python3
"""Extract the private rulebook reference payload used by the v1.1 local build."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Apawthecaria v1.3.pdf"
OUTPUT = ROOT / "public" / "rulebook" / "reference-pages.json"


def compact_page_text(value: str) -> str:
    lines = [line.rstrip() for line in value.replace("\u00a0", " ").splitlines()]
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return "\n".join(lines)


def main() -> None:
    reader = PdfReader(str(SOURCE))
    pages = [
        {"page": index, "text": compact_page_text(page.extract_text() or "")}
        for index, page in enumerate(reader.pages, start=1)
    ]
    payload = {
        "source": "Apawthecaria v1.3.pdf",
        "edition": "First Edition, Third Printing (May 2023)",
        "sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "pageCount": len(pages),
        "pages": pages,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Extracted {len(pages)} pages to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
