#!/usr/bin/env python3
"""Bouwt één zelfstandig HTML bestand uit shell.html + engine.js + ui.js + een productbestand.

    python3 build.py products/tuinhuis.js brands/voorbeeld.py --out dist/index.html

Het merkbestand is een python module met een dict BRAND (kleuren, fonts, teksten,
logo, tegels). Zie brands/voorbeeld.py.
"""
import argparse, base64, datetime, hashlib, html, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
GOOGLE = {'Poppins', 'Open Sans', 'Montserrat', 'Oswald', 'Roboto', 'Lato', 'Quicksand', 'Nunito',
          'Capriola', 'Geologica', 'Figtree', 'Fredoka', 'Libre Franklin', 'Rubik', 'Inter', 'Source Sans 3'}


def hex2rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def rgb2hex(r, g, b): return '#%02X%02X%02X' % tuple(max(0, min(255, round(v))) for v in (r, g, b))


def lum(h):
    r, g, b = [c / 255 for c in hex2rgb(h)]
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def mix(h, target, t):
    a, b = hex2rgb(h), hex2rgb(target)
    return rgb2hex(*[a[i] + (b[i] - a[i]) * t for i in range(3)])


def palette(style):
    """Van twee merkkleuren naar een volledig, leesbaar tokenset.

    Optioneel in style:
      cta         eigen actiekleur voor de primaire knop en het totaal.
                  Laat je die weg, dan blijft dat de accentkleur.
      radius      hoekstraal in px. 0 tot 5 geeft een vlakke, webshopachtige
                  vormtaal, 10 tot 14 de zachte kaartlook.
      labelCase   'upper' zet de sectiekoppen in kapitalen.
      tokens      dict met ruwe CSS variabelen, wint van alles hierboven.
    """
    prim = style.get('primary') or '#2E6B3A'
    acc = style.get('accent') or prim
    cands = [c for c in (prim, acc) if c]
    dark = [c for c in cands if lum(c) < 0.35]
    accent = dark[0] if dark else mix(cands[0], '#000000', 0.35)
    soft = [c for c in cands if c != accent]
    accent_soft = mix(soft[0], '#FFFFFF', 0.72) if soft and lum(soft[0]) > 0.35 else mix(accent, '#FFFFFF', 0.82)
    ink = style['text'] if style.get('text') and lum(style['text']) < 0.2 else mix(accent, '#000000', 0.75)
    cta = style.get('cta') or accent
    cr, cg, cb = hex2rgb(cta)
    r, g, b = hex2rgb(accent)
    return dict(cta=cta, ctaHover=mix(cta, '#000000', 0.12), ctaInk=style.get('ctaInk', '#FFFFFF'),
                ctaRgb='%d,%d,%d' % (cr, cg, cb), price=style.get('price') or cta,ground=mix(accent, '#FFFFFF', 0.94), panel='#FFFFFF', panel2=mix(accent, '#FFFFFF', 0.90),
                ink=ink, muted=mix(ink, '#FFFFFF', 0.42), line=mix(accent, '#FFFFFF', 0.80), accent=accent,
                accentInk='#FFFFFF', accentSoft=accent_soft, focus=mix(accent, '#FFFFFF', 0.3), wood=accent,
                rgb='%d,%d,%d' % (r, g, b), sky1=style.get('sky1', '#C9DDEA'), sky2=style.get('sky2', '#E2ECEF'),
                sky3=style.get('sky3', '#E9EEE5'), logoBg=style.get('logoBg') or 'transparent')


def shape(style):
    """Hoekstraal en sectielabels. Vlak en in kapitalen leest als een webshop,
    rond en in kleine letters als een losse configurator."""
    rad = style.get('radius')
    rad = 10 if rad is None else float(rad)
    md = rad
    return dict(rsm='%gpx' % max(0, rad * 0.55), rmd='%gpx' % md, rlg='%gpx' % (rad * 1.4),
                rpill='999px' if rad >= 6 else '%gpx' % md,
                labelCase='uppercase' if style.get('labelCase') == 'upper' else 'none',
                labelWeight=style.get('labelWeight', 700 if style.get('labelCase') == 'upper' else 600),
                labelSize=style.get('labelSize', '15px' if style.get('labelCase') == 'upper' else '18px'),
                labelTrack='.03em' if style.get('labelCase') == 'upper' else '0')


