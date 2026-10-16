# SEMANU configurator engine

De 3D configurator uit de speeltoestellenreeks, uit elkaar gehaald in drie lagen
zodat je hem op elk product kan zetten. Een tuinhuis zit erbij als werkend
voorbeeld.

```
build.py  ->  één zelfstandig index.html van ongeveer 60 kB plus de foto's
              die je erin zet. Geen server, geen build stap bij de klant.
```

## De drie lagen

| Laag | Bestand | Weet van |
|---|---|---|
| Schil | `shell.html` | opmaak en CSS, alle kleuren als tokens |
| Engine | `engine.js` | Three.js, texturen, materialen, houtconstructies, camera, maatlijnen |
| UI | `ui.js` | parametermenu, prijskaart, btw-schakelaar, landingspagina, deelbare link |
| Product | `products/<naam>.js` | dit specifieke product: opties, prijzen en het 3D model |
| Merk | `brands/<naam>.py` | kleuren, fonts, logo, teksten, tegels |

Engine en UI weten niets van tuinhuizen of speeltoestellen. Alles wat
domeinspecifiek is zit in het productbestand.

## Draaien

```bash
python3 build.py products/tuinhuis.js brands/voorbeeld.py --out dist/index.html
open dist/index.html
```

## Een catalogus in plaats van één product

Staat de samenstelling grotendeels vast, zoals bij een reeks tuinhuizen van
een fabrikant, dan is er niets te configureren tot de klant weet welk model
hij wil. Zet dan `PRODUCT.catalog` en de UI schakelt om: eerst filtertegels,
dan een resultatenraster, en pas daarna het parametermenu met de opties die
dat ene model toelaat.

```js
catalog: {
  filters: FILTERS,          // [{id, title, vraag, options:[{id,naam,sub,match}]}]
  models:  MODELLEN,
  match(m, keuze) { ... },   // past dit model bij de gekozen filters
  card(m) { ... },           // {naam, meta, sub, vanaf} voor de resultaatkaart
  sections(m) { ... }        // de secties voor dit ene model
}
```

De stappen komen één voor één. Stap twee verschijnt pas als stap één
beantwoord is, want negen knoppen tegelijk op een telefoon is geen keuze maar
een muur. Beantwoorde stappen blijven staan, zodat terugkomen op een keuze kan.

Elke knop toont hoeveel modellen er overblijven als je hem kiest. Een knop die
naar nul leidt wordt niet getoond. Verandert de klant daarna een eerdere stap,
dan wist `herzieLatereStappen` een later antwoord dat nu nul oplevert, anders
staat hij voor een lege lijst zonder te zien welke knop de boosdoener is.

Geef elke optie een `icon` met SVG-paden in een viewBox van 44 bij 30. Een woord
als lessenaarsdak zegt een klant niets, een silhouet wel. Zet er ook een optie
'Maakt niet uit' bij: iemand dwingen te kiezen over iets waar hij niets om geeft
levert een verkeerde selectie op.

Let op welke afbeelding je van een Magento shop pakt. De catalogusversie is
vaak staand bijgesneden, waardoor een breed product klein in het kader hangt.
De grote versie is meestal op het product zelf bijgesneden en oogt dus veel
groter bij hetzelfde kader. Vergelijk de twee voor je een hash vastlegt.

`card(m)` mag een `foto` teruggeven. Houd die lijst kort: naam, één regel
kenmerken en de vanaf-prijs. Maten en artikelnummers horen op de productpagina,
niet in een keuzelijst.

`products/cevo-tuinhuizen.js` is het uitgewerkte voorbeeld, met 38 modellen en
308 bestelbare varianten uit een echte Magento webshop.

### De prijs opbouwen uit varianten

Bij een catalogus is de basisprijs de goedkoopste variant, precies de 'vanaf'
prijs die de webshop toont. Elke keuze daarna geeft in `price(s, o)` het
verschil terug met die basis. De prijsopbouw leest dan als een winkelmandje en
de klant ziet de sprong naar een duurdere kleur aankomen in plaats van pas bij
het afrekenen. Zet `PRODUCT.base` op 0 en lever de eerste regel via
`extraLines`, dan verdwijnt de standaard basisregel.

### De koppeling met de webshop

`PRODUCT.payload(state)` wordt mee in het JSON blok van de samenvatting gezet.
Daar zet je de sku van de gekozen variant in, plus de losse artikelen. Dat blok
is wat een echte koppeling naar de winkelwagen zou sturen.

## Een nieuw product maken

Kopieer `products/tuinhuis.js` en vul vijf dingen in.

