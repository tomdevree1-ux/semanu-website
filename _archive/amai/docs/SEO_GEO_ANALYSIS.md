# SEO en GEO analyse — amai.ch

Datum: 11 juni 2026
Scope: technische SEO, on-page en content, lokale SEO en GEO (Generative Engine
Optimization, dus vindbaarheid in AI-antwoordmachines zoals ChatGPT, Claude,
Perplexity en Google AI Overviews). Gebaseerd op de werkelijke codebase plus de
live `robots.txt`.

---

## 1. Samenvatting

amai.ch heeft een **uitzonderlijk sterke technische SEO-basis** voor een site van
deze grootte: server-side gerenderd (Next.js), rijke structured data, een correcte
sitemap, nette hreflang voor 3 talen, schone noindex-hygiëne en zelfs een
`llms.txt`. Dat is beter geregeld dan bij de meeste KMU-sites.

Er zijn echter **twee kritieke problemen die je GEO-doel rechtstreeks ondermijnen**,
plus een reeks gemiste kansen rond content en lokale SEO.

Topprioriteiten:

1. **(P0, GEO-blocker) AI-crawlers worden geblokkeerd.** De live `robots.txt`
   (beheerd door Cloudflare) zet `ai-train=no` en blokkeert expliciet GPTBot,
   ClaudeBot, Google-Extended, CCBot, Applebot-Extended, Bytespider, Amazonbot en
   meta-externalagent. Zolang dit aanstaat kunnen AI-antwoordmachines je site niet
   crawlen of als bron gebruiken. GEO is daardoor nu vrijwel onmogelijk, en je
   `llms.txt` heeft geen effect.
2. **(P0) `llms.txt` bevat verkeerde feiten.** Verkeerde juridische entiteit
   (Amai GmbH ipv Einzelfirma Tom de Vree), verouderde prijzen (49/99/950 ipv
   25/79/99/750), verkeerde minimumtermijn (24 ipv 36 maanden) en verdwenen
   pakketten (Premium ipv Webshop en Software). Dit is precies het bestand dat AI
   leest, dus het voedt onjuiste antwoorden over je merk.
3. **(P1) Content is te dun.** Eén blogartikel. Content is de grootste hefboom voor
   zowel klassieke ranking als voor citaties in AI-antwoorden.
4. **(P1) Lokale SEO onderbenut.** Organization ipv LocalBusiness, geen
   telefoonnummer, geen Google Business Profile-signalen, hreflang `de` ipv `de-CH`.

---

## 2. Wat al sterk is

- **Server-side rendering / SSG (Next.js App Router).** Volledige HTML met meta en
  structured data wordt server-side geleverd, dus crawlers en AI-bots krijgen echte
  content (geen lege JavaScript-shell). Dit is de belangrijkste technische
  randvoorwaarde en is in orde.
- **Rijke structured data (JSON-LD).** Aanwezig: Organization, WebSite, Service met
  Offers en prijzen, FAQPage met Question/Answer, BlogPosting met auteur,
  BreadcrumbList (referenzen en blog), ItemList, PostalAddress en ContactPoint. Dit
  is uitstekend voor rich results én voor extractie door AI.
- **Sitemap (`src/app/sitemap.ts`).** Genereert alle indexeerbare paden × 3 talen,
  inclusief de 7 landingspagina's en blogposts, met priority (home 1.0) en
  changeFrequency. Correct.
- **Noindex-hygiëne.** Transactionele en private pagina's (checkout, checkout/success,
  admin, portal, styleguide) staan correct op `noindex`. Geen indexvervuiling.
- **hreflang en canonical.** De layout zet `alternates.languages` voor de/fr/en plus
  `x-default` naar /de, en canonicals per locale. Goed opgezet voor meertaligheid.
- **Programmatische SEO-landingspagina's.** 7 keyword-gerichte pagina's
  (website-erstellen-lassen-schweiz, webdesign-kmu-schweiz, website-abo-schweiz,
  website-betreuung-schweiz, website-fuer-lokale-unternehmen,
  website-fuer-selbstaendige, seo-basis-fuer-kmu). Sterke aanpak voor Zwitserse
  zoektermen.
