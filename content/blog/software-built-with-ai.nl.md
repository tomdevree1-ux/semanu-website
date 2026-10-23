---
title: "Software gebouwd met AI: de vijf risico's"
description: "Met AI gebouwde software werkt in de demo en faalt op wat je niet ziet: validatie, open API's, lekkende data en GDPR. De vijf risico's en hoe je ze dicht."
date: "2026-08-24"
updated: "2026-10-23"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/software-built-with-ai-cover.svg"
---

Een offerteformulier, een klantenportaal, een planningstool: met AI-codetools staat het er in dagen in plaats van maanden. Dat is echte winst. We raden niemand aan om terug te gaan. Maar wij kijken beroepshalve onder de motorkap van dit soort applicaties en daar komt telkens hetzelfde beeld uit. De software doet wat de demo belooft. De problemen zitten in alles wat de demo niet toont.

**Kort gezegd:** Met AI gebouwde software werkt meestal vlekkeloos in de demo en faalt op wat je niet ziet: ontbrekende invoervalidatie, API's die openstaan voor wie het adres kent, persoonsgegevens die lekken, GDPR-verplichtingen die nergens zijn afgedekt en bedrijfslogica die in de browser draait in plaats van op de server. [Onderzoekers van NYU stelden in 2021 vast](https://arxiv.org/abs/2108.09293) dat ongeveer veertig procent van de code die een AI-assistent in hun testscenario's schreef kwetsbaarheden bevatte. Elk van die gaten is vast te stellen en te dichten, het liefst voor de livegang.

## Iedereen bouwt nu zelf en dat is geen slechte zaak

De drempel om software te maken is in twee jaar tijd ingestort. Wat vroeger een ontwikkelteam en een half jaar vroeg, doet een handige medewerker nu in een paar weken. Voor een kmo is dat een kans: je kent je eigen werking beter dan elke externe bouwer en je kunt eindelijk tools maken die exact op je proces passen.

Het probleem is niet het bouwen. De tools optimaliseren op werkende code, niet op veilige code. De bouwer heeft meestal niet de achtergrond om het verschil te zien. De app doet het, iedereen is tevreden en niemand stelt de vraag die een professionele ontwikkelaar als eerste stelt: wat gebeurt er als iemand dit verkeerd gebruikt?

## De vijf gaten die telkens terugkomen

Dit zijn de vijf patronen die wij in reviews van zelfgebouwde applicaties het vaakst tegenkomen. Ze zijn stuk voor stuk onzichtbaar in een demo en stuk voor stuk pijnlijk na de livegang.

### 1. Invoer wordt niet gecontroleerd

Een formulier verwacht een naam en een e-mailadres. Wat gebeurt er als iemand er een stuk code in plakt, een bestand van 2 gigabyte of een tekst van tienduizend tekens? Zonder invoervalidatie belandt dat allemaal ongefilterd in je database of in de mails naar je team. Dat begint bij rommel in je gegevens. Het eindigt bij een aanvaller die via een invoerveld je database leest.

### 2. De API staat open voor wie het adres kent

Achter elke app zit een laag die de gegevens ophaalt en wegschrijft. AI-tools zetten die laag vaak op zonder te controleren wie er aanklopt. Wie het adres kent of gewoon raadt, kan dan rechtstreeks bestellingen, klantgegevens of prijzen opvragen zonder ooit in te loggen. Het adres staat bovendien leesbaar in de code die elke browser binnenkrijgt.

### 3. Persoonsgegevens lekken via de achterdeur

Foutmeldingen die het hele klantenrecord tonen, exportknoppen zonder rechtencontrole, logbestanden vol e-mailadressen: zelfgebouwde apps lekken persoonsgegevens zelden via de voordeur en bijna altijd via een vergeten zijdeur. Eén lek is genoeg voor een melding bij de toezichthouder voor gegevensbescherming en een lastig gesprek met elke betrokken klant.

### 4. GDPR is nergens afgedekt

Wie verwerkt de gegevens, waar staan ze, hoe lang worden ze bewaard en op welke grond? Een AI-tool stelt die vragen niet en de bouwer meestal ook niet. Zo draait er ineens een app die klantgegevens naar een dienst buiten de EU stuurt. Zonder verwerkersovereenkomst, zonder vermelding in de privacyverklaring en zonder dat iemand het besefte.

### 5. De bedrijfslogica draait in de browser

De klassieker uit configurators en offertetools: de prijsberekening zit in de code die naar de bezoeker gestuurd wordt. Iedereen met een browser kan die code lezen en aanpassen. In het beste geval kijkt een concurrent je kortingsstructuur af. In het slechtste geval bestelt iemand tegen een prijs die hij zelf heeft ingevuld. Dan heb je een juridisch probleem, want de bestelling is bevestigd.

## Waarom de demo je niets vertelt

