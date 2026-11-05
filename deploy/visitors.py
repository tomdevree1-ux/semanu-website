# Visitors of www.semanu.eu from the Caddy access log (no cookies, no analytics tool).
# Run from this repo: ssh root@2.31.50.26 'python3 -' < deploy/visitors.py
# A visitor = unique IP + browser per day; bots and assets are filtered out (approximation).
import json,glob,gzip,re,collections,sys
BOT=re.compile(r'bot|crawl|spider|slurp|curl|wget|python|go-http|headless|lighthouse|monitor|preview|facebookexternalhit|scan|httpx|java|okhttp|axios|node-fetch',re.I)
days=collections.defaultdict(set); views=collections.Counter(); pages=collections.Counter(); refs=collections.Counter()
for f in sorted(glob.glob('/var/log/caddy/semanu-eu-live.log*')):
    op=gzip.open if f.endswith('.gz') else open
    for line in op(f,'rt',errors='ignore'):
        try: e=json.loads(line)
        except Exception: continue
        r=e.get('request',{}); h=r.get('headers',{})
        ua=(h.get('User-Agent') or [''])[0]; uri=r.get('uri','')
        if e.get('status')!=200 or r.get('method')!='GET' or BOT.search(ua) or not ua: continue
        path=uri.split('?')[0]
        if '.' in path.rsplit('/',1)[-1] or path.startswith(('/_next','/api')): continue
        d=__import__('datetime').datetime.utcfromtimestamp(e.get('ts',0)).strftime('%Y-%m-%d')
        ip=r.get('client_ip') or r.get('remote_ip'); days[d].add((ip,ua)); views[d]+=1; pages[path]+=1
        ref=(h.get('Referer') or [''])[0]
        if ref and 'semanu.eu' not in ref: refs[re.sub(r'^https?://([^/]+).*',r'\1',ref)]+=1
uniq=set().union(*days.values()) if days else set()
print('Unieke bezoekers (ip+browser) totaal:',len(uniq),'| paginaweergaven:',sum(views.values()))
for d in sorted(days): print(d, 'bezoekers', len(days[d]), 'weergaven', views[d])
print('Top paginas:'); [print(' ',n,p) for p,n in pages.most_common(10)]
print('Top verwijzers:'); [print(' ',n,r) for r,n in refs.most_common(8)]
