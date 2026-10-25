/* ============================================================
   GAME — XP from habits, daily quests, achievements, skill unlocks, reward screens
   ============================================================ */
const getXpLog=()=>LS.json('gr_xplog',[]);
/* XP that does not come from a set (quests, skills, achievements). Logged so charts can show it. */
function addXp(xp,k,id){
  xp=Math.round(xp);if(!(xp>0))return;
  totalXp+=xp;saveState();
  const log=getXpLog();log.push({ts:Date.now(),xp,k,id});LS.setJson('gr_xplog',log.slice(-3000));
}

/* ---------- reward queue: full-screen moments shown one after another ---------- */
const REWARDS=[];let rewardOpen=false;
function queueReward(r){REWARDS.push(r);if(!rewardOpen)setTimeout(nextReward,650)}
function nextReward(){
  if(rewardOpen||!REWARDS.length)return;
  const r=REWARDS.shift();rewardOpen=true;
  if(r.kind==='rank')celebrate(r.i);
  else if(r.kind==='skill')celebrateSkill(r);
  else if(r.kind==='chest')celebrateChest(r);
  else if(r.kind==='weekly')celebrateWeekly(r);
}
function rewardClosed(){rewardOpen=false;if(REWARDS.length)setTimeout(nextReward,350)}

/* ---------- daily quests ---------- */
const MUSCLE_GROUPS={legs:['quads','hamstrings','glutes','calves'],push:['chest','shoulders','triceps'],pull:['back','biceps','traps','forearms'],core:['core']};
function seeded(str){let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return((h>>>0)%10000)/10000}}
function dailyQuests(d=dayKey()){
  const rnd=seeded('gr'+d),pick=a=>a[Math.floor(rnd()*a.length)],sc=ageQuestScale(),sz=v=>niceRound(v*sc);
  const train=[{id:'sets',n:Math.max(6,Math.round(pick([10,12,15,20])*sc)),xp:150},{id:'muscle',g:pick(['legs','push','pull','core']),n:sc<.8?3:4,xp:150},{id:'volume',n:sz(pick([3000,5000,8000])),xp:200},{id:'pr',n:1,xp:250},{id:'cali',n:Math.max(3,Math.round(pick([3,5,8])*sc)),xp:150},{id:'hold',n:sz(pick([60,90,120])),xp:150}];
  const habit=[{id:'steps',n:stepGoal(),xp:150},{id:'water',n:waterGoal(),xp:100}];
  if(hasProfile())habit.push({id:'protein',xp:150},{id:'kcal',xp:200},{id:'meals',n:3,xp:100},{id:'weigh',n:1,xp:60});
  const a=pick(train),b=pick(habit),rest=train.concat(habit).filter(q=>q.id!==a.id&&q.id!==b.id);
  return[a,b,pick(rest)];
}
function questProgress(q){
  const today=todayEntries(),d=dayKey();
  switch(q.id){
    case 'sets':return[today.length,q.n];
    case 'muscle':{const g=MUSCLE_GROUPS[q.g];return[today.filter(e=>{const ex=getEx(e.exId);return ex&&g.includes(ex.muscle)}).length,q.n]}
    case 'volume':return[today.reduce((s,e)=>s+setVol(e,getEx(e.exId)),0),q.n];
    case 'pr':return[Object.values(getPRs()).filter(p=>p.date&&dayKey(p.date)===d).length,1];
    case 'cali':return[today.filter(e=>isCali(getEx(e.exId))).length,q.n];
    case 'hold':return[today.filter(e=>exMode(getEx(e.exId))==='time').reduce((s,e)=>s+setSecs(e),0),q.n];
    case 'steps':return[stepsOn(),q.n];
    case 'water':return[waterOn(),q.n];
    case 'protein':{const pl=myPlan();return[foodTotals(foodOn()).p,pl?pl.p:150]}
    case 'kcal':{const pl=myPlan(),k=foodTotals(foodOn()).kcal;if(!pl)return[0,1];return[k>=pl.lo&&k<=pl.hi?pl.lo:Math.min(k,pl.lo-1),pl.lo]}
    case 'meals':return[new Set(foodOn().map(x=>x.meal)).size,q.n];
    case 'weigh':return[getWeights().some(x=>x.d===d)?1:0,1];
  }
  return[0,1];
}
function questTitle(q){
  const n=q.n;
  switch(q.id){
    case 'muscle':return t('q_muscle_'+q.g,{n});
    case 'volume':return t('q_volume',{v:fmtVol(n)});
    case 'hold':return t('q_hold',{v:fmtSecs(n)});
    case 'steps':return t('q_steps',{n:fmtN(n)});
    case 'water':return t('q_water',{v:NF1.format(n/1000)+' L'});
    case 'protein':{const pl=myPlan();return t('q_protein',{n:pl?pl.p:150})}
    default:return t('q_'+q.id,{n});
  }
}
function questValue(q,v){
  if(q.id==='volume')return fmtVol(v);
  if(q.id==='hold')return fmtSecs(v);
  if(q.id==='water')return NF1.format(v/1000)+' L';
  if(q.id==='kcal'){const k=foodTotals(foodOn()).kcal;return fmtN(k)+' kcal'}
  if(q.id==='protein')return fmtN(v)+' g';
  return fmtN(v);
}
const getQuestState=()=>{const s=LS.json('gr_quests',null);return s&&s.d===dayKey()?s:{d:dayKey(),done:{},chest:false}};
function checkQuests(){
  const st=getQuestState(),qs=dailyQuests();let changed=false;
  qs.forEach(q=>{
    if(st.done[q.id])return;const[c,g]=questProgress(q);
    if(c>=g){st.done[q.id]=Date.now();changed=true;addXp(q.xp,'quest',q.id);LS.set('gr_qcount',(parseInt(LS.get('gr_qcount','0'),10)||0)+1);
      setTimeout(()=>{toast(t('questDone'),{type:'good',icon:'quest',sub:questTitle(q)+' · +'+fmtN(q.xp)+' XP'});SFX.quest();haptic([10,40,20])},300)}
  });
  if(!st.chest&&qs.every(q=>st.done[q.id])){st.chest=true;changed=true;addXp(CHEST_XP,'chest',st.d);LS.set('gr_chests',(parseInt(LS.get('gr_chests','0'),10)||0)+1);queueReward({kind:'chest'})}
  if(changed)LS.setJson('gr_quests',st);
}
const CHEST_XP=300;

