# amai.ch — SEO + GEO audit (19.06.2026)

> Senior technical SEO / GEO-audit op de codebase (Next.js App Router, next-intl DE/FR/EN, Tailwind v4).
> Read-only uitgevoerd. Alle verwijzingen zijn `bestand:regel`. Begeleidend: `BUSINESS_MODEL.md`.
> Vervangt de oudere `SEO_GEO_AUDIT.md` (13.06), die deels achterhaald is (o.a. custom 404 bestaat nu wel).

---

## A. Executive summary

**Algemene gezondheid: sterk fundament, zwakke consistentie.** Technisch is dit een uitzonderlijk
goed gebouwde site voor SEO én GEO: alle content en metadata zijn **server-rendered** (geen
client-only content), één canonieke `#organization`-entity, per-pagina JSON-LD (FAQPage, Service,
BreadcrumbList, BlogPosting, AboutPage/Person), een complete sitemap met hreflang-clusters, correcte
`noindex` op transactionele/portal/styleguide-pagina's, self-hosted fonts en consent-gated GA. Dat
is precies wat AI-crawlers (GPTBot, ClaudeBot, PerplexityBot) nodig hebben.

**Grootste risico — feitelijke contradicties.** De recente prijs/tegel-omslag is nog niet
gepropageerd. Daardoor:
- **Een echte checkout-bug:** de checkout *toont* 79/99 CHF (`plan`-namespace) maar Stripe *rekent*
  99/149 CHF (`plans.ts`). Dit is prijs-tonen-vs-aanrekenen, geen marketingdetail. **Kritisch.**
- **Tegenstrijdige feiten op meerdere oppervlakken** (GTC, 7 landingspagina's, `llms.txt`, home-FAQ,
  so-funktioniert) met oude prijzen (79/99), oude naam (Starter) en "auf Anfrage" voor diensten die
  nu een "ab"-prijs hebben. GEO versterkt wat er staat — dus AI-assistenten citeren met overtuiging
  de **foute** cijfers.

**Grootste kansen.**
1. Eén bron van waarheid voor prijzen + alle oppervlakken synchroniseren (lost 6 contradicties op).
2. Het FAQ-arsenaal uitbreiden met contract-economie (de **CHF 190-kost staat nergens**) en de
  nieuwe prijzen, met FAQPage-schema → directe AI-citeerbaarheid voor "wat kost X".
3. Lokale signalen completeren: `geo`, openingstijden, telefoon en **Review/AggregateRating**
  (testimonial + cases staan zichtbaar op de site maar zijn nergens gemarkeerd).
4. Vergelijkings-/kosten-/how-to-pagina's toevoegen (nu afwezig) voor de hoog-intent AI-vragen.

**Verwachte impact.** De contradicties wegwerken voorkomt fout-citaties en een mogelijke
facturatie-klacht. Schema (Review, LocalBusiness-geo, correcte Offers) + de FAQ-uitbreiding geven
rich-result-kansen en sterk verbeterde AI-citeerbaarheid. Het technische fundament hoeft niet
herbouwd te worden; dit is grotendeels content-synchronisatie + een handvol schema/metadata-fixes.

---

## B. Prioriteitenmatrix

