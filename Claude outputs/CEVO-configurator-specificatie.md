# CEVO tuinhuisconfigurator, technische specificatie

Semanu BV · offerte OFF-2026-078 · stand 24 september 2026
Demo: https://www.semanu.be/cevo2 (wachtwoord vereist)

---

## 1. Wat het is

Een 3D productconfigurator voor de Outdoor Life tuinhuizen van Cevo Market NV,
bedoeld om als pagina binnen hun Magento 2 webshop te draaien. De klant
beantwoordt drie vragen, krijgt een korte selectie modellen, opent er één in 3D,
kiest maat, kleur en toebehoren, ziet bij elke keuze wat ze kost en legt aan het
eind het juiste artikelnummer in de winkelwagen.

De volledige toepassing is één HTML bestand zonder server, zonder database en
zonder enige netwerkoproep vanuit de code. Alle logica, geometrie, prijzen en
texturen draaien in de browser van de bezoeker. De enige externe verzoeken zijn
de bibliotheek three.js en de productfoto's van cevo.be.

---

## 2. De catalogus in cijfers

| Wat | Aantal |
|---|---|
| Modellen | 38 |
| Bestelbare varianten (maat × kleur) | 280 |
| Uitvoeringen (maten) | 64 |
| Kleurvarianten over alle modellen | 181 |
| Toebehoren als los artikel | 6 |

Verdeling naar dakvorm: 24 lessenaarsdak (op de webshop "plat dak" genoemd),
14 zadeldak.

Verdeling naar luifel: 21 zonder, 14 met, 3 waar de luifel een aparte
uitvoering is en dus een keuze wordt binnen het model.

Prijsbereik: €1.176 tot €6.396 inclusief btw.
Breedtes: 2,00 m tot 7,60 m.
Wanddiktes: 28, 34 en 40 mm.

Kleurpalet, in vaste volgorde omdat de vanafprijs altijd op blank hout slaat:
Blank hout, Olijfgroen geïmpregneerd, Platinum grijs-wit, Platinum grijs,
Carbon grijs-wit, Carbon grijs, Groen grijs-wit, Groen grijs. Elk met een
basis- en een donkertint voor de houttextuur, bijvoorbeeld blank hout
`#D9C093` / `#A48B58`.

Toebehoren met hun eigen artikelnummer en prijs: vloerpakket €125 (160653),
EPDM dakpakket €180 (160727), shingles inclusief nagels €75 (144470),
dakgootset €115 (144474), fundamentbalk €65 (144469), ventilatierooster €15
(160712).

---

## 3. De keuzehulp, drie stappen

Elke stap toont tegels met een teller die zegt hoeveel tuinhuizen er na dat
antwoord overblijven. De tellers rekenen door op de al gemaakte keuzes, dus ze
veranderen terwijl de klant vordert.

**Stap 1, dakvorm.** "Welk dak past bij je tuin?"
Plat dak (`m.dakvorm === 'lessenaarsdak'`), Zadeldak (`m.dakvorm === 'zadeldak'`),
Ik weet het niet (alles).

**Stap 2, luifel.** "Wil je een overdekt stuk ernaast?"
Met luifel (`m.luifel !== 'nee'`), Zonder luifel (`m.luifel !== 'ja'`),
Ik weet het niet. De modellen waar de luifel een uitvoering is tellen dus in
beide richtingen mee, en dat klopt: die klant kan het nog kiezen.
De pictogrammen van deze stap tonen de dakvorm die in stap 1 gekozen is.

**Stap 3, breedte.** "Hoe breed mag het tuinhuis worden?"
Tot 3 m (`breedteMin <= 3`), 3 tot 5 m (`breedteMax >= 3 && breedteMin <= 5`),
Meer dan 5 m (`breedteMax > 5`), Ik weet het niet.
Er wordt over de breedste zijde gesproken, niet over de oppervlakte.

Regels die in de interface vastliggen:

- Een antwoord dat nul resultaten oplevert wordt niet verborgen maar dof en
  onklikbaar getoond, met een uitleg eronder. De klant ziet zo dat de optie
  bestaat en waarom ze hier niet past.
- "Ik weet het niet" draagt een vraagteken als pictogram en telt als alles.
- Een eerdere stap aanpassen herziet de latere stappen in plaats van ze te
  wissen.

---

## 4. Resultatenpagina

