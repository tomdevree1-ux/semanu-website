# SEO & GEO audit — amai.ch

Datum: 26 juni 2026 · na de diensten/prijzen-pivot · Cloudflare purge uitgevoerd
Scope: live site (DE/FR/EN) + de codebase als bron. Wat live geverifieerd is staat gemarkeerd met ✅live.

---

## Samenvatting

De technische basis is sterk en boven het niveau van de meeste KMU-sites: schone canonicals, volledige hreflang (de/fr/en/x-default) in head én sitemap, één centrale Organization-entiteit, BreadcrumbList + Service + FAQPage JSON-LD op de dienstpagina's, 301-redirects die werken, en een snel-renderende stack (self-hosted fonts, AVIF/WebP, Cloudflare CDN, statische prerender). De pivot is correct doorgevoerd: 6 diensten, geen prijzen in titels, Beginner weg.

De grootste kansen zitten niet in techniek maar in **entiteit-consistentie voor AI (GEO)**, **lokale SEO (NAP/telefoon)** en **keyword-dekking die door de pivot is weggevallen** (de oude /services/crm en /services/customer-portals pagina's redirecten nu naar één umbrella-pagina, waardoor de specifieke zoekintenties "CRM Schweiz" en "Kundenportal erstellen" minder gericht worden afgedekt).

Eindoordeel: techniek 8.5/10, metadata 8/10, structured data 8/10, on-page 8/10, GEO 7/10 (na de fix hieronder), lokaal 6/10, content/dekking 6.5/10.

---

## Kritieke bevindingen

Geen écht gebroken zaken (geen 5xx, geen noindex op belangrijke pagina's, geen kapotte canonicals). Wel één inhoudsfout die ik meteen heb gecorrigeerd:

1. **Verouderde entiteit-zin op elke dienstpagina (GEO) — OPGELOST.** Onderaan elke /services-pagina staat een crawlbare "entity summary" die expliciet voor AI-extractie is bedoeld. Die somde nog de oude taxonomie op: ✅live zag ik *"…Websites, Kundenportale, CRM Systeme, Automatisierungen, Dashboards und AI Lösungen…"*. Ik heb `serviceUi.entityLine` (DE/FR/EN) aangepast naar de nieuwe offering (*"…Websites, digitale Plattformen, Consultancy, Automatisierungen und AI Lösungen…"*). Moet nog mee-deployen (zie onderaan).

---

## Snelle wins met hoge impact

1. **Telefoonnummer toevoegen aan Organization-schema + footer (NAP).** Het schema heeft `email` maar geen `telephone`; de footer toont enkel "Bern, Schweiz" en het mailadres. Voor lokale SEO is een consistente NAP (Naam/Adres/Telefoon) belangrijk. Zodra het aangevraagde nummer er is: één veld in `layout.tsx` + één regel in de footer.
2. **Homepage-body uitlijnen op de umbrella-naamgeving.** ✅live somt de homepage-tekst nog "CRM, Dashboards, Kundenportale" op als losse zaken (intro, probleem, oplossing, stap 2), terwijl het menu "Digitale Plattformen" toont. Voor entiteit-helderheid (en consistentie die AI oppikt) die enumeraties bijwerken naar "digitale Plattformen (Dashboards, CRM, Kundenportale)".
3. **Pagina-specifieke `og:image:alt`.** `pageMetadata` zet voor élke pagina dezelfde alt ("amai! · Digitaler Partner für Schweizer KMU"). Maak die gelijk aan de paginatitel (1 regel code) voor betere toegankelijkheid en context.
4. **Sitemap.xml laadtijd verifiëren.** Mijn fetch van `https://amai.ch/sitemap.xml` liep in een time-out (>180s). Kan een edge/cold-start zijn, maar controleer dat de sitemap snel en cachebaar serveert (hij leest blogposts bij generatie). Een trage sitemap vertraagt crawl-discovery.

---

## 1. Technische SEO

- **Indexeerbaarheid/crawl:** `robots.ts` → `allow: '/'`, `disallow: ['/*/styleguide','/api/','/app/']`, sitemap gelinkt. Portaal (`/app`) krijgt ook `X-Robots-Tag: noindex` via headers. ✅ correct.
- **Sitemap:** alle indexeerbare paden + de 6 dienst-slugs + 7 landingspagina's + blog, met hreflang-alternates per entry, `lastModified` en `priority` (home 1.0, landings 0.8, rest 0.7, blog 0.5). De dienst-slugs komen uit `SERVICE_SLUGS` → automatisch nu 6 (geen crm/customer-portals/booking-appointment meer). ✅ correct in code; **laadtijd live verifiëren**.
- **Canonicals:** elke pagina self-referencing via `localizedAlternates`/`pageMetadata`. ✅live homepage `canonical: https://amai.ch/de`, business-systems `…/services/business-systems`.
- **Redirects/404:** ✅live `/de/services/crm` → **301** → `/de/services/business-systems` (canonical klopt mee). De drie retired URLs (crm, customer-portals, booking-appointment) zijn afgevangen. Goed.
- **Hreflang:** de/fr/en + x-default(=de), zowel in `<head>` (via `alternates.languages`) als in de sitemap. De helper voorkomt de klassieke bug waarbij een eigen canonical de layout-hreflang overschrijft. ✅ sterk.
- **URL-structuur:** schoon en sprekend (`/[locale]/services/[slug]`, gehyphende slugs). ✅
- **Interne links:** footer (diensten + bedrijf + thema's/landings + gratis tools), megamenu, "Verwandte Leistungen" op dienstpagina's, breadcrumbs. ✅live de business-systems-pagina linkt naar AI Assistenten + Consultancy. Dichte, logische interne linkstructuur.
- **Duplicate content:** de 3 talen worden door canonical + hreflang correct als alternates behandeld. ✅
- **Snelheid/Core Web Vitals:** niet meetbaar binnen deze audit. Stack is gunstig: `next/font` (self-hosted, `display: swap`), `next/image` met AVIF/WebP, Cloudflare CDN, statische prerender van alle locales. **Aanbeveling:** draai PageSpeed Insights op homepage + één dienstpagina + één landing en bewaak LCP/CLS/INP.
- **Mobiel:** mobile-first (Tailwind, responsive componenten zoals de mobiele variant van de services-ecosystem). ✅ (visueel te bevestigen met het mobiele PSI-rapport.)

## 2. Metadata & social previews

- **Title tags:** ✅live homepage `amai! · Digitaler Partner für Schweizer KMU` (geen prijs meer, ~43 tekens — ideaal). Dienstpagina `Digitale Plattformen für Schweizer KMU · amai.ch` (~48 tekens). Lengtes goed binnen ~60.
- **Meta descriptions:** ✅live ~150 tekens, beschrijvend, met de nieuwe offering en zonder prijs-anker. Goed.
- **Open Graph:** ✅live `og:title/description/url/type`, `og:image https://amai.ch/og.png?v=2` met `width 1200 / height 630 / alt`. `pageMetadata` houdt title = og:title = twitter:title in lockstep. ✅ sterk.
- **Twitter/X cards:** `summary_large_image` met title/description/image. Geen `twitter:site`/`creator` handle (amai zit op Instagram, niet duidelijk op X) — laag belang.
- **Social image:** één gedeelde `og.png` voor de hele site. Werkt, maar **pagina-specifieke OG-beelden** (zeker per dienst) verhogen de CTR van shares.
- **Verbeterpunt:** `og:image:alt` is overal de generieke merkregel → maak paginagebonden (zie code-voorbeeld).

## 3. Structured data / Schema

Aanwezig en netjes opgebouwd:

- **Organization / ProfessionalService** (layout, één centrale `@id` `#organization`): name, legalName (Einzelfirma Tom de Vree), founder, logo, image, description (bijgewerkt), email, `areaServed: ['CH','Bern','Canton of Bern']`, `knowsAbout` (8, bijgewerkt), `makesOffer` (7, bijgewerkt), `sameAs` (Instagram + Google), `address` (Wylerstrasse 75, 3000 Bern, CH), `geo`, `openingHoursSpecification`. `priceRange` is verwijderd (past bij de premium-lijn). ✅
- **WebPage** (homepage) + **FAQPage** (homepage-FAQ). ✅live
- **BreadcrumbList + Service + FAQPage** op elke dienstpagina (3 JSON-LD blokken). ✅ in code.
- **Article/BlogPosting** op blogposts (headline/description/name) — **completeness verifiëren** (zie aanbeveling).

Bevindingen:
- **Ontbreekt: `telephone`** op de Organization (NAP) → toevoegen.
- **Service-schema is minimaal:** name/description/serviceType/provider/areaServed/url. Prima, maar je kunt `areaServed` als object (`{ '@type':'Country','name':'CH' }`) zetten en voor de geprijsde diensten een `offers` toevoegen. Optioneel.
- **BreadcrumbList** zit alleen op dienstpagina's; overweeg ook op blog/legal/landings.
- **Valideer** na deploy met de Rich Results Test + Schema.org validator (Organization, FAQPage, Service, Breadcrumb) — verwacht 0 fouten.

## 4. On-page SEO

- **Headings:** ✅live precies één `<h1>` per pagina (homepage "Ein Partner für alles Digitale.", dienst "Ihre Dashboards, CRM und Kundenportale in einer verbundenen Plattform."), daarna logische H2/H3. Goede hiërarchie.
- **Keywordfocus & intentie:** dienstpagina's zijn diep en goed getarget ("Digitale Plattformen für Schweizer KMU", probleem→oplossing→proces→FAQ). Titels combineren dienst + "für Schweizer KMU" (geo + doelgroep).
- **E-E-A-T:** klantcitaat (SEMANU), Impressum met rechtsentiteit, About-pagina, founder in schema. Sterk voor een eenmanszaak; meer cases = meer bewijs.
- **Interne links & anchors:** beschrijvende anchors ("Digitale Plattformen besprechen", "Alle Leistungen"). ✅
- **Afbeeldingen/alt:** og-alt aanwezig; **content-/portfolio-afbeeldingen (referenzen) op alt-teksten controleren** — niet binnen deze audit gefetcht.
- **CTA's:** consistent en conversiegericht ("Jetzt starten", "Strategiegespräch buchen", "{dienst} besprechen"). ✅
- **Contentgaten:** zie sectie 7.

## 5. GEO / AI search optimization

Sterk fundament voor AI-citatie:
- Eén ondubbelzinnige entiteit (Organization met `@id`, knowsAbout, makesOffer, sameAs, adres/geo).
- **Crawlbare entity-zin** onderaan elke dienstpagina (nu gecorrigeerd naar de juiste offering).
- **Extraheerbare antwoorden:** FAQPage op homepage + dienstpagina's; de prijs-samenvatting op /website-abos ("ab CHF 99 (Business) oder CHF 125 (Webshop)…").
- **Definities/uitleg:** elke dienst heeft een "Was ist…?"-uitleg → goed voor "wat is een digitale Plattform"-achtige AI-vragen.

Verbeteren:
- **Homepage-body uitlijnen** op de umbrella-naamgeving (consistentie die AI als entiteit-feiten oppikt).
- **Consultancy** is nieuw: zorg dat er duidelijke, citeerbare definitie + "wanneer heb je het nodig" content staat (staat al op /services/consultancy — goed; overweeg een korte vergelijking "consultancy vs uitvoering").
- **Concrete claims/vergelijkingen** toevoegen (bv. "sneller en kosteneffizienter dan een klassieke agentur omdat…") helpt AI je voordeel te citeren.

## 6. Lokale SEO

- **NAP:** Naam (amai!) + Adres (Wylerstrasse 75, 3000 Bern) staan in schema + footer. **Telefoon ontbreekt** (schema + footer) → grootste lokale gat.
- **areaServed:** CH + Bern + Canton of Bern in schema. ✅
- **Lokaal schema:** ProfessionalService met `geo` + `openingHoursSpecification`. ✅
- **Google Business Profile:** `sameAs` bevat een Google-share-link — goed signaal. Zorg dat de NAP op het GBP exact matcht met de site (naam, adres, en straks telefoon).
- **Lokale landingspagina:** `website-fuer-lokale-unternehmen` aanwezig. ✅
- **Aanbeveling:** telefoon toevoegen; overweeg een Bern-specifieke sectie/zin op relevante pagina's als je lokaal wil ranken.

## 7. Content & concurrentiepositie

- **Sterke pagina's:** homepage (brede partner-story, 6 diensten, FAQ), de 6 dienstpagina's (diep), 7 website-landingspagina's (gefocuste funnels), referenzen, blog.
- **Belangrijkste contentgat door de pivot:** de oude `/services/crm` en `/services/customer-portals` targetten specifieke zoekintenties ("CRM Schweiz", "Kundenportal erstellen"). Die redirecten nu naar de umbrella-pagina, waardoor die keyword-targeting verwatert. **Beslis bewust:** als die intenties waardevol zijn, maak er gefocuste landingspagina's voor (zelfde model als de website-landings) óf zorg dat de Digitale-Plattformen-pagina en een blog die termen expliciet dekt.
- **Consultancy** heeft (nog) geen SEO-landing voor "Digitalberatung Schweiz / digitale transformatie advies" — overweeg er één als dat een doelintentie is.
- **Dunne plekken:** blog-diepte (aantal posts), en weinig cases (referenzen) — meer bewijs/cases = sterker voor E-E-A-T én long-tail.

---

## Concrete voorbeelden (code & copy)

**A. Telefoon in Organization-schema** (`src/app/[locale]/layout.tsx`, in het `organization`-object, na `email`):

```ts
email: 'hello@amai.ch',
telephone: '+41 XX XXX XX XX',   // zodra het nummer live is
```

En in de footer (`src/components/Footer.tsx`, contactblok), naast het mailadres een `tel:`-link.

**B. Pagina-specifieke OG-alt** (`src/lib/seo/metadata.ts`):

```ts
images: [{ url: image, width: 1200, height: 630, alt: socialTitle }],
```

(socialTitle bestaat al in de helper — vervang de hardgecodeerde merkregel.)

**C. Homepage-body uitlijnen** (`src/content/home.ts`) — vervang losse opsommingen zoals
"…über CRM, Automatisierungen, Dashboards und Kundenportale bis hin zu AI Assistenten…" door
"…über digitale Plattformen (Dashboards, CRM, Kundenportale), Automatisierungen und Consultancy bis hin zu AI Assistenten…" (DE/FR/EN parallel).

**D. Service-schema verrijken** (optioneel, `services/[service]/page.tsx`):

```ts
areaServed: { '@type': 'Country', name: 'Switzerland' },
```

**E. Title/description-patroon (al goed, ter referentie):**
- Title: `{Dienst} für Schweizer KMU · amai.ch` (≤60 tekens)
- Description: 140–160 tekens, met dienst + "für Schweizer KMU" + concreet voordeel, zonder prijs-anker.

---

## Prioriteitenlijst

**Hoog**
1. ✅ (gedaan) Entity-zin op dienstpagina's bijgewerkt naar de nieuwe offering. → deployen.
2. Telefoonnummer toevoegen (Organization-schema + footer) zodra beschikbaar — NAP voor lokale SEO.
3. Beslissing over keyword-dekking CRM/Kundenportal/Consultancy (gefocuste landings of expliciete on-page/blog-dekking), nu de oude pagina's redirecten.
4. Homepage-body uitlijnen op "Digitale Plattformen"-umbrella (GEO/entiteit-consistentie).

**Midden**
5. Pagina-specifieke `og:image:alt` (+ overweeg per-dienst OG-beelden).
6. Sitemap.xml laadtijd live verifiëren (mijn fetch time-outte).
7. PageSpeed Insights draaien (LCP/CLS/INP) op home + dienst + landing.
8. Blog Article/BlogPosting-schema completeren (author, datePublished, image).
9. Alt-teksten van content-/portfolio-afbeeldingen controleren.

**Laag**
10. `twitter:site` handle (als er een X-account is).
11. BreadcrumbList ook op blog/legal/landings.
12. `offers` toevoegen aan Service-schema voor de geprijsde diensten; `areaServed` als object.

---

## Deploy-noot

De entity-zin-fix (DE/FR/EN) staat lokaal klaar maar is nog niet gepusht. Push `main` om die mee live te zetten (Vercel deployt automatisch; daarna Cloudflare purge zoals je gewend bent). De andere "hoog"-punten zijn nieuwe wijzigingen die je kunt laten uitvoeren wanneer je wil.
