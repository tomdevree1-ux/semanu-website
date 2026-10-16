/* =====================================================================
   SEMANU configurator UI
   Schemagestuurd parametermenu, prijskaart en landingspagina.

   De productlaag levert PRODUCT met:
     PRODUCT.sections  een lijst secties (zie hieronder)
     PRODUCT.base      basisprijs, of null bij prijs op aanvraag
     PRODUCT.build(s)  tekent het model voor toestand s
     PRODUCT.dims(s)   tekent de maatlijnen (optioneel)

   Een sectie:
     { id, title, type, options, layout, sub, when, price, onChange }
       type    'choice'  radioknoppen, één keuze
               'toggles' schakelaars, meerdere tegelijk
               'number'  keuze uit vaste getallen (compacte knoppen)
       options [{ id, name, sub, price, color, swatch }]
       layout  'list' | 'two' | 'three'   (kolommen)
       when    (s) => bool    toont de sectie alleen als dit waar is
       price   (s, opt) => nummer   overschrijft opt.price als de prijs
                                     van de gekozen optie afhangt
     Bij 'choice' zit de keuze in state[id], bij 'toggles' in state[id] als
     object {optieId: true}.
   ===================================================================== */

const $ = id => document.getElementById(id);
const eurRaw = n => '€ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const VAT = (BRAND.vat === undefined ? 0.21 : BRAND.vat);
const QUOTE = BRAND.pricing === 'quote';          // geen prijzen, alleen offerte
const BASE_EXCL = BRAND.pricing === 'excl';       // basisprijzen zijn excl. btw
function vatOf(n) { if (BASE_EXCL) return state.vat === 'incl' ? n * (1 + VAT) : n; return state.vat === 'excl' ? n / (1 + VAT) : n; }
const eur = n => eurRaw(vatOf(n));
const plus = n => QUOTE ? '' : (n < 0 ? '− ' + eur(-n) : n ? '+ ' + eur(n) : 'inbegrepen');

/* ---------- Catalogus ----------
   Een product kan in plaats van één vaste samenstelling een catalogus
   meegeven: filtertegels plus een lijst modellen. De klant filtert eerst,
   kiest dan een model, en pas daarna verschijnt het parametermenu met de
   opties die dat ene model toelaat. Zonder catalogus verandert er niets. */
const CAT = PRODUCT.catalog || null;
function curModel() { return CAT ? (CAT.models.find(m => m.id === state.model) || CAT.models[0]) : null; }
function secs() { return CAT ? CAT.sections(curModel()) : PRODUCT.sections; }

/* ---------- Toestand ---------- */
const state = { vat: BASE_EXCL ? 'excl' : 'incl', dims: false, open: false, started: false };
if (CAT) { state.model = CAT.models[0].id; state.filter = {}; CAT.filters.forEach(f => state.filter[f.id] = null); }
function initSections() {
  secs().forEach(sec => {
    if (sec.type === 'toggles') {
      if (typeof state[sec.id] !== 'object' || !state[sec.id]) state[sec.id] = {};
      (sec.options || []).forEach(o => { if (o.default && state[sec.id][o.id] === undefined) state[sec.id][o.id] = true; });
    } else if (!(sec.options || []).some(o => o.id === state[sec.id])) {
      const d = sec.options.find(o => o.default) || sec.options[0];
      state[sec.id] = d && d.id;
    }
  });
}
initSections();
try { if (location.hash.length > 2) Object.assign(state, JSON.parse(decodeURIComponent(atob(location.hash.slice(1))))); } catch (e) { }

function opt(secId) { const sec = secs().find(s => s.id === secId); if (!sec) return null; return (sec.options || []).find(o => o.id === state[secId]) || null; }
function optPrice(sec, o) { return sec.price ? sec.price(state, o) : (o.price || 0); }
function visible(sec) { return !sec.when || sec.when(state); }
function normalize() {
  secs().forEach(sec => {
    if (sec.type === 'toggles') { if (typeof state[sec.id] !== 'object' || !state[sec.id]) state[sec.id] = {}; return; }
    if (!(sec.options || []).some(o => o.id === state[sec.id])) state[sec.id] = (sec.options[0] || {}).id;
  });
  if (PRODUCT.normalize) PRODUCT.normalize(state);
}
normalize();

