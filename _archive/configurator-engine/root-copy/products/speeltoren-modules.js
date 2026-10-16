/* =====================================================================
   Voorbeeldbibliotheek: aanbouwmodules van een speeltoren.
   Niet nodig voor een tuinhuis, wel handig als voorbeeld van complexere
   onderdelen op dezelfde engine: ladders, klimwanden met grepen, een
   golvende glijbaan via sweep() en schommelframes.
   Hangt af van: box, slant, col, beamMat, beamMat2, woodMat, floorMat, cur.
   ===================================================================== */

function ladderAt(g,fh){ const run=0.55, ll=Math.hypot(fh,run), la=Math.atan2(run,fh);
  [-0.22,0.22].forEach(s=>{ const st=box(0.045,ll,0.09,beamMat2,run/2,fh/2,s,g); st.rotation.z=la; });
  const n=Math.max(3,Math.round(fh/0.27)); for(let i=1;i<n;i++){ const f=i/n; box(0.035,0.035,0.44,beamMat,run*(1-f),fh*f,0,g); } }
const ropeMat=new THREE.MeshStandardMaterial({color:col('#4A4238'),roughness:.95}), seatMat=new THREE.MeshStandardMaterial({color:col('#2E2E2E'),roughness:.7});
const HOLDS=['#D3232A','#F2C300','#1E5FB4','#5BC236'];
function slant(w,len,d,mat,cx,cy,z,ang,g){ const b=box(w,len,d,mat,cx,cy,z,g); b.rotation.z=ang; return b; }
// klimplank: schuine plank van de grond naar de platformrand (lokale +x = naar buiten)
function plankTo(g,fh,run,width,thick){ const len=Math.hypot(fh,run), ang=Math.atan2(run,fh); slant(thick,len,width,woodMat,run/2,fh/2,0,ang,g); return {len,ang,nx:fh/len,ny:run/len}; }
function holdsOn(g,fh,run,width,n,seed){ const r=rnd(seed), len=Math.hypot(fh,run), nx=fh/len, ny=run/len;
  for(let i=0;i<n;i++){ const t=0.12+r()*0.76, z=(r()-0.5)*(width-0.14); const m=new THREE.MeshStandardMaterial({color:col(HOLDS[i%4]),roughness:.5});
    box(0.06,0.05,0.07,m,run*(1-t)+nx*0.035,fh*t+ny*0.035,z,g); } }
