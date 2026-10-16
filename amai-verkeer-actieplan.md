# Verkeer op amai.ch — diagnose en actieplan

Opgesteld 23.07.2026. Bron: GA4 (property 541325140) en Search Console (sc-domain:amai.ch), read only. Analysevenster Search Console: 23.06 t/m 20.07.2026 (28 dagen).

## Kort samengevat

- Je site is technisch en inhoudelijk in orde. Het probleem is niet de bouw, het is bereik.
- Er staat op dit moment geen enkele verkeersmotor aan: geen Google Ads, een jong domein zonder autoriteit en vrijwel geen merkbekendheid.
- Je rankt zelfs op pagina 1 voor je exacte niche term "website abo", maar dat woord wordt in Zwitserland nauwelijks gezocht (30 à 40 zoekopdrachten per maand). Nummer 1 staan voor iets dat niemand zoekt levert geen bezoekers.
- Waar wél volume zit (kosten, mieten, website erstellen lassen) sta je onzichtbaar op positie 70 tot 95.
- Snelste hefbomen: Google Ads aanzetten op de commerciële zoekwoorden, de paginatitel aanscherpen voor meer clicks, en de pagina uitbreiden naar "mieten" en "kosten" taal.

## Wat de data zegt

**Verkeer (GA4, week 13 t/m 19 juli):** 14 sessies, 6 gebruikers, vrijwel alles Direct (13) en 1 via organisch zoeken. Nul Paid Search, dus geen Google Ads verkeer. Een deel hiervan ben jij nog zelf (tests), dus de echte externe traffic is nog kleiner.

**Zoeken (Search Console, 28 dagen):** je hele site haalt zijn bereik uit één pagina. `/de/website-abo-schweiz` krijgt 405 vertoningen, 1 click, gemiddelde positie 44,9. Alle andere pagina's (ook de losse landingspagina's zoals `webdesign-kmu-schweiz` en `website-betreuung-schweiz`) halen bijna geen vertoningen. De SEO funnel is nu dus een showtje van één pagina.

Die gemiddelde positie van 44,9 verbergt twee heel verschillende werelden:

| Zoekwoord | Vertoningen | Positie | Oordeel |
|---|---|---|---|
| seo abo schweiz | 12 | 5,8 | pagina 1 |
| website abo | 38 | 7,4 | pagina 1 |
| webseite abo | 33 | 9,1 | pagina 1 |
| abo webseite | 31 | 12,7 | pagina 2 |
| design im abo | 20 | 17,3 | pagina 2 |
| webseiten abo | 34 | 25,2 | pagina 3 |
| webseite mieten monatlich | 29 | 70,6 | onzichtbaar |
| webseite monatlich mieten | 30 | 78,4 | onzichtbaar |
| website erstellen lassen kosten schweiz | 11 | 82,9 | onzichtbaar |
| website betreuung preise | 9 | 89,3 | onzichtbaar |
| was kostet eine website schweiz | 9 | 89,7 | onzichtbaar |
| kosten für website | 12 | 92,8 | onzichtbaar |

## Waarom zo weinig verkeer

