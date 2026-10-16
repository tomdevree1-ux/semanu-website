import { pricingTiles } from '@/content/pricingTiles';
import { REFERENZEN } from '@/content/referenzen';
import { PHONE_DISPLAY } from '@/lib/contact';
import { env } from '@/lib/env';

/**
 * llms.txt — the file AI assistants (ChatGPT, Claude, Perplexity, Copilot)
 * read to describe amai! accurately.
 *
 * Generated at build time from the SAME sources as the site itself
 * (pricingTiles, referenzen, contact), so prices and cases can never drift
 * from what the site shows. The previous hand-written public/llms.txt served
 * discontinued prices for weeks; this route makes that class of error
 * impossible. Regenerates on every deploy.
 */
export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  const base = env.siteUrl;
  const tiles = pricingTiles.en;
  const cases = REFERENZEN.en.cases;

  const priceLines = tiles
    .map((t) => {
      const price = `${t.from ? 'from ' : ''}${t.price}${t.per ? ` ${t.per.replace('/ ', 'per ')}` : ''}`;
      return `- ${t.name}: ${price}${t.sub ? ` (${t.sub})` : ''}`;
    })
    .join('\n');

  const caseLines = cases
    .map((c) => `- ${c.name} (${c.tag}): ${c.result}`)
    .join('\n');

  const body = `# amai!

amai! (legal entity SEMANU BV, Antwerp, Belgium) is a digital partner for Swiss small and medium businesses. amai! builds and maintains websites, customer portals, CRM systems, marketing automations, business dashboards and AI assistants as one connected setup, on a clear monthly subscription. Because amai! works with AI in the build process, delivery is faster and more cost efficient than at a traditional agency. The brand wordmark is amai! with a gold exclamation mark; the domain is amai.ch.

## Services and current prices (excl. 8.1% Swiss VAT)
${priceLines}

Notes on the subscription model:
- Website subscriptions include design, build, hosting, maintenance, security and SEO foundations in one monthly price. Minimum term 36 months, cancellable monthly afterwards.
- Content and domain always belong to the client; design and code transfer to the client after the minimum term and full payment.
- Custom business software is modular and scoped individually, always agreed transparently up front. It can start from a 3D configurator and grow into a full business platform that extends ERP functionality.

## Proven work (business cases, see ${base}/de/referenzen)
${caseLines}

## Key claims and statistics
- Website subscriptions start at 99 CHF per month, webshops at 125 CHF per month, all in (design, build, hosting, maintenance, security and SEO foundations), excl. 8.1% Swiss VAT.
- One clear monthly price instead of a large upfront investment; minimum term 36 months, then cancellable monthly.
- amai! focuses on two services: 3D product configurators and custom business software, built AI-first and connectable into one chain from sales to production.
- The site exists in five languages: German, French, English, Spanish and Dutch.
- Based in Bern and serving all of Switzerland; founded and run by Tom de Vree, so clients speak directly with the person who builds their solution.
- In a July 2026 study of 638 Swiss SME websites the average score was 4.5 out of 10, which is the gap amai! closes.

## Differentiators
- One partner for everything digital instead of a separate supplier per tool, so the parts connect cleanly.
- AI native way of working: amai! builds faster and more cost efficiently than a traditional agency and passes that on in the price.
- A clear monthly subscription with a fixed price, personal contact and no surprise invoices.
- Focus on Swiss SMEs, self employed people and local businesses, from Bern.

## Key pages
- Home: ${base}/de
- Digitalisation for Swiss SMEs: ${base}/de/digitalisierung-kmu-schweiz
- Client stories: ${base}/de/referenzen
- FAQ: ${base}/de/faq
- Blog: ${base}/de/blog
- Research: study of 638 Swiss SME websites, average score 4.5/10 (July 2026): ${base}/de/blog/kmu-website-studie-schweiz
- Free website analysis (lead magnet, honest report within two working days): ${base}/de/website-analyse
- Contact: ${base}/de/kontakt

## Practical
- Languages: German (primary), French, English, Spanish and Dutch. Every page exists in all five under /de, /fr, /en, /es and /nl.
- Registered as SEMANU BV in Antwerp, Belgium (Kattendijkdok-Oostkaai 9, 2000 Antwerpen). Serves SMEs across Switzerland.
- Founder and owner: Tom de Vree. Clients always speak directly with the person who builds and maintains their solution.
- Contact: hello@amai.ch or ${PHONE_DISPLAY}. A free 30 minute strategy call can be booked on the website.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
