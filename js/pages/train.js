/* ============================================================
   TRAIN
   ============================================================ */
let SEL=LS.get('gr_sel');
function renderTrain(){
  $('#todayDate').textContent=fmtDate(Date.now());
  const st=liveStreak(),sp=$('#streakPill');
  $('#streakNum').textContent=st;sp.classList.toggle('cold',st===0);sp.classList.toggle('hot',st>=3);
  sp.setAttribute('aria-label',t('streakInfo',{n:st,best:getStreak().longest||0}));
  renderHero();renderLogger();renderToday();
  $('#toolTimerSub').textContent=fmtClock(pref.timer);
}
function statusInfo(){
  const ms=Date.now()-lastWorkoutTime,days=ms/MS_DAY;
  if(totalXp<=0)return{cls:'neutral',txt:t('stRookie'),dot:false};
  if(days<2)return{cls:'good',txt:t('stPump'),dot:true};
  if(days<GRACE_DAYS)return{cls:'warn',txt:t('stPause',{t:relIn(lastWorkoutTime+GRACE_DAYS*MS_DAY-Date.now())}),dot:false};
  return{cls:'bad',txt:t('stBleed'),dot:true};
}
function renderHero(){
  const i=rankOf(totalXp),r=RANKS[i],next=RANKS[i+1],hero=$('#hero');
  hero.style.setProperty('--tier',tierColor(r.tier));
  const em=$('#heroEmblem');if(em.dataset.r!==String(i)){em.innerHTML=emblem(i);em.dataset.r=i}
  const rn=$('#heroRank');rn.textContent=rankName(i);rn.classList.toggle('fire',r.tier===10);
  tween($('#heroXp'),totalXp);
  const pct=next?clamp((totalXp-r.xp)/(next.xp-r.xp),0,1):1;
  requestAnimationFrame(()=>{$('#heroRing').style.strokeDashoffset=String(100-pct*100);$('#heroBar').style.width=(pct*100)+'%'});
  $('#heroNext').textContent=next?t('toNext',{xp:fmtN(Math.max(0,next.xp-totalXp)),rank:rankName(i+1)}):t('maxRank');
  const s=statusInfo();
  $('#heroStatus').innerHTML=`<span class="pill ${s.cls}">${s.dot?'<span class="pulse-dot"></span>':''}${esc(s.txt)}</span>`;
}
function renderLogger(){
  const ex=SEL&&getEx(SEL),p=$('#picker');
  if(SEL&&!ex){SEL=null;LS.del('gr_sel')}
  p.classList.toggle('unset',!ex);
  if(ex){
    $('#pickerTile').outerHTML=`<span id="pickerTile">${tileHTML(ex)}</span>`;
    $('#pickerName').textContent=exName(ex);
    const last=lastSet(ex.id),pr=getPRs()[ex.id];
    const bits=[fmtMult(ex.mult)];
    if(last)bits.push(t('lastSet',{v:fmtW(last.weight)+' × '+last.reps}));else bits.push(exMeta(ex));
    if(pr)bits.push('PR '+fmtW(pr.weight)+' × '+pr.reps);
    $('#pickerSub').textContent=bits.join(' · ');
    const n=todayEntries().filter(e=>e.exId===ex.id).length+1;
    const sn=$('#setNo');sn.hidden=false;sn.textContent=t('setN',{n});
  }else{
    $('#pickerTile').outerHTML=`<span class="ph-ico" id="pickerTile">${ico('search')}</span>`;
    $('#pickerName').textContent=t('chooseExercise');$('#pickerSub').textContent=t('exCountShort',{n:fmtN(allEx().length)});
    $('#setNo').hidden=true;
  }
  $('#lblWeight').textContent=t('weight')+' · '+UNIT();
  renderRecent();renderPreview();
}
function renderRecent(){
  const row=$('#recentRow'),rec=getRecent().map(getEx).filter(Boolean).slice(0,6);
  row.innerHTML=rec.map(ex=>`<button class="chip${ex.id===SEL?' on':''}" data-ex="${esc(ex.id)}"><span class="dot" style="--c:${MUSCLE_COLORS[ex.muscle]}"></span>${esc(exName(ex))}</button>`).join('');
}
function renderPreview(){
  const el=$('#preview'),ex=SEL&&getEx(SEL);
  if(!ex){el.innerHTML=`<span>${esc(t('pickFirst'))}</span>`;return}
  const w=fromDisp(parseNum($('#inWeight').value)),r=parseInt($('#inReps').value,10);
  if(!(w>0&&r>0)){el.innerHTML=`<span>${esc(t('enterValues'))}</span><span class="tags"><span class="pill neutral">${fmtMult(ex.mult)}</span></span>`;return}
  const xp=w*r*ex.mult,est=oneRM(w,r),pr=getPRs()[ex.id],tags=[];
  if(pr&&est>pr.oneRM)tags.push(`<span class="pill gold">${ico('trophy','xs')}${esc(t('prTag'))}</span>`);
  tags.push(`<span class="pill neutral">1RM ≈ ${fmtW(est)}</span>`);
  el.innerHTML=`<span class="xp num">+${fmtN(xp)}<small>XP</small></span><span class="tags">${tags.join('')}</span>`;
}
function selectEx(id,prefill=true){
  const ex=getEx(id);if(!ex)return;
  SEL=id;LS.set('gr_sel',id);
  if(prefill){const last=lastSet(id);$('#inWeight').value=last?fmtInput(toDisp(last.weight)):'';$('#inReps').value=last?last.reps:''}
  renderLogger();
  const p=$('#picker');p.animate([{transform:'scale(.97)'},{transform:'scale(1)'}],{duration:380,easing:'cubic-bezier(.34,1.56,.64,1)'});
}
function stepValue(kind,dir){
  const inp=kind==='w'?$('#inWeight'):$('#inReps');
  let v=parseNum(inp.value);if(isNaN(v))v=0;
  if(kind==='w'){const st=UNIT()==='lbs'?5:2.5;v=Math.max(0,Math.round((v+dir*st)*100)/100);inp.value=fmtInput(v)}
  else{v=Math.max(0,Math.round(v)+dir);inp.value=v}
  renderPreview();haptic(3);
}
function initSteppers(){
  $$('[data-step]').forEach(b=>{
    const kind=b.dataset.step[0],dir=parseInt(b.dataset.step.slice(1),10);let to,iv;
    const stop=()=>{clearTimeout(to);clearInterval(iv)};
    b.addEventListener('pointerdown',e=>{e.preventDefault();stepValue(kind,dir);stop();to=setTimeout(()=>{iv=setInterval(()=>stepValue(kind,dir),70)},380)});
    ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,stop));
    b.addEventListener('click',e=>{if(e.detail===0)stepValue(kind,dir)});
  });
  ['#inWeight','#inReps'].forEach(s=>{const i=$(s);i.addEventListener('input',renderPreview);i.addEventListener('focus',()=>setTimeout(()=>i.select(),0))});
}
const todayEntries=()=>{const k=dayKey();return getHistory().filter(e=>dayKey(e.ts)===k)};
function logSet(e){
  const ex=SEL&&getEx(SEL);
  if(!ex){toast(t('selectEx'),{type:'bad'});openPicker();return}
  const wIn=parseNum($('#inWeight').value),r=parseInt($('#inReps').value,10);
  if(!(wIn>0)||!(r>0)||r>500||wIn>1500){toast(t('invalidNum'),{type:'bad'});$('#logger').animate([{transform:'translateX(0)'},{transform:'translateX(-8px)'},{transform:'translateX(7px)'},{transform:'translateX(-4px)'},{transform:'translateX(0)'}],{duration:380});haptic([30,40,30]);return}
  const w=Math.round(fromDisp(wIn)*1000)/1000;
  const snap={xp:totalXp,lw:lastWorkoutTime,ld:lastDecayTime,streak:LS.get('gr_streak'),prs:LS.get('gr_prs'),recent:LS.get('gr_recent')};
  const prevRank=rankOf(totalXp),xp=w*r*ex.mult;
  const s=bumpStreak();let bonus=0;
  if(!s.bonusXpToday){bonus=Math.min(s.current*50,500);s.bonusXpToday=true;saveStreak(s)}
  const now=Date.now();
  totalXp+=xp+bonus;lastWorkoutTime=now;lastDecayTime=now;saveState();
  const entry={ts:now,exId:ex.id,weight:w,reps:r,xp};if(bonus)entry.b=bonus;
  const h=getHistory();h.push(entry);saveHistory(h);
  updateRecent(ex.id);
  const pr=checkPR(ex.id,w,r,now),newRank=rankOf(totalXp);
  currentRankIndex=newRank;
  // feedback
  const btn=$('#btnLog');
  if(e&&e.clientX!=null){const rc=btn.getBoundingClientRect();btn.style.setProperty('--x',(e.clientX-rc.left)+'px');btn.style.setProperty('--y',(e.clientY-rc.top)+'px')}
  btn.classList.add('done','flash');requestAnimationFrame(()=>btn.classList.remove('flash'));
  clearTimeout(btn._t);btn._t=setTimeout(()=>btn.classList.remove('done'),1100);
  haptic(pr.isPR&&!pr.first?[12,50,24]:14);
  toast('+'+fmtN(xp)+' XP',{type:'good',sub:exName(ex)+' · '+fmtW(w)+' × '+r+(bonus?' · '+t('streakBonus',{xp:bonus}):''),action:{label:t('undo'),fn:()=>undoLog(snap,now)},dur:5500});
  if(pr.isPR&&!pr.first){setTimeout(()=>{toast(t('newPr'),{type:'pr',sub:exName(ex)+' · 1RM ≈ '+fmtW(pr.oneRM),dur:4500});SFX.pr()},350)}
  if(pref.goal>0&&todayEntries().length===pref.goal)setTimeout(()=>toast(t('goalReached'),{type:'good',icon:'target'}),700);
  renderTrain();
  if(newRank>prevRank)setTimeout(()=>celebrate(newRank),700);
  if(pref.autoTimer)startTimer();
}
function undoLog(snap,ts){
  totalXp=snap.xp;lastWorkoutTime=snap.lw;lastDecayTime=snap.ld;saveState();
  [['gr_streak',snap.streak],['gr_prs',snap.prs],['gr_recent',snap.recent]].forEach(([k,v])=>v===null?LS.del(k):LS.set(k,v));
  saveHistory(getHistory().filter(e=>e.ts!==ts));
  currentRankIndex=rankOf(totalXp);stopTimer();
  renderTrain();toast(t('undone'),{icon:'undo'});
}
function renderToday(){
  const list=todayEntries(),n=list.length,goal=pref.goal;
  const xp=list.reduce((s,e)=>s+entryXp(e),0),vol=list.reduce((s,e)=>s+e.weight*e.reps,0);
  const ids=[...new Set(list.map(e=>e.exId))];
  tween($('#todaySets'),n,v=>String(Math.round(v)),600);
  $('#todaySetsLbl').textContent=goal?'/ '+goal:t('sets');
  tween($('#todayXp'),xp);
  $('#todayEx').textContent=ids.length;
  $('#todayVol').textContent=n?fmtVol(vol):'0';
  $('#todayTime').textContent=n>1?Math.max(1,Math.round((list[n-1].ts-list[0].ts)/60000))+' min':'–';
  const pct=goal?clamp(n/goal,0,1):(n?1:0);
  requestAnimationFrame(()=>$('#goalRingFg').style.strokeDashoffset=String(100-pct*100));
  $('#goalRing').classList.toggle('met',goal>0&&n>=goal);
  $('#todaySub').textContent=goal?(n>=goal?t('goalDone'):t('goalLeft',{n:goal-n})):'';
  const box=$('#todayList');
  if(!n){box.innerHTML=`<div class="empty">${ico('train')}<b>${esc(t('todayEmpty'))}</b>${esc(t('todayEmptySub'))}</div>`;return}
  box.innerHTML=ids.slice().reverse().map((id,i)=>{
    const ex=getEx(id),sets=list.filter(e=>e.exId===id),sx=sets.reduce((s,e)=>s+entryXp(e),0);
    return `<div class="tl-row" role="button" tabindex="0" data-detail="${esc(id)}" style="animation-delay:${i*40}ms">${ex?tileHTML(ex,'sm'):''}<div class="tl-main"><div class="tl-name">${esc(exName(ex))}</div><div class="tl-sets">${sets.map(e=>`<span class="num">${fmtW(e.weight,false)}×${e.reps}</span>`).join('')}</div></div><span class="tl-xp num">+${fmtN(sx)}</span></div>`;
  }).join('');
}