function accessAt(g,fh,type){
  if(type==='ladder'){ ladderAt(g,fh); return; }
  if(type==='klimnet'){ const run=0.5, len=Math.hypot(fh,run), ang=Math.atan2(run,fh);
    [-0.25,0.25].forEach(z=>slant(0.04,len,0.04,beamMat2,run/2,fh/2,z,ang,g));
    [-0.125,0,0.125].forEach(z=>slant(0.018,len,0.018,ropeMat,run/2,fh/2,z,ang,g));
    const n=Math.round(len/0.25); for(let i=1;i<n;i++){ const t=i/n; box(0.018,0.018,0.5,ropeMat,run*(1-t),fh*t,0,g); } return; }
  if(type==='klimwand'){ const L=1.70, run=Math.sqrt(Math.max(0.3,L*L-fh*fh)); plankTo(g,fh,run,0.6,0.04); holdsOn(g,fh,run,0.6,7,5); return; }
  if(type==='klimtouw'){ const L=1.70, run=Math.sqrt(Math.max(0.3,L*L-fh*fh)); const pl=plankTo(g,fh,run,0.5,0.04);
    const n=Math.round(pl.len/0.3); for(let i=1;i<n;i++){ const t=i/n; box(0.05,0.035,0.44,beamMat2,run*(1-t)+pl.nx*0.035,fh*t+pl.ny*0.035,0,g); }
    const rope=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,pl.len,6),ropeMat); rope.position.set(run/2+pl.nx*0.05,fh/2+pl.ny*0.05,0); rope.rotation.z=pl.ang; g.add(rope); return; }
  if(type==='trap'){ const w=0.57, run=fh*0.85, n=Math.max(4,Math.round(fh/0.2)), len=Math.hypot(fh,run), ang=Math.atan2(run,fh);
    [-w/2+0.02,w/2-0.02].forEach(z=>slant(0.16,len,0.04,beamMat2,run/2,fh/2-0.05,z,ang,g));
    for(let i=1;i<=n;i++){ const t=i/n; const st=box(run/n+0.03,0.03,w-0.06,floorMat,run*(1-t)+run/n/2,fh*t,0,g); st.castShadow=false; }
    [-w/2-0.03,w/2+0.03].forEach(z=>{ box(post,1.0,post,beamMat,run+0.03,0.5,z,g); box(post,0.95,post,beamMat,0.0,fh-0.1+0.475,z,g); const rl=Math.hypot(fh+0.78-0.95,run+0.03); slant(0.05,rl,0.05,beamMat2,(run+0.03)/2,(fh+0.78+0.95)/2,z,Math.atan2(run+0.03,fh+0.78-0.95),g); }); return; }
}
function sideAt(g,fh,type){
  if(type==='brug'){ const L=1.5, pw=0.8;
    for(let x=0.1;x<L;x+=0.16){ box(0.12,0.03,0.7,floorMat,x,fh+0.02,0,g); }
    [-0.4,0.4].forEach(z=>{ const r=new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,L,6),ropeMat); r.rotation.z=Math.PI/2; r.position.set(L/2,fh+0.75,z); g.add(r);
      for(let x=0.2;x<L;x+=0.3) box(0.015,0.73,0.015,ropeMat,x,fh+0.385,z,g); });
    const x0=L, x1=L+pw; [[x0+post/2,-pw/2+post/2],[x0+post/2,pw/2-post/2],[x1-post/2,-pw/2+post/2],[x1-post/2,pw/2-post/2]].forEach(([x,z])=>box(post,fh+0.8,post,beamMat,x,(fh+0.8)/2,z,g));
    const d=box(pw,0.03,pw,floorMat,(x0+x1)/2,fh-0.015,0,g); d.castShadow=false; box(pw,0.10,0.06,beamMat2,(x0+x1)/2,fh-0.08,-pw/2+0.03,g); box(pw,0.10,0.06,beamMat2,(x0+x1)/2,fh-0.08,pw/2-0.03,g);
    [[x0,-pw/2,x1,-pw/2],[x0,pw/2,x1,pw/2],[x1,-pw/2,x1,pw/2]].forEach(([a,b,c,e])=>{ const alongX=a!==c; box(alongX?pw:0.05,0.05,alongX?0.05:pw,beamMat2,(a+c)/2,fh+0.78,(b+e)/2,g); box(alongX?pw:0.05,0.05,alongX?0.05:pw,beamMat2,(a+c)/2,fh+0.10,(b+e)/2,g);
      const n=Math.round(pw/0.11); for(let i=1;i<n;i++){ const f=i/n; box(0.03,0.66,0.03,beamMat,a+(c-a)*f,fh+0.44,b+(e-b)*f,g); } });
    return; }
  accessAt(g,fh,type);
}
function nestSwing(g,x,z,beamY){ const ring=new THREE.Mesh(new THREE.TorusGeometry(0.45,0.03,8,32),seatMat); ring.rotation.x=Math.PI/2; ring.position.set(x,0.5,z); g.add(ring);
  [[0,1],[1,0]].forEach(([a,b])=>{ const bar=box(0.9,0.012,0.012,ropeMat,x,0.5,z,g); bar.rotation.y=Math.atan2(b,a); });
  const inner=new THREE.Mesh(new THREE.TorusGeometry(0.22,0.012,6,24),ropeMat); inner.rotation.x=Math.PI/2; inner.position.set(x,0.5,z); g.add(inner);
  [[0.32,0.32],[-0.32,0.32],[0.32,-0.32],[-0.32,-0.32]].forEach(([dx,dz])=>{ const a=new THREE.Vector3(x+dx,0.5,z+dz), b=new THREE.Vector3(x,beamY-0.05,z); const len=a.distanceTo(b); const r=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,len,6),ropeMat); r.position.copy(a).lerp(b,0.5); r.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize()); g.add(r); }); }
