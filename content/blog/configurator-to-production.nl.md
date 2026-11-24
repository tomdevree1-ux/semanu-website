---
title: "Van configurator naar productie: je offerte als basis van je zaaglijst"
description: "Hoe een configurator vanuit de offerte rechtstreeks een zaaglijst, stuklijst en CAD-bestand kan genereren. Gedaan met overtypen van dezelfde data."
date: "2026-11-24"
updated: "2026-11-24"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/configurator-to-production-cover.jpg"
---

In de meeste maakbedrijven zien we steeds dat bedrijfsflows gevangen zitten in silo's. Elke fase begint met het werk van de vorige fase opnieuw te doen. De klant tekent en vervolgens begint het eigenlijke werk: iemand neemt de bestelling over in een spreadsheet, rekent de maten uit, maakt een zaaglijst en tekent het product na voor de werkplaats. Dit is niet alleen dubbel werk maar ook zeer foutgevoelig. In dit artikel leggen we uit hoe onze configuratoren die stappen overbodig maken: wat de klant kiest, gaat in één keer foutloos naar productie.

**Kort gezegd:** een configurator met goed ingebouwde productregels kent niet alleen de prijs maar ook de onderdelen, maten en bewerkingen van de configuratie. Zodra de klant de offerte bevestigd heeft, worden automatisch de stuklijst, de zaaglijst, het snijbestand of de CAD-tekening gegenereerd. De offerte en het productiedossier komen uit dezelfde bron, dus ze kunnen niet meer van elkaar afwijken.

## In het kort

- **Het probleem:** tussen offerte en productie zit bijna altijd een collega die alles opnieuw invoert. Daardoor ontstaan de meeste fouten.
- **De oplossing:** dezelfde productregels die de prijs berekenen, berekenen ook de onderdelen.
- **Wat eruit komt:** stuklijst, zaaglijst, snijbestand, technische tekening of CAD-bestand en een koppeling met je webshop of ERP-systeem.
- **De voorwaarde:** je productregels moeten gedefinieerd kunnen worden.

## Waar het vandaag misloopt

Neem een fabrikant van kasten op maat. De verkoper maakt een offerte voor een kast van 2.340 mm breed met twee laden en een hangroede. De klant tekent en vervolgens doet de werkvoorbereiding het werk opnieuw: hoe breed wordt elk vak, hoeveel zijpanelen, welke dikte, welke lengte voor de plint, hoeveel scharnieren. Dat komt in een zaaglijst voor de zaagmachine.

Op drie plaatsen kan dat fout lopen:

1. **Overtypen.** Een maat wordt verkeerd overgenomen, een optie wordt vergeten.
2. **Interpretatie.** De verkoper bedoelde iets anders dan de werkvoorbereider begrijpt.
3. **Kennis in hoofden.** De regel "boven 600 mm breed komt er een tussenschot" staat nergens. Is die ene collega met verlof, dan gaat het mis.

Het gevolg ken je: een verkeerd gezaagd paneel, een tweede levering, een klant die wacht. En een werkvoorbereider die zijn dagen vult met rekenwerk in plaats van met echte maatwerkvragen.

## Hoe een configurator dat oplost

Het verschil zit niet in het 3D-beeld maar in wat erachter zit. Aangezien een 3D-configurator steeds beschikt over de geometrie van het project, wordt hij meer dan alleen een offertetool. Een configurator die ook de onderdelen berekent, is een verlengstuk van je werkvoorbereiding en de backbone van je organisatie.

Dat werkt zo:

**Keuzes van de klant** → **productregels** → **prijs en productiedata**

De productregels beschrijven je product zoals je werkplaats het kent. Enkele eenvoudige voorbeelden uit de praktijk:

- Elk vak is gelijk aan de binnenbreedte gedeeld door het aantal vakken, min de dikte van de tussenschotten.
- Boven een bepaalde breedte komt er een extra steun.
- Een lade vraagt twee geleiders van een lengte die afhangt van de diepte.
- Een gekozen kleur bepaalt de plaat en de kantband.

Dezelfde regels die zeggen wat iets kost, zeggen ook uit welke onderdelen het bestaat. Kiest de klant een andere breedte, dan veranderen de prijs, het 3D-beeld en de zaaglijst tegelijk.

