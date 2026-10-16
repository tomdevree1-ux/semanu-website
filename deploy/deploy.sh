#!/usr/bin/env bash
# Deploy semanu.eu (Next.js standalone) to the SEMANU Hetzner server.
#
#   ./deploy/deploy.sh acc            build the committed HEAD for acc.semanu.eu and roll it out
#   ./deploy/deploy.sh live           build the same commit for www.semanu.eu (asks "ja")
#   ./deploy/deploy.sh rollback acc   switch acc back to the previous release
#   ./deploy/deploy.sh rollback live  switch live back to the previous release (asks "ja")
#
# Order: always acc first, check it, then live. The live step refuses a commit that is
# not the one currently on acc unless you confirm.
#
# How: the committed tree (git archive HEAD, so no .env.local and no local changes) is
# built on this Mac with `output: 'standalone'`, then .next/standalone + .next/static +
# public are rsynced into a new release folder on the server. The server swaps in the
# Linux build of sharp (image optimisation), flips the `current` symlink and restarts the
# systemd service. The last 3 releases are kept for rollback.
#
# Needs: SSH key access to root@SERVER, Node 20+ and npm on this Mac, Node LTS on the server.
set -euo pipefail

SERVER="${SEMANU_EU_SERVER:-root@2.31.50.26}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

die() { echo "Error: $*" >&2; exit 1; }

target_vars() {
  case "$1" in
    acc)  PORT=3001; SERVICE=semanu-eu-acc;  URL="https://acc.semanu.eu";  BUILD_ENV="deploy/build-acc.env" ;;
    live) PORT=3000; SERVICE=semanu-eu-live; URL="https://www.semanu.eu"; BUILD_ENV="deploy/build-live.env" ;;
    *) die "unknown target '$1' (acc or live)" ;;
  esac
  BASE="/srv/semanu-eu/$1"
}

confirm() {
  read -r -p "$1 Typ ja: " ok
  [ "$ok" = "ja" ] || die "cancelled"
}

rollback() {
  local t="$1"; target_vars "$t"
  [ "$t" = "live" ] && confirm "Live terugzetten naar de vorige release?"
  ssh "$SERVER" "set -euo pipefail
    cd $BASE/releases
    cur=\$(basename \"\$(readlink -f $BASE/current)\")
    prev=\$(ls -1 | sort | grep -B1 -x \"\$cur\" | head -1)
    [ -n \"\$prev\" ] && [ \"\$prev\" != \"\$cur\" ] || { echo 'No previous release'; exit 1; }
    ln -sfn $BASE/releases/\$prev $BASE/current
    systemctl restart $SERVICE
    echo \"Rolled back to \$prev\""
}

deploy() {
  local t="$1"; target_vars "$t"

  [ -z "$(git status --porcelain)" ] || die "uncommitted changes; commit first (only committed code is deployed)"
  local rev; rev="$(git rev-parse --short HEAD)"

  if [ "$t" = "live" ]; then
    local accrev
    accrev="$(ssh "$SERVER" "cat /srv/semanu-eu/acc/current/REVISION 2>/dev/null || true")"
    if [ "$accrev" != "$rev" ]; then
      echo "Warning: acc runs '${accrev:-nothing}', you are deploying $rev to live."
      confirm "Toch $rev live zetten zonder dat het eerst op acc stond?"
    fi
    confirm "Commit $rev live zetten op $URL?"
  fi

  local tmp; tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  echo "== export $rev"
  git archive HEAD | tar -x -C "$tmp"
  echo "$rev" > "$tmp/REVISION"

  echo "== install + build ($t)"
  (
    cd "$tmp"
    npm ci --no-audit --no-fund --loglevel=error
    set -a
    # shellcheck disable=SC1090
    source "$ROOT_DIR/$BUILD_ENV"
    set +a
    NEXT_TELEMETRY_DISABLED=1 npx next build
    cp -R public .next/standalone/public
    mkdir -p .next/standalone/.next
    cp -R .next/static .next/standalone/.next/static
    cp REVISION .next/standalone/REVISION
  )
  local sharp_ver
  sharp_ver="$(node -p "require('$tmp/node_modules/sharp/package.json').version")"

  local rel; rel="$(date +%Y%m%d-%H%M%S)-$rev"
  echo "== upload release $rel"
  ssh "$SERVER" "install -d -m 755 $BASE/releases/$rel"
  rsync -az --delete --exclude '.DS_Store' "$tmp/.next/standalone/" "$SERVER:$BASE/releases/$rel/"

  echo "== activate on the server"
  ssh "$SERVER" "set -euo pipefail
    REL=$BASE/releases/$rel
    # Linux build of sharp instead of the macOS one from the standalone bundle.
    S=\$(mktemp -d)
    npm install --prefix \"\$S\" --no-save --no-audit --no-fund --loglevel=error sharp@$sharp_ver
    rm -rf \"\$REL/node_modules/sharp\" \"\$REL/node_modules/@img\"
    cp -a \"\$S/node_modules/sharp\" \"\$REL/node_modules/sharp\"
    [ -d \"\$S/node_modules/@img\" ] && cp -a \"\$S/node_modules/@img\" \"\$REL/node_modules/@img\"
    rm -rf \"\$S\"
    chown -R root:root \"\$REL\" && chmod -R u=rwX,go=rX \"\$REL\"
    install -d -o semanu-web -g semanu-web \"\$REL/.next/cache\"
    ln -sfn \"\$REL\" $BASE/current
    systemctl restart $SERVICE
    for i in \$(seq 1 30); do
      code=\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$PORT/nl || true)
      [ \"\$code\" = 200 ] && break
      sleep 1
    done
    [ \"\$code\" = 200 ] || { echo \"Health check failed (HTTP \$code); see: journalctl -u $SERVICE -n 50\"; exit 1; }
    # Node must listen on loopback only (see the systemd unit).
    if ss -ltn \"sport = :$PORT\" | grep -qvE '127\\.0\\.0\\.1:|State'; then
      echo \"WARNING: port $PORT listens on a non-loopback address; install the current systemd unit (HOSTNAME=localhost)\"
    fi
    cd $BASE/releases && ls -1 | sort | head -n -3 | xargs -r rm -rf
    echo \"OK: $rel is active\""

  echo "Live on $URL (release $rel)"
  if [ "$t" = "acc" ]; then echo "Check it, then: ./deploy/deploy.sh live"; fi
}

case "${1:-}" in
  acc|live) deploy "$1" ;;
  rollback) rollback "${2:?acc or live}" ;;
  *) echo "Usage: $0 acc | live | rollback <acc|live>"; exit 1 ;;
esac
