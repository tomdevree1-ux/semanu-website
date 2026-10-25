---
title: "Mit KI gebaute Software: die fünf Risiken"
description: "Mit KI gebaute Software läuft in der Demo und scheitert am Unsichtbaren: Validierung, offene APIs, Datenlecks und DSGVO. Die fünf Risiken erklärt."
date: "2026-08-24"
updated: "2026-10-23"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/software-built-with-ai-cover.jpg"
---

Ein Angebotsformular, ein Kundenportal, ein Planungstool: Mit KI-Codetools steht so etwas in Tagen statt Monaten. Das ist echter Fortschritt. Wir raten niemandem zur Umkehr. Doch wir schauen beruflich unter die Haube solcher Anwendungen und dabei entsteht immer dasselbe Bild. Die Software tut, was die Demo verspricht. Die Probleme stecken in allem, was die Demo nicht zeigt.

**Kurz gesagt:** Mit KI gebaute Software läuft in der Demo meist tadellos und scheitert an dem, was man nicht sieht: fehlende Eingabevalidierung, offene APIs für jeden, der die Adresse kennt, lecke personenbezogene Daten, nirgends abgedeckte DSGVO-Pflichten und Geschäftslogik im Browser statt auf dem Server. [Forscher der NYU stellten 2021 fest](https://arxiv.org/abs/2108.09293), dass rund vierzig Prozent des Codes, den ein KI-Assistent in ihren Testszenarien schrieb, Schwachstellen enthielt. Jede dieser Lücken lässt sich feststellen und schließen, am besten vor dem Go-live.

## Jeder baut jetzt selbst und das ist keine schlechte Sache

Die Hürde, Software zu bauen, ist in zwei Jahren eingestürzt. Was früher ein Entwicklungsteam und ein halbes Jahr brauchte, erledigt ein geschickter Mitarbeiter heute in wenigen Wochen. Für ein KMU ist das eine Chance: Sie kennen Ihren Betrieb besser als jeder externe Entwickler und können endlich Tools bauen, die exakt zu Ihrem Prozess passen.

Das Problem ist nicht das Bauen. Die Tools optimieren auf funktionierenden Code, nicht auf sicheren Code. Wer baut, hat meist nicht den Hintergrund, um den Unterschied zu sehen. Die App läuft, alle sind zufrieden und niemand stellt die Frage, die ein professioneller Entwickler zuerst stellt: Was passiert, wenn jemand das falsch benutzt?

## Die fünf Lücken, die immer wiederkehren

Das sind die fünf Muster, die wir in Reviews selbst gebauter Anwendungen am häufigsten antreffen. Jedes ist in einer Demo unsichtbar. Jedes ist nach dem Go-live schmerzhaft.

### 1. Eingaben werden nicht geprüft

Ein Formular erwartet einen Namen und eine E-Mail-Adresse. Was passiert, wenn jemand ein Stück Code einfügt, eine Datei von 2 Gigabyte oder einen Text mit zehntausend Zeichen? Ohne Eingabevalidierung landet das alles ungefiltert in Ihrer Datenbank oder in den Mails an Ihr Team. Das beginnt mit Müll in Ihren Daten. Es endet mit einem Angreifer, der über ein Eingabefeld Ihre Datenbank liest.

### 2. Die API steht jedem offen, der die Adresse kennt

Hinter jeder App sitzt eine Schicht, die Daten holt und schreibt. KI-Tools bauen diese Schicht oft, ohne zu prüfen, wer anklopft. Wer die Adresse kennt oder einfach errät, kann dann direkt Bestellungen, Kundendaten oder Preise abfragen, ohne sich je anzumelden. Die Adresse steht zudem lesbar im Code, den jeder Browser erhält.

### 3. Personenbezogene Daten lecken durch die Seitentür

Fehlermeldungen, die den ganzen Kundendatensatz zeigen, Exportknöpfe ohne Rechteprüfung, Logdateien voller E-Mail-Adressen: Selbst gebaute Apps lecken Daten selten durch die Vordertür und fast immer durch eine vergessene Seitentür. Ein Leck genügt für eine Meldung bei der Datenschutzbehörde und ein unangenehmes Gespräch mit jedem betroffenen Kunden.

### 4. Die DSGVO ist nirgends abgedeckt

Wer verarbeitet die Daten, wo liegen sie, wie lange werden sie aufbewahrt und auf welcher Rechtsgrundlage? Ein KI-Tool stellt diese Fragen nicht und wer baut, meist auch nicht. So läuft plötzlich eine App, die Kundendaten an einen Dienst außerhalb der EU schickt. Ohne Auftragsverarbeitungsvertrag, ohne Erwähnung in der Datenschutzerklärung und ohne dass es jemand merkt.

### 5. Die Geschäftslogik läuft im Browser

Der Klassiker aus Konfiguratoren und Angebotstools: Die Preisberechnung steckt im Code, der an den Besucher geschickt wird. Jeder mit einem Browser kann diesen Code lesen und ändern. Im besten Fall liest ein Wettbewerber Ihre Rabattstruktur ab. Im schlimmsten Fall bestellt jemand zu einem selbst eingetragenen Preis. Dann haben Sie ein juristisches Problem, denn die Bestellung ist bestätigt.

## Warum die Demo Ihnen nichts sagt

Eine Demo zeigt den erwarteten Pfad: korrekte Eingaben, ein wohlwollender Nutzer und kein einziger Angreifer. Genau die drei Annahmen, die nach dem Go-live fallen. Echte Nutzer tun Unerwartetes, Bots scannen jede öffentliche URL binnen Tagen und Formulare bekommen binnen einer Woche ihren ersten automatisierten Müll. Die Frage ist nicht, ob etwas schiefgeht. Die Frage ist, ob es auffällt, wenn es schiefgeht. Bei selbst gebauten Apps ist das selten geregelt: Logging und Alarme fehlen fast immer.

## Was Sie heute selbst prüfen können

Vier Prüfungen, die keinen technischen Hintergrund verlangen. Fallen Sie bei einer durch, wissen Sie, dass mehr im Argen liegt.

1. **Geben Sie in jedes Feld einmal etwas Falsches ein.** Text, wo eine Zahl hingehört, ein leeres Pflichtfeld, ein absurd langer Name. Bekommen Sie saubere Fehlermeldungen oder verhält sich die App seltsam?
2. **Öffnen Sie die App im Inkognitofenster.** Fügen Sie die Adresse einer Seite ein, die hinter dem Login liegen sollte. Sehen Sie trotzdem Daten, steht die Tür offen.
3. **Fragen Sie nach den Auftragsverarbeitungsverträgen.** Wer hat einen mit jedem externen Dienst, den die App nutzt? Schweigen ist auch eine Antwort.
4. **Fragen Sie, wo die Preisberechnung läuft.** Lautet die Antwort "in der App selbst", fragen Sie nach: auf dem Server oder im Browser?

## Lassen Sie es prüfen, bevor Sie live gehen

Selbst bauen und professionell prüfen schließen einander nicht aus. Sie gehören zusammen. Eine gute Prüfung umfasst sechs Bereiche: Sicherheit, personenbezogene Daten und DSGVO, funktionales Verhalten mit Testszenarien, Architektur und Logik, Leistung und mobile Nutzung sowie Kontinuität. Das Ergebnis ist ein Bericht, der pro Befund markiert, was kritisch ist und was warten kann. Ihr Team baut danach einfach weiter, jetzt mit geschlossenen Lücken.

Berührt die App Kunden, Geld oder personenbezogene Daten und soll sie auf einem soliden Fundament stehen? Dann können Sie auch [maßgeschneiderte Unternehmenssoftware](/de/services/business-software) bauen lassen, in der Validierung, Rechte und DSGVO ab der ersten Codezeile stecken.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">Selbst gebaut und fast bereit für den Go-live?</strong>
  <p style="margin:0 0 1rem;color:#5B667C"><span class="brand-mark">semanu</span> entwickelt maßgeschneiderte Unternehmenssoftware mit KI als Motor. Validierung, Rechteprüfung und DSGVO sind von Anfang an eingebaut. Erzählen Sie uns, was Sie gebaut haben oder bauen möchten. Gemeinsam klären wir den nächsten Schritt.</p>
  <a href="/de/contact"><strong>Kontakt aufnehmen →</strong></a>
</div>

## Häufige Fragen

**Ist mit KI gebaute Software unsicher?**
Nicht per Definition. Die Wahrscheinlichkeit von Lücken ist jedoch höher. Forscher der NYU fanden 2021, dass rund vierzig Prozent des Codes, den ein KI-Assistent schrieb, Schwachstellen enthielt. Die Tools optimieren auf funktionierenden Code, nicht auf sicheren Code.

**Soll ich dann nicht mehr mit KI bauen?**
Doch. Für viele interne Tools ist es der schnellste Weg. Eine App, die Kunden, Geld oder personenbezogene Daten berührt, sollten Sie jedoch vor dem Go-live prüfen lassen. Genau wie man eine selbst renovierte Küche abnehmen lässt, bevor das Gas angeschlossen wird.

**Was prüft ein Software-Review genau?**
Sechs Bereiche: Sicherheit, personenbezogene Daten und DSGVO, funktionales Verhalten mit Testszenarien, Architektur und Logik, Leistung und mobile Nutzung sowie Kontinuität. Das Ergebnis ist ein Bericht mit einer dreistufigen Prioritätenliste.

**Wo sollte die Preisberechnung laufen?**
Auf dem Server. Der Browser zeigt den Preis an. Der Server rechnet ihn erneut aus und bestätigt ihn. So kann niemand zu einem Preis bestellen, den er selbst verändert hat.

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Ist mit KI gebaute Software unsicher?","acceptedAnswer":{"@type":"Answer","text":"Nicht per Definition. Die Wahrscheinlichkeit von Lücken ist jedoch höher. Forscher der NYU fanden 2021, dass rund vierzig Prozent des Codes, den ein KI-Assistent schrieb, Schwachstellen enthielt. Die Tools optimieren auf funktionierenden Code, nicht auf sicheren Code."}},{"@type":"Question","name":"Soll ich dann nicht mehr mit KI bauen?","acceptedAnswer":{"@type":"Answer","text":"Doch. Für viele interne Tools ist es der schnellste Weg. Eine App, die Kunden, Geld oder personenbezogene Daten berührt, sollten Sie jedoch vor dem Go-live prüfen lassen. Genau wie man eine selbst renovierte Küche abnehmen lässt, bevor das Gas angeschlossen wird."}},{"@type":"Question","name":"Was prüft ein Software-Review genau?","acceptedAnswer":{"@type":"Answer","text":"Sechs Bereiche: Sicherheit, personenbezogene Daten und DSGVO, funktionales Verhalten mit Testszenarien, Architektur und Logik, Leistung und mobile Nutzung sowie Kontinuität. Das Ergebnis ist ein Bericht mit einer dreistufigen Prioritätenliste."}},{"@type":"Question","name":"Wo sollte die Preisberechnung laufen?","acceptedAnswer":{"@type":"Answer","text":"Auf dem Server. Der Browser zeigt den Preis an. Der Server rechnet ihn erneut aus und bestätigt ihn. So kann niemand zu einem Preis bestellen, den er selbst verändert hat."}}]}
</script>