- **Performance.** Zelf-gehoste fonts via next/font (display swap), next/image
  (lazy, responsive srcset), geen grote LCP-afbeelding in de hero (tekst-hero). Goede
  uitgangspositie voor Core Web Vitals.
- **Privacy correct.** Consent-gated GA4 (laadt pas na cookie-toestemming), wat past
  bij Zwitserse en EU-regels.

---

## 3. Technische SEO

### Crawlability en indexering
- De app-`robots.ts` staat alles toe behalve /styleguide en /api, en verwijst naar de
  sitemap. **Maar de live `robots.txt` wordt overschreven door Cloudflare** (zie de
  "Cloudflare Managed content"-blokken). Gevolg: jouw `Sitemap:`-regel staat NIET in
  de live robots.txt, en de AI-blokkades zijn toegevoegd. Dien je sitemap daarom
  zeker handmatig in via Google Search Console en Bing Webmaster Tools.
- Indexeerbare structuur is verder schoon.

### Structured data — verfijningen
- **Organization is geen LocalBusiness.** Voor een lokaal Zwitsers bedrijf is een
  `LocalBusiness` of `ProfessionalService` (subtype) met `address`, `geo`
  (coördinaten), `telephone`, `priceRange` en eventueel `openingHoursSpecification`
  sterker voor lokale rich results.
- **Geen Review/AggregateRating.** Je hebt een testimonial (SEMANU) op de site, maar
  die is niet als `Review` gemarkeerd. Echte reviews met `AggregateRating` geven
  sterren in de SERP en zijn een sterk vertrouwens- en GEO-signaal (alleen gebruiken
  als ze authentiek en verifieerbaar zijn).
- **Geen telefoonnummer in de NAP.** Alleen e-mail. Voeg een telefoonnummer toe aan
  Organization/ContactPoint voor lokaal vertrouwen.

### Performance / Core Web Vitals
- Sterk uitgangspunt. Aandachtspunt: de portfolio-marquee rendert 12 tegels (3 kopieën
  van 4) met afbeeldingen. Ze zijn lazy-loaded, maar zorg dat de bronafbeeldingen
  geoptimaliseerd zijn (de NORA-screenshot is bv. ~1,5 MB; comprimeer naar < 300 KB).
- Controleer in PageSpeed Insights de echte veld-CWV per sjabloon (home, pricing,
  landing, blog).

---

## 4. On-page en content

- **Titels en descriptions.** Uniek per pagina en per taal, goede lengte. De nieuwe
  homepage-title ("Website erstellen lassen Schweiz | amai! — ab 25 CHF/Monat") is
  keyword-sterk. Let op: die geldt nu alleen voor /de; /fr en /en houden hun eigen
  titel (correct).
- **Koppenstructuur.** Eén duidelijke H1 per pagina, logische H2/H3. In orde.
- **Content-diepte is het grootste gat.** Slechts 1 blogartikel
  (`warum-website-abo`). Voor ranking op informatieve zoektermen (en voor AI-citaties)
  heb je een bredere contentlaag nodig. Onderwerpen die passen: "wat kost een website
  in Zwitserland", "website abo vs eenmalig project", "webdesign voor KMU",
  "SEO basis voor lokale bedrijven", "Wordpress vs maatwerk", per branche, etc.
- **Landingspagina's: vermijd thin/duplicate.** De 7 pagina's delen structuur. Zorg
  dat elke pagina substantieel unieke tekst, voorbeelden en interne links heeft, anders
  ziet Google ze als bijna-duplicaten.
- **Interne links.** Teasers en footer linken naar de landingspagina's; goed. Voeg
  contextuele links toe vanuit blogartikelen naar pricing, FAQ en landingspagina's.
- **Afbeeldingen.** Portfoliotegels gebruiken `alt`. Zorg dat alle content-afbeeldingen
  beschrijvende, keyword-relevante alt-teksten hebben (decoratieve mogen `aria-hidden`).

---

## 5. Lokale / geografische SEO

- **Zwitserland-targeting is aanwezig** (areaServed CH, Bern-adres, Duitstalige
  content), maar onderbenut.
