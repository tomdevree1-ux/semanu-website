// IndexNow ping: tells Bing (and every IndexNow partner) which URLs changed.
// ChatGPT search and Microsoft Copilot lean on the Bing index, so a fresh Bing
// index helps AI visibility too. Google ignores IndexNow (use Search Console).
//
// Setup (once): pick a key (32 hex chars), put it in INDEXNOW_KEY and publish
// the same key as public/<key>.txt (file content = the key).
//
// Usage:
//   INDEXNOW_KEY=... node scripts/indexnow-ping.mjs                          # core pages
//   INDEXNOW_KEY=... node scripts/indexnow-ping.mjs https://www.semanu.eu/nl/x  # specific URLs
//
// Run it after a production deploy only (never for acc.semanu.eu).

const KEY = (process.env.INDEXNOW_KEY ?? '').trim();
if (!KEY) {
  console.error('INDEXNOW_KEY is not set; nothing pinged.');
  process.exit(1);
}
const HOST = 'www.semanu.eu';
const BASE = `https://${HOST}`;

const CORE_PAGES = ['/nl', '/en', '/de', '/fr', '/nl/references', '/nl/blog', '/nl/contact', '/nl/faq'].map(
  (p) => `${BASE}${p}`,
);

const urlList = process.argv.slice(2).length > 0 ? process.argv.slice(2) : CORE_PAGES;

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${BASE}/${KEY}.txt`, urlList }),
});

// 200 = processed, 202 = accepted (key check pending). Both are success.
console.log(`IndexNow: ${res.status} ${res.statusText}, ${urlList.length} URLs`);
if (res.status >= 400) {
  console.error(await res.text());
  process.exit(1);
}
