/* =====================================================================
   SEMANU configurator engine
   Domeinneutrale 3D laag: scene, procedurele texturen, materialen,
   bouwstenen voor houtconstructies, camera en maatlijnen.

   De productlaag levert een object CFG met:
     CFG.woodColors()  -> {base, dark}         de actieve houtkleur
     CFG.roof()        -> {kind, color}        'plank' of 'sheet'
     CFG.height()      -> nummer in meter      totale hoogte, voor de camera
     CFG.footprint()   -> {W, L} in meter      grondvlak, voor de camera
   Alles hieronder gebruikt uitsluitend die vier haken.
   ===================================================================== */

/* ---------- Three.js basis ---------- */
const canvas=document.getElementById('c'), stage=document.getElementById('stage');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,logarithmicDepthBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=0.95;
const scene=new THREE.Scene(); scene.fog=new THREE.Fog(0xE3EDE6,9,26);
const camera=new THREE.PerspectiveCamera(38,1,0.1,100);
scene.add(new THREE.HemisphereLight(0xCFE3F5,0x6E8A55,0.85));
const sun=new THREE.DirectionalLight(0xFFF3DE,1.35); sun.position.set(4.5,7,3.5); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); const sc=sun.shadow.camera; sc.left=-5;sc.right=5;sc.top=6;sc.bottom=-5;sc.near=1;sc.far=20; sun.shadow.bias=-0.0006; scene.add(sun);
const fill=new THREE.DirectionalLight(0xDCEBFF,0.35); fill.position.set(-4,3,-4); scene.add(fill);

