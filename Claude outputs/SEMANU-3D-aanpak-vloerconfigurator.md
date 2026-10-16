# Brief: de 3D en textuuraanpak uit de SEMANU configurator engine, toegepast op vloeren

Plak dit in het gesprek over de vloerconfigurator. Het beschrijft precies hoe de
tuinhuisconfigurator van CEVO er visueel uitziet zoals hij eruitziet, met de
werkende code erbij, en het vertaalt die aanpak naar vloeren, tegels en klinkers.

---

## 1. Het uitgangspunt: geen enkel beeldbestand

Alle texturen worden bij het laden getekend op een `<canvas>` en als
`THREE.CanvasTexture` in de scene gezet. Er wordt dus geen enkele jpg, png of
KTX gedownload. Dat is geen kunstje maar de reden waarom de hele configurator
één bestand van 185 kB blijft, waarom hij offline werkt en waarom een klant een
kleur kan kiezen die niet vooraf gefotografeerd is.

Concreet betekent dat drie regels die je overal aanhoudt.

Een textuur is een functie van haar parameters. `houtTextuur(basis, donker, seed)`
geeft altijd hetzelfde beeld terug voor dezelfde invoer. Nooit `Math.random()`
gebruiken, wel een eigen generator met een zaadje, anders ziet de vloer er bij
elke render anders uit en flikkert hij bij het wisselen van kleur.

```js
function rnd(seed){ let s=seed; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
```

Een textuur wordt weggegooid voor je een nieuwe zet. Bij elke kleurwissel:
`if(mat.map) mat.map.dispose();` daarna de nieuwe toewijzen en
`mat.needsUpdate=true`. Zonder dispose loopt het videogeheugen vol na twintig
keer klikken, en dat merk je pas op een telefoon.

Een textuur draagt altijd haar kleurruimte. Een canvas met kleuren is beeldmateriaal,
geen data, dus `t.encoding = THREE.sRGBEncoding` (three r128) of
`t.colorSpace = THREE.SRGBColorSpace` (r152 en later). Vergeet je dat, dan zijn
al je bruinen te donker en te vuil en ga je dat compenseren met licht, wat het
alleen erger maakt.

---

## 2. De renderer en het licht, exact zoals ze staan

Dit is de helft van het resultaat. Deze instellingen zijn uitgeprobeerd, niet
overgenomen uit een voorbeeld.

```js
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, logarithmicDepthBuffer:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));      // nooit 3, dat kost vier keer zoveel voor niets
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;               // r152+: renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
```

`alpha:true` is belangrijk: de canvas is doorzichtig en de achtergrond is een
gewoon CSS verloop op het element eronder. Zo kan de merkkleur van de klant de
achtergrond bepalen zonder dat je aan de 3D code raakt, en kost de achtergrond
nul rekenwerk.

ACES tonemapping met exposure net onder 1 is wat de beelden dat rustige,
fotografische geeft in plaats van het harde, uitgebeten look van standaard WebGL.

Het lichtplan bestaat uit drie lampen, meer niet.

```js
scene.add(new THREE.HemisphereLight(0xCFE3F5, 0xEDEDEA, 0.85));   // hemel boven, vloerkleur onder
const sun = new THREE.DirectionalLight(0xFFF3DE, 1.35);            // warm, want de hemel is koel
sun.position.set(4.5, 7, 3.5); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera; sc.left=-5; sc.right=5; sc.top=6; sc.bottom=-5; sc.near=1; sc.far=20;
sun.shadow.bias = -0.0006;                                          // tegen de streepjes in de schaduw
scene.add(sun);
const fill = new THREE.DirectionalLight(0xDCEBFF, 0.35);            // koele invulling van achter
fill.position.set(-4, 3, -4); scene.add(fill);
```

Twee dingen die vaak fout gaan. De tweede kleur van de HemisphereLight is het
licht dat van de vloer terugkaatst. Zet je die op groen omdat er gras ligt, dan
kleurt alles groen af en klopt geen enkele kleurkeuze meer. Bij CEVO was dat
precies het probleem en de oplossing was de vloer neutraal maken. Bij een
vloerconfigurator moet die kleur juist wel meebewegen met de gekozen vloer,
want daar is de vloer het product.

De schaduwcamera moet strak om het model staan. Hoe groter je `left/right/top/bottom`,
hoe waziger je schaduw bij dezelfde mapSize. Vijf meter rondom is genoeg voor een
tuinhuis, voor een kamervloer van 4 bij 5 meter kan het krapper.

---

## 3. Het recept van een textuur

Elke textuur volgt hetzelfde patroon. Grondkleur, dan structuur, dan de naden,
dan de randbelichting. Dit is de houttextuur uit de tuinhuisconfigurator,
integraal, want daar bouw je de parketvloer op.

