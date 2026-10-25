/* ============================================================
   LIBRARY
   ============================================================ */
const LIB={muscle:'all',equip:'all',fav:false,q:'',limit:60};
function renderLibrary(){
  $('#libEyebrow').textContent=t('exCountShort',{n:fmtN(allEx().length)});
  $('#muscleChips').innerHTML=['all'].concat(MUSCLE_LIST).map(m=>`<button class="chip${LIB.muscle===m?' on':''}" data-m="${m}">${m==='all'?'':`<span class="dot" style="--c:${MUSCLE_COLORS[m]}"></span>`}${esc(m==='all'?t('allMuscles'):t(m))}</button>`).join('');
  $('#equipChips').innerHTML=['all'].concat(EQUIP_LIST).map(q=>`<button class="chip${LIB.equip===q?' on':''}" data-q="${q}">${q==='all'?'':`<svg class="ico xs"><use href="#eq-${q}"/></svg>`}${esc(q==='all'?t('allEquipment'):t(q))}</button>`).join('');
  $('#favChip').classList.toggle('on',LIB.fav);
  renderLibList();
}
function renderLibList(){
  const res=searchEx(LIB.q,{muscle:LIB.muscle,equip:LIB.equip,fav:LIB.fav}),fv=new Set(getFavs());
  $('#libCount').textContent=t('exCount',{n:fmtN(res.length)});
  const list=$('#libList');
  if(!res.length){list.innerHTML=`<div class="empty" style="padding:30px 16px">${ico(LIB.fav?'star':'search')}<b>${esc(t(LIB.fav?'noFavs':'noResults'))}</b>${esc(t(LIB.fav?'noFavsSub':'noResultsSub'))}</div>`}
  else list.innerHTML=res.slice(0,LIB.limit).map((ex,i)=>exRowHTML(ex,i,fv)).join('');
  const more=$('#libMore');more.hidden=res.length<=LIB.limit;more.textContent=t('showMore',{n:fmtN(res.length-LIB.limit)});
}
function initLibrary(){
  const inp=$('#libSearch'),wrap=$('#libSearchWrap');let deb;
  inp.addEventListener('input',()=>{wrap.classList.toggle('has',!!inp.value);clearTimeout(deb);deb=setTimeout(()=>{LIB.q=inp.value;LIB.limit=60;renderLibList()},120)});
  $('.clear',wrap).addEventListener('click',()=>{inp.value='';wrap.classList.remove('has');LIB.q='';renderLibList();inp.focus()});
  $('#muscleChips').addEventListener('click',e=>{const c=e.target.closest('[data-m]');if(!c)return;LIB.muscle=c.dataset.m;LIB.limit=60;haptic(4);renderLibrary()});
  $('#equipChips').addEventListener('click',e=>{const c=e.target.closest('[data-q]');if(!c)return;LIB.equip=c.dataset.q;LIB.limit=60;haptic(4);renderLibrary()});
  $('#favChip').addEventListener('click',()=>{LIB.fav=!LIB.fav;haptic(4);renderLibrary()});
  $('#libMore').addEventListener('click',()=>{LIB.limit+=120;renderLibList()});
  $('#btnNewEx').addEventListener('click',()=>openCustomEditor(''));
  const list=$('#libList');
  list.addEventListener('click',e=>{const f=e.target.closest('[data-fav]');if(f){e.stopPropagation();handleFavClick(f);if(LIB.fav)setTimeout(renderLibList,300);return}const r=e.target.closest('[data-ex]');if(r)openExDetail(r.dataset.ex)});
  list.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const f=e.target.closest('[data-fav]');if(f){e.preventDefault();handleFavClick(f);return}const r=e.target.closest('[data-ex]');if(r){e.preventDefault();openExDetail(r.dataset.ex)}});
}
function openCustomEditor(name){
  const opts=(arr,cur)=>arr.map(v=>`<option value="${v}"${v===cur?' selected':''}>${esc(t(v))}</option>`).join('');
  const b=openSheet({title:t('newExercise'),body:`
    <div class="form-row"><label class="label" for="cxName">${esc(t('exName'))}</label><input class="input" id="cxName" maxlength="60" value="${esc(name||'')}" placeholder="${esc(t('exNamePh'))}" autocomplete="off"></div>
    <div class="two form-row"><div><label class="label" for="cxMuscle">${esc(t('muscle'))}</label><select class="input" id="cxMuscle">${opts(MUSCLE_LIST,'chest')}</select></div><div><label class="label" for="cxEquip">${esc(t('equipment'))}</label><select class="input" id="cxEquip">${opts(EQUIP_LIST,'machine')}</select></div></div>
    <div class="form-row"><label class="label">${esc(t('multiplier'))} · <b id="cxMultV" class="num" style="color:var(--text)"></b></label><input type="range" id="cxMult" min="0.3" max="9" step="0.1" value="1.5" style="width:100%;accent-color:var(--accent)"><p class="set-note" style="margin:6px 4px 0">${esc(t('multiplierHint'))}</p></div>
    <div class="sheet-actions"><button class="btn btn-secondary" data-a="no">${esc(t('cancel'))}</button><button class="btn btn-primary" data-a="save">${esc(t('create'))}</button></div>`});
  const mv=()=>$('#cxMultV',b).textContent=fmtMult(parseFloat($('#cxMult',b).value));mv();
  $('#cxMult',b).addEventListener('input',mv);
  if(finePointer()||!name)setTimeout(()=>$('#cxName',b).focus(),250);
  b.onclick=e=>{const a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='no')return closeSheet();
    const nm=$('#cxName',b).value.trim();if(!nm){$('#cxName',b).focus();toast(t('nameRequired'),{type:'bad'});return}
    const ex={id:'custom_'+Date.now().toString(36),name:nm,muscle:$('#cxMuscle',b).value,equipment:$('#cxEquip',b).value,mult:Math.round(parseFloat($('#cxMult',b).value)*10)/10,custom:true};
    CUSTOM.push(ex);saveCustom();closeSheet();toast(t('exCreated'),{type:'good',sub:nm});
    if(PAGE==='library')renderLibrary();selectEx(ex.id);
  };
}

