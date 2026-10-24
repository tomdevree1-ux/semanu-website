---
title: "Was kostet ein 3D-Konfigurator? Technik erklärt"
description: "Was kostet ein 3D-Produktkonfigurator und wie funktioniert die Technik? Die Kette (WebGL, CPQ, ERP), SaaS oder Individualbau und die Reife Ihres Produkts."
date: "2026-07-30"
updated: "2026-10-23"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/3d-configurator-cost-cover.jpg"
---

Wer sich mit einem 3D-Konfigurator beschäftigt, hat meist schon ein Bild vor Augen. Der Kunde stellt auf Ihrer Website selbst seine Überdachung, sein Gartenhaus, sein Sofa oder seine Maschine zusammen. Er sieht 3D-Ansicht und Preis live und bestellt ohne tagelanges Hin und Her um Angebote. Dieser Leitfaden erklärt den Weg dorthin: was ein 3D-Konfigurator genau ist, ob Ihr Produkt dafür geeignet ist, was er kostet und ob Sie Software kaufen oder bauen lassen sollten.

**Kurz gesagt:** Mit einem 3D-Konfigurator stellen Nutzer ein Produkt online visuell zusammen. Die Software berechnet dabei sofort den Preis und prüft, ob das Produkt technisch herstellbar ist. Das System verbindet eine visuelle Engine (etwa Three.js/WebGL) mit einer Regelmaschine (CPQ) und gibt die Daten an ERP- oder CAD-Systeme weiter. Unternehmen setzen ihn ein, um schneller anzubieten, Bestellfehler zu senken und online mehr zu verkaufen.

## Auf einen Blick

- **Interessant bei** Produkten mit 5 oder mehr variablen Merkmalen oder aufwendigen Angebotsprozessen.
- **Ertrag:** zur Illustration die typische Größenordnung der Branche. Ein Angebotsprozess von Tagen wird eine Sitzung von Minuten. Fehlbestellungen sinken deutlich, sobald Regeln die Validierung übernehmen.
- **Technik:** Die Qualität der Produkt- und Preislogik (CPQ, ERP-Daten) entscheidet über den Erfolg, nicht nur das 3D-Bild.
- **SaaS oder Individualbau:** SaaS für Standardprodukte aus dem Katalog, Individualbau für einzigartige Produktionsprozesse.

## Warum Hersteller jetzt über 3D-Konfiguratoren nachdenken

Drei Entwicklungen treffen zusammen. Erstens der Fachkräftemangel: Erfahrene Arbeitsvorbereiter und Kalkulatoren sind knapp. Jede Stunde für Standardangebote fehlt beim echten Sonderbau. Zweitens Geschwindigkeit als Kauffaktor: Wer heute eine Überdachung oder ein Maschinenteil nach Maß sucht, erwartet sofort Bild und Preis, kein Angebot in fünf Werktagen. Drittens Fehlerkosten: Jede falsch bestellte oder produzierte Variante kostet Marge und Vertrauen.

Zur Illustration drei Szenarien, wie sie in der Fertigungsindustrie wiederkehren. Ein Poolanbieter verkürzt seinen Angebotsprozess von Tagen auf eine Konfigurationssitzung von wenigen Minuten. Ein Hersteller von Überdachungen und Gartenhäusern sieht Missverständnisse über Maße und Optionen fast verschwinden, weil der Konfigurator nur herstellbare Kombinationen zulässt. Ein Maschinenbauer konvertiert mehr Anfragen, weil Optionen visualisiert statt in PDFs beschrieben werden. Die genauen Zahlen unterscheiden sich je Unternehmen. Das Muster ist stets dasselbe: schneller, weniger Fehler und weniger abhängig von knappen Spezialisten.

## Wie funktioniert ein 3D-Konfigurator? Begriffe und Kette

