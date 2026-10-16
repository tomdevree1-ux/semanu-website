# -*- coding: utf-8 -*-
"""Quickscan build 2026-07-15 - hot lead r667 Wolf Treuhand AG (fresh)."""
import sys
ENGINE = "/sessions/dreamy-wonderful-galileo/mnt/Cold outreach emails/_quickscan_engine"
sys.path.insert(0, ENGINE)
import qs_engine as eng

DEST = "/sessions/dreamy-wonderful-galileo/mnt/Cold outreach emails/Website-analyses/2026-07-15"
DATE = "15. Juli 2026"

site = dict(
    slug="wolf_treuhand",
    file="Website Quickscan - Wolf Treuhand AG (DE).pdf",
    firma="Wolf Treuhand AG",
    meta="wolf-treuhand.ch  ·  Grüningen ZH  ·  Immobilienverwaltung und Vermietung",
    date_str=DATE,
    scores=[4, 6, 4, 5, 5, 4, 5, 5],
    exec=("wolf-treuhand.ch stellt ein eingespieltes lokales Team vor das Liegenschaften rund um Grüningen "
          "verwaltet, vermietet und bewertet, samt einer eigenen ImmoApp für Eigentümer und Mieter. Inhaltlich "
          "ist die Grundlage vorhanden. Drei Dinge fielen jedoch auf. Erstens steht auf der Startseite ein "
          "sichtbarer Vorlagen Resttext (Folge einem manuell hinzugefügten Link), der aussieht als sei das Theme "
          "nie fertig eingerichtet worden. Zweitens führt der Social Verweis auf ein totes X Profil und im Text "
          "steht der Tippfehler üben statt über. Drittens fehlt ein Vorschaubild (og:image) für geteilte Links und "
          "die Adressen der Unterseiten sind mit Schlagwörtern überladen. Alle Bewertungen sind indikativ und "
          "beruhen auf den sichtbaren Elementen der Website."),
    scorecard="Ein glaubwürdiger lokaler Verwalter mit eigener App, dessen Auftritt durch sichtbare Vorlagenreste und Flüchtigkeitsfehler unter Wert verkauft wird.",
    algemene=("Der Auftritt vermittelt ein bodenständiges, persönlich geführtes Treuhand und Verwaltungsbüro mit "
              "klarem regionalem Fokus auf das Zürcher Oberland. Die Leistungen (Bewirtschaftung, Vermietung, "
              "Bewertung und die eigene ImmoApp) sind benannt und die Positionierung als naher Ansprechpartner "
              "ist glaubwürdig. Der erste Blick wird jedoch von handwerklichen Kleinigkeiten getrübt: ein "
              "stehengebliebener Vorlagentext, ein toter Social Link und ein Tippfehler mitten im Fliesstext. "
              "Für ein Unternehmen das Sorgfalt mit fremdem Eigentum verkauft wirkt genau dieser Eindruck "
              "geschäftsrelevant."),
    goed=[
        "Klar benanntes, vollständiges Leistungsspektrum: Bewirtschaftung, Vermietung und Bewertung aus einer Hand.",
        "Eine eigene ImmoApp für Eigentümer und Mieter ist ein echtes Unterscheidungsmerkmal in der Region.",
        "Persönliche, lokale Positionierung im Zürcher Oberland mit direkter Telefonnummer und Ansprechpersonen.",
        "Die Website ist mehrseitig aufgebaut und deckt die wichtigsten Themen inhaltlich ab.",
        "Ein aktives, benanntes Team schafft Nähe und Vertrauen.",
    ],
    layers=[
        ("Erster Eindruck", 4,
         "Auf der Startseite steht ein sichtbarer Vorlagen Resttext (Folge einem manuell hinzugefügten Link), der wie ein unfertiges Theme wirkt.",
         "Solche Reste senken sofort die wahrgenommene Sorgfalt und damit das Vertrauen in einen Verwalter.",
         "Den Resttext entfernen und die Startseite mit einem klaren Nutzenversprechen und einem echten Bild eröffnen."),
        ("Positionierung", 6,
         "Der regionale Fokus und die eigene ImmoApp sind erkennbar, werden aber nicht als klarer Vorteil in den Vordergrund gestellt.",
         "Ein scharfes Versprechen unterscheidet das Büro von grösseren, anonymen Verwaltungen.",
         "Ein Leitsatz zuoberst der die Nähe und die App als konkreten Vorteil benennt."),
        ("Konversion", 4,
         "Es fehlt ein geführter Weg vom Angebot zur Anfrage: kein deutlicher Knopf, kein Formular im Fokus, keine Terminmöglichkeit.",
         "Interessenten müssen selbst nach dem Kontakt suchen, wodurch Anfragen verloren gehen.",
         "Einen sichtbaren Anfrage Knopf auf jeder Seite und ein kurzes Kontaktformular einbauen."),
        ("UX und Struktur", 5,
         "Die Seite ist mehrseitig, die überladenen Adressen der Unterseiten und der tote Social Link stören jedoch die saubere Führung.",
         "Eine klare Struktur hält Besucher länger und führt sie zielgerichtet zum Kontakt.",
         "Die Menüführung verschlanken, tote Links entfernen und die Adressen der Unterseiten aufräumen."),
        ("Visuelles Design", 5,
         "Das Design ist funktional, wirkt durch den Vorlagenrest und uneinheitliche Bilder aber unfertig.",
         "Ein gepflegtes, konsistentes Bild verstärkt die Kompetenz die das Team tatsächlich hat.",
         "Eine einheitliche Bildwelt mit eigenen Fotos von Team und Region etablieren."),
        ("SEO und Inhalt", 4,
         "Die Adressen der Unterseiten sind mit Schlagwörtern überladen und ein Vorschaubild (og:image) fehlt.",
         "Überladene Adressen und fehlende Vorschaubilder schwächen sowohl die Suche als auch geteilte Links.",
         "Kurze, sprechende Adressen setzen, je Seite einen klaren Titel und ein og:image hinterlegen."),
        ("Performance", None,
         "Die Ladezeit wurde nicht gemessen; WordPress mit vielen Zusatzmodulen neigt jedoch zu langsameren Seiten.",
         "Schnelle Seiten halten mobile Besucher und verbessern die Auffindbarkeit.",
         "Bilder komprimieren und nicht benötigte Module entfernen, danach die Ladezeit prüfen."),
        ("Vertrauen und Beweis", 5,
         "Team, Adresse und Telefon schaffen eine solide Basis, es fehlen aber sichtbare Kundenstimmen und der Tippfehler üben statt über stört.",
         "Gerade bei fremdem Eigentum entscheidet der Eindruck von Sorgfalt über die Anfrage.",
         "Den Tippfehler korrigieren und zwei bis drei echte Referenzen von Eigentümern ergänzen."),
        ("Mobile Erfahrung", 5,
         "Die Seite ist grundsätzlich mobil nutzbar, die überfüllten Blöcke und der Vorlagenrest fallen auf dem kleinen Schirm aber stärker auf.",
         "Ein grosser Teil der Suche nach lokaler Verwaltung passiert auf dem Handy.",
         "Die mobile Ansicht entrümpeln und die wichtigsten Kontaktwege oben anbieten."),
    ],
    imps=[
        ("Vorlagen Resttext auf der Startseite entfernen",
         "Der Text Folge einem manuell hinzugefügten Link ist ein sichtbarer Themerest.",
         "Er lässt den ganzen Auftritt unfertig wirken und untergräbt sofort das Vertrauen.",
         "Den Block löschen und durch ein klares Nutzenversprechen ersetzen.",
         "Hoch", "Gering"),
        ("Tippfehler und toten Social Link korrigieren",
         "Im Text steht üben statt über und der X Verweis führt ins Leere.",
         "Kleine Fehler an sichtbarer Stelle erzählen das Gegenteil von Sorgfalt.",
         "Text korrigieren und tote Links entfernen oder auf ein aktives Profil setzen.",
         "Hoch", "Gering"),
        ("Vorschaubild (og:image) hinterlegen",
         "Geteilte Links zeigen aktuell kein Sfeerbild.",
         "Ohne Vorschaubild wirken geteilte Links unprofessionell und werden seltener geklickt.",
         "Ein Bild in 1200 bei 630 als og:image hinterlegen.",
         "Middel", "Gering"),
        ("Sichtbaren Anfrage Knopf und Formular einbauen",
         "Ein geführter Weg zur Anfrage fehlt.",
         "Ohne klaren Handlungsaufruf gehen Anfragen verloren.",
         "Auf jeder Seite einen Anfrage Knopf und ein kurzes Formular platzieren.",
         "Hoch", "Middel"),
        ("Adressen der Unterseiten aufräumen",
         "Die Adressen sind mit Schlagwörtern überladen.",
         "Überladene Adressen wirken unsauber und helfen der Suche nicht.",
         "Kurze, sprechende Adressen je Seite setzen.",
         "Middel", "Middel"),
        ("Die ImmoApp als Vorteil sichtbar machen",
         "Die eigene App wird kaum als Argument in Szene gesetzt.",
         "Sie ist ein echtes Unterscheidungsmerkmal gegenüber grösseren Verwaltungen.",
         "Einen eigenen Abschnitt mit dem konkreten Nutzen der App für Eigentümer und Mieter.",
         "Middel", "Middel"),
        ("Echte Kundenstimmen ergänzen",
         "Sichtbare Referenzen von Eigentümern fehlen.",
         "Unabhängige Stimmen sind bei fremdem Eigentum das stärkste Vertrauenssignal.",
         "Zwei bis drei kurze, namentliche Referenzen einholen und einbinden.",
         "Hoch", "Middel"),
        ("Eigene Bildwelt aufbauen",
         "Die Bilder wirken uneinheitlich und teils generisch.",
         "Eigene Fotos von Team und Region verstärken die lokale Nähe.",
         "Einen kurzen Fototermin für Team und typische Objekte einplanen.",
         "Middel", "Hoch"),
    ],
    impact_text=("Die grössten Hebel liegen links oben: der Vorlagenrest, der Tippfehler und der tote Link sind in "
                 "Minuten behoben und heben den Eindruck sofort. Ein sichtbarer Anfrage Weg und echte Kundenstimmen "
                 "brauchen etwas mehr Arbeit, zahlen aber direkt auf mehr Anfragen ein. Die eigene Bildwelt ist ein "
                 "Projekt für später."),
    conversie=("Die Website hat mit Telefon und benannten Ansprechpersonen eine gute Basis, spielt sie aber nicht "
               "aus: kein deutlicher Knopf, kein Formular im Fokus und keine Terminmöglichkeit. Mit einem geführten "
               "Weg vom Nutzenversprechen zur Anfrage dürfte aus den Besuchern deutlich mehr werden. Diese "
               "Einschätzung stützt sich auf den sichtbaren Aufbau der Seite, nicht auf Messdaten."),
    seo=[
        "Kurze, sprechende Adressen je Seite statt mit Schlagwörtern überladener Adressen.",
        "Je Leistung einen klaren Titel mit Ort setzen (Verwaltung, Vermietung und Bewertung im Zürcher Oberland).",
        "Ein og:image hinterlegen und die Vorschau geteilter Links prüfen.",
        "Ein Google Unternehmensprofil pflegen und mit der Website verknüpfen.",
        "Eine kurze Seite zur ImmoApp aufbauen, die typische Fragen von Eigentümern beantwortet.",
    ],
    vertrouwen=("Ein benanntes Team, eine klare Adresse und eine direkte Telefonnummer bilden eine solide "
                "Vertrauensbasis. Was fehlt sind sichtbare Kundenstimmen und ein gepflegter erster Eindruck: der "
                "Vorlagenrest und der Tippfehler erzählen genau das Gegenteil von der Sorgfalt die dieses Büro "
                "täglich mit fremdem Eigentum beweist. Kleine Eingriffe mit grosser Wirkung auf die Glaubwürdigkeit."),
    roadmap=[
        "<b>Quick Wins (diese Woche):</b> Vorlagenrest entfernen, Tippfehler üben korrigieren, toten X Link entfernen, og:image hinterlegen und einen sichtbaren Anfrage Knopf platzieren.",
        "<b>Mittelfristig (diesen Monat):</b> Startseite mit klarem Nutzen und einem eigenen Abschnitt zur ImmoApp ausbauen, ein Kontaktformular einbinden, die Adressen der Unterseiten aufräumen und erste Kundenstimmen einholen.",
        "<b>Wachstum (dieses Quartal):</b> Eine eigene Bildwelt mit Team und Region aufbauen, die Leistungsseiten mit echten Kundenfragen vertiefen und den Auftritt in laufende Pflege mit Erfolgskontrolle überführen.",
    ],
    conclusie=[
        "Die Wolf Treuhand AG hat was zählt: ein eingespieltes lokales Team, eine eigene ImmoApp und ein klar "
        "benanntes Angebot. Die Website verkauft das noch nicht: ein stehengebliebener Vorlagentext, ein toter "
        "Social Link und ein Tippfehler mitten auf der Seite.",
        "Fast alle Korrekturen sind schnelle Pflegearbeit im Baukasten. Mit einem sauberen ersten Eindruck, einem "
        "sichtbaren Anfrage Weg und echten Kundenstimmen wird aus dem Schaufenster ein Auftritt der aktiv Mandate "
        "anzieht.",
        "Genau hier unterstützt amai! Sie gerne: ein gepflegter, verkaufsstarker Auftritt zum festen Monatspreis, "
        "inklusive laufender Betreuung. In einem kurzen Gespräch zeigen wir Ihnen wie schnell sich das umsetzen "
        "lässt.",
    ],
)

if __name__ == "__main__":
    print(eng.build(site, DEST, tmp_dir=DEST))
