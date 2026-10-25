/* ============================================================
   TOOLS
   ============================================================ */
const TMR={end:0,total:0,iv:null};
function startTimer(sec){sec=sec||pref.timer;TMR.total=sec;TMR.end=Date.now()+sec*1000;LS.set('gr_tEnd',TMR.end);LS.set('gr_tTot',sec);runTimer()}
function runTimer(){clearInterval(TMR.iv);$('#timerPill').classList.add('show');tickTimer();TMR.iv=setInterval(tickTimer,250)}
function tickTimer(){
  const left=Math.max(0,TMR.end-Date.now()),s=Math.ceil(left/1000);
  $('#tpTime').textContent=fmtClock(s);$('#tpFg').style.strokeDashoffset=String(100-(left/(TMR.total*1000))*100);
  if(left<=0)finishTimer();
}
function finishTimer(){const p=$('#timerPill');stopTimer();haptic([200,100,200]);SFX.timer();toast(t('restDone'),{type:'good',icon:'timer',sub:t('restDoneSub')});p.classList.add('done');setTimeout(()=>p.classList.remove('done'),600)}
function stopTimer(){clearInterval(TMR.iv);TMR.end=0;LS.del('gr_tEnd');$('#timerPill').classList.remove('show')}
function openTimerSheet(){
  const opts=[30,45,60,90,120,150,180,240,300];
  const b=openSheet({title:t('toolTimer'),body:`<p class="sheet-text">${esc(t('timerPick'))}</p><div class="pct-table">${opts.map(s=>`<button class="btn btn-secondary" data-s="${s}" style="height:58px;font-size:18px;font-weight:750${s===pref.timer?';box-shadow:0 0 0 2px var(--accent) inset':''}">${fmtClock(s)}</button>`).join('')}</div>${TMR.end?`<div class="sheet-actions"><button class="btn btn-danger" data-stop="1">${esc(t('stopTimer'))}</button></div>`:''}`});
  b.onclick=e=>{if(e.target.closest('[data-stop]')){stopTimer();closeSheet();return}const x=e.target.closest('[data-s]');if(!x)return;startTimer(parseInt(x.dataset.s,10));closeSheet()};
}
const PLATES={kg:{bars:[20,15,10],plates:[25,20,15,10,5,2.5,1.25],col:{25:'#e5302a',20:'#1f6fe5',15:'#f2c218',10:'#2fa84f',5:'#f2f2f2','2.5':'#2b2b2b','1.25':'#b9bec6'}},lbs:{bars:[45,35,15],plates:[45,35,25,10,5,2.5],col:{45:'#1f6fe5',35:'#f2c218',25:'#2fa84f',10:'#f2f2f2',5:'#e5302a','2.5':'#2b2b2b'}}};
function openPlates(){
  const u=UNIT(),P=PLATES[u],cur=parseNum($('#inWeight').value);let bar=P.bars[0];
  const b=openSheet({title:t('toolPlates'),body:`<div class="form-row"><label class="label" for="plT">${esc(t('targetWeight'))} (${u})</label><input class="input num" id="plT" inputmode="decimal" value="${cur>0?fmtInput(cur):(u==='kg'?100:225)}" style="font-size:22px;font-weight:750;height:56px"></div><div class="form-row"><label class="label">${esc(t('barWeight'))}</label><div class="seg" id="plBar">${P.bars.map(x=>`<button data-v="${x}">${fmtInput(x)} ${u}</button>`).join('')}</div></div><div class="plate-viz" id="plViz"></div><div class="big-sub" id="plSum"></div><div class="plate-list" id="plList" style="margin-top:12px"></div>`});
  const calc=()=>{
    const target=parseNum($('#plT',b).value)||0;let side=(target-bar)/2;const used=[];
    if(side>0)P.plates.forEach(p=>{while(side>=p-1e-9){used.push(p);side=Math.round((side-p)*1000)/1000}});
    const loaded=bar+used.reduce((a,x)=>a+x,0)*2,mxp=P.plates[0];
    const pl=(arr,dir)=>arr.map((p,i)=>`<span class="plate" style="--w:${p>=10?16:12}px;--h:${36+p/mxp*96}px;--pc:${P.col[String(p)]};--i:${i};--dx:${dir*30}px"></span>`).join('');
    $('#plViz',b).innerHTML=`<div class="barl"></div><div class="sleeve"><span class="collar"></span>${pl(used.slice().reverse(),-1)}</div><div style="width:28%"></div><div class="sleeve">${pl(used,1)}<span class="collar"></span></div>`;
    const counts={};used.forEach(p=>counts[p]=(counts[p]||0)+1);
    $('#plList',b).innerHTML=Object.keys(counts).sort((a,b2)=>b2-a).map(p=>`<span><i style="--pc:${P.col[String(p)]}"></i>${counts[p]} × ${fmtInput(+p)}</span>`).join('');
    $('#plSum',b).innerHTML=target<bar?esc(t('belowBar')):esc(t('perSide'))+': <b class="num" style="color:var(--text)">'+fmtInput(used.reduce((a,x)=>a+x,0))+' '+u+'</b>'+(Math.abs(loaded-target)>1e-6?' · '+esc(t('closest',{v:fmtInput(loaded)+' '+u})):'');
  };
  seg($('#plBar',b),String(bar),v=>{bar=parseFloat(v);calc()});
  $('#plT',b).addEventListener('input',calc);calc();
}
function openOrm(){
  const u=UNIT(),cw=parseNum($('#inWeight').value),cr=parseInt($('#inReps').value,10);
  const b=openSheet({title:t('toolOrm'),body:`<div class="two form-row"><div><label class="label" for="oW">${esc(t('weight'))} (${u})</label><input class="input num" id="oW" inputmode="decimal" value="${cw>0?fmtInput(cw):''}" placeholder="0" style="font-size:20px;font-weight:750"></div><div><label class="label" for="oR">${esc(t('reps'))}</label><input class="input num" id="oR" inputmode="numeric" value="${cr>0?cr:''}" placeholder="0" style="font-size:20px;font-weight:750"></div></div><div class="big-num num" id="oVal">–</div><div class="big-sub" id="oSub">${esc(t('ormHint'))}</div><div class="pct-table" id="oTab"></div>`});
  const calc=()=>{const w=parseNum($('#oW',b).value),r=parseInt($('#oR',b).value,10);
    if(!(w>0&&r>0)){$('#oVal',b).textContent='–';$('#oTab',b).innerHTML='';return}
    const brz=r<37?w*36/(37-r):w,ep=w*(1+r/30),est=r===1?w:(r<=12?brz:ep);
    $('#oVal',b).textContent=fmtInput(Math.round(est*10)/10)+' '+u;
    $('#oSub',b).textContent='Brzycki '+fmtInput(Math.round(brz*10)/10)+' · Epley '+fmtInput(Math.round(ep*10)/10);
    const rp={95:2,90:4,85:6,80:8,75:10,70:12,65:15,60:18,50:25};
    $('#oTab',b).innerHTML=[95,90,85,80,75,70,65,60,50].map(p=>`<div><b class="num">${fmtInput(Math.round(est*p/100*2)/2)}</b><span>${p}% · ~${rp[p]} ${esc(t('repsShort'))}</span></div>`).join('');
  };
  b.oninput=calc;calc();
}
function openLadder(){
  const cur=rankOf(totalXp);let html='';
  RANKS.forEach((r,i)=>{if(r.sub===1)html+=`<div class="lad-tier">${esc(tierName(r.tier))}</div>`;
    html+=`<div class="lad${i===cur?' cur':''}${i>cur?' locked':''}" style="--tier:${tierColor(r.tier)}" ${i===cur?'id="ladCur"':''}>${emblem(i)}<div class="lad-main"><div class="lad-name${r.tier===10?' tier-fire':''}">${esc(rankName(i))}</div><div class="lad-xp">${fmtN(r.xp)} XP</div></div>${i===cur?`<span class="pill accent">${esc(t('you'))}</span>`:i<cur?`<span class="dim">${ico('check','sm')}</span>`:''}</div>`});
  const b=openSheet({title:t('rankLadder'),tall:true,body:`<p class="sheet-text" style="font-size:13.5px">${esc(t('ladderInfo'))}</p><div class="ladder">${html}</div>`});
  setTimeout(()=>{const c=$('#ladCur',b);if(c)c.scrollIntoView({block:'center',behavior:reduceMotion()?'auto':'smooth'})},380);
}

