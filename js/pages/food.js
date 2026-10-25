/* ============================================================
   FOOD — calories, macros, water, meals, calorie calculator
   ============================================================ */
let FOOD_OFF=0;   // 0 = today, -1 = yesterday …
const foodDay=()=>dayKey(addDays(Date.now(),FOOD_OFF));
const MEAL_ICONS={breakfast:'sun',lunch:'food',dinner:'moon',snack:'apple'};
function dayTargetFor(d,pl){
  if(!pl)return 0;
  if(pl.goal!=='recomp')return pl.target;
  return getHistory().some(e=>dayKey(e.ts)===d)?pl.train:pl.rest;
}
function bigRing(pct,cls,inner){
  return `<div class="big-ring ${cls}${pct>0?'':' zero'}"><svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="52"/><circle class="ring-fg" cx="60" cy="60" r="52" pathLength="100" style="stroke-dashoffset:${100-clamp(pct,0,1)*100}"/></svg><div class="br-in">${inner}</div></div>`;
}
function macroBar(label,cur,goal,c){
  const pct=goal?clamp(cur/goal,0,1.2):0;
  return `<div class="macro" style="--c:${c}"><div class="mc-top"><span>${esc(label)}</span><span class="num"><b>${fmtN(cur)}</b> / ${fmtN(goal)} g</span></div><div class="mc-bar"><i style="width:${Math.min(1,pct)*100}%"></i></div></div>`;
}
function renderFood(){
  const d=foodDay(),pl=myPlan(),list=foodOn(d),tot=foodTotals(list),target=dayTargetFor(d,pl);
  $('#foodEyebrow').textContent=(FOOD_OFF===0?t('today'):relDay(keyToDate(d).getTime()))+(pl?' · '+t('goal_'+pl.goal):'');
  $('#foodDayLbl').textContent=FOOD_OFF===0?t('todayShort'):fmtDate(keyToDate(d),{weekday:'short',day:'numeric',month:'short'});
  $('#foodNext').disabled=FOOD_OFF>=0;
  const left=target-tot.kcal,inRange=pl&&tot.kcal>=pl.lo&&tot.kcal<=pl.hi,over=pl&&tot.kcal>pl.hi;
  const status=!pl?'':inRange?`<span class="pill good">${ico('check','xs')}${esc(t('inRange'))}</span>`:over?`<span class="pill bad">${esc(t('overRange'))}</span>`:`<span class="pill neutral">${esc(t('kcalToMin',{n:fmtN(Math.max(0,pl.lo-tot.kcal))}))}</span>`;
  const summary=`<div class="card food-sum span">
    <div class="fs-top">${bigRing(target?tot.kcal/target:0,over?'over':inRange?'met':'',`<b class="num">${fmtN(tot.kcal)}</b><small>${esc(t('ofKcal',{n:fmtN(target)}))}</small>`)}
      <div class="fs-info"><div class="fs-left num">${left>=0?esc(t('kcalLeft',{n:fmtN(left)})):esc(t('kcalOver',{n:fmtN(-left)}))}</div>
      ${pl?`<div class="fs-range">${esc(t('kcalRange',{lo:fmtN(pl.lo),hi:fmtN(pl.hi)}))}</div>`:''}<div class="fs-status">${status}</div></div></div>
    ${pl?`<div class="macros">${macroBar(t('protein'),tot.p,pl.p,'#ff6b4a')}${macroBar(t('carbs'),tot.c,pl.c,'#3b9eff')}${macroBar(t('fat'),tot.f,pl.f,'#f5c518')}</div>`:''}
  </div>`;
  // water
  const wa=waterOn(d),wg=waterGoal(),glasses=Math.max(4,Math.round(wg/250)),full=Math.floor(wa/250);
  const water=`<div class="card water-card"><div class="card-head"><h3 class="card-title">${esc(t('water'))}</h3><span class="card-sub num">${NF1.format(wa/1000)} / ${NF1.format(wg/1000)} L</span></div>
    <div class="glasses">${Array.from({length:glasses},(_,i)=>`<button class="glass${i<full?' on':''}" data-glass="${i}" aria-label="${(i+1)*250} ml"><svg viewBox="0 0 24 28"><path class="g-out" d="M4 3h16l-2 22H6z"/><path class="g-in" d="M5.2 12h13.6l-1.3 12H6.5z"/></svg></button>`).join('')}</div>
    <div class="btn-row"><button class="btn btn-secondary btn-sm" data-water="-250">−250 ml</button><button class="btn btn-secondary btn-sm" data-water="250">${ico('plus','xs')}250 ml</button><button class="btn btn-secondary btn-sm" data-water="500">${ico('plus','xs')}500 ml</button></div></div>`;
  // meals
  const meals=MEALS.map(m=>{
    const items=list.filter(x=>x.meal===m),sum=foodTotals(items);
    return `<div class="meal"><div class="meal-head"><span class="meal-ico">${ico(MEAL_ICONS[m],'sm')}</span><div class="meal-main"><b>${esc(t('meal_'+m))}</b><span class="num">${items.length?fmtN(sum.kcal)+' kcal · '+fmtN(sum.p)+' g '+esc(t('proteinShort')):esc(t('nothingYet'))}</span></div><button class="icon-btn add" data-add="${m}" aria-label="${esc(t('addFood'))}">${ico('plus','sm')}</button></div>
      ${items.length?`<div class="meal-items">${items.map(x=>`<button class="food-row" data-food="${x.id}"><span class="fr-main"><span class="fr-name">${esc(x.name)}</span><span class="fr-sub num">${x.g?fmtN(x.g)+' g · ':''}${fmtN(x.p)} P · ${fmtN(x.c)} K · ${fmtN(x.f)} F</span></span><span class="fr-kcal num">${fmtN(x.kcal)}</span></button>`).join('')}</div>`:''}</div>`;
  }).join('');
  const mealsCard=`<div class="card meals-card"><div class="card-head"><h3 class="card-title">${esc(t('meals'))}</h3><span class="card-sub num">${fmtN(tot.kcal)} kcal</span></div>${meals}</div>`;
  $('#foodView').innerHTML=`<div class="grid-2">${summary}<div class="col">${mealsCard}</div><div class="col">${water}${planCard()}${weekKcalCard(pl)}${tipCard('food')}</div></div>`;
  const ps=$('#paceSeg');if(ps){const p=getProfile();seg(ps,p.pace||'normal',v=>{p.pace=v;saveProfile(p);renderFood()})}
}
/* the calculator: every goal side by side, tap one to switch */
function planCard(){
  const p=getProfile();if(!p)return `<div class="card"><div class="empty">${ico('calc')}<b>${esc(t('noProfile'))}</b><button class="btn btn-primary btn-sm" data-act="setup" style="margin-top:12px">${esc(t('setupNow'))}</button></div></div>`;
  const cur=planFor(p);
  const rows=GOALS.map(g=>{const pl=planFor(p,g);const wk=pl.weekly;
    return `<button class="goal-row${g===p.goal?' on':''}" data-goal="${g}"><span class="gr-ico">${ico(GOAL_ICONS[g],'sm')}</span><span class="gr-main"><b>${esc(t('goal_'+g))}</b><span>${g==='recomp'?esc(t('recompDays',{tr:fmtN(pl.train),rest:fmtN(pl.rest)})):esc(Math.abs(wk)<.02?t('weeklyZero'):t('weeklyChange',{v:(wk>0?'+':'−')+fmtW(Math.abs(wk))}))}</span></span><span class="gr-kcal num">${fmtN(pl.target)}<small>kcal</small></span></button>`}).join('');
  const paceSeg=(p.goal==='cut'||p.goal==='bulk')&&!cur.teen?`<div class="seg" id="paceSeg" style="margin-top:12px">${['slow','normal','fast'].map(v=>`<button data-v="${v}">${esc(t('pace_'+v))}</button>`).join('')}</div>`:'';
  return `<div class="card plan-card"><div class="card-head"><h3 class="card-title">${esc(t('calcTitle'))}</h3><button class="btn btn-ghost btn-sm" data-act="editProfile">${ico('pencil','xs')}${esc(t('edit'))}</button></div>
    <div class="plan-kv"><div class="kv"><b class="num">${fmtN(cur.bmr)}</b><span>${esc(t('bmr'))}</span></div><div class="kv"><b class="num">${fmtN(cur.tdee)}</b><span>${esc(t('tdee'))}</span></div><div class="kv"><b class="num">${fmtN(cur.target)}</b><span>${esc(t('yourTarget'))}</span></div></div>
    <div class="goal-rows">${rows}</div>${paceSeg}
    ${cur.teen?`<p class="set-note warn-note">${ico('info','xs')} ${esc(t('teenNote'))}</p>`:''}
    ${cur.low?`<p class="set-note warn-note">${ico('info','xs')} ${esc(t('lowWarn'))}</p>`:''}
    <p class="set-note">${esc(t('calcNote'))}</p></div>`;
}
const GOAL_ICONS={cut:'trend-down',bulk:'trend',maint:'scale',recomp:'refresh'};
function weekKcalCard(pl){
  const days=[];for(let i=6;i>=0;i--){const d=dayKey(addDays(Date.now(),-i));days.push({d,k:foodTotals(foodOn(d)).kcal,tg:dayTargetFor(d,pl)})}
  const mx=Math.max(1,...days.map(x=>Math.max(x.k,x.tg)))*1.1,logged=days.filter(x=>x.k>0),avg=logged.length?logged.reduce((s,x)=>s+x.k,0)/logged.length:0;
  return `<div class="card"><div class="card-head"><h3 class="card-title">${esc(t('last7'))}</h3><span class="card-sub num">Ø ${fmtN(avg)} kcal</span></div>
    <div class="bars goal-bars">${days.map((x,i)=>`<div class="b${x.k?' has':''}${pl&&x.k>pl.hi?' over':''}${x.d===dayKey()?' today':''}"><i data-v="${x.k?fmtNC(x.k):0}" style="height:${Math.max(3,x.k/mx*100)}%;--i:${i}"></i>${x.tg?`<u style="bottom:calc(${x.tg/mx*100}% * .82 + 18px)"></u>`:''}<em>${esc(fmtDate(keyToDate(x.d),{weekday:'narrow'}))}</em></div>`).join('')}</div></div>`;
}
/* rotating tips for your goal */
let TIP_I={};
function tipCard(where){
  const p=getProfile(),g=p?p.goal:'maint',set=(TIPS[LANG]||TIPS.en),list=set[g].concat(set.general);
  const i=(TIP_I[where]!=null?TIP_I[where]:Math.floor(Date.now()/MS_DAY))%list.length;
  return `<div class="card tip-card" data-tipcard="${where}"><div class="card-head"><h3 class="card-title">${ico('bulb','sm')}${esc(t(g==='cut'?'tipsCut':g==='bulk'?'tipsBulk':'tipsTitle'))}</h3><button class="btn btn-ghost btn-sm" data-tip="${where}">${esc(t('nextTip'))}${ico('chev-r','xs')}</button></div><p class="tip-text">${esc(list[i])}</p><div class="tip-dots num">${i+1} / ${list.length}</div></div>`;
}
function nextTip(where,card){
  const p=getProfile(),g=p?p.goal:'maint',set=(TIPS[LANG]||TIPS.en),n=set[g].length+set.general.length;
  TIP_I[where]=((TIP_I[where]!=null?TIP_I[where]:Math.floor(Date.now()/MS_DAY))+1)%n;
  const fresh=document.createElement('div');fresh.innerHTML=tipCard(where);const el=fresh.firstElementChild;card.replaceWith(el);
  const tx=$('.tip-text',el);tx.animate([{opacity:0,transform:'translateX(14px)'},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});haptic(4);
}
function addWater(ml){
  const d=FOOD_OFF&&PAGE==='food'?foodDay():dayKey(),prev=rankOf(totalXp),before=waterOn(d);
  setWater(before+ml,d);haptic(6);
  const after=waterOn(d),g=waterGoal();
  if(before<g&&after>=g)toast(t('waterGoalHit'),{type:'good',icon:'drop'});
  else if(ml>0)toast('+'+ml+' ml',{icon:'drop',sub:NF1.format(after/1000)+' / '+NF1.format(g/1000)+' L',dur:1800});
  afterAction(prev);renderPage(PAGE);
}
function initFood(){
  const v=$('#foodView');
  $('#foodPrev').addEventListener('click',()=>{FOOD_OFF--;renderFood();haptic(4)});
  $('#foodNext').addEventListener('click',()=>{if(FOOD_OFF<0){FOOD_OFF++;renderFood();haptic(4)}});
  v.addEventListener('click',e=>{
    const a=e.target.closest('[data-add]');if(a){openAddFood(a.dataset.add);return}
    const f=e.target.closest('[data-food]');if(f){openFoodEntry(parseInt(f.dataset.food,10));return}
    const gl=e.target.closest('[data-glass]');if(gl){const i=parseInt(gl.dataset.glass,10),cur=Math.floor(waterOn(foodDay())/250);addWater(((i+1===cur?i:i+1)-cur)*250);return}
    const w=e.target.closest('[data-water]');if(w){addWater(parseInt(w.dataset.water,10));return}
    const g=e.target.closest('[data-goal]');if(g){const p=getProfile();if(p.goal!==g.dataset.goal){p.goal=g.dataset.goal;saveProfile(p);renderPage(PAGE);toast(t('goalSet',{g:t('goal_'+p.goal)}),{type:'good',icon:GOAL_ICONS[p.goal],sub:t('kcalPerDay',{n:fmtN(myPlan().target)})})}return}
    const tp=e.target.closest('[data-tip]');if(tp){nextTip(tp.dataset.tip,tp.closest('[data-tipcard]'));return}
    const act=e.target.closest('[data-act]');if(act){if(act.dataset.act==='editProfile'||act.dataset.act==='setup')openOnboarding(true)}
  });
}

