/* ============================================================
   BODY — weight journey, steps, measurements, tips
   ============================================================ */
let WRANGE=LS.get('gr_wRange','90');
function renderBody(){
  const p=getProfile(),w=getWeights(),cur=bodyWeight(),s0=startWeight(),pl=myPlan();
  $('#bodyEyebrow').textContent=p?t('goal_'+p.goal)+(p.target?' · '+t('targetShort',{v:fmtW(p.target)}):''):t('titleBody');
  // weight journey
  const diff=cur-s0,rate=weeklyRate(),eta=goalEta();
  let journey='';
  if(p&&p.target&&Math.abs(p.target-s0)>.1){
    const pct=clamp((cur-s0)/(p.target-s0),0,1);
    journey=`<div class="journey"><div class="jr-top"><span class="num">${fmtW(s0)}</span><span class="jr-pct num">${Math.round(pct*100)} %</span><span class="num">${fmtW(p.target)}</span></div><div class="bar jr-bar"><i style="width:${pct*100}%"></i></div>
      <div class="jr-sub">${eta===0?esc(t('goalReachedW')):eta?esc(t('etaText',{d:fmtDate(eta,{day:'numeric',month:'long',year:'numeric'})})):esc(t('etaNone'))}</div></div>`;
  }
  const kpi=(label,val,sub)=>`<div class="kv"><b class="num">${val}</b><span>${esc(label)}</span>${sub?`<small>${sub}</small>`:''}</div>`;
  const sign=v=>(v>0?'+':v<0?'−':'±')+fmtW(Math.abs(v));
  const good=v=>!p?'':(p.goal==='cut'?v<0:p.goal==='bulk'?v>0:Math.abs(v)<.5)?'up':'down';
  const weightCard=`<div class="card weight-card span"><div class="card-head"><div><h3 class="card-title">${esc(t('weightJourney'))}</h3><div class="card-sub">${w.length?esc(t('lastWeighIn',{d:relDay(keyToDate(w[w.length-1].d).getTime())})):esc(t('noWeighIns'))}</div></div><button class="btn btn-primary btn-sm" data-act="weigh">${ico('plus','xs')}${esc(t('logWeight'))}</button></div>
    <div class="w-big"><b class="num">${fmtW(cur,false)}</b><span>${UNIT()}</span>${w.length>1?`<span class="pill ${good(diff)==='up'?'good':'neutral'} num">${sign(diff)} ${esc(t('sinceStart'))}</span>`:''}</div>
    ${journey}
    <div class="kv-row">${kpi(t('start'),fmtW(s0))}${kpi(t('perWeek'),rate===null?'–':`<span class="delta ${good(rate)}">${sign(rate)}</span>`)}${kpi(p&&p.target?t('toGoal'):'BMI',p&&p.target?fmtW(Math.abs(p.target-cur)):(p&&p.height?NF1.format(bmiOf(cur,p.height)):'–'))}</div>
    <div class="seg" id="wRange" style="margin:16px 0 4px"><button data-v="30">${esc(t('days30'))}</button><button data-v="90">${esc(t('days90'))}</button><button data-v="all">${esc(t('all'))}</button></div>
    <div class="chart" id="wChart"></div><div class="chart-x" id="wChartX"></div>
    ${w.length<2?`<p class="set-note" style="margin:10px 4px 0">${esc(t('weightChartHint'))}</p>`:''}
  </div>`;
  // steps
  const st=stepsOn(),sg=stepGoal(),re=stepReaction(st),days=[];for(let i=6;i>=0;i--){const d=dayKey(addDays(Date.now(),-i));days.push({d,v:stepsOn(d)})}
  const mx=Math.max(sg,...days.map(x=>x.v))*1.08,wk=days.reduce((a,x)=>a+x.v,0);
  const stepsCard=`<div class="card steps-card"><div class="card-head"><div><h3 class="card-title">${esc(t('steps'))}</h3><div class="card-sub num">${esc(t('stepsWeek',{n:fmtN(wk)}))}</div></div><button class="btn btn-primary btn-sm" data-act="steps">${ico('plus','xs')}${esc(t('logSteps'))}</button></div>
    <div class="w-big"><b class="num">${fmtN(st)}</b><span>/ ${fmtN(sg)}</span>${st?`<span class="pill neutral num">≈ ${fmtN(stepsKcal(st))} kcal</span>`:''}</div>
    ${re?`<div class="coach ${re.tone}">${ico(re.tone==='gold'?'crown':re.tone==='good'?'check':'steps','sm')}<span>${esc(t(re.k,{n:fmtN(Math.max(0,re.left||0)),goal:fmtN(sg)}))}</span></div>`:`<div class="coach">${ico('steps','sm')}<span>${esc(t('stepsAsk'))}</span></div>`}
    <div class="bars goal-bars">${days.map((x,i)=>`<div class="b${x.v?' has':''}${x.v>=sg?' met':''}${x.d===dayKey()?' today':''}"><i data-v="${x.v?fmtNC(x.v):0}" style="height:${Math.max(3,x.v/mx*100)}%;--i:${i}"></i><u style="bottom:calc(${sg/mx*100}% * .82 + 18px)"></u><em>${esc(fmtDate(keyToDate(x.d),{weekday:'narrow'}))}</em></div>`).join('')}</div></div>`;
  // measurements
  const ms=getMeasures(),last=ms[ms.length-1],prev=ms[ms.length-2],bf=last?(last.bf||navyBodyFat(last,p)):null;
  const mrow=k=>{const v=last&&last[k],pv=prev&&prev[k],d=v&&pv?v-pv:0;return `<div class="m-cell"><span>${esc(t('m_'+k))}</span><b class="num">${v?NF1.format(v)+' cm':'–'}</b>${d?`<small class="num delta ${(k==='waist'||k==='hip')===(d<0)?'up':'down'}">${d>0?'+':'−'}${NF1.format(Math.abs(d))}</small>`:''}</div>`};
  const measCard=`<div class="card"><div class="card-head"><div><h3 class="card-title">${esc(t('measurements'))}</h3><div class="card-sub">${last?esc(relDay(keyToDate(last.d).getTime())):esc(t('noMeasures'))}</div></div><button class="btn btn-secondary btn-sm" data-act="measure">${ico('ruler','xs')}${esc(t('measure'))}</button></div>
    <div class="m-grid">${MEASURES.map(mrow).join('')}<div class="m-cell hl"><span>${esc(t('bodyFat'))}</span><b class="num">${bf?NF1.format(bf)+' %':'–'}</b>${last&&!last.bf&&bf?`<small>${esc(t('navyEst'))}</small>`:''}</div><div class="m-cell hl"><span>BMI</span><b class="num">${p&&p.height?NF1.format(bmiOf(cur,p.height)):'–'}</b></div></div></div>`;
  $('#bodyView').innerHTML=`<div class="grid-2">${weightCard}<div class="col">${stepsCard}</div><div class="col">${measCard}${tipCard('body')}</div></div>`;
  seg($('#wRange'),WRANGE,v=>{WRANGE=v;LS.set('gr_wRange',v);mountWeightChart()});
  mountWeightChart();
}
function mountWeightChart(){
  const box=$('#wChart');if(!box)return;
  const p=getProfile(),all=weightTrend(),from=WRANGE==='all'?0:addDays(startOfDay(),-parseInt(WRANGE,10));
  const data=all.filter(x=>keyToDate(x.d).getTime()>=from);
  if(data.length<2){box.innerHTML=`<div class="chart-empty">${ico('trend')}</div>`;$('#wChartX').innerHTML='';return}
  const W=Math.max(260,box.clientWidth||600),H=box.clientHeight||190,top=22,bot=10;
  const t0=keyToDate(data[0].d).getTime(),t1=keyToDate(data[data.length-1].d).getTime(),span=Math.max(MS_DAY,t1-t0);
  const vals=data.map(x=>x.kg).concat(p&&p.target?[p.target]:[]);let mn=Math.min(...vals),mxv=Math.max(...vals);const pad=Math.max(.5,(mxv-mn)*.12);mn-=pad;mxv+=pad;
  const X=d=>(keyToDate(d).getTime()-t0)/span*W,Y=v=>top+(H-top-bot)*(1-(v-mn)/(mxv-mn));
  const pts=data.map(x=>[X(x.d),Y(x.kg)]),avg=data.map(x=>[X(x.d),Y(x.avg)]);
  const goal=p&&p.target&&p.target>=mn&&p.target<=mxv?`<line class="goal-line" x1="0" x2="${W}" y1="${Y(p.target)}" y2="${Y(p.target)}"/><text class="goal-lbl" x="${W-4}" y="${Y(p.target)-6}" text-anchor="end">${esc(t('goalShort'))} ${esc(fmtW(p.target))}</text>`:'';
  box.innerHTML=`<svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="gAreaW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs><g class="grid">${[0,1,2,3].map(i=>`<line x1="0" x2="${W}" y1="${top+(H-top-bot)*i/3}" y2="${top+(H-top-bot)*i/3}"/>`).join('')}</g>${goal}<path class="area" style="fill:url(#gAreaW)" d="${smoothPath(avg)} L${W},${H} L0,${H} Z"/>${pts.map(q=>`<circle class="w-dot" cx="${q[0]}" cy="${q[1]}" r="2.6"/>`).join('')}<path class="line" pathLength="1" d="${smoothPath(avg)}"/><g class="cursor"><line y1="0" y2="${H}"/><circle r="5.5"/></g></svg><div class="chart-tip"></div>`;
  $('#wChartX').innerHTML=`<span>${esc(fmtDate(t0,{day:'numeric',month:'short'}))}</span><span>${esc(t('trend7'))}</span><span>${esc(fmtDate(t1,{day:'numeric',month:'short'}))}</span>`;
  const cur=$('.cursor',box),tip=$('.chart-tip',box),ln=$('line',cur),dot=$('circle',cur);
  const at=x=>{let i=0,b=1e9;pts.forEach((q,k)=>{const dd=Math.abs(q[0]-x);if(dd<b){b=dd;i=k}});const q=avg[i];ln.setAttribute('x1',q[0]);ln.setAttribute('x2',q[0]);dot.setAttribute('cx',q[0]);dot.setAttribute('cy',q[1]);tip.style.left=clamp(q[0],56,W-56)+'px';tip.innerHTML=`${fmtW(data[i].kg)} · Ø ${fmtW(data[i].avg)}<small>${esc(fmtDate(keyToDate(data[i].d),{weekday:'short',day:'numeric',month:'short'}))}</small>`;if(box._i!==i){box._i=i;haptic(2)}};
  const mv=e=>{const r=box.getBoundingClientRect();box.classList.add('scrub');at((e.clientX-r.left)*W/r.width)};
  box.onpointerdown=mv;box.onpointermove=e=>{if(e.pointerType==='mouse'||e.buttons)mv(e)};
  box.onpointerleave=()=>box.classList.remove('scrub');box.onpointerup=e=>{if(e.pointerType!=='mouse')setTimeout(()=>box.classList.remove('scrub'),1200)};
}

