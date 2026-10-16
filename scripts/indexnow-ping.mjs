// IndexNow ping — tells Bing (and every IndexNow partner) instantly which URLs
// changed. ChatGPT search and Microsoft Copilot lean on the Bing index, so a
// fresh Bing index is directly a GEO win. The key file already lives at
// public/91282c3159800b44aa13d4505dc2ec90.txt.
//
// Usage:
//   node scripts/indexnow-ping.mjs                       # pings the core pages
//   node scripts/indexnow-ping.mjs https://amai.ch/de/x  # pings specific URLs
//
// Run it after every deploy (manually or as a deploy hook step).

const KEY = '91282c3159800b44aa13d4505dc2ec90';
const HOST = 'amai.ch';
const BASE = `https://${HOST}`;

const CORE_PAGES = [
  '/de',
  '/de/services',
  '/de/website-abos',
  '/de/referenzen',
  '/de/digitalisierung-kmu-schweiz',
  '/de/website-abo-schweiz',
  '/de/website-erstellen-lassen-schweiz',
  '/de/blog',
  '/de/kontakt',
  '/de/faq',
].map((p) => `${BASE}${p}`);

const urlList = process.argv.slice(2).length > 0 ? process.argv.slice(2) : CORE_PAGES;

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: `${BASE}/${KEY}.txt`,
  urlList,
};

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
});

// 200 = processed, 202 = accepted (key check pending). Both are success.
console.log(`IndexNow: ${res.status} ${res.statusText} — ${urlList.length} URLs gemeldet`);
if (res.status >= 400) {
  console.error(await res.text());
  process.exit(1);
}
