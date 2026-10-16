#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
amai! KMO-website scanner - kernmodule voor de objectieve meting.

Meet per website uitsluitend machinaal vaststelbare indicatoren (sectie 6)
en de statische GEO-gereedheid (sectie 7.1). Subjectieve oordelen zoals
eerste indruk of esthetiek worden bewust niet gemeten, zodat elke scan
volledig deterministisch en herhaalbaar is.
"""
import re
import ssl
import json
import socket
from urllib.parse import urlparse, urljoin

import requests
from bs4 import BeautifulSoup

UA = "amai-onderzoek/1.0 (+https://amai.ch; KMO-website-nulmeting)"

AI_CRAWLERS = [
    "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot",
    "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Amazonbot",
]


def fetch(url, timeout=20):
    """Haalt een pagina op. Zuivere JavaScript-sites worden apart via een
    headless browser gerenderd; hier gebruiken we de server-HTML als basis."""
    return requests.get(url, headers={"User-Agent": UA},
                        timeout=timeout, allow_redirects=True)


def check_security(url):
    """HTTPS, certificaat, statuscode en redirectgedrag."""
    parts = urlparse(url)
    out = {"https": parts.scheme == "https", "cert_valid": False,
           "status_ok": False, "no_excess_redirects": False}
    try:
        resp = fetch(url)
    except requests.RequestException:
        return out, None
    out["status_ok"] = resp.status_code == 200
    out["no_excess_redirects"] = len(resp.history) <= 1
    out["final_https"] = urlparse(resp.url).scheme == "https"
    if out["https"] and parts.hostname:
        try:
            ctx = ssl.create_default_context()
            with ctx.wrap_socket(socket.socket(),
                                 server_hostname=parts.hostname) as sock:
                sock.settimeout(10)
                sock.connect((parts.hostname, 443))
            out["cert_valid"] = True
        except Exception:
            out["cert_valid"] = False
    return out, resp


def check_seo(soup):
    """Technische SEO: titel, beschrijving, koppen, canonical, alt-dekking."""
    title = (soup.title.string or "").strip() if soup.title else ""
    md = soup.find("meta", attrs={"name": "description"})
    desc = (md.get("content") or "").strip() if md else ""
    imgs = soup.find_all("img")
    with_alt = [i for i in imgs if i.get("alt")]
    words = len(re.findall(r"\w+", soup.get_text(" ")))
    return {
        "title_ok": 10 <= len(title) <= 65,
        "desc_ok": 50 <= len(desc) <= 160,
        "h1_exactly_one": len(soup.find_all("h1")) == 1,
        "canonical": soup.find("link", rel="canonical") is not None,
        "hreflang": len(soup.find_all("link", rel="alternate", hreflang=True)) > 0,
        "alt_coverage_ok": len(with_alt) >= 0.8 * max(len(imgs), 1),
        "enough_content": words >= 300,
    }


def check_mobile(soup):
    """Mobiele techniek: viewport en blokkering van zoom."""
    vp = soup.find("meta", attrs={"name": "viewport"})
    content = (vp.get("content") or "").lower() if vp else ""
    return {
        "viewport_present": vp is not None,
        "zoom_not_blocked": not ("maximum-scale=1" in content
                                 or "user-scalable=no" in content),
    }


def check_structured_data(soup):
    """Gestructureerde data: aanwezige en relevante JSON-LD-types."""
    types = set()
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "{}")
        except (ValueError, TypeError):
            continue
        for node in (data if isinstance(data, list) else [data]):
            t = node.get("@type") if isinstance(node, dict) else None
            types.update(t if isinstance(t, list) else [t] if t else [])
    wanted = {"Organization", "LocalBusiness", "Product", "FAQPage", "Article"}
    return {"jsonld_types": sorted(types), "has_key_schema": bool(types & wanted)}


def check_geo_access(base):
    """Statische GEO: toegang voor AI-crawlers en aanwezigheid van llms.txt."""
    try:
        robots = fetch(urljoin(base, "/robots.txt")).text.lower()
    except requests.RequestException:
        robots = ""
    access = {}
    for bot in AI_CRAWLERS:
        pattern = r"user-agent:\s*%s[\s\S]*?disallow:\s*/\s*$" % re.escape(bot.lower())
        access[bot] = "blocked" if re.search(pattern, robots, re.M) else "allowed"
    try:
        llms = fetch(urljoin(base, "/llms.txt")).status_code == 200
    except requests.RequestException:
        llms = False
    return {"ai_crawler_access": access, "llms_txt": llms}


def check_conversion(soup, html):
    """Aanwezigheid van conversie-elementen (niet de kwaliteit ervan)."""
    text = html.lower()
    mailtos = [a.get("href", "") for a in soup.select('a[href^="mailto:"]')]
    return {
        "phone_link": soup.select_one('a[href^="tel:"]') is not None,
        "email_valid": any("@" in m and "example" not in m for m in mailtos),
        "contact_form": soup.find("form") is not None,
        "price_visible": bool(re.search(r"(?:\u20ac|eur|chf)\s?\d", text)),
        "booking_widget": any(k in text for k in
                              ("calendly", "reserv", "booking", "afspraak", "agenda")),
        "has_cta": len(soup.select('a.btn, button, a[class*="cta"]')) > 0,
    }


def check_trust(soup, html, jsonld_types):
    """Aanwezigheid van vertrouwenssignalen."""
    text = html.lower()
    links = soup.find_all("a", href=True)
    labels = " ".join((a.get_text() or "").lower() for a in links)
    hrefs = " ".join(a.get("href", "") for a in links)
    return {
        "vat_number": bool(re.search(r"be\s?0\d{3}\.?\d{3}\.?\d{3}", text)),
        "address": bool(re.search(r"\b\d{4}\b\s+[a-z]{3,}", text)),
        "privacy_policy": "privac" in labels,
        "terms": "voorwaard" in labels or "conditions" in labels,
        "cookie_banner": "cookie" in text,
        "review_schema": any("review" in t.lower() for t in jsonld_types),
        "social_links": any(d in hrefs for d in
                            ("facebook", "instagram", "linkedin")),
    }


def coverage(section):
    """Dekkingsscore: het aandeel vervulde booleaanse criteria (0 tot 100)."""
    flags = [v for v in section.values() if isinstance(v, bool)]
    return round(100 * sum(flags) / len(flags)) if flags else None


def scan(url):
    """Volledige objectieve scan van een enkele website."""
    base = "%s://%s" % (urlparse(url).scheme, urlparse(url).netloc)
    security, resp = check_security(url)
    if resp is None:
        return {"url": url, "reachable": False}
    soup = BeautifulSoup(resp.text, "html.parser")
    sd = check_structured_data(soup)
    result = {
        "url": url,
        "reachable": True,
        "security": security,
        "seo": check_seo(soup),
        "mobile": check_mobile(soup),
        "structured_data": sd,
        "geo_access": check_geo_access(base),
        "conversion": check_conversion(soup, resp.text),
        "trust": check_trust(soup, resp.text, sd["jsonld_types"]),
        # Laadprestatie (LCP, CLS, TBT) wordt aanvullend met Lighthouse
        # gemeten; de live GEO-citatietest verloopt via een aparte module.
    }
    result["coverage"] = {
        key: coverage(result[key])
        for key in ("security", "seo", "mobile", "conversion", "trust")
    }
    return result


if __name__ == "__main__":
    import sys
    print(json.dumps(scan(sys.argv[1]), indent=2, ensure_ascii=False))
