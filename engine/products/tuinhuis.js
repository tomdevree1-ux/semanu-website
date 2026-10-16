/* =====================================================================
   Productlaag: tuinhuis
   Toont hoe een nieuw product op de engine wordt gezet. Alles wat hier
   staat is domeinspecifiek; engine.js en ui.js weten niets van tuinhuizen.
   ===================================================================== */

const MAAT = [
  { id: 'm300', name: '300 x 250', W: 3.00, L: 2.50, price: 0, default: true },
  { id: 'm350', name: '350 x 300', W: 3.50, L: 3.00, price: 340 },
  { id: 'm400', name: '400 x 300', W: 4.00, L: 3.00, price: 520 },
  { id: 'm500', name: '500 x 350', W: 5.00, L: 3.50, price: 1150 }
];
const HOUT = [
  { id: 'vuren', name: 'Vuren onbehandeld', base: '#D9C093', dark: '#A48B58', price: 0, default: true },
  { id: 'douglas', name: 'Douglas', base: '#D4955A', dark: '#8E5A2E', price: 245 },
  { id: 'grijs', name: 'Grijs gedompeld', base: '#A7A399', dark: '#6F6C63', price: 165 },
  { id: 'zwart', name: 'Zwart gecoat', base: '#3A3A38', dark: '#1E1E1D', price: 210 }
];
const WAND = [
  { id: 'rabat', name: 'Zweeds rabat', sub: 'Horizontale planken', price: 0, default: true },
  { id: 'potdeksel', name: 'Potdeksel', sub: 'Overlappend, grover profiel', price: 120 },
  { id: 'verticaal', name: 'Verticale delen', sub: 'Staande planken', price: 95 }
];
const DAK = [
  { id: 'zadel', name: 'Zadeldak', kind: 'plank', price: 0, default: true },
  { id: 'lessenaar', name: 'Lessenaarsdak', kind: 'plank', price: 0 },
  { id: 'plat', name: 'Plat dak', kind: 'sheet', color: '#33322F', price: 0 }
];
const DAKBEDEKKING = [
  { id: 'roofing', name: 'Roofing zwart', color: '#2A2A2A', price: 0, default: true },
  { id: 'shingles', name: 'Shingles antraciet', color: '#3B3B3B', price: 265 },
  { id: 'shingroen', name: 'Shingles groen', color: '#2F4A34', price: 265 },
  { id: 'staal', name: 'Stalen dakplaat', color: '#5A5E60', price: 340 }
];
const DEUR = [
  { id: 'enkel', name: 'Enkele deur', sub: '90 cm, met raam', price: 0, default: true },
  { id: 'dubbel', name: 'Dubbele deur', sub: '160 cm, met raam', price: 285 },
  { id: 'schuif', name: 'Schuifdeur', sub: '180 cm, blind', price: 430 }
];
const RAMEN = [
  { id: 'geen', name: 'Geen ramen', price: 0 },
  { id: 'een', name: 'Eén raam', sub: 'Rechterzijde', price: 145, default: true },
  { id: 'twee', name: 'Twee ramen', sub: 'Beide zijden', price: 275 }
];
const OVERKAPPING = [
  { id: 'geen', name: 'Geen overkapping', price: 0, default: true },
  { id: 'o100', name: 'Overkapping 100 cm', price: 620 },
  { id: 'o200', name: 'Overkapping 200 cm', price: 1090 }
];

const find = (arr, id) => arr.find(x => x.id === id) || arr[0];
const overhangM = s => ({ geen: 0, o100: 1.0, o200: 2.0 })[s.overkapping] || 0;

