---
title: "Wat kost een 3D-configurator en hoe werkt hij?"
description: "Wat kost een 3D-productconfigurator en hoe zit de techniek in elkaar? De keten (WebGL, CPQ, ERP), SaaS of maatwerk en wanneer je product er klaar voor is."
date: "2026-07-30"
updated: "2026-10-23"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/3d-configurator-cost-cover.jpg"
---

Wie zoekt naar een 3D-configurator heeft meestal al een beeld voor ogen. De klant stelt op je website zelf zijn overkapping, tuinhuis, zetel of machine samen. Hij ziet het 3D-beeld en de prijs live veranderen en bestelt zonder dagenlang offerteverkeer. Dit artikel legt uit hoe je daar komt: wat een 3D-configurator precies is, wanneer je product er geschikt voor is, wat het kost en of je beter software koopt of laat bouwen.

**Kort gezegd:** een 3D-configurator is software waarmee gebruikers een product online visueel samenstellen, terwijl de software meteen de prijs berekent en controleert of het product technisch produceerbaar is. Het systeem verbindt een visuele engine (zoals Three.js/WebGL) met een regelmotor (CPQ) en stuurt de data door naar ERP- of CAD-systemen. Bedrijven zetten hem in om offertes sneller te maken, fouten in bestellingen te verminderen en meer online te verkopen.

## In het kort

- **Interessant bij** producten met 5 of meer variabele kenmerken of een arbeidsintensief offertetraject.
- **Rendement:** ter illustratie de typische ordegrootte in de sector. Een offertetraject van dagen wordt een sessie van minuten. Het aantal foute varianten in bestellingen daalt sterk zodra regels de validatie overnemen.
- **Techniek:** de kwaliteit van de product- en prijslogica (CPQ, ERP-data) bepaalt het succes, niet alleen het 3D-beeld.
- **SaaS of maatwerk:** kies SaaS voor standaard catalogusproducten en maatwerk voor unieke productieprocessen.

## Waarom fabrikanten nu een 3D-configurator overwegen

Drie ontwikkelingen komen samen. Ten eerste het personeelstekort: ervaren werkvoorbereiders en calculators zijn schaars. Elk uur dat zij aan standaardoffertes besteden, gaat niet naar echt maatwerk. Ten tweede snelheid als koopfactor: wie vandaag een overkapping of een machineonderdeel op maat zoekt, verwacht meteen beeld en prijs, niet een offerte over vijf werkdagen. Ten derde foutkosten: elke variant die verkeerd besteld of geproduceerd wordt, kost marge en vertrouwen.

Ter illustratie drie scenario's zoals we ze in de maakindustrie zien terugkomen. Een zwembadleverancier brengt zijn offertetraject van dagen terug naar een configuratiesessie van enkele minuten. Een fabrikant van overkappingen en tuinhuizen ziet misverstanden over maatvoering en opties vrijwel verdwijnen, omdat de configurator alleen produceerbare combinaties toelaat. Een industriële machinebouwer ziet meer aanvragen converteren doordat opties meteen in beeld komen in plaats van beschreven in een PDF. De precieze cijfers verschillen per bedrijf. Het patroon is telkens hetzelfde: sneller, minder fouten en minder afhankelijk van schaarse specialisten.

## Hoe werkt een 3D-configurator? Begrippen en keten

De termen lopen in de praktijk door elkaar. Dit is de afbakening. Een **gewone webshop** verkoopt vaste artikelen uit een catalogus. Een **productconfigurator** bouwt het artikel op uit regels en opties. Een **offertecalculator** rekent een prijs uit op basis van invoervelden. Een volwaardig **CPQ-systeem** (Configure, Price, Quote) bewaakt daarnaast welke combinaties geldig zijn en maakt de offerte op. **CAD** is de technische tekenomgeving van je engineers. De **3D-visualisatie in de browser** is daar een vereenvoudigd model van, gemaakt om snel te laden en vlot te draaien op elk toestel.

De technische keten van een professionele configurator ziet er zo uit:

**Gebruikersinterface** (wat de gebruiker op het scherm ziet) → **regelmotor** (product- en prijslogica) → **output** (offerte, stuklijst, technische tekening)

