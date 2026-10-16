/* =====================================================================
   Productlaag: CEVO Outdoor Life tuinhuizen
   38 modellen, 308 bestelbare varianten.

   Wat uit de webshop van CEVO komt en dus klopt:
     modelnaam, parent sku, sku per variant, kleur, uitvoering, prijs,
     en de fundamentmaat waar die in de omschrijving of de naam stond.

   Wat een interpretatie is, afgelezen van de productfoto's:
     dakvorm, luifel ja of nee, de diepte van de luifel, het aantal
     ramen en het deurtype. CEVO voert die vier niet als attribuut, dus
     het 3D model is een weergave op basis van maten en foto's en geen
     tekening van de fabrikant. Zeg dat er bij een klant ook bij.
   ===================================================================== */

const MODELLEN = [
/*__MODELLEN__*/
];

/* Losse artikelen uit dezelfde reeks, met hun echte prijs en sku. */
const ACCESSOIRES = [
  { id:'vloer',   naam:'Vloerpakket',            sub:'Vloerdelen op regels',        sku:'160653', price:125 },
  { id:'epdm',    naam:'EPDM dakpakket',         sub:'Het dak wordt zonder bedekking geleverd', sku:'160727', price:180 },
  { id:'shingles',naam:'Shingles inclusief nagels', sub:'Alternatief voor EPDM',    sku:'144470', price:75 },
  { id:'goot',    naam:'Dakgootset',             sub:'Diameter 10 cm',              sku:'144474', price:115 },
  { id:'fundament',naam:'Fundamentbalk',         sub:'Per set',                     sku:'144469', price:65 },
  { id:'rooster', naam:'Ventilatierooster',      sub:'Set',                         sku:'160712', price:15 }
];

/* De productfoto's van de webshop zelf. Alle 38 volgen hetzelfde patroon,
   dus één basis plus de sku volstaat. Ze worden van cevo.be geladen en niet
   ingesloten, want 38 foto's als data-URI maakt het bestand te zwaar voor
   mobiel. Bewust de grote versie: die is bijgesneden op het product (ongeveer
   730 bij 409, 33 kB), terwijl de catalogusversie het huisje in een staand
   kader van 208 bij 260 klemt en daardoor klein oogt. */
const FOTO_BASIS = 'https://cevo.be/media/catalog/product/cache/3520e5bd0f38a3cdedf23948c04dbb6d/C/P/';
const fotoVan = m => FOTO_BASIS + m.sku + '_' + m.sku + '.jpg';

/* Tekeningetjes bij de keuzes. Woorden als lessenaarsdak zeggen een klant
   niets, een silhouet wel. Bewust lijntekeningen in de merkkleur, geen
   plaatjes, zodat ze meeschalen en niets wegen. */
const IC = {
  plat:   '<path d="M3 12 41 6"/><path d="M7 11.4V26h30V8.5"/>',
  zadel:  '<path d="M3 15 22 5 41 15"/><path d="M8 12.5V26h28V12.5"/>',
  beideDak: '<path d="M2 13 20 8"/><path d="M5 12.5V25h12V9.4"/>' +
            '<path d="M24 13 32 7 42 13"/><path d="M27 11.5V25h12V11.5"/>',
  luifel:      '<path d="M2 9h40"/><path d="M6 9v17h17V9"/><path d="M30 9v17"/><path d="M38.5 9v17"/>',
  geenLuifel:  '<path d="M6 9h32"/><path d="M10 9v17h24V9"/>',
  beideLuifel: '<path d="M2 9h40"/><path d="M6 9v17h17V9"/>' +
               '<path d="M30 9v17" stroke-dasharray="3 3"/><path d="M38.5 9v17" stroke-dasharray="3 3"/>',
  klein:  '<rect x="16" y="8" width="12" height="12" rx="1"/><path d="M16 25h12M16 22.5v5M28 22.5v5"/>',
  midden: '<rect x="11" y="8" width="22" height="12" rx="1"/><path d="M11 25h22M11 22.5v5M33 22.5v5"/>',
  groot:  '<rect x="4" y="8" width="36" height="12" rx="1"/><path d="M4 25h36M4 22.5v5M40 22.5v5"/>',
  alleMaten: '<rect x="2" y="10" width="8" height="12" rx="1"/><rect x="13" y="10" width="12" height="12" rx="1"/><rect x="28" y="10" width="16" height="12" rx="1"/>'
};

