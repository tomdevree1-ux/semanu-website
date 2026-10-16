/* Steekt er iets door het dak?
   ---------------------------
   Deze test bouwt elk model in elke uitvoering na met een namaakversie van
   THREE, onthoudt van elk stuk waar de bovenkant zit, en vergelijkt dat met de
   onderkant van het dakvlak op diezelfde plek. Zo hoeven we niet per model in
   de browser te gaan kijken of er een balk doorheen prikt. */

class Vorm {
  constructor() { this.pts = []; this.holes = []; }
  moveTo(x, y) { this.pts.push([x, y]); return this; }
  lineTo(x, y) { this.pts.push([x, y]); return this; }
  closePath() { return this; }
  get maxY() { return Math.max(...this.pts.map(p => p[1])); }
  get minX() { return Math.min(...this.pts.map(p => p[0])); }
  get maxX() { return Math.max(...this.pts.map(p => p[0])); }
}
const nulPos = () => ({ x:0, y:0, z:0, set(x,y,z){ this.x=x; this.y=y; this.z=z; } });
const nulRot = () => ({ x:0, y:0, z:0 });

global.THREE = new Proxy(function(){}, {
  get: (t, k) => k === 'Shape' || k === 'Path' ? Vorm
              : k === 'Group' ? function(){ return { position:nulPos(), rotation:nulRot(), add(){}, children:[] }; }
              : global.THREE,
  apply: () => global.THREE,
  construct: (t, args, nt) => {
    if (nt === Vorm) return new Vorm();
    return { position:nulPos(), rotation:nulRot(), add(){}, children:[] };
  }
});
['woodMat','vwoodMat','beamMat','beamMat2','floorMat','roofMaterialM'].forEach(n => global[n] = {});
global.hinges = [];
global.cur = { position:nulPos(), rotation:nulRot(), add(){}, children:[] };
global.col = () => 0; global.roofMaterial = () => ({}); global.setPost = () => {};
global.dimLine = () => {};

let verschuiving = { x:0, y:0, z:0 };
let stukken = [], daken = [];

global.offset = (x, y, z, fn) => {
  const oud = verschuiving;
  verschuiving = { x: oud.x + x, y: oud.y + y, z: oud.z + z };
  try { fn(); } finally { verschuiving = oud; }
};
global.box = (w, h, d, mat, x, y, z) => {
  const o = { position:nulPos(), rotation:nulRot(), castShadow:true };
  o.position.set(x || 0, y || 0, z || 0);
  stukken.push({ soort:'box', w, h, d, o, off: verschuiving });
  return o;
};
global.wallShape = (w, h, holes) => {
  const s = new Vorm();
  s.moveTo(-w/2, 0); s.lineTo(w/2, 0); s.lineTo(w/2, h); s.lineTo(-w/2, h); s.closePath();
  return s;
};
global.gableShape = (w, rise) => {
  const s = new Vorm(); s.moveTo(-w/2, 0); s.lineTo(w/2, 0); s.lineTo(0, rise); s.closePath(); return s;
};
global.wall = (shape, thick) => {
  const o = { position:nulPos(), rotation:nulRot(), castShadow:true };
  stukken.push({ soort:'wall', sh:shape, t:thick, o, off: verschuiving });
  return o;
};
global.gableRoof = (W, L, eaveH, topH) => {
  daken.push({ soort:'zadel', W, L, eaveH, topH, off: verschuiving,
               gedraaid: Math.abs(global.cur.rotation.y || 0) > 0.1 });
  return { rise: topH - 0.04 - eaveH, ang: 0 };
};
global.leanRoof = (W, L, hBack, hFront) => {
  daken.push({ soort:'lessenaar', W, L, hBack, hFront, off: verschuiving });
};

const src = require('fs').readFileSync('products/cevo-tuinhuizen.js', 'utf8');
const PRODUCT = eval(src + '; PRODUCT');
const CAT = PRODUCT.catalog;