| # | Issue | Type | Ernst | Impact | Moeite | Bestanden | Actie |
|---|---|---|---|---|---|---|---|
| 1 | Checkout toont 79/99, Stripe rekent 99/149 | Content/Tech | **Kritisch** | Hoog | Laag | `plan.b/.w.price` in `messages/{de,fr,en}.json:133,149`; `SubscribeForm.tsx:91`; `plans.ts:25-26` | Zet `plan.b.price`=`99 CHF`, `plan.w.price`=`149 CHF` (3 talen) of laat de weergave uit `plans.ts` komen |
| 2 | "Starter" niet hernoemd naar "Beginner" buiten de tiles | Content/GEO | Hoog | Hoog | Med | `guideStarter` (3×), `gtc.*`, 7× `content/landing/*`, `llms.txt:7` | Eén naam (Beginner) overal; **GTC juridisch bijwerken** |
| 3 | Oude website-prijzen 79/99 in GTC, landings, llms.txt | Content/GEO | Hoog | Hoog | Med | `gtc.de.md:35`, alle `content/landing/*`, `llms.txt:7` | Naar 99/149 (entry 35 blijft) |
| 4 | Diensten "auf Anfrage" vs nieuwe "ab"-prijzen | Content/GEO | Hoog | Med | Med | `llms.txt:8`, `home.ts:200`, `so-funktioniert.ts:125,314,503`, dode keys `price.onRequest/availQuote` | Beslissen + reconciliëren; dode keys opruimen |
| 5 | Google Ads 195 (tiles) vs 200 (overal) | Content | Med | Med | Laag | `pricingTiles.ts:28` vs `googleAds.price`, `gtc:35`, `llms.txt:10`, `plans.ts:33` | Eén bedrag kiezen |
| 6 | Business Website "bis 15 Seiten" vs "bis 10 Seiten" | Content | Med | Laag | Laag | `plan.b.features[0]`, `llms.txt:7` vs `pricingTiles.ts:23` | Eén getal |
| 7 | "Software & Applications" plan nog in checkout/GTC; "Business Portal" vs "Business Dashboards" | Content/GEO | Med | Med | Med | `plan.p.*`, `gtc:8,35`, `services.ts` label vs `pricingTiles.ts:29` | Plan-set + portal-naamgeving unificeren |
| 8 | Geen Review/AggregateRating schema (terwijl zichtbaar) | Schema/GEO | Hoog | Hoog | Laag | homepage testimonial `page.tsx:308-332`, `/referenzen` | `Review` markup toevoegen |
| 9 | Org-node mist `geo`, openingstijden, `telephone` | Schema/Local | Med | Med | Laag | `layout.tsx:89-125` | LocalBusiness-velden aanvullen |
| 10 | Landing `Service.Offer` hardcoded `price:'35'`; `priceRange:'from CHF 35'` niet-standaard | Schema/GEO | Med | Med | Laag | `[landing]/page.tsx:108-118`, `layout.tsx:103` | Prijs uit content of weglaten |
| 11 | Sitemap `lastmod` = build-tijd voor ~100 URL's | Technical | Med | Med | Laag | `sitemap.ts:58,66` | Content-afgeleide datum |
| 12 | 3 page-families omzeilen `pageMetadata`-helper | Technical | Med | Med | Med | `services/page.tsx`, `services/[service]/page.tsx`, `[landing]/page.tsx` | Via helper routeren |
| 13 | Formulierfouten niet aan AT gekoppeld | A11y | Med | Laag | Laag | `ContactForm.tsx`, `FunnelForm.tsx` | `aria-invalid` + `aria-describedby`, `fieldset/legend` |
| 14 | Raster-`<img>` zonder width/height; LCP-cover zonder fetchpriority | Performance | Laag | Laag | Laag | `about/page.tsx:81`, `blog/[slug]/page.tsx:117,133` | Dimensies + `fetchPriority="high"` |
| 15 | FAQ mist contract-economie (CHF 190!) + nieuwe prijzen | Content/GEO | Hoog | Hoog | Med | `faq.items`, `home.ts` faq | FAQ uitbreiden (zie sectie F/H) |
| 16 | 3× `<nav>` zonder `aria-label`; `<time>` zonder `dateTime`; WhyWheel-pie zonder `aria-hidden` | A11y/Tech | Laag | Laag | Laag | `Header.tsx`, blog, `WhyWheel.tsx:43` | Labels + attributen |

---

## C. Gedetailleerde bevindingen

### C1 — Contradicties (de kern van je vraag)

**1.1 Checkout-prijs ≠ aangerekende prijs (KRITISCH).** `SubscribeForm.tsx:91` toont de prijs uit
`tp('plan.b.price')` = **"79 CHF"** (`de/fr/en.json:133`) en `plan.w.price` = **"99 CHF"**
(`:149`). De werkelijke billing komt uit `PLAN_AMOUNT_CHF` = business **99**, webshop **149**
(`plans.ts:25-26`). Een klant kiest "Business · 79 CHF/Monat" en wordt 99 aangerekend.
*SEO/GEO:* minder; *zakelijk/juridisch:* een prijs-display-mismatch in een aankoopflow.
**Fix:** zet `plan.b.price`→`99 CHF`, `plan.w.price`→`149 CHF` in de 3 message-files (of laat de
weergave de `plans.ts`-bron volgen). Dit hoort bij de tiles-omslag die eerder is doorgevoerd.

