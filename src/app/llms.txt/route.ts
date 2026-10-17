import { REFERENCES } from '@/content/references';
import { CONTACT_EMAIL, PHONE_DISPLAY } from '@/lib/contact';
import { env } from '@/lib/env';

/**
 * llms.txt: the file AI assistants (ChatGPT, Claude, Perplexity, Copilot) read
 * to describe SEMANU accurately. Generated at build time from the same sources
 * as the site (references, contact), so cases and contact details cannot drift.
 * Prices are deliberately not listed: every project is quoted on request.
 */
export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  const base = env.siteUrl;
  const cases = REFERENCES.en.cases;

  const caseLines = cases
    .map((c) => `- ${c.name} (${c.tag}): ${c.result}`)
    .join('\n');

  const body = `# semanu

SEMANU (legal entity SEMANU BV, Kattendijkdok-Oostkaai 9, 2000 Antwerpen, Belgium; company number 0828.291.116, VAT BE0828.291.116) is a digital partner for small and medium businesses across Europe. SEMANU builds 3D product configurators and custom business software, AI-first, including design, build, hosting and ongoing support. The website is ${base}.

## Services
- 3D product configurators: customers configure a product themselves, see it live in 3D and get an indicative price; output can feed production or ERP.
- Custom business software: modular software that connects and automates processes (workflow automation, portals, CRM and dashboards, AI inside processes), scoped individually and agreed transparently up front.
- Pricing: on request. Every project gets a written quote; prices are in EUR excluding VAT.

## Proven work (business cases, see ${base}/en/references)
${caseLines}

## Key pages
- Home: ${base}/en
- 3D configurators: ${base}/en/services/3d-configurators
- Business software: ${base}/en/services/business-software
- Client stories: ${base}/en/references
- FAQ: ${base}/en/faq
- Blog: ${base}/en/blog
- Contact: ${base}/en/contact

## Practical
- Languages: Dutch, English, German, French and Spanish, under /nl, /en, /de, /fr and /es.
- Founder and managing director: Tom de Vree. Clients speak directly with the person who builds and maintains their solution.
- Hosting in the EU (Hetzner, Germany/Finland).
- Contact: ${CONTACT_EMAIL} or ${PHONE_DISPLAY}.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
