import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

// Serve robots.txt as a static file (generated at build time). Crawlers treat a
// slow or unreachable robots.txt as "stop crawling the whole site", so this
// route must always answer instantly. Audits on 26.06 and 09.07 saw timeouts on
// this path; force-static plus the Cache-Control header in next.config.mjs
// removes every per-request dependency.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/*/styleguide', '/api/', '/app/'],
      },
      {
        // AI assistants and search engines are explicitly welcome to read and cite this content.
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'OAI-SearchBot',
          'Google-Extended',
          'anthropic-ai',
          'Claude-Web',
          'ClaudeBot',
          'PerplexityBot',
          'Perplexity-User',
          'Applebot',
          'Applebot-Extended',
          'CCBot',
          'cohere-ai',
          'Meta-ExternalAgent',
          'Bingbot',
          'DuckDuckBot',
          'YandexBot',
        ],
        allow: '/',
      },
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
