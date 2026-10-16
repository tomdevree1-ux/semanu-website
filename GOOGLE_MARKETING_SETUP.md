# Google marketing setup — GA4 + Search Console (+ Ads)

Step-by-step to finish the Google data connection. **The code is already done**
(`src/lib/google/auth.ts`, `src/lib/google/marketing.ts`, the admin route
`/api/admin/marketing-report`). This is **configuration only** — no coding.

It works with **one read-only Google service account** that you grant access to
your GA4 property and your Search Console site. No OAuth, no refresh tokens.

At the end you will have set these in **Vercel** (Project → Settings →
Environment Variables):

| Variable | What | Default in code |
|---|---|---|
| `GOOGLE_SA_B64` | base64 of the service-account JSON key | (empty — **this is the blocker**) |
| `GA4_PROPERTY_ID` | numeric GA4 property id | `541325140` |
| `GSC_SITE_URL` | `sc-domain:amai.ch` or `https://amai.ch/` | `sc-domain:amai.ch` |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | `AW-…` conversion tag (section E) | (empty) |

Work top to bottom. ~20 minutes.

---

## A. Create the service account + enable the APIs (Google Cloud)

1. Open <https://console.cloud.google.com> and sign in with the Google account
   that can access your GA4 + Search Console.
2. Top bar → project dropdown → **New Project** → name it e.g. `amai-marketing`
   → **Create**, then select it (project dropdown → pick it).
3. Enable two APIs. Go to **APIs & Services → Library**, then for each: type the
   name, open it, click **Enable**:
   - **Google Analytics Data API**
   - **Search Console API**
4. Create the service account: **APIs & Services → Credentials →
   + Create credentials → Service account**.
   - Service account name: e.g. `amai-marketing-reader` → **Create and continue**.
   - "Grant this service account access" → leave empty → **Continue** → **Done**.
5. Open the new service account (click its name) → **Keys** tab →
   **Add key → Create new key → JSON → Create**. A `.json` file downloads to your
   computer. Treat it like a password.
6. Copy the service account **email** (looks like
   `amai-marketing-reader@amai-marketing.iam.gserviceaccount.com`). You grant this
   access in section B.

---

## B. Give the service account read access

### B1. GA4 (Google Analytics)

1. Open <https://analytics.google.com> → **Admin** (the gear, bottom-left).
2. Check the correct **Property** is selected (your amai.ch property, top of the
   Property column).
3. **Property Access Management** → **+** (top-right) → **Add users**.
4. Paste the service-account email → role **Viewer** → untick **Notify new users
   by email** (it's a robot) → **Add**.
5. Note the **Property ID**: Admin → **Property details** → the number under
   "PROPERTY ID" (e.g. `541325140`). Keep it for section C.

### B2. Search Console

1. Open <https://search.google.com/search-console> → select the **amai.ch**
   property (top-left switcher).
2. **Settings** (left menu) → **Users and permissions** → **Add user**.
3. Paste the service-account email → permission **Restricted** (read is enough) →
   **Add**.
4. Note the property **type**: a **Domain** property uses the value
   `sc-domain:amai.ch`; a **URL-prefix** property uses `https://amai.ch/`. The code
   defaults to `sc-domain:amai.ch`.

---

## C. Put the key + IDs in Vercel

1. Turn the JSON key into one base64 line. On your Mac, open **Terminal** and run
   (adjust the filename/path to the file you downloaded in A5):
   ```bash
   base64 -i ~/Downloads/amai-marketing-xxxxxx.json | tr -d '\n' | pbcopy
   ```
   This copies the whole base64 string to your clipboard (no line breaks).
2. Vercel → your amai project → **Settings → Environment Variables → Add another**:
   - **Key** `GOOGLE_SA_B64` · **Value** = paste the base64 · **Environments**:
     tick **Production** (Preview too if you like) · **Save**.
   - Only if your GA4 number is **not** `541325140`: add `GA4_PROPERTY_ID` = your
     number from B1.5.
   - Only if Search Console is a URL-prefix property: add `GSC_SITE_URL` =
     `https://amai.ch/` (otherwise leave it — the default `sc-domain:amai.ch` is used).
3. **Redeploy** so the new env is picked up: Vercel → **Deployments** → latest →
   **⋯ → Redeploy**.

---

## D. Verify it works

1. Sign in to the portal as the **super-admin** (the same Google/Supabase login
   you use for `/app`).
2. In that **same browser**, open:
   `https://amai.ch/api/admin/marketing-report`
3. You should see JSON with a `ga4` block **and** a `gsc` block, each full of data.
   - `"error": "GOOGLE_SA_B64 is not set"` → the key didn't save / no redeploy.
   - `ga4` shows a 403 / permission error → the service account isn't Viewer on the
     GA4 property (redo B1), or `GA4_PROPERTY_ID` is wrong.
   - `gsc` shows an error → the service account isn't a user on Search Console
     (redo B2), or `GSC_SITE_URL` doesn't match the property type.
   - One can work while the other errors — fix the failing one and reload. That's
     by design.

> Tip: a 403 right after granting access can take a few minutes to propagate.

---

## E. Google Ads conversion tag (only if you run Ads)

1. Google Ads → **Tools → Conversions** → create your conversion action(s)
   (e.g. "Lead – contact form", "Strategy call booked").
2. Find your Google tag ID — it looks like **`AW-XXXXXXXXXX`**
   (Google Ads → **Tools → Conversions → Google tag**, or in the tag setup).
3. Vercel → Environment Variables → add `NEXT_PUBLIC_GOOGLE_ADS_ID` =
   `AW-XXXXXXXXXX` → Save → **redeploy**. The Ads tag then loads together with GA4,
   and only after the visitor accepts cookies.
4. Verify with **Google Tag Assistant** (<https://tagassistant.google.com>) that
   the tag loads and conversions fire.

---

## F. Ad spend → CAC / LTV (manual for now)

- In the portal: **Acquisition → Add spend** (`/app/acquisition/spend`). Enter
  spend per day, channel **`google_ads`**, and add the **`campaign_id`** so the
  spend matches the leads it produced.
- Read CAC / payback / LTV:CAC per source on **`/app/acquisition`**. With little
  data most rows say "too early" — that is correct.
- **Automatic** Google Ads spend import (via the Ads API) is deliberately Fase 2
  (the Dec-2026 review), so it is **not** part of this setup.

---

### Quick checklist

- [ ] A. Cloud project, both APIs enabled, service account + JSON key, copied SA email
- [ ] B1. SA added as **Viewer** on the GA4 property; noted the Property ID
- [ ] B2. SA added as a **user** on the Search Console property
- [ ] C. `GOOGLE_SA_B64` (+ IDs if needed) in Vercel, redeployed
- [ ] D. `/api/admin/marketing-report` returns `ga4` + `gsc` data
- [ ] E. (Ads) `NEXT_PUBLIC_GOOGLE_ADS_ID` set + conversions verified
- [ ] F. (Ongoing) enter Google Ads spend in the portal
