# semanu.eu op Hetzner zetten

Eén server (Hetzner-project SEMANU, server `semanu-eu`, 2.31.50.26, IPv6 2a01:4f8:1c16:27a3::1)
draait twee omgevingen naast elkaar:

| Omgeving | Adres | Node-dienst | Poort | Supabase voor het contactformulier |
|---|---|---|---|---|
| Live | https://www.semanu.eu (semanu.eu stuurt door naar www) | `semanu-eu-live` | 3000 | prod `bjpcgqejprkdqqohhere` |
| Staging | https://acc.semanu.eu (openbaar, noindex) | `semanu-eu-acc` | 3001 | staging `kiiyvctcfvfrivpjsfjo` |

Caddy staat ervoor (SSL, compressie, beveiligingsheaders) en stuurt door naar de twee Node-diensten.
De server is al opgezet met het standaardsjabloon (Caddy, firewall, enkel SSH-sleutel, automatische
updates). Hieronder komt daar Node bij.

## 1. DNS (bij Combell)

Alleen A- en AAAA-records. **Nooit MX of nameservers wijzigen** (de mail op semanu.eu moet blijven werken).

| Naam | Type | Waarde |
|---|---|---|
| `semanu.eu` | A | 2.31.50.26 |
| `semanu.eu` | AAAA | 2a01:4f8:1c16:27a3::1 |
| `www.semanu.eu` | A | 2.31.50.26 |
| `www.semanu.eu` | AAAA | 2a01:4f8:1c16:27a3::1 |
| `acc.semanu.eu` | A | 2.31.50.26 |
| `acc.semanu.eu` | AAAA | 2a01:4f8:1c16:27a3::1 |

Bestaat er voor `www` een CNAME, verwijder die dan eerst (een naam kan niet tegelijk CNAME en A hebben).
Het IPv6-adres staat ook in de Hetzner Console bij de server, tabblad Networking.
Controle vanaf de Mac: `dig +short www.semanu.eu A` en `dig +short www.semanu.eu AAAA`.

## 2. Server eenmalig klaarmaken

Alles als root op de server: `ssh root@2.31.50.26`.