Die Begriffe vermischen sich in der Praxis. Hier die Abgrenzung. Ein **gewöhnlicher Webshop** verkauft feste Katalogartikel. Ein **Produktkonfigurator** baut den Artikel aus Regeln und Optionen auf. Ein **Angebotsrechner** berechnet einen Preis aus Eingabefeldern. Ein vollwertiges **CPQ-System** (Configure, Price, Quote) bewacht zusätzlich, welche Kombinationen gültig sind. Es erzeugt auch das Angebot. **CAD** ist die technische Zeichenumgebung Ihrer Ingenieure. Die **3D-Visualisierung im Browser** ist ein vereinfachtes Modell davon, gemacht für schnelles Laden auf jedem Gerät.

Die technische Kette eines professionellen Konfigurators sieht so aus:

**Benutzeroberfläche** (was der Nutzer am Bildschirm sieht) → **Regelmaschine** (Produkt- und Preislogik) → **Output** (Angebot, Stückliste, technische Zeichnung)

Der Nutzer bewegt sich in der visuellen Ebene. Die Regelmaschine bewacht derweil, was möglich ist und was es kostet. Nach der Bestellbestätigung fließen die Daten in die Produktion: Stückliste (BOM), Schnittlisten oder technische Zeichnung. Dazu gehören zwei Produktionsstrategien:

- **Configure-to-Order (CTO):** Standardbausteine in endlosen Kombinationen. Der Konfigurator wählt und kombiniert.
- **Engineer-to-Order (ETO):** echter Sonderbau, bei dem je Auftrag einzigartige CAD-Zeichnungen nötig sind. Der Konfigurator wird dann zur Vorderseite Ihres Engineerings.

## Ist Ihr Produkt geeignet? Der Entscheidungsbaum

**Ja, ein Konfigurator wird interessant, wenn:**

- ein Angebot manuell zu erstellen länger als 15 Minuten dauert;
- regelmäßig falsche Varianten bestellt oder produziert werden;
- Ihr Produkt 5 oder mehr variable Merkmale hat (Farbe, Maße, Material, Zubehör).

**Nein oder noch nicht, wenn:**

- nur zwei oder drei feste Varianten existieren;
- jedes Produkt vollständig einzigartige Handarbeit ohne feste Produktregeln ist.

**Hinweis:** Ist eine teilweise Standardisierung möglich, lohnt es sich oft, Ihren Prozess zuerst zu analysieren und zu verschlanken, bevor Sie automatisieren.

## Der Configurator Readiness Score

Sie möchten es objektiver? Bewerten Sie Ihr Unternehmen auf fünf Feldern mit je 1 bis 5 Punkten:

1. **Produktvariation:** Wie komplex ist das Sortiment?
2. **Klarheit der Produktregeln:** Sind sie dokumentiert oder stecken sie nur in Köpfen und Excel?
3. **Visualisierungsbedarf:** Fällt es Ihren Kunden schwer, sich das Ergebnis vorzustellen?
4. **Integrationsreife:** Gibt es ein zentrales ERP oder CRM mit verlässlichen Daten?
5. **Angebotsvolumen:** Erstellen Sie mehr als zwanzig Angebote pro Woche?

- **Score 5 bis 10:** noch nicht bereit. Erst Daten und Prozesse ordnen.
- **Score 11 bis 18:** Orientierungsphase. SaaS oder einen Basiskonfigurator erwägen.
- **Score 19 bis 25:** starker Business Case für einen 3D-Konfigurator, gegebenenfalls als Individualbau.

## Funktionen: Basis versus professionell