```js
function houtTextuur(basis, donker, seed){
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024;
  const g = c.getContext('2d'); const r = rnd(seed);
  const plank = 128;                       // acht planken in 1024 pixels
  g.fillStyle = basis; g.fillRect(0,0,512,1024);

  for (let p = 0; p < 8; p++){
    const y = p * plank;

    // 1. elke plank een eigen tint, dit is wat een vloer echt doet leven
    const shade = (r()-0.5) * 7;
    g.fillStyle = `rgba(${shade>0?255:0},${shade>0?255:0},${shade>0?230:0},${Math.abs(shade)/100})`;
    g.fillRect(0, y, 512, plank);

    // 2. nerf: zesentwintig lijnen die per 64 pixels licht afwijken
    for (let i = 0; i < 26; i++){
      g.strokeStyle = donker; g.globalAlpha = 0.05 + r()*0.12; g.lineWidth = 0.6 + r()*1.6;
      g.beginPath();
      const yy = y + 6 + r()*(plank-12);
      g.moveTo(0, yy);
      for (let x = 0; x <= 512; x += 64) g.lineTo(x, yy + (r()-0.5)*5);
      g.stroke();
    }

    // 3. bij de helft van de planken een kwast
    if (r() < 0.5){
      g.globalAlpha = 0.35; g.fillStyle = donker; g.beginPath();
      g.ellipse(60+r()*400, y+plank/2+(r()-0.5)*40, 7+r()*6, 4+r()*4, r(), 0, Math.PI*2);
      g.fill();
    }

    // 4. de naad: donker onderaan, een lichte lijn bovenaan. Dit doet het werk.
    g.globalAlpha = 0.55; g.fillStyle = '#000'; g.fillRect(0, y+plank-3, 512, 3);
    g.globalAlpha = 0.25; g.fillStyle = '#fff'; g.fillRect(0, y, 512, 2);
    g.globalAlpha = 1;
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 8;                        // zonder dit wordt een vloer in perspectief pap
  return t;
}
```

Stap 4 is de belangrijkste en de goedkoopste. Een donkere lijn van drie pixels
met een lichte lijn van twee erboven leest het oog als een naad met diepte, en
dat werkt beter dan een echte normal map die je bij elke kleurwissel opnieuw
zou moeten berekenen.

`anisotropy: 8` is niet optioneel bij vloeren. Een vloer zie je bijna altijd
onder een scherpe hoek en zonder anisotropie wordt alles voorbij twee meter een
grijze brij.

---

## 4. Schaal: de enige regel die bij vloeren echt telt

Bij een tuinhuis mag een plank een halve centimeter schelen. Bij een vloer niet.
Een klant die een tegel van 60 bij 60 kiest en er een van 80 ziet liggen, gelooft
de rest ook niet meer.

Los dat op door `repeat` altijd in meters te rekenen, nooit met een getal dat je
mooi vindt. De textuur beslaat een fysiek oppervlak, en dat oppervlak zet je in
de repeat.

```js
// De houttextuur hierboven beeldt 1,5 m breed bij 0,96 m hoog af (8 planken van 12 cm).
const TEX_B = 1.5, TEX_H = 0.96;
t.repeat.set(1/TEX_B, 1/TEX_H);           // voor een vlak met UV 0..1 van 1 bij 1 meter

// Voor een kamervlak van W bij L meter:
t.repeat.set(W/TEX_B, L/TEX_H);
```

Voor tegels wordt dat nog directer. Teken één tegel of één blok tegels op de
canvas, noteer hoeveel meter dat is, en laat de repeat de rest doen.

```js
// canvas van 512 px stelt 4 tegels van 60 cm voor, dus 2,4 m
const BLOK = 2.4;
t.repeat.set(W/BLOK, L/BLOK);
```

Draaien doe je rond het midden, anders schuift het patroon weg:

```js
t.center.set(0.5, 0.5);
t.rotation = Math.PI/2;                   // planken in de andere richting
```

---

## 5. Vier recepten voor de vloerconfigurator

### Parket, halfsteens of wild verband

Neem `houtTextuur` hierboven en verschuif elke plankenrij horizontaal voor je
haar tekent, zodat de kopse naden niet boven elkaar liggen.

```js
const versprong = p * 0.5;                 // halfsteens: elke rij een halve plank op
g.save(); g.translate(versprong*512, 0);
// ... teken de plank hier, twee keer, ook op x-512, zodat hij naadloos doorloopt
g.restore();
```

Voeg een kopse naad toe binnen de rij: een verticale donkere lijn van twee pixels
op de plaats waar de plank eindigt. Zonder kopse naden ziet parket eruit als
lamellen.

### Keramische tegel met houtlook