/* ---------- weekly quests ----------
   Targets adapt to you: your average of the last 4 active weeks plus 20–30 %, never below a realistic
   starting value. They are fixed on Monday so the bar does not move during the week. */
const weekStart=(ts=Date.now())=>{const d=startOfDay(ts);return addDays(d,-((new Date(d).getDay()+6)%7))};
const WQ_BASE={chest_bw_pushup:300,quad_bw_squat:300,back_bw_pullup:75,chest_bw_dip:120,core_bw_situp:200,fb_bw_burpee:100};
const niceRound=v=>v>=2000?Math.round(v/250)*250:v>=400?Math.round(v/50)*50:v>=100?Math.round(v/10)*10:Math.max(1,Math.round(v/5)*5);
/* average per active week over the 4 weeks before `ws` */
function weeklyAvg(ws,fn){
  const h=getHistory(),from=addDays(ws,-28),sums=[0,0,0,0];
  h.forEach(e=>{if(e.ts<from||e.ts>=ws)return;const v=fn(e);if(v)sums[Math.floor((e.ts-from)/(7*MS_DAY))]+=v});
  const act=sums.filter(v=>v>0);return act.length?act.reduce((a,b)=>a+b,0)/act.length:0;
}
function buildWeekly(ws){
  // younger and older athletes: lower starting values and a smaller step up
  const sc=ageQuestScale(),rnd=seeded('wk'+dayKey(ws)),pick=a=>a[Math.floor(rnd()*a.length)],harder=1+(.2+rnd()*.1)*Math.min(1,sc+.2);
  const h=getHistory().filter(e=>e.ts>=addDays(ws,-28)&&e.ts<ws);
  // 1) reps of a bodyweight move you actually do (or a classic to start with)
  const cnt={};h.forEach(e=>{const ex=getEx(e.exId);if(exMode(ex)==='bw')cnt[e.exId]=(cnt[e.exId]||0)+e.reps});
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
  const exId=top.length?pick(top):pick(['chest_bw_pushup','quad_bw_squat','back_bw_pullup']);
  const avgReps=weeklyAvg(ws,e=>e.exId===exId?e.reps:0);
  const repsN=niceRound(Math.max((WQ_BASE[exId]||150)*sc,avgReps*harder));
  const list=[{id:'w_reps',ex:exId,n:repsN,xp:clamp(Math.round(repsN*(getEx(exId).mult||1)*1.2/50)*50,600,1500)}];
  // 2) training: days, sets or volume
  const days=new Set(h.map(e=>dayKey(e.ts))).size/4,sets=weeklyAvg(ws,()=>1),vol=weeklyAvg(ws,e=>setVol(e,getEx(e.exId)));
  const tr=pick(['days','sets','volume']);
  if(tr==='days')list.push({id:'w_days',n:clamp(Math.ceil(days)+1,3,6),xp:900});
  else if(tr==='sets')list.push({id:'w_sets',n:niceRound(Math.max(40*sc,sets*harder)),xp:900});
  else list.push({id:'w_volume',n:niceRound(Math.max(10000*sc,vol*(1+(harder-1)*.75))),xp:1000});
  // 3) habit or holds
  const stepsWeek=(()=>{const s=getSteps();let tot=0,n=0;for(let i=1;i<=28;i++){const v=s[dayKey(addDays(ws,-i))];if(v){tot+=v;n++}}return n?tot/n*7:0})();
  const hb=pick(hasProfile()?['steps','holds','protein']:['steps','holds']);
  if(hb==='steps')list.push({id:'w_steps',n:niceRound(Math.max(stepGoal()*5,stepsWeek*1.15)),xp:800});
  else if(hb==='holds')list.push({id:'w_holds',n:niceRound(Math.max(300*sc,weeklyAvg(ws,e=>exMode(getEx(e.exId))==='time'?setSecs(e):0)*harder)),xp:700});
  else list.push({id:'w_protein',n:5,xp:900});
  return list;
}
function getWeekState(){
  const ws=weekStart(),k=dayKey(ws);let s=LS.json('gr_wquests',null);
  // rebuilt when the week changes or the age changed (targets depend on it); finished quests stay finished
  const age=userAge();
  if(!s||s.w!==k){s={w:k,age,list:buildWeekly(ws),done:{}};LS.setJson('gr_wquests',s)}
  else if(s.age!==age){s.age=age;s.list=buildWeekly(ws);LS.setJson('gr_wquests',s)}
  return s;
}
function wquestProgress(q){
  const ws=weekStart(),h=getHistory().filter(e=>e.ts>=ws);
  switch(q.id){
    case 'w_reps':return[h.filter(e=>e.exId===q.ex).reduce((s,e)=>s+e.reps,0),q.n];
    case 'w_days':return[new Set(h.map(e=>dayKey(e.ts))).size,q.n];
    case 'w_sets':return[h.length,q.n];
    case 'w_volume':return[h.reduce((s,e)=>s+setVol(e,getEx(e.exId)),0),q.n];
    case 'w_holds':return[h.filter(e=>exMode(getEx(e.exId))==='time').reduce((s,e)=>s+setSecs(e),0),q.n];
    case 'w_steps':{let tot=0;for(let i=0;i<7;i++)tot+=stepsOn(dayKey(addDays(ws,i)));return[tot,q.n]}
    case 'w_protein':{const pl=myPlan();if(!pl)return[0,q.n];let c=0;for(let i=0;i<7;i++){if(foodTotals(foodOn(dayKey(addDays(ws,i)))).p>=pl.p)c++}return[c,q.n]}
  }
  return[0,1];
}
function wquestTitle(q){
  if(q.id==='w_reps')return t('wq_reps',{n:fmtN(q.n),ex:exName(getEx(q.ex))});
  if(q.id==='w_volume')return t('wq_volume',{v:fmtVol(q.n)});
  if(q.id==='w_holds')return t('wq_holds',{v:fmtSecs(q.n)});
  return t(q.id.replace('w_','wq_'),{n:fmtN(q.n)});
}
function wquestValue(q,v){if(q.id==='w_volume')return fmtVol(v);if(q.id==='w_holds')return fmtSecs(v);return fmtN(v)}
function checkWeekly(){
  const st=getWeekState();let changed=false;
  st.list.forEach(q=>{if(st.done[q.id])return;const[c,g]=wquestProgress(q);if(c>=g){st.done[q.id]=Date.now();changed=true;addXp(q.xp,'wquest',q.id);queueReward({kind:'weekly',q})}});
  if(changed)LS.setJson('gr_wquests',st);
}