Een demo toont het verwachte pad: correcte invoer, een welwillende gebruiker en geen enkele aanvaller. Precies de drie aannames die na de livegang sneuvelen. Echte gebruikers doen onverwachte dingen, bots scannen elke publieke URL binnen enkele dagen en formulieren krijgen binnen de week hun eerste geautomatiseerde rommel binnen. De vraag is niet of het misgaat. De vraag is of het opvalt wanneer het misgaat. Bij zelfgebouwde apps is dat zelden geregeld: logging en alarmen ontbreken bijna altijd.

## Wat je vandaag zelf kunt controleren

Vier controles die geen technische achtergrond vragen. Zak je op een ervan, dan weet je dat er meer aan de hand is.

1. **Vul in elk veld eens iets fout in.** Tekst waar een getal hoort, een leeg verplicht veld, een absurd lange naam. Krijg je nette foutmeldingen of doet de app rare dingen?
2. **Open de app in een incognitovenster.** Plak het adres van een pagina die achter de login hoort te zitten. Zie je toch gegevens, dan staat de deur open.
3. **Vraag naar de verwerkersovereenkomsten.** Wie heeft er een met elke externe dienst die de app gebruikt? Stilte is ook een antwoord.
4. **Vraag de bouwer waar de prijsberekening draait.** Is het antwoord "in de app zelf", vraag dan door: op de server of in de browser?

## Laat het toetsen voor je live gaat

Zelf bouwen en professioneel toetsen sluiten elkaar niet uit. Ze horen juist samen. Een goede toets bekijkt zes domeinen: veiligheid, persoonsgegevens en GDPR, functionele werking met testscenario's, architectuur en logica, prestaties en mobiel gebruik en tot slot continuïteit. Het resultaat is een rapport dat per bevinding aangeeft wat kritiek is en wat kan wachten. Je team bouwt daarna gewoon verder, nu met de gaten dicht.

Raakt de app klanten, geld of persoonsgegevens en wil je hem op een stevige basis? Dan kun je ook [bedrijfssoftware op maat](/nl/services/business-software) laten bouwen waarin validatie, rechten en GDPR vanaf de eerste regel code zitten.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">Zelf gebouwd en bijna klaar voor livegang?</strong>
  <p style="margin:0 0 1rem;color:#5B667C"><span class="brand-mark">semanu</span> bouwt bedrijfssoftware op maat met AI als motor. Validatie, rechtencontrole en GDPR zitten er vanaf de start in. Vertel ons wat je gebouwd hebt of wilt bouwen. Samen bepalen we de volgende stap.</p>
  <a href="/nl/contact"><strong>Neem contact op →</strong></a>
</div>

## Veelgestelde vragen

**Is software die met AI gebouwd is onveilig?**
Niet per definitie. De kans op gaten is wel groter. Onderzoekers van NYU vonden in 2021 dat ongeveer veertig procent van de code die een AI-assistent schreef kwetsbaarheden bevatte. De tools optimaliseren op werkende code, niet op veilige code.

**Mag ik dan niet meer zelf bouwen met AI?**
Jawel. Voor veel interne tools is het de snelste weg. Laat een app die klanten, geld of persoonsgegevens raakt wel toetsen voor hij live gaat. Net zoals je een zelf verbouwde keuken laat keuren voor je het gas aansluit.

**Wat controleert een softwaretoets precies?**
Zes domeinen: veiligheid, persoonsgegevens en GDPR, functionele werking met testscenario's, architectuur en logica, prestaties en mobiel gebruik en continuïteit. Het resultaat is een rapport met een prioriteitenlijst in drie niveaus.

**Waar hoort de prijsberekening te draaien?**
Op de server. De browser toont de prijs. De server rekent hem opnieuw uit en bevestigt hem. Zo kan niemand een bestelling plaatsen tegen een prijs die hij zelf heeft aangepast.

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Is software die met AI gebouwd is onveilig?","acceptedAnswer":{"@type":"Answer","text":"Niet per definitie. De kans op gaten is wel groter. Onderzoekers van NYU vonden in 2021 dat ongeveer veertig procent van de code die een AI-assistent schreef kwetsbaarheden bevatte. De tools optimaliseren op werkende code, niet op veilige code."}},{"@type":"Question","name":"Mag ik dan niet meer zelf bouwen met AI?","acceptedAnswer":{"@type":"Answer","text":"Jawel. Voor veel interne tools is het de snelste weg. Laat een app die klanten, geld of persoonsgegevens raakt wel toetsen voor hij live gaat. Net zoals je een zelf verbouwde keuken laat keuren voor je het gas aansluit."}},{"@type":"Question","name":"Wat controleert een softwaretoets precies?","acceptedAnswer":{"@type":"Answer","text":"Zes domeinen: veiligheid, persoonsgegevens en GDPR, functionele werking met testscenario's, architectuur en logica, prestaties en mobiel gebruik en continuïteit. Het resultaat is een rapport met een prioriteitenlijst in drie niveaus."}},{"@type":"Question","name":"Waar hoort de prijsberekening te draaien?","acceptedAnswer":{"@type":"Answer","text":"Op de server. De browser toont de prijs. De server rekent hem opnieuw uit en bevestigt hem. Zo kan niemand een bestelling plaatsen tegen een prijs die hij zelf heeft aangepast."}}]}
</script>
