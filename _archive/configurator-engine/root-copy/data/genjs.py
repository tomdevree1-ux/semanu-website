# -*- coding: utf-8 -*-
"""Zet de opgehaalde CEVO data om in het JS modelblok voor de configurator."""
import csv, json, re
from collections import OrderedDict

# Wat uit de foto's is afgelezen en niet uit de data kwam.
# deelOpen = aandeel van de breedte dat luifel is (interpretatie op basis van de foto).
# ramen = zichtbaar aantal ramen aan de voorzijde, deur = enkel of dubbel.
FOTO = {
 'MILA':        dict(ramen=0, deur='dubbel'),
 'SARA':        dict(ramen=0, deur='dubbel'),
 'KIBO':        dict(ramen=0, deur='dubbel'),
 'NORAH':       dict(ramen=2, deur='dubbel'),
 'INGO':        dict(ramen=2, deur='dubbel'),
 'INDI':        dict(ramen=2, deur='dubbel'),
 'AMIRA':       dict(ramen=2, deur='dubbel'),
 'NADIA':       dict(ramen=2, deur='dubbel'),
 'NINA':        dict(ramen=2, deur='dubbel'),
 'WELS':        dict(ramen=2, deur='dubbel'),
 'TAMPA':       dict(ramen=1, deur='dubbel', deelOpen=.42),
 'DOUGLAS HR':  dict(ramen=0, deur='enkel'),
 'KJELD':       dict(ramen=0, deur='dubbel', deelOpen=.46),
 'LARS':        dict(ramen=0, deur='dubbel', deelOpen=.44),
 'FINN':        dict(ramen=0, deur='dubbel', deelOpen=.42),
 'LOTTA':       dict(ramen=0, deur='dubbel'),
 'UDO':         dict(ramen=2, deur='dubbel'),
 'TIMIAN':      dict(ramen=1, deur='glas'),
 'SUNNIVA':     dict(ramen=1, deur='dubbel', deelOpen=.45),
 'OLENKA':      dict(ramen=1, deur='glas',   deelOpen=.48),
 'OCTAVIO':     dict(ramen=2, deur='dubbel', deelOpen=.38),
 'MIKKEL':      dict(ramen=1, deur='glas'),
 'MARIBEL':     dict(ramen=2, deur='dubbel', deelOpen=.40),
 'MANUEL':      dict(ramen=1, deur='glas',   deelOpen=.44),
 'JELLE':       dict(ramen=0, deur='enkel',  deelOpen=.34),
 'AIDA':        dict(ramen=1, deur='dubbel', deelOpen=.50),
 'HELENA':      dict(ramen=1, deur='glas',   deelOpen=.44),
 'FRAYA':       dict(ramen=2, deur='dubbel', deelOpen=.40),
 'BALTIMORE':   dict(ramen=2, deur='dubbel'),
 'DALLAS':      dict(ramen=2, deur='dubbel'),
 'DOUGLAS ZR':  dict(ramen=0, deur='enkel'),
 'CAROLINE SGC':dict(ramen=2, deur='enkel'),
 'GARAGE DILLON':dict(ramen=1, deur='enkel'),
 'ST. LOUIS':   dict(ramen=1, deur='dubbel', deelOpen=.50),
 'DOUGLAS Z-ZR':dict(ramen=0, deur='enkel'),
 'PERNILLA':    dict(ramen=1, deur='glas',   deelOpen=.40),
 'OLIVIA':      dict(ramen=1, deur='glas',   deelOpen=.40),
 'JULIA':       dict(ramen=1, deur='glas',   deelOpen=.40),
}

# Correcties na het naast elkaar leggen van alle 38 productfoto's op groot
# formaat. Amira leek op het kleine formaat een zadeldak maar heeft een rechte
# dakrand en helt naar achteren, dus een lessenaarsdak.
DAK_CORRECTIE = {'AMIRA': 'lessenaarsdak'}

