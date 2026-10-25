/* ============================================================
   Gym Ranker 3 — App
   Data stays 100% compatible with v1/v2 (same localStorage keys).
   ============================================================ */
const VERSION='4.0.0';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const LS={
  get(k,d=null){try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,v)}catch(e){}},
  del(k){try{localStorage.removeItem(k)}catch(e){}},
  json(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},
  setJson(k,v){this.set(k,JSON.stringify(v))}
};
const MS_DAY=86400000,GRACE_DAYS=3,DECAY_RATE=0.02,LBS=2.20462;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad2=n=>String(n).padStart(2,'0');
const dayKey=(ts=Date.now())=>{const d=new Date(ts);return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())};
const keyToDate=k=>{const[y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(ts,n)=>{const d=new Date(ts);d.setDate(d.getDate()+n);return d.getTime()};
const startOfDay=(ts=Date.now())=>{const d=new Date(ts);d.setHours(0,0,0,0);return d.getTime()};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer=()=>matchMedia('(hover:hover) and (pointer:fine)').matches;
const ico=(n,c='')=>`<svg class="ico ${c}"><use href="#i-${n}"/></svg>`;
const parseNum=s=>parseFloat(String(s).trim().replace(',','.'));

/* ---------- Device + preferences ---------- */
const device={
  lang(){const ls=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||'en'];for(const l of ls){const b=String(l).toLowerCase().slice(0,2);if(I18N[b])return b}return 'en'},
  theme(){return matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'},
  unit(){const l=String(navigator.language||'').toLowerCase();return /^(en-us|en-lr|my)\b/.test(l)?'lbs':'kg'}
};
const PREF_KEYS={lang:'gr_lang',theme:'gr_theme',unit:'gr_weightUnit',autoTimer:'gr_autoTimer',timer:'gr_timerDuration',vib:'gr_vibration',sound:'gr_sound',goal:'gr_dailyGoal'};
const pref={
  lang:LS.get('gr_lang','system'),theme:LS.get('gr_theme','system'),unit:LS.get('gr_weightUnit','system'),
  autoTimer:LS.get('gr_autoTimer')!=='false',timer:parseInt(LS.get('gr_timerDuration','90'),10)||90,
  vib:LS.get('gr_vibration')!=='false',sound:LS.get('gr_sound')!=='false',goal:parseInt(LS.get('gr_dailyGoal','0'),10)||0
};
function setPref(k,v){pref[k]=v;LS.set(PREF_KEYS[k],v)}
let LANG='en';
const resolveLang=()=>(pref.lang!=='system'&&I18N[pref.lang])?pref.lang:device.lang();
const UNIT=()=>(pref.unit==='kg'||pref.unit==='lbs')?pref.unit:device.unit();
const THEME=()=>(pref.theme==='light'||pref.theme==='dark')?pref.theme:device.theme();
function locale(){if(LANG==='de')return 'de-DE';if(LANG==='tr')return 'tr-TR';const n=navigator.language||'en-US';return /^en/i.test(n)?n:'en-US'}
function t(k,vars){let s=(I18N[LANG]&&I18N[LANG][k]!=null)?I18N[LANG][k]:(I18N.en[k]!=null?I18N.en[k]:k);if(vars)for(const v in vars)s=s.split('{'+v+'}').join(vars[v]);return s}
let NF,NF1,NFC,RTF;
function buildFormatters(){const l=locale();NF=new Intl.NumberFormat(l,{maximumFractionDigits:0});NF1=new Intl.NumberFormat(l,{maximumFractionDigits:1});NFC=new Intl.NumberFormat(l,{notation:'compact',maximumFractionDigits:1});RTF=new Intl.RelativeTimeFormat(l,{numeric:'auto'})}
const fmtN=v=>NF.format(Math.floor(v+1e-9));
const toDisp=kg=>Math.round((UNIT()==='lbs'?kg*LBS:kg)*10)/10;
const fromDisp=v=>UNIT()==='lbs'?v/LBS:v;
const fmtW=(kg,u=true)=>NF1.format(toDisp(kg))+(u?' '+UNIT():'');
const fmtVol=kg=>{const v=UNIT()==='lbs'?kg*LBS:kg;if(UNIT()==='kg'&&v>=1000)return NF1.format(v/1000)+' t';return NFC.format(v)+' '+UNIT()};
const fmtInput=v=>{const s=String(Math.round(v*100)/100);return LANG==='en'?s:s.replace('.',',')};
const fmtClock=s=>Math.floor(s/60)+':'+pad2(Math.max(0,s%60));
const fmtDate=(ts,o={weekday:'long',day:'numeric',month:'long'})=>new Intl.DateTimeFormat(locale(),o).format(ts);
const fmtTime=ts=>new Intl.DateTimeFormat(locale(),{hour:'2-digit',minute:'2-digit'}).format(ts);
const fmtMult=m=>'×'+NF1.format(m).replace(/^(\d+)$/,'$1'+(LANG==='en'?'.0':',0'));
function relDay(ts){const d=Math.round((startOfDay(ts)-startOfDay())/MS_DAY);if(d>-7)return RTF.format(d,'day');return fmtDate(ts,{day:'numeric',month:'short',year:d<-300?'numeric':undefined})}
function relIn(ms){const h=ms/3600000;if(h<1)return RTF.format(Math.max(1,Math.round(ms/60000)),'minute');if(h<36)return RTF.format(Math.round(h),'hour');return RTF.format(Math.round(h/24),'day')}

/* ---------- Haptics + sound ---------- */
const haptic=p=>{if(pref.vib&&navigator.vibrate){try{navigator.vibrate(p)}catch(e){}}};
let AC=null;
function tone(seq){if(!pref.sound)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();const t0=AC.currentTime+.01;seq.forEach(([f,at,d,v])=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(AC.destination);g.gain.setValueAtTime(0,t0+at);g.gain.linearRampToValueAtTime(v||.16,t0+at+.012);g.gain.exponentialRampToValueAtTime(.0001,t0+at+d);o.start(t0+at);o.stop(t0+at+d+.05)})}catch(e){}}
const SFX={
  timer:()=>tone([[880,0,.35],[1318.5,.16,.7]]),
  rank:()=>tone([[523.25,0,.45],[659.25,.11,.45],[783.99,.22,.5],[1046.5,.33,1.1,.18]]),
  pr:()=>tone([[987.77,0,.25,.12],[1318.5,.09,.55,.12]]),
  quest:()=>tone([[659.25,0,.18,.12],[987.77,.08,.35,.12]]),
  skill:()=>tone([[392,0,.3,.14],[587.33,.1,.3,.14],[783.99,.2,.35,.14],[1174.66,.32,.9,.16]])
};