/* ---------- Haken voor de engine ---------- */
const CFG = {
  woodColors: () => PRODUCT.woodColors(state),
  roof: () => PRODUCT.roof(state),
  height: () => PRODUCT.height(state),
  footprint: () => PRODUCT.footprint(state)
};

/* ---------- Parametermenu ---------- */
function swatchHtml(o) {
  if (o.swatch === false) return '';
  if (o.color) return `<span class="sw" style="background:${o.color}"></span>`;
  if (o.color === null) return `<span class="sw" style="background:transparent;border-style:dashed"></span>`;
  return '';
}
function optionHtml(sec, o, compact) {
  const price = QUOTE ? '' : `<span class="price">${plus(optPrice(sec, o))}</span>`;
  if (compact) { const p = optPrice(sec, o); const note = o.sub || (p ? plus(p) : (o.default ? 'standaard' : 'inbegrepen')); return `${swatchHtml(o)}<span class="lbl">${o.name}<small>${note}</small></span>`; }
  return `${swatchHtml(o)}<span class="lbl">${o.name}<small>${o.sub || ''}</small></span>${price}`;
}
function buildUI() {
  const wrap = $('sections'); wrap.innerHTML = '';
  secs().forEach(sec => {
    if (!visible(sec)) return;
    const compact = sec.layout === 'two' || sec.layout === 'three';
    const cls = sec.layout === 'two' ? 'opts two' : sec.layout === 'three' ? 'opts three' : 'opts';
    const el = document.createElement('section');
    el.innerHTML = `<div class="sec-head"><div><h3>${sec.title}</h3></div></div>` +
      (sec.sub ? `<p class="sublabel">${sec.sub}</p>` : '') +
      `<div class="${cls}" id="sec_${sec.id}"></div>`;
    wrap.appendChild(el);
    const box = el.querySelector('#sec_' + sec.id);
    if (sec.type === 'toggles') {
      box.className = '';
      box.innerHTML = sec.options.map(o => `<label class="toggle"><span class="lbl">${o.name}<small>${o.sub || ''}</small></span><span class="right">${plus(optPrice(sec, o))}<span class="switch"><input type="checkbox" data-o="${o.id}" ${state[sec.id][o.id] ? 'checked' : ''}><i></i></span></span></label>`).join('');
      box.querySelectorAll('input').forEach(i => i.addEventListener('change', () => {
        state[sec.id][i.dataset.o] = i.checked; update(sec.rebuild !== false);
      }));
    } else {
      box.innerHTML = sec.options.map(o => `<label class="opt ${compact ? 'compact' : ''}"><input type="radio" name="${sec.id}" value="${o.id}" ${o.id === state[sec.id] ? 'checked' : ''}>${optionHtml(sec, o, compact)}</label>`).join('');
      box.querySelectorAll('input').forEach(i => i.addEventListener('change', () => {
        state[sec.id] = i.value;
        if (sec.onChange) sec.onChange(state);
        normalize(); buildUI(); update(sec.rebuild !== false);
      }));
    }
  });
  $('headName').textContent = CAT ? curModel().naam : PRODUCT.name;
  // artikelnummer van de gekozen variant, klein onder de modelnaam
  const sub = $('headSub');
  if (sub) { const t = PRODUCT.subline ? PRODUCT.subline(state) : ''; sub.textContent = t; sub.hidden = !t; }
  setTool('dims', state.dims); setTool('openState', state.open);
  $('openState').hidden = !PRODUCT.hinged;
}
function setTool(id, on) {
  $(id).setAttribute('aria-pressed', String(on));
  if (id === 'openState') {
    const t = $(id).querySelector('.txt');
    if (t) t.textContent = on ? 'Luiken en deur sluiten' : 'Luiken en deur openen';
  }
}
$('dims').addEventListener('click', () => { state.dims = !state.dims; setTool('dims', state.dims); update(); });
$('openState').addEventListener('click', () => {
  stopWenk();
  state.open = !state.open; setTool('openState', state.open); applyHinges(state.open); update();
});

/* De deur staat dicht bij het openen van een model, want zo staat het huisje
   ook op de productfoto. Alleen weet de klant dan niet dat hij open kan. Daarom
   wipt de knop na een paar seconden op met zijn label uitgeklapt, hoogstens
   drie keer, en stopt dat zodra hij hem aanraakt. */