/* De filtertegels. Drie stappen na elkaar: pas als stap één beantwoord is
   verschijnt stap twee. 'Maakt niet uit' staat er bewust bij: iemand dwingen
   te kiezen over iets waar hij niets om geeft levert een verkeerde selectie
   op. Een knop die nul resultaten geeft wordt niet getoond. */
const FILTERS = [
  {
    id: 'dakvorm', title: 'Dakvorm', vraag: 'Welk dak past bij je tuin?',
    options: [
      { id:'lessenaarsdak', naam:'Plat dak',       icon:IC.plat,     match:m=>m.dakvorm==='lessenaarsdak' },
      { id:'zadeldak',      naam:'Zadeldak',       icon:IC.zadel,    match:m=>m.dakvorm==='zadeldak' },
      { id:'alles',         naam:'Maakt niet uit', icon:IC.beideDak, match:()=>true }
    ]
  },
  {
    id: 'luifel', title: 'Luifel', vraag: 'Wil je een overdekt stuk ernaast?',
    options: [
      { id:'ja',    naam:'Met luifel',     icon:IC.luifel,      match:m=>m.luifel!=='nee' },
      { id:'nee',   naam:'Zonder luifel',  icon:IC.geenLuifel,  match:m=>m.luifel!=='ja' },
      { id:'alles', naam:'Maakt niet uit', icon:IC.beideLuifel, match:()=>true }
    ]
  },
  {
    id: 'grootte', title: 'Breedte', vraag: 'Hoe breed mag het worden?',
    options: [
      { id:'klein', naam:'Tot 3 m',        icon:IC.klein,     match:m=>m.breedteMin<=3 },
      { id:'midden',naam:'3 tot 5 m',      icon:IC.midden,    match:m=>m.breedteMax>=3 && m.breedteMin<=5 },
      { id:'groot', naam:'Meer dan 5 m',   icon:IC.groot,     match:m=>m.breedteMax>5 },
      { id:'alles', naam:'Maakt niet uit', icon:IC.alleMaten, match:()=>true }
    ]
  }
];

/* ---- helpers ---- */
const mdl  = s => MODELLEN.find(m => m.id === s.model) || MODELLEN[0];
const uitv = s => { const m = mdl(s); return m.uitvoeringen.find(u => u.id === s.uitvoering) || m.uitvoeringen[0]; };
const klr  = s => { const m = mdl(s); return m.kleuren.find(k => k.id === s.kleur) || m.kleuren[0]; };
const sleutel = s => uitv(s).key + '|' + klr(s).key;
const varPrijs = s => mdl(s).prijs[sleutel(s)];
const varSku   = s => mdl(s).sku_var[sleutel(s)];
/* Niet elke kleur bestaat in elke uitvoering. Val terug op de goedkoopste
   die wel bestaat, anders staat er een leeg prijsveld. */
function normaliseer(s) {
  const m = mdl(s);
  if (!m.uitvoeringen.some(u => u.id === s.uitvoering)) s.uitvoering = m.uitvoeringen[0].id;
  if (!m.kleuren.some(k => k.id === s.kleur)) s.kleur = m.kleuren[0].id;
  if (varPrijs(s) === undefined) {
    const u = uitv(s);
    const k = m.kleuren.find(k => m.prijs[u.key + '|' + k.key] !== undefined);
    if (k) s.kleur = k.id;
  }
}
/* De goedkoopste kleur binnen een uitvoering. Niet elke kleur bestaat in
   elke maat, dus dit is ook de veilige terugval. */
function goedkoopsteVan(m, u) {
  let min = Infinity;
  m.kleuren.forEach(k => { const p = m.prijs[u.key + '|' + k.key]; if (p !== undefined && p < min) min = p; });
  return min === Infinity ? m.vanaf : min;
}
/* Hoe breed de luifel is. De fabrikant geeft het binnenmaat vloeroppervlak,
   en het verschil met het grondvlak is precies het overdekte deel. Alleen als
   dat ontbreekt vallen we terug op de schatting van de foto. */
const luifelBreedte = s => {
  const m = mdl(s), u = uitv(s);
  const deel = u.luifelDeel !== undefined ? u.luifelDeel : (m.deelOpen || 0.42);
  if (m.luifel === 'nee') return 0;
  if (m.luifel === 'optie') return /aanbouw/i.test(u.key) ? (u.W || 3) * (m.deelOpen || 0.4) : 0;
  return (u.W || 3) * deel;
};
/* De gesloten berging is de totale breedte min de luifel. */
const kernW = s => (uitv(s).W || 3) - luifelBreedte(s);
const diepte = s => uitv(s).L || 2.5;
