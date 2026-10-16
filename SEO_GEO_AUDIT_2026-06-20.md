# amai.ch — Diepgaande SEO + GEO audit

Datum: 2026-06-20 · Scope: volledige marketingsite (Next.js App Router, next-intl DE/FR/EN, `localePrefix: 'always'`) · Methode: geverifieerd tegen de échte code (geen aannames). Het interne portaal (`/app/*`) is bewust `noindex` en valt buiten scope.

> **Korte conclusie:** dit is een ongewoon volwassen gebouwde site. De technische fundamenten (SSG, canonical/hreflang, sitemap/robots, één canonieke entity via `@id`, schema-dekking) zijn sterk. De winst zit in (1) een operationele deploy/cache-blokkade die alle recente wijzigingen tegenhoudt, (2) positionering/H1 + OG-beeld, (3) een paar schema-correctheidsfouten, (4) beeldgewicht en (5) GEO-verfijning. Geen herbouw nodig.

---

## 0. KRITIEKE OPERATIONELE BLOKKADE (lees dit eerst)

**De live site serveert een verouderde versie.** Geverifieerd: een fetch van `https://amai.ch/de/faq` toont nog de oude "orbit"-FAQ **mét prijzen op de planeten** — terwijl die prijzen al verwijderd zijn én de hele FAQ herbouwd is naar een zoek-FAQ. Een lokale `next build` compileert succesvol (`✓ Compiled successfully`), dus dit ligt **niet aan de code**. Alle recente commits staan op `origin`.

- **Waarom kritisch:** zolang dit speelt, verschijnt géén van de recente verbeteringen bij bezoekers of bij Google/AI-crawlers — ook de FAQ-uitlijning, de lichte landingspagina's en alle fixes uit deze audit niet.
- **Oplossing:** (a) Vercel-dashboard (project amai-ops) → Deployments: staat de laatste deploy op **Ready** of **Error**? Bij Error: stuur de buildlog. (b) Bij Ready: Cloudflare (zone amai.ch) → Caching → **Purge Everything** + daarna een harde refresh. Overweeg een cache-rule die HTML kort cachet (of `Cache-Control`/`s-maxage` correct doorzet vanuit Vercel).
- **Prioriteit:** kritisch. Dit gaat vóór alle inhoudelijke punten hieronder, want anders is het effect nul.

---

## A. Executive summary

### De 10 belangrijkste bevindingen
1. **Deploy/cache-blokkade** — recente wijzigingen komen niet live (zie §0). *Kritisch.*
2. **Homepage-H1 onderverkoopt de positionering.** `hero.h1` = "From website to customer portal" / "Von der Website bis zum Kundenportal", terwijl titel, meta, de 9-diensten-sectie, de `makesOffer` en `llms.txt` een brede digitale partner verkopen. De H1 is het zwaarst wegende on-page signaal voor SEO én GEO. *Hoog.*
3. **Drie hoog-verkeer pagina's omzeilen de `pageMetadata`-helper** en schrijven canonical/hreflang/OG met de hand: `services/page.tsx`, `services/[service]/page.tsx`, `[landing]/page.tsx` (samen 45 gelokaliseerde URL's). Exact de codevorm die eerder hreflang liet wegvallen. *Hoog.*
4. **Eén gedeelde OG-afbeelding voor ~40 URL's**, Duitstalig en website-only. Een FR/EN-share van `/services/crm` toont een Duitse "websites"-kaart. *Hoog (CTR + uitstraling).*
5. **Geen telefoonnummer** — nergens (org-schema, ContactPoint, footer, contactpagina). Sterkste lokale trust-signaal ontbreekt. *Hoog (of bewuste keuze).*
6. **`priceRange: 'from CHF 35'` is geen geldige schema-waarde** (Google verwacht `'CHF'` of `'CHF 35–CHF 299'`). *Hoog.*
7. **Zware ongeoptimaliseerde beelden** (`bikestore.png` 1,77 MB, `nora.png` 1,55 MB, `configurator.png` 1,41 MB) + ongebruikt `skincare.jpg` 2,45 MB en `hero/hero.mp4` ~3,4 MB. Repo-bloat + CWV-risico. *Hoog.*
8. **Postcode 3000 vs 3014** — Wylerstrasse 75 ligt fysiek in postcode-district 3014; schema + Impressum gebruiken 3000. Moet byte-identiek zijn aan het Google Business Profile. *Hoog (verifiëren).*
9. **Contactpagina mist zichtbare NAP** (straat/telefoon staat alleen in Impressum + schema) + zwakke marquee-ALT (`alt="SEMANU"`) + ruwe `<img>` op `/about` en blog zonder afmetingen (CLS). *Medium.*
10. **GEO-gaten:** geen extraheerbare prijs-samenvattingszin bovenaan `/website-abos`; ontbrekende high-intent FAQ's ("Wie bouwt websites voor Zwitserse KMU's?", "Welke technologie?", "vs. een traditioneel bureau?"); geen `knowsAbout`/stad-niveau `areaServed`. *Medium.*