let wenkTimer = null, wenkAantal = 0, wenkUit = false;
function stopWenk() {
  wenkUit = true; clearTimeout(wenkTimer);
  const b = $('openState'); if (b) b.classList.remove('wenk');
}
function wenk() {
  const b = $('openState');
  if (wenkUit || state.open || !state.started || !b || b.hidden) return;
  b.classList.add('wenk');
  setTimeout(() => b.classList.remove('wenk'), 1700);
  if (++wenkAantal >= 3) return;
  wenkTimer = setTimeout(wenk, 11000);
}
function startWenk() {
  clearTimeout(wenkTimer); wenkAantal = 0;
  if (!wenkUit) wenkTimer = setTimeout(wenk, 4500);
}

/* ---------- Prijs ---------- */
function lines() {
  // Met een catalogus levert extraLines de basisregel met de juiste variant en sku.
  const out = (!PRODUCT.base && PRODUCT.extraLines) ? [] : [{ n: PRODUCT.name + ' (basis)', p: PRODUCT.base || 0 }];
  secs().forEach(sec => {
    if (!visible(sec)) return;
    if (sec.type === 'toggles') {
      sec.options.forEach(o => { if (state[sec.id][o.id]) out.push({ n: o.name, p: optPrice(sec, o) }); });
    } else {
      const o = opt(sec.id); if (!o) return;
      const p = optPrice(sec, o);
      if (p || sec.always) out.push({ n: sec.line ? sec.line(o, state) : `${sec.title}: ${o.name}`, p });
    }
  });
  if (PRODUCT.extraLines) PRODUCT.extraLines(state).forEach((l, i) => out.splice(i, 0, l));
  return out;
}
function sumLabel() { return QUOTE ? 'Prijs op aanvraag' : `${BRAND.text.priceLabel} ${state.vat === 'excl' ? 'excl.' : 'incl.'} ${Math.round(VAT * 100)}% btw`; }
function update(rebuild) {
  const ls = lines(), total = ls.reduce((a, b) => a + b.p, 0);
  $('total').innerHTML = QUOTE ? 'op aanvraag' : eur(total);
  $('pcTable').innerHTML = ls.map(l => `<tr><td>${l.n}</td><td>${QUOTE ? '' : (l.p ? eur(l.p) : 'inbegrepen')}</td></tr>`).join('');
  $('pcSum').innerHTML = `<tr class="sum"><td>${sumLabel()}</td><td>${QUOTE ? '' : eur(total)}</td></tr>`;
  $('pcCount').textContent = ls.length + ' regel' + (ls.length > 1 ? 's' : '');
  document.querySelector('.total .lbl').innerHTML = QUOTE ? 'op aanvraag' : ((state.vat === 'excl' ? 'excl. ' : 'incl. ') + Math.round(VAT * 100) + '% btw' + (BRAND.text.deliveryNote ? ', ' + BRAND.text.deliveryNote : ''));
  if (rebuild !== false) {
    // De texturen hangen van de gekozen kleur af, dus opnieuw aanmaken voor we bouwen.
    applyWood(); applyRoof();
    clear(stat); cur = stat; hinges = []; PRODUCT.build(state); applyHinges(state.open);
  }
  clear(dyn); cur = dyn; if (PRODUCT.decor) PRODUCT.decor(state);
  if (state.dims && PRODUCT.dims) PRODUCT.dims(state);
  history.replaceState(null, '', '#' + btoa(encodeURIComponent(JSON.stringify(state))));
}

