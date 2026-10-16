# amai.ch — Go live (Hostpoint + Cloudflare + Vercel)

Rollen:
- **Hostpoint** = registrar (je kocht hier het domein `amai.ch`). Enige taak: de
  nameservers naar Cloudflare wijzen.
- **Cloudflare** = DNS + CDN + security (WAF, rate-limiting). Beheert de DNS-zone.
- **Vercel** = host van de Next.js-app (build, SSL, serverless functions/API routes).

Verkeer: bezoeker → Cloudflare (edge) → Vercel (app). Registratie blijft bij Hostpoint.

---

## Fase 0 — Lokaal klaarzetten (op je Mac)

1. Controleer dat het bouwt:
   ```
   cd ~/Documents/Claude/Projects/AMAI
   npx tsc --noEmit
   npm run build
   ```
   Beide moeten zonder fouten eindigen. (Lukt `npm run build` niet, fix dat eerst,
   anders faalt de Vercel-build ook.)

2. Zet het project in git en push naar **GitHub** (Vercel deployt vanuit een repo):
   ```
   git init
   git add -A
   git commit -m "amai.ch — marketing site ready for launch"
   ```
   Maak op github.com een **private** repo `amai-ch`, dan:
   ```
   git remote add origin https://github.com/<jouw-account>/amai-ch.git
   git branch -M main
   git push -u origin main
   ```
   Let op: `.env.local` staat in `.gitignore` en hoort NIET in de repo. Goed zo.

---

## Fase 1 — Vercel (host)

3. Ga naar **vercel.com**, log in met je GitHub-account.
4. **Add New → Project → Import** de repo `amai-ch`. Vercel detecteert Next.js
   automatisch (build command `next build`, niets aanpassen).
5. **Environment Variables** (Settings → Environment Variables). Voeg minstens toe
   voor de marketingsite:
   - `NEXT_PUBLIC_SITE_URL` = `https://amai.ch`
   - `NEXT_PUBLIC_GA_ID` = je GA4-id (optioneel)

   Voeg de back-end keys toe zodra je ze hebt (formulieren/checkout werken pas dan):
   - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_BUSINESS`, `STRIPE_PRICE_WEBSHOP`, `STRIPE_PRICE_LOGO`, `STRIPE_PRICE_GOOGLE_ADS`, `ORDER_FLOW_MODE`
   - Email: `RESEND_API_KEY`, `LEAD_NOTIFICATION_TO`, `LEAD_NOTIFICATION_FROM`
   - Spam: `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

   (Volledige lijst staat in `.env.example`.)
6. **Deploy**. Je krijgt een `https://amai-ch-xxxx.vercel.app`. Open die en test dat
   de site werkt (naar `/de` toe). Dit is je vangnet vóór het domein gekoppeld is.

---

## Fase 2 — Cloudflare (DNS toevoegen)

7. Ga naar **cloudflare.com**, maak een (gratis) account.
8. **Add a site** → typ `amai.ch` → kies het Free-plan. Cloudflare scant de huidige
   DNS van Hostpoint en importeert de records.
9. **BELANGRIJK — e-mail/MX**: controleer in Cloudflare → DNS dat de **MX-records**
   en mail-records (vaak `mail`, `autodiscover`, SPF `TXT`) van Hostpoint zijn
   meegekomen. Gebruik je `hello@amai.ch` via Hostpoint-mail, dan moeten die records
   blijven bestaan, anders valt je e-mail uit na de nameserver-wissel.
10. Cloudflare toont **twee nameservers** (bv. `xxx.ns.cloudflare.com`). Noteer die.

---

## Fase 3 — Hostpoint (nameservers wijzigen)

11. Log in op je **Hostpoint Control Panel**.
12. Ga naar **Domains** → selecteer `amai.ch` → **Nameserver** (of "DNS / Nameserver").
13. Zet van "Hostpoint nameservers" naar **eigen/externe nameservers** en vul de
    **twee Cloudflare-nameservers** uit stap 10 in. Opslaan.
