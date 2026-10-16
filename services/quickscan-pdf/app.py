# -*- coding: utf-8 -*-
"""
amai! Quickscan PDF service — a tiny secured HTTP wrapper around qs_engine.build().

  POST /render   body: {"site": {...}}   header: X-Service-Secret: <PDF_SERVICE_SECRET>
        -> 200 application/pdf  (the rendered Swiss-German quickscan), or 401/422/500
  GET  /health   -> {"ok": true}

Only the amai worker should call this; it authenticates with the shared PDF_SERVICE_SECRET
(constant-time compared). The service writes no data and keeps nothing — it renders and returns.

Run locally:  PDF_SERVICE_SECRET=dev uvicorn app:app --host 0.0.0.0 --port 8080
"""
import os, tempfile, hmac
from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.responses import Response
import qs_engine

app = FastAPI(title="amai quickscan pdf", docs_url=None, redoc_url=None, openapi_url=None)

REQUIRED_KEYS = [
    "slug", "file", "firma", "meta", "date_str", "scores", "exec", "scorecard", "algemene",
    "goed", "layers", "imps", "impact_text", "conversie", "seo", "vertrouwen", "roadmap", "conclusie",
]


def _secret() -> str:
    return (os.environ.get("PDF_SERVICE_SECRET") or "").strip()


@app.get("/health")
def health():
    return {"ok": True, "configured": bool(_secret())}


@app.post("/render")
async def render(request: Request, x_service_secret: str = Header(default="")):
    secret = _secret()
    if not secret:
        # Refuse to run unauthenticated — never expose an open PDF renderer.
        raise HTTPException(status_code=503, detail="service not configured (PDF_SERVICE_SECRET unset)")
    if not hmac.compare_digest(x_service_secret.strip(), secret):
        raise HTTPException(status_code=401, detail="unauthorized")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="invalid json")
    site = body.get("site") if isinstance(body, dict) else None
    if not isinstance(site, dict):
        raise HTTPException(status_code=422, detail="missing site object")

    missing = [k for k in REQUIRED_KEYS if k not in site]
    if missing:
        raise HTTPException(status_code=422, detail="missing keys: " + ", ".join(missing))
    if not (isinstance(site["scores"], list) and len(site["scores"]) == 8):
        raise HTTPException(status_code=422, detail="scores must be 8 numbers")
    if not (isinstance(site["layers"], list) and len(site["layers"]) == 9):
        raise HTTPException(status_code=422, detail="layers must be 9 entries")
    if not (isinstance(site["imps"], list) and len(site["imps"]) == 8):
        raise HTTPException(status_code=422, detail="imps must be 8 entries")

    with tempfile.TemporaryDirectory() as tmp:
        try:
            out = qs_engine.build(site, tmp, tmp_dir=tmp)
            with open(out, "rb") as f:
                pdf = f.read()
        except Exception as e:
            raise HTTPException(status_code=500, detail="render failed: " + type(e).__name__)

    filename = (site.get("file") or "quickscan.pdf").replace('"', "")
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