/* ---------- sheets ---------- */
function numberSheet({title,label,value,step,unit,decimals,chips,note,onSave}){
  const b=openSheet({title,body:`
    ${note?`<p class="sheet-text">${note}</p>`:''}
    <div class="amount"><button class="icon-btn lg" data-d="-1" aria-label="−">${ico('minus')}</button><div class="am-val"><input class="num" id="nsV" inputmode="${decimals?'decimal':'numeric'}" value="${value}" aria-label="${esc(label)}"><span>${esc(unit)}</span></div><button class="icon-btn lg" data-d="1" aria-label="+">${ico('plus')}</button></div>
    ${chips?`<div class="chips am-chips">${chips.map(c=>`<button class="chip" data-add="${c}">+${fmtN(c)}</button>`).join('')}</div>`:''}
    <div class="sheet-actions"><button class="btn btn-primary" data-ok="1">${ico('check','xs')}${esc(t('save'))}</button></div>`});
  const inp=$('#nsV',b);
  const val=()=>parseNum(inp.value)||0,set=v=>{inp.value=decimals?fmtInput(Math.max(0,Math.round(v*10)/10)):Math.max(0,Math.round(v))};
  b.onclick=e=>{
    const d=e.target.closest('[data-d]');if(d){set(val()+parseInt(d.dataset.d,10)*step);haptic(3);return}
    const a=e.target.closest('[data-add]');if(a){set(val()+parseInt(a.dataset.add,10));haptic(4);return}
    if(e.target.closest('[data-ok]'))onSave(val());
  };
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();onSave(val())}});
  inp.addEventListener('focus',()=>setTimeout(()=>inp.select(),0));
}
function openWeightSheet(){
  const last=getWeights().slice(-1)[0];
  numberSheet({title:t('logWeight'),label:t('weight'),value:fmtInput(toDisp(bodyWeight())),step:.1,unit:UNIT(),decimals:true,
    note:last?esc(t('lastValue',{v:fmtW(last.kg),d:relDay(keyToDate(last.d).getTime())})):'',
    onSave:v=>{
      const kg=fromDisp(v);if(!(kg>25&&kg<400)){toast(t('invalidWeight'),{type:'bad'});return}
      const prev=rankOf(totalXp),before=getWeights().filter(x=>x.d!==dayKey()).slice(-1)[0];
      logWeight(kg);const p=getProfile();if(p){if(!p.startWeight)p.startWeight=before?before.kg:kg;p.weight=kg;saveProfile(p)}
      closeSheet();haptic(10);
      const d=before?kg-before.kg:0,dir=p?(p.goal==='cut'?-1:p.goal==='bulk'?1:0):0;
      const msg=!before?t('wFirst'):Math.abs(d)<.05?t('wSame'):dir&&Math.sign(d)===dir?t('wGood'):dir?t('wBad'):t('wNeutral');
      toast(fmtW(kg),{type:'good',icon:'scale',sub:(before?(d>0?'+':'−')+fmtW(Math.abs(d))+' · ':'')+msg,dur:4500});
      afterAction(prev);renderPage(PAGE);
    }});
}
function openStepsSheet(){
  numberSheet({title:t('logSteps'),label:t('steps'),value:stepsOn()||'',step:500,unit:t('stepsUnit'),chips:[500,1000,2500,5000],
    note:esc(t('stepsNote',{goal:fmtN(stepGoal())})),
    onSave:v=>{
      if(v<0||v>150000){toast(t('invalidSteps'),{type:'bad'});return}
      const prev=rankOf(totalXp);setSteps(v);closeSheet();haptic(10);
      const re=stepReaction(v);
      if(re)toast(fmtN(v)+' '+t('stepsUnit'),{type:re.tone==='bad'||re.tone==='warn'?'info':'good',icon:re.tone==='gold'?'crown':'steps',sub:t(re.k,{n:fmtN(Math.max(0,re.left||0)),goal:fmtN(stepGoal())}),dur:5000});
      afterAction(prev);renderPage(PAGE);
    }});
}
function openMeasureSheet(){
  const last=getMeasures().slice(-1)[0]||{};
  const field=k=>`<div><label class="label" for="ms_${k}">${esc(t('m_'+k))} (cm)</label><input class="input num" id="ms_${k}" inputmode="decimal" value="${last[k]?fmtInput(last[k]):''}" placeholder="–"></div>`;
  const b=openSheet({title:t('measurements'),body:`<p class="sheet-text">${esc(t('measureNote'))}</p><div class="m-form">${MEASURES.map(field).join('')}<div><label class="label" for="ms_bf">${esc(t('bodyFat'))} (%)</label><input class="input num" id="ms_bf" inputmode="decimal" value="${last.bf?fmtInput(last.bf):''}" placeholder="${esc(t('optional'))}"></div></div><div class="sheet-actions"><button class="btn btn-primary" data-ok="1">${ico('check','xs')}${esc(t('save'))}</button></div>`});
  b.onclick=e=>{
    if(!e.target.closest('[data-ok]'))return;
    const m={d:dayKey()};let any=false;
    MEASURES.concat(['bf']).forEach(k=>{const v=parseNum($('#ms_'+k,b).value);if(v>0&&v<400){m[k]=Math.round(v*10)/10;any=true}});
    if(!any){toast(t('measureEmpty'),{type:'bad'});return}
    const prev=rankOf(totalXp);saveMeasure(m);closeSheet();toast(t('measureSaved'),{type:'good',icon:'ruler'});afterAction(prev);renderPage(PAGE);
  };
}
function initBody(){
  $('#bodyView').addEventListener('click',e=>{
    const a=e.target.closest('[data-act]');if(a){({weigh:openWeightSheet,steps:openStepsSheet,measure:openMeasureSheet})[a.dataset.act]();return}
    const tp=e.target.closest('[data-tip]');if(tp)nextTip(tp.dataset.tip,tp.closest('[data-tipcard]'));
  });
}