De gebruiker beweegt in de visuele laag. De regelmotor bewaakt intussen wat kan en wat het kost. Zodra de order bevestigd is, stroomt de data door naar productie: een stuklijst (BOM), snijlijsten of een technische tekening. Daarbij horen twee productiestrategieën:

- **Configure-to-Order (CTO):** standaard bouwstenen in eindeloze combinaties. De configurator kiest en combineert.
- **Engineer-to-Order (ETO):** echt maatwerk waarbij per order unieke CAD-tekeningen nodig zijn. De configurator wordt dan de voorkant van je engineering.

## Is jouw product geschikt? De beslisboom

**Ja, een configurator wordt interessant wanneer:**

- een offerte handmatig opstellen langer duurt dan 15 minuten;
- er regelmatig foute varianten besteld of geproduceerd worden;
- je product 5 of meer variabele kenmerken heeft (kleur, afmeting, materiaal, accessoires).

**Nee of nog niet, wanneer:**

- er maar twee of drie vaste varianten bestaan;
- elk product volledig uniek handwerk is zonder vaste productregels.

**Let op:** is standaardisatie deels mogelijk, dan loont het vaak om je proces eerst te analyseren en te stroomlijnen voordat je automatiseert.

## De Configurator Readiness Score

Wil je het objectiever maken? Beoordeel je bedrijf dan op vijf onderdelen, telkens met 1 tot 5 punten:

1. **Productvariatie:** hoe complex is het aanbod?
2. **Helderheid van productregels:** staan de regels op papier of alleen in hoofden en Excel?
3. **Visualisatiebehoefte:** heeft je klant moeite om zich het eindresultaat voor te stellen?
4. **Integratiebereidheid:** is er een centraal ERP- of CRM-systeem met betrouwbare data?
5. **Offertevolume:** verwerk je meer dan twintig offertes per week?

- **Score 5 tot 10:** nog niet geschikt. Breng eerst je data en processen op orde.
- **Score 11 tot 18:** oriëntatiefase. Overweeg SaaS of een basisconfigurator.
- **Score 19 tot 25:** sterke businesscase voor een 3D-configurator, eventueel op maat.

## Functionaliteiten: basis versus professioneel

| Functionaliteit | Basisconfigurator | Professionele 3D-configurator |
|---|---|---|
| 3D-visualisatie | Standaard WebGL met 360-gradenrotatie | Realtime licht en schaduw, AR-weergave op locatie |
| Prijsberekening | Statische matrix of basisregels | Dynamische prijslogica, eventueel gekoppeld aan live grondstofprijzen |
| Integraties | Geen of een e-commerceplugin | Tweewegkoppeling met ERP (SAP, Dynamics 365, Exact, Odoo) |
| Output | PDF-offerte voor de klant | Automatische stuklijst (BOM), snijlijsten en CAD-bestanden (STEP/DXF) |
| Bedrijfsregels | Beperkt tot eenvoudige keuzes | Complexe afhankelijkheden: verandert X, dan vervalt Y |

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#F4F6FA;border:1px solid #E9EEF6">
  <strong style="display:block;font-size:1.05rem;color:#16233D;margin-bottom:0.6rem">Uit de praktijk</strong>
  <p style="margin:0 0 0.75rem">Bij een fabrikant van buitengebouwen zaten we samen om de productregels op papier te krijgen: welke combinaties kunnen, welke niet en waarom niet. Dat viel zwaarder dan iedereen had verwacht. De kennis ontbrak niet. Ze zat in hoofden en niet op papier. Wat de ene collega vanzelfsprekend vond, deed de andere net iets anders.</p>
  <p style="margin:0 0 0.75rem">Het traject liep intussen al. Elke regel die nog uitgedokterd moest worden, hield de bouw op.</p>
  <p style="margin:0 0 0.75rem">Daar zit meteen het bijkomende voordeel van een goede analyse vooraf. Een configurator dwingt je je eigen productregels uit te schrijven, inclusief de uitzonderingen die niemand ooit had opgeschreven. Die oefening had ook zonder configurator waarde gehad.</p>
  <p style="margin:0;font-size:0.875rem">Uit respect voor de klant noemen wij geen namen.</p>
</div>

## Garbage in, garbage out: datakwaliteit beslist

