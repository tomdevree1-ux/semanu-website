// Rich "plain language" info blocks for the configurator: a short heading plus a
// longer explanation shown under a "more info" toggle. Kept apart from
// pricingConfig / pricingCopy because it is long marketing prose. German (primary
// Swiss market) and Dutch (owner's source) are authored fully; fr/en/es fall back
// to German until translated. House style: no hyphenated compounds, Swiss ss.
// Bodies may hold blank lines; render with whitespace-pre-line.

export type InfoBlock = { title: string; body: string };

export type PricingInfo = {
  situation: { new: InfoBlock; existing: InfoBlock };
  pages: { new: InfoBlock; existing: InfoBlock; threshold: InfoBlock };
  /** Keyed by ConfigState option id (plus 'webshop' and 'products'). */
  options: Record<string, InfoBlock>;
};

type InfoLocale = 'de' | 'fr' | 'en' | 'es' | 'nl';

const de: PricingInfo = {
  situation: {
    new: {
      title: 'Sie beginnen mit einem leeren Blatt',
      body:
        'Wir bauen Ihre Website von null, bezahlbar pro Monat und ohne Einrichtungskosten. Das heisst: keine Rechnung über Tausende Franken, bevor Sie auch nur einen Besucher hatten. Sie zahlen ab dem Monat, in dem Ihre Website online steht.\n\nFür die meisten Unternehmen ist das die richtige Wahl, auch wenn Sie schon eine alte Website haben. Neu beginnen ist oft schneller und günstiger als etwas zu reparieren, das nie gut gebaut wurde.',
    },
    existing: {
      title: 'Sie wollen verbessern was da ist',
      body:
        'Hier kaufen Sie einzelne Dienste statt eines Abos. Praktisch, wenn Ihre Website an sich in Ordnung ist, aber nicht gefunden wird oder zu langsam lädt.\n\nSie wissen nicht wo es hakt? Dann starten Sie mit dem Audit für 190. Wir schauen uns Ihre Website an und sagen ehrlich was kaputt ist, was die Reparatur kostet und wann neu bauen günstiger ist als weiter flicken.',
    },
  },
  pages: {
    new: {
      title: 'Zehn Seiten sind drin',
      body:
        'Für die meisten Unternehmen ist das reichlich: eine Startseite, drei bis fünf Seiten über das was Sie tun, eine Seite über Sie, Kontakt und die zwei rechtlich verpflichtenden Seiten.\n\nBrauchen Sie mehr, etwa eine eigene Seite pro Dienst oder pro Region, rechnen wir die einmalig dazu. Ihr Monatsbetrag bleibt einfach 99. Und eine Seite die Sie später hinzufügen, geht immer noch.',
    },
    existing: {
      title: 'Nur zum Rechnen',
      body:
        'Das kostet Sie nichts. Wir nutzen die Zahl um Dienste zu berechnen die pro Seite gehen, wie das Neuschreiben Ihrer Texte. Eine Schätzung reicht; wir prüfen selbst wie viele es genau sind.',
    },
    threshold: {
      title: 'Warum das Abo dann steigt',
      body:
        'In Ihrem Abo sind unbegrenzte kleine Textänderungen enthalten. Auf zehn Seiten ist das überschaubar, auf fünfzig Seiten ist es strukturell mehr Arbeit. Daher 199 pro Monat ab sechsundzwanzig Seiten.\n\nUnter fünfundzwanzig ändert sich nichts an Ihrem Monatsbetrag, egal wie viele Seiten Sie hinzufügen.',
    },
  },
  options: {
    webshop: {
      title: 'Verkaufen ab Ihrer eigenen Website',
      body:
        'Ein vollständiger Shop auf Ihrer Website: ein Produktkatalog mit Kategorien und Filtern, Varianten wie Grösse und Farbe, Bestand der automatisch mitzählt, ein Warenkorb und eine Kasse die auf dem Telefon funktioniert. Dort passieren die meisten Käufe.\n\nTwint ist dabei, ebenso Kartenzahlung und Zahlung auf Rechnung. Wir rechnen dafür nichts extra. In der Schweiz ohne Twint verkaufen ist wie ein Laden ohne Kasse.\n\nVersandkosten stellen Sie selbst ein pro Gewicht oder pro Bestellwert, mit Gratisversand ab einer Grenze die Sie wählen. Die MWST wird korrekt berechnet für die Schweiz und für Lieferungen in die EU.\n\nUnd Ihre Produkte erscheinen in Google mit Preis und Bestand, nicht als gewöhnlicher blauer Link. Das ist der Unterschied zwischen gesehen und angeklickt werden.',
    },
    products: {
      title: 'Sie verwalten Ihre Produkte selbst',
      body:
        'Preise, Fotos, Texte und Bestand passen Sie selbst in einem einfachen Verwaltungsbereich an. Das ist schneller für Sie und hält Ihren Shop aktuell.\n\nBis hundert Produkte ändert sich nichts an Ihrem Preis. Darüber kommen 100 pro Monat dazu, weil ein grösserer Katalog mehr Pflege verlangt.',
    },
    erpLink: {
      title: 'Bestellungen die von selbst in Ihrer Buchhaltung landen',
      body:
        'Jede Bestellung kommt automatisch in Ihr Buchhaltungsprogramm oder Ihr Lagersystem, ohne dass jemand etwas abtippen muss. Bestand den Sie dort anpassen, steht sofort auch in Ihrem Webshop.\n\nWas das kostet hängt ganz von dem Programm ab das Sie nutzen und davon was es an Kopplungsmöglichkeiten bietet. Kreuzen Sie es an und wir schauen uns Ihre Situation an und senden innerhalb von zwei Werktagen einen festen Preis. Der Betrag zählt daher noch nicht in Ihrem Total oben mit.',
    },
    productImport: {
      title: 'Ihr ganzer Katalog auf einmal drin',
      body:
        'Haben Sie Ihre Produkte schon in einer Liste oder in einem anderen System, dann übertragen wir sie auf einmal, mit Fotos und Preisen. Das spart Ihnen Tage Tipparbeit und verhindert die Tippfehler die dazugehören.',
    },
    extraLanguage: {
      title: 'Ihre Website in einer zweiten Sprache, korrekt verknüpft',
      body:
        'Nicht nur übersetzt, sondern auch technisch richtig miteinander verknüpft. Suchmaschinen wissen dann welche Version sie welchem Besucher zeigen müssen.\n\nGenau da geht es bei den meisten mehrsprachigen Websites schief. Ohne diese Verknüpfung konkurrieren Ihre Sprachversionen miteinander statt sich zu verstärken, und manchmal bleibt eine vollständig unsichtbar. In einem Land mit vier Sprachen kostet Sie das Kunden.\n\nBei einer neuen Website bauen wir das mit, während die Struktur ohnehin entsteht, und es kostet 290. Bei einer bestehenden Website sind es 490, weil wir dann eine Struktur erben die meist nicht darauf ausgelegt war.',
    },
    structuredData: {
      title: 'Lassen Sie Google Ihre Dienste zeigen statt nur Ihren Namen',
      body:
        'Im Basisabo legen wir schon fest wer Sie sind. Damit gehen wir weiter: was Sie genau anbieten, welche Fragen Sie beantworten und wo sich ein Besucher in Ihrer Website befindet.\n\nDas Ergebnis ist dass Ihre Seite in den Suchergebnissen mehr Platz einnimmt, mit Ihren häufigen Fragen darunter. Mehr Platz bedeutet mehr Klicks, ohne dass Sie höher stehen müssen.\n\nBei einer bestehenden Website rechnen wir 490 statt 350, weil wir es in Vorlagen einpassen müssen die nicht darauf gebaut sind.',
    },
    migration: {
      title: 'Nehmen Sie Ihre aufgebaute Position mit auf Ihre neue Website',
      body:
        'Stand Ihre alte Website jahrelang in Google, dann steckt darin Wert. Wir sorgen dass jede alte Adresse sauber auf die neue weiterleitet und prüfen danach ob nichts hängen geblieben ist.\n\nDas zu überspringen ist der teuerste Fehler in diesem Fach. Ein Neubau ohne Redirectplan kann Sie auf einen Schlag die Positionen kosten die Sie jahrelang aufgebaut haben, und es kann Monate dauern bis Sie sie zurück haben.',
    },
    audit: {
      title: 'Wo geht es schief und was kostet die Reparatur',
      body:
        'Wir prüfen ob Ihre Website überhaupt in Google steht, ob versehentlich eine Blockade aktiv ist und ob AI Systeme wie ChatGPT Ihre Seiten wirklich lesen können.\n\nLetzteres machen wir in Ihrem Serverlogbuch und nicht mit einem Online Testwerkzeug, denn eine Blockade sitzt meist eine Ebene höher als so ein Werkzeug sehen kann. Wir sind dem auf unserer eigenen Website begegnet: alles war richtig eingestellt, und trotzdem wurde eines der vier grossen AI Systeme hundertzwanzig Mal abgewiesen.\n\nSie erhalten eine Liste mit dem was kaputt ist, was die Reparatur kostet und wo neu bauen günstiger ausfällt. Wählen Sie danach eine neue Website bei uns, dann sitzt alles aus dieser Liste einfach in Ihrem Abo.',
    },
    answerBlocks: {
      title: 'Sorgen Sie dass AI Ihren Text übernehmen kann',
      body:
        'Wir schreiben den oberen Teil jeder Seite neu, sodass dort eine kurze, vollständige Antwort auf die Frage steht für die diese Seite existiert.\n\nImmer mehr Menschen suchen nicht mehr auf Google, sondern fragen ChatGPT. Der gibt eine Antwort und nennt eine Handvoll Quellen. Wer keinen zitierbaren Text hat, kommt in dieser Antwort nicht vor, wie gut seine Website sonst auch ist.',
    },
    entityLocal: {
      title: 'Sorgen dass Sie lokal gefunden werden',
      body:
        'Wir richten Ihr Google Unternehmensprofil ein und sorgen dass Ihr Name, Ihre Adresse und Ihre Telefonnummer auf jedem Kanal Zeichen für Zeichen identisch sind. Danach verknüpfen wir Ihre Profile mit Ihrer Website, sodass eine Maschine sieht dass es überall um dasselbe Unternehmen geht.\n\nKlingt langweilig und ist der Dienst der Ihre Sichtbarkeit am schnellsten bewegt. Suchmaschinen und AI Systeme leiten ab wer Sie sind aus dem was über Sie zu finden ist. Steht Ihre Adresse an vier Stellen etwas anders, dann zweifeln sie, und Zweifel kostet Sie die Nennung.\n\nEs kommt keine Zeile Code daran, also ist der Preis derselbe ob Ihre Website neu ist oder zehn Jahre alt. Bei einer neuen Website bei uns sitzt das einfach in Ihrem Abo.',
    },
    analyticsConsent: {
      title: 'Wissen was Ihre Website bringt, innerhalb der Regeln',
      body:
        'Wir setzen Ihre Besucherstatistiken korrekt auf, mit einer Cookie Meldung die den europäischen Regeln entspricht und mit einer Einstellung durch die Ihre Zahlen stimmen bleiben, auch wenn jemand die Meldung wegklickt.\n\nInklusive dem Messen von dem was wirklich zählt: ein ausgefülltes Formular, ein Telefonklick, eine Anfrage. Ohne diese Messung wissen Sie zwar wie viele Besucher Sie hatten, aber nicht wie viele Kunden. Und dann kann keine Kampagne beweisen was sie Ihnen gebracht hat.',
    },
    cwv: {
      title: 'Ihre Website schneller machen, mit Zahlen dazu',
      body:
        'Wir packen die schwersten Bilder, Skripte und Schriften an bis Ihre Website innerhalb der Geschwindigkeitswerte von Google fällt, und messen vorher und nachher sodass Sie den Unterschied schwarz auf weiss sehen.\n\nDer Preis hängt von dem ab was da ist, also schauen wir Ihre Website zuerst an und senden innerhalb von zwei Werktagen einen festen Preis.',
    },
    accessibility: {
      title: 'Nutzbar für alle, und rechtzeitig in Ordnung',
      body:
        'Kontrast, Bedienung mit Tastatur, Texte zu Bildern, lesbar für einen Screenreader. Sie erhalten einen Bericht der zeigt wo Ihre Website steht.\n\nAb 2027 wird das in der Schweiz für private Unternehmen verpflichtend. Verkaufen Sie schon in die EU, dann gilt es für Sie heute schon, und für Webshops gibt es keine Ausnahme für kleine Unternehmen.\n\nDer Preis hängt vom Zustand Ihrer Website ab, also schauen wir zuerst und senden innerhalb von zwei Werktagen einen festen Preis.',
    },
    visibilityLoop: {
      title: 'Wissen ob es funktioniert, statt hoffen',
      body:
        'Jeden Monat messen wir ob Sie in ChatGPT, Google, Perplexity und Copilot genannt werden. Immer mit denselben Fragen und denselben Messregeln, sodass die Zahlen über die Monate vergleichbar bleiben.\n\nDaneben schauen wir Ihre Suchergebnisse an, prüfen ob AI Systeme noch hereinkommen und verbessern jeden Monat eine Seite konkret. Sie erhalten einen Bericht mit drei Zahlen und einem Aktionspunkt. Keine dreissig Seiten Grafiken.\n\nDas ist was eine Website von einem Kostenpunkt zu einer Investition macht.',
    },
    googleAds: {
      title: 'Heute schon zuoberst stehen',
      body:
        'Wir setzen Ihre Kampagnen auf, wählen die Suchbegriffe, schreiben die Anzeigen und behalten im Auge wohin Ihr Budget geht. Sie erhalten monatlich einen Bericht mit dem was es gebracht hat.\n\nAnzeigen kaufen Sichtbarkeit heute. Die Sichtbarkeitsschleife baut Sichtbarkeit für nächstes Jahr. Wer nur wirbt, mietet seine Auffindbarkeit und hört auf zu existieren sobald er aufhört zu zahlen.',
    },
    contentRetainer: {
      title: 'Ihre Website wachsen lassen statt stillstehen',
      body:
        'Zwei Artikel pro Monat, geschrieben auf eine Frage die Ihre Kunden wirklich stellen, mit Verweisen zu Ihren Dienstseiten.\n\nEine Website von zehn Seiten ist irgendwann erschöpft: es gibt nur so viele Fragen die Sie damit beantworten können. Das ist der einzige Knopf der weiter wirkt, und er wirkt sowohl für Google als auch für AI Antworten.',
    },
    reviewManagement: {
      title: 'Das Einzige das Sie nicht selbst schreiben können',
      body:
        'Wir bitten Ihre Kunden zum richtigen Zeitpunkt um eine Bewertung, folgen nach und helfen Ihnen beim Beantworten.\n\nAlles auf Ihrer Website sagen Sie über sich selbst. Eine Bewertung sagt jemand anders über Sie, und das wiegt bei Suchmaschinen und bei Menschen schwerer als jeder Text von Ihnen selbst.',
    },
  },
};

