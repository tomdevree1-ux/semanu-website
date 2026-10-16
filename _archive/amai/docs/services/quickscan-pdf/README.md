# amai! Quickscan PDF service

A tiny HTTP service that renders the branded Swiss-German quickscan PDF (radar + impact/effort
matrix, 12 sections, Marine + Mint) from a `site` dict. The amai portal worker calls it; weasyprint
needs system libraries that Vercel can't provide, so this runs as its own small container.

## Files
- `qs_engine.py` — the renderer (Marine + Mint), unchanged content contract (see the playbook).
- `app.py` — secured HTTP wrapper: `POST /render` + `GET /health`.
- `Dockerfile`, `requirements.txt` — to build + run it anywhere that supports Docker.

## What it exposes
- `GET /health` -> `{"ok": true, "configured": true}`
- `POST /render` with header `X-Service-Secret: <secret>` and body `{"site": { ... }}`
  -> `200 application/pdf`. Wrong/empty secret -> `401`. Bad payload -> `422`.

It stores nothing and authenticates every call with a shared secret.

## Deploy (Render — simplest)
1. Put this folder in its own Git repo (GitHub).
2. Render -> New -> **Web Service** -> connect the repo. Render detects the `Dockerfile`.
3. Add an environment variable **`PDF_SERVICE_SECRET`** = a long random string (e.g. 40+ chars). Keep it.
4. Deploy. Note the URL, e.g. `https://amai-quickscan.onrender.com`.
5. Test:
   ```bash
   curl https://amai-quickscan.onrender.com/health
   ```
   (Railway or Google Cloud Run work the same way — any Docker host.)

> Free tiers sleep when idle, so the first render after a pause is slow (cold start). That is fine:
> the portal renders in a background worker, not in the visitor's request.

## Connect it to the portal
In Vercel (project `amai-ops`) set, then Redeploy:
- `PDF_SERVICE_URL` = the service URL above (no trailing slash)
- `PDF_SERVICE_SECRET` = the exact same secret

## Local run
```bash
pip install -r requirements.txt           # needs the system libs from the Dockerfile
PDF_SERVICE_SECRET=dev uvicorn app:app --host 0.0.0.0 --port 8080
```

## Notes
- The PDF fonts (Archivo, Space Mono) load from Google Fonts at render time, so the container needs
  outbound network (every host above allows it). matplotlib uses the bundled DejaVu font.
- The `site` dict contract is exactly the one in `QUICKSCAN_PLAYBOOK.md` section 6 (8 scores, 9 layers,
  8 opportunities). The portal builds it automatically; this service only renders.