| Funktion | Basiskonfigurator | Professioneller 3D-Konfigurator |
|---|---|---|
| 3D-Visualisierung | Standard WebGL mit 360-Grad-Rotation | Licht und Schatten in Echtzeit, AR-Ansicht vor Ort |
| Preisberechnung | Statische Matrix oder Basisregeln | Dynamische Preislogik, optional an aktuelle Rohstoffpreise gekoppelt |
| Integrationen | Keine oder ein Plugin für den Onlineshop | Kopplung in beide Richtungen mit dem ERP (SAP, Dynamics 365, Exact, Odoo) |
| Output | PDF-Angebot für den Kunden | Automatische Stückliste (BOM), Schnittlisten und CAD-Dateien (STEP/DXF) |
| Geschäftsregeln | Beschränkt auf einfache Auswahl | Komplexe Abhängigkeiten: Ändert sich X, entfällt Y |

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#F4F6FA;border:1px solid #E9EEF6">
  <strong style="display:block;font-size:1.05rem;color:#16233D;margin-bottom:0.6rem">Aus der Praxis</strong>
  <p style="margin:0 0 0.75rem">Bei einem Hersteller von Außengebäuden haben wir uns zusammengesetzt, um die Produktregeln zu Papier zu bringen: welche Kombinationen möglich sind, welche nicht und warum nicht. Das fiel schwerer als alle erwartet hatten. Das Wissen fehlte nicht. Es steckte in Köpfen und nicht auf Papier. Was der eine Kollege für selbstverständlich hielt, machte der andere leicht anders.</p>
  <p style="margin:0 0 0.75rem">Das Projekt lief bereits. Jede Regel, die noch ausgetüftelt werden musste, hielt den Bau auf.</p>
  <p style="margin:0 0 0.75rem">Genau darin liegt der zusätzliche Nutzen einer sauberen Analyse vorab. Ein Konfigurator zwingt Sie, Ihre eigenen Produktregeln auszuschreiben, bis hin zu den Ausnahmen, die nie jemand festgehalten hat. Diese Übung hätte auch ohne Konfigurator ihren Wert gehabt.</p>
  <p style="margin:0;font-size:0.875rem">Aus Respekt vor dem Kunden nennen wir keine Namen.</p>
</div>

## Garbage in, garbage out: Datenqualität entscheidet

Nicht das 3D-Rendering, sondern die Qualität Ihrer Produktdaten und Geschäftsregeln bestimmt den Löwenanteil des Erfolgs. Eine schöne 3D-Ansicht eines Produkts, das sich nicht herstellen lässt, erzeugt enttäuschte Kunden und manuelle Nacharbeit. Deshalb beginnt jedes seriöse Konfiguratorprojekt damit, Produktregeln, Preisaufbau und Ausnahmen explizit zu machen. Das ist Analysearbeit, keine Renderarbeit.

## SaaS-Software kaufen oder individuell bauen lassen?

| Kriterium | SaaS-Plattform (z. B. Threekit, Expivi) | Individualbau (eigene Anwendung) |
|---|---|---|
| Time to Market | Schnell: Wochen | Länger: Monate |
| Kosten | Monatlich wiederkehrende Lizenz | Einmaliger Bau plus Wartung |
| Flexibilität | Sie passen Ihren Prozess der Software an | Die Software folgt exakt Ihrem Ablauf |
| Quellcode und Nutzungsrecht | Kein Zugang zum Quellcode | Vollständiger Quellcode und unbefristetes Nutzungsrecht; Ihre Produktregeln und Daten bleiben Ihr Eigentum |

Die Faustregel: Für Katalogprodukte mit Optionen kommen Sie mit SaaS weit. Ist Ihre Produktlogik selbst Ihr Wettbewerbsvorteil? Muss der Konfigurator tief in ERP und Produktion greifen? Dann gewinnt der Individualbau auf Dauer fast immer.

## Was kostet ein 3D-Konfigurator?

Das sind indikative Bandbreiten, wie sie im Markt vorkommen, keine Preisliste. Der genaue Preis hängt von Produktkomplexität, Integrationen und Anforderungen an die Visualisierung ab.