/* ---------- skills ---------- */
const getSkills=()=>LS.json('gr_skills',{});
function nodeMet(node,e){
  if(e.exId!==node.ex)return false;
  const ex=getEx(e.exId);if(!ex)return false;
  if((e.weight||0)+1e-9<node.add)return false;
  return node.s?exMode(ex)==='time'&&setSecs(e)>=node.s:e.reps>=node.r;
}
function nodeLabel(node){
  const ex=getEx(node.ex);
  return exName(ex)+' · '+nodeGoal(node);
}
function nodeGoal(node){
  return(node.s?fmtSecs(node.s):node.r+'\u00a0×')+(node.add?' + '+fmtW(node.add):'');
}
function nodeBest(node){
  const ex=getEx(node.ex);let best=0;
  getHistory().forEach(e=>{if(e.exId!==node.ex||(e.weight||0)+1e-9<node.add)return;best=Math.max(best,node.s?setSecs(e):e.reps)});
  return best;
}
/* check one new set (or all history with silent=true, used once to catch up existing data) */
function checkSkills(entries,silent){
  const got=getSkills(),fresh=[];
  SKILL_TREES.forEach(tr=>tr.nodes.forEach(n=>{if(got[n.id])return;if(entries.some(e=>nodeMet(n,e))){got[n.id]=Date.now();fresh.push({tr,n})}}));
  if(!fresh.length)return;
  LS.setJson('gr_skills',got);
  if(silent)return;
  const xp=fresh.reduce((s,x)=>s+x.n.xp,0);addXp(xp,'skill',fresh.map(x=>x.n.id).join(','));
  const top=fresh[fresh.length-1];
  queueReward({kind:'skill',tr:top.tr,n:top.n,xp,count:fresh.length});
}
const skillCount=()=>Object.keys(getSkills()).length;
const skillTotal=()=>SKILL_TREES.reduce((s,tr)=>s+tr.nodes.length,0);

