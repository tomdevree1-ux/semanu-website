# CLAUDE.md

Werkinstructies voor Claude Code in deze repo (semanu.eu). Houd dit kort en up-to-date.

**Taal:**
- **Antwoord aan Tom in het Nederlands.**
- **Code in het Engels:** identifiers, commentaar, commitberichten en technische docs in de code.
- **UI-teksten** in vijf talen via `src/messages/{nl,en,de,fr,es}.json` en de getypte content in
  `src/content/` (één blok per taal). Alle vijf de berichtbestanden blijven in pariteit (zelfde sleutels).

## Wat dit is

De publieke website van **SEMANU** op **www.semanu.eu**: een rebrand van de vroegere amai.ch-site
(zelfde diensten, zelfde huisstijl). Alleen een marketingsite: geen portaal, geen betalingen, geen
eigen database. Formulieren gaan server side naar de bestaande SEMANU-backend (Supabase, zie onder).

- **Merk:** woordmerk `semanu` in kleine letters (Instrument Sans 600) met de chevron; juridisch
  `SEMANU BV`. Componenten: `Brand`, `BrandText` (zet "semanu" in lopende tekst om naar het
  woordmerk, niet in "semanu.eu"), `BrandLogo`, `BrandBullet`. Logobron: `~/Desktop/SEMANU/Huisstijl/Logo`.
- **Bedrijf:** SEMANU BV, Kattendijkdok-Oostkaai 9, 2000 Antwerpen, België. Ondernemingsnummer
  0828.291.116, btw BE0828.291.116. Zaakvoerder Tom de Vree. hello@semanu.eu, +32 496 04 56 06
  (één bron: `src/lib/contact.ts`).
- **Diensten:** 3D-configuratoren, bedrijfssoftware (`/services/ai-native`), consultancy.
  Oude dienst-URL's 301'en (zie `next.config.mjs`).
- **Prijzen:** nergens bedragen op de site; overal "op aanvraag" (per taal). Valuta EUR, excl. btw.
- **Doelgroep in de teksten** is nog Zwitsers (blogs, landingspagina's `*-schweiz`): bewust zo gelaten
  bij de rebrand; wijzigen is een beslissing van Tom.

## Stack

Next.js 15 (App Router, TypeScript, `output: 'standalone'`) · next-intl (nl, en, de, fr, es;
`localePrefix: 'always'`, standaardtaal en) · Tailwind CSS v4 (tokens in `src/app/globals.css`
`@theme`, Marine + Mint: niet aanpassen) · zod · vitest.

Controle na wijzigingen: `npx tsc --noEmit`, `npm test`, pariteit van de vijf berichtbestanden.

## Huisregels voor teksten (elke taal)

- **Geen gedachtestreepjes** (— –). Geen koppeltekens in nieuwe samenstellingen waar de taal het toelaat.
- **Geen komma voor een nevenschikkend voegwoord:** niet ", en/of/maar/met", ", und/oder/aber/mit",
  ", et/ou/mais/avec", ", and/or/but/with", ", y/o/pero/con". Herschrijf de zin.
- Duits in Zwitserse spelling (ss, nooit ß), zoals de bestaande teksten.
- URL-slugs houden hun koppeltekens (SEO).
- Paginatitels: `Pagina · semanu.eu`.

## Contactformulier → SEMANU leadsbord

`ContactForm.tsx` en `FunnelForm.tsx` (website-analyse) posten naar `/api/leads`
(`src/app/api/leads/route.ts`). Die route valideert (`src/lib/validation.ts`), checkt honeypot,
een in-memory limiet (5 per IP per uur) en Turnstile (optioneel), en stuurt door naar de edge
function **`submit-contact`** van de SEMANU-backend (`src/lib/semanu-leads.ts`):

- prod `https://bjpcgqejprkdqqohhere.supabase.co/functions/v1/submit-contact` (`SITE_ENV=production`)
- staging `https://kiiyvctcfvfrivpjsfjo.supabase.co/...` (elke andere `SITE_ENV`)
- sleutel: `SEMANU_SUPABASE_ANON_KEY` (publieke anon key, enkel via env).

`submit-contact` doet spamscore, rate limit, MX-check, dubbels en `create_lead` (bedrijf + persoon +
kaart in "Nieuw") en mailt hello@. Dienstkeuze → topic: 3D → `configurator`, bedrijfssoftware →
`custom`, workflow → `ai`, rest → consultancy. Telefoon en herkomst (pagina, taal, referrer) gaan
als staartregel mee in het bericht. De bron van de function staat in de Website-repo
(`~/Desktop/SEMANU/Website/supabase/functions/submit-contact`); **die repo niet vanuit hier wijzigen.**

## Hosting en deploy

Hetzner, server 2.31.50.26, één server met twee omgevingen: live (www.semanu.eu, Node op poort
3000, `semanu-eu-live`) en staging (acc.semanu.eu, poort 3001, wachtwoord + noindex,
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
de amai-voorbeeldrapporten en ongebruikte componenten. Twijfelgevallen staan in `_archive/`
(amai-docs, merkkits, oude Supabase-map, configurator-engine, Claude-outputs). `_archive/` hoort
niet bij de site.

## Niet doen

- Geen amai, CHF of Zwitserse btw/wet terugbrengen. Uitzondering: de blog over het Zwitserse revDSG
  noemt de wettelijke boete in CHF.
- Geen geheimen committen; `.env.local` nooit openen of kopiëren.
- `globals.css` `@theme` (huisstijl) niet wijzigen zonder vraag van Tom.
