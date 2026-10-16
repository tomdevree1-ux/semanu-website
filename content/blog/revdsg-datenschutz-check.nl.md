---
title: "Voldoet jouw website aan de Zwitserse privacywet?"
description: "De herziene Zwitserse privacywet geldt sinds 1 september 2023. Veel mkb websites voldoen er nog steeds niet aan. Wat de revDSG eist en hoe je er in zeven stappen aan voldoet."
date: "2026-09-01"
updated: "2026-09-08"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/revdsg-datenschutz-check-cover.svg"
---

[De herziene Zwitserse privacywet](https://www.fedlex.admin.ch/eli/cc/2022/491/de) geldt sinds 1 september 2023, vandaag precies drie jaar. Toch staat op veel Zwitserse mkb websites nog altijd een privacyverklaring die iemand ergens van het web heeft gekopieerd. Ze noemt tools die er niet zijn. De tools die wel meedraaien blijven ongenoemd.

Kwade wil is het zelden. Een bureau bouwde de site jaren geleden en daarna keek niemand er nog naar. Alleen ligt de verantwoordelijkheid niet bij dat bureau. Ook niet bij de formulierplugin. Ze ligt bij jou.

**Kort gezegd:** een Zwitserse website voldoet aan de revDSG als vier dingen kloppen. De privacyverklaring beschrijft eerlijk welke data je verzamelt en waarvoor. Formulieren vragen alleen wat je echt nodig hebt. Analyse en advertentietools laden pas na toestemming. En je weet in welk land je data staat. Boetes tot 250'000 frank treffen de verantwoordelijke persoon zelf, niet het bedrijf.

## Wat eist de revDSG van een mkb website?

Vier plichten raken vrijwel elke bedrijfssite.

De **informatieplicht** is de zichtbaarste. Wie persoonsgegevens verzamelt moet vooraf in begrijpelijke taal zeggen wie de data verwerkt, waarvoor en wie ze ontvangt. Daar dient de privacyverklaring voor. Ze moet passen bij de werkelijkheid van jouw site in plaats van bij een willekeurig sjabloon.

Daarnaast is er het **inzagerecht**. Vraagt iemand welke gegevens je van hem bewaart, dan heb je in de regel 30 dagen om gratis te antwoorden. Dat lukt alleen als je weet waar die gegevens staan.

Bij een **datalek** met hoog risico meld je het voorval zo snel mogelijk bij de [federale privacytoezichthouder](https://www.edoeb.admin.ch). Een gehackt contactformulier of een nieuwsbrief export in de verkeerde mailbox kan daar al onder vallen.

Het **verwerkingsregister** ten slotte is vrijwillig voor bedrijven met minder dan 250 medewerkers, zolang er geen gevoelige gegevens of profilering met hoog risico in het spel zijn. De meeste mkb bedrijven vallen daarmee buiten die plicht. Zo'n lijst bijhouden blijft toch nuttig, want zonder de lijst zijn de andere drie plichten lastig netjes in te vullen.

<img src="/blog/revdsg-datenschutz-check-visual.svg" alt="Twee websites vergeleken: links een gekopieerde privacyverklaring met tracking die zonder toestemming laadt, rechts een conforme site met echte verklaring, toestemmingsdialoog en hosting in de EU" style="display:block;width:100%;height:auto;margin:2.5rem 0;border-radius:0.5rem;border:1px solid #E9EEF6" />

## Wie raakt dit en wat kost een overtreding?

Elk bedrijf met zetel in Zwitserland dat persoonsgegevens verwerkt valt eronder. Een contactformulier volstaat. Zelfs een pure visitekaartjessite logt IP adressen op de server. Ook dat zijn persoonsgegevens.

Verkoop je daarnaast aan klanten in de EU of stuur je daar nieuwsbrieven heen, dan geldt de AVG parallel. Haar eisen aan toestemming liggen hoger. Alleen de Zwitserse wet naleven is in dat geval nog niet genoeg.

De boetes zijn één kant: tot 250'000 frank, opgelegd aan de verantwoordelijke natuurlijke persoon in plaats van aan de vennootschap. Je kunt ze dus niet doorschuiven naar het bedrijf. In de praktijk wordt er weinig beboet en grijpt de wet pas na een aangifte in. De realistischere schade zit elders. Zakelijke klanten en publieke opdrachtgevers vragen steeds vaker om bewijs voordat ze tekenen. Een privacyverklaring die zichtbaar van een andere website komt maakt dan een slechte eerste indruk.

## Waar staat jouw data en waarom telt dat?

Persoonsgegevens mogen Zwitserland verlaten als het doelland passende bescherming biedt. Voor de EER is dat zo. Voor de Verenigde Staten geldt sinds 15 september 2024 het [Swiss US Data Privacy Framework](https://www.edoeb.admin.ch/en/15082024-new-swiss-us-data-privacy-framework): naar een gecertificeerde Amerikaanse aanbieder mag je zonder extra waarborgen doorgeven, naar een niet gecertificeerde niet. Weinig sitebeheerders kennen dat verschil.

Daarom hosten we bij <span class="brand-mark">semanu<span class="spark">!</span></span> in de EU. Database en opslag draaien op Supabase in een EU regio, de uitlevering via Cloudflare, de mail via Resend. Alle drie staan met naam in onze eigen privacyverklaring, inclusief doel plus locatie. Dat detailniveau bedoelt de wet.

## Hoe krijg je je website in zeven stappen op orde?

1. **Maak de inventaris.** Noteer elke plek waar je site data verzamelt: contactformulier, nieuwsbrief, afspraken boeken, chat, statistiek, ingesloten kaarten, video's en lettertypes die van vreemde servers laden. De lijst is bijna altijd langer dan gedacht.
2. **Herschrijf de privacyverklaring.** Kopieer er geen. Ze noemt je echte tools, het doel, de bewaartermijn, de ontvangers plus het adres voor inzageverzoeken. Een verklaring die diensten opsomt die je niet gebruikt is zelf onjuiste informatie.
3. **Slank je formulieren af.** Elk veld heeft een reden nodig. Telefoonnummer, geboortedatum en bedrijfsgrootte stapelen zich snel op terwijl je voor een offerte een naam plus een emailadres nodig hebt. Minder velden verhogen bovendien het aantal aanvragen.
4. **Laad tracking pas na toestemming.** Google Analytics, de Meta pixel en de conversietags van Google Ads horen achter de toestemmingsdialoog. Het punt is dat die dialoog de scripts echt tegenhoudt. Een balk die alleen informeert terwijl eronder allang alles laadt is decor.
5. **Zoek uit waar data heen gaat.** Vraag je hoster en je nieuwsbriefaanbieder waar de servers staan. Staat er iets in de Verenigde Staten, controleer dan de certificering onder het Data Privacy Framework. Dat kost tien minuten per aanbieder.
6. **Leg de processen vast.** Een adres voor inzageverzoeken dat iemand daadwerkelijk leest. Een interne notitie over wie na een lek de toezichthouder informeert. Dertig dagen klinkt ruim tot het verzoek tijdens de vakantie binnenkomt.
7. **Controleer regelmatig.** Een nieuwe plugin, een ingesloten video of een extra advertentieaccount brengt nieuwe tracking mee. Zonder controle klopt je verklaring binnen een half jaar alweer niet.

Dat laatste punt automatiseren wij. Onze Feedback Loop kijkt elke maand hoe je opduikt in Google plus in AI antwoorden. In dezelfde ronde checken we of er nieuwe scripts op de site staan of dat de privacyverklaring van de werkelijkheid is afgedreven. Zo vind je het gat zelf in plaats van dat een klant het vindt.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">Voldoet jouw website aan de revDSG?</strong>
  <p style="margin:0 0 1rem;color:#5B667C">Wij checken het gratis. Je hoort welke scripts zonder toestemming laden. Ook zeggen we of je privacyverklaring bij de site past en waar je data staat. Je krijgt er een lijstje bij met de punten die je als eerste aanpakt.</p>
  <a href="/nl/website-analyse"><strong>Gratis revDSG check aanvragen →</strong></a>
</div>

## Heb je in Zwitserland een cookiebanner nodig?

De Zwitserse wet eist geen toestemming voor puur technische cookies. De telecomwet vraagt alleen dat je bezoekers informeert plus dat je weigeren mogelijk maakt. Een winkelwagen of een taalkeuze mag dus zonder klik werken.

Bij analyse en advertenties ligt het anders. Zodra Google Analytics, Ads remarketing of een pixel meedoet gaan er gegevens naar derden. Voor bezoek uit de EU heb je dan echte toestemming nodig. In de praktijk: een sobere dialoog met even zichtbare knoppen voor accepteren of weigeren, zonder duistere trucs.

Voor Google Ads heeft dat een neveneffect dat veel adverteerders verrast. Zonder correct aangesloten consent mode verlies je conversiedata en optimaliseren je campagnes op gaten. Nette gegevensbescherming en werkende advertenties zijn hier dezelfde klus.

## Veelgestelde vragen

**Geldt de revDSG ook voor mijn kleine website zonder webshop?**
Ja. De wet grijpt zodra er persoonsgegevens verwerkt worden en kent geen ondergrens qua bedrijfsgrootte. Een contactformulier of serverlogs met IP adressen zijn al genoeg. Kleine bedrijven zijn alleen vrijgesteld van het verwerkingsregister zolang ze geen gevoelige gegevens verwerken.

**Heb ik echt een cookiebanner nodig?**
Voor strikt noodzakelijke cookies niet. Zodra je analysetools, advertentiepixels of ingesloten diensten van derden laadt heb je een toestemmingsdialoog nodig die die scripts echt tegenhoudt tot de bezoeker akkoord gaat. Voor publiek uit de EU komt de AVG er bovenop.

**Wat kost een overtreding van de revDSG?**
Opzettelijke schendingen van de informatieplicht of het inzagerecht kunnen bestraft worden met boetes tot 250'000 frank. De boete richt zich op de verantwoordelijke natuurlijke persoon binnen het bedrijf. Beboeting volgt meestal pas na een aangifte. Vaker nog is de schade een verlies van vertrouwen bij klanten.

**Mag mijn website buiten Zwitserland gehost worden?**
Ja. Hosting in de EER is geen probleem omdat daar een passend beschermingsniveau erkend is. Bij aanbieders in de Verenigde Staten mag je zonder extra waarborgen alleen doorgeven als ze gecertificeerd zijn onder het Swiss US Data Privacy Framework. De locatie hoort in elk geval in je privacyverklaring.

**Is een privacyverklaring uit een generator genoeg?**
Als startpunt wel, als eindproduct zelden. Een generator kent jouw tools niet. Een verklaring die diensten noemt die je niet gebruikt voldoet niet aan de informatieplicht. Hetzelfde geldt als ze verzwijgt wat er op de achtergrond draait. Het echte werk is het naast elkaar leggen van de tekst en wat er werkelijk op je pagina's laadt.

*Dit artikel is algemene informatie en geen juridisch advies.*

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Geldt de revDSG ook voor mijn kleine website zonder webshop?","acceptedAnswer":{"@type":"Answer","text":"Ja. De wet grijpt zodra er persoonsgegevens verwerkt worden en kent geen ondergrens qua bedrijfsgrootte. Een contactformulier of serverlogs met IP adressen zijn al genoeg. Kleine bedrijven zijn alleen vrijgesteld van het verwerkingsregister zolang ze geen gevoelige gegevens verwerken."}},{"@type":"Question","name":"Heb ik echt een cookiebanner nodig?","acceptedAnswer":{"@type":"Answer","text":"Voor strikt noodzakelijke cookies niet. Zodra je analysetools, advertentiepixels of ingesloten diensten van derden laadt heb je een toestemmingsdialoog nodig die die scripts echt tegenhoudt tot de bezoeker akkoord gaat. Voor publiek uit de EU komt de AVG er bovenop."}},{"@type":"Question","name":"Wat kost een overtreding van de revDSG?","acceptedAnswer":{"@type":"Answer","text":"Opzettelijke schendingen van de informatieplicht of het inzagerecht kunnen bestraft worden met boetes tot 250'000 frank. De boete richt zich op de verantwoordelijke natuurlijke persoon binnen het bedrijf. Beboeting volgt meestal pas na een aangifte. Vaker nog is de schade een verlies van vertrouwen bij klanten."}},{"@type":"Question","name":"Mag mijn website buiten Zwitserland gehost worden?","acceptedAnswer":{"@type":"Answer","text":"Ja. Hosting in de EER is geen probleem omdat daar een passend beschermingsniveau erkend is. Bij aanbieders in de Verenigde Staten mag je zonder extra waarborgen alleen doorgeven als ze gecertificeerd zijn onder het Swiss US Data Privacy Framework. De locatie hoort in elk geval in je privacyverklaring."}},{"@type":"Question","name":"Is een privacyverklaring uit een generator genoeg?","acceptedAnswer":{"@type":"Answer","text":"Als startpunt wel, als eindproduct zelden. Een generator kent jouw tools niet. Een verklaring die diensten noemt die je niet gebruikt voldoet niet aan de informatieplicht. Hetzelfde geldt als ze verzwijgt wat er op de achtergrond draait. Het echte werk is het naast elkaar leggen van de tekst en wat er werkelijk op je pagina's laadt."}}]}
</script>