/* ---------- achievements ---------- */
// [id, metric, goal, xp, icon]
const ACHIEVEMENTS=[
  ['first_set','sets',1,50,'bolt'],['sets100','sets',100,200,'bolt'],['sets1000','sets',1000,1000,'bolt'],['sets5000','sets',5000,3000,'bolt'],
  ['streak3','streak',3,100,'flame'],['streak7','streak',7,300,'flame'],['streak30','streak',30,1500,'flame'],['streak100','streak',100,5000,'flame'],
  ['pr1','prs',1,100,'trophy'],['pr25','prs',25,500,'trophy'],['pr100','prs',100,2000,'trophy'],
  ['rank_gold','rank',12,300,'medal'],['rank_diamond','rank',15,600,'medal'],['rank_ruby','rank',21,1500,'medal'],['rank_champion','rank',30,5000,'medal'],
  ['days30','days',30,500,'history'],['days100','days',100,2000,'history'],
  ['vol10','volume',10000,200,'plate'],['vol100','volume',100000,1000,'plate'],['vol1000','volume',1000000,5000,'plate'],
  ['cali1','cali',1,50,'pushup'],['cali100','cali',100,500,'pushup'],['cali1000','cali',1000,2500,'pushup'],
  ['skill1','skills',1,100,'spark'],['skill10','skills',10,1000,'spark'],['skill30','skills',30,3000,'spark'],['skill_all','skills',0,10000,'spark'],
  ['steps10k','stepsMax',10000,100,'steps'],['steps20k','stepsMax',20000,300,'steps'],['stepdays7','stepDays',7,300,'steps'],['stepdays30','stepDays',30,1000,'steps'],
  ['weigh1','weighins',1,50,'scale'],['weigh30','weighins',30,500,'scale'],
  ['kg1','moved',1,200,'trend'],['kg5','moved',5,1000,'trend'],['kg10','moved',10,2500,'trend'],['goal_weight','goalHit',1,3000,'target'],
  ['food1','foodDays',1,50,'food'],['food7','foodDays',7,300,'food'],['food30','foodDays',30,1000,'food'],
  ['protein7','proteinDays',7,500,'food'],['water7','waterDays',7,300,'drop'],
  ['quest10','quests',10,200,'quest'],['wquest1','wquests',1,300,'crown'],['wquest10','wquests',10,2000,'crown'],['quest100','quests',100,1500,'quest'],['chest7','chests',7,700,'gift'],
  ['measure1','measures',1,50,'ruler']
].map(([id,m,goal,xp,icon])=>({id,m,goal:goal||skillTotal(),xp,icon}));
function achMetrics(){
  const h=getHistory(),prof=getProfile(),pl=myPlan(),sg=stepGoal(),wg=waterGoal();
  const food=getFood(),fDays={};food.forEach(x=>{(fDays[x.d]=fDays[x.d]||[]).push(x)});
  const steps=getSteps(),water=getWater(),w=getWeights();
  let moved=0;
  if(w.length){const s0=startWeight(),cur=bodyWeight(),dir=prof&&prof.target?Math.sign(prof.target-s0):prof&&prof.goal==='cut'?-1:prof&&prof.goal==='bulk'?1:0;moved=Math.max(0,(cur-s0)*dir)}
  return{
    sets:h.length,streak:Math.max(getStreak().longest||0,liveStreak()),prs:Object.keys(getPRs()).length,rank:rankOf(totalXp),
    days:new Set(h.map(e=>dayKey(e.ts))).size,volume:h.reduce((s,e)=>s+setVol(e,getEx(e.exId)),0),
    cali:h.filter(e=>isCali(getEx(e.exId))).length,skills:skillCount(),
    stepsMax:Math.max(0,...Object.values(steps)),stepDays:Object.values(steps).filter(n=>n>=sg).length,
    weighins:w.length,moved,goalHit:prof&&prof.target&&w.length>1&&Math.abs(bodyWeight()-prof.target)<=.3&&Math.abs(startWeight()-prof.target)>1?1:0,
    foodDays:Object.keys(fDays).length,proteinDays:pl?Object.values(fDays).filter(l=>foodTotals(l).p>=pl.p).length:0,
    waterDays:Object.values(water).filter(v=>v>=wg).length,
    quests:parseInt(LS.get('gr_qcount','0'),10)||0,wquests:getXpLog().filter(x=>x.k==='wquest').length,chests:parseInt(LS.get('gr_chests','0'),10)||0,measures:getMeasures().length
  };
}
const getAch=()=>LS.json('gr_ach',{});
function checkAchievements(silent){
  const got=getAch(),m=achMetrics(),fresh=ACHIEVEMENTS.filter(a=>!got[a.id]&&m[a.m]>=a.goal);
  if(!fresh.length)return;
  fresh.forEach(a=>got[a.id]=Date.now());LS.setJson('gr_ach',got);
  if(silent)return;
  fresh.forEach((a,i)=>{addXp(a.xp,'ach',a.id);setTimeout(()=>{toast(t('achUnlocked'),{type:'pr',icon:a.icon,sub:t('a_'+a.id)+' · +'+fmtN(a.xp)+' XP',dur:4500});SFX.pr();haptic([15,50,25])},900+i*900)});
}

