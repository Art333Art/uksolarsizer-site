"""Dependency-free validation for the static UK Solar Sizer site."""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "https://uksolarsizer.co.uk"
CALCULATOR = "https://uksolarsizer.streamlit.app"
VERIFY = "jkMhTjEet0DjQX3KZN_IcPw0JfZ4yDgTycbVsBe099s"


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.scripts, self.titles, self.descriptions, self.canonicals = [], [], [], [], []
        self._title = False

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "a" and data.get("href"): self.links.append(data["href"])
        if tag == "script" and data.get("type") == "application/ld+json": self.scripts.append("")
        if tag == "meta" and data.get("name") == "description": self.descriptions.append(data.get("content", ""))
        if tag == "link" and data.get("rel") == "canonical": self.canonicals.append(data.get("href", ""))
        if tag == "title": self._title = True

    def handle_endtag(self, tag):
        if tag == "title": self._title = False

    def handle_data(self, data):
        if self._title: self.titles.append(data.strip())
        if self.scripts and not self.get_starttag_text(): self.scripts[-1] += data


def page_url(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    return DOMAIN + "/" if rel == "index.html" else DOMAIN + "/" + rel.removesuffix("index.html")


errors, titles, descriptions, pages = [], {}, {}, {}
for path in sorted(ROOT.glob("**/index.html")):
    text = path.read_text(encoding="utf-8")
    parser = PageParser(); parser.feed(text); pages[path] = parser
    label = path.relative_to(ROOT)
    if VERIFY not in text: errors.append(f"{label}: missing Google verification")
    if len(parser.titles) != 1 or not parser.titles[0]: errors.append(f"{label}: invalid title")
    if len(parser.descriptions) != 1: errors.append(f"{label}: requires one meta description")
    if parser.titles: titles.setdefault(parser.titles[0], []).append(str(label))
    if parser.descriptions: descriptions.setdefault(parser.descriptions[0], []).append(str(label))
    expected = page_url(path)
    if parser.canonicals != [expected]: errors.append(f"{label}: canonical {parser.canonicals!r}, expected {expected}")
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', text, re.S):
        try: json.loads(block)
        except json.JSONDecodeError as exc: errors.append(f"{label}: invalid JSON-LD: {exc}")
    if path.parent != ROOT and "technical" in text.lower() and "source" not in text.lower():
        errors.append(f"{label}: technical guide missing source section")
    for href in parser.links:
        if href.startswith("/"):
            clean = href.split("#", 1)[0].split("?", 1)[0]
            target = ROOT / clean.lstrip("/")
            if clean.endswith("/"): target /= "index.html"
            if not target.exists(): errors.append(f"{label}: broken internal link {href}")

for value, owners in titles.items():
    if len(owners) > 1: errors.append(f"duplicate title {value!r}: {owners}")
for value, owners in descriptions.items():
    if len(owners) > 1: errors.append(f"duplicate description: {owners}")

tree = ET.parse(ROOT / "sitemap.xml")
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
sitemap = {node.text for node in tree.findall("s:url/s:loc", ns)}
expected_urls = {page_url(path) for path in pages}
if sitemap != expected_urls: errors.append(f"sitemap mismatch missing={expected_urls-sitemap} extra={sitemap-expected_urls}")

commercial = json.loads((ROOT / "data/commercial-links.json").read_text(encoding="utf-8"))
ids = [item["id"] for item in commercial["products"]]
if len(ids) != len(set(ids)): errors.append("duplicate commercial product IDs")
html = "\n".join(path.read_text(encoding="utf-8") for path in pages)
for item in commercial["products"]:
    if not item.get("enabled") and item.get("destination") and item["destination"] in html:
        errors.append(f"disabled product rendered: {item['id']}")
if CALCULATOR not in html: errors.append("calculator link missing")
if ".primary-nav { display: none; }" not in (ROOT / "styles.css").read_text(encoding="utf-8"):
    errors.append("responsive navigation rule missing")

if errors:
    print("VALIDATION FAILED")
    print("\n".join(f"- {item}" for item in errors))
    sys.exit(1)
print(f"VALIDATION PASSED: {len(pages)} pages, {sum(len(p.links) for p in pages.values())} links")
