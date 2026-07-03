#!/usr/bin/env python3
"""Download the public CS234 PDF reading bundle.

The manifest is intentionally explicit so the course PDFs can be downloaded in
network environments where Stanford/incompleteideas hosts are reachable.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

PDFS = [
    ("sutton-barto-rlbook2020.pdf", "http://incompleteideas.net/book/RLbook2020.pdf"),
    ("cs229-linalg.pdf", "https://cs229.stanford.edu/section/cs229-linalg.pdf"),
    ("cs229-prob.pdf", "https://cs229.stanford.edu/section/cs229-prob.pdf"),
    ("bandit-algorithms.pdf", "https://tor-lattimore.com/downloads/book/book.pdf"),
    ("lecture1pre.pdf", "https://web.stanford.edu/class/cs234/slides/lecture1pre.pdf"),
    ("lecture1post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture1post.pdf"),
    ("lecture2pre.pdf", "https://web.stanford.edu/class/cs234/slides/lecture2pre.pdf"),
    ("lecture2post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture2post.pdf"),
    ("lecture3pre.pdf", "https://web.stanford.edu/class/cs234/slides/lecture3pre.pdf"),
    ("lecture3post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture3post.pdf"),
    ("lecture4pre.pdf", "https://web.stanford.edu/class/cs234/slides/lecture4pre.pdf"),
    ("lecture4post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture4post.pdf"),
    ("lecture5pre.pdf", "https://web.stanford.edu/class/cs234/slides/lecture5pre.pdf"),
    ("lecture5post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture5post.pdf"),
    ("lecture6pre.pdf", "https://web.stanford.edu/class/cs234/slides/lecture6pre.pdf"),
    ("lecture6post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture6post.pdf"),
    ("lecture7pre.pdf", "https://web.stanford.edu/class/cs234/slides/lecture7pre.pdf"),
    ("lecture7post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture7post.pdf"),
    ("lecture8pre.pdf", "https://web.stanford.edu/class/cs234/slides/lecture8pre.pdf"),
    ("lecture8post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture8post.pdf"),
    ("lecture9pre.pdf", "https://web.stanford.edu/class/cs234/slides/lecture9pre.pdf"),
    ("lecture9post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture9post.pdf"),
    ("lecture10post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture10post.pdf"),
    ("lecture11pre.pdf", "https://web.stanford.edu/class/cs234/slides/lecture11pre.pdf"),
    ("lecture11post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture11post.pdf"),
    ("lecture12pre.pdf", "https://web.stanford.edu/class/cs234/slides/lecture12pre.pdf"),
    ("lecture12post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture12post.pdf"),
    ("ethics_society_234_2.pdf", "https://web.stanford.edu/class/cs234/slides/ethics_society_234_2.pdf"),
    ("lecture13pre.pdf", "https://web.stanford.edu/class/cs234/slides/lecture13pre.pdf"),
    ("lecture13post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture13post.pdf"),
    ("lecture14pre.pdf", "https://web.stanford.edu/class/cs234/slides/lecture14pre.pdf"),
    ("lecture14post.pdf", "https://web.stanford.edu/class/cs234/slides/lecture14post.pdf"),
    ("ShaneGuCS234_2026.pdf", "https://web.stanford.edu/class/cs234/slides/ShaneGuCS234_2026.pdf"),
]

def download(name: str, url: str, out_dir: Path, timeout: int) -> dict[str, str]:
    target = out_dir / name
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 CS234 reading brief downloader"})
    try:
        with urlopen(req, timeout=timeout) as response:
            data = response.read()
        if not data.startswith(b"%PDF"):
            return {"name": name, "url": url, "status": "error", "detail": "response was not a PDF"}
        target.write_bytes(data)
        return {"name": name, "url": url, "status": "downloaded", "path": str(target), "bytes": str(len(data))}
    except (HTTPError, URLError, TimeoutError, OSError) as exc:
        return {"name": name, "url": url, "status": "error", "detail": str(exc)}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", default="downloads/cs234-pdfs", help="Directory for downloaded PDFs")
    parser.add_argument("--timeout", type=int, default=45)
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    results = [download(name, url, out_dir, args.timeout) for name, url in PDFS]
    manifest = out_dir / "manifest.json"
    manifest.write_text(json.dumps(results, indent=2) + "\n")
    downloaded = sum(item["status"] == "downloaded" for item in results)
    print(f"Downloaded {downloaded}/{len(results)} PDFs; manifest: {manifest}")
    return 0 if downloaded == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