- **hreflang `de`/`fr`/`en` ipv `de-CH`/`fr-CH`.** Voor een puur Zwitserse markt
  signaleert `de-CH` en `fr-CH` explicieter de regio. Overweeg dit (met behoud van
  een generieke fallback).
- **Google Business Profile.** Niet zichtbaar in de code (off-site). Voor lokale
  vindbaarheid (Maps, lokale pack) is een geverifieerd GBP met categorie
  "Websitedesigner", adres, telefoon, foto's en reviews een van de sterkste hefbomen.
- **NAP-consistentie.** Zorg dat naam, adres en (nieuw toe te voegen) telefoon
  identiek zijn op de site, in de schema, in GBP en in Zwitserse directories
  (local.ch, search.ch, moneyhouse, etc.). Nu staat in `llms.txt` zelfs een verkeerde
  bedrijfsnaam (zie §7).
- **Lokale landingspagina's per stad.** Overweeg pagina's als "Webdesign Bern",
  "Website erstellen lassen Zürich" als je meerdere regio's wil bedienen.

---

## 6. GEO — Generative Engine Optimization

GEO = zorgen dat AI-antwoordmachines (ChatGPT, Claude, Perplexity, Gemini/Google AI
Overviews, Copilot) je merk correct vermelden en als bron citeren.

### 6.1 Kritieke blocker: AI-crawlers zijn geblokkeerd
De live `robots.txt` (Cloudflare-beheerd) bevat:

```
Content-Signal: search=yes, ai-train=no
User-agent: GPTBot        Disallow: /
User-agent: ClaudeBot     Disallow: /
User-agent: Google-Extended Disallow: /
User-agent: CCBot         Disallow: /
User-agent: Applebot-Extended Disallow: /
User-agent: Bytespider / Amazonbot / meta-externalagent  Disallow: /
```

Dit is waarschijnlijk de Cloudflare-instelling "AI bots blokkeren" / "AI Audit". Het
betekent dat OpenAI (GPTBot), Anthropic (ClaudeBot), Google (Google-Extended, dat
grounding voor Gemini en AI Overviews stuurt), Common Crawl (CCBot, een bron voor veel
modellen), Apple, ByteDance en Meta je site **niet mogen ophalen voor AI-doeleinden**.

Gevolg: GEO is op dit moment grotendeels onmogelijk, en je `llms.txt` wordt door deze
bots niet eens opgehaald.

**Beslissing die jij moet nemen:** wil je in AI-antwoorden verschijnen, dan moet je de
AI-crawlers (minstens GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot,
Applebot-Extended) toelaten. Dat doe je in het Cloudflare-dashboard
(Security / Bots / AI Scrapers and Crawlers, of de "Manage robots.txt"/AI Audit
instelling) — niet in de app-code, want Cloudflare overschrijft die. Wil je je content
juist beschermen tegen AI-training maar wél in antwoorden verschijnen, dan is dat een
nuance: "ai-train=no" mag, maar de bots die voor real-time antwoorden ophalen
(grounding) moet je dan toelaten.

### 6.2 `llms.txt` staat er, maar met foute feiten
Goed dat het bestaat. Maar de inhoud is verouderd en deels onjuist (zie §7). Zodra de
crawlers weer mogen, voedt dit bestand foute informatie aan AI. Dit moet eerst correct.

### 6.3 Wat al goed is voor GEO
- Structured data (FAQPage, Service met prijzen, Organization) maakt feiten
  machine-leesbaar en goed citeerbaar.
- Heldere, feitelijke content (prijzen, proces, FAQ) is precies wat AI graag extraheert.

### 6.4 GEO-versterkers (zodra crawlers open zijn)
- **Antwoord-eerst schrijven.** Begin secties met een kort, direct antwoord
  (definitie, prijs, ja/nee), dan de uitleg. AI citeert graag beknopte, feitelijke
  passages.