Een raster van kaarten, elk met de productfoto van de webshop, de naam, de
meta-regel (dakvorm plus luifelstatus) en de vanafprijs. De foto's komen van
`cevo.be/media/catalog/product/cache/...` op basis van de sku en worden lui
geladen, dus alleen de zichtbare kaarten.

Maten en artikelnummers staan bewust niet op de kaart. Die horen op de
productpagina en zouden hier de keuze alleen vertragen.

---

## 5. Het configuratorscherm

Links het keuzepaneel, rechts de 3D weergave met daaronder de prijskaart.

**Secties in het paneel**, opgebouwd uit een schema en niet uit vaste blokken:

1. *Uitvoering*, alleen als het model meer dan één maat heeft. Toont per maat de
   oppervlakte in m² en het prijsverschil ten opzichte van de goedkoopste.
2. *Kleur en afwerking*, alleen als het model meer dan één kleur heeft. Toont
   een kleurstaal en het verschil ten opzichte van dezelfde maat in blank hout.
3. *Toebehoren*, zes schakelaars met hun eigen prijs.

**Prijs.** De basisprijs is altijd de goedkoopste variant, precies de vanafprijs
van de webshop. Elke keuze toont daarna wat ze erbij kost, zodat de sprong van
blank hout naar een gecoate kleur zichtbaar is voor de winkelwagen en niet erna.
De prijsopbouw is openklapbaar en begint met de regel "model, basisuitvoering
(parent sku)".

Btw staat op 21 procent met een schakelaar tussen inclusief en exclusief. De
brondata is inclusief btw, dus exclusief wordt teruggerekend.

**Onder de modelnaam** staat het artikelnummer van precies de gekozen variant
plus dat van de ouder, in de vorm `Art. 160431 · CP_160431`. Dat is wat een
medewerker in Magento intikt.

**Deelbare link.** De volledige staat wordt base64 in de hash van de URL gezet
bij elke wijziging, en bij het laden er weer uit gelezen. Een klant kan zijn
samenstelling dus doorsturen of bewaren zonder dat er iets op een server staat.

---

## 6. De 3D laag

**Renderer.** WebGL met antialiasing, doorzichtige achtergrond (het verloop is
gewoon CSS eronder), pixelratio gemaximeerd op 2, zachte schaduwen (PCF),
sRGB uitvoer, ACES filmic tonemapping met exposure 0,95.

**Licht.** Drie lampen. Een hemisfeerlicht (hemel `#CFE3F5` boven, de vloerkleur
onder), een warme richtingslamp van 1,35 die schaduw werpt met een schaduwmap
van 2048 en een strak ingestelde schaduwcamera, en een koele invullamp van 0,35
van achter. De tweede kleur van het hemisfeerlicht volgt de vloer, want anders
kleurt de vloer af op het hout en klopt de kleurkeuze niet meer.

**Achtergrond.** Ingesteld per merk via `--grond` en `--mist`. Voor CEVO staan
die op wit, de packshotlook die aansluit op hun productfoto's. Zijn ze leeg, dan
valt de engine terug op gras met een blauwe hemel.

**Texturen.** Alles procedureel op canvas getekend, geen enkel beeldbestand.
De houttextuur tekent acht planken van 12 cm per canvas van 512 bij 1024, elk
met een eigen tint, zesentwintig nerflijnen, bij de helft een kwast, en een
naad van een donkere lijn van 3 px met een lichte lijn van 2 px erboven. Die
naad doet het meeste werk. De dakbedekking, de studiovloer, het gras en het
zand volgen hetzelfde recept. Alle texturen komen uit een generator met een
zaadje, dus dezelfde invoer geeft altijd hetzelfde beeld.

De plankbreedte klopt doordat de UV in meter staat: de textuur beslaat 1,5 m
bij 0,96 m en de repeat wordt daaruit berekend.

**Geometrie.** Gebouwd uit vormen met gaten (`THREE.Shape` met `holes`), niet uit
losse blokken, zodat deur- en raamopeningen echte openingen zijn.

- Het lessenaarsdak is hoog aan de voorkant en helt naar achteren, met de
  hellingshoek van de fabrikant of anders 8 graden. De zijwanden zijn daardoor
  trapezium.
- Bij een zadeldak zonder luifel staat de topgevel vooraan en loopt de nok naar
  achteren. Bij een zadeldak met luifel loopt de nok over de breedte, want het
  dak moet over het open deel doorlopen. Dat is afgelezen van de productfoto's
  van Maribel, Octavio en Fraya tegenover Udo, Norah en Dallas.
- De luifel is geen carport op palen maar heeft een dichte achterwand, een
  kopwand en één staander op de vrije hoek.
