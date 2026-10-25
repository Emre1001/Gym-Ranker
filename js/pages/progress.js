/* ============================================================
   PROGRESS
   ============================================================ */
let PROG=LS.get('gr_progTab','overview');
function renderProgress(){
  const h=getHistory();
  $('#progEyebrow').textContent=rankName(rankOf(totalXp))+' · '+fmtN(totalXp)+' XP';
  seg($('#progSeg'),PROG,v=>{PROG=v;LS.set('gr_progTab',v);renderProgView(true)});
  renderProgView(false,h);
}
function renderProgView(anim,h=getHistory()){
  const v=$('#progView');
  if(PROG==='body')v.innerHTML=bodyView();else if(PROG==='records')v.innerHTML=recordsView(h);else v.innerHTML=overviewView(h);
  if(PROG==='overview')mountXpChart(h);
  if(anim)[...v.children].forEach((c,i)=>{c.style.animation='none';void c.offsetWidth;c.style.animation=`rise .55s var(--ease) ${i*50}ms both`});
}
function smoothPath(pts){
  if(pts.length<2)return '';let d=`M${pts[0][0]},${pts[0][1]}`;
  for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2,k=.18;
    const c1x=p1[0]+(p2[0]-p0[0])*k,c1y=p1[1]+(p2[1]-p0[1])*k,c2x=p2[0]-(p3[0]-p1[0])*k,c2y=p2[1]-(p3[1]-p1[1])*k;
    const lo=Math.max(p1[1],p2[1]),hi=Math.min(p1[1],p2[1]);
    d+=` C${c1x.toFixed(1)},${clamp(c1y,hi,lo).toFixed(1)} ${c2x.toFixed(1)},${clamp(c2y,hi,lo).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`}
  return d;
}
function dailySeries(h,n,fn){const now=Date.now(),keys=[],map={};for(let i=n-1;i>=0;i--){const k=dayKey(addDays(now,-i));keys.push(k);map[k]=0}h.forEach(e=>{const k=dayKey(e.ts);if(k in map)map[k]+=fn(e)});return keys.map(k=>({k,v:map[k]}))}
function overviewView(h){
  const days=new Set(h.map(e=>dayKey(e.ts))),st=getStreak(),ls=liveStreak();
  const now=Date.now(),wk=h.filter(e=>e.ts>startOfDay(addDays(now,-6))).length,pwk=h.filter(e=>e.ts>startOfDay(addDays(now,-13))&&e.ts<=startOfDay(addDays(now,-6))).length;
  const delta=pwk?Math.round((wk-pwk)/pwk*100):null;
  const kpi=(ic,c,label,val,sub)=>`<div class="card kpi" style="--kc:${c}"><div class="k-label">${ico(ic,'xs')}${esc(label)}</div><div class="k-val num">${val}</div><div class="k-sub">${sub}</div></div>`;
  const kpis=`<div class="kpis span">${kpi('bolt','var(--accent)',t('totalXp'),fmtN(totalXp),esc(rankName(rankOf(totalXp))))}${kpi('flame','#ff9f0a',t('streak'),ls+' <small style="font-size:15px;color:var(--text-2)">'+esc(t('daysShort'))+'</small>',esc(t('bestStreak',{n:st.longest||0})))}${kpi('history','#0a84ff',t('trainingDays'),fmtN(days.size),esc(t('avgSets',{n:days.size?NF1.format(h.length/days.size):0})))}${kpi('chart','#30d158',t('last7'),fmtN(wk)+' <small style="font-size:15px;color:var(--text-2)">'+esc(t('sets'))+'</small>',delta===null?esc(t('vsPrev')):`<span class="delta ${delta>=0?'up':'down'}">${delta>=0?'+':''}${delta}%</span> ${esc(t('vsPrev'))}`)}</div>`;
  const xp30=dailySeries(h,30,entryXp),sum30=xp30.reduce((s,x)=>s+x.v,0);
  const xpCard=`<div class="card span"><div class="card-head" style="margin-bottom:6px"><div><h3 class="card-title">${esc(t('xp30'))}</h3><div class="card-sub num">${fmtN(sum30)} XP</div></div></div><div class="chart" id="xpChart"></div><div class="chart-x"><span>${esc(fmtDate(addDays(now,-29),{day:'numeric',month:'short'}))}</span><span>${esc(fmtDate(addDays(now,-15),{day:'numeric',month:'short'}))}</span><span>${esc(t('todayShort'))}</span></div></div>`;
  const s14=dailySeries(h,14,()=>1),mx=Math.max(1,...s14.map(x=>x.v)),tk=dayKey();
  const bars=`<div class="card"><div class="card-head"><h3 class="card-title">${esc(t('sets14'))}</h3><span class="card-sub num">${fmtN(s14.reduce((s,x)=>s+x.v,0))}</span></div><div class="bars">${s14.map((x,i)=>`<div class="b${x.v?' has':''}${x.k===tk?' today':''}"><i data-v="${x.v}" style="height:${Math.max(3,x.v/mx*100)}%;--i:${i}"></i><em>${esc(fmtDate(keyToDate(x.k),{weekday:'narrow'}))}</em></div>`).join('')}</div></div>`;
  // heatmap 20 weeks, Monday-first
  const W=20,today=startOfDay(),dow=(new Date(today).getDay()+6)%7,start=addDays(today,-(W-1)*7-dow),cnt={};
  h.forEach(e=>{const k=dayKey(e.ts);cnt[k]=(cnt[k]||0)+1});
  let cells='';for(let i=0;i<W*7;i++){const ts=addDays(start,i),k=dayKey(ts),c=cnt[k]||0,lv=c===0?'':c<6?'l1':c<12?'l2':c<20?'l3':'l4';cells+=`<i class="${lv}${k===tk?' t':''}${ts>today?' f':''}" style="--i:${i}" title="${esc(fmtDate(ts,{day:'numeric',month:'short'}))}: ${c}"></i>`}
  const heat=`<div class="card"><div class="card-head"><h3 class="card-title">${esc(t('activity'))}</h3><span class="card-sub">${esc(t('weeksN',{n:W}))}</span></div><div class="heat" style="grid-template-columns:repeat(${W},1fr)">${cells}</div><div class="heat-legend">${esc(t('less'))}<i style="background:var(--surface-3)"></i><i class="l1" style="background:color-mix(in srgb,var(--accent) 30%,var(--surface-3))"></i><i style="background:color-mix(in srgb,var(--accent) 55%,var(--surface-3))"></i><i style="background:color-mix(in srgb,var(--accent) 80%,var(--surface-3))"></i><i style="background:var(--accent)"></i>${esc(t('more'))}</div></div>`;
  const dist={};h.forEach(e=>{const ex=getEx(e.exId);if(ex)dist[ex.muscle]=(dist[ex.muscle]||0)+e.xp});
  const tot=Object.values(dist).reduce((a,b)=>a+b,0),dm=Math.max(1,...Object.values(dist));
  const rows=Object.entries(dist).sort((a,b)=>b[1]-a[1]).map(([m,v],i)=>`<div class="dist-row" style="--c:${MUSCLE_COLORS[m]}"><span class="dn">${esc(t(m))}</span><span class="dt"><i style="width:${v/dm*100}%;--i:${i}"></i></span><span class="dv num">${Math.round(v/tot*100)}%</span></div>`).join('');
  const distCard=`<div class="card span"><div class="card-head"><h3 class="card-title">${esc(t('muscleDist'))}</h3><span class="card-sub">${esc(t('byXp'))}</span></div>${rows||`<div class="empty">${ico('chart')}<b>${esc(t('noData'))}</b>${esc(t('noDataSub'))}</div>`}</div>`;
  return `<div class="grid-2">${kpis}${xpCard}${bars}${heat}${distCard}</div>`;
}
function mountXpChart(h){
  const box=$('#xpChart');if(!box)return;
  const data=dailySeries(h,30,entryXp),W=Math.max(260,box.clientWidth||600),H=box.clientHeight||190,top=22,bot=6;
  const mx=Math.max(1,...data.map(d=>d.v))*1.08;
  const pts=data.map((d,i)=>[i/(data.length-1)*W,top+(H-top-bot)*(1-d.v/mx)]);
  const line=smoothPath(pts),area=line+` L${W},${H} L0,${H} Z`;
  box.innerHTML=`<svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".32"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs><g class="grid">${[0,1,2,3].map(i=>`<line x1="0" x2="${W}" y1="${top+(H-top-bot)*i/3}" y2="${top+(H-top-bot)*i/3}"/>`).join('')}</g><path class="area" d="${area}"/><path class="line" pathLength="1" d="${line}"/><g class="cursor"><line y1="0" y2="${H}"/><circle r="5.5"/></g></svg><div class="chart-tip"></div>`;
  const cur=$('.cursor',box),tip=$('.chart-tip',box),ln=$('line',cur),dot=$('circle',cur);
  const at=x=>{const i=clamp(Math.round(x/W*(data.length-1)),0,data.length-1),p=pts[i];ln.setAttribute('x1',p[0]);ln.setAttribute('x2',p[0]);dot.setAttribute('cx',p[0]);dot.setAttribute('cy',p[1]);tip.style.left=clamp(p[0],46,W-46)+'px';tip.innerHTML=`${fmtN(data[i].v)} XP<small>${esc(fmtDate(keyToDate(data[i].k),{weekday:'short',day:'numeric',month:'short'}))}</small>`;if(box._i!==i){box._i=i;haptic(2)}};
  const mv=e=>{const r=box.getBoundingClientRect();box.classList.add('scrub');at((e.clientX-r.left)*W/r.width)};
  box.addEventListener('pointerdown',mv);box.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)mv(e)});
  box.addEventListener('pointerleave',()=>box.classList.remove('scrub'));box.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')setTimeout(()=>box.classList.remove('scrub'),1200)});
}
function bodyView(){
  const mr=muscleRanks();
  const svg=s=>s.replace(/data-muscle="(\w+)"/g,(m,k)=>{const r=mr[k];const c=r&&r.tier>=0?TIERS[r.tier].c[1]:'';return `${m}${c?` style="fill:${c};--mc:${c}" data-has="1"`:''}`}).replace(/class="mz"(?=[^>]*data-has)/g,'class="mz has"');
  const order=MUSCLE_LIST.slice().sort((a,b)=>(mr[b].tier-mr[a].tier)||(mr[b].oneRM-mr[a].oneRM));
  const rows=order.map((m,i)=>{const r=mr[m],has=r.tier>=0,c=has?TIERS[r.tier].c[1]:'var(--surface-4)';
    return `<button class="m-row" data-muscle="${m}" style="--mc:${c}"><span class="m-emb${has?'':' none'}">${has?emblemTier(r.tier,1,false):ico('target','sm')}</span><span class="m-main"><span class="m-top"><span>${esc(t(m))}</span><span style="color:${has?c:'var(--text-3)'}">${esc(has?tierName(r.tier):t('unranked'))}</span></span><span class="m-bar"><i style="width:${(has?r.prog:0)*100}%;--i:${i}"></i></span><span class="m-sub num" style="display:block">${has?esc(t('oneRmOf',{v:fmtW(r.oneRM)}))+(r.next!=null?' · '+esc(t('nextAt',{v:fmtW(r.next),rank:tierName(r.tier+1)})):''):esc(t('bodyNoData'))}</span></span></button>`}).join('');
  const legend=TIERS.map((x,i)=>`<span><i style="background:${x.c[1]}"></i>${esc(tierName(i))}</span>`).join('');
  return `<div class="grid-2"><div class="card"><div class="card-head"><h3 class="card-title">${esc(t('strengthMap'))}</h3><span class="card-sub">${esc(t('tapMuscle'))}</span></div><div class="body-wrap"><div class="body-view"><h4>${esc(t('front'))}</h4>${svg(BODY_SVG.front)}</div><div class="body-view"><h4>${esc(t('back_view'))}</h4>${svg(BODY_SVG.back)}</div></div><div class="legend">${legend}</div></div><div class="list">${rows}</div></div>`;
}
function openMuscleSheet(m){
  const r=muscleRanks()[m],th=muscleThresholds[m],has=r.tier>=0,src=r.src&&getEx(r.src);
  const ladder=th.map((v,i)=>`<div class="lad${i===r.tier?' cur':''}${i>r.tier?' locked':''}" style="--tier:${TIERS[i].c[1]}">${emblemTier(i,1,false)}<div class="lad-main"><div class="lad-name">${esc(tierName(i))}</div><div class="lad-xp">1RM ≥ ${fmtW(v)}</div></div>${i===r.tier?`<span class="pill accent">${esc(t('you'))}</span>`:''}</div>`).join('');
  openSheet({title:t(m),tall:true,body:`
    <div class="ex-hero"><div style="width:64px;height:64px">${has?emblemTier(r.tier,1,false):`<span class="tile" style="--c:var(--text-3);width:64px;height:64px">${ico('target','lg')}</span>`}</div><div><h4 style="color:${has?TIERS[r.tier].c[1]:'var(--text)'}">${esc(has?tierName(r.tier):t('unranked'))}</h4><p>${has?esc(t('oneRmOf',{v:fmtW(r.oneRM)}))+(src?' · '+esc(exName(src)):''):esc(t('bodyNoData'))}</p></div></div>
    ${has&&r.next!=null?`<div class="bar" style="--tier:${TIERS[r.tier].c[1]};margin:6px 0 8px"><i style="width:${r.prog*100}%"></i></div><p class="sheet-text" style="font-size:13px">${esc(t('nextAt',{v:fmtW(r.next),rank:tierName(r.tier+1)}))}</p>`:''}
    <div class="ladder" style="margin-top:12px">${ladder}</div>`});
}
function recordsView(h){
  const prs=Object.entries(getPRs()).filter(([id])=>getEx(id)).sort((a,b)=>(b[1].date||0)-(a[1].date||0));
  const prList=prs.length?`<div class="list">${prs.slice(0,40).map(([id,p])=>{const ex=getEx(id);return `<button class="pr-row" data-detail="${esc(id)}">${tileHTML(ex,'sm')}<span class="ex-main"><span class="ex-name" style="display:block">${esc(exName(ex))}</span><span class="ex-meta" style="display:block">${esc(p.date?relDay(p.date):'')}</span></span><span class="pr-val"><b class="num">${fmtW(p.weight,false)} × ${p.reps}</b><small class="num">1RM ${fmtW(p.oneRM)}</small></span></button>`}).join('')}</div>`:`<div class="card empty">${ico('trophy')}<b>${esc(t('noPrs'))}</b>${esc(t('noPrsSub'))}</div>`;
  const cnt={};h.forEach(e=>cnt[e.exId]=(cnt[e.exId]||0)+1);
  const top=Object.entries(cnt).filter(([id])=>getEx(id)).sort((a,b)=>b[1]-a[1]).slice(0,10),tm=top.length?top[0][1]:1;
  const topList=top.length?`<div class="list">${top.map(([id,c],i)=>{const ex=getEx(id);return `<button class="top-row" data-detail="${esc(id)}"><span class="top-rank num">${i+1}</span><span class="ex-main"><span class="ex-name" style="display:block">${esc(exName(ex))}</span><span class="top-bar"><i style="width:${c/tm*100}%;--i:${i}"></i></span></span><span class="mult num">${fmtN(c)} ${esc(t('setsShort'))}</span></button>`}).join('')}</div>`:`<div class="card empty">${ico('chart')}<b>${esc(t('noData'))}</b>${esc(t('noDataSub'))}</div>`;
  return `<div class="grid-2"><div><div class="sec" style="margin-top:4px"><span>${esc(t('personalRecords'))}</span><span>${prs.length}</span></div>${prList}</div><div><div class="sec" style="margin-top:4px"><span>${esc(t('topExercises'))}</span></div>${topList}</div></div>`;
}