- **Basis- oder Einstiegskonfigurator (10.000 bis 25.000 Euro):** visuelle Darstellung mit Basispreisberechnung und Output per E-Mail oder PDF.
- **Mittlerer Produktkonfigurator (25.000 bis 60.000 Euro):** Three.js-Visualisierung, ERP-Kopplung (etwa Exact oder Business Central) und erweiterbare Regellogik.
- **Komplexe CPQ/3D-Lösung für Großunternehmen (60.000 bis 150.000 Euro und mehr):** voll integriert mit CAD-Generierung, SAP oder Dynamics, ETO-Prozessen und Mehrsprachigkeit.

Vergleichen Sie nie allein den Baupreis. Die Kosten eines falsch spezifizierten Projekts (Neubau, Nachträge, ein Konfigurator, den niemand nutzt) übersteigen fast immer die Differenz zwischen zwei Angeboten.

## Vom Projekt zur Lieferung: fünf Schritte

1. **Analyse und Readiness Check:** Ist das Produkt konfigurierbar und trägt der Business Case?
2. **Datenstruktur und Produktregeln festlegen:** das Spezifikationsdokument mit Abnahmekriterien.
3. **Architektur und Wahl des Umsetzungspartners:** Angebote vergleichen Sie auf Basis desselben Dokuments.
4. **Bau:** iterativ in Sprints mit Demos und Abnahmetests gegen die Spezifikation.
5. **Kopplung, Nachsorge und Optimierung:** live gehen, messen und Regeln selbst weiterpflegen.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">Unsicher, ob Ihr Produkt konfigurierbar ist?</strong>
  <p style="margin:0 0 1rem;color:#5B667C"><span class="brand-mark">semanu</span> baut 3D-Konfiguratoren nach Maß. Wir beginnen bei Ihren Produktregeln und verbinden den Konfigurator mit Ihrem Angebots- und Bestellprozess.</p>
  <a href="/de/services/3d-configurators"><strong>Mehr über 3D-Konfiguratoren →</strong></a>
</div>

## Wann ist ein 3D-Konfigurator keine gute Idee?

- Wenn Ihre Produktdaten ein Chaos sind: erst aufräumen, dann automatisieren.
- Bei kleinem Sortiment ohne Maßoptionen: Eine gute Produktseite genügt.
- Wenn der Verkauf ausschließlich über persönliche Beziehungen läuft und die Zielgruppe digital nicht aktiv ist.

## Häufige Fragen

**Ist ein 3D-Konfigurator dasselbe wie ein CPQ-System?**
Nein. CPQ (Configure, Price, Quote) ist die Regelmaschine, die bewacht, welche Kombinationen gültig sind und was sie kosten. Der 3D-Konfigurator ist die visuelle Ebene darüber. Eine gute Lösung kombiniert beides. 3D ohne CPQ ist eine Demo, kein Verkaufswerkzeug.

**Wann Three.js/WebGL und wann Rendering auf dem Server?**
Three.js/WebGL rendert im Browser und ist der Standard für interaktive Produktkonfiguration: schnell, ohne Installation und mobil nutzbar. Rendering auf dem Server lohnt sich bei fotorealistischen Bildern extrem schwerer Modelle. Es bringt allerdings Latenz und Serverkosten. Für die meisten Hersteller ist WebGL die richtige Wahl.

**Brauche ich CAD-Dateien für einen 3D-Konfigurator?**
Nicht zwingend. Vorhandene CAD-Modelle beschleunigen die Arbeit. Sie sind jedoch zu schwer für den Browser und werden stets zu Webmodellen vereinfacht. Ohne CAD-Dateien baut ein 3D-Artist die Modelle nach Zeichnungen oder Fotos.

**Funktioniert ein 3D-Konfigurator ohne angebundenes ERP?**
Ja, gerade in einer ersten Phase. Der Konfigurator liefert Angebote und Bestellungen dann per E-Mail oder PDF. Der größte Gewinn kommt allerdings aus der Kopplung, weil Aufträge, Stücklisten und Preise dann ohne Abtippen durchfließen.