/* ---------- Samenvatting ---------- */
const modal = $('modal');
function openModal() {
  const ls = lines(), total = ls.reduce((a, b) => a + b.p, 0);
  $('mTitle').textContent = 'Jouw ' + PRODUCT.name;
  $('mTable').innerHTML = ls.map(l => `<tr><td>${l.n}</td><td>${QUOTE ? '—' : eur(l.p)}</td></tr>`).join('') +
    `<tr class="sum"><td>${sumLabel()}</td><td>${QUOTE ? '—' : eur(total)}</td></tr>`;
  $('shareUrl').value = location.href;
  const extra = PRODUCT.payload ? PRODUCT.payload(state) : {};
  $('mJson').textContent = JSON.stringify({ product: PRODUCT.id, ...extra, ...state, total: QUOTE ? null : Math.round(total * 100) / 100 }, null, 1);
  modal.classList.add('open'); $('closeBtn').focus();
}
$('summaryBtn').addEventListener('click', openModal); $('cartBtn').addEventListener('click', openModal);
$('closeBtn').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('open'); });
$('copyBtn').addEventListener('click', () => { const i = $('shareUrl'); i.select(); try { navigator.clipboard.writeText(i.value); $('copyBtn').textContent = 'Gekopieerd'; } catch (e) { document.execCommand('copy'); } });
$('pcToggle').addEventListener('click', () => { const o = $('pcToggle').getAttribute('aria-expanded') !== 'true'; $('pcToggle').setAttribute('aria-expanded', String(o)); $('pcLines').hidden = !o; });
function setVat(v) { state.vat = v; $('vatIncl').setAttribute('aria-pressed', String(v === 'incl')); $('vatExcl').setAttribute('aria-pressed', String(v === 'excl')); buildUI(); update(false); }
$('vatIncl').addEventListener('click', () => setVat('incl')); $('vatExcl').addEventListener('click', () => setVat('excl'));
if (QUOTE) { $('vatSeg').hidden = true; $('pcToggle').hidden = true; }

/* ---------- Landingspagina ---------- */
function showLanding(on) { $('landing').hidden = !on; if (!on) resize(); }
document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => { state.started = true; showLanding(false); update(); startWenk(); }));
$('backBtn').addEventListener('click', () => { state.started = false; clearTimeout(wenkTimer); showLanding(true); if (CAT) buildFinder(); });

/* ---------- Filtertegels en resultatenraster ---------- */
function passend() { return CAT.models.filter(m => CAT.match(m, state.filter)); }
function allesGekozen() { return CAT.filters.every(f => state.filter[f.id]); }

