// Stub voor alles wat de engine levert, zodat het productbestand laadt.
global.THREE = new Proxy(function(){}, { get:()=>global.THREE, apply:()=>global.THREE, construct:()=>global.THREE });
['woodMat','vwoodMat','beamMat','beamMat2','floorMat','cur','hinges'].forEach(n=>global[n]=global.THREE);
['box','wall','wallShape','gableShape','gableRoof','leanRoof','offset','dimLine','roofMaterial','col','setPost']
  .forEach(n=>global[n]=()=>global.THREE);

const src = require('fs').readFileSync('products/cevo-tuinhuizen.js','utf8');
const PRODUCT = eval(src + '; PRODUCT');
const CAT = PRODUCT.catalog;

let fouten=0, gecontroleerd=0, zonderSku=0;
CAT.models.forEach(m => {
  const secties = CAT.sections(m);
  const sU = secties.find(s=>s.id==='uitvoering');
  const sK = secties.find(s=>s.id==='kleur');
  m.uitvoeringen.forEach(u => {
    m.kleuren.forEach(k => {
      const echt = m.prijs[u.key+'|'+k.key];
      if (echt === undefined) return;          // combinatie bestaat niet
      const s = { model:m.id, uitvoering:u.id, kleur:k.id, toebehoren:{} };
      const dU = sU ? sU.price(s, {id:u.id}) : 0;
      const dK = sK ? sK.price(s, {id:k.id}) : 0;
      const berekend = m.vanaf + dU + dK;
      gecontroleerd++;
      if (Math.abs(berekend - echt) > 0.005) {
        fouten++;
        if (fouten<=6) console.log(`  ${m.naam} / ${u.naam} / ${k.naam}: berekend ${berekend} vs echt ${echt}`);
      }
      if (!m.sku_var[u.key+'|'+k.key]) zonderSku++;
    });
  });
});
console.log(`prijscombinaties gecontroleerd : ${gecontroleerd}`);
console.log(`afwijkingen                    : ${fouten}`);
console.log(`combinaties zonder sku         : ${zonderSku}`);

// vanaf-prijs op de kaart moet de startprijs van de configurator zijn
let kaartFout=0;
CAT.models.forEach(m=>{ if (Math.abs(CAT.card(m).vanaf - m.vanaf) > 0.005) kaartFout++; });
console.log(`kaartprijs klopt niet          : ${kaartFout}`);

// elk model moet door minstens één filtercombinatie gevonden worden
const alles = {}; CAT.filters.forEach(f=>alles[f.id]='alles');
const gevonden = CAT.models.filter(m=>CAT.match(m,alles)).length;
console.log(`bereikbaar via "maakt niet uit": ${gevonden} van ${CAT.models.length}`);

// footprint en hoogte mogen nooit NaN zijn
let geo=0;
CAT.models.forEach(m=>m.uitvoeringen.forEach(u=>{
  const s={model:m.id,uitvoering:u.id,kleur:m.kleuren[0].id,toebehoren:{}};
  const f=PRODUCT.footprint(s), h=PRODUCT.height(s);
  if (!(f.W>0&&f.L>0&&h>0)) { geo++; if(geo<=5) console.log('  geometrie:',m.naam,u.naam,f,h); }
}));
console.log(`ongeldige geometrie            : ${geo}`);

// De voorkeuze moet de juiste uitvoering aanwijzen bij de drie aanbouwmodellen.
let vk=0, vkFout=0;
CAT.models.filter(m=>m.luifel==='optie').forEach(m=>{
  [['ja',true],['nee',false]].forEach(([keuze,wilAanbouw])=>{
    const r = CAT.preselect(m, {luifel:keuze});
    const u = r && m.uitvoeringen.find(x=>x.id===r.uitvoering);
    vk++;
    const ok = u && /aanbouw/i.test(u.key)===wilAanbouw;
    if(!ok){ vkFout++; console.log('  voorkeuze mis:', m.naam, keuze, r); }
  });
  // een model zonder aanbouwvariant mag geen voorkeuze krijgen
});
CAT.models.filter(m=>m.luifel!=='optie').forEach(m=>{
  if (CAT.preselect(m,{luifel:'ja'}) !== null){ vkFout++; console.log('  onterechte voorkeuze:', m.naam); }
});
console.log(`voorkeuzes gecontroleerd       : ${vk}`);
console.log(`voorkeuze fout                 : ${vkFout}`);
// De volledige keten zoals ui.js hem doorloopt: standaardwaarde, dan de
// voorkeuze uit het filter, dan normalize. De uitvoering moet overleven.
let ketenFout=0;
CAT.models.filter(m=>m.luifel==='optie').forEach(m=>{
  [['ja',true],['nee',false]].forEach(([keuze,wilAanbouw])=>{
    const s = { model:m.id, uitvoering:m.uitvoeringen[0].id, kleur:m.kleuren[0].id, toebehoren:{} };
    Object.assign(s, CAT.preselect(m,{luifel:keuze}) || {});
    PRODUCT.normalize(s);
    const u = m.uitvoeringen.find(x=>x.id===s.uitvoering);
    if (!u || /aanbouw/i.test(u.key)!==wilAanbouw){
      ketenFout++; console.log('  keten mis:', m.naam, keuze, '->', u && u.naam);
    }
  });
});
console.log(`keten na normalize fout        : ${ketenFout}`);


// Stap 3 draait nu op de breedste zijde: elk model moet in minstens één
// breedteknop vallen, anders is het onbereikbaar.
const stap3 = CAT.filters.find(f=>f.id==='grootte');
let onbereik=0;
CAT.models.forEach(m=>{
  const raak = stap3.options.filter(o=>o.id!=='alles').some(o=>o.match(m));
  if(!raak){ onbereik++; console.log('  valt in geen breedte:', m.naam, m.breedteMin, m.breedteMax); }
  if(m.breedteMin==null||m.breedteMax==null){ onbereik++; console.log('  geen breedte:', m.naam); }
});
console.log(`modellen zonder breedteknop    : ${onbereik}`);
process.exit(fouten+kaartFout+geo+zonderSku+vkFout+ketenFout+onbereik ? 1 : 0);
