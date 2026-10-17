# CLAUDE.md

Werkinstructies voor Claude Code in deze repo (semanu.eu). Houd dit kort en up-to-date.

**Taal:**
- **Antwoord aan Tom in het Nederlands.**
- **Code in het Engels:** identifiers, commentaar, commitberichten en technische docs in de code.
- **UI-teksten** in vijf talen via `src/messages/{nl,en,de,fr,es}.json` en de getypte content in
  `src/content/` (één blok per taal). Alle vijf de berichtbestanden blijven in pariteit (zelfde sleutels).

## Wat dit is

De publieke website van **SEMANU** op **www.semanu.eu**: een rebrand van de vorige merksite (Zwitsers merk, zelfde eigenaar)
(zelfde diensten, zelfde huisstijl). Alleen een marketingsite: geen portaal, geen betalingen, geen
eigen database. Het contactformulier gaat server side naar de bestaande SEMANU-backend (Supabase, zie onder).

- **Merk:** woordmerk `semanu` in kleine letters (Instrument Sans 600) met de chevron; juridisch
  `SEMANU BV`. Componenten: `Brand`, `BrandText` (zet "semanu" in lopende tekst om naar het
  woordmerk, niet in "semanu.eu"), `BrandLogo`, `BrandBullet`. Logobron: `~/Desktop/SEMANU/Huisstijl/Logo`.
- **Bedrijf:** SEMANU BV, Kattendijkdok-Oostkaai 9, 2000 Antwerpen, België. Ondernemingsnummer
  0828.291.116, btw BE0828.291.116. Zaakvoerder Tom de Vree. hello@semanu.eu, +32 496 04 56 06
  (één bron: `src/lib/contact.ts`).
- **Diensten:** 3D-configuratoren en bedrijfssoftware (`/services/business-software`, incl. workflowautomatisering).
  Consultancy is sinds oktober 2026 geen dienst meer (`/services/consultancy` 301 naar `/services/business-software`).
  Oude dienst-URL's 301'en (zie `next.config.mjs`).
- **URL's (beslissing oktober 2026):** één Engelse slug per pagina, gelijk in alle talen (alleen het
  taalprefix verschilt): `/contact`, `/references`, `/about`, `/faq`, `/blog/<engelse-slug>`, `/privacy`,
  `/terms`, `/legal-notice`, `/services/3d-configurators`, `/services/business-software`, `/configurator/<type>`.
  Oude Duitse slugs 301'en rechtstreeks naar het eindadres (`next.config.mjs`). Nieuwe pagina's en blogs
  krijgen meteen een Engelse slug.
- **Prijzen:** nergens bedragen op de site; overal "op aanvraag" (per taal). Valuta EUR, excl. btw.
- **Doelgroep (beslissing oktober 2026):** Europees en landneutraal ("KMU in Europa", "SMEs in Europe" waar een
  regio helpt, anders gewoon "KMU/SMEs/kmo's"). Locatie alleen waar ze hoort: bedrijfsgegevens (Antwerpen, België)
  in footer, contact, about, juridische pagina's en JSON-LD (`src/lib/seo/area-served.ts`). Geen landenpagina's
  en sinds oktober 2026 geen landingspagina's meer: `/3d-configurator` en `/sme-digitalisation` (en hun oude
  `*-schweiz`/Duitse slugs) 301'en rechtstreeks naar `/services/3d-configurators` en `/services/business-software`;
  Zwitserse blogs 301'en ook (zie `next.config.mjs`). De workflowlandingspagina en de
  gratis websiteanalyse zijn weg (301 naar `/services/business-software` en `/contact`).

## Stack

Next.js 15 (App Router, TypeScript, `output: 'standalone'`) · next-intl (nl, en, de, fr, es;
`localePrefix: 'always'`, standaardtaal en) · Tailwind CSS v4 (tokens in `src/app/globals.css`
`@theme`, Marine + Mint: niet aanpassen) · zod · vitest.

Controle na wijzigingen: `npx tsc --noEmit`, `npm test`, pariteit van de vijf berichtbestanden.

## Huisregels voor teksten (elke taal)

- **Geen gedachtestreepjes** (— –). Geen koppeltekens in nieuwe samenstellingen waar de taal het toelaat.
- **Geen komma voor een nevenschikkend voegwoord:** niet ", en/of/maar/met", ", und/oder/aber/mit",
  ", et/ou/mais/avec", ", and/or/but/with", ", y/o/pero/con". Herschrijf de zin.