function buildFinder() {
  const wrap = $('finder'); if (!wrap) return;
  const st = $('staticTiles'); if (st) st.hidden = true;   // de vaste tegels vervallen

  /* Drie stappen na elkaar. Stap n verschijnt pas als stap n-1 beantwoord is,
     zodat een klant op een telefoon niet tegen negen knoppen tegelijk aankijkt.
     Beantwoorde stappen blijven staan, want terugkomen op een keuze moet kunnen. */
  let zichtbaar = true, html = '';
  CAT.filters.forEach((f, i) => {
    if (!zichtbaar) return;
    const beantwoord = !!state.filter[f.id];
    const knoppen = f.options.map(o => {
      const proef = Object.assign({}, state.filter); proef[f.id] = o.id;
      const n = CAT.models.filter(m => CAT.match(m, proef)).length;
      const aan = state.filter[f.id] === o.id;
      // een pictogram mag van de eerdere antwoorden afhangen, zodat de luifel
      // op een zadeldak ook als zadeldak getekend wordt
      const ico = typeof o.icon === 'function' ? o.icon(state.filter) : (o.icon || '');
      // nul resultaten: de knop blijft staan maar is dood, met uitleg eronder
      return '<button class="ftile' + (n ? '' : ' leeg') + '" data-f="' + f.id + '" data-o="' + o.id + '"' +
        (n ? '' : ' aria-disabled="true"') + ' aria-pressed="' + aan + '">' +
        '<span class="fico" aria-hidden="true"><svg viewBox="0 0 44 30" fill="none" stroke="currentColor" ' +
        'stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">' + ico + '</svg></span>' +
        '<b>' + o.naam + '</b><span class="fn">' + n + '</span></button>';
    }).join('');
    html += '<div class="fstep' + (beantwoord ? ' klaar' : '') + '">' +
      '<p class="fq"><span class="fnr">' + (i + 1) + '</span>' + f.vraag + '</p>' +
      '<div class="ftiles">' + knoppen + '</div>' +
      '<p class="fmelding" hidden>' + (CAT.leegMelding ||
        'Met je vorige keuzes is er geen resultaat dat hieraan voldoet.') + '</p></div>';
    zichtbaar = beantwoord;                                // volgende stap pas na een antwoord
  });

  let res = '';
  if (allesGekozen()) {
    const treffers = passend();
    res = '<p class="fcount"><b>' + treffers.length + '</b> ' +
      (treffers.length === 1 ? 'tuinhuis past bij je keuze' : 'tuinhuizen passen bij je keuze') + '</p>' +
      '<div class="mcards">' + treffers.map(m => {
        const c = CAT.card(m);
        // In een demo staat maar een deel open. De rest blijft zichtbaar zodat
        // je het bereik ziet, maar is niet aanklikbaar.
        const dicht = CAT.locked ? CAT.locked(m) : false;
        return '<button class="mcard' + (dicht ? ' op-slot' : '') + '" data-m="' + m.id + '"' +
          (dicht ? ' aria-disabled="true"' : '') + '>' +
          (c.foto ? '<span class="mfoto"><img src="' + c.foto + '" alt="" loading="lazy"></span>' : '') +
          (dicht ? '<span class="slotlabel">' + (CAT.lockedLabel || 'Op aanvraag') + '</span>' : '') +
          '<span class="mbody"><span class="mmeta">' + c.meta + '</span><b>' + c.naam + '</b>' +
          '<span class="mprijs">vanaf ' + eurRaw(c.vanaf) + '</span>' +
          '<span class="cta">' + (dicht ? (CAT.lockedCta || 'Binnenkort online') : 'Bekijk in 3D') + '</span></span></button>';
      }).join('') + '</div>';
  }
  wrap.innerHTML = html + '<div class="fresult">' + res + '</div>';

  wrap.querySelectorAll('.ftile').forEach(b => b.addEventListener('click', () => {
    if (b.classList.contains('leeg')) {                    // dood, maar wel uitleggen waarom
      const stap = b.closest('.fstep'), mel = stap && stap.querySelector('.fmelding');
      if (mel) mel.hidden = false;
      return;
    }
    const f = b.dataset.f;
    state.filter[f] = state.filter[f] === b.dataset.o ? null : b.dataset.o;
    herzieLatereStappen(f);
    buildFinder();
    // op een telefoon staat de volgende stap onder de vouw
    const volgende = wrap.querySelector('.fstep:not(.klaar)') || wrap.querySelector('.fresult');
    if (volgende && state.filter[f]) volgende.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }));
  wrap.querySelectorAll('.mcard').forEach(b => b.addEventListener('click', () => {
    if (b.classList.contains('op-slot')) return;
    kiesModel(b.dataset.m);
  }));
}

/* Verandert een eerdere stap, dan kan een later antwoord nul resultaten geven.
   Zo'n antwoord wissen we, anders staat de klant voor een lege lijst zonder te
   zien welke knop de boosdoener is. */
function herzieLatereStappen(gewijzigd) {
  const vanaf = CAT.filters.findIndex(f => f.id === gewijzigd);
  CAT.filters.slice(vanaf + 1).forEach(f => {
    if (!state.filter[f.id]) return;
    const proef = Object.assign({}, state.filter);
    if (!CAT.models.filter(m => CAT.match(m, proef)).length) state.filter[f.id] = null;
  });
}

function kiesModel(id) {
  state.model = id;
  // de secties van het vorige model gelden niet meer
  secs().forEach(sec => { delete state[sec.id]; });
  state.uitvoering = undefined; state.kleur = undefined;
  initSections();
  // Laat het model openen op de uitvoering die bij de filterkeuze past. Zonder
  // dit opent een model dat de luifel als aparte uitvoering voert op de
  // goedkoopste, en dat is net de variant zonder luifel.
  if (CAT.preselect) Object.assign(state, CAT.preselect(curModel(), state.filter) || {});
  normalize();
  state.started = true; showLanding(false);
  buildUI(); update();
  Object.assign(goal, views()['3d']); cam.target.y = CFG.height() * 0.46;
  startWenk();
}

/* ---------- Start ---------- */
applyWood(); applyRoof(); buildUI(); update();
if (CAT) buildFinder();
Object.assign(cam, views()['3d']); Object.assign(goal, views()['3d']); cam.target.y = CFG.height() * 0.46;
$('vatIncl').setAttribute('aria-pressed', String(state.vat !== 'excl')); $('vatExcl').setAttribute('aria-pressed', String(state.vat === 'excl'));
showLanding(!state.started); resize(); requestAnimationFrame(frameLoop);