/* ---------- add food sheet ---------- */
function openAddFood(meal){
  const wrap=document.createElement('div');wrap.className='picker-sheet';
  wrap.innerHTML=`<div class="seg lg" id="afSeg"><button data-v="search">${esc(t('searchFood'))}</button><button data-v="quick">${esc(t('quickAdd'))}</button></div><div id="afBody" style="margin-top:12px"></div>`;
  const b=openSheet({title:t('addTo',{m:t('meal_'+meal)}),body:wrap,tall:true});
  const body=$('#afBody',b);
  const search=()=>{
    body.innerHTML=`<div class="search"><svg class="ico sm"><use href="#i-search"/></svg><input id="afQ" type="search" autocomplete="off" enterkeyhint="search" placeholder="${esc(t('searchFoodPh'))}"><button class="clear" aria-label="Clear">${ico('x','xs')}</button></div><div id="afRes"></div>`;
    const q=$('#afQ',body),res=$('#afRes',body);
    const row=(f,i)=>`<button class="ex-row" data-db="${f.id}" style="--i:${i}"><span class="tile sm" style="--c:#ff9f0a">${ico('food','sm')}</span><span class="ex-main"><span class="ex-name">${esc(foodName(f))}</span><span class="ex-meta num">${fmtN(f.kcal)} kcal · ${NF1.format(f.p)} g ${esc(t('proteinShort'))} / 100 g</span></span>${ico('plus','sm')}</button>`;
    const draw=()=>{
      const nq=norm(q.value).trim();$('.search',body).classList.toggle('has',!!nq);
      if(!nq){const rec=recentFoods();res.innerHTML=(rec.length?`<div class="ps-label">${esc(t('recent'))}</div><div class="list">${rec.map((x,i)=>`<button class="ex-row" data-recent="${i}"><span class="tile sm" style="--c:#30d158">${ico('undo','sm')}</span><span class="ex-main"><span class="ex-name">${esc(x.name)}</span><span class="ex-meta num">${x.g?fmtN(x.g)+' g · ':''}${fmtN(x.kcal)} kcal</span></span>${ico('plus','sm')}</button>`).join('')}</div>`:'')+`<div class="ps-label">${esc(t('foodDb'))}</div><div class="list">${FOODS.map(row).join('')}</div>`;res._rec=rec;return}
      const hits=FOODS.filter(f=>[f.de,f.en,f.tr].some(n=>norm(n).includes(nq)));
      res.innerHTML=hits.length?`<div class="list">${hits.map(row).join('')}</div>`:`<div class="empty">${ico('search')}<b>${esc(t('noResults'))}</b>${esc(t('foodNoHit'))}<div style="margin-top:14px"><button class="btn btn-secondary btn-sm" data-goquick="1">${ico('plus','xs')}${esc(t('quickAdd'))}</button></div></div>`;
    };
    draw();q.addEventListener('input',draw);$('.clear',body).addEventListener('click',()=>{q.value='';draw();q.focus()});
    res.onclick=e=>{
      const d=e.target.closest('[data-db]');if(d){foodAmount(FOOD_MAP.get(d.dataset.db),meal);return}
      const r=e.target.closest('[data-recent]');if(r){const x=res._rec[parseInt(r.dataset.recent,10)];if(x.food&&FOOD_MAP.get(x.food))foodAmount(FOOD_MAP.get(x.food),meal,x.g);else{saveFoodEntry(Object.assign({},x,{meal}));closeSheet()}return}
      if(e.target.closest('[data-goquick]')){$('#afSeg',b).querySelector('[data-v="quick"]').click()}
    };
  };
  const quick=()=>{
    body.innerHTML=`<div class="form-row"><label class="label" for="qfName">${esc(t('foodNameLbl'))}</label><input class="input" id="qfName" maxlength="60" placeholder="${esc(t('foodNamePh'))}" autocomplete="off"></div>
      <div class="two form-row"><div><label class="label" for="qfKcal">kcal</label><input class="input num" id="qfKcal" inputmode="numeric" placeholder="0"></div><div><label class="label" for="qfP">${esc(t('protein'))} (g)</label><input class="input num" id="qfP" inputmode="decimal" placeholder="0"></div></div>
      <div class="two form-row"><div><label class="label" for="qfC">${esc(t('carbs'))} (g)</label><input class="input num" id="qfC" inputmode="decimal" placeholder="0"></div><div><label class="label" for="qfF">${esc(t('fat'))} (g)</label><input class="input num" id="qfF" inputmode="decimal" placeholder="0"></div></div>
      <div class="sheet-actions"><button class="btn btn-primary" id="qfAdd">${ico('plus','xs')}${esc(t('add'))}</button></div>`;
    $('#qfAdd',body).onclick=()=>{
      const kcal=parseInt($('#qfKcal',body).value,10),num=id=>Math.max(0,parseNum($('#'+id,body).value)||0);
      if(!(kcal>0&&kcal<10000)){toast(t('kcalRequired'),{type:'bad'});$('#qfKcal',body).focus();return}
      saveFoodEntry({meal,name:$('#qfName',body).value.trim()||t('quickAdd'),kcal,p:num('qfP'),c:num('qfC'),f:num('qfF')});closeSheet();
    };
  };
  seg($('#afSeg',b),'search',v=>v==='search'?search():quick());
  search();
}
function foodAmount(food,meal,g0,editId){
  let g=g0||food.g;
  const b=openSheet({title:foodName(food),body:`
    <div class="amount"><button class="icon-btn lg" data-g="-10" aria-label="−10 g">${ico('minus')}</button><div class="am-val"><input class="num" id="amG" inputmode="numeric" value="${g}" aria-label="g"><span>g</span></div><button class="icon-btn lg" data-g="10" aria-label="+10 g">${ico('plus')}</button></div>
    <div class="chips am-chips">${[[food.g,t('portion')],[100,'100 g'],[food.g*2,'2 × '+t('portion')],[Math.round(food.g/2),'½ '+t('portion')]].map(([v,l])=>`<button class="chip" data-set="${v}">${esc(l)} · ${fmtN(v)} g</button>`).join('')}</div>
    <div class="stat-grid" id="amStats"></div>
    <div class="sheet-actions">${editId?`<button class="btn btn-danger" data-del="1" style="flex:0 0 auto;width:56px" aria-label="${esc(t('delete'))}">${ico('trash','sm')}</button>`:''}<button class="btn btn-primary" data-ok="1">${ico(editId?'check':'plus','xs')}${esc(t(editId?'save':'add'))}</button></div>`});
  const inp=$('#amG',b);
  const draw=()=>{g=clamp(parseInt(inp.value,10)||0,0,5000);const x=foodFromDb(food,g);$('#amStats',b).innerHTML=`<div class="stat-box"><b class="num">${fmtN(x.kcal)}</b><span>kcal</span></div><div class="stat-box"><b class="num">${NF1.format(x.p)} g</b><span>${esc(t('protein'))}</span></div><div class="stat-box"><b class="num">${NF1.format(x.c)} / ${NF1.format(x.f)}</b><span>${esc(t('carbs'))} / ${esc(t('fat'))}</span></div>`};
  draw();inp.addEventListener('input',draw);inp.addEventListener('focus',()=>setTimeout(()=>inp.select(),0));
  b.onclick=e=>{
    const st=e.target.closest('[data-g]');if(st){inp.value=Math.max(0,(parseInt(inp.value,10)||0)+parseInt(st.dataset.g,10));draw();haptic(3);return}
    const c=e.target.closest('[data-set]');if(c){inp.value=c.dataset.set;draw();haptic(4);return}
    if(e.target.closest('[data-del]')){deleteFoodEntry(editId);closeSheet();return}
    if(e.target.closest('[data-ok]')){if(!(g>0)){inp.focus();return}const x=Object.assign(foodFromDb(food,g),{meal});if(editId){x.id=editId}saveFoodEntry(x);closeSheet()}
  };
}
function openFoodEntry(id){
  const x=getFood().find(f=>f.id===id);if(!x)return;
  if(x.food&&FOOD_MAP.get(x.food))return foodAmount(FOOD_MAP.get(x.food),x.meal,x.g,id);
  const b=openSheet({title:x.name,body:`<div class="stat-grid"><div class="stat-box"><b class="num">${fmtN(x.kcal)}</b><span>kcal</span></div><div class="stat-box"><b class="num">${NF1.format(x.p)} g</b><span>${esc(t('protein'))}</span></div><div class="stat-box"><b class="num">${NF1.format(x.c)} / ${NF1.format(x.f)}</b><span>${esc(t('carbs'))} / ${esc(t('fat'))}</span></div></div><div class="sheet-actions"><button class="btn btn-danger" data-del="1">${ico('trash','xs')}${esc(t('delete'))}</button></div>`});
  b.onclick=e=>{if(e.target.closest('[data-del]')){deleteFoodEntry(id);closeSheet()}};
}
function saveFoodEntry(x){
  const prev=rankOf(totalXp),all=getFood(),d=x.d||foodDay();
  if(x.id){const i=all.findIndex(f=>f.id===x.id);if(i>=0)all[i]=Object.assign(all[i],x,{d:all[i].d})}
  else{x.id=Date.now();x.d=d;all.push(x)}
  saveFood(all);haptic(10);
  const pl=myPlan(),tot=foodTotals(foodOn(d));
  toast(x.name,{type:'good',icon:'food',sub:'+'+fmtN(x.kcal)+' kcal'+(pl?' · '+t('kcalLeftShort',{n:fmtN(dayTargetFor(d,pl)-tot.kcal)}):''),dur:2600});
  afterAction(prev);renderPage(PAGE);
}
function deleteFoodEntry(id){
  const all=getFood(),x=all.find(f=>f.id===id);if(!x)return;
  saveFood(all.filter(f=>f.id!==id));renderPage(PAGE);
  toast(t('deleted'),{icon:'trash',sub:x.name,action:{label:t('undo'),fn:()=>{const a=getFood();a.push(x);a.sort((p,q)=>p.id-q.id);saveFood(a);renderPage(PAGE)}}});
}
