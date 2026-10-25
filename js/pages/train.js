/* ============================================================
   TRAIN — home: greeting, rank, daily quests, day overview, set logger
   ============================================================ */
let SEL=LS.get('gr_sel');
function renderTrain(){
  $('#todayDate').textContent=fmtDate(Date.now());
  const nm=userName();$('#helloTitle').textContent=nm?t('hello',{name:nm}):t('titleTrain');
  $('#motd').textContent=coachLine();
  const st=liveStreak(),sp=$('#streakPill');
  $('#streakNum').textContent=st;sp.classList.toggle('cold',st===0);sp.classList.toggle('hot',st>=3);
  sp.setAttribute('aria-label',t('streakInfo',{n:st,best:getStreak().longest||0}));
  renderHero();renderLogger();renderQuests();renderWeekly();renderDayCard();renderToday();
  $('#toolTimerSub').textContent=fmtClock(pref.timer);
  $('#toolSkillsSub').textContent=fmtN(skillCount())+' / '+fmtN(skillTotal());
}
/* one line that reacts to what you did (or did not do) */
function coachLine(){
  const h=getHistory(),n=todayEntries().length,days=(Date.now()-lastWorkoutTime)/MS_DAY,hr=new Date().getHours(),st=liveStreak();
  if(!h.length)return t('coachFirst');
  if(pref.goal&&n>=pref.goal)return t('coachGoalDone');
  if(n>0)return t('coachTrained',{n});
  if(totalXp>0&&days>=GRACE_DAYS)return t('coachBleed');
  if(days>=2)return t('coachMiss',{d:Math.floor(days)});
  if(st>=2)return t('coachStreak',{n:st});
  return t(hr<11?'coachMorning':hr<18?'coachDay':'coachEvening');
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

/* ---------- daily quests ---------- */
const QUEST_ICONS={sets:'bolt',muscle:'target',volume:'plate',pr:'trophy',cali:'pushup',hold:'timer',steps:'steps',water:'drop',protein:'food',kcal:'flame',meals:'food',weigh:'scale'};
function renderQuests(){
  const st=getQuestState(),qs=dailyQuests(),mid=startOfDay(addDays(Date.now(),1));
  const done=qs.filter(q=>st.done[q.id]).length;
  $('#questSub').textContent=t('questsEnd',{t:relIn(mid-Date.now())});
  $('#questList').innerHTML=qs.map((q,i)=>{
    const[c,g]=questProgress(q),ok=!!st.done[q.id],pct=ok?1:clamp(c/g,0,1);
    return `<div class="quest${ok?' done':''}" style="--i:${i}"><span class="q-ico">${ico(ok?'check':QUEST_ICONS[q.id]||'bolt','sm')}</span><span class="q-main"><span class="q-title">${esc(questTitle(q))}</span><span class="q-bar"><i style="width:${pct*100}%"></i></span></span><span class="q-side"><span class="q-xp num">+${fmtN(q.xp)}</span><span class="q-val num">${ok?esc(t('done')):esc(questValue(q,c))}</span></span></div>`;
  }).join('');
  const ch=$('#chestRow');ch.classList.toggle('open',st.chest);
  ch.innerHTML=`<span class="q-ico gift">${ico('gift','sm')}</span><span class="q-main"><span class="q-title">${esc(t(st.chest?'chestOpened':'chestLocked'))}</span><span class="q-dots">${qs.map(q=>`<i class="${st.done[q.id]?'on':''}"></i>`).join('')}</span></span><span class="q-xp num">+${fmtN(CHEST_XP)}</span>`;
  $('#questCard').classList.toggle('all',done===qs.length);
}

const WQ_ICONS={w_reps:'pushup',w_days:'history',w_sets:'bolt',w_volume:'plate',w_holds:'timer',w_steps:'steps',w_protein:'food'};
function renderWeekly(){
  const st=getWeekState(),end=addDays(weekStart(),7);
  $('#weekSub').textContent=t('questsEnd',{t:relIn(end-Date.now())});
  $('#weekList').innerHTML=st.list.map((q,i)=>{
    const[c,g]=wquestProgress(q),ok=!!st.done[q.id],pct=ok?1:clamp(c/g,0,1);
    return `<div class="quest wk${ok?' done':''}" style="--i:${i}"><span class="q-ico">${ico(ok?'check':WQ_ICONS[q.id]||'crown','sm')}</span><span class="q-main"><span class="q-title">${esc(wquestTitle(q))}</span><span class="q-bar"><i style="width:${pct*100}%"></i></span></span><span class="q-side"><span class="q-xp num">+${fmtN(q.xp)}</span><span class="q-val num">${ok?esc(t('done')):esc(wquestValue(q,c))+' / '+esc(wquestValue(q,g))}</span></span></div>`;
  }).join('');
}

/* ---------- day overview: calories, steps, water ---------- */
function miniRing(pct,cls){return `<svg viewBox="0 0 44 44" class="mr ${cls||''}${pct>0?'':' zero'}"><circle class="mr-bg" cx="22" cy="22" r="18"/><circle class="mr-fg" cx="22" cy="22" r="18" pathLength="100" style="stroke-dashoffset:${100-clamp(pct,0,1)*100}"/></svg>`}
function renderDayCard(){
  const pl=myPlan(),kc=foodTotals(foodOn()).kcal,tg=todayTarget(pl),stp=stepsOn(),sg=stepGoal(),wa=waterOn(),wg=waterGoal();
  const tile=(act,icon,pct,val,label,cls)=>`<button class="day-tile" data-quick="${act}">${miniRing(pct,cls)}<span class="dt-ico">${ico(icon,'xs')}</span><b class="num">${val}</b><span>${esc(label)}</span></button>`;
  $('#dayTiles').innerHTML=
    tile('food','flame',tg?kc/tg:0,fmtN(kc),tg?t('ofKcal',{n:fmtN(tg)}):'kcal',pl&&kc>pl.hi?'over':'')+
    tile('steps','steps',stp/sg,fmtNC(stp),t('ofSteps',{n:fmtNC(sg)}),stp>=sg?'met':'')+
    tile('water','drop',wa/wg,NF1.format(wa/1000)+' L',t('ofWater',{n:NF1.format(wg/1000)}),wa>=wg?'met water':'water');
}
const fmtNC=n=>n>=10000?NF1.format(n/1000)+'k':fmtN(n);

/* ---------- logger ---------- */
function renderLogger(){
  const ex=SEL&&getEx(SEL),p=$('#picker');
  if(SEL&&!ex){SEL=null;LS.del('gr_sel')}
  p.classList.toggle('unset',!ex);
  const m=exMode(ex);
  if(ex){
    $('#pickerTile').outerHTML=`<span id="pickerTile">${tileHTML(ex)}</span>`;
    $('#pickerName').textContent=exName(ex);
    const last=lastSet(ex.id),pr=getPRs()[ex.id];
    const bits=[fmtMult(ex.mult)];
    if(last)bits.push(t('lastSet',{v:fmtSet(last,ex)}));else bits.push(exMeta(ex));
    if(pr)bits.push('PR '+fmtSet(pr,ex));
    $('#pickerSub').textContent=bits.join(' · ');
    const n=todayEntries().filter(e=>e.exId===ex.id).length+1;
    const sn=$('#setNo');sn.hidden=false;sn.textContent=t('setN',{n});
  }else{
    $('#pickerTile').outerHTML=`<span class="ph-ico" id="pickerTile">${ico('search')}</span>`;
    $('#pickerName').textContent=t('chooseExercise');$('#pickerSub').textContent=t('exCountShort',{n:fmtN(allEx().length)});
    $('#setNo').hidden=true;
  }
  $('#lblWeight').textContent=(m==='w'?t('weight'):t('extraWeight'))+' · '+UNIT();
  $('#inWeight').placeholder=m==='w'?'0':'BW';
  $('#lblReps').textContent=m==='time'?t('seconds'):t('reps');
  $('#inReps').inputMode='numeric';
  $('#swBtn').hidden=m!=='time';
  const hint=$('#modeHint');hint.hidden=m==='w';
  if(m!=='w')hint.innerHTML=`${ico('info','xs')}<span>${esc(t(m==='time'?'holdHint':'bwHint',{v:fmtW(bodyWeight())}))}</span>`;
  $('#logger').dataset.mode=m;
  renderRecent();renderPreview();
}
function renderRecent(){
  const row=$('#recentRow'),rec=getRecent().map(getEx).filter(Boolean).slice(0,6);
  row.innerHTML=rec.map(ex=>`<button class="chip${ex.id===SEL?' on':''}" data-ex="${esc(ex.id)}"><span class="dot" style="--c:${MUSCLE_COLORS[ex.muscle]}"></span>${esc(exName(ex))}</button>`).join('');
}
function readInputs(ex){
  const m=exMode(ex),raw=$('#inWeight').value.trim(),wIn=raw===''?0:parseNum(raw),n=parseInt($('#inReps').value,10);
  return{m,wIn,n,w:fromDisp(wIn),bw:m==='w'?0:bodyWeight()};
}
function renderPreview(){
  const el=$('#preview'),ex=SEL&&getEx(SEL);
  if(!ex){el.innerHTML=`<span>${esc(t('pickFirst'))}</span>`;return}
  const{m,w,n,bw}=readInputs(ex);
  if(!(n>0)||(m==='w'&&!(w>0))||isNaN(w)){el.innerHTML=`<span>${esc(t(m==='time'?'enterSecs':m==='bw'?'enterReps':'enterValues'))}</span><span class="tags"><span class="pill neutral">${fmtMult(ex.mult)}</span></span>`;return}
  const e={weight:w,reps:m==='time'?0:n,s:m==='time'?n:undefined,bw};
  const xp=calcXp(ex,w,e.reps,n,bw),sc=setScore(e,ex),pr=getPRs()[ex.id],tags=[];
  if(pr&&sc>prScore(pr))tags.push(`<span class="pill gold">${ico('trophy','xs')}${esc(t('prTag'))}</span>`);
  if(m==='w')tags.push(`<span class="pill neutral">1RM ≈ ${fmtW(sc)}</span>`);
  else tags.push(`<span class="pill neutral">BW ${fmtW(bw)}${w>0?' + '+fmtW(w,false):''}</span>`);
  const af=ageXpFactor();if(af>1)tags.push(`<span class="pill gold">${esc(t('ageBonus',{p:Math.round((af-1)*100)}))}</span>`);
  const nx=nextSkillFor(ex.id);if(nx)tags.push(`<span class="pill accent">${ico('spark','xs')}${esc(nx)}</span>`);
  el.innerHTML=`<span class="xp num">+${fmtN(xp)}<small>XP</small></span><span class="tags">${tags.join('')}</span>`;
}
/* next locked skill for this exercise, e.g. "Skill: 10 ×" */
function nextSkillFor(id){
  const got=getSkills();
  for(const tr of SKILL_TREES)for(const n of tr.nodes)if(n.ex===id&&!got[n.id])return t('nextSkill',{v:n.s?fmtSecs(n.s):n.r+' ×'+(n.add?' +'+fmtW(n.add,false):'')});
  return '';
}
function fillFromLast(id){
  const ex=getEx(id),last=lastSet(id);
  if(!last){$('#inWeight').value='';$('#inReps').value='';return}
  $('#inWeight').value=exMode(ex)!=='w'&&!(last.weight>0)?'':fmtInput(toDisp(last.weight));
  $('#inReps').value=exMode(ex)==='time'?setSecs(last):last.reps;
}
function selectEx(id,prefill=true){
  const ex=getEx(id);if(!ex)return;
  stopStopwatch();
  SEL=id;LS.set('gr_sel',id);
  if(prefill)fillFromLast(id);
  renderLogger();
  const p=$('#picker');p.animate([{transform:'scale(.97)'},{transform:'scale(1)'}],{duration:380,easing:'cubic-bezier(.34,1.56,.64,1)'});
}
function stepValue(kind,dir){
  const inp=kind==='w'?$('#inWeight'):$('#inReps'),ex=SEL&&getEx(SEL);
  let v=parseNum(inp.value);if(isNaN(v))v=0;
  if(kind==='w'){const st=UNIT()==='lbs'?5:2.5;v=Math.max(0,Math.round((v+dir*st)*100)/100);inp.value=v===0&&isCali(ex)?'':fmtInput(v)}
  else{const st=exMode(ex)==='time'?5:1;v=Math.max(0,Math.round(v)+dir*st);inp.value=v}
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
  $('#swBtn').addEventListener('click',toggleStopwatch);
  $('#questCard').addEventListener('click',e=>{if(e.target.closest('#chestRow'))toast(t('chestInfo',{xp:CHEST_XP}),{icon:'gift'})});
  $('#dayTiles').addEventListener('click',e=>{const b=e.target.closest('[data-quick]');if(!b)return;const a=b.dataset.quick;if(a==='food')go('food');else if(a==='steps')openStepsSheet();else addWater(250)});
}

/* ---------- stopwatch for holds ---------- */
const SW={t0:0,iv:null};
function toggleStopwatch(){
  if(SW.iv){stopStopwatch();haptic([12,40,12]);renderPreview();return}
  SW.t0=Date.now();$('#inReps').value=0;
  SW.iv=setInterval(()=>{$('#inReps').value=Math.floor((Date.now()-SW.t0)/1000);renderPreview()},250);
  $('#swBtn').classList.add('on');$('#swBtn').setAttribute('aria-pressed','true');$('#swLbl').textContent=t('stop');haptic(10);
}
function stopStopwatch(){
  if(!SW.iv)return;clearInterval(SW.iv);SW.iv=null;
  $('#inReps').value=Math.floor((Date.now()-SW.t0)/1000);
  $('#swBtn').classList.remove('on');$('#swBtn').setAttribute('aria-pressed','false');$('#swLbl').textContent=t('stopwatch');
}

const todayEntries=()=>{const k=dayKey();return getHistory().filter(e=>dayKey(e.ts)===k)};
function logSet(e){
  const ex=SEL&&getEx(SEL);
  if(!ex){toast(t('selectEx'),{type:'bad'});openPicker();return}
  stopStopwatch();
  const{m,wIn,n,w:wKg,bw}=readInputs(ex);
  const badW=m==='w'?!(wIn>0):!(wIn>=0);
  if(badW||isNaN(wIn)||!(n>0)||n>(m==='time'?3600:500)||wIn>1500){toast(t(m==='time'?'invalidSecs':m==='bw'?'invalidReps':'invalidNum'),{type:'bad'});$('#logger').animate([{transform:'translateX(0)'},{transform:'translateX(-8px)'},{transform:'translateX(7px)'},{transform:'translateX(-4px)'},{transform:'translateX(0)'}],{duration:380});haptic([30,40,30]);return}
  const w=Math.round(wKg*1000)/1000;
  const snap={xp:totalXp,lw:lastWorkoutTime,ld:lastDecayTime};
  ['gr_streak','gr_prs','gr_recent','gr_quests','gr_skills','gr_ach','gr_xplog','gr_qcount','gr_chests'].forEach(k=>snap[k]=LS.get(k));
  const prevRank=rankOf(totalXp);
  const s=bumpStreak();let bonus=0;
  if(!s.bonusXpToday){bonus=Math.min(s.current*50,500);s.bonusXpToday=true;saveStreak(s)}
  const now=Date.now(),reps=m==='time'?0:n,xp=calcXp(ex,w,reps,n,bw);
  totalXp+=xp+bonus;lastWorkoutTime=now;lastDecayTime=now;saveState();
  const entry={ts:now,exId:ex.id,weight:w,reps,xp};
  if(m==='time')entry.s=n;if(m!=='w')entry.bw=Math.round(bw*10)/10;if(bonus)entry.b=bonus;
  const h=getHistory();h.push(entry);saveHistory(h);
  updateRecent(ex.id);
  const pr=checkPR(ex,entry);
  const queued=REWARDS.length;
  afterAction(prevRank,entry);
  // feedback
  const btn=$('#btnLog');
  if(e&&e.clientX!=null){const rc=btn.getBoundingClientRect();btn.style.setProperty('--x',(e.clientX-rc.left)+'px');btn.style.setProperty('--y',(e.clientY-rc.top)+'px')}
  btn.classList.add('done','flash');requestAnimationFrame(()=>btn.classList.remove('flash'));
  clearTimeout(btn._t);btn._t=setTimeout(()=>btn.classList.remove('done'),1100);
  haptic(pr.isPR&&!pr.first?[12,50,24]:14);
  toast('+'+fmtN(xp)+' XP',{type:'good',sub:exName(ex)+' · '+fmtSet(entry,ex)+(bonus?' · '+t('streakBonus',{xp:bonus}):'')+(ageXpFactor()>1?' · '+t('ageBonus',{p:Math.round((ageXpFactor()-1)*100)}):''),action:{label:t('undo'),fn:()=>undoLog(snap,now)},dur:5500});
  if(pr.isPR&&!pr.first){setTimeout(()=>{toast(t('newPr'),{type:'pr',sub:exName(ex)+' · '+fmtSet(entry,ex),dur:4500});SFX.pr()},350)}
  if(pref.goal>0&&todayEntries().length===pref.goal)setTimeout(()=>toast(t('goalReached'),{type:'good',icon:'target'}),700);
  renderTrain();
  if(pref.autoTimer&&REWARDS.length===queued)startTimer();
}
function undoLog(snap,ts){
  totalXp=snap.xp;lastWorkoutTime=snap.lw;lastDecayTime=snap.ld;saveState();
  Object.keys(snap).forEach(k=>{if(!k.startsWith('gr_'))return;const v=snap[k];v===null?LS.del(k):LS.set(k,v)});
  saveHistory(getHistory().filter(e=>e.ts!==ts));
  currentRankIndex=rankOf(totalXp);stopTimer();
  renderTrain();toast(t('undone'),{icon:'undo'});
}
function renderToday(){
  const list=todayEntries(),n=list.length,goal=pref.goal;
  const xp=list.reduce((s,e)=>s+entryXp(e),0)+getXpLog().filter(x=>dayKey(x.ts)===dayKey()).reduce((s,x)=>s+x.xp,0);
  const vol=list.reduce((s,e)=>s+setVol(e,getEx(e.exId)),0);
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
    return `<div class="tl-row" role="button" tabindex="0" data-detail="${esc(id)}" style="animation-delay:${i*40}ms">${ex?tileHTML(ex,'sm'):''}<div class="tl-main"><div class="tl-name">${esc(exName(ex))}</div><div class="tl-sets">${sets.map(e=>`<span class="num">${esc(fmtSet(e,ex,true))}</span>`).join('')}</div></div><span class="tl-xp num">+${fmtN(sx)}</span></div>`;
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

