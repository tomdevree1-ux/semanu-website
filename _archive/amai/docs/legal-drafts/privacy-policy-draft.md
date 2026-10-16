# Privacy Policy — DRAFT for legal review

> **Status: working draft, not legal advice.** Prepared as a starting point for
> amai!'s lawyer to review, complete and finalise. I am not a lawyer. Items in
> **[brackets]** are decisions the client/lawyer must confirm (e.g. retention
> periods). The published site will need this in DE (primary), FR and EN.
>
> Jurisdiction: Switzerland (revised Federal Act on Data Protection, nFADP/revDSG)
> with GDPR also addressed, since the site serves EU visitors.

---

## 1. Controller

**Amai!**
Wylerstrasse 75, 3000 Bern, Switzerland
Email: hello@amai.ch

Amai! is the controller responsible for the processing of personal data described
in this policy. [Confirm whether a data protection officer / EU representative is
required — generally not mandatory for an SME of this size, but confirm.]

## 2. What data we process

**a) Data you provide via forms**
- *Contact form* (`/kontakt`): first name, last name, email, company (optional),
  phone (optional), message, language preference, consent.
- *Subscription start* (`/checkout`): first name, last name, email, company
  (optional), phone (optional), chosen plan, optional "Logo + brand guidelines"
  add-on, consent.

**b) Payment data**
Handled by **Stripe** (planned). Card/payment details are entered on Stripe and
are **not stored by amai!**. We receive only a payment/subscription status and
basic billing identifiers. [Confirm once Stripe is live.]

**c) Data collected automatically**
Server and security logs (IP address, browser/user agent, timestamps, pages
requested) via our hosting and CDN provider, used for delivery, stability and
abuse prevention. A honeypot field is used to filter spam.

**d) Cookies and analytics**
- A cookie/preference storing your **consent choice**.
- **Google Analytics 4 (GA4)** for usage statistics, **only after you consent**
  via the cookie banner.

## 3. Purposes and legal bases

| Purpose | Legal basis (GDPR Art. 6 / revDSG) |
|---|---|
| Answer enquiries and take pre-contract steps | Contract / pre-contract — Art. 6(1)(b) |
| Provide, manage and bill the subscription | Contract — Art. 6(1)(b) |
| Security, spam prevention, stable operation | Legitimate interest — Art. 6(1)(f) |
| Analytics (GA4) | Consent — Art. 6(1)(a) |
| Bookkeeping / statutory retention | Legal obligation — Art. 6(1)(c) |

Under the revDSG the corresponding bases are processing for contract performance,
overriding legitimate interest, consent and legal obligation.

## 4. Processors and third parties

We work with the following processors. Each EU/EEA region is selected where
available, and a data processing agreement (DPA) is in place. [Confirm DPAs are
signed with each.]

| Provider | Role | Data location |
|---|---|---|
| **Supabase** | Database for form submissions / subscriptions | European region |
| **Resend** | Sends transactional/notification emails | [EU region — confirm] |
| **Cloudflare** | Hosting, CDN, security/DDoS protection | European region |
| **Google Analytics 4** | Website analytics (consent-based) | Google (see §5) |
| **Stripe** (planned) | Payment and subscription processing | [Confirm] |

We do not sell personal data. Data is shared with these providers only as needed
to run the service.

## 5. International transfers

**Google Analytics 4** may involve transfer of data to Google (including the USA).
Such transfers are covered by appropriate safeguards (EU Standard Contractual
Clauses and Google's supplementary measures; for the USA, the EU–US Data Privacy
Framework where applicable). [Confirm GA4 configuration: IP anonymisation/region
settings, Google signals on/off, data retention setting.]

## 6. Retention

- Enquiry messages: kept for **[e.g. 12–24 months]** after last contact, unless a
  contract follows.
- Subscription and accounting records: kept for the statutory period
  (**Switzerland: 10 years** for accounting documents).
- Server/security logs: **[e.g. 30–90 days]**.
- Analytics: per the GA4 retention setting (**[e.g. 14 months]**).
- Consent records: kept as evidence of consent for **[period]**.

## 7. Your rights

Subject to the revDSG and, where applicable, the GDPR, you have the right to:
access, rectification, erasure, restriction of processing, objection, data
portability, and to withdraw consent at any time (without affecting prior
processing). To exercise these rights, contact **hello@amai.ch**.

You may also lodge a complaint with a supervisory authority — in Switzerland the
**Federal Data Protection and Information Commissioner (FDPIC/EDÖB)**, or your
local EU data protection authority.

## 8. Cookies

We use:
- **Necessary** items (storing your consent choice, security) — no consent needed.
- **Analytics** (GA4) — set **only with your consent**. You can accept all or only
  necessary via the banner, and change your choice at any time [link to cookie
  settings / this page].

[Lawyer: confirm the exact cookie table — name, provider, purpose, lifespan — once
GA4 is configured. A cookie audit before launch is recommended.]

## 9. Security

We use TLS/HTTPS, a reputable CDN with DDoS protection (Cloudflare), access
controls, and European hosting regions to protect personal data.

## 10. Changes

We may update this policy. The current version is always available on this page,
with the date of last update.

---

### Open points for the lawyer / client to confirm
1. Retention periods in §6.
2. Whether a DPO or EU representative is needed.
3. GA4 settings (IP handling, retention, Google signals) and resulting cookie table.
4. Resend / Stripe data regions and signed DPAs for all processors.
5. Whether marketing emails/newsletters will be sent (would need a separate consent + basis).
6. Final DE / FR / EN wording for publication.