**Node LTS (22) installeren**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh
bash /tmp/nodesource_setup.sh
apt-get install -y nodejs
node -v   # v22.x
```

**Eigen gebruiker zonder login en de mappen**

```bash
useradd --system --no-create-home --shell /usr/sbin/nologin semanu-web
install -d -m 755 /srv/semanu-eu/live/releases /srv/semanu-eu/acc/releases
install -d -m 750 -o root -g semanu-web /etc/semanu-eu
```

**Instellingen per omgeving** (dit vul jij zelf in, het komt nooit in de repo)

```bash
cat > /etc/semanu-eu/live.env <<'EOF'
SEMANU_SUPABASE_ANON_KEY=
SEMANU_EU_FORWARD_SECRET=
TURNSTILE_SECRET_KEY=
SENTRY_DSN=
EOF
cp /etc/semanu-eu/live.env /etc/semanu-eu/acc.env
chown root:semanu-web /etc/semanu-eu/*.env && chmod 640 /etc/semanu-eu/*.env
nano /etc/semanu-eu/live.env   # anon key van het prod-project
nano /etc/semanu-eu/acc.env    # anon key van het staging-project
```

De anon key vind je in Supabase bij het project, Project Settings, API ("anon public").
Zonder die sleutel tonen de formulieren een foutmelding in plaats van de lead door te sturen.

`SEMANU_EU_FORWARD_SECRET` is hetzelfde geheim als de Supabase-secret met die naam in het
bijbehorende project (zie hoofdstuk 5). Leeg laten mag: de formulieren werken dan nog, maar
submit-contact telt alle bezoekers samen op het IP van de server.

**Systemd-diensten** (vanaf de Mac, in de map SEMANU-EU)

```bash
scp deploy/semanu-eu-live.service deploy/semanu-eu-acc.service root@2.31.50.26:/etc/systemd/system/
ssh root@2.31.50.26 'systemctl daemon-reload && systemctl enable semanu-eu-live semanu-eu-acc'
```

Ze starten pas echt na de eerste deploy (er is nog geen `current`-map).

**Caddy omzetten van de plaatshouder naar de Node-diensten**

Staging heeft geen wachtwoord meer (beslissing oktober 2026); het blokje `staging-auth.caddy` wordt niet meer ingelezen.
Maak er het blokje van dat de Caddyfile inleest, zet de nieuwe Caddyfile en herlaad:

```bash
# op de server
printf 'basic_auth {\n\tsemanu %s\n}\n' "$(cat /etc/caddy/staging.hash)" > /etc/caddy/staging-auth.caddy
chown root:caddy /etc/caddy/staging-auth.caddy && chmod 640 /etc/caddy/staging-auth.caddy
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.plaatshouder

# vanaf de Mac
scp deploy/Caddyfile root@2.31.50.26:/etc/caddy/Caddyfile

# op de server
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && systemctl reload caddy
```

Tot de eerste deploy geeft de site een 502; dat is normaal. Terug naar de plaatshouder:
`cp /etc/caddy/Caddyfile.plaatshouder /etc/caddy/Caddyfile && systemctl reload caddy`.

## 3. Eerste deploy

Vanaf de Mac, in de map SEMANU-EU, met alles gecommit:

```bash
./deploy/deploy.sh acc
```

Het script bouwt de gecommitte code (zonder `.env.local`) met de waarden uit `deploy/build-acc.env`,
zet een nieuwe release op de server, herstart `semanu-eu-acc` en controleert of `/nl` antwoordt.

Nakijken op https://acc.semanu.eu (geen wachtwoord):
- de pagina's in alle talen, het logo en de favicon;
- het contactformulier: na verzenden moet er een kaart op het leadsbord van de **staging**-omgeving
  van het dashboard staan (acc.semanu.be);
- `https://acc.semanu.eu/robots.txt` toont `Disallow: /`.

Dan live:

```bash
./deploy/deploy.sh live
```

Het script vraagt "ja". Daarna https://www.semanu.eu nakijken en één keer het contactformulier testen
(de kaart landt nu op het echte leadsbord; verwijder ze daarna).

## 4. Dagelijks gebruik

| Wat | Commando |
|---|---|
| Nieuwe versie op staging | `./deploy/deploy.sh acc` |
| Dezelfde commit live | `./deploy/deploy.sh live` |
| Staging terug naar vorige versie | `./deploy/deploy.sh rollback acc` |
| Live terug naar vorige versie | `./deploy/deploy.sh rollback live` |
| Logboek live | `ssh root@2.31.50.26 journalctl -u semanu-eu-live -n 100` |
| Logboek staging | `ssh root@2.31.50.26 journalctl -u semanu-eu-acc -n 100` |

De laatste drie releases blijven per omgeving bewaard in `/srv/semanu-eu/<omgeving>/releases`.

## 5. Bezoekers-IP doorgeven aan submit-contact

Het formulier gaat via `/api/leads` op deze server naar submit-contact. Zonder hulp ziet
submit-contact voor elke bezoeker het IP van de server, waardoor zijn limiet (5 per uur per IP)
voor iedereen samen telt. Daarom:

- Caddy zet `X-Real-IP` op het echte IP van de bezoeker (`header_up X-Real-IP {remote_host}`) en
  overschrijft wat de bezoeker zelf meestuurt. Er staat nergens `trusted_proxies`, dus ook een
  meegestuurde `X-Forwarded-For` wordt vervangen. De app leest alleen `X-Real-IP`.
- De app stuurt dat IP als `X-Visitor-IP` door, samen met `X-Forward-Secret`.
  submit-contact gebruikt het alleen als het geheim klopt; anders negeert het de header.
- Met een geldig geheim krijgt de lead bron "Contactformulier semanu.eu" en geeft een overschreden
  limiet een 429 terug. Het formulier toont dan een vriendelijke melding met hello@semanu.eu.

**Geheim aanmaken en zetten** (nooit in de chat, nooit in de repo):

Eén geheim per omgeving: acc hoort bij staging, live bij prod. Alles in Terminal (zsh) op de Mac,
het geheim komt nooit op het scherm, in de shellgeschiedenis of in een procesargument:

```bash
read -rs ACC_SECRET  < <(openssl rand -hex 32)
read -rs LIVE_SECRET < <(openssl rand -hex 32)
cd ~/SEMANU/semanu-ops
(umask 077; printf 'SEMANU_EU_FORWARD_SECRET=%s\n' "$ACC_SECRET" > /tmp/fw-acc.env; printf 'SEMANU_EU_FORWARD_SECRET=%s\n' "$LIVE_SECRET" > /tmp/fw-live.env)
supabase secrets set --env-file /tmp/fw-acc.env  --project-ref kiiyvctcfvfrivpjsfjo
supabase secrets set --env-file /tmp/fw-live.env --project-ref bjpcgqejprkdqqohhere
# zelfde waarde in de env-bestanden op de server (oude regel eerst weg)
ssh root@2.31.50.26 'sed -i "/^SEMANU_EU_FORWARD_SECRET=/d" /etc/semanu-eu/acc.env  && cat >> /etc/semanu-eu/acc.env'  < /tmp/fw-acc.env
ssh root@2.31.50.26 'sed -i "/^SEMANU_EU_FORWARD_SECRET=/d" /etc/semanu-eu/live.env && cat >> /etc/semanu-eu/live.env' < /tmp/fw-live.env
rm -P /tmp/fw-acc.env /tmp/fw-live.env
```

Laat die Terminal open voor de test hieronder (`$ACC_SECRET` en `$LIVE_SECRET` blijven in het geheugen).

**Node alleen op loopback.** De diensten draaien met `HOSTNAME=localhost` en
`NODE_OPTIONS=--dns-result-order=ipv4first`, dus ze luisteren op 127.0.0.1. (Met `127.0.0.1` als
HOSTNAME breken de taalpagina's: Next.js ziet de herschrijving van next-intl dan als een extern
adres en geeft 500.) Controle op de server:

```bash
ss -ltnp | grep -E ':300[01]'     # enkel 127.0.0.1:3000 en 127.0.0.1:3001
ufw status                        # enkel 22, 80 en 443 toegelaten
curl -m 5 http://2.31.50.26:3000/ # vanaf de Mac: moet mislukken
```

**Live test na de deploy** (in dezelfde Terminal als hierboven; maakt testleads op staging aan,
verwijder ze daarna op acc.semanu.be):

```bash
FN=https://kiiyvctcfvfrivpjsfjo.supabase.co/functions/v1/submit-contact
body() { printf '{"name":"Forward Test","email":"semanu.forwardtest+%s@gmail.com","company":"Forward Test","topic":"consultancy","message":"Test doorgeven IP","lang":"nl","_ts":%s}' "$1" "$(( $(date +%s) * 1000 - 5000 ))"; }
VIP=198.51.100.$(( RANDOM % 200 + 20 ))

# 1. Fout geheim: X-Visitor-IP wordt genegeerd, gedrag zoals vroeger (200 {"ok":true,...})
curl -s -w ' %{http_code}\n' -H 'Content-Type: application/json' -H 'X-Forward-Secret: fout' -H "X-Visitor-IP: $VIP" -d "$(body a1)" "$FN"

# 2. Juist geheim: vijf keer 200, de zesde 429 {"ok":false,"error":"rate_limited"}
for i in 1 2 3 4 5 6; do
  curl -s -w ' %{http_code}\n' -H 'Content-Type: application/json' -H @<(printf 'X-Forward-Secret: %s\n' "$ACC_SECRET") -H "X-Visitor-IP: $VIP" -d "$(body b$i)" "$FN"
done

# 3. Ander bezoekers-IP met hetzelfde geheim: weer 200
curl -s -w ' %{http_code}\n' -H 'Content-Type: application/json' -H @<(printf 'X-Forward-Secret: %s\n' "$ACC_SECRET") -H "X-Visitor-IP: 198.51.100.$(( RANDOM % 20 ))" -d "$(body c1)" "$FN"

# 4. Via de site (acc): vijf keer 200, de zesde 429,
#    ook als je zelf een X-Forwarded-For of X-Real-IP meestuurt
for i in 1 2 3 4 5 6; do
  curl -s -w ' %{http_code}\n' -H 'Content-Type: application/json' -H "X-Forwarded-For: 9.9.9.$i" -H "X-Real-IP: 8.8.8.$i" \
    -d "{\"formType\":\"contact\",\"firstname\":\"Forward\",\"lastname\":\"Test\",\"email\":\"semanu.forwardtest+d$i@gmail.com\",\"company\":\"Forward Test\",\"phone\":\"+32 496 04 56 06\",\"message\":\"Test via de site\",\"consent\":true,\"lang\":\"nl\"}" \
    https://acc.semanu.eu/api/leads
done
```

Verwacht op het leadsbord van acc.semanu.be: de kaarten uit stap 2 tot 4 met bron
"Contactformulier semanu.eu", die uit stap 1 met "Contactformulier". In het formulier op
https://acc.semanu.eu/nl/contact verschijnt bij de zesde inzending binnen het uur de melding met hello@semanu.eu.
Live herhaal je stap 2 met `$LIVE_SECRET` en de prod-URL
(`https://bjpcgqejprkdqqohhere.supabase.co/functions/v1/submit-contact`), en verwijder je de kaarten.

## Waarom zo

- **Twee builds per commit.** De site-URL, `robots.txt`, de noindex-header en de analytics-id's worden
  bij het bouwen vastgelegd. Daarom bouwt `acc` en `live` elk apart uit dezelfde commit.
  `deploy.sh live` waarschuwt als de commit niet eerst op acc stond.
- **Bouwen op de Mac.** De server is klein; een Next.js-build kan daar zonder geheugen vallen. Alleen
  de Linux-versie van `sharp` (beeldverkleining) wordt op de server zelf geïnstalleerd.
- **Staging nooit in Google.** `X-Robots-Tag: noindex` van Caddy en van
  de app, en `robots.txt` blokkeert alles zodra `SITE_ENV` niet `production` is.