**1.2 "Starter" leeft nog overal behalve de tiles.** Tiles zeggen "Beginner Website"
(`pricingTiles.ts:22`), maar "Starter" staat nog in `guideStarter` (`de/fr/en.json:97`), in de
**GTC** ("(Starter, Business, Webshop, Software & Applications)" `gtc.de.md:8`; "Starter 35 …"
`:35`), in **alle 7 landingspagina's** ("Starter Website", "Transparente Abos für Starter, Business
und Webshop") en in `llms.txt:7`. *GEO:* AI citeert de oude naam met zekerheid.

**1.3 Oude prijzen 79/99 naast nieuwe 99/149.** Naast de tiles (99/149) staan 79/99 in de **GTC**
(`gtc.de.md:35`), in **alle 7 landings** (plan-card cluster, alle talen) en in `llms.txt:7`. De
entry "ab 35 CHF" is wél nog correct en hoeft niet te wijzigen.

**1.4 "Auf Anfrage" vs "ab"-prijzen voor diensten.** De tiles prijzen nu CRM ab 149, Kundenportal
ab 99, Business Portal ab 299, AI ab 99, Booking ab 39, Email 79, Automation 129, Google Ads 195
(`pricingTiles.ts:26-33`). Maar `llms.txt:8` zegt "scoped … and **quoted individually**",
`home.ts:200` FAQ zegt "**keinen festen Preis**", en `so-funktioniert.ts:125` zegt "auf Anfrage".
De keys `price.onRequest` ("Auf Anfrage") en `price.availQuote` zijn nu **dood** (PricingTiles
rendert ze niet). **Fix:** beslis of die diensten publiek "ab"-geprijsd zijn; reconcilieer
llms.txt, home-FAQ en de so-funktioniert-note; ruim de dode keys op.

**1.5 Google Ads 195 vs 200.** Tiles "195 CHF" (`pricingTiles.ts:28`) vs `googleAds.price`="200",
`gtc:35`, `llms.txt:10`, `plans.ts:33`. **1.6 Business Website "bis 15 Seiten"** (`plan.b.features`,
`llms.txt:7`) vs **"bis 10 Seiten"** (`pricingTiles.ts:23`). **1.7 "Software & Applications"** bestaat
nog als 4e plan in checkout (`plan.p.*`) + GTC, maar niet in de tiles; en `services.ts` labelt
`business-systems` als "Business Dashboards" terwijl de tile "Business Portal" heet. **1.8** De
privacy-verklaring noemt de verantwoordelijke "Amai!" (`privacy.de.md:10`) i.p.v. de entiteit
"Einzelfirma Tom de Vree".

> **DE/FR/EN-pariteit is in orde:** dezelfde (juiste én foute) waarden staan in alle drie de talen.
> Je kunt dus DE fixen en naar FR/EN spiegelen. Message-files staan op pariteit.

### C2 — Technical SEO (fundament sterk, polish)

- **Sitemap `lastmod` = build-tijd** (`sitemap.ts:58,66`): elke deploy stempelt ~100 URL's op
  "vandaag", ook zonder content-wijziging. Google negeert dan je freshness-signaal; AI-crawlers
  prioriteren her-fetch verkeerd. **Fix:** content-afgeleide datum voor statische pagina's
  (blogposts doen dit al goed via `post.date`).
- **3 page-families omzeilen de `pageMetadata`-helper** (`services/page.tsx`,
  `services/[service]/page.tsx:39-60`, `[landing]/page.tsx:38-59`) en handrollen
  canonical/hreflang/OG. Nu correct, maar dit zijn je hoogst-waardevolle SEO-pagina's en ze zullen
  driften (zeker bij een 4e taal). `[landing]` mist bovendien `og:url`. **Fix:** via
  `pageMetadata(...)` routeren.
- **Titellengte:** homepage-`<title>` (~62 tekens) en enkele landing-titels overschrijden ~60 en
  worden afgekapt in de SERP (en als AI-label). Budgetteer `title + " · amai.ch"` ≤ ~60.
- **Homepage `generateMetadata` geeft `{}`** terug voor een niet-gemapte locale (`page.tsx:34-35`)
  → zou canonical + description droppen. Onbereikbaar vandaag (middleware), maar fragiel; val terug
  op de message-titel.