### Grootste risico's
- **#0 deploy/cache** — verbeteringen onzichtbaar.
- **Schema-correctheid** (`priceRange`, gebroken `manifest`-icoon, dubbele inline `WebSite`-nodes) — kan rich results saboteren.
- **NAP-inconsistentie/onvolledigheid** (geen telefoon, postcode-twijfel) — lokale ranking + entity recognition.

### Grootste quick wins (≤ 1 dag, lage risico)
- Cloudflare purge + Vercel-status checken (§0).
- H1 homepage herschrijven naar de brede claim (§D).
- `priceRange` → `'CHF 35–CHF 299'`; `manifest` `/icon.svg`-entry verwijderen; `og.png?v=2` ook in JSON-LD; homepage/`[landing]` `isPartOf` → `@id` (§E).
- Drie hand-geschreven `generateMetadata` vervangen door `pageMetadata` (§I).
- Marquee-ALT + `/about` + blog-avatars verbeteren (§F).
- Ongebruikte zware assets verwijderen (`skincare.jpg`, `hero/*`); dode `FaqOrbit`/`faqOrbit.css` verwijderen.

### Verwachte impact
- **SEO:** consistente hreflang op 45 URL's, geldige schema's (rich results), betere CWV (lichtere beelden, geen CLS), scherpere H1 → betere relevantie/CTR.
- **GEO:** explicietere entity (wie/wat/voor wie/waar), extraheerbare samenvattingen + FAQ's → meer kans op citatie in ChatGPT/Perplexity/AI Overviews.
- **Commercieel:** sterkere OG-kaarten + duidelijkere positionering → hogere social-CTR en vertrouwen.

---

## B. Kritieke fouten