const PRODUCT = {
  id: 'tuinhuis',
  name: 'Tuinhuis',
  base: 2450,
  hinged: true,

  sections: [
    { id: 'maat', title: 'Afmeting', type: 'choice', layout: 'two', options: MAAT, line: o => 'Afmeting ' + o.name + ' cm' },
    { id: 'hout', title: 'Houtsoort en afwerking', type: 'choice', layout: 'two', options: HOUT.map(h => ({ ...h, color: h.base })), line: o => o.name },
    { id: 'wand', title: 'Wandbekleding', type: 'choice', options: WAND, line: o => 'Wandbekleding ' + o.name.toLowerCase() },
    { id: 'dak', title: 'Dakvorm', type: 'choice', layout: 'three', options: DAK, line: o => o.name },
    {
      id: 'dakbedekking', title: 'Dakbedekking', type: 'choice', layout: 'two',
      options: DAKBEDEKKING.map(d => ({ ...d, color: d.color })),
      when: s => s.dak !== 'plat', line: o => 'Dakbedekking ' + o.name.toLowerCase()
    },
    { id: 'deur', title: 'Deur', type: 'choice', options: DEUR, line: o => o.name },
    { id: 'ramen', title: 'Ramen', type: 'choice', layout: 'three', options: RAMEN, line: o => o.name },
    { id: 'overkapping', title: 'Overkapping', type: 'choice', layout: 'three', options: OVERKAPPING, line: o => o.name },
    {
      id: 'extras', title: 'Extra\'s', type: 'toggles', options: [
        { id: 'vloer', name: 'Geïsoleerde vloer', sub: '22 mm vloerdelen op regels', price: 395, default: true },
        { id: 'goot', name: 'Dakgoot en regenpijp', sub: 'Zink, beide zijden', price: 240 },
        { id: 'fundering', name: 'Funderingsbalken', sub: 'Gedrukt geïmpregneerd', price: 180 },
        { id: 'montage', name: 'Montage door ons team', sub: 'Inclusief voorrijden', price: 890 }
      ]
    }
  ],

  /* ---- haken voor de engine ---- */
  woodColors: s => find(HOUT, s.hout),
  roof: s => {
    const d = find(DAK, s.dak);
    if (d.kind === 'sheet') return { kind: 'sheet', color: d.color };
    const b = find(DAKBEDEKKING, s.dakbedekking);
    return { kind: 'sheet', color: b.color };
  },
  height: s => { const m = find(MAAT, s.maat); return s.dak === 'plat' ? 2.55 : 2.25 + m.W * 0.16; },
  footprint: s => { const m = find(MAAT, s.maat); return { W: m.W, L: m.L + overhangM(s) }; },

  /* ---- het model ---- */
  build(s) {
    const m = find(MAAT, s.maat), W = m.W, L = m.L, wallH = 2.05, ov = overhangM(s);
    const wandMat = s.wand === 'verticaal' ? vwoodMat : woodMat;
    const t = 0.028;

    // funderingsbalken en vloer
    const fy = 0.09;
    [-L / 2 + 0.12, 0, L / 2 - 0.12].forEach(z => box(W, 0.09, 0.09, beamMat2, 0, fy / 2, z));
    const fl = box(W, 0.03, L, floorMat, 0, fy, 0); fl.castShadow = false;

    // wanden met openingen
    const deur = { enkel: 0.90, dubbel: 1.60, schuif: 1.80 }[s.deur] || 0.9;
    const dh = 1.95;
    const front = wall(wallShape(W, wallH, [{ x: 0, y: 0, w: deur, h: dh }]), t, wandMat);
    front.position.set(0, fy, L / 2 - t);
    const back = wall(wallShape(W, wallH, []), t, wandMat); back.position.set(0, fy, -L / 2);
    const raamR = (s.ramen === 'een' || s.ramen === 'twee') ? [{ x: 0, y: 0.95, w: 0.80, h: 0.70 }] : [];
    const raamL = (s.ramen === 'twee') ? [{ x: 0, y: 0.95, w: 0.80, h: 0.70 }] : [];
    const right = wall(wallShape(L, wallH, raamR), t, wandMat); right.rotation.y = -Math.PI / 2; right.position.set(W / 2, fy, 0);
    const left = wall(wallShape(L, wallH, raamL), t, wandMat); left.rotation.y = Math.PI / 2; left.position.set(-W / 2, fy, 0);

    // dak
    const eave = fy + wallH;
    if (s.dak === 'zadel') {
      const top = eave + W * 0.16, rise = top - 0.04 - eave;
      offset(0, 0, ov / 2, () => gableRoof(W, L + ov, eave, top, roofMaterial(), 0.22));
      // topgevels: dicht aan de achterkant, open boven de overkapping
      const g1 = wall(gableShape(W, rise), 0.022, wandMat); g1.position.set(0, eave, -L / 2);
      if (ov < 0.1) { const g2 = wall(gableShape(W, rise), 0.022, wandMat); g2.position.set(0, eave, L / 2 - 0.022); }
      box(W + 0.14, 0.08, 0.08, beamMat2, 0, eave - 0.04, L / 2 - 0.05);
      box(W + 0.14, 0.08, 0.08, beamMat2, 0, eave - 0.04, -L / 2 + 0.05);
    } else if (s.dak === 'lessenaar') {
      const hB = eave + W * 0.14;
      offset(0, 0, ov / 2, () => leanRoof(W, L + ov, hB, eave, roofMaterial(), 0.2));
      const sh = new THREE.Shape(); sh.moveTo(-(L + ov) / 2, 0); sh.lineTo((L + ov) / 2, 0); sh.lineTo((L + ov) / 2, hB - eave); sh.closePath();
      [1, -1].forEach(sg => { const g = wall(sh, 0.022, wandMat); g.rotation.y = sg * Math.PI / 2; g.position.set(sg * W / 2, eave, ov / 2); });
    } else {
      const r = box(W + 0.3, 0.06, L + ov + 0.3, roofMaterial(), 0, eave + 0.03, ov / 2); r.castShadow = true;
      box(W + 0.3, 0.10, 0.05, beamMat2, 0, eave + 0.11, (L + ov) / 2 + 0.13);
      box(W + 0.3, 0.10, 0.05, beamMat2, 0, eave + 0.11, -L / 2 - 0.13);
    }

    // staanders van de overkapping
    if (ov > 0.1) {
      const py = eave + (s.dak === 'plat' ? 0 : 0.02);
      [[-W / 2 + 0.08, L / 2 + ov - 0.1], [W / 2 - 0.08, L / 2 + ov - 0.1]].forEach(([x, z]) => box(0.09, py, 0.09, beamMat, x, py / 2, z));
      box(W - 0.1, 0.10, 0.09, beamMat2, 0, py - 0.05, L / 2 + ov - 0.1);
    }

    // deur: één of twee vleugels, scharnierend, met raampje en beslag
    const iron = new THREE.MeshStandardMaterial({ color: col('#1C1C1C'), roughness: .6, metalness: .2 });
    const glas = new THREE.MeshStandardMaterial({ color: col('#BFD6E2'), roughness: .12, metalness: .1, transparent: true, opacity: .55 });
    /* Eén deurvleugel. scharnierX is de wereldpositie van het scharnier,
       richting +1 = paneel loopt naar +x en draait open naar buiten. */
    function vleugel(scharnierX, breedte, richting) {
      const pivot = new THREE.Group(); pivot.position.set(scharnierX, fy, L / 2 + 0.005); cur.add(pivot);
      const x0 = richting > 0 ? 0 : -breedte;
      const gat = s.deur === 'schuif' ? [] : [{ x: x0 + breedte / 2, y: dh * 0.62, w: breedte * 0.5, h: 0.5 }];
      const paneel = wall(wallShape(breedte, dh, gat.map(g => ({ ...g, x: g.x - (x0 + breedte / 2) }))), 0.035, vwoodMat, pivot);
      paneel.position.set(x0 + breedte / 2, 0, -0.017);
      if (gat.length) box(0.008, 0.5, breedte * 0.5, glas, x0 + breedte / 2, dh * 0.62 + 0.25, -0.001, pivot);
      [dh * 0.22, dh * 0.78].forEach(hy => box(breedte * 0.72, 0.035, 0.01, iron, x0 + breedte / 2, hy, 0.021, pivot));
      const knop = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.05, 12), iron);
      knop.rotation.z = Math.PI / 2;
      knop.position.set(richting > 0 ? breedte - 0.09 : -breedte + 0.09, dh * 0.5, 0.03); pivot.add(knop);
      hinges.push({ obj: pivot, open: s.deur === 'schuif' ? 0 : -richting * 1.15, closed: 0 });
    }
    if (s.deur === 'dubbel') { vleugel(-deur / 2, deur / 2, 1); vleugel(deur / 2, deur / 2, -1); }
    else vleugel(-deur / 2, deur, 1);

    // ramen: kozijn plus roeden
    const raam = (x, sign) => {
      const g = new THREE.Group(); g.position.set(x, fy + 0.95, 0); cur.add(g);
      const w = 0.80, h = 0.70, jt = 0.03;
      box(0.035, jt, w, beamMat2, 0, 0, 0, g); box(0.035, jt, w, beamMat2, 0, h, 0, g);
      [-1, 1].forEach(d => box(0.035, h, jt, beamMat2, 0, h / 2, d * (w / 2 - jt / 2), g));
      box(0.006, h - jt * 2, w - jt * 2, glas, sign * 0.012, h / 2, 0, g);
      box(0.02, 0.02, w - jt * 2, beamMat2, sign * 0.02, h / 2, 0, g);
      box(0.02, h - jt * 2, 0.02, beamMat2, sign * 0.02, h / 2, 0, g);
    };
    if (s.ramen === 'een' || s.ramen === 'twee') raam(W / 2 - 0.015, 1);
    if (s.ramen === 'twee') raam(-W / 2 + 0.015, -1);

    // dakgoot
    if (s.extras && s.extras.goot) {
      const zink = new THREE.MeshStandardMaterial({ color: col('#9BA3A8'), roughness: .4, metalness: .5 });
      const zs = s.dak === 'zadel' ? [W / 2 + 0.24, -W / 2 - 0.24] : [];
      zs.forEach(x => { const g = box(0.09, 0.09, L + ov + 0.3, zink, x, eave - 0.06, ov / 2); g.castShadow = false; });
      if (!zs.length) box(W + 0.3, 0.09, 0.09, zink, 0, eave - 0.02, (L + ov) / 2 + 0.2);
    }
  },

  /* ---- losse aankleding die niet in de constructie zit ---- */
  decor() { },

  /* ---- maatlijnen ---- */
  dims(s) {
    const m = find(MAAT, s.maat), W = m.W, L = m.L, ov = overhangM(s), H = PRODUCT.height(s);
    dimLine(new THREE.Vector3(-W / 2, 0.02, L / 2 + ov + 0.6), new THREE.Vector3(W / 2, 0.02, L / 2 + ov + 0.6), Math.round(W * 100) + ' cm');
    dimLine(new THREE.Vector3(W / 2 + 0.6, 0.02, -L / 2), new THREE.Vector3(W / 2 + 0.6, 0.02, L / 2), Math.round(L * 100) + ' cm');
    dimLine(new THREE.Vector3(-W / 2 - 0.5, 0, L / 2), new THREE.Vector3(-W / 2 - 0.5, H, L / 2), Math.round(H * 100) + ' cm');
    if (ov > 0.1) dimLine(new THREE.Vector3(W / 2 + 0.6, 0.02, L / 2), new THREE.Vector3(W / 2 + 0.6, 0.02, L / 2 + ov), Math.round(ov * 100) + ' cm');
  }
};