/* ---------- one call after every action ---------- */
function afterAction(prevRank,entry){
  if(entry)checkSkills([entry]);
  checkQuests();checkWeekly();checkAchievements();
  const now=rankOf(totalXp);currentRankIndex=now;
  if(now>prevRank)queueReward({kind:'rank',i:now});
}
/* first start with this version: count what is already done, without paying XP twice */
function initGame(){
  if(LS.get('gr_skills')===null){LS.setJson('gr_skills',{});checkSkills(getHistory(),true)}
  if(LS.get('gr_ach')===null){LS.setJson('gr_ach',{});checkAchievements(true)}
}

/* ---------- reward screens ---------- */
function rewardScreen({color,art,eyebrow,name,sub,colors}){
  const c=$('#celebrate');
  c.style.setProperty('--tier',color);
  $('#celEmb').innerHTML=art;$('#celEyebrow').textContent=eyebrow;
  const n=$('#celName');n.textContent=name;n.classList.remove('tier-fire');n.classList.toggle('long',name.length>16);
  $('#celSub').textContent=sub;$('#celBtn').textContent=t('continue');
  c.classList.remove('show');void c.offsetWidth;c.classList.add('show');
  releaseCelebrate=BackStack.push('celebrate',()=>closeCelebrate(true));setInert(true);
  burst(colors.concat(['#ffffff']));
  setTimeout(()=>$('#celBtn').focus({preventScroll:true}),900);
}
const badgeSVG=(icon,color)=>`<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 5L89 27V71L50 95L11 71V27Z" fill="${color}"/><path d="M50 5L89 27L50 49L11 27Z" fill="#fff" fill-opacity=".16"/><path d="M50 15L80 32V66L50 85L20 66V32Z" fill="#000" fill-opacity=".12"/><svg x="26" y="26" width="48" height="48" viewBox="0 0 24 24" class="badge-ico"><use href="#i-${icon}"/></svg></svg>`;
function celebrateSkill(r){
  const done=r.tr.nodes.filter(n=>getSkills()[n.id]).length;
  rewardScreen({color:r.tr.c,art:badgeSVG(r.tr.icon,r.tr.c),eyebrow:t('skillUnlocked'),name:exName(getEx(r.n.ex)),
    sub:nodeGoal(r.n)+' · +'+fmtN(r.xp)+' XP · '+t('skillTreeLevel',{tree:t('tree_'+r.tr.id),n:done,max:r.tr.nodes.length})+(r.count>1?' · '+t('skillsAtOnce',{n:r.count}):''),colors:[r.tr.c,'#ffc83d']});
  haptic([20,60,30,60,120]);SFX.skill();
}
function celebrateWeekly(r){
  rewardScreen({color:'#ff9a1f',art:badgeSVG('crown','#ff8a1f'),eyebrow:t('weeklyDone'),name:wquestTitle(r.q),sub:'+'+fmtN(r.q.xp)+' XP · '+t('weeklyDoneSub'),colors:['#ffc83d','#ff4d2e','#ff8a3d']});
  haptic([20,60,30,60,120]);SFX.skill();
}
function celebrateChest(){
  rewardScreen({color:'#ffc83d',art:badgeSVG('gift','#f6b92c'),eyebrow:t('chestTitle'),name:'+'+fmtN(CHEST_XP)+' XP',sub:t('chestSub'),colors:['#ffc83d','#ff8a3d']});
  haptic([20,60,30,60,90]);SFX.rank();
}
