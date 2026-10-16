# CONTENT_PLAN.md — amai content + tagging plan (Part 5 prep)

Internal planning notes. Nothing here is wired into the build yet. It records the
broader-services content structure so blog categories, future posts and portfolio
service tags can be added consistently later, without forcing filters in phase 1.

## Blog categories (to introduce when category metadata is added)

Blog posts currently live in `content/blog/<slug>.<locale>.md` with frontmatter
(`title`, `description`, `date`, `author`, `authorImage`, `cover`). When a
`category` field is introduced, use this fixed set:

- Websites
- Email Marketing
- Automation
- Business Systems
- AI
- Digital Strategy
- SEO and GEO

## Suggested future blog topics (do NOT auto-write these)

- Why a website alone is not enough for growing SMEs
- Email marketing for Swiss small businesses
- What is marketing automation and when do you need it
- When does a small business need a CRM
- Booking systems for local service businesses
- How customer portals improve client communication
- How AI assistants can help small businesses
- What is a Digital Audit
- What is GEO and why does it matter
- SEO and GEO checklist for SME websites

Each topic should link to the matching `/services#<anchor>` section.

## Portfolio service tags (prepare; do not force onto existing cases)

`src/content/portfolio.ts` and `src/content/referenzen.ts` use a single `tag`
string per project today. When broader tagging is introduced, draw from:

Website · Webshop · Email Marketing · Automation · Booking · Business System ·
CRM · Dashboard · Customer Portal · AI Assistant

Rule: only add a service tag to a case the content clearly supports. Do not invent
case studies.

## Portfolio filters (phase 2 only, if/when tagging exists)

Suggested filter set: All · Websites · Webshops · Automation · Business Systems · AI.
Phase 1 keeps the sliding marquee with no filter UI.