- Duits in standaardspelling (ß), geen Zwitserse varianten (dus "Maß", "groß", "gemäß"; "Angebot", niet "Offerte";
  "MwSt.", niet "MWST").
- URL-slugs houden hun koppeltekens (SEO).
- Paginatitels: `Pagina · semanu.eu`.

## Contactformulier → SEMANU leadsbord

`ContactForm.tsx` post naar `/api/leads`
(`src/app/api/leads/route.ts`). Die route valideert (`src/lib/validation.ts`), checkt honeypot,
een in-memory limiet (5 per IP per uur) en Turnstile (optioneel), en stuurt door naar de edge
function **`submit-contact`** van de SEMANU-backend (`src/lib/semanu-leads.ts`):

- prod `https://bjpcgqejprkdqqohhere.supabase.co/functions/v1/submit-contact` (`SITE_ENV=production`)
- staging `https://kiiyvctcfvfrivpjsfjo.supabase.co/...` (elke andere `SITE_ENV`)
- sleutel: `SEMANU_SUPABASE_ANON_KEY` (publieke anon key, enkel via env).

Bezoekers-IP: Caddy zet `X-Real-IP` (`src/lib/security/client-ip.ts` leest enkel die header); de
route stuurt het als `X-Visitor-IP` mee met `X-Forward-Secret` (env `SEMANU_EU_FORWARD_SECRET`,
server side, gelijk aan de Supabase-secret). Met een geldig geheim rekent submit-contact zijn limiet
per bezoeker, zet bron `contact_form_semanu_eu` en geeft bij een limiet 429; `/api/leads` geeft dan
ook 429 en het formulier toont `errRateLimit`. Node luistert op localhost (zie `deploy/`).

`submit-contact` doet spamscore, rate limit, MX-check, dubbels en `create_lead` (bedrijf + persoon +
kaart in "Nieuw") en mailt hello@. Dienstkeuze → topic: 3D → `configurator`, bedrijfssoftware →
`custom`, workflow → `ai`, rest (bv. alleen "nog niet zeker") → consultancy (enkel nog als backendwaarde op
het bord; het formulier biedt consultancy niet meer aan). Telefoon en herkomst (pagina, taal, referrer) gaan
als staartregel mee in het bericht. De bron van de function staat in de Website-repo
(`~/Desktop/SEMANU/Website/supabase/functions/submit-contact`); **die repo niet vanuit hier wijzigen.**

## Hosting en deploy

Hetzner, server 2.31.50.26, één server met twee omgevingen: live (www.semanu.eu, Node op poort
3000, `semanu-eu-live`) en staging (acc.semanu.eu, poort 3001, zonder wachtwoord, wel noindex,
`semanu-eu-acc`). Caddy ervoor. Alles in `deploy/`; stappen voor Tom in
[deploy/README-DEPLOY.md](deploy/README-DEPLOY.md).

- `./deploy/deploy.sh acc`, dan `./deploy/deploy.sh live` (vraagt "ja"); `rollback acc|live`.
- Het script bouwt de **gecommitte** code (git archive, dus zonder `.env.local`) per omgeving met
  `deploy/build-{acc,live}.env` (alleen publieke waarden). Geheimen staan op de server in
  `/etc/semanu-eu/{live,acc}.env`.
- `SITE_ENV` bepaalt index/noindex, robots.txt en het Supabase-project. Alles wat niet
  `production` is, is noindex.
- DNS bij Combell: enkel A/AAAA voor semanu.eu, www en acc. Nooit MX of nameservers.
- Canonical host: `https://www.semanu.eu` (apex stuurt door naar www).

## Wat er bij de rebrand uit ging (oktober 2026)

Portaal (`/app`), Stripe en facturatie, de lokale Supabase-tabellen en migraties, Resend-mails,
cron/outbox, website-rapporten met AI, de Google-marketing-API's, Playwright-e2e, prijspagina's,
de voorbeeldrapporten van het vorige merk en ongebruikte componenten. Twijfelgevallen staan in `_archive/`
(docs en merkkits van het vorige merk, oude Supabase-map, configurator-engine, Claude-outputs). `_archive/` hoort
niet bij de site.

## Niet doen

- Geen oude merknaam, CHF, Zwitserse btw/wet of Zwitserse doelgroep terugbrengen.
- Geen geheimen committen; `.env.local` nooit openen of kopiëren.
- `globals.css` `@theme` (huisstijl) niet wijzigen zonder vraag van Tom.