const nl: PricingInfo = {
  situation: {
    new: {
      title: 'U begint met een blanco blad',
      body:
        'Wij bouwen uw website van nul, betaalbaar per maand en zonder opstartkost. Dat betekent: geen factuur van duizenden franken voor u ook maar één bezoeker gehad heeft. U betaalt vanaf de maand dat uw site online staat.\n\nVoor de meeste bedrijven is dit de juiste keuze, ook als u al een oude site heeft. Opnieuw beginnen is vaak sneller en goedkoper dan iets repareren dat nooit goed gebouwd is.',
    },
    existing: {
      title: 'U wil verbeteren wat er staat',
      body:
        'Hier koopt u losse diensten in plaats van een abonnement. Handig als uw site op zich prima is, maar niet gevonden wordt of te traag laadt.\n\nWeet u niet waar het misloopt? Begin dan met de audit van 190. Wij bekijken uw site en zeggen eerlijk wat er stuk is, wat herstel kost, en wanneer opnieuw bouwen goedkoper uitkomt dan blijven lappen.',
    },
  },
  pages: {
    new: {
      title: '10 pagina\'s zijn inbegrepen',
      body:
        'Voor de meeste bedrijven is dat ruim genoeg: een startpagina, drie tot vijf pagina\'s over wat u doet, een pagina over uzelf, contact, en de twee juridische pagina\'s die verplicht zijn.\n\nHeeft u er meer nodig, bijvoorbeeld een aparte pagina per dienst of per regio, dan rekenen wij die eenmalig bij. Uw maandbedrag blijft gewoon 99. En een pagina die u later toevoegt, kan altijd nog.',
    },
    existing: {
      title: 'Alleen om te rekenen',
      body:
        'Dit kost u niets. Wij gebruiken het aantal om diensten te berekenen die per pagina gaan, zoals het herschrijven van uw teksten. Een schatting volstaat; wij kijken zelf na hoeveel het er precies zijn.',
    },
    threshold: {
      title: 'Waarom het abonnement dan stijgt',
      body:
        'In uw abonnement zitten onbeperkt kleine tekstwijzigingen. Op tien pagina\'s is dat te overzien, op vijftig pagina\'s is het structureel meer werk. Vandaar 199 per maand vanaf zesentwintig pagina\'s.\n\nOnder de vijfentwintig verandert er niets aan uw maandbedrag, hoeveel pagina\'s u ook toevoegt.',
    },
  },
  options: {
    webshop: {
      title: 'Verkopen vanaf uw eigen site',
      body:
        'Een volledige winkel bovenop uw website: een productcatalogus met categorieën en filters, varianten zoals maat en kleur, voorraad die vanzelf meetelt, een winkelwagen en een afrekenproces dat op een telefoon werkt. Daar gebeuren de meeste aankopen.\n\nTwint zit erin, net als kaartbetaling en betaling op factuur. Wij rekenen daar niets extra voor. In Zwitserland zonder Twint verkopen is als een winkel zonder kassa.\n\nVerzendkosten stelt u zelf in per gewicht of per bestelbedrag, met gratis verzending vanaf een grens die u kiest. Btw wordt correct berekend voor Zwitserland en voor leveringen naar de EU.\n\nEn uw producten verschijnen in Google met prijs en voorraad, niet als een gewone blauwe link. Dat is het verschil tussen gezien en aangeklikt worden.',
    },
    products: {
      title: 'U beheert uw producten zelf',
      body:
        'Prijzen, foto\'s, teksten en voorraad past u zelf aan in een eenvoudig beheerscherm. Dat is sneller voor u en het houdt uw winkel actueel.\n\nTot honderd producten verandert er niets aan uw prijs. Daarboven komt er 100 per maand bij, omdat een grotere catalogus meer onderhoud vraagt.',
    },
    erpLink: {
      title: 'Bestellingen die vanzelf in uw boekhouding belanden',
      body:
        'Elke bestelling komt automatisch in uw boekhoudpakket of uw voorraadsysteem terecht, zonder dat iemand iets moet overtypen. Voorraad die u daar aanpast, staat meteen ook in uw webshop.\n\nWat dit kost hangt volledig af van het pakket dat u gebruikt en van wat het aan koppelmogelijkheden aanbiedt. Vink het aan en wij bekijken uw situatie en sturen binnen twee werkdagen een vaste prijs. Het bedrag telt daarom nog niet mee in uw totaal hierboven.',
    },
    productImport: {
      title: 'Uw hele catalogus in één keer erin',
      body:
        'Heeft u uw producten al in een lijst of in een ander systeem staan, dan zetten wij ze in één keer over, met foto\'s en prijzen. Scheelt u dagen typwerk en voorkomt de typfouten die daarbij horen.',
    },
    extraLanguage: {
      title: 'Uw site in een tweede taal, correct gekoppeld',
      body:
        'Niet alleen vertaald, maar ook technisch juist aan elkaar geknoopt. Zoekmachines weten dan welke versie ze aan welke bezoeker moeten tonen.\n\nDat laatste is precies waar het bij de meeste meertalige sites misgaat. Zonder die koppeling gaan uw taalversies met elkaar concurreren in plaats van elkaar te versterken, en soms blijft er eentje volledig onzichtbaar. In een land met vier talen kost dat u klanten.\n\nBij een nieuwe site bouwen wij dit mee terwijl de structuur toch ontstaat, en kost het 290. Bij een bestaande site is het 490, omdat wij dan een indeling erven die daar meestal niet op voorzien was.',
    },
    structuredData: {
      title: 'Laat Google uw diensten tonen in plaats van alleen uw naam',
      body:
        'In het basisabonnement leggen wij al vast wie u bent. Hiermee gaan we verder: wat u precies aanbiedt, welke vragen u beantwoordt, en waar een bezoeker zich in uw site bevindt.\n\nHet resultaat is dat uw pagina in de zoekresultaten meer plaats inneemt, met uw veelgestelde vragen eronder. Meer plaats betekent meer kliks, zonder dat u hoger hoeft te staan.\n\nBij een bestaande site rekenen wij 490 in plaats van 350, omdat wij het moeten inpassen in sjablonen die er niet op gebouwd zijn.',
    },
    migration: {
      title: 'Neem uw opgebouwde positie mee naar uw nieuwe site',
      body:
        'Heeft uw oude site jaren in Google gestaan, dan zit daar waarde in. Wij zorgen dat elk oud adres netjes doorverwijst naar het nieuwe, en controleren achteraf of er niets is blijven hangen.\n\nDit overslaan is de duurste fout in dit vak. Een herbouw zonder redirectplan kan u in één klap de posities kosten die u jaren hebt opgebouwd, en het kan maanden duren voor u ze terug heeft.',
    },
    audit: {
      title: 'Waar loopt het mis, en wat kost het om te herstellen',
      body:
        'Wij controleren of uw site überhaupt in Google staat, of er per ongeluk een blokkade actief is, en of AI systemen zoals ChatGPT uw pagina\'s echt kunnen lezen.\n\nDat laatste doen wij in uw serverlogboek en niet met een online testtool, want een blokkade zit meestal een laag hoger dan zo\'n tool kan zien. Wij kwamen dit op onze eigen site tegen: alles stond goed ingesteld, en toch werd één van de vier grote AI systemen honderdtwintig keer geweigerd.\n\nU krijgt een lijst met wat er stuk is, wat herstel kost, en waar opnieuw bouwen goedkoper uitvalt. Kiest u daarna voor een nieuwe site bij ons, dan zit alles uit deze lijst gewoon in uw abonnement.',
    },
    answerBlocks: {
      title: 'Zorg dat AI uw tekst kan overnemen',
      body:
        'Wij herschrijven de bovenkant van elke pagina zodat er een kort, volledig antwoord staat op de vraag waarvoor die pagina bestaat.\n\nSteeds meer mensen zoeken niet meer op Google maar vragen het aan ChatGPT. Die geeft één antwoord en noemt een handvol bronnen. Wie geen citeerbare tekst heeft, komt in dat antwoord niet voor, hoe goed zijn site verder ook is.',
    },
    entityLocal: {
      title: 'Zorgen dat u lokaal gevonden wordt',
      body:
        'Wij richten uw Google Bedrijfsprofiel in en zorgen dat uw naam, adres en telefoonnummer op elk kanaal teken voor teken identiek zijn. Daarna koppelen wij uw profielen aan uw site, zodat een machine ziet dat het allemaal over hetzelfde bedrijf gaat.\n\nKlinkt saai en het is de dienst die uw zichtbaarheid het snelst beweegt. Zoekmachines en AI systemen leiden af wie u bent uit wat er over u te vinden is. Staat uw adres op vier plaatsen net iets anders, dan twijfelen ze, en twijfel kost u de vermelding.\n\nEr komt geen regel code aan te pas, dus de prijs is dezelfde of uw site nu nieuw is of tien jaar oud. Bij een nieuwe site bij ons zit dit gewoon in uw abonnement.',
    },
    analyticsConsent: {
      title: 'Weten wat uw site opbrengt, binnen de regels',
      body:
        'Wij zetten uw bezoekersstatistieken correct op, met een cookiemelding die voldoet aan de Europese regels en met een instelling waardoor uw cijfers blijven kloppen ook wanneer iemand de melding wegklikt.\n\nInclusief het meten van wat er echt toe doet: een ingevuld formulier, een telefoonklik, een aanvraag. Zonder die meting weet u wel hoeveel bezoekers u had, maar niet hoeveel klanten. En dan kan geen enkele campagne bewijzen wat ze u opleverde.',
    },
    cwv: {
      title: 'Uw site sneller maken, met cijfers erbij',
      body:
        'Wij pakken de zwaarste afbeeldingen, scripts en lettertypen aan tot uw site binnen de snelheidsdrempels van Google valt, en meten vooraf en achteraf zodat u het verschil zwart op wit ziet.\n\nDe prijs hangt af van wat er staat, dus wij bekijken uw site eerst en sturen binnen twee werkdagen een vaste prijs.',
    },
    accessibility: {
      title: 'Bruikbaar voor iedereen, en op tijd in orde',
      body:
        'Contrast, bediening met een toetsenbord, teksten bij afbeeldingen, leesbaar voor een schermlezer. U krijgt een rapport dat aantoont waar uw site staat.\n\nVanaf 2027 wordt dit in Zwitserland verplicht voor private bedrijven. Verkoopt u nu al aan de EU, dan geldt het voor u vandaag al, en voor webshops bestaat er geen uitzondering voor kleine ondernemingen.\n\nDe prijs hangt af van de staat van uw site, dus wij kijken eerst en sturen binnen twee werkdagen een vaste prijs.',
    },
    visibilityLoop: {
      title: 'Weten of het werkt, in plaats van hopen',
      body:
        'Elke maand meten wij of u genoemd wordt in ChatGPT, Google, Perplexity en Copilot. Altijd met dezelfde vragen en dezelfde meetregels, zodat de cijfers over de maanden vergelijkbaar blijven.\n\nDaarnaast kijken wij naar uw zoekresultaten, controleren wij of AI systemen nog binnenkomen, en verbeteren wij elke maand één pagina concreet. U krijgt een rapport met drie cijfers en één actiepunt. Geen dertig pagina\'s grafieken.\n\nDit is wat een website van een kostenpost een investering maakt.',
    },
    googleAds: {
      title: 'Vandaag al bovenaan staan',
      body:
        'Wij zetten uw campagnes op, kiezen de zoekwoorden, schrijven de advertenties en houden in de gaten waar uw budget naartoe gaat. U krijgt maandelijks een rapport met wat het opleverde.\n\nAdvertenties kopen zichtbaarheid vandaag. De zichtbaarheidsloop bouwt zichtbaarheid voor volgend jaar. Wie alleen adverteert, huurt zijn vindbaarheid en stopt met bestaan zodra hij stopt met betalen.',
    },
    contentRetainer: {
      title: 'Uw site laten groeien in plaats van stilstaan',
      body:
        'Twee artikelen per maand, geschreven op een vraag die uw klanten echt stellen, met verwijzingen naar uw dienstpagina\'s.\n\nEen site van tien pagina\'s is op een gegeven moment uitgeput: er zijn maar zoveel vragen die u ermee kan beantwoorden. Dit is de enige knop die blijft werken, en hij werkt zowel voor Google als voor AI antwoorden.',
    },
    reviewManagement: {
      title: 'Het enige dat u niet zelf kan schrijven',
      body:
        'Wij vragen uw klanten om een beoordeling op het juiste moment, volgen ze op en helpen u met het beantwoorden.\n\nAlles op uw website zegt u over uzelf. Een review zegt iemand anders over u, en dat weegt bij zoekmachines en bij mensen zwaarder dan welke tekst van uzelf ook.',
    },
  },
};

export const PRICING_INFO: Record<InfoLocale, PricingInfo> = { de, fr: de, en: de, es: de, nl };

export function pricingInfo(locale: string): PricingInfo {
  return PRICING_INFO[(['de', 'fr', 'en', 'es', 'nl'].includes(locale) ? locale : 'de') as InfoLocale];
}