## Wat er uit de configurator komt

Welke uitvoer je nodig hebt, hangt af van je product en je machines. De meest voorkomende:

| Uitvoer | Voor wie | Voorbeeld |
|---|---|---|
| Stuklijst (BOM) | Inkoop en magazijn | Alle onderdelen met aantallen en artikelnummers |
| Zaaglijst | Zagerij | Lengtes en breedtes per plaat of profiel, met materiaal en dikte |
| Snijbestand (DXF) | Lasersnijder, CNC, plaatbewerking | De contouren van elk stuk, klaar voor de machine |
| Technische tekening | Werkplaats en montage | Aanzichten met maten, als PDF |
| CAD-bestand (STEP) | Engineering | Het volledige 3D-model voor verdere uitwerking |
| Order in je ERP | Planning en facturatie | De bestelling met alle regels, zonder overtypen |

Belangrijk punt: doe het niet allemaal tegelijk. Een te brede eerste fase is een van de bekendste valkuilen bij configurator- en CPQ-projecten. Analisten als [Constellation Research](https://www.constellationr.com/research/think-big-get-most-out-configure-price-quote-systems) raden daarom een brede visie aan met een gefaseerde uitvoering. Ook [Tacton](https://www.tacton.com/?p=37882) noemt een te grote scope in de eerste fase als oorzaak van mislukte projecten. Begin klein met enkel de offerte en bouw vervolgens verder naar een zaaglijst als PDF of Excel. Daarna volgt de koppeling met je ERP of je machines.

## Voor wie loont dit het meest?

Het rendement is het grootst wanneer:

- je product **op maat gemaakt** wordt maar volgens **vaste regels** (kasten, trappen, poorten, overkappingen, garageboxen, plaatwerk);
- je werkvoorbereiding **veel tijd** steekt in het omzetten van offertes naar productiedata;
- **fouten tussen verkoop en werkplaats** regelmatig voorkomen en geld kosten;
- je afhankelijk bent van **een of twee mensen** die de regels kennen.

Maak je elk product volledig uniek, zonder vaste regels en telkens via een nieuwe opbouw? Dan kan een configurator de engineering niet vervangen. Hij kan dan nog steeds een leadgenerator worden die ervoor zorgt dat klanten interesse krijgen in je product en vervolgens jouw bedrijf contacteren.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#F4F6FA;border:1px solid #E9EEF6">
  <strong style="display:block;font-size:1.05rem;color:#16233D;margin-bottom:0.6rem">Uit de praktijk</strong>
  <p style="margin:0 0 0.75rem">Bij een fabrikant van prefab constructies maakte de verkoopafdeling de offertes. De werkvoorbereiding tekende daarna elke bestelling opnieuw uit. Een wijziging van de klant betekende twee keer werk: de offerte aanpassen en de tekeningen aanpassen.</p>
  <p style="margin:0 0 0.75rem">Toen we de productregels uitschreven voor de configurator, bleek dat de tekeningen en de bestellijsten uit dezelfde regels konden komen als de prijs. Sindsdien maakt de configurator ze zelf. De werkvoorbereiding controleert nog. Van nul tekenen hoeft niet meer.</p>
  <p style="margin:0;font-size:0.875rem">Uit respect voor de klant noemen wij geen namen.</p>
</div>

## Hoe begin je eraan?

1. **Is je bedrijfsflow geoptimaliseerd?** Een configurator zal je bedrijfsflow in vraag stellen of je het wil of niet. Het loont de moeite om die als interne voorbereiding al eens onder de loep te nemen en te kijken waar optimalisatie mogelijk is.
2. **Schrijf je productregels uit.** Welke keuzes zijn er, welke combinaties kunnen niet en hoe volgen de onderdelen uit de maten? Dit is het belangrijkste werk en ook zonder configurator een waardevolle oefening.
3. **Kies je eerste uitvoer.** Begin met wat het meeste tijd kost: meestal de offerte of de stuklijst.
4. **Test met echte bestellingen.** Laat de configurator een maand lang naast je huidige werkwijze draaien en vergelijk de resultaten.
5. **Koppel stap voor stap.** Eerst een bestand dat iemand nakijkt, daarna een rechtstreekse koppeling met je ERP of je machines.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">Wil je weten wat jouw configurator kan aanleveren?</strong>
  <p style="margin:0 0 1rem;color:#5B667C"><span class="brand-mark">semanu</span> bouwt configuratoren die niet stoppen bij de offerte. We vertrekken van je productregels en laten de configurator stuklijsten, zaaglijsten en tekeningen maken op maat van je werkplaats.</p>
  <a href="/nl/services/3d-configurators"><strong>Lees meer over 3D-configuratoren →</strong></a>
</div>

## Veelgestelde vragen

**Moet mijn werkvoorbereiding dan nog iets doen?**
Jazeker, alleen vervalt het repetitieve werk en komt er tijd vrij voor innovatie en kwaliteitscontrole. Hun kennis zit dan niet langer enkel in hun hoofden maar ook in de configurator.

**Werkt dit ook met mijn bestaande machines?**
Meestal wel. Een businessanalyse in het voortraject brengt daar duidelijkheid in. Zaaglijsten en stuklijsten kunnen als Excel of CSV worden aangeleverd, snijbestanden als DXF. Welke formaten je machines lezen, bepaalt wat de configurator maakt.

**Heb ik een ERP nodig?**
Nee, onze configuratoren nemen al een deel van het ERP-werk over. Heb je toch een ERP-systeem? Dan koppelen we de configurator graag aan je bestaande platform.

**Wat als een klant iets vraagt wat niet in de regels past?**
Dan meldt de configurator dat het een speciale aanvraag is en neemt je team het over. De standaard loopt automatisch, de uitzondering krijgt aandacht van een mens.

**Is dit hetzelfde als een CPQ-systeem?**
CPQ berekent configuratie, prijs en offerte. Wat hier beschreven staat, gaat een stap verder: dezelfde regels maken ook de productiedata. Je kunt het zien als CPQ dat doorloopt tot in de werkplaats.

Verder lezen: [Wat kost een 3D-configurator en hoe werkt hij?](/nl/blog/3d-configurator-cost) · [ERP-integratie: 5 fouten en hoe je ze vermijdt](/nl/blog/erp-integration-mistakes) · Constellation Research, [Think Big to Get the Most Out of Configure, Price, Quote Systems](https://www.constellationr.com/research/think-big-get-most-out-configure-price-quote-systems).

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Moet mijn werkvoorbereiding dan nog iets doen?","acceptedAnswer":{"@type":"Answer","text":"Jazeker, alleen vervalt het repetitieve werk en komt er tijd vrij voor innovatie en kwaliteitscontrole. Hun kennis zit dan niet langer enkel in hun hoofden maar ook in de configurator."}},{"@type":"Question","name":"Werkt dit ook met mijn bestaande machines?","acceptedAnswer":{"@type":"Answer","text":"Meestal wel. Een businessanalyse in het voortraject brengt daar duidelijkheid in. Zaaglijsten en stuklijsten kunnen als Excel of CSV worden aangeleverd, snijbestanden als DXF. Welke formaten je machines lezen, bepaalt wat de configurator maakt."}},{"@type":"Question","name":"Heb ik een ERP nodig?","acceptedAnswer":{"@type":"Answer","text":"Nee, onze configuratoren nemen al een deel van het ERP-werk over. Heb je toch een ERP-systeem? Dan koppelen we de configurator graag aan je bestaande platform."}},{"@type":"Question","name":"Wat als een klant iets vraagt wat niet in de regels past?","acceptedAnswer":{"@type":"Answer","text":"Dan meldt de configurator dat het een speciale aanvraag is en neemt je team het over. De standaard loopt automatisch, de uitzondering krijgt aandacht van een mens."}},{"@type":"Question","name":"Is dit hetzelfde als een CPQ-systeem?","acceptedAnswer":{"@type":"Answer","text":"CPQ berekent configuratie, prijs en offerte. Wat hier beschreven staat, gaat een stap verder: dezelfde regels maken ook de productiedata. Je kunt het zien als CPQ dat doorloopt tot in de werkplaats."}}]}
</script>