> Geen "kritische" SEO-fouten in de code zelf (geen noindex op geldpagina's, geen kapotte canonical, sitemap aanwezig). De enige *kritische* is operationeel (§0). Hieronder de hoogste prioriteiten.

**B1 — Deploy/cache (kritisch).** Zie §0. Probleem: live ≠ code. Locatie: Vercel/Cloudflare. Oplossing: deploy-status checken + cache purgen.

**B2 — Homepage-H1 onderverkoopt (hoog).**
- Locatie: `src/messages/{de,fr,en}.json` → `hero.h1`.
- Waarom schadelijk: H1 = primair on-page signaal; claimt nu enkel "website → portaal", niet CRM/automatisering/AI/booking. Mismatcht met titel, `makesOffer` (9 diensten) en `llms.txt`. Verzwakt zowel keyword-targeting als AI-extractie van "wat doet amai?".
- Oplossing (§D voor exacte copy): H1 = categorie + doelgroep + regio.

**B3 — Drie pagina's omzeilen de metadata-helper (hoog).**
- Locatie: `src/app/[locale]/services/page.tsx` (≈ L22-49), `services/[service]/page.tsx` (≈ L36-61), `[landing]/page.tsx` (≈ L35-60).
- Waarom schadelijk: dupliceert ~25 regels die `pageMetadata` bezit; exact de `alternates: { canonical, languages }`-vorm die eerder hreflang liet droppen op blogposts. Dit zijn de 8 servicepagina's + 7 landingspagina's = 45 gelokaliseerde URL's (de SEO-kernoppervlakken).
- Oplossing: vervang door `pageMetadata(...)` (zie §I, codepatch).

**B4 — `priceRange` ongeldig (hoog).**
- Locatie: `src/app/[locale]/layout.tsx` (org-node, ≈ L103): `priceRange: 'from CHF 35'`.
- Waarom schadelijk: geen herkende waarde → genegeerd/gemarkeerd in de Rich Results Test.
- Oplossing: `priceRange: 'CHF 35–CHF 299'` (of `'CHF'`).

**B5 — Geen telefoonnummer (hoog).**
- Locatie: org-schema + `kontakt/page.tsx` ContactPoint (≈ L47-52) + Footer + contactpagina — overal enkel `hello@amai.ch`.
- Waarom schadelijk: telefoon = sterkste lokale trust-/Google-Business-matchsignaal; ontbreekt volledig. De org heeft wél `geo` + `openingHoursSpecification` — een lokale entity zonder telefoon is onvolledig.
- Oplossing: voeg een echt nummer toe (org-schema + ContactPoint + zichtbaar op `/kontakt`), of accepteer bewust de lokale-SEO-kost.

**B6 — Beeldgewicht (hoog).**
- Locatie: `public/portfolio/bikestore.png` 1,77 MB, `nora.png` 1,55 MB, `configurator.png` 1,41 MB; ongebruikt `public/skincare.jpg` 2,45 MB en `public/hero/hero.mp4` ~3,4 MB + poster; `next.config.mjs` heeft géén `images`-blok.
- Waarom schadelijk: repo/build-bloat; zonder `images.formats` geen gegarandeerde AVIF; retina-varianten worden uit zware bronnen gegenereerd.
- Oplossing: bronnen hercomprimeren naar WebP ≤ 300 KB; ongebruikte assets verwijderen; `images: { formats: ['image/avif','image/webp'] }` toevoegen.

**B7 — Postcode 3000 vs 3014 (hoog, verifiëren).**
- Locatie: `layout.tsx` (≈ L122) + `content/legal/impressum.{de,fr,en}.md` (L9): allemaal `3000 Bern`.
- Waarom schadelijk: intern consistent (goed), maar Wylerstrasse 75 valt in postcode 3014; schema/Impressum/Google Business moeten identiek zijn.
- Oplossing: verifieer tegen de geregistreerde/GBP-postcode; pas alle vier de plekken in lockstep aan indien 3014.

---

## C. Pagina-per-pagina audit

Legenda titelbron: **msg** = `src/messages/*`, **content** = `src/content/*`, **hand** = inline literal. Alle pagina's renderen **SSG**; canonical + hreflang (de/fr/en + x-default) aanwezig tenzij vermeld.

| Route | Title (bron) | Meta description (bron) | H1 | Belangrijkste SEO-issue | Belangrijkste GEO-issue | Structured data | OG | Afb./ALT |
|---|---|---|---|---|---|---|---|---|
| `/[locale]` (home) | `amai! · Digitaler Partner für Schweizer KMU · ab 35 CHF/Monat` (hand) | hand | "Von der Website bis zum Kundenportal" | **H1 te smal** (B2); titel staat in 2 bronnen | H1 onderverkoopt 9 diensten; hero mist regio/founder | WebPage+Review+FAQPage; `isPartOf` inline i.p.v. `@id` | gedeelde og.png | marquee-ALT zwak (`alt="SEMANU"`) |
| `/services` | content | content | lange zin | **omzeilt `pageMetadata`** (B3); FAQ-span ontbrak (gefixt) | OK (entity-blokken) | Service+ItemList+FAQPage+Breadcrumb | gedeeld | — |
| `/services/[service]` (×8) | `detail.metaTitle` (content) | content | per dienst | **omzeilt `pageMetadata`** | sterk: `entityLine`-band | Service+FAQPage+Breadcrumb | gedeeld | — |
| `/[landing]` (×7) | `${c.title} · amai.ch` (content) | content | per landing | **omzeilt `pageMetadata`**; `isPartOf` inline | sterk: `entitySentence` | Service+FAQPage+WebPage+Breadcrumb | gedeeld | — |
| `/website-abos` | `${nav.plans} · amai.ch` (msg) | `price.metaDescription` (msg) | "Transparente Preise…" (h2-stijl) | ok | **geen extraheerbare prijs-samenvattingszin** | Service + 3 Offer/UnitPrice | gedeeld | — |
| `/website-analyse` | msg | msg | h2-stijl | ok | ok | — | gedeeld | — |
| `/so-funktioniert` | content | content | (h1) | ok | sterk | WebPage+FAQPage+Breadcrumb | helper | step-cards: a11y (geen `aria-expanded`) |
| `/referenzen` | content | content | "Projects that speak for themselves" | ok | proof dun (4/6 in dev) | ItemList+Breadcrumb | helper | grid-ALT goed (`REF_IMAGES`) |
| `/blog` | msg | `blog.intro` (msg) | (h1) | ok | ok | Blog+ItemList | helper | — |
| `/blog/[slug]` | `${post.title} · amai.ch` | frontmatter | post-titel | ok | `dateModified===datePublished`; author niet aan `#founder` gelinkt | BlogPosting | post-cover ✓ | cover-ALT generiek; avatar `<img>` zonder afmetingen |
| `/faq` | `${nav.faq} · amai.ch` (msg) | `FAQ_DESC` (hand) | (h1) | ok | sterk (zoek-FAQ, 41 Q&A) | FAQPage (alle Q&A) | helper | — |
| `/kontakt` | msg | `contact.intro` (msg) | (h1) | ok | **geen zichtbare NAP** (straat/telefoon) | ProfessionalService+ContactPoint (mail-only) | helper | — |
| `/about` | `${nav.about} · amai.ch` (msg) | `about.intro` (msg) | "Personal, not anonymous." (h2-stijl) | ok | **dun op E-E-A-T** (geen oprichtingsjaar/ervaring/cijfers) | AboutPage+Person(#founder) | helper | founder `<img>` 360 KB, geen afmetingen |
| `/datenschutz` `/agb` `/impressum` | content (md) | hand | doc-titel | ok | NAP-bron (impressum) | — | helper | — |
| `/styleguide` | hand | — | — | **noindex** (correct) | — | — | — | — |

---

## D. Metadata-aanbevelingen

**Homepage-H1** (`src/messages/*` → `hero.h1`):
- DE: `Ihr digitaler Partner für Schweizer KMU. Von der Website bis zu CRM, Automatisierung und AI.`
- FR: `Votre partenaire digital pour les PME suisses. Du site web au CRM, à l’automation et à l’AI.`
- EN: `Your digital partner for Swiss SMEs. From websites to CRM, automation and AI.`
(Mint-accent op één frase; respecteer de huisstijl: geen streepjes, Swiss `ss`, "AI".)

**Homepage hero-sub** (`hero.sub`): voeg een regio/founder-clausule toe, bv. EN `… Based in Bern, building for SMEs across Switzerland.`

**Homepage-titel ontdubbelen:** verplaats de titel/description uit de inline `titles`/`descriptions`-map in `page.tsx` naar een `home`-namespace in de message-JSON's (of documenteer dat `meta.*` enkel de 404-fallback is). Eén bron van waarheid.

**`/website-abos` description** (msg `price.metaDescription`): zorg dat hij de drie plannen + "ab 35/79/99 CHF/Monat, all-in, ohne hohe Anfangskosten" bevat (extraheerbaar voor "wat kost een website in Zwitserland").

**Servicepagina-titels:** behoud de content-bron, maar lever ze via `pageMetadata` (zie §I) zodat OG/twitter/hreflang automatisch consistent blijven.

**OG/Twitter:** titels worden al in lockstep gehouden door de helper (sterk). Voeg `og:image:width/height` (1200×630) + `og:image:alt` toe als helper-default.

---

## E. Structured data-plan

**Wat ontbreekt / fout is (met patch):**

1. **`priceRange` corrigeren + telefoon + GBP** — `layout.tsx` org-node:
```ts
// was: priceRange: 'from CHF 35',
priceRange: 'CHF 35–CHF 299',
telephone: '+41 XX XXX XX XX',          // echt nummer of deze regel weglaten
sameAs: [
  'https://www.instagram.com/amai.swiss',
  // 'https://www.google.com/maps/place/?cid=JOUW_CID',  // echte Google Business URL zodra live
],
knowsAbout: ['Websites','Webshops','Email Marketing','Marketing Automation','CRM','Kundenportale','Business Dashboards','AI Assistenten','Buchung und Termine'],
```
Voeg, als je telefoon toevoegt, hetzelfde nummer toe aan de ContactPoint in `kontakt/page.tsx`.

2. **`isPartOf` via `@id`** (homepage `page.tsx` ≈ L95 en `[landing]/page.tsx` ≈ L91):
```ts
// was: isPartOf: { '@type': 'WebSite', name: 'amai!', url: env.siteUrl },
isPartOf: { '@id': `${env.siteUrl}/#website` },
```
Voorkomt dubbele, partiële `WebSite`-nodes.

3. **Blogauteur aan founder koppelen** (`blog/[slug]/page.tsx` ≈ L80) voor E-E-A-T:
```ts
author: meta.author === 'Tom de Vree'
  ? { '@id': `${siteUrl}/#founder` }
  : (meta.author ? { '@type': 'Person', name: meta.author } : { '@id': `${siteUrl}/#founder` }),
```

4. **`dateModified`** — voeg een `updated`-frontmatterveld toe en gebruik dat i.p.v. `datePublished` te kopiëren (freshness-signaal).

5. **`vatID`** toevoegen aan de org zodra de MWST-nummer is toegekend: `vatID: 'CHE-XXX.XXX.XXX MWST'`.

6. **`Service` price fragiel** (`website-abos/page.tsx` ≈ L73): `tile.price.replace(/[^0-9]/g,'')` plakt cijfers samen bij decimalen/ranges. Hou de eerste drie plan-tiles cijfer-schoon, of parse robuuster.

**Niet doen:** géén `AggregateRating` verzinnen (terecht afwezig). De ene `Review` (SEMANU) is legitiem — echte live klant, weerspiegelt zichtbare content — **behouden**. Géén `SearchAction` toevoegen zolang er geen echte `/search?q=`-URL bestaat.

**Wat al sterk is (niet aanraken):** één canonieke `ProfessionalService` `#organization` via `@id`, `#website`, `#founder`, consistente `BreadcrumbList`, `FAQPage`, `Service`, `BlogPosting`, `AboutPage+Person`.

---

## F. Afbeeldingen- en OG-audit

**Zwakke/ontbrekende ALT (met verbetering):**

| Locatie | Huidige ALT | Voorstel |
|---|---|---|
| `PortfolioMarquee.tsx` SEMANU | `"SEMANU"` | `"SEMANU client platform homepage built by amai!"` |
| idem 3D Configurator | `"3D Configurator"` | `"3D product configurator for made to measure aluminium plates"` |
| idem amai.ch | `"amai.ch"` | `"amai.ch website homepage"` |
| idem NORA | `"NORA"` | `"NORA cold pressed juice brand and webshop design"` |
| idem BIKESTORE | `"BIKESTORE"` | `"BIKESTORE online bike shop storefront"` |
| idem Maison Rosé | `"Maison Rosé"` | `"Maison Rosé beauty salon website"` |
| `about/page.tsx` founder `<img>` | `"Tom de Vree"` | `"Tom de Vree, founder and owner of amai!, in Bern"` + `width/height` |
| `blog/[slug]` cover | post-titel | `"Cover illustration for the article: {title}"` (of behoud titel) |
| `blog/[slug]` author-avatar `<img>` | author-naam | `"Portrait of {author}"` + `width/height` |

(De `/referenzen`-grid-ALT via `REF_IMAGES` is al goed.)

**Beeld-issues:**
- Hercomprimeer `bikestore.png`/`nora.png`/`configurator.png` naar WebP ≤ 300 KB.
- Verwijder ongebruikt `public/skincare.jpg` (2,45 MB) en `public/hero/hero.mp4` + poster (~3,6 MB) indien bevestigd ongebruikt.
- Zet `/about`-founder + blog-avatars om naar `next/image` (of minstens expliciete `width={96} height={96}` + een 96px-bestand) → lost CLS op.
- `next.config.mjs`: voeg `images: { formats: ['image/avif','image/webp'] }` toe.

**OG / social:**
- **Probleem:** één gedeelde, Duitstalige, website-only `og.png` voor ~40 URL's. `summary_large_image` ✓, 1200×630 ✓, titels in lockstep ✓ — maar een FR/EN-share van een CRM- of landingspagina toont een Duitse "websites"-kaart.
- **Aanbevolen (in volgorde):**
  1. **Per-locale** statische OG-kaarten (de/fr/en), gekozen op `locale` in `pageMetadata` (quick win).
  2. **Dynamische OG** per sectie via `opengraph-image.tsx` (`ImageResponse`) die H1 + "amai!" + prijs print → hoogste CTR, schaalt naar alle URL's automatisch.
  3. Broaden de default-copy van "Moderne Websites" naar de digitale-partner-lijn.
- Voeg `og:image:width/height/alt` toe.
- `og.png`-URL gelijktrekken: meta gebruikt `?v=2`, JSON-LD `image` in `layout.tsx` gebruikt `/og.png` zonder versie — maak ze gelijk.
- **Manifest-icoon gebroken:** `manifest.ts` verwijst naar `/icon.svg` dat niet bestaat → verwijder die entry (de twee PNG's dekken het):
```ts
icons: [
  { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
],
```

---

## G. GEO-verbeterplan (AI-search / citatie)

**Wat al sterk is:** `public/llms.txt` (volledige entity + plannen + audience), per-pagina `entitySentence`/`entityLine`-samenvattingsblokken, een zoekbare 41-Q&A FAQ, en alle body-copy als echte DOM-tekst (ook de pie-wheel en de ecosystem-labels zijn `<text>`/`<div>`, geen beeld) → AI kan vrijwel alles extraheren.

**Concrete toevoegingen:**
1. **Homepage-H1** breder (zie §D) — het enige signaal dat AI als "de claim van de pagina" oppakt.
2. **Volledige NAP zichtbaar op `/kontakt`** (straat + telefoon of expliciet "alleen email"), byte-identiek aan het schema en het Google Business Profile. De contactpagina is dé pagina die AI citeert voor "hoe contacteer ik amai".
3. **Extraheerbare prijs-samenvattingszin bovenaan `/website-abos`**, bv.: *"Eine professionelle Website in der Schweiz kostet bei amai! ab CHF 35/Monat (Beginner), CHF 79 (Business) oder CHF 99 (Webshop), all-in."* (Nu staat dit alleen in de homepage-FAQ.)
4. **Nieuwe FAQ-entries** (hoog-intentie, conversationeel) — voeg toe aan `faqServices.ts`:
   - "Wie bouwt websites voor Zwitserse KMU's?" (entity-definiërend)
   - "Welke technologie gebruikt amai?" / "Is amai een WordPress/Webflow-bureau?"
   - "amai vs. een traditioneel bureau?" (de "sneller/goedkoper met AI"-claim staat nu enkel in proza)
   - "Is er een telefoonnummer / hoe bereik ik amai?"
5. **`knowsAbout`** (de 9 diensten) + **stad-niveau `areaServed`** (Bern + omliggende kantons) op de org-node → expliciete topicale + geografische ankers.
6. **`/about` met concrete E-E-A-T-feiten** (oprichtingsjaar, achtergrond, "X Zwitserse projecten") — de plek die AI citeert voor "wie zit achter amai".
7. **Interne links** van de nieuwe prijs-samenvatting en de "wie bouwt …"-FAQ naar `/about` (founder) → versterkt de E-E-A-T-cluster.

---

## H. Technisch implementatieplan (gefaseerd)

**Quick wins — binnen 1 dag (laag risico):**
- §0: Vercel-status + Cloudflare purge (deblokkeert alles).
- Homepage-H1 herschrijven (§D).
- `priceRange` → `'CHF 35–CHF 299'`; `manifest` `/icon.svg` weg; `og.png?v=2` in JSON-LD; `isPartOf` → `@id` (home + landing).
- Marquee-ALT + `/about`/blog-avatar-ALT + afmetingen.
- Ongebruikte assets (`skincare.jpg`, `hero/*`) en dode `FaqOrbit`/`faqOrbit.css` verwijderen.

**Binnen 1 week:**
- Drie pagina's omzetten naar `pageMetadata` (§I).
- Telefoon + GBP-link + `knowsAbout` + postcode verifiëren in org-schema (+ ContactPoint + zichtbare NAP op `/kontakt`).
- Beelden hercomprimeren naar WebP ≤ 300 KB + `images.formats` in `next.config`.
- Per-locale OG-kaarten.
- Prijs-samenvattingszin + 3–4 nieuwe FAQ's.

**Binnen 1 maand (structureel):**
- Dynamische `opengraph-image.tsx` (H1 + prijs + amai!) voor service/landing/pricing.
- `/about` E-E-A-T uitbreiden; blogauteurs aan `#founder`; `dateModified` via frontmatter.
- Tweede live testimonial; `/referenzen` cases met echte cijfers i.p.v. "100%/CH/SEO".
- Cache-strategie formaliseren (HTML kort/SWR, assets immutable).

---

## I. Concrete code-aanpassingen

**1. Drie pagina's via `pageMetadata` (verwijdert hreflang-drift-risico).** Voorbeeld voor `services/[service]/page.tsx` — vervang het hand-geschreven `generateMetadata`-blok door:
```ts
import { pageMetadata } from '@/lib/seo/metadata';
// ...
export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale, service } = await params;
  const detail = SERVICE_DETAIL[pick(locale)][service];
  return pageMetadata({
    title: `${detail.metaTitle} · amai.ch`,
    description: detail.metaDescription,
    path: `/services/${service}`,
    locale,
  });
}
```
Doe hetzelfde voor `services/page.tsx` (`path: '/services'`) en `[landing]/page.tsx` (`path: '/' + slug`). Gedrag identiek, maar canonical/hreflang/OG/twitter komen uit één bron.

**2. OG-default met afmetingen** — in `src/lib/seo/metadata.ts`, waar `images` wordt gezet:
```ts
images: [{ url: image, width: 1200, height: 630, alt: 'amai! — digitaler Partner für Schweizer KMU' }],
```

**3. FAQ-uitlijning (AL DOORGEVOERD in commit `efc5db1`):** de inline FAQ-`<summary>`-accordions wikkelen de vraag nu in een `<span>` (`page.tsx`, `services/page.tsx`; so-funktioniert + landing hadden die al), zodat de `amai!`-wordmark niet door `justify-between` uit elkaar wordt getrokken. *Let op: verschijnt pas na de deploy/cache-fix (§0).*

**4. `next.config.mjs` images:**
```js
const nextConfig = {
  // ...
  images: { formats: ['image/avif', 'image/webp'] },
  // ...
};
```

(Patches uit §E en §F zijn hier integraal te plakken. Respecteer de bestaande huisstijl en architectuur; niets in de huidige werking breekt.)

---

## J. Validatiechecklist (na implementatie)

- **Deploy/cache:** fetch `https://amai.ch/de/faq` en bevestig de zoek-FAQ (geen orbit, geen prijzen op planeten); harde refresh + incognito op de homepage-FAQ (geen gaten rond `amai!`).
- **Google Rich Results Test** (search.google.com/test/rich-results): org, FAQPage, Service, BreadcrumbList, BlogPosting — geen errors/warnings; `priceRange` geldig.
- **Schema Markup Validator** (validator.schema.org): geen dubbele `WebSite`-nodes; `@id`-referenties resolven.
- **Lighthouse / PageSpeed Insights** (mobiel + desktop): LCP, CLS (avatars), totale beeldbytes op `/referenzen`; bevestig AVIF/WebP-levering.
- **Social debuggers:** LinkedIn Post Inspector, Facebook Sharing Debugger, X Card Validator — per-locale OG-kaart, juiste taal, afbeelding laadt (absolute URL, dimensies).
- **Search Console:** Pagina-indexering (alle locales), hreflang-rapport (geen "no return tags"), Sitemaps (ingediend, gelezen), Mobile Usability.
- **Robots/sitemap:** `https://amai.ch/robots.txt` (disallow `/app/`, `/*/styleguide`, sitemap-referentie) en `/sitemap.xml` (3 locales, alle pagina's + blog + landings, hreflang-clusters).
- **Manifest/PWA:** `https://amai.ch/manifest.webmanifest` — geen 404-icoon.
- **Handmatige AI/GEO-prompttests** (ChatGPT, Claude, Perplexity, Gemini): "Wie bouwt websites voor Zwitserse KMU's?", "Wat kost een website in Zwitserland?", "Wat is amai.ch en welke diensten biedt het?", "Hoe bereik ik amai?" — controleer of de antwoorden amai correct, met regio (Bern), diensten en prijzen citeren, en of `/about`/`/kontakt`/`/website-abos` als bron opduiken.

---

*Opgesteld op basis van een geverifieerde, read-only inspectie van de volledige codebase. De FAQ-uitlijningsfix is reeds doorgevoerd; alle overige aanbevelingen zijn voorstellen die je gefaseerd kunt toepassen.*