/* ---------- Exercise picker ---------- */
function openPicker(){
  const wrap=document.createElement('div');wrap.className='picker-sheet';
  wrap.innerHTML=`<div class="search"><svg class="ico sm"><use href="#i-search"/></svg><input id="pkQ" type="search" autocomplete="off" enterkeyhint="go" placeholder="${esc(t('searchPh'))}"><button class="clear" aria-label="Clear">${ico('x','xs')}</button></div><div class="chips" id="pkChips"></div><div id="pkRes"></div>`;
  const b=openSheet({title:t('chooseExercise'),body:wrap,tall:true});
  const q=$('#pkQ',b),res=$('#pkRes',b),chips=$('#pkChips',b);let muscle='all',kb=0;
  const drawChips=()=>{chips.innerHTML=['all'].concat(MUSCLE_LIST).map(m=>`<button class="chip${m===muscle?' on':''}" data-m="${m}">${m==='all'?'':`<span class="dot" style="--c:${MUSCLE_COLORS[m]}"></span>`}${esc(m==='all'?t('all'):t(m))}</button>`).join('')};
  const list=(arr,off=0)=>{const fv=new Set(getFavs());return `<div class="list">${arr.map((ex,i)=>exRowHTML(ex,i+off,fv)).join('')}</div>`};
  const render=()=>{
    const query=q.value;$('.search',b).classList.toggle('has',!!query);
    if(!query&&muscle==='all'){
      const favs=getFavs().map(getEx).filter(Boolean),rec=getRecent().map(getEx).filter(Boolean).filter(e=>!favs.includes(e));
      let h='';
      if(rec.length)h+=`<div class="ps-label">${esc(t('recent'))}</div>`+list(rec.slice(0,5));
      if(favs.length)h+=`<div class="ps-label">${esc(t('favorites'))}</div>`+list(favs);
      h+=`<div class="ps-label">${esc(t('allExercises'))}</div>`+list(searchEx(''));
      res.innerHTML=h;
    }else{
      const r=searchEx(query,{muscle});
      res.innerHTML=r.length?list(r):`<div class="empty">${ico('search')}<b>${esc(t('noResults'))}</b>${esc(t('noResultsSub'))}<div style="margin-top:14px"><button class="btn btn-secondary btn-sm" data-new="1">${ico('plus','xs')}${esc(t('createNamed',{q:query.trim()||t('newExercise')}))}</button></div></div>`;
    }
    kb=0;markKb();
  };
  const rows=()=>$$('.ex-row',res);
  const markKb=()=>{const rs=rows();rs.forEach((r,i)=>r.classList.toggle('kb',!!q.value&&i===kb&&finePointer()))};
  drawChips();render();
  q.addEventListener('input',render);
  $('.clear',b).addEventListener('click',()=>{q.value='';render();q.focus()});
  chips.addEventListener('click',e=>{const c=e.target.closest('[data-m]');if(!c)return;muscle=c.dataset.m;drawChips();render();haptic(4)});
  q.addEventListener('keydown',e=>{
    const rs=rows();
    if(e.key==='ArrowDown'){e.preventDefault();kb=Math.min(rs.length-1,kb+1);markKb();rs[kb]&&rs[kb].scrollIntoView({block:'nearest'})}
    else if(e.key==='ArrowUp'){e.preventDefault();kb=Math.max(0,kb-1);markKb();rs[kb]&&rs[kb].scrollIntoView({block:'nearest'})}
    else if(e.key==='Enter'){e.preventDefault();const r=rs[kb]||rs[0];if(r)pick(r.dataset.ex)}
  });
  const pick=id=>{closeSheet();selectEx(id);if(finePointer())setTimeout(()=>{const w=$('#inWeight');w.focus();w.select()},120)};
  res.addEventListener('click',e=>{
    const f=e.target.closest('[data-fav]');if(f){e.stopPropagation();handleFavClick(f);return}
    if(e.target.closest('[data-new]')){openCustomEditor(q.value.trim());return}
    const r=e.target.closest('[data-ex]');if(r)pick(r.dataset.ex);
  });
  res.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const f=e.target.closest('[data-fav]');if(f){e.preventDefault();handleFavClick(f);return}const r=e.target.closest('[data-ex]');if(r){e.preventDefault();pick(r.dataset.ex)}});
  if(finePointer())setTimeout(()=>q.focus(),220);
}

