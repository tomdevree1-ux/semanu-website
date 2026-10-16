#!/usr/bin/env python3
"""Force-send an amai! portal invite email via Resend.

Runs on a machine with outbound access to Resend (e.g. Tom's Mac); the Cowork
sandbox is blocked by Cloudflare (1010). Reads keys from .env.local. Stdlib only.

Usage:
    python3 scripts/send_invite.py fabian@amai.ch Fabian
"""
import json, sys, urllib.request, urllib.error, urllib.parse
from pathlib import Path

EMAIL = sys.argv[1] if len(sys.argv) > 1 else "fabian@amai.ch"
FIRST = sys.argv[2] if len(sys.argv) > 2 else EMAIL.split("@")[0].capitalize()
CC = ["tom@amai.ch"]  # keep Tom in copy on the invite
HOST = "https://amai.ch"  # production portal host (NEXT_PUBLIC_SITE_URL in Vercel)

env = {}
for line in (Path(__file__).resolve().parent.parent / ".env.local").read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    env[k] = v.strip().strip('"').strip("'")

SB = env["NEXT_PUBLIC_SUPABASE_URL"]; KEY = env["SUPABASE_SERVICE_ROLE_KEY"]; RESEND = env["RESEND_API_KEY"]
FROM = env.get("LEAD_NOTIFICATION_FROM") or "amai.ch <hello@amai.ch>"  # verified Resend sender


# A real browser User-Agent: Cloudflare (in front of Resend) blocks the default
# "Python-urllib" signature with error 1010, so we must masquerade as a browser.
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/122.0 Safari/537.36")


def post(url, body, headers):
    headers = {**headers, "User-Agent": UA}
    req = urllib.request.Request(url, method="POST", data=json.dumps(body).encode(), headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


# 1) fresh invite token (invalidates any previous invite link for this user)
s, b = post(
    SB + "/auth/v1/admin/generate_link", {"type": "invite", "email": EMAIL},
    {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"},
)
if s >= 300:
    sys.exit(f"generate_link failed {s}: {b[:300]}")
token = json.loads(b)["hashed_token"]
link = (f"{HOST}/app/auth/confirm?token_hash={urllib.parse.quote(token)}"
        f"&type=invite&next={urllib.parse.quote('/app/reset-password')}")

# 2) branded email via Resend
html = f"""<div style="margin:0;padding:24px;background:#EEF1F6;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB">
  <div style="background:#1B2A4A;padding:20px 26px">
    <span style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-.02em">amai<span style="color:#93E6BE">!</span></span>
    <span style="font-family:monospace;font-size:9px;letter-spacing:.2em;color:#93E6BE;text-transform:uppercase;margin-left:10px">Admin portal</span>
  </div>
  <div style="padding:26px 26px 30px;color:#07221F;font-size:15px;line-height:1.55">
    <p style="margin:0 0 14px">Hi {FIRST},</p>
    <p style="margin:0 0 14px">Here is your invitation to the amai! admin portal. Click the button below to set your password and activate your account.</p>
    <p style="margin:22px 0"><a href="{link}" style="display:inline-block;background:#93E6BE;color:#07221F;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:12px">Set your password</a></p>
    <p style="margin:0 0 8px;font-size:13px;color:#6B7684">If the button does not work, copy this link into your browser:</p>
    <p style="margin:0 0 18px;font-size:12px;word-break:break-all"><a href="{link}" style="color:#0B7E63">{link}</a></p>
    <p style="margin:0 0 4px">See you inside,</p>
    <p style="margin:0;font-weight:700">Tom · amai!</p>
  </div>
</div></div>"""
s, b = post(
    "https://api.resend.com/emails",
    {"from": FROM, "to": [EMAIL], "cc": CC,
     "subject": "You have been invited to amai!", "html": html},
    {"Authorization": "Bearer " + RESEND, "Content-Type": "application/json"},
)
print("Resend status:", s)
print("Resend resp  :", b[:300])
if 200 <= s < 300:
    print(f"\nInvite email sent to {EMAIL}.")
else:
    print(f"\nSend failed. Fallback link to forward manually:\n{link}")