14. Terug in Cloudflare: wacht tot de site op **Active** springt (nameserver-wissel
    duurt meestal 30 min tot enkele uren, soms tot 24u). Cloudflare mailt je.

---

## Fase 4 — Domein koppelen aan Vercel + SSL

15. In **Vercel → Project → Settings → Domains**: voeg `amai.ch` toe en ook
    `www.amai.ch`. Kies `amai.ch` als hoofddomein (Vercel laat `www` ernaartoe
    redirecten). Vercel toont de exacte DNS-records die het verwacht.
16. In **Cloudflare → DNS** zet je die records (gebruik wat Vercel toont; standaard):
    - `A` record, naam `@` → `76.76.21.21`
    - `CNAME` record, naam `www` → `cname.vercel-dns.com`
    Zet beide voorlopig op **DNS only (grijze wolk)**. Dat is nodig zodat Vercel het
    **SSL-certificaat** kan uitgeven (een geproxyde/oranje wolk blokkeert dat).
17. Wacht tot Vercel bij de domeinen een **groen vinkje** + "Valid Configuration"
    toont en het certificaat is uitgegeven (meestal enkele minuten).

---

## Fase 5 — Cloudflare-bescherming aanzetten (aanbevolen)

18. Pas nu de DNS-records in Cloudflare naar **Proxied (oranje wolk)**. Hierdoor loopt
    verkeer via Cloudflare (CDN, WAF, rate-limiting).
19. Cloudflare → **SSL/TLS → Overview** → zet de modus op **Full (strict)**. (Niet
    "Flexible", dat geeft redirect-loops met Vercel.)
20. Cloudflare → **Security**: zet een **Rate limiting rule** op `/(api/.*)` (bv. 10
    requests/minuut per IP) en de **Managed WAF rules** aan. Dit dekt het security-punt
    uit `SECURITY_TODO.md`.

> Wil je het simpel houden: sla fase 5 over en laat alles op **DNS only (grijs)**.
> Vercel serveert dan met eigen SSL + CDN; je mist alleen Cloudflare's WAF/rate-limiting
> (die kun je later aanzetten).

---

## Fase 6 — Afronden / na livegang

21. Bevestig `NEXT_PUBLIC_SITE_URL = https://amai.ch` in Vercel en **redeploy**
    (zodat canonical, hreflang, OG, sitemap en `robots` het echte domein gebruiken).
22. Back-end activeren (zie `STRIPE_SETUP.md` + `supabase/README.md`):
    - Supabase-project maken, migraties `0001` + `0002` toepassen, keys in Vercel zetten.
    - Stripe: producten/prijzen aanmaken, en de **webhook** registreren op
      `https://amai.ch/api/stripe/webhook` → `STRIPE_WEBHOOK_SECRET` in Vercel.
    - Resend: domein `amai.ch` verifiëren (DKIM/SPF in Cloudflare) voor verzendmail.
23. Test live: `https://amai.ch` → moet naar `/de` redirecten, slot/HTTPS groen,
    contactformulier en checkout testen, `https://amai.ch/sitemap.xml`,
    `https://amai.ch/robots.txt`, `https://amai.ch/llms.txt`, favicon.
24. Submit `https://amai.ch/sitemap.xml` in **Google Search Console** (domein
    verifiëren via een TXT-record in Cloudflare).

---

## Volgorde-samenvatting
GitHub push → Vercel import + deploy → Cloudflare site toevoegen (MX checken) →
Hostpoint nameservers naar Cloudflare → Vercel domein toevoegen + records in
Cloudflare (grijs) → cert klaar → Cloudflare oranje + Full strict + rate-limit →
env's + redeploy → back-end + tests.

## Valkuilen
- **E-mail**: vergeet de MX/mail-records niet over te nemen in Cloudflare (stap 9).
- **SSL**: records eerst **grijs** (cert uitgeven), pas daarna **oranje**; SSL op
  **Full (strict)**.
- **`.env.local` nooit committen** (staat al in `.gitignore`).
- Eerst `npm run build` lokaal groen, dan pas deployen.