Dit is de tegel die je noemde, en het is bewust dezelfde functie met andere
afwerking. Een houtlooktegel is namelijk precies dat: een houtnerf onder een glad,
glanzend oppervlak met een echte voeg errond.

```js
function houtlookTegel(basis, donker, seed, voegKleur='#CFCAC2', voegPx=4){
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024;
  const g = c.getContext('2d');
  // 1. exact dezelfde nerf als hierboven, maar met vlakkere, koelere tinten
  //    (keramiek print is altijd iets minder verzadigd dan echt hout)
  tekenHoutnerf(g, basis, donker, seed);
  // 2. daarna de voeg eroverheen, strak en gelijkmatig, geen schaduw
  g.fillStyle = voegKleur;
  for (let p = 0; p <= 8; p++) g.fillRect(0, p*128 - voegPx/2, 512, voegPx);
  g.fillRect(0, 0, voegPx, 1024);          // en de lange zijde
  const t = new THREE.CanvasTexture(c); /* wrap, encoding, anisotropy */ return t;
}
```

Het verschil tussen hout en keramiek zit in het materiaal, niet in de textuur:

```js
const hout    = new THREE.MeshStandardMaterial({ map:t, roughness:0.86 });
const keramiek = new THREE.MeshStandardMaterial({ map:t, roughness:0.35, metalness:0.02 });
const gepolijst = new THREE.MeshStandardMaterial({ map:t, roughness:0.12, metalness:0.04 });
```

Alleen dat getal al laat de klant het verschil zien tussen mat, zijdeglans en
gepolijst, zonder één extra textuur. Bij `roughness` onder 0,3 heb je wel iets
nodig om in te weerspiegelen, anders blijft het dof: zet een
`THREE.RoomEnvironment` of een simpele gradient als `scene.environment`.

### Klinkers en betonstraatstenen

```js
function klinkerTextuur(basis, donker, seed, rijen=6, perRij=4){
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d'); const r = rnd(seed);
  g.fillStyle = '#9A958C'; g.fillRect(0,0,512,512);     // de voeg is de achtergrond
  const h = 512/rijen, b = 512/perRij;
  for (let ry = 0; ry < rijen; ry++){
    const off = (ry % 2) * b/2;                          // halfsteens verband
    for (let k = -1; k <= perRij; k++){
      // elke steen een eigen tint: dit is wat een klinkerverharding echt kenmerkt
      const m = 0.88 + r()*0.24;
      g.fillStyle = meng(basis, m);
      g.fillRect(k*b + off + 2, ry*h + 2, b-4, h-4);
      // korrel in de steen
      for (let i=0;i<220;i++){ g.fillStyle = r()<0.5?'rgba(0,0,0,.10)':'rgba(255,255,255,.09)';
        g.fillRect(k*b+off+2+r()*(b-4), ry*h+2+r()*(h-4), 2, 2); }
      // afgeschuinde rand, licht boven en links, donker onder en rechts
      g.fillStyle='rgba(255,255,255,.16)'; g.fillRect(k*b+off+2, ry*h+2, b-4, 2);
      g.fillStyle='rgba(0,0,0,.20)';       g.fillRect(k*b+off+2, ry*h+h-4, b-4, 2);
    }
  }
  const t = new THREE.CanvasTexture(c); /* wrap, encoding, anisotropy 8 */ return t;
}
```

De tintvariatie per steen (`m = 0.88 + r()*0.24`) is bij klinkers belangrijker
dan bij hout. Een klinkerverharding waarvan alle stenen dezelfde kleur hebben
ziet er meteen uit als computerbeeld.

### Grote tegel, natuursteen of beton

Zelfde opbouw als de klinker maar met `rijen=2, perRij=2` en zonder verspringing,
met een veel fijnere korrel en een paar lichte wolken:

```js
for (let i = 0; i < 60; i++){
  const x=r()*512, y=r()*512, rad=40+r()*120;
  const grad = g.createRadialGradient(x,y,0,x,y,rad);
  grad.addColorStop(0, r()<0.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.04)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(x-rad,y-rad,rad*2,rad*2);
}
```

Voor natuursteen met adering: teken drie tot vijf krommen met
`quadraticCurveTo`, doorzichtigheid rond 0,10, breedte 1 tot 3 pixels, en
zorg dat ze de rand van de canvas oversteken zodat ze bij het herhalen doorlopen.

---

## 6. Naadloos herhalen: de valkuil

Alles wat je tekent moet aan de linkerrand verdergaan waar het aan de rechterrand
stopt. Twee gewoontes lossen dat op.

Teken alles wat over een rand loopt twee keer, één keer op `x` en één keer op
`x - breedte` (en hetzelfde voor `y`). Dat geldt voor nerven, aderingen,
verspringende stenen en wolken.