/* ---------- Celebration ---------- */
function celebrate(i){
  const c=$('#celebrate'),r=RANKS[i];
  c.style.setProperty('--tier',TIERS[r.tier].c[1]);
  $('#celEmb').innerHTML=emblem(i);$('#celEyebrow').textContent=t('rankUp');
  const n=$('#celName');n.textContent=rankName(i);n.classList.remove('long');n.classList.toggle('tier-fire',r.tier===10);
  $('#celSub').textContent=RANKS[i+1]?t('rankUpSub',{xp:fmtN(Math.max(0,RANKS[i+1].xp-totalXp)),rank:rankName(i+1)}):t('maxRank');
  $('#celBtn').textContent=t('continue');
  c.classList.remove('show');void c.offsetWidth;c.classList.add('show');
  releaseCelebrate=BackStack.push('celebrate',()=>closeCelebrate(true));
  haptic([20,60,30,60,90]);SFX.rank();burst(TIERS[r.tier].c.concat(['#ffffff']));
  setTimeout(()=>$('#celBtn').focus({preventScroll:true}),900);
}
let releaseCelebrate=null;
function closeCelebrate(fromBack){
  const c=$('#celebrate');if(!c.classList.contains('show'))return;
  c.classList.remove('show');
  const rel=releaseCelebrate;releaseCelebrate=null;if(rel&&fromBack!==true)rel();
  rewardClosed();
}
function burst(colors){
  if(reduceMotion())return;
  const cv=$('#fx'),ctx=cv.getContext('2d'),dpr=Math.min(2,devicePixelRatio||1),W=innerWidth,H=innerHeight;
  cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  const cx=W/2,cy=H/2-80,P=[];
  for(let i=0;i<180;i++){const a=Math.random()*Math.PI*2,s=3+Math.random()*11;P.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-4,r:2.5+Math.random()*4.5,c:colors[i%colors.length],rot:Math.random()*6,vr:(Math.random()-.5)*.35,sh:i%3,life:1,d:.005+Math.random()*.008})}
  const t0=performance.now();
  (function f(){ctx.clearRect(0,0,W,H);let alive=0;
    for(const p of P){if(p.life<=0)continue;alive++;p.vx*=.986;p.vy=p.vy*.986+.16;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;p.life-=p.d;
      ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.c;
      if(p.sh===0)ctx.fillRect(-p.r,-p.r/3,p.r*2,p.r/1.5);else if(p.sh===1){ctx.beginPath();ctx.arc(0,0,p.r/1.5,0,6.283);ctx.fill()}else{ctx.beginPath();ctx.moveTo(0,-p.r);ctx.lineTo(p.r*.85,p.r*.6);ctx.lineTo(-p.r*.85,p.r*.6);ctx.closePath();ctx.fill()}
      ctx.restore()}
    if(alive&&performance.now()-t0<6000)requestAnimationFrame(f);else ctx.clearRect(0,0,W,H)})();
}