/* De onderkant van het dakvlak op een punt (x, z) in wereldcoördinaten. */
function dakOnder(dak, x, z) {
  if (dak.soort === 'lessenaar') {
    const { L, hBack, hFront } = dak;
    const zl = z - dak.off.z;
    return dak.off.y + hBack + (hFront - hBack) * (zl + L/2) / L + 0.012;
  }
  // zadeldak: het profiel loopt over de breedte, of over de diepte als de
  // groep een kwartslag gedraaid staat
  const rise = dak.topH - 0.04 - dak.eaveH, halfW = dak.W / 2;
  const as = dak.gedraaid ? (z - dak.off.z) : (x - dak.off.x);
  return dak.off.y + dak.eaveH + rise * (1 - Math.min(1, Math.abs(as) / halfW)) + 0.012;
}

/* De bovenrand van een vorm op een gegeven plek in zijn eigen x. Een wand kan
   schuin aflopen of een topgevel zijn, dus één maximum volstaat niet. */
function randOp(sh, x) {
  let hoogste = -Infinity;
  for (let i = 0; i < sh.pts.length; i++) {
    const a = sh.pts[i], b = sh.pts[(i + 1) % sh.pts.length];
    const lo = Math.min(a[0], b[0]), hi = Math.max(a[0], b[0]);
    if (x < lo - 1e-9 || x > hi + 1e-9) continue;
    const t = Math.abs(b[0] - a[0]) < 1e-9 ? 0 : (x - a[0]) / (b[0] - a[0]);
    hoogste = Math.max(hoogste, a[1] + t * (b[1] - a[1]));
  }
  return hoogste;
}

/* Punten op de bovenrand van een stuk, in wereldcoördinaten. */
function toppen(p) {
  const ox = p.off.x + p.o.position.x, oy = p.off.y + p.o.position.y, oz = p.off.z + p.o.position.z;
  if (p.soort === 'box') {
    const top = oy + p.h / 2, uit = [];
    [-p.w/2, 0, p.w/2].forEach(dx => [-p.d/2, 0, p.d/2].forEach(dz =>
      uit.push({ x: ox + dx, z: oz + dz, top })));
    return uit;
  }
  const th = p.o.rotation.y || 0;
  const langsZ = Math.abs(Math.abs(th) - Math.PI / 2) < 0.1;
  const teken = th < 0 ? 1 : -1;              // -90 graden: lokale x wordt +z
  const a = p.sh.minX, b = p.sh.maxX, uit = [];
  for (let i = 0; i <= 8; i++) {
    const lx = a + (b - a) * i / 8;
    const h = randOp(p.sh, lx);
    if (!isFinite(h)) continue;
    if (langsZ) uit.push({ x: ox, z: oz + teken * lx, top: oy + h });
    else        uit.push({ x: ox + (Math.abs(th) > 3 ? -lx : lx), z: oz, top: oy + h });
  }
  return uit;
}

let gecontroleerd = 0, doorsteek = 0;
const meldingen = [];
CAT.models.forEach(m => m.uitvoeringen.forEach(u => {
  [true, false].forEach(open => {
    stukken = []; daken = []; verschuiving = { x:0, y:0, z:0 };
    const s = { model:m.id, uitvoering:u.id, kleur:m.kleuren[0].id, toebehoren:{ goot:true } };
    PRODUCT.build(s);
    gecontroleerd++;
    if (!daken.length) { meldingen.push(`${m.naam} / ${u.naam}: geen dak gevonden`); doorsteek++; return; }
    stukken.forEach(p => {
      toppen(p).forEach(q => {
        if (!isFinite(q.top)) return;
        const onder = Math.min(...daken.map(d => dakOnder(d, q.x, q.z)));
        if (q.top > onder + 0.004) {
          doorsteek++;
          if (meldingen.length < 12)
            meldingen.push(`${m.naam} / ${u.naam}: ${p.soort} tot ${q.top.toFixed(3)} m ` +
                           `terwijl het dak op ${onder.toFixed(3)} m ligt (x ${q.x.toFixed(2)}, z ${q.z.toFixed(2)})`);
        }
      });
    });
  });
}));
console.log(`samenstellingen nagebouwd      : ${gecontroleerd}`);
console.log(`stukken door het dak           : ${doorsteek}`);
meldingen.forEach(r => console.log('  ' + r));
process.exit(doorsteek ? 1 : 0);
