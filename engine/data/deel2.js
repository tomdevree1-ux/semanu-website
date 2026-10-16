
const PRODUCT = {
  id: 'cevo-tuinhuis',
  name: 'Tuinhuis',
  hinged: true,
  base: 0,                       // de basisprijs komt uit de gekozen variant
  disclaimer: 'Weergave op basis van maten en productfotos, geen fabriekstekening.',

  /* ---- catalogus: eerst filteren, dan een model kiezen ---- */
  catalog: {
    filters: FILTERS,
    models: MODELLEN,
    /* Sluit het model aan bij de gekozen filters? */
    match(m, keuze) {
      return FILTERS.every(f => {
        const o = f.options.find(o => o.id === keuze[f.id]);
        return !o || o.match(m);
      });
    },
    /* De kaart in het resultatenraster: de foto van de webshop, de naam en
       vanaf welke prijs. De maten en het artikelnummer horen op de
       productpagina thuis, niet in een keuzelijst. */
    card(m) {
      const dak = m.dakvorm === 'zadeldak' ? 'Zadeldak' : 'Plat dak';
      const lu = m.luifel === 'ja' ? 'met luifel' : m.luifel === 'optie' ? 'luifel optioneel' : 'zonder luifel';
      return { naam: m.naam, meta: dak + ', ' + lu, foto: fotoVan(m), vanaf: m.vanaf };
    },
    /* Opent het model op de uitvoering die bij de filterkeuze hoort. Alleen
       van belang bij de drie modellen die de aanbouw als variant voeren. */
    preselect(m, keuze) {
      if (m.luifel !== 'optie' || !keuze || !keuze.luifel || keuze.luifel === 'alles') return null;
      const wil = keuze.luifel === 'ja';
      const u = m.uitvoeringen.find(x => /aanbouw/i.test(x.key) === wil);
      return u ? { uitvoering: u.id } : null;
    },

    /* De secties binnen het gekozen model. */
    sections(m) {
      const secs = [];
      /* De basisprijs is de goedkoopste variant, precies de 'vanaf' prijs
         van de webshop. Elke keuze toont daarna wat ze erbij kost, zodat de
         klant de sprong van blank hout naar een gecoate kleur ziet aankomen
         en niet pas in de winkelwagen. */
      if (m.uitvoeringen.length > 1) {
        secs.push({
          id: 'uitvoering', title: 'Uitvoering', type: 'choice', layout: 'two',
          options: m.uitvoeringen.map((u, i) => ({
            id: u.id, name: u.naam, sub: u.W ? (Math.round(u.W * u.L * 100) / 100 + ' m²').replace('.', ',') : '',
            default: i === 0
          })),
          price: (s, o) => {
            const u = m.uitvoeringen.find(x => x.id === o.id) || m.uitvoeringen[0];
            return goedkoopsteVan(m, u) - m.vanaf;
          },
          rebuild: true, always: true,
          line: o => 'Uitvoering ' + o.name
        });
      }
      if (m.kleuren.length > 1) {
        secs.push({
          id: 'kleur', title: 'Kleur en afwerking', type: 'choice', layout: 'two',
          options: m.kleuren.map((k, i) => ({
            id: k.id, name: k.naam, color: k.base, default: i === 0
          })),
          price: (s, o) => {
            const u = uitv(s), k = m.kleuren.find(x => x.id === o.id) || m.kleuren[0];
            const p = m.prijs[u.key + '|' + k.key];
            return p === undefined ? 0 : p - goedkoopsteVan(m, u);
          },
          rebuild: true,
          line: o => 'Kleur ' + o.name
        });
      }
      secs.push({
        id: 'toebehoren', title: 'Toebehoren', type: 'toggles',
        options: ACCESSOIRES.map(a => ({ id: a.id, name: a.naam, sub: a.sub, price: a.price }))
      });
      return secs;
    }
  },

  /* ---- haken voor de engine ---- */
  woodColors: s => { const k = klr(s); return { base: k.base, dark: k.dark }; },
  roof: () => ({ kind: 'sheet', color: '#2E2E2C' }),
  /* Bij een zadeldak met luifel loopt de nok over de breedte, want het dak
     moet over het open deel doorlopen. Zonder luifel staat de topgevel aan
     de voorkant en loopt de nok naar achteren. Zo staat het op de foto's van
     Maribel, Octavio en Fraya tegenover Udo, Norah en Dallas. */
  height: s => {
    const m = mdl(s);
    if (m.dakvorm !== 'zadeldak') return 1.98 + diepte(s) * 0.1405;   // 8 graden
    const span = (m.luifel === 'ja' || luifelBreedte(s) > 0.4) ? diepte(s) : kernW(s);
    return 2.15 + Math.min(span, 4.2) * 0.17;
  },
  footprint: s => ({ W: uitv(s).W || 3, L: diepte(s) }),

  normalize: normaliseer,

  /* Klein regeltje onder de modelnaam: het artikelnummer van precies de
     variant die nu gekozen is, plus dat van de ouder. Dat is wat een
     medewerker in Magento intikt. */
  subline: s => {
    const k = varSku(s);
    return k ? 'Art. ' + k + '  ·  ' + mdl(s).sku : mdl(s).sku;
  },

  /* Eerste regel van de prijsopbouw: het model in zijn goedkoopste uitvoering. */
  extraLines: s => [{ n: mdl(s).naam + ', basisuitvoering (' + mdl(s).sku + ')', p: mdl(s).vanaf }],

  /* Wat er naar de webshop zou gaan. Dit is het aanknopingspunt voor de
     koppeling: de sku van de gekozen variant plus de losse artikelen. */
  payload: s => ({
    model: mdl(s).naam,
    parent_sku: mdl(s).sku,
    sku: varSku(s) || null,
    uitvoering: uitv(s).naam,
    kleur: klr(s).naam,
    variantprijs: varPrijs(s) || null,
    toebehoren: ACCESSOIRES.filter(a => s.toebehoren && s.toebehoren[a.id])
                           .map(a => ({ sku: a.sku, naam: a.naam, prijs: a.price }))
  }),

  /* ---- het model ---- */
  build(s) {
    normaliseer(s);
    const m = mdl(s), u = uitv(s);
    const Wt = u.W || 3, L = diepte(s);
    const lu = luifelBreedte(s), Wk = Math.max(1.4, Wt - lu);
    const wallH = u.muur || 1.891, t = Math.max(0.028, m.wanddikte / 1000), fy = 0.09;   // binnenmaat hoogte
    const eave = fy + wallH;
    const zadel = m.dakvorm === 'zadeldak';
    const nokOverBreedte = zadel && lu > 0.4;      // dak loopt door over de luifel
    const spanDak = nokOverBreedte ? L : Wk;       // waarover het dakvlak helt
    const top = eave + Math.min(spanDak, 4.2) * 0.17;
    const cx = -Wt / 2 + Wk / 2;              // hart van de gesloten berging

    /* Een groep die een kwartslag gedraaid staat, zodat gableRoof de nok over
       de breedte legt in plaats van naar achteren. */
    function gedraaid(fn) {
      const g = new THREE.Group(); g.rotation.y = Math.PI / 2; cur.add(g);
      const prev = cur; cur = g; try { fn(); } finally { cur = prev; }
    }

    const iron = new THREE.MeshStandardMaterial({ color: col('#1C1C1C'), roughness: .6, metalness: .2 });
    const glas = new THREE.MeshStandardMaterial({ color: col('#BFD6E2'), roughness: .12, metalness: .1, transparent: true, opacity: .55 });

    /* --- gesloten deel ---
       Maten uit de montagehandleiding van Outdoor Life (Amira 380x175):
       wandhoogte 189,1 achter en 211,6 voor, dakhelling 8 graden, dus het
       lessenaarsdak is HOOG AAN DE VOORKANT en helt naar achteren. De
       zijwanden zijn daardoor trapezium en geen rechthoek. Deuropening
       149,4 x 185, raamopening 68,5 x 88,2 met de bovenkant gelijk aan die
       van de deur, en het raam zit naast de deur in de voorgevel, niet in
       de zijwand. */
    // dakhelling van de fabrikant als die er is, anders 8 graden
    const graden = u.helling || 8;
    const rise = zadel ? 0 : L * Math.tan(graden * Math.PI / 180);
    const hA = eave;                          // achterwand, laag
    const hV = eave + rise;                   // voorgevel, hoog

    /* Trapeziumvormige wand: links hoog hL, rechts hoog hR. */
    function schuinShape(w, hL, hR, holes) {
      const sh = new THREE.Shape();
      sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, hR); sh.lineTo(-w / 2, hL); sh.closePath();
      (holes || []).forEach(h => {
        const pa = new THREE.Path();
        pa.moveTo(h.x - h.w / 2, h.y); pa.lineTo(h.x + h.w / 2, h.y);
        pa.lineTo(h.x + h.w / 2, h.y + h.h); pa.lineTo(h.x - h.w / 2, h.y + h.h); pa.closePath();
        sh.holes.push(pa);
      });
      return sh;
    }

    // deur- en raamopening van de fabrikant, anders een redelijke standaard
    const deurB = u.deur ? Math.min(u.deur[0], Wk - 0.5)
                : m.deur === 'enkel' ? 0.90 : m.deur === 'glas' ? Math.min(1.90, Wk * 0.50) : Math.min(1.50, Wk * 0.42);
    const dh = u.deur ? u.deur[1] : (m.deur === 'glas' ? 1.98 : 1.85);
    const raamB = u.raam ? u.raam[0] : 0.685;
    const raamH = u.raam ? u.raam[1] : 0.882;
    const raamDorpel = Math.max(0.5, dh - raamH);                  // bovenkanten gelijk
    const nRamen = u.ramen === undefined ? m.ramen : u.ramen;
    // deur links van het midden, zoals op de tekening: 47,2 cm van de hoek
    const deurX = -Wk / 2 + Math.max(0.35, Wk * 0.126) + deurB / 2;
    const ruimteRechts = Wk / 2 - (deurX + deurB / 2);
    const raamX = deurX + deurB / 2 + ruimteRechts / 2;
    const raamX2 = -Wk / 2 - 0.001 + (deurX - deurB / 2 + Wk / 2) / 2;

    const gaten = [{ x: deurX, y: 0, w: deurB, h: dh }];
    if (nRamen >= 1 && ruimteRechts > raamB + 0.30) gaten.push({ x: raamX, y: raamDorpel, w: raamB, h: raamH });
    if (nRamen >= 2 && (deurX - deurB / 2 + Wk / 2) > raamB + 0.30) gaten.push({ x: raamX2, y: raamDorpel, w: raamB, h: raamH });

    offset(cx, 0, 0, () => {
      [-L / 2 + 0.12, 0, L / 2 - 0.12].forEach(z => box(Wk, 0.09, 0.09, beamMat2, 0, fy / 2, z));
      const vl = box(Wk, 0.03, L, floorMat, 0, fy, 0); vl.castShadow = false;

      // voorgevel met deur en ramen, achterwand dicht
      const front = wall(wallShape(Wk, hV - fy, gaten), t, woodMat);
      front.position.set(0, fy, L / 2 - t);
      const back = wall(wallShape(Wk, (zadel ? hV : hA) - fy, []), t, woodMat);
      back.position.set(0, fy, -L / 2);

      // zijwanden: trapezium bij een lessenaarsdak, rechthoek bij een zadeldak
      [1, -1].forEach(sg => {
        const sh = zadel ? wallShape(L, hV - fy, [])
                         : schuinShape(L, (sg > 0 ? hA : hV) - fy, (sg > 0 ? hV : hA) - fy, []);
        const w2 = wall(sh, t, woodMat);
        w2.rotation.y = sg * -Math.PI / 2;
        w2.position.set(sg * Wk / 2, fy, 0);
      });

      if (zadel) {
        const rise2 = top - 0.04 - eave;
        if (nokOverBreedte) {
          [-1, 1].forEach(sg => {
            const g = wall(gableShape(L, rise2), 0.022, woodMat);
            g.rotation.y = sg * Math.PI / 2;
            g.position.set(sg * Wk / 2, eave, 0);
          });
        } else {
          const g1 = wall(gableShape(Wk, rise2), 0.022, woodMat); g1.position.set(0, eave, -L / 2);
          const g2 = wall(gableShape(Wk, rise2), 0.022, woodMat); g2.position.set(0, eave, L / 2 - 0.022);
        }
      }

      /* deurvleugels, scharnierend, openen naar buiten */
      function vleugel(scharnierX, breedte, richting) {
        const pivot = new THREE.Group(); pivot.position.set(scharnierX, fy, L / 2 + 0.004); cur.add(pivot);
        const x0 = richting > 0 ? 0 : -breedte;
        const mid = x0 + breedte / 2;
        const ruit = m.deur === 'glas'
          ? { x: 0, y: dh * 0.46, w: breedte * 0.78, h: dh * 0.50 }
          : { x: 0, y: dh * 0.60, w: breedte * 0.56, h: 0.46 };
        const paneel = wall(wallShape(breedte, dh, [ruit]), 0.032, vwoodMat, pivot);
        paneel.position.set(mid, 0, -0.016);
        // glas net binnen het paneel, niet ervoor
        box(breedte * 0 + ruit.w, ruit.h, 0.006, glas, mid + ruit.x, ruit.y + ruit.h / 2, -0.002, pivot);
        if (m.deur !== 'glas') [dh * 0.20, dh * 0.80].forEach(hy => box(breedte * 0.70, 0.03, 0.008, iron, mid, hy, 0.006, pivot));
        const knop = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.045, 12), iron);
        knop.rotation.z = Math.PI / 2;
        knop.position.set(richting > 0 ? breedte - 0.08 : -breedte + 0.08, dh * 0.48, 0.016); pivot.add(knop);
        hinges.push({ obj: pivot, open: -richting * 1.15, closed: 0 });
      }
      // scharnieren aan de buitenranden van de opening, vleugels draaien naar buiten open
      const enkelDeur = deurB < 1.15;    // uit de opgegeven deuropening
      if (enkelDeur) vleugel(deurX - deurB / 2, deurB, 1);
      else { vleugel(deurX - deurB / 2, deurB / 2, 1); vleugel(deurX + deurB / 2, deurB / 2, -1); }
      void m.deur;

      /* ramen in de voorgevel, kozijn met roeden en glas in het vlak */
      const raam = (rx) => {
        const g = new THREE.Group(); g.position.set(rx, fy + raamDorpel, L / 2 - t / 2); cur.add(g);
        const jt = 0.032;
        box(raamB, jt, 0.036, beamMat2, 0, 0, 0, g);
        box(raamB, jt, 0.036, beamMat2, 0, raamH, 0, g);
        [-1, 1].forEach(d => box(jt, raamH, 0.036, beamMat2, d * (raamB / 2 - jt / 2), raamH / 2, 0, g));
        box(raamB - jt * 2, raamH - jt * 2, 0.005, glas, 0, raamH / 2, 0, g);
        box(0.018, raamH - jt * 2, 0.018, beamMat2, 0, raamH / 2, 0.012, g);
        box(raamB - jt * 2, 0.018, 0.018, beamMat2, 0, raamH / 2, 0.012, g);
      };
      gaten.filter(h => h.y > 0.1).forEach(h => raam(h.x));
    });

    /* --- dak ---
       Bij een lessenaarsdak loopt één vlak over de berging en de luifel heen,
       zoals bij Kjeld, Lars en Finn. Bij een zadeldak staat de nok boven de
       berging en krijgt de luifel een eigen, lager afdak. */
    if (nokOverBreedte) {
      // één zadeldak over berging en luifel heen, nok evenwijdig aan de voorgevel
      gedraaid(() => gableRoof(L, Wt, eave, top, roofMaterial(), 0.24));
    } else if (zadel) {
      offset(cx, 0, 0, () => gableRoof(Wk, L, eave, top, roofMaterial(), 0.24));
    } else {
      // hoog aan de voorkant (+z), aflopend naar achteren; overstek 10 tot 20 cm
      leanRoof(Wt, L, eave, eave + rise, roofMaterial(), 0.14);
    }

    /* --- staanders en balk onder de luifel --- */
    if (lu > 0.4) {
      /* De staanders moeten het dak volgen. Bij een lessenaarsdak staat de
         voorste paal hoger dan de achterste, en de draagbalk ligt dus schuin.
         Eén rechte balk op eave-hoogte stak dwars door het dakvlak. */
      const lx = Wt / 2 - 0.10, lz = L / 2 - 0.12;
      const hVoorPaal = (zadel ? eave : hV) - 0.07;
      const hAchterPaal = (zadel ? eave : hA) - 0.07;
      box(0.09, hVoorPaal, 0.09, beamMat, lx, hVoorPaal / 2, lz);
      box(0.09, hAchterPaal, 0.09, beamMat, lx, hAchterPaal / 2, -lz);
      const dz = 2 * lz, dy = hVoorPaal - hAchterPaal;
      const balk = box(0.085, 0.11, Math.hypot(dz, dy), beamMat2, lx,
                       (hVoorPaal + hAchterPaal) / 2 + 0.055, 0);
      balk.rotation.x = -Math.atan2(dy, dz);
    }

    /* --- dakgoot als die is aangevinkt --- */
    if (s.toebehoren && s.toebehoren.goot) {
      const zink = new THREE.MeshStandardMaterial({ color: col('#9BA3A8'), roughness: .4, metalness: .5 });
      if (zadel && !nokOverBreedte) [Wt / 2 + 0.26, -Wt / 2 - 0.26].forEach(x => { const g = box(0.09, 0.09, L + 0.3, zink, x, eave - 0.06, 0); g.castShadow = false; });
      else if (zadel) [L / 2 + 0.26, -L / 2 - 0.26].forEach(z => { const g = box(Wt + 0.3, 0.09, 0.09, zink, 0, eave - 0.06, z); g.castShadow = false; });
      else { const g = box(Wt + 0.3, 0.09, 0.09, zink, 0, eave - 0.02, L / 2 + 0.2); g.castShadow = false; }
    }
  },

  decor() { },

  /* ---- maatlijnen ---- */
  dims(s) {
    const u = uitv(s), Wt = u.W || 3, L = diepte(s), lu = luifelBreedte(s);
    const H = PRODUCT.height(s);
    const cm = v => Math.round(v * 100) + ' cm';
    dimLine(new THREE.Vector3(-Wt / 2, 0.02, L / 2 + 0.7), new THREE.Vector3(Wt / 2, 0.02, L / 2 + 0.7), cm(Wt));
    dimLine(new THREE.Vector3(Wt / 2 + 0.7, 0.02, -L / 2), new THREE.Vector3(Wt / 2 + 0.7, 0.02, L / 2), cm(L));
    dimLine(new THREE.Vector3(-Wt / 2 - 0.6, 0, L / 2), new THREE.Vector3(-Wt / 2 - 0.6, H, L / 2), cm(H));
    if (lu > 0.4) dimLine(new THREE.Vector3(Wt / 2 - lu, 0.02, L / 2 + 0.3), new THREE.Vector3(Wt / 2, 0.02, L / 2 + 0.3), 'luifel ' + cm(lu));
  }
};
