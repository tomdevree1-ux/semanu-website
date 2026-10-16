# -*- coding: utf-8 -*-
"""
amai! Website Quickscan engine (Swiss-German PDF) — Marine + Mint palette.

Repaletted from the original red/gold engine to the current amai brand (navy + mint,
per QUICKSCAN_PLAYBOOK.md section 10). Structure, labels and the `site` dict contract are
unchanged. It renders the radar + impact/effort matrix and the branded 12-section PDF with
weasyprint. The caller writes the content (Swiss-German, house rules); call build(site, dest_dir).

site dict keys: see QUICKSCAN_PLAYBOOK.md section 6.
"""
import base64, os
import numpy as np
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from weasyprint import HTML

# ── Marine + Mint palette (amai globals.css) ───────────────────────────────────────────
NAVY="#1B2A4A"; NAVYDEEP="#152138"; MINT="#93E6BE"; INK="#07221F"; INKSOFT="#2C4641"
PAPER="#EEF1F6"; PAPER2="#E2E8F2"; HEROWASH="#E8F5EF"; SOFTNAVY="#6F86AD"
OK="#1F8A4C"; DANGER="#D1453B"
RCATS=["Erster Eindruck","Positionierung","Conversion","UX / Struktur","Visuelles Design","SEO / Inhalt","Vertrauen / Beleg","Mobile Erfahrung"]
QUADS=["QUICK WINS","STRATEGISCHE OPTIMIERUNGEN / REDESIGN","NICE TO HAVE","SPÄTER"]
AXIS=["Geringer Aufwand","Hoher Aufwand","Geringe Wirkung","Hohe Wirkung","Aufwand  →","Wirkung  →"]
H=["Executive Summary","Website Scorecard","Gesamteindruck","Was bereits gut funktioniert","Analyse pro Ebene","Wichtigste Verbesserungschancen","Wirkung und Aufwand","Conversion Einschätzung","SEO und Content Chancen","Vertrauen und Professionalität","Empfohlene Roadmap","Kommerzielles Fazit"]
CATS_TBL=["Erster Eindruck","Positionierung","Conversion","UX und Struktur","Visuelles Design","SEO und Inhalt","Vertrauen und Beleg","Mobile Erfahrung"]
LAB={"ind":"indikativ","obs":"Beobachtung","imp":"Kommerzielle Wirkung","rec":"Empfehlung","why":"Warum kommerziell wichtig","impact":"Wirkung","effort":"Aufwand","concl":"Wichtigste Schlussfolgerung"}
EFF={"Gering":2.0,"Mittel":5.5,"Hoch":9.0}; IMP={"Gering":2.5,"Mittel":5.5,"Hoch":8.5}

def _band(s):
    # Score colour bands (playbook section 4): weak=danger, under par=soft navy, good=mint, top=green.
    if s<=3: return (DANGER,"#ffffff")
    if s<=5: return (SOFTNAVY,"#ffffff")
    if s<=7: return (MINT, INK)
    return (OK,"#ffffff")
def _chip(s):
    bg,fg=_band(s); return f'<span class="chip" style="background:{bg};color:{fg}">{s}/10</span>'
def _bar(s):
    bg,_=_band(s); return f'<div class="bar"><div class="fill" style="width:{s*10}%;background:{bg}"></div></div>'