# Echte maten van de fabrikant, geschraapt van outdoorlifeproducts.com.
# Per model en uitvoering: dakhelling, fundering, overstekken, binnenhoogte,
# binnenmaat vloeroppervlak, deur- en raamopening. Het binnenoppervlak
# tegenover het grondvlak geeft precies hoe groot de luifel is, dus dat is
# geen schatting meer.
def lees_olp():
    uit = {}
    for regel in open('olp-maten.txt', encoding='utf-8'):
        regel = regel.rstrip('\n')
        if not regel: continue
        k = regel.split('|')
        getal = lambda v: float(v.replace(',', '.')) if v else None
        paar = lambda v: [float(x) for x in v.replace(',', '.').split('x')] if v and 'x' in v else None
        uit[(k[0], k[1])] = dict(
            art=k[2], helling=getal(k[3]), fundering=paar(k[4]),
            overstek=[getal(x) for x in k[5].split(',')] if k[5] else None,
            binnenH=getal(k[6]), binnenOpp=getal(k[7]),
            deur=paar(k[10]), ramen=int(k[11] or 0), raam=paar(k[12]),
            wandbalk=k[13] if k[13] and k[13] != '-' else None)
    return uit
OLP = lees_olp()

# Kleurstalen: basis- en donkertint voor de houttextuur.
KLEUR = OrderedDict([
 ('Blank hout',             ('#D9C093','#A48B58')),
 ('Olijfgroen geimpegneerd',('#6E7350','#464A31')),
 ('Platinum grijs-wit',     ('#D6D5D0','#A8A79F')),
 ('Platinum grijs',         ('#9A9C99','#6D6F6C')),
 ('Carbon grijs-wit',       ('#CFCFCC','#8E8E8B')),
 ('Carbon grijs',           ('#4A4C4D','#2E3031')),
 ('Groen grijs-wit',        ('#CBD0C6','#969C8F')),
 ('Groen grijs',            ('#5E6857','#3C4437')),
])
NETTE_NAAM = {'Olijfgroen geimpegneerd':'Olijfgroen geïmpregneerd'}

rows=list(csv.DictReader(open('cevo-outdoor-life-tuinhuizen-varianten.csv',encoding='utf-8-sig'),delimiter=';'))
mods=OrderedDict()
for r in rows:
    m=r['model']
    d=mods.setdefault(m, dict(naam=m, sku=r['parent_sku'], dakvorm=r['dakvorm'],
                              luifel=set(), wanddikte=int(r['wanddikte_mm']), varianten=[]))
    d['luifel'].add(r['luifel'])
    d['varianten'].append(r)

def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')

def maak_uitvoering(modelnaam, u):
    """Voegt de fabrieksmaten toe aan een uitvoering, als we die hebben."""
    d = dict(id=u['id'], key=u['key'], naam=u['naam'], W=u['W'], L=u['L'])
    if not (u['W'] and u['L']): return d
    sleutel = '%dx%d' % (round(u['W'] * 100), round(u['L'] * 100))
    o = OLP.get((net(modelnaam), sleutel))
    if o is None:   # zonder maatvarianten staat de maat in de modelnaam
        kand = [v for (n2, m2), v in OLP.items() if n2 == net(modelnaam)]
        o = kand[0] if len(kand) == 1 else None
    if o is None: return d
    grond = u['W'] * u['L']
    d['olp'] = o['art']
    if o['helling']: d['helling'] = o['helling']
    if o['binnenH']: d['muur'] = round(o['binnenH'] / 100, 3)
    if o['deur']: d['deur'] = [round(o['deur'][0] / 100, 3), round(o['deur'][1] / 100, 3)]
    if o['raam']: d['raam'] = [round(o['raam'][0] / 100, 3), round(o['raam'][1] / 100, 3)]
    d['ramen'] = o['ramen']
    # het deel van het grondvlak dat luifel is, uit binnenmaat tegenover grondvlak
    if o['binnenOpp'] and grond > 0:
        deel = 1 - o['binnenOpp'] / grond
        if deel > 0.08: d['luifelDeel'] = round(min(deel, 0.70), 3)
    return d

# De Douglas reeks heeft geen maat in de variant; die staat in de omschrijving.
VASTE_MAAT = {'DOUGLAS HR':(2.03,2.53),'DOUGLAS ZR':(2.03,2.53),'DOUGLAS Z-ZR':(2.03,2.53)}
def net(naam):
    t=naam.title()
    for a,b in (('Hr','HR'),('Zr','ZR'),('Z-Zr','Z-ZR'),('Sgc','SGC'),('St. Louis','St. Louis')):
        t=re.sub(r'\b'+re.escape(a)+r'\b',b,t)
    return t