- **Positief, geen actie:** robots/sitemap volledig + correct, `noindex` op checkout/payment/portal/
  styleguide, `?interest=`/`?plan=`-params collapsen naar de schone canonical, echte 404's
  (`dynamicParams=false` + `notFound()`), self-referencing canonical + `x-default→/de` overal.

### C3 — Schema / structured data

- **Aanwezig en sterk:** ProfessionalService (canonieke org `#organization`, `layout.tsx:89-125`,
  met PostalAddress, email, areaServed, founder, makesOffer[8], sameAs), WebSite, FAQPage (op home,
  /faq, services, so-funktioniert, landing), Service+Offer, BreadcrumbList (alle diepe pagina's),
  Blog+BlogPosting (author/datePublished/dateModified), AboutPage+Person (#founder), ItemList,
  ContactPoint. Eén `@id`-entitygraf — exemplarisch voor GEO.
- **Mist / zwak:**
  - **Geen `Review`/`AggregateRating`** terwijl er een zichtbare testimonial (`page.tsx:308-332`,
    SEMANU) en cases (`/referenzen`) zijn. *Hoogste schema-ROI.*
  - **Org mist `geo`, `openingHoursSpecification`, `telephone`** (`layout.tsx`). Beperkt local-pack/
    Maps en "near me"-AI-antwoorden voor een Bern-KMU. `priceRange:'from CHF 35'` is niet-standaard.
  - **Landing `Service.Offer` hardcodeert `price:'35'`** (`[landing]/page.tsx:108-118`) ongeacht het
    onderwerp → AI kan "35 CHF" citeren voor een CRM/automatisering-pagina.
  - **`BlogPosting.author` = "Tom"** (kale voornaam) i.p.v. de `#founder`-Person of "Tom de Vree".
  - **Service-LD op `/website-abos` serialiseert de tile-prijzen (99/149)** terwijl proza (llms.txt/
    GTC) 79/99 zegt → structured data en zichtbare/legale tekst spreken elkaar tegen.

### C4 — Headings, semantiek, a11y

- **Headings sterk:** precies één echte `<h1>` per template, logische h2/h3, geen "styled div als
  heading". `<h1 className="h2">` is een bewuste visuele keuze (geen fout).
- **Semantiek goed:** `<main id="main-content">` + skip-link (`SiteShell.tsx`), `<header>/<nav>/
  <footer>`, `<article>` (blog/cases/landing), `<figure>/<figcaption>`, `<dl>` voor contact, `<ol>`
  voor stappen/timeline. **Minor:** 3× `<nav>` zonder `aria-label` (Header desktop/mobiel + footer);
  geef ze "Hauptnavigation"/"Footernavigation".
- **A11y-gaten met SEO-impact:** formulierinputs zonder `aria-invalid`/`aria-describedby` naar de
  foutmelding (`ContactForm.tsx`, `FunnelForm.tsx`); interest-checkboxes zonder `fieldset/legend`;
  `<time>` zonder machine-leesbare `dateTime`; decoratieve `WhyWheel`-pie zonder `aria-hidden`
  (`WhyWheel.tsx:43`). Focus-visible + reduced-motion zijn wél netjes globaal geregeld.

### C5 — Images, rendering, performance

- **Rendering uitstekend (belangrijkste GEO-win):** geen enkele marketingpagina is `'use client'`;
  body-copy + JSON-LD staan in de server-HTML; `generateStaticParams` overal (SSG per locale).
- **Images:** site is grotendeels vector/CSS (sterk voor CWV). `PortfolioMarquee` gebruikt
  `next/image` correct. **Te fixen:** founder-photo (`about/page.tsx:81`) en blog-avatar
  (`blog/[slug]:133`) zijn raw `<img>` **zonder width/height** (CLS); blog-cover is de LCP en mist
  `fetchPriority="high"` (`:117`).
- **Performance:** self-hosted fonts met `display:swap`, GA4 consent-gated `afterInteractive`,
  reduced-motion globaal. **Minor:** Archivo laadt 6 gewichten — trim de ongebruikte.

### C6 — GEO / AI-vindbaarheid

- **Sterk:** citeerbare entity-zin (`serviceUi.entityLine`: *"amai! ist ein digitaler Partner aus
  Bern für Schweizer KMU: Websites, Kundenportale, CRM Systeme, Automatisierungen, Dashboards und AI
  Lösungen in einem klaren Monatsabo."*), `public/llms.txt`, per-service definities ("Was ist ein
  CRM/Kundenportal?"), FAQPage-schema, 2 concrete cases (SEMANU-portaal + 3D-configurator), 1
  testimonial.
- **Zwak:** stale feiten in llms.txt/GTC/landings vergiftigen de citeerbaarheid (AI citeert 79/99 en
  "Starter"); weinig concrete cijfers; geen vergelijkings-/kosten-/how-to-pagina's; slechts 1
  testimonial; de nieuwe prijzen staan in geen enkele extractbare Q&A; de entity-zin staat alleen in
  `serviceUi`/so-funktioniert, niet als zichtbare body-copy op Home/About/Services.

---

## D. Quick wins (1-3 dagen)

1. **Checkout-prijs fixen:** `plan.b.price`=`99 CHF`, `plan.w.price`=`149 CHF` (3 talen). *(contradictie #1)*
2. **"Starter" → "Beginner"** in `guideStarter` (3×) + `llms.txt`. *(#2)*
3. **Prijzen 79/99 → 99/149** in `llms.txt` + de 7 landingspagina's (entry 35 blijft). *(#3)*
4. **Google Ads → één bedrag** (195 of 200) in tiles, `googleAds.price`, llms.txt, `plans.ts`. *(#5)*
5. **Business Website 10 vs 15 Seiten** unificeren. *(#6)*
6. **home-FAQ "keinen festen Preis"** vervangen door de "ab 99/ab 149"-realiteit. *(#4)*
7. **Dode keys** `price.onRequest` + `price.availQuote` verwijderen (3 talen).
8. **`Review`-schema** op de homepage-testimonial (data staat er al). *(sectie G)*
9. **width/height** op founder-photo + blog-avatar; `fetchPriority="high"` op blog-cover.
10. **3× `<nav>` `aria-label`** + `aria-hidden` op de WhyWheel-pie + `dateTime` op `<time>`.
11. **`aria-invalid`/`aria-describedby` + `fieldset/legend`** in ContactForm/FunnelForm.
12. **Sitemap `lastmod`** koppelen aan een content-datum i.p.v. build-tijd.

## E. Structurele verbeteringen (meer planning)

- **Eén prijs-bron + sync-discipline.** Maak `pricingTiles.ts` + `plans.ts` de enige bron en leid
  GTC/landings/llms.txt/checkout daaruit af, óf houd een expliciete checklist + een kleine test die
  faalt als prijzen uiteenlopen (bv. een script dat tile-prijzen vergelijkt met `plans.ts`).
- **GTC juridisch bijwerken** (naam Beginner, prijzen 99/149, plan-set). Een bindend document met
  oude prijzen is een risico.
- **Plan-set en portal-naamgeving unificeren** ("Software & Applications" behouden of schrappen;
  "Business Portal" vs "Business Dashboards"). *(#7)*
- **3 page-families via `pageMetadata`-helper** routeren (services, service-detail, landing).
- **Schema-architectuur:** LocalBusiness completeren (geo/uren/telefoon), Review/AggregateRating
  sitewide, landing-Offers uit content, `BlogPosting.author` → `#founder`.
- **FAQ-architectuur:** de FAQ uitbreiden (sectie F) en de antwoorden uit één bron voeden zodat ze
  niet opnieuw kunnen driften t.o.v. de prijzen.
- **GEO-content:** vergelijkings-/kosten-/how-to-pagina's (sectie F) + meer testimonials/cijfers.

## F. Aanbevolen nieuwe of verbeterde pagina's

| Pagina-idee | Zoekintentie | Doelzoekwoorden/entities | GEO-doel (welke AI-vraag) | Aanbevolen structuur |
|---|---|---|---|---|
| **Prijzen-/kosten-gids** (uitbreiding `/website-abos` of aparte `/preise`) | transactioneel/kost | "wat kost een website Zwitserland", "website abo prijs", "kosten CRM KMU" | "Wat kost een website/CRM bij amai?" | Definitie + prijstabel (plain text) + FAQ + Offer-schema |
| **Vergelijking: abonnement vs klassiek bureau/freelancer** | commercieel onderzoek | "amai vs bureau", "website abonnement vs eenmalig", "alternatief Webflow agency" | "Is een website-abo beter dan een eenmalig project?" | Vergelijkingstabel + voor/nadelen + wanneer-wel/niet |
| **Standalone how-to** (bestaat als sectie in so-funktioniert) | informationeel | "hoe laat ik een website maken", "website laten bouwen stappen" | "Hoe verloopt een website-project?" | HowTo-schema + 5 stappen + tijdlijn + wat-heb-je-nodig |
| **Lokale landingspagina's per regio** (Bern, Zürich, …) | lokaal | "webdesign Bern", "website KMU Zürich" | "Beste webbureau in [stad]" | LocalBusiness + regiotekst + cases + NAP |
| **Cases met citeerbare one-liner** (verbeter `/referenzen`) | bewijs/trust | "amai referenties", "[klant] website" | "Kan amai dit aantonen?" | CaseStudy: klant, probleem, oplossing, resultaat (cijfer) |
| **"Voor wie" sectorpagina's** (praktijken, lokale dienstverleners, webshops) | segment-intent | "website voor [sector] Schweiz" | "Beste oplossing voor [sector]" | Sector-pijnpunten + relevante diensten + case |
| **Glossarium / definities** (CRM, Kundenportal, Automatisierung, GEO) | informationeel | "wat is een CRM systeem" | extractieve AI-definitie | Korte definitie-blokken + DefinedTerm-schema |

## G. Schema-aanbevelingen (concrete JSON-LD)

**G1 — LocalBusiness completeren** (toevoegen aan de org-node, `layout.tsx:89-125`):

```jsonc
{
  "@type": "ProfessionalService",
  "@id": "https://amai.ch/#organization",
  "name": "amai!",
  "legalName": "Einzelfirma Tom de Vree",
  "telephone": "+41 ...",                         // toevoegen (Google prefereert een nummer)
  "address": { "@type": "PostalAddress", "streetAddress": "Wylerstrasse 75",
    "postalCode": "3000", "addressLocality": "Bern", "addressCountry": "CH" },
  "geo": { "@type": "GeoCoordinates", "latitude": 46.96, "longitude": 7.45 },
  "openingHoursSpecification": [{ "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    "opens": "09:00", "closes": "17:00" }],
  "priceRange": "CHF"                              // i.p.v. "from CHF 35" (niet-standaard)
}
```

**G2 — Review op de zichtbare testimonial** (homepage, data staat al in `page.tsx:308-332`):

```jsonc
{ "@context": "https://schema.org", "@type": "Review",
  "itemReviewed": { "@id": "https://amai.ch/#organization" },
  "author": { "@type": "Organization", "name": "SEMANU" },
  "reviewBody": "…de bestaande citaattekst…",
  "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" } }
```
En, zodra er meerdere reviews zijn, een `AggregateRating` op de org-node.

**G3 — Landing-Offer correct maken** (`[landing]/page.tsx:108-118`): laat de `price` uit de
landing-content komen of laat de `Offer.price` weg op generieke landings; hardcode geen "35".

**G4 — `BlogPosting.author` → entity** (`blog/[slug]/page.tsx:80`): `"author": { "@id":
"https://amai.ch/#founder" }` i.p.v. `{ "name": "Tom" }`.

## H. GEO-contentvoorbeelden (citeerbaar)

**H1 — Sterke definitie bovenaan een servicepagina (CRM):**
> Een CRM van amai! geeft elke lead en klant één centraal dossier: pipeline, volgende stap en
> automatische follow up. Vanaf 149 CHF per maand, op maat van uw KMU, gehost in de EU. Onderdeel
> van uw digitale aufstelling bij amai!, een digitale partner uit Bern.

**H2 — "Waarom amai?" (kort, feitelijk, geen marketingruis):**
> Eén partner in plaats van losse leveranciers. Eén helder maandbedrag dat design, hosting,
> onderhoud, security en SEO-basis bundelt. Start binnen 5 werkdagen. Sneller en kostenefficiënter
> dan een klassiek bureau omdat we met AI bouwen, zonder in te boeten op kwaliteit. Gevestigd in
> Bern, actief in heel Zwitserland, in het Duits, Frans en Engels.

**H3 — FAQ-blok (de ontbrekende contract-economie + prijzen):**
> **Wat kost een website bij amai?** Beginner ab 35, Business ab 99, Webshop ab 149 CHF per maand,
> exkl. 8,1% MWST. Hosting, onderhoud en SEO-basis zijn inbegrepen.
> **Valt er een kost aan bij beëindiging?** Ja, een administratieve kost van CHF 190 (excl. BTW) voor
> dossieroverdracht en afsluiting. Bij vroege opzeg blijven de resterende maandfees tot eind maand 36
> verschuldigd.
> **Bekom ik design en code?** Ja, eigendom gaat over na de minimumtermijn (36 maanden) en volledige
> betaling. Uw content en domein zijn altijd van u.
> **Waar staan mijn data?** In de EU (Supabase, Cloudflare). Stripe voor betalingen.

**H4 — Case-/bewijsblok (per case, citeerbare one-liner):**
> **SEMANU** — amai! bouwde een klantportaal en een intern ops-systeem dat documenten, status en
> taken centraliseert. Resultaat: [concreet cijfer/uitkomst].

**H5 — AI-citeerbare bedrijfssamenvatting** (op Home + About als zichtbare tekst, niet enkel in JSON):
> amai! (Einzelfirma Tom de Vree) is een AI-first digitale partner uit Bern voor Zwitserse KMU. Het
> bouwt en onderhoudt websites, klantportalen, CRM systemen, automatiseringen, dashboards en AI
> oplossingen op een helder maandabonnement vanaf 35 CHF, in het Duits, Frans en Engels.

## I. Implementatie-roadmap

**Week 1 — stop de bloeding (contradicties + checkout).**
Checkout-prijs fixen (#1); 79/99→99/149 + Starter→Beginner in llms.txt, landings, `plan`-namespace,
GTC (#2,#3); Google Ads + pagina-aantal unificeren (#5,#6); home-FAQ-prijsantwoord corrigeren;
dode keys opruimen. → AI en bezoekers krijgen weer consistente feiten.

**Week 2-4 — schema + FAQ + quick a11y/perf.**
Review-schema + LocalBusiness-velden + landing-Offer-fix + BlogPosting-author (sectie G); FAQ
uitbreiden met contract-economie + prijzen (sectie F/H) met FAQPage-markup; a11y-form-fixes,
nav-labels, img-dimensies, sitemap-lastmod, titellengtes; 3 page-families via de helper.

**Maand 2-3 — GEO-content + architectuur.**
Kosten-/vergelijkings-/how-to-pagina's (sectie F); cases met citeerbare one-liners + 2-3 extra
testimonials; entity-zin als zichtbare body-copy op Home/About/Services; glossarium; sync-discipline
voor prijzen (test/checklist).

**Later — uitbreiding.**
Lokale regiopagina's (Bern/Zürich/…), sectorpagina's, per-flow OG-images, meer cijfers/proof,
eventueel HowTo/CaseStudy/DefinedTerm-schema.

## J. Vragen / ontbrekende informatie

Voor een nóg scherpere audit + prioritering ontbreekt:
1. **Google Search Console** (impressies, posities, CTR, dekking, "Pages"-rapport, hreflang-fouten).
2. **Analytics** (welke pagina's converteren, verkeersbronnen, AI-referrals).
3. **Rankings + concurrenten** (voor welke termen wil je ranken; wie zijn de top-3 in CH per dienst).
4. **Definitieve prijslijst** (zijn 99/149 en de dienst-"ab"-prijzen finaal en publiek? blijft
   "Software & Applications" bestaan? Google Ads 195 of 200?).
5. **Telefoonnummer + exacte postcode/geo** (3000 generiek of 3014; lat/long) en **openingstijden**
   voor LocalBusiness.
6. **Bevestiging GTC-update** (mag ik de GTC-prijzen/namen bijwerken, of doet de jurist dat?).
7. **Reviews/cases** (mag ik de SEMANU-quote als Review markeren; zijn er meer testimonials + concrete
   resultaatcijfers per case?).
8. **Backlink-profiel + serverlogs** (voor autoriteit + crawlbudget-analyse).
