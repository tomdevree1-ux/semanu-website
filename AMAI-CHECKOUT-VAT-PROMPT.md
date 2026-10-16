# Prompt: B2B-checkout met automatische BTW- en bedrijfsdata-validatie

> Deliverable: in te bouwen op de checkout van www.amai.ch (Zwitserse webshop).
> Gebruik deze prompt rechtstreeks bij een dev-AI of geef hem aan een ontwikkelaar.

---

## Context

Ik run de webshop www.amai.ch (Zwitsers bedrijf, BV gevestigd in Zwitserland). Mijn B2B-klanten geven tijdens de checkout een BTW- of ondernemingsnummer op. Vandaag wordt dit nummer enkel passief opgeslagen. Ik wil dat het in real-time wordt gevalideerd en dat de officieel-geregistreerde bedrijfsnaam en maatschappelijke zetel automatisch worden ingevuld in de overige velden van het checkoutformulier.

## Doelen

1. Manuele typfouten in bedrijfsnaam en factuuradres voorkomen. Verkeerde adressen blokkeren facturen en kosten me later tijd in support.
2. Juridische zekerheid creëren bij toepassing van het 0%-tarief (reverse-charge naar EU-klanten met geldig BTW-nummer en handelsverkeer binnen Zwitserland onder de UID-regels).
3. Fraude met fictieve nummers tegenhouden voordat de bestelling vastligt.
4. Een bewijslast-trail opbouwen voor elke validering die later in een BTW-controle als bewijs kan dienen.

## Functionele requirements

**A.** Naast het invulveld voor het BTW- of ondernemingsnummer staat een knop "Verifieer". De gebruiker kan ook automatisch laten valideren op blur van het veld na minimaal 8 karakters input.

**B.** De input-parser moet de volgende varianten correct herkennen en normaliseren naar `{ countryCode, vatNumber }`:

- "BE0828.291.116", "BE 0828 291 116", "BE-0828-291-116"
- "0828291116" zonder landcode (assumeer landcode op basis van klantregio of toon een dropdown als geen regio bekend is)
- "CHE-123.456.789 MWST" of "CHE-123.456.789 IVA" (Zwitserse UID)
- 9-cijferig Belgisch nummer krijgt automatisch een leading zero
- GR wordt EL voor VIES (Griekenland-uitzondering)

**C.** Per landcategorie de juiste backend-service aanspreken (zie sectie Databases hieronder).

**D.** Bij succesvolle validatie de velden naam, straat, huisnummer, postcode en gemeente vooraf invullen MITS ze leeg zijn. Manuele edits van de gebruiker mogen nooit worden overschreven.

**E.** Bij niet-EU/niet-CH/niet-UK landen: geen error, wel een vriendelijke melding "Validatie is niet beschikbaar voor [land]. Vul de velden manueel in." en het invulvelden blijven actief.

**F.** Het BTW-veld toont na validatie een groen vinkje + de bron + het tijdstip van validatie. Bij ongeldig: rood kruis + uitleg.

## Databases en endpoints per land

| Regio | Service | Endpoint | Auth | Kosten |
|---|---|---|---|---|
| EU 27 + XI (Noord-Ierland) | VIES (DG TAXUD) | POST https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number | geen | gratis |
| CH | UID-Register (Bundesamt für Statistik) | https://www.uid-wse-a.admin.ch/V5.0/PublicServices.svc | geen (SOAP) | gratis |
| UK | Companies House | https://api.company-information.service.gov.uk/company/{number} | API-key (gratis aan te vragen) | gratis |
| Andere | n.v.t. | n.v.t. | n.v.t. | n.v.t. |

Voor VIES: gebruik de POST REST-API als primaire endpoint, met een GET /ms/{cc}/vat/{num} als fallback indien de POST-endpoint onbereikbaar is. VIES is geen eigen database maar een federated query-laag die in real-time de nationale BTW-registraties van elke lidstaat aanspreekt. Reken op sporadische timeouts of 502-responses tijdens nationale onderhoudsvensters.

Voor UID: de Zwitserse UID-Webservice is SOAP/XML, niet REST. Houd hier rekening mee in de keuze van de HTTP-client. Wikifactory `node-soap` of Python `zeep` werken prima.

## Architectuur

1. Plaats de logica achter een eigen API-endpoint op je domein (bv. `/api/verify-company`). NOOIT direct vanuit de browser naar VIES of UID praten, want:
   - VIES en UID staan geen CORS toe van willekeurige origins.
   - Een directe browser-call zou tonen welke endpoints je gebruikt, wat de deur opent voor scraping en misbruik via jouw infrastructuur.