/* ---------- Ranks ---------- */
const TIERS=[
  {id:'holz',c:['#e2b07a','#a8723f','#5c3a1c']},
  {id:'bronze',c:['#f6c08d','#cd7f32','#7a4520']},
  {id:'stahl',c:['#e3e6eb','#9399a5','#4b515c']},
  {id:'silber',c:['#ffffff','#cdd2db','#7f8796']},
  {id:'gold',c:['#ffeaa3','#f6b92c','#a66a04']},
  {id:'diamant',c:['#d2f6ff','#3fbdf3','#1460b0']},
  {id:'emerald',c:['#c2ffe4','#2bd396','#08734d']},
  {id:'ruby',c:['#ffbac6','#f43f5e','#8a0c2b']},
  {id:'obsidian',c:['#dccfff','#8655ff','#2a136e']},
  {id:'gymrat',c:['#ffc9ff','#d946ef','#741391']},
  {id:'champion',c:['#fff3ad','#ff9a1f','#df2219']}
];
const RANKS=[];
(()=>{let xp=0,step=1000;TIERS.forEach((tr,ti)=>{for(let i=1;i<=3;i++){RANKS.push({tier:ti,sub:i,xp:Math.floor(xp)});xp+=step;step*=1.40}})})();
const ROMAN=['I','II','III'];
const tierName=ti=>t('tier_'+TIERS[ti].id);
const rankName=i=>tierName(RANKS[i].tier)+' '+ROMAN[RANKS[i].sub-1];
const tierColor=ti=>TIERS[ti].c[1];
function rankOf(xp){let i=0;for(let k=0;k<RANKS.length;k++){if(xp>=RANKS[k].xp)i=k;else break}return i}
let _uid=0;
function emblemTier(tier,sub,chev=true){
  const[c1,c2,c3]=TIERS[tier].c,id='em'+(++_uid);
  const ys=sub===1?[60]:sub===2?[53,67]:[46,59,72];
  const chevs=chev?ys.map(y=>`<path d="M35 ${y}L50 ${y-11}L65 ${y}" fill="none" stroke="#fff" stroke-opacity=".96" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>`).join(''):`<path d="M50 34L64 50L50 66L36 50Z" fill="#fff" fill-opacity=".92"/>`;
  const glow=tier>=8?`<path d="M50 5L89 27V71L50 95L11 71V27Z" fill="none" stroke="${c1}" stroke-opacity=".5" stroke-width="7" filter="url(#${id}f)"/>`:'';
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${id}a" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".5" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="${c1}" stop-opacity=".7"/><stop offset="1" stop-color="${c3}"/></linearGradient><filter id="${id}f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter></defs>${glow}<path d="M50 5L89 27V71L50 95L11 71V27Z" fill="url(#${id}a)" stroke="url(#${id}b)" stroke-width="3.2" stroke-linejoin="round"/><path d="M50 15L80 32V66L50 85L20 66V32Z" fill="#000" fill-opacity=".14"/><path d="M50 5L89 27L50 49L11 27Z" fill="#fff" fill-opacity=".15"/>${chevs}</svg>`;
}
const emblem=i=>emblemTier(RANKS[i].tier,RANKS[i].sub);
function logoSVG(){const id='lg'+(++_uid);return `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset=".55" stop-color="#ff4d2e"/><stop offset="1" stop-color="#e0182d"/></linearGradient></defs><g fill="none" stroke="url(#${id})" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 5.5 54.5 18.5V44.5L32 58.5 9.5 44.5V18.5Z"/><path d="M21 43 32 36 43 43" opacity=".42"/><path d="M21 35 32 28 43 35" opacity=".72"/><path d="M21 27 32 20 43 27"/></g></svg>`}

/* ---------- State ---------- */
let totalXp=0,lastWorkoutTime=Date.now(),lastDecayTime=Date.now(),currentRankIndex=0;
function migrateData(){
  if(LS.get('gr_migrated'))return;
  const oldXp=LS.get('hc_gymXp');
  if(oldXp!==null){LS.set('gr_xp',oldXp);LS.set('gr_lastWorkout',LS.get('hc_lastWorkout',Date.now()));LS.set('gr_lastDecay',LS.get('hc_lastDecay',Date.now()))}
  LS.set('gr_migrated','true');
}
function loadState(){totalXp=parseFloat(LS.get('gr_xp','0'))||0;lastWorkoutTime=parseInt(LS.get('gr_lastWorkout',Date.now()),10)||Date.now();lastDecayTime=parseInt(LS.get('gr_lastDecay',Date.now()),10)||Date.now()}
function saveState(){LS.set('gr_xp',totalXp);LS.set('gr_lastWorkout',lastWorkoutTime);LS.set('gr_lastDecay',lastDecayTime)}
function applyDecay(){
  if(totalXp<=0)return 0;
  const now=Date.now(),penaltyStart=lastWorkoutTime+GRACE_DAYS*MS_DAY;
  if(now<=penaltyStart)return 0;
  const from=Math.max(penaltyStart,lastDecayTime),days=Math.floor((now-from)/MS_DAY);
  if(days<=0)return 0;
  const old=totalXp;for(let i=0;i<days;i++)totalXp*=(1-DECAY_RATE);
  lastDecayTime=from+days*MS_DAY;saveState();return old-totalXp;
}
const getHistory=()=>LS.json('gr_history',[]);
function saveHistory(h){if(h.length>5000)h=h.slice(h.length-5000);LS.setJson('gr_history',h)}
const getPRs=()=>LS.json('gr_prs',{});
const savePRs=p=>LS.setJson('gr_prs',p);
const getFavs=()=>LS.json('gr_favorites',[]);
const saveFavs=f=>LS.setJson('gr_favorites',f);
const getRecent=()=>LS.json('gr_recent',[]);
function updateRecent(id){const r=getRecent().filter(x=>x!==id);r.unshift(id);LS.setJson('gr_recent',r.slice(0,8))}
const getStreak=()=>LS.json('gr_streak',{current:0,longest:0,lastDay:'',bonusXpToday:false});
const saveStreak=s=>LS.setJson('gr_streak',s);
function liveStreak(){const s=getStreak();return(s.lastDay===dayKey()||s.lastDay===dayKey(addDays(Date.now(),-1)))?s.current:0}
function bumpStreak(){
  const s=getStreak(),today=dayKey(),yest=dayKey(addDays(Date.now(),-1));
  if(s.lastDay===today)return s;
  s.current=s.lastDay===yest?s.current+1:1;s.lastDay=today;s.longest=Math.max(s.longest||0,s.current);s.bonusXpToday=false;
  saveStreak(s);return s;
}
const oneRM=(w,r)=>r<=12?Math.round(w*(36/(37-r))):Math.round(w);
/* Set modes: 'w' weight × reps · 'bw' (bodyweight × share + extra) × reps · 'time' seconds held */
const exMode=ex=>(ex&&ex.mode)||'w';
const isCali=ex=>exMode(ex)!=='w';
const setSecs=e=>e.s!=null?e.s:(e.reps||0);
const setLoad=(e,ex)=>(e.bw||0)*((ex&&ex.bwf)||1)+(e.weight||0);
function calcXp(ex,w,r,s,bw){const m=exMode(ex);if(m==='w')return w*r*ex.mult;const load=bw*(ex.bwf||1)+(w||0);return(m==='time'?s:r)*load*ex.mult}
function setScore(e,ex){
  const m=exMode(ex);
  if(m==='time'){const base=Math.max(1,(e.bw||bodyWeight())*(ex.bwf||1));return Math.round(setSecs(e)*(1+(e.weight||0)/base))}
  return oneRM(m==='bw'?setLoad(e,ex):e.weight,e.reps);
}
const setVol=(e,ex)=>{const m=exMode(ex);return m==='time'?0:(m==='bw'?setLoad(e,ex):e.weight)*e.reps};
const fmtSecs=s=>{s=Math.round(s);return s>=60?Math.floor(s/60)+':'+pad2(s%60)+'\u00a0min':s+'\u00a0s'};
function fmtSet(e,ex,short){
  const m=exMode(ex),w=e.weight||0;
  if(m==='time')return(w>0?'+'+fmtW(w,!short)+' · ':'')+fmtSecs(setSecs(e));
  if(m==='bw')return(w>0?(short?'+'+fmtW(w,false):'BW + '+fmtW(w)):'BW')+(short?'×':' × ')+e.reps;
  return short?fmtW(w,false)+'×'+e.reps:fmtW(w)+' × '+e.reps;
}
const prScore=pr=>pr?(pr.score!=null?pr.score:pr.oneRM):0;
function checkPR(ex,e){
  const prs=getPRs(),sc=setScore(e,ex),had=!!prs[ex.id];
  if(!had||sc>prScore(prs[ex.id])){prs[ex.id]={weight:e.weight,reps:e.reps,s:e.s,bw:e.bw,date:e.ts,oneRM:exMode(ex)==='time'?0:sc,score:sc};savePRs(prs);return{isPR:true,first:!had,score:sc}}
  return{isPR:false,score:sc};
}
function toggleFav(id){const f=getFavs(),i=f.indexOf(id);if(i<0)f.push(id);else f.splice(i,1);saveFavs(f);haptic(8);return i<0}

/* ---------- Exercises ---------- */
const MUSCLE_LIST=['chest','back','shoulders','biceps','triceps','quads','hamstrings','glutes','calves','core','forearms','traps','fullBody'];
const EQUIP_LIST=['barbell','dumbbell','cable','machine','bodyweight','kettlebell','band','smith','ezbar'];
const EQUIP_FILTERS=['cali','skills'].concat(EQUIP_LIST);
const MUSCLE_COLORS={chest:'#ff6b4a',back:'#3b9eff',shoulders:'#ffaa1f',biceps:'#ff4f8b',triceps:'#a27bff',quads:'#2fd18a',hamstrings:'#14bfc2',glutes:'#e879f9',calves:'#93d443',core:'#f5c518',forearms:'#d49a5f',traps:'#8197c9',fullBody:'#ff4d2e'};
let CUSTOM=LS.json('gr_custom',[]);
let EX_MAP=new Map();
function rebuildEx(){EX_MAP=new Map();EXERCISES.concat(CUSTOM).forEach(e=>EX_MAP.set(e.id,e))}
const allEx=()=>EXERCISES.concat(CUSTOM);
const getEx=id=>EX_MAP.get(id);
const saveCustom=()=>{LS.setJson('gr_custom',CUSTOM);rebuildEx()};
const exName=ex=>ex?(ex.custom?ex.name:(LANG==='de'?ex.nameDe:ex.nameEn)):'?';
const exAlt=ex=>ex.custom?'':(LANG==='de'?ex.nameEn:ex.nameDe);
const exMeta=ex=>t(ex.muscle)+' · '+(exMode(ex)==='time'?t('modeHold'):exMode(ex)==='bw'?t('cali'):t(ex.equipment));
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ß/g,'ss').replace(/ı/g,'i');
function searchEx(q,f={}){
  let list=allEx();
  if(f.muscle&&f.muscle!=='all')list=list.filter(e=>e.muscle===f.muscle);
  if(f.equip==='cali')list=list.filter(isCali);
  else if(f.equip==='skills')list=list.filter(e=>e.skill);
  else if(f.equip&&f.equip!=='all')list=list.filter(e=>e.equipment===f.equip);
  if(f.fav){const fv=new Set(getFavs());list=list.filter(e=>fv.has(e.id))}
  const nq=norm(q||'').trim();
  if(!nq)return list.slice().sort((a,b)=>exName(a).localeCompare(exName(b),locale()));
  const toks=nq.split(/\s+/);
  return list.map(e=>{
    const n=norm(exName(e)),o=norm(exAlt(e)),m=norm(t(e.muscle)+' '+t(e.equipment));let s=0;
    if(n.startsWith(nq))s=100;else if(o.startsWith(nq))s=90;
    else if(n.split(/[\s\-()/]+/).some(w=>w.startsWith(nq)))s=75;
    else if(n.includes(nq)||o.includes(nq))s=55;
    else if(toks.every(k=>n.includes(k)||o.includes(k)||m.includes(k)))s=30;
    return{e,s};
  }).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).map(x=>x.e);
}
const tileHTML=(ex,c='')=>`<span class="tile ${c}" style="--c:${MUSCLE_COLORS[ex.muscle]||'#888'}"><svg class="ico"><use href="#eq-${ex.equipment}"/></svg></span>`;
function exRowHTML(ex,i,favs){
  const on=favs.has(ex.id);
  return `<div class="ex-row" role="button" tabindex="0" data-ex="${esc(ex.id)}" style="--i:${i}">${tileHTML(ex)}<span class="ex-main"><span class="ex-name">${esc(exName(ex))}</span><span class="ex-meta">${esc(exMeta(ex))}</span></span>${ex.skill?`<span class="pill gold sk-pill">${ico('spark','xs')}</span>`:''}<span class="mult">${fmtMult(ex.mult)}</span><span class="fav-btn${on?' on':''}" role="button" tabindex="0" data-fav="${esc(ex.id)}" aria-label="${esc(t('favorites'))}" aria-pressed="${on}">${ico('star','sm')}</span></div>`;
}
function handleFavClick(btn){const on=toggleFav(btn.dataset.fav);btn.classList.toggle('on',on);btn.setAttribute('aria-pressed',on);btn.classList.remove('popping');void btn.offsetWidth;btn.classList.add('popping')}
const lastSet=id=>{const h=getHistory();for(let i=h.length-1;i>=0;i--)if(h[i].exId===id)return h[i];return null};
const entryXp=e=>(e.xp||0)+(e.b||0);

