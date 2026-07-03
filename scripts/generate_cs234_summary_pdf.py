#!/usr/bin/env python3
"""Generate a compact PDF from notes/cs234-reading-brief.md without external deps."""
from __future__ import annotations

import argparse
import re
import textwrap
from pathlib import Path

PAGE_W, PAGE_H = 612, 792
LEFT, TOP, LINE_H = 54, 740, 13
FONT_SIZE = 9
MAX_LINES = 52


def esc(text: str) -> str:
    return text.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')


def md_to_lines(markdown: str) -> list[str]:
    lines: list[str] = []
    for raw in markdown.splitlines():
        s = raw.strip()
        if not s:
            lines.append("")
            continue
        s = re.sub(r"<([^>]+)>", r"\1", s)
        s = s.replace("**", "").replace("`", "")
        if s.startswith("#"):
            s = s.lstrip("# ").upper()
        if s.startswith("|"):
            parts = [part.strip() for part in s.strip("|").split("|")]
            if parts and not all(set(part) <= {"-", ":", " "} for part in parts):
                s = " | ".join(parts)
            else:
                continue
        for wrapped in textwrap.wrap(s, width=96, replace_whitespace=False) or [""]:
            lines.append(wrapped)
    return lines


def pdf_stream_for_page(lines: list[str]) -> bytes:
    chunks = ["BT", f"/F1 {FONT_SIZE} Tf", f"{LEFT} {TOP} Td"]
    first = True
    for line in lines:
        if not first:
            chunks.append(f"0 -{LINE_H} Td")
        first = False
        chunks.append(f"({esc(line)}) Tj")
    chunks.append("ET")
    return "\n".join(chunks).encode("latin-1", errors="replace")


def write_pdf(lines: list[str], output: Path) -> None:
    pages = [lines[i:i + MAX_LINES] for i in range(0, len(lines), MAX_LINES)] or [[""]]
    objects: list[bytes] = []
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    kids = " ".join(f"{3 + i * 2} 0 R" for i in range(len(pages)))
    objects.append(f"<< /Type /Pages /Kids [{kids}] /Count {len(pages)} >>".encode())
    for i, page_lines in enumerate(pages):
        page_obj_num = 3 + i * 2
        content_obj_num = page_obj_num + 1
        objects.append(
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] "
            f"/Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> "
            f"/Contents {content_obj_num} 0 R >>".encode()
        )
        stream = pdf_stream_for_page(page_lines)
        objects.append(b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream")

    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for idx, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out.extend(f"{idx} 0 obj\n".encode())
        out.extend(obj)
        out.extend(b"\nendobj\n")
    xref = len(out)
    out.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    out.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        out.extend(f"{offset:010d} 00000 n \n".encode())
    out.extend(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(out)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="notes/cs234-reading-brief.md")
    parser.add_argument("--output", default="notes/cs234-reading-brief.pdf")
    args = parser.parse_args()
    markdown = Path(args.input).read_text()
    write_pdf(md_to_lines(markdown), Path(args.output))
    print(f"Generated {args.output}")


if __name__ == "__main__":
    main()