Niet de 3D-rendering maar de kwaliteit van je productdata en bedrijfsregels bepaalt het overgrote deel van het succes. Een prachtige 3D-weergave van een product dat niet geproduceerd kan worden, levert teleurgestelde klanten en handmatig herstelwerk op. Daarom begint elk serieus configuratortraject met het expliciet maken van productregels, prijsopbouw en uitzonderingen. Dat is analysewerk, geen renderwerk.

## SaaS-software kopen of maatwerk laten maken?

| Criterium | SaaS-platform (bv. Threekit, Expivi) | Maatwerk (eigen applicatie) |
|---|---|---|
| Snelheid naar de markt | Snel: weken | Langer: maanden |
| Kosten | Maandelijks terugkerende licentie | Eenmalige bouw plus onderhoud |
| Flexibiliteit | Jij past je proces aan de software aan | De software volgt exact jouw werkwijze |
| Broncode en gebruiksrecht | Geen toegang tot de broncode | Volledige broncode en blijvend gebruiksrecht; je productregels en data blijven van jou |

De vuistregel: verkoop je een catalogusproduct met opties, dan kom je met SaaS ver. Is je productlogica zelf je concurrentievoordeel of moet de configurator diep in je ERP en je productie haken? Dan wint maatwerk op termijn vrijwel altijd.

## Wat kost een 3D-configurator?

Dit zijn indicatieve bandbreedtes zoals ze in de markt voorkomen, geen prijslijst. De precieze prijs hangt af van productcomplexiteit, integraties en visualisatie-eisen.

- **Basis- of instapconfigurator (€10.000 tot €25.000):** visuele weergave met basisprijsberekening en output per e-mail of PDF.
- **Middelgrote productconfigurator (€25.000 tot €60.000):** Three.js-visualisatie, ERP-koppeling (bijvoorbeeld Exact of Business Central) en uitbreidbare regellogica.
- **Complexe CPQ/3D-oplossing voor grote ondernemingen (€60.000 tot €150.000 en meer):** volledig geïntegreerd met CAD-generatie, SAP of Dynamics, ETO-processen en meertaligheid.

Vergelijk nooit op de bouwprijs alleen. De kost van een verkeerd gespecificeerd traject (herbouw, meerwerk, een configurator die niemand gebruikt) is vrijwel altijd groter dan het verschil tussen twee offertes.

## Van traject tot oplevering: vijf stappen

1. **Analyse en readiness check:** is het product configureerbaar en is de businesscase er?
2. **Datastructuur en productregels vastleggen:** het specificatiedocument met acceptatiecriteria.
3. **Architectuur en keuze van de bouwpartner:** offertes vergelijk je op basis van hetzelfde document.
4. **Bouw:** iteratief in sprints met demo's en acceptatietesten tegen de specificatie.
5. **Koppeling, nazorg en optimalisatie:** live gaan, meten en de regels zelf blijven beheren.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">Twijfel je of jouw product configureerbaar is?</strong>
  <p style="margin:0 0 1rem;color:#5B667C"><span class="brand-mark">semanu</span> bouwt 3D-configuratoren op maat. We beginnen bij je productregels en koppelen de configurator aan je offerte- en orderproces.</p>
  <a href="/nl/services/3d-configurators"><strong>Lees meer over 3D-configuratoren →</strong></a>
</div>

## Wanneer is een 3D-configurator geen goed idee?

- Wanneer je productdata een chaos is: eerst opruimen, dan automatiseren.
- Bij een klein assortiment zonder maatwerkopties: een goede productpagina volstaat.
- Als je verkoop volledig via persoonlijke relaties loopt en je doelgroep digitaal niet actief is.

## Veelgestelde vragen

**Is een 3D-configurator hetzelfde als een CPQ-systeem?**
Nee. CPQ (Configure, Price, Quote) is de regelmotor die bewaakt welke combinaties geldig zijn en wat ze kosten. De 3D-configurator is de visuele laag daarbovenop. Een goede oplossing combineert beide. Alleen 3D zonder CPQ is een demo, geen verkooptool.

**Wanneer kies je voor Three.js/WebGL en wanneer voor rendering op de server?**
Three.js/WebGL rendert in de browser en is de standaard voor interactieve productconfiguratie: snel, zonder installatie en het werkt op mobiel. Rendering op de server is zinvol bij fotorealistische beelden van extreem zware modellen. Het voegt wel vertraging en serverkosten toe. Voor de meeste fabrikanten is WebGL de juiste keuze.

