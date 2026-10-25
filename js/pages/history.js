/* ============================================================
   HISTORY
   ============================================================ */
let histDays=14;
function renderHistory(){
  const h=getHistory(),box=$('#histList'),days={};
  h.forEach(e=>{const k=dayKey(e.ts);(days[k]=days[k]||[]).push(e)});
  const keys=Object.keys(days).sort().reverse();
  $('#histEyebrow').textContent=t('histSummary',{sets:fmtN(h.length),days:fmtN(keys.length)});
  if(!h.length){box.innerHTML=`<div class="card empty" style="padding:40px 20px">${ico('history')}<b>${esc(t('noHistory'))}</b>${esc(t('noHistorySub'))}<div style="margin-top:16px"><button class="btn btn-primary btn-sm" data-go="train">${esc(t('startTraining'))}</button></div></div>`;$('#histMore').hidden=true;return}
  box.innerHTML=keys.slice(0,histDays).map((k,i)=>{
    const sets=days[k].slice().reverse(),xp=sets.reduce((s,e)=>s+entryXp(e),0),exs=new Set(sets.map(e=>e.exId)).size;
    const d=keyToDate(k).getTime(),rel=Math.round((d-startOfDay())/MS_DAY);
    const label=rel>=-1?RTF.format(rel,'day'):fmtDate(d,{weekday:'long',day:'numeric',month:'long'});
    return `<div class="h-day" style="--i:${i}"><div class="h-head"><div><div class="h-date">${esc(label)}</div><div class="h-sum">${esc(t('daySummary',{s:sets.length,e:exs}))}${rel>=-1?' · '+esc(fmtDate(d,{day:'numeric',month:'short'})):''}</div></div><span class="h-xp num">+${fmtN(xp)} XP</span></div><div class="list">${sets.map(e=>{const ex=getEx(e.exId);return `<button class="h-row" data-ts="${e.ts}">${ex?tileHTML(ex,'sm'):'<span class="tile sm" style="--c:#888"></span>'}<span class="h-main"><span class="h-name" style="display:block">${esc(ex?exName(ex):e.exId)}</span><span class="h-detail num" style="display:block">${fmtW(e.weight)} × ${e.reps}</span></span><span><span class="h-earn num" style="display:block">+${fmtN(entryXp(e))}</span><span class="h-time num" style="display:block">${fmtTime(e.ts)}</span></span></button>`}).join('')}</div></div>`;
  }).join('');
  const more=$('#histMore');more.hidden=keys.length<=histDays;more.textContent=t('showMoreDays');
}
function openSetSheet(ts){
  const e=getHistory().find(x=>x.ts===ts);if(!e)return;const ex=getEx(e.exId);
  const b=openSheet({title:t('set'),body:`
    <div class="ex-hero">${ex?tileHTML(ex):''}<div><h4>${esc(ex?exName(ex):e.exId)}</h4><p>${esc(fmtDate(e.ts,{weekday:'long',day:'numeric',month:'long'}))} · ${fmtTime(e.ts)}</p></div></div>
    <div class="stat-grid"><div class="stat-box"><b class="num">${fmtW(e.weight,false)}×${e.reps}</b><span>${esc(UNIT())} × ${esc(t('reps'))}</span></div><div class="stat-box"><b class="num">+${fmtN(entryXp(e))}</b><span>XP${e.b?' (+'+e.b+' '+esc(t('bonus'))+')':''}</span></div><div class="stat-box"><b class="num">${fmtW(oneRM(e.weight,e.reps))}</b><span>${esc(t('est1rm'))}</span></div></div>
    <div class="sheet-actions"><button class="btn btn-danger" data-a="del">${ico('trash','xs')}${esc(t('delete'))}</button><button class="btn btn-primary" data-a="again">${ico('undo','xs')}${esc(t('repeatSet'))}</button></div>`});
  b.onclick=async ev=>{const a=ev.target.closest('[data-a]');if(!a)return;
    if(a.dataset.a==='again'){closeSheet();if(ex){selectEx(ex.id,false);$('#inWeight').value=fmtInput(toDisp(e.weight));$('#inReps').value=e.reps;renderPreview()}go('train')}
    else if(await confirmSheet({title:t('deleteSetTitle'),text:t('deleteSetText',{xp:fmtN(entryXp(e))}),ok:t('delete'),danger:true}))deleteEntry(ts);
  };
}
function deleteEntry(ts){
  const h=getHistory(),e=h.find(x=>x.ts===ts);if(!e)return;
  const rest=h.filter(x=>x.ts!==ts);saveHistory(rest);
  totalXp=Math.max(0,totalXp-entryXp(e));saveState();
  const prs=getPRs(),pr=prs[e.exId];
  if(pr&&pr.oneRM===oneRM(e.weight,e.reps)&&Math.abs((pr.date||0)-e.ts)<5000){
    const same=rest.filter(x=>x.exId===e.exId);
    if(same.length){const best=same.reduce((a,x)=>oneRM(x.weight,x.reps)>oneRM(a.weight,a.reps)?x:a);prs[e.exId]={weight:best.weight,reps:best.reps,date:best.ts,oneRM:oneRM(best.weight,best.reps)}}
    else delete prs[e.exId];
    savePRs(prs);
  }
  currentRankIndex=rankOf(totalXp);renderPage(PAGE);toast(t('setDeleted'),{icon:'trash',sub:'−'+fmtN(entryXp(e))+' XP'});
}

