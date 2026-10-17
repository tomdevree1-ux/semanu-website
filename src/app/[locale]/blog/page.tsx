import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { SiteShell } from '@/components/SiteShell';
import { Breadcrumb } from '@/components/Breadcrumb';
import { JsonLd } from '@/components/JsonLd';
import { getAllPosts } from '@/lib/blog';
import { pageMetadata } from '@/lib/seo/metadata';
import { env } from '@/lib/env';
import { serviceLinks, type ServicesLocale } from '@/content/services';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  const tb = await getTranslations({ locale, namespace: 'blog' });
  return pageMetadata({
    title: `${t('blog')} · semanu.eu`,
    description: tb('metaDescription'),
    path: '/blog',
    locale,
  });
}

function formatDate(date: string, locale: string) {
  if (!date) return '';
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? date
    : new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(d);
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('blog');
  const tnav = await getTranslations('nav');
  const posts = getAllPosts(locale);
  // The blog is small; the two service pages below give readers a next step and
  // give the index real substance next to the post list.
  const services = serviceLinks(
    (['de', 'fr', 'en', 'es', 'nl'].includes(locale) ? locale : 'en') as ServicesLocale,
  );

  // A Blog collection node + an ItemList of the posts so search + AI can read the
  // index as a list of articles, with the publisher tied to the single org @id.
  const blogUrl = `${env.siteUrl}/${locale}/blog`;
  const blogLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${blogUrl}#blog`,
    name: `${t('title')} · semanu.eu`,
    description: t('intro'),
    url: blogUrl,
    inLanguage: locale,
    isPartOf: { '@id': `${env.siteUrl}/#website` },
    publisher: { '@id': `${env.siteUrl}/#organization` },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${blogUrl}/${post.slug}`,
      datePublished: post.date || undefined,
    })),
  };
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: posts.map((post, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: post.title,
      url: `${blogUrl}/${post.slug}`,
    })),
  };

  return (
    <SiteShell>
      <JsonLd data={[blogLd, itemListLd]} />
      <Breadcrumb items={[{ name: 'semanu.eu', href: '/' }, { name: tnav('blog') }]} locale={locale} />
      <section className="bg-paper py-24 text-ink">
        <div className="container-site max-w-4xl">
          <span className="eyebrow eyebrow-spark text-red">{t('title')}</span>
          <h1 className="h2 mt-4">{t('title')}</h1>
          <p className="lead mt-4 text-ink-soft">{t('intro')}</p>

          {posts.length === 0 ? (
            <p className="mt-10 text-ink-soft">{t('empty')}</p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-card border border-[var(--line)] bg-white p-6 transition-shadow hover:shadow-[var(--shadow-pop)]"
                >
                  <time className="font-mono text-xs uppercase tracking-wider text-ink-soft">
                    {formatDate(post.date, locale)}
                  </time>
                  <h2 className="h3 mt-2">{post.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{post.description}</p>
                  <span className="mt-4 font-mono text-xs uppercase tracking-wider text-red">
                    {t('readMore')}{' '}
                    <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              ))}
            </div>
          )}

          <h2 className="h3 mt-16">{t('servicesTitle')}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {services.map((s) => (
              <Link
                key={s.id}
                href={s.href}
                className="group flex flex-col rounded-card border border-[var(--line)] bg-white p-6 transition-shadow hover:shadow-[var(--shadow-pop)]"
              >
                <span className="font-display text-lg font-semibold text-navy">{s.title}</span>
                <p className="mt-2 text-sm text-ink-soft">{s.short}</p>
                <span className="mt-4 font-mono text-xs uppercase tracking-wider text-red">
                  {t('readMore')}{' '}
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