- **FAQ uitbreiden** met de echte vragen die mensen stellen ("Wat kost een website in
  Zwitserland?", "Wat is een website abo?", "Hoe lang duurt het?"). Elke vraag is een
  potentiële AI-citatie.
- **Entiteitsconsistentie.** Zorg dat bedrijfsnaam, prijzen en feiten exact gelijk zijn
  op de site, in de schema, in `llms.txt` en op externe bronnen. AI combineert bronnen;
  tegenstrijdigheden (zoals nu) verzwakken het vertrouwen.
- **Off-site vermeldingen.** AI-antwoorden leunen op autoriteit van derden. Vermeldingen
  in Zwitserse directories, vakmedia en reviews vergroten de kans op citatie.
- **Versheid.** Datums en een actuele blog helpen AI je als actuele bron te zien.

---

## 7. Kritieke data-inconsistenties (oplossen voor SEO én GEO)

Eén feit hoort één waarde te hebben op de hele site. Nu wijken `llms.txt` en de GTC af
van de live prijspagina:

| Feit | Live site (correct) | `llms.txt` | GTC |
|---|---|---|---|
| Juridische entiteit | Einzelfirma Tom de Vree | **Amai GmbH** (fout) | Einzelfirma Tom de Vree |
| Starter | 25 CHF/mnd | **49** | 25 (net gecorrigeerd) |
| Business | 79 CHF/mnd | **99** | 79 |
| Pakketten | Starter, Business, Webshop, Software | **Premium** (verouderd) | Starter, Business, Webshop, Software |
| Logo add-on | 750 CHF | **950** | 750 |
| Minimumtermijn | n.v.t. op site | **24 maanden** | **36 maanden** |

Aandachtspunten:
- `llms.txt` is volledig verouderd en noemt een verkeerde bedrijfsnaam. Hoge prioriteit.
- De minimumtermijn verschilt: GTC zegt 36 maanden, `llms.txt` zegt 24. Bepaal de juiste
  waarde en maak die overal gelijk (dit is ook contractueel belangrijk).

---

## 8. Actieplan (geprioriteerd)

### P0 — kritiek, deze week
1. **Beslis je AI-crawlerbeleid** en pas het aan in Cloudflare. Wil je GEO, laat dan
   GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot en Applebot-Extended toe.
2. **Herschrijf `llms.txt`** met de juiste entiteit (Einzelfirma Tom de Vree), de
   actuele prijzen (Starter 25, Business 79, Webshop 99, Software ab 99, Logo 750,
   Google Ads ab 200) en de juiste minimumtermijn. Houd dit voortaan in sync met de
   prijspagina en GTC.
3. **Los de minimumtermijn-tegenstrijdigheid op** (24 vs 36 maanden).

### P1 — hoog, deze maand
4. **Contentplan voor de blog**: start met 6 tot 10 artikelen rond kosten, proces,
   vergelijkingen en branches. Antwoord-eerst geschreven, met interne links.
5. **Upgrade naar LocalBusiness/ProfessionalService schema** met telefoon, geo en
   priceRange; voeg een telefoonnummer toe aan de site.
6. **Maak (of optimaliseer) een Google Business Profile** en zorg voor NAP-consistentie
   in Zwitserse directories.
7. **Dien de sitemap in** via Search Console en Bing, want Cloudflare verbergt de
   `Sitemap:`-regel in robots.txt.

### P2 — medium
8. **Differentieer de 7 landingspagina's** zodat elk uniek en substantieel is.
9. **Overweeg `de-CH`/`fr-CH` hreflang** voor scherpere Zwitserse targeting.
10. **Voeg echte reviews toe** met AggregateRating (alleen indien authentiek).
11. **Comprimeer zware afbeeldingen** (o.a. de NORA-screenshot) en hercheck CWV.
12. **Stadsspecifieke landingspagina's** als je meerdere regio's wil bedienen.

---

## 9. Eindconclusie

Technisch zit amai.ch in de top: de fundering (SSR, structured data, sitemap, hreflang,
noindex, performance) is beter dan bij de meeste concurrenten. De winst zit nu in drie
dingen: (1) **de AI-crawlers deblokkeren** als je echt in AI-antwoorden wil verschijnen,
(2) **de feiten overal kloppend en consistent maken** (vooral `llms.txt`), en
(3) **contentdiepte opbouwen**. Punt 1 en 2 zijn snel te regelen en hebben direct
GEO-impact; punt 3 is de lange-termijn motor voor zowel klassieke als generatieve
vindbaarheid.
