import fs from 'fs'; import matter from 'gray-matter'; import {marked} from 'marked';
const slug='kmu-ai-sichtbarkeit-schweiz';
const conj={de:/,\s+(und|oder|aber|mit)\b/i,fr:/,\s+(et|ou|mais|avec)\b/i,en:/,\s+(and|or|but|with)\b/i,es:/,\s+(y|o|pero|con)\b/i,nl:/,\s+(en|of|maar|met)\b/i};
let bad=0; const e=(l,m)=>{bad++;console.log(l,'FAIL',m)};
for(const l of ['de','fr','en','es','nl']){
 const raw=fs.readFileSync(`content/blog/${slug}.${l}.md`,'utf8'); const {data,content}=matter(raw);
 for(const k of ['title','description','date','author','authorImage','cover']) if(!data[k]) e(l,'missing '+k);
 if(data.title.length>60) e(l,'title '+data.title.length);
 if(data.description.length<120||data.description.length>155) e(l,'desc '+data.description.length);
 const html=marked.parse(content); const m=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
 if(!m) e(l,'no jsonld'); else { try{const j=JSON.parse(m[1]); if(j.mainEntity.length!==4) e(l,'faq count')}catch(x){e(l,'json '+x.message)} }
 if(/[—–]/.test(raw)) e(l,'dash');
 if(l==='de'&&raw.includes('ß')) e(l,'ß');
 if(/\p{L}-\p{L}/u.test(content.replace(/\/[a-z\-\/.:]+/g,'').replace(/href="[^"]*"|src="[^"]*"|style="[^"]*"|class="[^"]*"/g,''))) e(l,'hyphen compound: '+(content.match(/\S*\p{L}-\p{L}\S*/gu)||[]).filter(s=>!/\/|ld\+json|application|og:|-top|-bottom/.test(s)).join(' | '));
 const body=raw.split('\n').filter(x=>!x.startsWith('<script')&&!x.startsWith('{"@context'));
 body.forEach((ln,i)=>{ if(conj[l].test(ln)) e(l,'comma conj line '+i+': '+(ln.match(conj[l])||[''])[0]+' ... '+ln.slice(Math.max(0,ln.search(conj[l])-30),ln.search(conj[l])+30)); if(/est-ce que/.test(ln)) e(l,'est-ce') });
 console.log(l,'title',data.title.length,'desc',data.description.length);
}
if(!fs.existsSync(`public/blog/${slug}-cover.svg`)) e('all','cover');
console.log(bad?'FAILURES '+bad:'ALL PASS');