**Heb ik CAD-bestanden nodig om een 3D-configurator te bouwen?**
Niet per se. Bestaande CAD-modellen versnellen het werk. Ze zijn wel te zwaar voor de browser en worden altijd vereenvoudigd tot webmodellen. Zijn er geen CAD-bestanden, dan bouwt een 3D-artist de modellen op basis van tekeningen of foto's.

**Kan een 3D-configurator werken zonder gekoppeld ERP-systeem?**
Ja, zeker in een eerste fase. De configurator levert dan offertes en orders per e-mail of PDF. De grootste winst komt wel uit de koppeling, want dan stromen orders, stuklijsten en prijzen automatisch door zonder overtypen.

**Hoe werkt een 3D-configurator op mobiel?**
WebGL draait op moderne smartphones. Zware modellen vragen wel optimalisatie: minder polygonen, gecomprimeerde texturen en een interface die op een klein scherm werkt. Stel mobiele prestaties vanaf dag één als eis, niet als nagedachte.

**Kan ik na oplevering zelf productregels en prijzen beheren?**
Dat hoort zo. Eis een beheeromgeving waarin je eigen team opties, prijzen en regels aanpast zonder ontwikkelaar. Wie voor elke prijswijziging terug naar de bouwer moet, heeft een afhankelijkheid gebouwd in plaats van een verkooptool.

Verder lezen: Gartner, Market Guide for CPQ Application Suites · McKinsey & Company, publicaties over digitalisering in de maakindustrie · technische documentatie van [Three.js](https://threejs.org/docs/) en de grote CAD-platformen (Autodesk, PTC, Siemens).

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Is een 3D-configurator hetzelfde als een CPQ-systeem?","acceptedAnswer":{"@type":"Answer","text":"Nee. CPQ (Configure, Price, Quote) is de regelmotor die bewaakt welke combinaties geldig zijn en wat ze kosten. De 3D-configurator is de visuele laag daarbovenop. Een goede oplossing combineert beide. Alleen 3D zonder CPQ is een demo, geen verkooptool."}},{"@type":"Question","name":"Wanneer kies je voor Three.js/WebGL en wanneer voor rendering op de server?","acceptedAnswer":{"@type":"Answer","text":"Three.js/WebGL rendert in de browser en is de standaard voor interactieve productconfiguratie: snel, zonder installatie en het werkt op mobiel. Rendering op de server is zinvol bij fotorealistische beelden van extreem zware modellen. Het voegt wel vertraging en serverkosten toe. Voor de meeste fabrikanten is WebGL de juiste keuze."}},{"@type":"Question","name":"Heb ik CAD-bestanden nodig om een 3D-configurator te bouwen?","acceptedAnswer":{"@type":"Answer","text":"Niet per se. Bestaande CAD-modellen versnellen het werk. Ze zijn wel te zwaar voor de browser en worden altijd vereenvoudigd tot webmodellen. Zijn er geen CAD-bestanden, dan bouwt een 3D-artist de modellen op basis van tekeningen of foto's."}},{"@type":"Question","name":"Kan een 3D-configurator werken zonder gekoppeld ERP-systeem?","acceptedAnswer":{"@type":"Answer","text":"Ja, zeker in een eerste fase. De configurator levert dan offertes en orders per e-mail of PDF. De grootste winst komt wel uit de koppeling, want dan stromen orders, stuklijsten en prijzen automatisch door zonder overtypen."}},{"@type":"Question","name":"Hoe werkt een 3D-configurator op mobiel?","acceptedAnswer":{"@type":"Answer","text":"WebGL draait op moderne smartphones. Zware modellen vragen wel optimalisatie: minder polygonen, gecomprimeerde texturen en een interface die op een klein scherm werkt. Stel mobiele prestaties vanaf dag één als eis, niet als nagedachte."}},{"@type":"Question","name":"Kan ik na oplevering zelf productregels en prijzen beheren?","acceptedAnswer":{"@type":"Answer","text":"Dat hoort zo. Eis een beheeromgeving waarin je eigen team opties, prijzen en regels aanpast zonder ontwikkelaar. Wie voor elke prijswijziging terug naar de bouwer moet, heeft een afhankelijkheid gebouwd in plaats van een verkooptool."}}]}
</script>
