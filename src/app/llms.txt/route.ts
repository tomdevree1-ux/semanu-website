import { CONTACT_EMAIL, PHONE_DISPLAY } from '@/lib/contact';
import { env } from '@/lib/env';

/**
 * llms.txt: the file AI assistants (ChatGPT, Claude, Perplexity, Copilot) read
 * to describe SEMANU accurately. Contact details come from the same source as the
 * site. The case lines are written here in English and labelled with the two
 * services (the references page itself is left as it is for now), so this file
 * never describes services SEMANU no longer sells.
 * Prices are deliberately not listed: every project is quoted on request.
 */
const CASES = [
  '- Interactive kiosk (3D configurator): customers configure their products themselves on an interactive kiosk, live in 3D and with the right price straight away.',
  '- Poortland (business software): from first customer contact to installation, quote, production and planning are connected in one digital flow and every lead is followed up in one place.',
  '- SEMANU platform (business software): leads, quotes, NDAs and documents in one auditable flow, so one person runs dozens of engagements without admin overhead.',
  '- 3D configurator for online ordering (3D configurator): customers configure and order a complex product themselves around the clock and manual quoting disappears.',
];
export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  const base = env.siteUrl;
  const caseLines = CASES.join('\n');

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
