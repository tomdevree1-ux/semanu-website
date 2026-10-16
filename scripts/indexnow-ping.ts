/**
 * IndexNow ping — tells Bing + Yandex (and the AI search engines that read them)
 * to re-crawl amai.ch immediately. Google ignores IndexNow (use Search Console),
 * so this complements GSC, it does not replace it.
 *
 * Run AFTER a deploy:  npx tsx scripts/indexnow-ping.ts
 * It reads the live sitemap and submits every public URL with the key in
 * public/91282c3159800b44aa13d4505dc2ec90.txt.
 */
const KEY = '91282c3159800b44aa13d4505dc2ec90';
const HOST = 'amai.ch';

async function main() {
  const res = await fetch(`https://${HOST}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urlList.length === 0) throw new Error('no <loc> URLs found in sitemap');

  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
  });
  console.log(`IndexNow: ${r.status} ${r.statusText} — submitted ${urlList.length} URLs`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