- Deur- en raamopeningen komen uit de montagehandleiding waar die er is.
  Voorbeeld Amira 380x175: wandhoogte 189,1 achter en 211,6 voor, deuropening
  149,4 bij 185, raamopening 68,5 bij 88,2 met de bovenkant gelijk aan die van
  de deur, deur 47,2 cm uit de hoek, raam ernaast in de voorgevel.
- Deuren en luiken draaien echt open. Ze staan standaard dicht, met een knop die
  na een tijdje opvalt zodat de klant weet dat het kan.

**Camera.** Bolcoördinaten rond een doelpunt, met demping die niet van de
framerate afhangt. Zolang de bezoeker niets aangeraakt heeft draait het model
traag vanzelf, daarna stopt dat voorgoed. Vier standpunten: 3D, voor, zij en
boven, met de afstand berekend uit hoogte en grondvlak. Alles staat uit bij
`prefers-reduced-motion`.

De mist volgt de camera-afstand (`near = r * 0,78`, `far = r * 2,7`), anders
verdwijnt een groot model in de nevel terwijl een klein model er te scherp uit
springt.

**Maatlijnen** zijn in- en uitschakelbaar, met labels die als sprite boven de
scene hangen.

---

## 7. Koppeling met Magento

De configurator levert een payload die één op één op een configureerbaar product
past:

```js
{
  model: 'Maribel',
  parent_sku: 'CP_160431',
  sku: '160441',                 // de child sku van precies deze variant
  uitvoering: '680x300cm',
  kleur: 'Blank hout',
  variantprijs: 3244.00,
  toebehoren: [{ sku: '160653', naam: 'Vloerpakket', prijs: 125 }]
}
```

De 280 varianten zijn per model gesleuteld op `uitvoering|kleur`, met zowel de
prijs als het artikelnummer. Er is dus geen zoekactie of gok nodig: de keuze van
de klant wijst rechtstreeks één child sku aan. De toebehoren gaan als losse
artikelen mee, precies zoals ze nu in de shop staan.

Dit is het aanknopingspunt en niet de koppeling zelf. Het echte inleggen in de
winkelwagen gebeurt in de Magento module, en de prijs hoort daar opnieuw
berekend te worden en niet uit de browser overgenomen.

---

## 8. Architectuur en bestanden

Drie lagen, waarvan alleen de derde per klant verandert.

| Bestand | Regels | Rol |
|---|---|---|
| `engine/shell.html` | 386 | Opmaak, CSS tokens, alle schermen |
| `engine/engine.js` | 230 | Three.js scene, texturen, bouwstenen, camera |
| `engine/ui.js` | 335 | Menu uit schema, staat, prijs, keuzehulp |
| `engine/build.py` | 201 | Zet merk plus product om in één HTML bestand |
| `engine/brands/cevo.py` | — | Kleuren, lettertype, hoekstraal, labelstijl, achtergrond |
| `data/deel1.sjabloon.js` | 157 | Modeldata, kleurpalet, toebehoren, filters |
| `data/deel2.js` | 352 | De productlaag: kaarten, secties, geometrie, payload |
| `data/genjs.py` | 211 | Bouwt de modeldata uit de CSV van de webshop |

De engine praat met de productlaag via vier haken: actieve houtkleur, dak,
hoogte en grondvlak. De engine weet dus niets van tuinhuizen.

**Buildketen:**

```
CSV van cevo.be  →  genjs.py  →  deel1.js
deel1.js + deel2.js  →  cevo-tuinhuizen.js
cevo-tuinhuizen.js + brands/cevo.py  →  build.py  →  index.html
```

Elke build krijgt een eigen build-id (sha1 van naam plus datum, eerste 10 tekens)
in een commentaarregel en een meta-tag.

---

## 9. Herkomst van de data

De modeldata komt uit de varianten-CSV van de webshop zelf, dus namen, prijzen,
kleuren en artikelnummers zijn die van Cevo en niet overgetypt.

De maten en de geometrie komen uit drie bronnen, in volgorde van betrouwbaarheid:

1. De plattegronden van de fabrikant die op de productpagina's staan
   (`..._plattegrond.png`). Die dragen binnenmaten, deuropening en dakoverstek.
2. De montagehandleidingen van Outdoor Life, voor hellingshoek en wandhoogtes.
3. De maattabel `olp-maten.txt` van outdoorlifeproducts.com.