2. Beveiligingsregels voor het endpoint:
   - Vereist een geldige checkout-sessie (signed token of httpOnly session cookie). Zonder sessie: 401.
   - Rate-limit op IP en sessie: maximaal 10 validaties per minuut per gebruiker. Dit voorkomt brute-force scans op nummerreeksen.
   - Server-side input-sanitisatie: regex op `[A-Z]{2}[0-9A-Z]{2,12}`.
   - Voeg een korte server-side cache (5 minuten) toe per genormaliseerd nummer om dubbele calls binnen één checkout-flow te voorkomen.

3. Response-shape (genormaliseerd over alle bronnen):

```json
{
  "ok": true,
  "supported": true,
  "valid": true,
  "source": "VIES" | "UID" | "CH_COMPANIES_HOUSE",
  "countryCode": "BE",
  "vatNumber": "BE0828291116",
  "name": "...",
  "address": {
    "street": "...", "streetNumber": "...",
    "postalCode": "...", "city": "...", "country": "BE"
  },
  "verifiedAt": "ISO-8601 timestamp",
  "consultationNumber": "WAPIAAA-12345-..."
}
```

## Audit en bewijslast

Voor élke succesvolle VIES-validatie vraag je naast naam+adres ook een `consultationNumber` op. Dit doe je door in de POST-body de `requesterMemberStateCode` + `requesterNumber` velden mee te sturen (dit is jouw eigen BTW-nummer). VIES geeft dan een referentienummer terug dat door de Europese Commissie bewijst dat jij op exact dit tijdstip dit BTW-nummer hebt geverifieerd.

Sla per validatie op in een aparte `vat_validations` tabel:

- requested_at, requested_by (sessie/user-id), source-IP
- countryCode, vatNumber
- valid, name, address (JSON snapshot)
- consultationNumber (VIES) of analoog UID-Antwortcode (CH)
- raw_response (volledige body, voor latere recoverbaarheid)

Bewaar deze records minimaal 10 jaar (BTW-bewaarplicht in BE/CH). Bij een latere BTW-controle is dit jouw bewijs dat je de check te goeder trouw hebt uitgevoerd en dat 0%-tarief gerechtvaardigd was.

Voeg in het checkout-success-scherm voor B2B-klanten een "Verificatiebewijs"-knop toe die een PDF genereert met het consultationNumber, datum, klantgegevens en jouw BTW-nummer.

## Fallback en error-handling

**A. Timing en retries**

- Server-side call naar VIES/UID/Companies House: timeout 4 seconden.
- Bij timeout of HTTP 5xx: één retry na 1 seconde delay.
- Tweede mislukking → ga over naar "service onbereikbaar"-flow (zie D).
- Client wacht maximaal 6 seconden op een antwoord van jouw eigen `/api/verify-company`. Daarna toon "Validatie duurde te lang, probeer opnieuw of vul handmatig in".

**B. Foutclassificatie**

Het endpoint geeft één van vijf statussen terug, elk met een eigen UX-respons:

| Status | Betekenis | Klant-UX | Order-flow |
|---|---|---|---|
| ok+valid+enriched | Geldig nummer, naam+adres ontvangen | Groen + auto-fill | Doorgaan met 0% |
| ok+valid+bare | Geldig, maar service gaf geen data (ES/IT) | Groen + manuele invoer | Doorgaan met 0% |
| ok+invalid | Formeel correct, niet geregistreerd | Rood + uitleg | Blokkeren tot fix |
| ok+unsupported | Land valt buiten validatie-bereik | Geel + manuele invoer | Doorgaan zonder 0% |
| error+unreachable | Service is down (na retry) | Geel + keuze (zie D) | Zie keuze D |

**C. Onbekende input**

Onleesbare input ("abc", lege string, niet-genormaliseerd) wordt aan de input-validatie tegengehouden voordat het zelfs naar de server gaat. Inline foutmelding "Vul een geldig BTW- of ondernemingsnummer in".

**D. Service onbereikbaar — kies één strategie**

Wanneer de validatie-service na retry nog steeds onbereikbaar is, moet het systeem één van deze drie strategieën uitvoeren. Kies bij de bouw welke jouw boekhouder verkiest:

*Strategie 1 — "Pauzeer en valideer later" (aanbevolen voor B2B-checkout):*
- Order wordt aangenomen maar krijgt status `pending_vat_check`.
- Klant krijgt een bevestigingsmail "Uw bestelling wordt verwerkt zodra we uw BTW-nummer hebben kunnen verifiëren".
- Achtergrond-job hervalideert elke 15 minuten voor maximaal 24u.
- Lukt het binnen 24u → order ontgrendeld, factuur met 0% verstuurd.
- Lukt het niet binnen 24u → klant gecontacteerd door support.