/* strength per muscle */
const muscleThresholds={
  chest:[0,30,50,70,90,110,130,150,170,190,220],back:[0,35,60,80,105,130,155,180,210,240,280],
  shoulders:[0,20,35,50,65,80,95,110,125,140,160],biceps:[0,12,20,28,36,44,52,60,70,80,95],
  triceps:[0,15,25,35,48,60,72,85,100,115,135],quads:[0,40,70,100,135,170,210,250,300,350,420],
  hamstrings:[0,25,45,65,85,110,135,160,190,220,260],glutes:[0,30,55,80,110,145,180,220,265,310,370],
  calves:[0,20,40,60,80,100,125,150,180,210,250],core:[0,10,20,32,45,60,78,95,115,135,160],
  forearms:[0,10,18,26,35,44,53,63,74,86,100],traps:[0,25,45,65,85,110,135,160,190,220,260],
  fullBody:[0,35,60,85,115,145,180,220,260,310,370]
};
const secondaryMuscles={
  chest_bb_flat:['triceps'],chest_bb_incline:['triceps','shoulders'],chest_bb_decline:['triceps'],chest_bb_close:['triceps'],
  chest_db_flat:['triceps'],chest_db_incline:['triceps','shoulders'],chest_bw_dip:['triceps'],chest_smith_flat:['triceps'],
  chest_smith_incline:['triceps','shoulders'],chest_floor_press:['triceps'],back_bb_deadlift:['glutes','hamstrings','traps'],
  back_bb_row:['biceps'],back_bb_pendlay:['biceps'],back_bb_tbar:['biceps'],back_bw_pullup:['biceps'],back_bw_chinup:['biceps'],
  back_cable_lat_wide:['biceps'],back_cable_lat_close:['biceps'],shd_bb_ohp:['triceps'],shd_bb_push:['triceps'],
  shd_db_press:['triceps'],shd_db_arnold:['triceps'],shd_smith_ohp:['triceps'],bi_bb_cheat:['forearms'],bi_ez_reverse:['forearms'],
  bi_db_zottman:['forearms'],tri_bb_close:['chest'],tri_bw_dip:['chest'],fb_bb_clean:['shoulders','traps'],fb_bb_snatch:['shoulders','traps']
};
function muscleRanks(){
  const prs=getPRs(),best={},src={};
  Object.entries(prs).forEach(([id,pr])=>{const ex=getEx(id);if(!ex||exMode(ex)==='time'||!pr.oneRM)return;[ex.muscle].concat(secondaryMuscles[id]||[]).forEach(m=>{if(!best[m]||pr.oneRM>best[m]){best[m]=pr.oneRM;src[m]=id}})});
  const out={};
  MUSCLE_LIST.forEach(m=>{
    const rm=best[m]||0,th=muscleThresholds[m];let ri=-1;
    if(rm>0)for(let i=th.length-1;i>=0;i--){if(rm>=th[i]){ri=i;break}}
    const next=ri<th.length-1?th[ri+1]:null,cur=ri>=0?th[ri]:0;
    out[m]={oneRM:rm,tier:ri,src:src[m],next,prog:next?clamp((rm-cur)/(next-cur),0,1):1};
  });
  return out;
}

