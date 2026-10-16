import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { SiteShell } from '@/components/SiteShell';
import { Breadcrumb } from '@/components/Breadcrumb';
import { BrandText } from '@/components/BrandText';
import { JsonLd } from '@/components/JsonLd';
import { routing } from '@/i18n/routing';
import { getAllPosts, getPost } from '@/lib/blog';
import { pageMetadata } from '@/lib/seo/metadata';
import { env } from '@/lib/env';

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const post of getAllPosts(locale)) {
      params.push({ locale, slug: post.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(locale, slug);
  if (!post) return {};
  // Only advertise hreflang for locales where this post actually exists, so a
  // translated post clusters correctly and an untranslated one does not point at
  // a missing page. Both current posts exist in de/fr/en.
  const availableLocales = routing.locales.filter((l) =>
    getAllPosts(l).some((p) => p.slug === slug),
  );
  return pageMetadata({
    title: `${post.meta.title} · semanu.eu`,
    description: post.meta.description,
    path: `/blog/${slug}`,
    locale,
    availableLocales,
    image: post.meta.cover || '/og.png?v=4',
    // A blog post is an article, not a generic website page.
    ogType: 'article',
  });
}

function formatDate(date: string, locale: string) {
  if (!date) return '';
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? date
    : new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(d);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('blog');
  const tn = await getTranslations('nav');
  const post = await getPost(locale, slug);
  if (!post) notFound();

  const { meta } = post;
  const siteUrl = env.siteUrl;
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    dateModified: meta.updated || meta.date,
    inLanguage: locale,
    image: meta.cover ? [`${siteUrl}${meta.cover}`] : undefined,
    author:
      meta.author === 'Tom de Vree'
        ? { '@id': `${siteUrl}/#tom-de-vree` }
        : meta.author
          ? { '@type': 'Person', name: meta.author }
          : undefined,
    publisher: { '@id': `${siteUrl}/#organization` },
    mainEntityOfPage: `${siteUrl}/${locale}/blog/${slug}`,
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1'] },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'semanu.eu', item: `${siteUrl}/${locale}` },
      { '@type': 'ListItem', position: 2, name: tn('blog'), item: `${siteUrl}/${locale}/blog` },
      {
        '@type': 'ListItem',
        position: 3,
        name: meta.title,
        item: `${siteUrl}/${locale}/blog/${slug}`,
      },
    ],
  };

  return (
    <SiteShell>
      <JsonLd data={[articleLd, breadcrumbLd]} />
      <Breadcrumb
        items={[{ name: 'semanu.eu', href: '/' }, { name: tn('blog'), href: '/blog' }, { name: meta.title }]}
        locale={locale}
        jsonLd={false}
      />
      <article className="bg-paper text-ink">
        <div className="container-site max-w-4xl pt-14">
          <Link
            href="/blog"
            className="font-mono text-xs uppercase tracking-wider text-red hover:underline"
          >
            ← {t('back')}
          </Link>
          {meta.cover ? (
            // SVG cover: a raw <img> with explicit dimensions is the right call —
            // next/image does not optimise SVG and would need dangerouslyAllowSVG.
            // width/height reserve the 1200×520 box so the cover cannot shift the
            // layout while it loads (CLS), and a real alt replaces the empty one.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meta.cover}
              alt={meta.title}
              width={1200}
              height={520}
              className="mt-6 h-auto w-full rounded-lg"
            />
          ) : null}
        </div>

        <div className="container-site max-w-4xl pb-20 pt-10">
          <h1 className="h2">{meta.title}</h1>

          <div className="mt-6 flex items-center gap-3">
            {meta.authorImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={meta.authorImage}
                alt={meta.author}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : null}
            <div className="text-sm leading-tight">
              {meta.author ? (
                <span className="block font-semibold text-ink">
                  {t('by')} {meta.author}
                </span>
              ) : null}
              <time className="block font-mono text-xs uppercase tracking-wider text-ink-soft">
                {formatDate(meta.date, locale)}
              </time>
              {meta.updated && meta.updated !== meta.date ? (
                <time className="mt-0.5 block font-mono text-xs uppercase tracking-wider text-ink-soft">
                  {t('updatedLabel')} {formatDate(meta.updated, locale)}
                </time>
              ) : null}
            </div>
          </div>

          <div
            className="mt-10 space-y-4 leading-relaxed text-ink-soft [&_a]:text-red [&_a]:underline [&_h2]:mt-9 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <div className="mt-14 flex items-start gap-4 rounded-lg border border-[var(--line)] bg-white p-6">
            {meta.authorImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={meta.authorImage}
                alt={t('authorName')}
                width={52}
                height={52}
                className="h-[52px] w-[52px] shrink-0 rounded-full object-cover"
              />
            ) : null}
            <div>
              <p className="font-semibold text-ink">
                {t('authorName')} <span className="font-normal text-ink-soft">· <BrandText>{t('authorRole')}</BrandText></span>
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft"><BrandText>{t('authorBio')}</BrandText></p>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-ink p-8 text-paper">
            <h2 className="h3 max-w-md text-white">{t('ctaTitle')}</h2>
            <Link href="/kontakt" className="btn btn-spark mt-6">
              {t('ctaButton')} <span aria-hidden className="btn-arrow" />
            </Link>
          </div>
        </div>
      </article>
    </SiteShell>
  );
}
