# amai.ch — Masterdocument businessmodel

> Samenvatting van het businessmodel zoals het in de codebase + content staat (DE primair, FR/EN).
> Opgesteld als basis voor de SEO/GEO-audit (`SEO_GEO_AUDIT.md`). Tussen haakjes staat telkens
> waar het feit leeft, zodat je één bron van waarheid kunt aanhouden.

## 1. Wie en wat

- **Juridische entiteit:** Einzelfirma Tom de Vree (eenmanszaak), eigenaar **Tom de Vree**,
  Wylerstrasse 75, 3000 Bern, Zwitserland. Contact `hello@amai.ch`. BTW-plichtig (8,1%; UID/MWST
  nummer "folgt"). *(`content/legal/impressum.de.md`, `gtc.de.md:8`, `CLAUDE.md`)*
- **Categorie / positionering:** een **AI-first digitale partner voor Zwitserse KMU**. amai! bouwt
  en onderhoudt websites, klantportalen, CRM systemen, automatiseringen, business dashboards en AI
  oplossingen op een maandelijks abonnement, "sneller en kostenefficiënter dan een klassiek bureau
  omdat amai! met AI werkt." *(`public/llms.txt:3-12`, `de.json` meta + `serviceUi.entityLine`,
  `so-funktioniert.ts` entitySentence, `whyAmai`)*
- **Merkwoord:** `amai!` met gouden/mint `!`; het domein `amai.ch` blijft plat. Komt uit het
  Antwerpse dialect (uitroep van bewondering). *(`de.json` about.nameText)*

## 2. Aanbod en leveringsmodel

Eén partner vervangt meerdere leveranciers en tools. Alles wordt geleverd als één verbonden
"digitale Aufstellung" onder een terugkerend maandbedrag dat **design, bouw, hosting, onderhoud,
security en SEO-basis** bundelt. Werk start binnen **5 werkdagen** na de eerste betaling.
*(`home.ts` model, `so-funktioniert.ts`, `gtc.de.md:10-16`)*

## 3. Plannen en prijzen

De **live storefront** (`/website-abos`) rendert uitsluitend `src/content/pricingTiles.ts`:

| Tegel | Prijs (live tiles) | Type |
|---|---|---|
| Business Website | ab 99 CHF / maand | Website-abo |
| Webshop | ab 125 CHF / maand | Website-abo |
| Logo + Markenrichtlinien | 750 CHF eenmalig | Add-on |
| Email Marketing | ab 79 CHF / maand | Dienst |
| Marketing Automation | ab 129 CHF / maand | Dienst |
| AI Assistenten | ab 99 CHF / maand | Dienst |
| Google Ads | 195 CHF / maand (+ budget) | Dienst |
| Digitale Plattformen | Auf Anfrage | Dienst |
| Consultancy | Auf Anfrage | Dienst |

Stripe-bedragen staan in `src/lib/stripe/plans.ts` en volgen de tiles hierboven. Logo-bedrag staat
in `src/lib/promo.ts` (regulier 750, promo `active:false`).

> **Historisch (juni 2026):** het Beginner Abo (ab 35 CHF) en de oude tiering Beginner/Business/Webshop
> (met Webshop ab 149) zijn afgeschaft; kleine één pagina projecten worden niet meer aangeboden. Het
> instapabo is nu Business Website ab 99 CHF, Webshop ab 125 CHF. De losse diensten CRM, Kundenportal,
> Business Portal en Buchung und Termine zijn samengevoegd tot Digitale Plattformen en Consultancy
> (op aanvraag). `src/content/pricingTiles.ts` is de bron; GTC (5 talen), de landingspagina's en het
> Service-schema zijn hierop bijgewerkt.

## 4. Doelgroep, regio, talen

KMU, zelfstandigen, lokale bedrijven, praktijken en bureaus in **heel Zwitserland**. Talen: **DE
(primair), FR, EN**. *(`llms.txt:14-15,40-41`, `de.json` hero.trust, whyAmai)*

## 5. Contractvoorwaarden (GTC, `content/legal/gtc.*`)

- **36 maanden** minimumtermijn; daarna maandelijks met 1 maand opzeg.
- Vroege opzeg door de klant (niet aan amai! te wijten) = resterende maandfees tot eind maand 36
  blijven volledig verschuldigd.
- **CHF 190 administratieve kost** (excl. BTW) bij elke beëindiging (dossieroverdracht + afsluiting).
- Wijzigingen na oplevering: **CHF 95/uur**, per begonnen kwartier (= CHF 23,75).
- Betaling 14 dagen, 5% verwijlrente, CHF 20 herinneringskost; jaarlijkse LIK-indexatie.
- Eigendom van design/code gaat over na de minimumtermijn + volledige betaling; content en domein
  zijn altijd van de klant.

## 6. Tools en verwerkers

Supabase (DB, EU), Resend (e-mail, EU), Cloudflare (hosting/CDN, EU), Google Analytics 4 + Google
Ads (consent-gated), Stripe (betalingen, "in Vorbereitung"). *(`content/legal/privacy.de.md:35-40`)*

## 7. Klantreis (5 stappen)

Kennenlernen → Bedarf analysieren → Blueprint → Design & Umsetzung → Launch & laufende Betreuung.
*(`so-funktioniert.ts`, `home.ts`)*. Systeem-projecten (Business Dashboards, CRM, Kundenportale)
starten bovendien met een **Business Analyse** (hoe gestandaardiseerd de processen zijn,
verwachtingen + technische criteria; "de kracht zit in de voorbereiding").

## 8. Eén bron van waarheid (waar elk feit hoort)

| Feit | Canonieke bron |
|---|---|
| Storefront-prijzen websites + diensten | `src/content/pricingTiles.ts` |
| Billing-bedragen (Stripe) | `src/lib/stripe/plans.ts`, `src/lib/promo.ts` |
| Contractvoorwaarden | `content/legal/gtc.{de,fr,en}.md` |
| Bedrijfsfeiten (entity, adres) | `content/legal/impressum.*` + `layout.tsx` JSON-LD |
| AI/GEO entity-omschrijving | `public/llms.txt` + `serviceUi.entityLine` |
| Diensten-taxonomie + iconen | `src/content/services.ts`, `serviceDetail.ts` |
| Checkout-weergave plannen | `plan`-namespace in `src/messages/{de,fr,en}.json` |

Aanbeveling: voer prijswijzigingen voortaan op **één** plek door (tiles + plans.ts) en laat de
andere oppervlakken daar uit afleiden, of houd een korte checklist bij van alle plekken die je
synchroon moet houden (zie audit, Quick wins).
