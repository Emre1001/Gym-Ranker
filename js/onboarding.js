/* ============================================================
   ONBOARDING — first start: name, body, activity, goal → your plan
   Also used to edit the profile later (edit = true skips the welcome).
   ============================================================ */
const OB={el:null,step:0,first:0,draft:null,edit:false,release:null};
const OB_STEPS=['welcome','name','body','activity','goal','plan'];
function openOnboarding(edit){
  if(OB.el)return;
  const p=getProfile();
  OB.edit=!!edit;OB.first=edit?1:0;OB.step=OB.first;
  OB.draft=Object.assign({name:'',sex:'m',born:new Date().getFullYear()-25,height:178,weight:bodyWeight(),activity:'mod',goal:'cut',pace:'normal',target:null},p||{});
  if(!p||!getWeights().length)OB.draft.weight=p&&p.weight?p.weight:75;
  const el=document.createElement('div');el.id='onboard';el.className='ob';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
  el.innerHTML=`<div class="ob-top"><button class="icon-btn" id="obBack" aria-label="${esc(t('goBack'))}">${ico('chev-l','sm')}</button><div class="ob-dots" id="obDots"></div>${edit?`<button class="icon-btn" id="obClose" aria-label="${esc(t('close'))}">${ico('x','sm')}</button>`:'<span style="width:36px"></span>'}</div><div class="ob-body" id="obBody"></div><div class="ob-foot"><button class="btn btn-primary btn-block btn-log" id="obNext"></button></div>`;
  document.body.appendChild(el);OB.el=el;document.body.classList.add('locked');setInert(true);
  requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{if(OB.el===el)document.body.classList.add('ob-open')},450);
  OB.release=BackStack.push('onboard',obBack);
  $('#obBack',el).onclick=()=>history.back();
  if(edit)$('#obClose',el).onclick=()=>closeOnboarding();
  $('#obNext',el).onclick=obNext;
  el.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();obNext()}});
  obRender(0);
}
function obBack(){
  // called from the back stack: our entry is gone, so put it back unless we leave
  if(OB.step>OB.first){OB.step--;obRender(-1);OB.release=BackStack.push('onboard',obBack);return}
  if(OB.edit){OB.release=null;closeOnboarding(true);return}
  OB.release=BackStack.push('onboard',obBack);
}
function closeOnboarding(fromBack){
  const el=OB.el;if(!el)return;
  const rel=OB.release;OB.release=null;if(rel&&fromBack!==true)rel();
  document.body.classList.remove('ob-open');el.classList.remove('show');document.body.classList.remove('locked');if(!SH.open)setInert(false);
  setTimeout(()=>el.remove(),450);OB.el=null;
}
function obStepper(id,val,unit,step){return `<div class="stepper ob-stepper"><button type="button" data-ob="${id}" data-d="-${step}" aria-label="−">${ico('minus')}</button><div class="obs-val"><input id="${id}" class="num" inputmode="${step<1?'decimal':'numeric'}" value="${val}"><span>${esc(unit)}</span></div><button type="button" data-ob="${id}" data-d="${step}" aria-label="+">${ico('plus')}</button></div>`}
function obRender(dir){
  const d=OB.draft,name=OB_STEPS[OB.step],body=$('#obBody',OB.el);
  const steps=OB_STEPS.slice(OB.first);
  $('#obDots',OB.el).innerHTML=steps.map((s,i)=>`<i class="${i+OB.first<=OB.step?'on':''}"></i>`).join('');
  $('#obBack',OB.el).style.visibility=OB.step>OB.first||OB.edit?'visible':'hidden';
  let h='',next=t('continue');
  if(name==='welcome'){
    h=`<div class="ob-hero">${logoSVG()}</div><h1 class="ob-title">${esc(t('obWelcome'))}</h1><p class="ob-sub">${esc(t('obWelcomeSub'))}</p>
      <div class="ob-feats">${[['bolt','obF1'],['food','obF2'],['trend','obF3'],['spark','obF4']].map(([i,k])=>`<div class="ob-feat">${ico(i,'sm')}<span>${esc(t(k))}</span></div>`).join('')}</div>
      <div class="seg" id="obLang" style="margin-top:22px"><button data-v="system">${esc(t('auto'))}</button><button data-v="de">Deutsch</button><button data-v="en">English</button><button data-v="tr">Türkçe</button></div>`;
    next=t('obStart');
  }else if(name==='name'){
    h=`<h1 class="ob-title">${esc(t('obName'))}</h1><p class="ob-sub">${esc(t('obNameSub'))}</p><input class="input ob-input" id="obName" maxlength="24" autocomplete="given-name" autocapitalize="words" enterkeyhint="next" placeholder="${esc(t('obNamePh'))}" value="${esc(d.name||'')}">`;
  }else if(name==='body'){
    const age=new Date().getFullYear()-d.born;
    h=`<h1 class="ob-title">${esc(t('obBody',{name:d.name}))}</h1><p class="ob-sub">${esc(t('obBodySub'))}</p>
      <label class="label">${esc(t('sex'))}</label><div class="seg lg" id="obSex"><button data-v="m">${esc(t('male'))}</button><button data-v="f">${esc(t('female'))}</button></div>
      <div class="ob-grid"><div><label class="label" for="obAge">${esc(t('age'))}</label>${obStepper('obAge',age,t('yearsShort'),1)}</div><div><label class="label" for="obHeight">${esc(t('height'))}</label>${obStepper('obHeight',d.height,'cm',1)}</div></div>
      <label class="label" for="obWeight">${esc(t('weight'))}</label>${obStepper('obWeight',fmtInput(toDisp(d.weight)),UNIT(),.5)}`;
  }else if(name==='activity'){
    h=`<h1 class="ob-title">${esc(t('obActivity'))}</h1><p class="ob-sub">${esc(t('obActivitySub'))}</p><div class="ob-opts">${Object.keys(ACTIVITY).map(k=>`<button class="ob-opt${d.activity===k?' on':''}" data-opt="activity" data-v="${k}"><b>${esc(t('act_'+k))}</b><span>${esc(t('actd_'+k))}</span></button>`).join('')}</div>`;
  }else if(name==='goal'){
    h=`<h1 class="ob-title">${esc(t('obGoal'))}</h1><p class="ob-sub">${esc(t('obGoalSub'))}</p><div class="ob-opts">${GOALS.map(g=>`<button class="ob-opt has-ico${d.goal===g?' on':''}" data-opt="goal" data-v="${g}"><span class="oo-ico">${ico(GOAL_ICONS[g],'sm')}</span><span class="oo-main"><b>${esc(t('goal_'+g))}</b><span>${esc(t('goald_'+g))}</span></span></button>`).join('')}</div>
      ${(d.goal==='cut'||d.goal==='bulk')&&ageOf(d)>=18?`<label class="label" style="margin-top:18px">${esc(t('pace'))}</label><div class="seg lg" id="obPace">${['slow','normal','fast'].map(v=>`<button data-v="${v}">${esc(t('pace_'+v))}</button>`).join('')}</div>`:''}
      <label class="label" for="obTarget" style="margin-top:18px">${esc(t('targetWeight'))} <span class="dim">(${esc(t('optional'))})</span></label>${obStepper('obTarget',d.target?fmtInput(toDisp(d.target)):'',UNIT(),.5)}`;
  }else if(name==='plan'){
    const pl=planFor(d,d.goal,d.pace,d.weight);
    h=`<h1 class="ob-title">${esc(t('obPlan',{name:d.name}))}</h1><p class="ob-sub">${esc(t('obPlanSub',{g:t('goal_'+d.goal)}))}</p>
      <div class="ob-plan"><div class="op-kcal"><b class="num">${fmtN(pl.target)}</b><span>${esc(t('kcalPerDayShort'))}</span></div>
      <div class="op-range">${esc(t('kcalRange',{lo:fmtN(pl.lo),hi:fmtN(pl.hi)}))}</div>
      ${pl.train?`<div class="op-range">${esc(t('recompDays',{tr:fmtN(pl.train),rest:fmtN(pl.rest)}))}</div>`:''}
      <div class="op-macros"><div><b class="num">${pl.p} g</b><span>${esc(t('protein'))}</span></div><div><b class="num">${pl.c} g</b><span>${esc(t('carbs'))}</span></div><div><b class="num">${pl.f} g</b><span>${esc(t('fat'))}</span></div></div>
      <div class="op-facts"><span>${esc(t('bmr'))} <b class="num">${fmtN(pl.bmr)}</b></span><span>${esc(t('tdee'))} <b class="num">${fmtN(pl.tdee)}</b></span><span>${esc(Math.abs(pl.weekly)<.02?t('weeklyZero'):t('weeklyChange',{v:(pl.weekly>0?'+':'−')+fmtW(Math.abs(pl.weekly))}))}</span></div></div>
      ${ageXpFactor(ageOf(d))>1?`<div class="coach gold">${ico('bolt','sm')}<span>${esc(t('ageBonusInfo',{a:ageOf(d),p:Math.round((ageXpFactor(ageOf(d))-1)*100)}))}</span></div>`:''}
      ${pl.teen?`<p class="set-note warn-note">${ico('info','xs')} ${esc(t('teenNote'))}</p>`:''}
      ${pl.low?`<p class="set-note warn-note">${ico('info','xs')} ${esc(t('lowWarn'))}</p>`:''}<p class="set-note">${esc(t('calcNote'))}</p>`;
    next=OB.edit?t('save'):t('obGo');
  }
  body.innerHTML=h;
  $('#obNext',OB.el).innerHTML=`<span class="btn-label">${esc(next)}${ico('chev-r','sm')}</span>`;
  if(dir&&!reduceMotion())body.animate([{opacity:0,transform:`translateX(${dir*28}px)`},{opacity:1,transform:'none'}],{duration:380,easing:'cubic-bezier(.22,1,.36,1)'});
  body.scrollTop=0;
  if(name==='welcome')seg($('#obLang',body),pref.lang==='system'||!I18N[pref.lang]?'system':pref.lang,v=>{setPref('lang',v);LANG=resolveLang();buildFormatters();applyStatic();obRender(0);renderAll()});
  if(name==='body')seg($('#obSex',body),d.sex,v=>{d.sex=v});
  if(name==='goal'&&$('#obPace',body))seg($('#obPace',body),d.pace||'normal',v=>{d.pace=v});
  if(name==='name'&&(finePointer()||OB.step>OB.first||!OB.edit))setTimeout(()=>{const i=$('#obName',body);if(i&&finePointer())i.focus()},300);
  body.onclick=e=>{
    const s=e.target.closest('[data-ob]');if(s){const inp=$('#'+s.dataset.ob,body),st=parseFloat(s.dataset.d);let v=parseNum(inp.value);if(isNaN(v))v=s.dataset.ob==='obTarget'?toDisp(d.weight):0;v=Math.max(0,Math.round((v+st)*10)/10);inp.value=st%1?fmtInput(v):Math.round(v);haptic(3);return}
    const o=e.target.closest('[data-opt]');if(o){d[o.dataset.opt]=o.dataset.v;haptic(5);if(o.dataset.opt==='goal')obRender(0);else $$('.ob-opt',body).forEach(b=>b.classList.toggle('on',b===o));}
  };
}
function obNext(){
  const d=OB.draft,name=OB_STEPS[OB.step],body=$('#obBody',OB.el);
  const bad=(id,msg)=>{const i=$('#'+id,body);toast(t(msg),{type:'bad'});if(i){i.focus();i.closest('.stepper,.input')&&i.closest('.stepper,.input').animate([{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'none'}],{duration:300})}haptic([30,40,30])};
  if(name==='name'){const v=$('#obName',body).value.trim();if(!v)return bad('obName','obNameReq');d.name=v.slice(0,24)}
  if(name==='body'){
    const age=parseInt($('#obAge',body).value,10),hgt=parseInt($('#obHeight',body).value,10),kg=fromDisp(parseNum($('#obWeight',body).value));
    if(!(age>=12&&age<=99))return bad('obAge','obAgeReq');if(!(hgt>=120&&hgt<=230))return bad('obHeight','obHeightReq');if(!(kg>=30&&kg<=300))return bad('obWeight','invalidWeight');
    d.born=new Date().getFullYear()-age;d.height=hgt;d.weight=Math.round(kg*10)/10;
  }
  if(name==='goal'){const raw=$('#obTarget',body).value.trim();if(raw){const kg=fromDisp(parseNum(raw));if(!(kg>=30&&kg<=300))return bad('obTarget','invalidWeight');d.target=Math.round(kg*10)/10}else d.target=null;
    if(d.target&&d.goal==='cut'&&d.target>=d.weight)return bad('obTarget','obTargetCut');if(d.target&&d.goal==='bulk'&&d.target<=d.weight)return bad('obTarget','obTargetBulk')}
  if(name==='plan')return obFinish();
  haptic(8);OB.step++;obRender(1);
}
function obFinish(){
  const d=OB.draft,old=getProfile(),first=!old;
  const p=Object.assign({},old||{},d);if(first)p.created=Date.now();
  if(!p.startWeight||first)p.startWeight=d.weight;
  saveProfile(p);
  const ws=getWeights(),last=ws[ws.length-1];if(!last||Math.abs(last.kg-d.weight)>.05)logWeight(d.weight);
  closeOnboarding();
  haptic([12,40,20]);
  setTimeout(()=>{
    toast(t(first?'obDone':'profileSaved',{name:p.name}),{type:'good',icon:first?'spark':'check',sub:t('kcalPerDay',{n:fmtN(myPlan().target)}),dur:4500});
    const prev=rankOf(totalXp);afterAction(prev);renderAll();
  },350);
}