uit=[]
for naam,d in mods.items():
    f=FOTO.get(naam,{})
    luifel = 'optie' if len(d['luifel'])>1 else next(iter(d['luifel']))
    vast = VASTE_MAAT.get(naam)
    # uitvoeringen (maatvarianten) en kleuren afleiden
    uitv=OrderedDict(); kleuren=OrderedDict()
    for v in d['varianten']:
        u=v['uitvoering'] or 'standaard'
        br,di=v['breedte_cm'],v['diepte_cm']
        if u not in uitv:
            uitv[u]=dict(id=slug(u),key=u,naam=u if u!='standaard' else 'Standaard',
                         W=round(int(br)/100,2) if br else (vast[0] if vast else None),
                         L=round(int(di)/100,2) if di else (vast[1] if vast else None), prijzen={})
        k=v['kleur'] or 'Standaard'
        uitv[u]['prijzen'][k]=float(v['prijs_incl_btw'].replace(',','.'))
        if k not in kleuren:
            base,dark=KLEUR.get(k,('#C9C4BB','#8E8A82'))
            kleuren[k]=dict(id=slug(k),key=k,naam=NETTE_NAAM.get(k,k),base=base,dark=dark)
        v['_sku_key']=(u,k)
    # sku tabel: "uitvoering|kleur" -> sku
    skus={f"{v['uitvoering'] or 'standaard'}|{v['kleur'] or 'Standaard'}":v['sku'] for v in d['varianten']}
    prijzen=[float(v['prijs_incl_btw'].replace(',','.')) for v in d['varianten']]
    # oppervlakte uit de uitvoeringen zelf, niet uit de kolom: de Douglas reeks
    # heeft daar geen maat staan en zou anders zonder oppervlakte blijven
    opp=[round(u['W']*u['L'],2) for u in uitv.values() if u['W'] and u['L']]
    # breedste zijde per uitvoering: dat is wat een klant in zijn tuin afmeet
    breed=[round(max(u['W'],u['L']),2) for u in uitv.values() if u['W'] and u['L']]
    uit.append(dict(
        id=slug(naam), naam=net(naam), sku=d['sku'],
        dakvorm=DAK_CORRECTIE.get(naam, d['dakvorm']), luifel=luifel, deelOpen=f.get('deelOpen',0),
        wanddikte=d['wanddikte'], ramen=f.get('ramen',1), deur=f.get('deur','dubbel'),
        vanaf=min(prijzen), tot=max(prijzen),
        oppMin=min(opp) if opp else None, oppMax=max(opp) if opp else None,
        breedteMin=min(breed) if breed else None, breedteMax=max(breed) if breed else None,
        uitvoeringen=[maak_uitvoering(naam, u) for u in sorted(uitv.values(), key=lambda u:(u['W'] or 0)*(u['L'] or 0))],
        # kleuren in de volgorde van het palet, dus blank hout eerst; dat is
        # ook de kleur waar de 'vanaf' prijs van de webshop op slaat
        kleuren=sorted(kleuren.values(), key=lambda k: list(KLEUR).index(k['key']) if k['key'] in KLEUR else 99),
        prijs={f"{u}|{k}":p for u,uu in uitv.items() for k,p in uu['prijzen'].items()},
        sku_var=skus,
    ))

open('modellen.json','w',encoding='utf-8').write(json.dumps(uit,ensure_ascii=False,indent=0))

# ---- deel1.js schrijven uit dezelfde data ----
blok=',\n'.join('  '+json.dumps(m,ensure_ascii=False,separators=(',',':')) for m in uit)
sjabloon=open('deel1.sjabloon.js',encoding='utf-8').read()
open('deel1.js','w',encoding='utf-8').write(sjabloon.replace('/*__MODELLEN__*/', blok))
print(len(uit),'modellen')
print('zonder maat:',[m['naam'] for m in uit if any(u['W'] is None for u in m['uitvoeringen'])])
print('met luifel :',sum(1 for m in uit if m['luifel']=='ja'))
print('optie      :',sum(1 for m in uit if m['luifel']=='optie'))
