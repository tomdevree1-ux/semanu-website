# semanu.eu op Hetzner zetten

Eén server (Hetzner-project SEMANU, server `semanu-eu`, 2.31.50.26, IPv6 2a01:4f8:1c16:27a3::1)
draait twee omgevingen naast elkaar:

| Omgeving | Adres | Node-dienst | Poort | Supabase voor het contactformulier |
|---|---|---|---|---|
| Live | https://www.semanu.eu (semanu.eu stuurt door naar www) | `semanu-eu-live` | 3000 | prod `bjpcgqejprkdqqohhere` |
| Staging | https://acc.semanu.eu (wachtwoord, noindex) | `semanu-eu-acc` | 3001 | staging `kiiyvctcfvfrivpjsfjo` |

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

**Systemd-diensten** (vanaf de Mac, in de map SEMANU-EU)

```bash
scp deploy/semanu-eu-live.service deploy/semanu-eu-acc.service root@2.31.50.26:/etc/systemd/system/
ssh root@2.31.50.26 'systemctl daemon-reload && systemctl enable semanu-eu-live semanu-eu-acc'
```

Ze starten pas echt na de eerste deploy (er is nog geen `current`-map).

**Caddy omzetten van de plaatshouder naar de Node-diensten**

Het stagingwachtwoord staat al als hash in `/etc/caddy/staging.hash` (gebruiker `semanu`).
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

Nakijken op https://acc.semanu.eu (gebruiker `semanu` en het stagingwachtwoord):
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

## Waarom zo

- **Twee builds per commit.** De site-URL, `robots.txt`, de noindex-header en de analytics-id's worden
  bij het bouwen vastgelegd. Daarom bouwt `acc` en `live` elk apart uit dezelfde commit.
  `deploy.sh live` waarschuwt als de commit niet eerst op acc stond.
- **Bouwen op de Mac.** De server is klein; een Next.js-build kan daar zonder geheugen vallen. Alleen
  de Linux-versie van `sharp` (beeldverkleining) wordt op de server zelf geïnstalleerd.
- **Staging nooit in Google.** Wachtwoord vooraan in Caddy, `X-Robots-Tag: noindex` van Caddy en van
  de app, en `robots.txt` blokkeert alles zodra `SITE_ENV` niet `production` is.