**1. De opties, als gewone lijsten.** Elke optie is `{id, name, sub, price}`,
eventueel met `color` voor een kleurvakje en `default: true` voor de standaard.

**2. `sections`, het parametermenu.** Elke sectie wordt een blok in het
linkerpaneel. De UI bouwt de knoppen, houdt de keuze bij in `state[id]`, rekent
de prijs en zet alles in de deelbare link.

```js
{ id: 'dak', title: 'Dakvorm', type: 'choice', layout: 'three',
  options: DAK, line: o => o.name }
```

| Veld | Betekenis |
|---|---|
| `type` | `choice` één keuze, `toggles` meerdere schakelaars tegelijk |
| `layout` | weglaten voor een lijst, `two` of `three` voor compacte knoppen |
| `when` | `s => bool`, verbergt de sectie, bijvoorbeeld dakbedekking bij een plat dak |
| `price` | `(s, o) => nummer` als de meerprijs van andere keuzes afhangt |
| `line` | `(o, s) => tekst` voor de regel in de prijsopbouw |
| `sub` | een tussenkopje boven de knoppen |
| `rebuild` | op `false` als de keuze het 3D model niet verandert |

**3. Vier haken voor de engine.**

```js
woodColors: s => ({base:'#D9C093', dark:'#A48B58'}),  // actieve houtkleur
roof:       s => ({kind:'plank'|'sheet', color:'#2A2A2A'}),
height:     s => 2.9,            // meter, bepaalt de camerastand
footprint:  s => ({W:3, L:2.5}), // meter, bepaalt de uitzoom
```

**4. `build(state)`, het model.** Teken met de bouwstenen hieronder. Wordt
opnieuw uitgevoerd bij elke keuze die het model raakt. Zet scharnierende delen
in `hinges` en de knop luiken en deuren openen werkt vanzelf.

**5. `dims(state)`, de maatlijnen.** Optioneel. Wordt getekend als de
maatvoeringknop aanstaat.

## Wat de engine je geeft

**Texturen.** Alles wordt in de browser getekend op een canvas, er komt geen
enkel plaatje van buiten. `woodTexture(base, dark, seed)` tekent planken van
12 cm met nerf, kwasten en een schaduwlijn in de naad. `roofTexture(color)`
tekent roofing met korrel en banen. Verder `grassTexture()` en `sandTexture()`.

De plankbreedte klopt omdat de UV in meter staat: `repeat.set(1/1.5, 1/0.96)`.
Wil je verticale planken, gebruik dan `vwoodMat`; die draait de textuur een
kwartslag. Let op de volgorde: Three past bij een UV-matrix eerst de rotatie toe
en dan de schaal, dus de repeat blijft `(1/1.5, 1/0.96)` en niet omgekeerd.

**Kleur.** `col(hex)` zet een hexkleur om naar lineaire ruimte
(`convertSRGBToLinear`). Sla dat over en al je hout wordt bleek.

**Bouwstenen.**

| Functie | Tekent |
|---|---|
| `box(w,h,d,mat,x,y,z,parent)` | een balk of plank |
| `wallShape(w,h,holes)` | een wandvorm met openingen, `holes` = `[{x,y,w,h}]` |
| `wall(shape,dikte,mat,parent)` | zet die vorm om in een wand met dikte |
| `gableShape(w,rise)` | een topgevel |
| `wallSide(zijde,W,L,y,h,holes,mat)` | een wand aan een zijde van het grondvlak |
| `railSide(zijde,W,L,fh,stijl,bezet,zBereik,off)` | balustrade, `spindles` of `planks` |
| `frame(W,L,fh,postTops)` | vier staanders met schoren, vloerbalken en vloer |
| `gableRoof(W,L,eave,top,mat,overstek)` | zadeldak met windveren, boeiboord en nokbalk |
| `leanRoof(W,L,hAchter,hVoor,mat,overstek)` | lessenaarsdak |
| `offset(x,y,z,fn)` | voert `fn` uit in een verplaatste groep |
| `dimLine(a,b,tekst)` | maatlijn met label |
| `setPost(m)` | andere paaldikte, standaard 8,8 cm |

De zijden heten `back` (-z), `end` (+z), `left` (-x) en `right` (+x).

**Camera.** Sleep met de muis, wiel of knijp om te zoomen, en vier vaste
standpunten (3D, voor, zij, boven). Draait vanzelf rond tot de bezoeker
ingrijpt. De uitzoom volgt uit `height()` en `footprint()`.

## Wat de UI je geeft

Het parametermenu links, en rechts onder het 3D venster de prijskaart met de
btw-schakelaar en de prijsopbouw die je kan openklappen. De volledige toestand
staat base64 in de link, dus een klant kan zijn samenstelling doorsturen. De
knop onderaan opent een samenvatting met een JSON blok, het aanknopingspunt voor
een echte koppeling met een webshop of offertesysteem.