Zet nooit een schaduw of een verloop dat alleen aan één kant donkerder wordt,
want dan zie je bij het herhalen een streep om de zoveel meter. Belichting hoort
in het licht, niet in de textuur.

Test het door de repeat tijdelijk op 20 bij 20 te zetten en van bovenaf te kijken.
Elke naad die je dan ziet, ziet de klant later ook.

---

## 7. Camera en mist

De camera draait op bolcoördinaten rond een doelpunt en beweegt met demping naar
haar doel, wat een pak rustiger aanvoelt dan direct volgen.

```js
const k = 1 - Math.pow(0.001, dt);          // framerate-onafhankelijke demping
cam.theta += (goal.theta - cam.theta) * k;
```

Zolang de bezoeker nog niets aangeraakt heeft draait de camera traag vanzelf
(`goal.theta += dt*0.08`), zodat meteen duidelijk is dat het model 3D is. Zodra
hij sleept, stopt dat voorgoed. En alles wordt uitgeschakeld bij
`prefers-reduced-motion`.

De mist volgt de camera-afstand in plaats van vast te staan:

```js
scene.fog.near = cam.r * 0.78;
scene.fog.far  = cam.r * 2.7;
```

Zonder dat verdwijnt een grote vloer in de nevel terwijl een kleine er te scherp
uit springt. Bij een vloer in een kamer is dit extra nuttig: het laat de vloer
naar achter toe wegvloeien in plaats van abrupt af te snijden.

---

## 8. De achtergrond via merkvariabelen

De achtergrond zit niet in de 3D code maar in CSS, zodat elke klant zijn eigen
omgeving krijgt zonder dat je de engine aanraakt.

```css
.stage { background: linear-gradient(180deg, var(--sky1) 0%, var(--sky2) 55%, var(--sky3) 100%); }
```

```js
const merkVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const GROND = merkVar('--grond'), MIST = merkVar('--mist') || '#E3EDE6';
scene.fog = new THREE.Fog(new THREE.Color(MIST).getHex(), 9, 26);
```

Bij CEVO staat dat nu op wit (`--grond:#FFFFFF`), wat de packshotlook geeft die
aansluit op de productfoto's van de webshop. Voor een vloerconfigurator is een
zacht warm grijs meestal beter, want een vloer heeft een muur nodig om tegen af
te zetten.

---

## 9. Wat je bij vloeren anders moet doen dan bij een tuinhuis

Bij een tuinhuis is het model het product en de vloer decor. Bij een vloer is dat
omgekeerd, en dat verandert vier dingen.

De vloer moet het licht domineren. Zet de tweede kleur van de HemisphereLight op
de gemiddelde kleur van de gekozen vloer, niet op een neutrale tint. Een eiken
vloer hoort de kamer warm te maken.

Geef de kamer wanden en een plint. Een vlak dat in het niets doorloopt geeft geen
gevoel voor maat. Drie wanden, een plint van 8 cm en een lichtinval van één zijde
doen meer voor de geloofwaardigheid dan welke textuurdetail ook.

Zet er iets in met een bekende maat. Een deuropening van 2,10 m, een stoel of
gewoon een maatlijn. De klant beoordeelt een vloer op hoe groot de planken lijken
en dat kan alleen ten opzichte van iets dat hij kent.

Laat de legrichting kiezen. Bij vloeren is dat een echte keuze en met
`t.rotation` en `t.center` kost het je twee regels, terwijl het de klant het
gevoel geeft dat hij zijn eigen vloer ziet.

---

## 10. Prestatiegrenzen die je aanhoudt

Canvas van 512 bij 512 of 512 bij 1024, niet groter. Alles daarboven kost geheugen
zonder dat je het ziet.

Een textuur nooit per frame opnieuw tekenen, alleen bij een keuzewissel, en de
oude altijd disposen.

`Math.min(devicePixelRatio, 2)`, nooit hoger.

Eén schaduwwerpende lamp. Elke tweede verdubbelt de kost van de schaduwen.

Materialen delen tussen alle vlakken die dezelfde afwerking hebben, in plaats van
één materiaal per vlak. In de tuinhuisconfigurator zijn er zeven materialen voor
het hele model.

---

## Wat ik zou vragen aan wie hierop verderbouwt

Bouw de vloerconfigurator op precies deze basis, met deze renderer-instellingen,
dit lichtplan, procedurele canvastexturen met een gezaaide generator, en repeat
altijd berekend in meters. Neem de houttextuur letterlijk over voor parket en
voor houtlooktegels, met als enige verschil de voeg en de roughness. Maak van de
legrichting, de plankmaat en de voegkleur echte keuzes in de interface, want dat
is bij vloeren het equivalent van de kleurkeuze bij het tuinhuis.