*Strategie 2 — "Doorgaan met binnenlands tarief en achteraf crediteren":*
- Order gaat direct door met VAT geheven aan jouw binnenlandse tarief (CH 8.1% standaard).
- Achtergrond-job hervalideert. Bij succesvolle latere validering → automatische creditnota voor het BTW-bedrag, verzonden binnen 48u.
- Vereist een degelijk creditnota-proces in jouw boekhouding.

*Strategie 3 — "Blokkeer de checkout":*
- Klant kan niet afrekenen tot de validatie slaagt.
- Inline melding "Onze validatieservice is tijdelijk niet bereikbaar. Probeer over enkele minuten opnieuw of contacteer ons via hello@amai.ch".
- Minst klantvriendelijk, maar geen risico op verkeerde BTW-heffing.

Aanbeveling: strategie 1. Beste klantervaring zonder boekhoudkundig risico.

**E. Audit-trail blijft volledig**

Elke validatie-poging, ook de mislukte, wordt opgeslagen in de `vat_validations` tabel met status, retry-count, timestamps en raw-response (indien beschikbaar). Dit is jouw bewijslast dat je "alles redelijkerwijs hebt gedaan om te valideren".

**F. Monitoring en alerting**

- Centraal logbestand telt VIES/UID/Companies House response times en foutpercentages per dag.
- Wanneer het foutpercentage over 1 uur > 20% loopt → Slack/e-mail alert naar je technische beheerder.
- Wekelijks rapport: aantal validaties per land, slaagpercentage, hoeveel orders in `pending_vat_check` zijn geëindigd.

**G. Periodieke herverificatie**

BTW-nummers kunnen worden ingetrokken (bedrijf failliet, statuut wijzigt). Voor terugkerende klanten: hervalideer het opgeslagen nummer automatisch elke 6 maanden via een cron-job. Bij wijziging → e-mail naar accountmanager, niet automatisch klant blokkeren.

## UX-details

- Veldlabel "BTW- of ondernemingsnummer" (niet "VAT" of "VAT ID", want ondernemers herkennen hun lokale terminologie sneller).
- Placeholder die de juiste prefix toont op basis van klantregio: "BE0123456789" voor BE-gebruikers, "CHE-123.456.789" voor CH-gebruikers.
- Status-tekst onder het veld: "Verifiëren..." / "Bedrijf gevonden: [Naam]" / "Niet gevonden, vul handmatig in".
- Knop "Verifieer" wordt grijs tijdens de call en toont "..." als feedback.
- Bij valid + naam+adres niet beschikbaar (bv. ES, IT geven die niet terug): groen vinkje + "BTW-nummer geldig. Vul naam en adres handmatig in."
- Meertalige strings (DE, FR, IT, EN minimum voor een CH-webshop).
- Werkt zonder JavaScript-only blokkers (graceful degradation: als de call faalt blijft het formulier gewoon submittable met manuele invoer).

## Niet binnen scope

- Vrij doorzoeken van een EU-bedrijvendatabase op naam (BRIS of OpenCorporates is daar de juiste oplossing, niet VIES).
- Financiële kentallen, bestuurders of jaarrekeningen (zou een credit-bureau zoals Graydon, Creditsafe of Dun & Bradstreet vereisen).
- Adresvalidatie via PostNL/Bpost/Swiss Post (apart traject).

## Test-cases

Geldige nummers voor smoke-testing (publiek bekend):

- BE0828291116 (een Belgisch BV-nummer)
- NL810036803B01 (een Nederlands VAT-nummer)
- DE143593636 (een Duits VAT-nummer)
- CHE-115.954.252 MWST (een Zwitsers UID)

Ongeldige nummers:

- BE0000000000 (formeel correct, niet geregistreerd)
- XX1234567 (onbekende landcode → friendly fallback)
- "abc" (geen valid input → 400)

Bouw end-to-end-testen die de bovenstaande cases dekken plus minstens één test waarin VIES bewust een 502 teruggeeft om de fallback-flow te verifiëren.

## Deliverables

1. Eén API-endpoint achter de checkout (`/api/verify-company`).
2. Een Vue/React/Svelte/HTML-component (afhankelijk van de stack van amai.ch) voor het invulveld + verifieer-knop + status-feedback.
3. Database-migratie voor de `vat_validations` tabel.
4. Multi-language vertaalstrings (DE/FR/IT/EN).
5. Achtergrond-job voor periodieke herverificatie en voor "pending_vat_check"-flow.
6. Monitoring-dashboard met response-time en error-rate per service.
7. Documentatie in de repo: welke service voor welk land, welke env-vars, welke fallback-strategie, en hoe je een test-call maakt vanaf de command-line.
