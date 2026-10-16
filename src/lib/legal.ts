import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

/**
 * Reads a localized legal document from content/legal/<slug>.<locale>.md
 * (e.g. privacy.de.md). Falls back to the German version if a locale is missing.
 */
const LEGAL_DIR = path.join(process.cwd(), 'content', 'legal');

export async function getLegalDoc(
  slug: string,
  locale: string,
): Promise<{ title: string; updated: string; html: string } | null> {
  const localized = path.join(LEGAL_DIR, `${slug}.${locale}.md`);
  const fallback = path.join(LEGAL_DIR, `${slug}.de.md`);
  const file = fs.existsSync(localized) ? localized : fallback;
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, 'utf8');
  const { data, content } = matter(raw);
  const html = await marked.parse(content);
  return {
    title: String(data.title ?? ''),
    updated: String(data.updated ?? ''),
    html,
  };
}