/* ---------- Texturen (procedureel) ---------- */
function rnd(seed){ let s=seed; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
function woodTexture(base,dark,seed){
  const c=document.createElement('canvas'); c.width=512;c.height=1024; const g=c.getContext('2d'); const r=rnd(seed);
  const plank=128; g.fillStyle=base; g.fillRect(0,0,512,1024);
  for(let p=0;p<8;p++){
    const y=p*plank; const shade=(r()-0.5)*7;
    g.fillStyle=`rgba(${shade>0?255:0},${shade>0?255:0},${shade>0?230:0},${Math.abs(shade)/100})`; g.fillRect(0,y,512,plank);
    for(let i=0;i<26;i++){ g.strokeStyle=dark; g.globalAlpha=0.05+r()*0.12; g.lineWidth=0.6+r()*1.6; g.beginPath();
      const yy=y+6+r()*(plank-12); g.moveTo(0,yy); for(let x=0;x<=512;x+=64){ g.lineTo(x,yy+(r()-0.5)*5); } g.stroke(); }
    if(r()<0.5){ g.globalAlpha=0.35; g.fillStyle=dark; g.beginPath(); g.ellipse(60+r()*400,y+plank/2+(r()-0.5)*40,7+r()*6,4+r()*4,r(),0,Math.PI*2); g.fill(); }
    g.globalAlpha=0.55; g.fillStyle='#000'; g.fillRect(0,y+plank-3,512,3); g.globalAlpha=0.25; g.fillStyle='#fff'; g.fillRect(0,y,512,2);
    g.globalAlpha=1;
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; t.anisotropy=8; t.repeat.set(1/1.5,1/0.96); return t;
}
function roofTexture(color){
  const c=document.createElement('canvas'); c.width=256;c.height=256; const g=c.getContext('2d'); const r=rnd(7);
  g.fillStyle=color; g.fillRect(0,0,256,256);
  for(let i=0;i<9000;i++){ g.fillStyle=r()<0.5?'rgba(255,255,255,.08)':'rgba(0,0,0,.18)'; g.fillRect(r()*256,r()*256,1.5,1.5); }
  for(let y=0;y<256;y+=64){ g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(0,y,256,3); g.fillStyle='rgba(255,255,255,.07)'; g.fillRect(0,y+3,256,2); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; t.repeat.set(3,2.4); return t;
}
function grassTexture(){
  const c=document.createElement('canvas'); c.width=512;c.height=512; const g=c.getContext('2d'); const r=rnd(3);
  g.fillStyle='#7FAE52'; g.fillRect(0,0,512,512);
  for(let i=0;i<24000;i++){ const v=r(); g.fillStyle=v<0.4?'rgba(60,110,40,.35)':v<0.8?'rgba(170,210,110,.28)':'rgba(120,150,60,.3)'; g.fillRect(r()*512,r()*512,2,3+r()*4); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; t.repeat.set(9,9); t.anisotropy=8; return t;
}
function sandTexture(){
  const c=document.createElement('canvas'); c.width=256;c.height=256; const g=c.getContext('2d'); const r=rnd(11);
  g.fillStyle='#E4CFA3'; g.fillRect(0,0,256,256);
  for(let i=0;i<9000;i++){ g.fillStyle=r()<0.5?'rgba(120,90,50,.18)':'rgba(255,245,220,.25)'; g.fillRect(r()*256,r()*256,1.5,1.5); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; t.repeat.set(2,2); return t;
}

/* ---------- Materialen ---------- */
const col=h=>new THREE.Color(h).convertSRGBToLinear();
// Wanden zijn dubbelzijdig: bij een open deur kijk je anders dwars door het gebouw heen.
const woodMat=new THREE.MeshStandardMaterial({roughness:.86,side:THREE.DoubleSide});   // horizontale planken (extrude, uv in meter)
const vwoodMat=new THREE.MeshStandardMaterial({roughness:.86,side:THREE.DoubleSide});  // verticale planken
const plankRoofMat=new THREE.MeshStandardMaterial({roughness:.88,side:THREE.DoubleSide}); // houten dak (box uv 0..1)
const plankRoofMatM=new THREE.MeshStandardMaterial({roughness:.88,side:THREE.DoubleSide}); // houten dak, uv in meter (extrude)
const roofMatM=new THREE.MeshStandardMaterial({roughness:.95,side:THREE.DoubleSide});
const beamMat=new THREE.MeshStandardMaterial({roughness:.82});
const beamMat2=new THREE.MeshStandardMaterial({roughness:.82});
const roofMat=new THREE.MeshStandardMaterial({roughness:.95});
const floorMat=new THREE.MeshStandardMaterial({roughness:.9});
const sandMat=new THREE.MeshStandardMaterial({map:sandTexture(),roughness:1});
/* De actieve houtkleur, ingevuld door de productlaag: {base, dark}. */
function woodColors(){ return (CFG.woodColors && CFG.woodColors()) || {base:'#D2AE76', dark:'#9E7B49'}; }
function applyWood(){
  const w=woodColors();
  [woodMat,vwoodMat,plankRoofMat,floorMat].forEach(m=>{ if(m.map) m.map.dispose(); });
  woodMat.map=woodTexture(w.base,w.dark,42);
  const vt=woodTexture(w.base,w.dark,42); vt.center.set(0.5,0.5); vt.rotation=Math.PI/2; vt.repeat.set(1/1.5,1/0.96); vwoodMat.map=vt;
  const rt=woodTexture(w.base,w.dark,17); rt.center.set(0.5,0.5); rt.rotation=Math.PI/2; rt.repeat.set(1,2); plankRoofMat.map=rt;
  if(plankRoofMatM.map) plankRoofMatM.map.dispose(); const rtm=woodTexture(w.base,w.dark,17); rtm.rotation=Math.PI/2; rtm.repeat.set(1/1.5,1/0.96); plankRoofMatM.map=rtm; plankRoofMatM.needsUpdate=true;
  const ft=woodTexture(w.base,w.dark,9); ft.repeat.set(1/1.2,1/0.96); ft.rotation=Math.PI/2; floorMat.map=ft;
  [woodMat,vwoodMat,plankRoofMat,floorMat].forEach(m=>m.needsUpdate=true);
  beamMat.color.copy(col(w.base)).multiplyScalar(0.8); beamMat2.color.copy(col(w.base)).multiplyScalar(0.62);
}
/* De actieve dakafwerking: {kind:'plank'|'sheet', color}. 'plank' neemt de houtkleur over. */
function roofSpec(){ return (CFG.roof && CFG.roof()) || {kind:'sheet', color:'#2A2A2A'}; }
function applyRoof(){ const r=roofSpec(); if(roofMat.map) roofMat.map.dispose(); roofMat.map=roofTexture(r.color||'#2A2A2A'); roofMat.needsUpdate=true; if(roofMatM.map) roofMatM.map.dispose(); const tm=roofTexture(r.color||'#2A2A2A'); tm.repeat.set(1.2,1.2); roofMatM.map=tm; roofMatM.needsUpdate=true; }
function roofMaterial(){ return roofSpec().kind==='plank'?plankRoofMat:roofMat; }
function roofMaterialM(){ return roofSpec().kind==='plank'?plankRoofMatM:roofMatM; }

/* ---------- Hulpfuncties ---------- */
/* Standaard paaldikte in meter. Overschrijf met CFG.post voor een ander formaat. */
let post=0.088; const UP=new THREE.Vector3(0,1,0);
function setPost(m){ post=m; }
let hinges=[];   // {obj, open, closed} voor deuren en luiken
const model=new THREE.Group(); scene.add(model);
const stat=new THREE.Group(), dyn=new THREE.Group(); model.add(stat); model.add(dyn);
let cur=stat;
/* Voert fn uit met alles wat het tekent in een verplaatste groep.
   Handig als een bouwsteen zelf niet weet dat hij moet opschuiven, bijvoorbeeld
   een dak dat over een overkapping doorloopt. */
function offset(x,y,z,fn){ const g=new THREE.Group(); g.position.set(x,y,z); (cur).add(g); const prev=cur; cur=g; try{ fn(); } finally { cur=prev; } return g; }
function clear(g){ while(g.children.length){ const c=g.children.pop(); c.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); } }
function box(w,h,d,mat,x,y,z,parent){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; (parent||cur).add(m); return m; }
function wallShape(w,h,holes){
  const s=new THREE.Shape(); s.moveTo(-w/2,0); s.lineTo(w/2,0); s.lineTo(w/2,h); s.lineTo(-w/2,h); s.closePath();
  (holes||[]).forEach(o=>{ const p=new THREE.Path(); p.moveTo(o.x-o.w/2,o.y); p.lineTo(o.x+o.w/2,o.y); p.lineTo(o.x+o.w/2,o.y+o.h); p.lineTo(o.x-o.w/2,o.y+o.h); p.closePath(); s.holes.push(p); });
  return s;
}
function wall(shape,thick,mat,parent){ const g=new THREE.ExtrudeGeometry(shape,{depth:thick,bevelEnabled:false}); const m=new THREE.Mesh(g,mat); m.castShadow=true; m.receiveShadow=true; (parent||cur).add(m); return m; }
function gableShape(w,rise){ const s=new THREE.Shape(); s.moveTo(-w/2,0); s.lineTo(w/2,0); s.lineTo(0,rise); s.closePath(); return s; }
// wandpaneel aan een zijde van het grondvlak (lokale +z wijst naar binnen)
function placeSide(obj,side,W,L,y){
  if(side==='end'){ obj.rotation.y=Math.PI; obj.position.set(0,y,L/2); }
  else if(side==='back'){ obj.rotation.y=0; obj.position.set(0,y,-L/2); }
  else if(side==='right'){ obj.rotation.y=-Math.PI/2; obj.position.set(W/2,y,0); }
  else { obj.rotation.y=Math.PI/2; obj.position.set(-W/2,y,0); }
}
function wallSide(side,W,L,y,h,holes,mat){ const len=(side==='end'||side==='back')?W:L; const m=wall(wallShape(len,h,holes),0.022,mat||vwoodMat); placeSide(m,side,W,L,y); return m; }
// balustrade: 'spindles' of 'planks'
function railSeg(x0,z0,x1,z1,fh,style){
  const len=Math.hypot(x1-x0,z1-z0), alongX=Math.abs(x1-x0)>Math.abs(z1-z0), cx=(x0+x1)/2, cz=(z0+z1)/2;
  const rail=(y,t)=>box(alongX?len:t,t,alongX?t:len,beamMat2,cx,y,cz);
  if(style==='planks'){ rail(fh+0.72,0.05); rail(fh+0.06,0.05); for(let i=0;i<4;i++){ const b=box(alongX?len:0.02,0.12,alongX?0.02:len,woodMat,cx,fh+0.16+i*0.15,cz); b.material=alongX?woodMat:woodMat; } return; }
  rail(fh+0.78,0.05); rail(fh+0.10,0.05);
  const n=Math.max(1,Math.round(len/0.11)); for(let i=1;i<n;i++){ const f=i/n; box(0.03,0.66,0.03,beamMat,x0+(x1-x0)*f,fh+0.44,z0+(z1-z0)*f); }
}
function railSide(side,W,L,fh,style,occupied,zRange,off){
  const ex=W/2-post, z0=zRange?zRange[0]:-L/2+post, z1=zRange?zRange[1]:L/2-post;
  let a,b; if(side==='end') a=[-ex,z1],b=[ex,z1]; else if(side==='back') a=[-ex,z0],b=[ex,z0]; else if(side==='right') a=[ex,z0],b=[ex,z1]; else a=[-ex,z0],b=[-ex,z1];
  const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(!occupied){ railSeg(a[0],a[1],b[0],b[1],fh,style); return; }
  if(occupied==='ladder'||occupied==='access') return; // toegangszijde blijft helemaal open
  if(occupied==='slide'){ const alongX=Math.abs(b[0]-a[0])>Math.abs(b[1]-a[1]); box(alongX?len:0.05,0.05,alongX?0.05:len,beamMat2,(a[0]+b[0])/2,fh+0.78,(a[1]+b[1])/2); } // balk boven de glijbaan
  const gap=0.56; if(len-gap<0.3) return; off=off||0; const f1=Math.max(0,Math.min(1,((len-gap)/2+off)/len)), f2=Math.max(0,Math.min(1,((len-gap)/2-off)/len));
  if(f1>0.02) railSeg(a[0],a[1],a[0]+(b[0]-a[0])*f1,a[1]+(b[1]-a[1])*f1,fh,style);
  if(f2>0.02) railSeg(b[0]-(b[0]-a[0])*f2,b[1]-(b[1]-a[1])*f2,b[0],b[1],fh,style);
}
// frame: staanders, schoren, vloerbalken, vloer
function frame(W,L,fh,postTops){
  const px=W/2-post/2, pz=L/2-post/2;
  [[px,-pz],[-px,-pz],[px,pz],[-px,pz]].forEach(([x,z],i)=>{ const h=postTops?postTops[i]:fh-0.05; box(post,h,post,beamMat,x,h/2,z);
    const d=z<0?1:-1; const b=box(0.05,0.05,0.62,beamMat2,x,fh-0.32,z+d*0.26); b.rotation.x=-d*Math.PI/4; });
  const i=0.004; box(0.06,0.12,L-2*i,beamMat2,W/2-0.03-i,fh-0.10,0); box(0.06,0.12,L-2*i,beamMat2,-W/2+0.03+i,fh-0.10,0);
  box(W-0.12-2*i,0.12,0.06,beamMat2,0,fh-0.10,-L/2+0.03+i); box(W-0.12-2*i,0.12,0.06,beamMat2,0,fh-0.10,L/2-0.03-i);
  const fl=box(W,0.028,L,floorMat,0,fh-0.014,0); fl.castShadow=false;
}
function gableRoof(W,L,eaveH,topH,mat,overhang){
  const halfW=W/2, rise=topH-0.04-eaveH, ang=Math.atan2(rise,halfW), roofL=L+2*overhang, E=halfW+overhang, tt=0.035/Math.cos(ang);
  const yu=x=>eaveH+rise*(1-Math.abs(x)/halfW)+0.012; // onderkant dakplaat
  const prof=(lo,hi)=>{ const sh=new THREE.Shape(); sh.moveTo(-E,yu(-E)+lo); sh.lineTo(0,yu(0)+lo); sh.lineTo(E,yu(E)+lo); sh.lineTo(E,yu(E)+hi); sh.lineTo(0,yu(0)+hi); sh.lineTo(-E,yu(-E)+hi); sh.closePath(); return sh; };
  const roof=wall(prof(0,tt),roofL,roofMaterialM()); roof.position.z=-roofL/2; // dakvlakken, in de nok in een punt
  [1,-1].forEach(e=>{ const wv=wall(prof(-0.11,tt-0.002),0.035,beamMat2); wv.position.z=e*(roofL/2-0.02)-0.0175; }); // windveren
  [1,-1].forEach(s=>box(0.03,0.09,roofL-0.08,beamMat2,s*(E+0.016),yu(E)-0.035,0)); // boeiboord, net buiten de dakrand en binnen de windveren
  box(0.06,0.08,roofL-0.1,beamMat2,0,eaveH+rise-0.03,0); // nokbalk, binnen de dakeinden
  return {rise,ang};
}
function leanRoof(W,L,hBack,hFront,mat,overhang){ // helt af naar +z
  const drop=hBack-hFront, ang=Math.atan2(drop,L), len=(L+2*overhang)/Math.cos(ang);
  const r=box(W+2*overhang,0.035,len,mat,0,(hBack+hFront)/2,0); r.rotation.x=ang;
  box(W+2*overhang+0.03,0.08,0.03,beamMat2,0,hFront-drop*overhang/L-0.045,L/2+overhang+0.016); box(W+2*overhang+0.03,0.08,0.03,beamMat2,0,hBack+drop*overhang/L-0.045,-L/2-overhang-0.016);
}
function applyHinges(open){ hinges.forEach(h=>{ h.obj.rotation.y=open?h.open:h.closed; }); }

/* ---------- Grond ---------- */
const ground=new THREE.Mesh(new THREE.CircleGeometry(16,64),new THREE.MeshStandardMaterial({map:grassTexture(),roughness:1})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

/* ---------- Maatlijnen ---------- */
function label(text){ const c=document.createElement('canvas'); const wide=text.length>12; c.width=wide?640:256;c.height=96; const g=c.getContext('2d');
  g.fillStyle='rgba(24,35,28,.92)'; g.beginPath(); g.roundRect ? g.roundRect(8,8,c.width-16,80,18) : g.rect(8,8,c.width-16,80); g.fill();
  g.fillStyle='#fff'; g.font=(wide?'700 36px':'700 44px')+' Arial, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,c.width/2,50);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true})); s.scale.set(0.56,0.21,1); s.renderOrder=5; return s; }

function dimLine(a,b,text,parent){ parent=parent||dyn; const mat=new THREE.LineBasicMaterial({color:0x18231C,depthTest:false,transparent:true,opacity:.9});
  const dir=new THREE.Vector3().subVectors(b,a); const perp=Math.abs(dir.y)>0.5?new THREE.Vector3(0.06,0,0):new THREE.Vector3(0,0.06,0);
  const pts=[a,b, a.clone().sub(perp),a.clone().add(perp), b.clone().sub(perp),b.clone().add(perp)];
  const l=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),mat); l.renderOrder=4; parent.add(l);
  const s=label(text); s.position.copy(a).lerp(b,0.5); if(text.length>12) s.scale.set(1.3,0.21,1); parent.add(s); }

/* ---------- Camera / orbit ---------- */
const cam={theta:0.75,phi:1.18,r:7.2,target:new THREE.Vector3(0,1.35,0)}, goal={theta:0.75,phi:1.18,r:7.2};
function views(){ const H=CFG.height(), F=CFG.footprint(); const r=Math.max(H*2.45,(F.W+F.L)*1.55+3.2); return {'3d':{theta:0.75,phi:1.18,r},front:{theta:0,phi:1.35,r:r*0.92},side:{theta:Math.PI/2,phi:1.35,r},top:{theta:0.001,phi:0.12,r}}; }
let dragging=false,lx=0,ly=0,interacted=false,pinch=0;
function onDown(x,y){dragging=true;lx=x;ly=y;interacted=true;}
function onMove(x,y){ if(!dragging) return; goal.theta-=(x-lx)*0.006; goal.phi=Math.min(1.5,Math.max(0.12,goal.phi-(y-ly)*0.006)); lx=x;ly=y; setView(null); }
canvas.addEventListener('pointerdown',e=>{ if(e.pointerType!=='touch'){ canvas.setPointerCapture(e.pointerId); onDown(e.clientX,e.clientY);} });
canvas.addEventListener('pointermove',e=>{ if(e.pointerType!=='touch') onMove(e.clientX,e.clientY); });
canvas.addEventListener('pointerup',()=>dragging=false); canvas.addEventListener('pointercancel',()=>dragging=false);
canvas.addEventListener('wheel',e=>{ e.preventDefault(); interacted=true; goal.r=Math.min(15,Math.max(3.2,goal.r*(1+e.deltaY*0.0012))); },{passive:false});
canvas.addEventListener('touchstart',e=>{ if(e.touches.length===1) onDown(e.touches[0].clientX,e.touches[0].clientY); else if(e.touches.length===2){ dragging=false; pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);} },{passive:true});
canvas.addEventListener('touchmove',e=>{ e.preventDefault(); if(e.touches.length===1) onMove(e.touches[0].clientX,e.touches[0].clientY); else if(e.touches.length===2){ const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); goal.r=Math.min(15,Math.max(3.2,goal.r*pinch/d)); pinch=d; } },{passive:false});
canvas.addEventListener('touchend',()=>dragging=false);
let curView='3d';
function setView(v){ curView=v; document.querySelectorAll('.views button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v))); if(v){ Object.assign(goal,views()[v]); interacted=true; } }
document.querySelectorAll('.views button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize(){ const w=stage.clientWidth,h=stage.clientHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
addEventListener('resize',resize);
let last=performance.now();
function frameLoop(now){ const dt=Math.min(0.05,(now-last)/1000); last=now;
  if(!interacted && !reduce) goal.theta+=dt*0.08;
  const k=reduce?1:1-Math.pow(0.001,dt);
  cam.theta+=(goal.theta-cam.theta)*k; cam.phi+=(goal.phi-cam.phi)*k; cam.r+=(goal.r-cam.r)*k;
  const ty=CFG.height()*0.46; cam.target.y+=(ty-cam.target.y)*k;
  camera.position.set(cam.target.x+cam.r*Math.sin(cam.phi)*Math.sin(cam.theta), cam.target.y+cam.r*Math.cos(cam.phi), cam.target.z+cam.r*Math.sin(cam.phi)*Math.cos(cam.theta));
  // De mist volgt de camerastand, anders verdwijnt een groot model in de nevel
  // terwijl een klein model er te scherp uit springt.
  scene.fog.near=cam.r*0.78; scene.fog.far=cam.r*2.7;
  camera.lookAt(cam.target); renderer.render(scene,camera); requestAnimationFrame(frameLoop); }