/* ---------- Exercise detail ---------- */
function openExDetail(id){
  const ex=getEx(id);if(!ex)return;
  const h=getHistory().filter(e=>e.exId===id),pr=getPRs()[id],favOn=getFavs().includes(id);
  const vol=h.reduce((s,e)=>s+setVol(e,ex),0),timed=exMode(ex)==='time';
  const byDay={};h.forEach(e=>{const k=dayKey(e.ts);(byDay[k]=byDay[k]||[]).push(e)});
  const days=Object.keys(byDay).sort();
  const series=days.slice(-16).map(k=>Math.max(...byDay[k].map(e=>setScore(e,ex))));
  let spark='';
  if(series.length>=2){
    const W=480,H=90,mx=Math.max(...series),mn=Math.min(...series),rg=Math.max(1,mx-mn);
    const pts=series.map((v,i)=>[i/(series.length-1)*W,H-8-((v-mn)/rg)*(H-20)]);
    spark=`<div class="sec" style="margin:22px 4px 4px"><span>${esc(t(timed?'holdTrend':'est1rmTrend'))}</span><span class="num">${timed?fmtSecs(series[0])+' → '+fmtSecs(series[series.length-1]):fmtW(series[0])+' → '+fmtW(series[series.length-1])}</span></div><div class="spark"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path class="l" pathLength="1" d="${smoothPath(pts)}"/>${pts.map((p,i)=>i===pts.length-1?`<circle cx="${p[0]}" cy="${p[1]}" r="4.5"/>`:'').join('')}</svg></div>`;
  }
  const sess=days.slice(-5).reverse().map(k=>`<div class="sess"><span>${esc(relDay(keyToDate(k).getTime()))}</span><span class="num">${byDay[k].map(e=>esc(fmtSet(e,ex,true))).join('  ')}</span></div>`).join('');
  const b=openSheet({title:t('exercise'),body:`
    <div class="ex-hero">${tileHTML(ex)}<div><h4>${esc(exName(ex))}</h4><p>${esc(exMeta(ex))} · ${fmtMult(ex.mult)}</p></div></div>
    <div class="stat-grid"><div class="stat-box"><b class="num">${pr?esc(fmtSet(pr,ex,true)):'–'}</b><span>${esc(t('bestSet'))}</span></div><div class="stat-box"><b class="num">${pr?(timed?esc(fmtSecs(setSecs(pr))):fmtW(prScore(pr))):'–'}</b><span>${esc(t(timed?'holdTime':'est1rm'))}</span></div><div class="stat-box"><b class="num">${fmtN(h.length)}</b><span>${esc(t('sets'))}</span></div></div>
    ${spark}
    ${sess?`<div class="sec" style="margin:22px 4px 4px"><span>${esc(t('lastSessions'))}</span><span>${esc(fmtVol(vol))}</span></div><div>${sess}</div>`:`<p class="sheet-text" style="margin-top:18px">${esc(t('noSetsYet'))}</p>`}
    <div class="sheet-actions"><button class="btn btn-secondary" data-a="fav" style="flex:0 0 auto;width:56px" aria-label="${esc(t('favorites'))}"><span class="fav-btn${favOn?' on':''}" style="margin:0">${ico('star','sm')}</span></button>${ex.custom?`<button class="btn btn-danger" data-a="del" style="flex:0 0 auto;width:56px" aria-label="${esc(t('delete'))}">${ico('trash','sm')}</button>`:''}<button class="btn btn-primary" data-a="train">${ico('play','xs')}${esc(t('trainThis'))}</button></div>`});
  b.onclick=async e=>{const a=e.target.closest('[data-a]');if(!a)return;
    if(a.dataset.a==='fav'){const f=a.querySelector('.fav-btn');const on=toggleFav(id);f.classList.toggle('on',on);f.classList.remove('popping');void f.offsetWidth;f.classList.add('popping');if(PAGE==='library')renderLibList()}
    else if(a.dataset.a==='train'){closeSheet();selectEx(id);go('train')}
    else if(a.dataset.a==='del'){if(await confirmSheet({title:t('deleteExTitle'),text:t('deleteExText'),ok:t('delete'),danger:true})){CUSTOM=CUSTOM.filter(c=>c.id!==id);saveCustom();if(SEL===id){SEL=null;LS.del('gr_sel')}renderPage(PAGE);toast(t('deleted'),{icon:'trash'})}}
  };
}