1. **Geen betaald verkeer.** Er lopen geen Google Ads naar je eigen site. Dat is normaal de snelste kraan voor bezoekers en die staat dicht.
2. **Je wint een woord dat niemand zoekt.** Voor de "abo" cluster (website abo, webseite abo, seo abo schweiz) sta je op positie 5 tot 13, dat is prima. Maar samen zijn dat maar ongeveer 170 vertoningen per maand. De term "website abo" is jouw eigen framing, geen zoekgedrag van klanten.
3. **Waar het volume zit, ben je onzichtbaar.** Mensen zoeken op "was kostet eine website", "website erstellen lassen kosten" en "webseite mieten". Daar sta je op positie 70 tot 95, pagina 8 tot 10. De pagina gebruikt het woord "mieten" nergens en beantwoordt de kostenvraag niet direct, dus Google matcht die intentie slecht.
4. **CTR is bijna nul, ook op goede posities.** Op positie 7 voor "website abo" zou je een enkele click per maand verwachten. Nul clicks wijst op twee dingen: de zoekvolumes zijn dun, en je snippet (titel en omschrijving) is niet dwingend genoeg. Meespeelt dat je structured data een verouderde prijs toont (zie hieronder).
5. **Jong domein, kleine markt, geen merk.** Het domein is recent herbouwd en heeft nog weinig autoriteit. "amai" wordt maar 4 keer per maand gezocht, dus er is geen merkverkeer. En de niche (Zwitserse KMO website abo's) is van nature klein in zoekvolume.

## Wat goed staat (niet aankomen)

De pagina zelf is sterk: heldere structuur, FAQ, features, een entity zin voor Google, interne links en volledige DE, FR, EN versies. Technisch is het netjes: self referencing canonical, hreflang, OpenGraph en JSON-LD (WebPage, BreadcrumbList, Service, FAQPage). De pagina staat in de sitemap met wekelijkse changefreq. Dit hoeft niet opnieuw.

**Eén concrete fout wel repareren:** in de Service structured data (`src/app/[locale]/[landing]/page.tsx`, rond regel 92) staat de prijs hard gecodeerd op **35 CHF per maand**. Dat is het Beginner abo dat in juni is afgeschaft. Google kan die 35 CHF in de zoekresultaten tonen terwijl de pagina zelf 99 CHF vermeldt. Dat is verwarrend voor de bezoeker en ondermijnt vertrouwen. Zet dit op 99 CHF (of haal de vaste prijs uit het schema en laat alleen de zichtbare abo's de prijs bepalen).

## Actieplan

### Nu, deze week (snelste hefbomen)

- **Google Ads aanzetten op de commerciële zoekwoorden.** Richt je advertenties niet op de "abo" cluster maar op de termen met echt volume waar je organisch onzichtbaar bent: "website erstellen lassen schweiz", "webseite mieten", "was kostet eine website", "webdesign schweiz". Laat ze landen op `website-abo-schweiz` of een specifieke landingspagina. Klein dagbudget, exact en phrase match, geo op Zwitserland, taal Duits. Dit koopt direct bezoekers terwijl SEO rijpt.
- **Schema prijs corrigeren** van 35 naar 99 CHF (zie hierboven).
- **Paginatitel aanscherpen voor meer clicks.** Nu is de titel "Website Abo Schweiz · amai.ch", vlak en zonder haakje. Voorstel: "Website Abo Schweiz ab 99 CHF pro Monat · amai.ch". Een prijs en een voordeel in de titel trekt op je huidige posities meer clicks zonder dat je hoger hoeft te ranken.

### 2 tot 6 weken (meer bereik)

- **Pagina uitbreiden naar "mieten" en "kosten" taal.** Voeg twee blokken toe: "Website mieten statt kaufen" en "Was kostet eine Website in der Schweiz?" met een concreet prijsverhaal. Zo ga je matchen op de hoogvolume queries waar je nu op positie 80 staat. Belangrijk: dit is je grootste organische kans.
- **Google Business Profile aanmaken (Bern).** Dat opent de local pack, "in der Nähe" zoekopdrachten en versterkt merkzoekopdrachten. Voor een lokaal Zwitsers bedrijf een van de hoogste hefbomen en gratis.
- **De losse landingspagina's laten werken of samenvoegen.** Nu rankt alleen `website-abo-schweiz`. Controleer in Search Console (URL inspectie) of `website-erstellen-lassen-schweiz`, `webdesign-kmu-schweiz` en `website-betreuung-schweiz` überhaupt geïndexeerd zijn. Geef elke pagina een eigen, unieke zoekintentie en interne links, anders concurreren ze met elkaar en wint er geen.
- **Lokale vermeldingen en backlinks.** local.ch, search.ch, moneyhouse en relevante Zwitserse KMO directories. Elke nette vermelding geeft je jonge domein autoriteit.

### Doorlopend (bouwt zich op)

- **Blogposts op de kostenvragen die al vertoningen krijgen.** "Was kostet eine Website in der Schweiz", "Website mieten oder kaufen", "Webdesign Preise Schweiz". Deze hebben volume en je site verschijnt er al zwak voor. Link ze intern naar de abo landingspagina.
- **Merkbekendheid opbouwen** zodat "amai" en direct verkeer groeien. Je koude outreach doet dit al deels; referentielogo's en zichtbaarheid (bijvoorbeeld LinkedIn) versterken het. Merkverkeer heeft veruit de hoogste CTR.

## Meetpunten

- Zet eerst het GA4 internal traffic IP filter actief, anders blijven je eigen bezoeken de cijfers vertekenen.
- Volg in Search Console de positie van de "kosten" en "mieten" cluster (doel: van positie 80 naar de eerste twee pagina's).
- Volg clicks en CTR van `website-abo-schweiz` na de titelwijziging.
- Volg via GA4 het kanaal Paid Search zodra Ads live staan.

## Eerlijke verwachting

In deze kleine Zwitserse markt is SEO een langzame druppel: reken op maanden, niet weken. De realistische verkeersmotoren op korte termijn zijn Google Ads en je koude outreach. SEO is de investering die daaronder langzaam waarde opbouwt.