function seatSwing(g,x,z,beamY){ [-0.2,0.2].forEach(dz=>{ const r=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,beamY-0.45,6),ropeMat); r.position.set(x,(beamY-0.45)/2+0.45,z+dz); g.add(r); }); box(0.18,0.03,0.5,seatMat,x,0.45,z,g); }
function swingModule(type,zBack,beamY){ const g=new THREE.Group(); cur.add(g); const len=type==='senne'?1.6:type==='swing'?2.4:3.0, zf=zBack-len, zm=zBack-len/2;
  box(0.09,0.09,len+0.1,beamMat2,0,beamY,zm,g);
  if(type!=='challenger'){
    [1,-1].forEach(s=>{ const leg=box(post,Math.hypot(beamY,0.9),post,beamMat,s*0.45,beamY/2,zf,g); leg.rotation.z=s*Math.atan2(0.9,beamY); });
    box(1.0,0.06,0.06,beamMat2,0,beamY*0.55,zf,g);
  } else {
    // Challenger: dubbel A-frame dat dwars op de balk uitwaaiert, klimwand op de linkerzijde (-x)
    const spread=0.9, L=Math.hypot(beamY,spread), a=Math.atan2(spread,beamY), hz=0.35;
    [-1,1].forEach(dx=>[-hz,hz].forEach(z=>{ const leg=box(post,L,post,beamMat,dx*spread/2,beamY/2,zf+z,g); leg.rotation.z=dx*a; }));
    const hm=beamY*0.45, xm=spread*(1-hm/beamY);
    [-1,1].forEach(dx=>box(0.06,0.06,2*hz+post,beamMat2,dx*xm,hm,zf,g)); // dwarsbalken tussen voor- en achterpoot
    [-hz,hz].forEach(z=>box(2*xm,0.06,0.06,beamMat2,0,hm,zf+z,g)); // liggers tussen linker- en rechterpoot
    box(0.08,0.08,2*hz+0.2,beamMat2,0,beamY-0.05,zf,g); // kopbalk onder de nok
    // klimwand over de onderste 62% van de poot (zoals op de foto's), met een dwarsbalk aan de bovenrand
    const H=beamY-0.12, ln=Math.hypot(H,spread), nx=-H/ln, ny=spread/ln, off=post/2+0.02, f=0.62;
    const pl=box(0.04,ln*f,2*hz-post,woodMat,-spread*(1-f/2)+nx*off,H*f/2+ny*off,zf,g); pl.rotation.z=-Math.atan2(spread,H);
    box(0.06,0.06,2*hz+post,beamMat2,-spread*(1-f)+nx*0.02,H*f+ny*0.02,zf,g);
    const r=rnd(21); for(let i=0;i<8;i++){ const t=0.06+r()*(f-0.12), z=(r()-0.5)*(2*hz-0.2); box(0.06,0.05,0.07,new THREE.MeshStandardMaterial({color:col(HOLDS[i%4]),roughness:.5}),-spread*(1-t)+nx*(off+0.045),H*t+ny*(off+0.045),zf+z,g); }
  }
  if(type==='senne'){ seatSwing(g,0,zm,beamY); }
  else if(type==='swing'){ seatSwing(g,0,zm+0.55,beamY); nestSwing(g,0,zm-0.55,beamY); }
  else { seatSwing(g,0,zm+0.7,beamY); nestSwing(g,0,zm-0.5,beamY); }
}
function slideAt(g,fh,slide){
  // golfglijbaan: rechte helling met twee zachte golven, hoge zijranden, vlakke uitloop. Padlengte = productlengte (265 of 300 cm).
  const drop=fh+0.02, N=90, target=slideLen()/100;
  const path=R=>{ const c=new THREE.CatmullRomCurve3([new THREE.Vector3(-0.12,drop,0),new THREE.Vector3(0.14,drop-0.03,0),new THREE.Vector3(R*0.5,0.12+(drop-0.12)*0.5,0),new THREE.Vector3(R,0.13,0),new THREE.Vector3(R+0.22,0.09,0),new THREE.Vector3(R+0.40,0.13,0)]);
    const pts=c.getPoints(N); pts.forEach((p,i)=>{ const s=i/N; const x0=(p.x+0.12)/(R+0.12); if(x0>0&&x0<1) p.y+=0.065*Math.sin(2*Math.PI*2*x0)*Math.sin(Math.PI*x0); }); return pts; };
  const arc=pts=>{ let l=0; for(let i=1;i<pts.length;i++) l+=pts[i].distanceTo(pts[i-1]); return l; };
  let R=Math.sqrt(Math.max(0.5,target*target-drop*drop)); let pts=path(R);
  for(let k=0;k<5;k++){ R=Math.max(0.6,R+(target-arc(pts))*0.9); pts=path(R); }
  const prof=[[-0.25,0.21],[-0.25,0.07],[-0.19,0],[0.19,0],[0.25,0.07],[0.25,0.21],[0.22,0.21],[0.22,0.08],[0.17,0.025],[-0.17,0.025],[-0.22,0.08],[-0.22,0.21]];
  const mesh=new THREE.Mesh(sweep(prof,pts),new THREE.MeshStandardMaterial({color:col(slide.color),roughness:.35,side:THREE.DoubleSide})); mesh.castShadow=true; mesh.receiveShadow=true; g.add(mesh);
  if(state.dims) dimLine(new THREE.Vector3(0,0.02,0.5),new THREE.Vector3(R+0.40,0.02,0.5),slideLen()+' cm',g);
}
function sweep(prof,pts){
  const n=pts.length, m=prof.length, pos=[], idx=[];
  for(let i=0;i<n;i++){ const p=pts[i]; const t=new THREE.Vector3().subVectors(pts[Math.min(i+1,n-1)],pts[Math.max(i-1,0)]).normalize();
    const side=new THREE.Vector3().crossVectors(t,UP).normalize(); const up=new THREE.Vector3().crossVectors(side,t).normalize();
    for(const [s,u] of prof) pos.push(p.x+side.x*s+up.x*u, p.y+side.y*s+up.y*u, p.z+side.z*s+up.z*u); }
  for(let i=0;i<n-1;i++) for(let j=0;j<m;j++){ const a=i*m+j,b=i*m+(j+1)%m,c=(i+1)*m+j,d=(i+1)*m+(j+1)%m; idx.push(a,b,c, b,d,c); }
  const tri=THREE.ShapeUtils.triangulateShape(prof.map(p=>new THREE.Vector2(p[0],p[1])),[]);
  tri.forEach(t=>{ idx.push(t[0],t[2],t[1]); const o=(n-1)*m; idx.push(o+t[0],o+t[1],o+t[2]); });
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function sandbox(W,L,zc){ const w=1.80, l=1.80; // zandbak 180 x 180 cm
  box(w,0.16,0.06,beamMat2,0,0.08,zc-l/2); box(w,0.16,0.06,beamMat2,0,0.08,zc+l/2); box(0.06,0.16,l,beamMat2,-w/2,0.08,zc); box(0.06,0.16,l,beamMat2,w/2,0.08,zc);
  const sand=box(w-0.06,0.1,l-0.06,sandMat,0,0.06,zc); sand.castShadow=false;
  if(state.dims){ dimLine(new THREE.Vector3(-w/2,0.2,zc+l/2+0.12),new THREE.Vector3(w/2,0.2,zc+l/2+0.12),'180 cm'); dimLine(new THREE.Vector3(-w/2-0.12,0.2,zc-l/2),new THREE.Vector3(-w/2-0.12,0.2,zc+l/2),'180 cm'); } }
function swing(zBack,beamY){ const len=2.2, zf=zBack-len;
  box(0.09,0.09,len+0.1,beamMat2,0,beamY,zBack-len/2);
  [1,-1].forEach(s=>{ const leg=box(post,Math.hypot(beamY,0.9),post,beamMat,s*0.45,beamY/2,zf); leg.rotation.z=s*Math.atan2(0.9,beamY); });
  const ropeMat=new THREE.MeshStandardMaterial({color:col('#3B3B3B'),roughness:.9}), seatMat=new THREE.MeshStandardMaterial({color:col('#2E2E2E'),roughness:.7});
  [-0.5,0.5].forEach(x=>{ [-0.2,0.2].forEach(dx=>{ const r=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,beamY-0.45,6),ropeMat); r.position.set(x+dx,(beamY-0.45)/2+0.45,zBack-len/2); cur.add(r); }); box(0.5,0.03,0.18,seatMat,x,0.45,zBack-len/2); });
}
function attach(pos,W,zc,zEnd,off){ const g=new THREE.Group(); off=off||0;
  if(pos==='right'){ g.position.set(W/2,0,zc+off); } else if(pos==='left'){ g.position.set(-W/2,0,zc+off); g.rotation.y=Math.PI; } else { g.position.set(off,0,zEnd); g.rotation.y=-Math.PI/2; }
  cur.add(g); return g; }