**Wie schlägt sich ein 3D-Konfigurator auf dem Smartphone?**
WebGL läuft auf modernen Smartphones. Schwere Modelle brauchen jedoch Optimierung: weniger Polygone, komprimierte Texturen und eine Oberfläche für kleine Bildschirme. Machen Sie mobile Performance von Tag eins an zur Anforderung, nicht zur Nachbesserung.

**Kann ich Produktregeln und Preise nach der Lieferung selbst pflegen?**
So gehört es sich. Verlangen Sie eine Verwaltungsumgebung, in der Ihr Team Optionen, Preise und Regeln ohne Entwickler anpasst. Wer für jede Preisänderung zum Umsetzer zurück muss, hat eine Abhängigkeit gebaut statt eines Verkaufswerkzeugs.

Weiterführend: Gartner, Market Guide for CPQ Application Suites · McKinsey & Company, Publikationen zur Digitalisierung der Fertigung · technische Dokumentation von [Three.js](https://threejs.org/docs/) und der großen CAD-Plattformen (Autodesk, PTC, Siemens).

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Ist ein 3D-Konfigurator dasselbe wie ein CPQ-System?","acceptedAnswer":{"@type":"Answer","text":"Nein. CPQ (Configure, Price, Quote) ist die Regelmaschine, die bewacht, welche Kombinationen gültig sind und was sie kosten. Der 3D-Konfigurator ist die visuelle Ebene darüber. Eine gute Lösung kombiniert beides. 3D ohne CPQ ist eine Demo, kein Verkaufswerkzeug."}},{"@type":"Question","name":"Wann Three.js/WebGL und wann Rendering auf dem Server?","acceptedAnswer":{"@type":"Answer","text":"Three.js/WebGL rendert im Browser und ist der Standard für interaktive Produktkonfiguration: schnell, ohne Installation und mobil nutzbar. Rendering auf dem Server lohnt sich bei fotorealistischen Bildern extrem schwerer Modelle. Es bringt allerdings Latenz und Serverkosten. Für die meisten Hersteller ist WebGL die richtige Wahl."}},{"@type":"Question","name":"Brauche ich CAD-Dateien für einen 3D-Konfigurator?","acceptedAnswer":{"@type":"Answer","text":"Nicht zwingend. Vorhandene CAD-Modelle beschleunigen die Arbeit. Sie sind jedoch zu schwer für den Browser und werden stets zu Webmodellen vereinfacht. Ohne CAD-Dateien baut ein 3D-Artist die Modelle nach Zeichnungen oder Fotos."}},{"@type":"Question","name":"Funktioniert ein 3D-Konfigurator ohne angebundenes ERP?","acceptedAnswer":{"@type":"Answer","text":"Ja, gerade in einer ersten Phase. Der Konfigurator liefert Angebote und Bestellungen dann per E-Mail oder PDF. Der größte Gewinn kommt allerdings aus der Kopplung, weil Aufträge, Stücklisten und Preise dann ohne Abtippen durchfließen."}},{"@type":"Question","name":"Wie schlägt sich ein 3D-Konfigurator auf dem Smartphone?","acceptedAnswer":{"@type":"Answer","text":"WebGL läuft auf modernen Smartphones. Schwere Modelle brauchen jedoch Optimierung: weniger Polygone, komprimierte Texturen und eine Oberfläche für kleine Bildschirme. Machen Sie mobile Performance von Tag eins an zur Anforderung, nicht zur Nachbesserung."}},{"@type":"Question","name":"Kann ich Produktregeln und Preise nach der Lieferung selbst pflegen?","acceptedAnswer":{"@type":"Answer","text":"So gehört es sich. Verlangen Sie eine Verwaltungsumgebung, in der Ihr Team Optionen, Preise und Regeln ohne Entwickler anpasst. Wer für jede Preisänderung zum Umsetzer zurück muss, hat eine Abhängigkeit gebaut statt eines Verkaufswerkzeugs."}}]}
</script>