def font_link(fonts):
    fams = ['family=' + f.replace(' ', '+') + ':wght@400;500;600;700' for f in fonts if f in GOOGLE]
    if not fams:
        return ''
    return ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' + '&'.join(dict.fromkeys(fams)) + '&display=swap">')


def data_uri(path):
    if not path or not os.path.exists(path):
        return None
    ext = path.rsplit('.', 1)[-1].lower()
    mime = {'svg': 'image/svg+xml', 'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp'}[ext]
    return 'data:' + mime + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()


def eur(n):
    """1848 -> 1.848,00, zoals de prijzen in de UI en op de webshop."""
    return re.sub(r'\B(?=(\d{3})+(?!\d))', '.', '%d' % int(n)) + ',%02d' % round((n - int(n)) * 100)


def esc(s): return html.escape(str(s), quote=True)
def ent(s): return ''.join(c if ord(c) < 128 else '&#%d;' % ord(c) for c in s)   # mojibake-vrij


def build(product_js, brand_py, out):
    ns = {}
    exec(open(brand_py, encoding='utf-8').read(), ns)
    B = ns['BRAND']
    style = B.get('style', {})
    pal = palette(style)
    shp = shape(style)
    hf = style.get('headingFont', 'Poppins')
    bf = style.get('bodyFont', 'Poppins')

    vars_ = (f"--ground:{pal['ground']}; --panel:{pal['panel']}; --panel-2:{pal['panel2']}; --ink:{pal['ink']}; --muted:{pal['muted']};\n"
             f"    --line:{pal['line']}; --accent:{pal['accent']}; --accent-ink:{pal['accentInk']}; --accent-soft:{pal['accentSoft']}; --accent-rgb:{pal['rgb']};\n"
             f"    --wood:{pal['wood']}; --demo-bg:{pal['panel2']}; --demo-ink:{pal['accent']}; --focus:{pal['focus']}; --logo-bg:{pal['logoBg']};\n"
             f"    --sky1:{pal['sky1']}; --sky2:{pal['sky2']}; --sky3:{pal['sky3']};\n"
             f"    --shadow:0 10px 30px rgba({pal['rgb']},.16);\n"
             f'    --display:"{hf}","Helvetica Neue",Arial,sans-serif;\n'
             f'    --body:"{bf}","Helvetica Neue",Arial,sans-serif;\n'
             f"    --cta:{pal['cta']}; --cta-hover:{pal['ctaHover']}; --cta-ink:{pal['ctaInk']}; --cta-rgb:{pal['ctaRgb']};\n"
             f"    --price:{pal['price']};\n"
             f"    --r-sm:{shp['rsm']}; --r-md:{shp['rmd']}; --r-lg:{shp['rlg']}; --r-pill:{shp['rpill']};\n"
             f"    --label-case:{shp['labelCase']}; --label-weight:{shp['labelWeight']};"
             f" --label-size:{shp['labelSize']}; --label-track:{shp['labelTrack']};")
    for k, v in (style.get('tokens') or {}).items():
        vars_ += f'\n    --{k}:{v};'

    logo = data_uri(B.get('logo'))
    name, tag = B['name'], B.get('tagline', '')
    lb = 'logo-bg' if style.get('logoBg') else ''
    if logo and B.get('logoOnly'):
        # het beeldmerk bevat de naam al, dus geen woordmerk ernaast
        land_logo = f'<img class="{lb}" src="{logo}" alt="{esc(name)}">'
        panel_logo = f'<div class="logo logo-only"><img class="{lb}" src="{logo}" alt="{esc(name)}"></div>'
    elif logo:
        land_logo = f'<img class="{lb}" src="{logo}" alt="{esc(name)}"><span class="wm">{ent(esc(name))}<small>{ent(esc(tag))} &#183; 3D configurator</small></span>'
        panel_logo = f'<div class="logo"><img class="{lb}" src="{logo}" alt="{esc(name)}"><span class="wm">{ent(esc(name))}<small>{ent(esc(tag))}</small></span></div>'
    else:
        land_logo = f'<span class="wm">{ent(esc(name))}<small>{ent(esc(tag))} &#183; 3D configurator</small></span>'
        panel_logo = f'<div class="logo"><span class="wm">{ent(esc(name))}<small>{ent(esc(tag))}</small></span></div>'

    tiles = []
    for i, t in enumerate(B.get('tiles', [])):
        du = data_uri(t.get('image'))
        img = f'<img src="{du}" alt="{esc(t["name"])}">' if du else ''
        ni = '' if du else ' noimg'
        prijs = '' if t.get('price') in (None, '') else ent('&#8364; ' + eur(t['price']))
        if t.get('live'):
            tiles.append(f'      <button class="tile live{ni}" data-open="1"><span class="pill avail">Configureer</span>{img}'
                         f'<span class="tb"><b>{ent(esc(t["name"]))}</b><small>{prijs}</small><span class="cta">Stel samen in 3D</span></span></button>')
        else:
            tiles.append(f'      <div class="tile soon{ni}" aria-disabled="true"><span class="pill">Binnenkort online</span>{img}'
                         f'<span class="tb"><b>{ent(esc(t["name"]))}</b><small>{prijs}</small></span></div>')
    n = len(tiles)
    tclass = 'n%d' % min(n, 5) if 0 < n < 5 else ''

    brand_js = json.dumps({'name': name, 'vat': B.get('vat', 0.21), 'pricing': B.get('pricing', 'incl'),
                           'text': B.get('text', {})}, ensure_ascii=True, separators=(',', ':')).replace('</', '<\\/')

    build_id = hashlib.sha1((name + datetime.date.today().isoformat()).encode()).hexdigest()[:10]
    wm = B.get('watermark', 'SEMANU prototype 3D configurator')
    wm_meta = (f'<meta name="generator" content="{esc(wm)}">\n'
               f'<!-- {esc(wm)} | build {build_id} | {datetime.date.today().isoformat()} -->')

    shell = open(os.path.join(HERE, 'shell.html'), encoding='utf-8').read()
    reps = {
        '__TITLE__': ent(esc(B.get('title', name + ' configurator'))),
        '__WM_META__': wm_meta,
        '__FONT_LINK__': font_link([hf, bf]),
        '__VARS__': vars_,
        '__PROTO__': ent(esc(B.get('proto', 'Dit is een prototype, alles kan nog volledig aan uw wens ingevuld worden.'))),
        '__LOGO_LAND__': land_logo,
        '__LOGO_PANEL__': panel_logo,
        '__LAND_H2__': ent(esc(B.get('landingTitle', 'Stel jouw ' + name.lower() + ' samen'))),
        '__LAND_P__': ent(esc(B.get('landingText', ''))),
        '__TILES__': '\n'.join(tiles),
        '__TILES_CLASS__': tclass,
        '__CART__': ent(esc(B.get('text', {}).get('cartBtn', 'Toevoegen winkelmandje'))),
        '__WMARK__': '',
        '__MODAL_SUB__': ent(esc(B.get('modalSub', 'Dit is een prototype: in de echte koppeling gaat deze samenstelling naar de webshop of naar een offerte.'))),
        '__BRAND__': brand_js,
        '__PRODUCT__': open(product_js, encoding='utf-8').read(),
        '__ENGINE__': open(os.path.join(HERE, 'engine.js'), encoding='utf-8').read(),
        '__UI__': open(os.path.join(HERE, 'ui.js'), encoding='utf-8').read(),
    }
    for k, v in reps.items():
        shell = shell.replace(k, v)
    left = re.findall(r'__[A-Z_]+__', shell)
    assert not left, 'nog niet ingevuld: ' + str(set(left))

    doc = ('<!DOCTYPE html>\n<html lang="nl">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width, initial-scale=1">\n' + shell + '\n</html>\n')
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    open(out, 'w', encoding='utf-8').write(doc)
    print(f'{out}: {len(doc)/1024:.0f} kB, build {build_id}')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('product'); ap.add_argument('brand')
    ap.add_argument('--out', default='dist/index.html')
    a = ap.parse_args()
    build(a.product, a.brand, a.out)
