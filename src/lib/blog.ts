import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

/**
 * Minimal file-based blog: Markdown with frontmatter in `content/blog/`.
 * Filename convention: `<slug>.<locale>.md` (e.g. `getting-found-by-ai.de.md`).
 *
 * This is the lightweight "best practice" start. If non-technical editors need
 * to publish later, swap this module for a CMS without touching the pages.
 */
const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export type PostMeta = {
  slug: string;
  locale: string;
  title: string;
  description: string;
  date: string;
  /** Optional last-updated date (frontmatter `updated`); falls back to `date`. */
  updated: string;
  author: string;
  authorImage: string;
  cover: string;
};

function parseFilename(file: string): { slug: string; locale: string } | null {
  const m = file.match(/^(.+)\.([a-z]{2})\.md$/);
  return m ? { slug: m[1], locale: m[2] } : null;
}

function toMeta(slug: string, locale: string, data: Record<string, unknown>): PostMeta {
  return {
    slug,
    locale,
    title: String(data.title ?? slug),
    description: String(data.description ?? ''),
    date: String(data.date ?? ''),
    updated: String(data.updated ?? data.date ?? ''),
    author: String(data.author ?? ''),
    authorImage: String(data.authorImage ?? ''),
    cover: String(data.cover ?? ''),
  };
}

export function getAllPosts(locale: string): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .map((file) => ({ file, parsed: parseFilename(file) }))
    .filter((x): x is { file: string; parsed: { slug: string; locale: string } } =>
      x.parsed !== null && x.parsed.locale === locale,
    )
    .map(({ file, parsed }) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const { data } = matter(raw);
      return toMeta(parsed.slug, locale, data);
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(
  locale: string,
  slug: string,
): Promise<{ meta: PostMeta; html: string } | null> {
  const file = path.join(BLOG_DIR, `${slug}.${locale}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  const { data, content } = matter(raw);
  const html = await marked.parse(content);
  return { meta: toMeta(slug, locale, data), html };
}