Bekende valkuil: die maattabel heeft verschoven cellen bij Kjeld, Lars, Finn en
Tampa, te herkennen aan een lege cel voor de deuropening. Daar geldt de
plattegrond en niet de tabel. De code vertrouwt het aantal ramen daarom alleen
als de deuropening ingevuld is.

Dakvorm en luifel staan niet als veld in de webshop en zijn visueel
geclassificeerd vanaf de productfoto's.

---

## 10. Tests

Twee geautomatiseerde tests draaien met `npm test` in de engine-map.

`test-prijzen.js` controleert de prijsopbouw tegen de brondata.

`test-dak.js` is een geometrietest met een nagebouwde THREE: hij loopt 128
combinaties van model, maat, dakvorm en luifel af, bemonstert de bovenrand van
elke wand op negen punten, en meldt elke balk of wandkop die door het dakvlak
steekt. Stand: 128 combinaties, 0 doorsteken. De test is geschreven nadat dat
probleem twee keer visueel opdook, en hij meldt inderdaad 3.630 doorsteken als
je de oude dakpositie terugzet.

---

## 11. De demo en haar bescherming

De verkoopdemo is niet dezelfde build als de productieversie.

- Alleen Amira, Lotta, Kjeld, Udo en Maribel dragen hun volledige data. Van de
  andere 33 blijven enkel naam, dakvorm, luifel, maatbereik en vanafprijs over,
  zonder geometrie, kleuren of artikelnummers. Ze verschijnen als vage kaart met
  het label "Binnenkort online". Er valt dus niets te ontgrendelen in de
  ontwikkelaarsconsole, want wat er niet in zit kan ook niet getoond worden.
  Zet `DEMOBUILD=1` bij `genjs.py` om die build te maken.
- Daarna gaat het bestand door `protect-tool/protect-html.js`: identifiers
  hernoemd, strings gecodeerd, HTML en CSS geminificeerd, watermerk met
  "eigendom van SEMANU BV" erin. De vertaaltabel wordt versleuteld apart
  bewaard en gaat nooit mee naar de klant.
- Tot slot door `protect-tool/gate.js`: de hele pagina wordt versleuteld met
  AES-256-GCM, met een sleutel uit het wachtwoord via PBKDF2-SHA256 en 250.000
  rondes. Zonder wachtwoord staat er ruis in de bron en geen verborgen code.

De pagina draagt `noindex, nofollow` en staat in geen enkele sitemap.

---

## 12. Prestaties

Het productiebestand is 185 kB onbewerkt en 43 kB gezipt, inclusief alle
modellen, prijzen, de 3D motor en de interface. Er staat geen `fetch`, geen XHR
en geen websocket in de code, dus honderd of duizend gelijktijdige bezoekers
belasten enkel het uitleveren van een statisch bestand. Het rekenwerk gebeurt op
het toestel van de bezoeker.

Wat wel meeschaalt met het bezoek zijn de productfoto's, want die komen van
Magento, en dat is dezelfde belasting als de categoriepagina openen.

---

## 13. Wat er niet in zit

- Andere productgroepen dan de Outdoor Life tuinhuizen
- Een tweede taal; standaard zit alleen Nederlands inbegrepen
- Fotografie of 3D bestanden die de fabrikant niet levert
- Wijzigingen aan het Magento thema buiten de configurator
- Voorraad of levertijden live tonen
- Een offerte of pdf per samenstelling
- Plaatsingsdienst, meerprijzen of leverzones in de prijsberekening
- Opschoning of migratie van de productdata

---

## 14. Open punten

- Three.js komt nog van cdnjs. Zelf hosten haalt een derde partij uit het
  kritieke pad en laat een strenge Content Security Policy toe. Omdat de code
  geen enkele netwerkoproep doet kan `connect-src 'none'`, wat zeldzaam streng
  is voor een pagina van deze omvang.
- Google Fonts levert Source Sans 3. Zelf hosten scheelt een verzoek en lost
  meteen het punt op dat het IP-adres van elke bezoeker naar Google gaat.
- Drie Douglas modellen hebben geen fabrikantendata en draaien op schattingen.
- De horizontale positie van deuren en ramen is alleen bij Amira tegen de
  tekening gecontroleerd.
- Het boeiboord staat in de beschrijving maar wordt nog niet getekend.
- De uitbreiding "Samenvatting als pdf" vraagt wel een server, en daarmee ook
  spambescherming, aflevering van mail, een verwerkersovereenkomst en
  terugkerende kosten die nu niet in de licentie zitten.
