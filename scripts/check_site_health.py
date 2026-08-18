#!/usr/bin/env python3
"""Check UK Solar Sizer pages and commercial links using only stdlib."""
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

BASE = "https://uksolarsizer.co.uk"
HEADERS = {"User-Agent": "UKSolarSizer-SiteHealth/1.0"}

class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.hrefs = set()
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href")
            if href: self.hrefs.add(href)

def get(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception:
        return None, ""

def main():
    failures = []
    status, xml = get(BASE + "/sitemap.xml")
    if status != 200:
        print("FAIL sitemap unavailable"); return 1
    root = ET.fromstring(xml)
    pages = [n.text.strip() for n in root.findall("{*}url/{*}loc") if n.text]
    internal = set(pages)
    for page in pages:
        code, html = get(page)
        if code != 200:
            failures.append(f"page {code}: {page}"); continue
        parser = Links(); parser.feed(html)
        for href in parser.hrefs:
            if href.startswith(("#", "mailto:", "tel:", "javascript:")): continue
            url = urllib.parse.urljoin(page, href).split("#", 1)[0]
            if urllib.parse.urlsplit(url).netloc == urllib.parse.urlsplit(BASE).netloc:
                internal.add(url)
    for url in sorted(internal):
        code, _ = get(url)
        if code is None or code >= 400: failures.append(f"internal {code}: {url}")

    code, body = get(BASE + "/data/commercial-links.json")
    if code != 200:
        failures.append("commercial-links.json unavailable")
    else:
        try:
            data = json.loads(body)
            for product in data.get("products", []):
                if not product.get("enabled"): continue
                url = product.get("destination", "")
                if not url.startswith(("http://", "https://")):
                    failures.append(f"bad commercial URL: {product.get('id')}"); continue
                result, _ = get(url)
                if result in (404, 410) or result is None:
                    failures.append(f"commercial link failed {result}: {product.get('id')} {url}")
                elif result in (401, 403, 429):
                    print(f"WARN automated check blocked {result}: {product.get('id')}")
        except json.JSONDecodeError as e:
            failures.append(f"commercial-links.json invalid: {e}")

    for failure in failures: print("FAIL", failure)
    if failures:
        print(f"Site health FAILED with {len(failures)} issue(s)"); return 1
    print(f"Site health PASSED: {len(pages)} sitemap pages, {len(internal)} internal URLs")
    return 0

if __name__ == "__main__":
    sys.exit(main())