Zet `pricing` in het merkbestand op `quote` en alle prijzen verdwijnen, inclusief
de btw-schakelaar. Op `excl` zijn de basisprijzen exclusief btw en rekent de
schakelaar de andere kant op.

## Het merkbestand

Twee kleuren volstaan. `build.py` maakt daar een volledige tokenset van:
achtergrond, panelen, lijnen, gedempte tekst en de zachte accentkleur voor een
geselecteerde knop, met genoeg contrast. Geeft de klant een donkere hoofdkleur,
dan wordt die het accent; geeft hij twee lichte, dan wordt er een donkere
variant van gemaakt.

Staat het logo in wit, zet dan `logoBg` op de hoofdkleur, anders valt het weg.
Zegt het beeldmerk zelf al hoe de klant heet, zet dan `logoOnly` op `True`, dan
komt de naam er niet nog eens in tekst naast.

### De vormtaal meesturen

Veel huisstijlen hebben een eigen actiekleur en een eigen hoekstraal. Die twee
bepalen samen of de configurator aanvoelt als een los ding of als een pagina van
de webshop zelf.

| Veld in `style` | Doet |
|---|---|
| `cta` | eigen kleur voor de primaire knop, de balk boven de voet en de tegelknop. Laat je die weg, dan blijft dat de accentkleur |
| `price` | kleur van het totaalbedrag, standaard gelijk aan `cta` |
| `radius` | hoekstraal in px. `0` tot `5` geeft een vlakke webshoplook, `10` tot `14` de zachte kaartlook. Stuurt ook de capsulevormen aan: onder `6` worden dat gewone knoppen |
| `labelCase` | `upper` zet de sectiekoppen in kapitalen, met `labelWeight` en `labelSize` erbij |
| `tokens` | dict met ruwe CSS variabelen die van alles hierboven wint, bijvoorbeeld `{'ground': '#f5f5f4', 'line': '#e5e5e5'}` |

`brands/cevo.py` is het uitgewerkte voorbeeld: navy als hoofdkleur, oranje
uitsluitend als actie, hoekstraal 5, sectiekoppen in kapitalen en een warm
neutraal grijs als grond in plaats van de blauwzweem die uit navy zou volgen.

```bash
python3 build.py products/tuinhuis.js brands/cevo.py --out dist/cevo-tuinhuis.html
```

## Voor je het naar een klant stuurt

`protect-tool/` in de Website repo hernoemt alle identifiers naar willekeurige
pseudoniemen, minificeert en versleutelt de mapping.

```bash
node protect-tool/protect-html.js dist/index.html --out klant/index.html \
  --mapping intern/klant.mapping.enc --strings --wm "SEMANU prototype configurator"
```

Dat is een buildstap, geen beveiliging. Prijzen en rekenregels staan nog gewoon
in de pagina. Zodra er echte marges in gaan hoort dat achter een server.

## Grenzen

- Three.js r128 van cdnjs. Nieuwere versies hebben `outputEncoding` en
  `sRGBEncoding` hernoemd, dus upgraden vraagt een paar aanpassingen.
- Alles zit in één bestand, foto's als data-URI. Boven ongeveer 2 MB wordt dat
  merkbaar traag op mobiel; comprimeer tegelfoto's tot 640 px.
- Het model is een interpretatie op basis van maten en foto's, geen tekening van
  de fabrikant. Zeg dat er ook bij.
- Zoek eerst of de fabrikant een productblad en montagehandleiding publiceert.
  Daar staan hellingshoek, wandhoogtes, deur- en raamopeningen en overstekken
  in, en dat scheelt een avond gissen op foto's. Zie `data/MATEN-OUTDOOR-LIFE.md`.
- Leg de productfoto's groot naast elkaar voor je een dakvorm vastlegt. Op een
  klein formaat lijkt een lessenaarsdak met een dikke boeiboord op een zadeldak.
  En kijk vooral naar de nokrichting: staat de topgevel aan de voorkant of loopt
  de nok evenwijdig aan de voorgevel? Bij deze reeks hangt dat samen met de
  luifel, want een doorlopend dak over een open deel kan niet anders dan met de
  nok over de breedte.
- Bij een catalogus komen de maten uit de webshop, maar dakvorm, luifel, ramen
  en deurtype vaak niet. Die zijn dan van de productfoto's afgelezen en dus een
  inschatting. Zet ze in het productbestand op één plek bij elkaar, zodat je ze
  kan vervangen zodra de leverancier echte gegevens levert.
