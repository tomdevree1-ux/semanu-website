import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { SiteShell } from '@/components/SiteShell';
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
  const posts = getAllPosts(locale);
  const [featured, ...rest] = posts;
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
      {/* Hero: full-bleed photo (laptop on the right) like the references page.
          Navy title and intro on the light left side, with a soft wash for legibility. */}
      <section className="relative -mt-[72px] flex min-h-[520px] items-end overflow-hidden text-ink md:min-h-0 md:aspect-[2/1]">
        <Image src="/blog-hero.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[70%_center]" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(244,246,250,0.95) 0%, rgba(244,246,250,0.82) 36%, rgba(244,246,250,0.2) 58%, rgba(244,246,250,0) 72%)',
          }}
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-paper" />
        <div className="container-site relative pb-14 pt-[calc(72px+3rem)]">
          <h1 className="font-display font-semibold leading-[1.0] tracking-[-0.04em] text-navy text-[clamp(44px,6vw,104px)]">
            {t('title')}
          </h1>
          <p className="mt-6 max-w-[40ch] text-[clamp(17px,1.3vw,21px)] leading-[1.6] text-ink-soft">{t('intro')}</p>
        </div>
      </section>

      <section className="bg-paper pb-[clamp(72px,11vw,150px)] pt-[clamp(40px,5vw,72px)] text-ink">
        <div className="container-site">
          {posts.length === 0 ? (
            <p className="text-ink-soft">{t('empty')}</p>
          ) : (
            <>
              {/* Featured: the newest article, cover left (7/12) and text right (5/12). */}
              <Link
                href={`/blog/${featured.slug}`}
                className="group grid overflow-hidden rounded-[28px] border border-[var(--line)] bg-white transition-shadow hover:shadow-[var(--shadow-pop)] lg:grid-cols-12"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-paper-2 lg:col-span-7 lg:aspect-auto lg:min-h-[420px]">
                  {featured.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.cover}
                      alt={featured.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <div
                  className="flex flex-col justify-end p-[clamp(28px,3vw,48px)] lg:col-span-5"
                  style={{ backgroundImage: 'linear-gradient(180deg, #E2E8F2 0%, #ffffff 60%)' }}
                >
                  <time className="font-mono text-xs uppercase tracking-wider text-ink-soft">
                    {formatDate(featured.date, locale)}
                  </time>
                  <h2 className="mt-3 font-display font-semibold leading-[1.08] tracking-[-0.025em] text-navy text-[clamp(26px,2.6vw,42px)]">
                    {featured.title}
                  </h2>
                  <p className="mt-4 text-[clamp(15px,1.15vw,17px)] leading-relaxed text-ink-soft">{featured.description}</p>
                  <span className="mt-6 font-mono text-xs uppercase tracking-wider text-red">
                    {t('readMore')}{' '}
                    <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>

              {/* The rest: three columns with cover thumbnails. */}
              <div className="mt-[clamp(40px,5vw,72px)] grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] border border-[var(--line)] bg-paper-2">
                      {post.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.cover}
                          alt={post.title}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : null}
                    </div>
                    <time className="mt-5 font-mono text-xs uppercase tracking-wider text-ink-soft">
                      {formatDate(post.date, locale)}
                    </time>
                    <h2 className="mt-2 font-display text-[clamp(20px,1.6vw,24px)] font-semibold leading-[1.15] tracking-[-0.02em] text-navy group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                      {post.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-ink-soft">{post.description}</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Next step: title left (4/12), the two service cards right (8/12). */}
      <section className="border-t border-[var(--line)] bg-paper py-[clamp(72px,11vw,150px)] text-ink">
        <div className="container-site grid gap-x-16 gap-y-10 lg:grid-cols-12">
          <h2 className="font-display font-semibold tracking-[-0.03em] text-navy text-[clamp(30px,3.6vw,54px)] lg:col-span-4">
            {t('servicesTitle')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-8">
            {services.map((s) => (
              <Link
                key={s.id}
                href={s.href}
                className="group flex min-h-[260px] flex-col rounded-[28px] border border-[var(--line)] p-[clamp(28px,2.6vw,40px)] transition-shadow hover:shadow-[var(--shadow-pop)]"
                style={{ backgroundImage: 'linear-gradient(180deg, #E2E8F2 0%, #ffffff 68%)' }}
              >
                <span className="mt-auto font-display text-[clamp(22px,2vw,30px)] font-semibold tracking-[-0.02em] text-navy">{s.title}</span>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{s.short}</p>
                <span className="mt-6 font-mono text-xs uppercase tracking-wider text-red">
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