def _viz(slug, scores, firma, matrix_items, tmp):
    plt.rcParams.update({"font.family":"DejaVu Sans","text.color":INK})
    N=len(RCATS); ang=np.linspace(0,2*np.pi,N,endpoint=False).tolist()
    v=scores+scores[:1]; a=ang+ang[:1]
    fig=plt.figure(figsize=(6.6,6.6)); ax=plt.subplot(111,polar=True)
    ax.set_theta_offset(np.pi/2); ax.set_theta_direction(-1); ax.set_ylim(0,10)
    ax.set_yticks([2,4,6,8,10]); ax.set_yticklabels(["2","4","6","8","10"],color=INKSOFT,fontsize=9)
    ax.set_xticks(ang); ax.set_xticklabels([]); ax.grid(color=INK,alpha=0.15)
    ax.spines["polar"].set_color(INK); ax.spines["polar"].set_alpha(0.2)
    ax.plot(a,v,color=NAVY,linewidth=2.2); ax.fill(a,v,color=MINT,alpha=0.35)
    for ai,val in zip(ang,scores):
        ax.plot(ai,val,"o",color=NAVY,markersize=6,markeredgecolor="white",markeredgewidth=1)
        ax.text(ai,val+0.7,str(val),ha="center",va="center",fontsize=11,fontweight="bold",color=INK)
    for ai,lab in zip(ang,RCATS):
        ha="center"
        if np.cos(np.pi/2-ai)>0.3: ha="left"
        elif np.cos(np.pi/2-ai)<-0.3: ha="right"
        ax.text(ai,11.0,lab,ha=ha,va="center",fontsize=10.5,color=INK,fontweight="bold")
    plt.subplots_adjust(top=0.80,bottom=0.08,left=0.10,right=0.90)
    avg=sum(scores)/len(scores)
    fig.text(0.5,0.975,f"Website Scorecard  ·  {firma}",ha="center",fontsize=12.5,fontweight="bold",color=INK)
    fig.text(0.5,0.935,f"Durchschnittliche indikative Bewertung: {avg:.1f} / 10",ha="center",fontsize=10.5,color=INKSOFT)
    rp=os.path.join(tmp,f"qse_radar_{slug}.png"); plt.savefig(rp,dpi=170,transparent=True,bbox_inches="tight"); plt.close()
    fig,ax=plt.subplots(figsize=(8.4,6.4))
    ax.add_patch(Rectangle((0,5),5,5,color=MINT,alpha=0.20)); ax.add_patch(Rectangle((5,5),5,5,color=SOFTNAVY,alpha=0.12))
    ax.add_patch(Rectangle((0,0),5,5,color=INK,alpha=0.05)); ax.add_patch(Rectangle((5,0),5,5,color=INK,alpha=0.03))
    ax.axhline(5,color=INK,alpha=0.25,lw=1); ax.axvline(5,color=INK,alpha=0.25,lw=1)
    ax.text(2.5,9.6,QUADS[0],ha="center",fontsize=11,fontweight="bold",color=OK)
    ax.text(7.5,9.6,QUADS[1],ha="center",fontsize=10,fontweight="bold",color=NAVY)
    ax.text(2.5,0.3,QUADS[2],ha="center",fontsize=10,fontweight="bold",color=INKSOFT)
    ax.text(7.5,0.3,QUADS[3],ha="center",fontsize=10,fontweight="bold",color=INKSOFT)
    seen={}
    for i,(lab,imp,eff) in enumerate(matrix_items,1):
        x=EFF[eff]; y=IMP[imp]; k=(round(x),round(y)); n=seen.get(k,0); seen[k]=n+1
        x+=(n%3-1)*0.85; y+=((n//3)-0.5)*0.9
        ax.scatter(x,y,s=430,color=NAVY,edgecolors="#ffffff",linewidths=1.4,zorder=3)
        ax.text(x,y,str(i),ha="center",va="center",color="white",fontsize=12,fontweight="bold",zorder=4)
    ax.set_xlim(0,10); ax.set_ylim(0,10)
    ax.set_xticks([1.5,7.5]); ax.set_xticklabels([AXIS[0],AXIS[1]],fontsize=10,color=INK)
    ax.set_yticks([1.5,8.5]); ax.set_yticklabels([AXIS[2],AXIS[3]],rotation=90,va="center",fontsize=10,color=INK)
    ax.set_xlabel(AXIS[4],fontsize=10.5,color=INKSOFT); ax.set_ylabel(AXIS[5],fontsize=10.5,color=INKSOFT)
    for sp in ["top","right"]: ax.spines[sp].set_visible(False)
    ax.spines["left"].set_alpha(0.3); ax.spines["bottom"].set_alpha(0.3)
    plt.subplots_adjust(top=0.93,bottom=0.30,left=0.09,right=0.97)
    fig.text(0.09,0.20,"\n".join(f"{i}.  {lab}" for i,(lab,_,_) in enumerate(matrix_items,1)),ha="left",va="top",fontsize=9.3,color=INK,linespacing=1.45)
    fig.text(0.5,0.965,"Wirkung und Aufwand  ·  Chancen",ha="center",fontsize=13,fontweight="bold",color=INK)
    mp=os.path.join(tmp,f"qse_matrix_{slug}.png"); plt.savefig(mp,dpi=170,transparent=True,bbox_inches="tight"); plt.close()
    return rp,mp

_CSS="""
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700;800;900&family=Archivo+Black&family=Space+Mono:wght@400;700&display=swap');
@page { size:A4; margin:19mm 16mm 16mm 16mm;
  @bottom-left{ content:"amai!"; font-family:'Archivo Black',sans-serif; color:#1B2A4A; font-size:8pt;}
  @bottom-center{ content:"%FOOT%"; font-family:'Space Mono',monospace; color:#2C4641; font-size:7pt;}
  @bottom-right{ content:"Seite " counter(page); font-family:'Space Mono',monospace; color:#2C4641; font-size:7pt;}
}
*{box-sizing:border-box}
body{font-family:'Archivo','Helvetica Neue',Arial,sans-serif; color:#07221F; font-size:10.4pt; line-height:1.5; margin:0;}
h1,h2{font-family:'Archivo Black','Arial Black',Arial,sans-serif; color:#1B2A4A; line-height:1.12; margin:0;}
h3,h4{font-family:'Archivo Black','Arial Black',Arial,sans-serif; color:#07221F; line-height:1.12; margin:0;}
h1,h2,h3,h4,.lh{break-after:avoid; page-break-after:avoid;}
p,li,figure,tr,.box,.callout,.bar{break-inside:avoid; page-break-inside:avoid;}
.wm{font-family:'Archivo Black',sans-serif; font-size:30pt; color:#1B2A4A; letter-spacing:-0.04em;}
.wm .ex{color:#93E6BE;}
.rule{height:3px;background:#1B2A4A;margin:8px 0 18px;}
.eyebrow{font-family:'Space Mono',monospace; font-size:9pt; letter-spacing:.18em; text-transform:uppercase; color:#1B2A4A; margin-bottom:8px;}
h1.title{font-size:25pt; margin:0 0 8px;}
.meta{font-family:'Space Mono',monospace; font-size:8.2pt; color:#2C4641; margin-bottom:6px;}
h2{font-size:15pt; margin:22px 0 8px; padding-top:6px;}
h2 .n{color:#1B2A4A; margin-right:8px;}
h3{font-size:12pt;} h4{font-size:11pt; color:#07221F; margin-bottom:4px;}
p{margin:0 0 8px;}
.box{background:#E8F5EF; border-left:4px solid #93E6BE; padding:12px 16px; border-radius:6px; margin:10px 0;}
.chip{display:inline-block; font-family:'Archivo',sans-serif; font-weight:800; font-size:8.5pt; padding:2px 9px; border-radius:20px;}
table.scores{width:100%; border-collapse:collapse; margin:8px 0;}
table.scores td{padding:5px 6px; vertical-align:middle; border-bottom:1px solid rgba(7,34,31,.10);}
td.cat{font-weight:700; width:34%; font-size:10pt;} td.barcell{width:50%;} td.sc{width:16%; text-align:right;}
.bar{background:#E2E8F2; border-radius:8px; height:11px; width:100%; overflow:hidden;}
.bar .fill{height:11px; border-radius:8px;}
figure{margin:6px 0 4px; text-align:center;} figure img{max-width:100%;}
figcaption{font-family:'Space Mono',monospace; font-size:7.6pt; color:#2C4641; margin-top:3px;}
.layer{margin:0 0 11px; padding-bottom:9px; border-bottom:1px solid rgba(7,34,31,.08);}
.lh{display:flex; align-items:center; gap:10px; margin-bottom:4px;} .lh h3{flex:1;}
.rec{color:#2C4641;}
.imp{margin:0 0 12px;}
.tags{font-family:'Space Mono',monospace; font-size:8.4pt; color:#2C4641;}
.tag{display:inline-block; background:#E2E8F2; color:#07221F; padding:1px 8px; border-radius:12px; font-weight:700;}
ul{margin:4px 0 8px 0; padding-left:18px;} li{margin:0 0 4px;} ul.brand li::marker{color:#1B2A4A;}
.callout{background:#1B2A4A; color:#EEF1F6; padding:16px 18px; border-radius:8px; margin:12px 0;} .callout b{color:#93E6BE;}
.callout p:last-child{margin-bottom:0;}
"""

def build(site, dest_dir, tmp_dir="/tmp"):
    """Render one Swiss-German quickscan PDF (Marine+Mint) into dest_dir. Returns the PDF path."""
    os.makedirs(dest_dir, exist_ok=True)
    slug=site["slug"]; date_str=site.get("date_str","")
    radar_p,matrix_p=_viz(slug,site["scores"],site["firma"],[(t,im,mo) for (t,_,_,_,im,mo) in site["imps"]],tmp_dir)
    radar=base64.b64encode(open(radar_p,"rb").read()).decode()
    matrix=base64.b64encode(open(matrix_p,"rb").read()).decode()
    css=_CSS.replace("%FOOT%", f"Website Quickscan · {site['firma']}")
    sr="".join(f'<tr><td class="cat">{n}</td><td class="barcell">{_bar(s)}</td><td class="sc">{_chip(s)}</td></tr>' for n,s in zip(CATS_TBL,site["scores"]))
    def lay(t,s,o,i,a):
        sc=_chip(s) if s is not None else f'<span class="chip" style="background:#E2E8F2;color:#2C4641">{LAB["ind"]}</span>'
        return f'<div class="layer"><div class="lh"><h3>{t}</h3>{sc}</div><p><b>{LAB["obs"]}.</b> {o}</p><p><b>{LAB["imp"]}.</b> {i}</p><p class="rec"><b>{LAB["rec"]}.</b> {a}</p></div>'
    layers="".join(lay(*L) for L in site["layers"])
    def imph(t,o,w,a,im,mo):
        return f'<div class="imp"><h4>{t}</h4><p><b>{LAB["obs"]}.</b> {o}</p><p><b>{LAB["why"]}.</b> {w}</p><p><b>{LAB["rec"]}.</b> {a}</p><p class="tags">{LAB["impact"]}: <span class="tag">{im}</span> &nbsp; {LAB["effort"]}: <span class="tag">{mo}</span></p></div>'
    imps="".join(imph(*I) for I in site["imps"])
    goed="".join(f"<li>{g}</li>" for g in site["goed"]); seo="".join(f"<li>{g}</li>" for g in site["seo"])
    conclusie="".join(f"<p>{p}</p>" for p in site["conclusie"])
    html=f"""<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><style>{css}</style></head><body>
<div class="wm">amai<span class="ex">!</span></div><div class="rule"></div>
<div class="eyebrow">Website Quickscan</div><h1 class="title">Website Quickscan für {site['firma']}</h1>
<div class="meta">{site['meta']}  ·  durchgeführt von amai!  ·  {date_str}</div>
<h2><span class="n">1.</span>{H[0]}</h2><div class="box"><p>{site['exec']}</p></div>
<h2><span class="n">2.</span>{H[1]}</h2><table class="scores">{sr}</table>
<figure><img src="data:image/png;base64,{radar}" style="width:80%"><figcaption>Indikative Scorecard pro Kategorie (0 bis 10)</figcaption></figure>
<p><b>{LAB['concl']}.</b> {site['scorecard']}</p>
<h2><span class="n">3.</span>{H[2]}</h2><p>{site['algemene']}</p>
<h2><span class="n">4.</span>{H[3]}</h2><ul class="brand">{goed}</ul>
<h2><span class="n">5.</span>{H[4]}</h2>{layers}
<h2><span class="n">6.</span>{H[5]}</h2>{imps}
<h2><span class="n">7.</span>{H[6]}</h2><figure><img src="data:image/png;base64,{matrix}" style="width:100%"><figcaption>Verbesserungschancen nach Wirkung und Aufwand</figcaption></figure><p>{site['impact_text']}</p>
<h2><span class="n">8.</span>{H[7]}</h2><p>{site['conversie']}</p>
<h2><span class="n">9.</span>{H[8]}</h2><ul class="brand">{seo}</ul>
<h2><span class="n">10.</span>{H[9]}</h2><p>{site['vertrouwen']}</p>
<h2><span class="n">11.</span>{H[10]}</h2>{''.join(f'<p>{p}</p>' for p in site['roadmap'])}
<h2><span class="n">12.</span>{H[11]}</h2><div class="callout">{conclusie}</div>
</body></html>"""
    out=os.path.join(dest_dir, site["file"]); HTML(string=html).write_pdf(out); return out
