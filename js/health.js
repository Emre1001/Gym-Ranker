/* ============================================================
   HEALTH — profile, calorie calculator, weight, steps, water, food, measurements
   All values are stored metric (kg, cm, ml, kcal).
   ============================================================ */
const getProfile=()=>LS.json('gr_profile',null);
const saveProfile=p=>LS.setJson('gr_profile',p);
const hasProfile=()=>{const p=getProfile();return !!(p&&p.name)};
const userName=()=>{const p=getProfile();return p&&p.name?p.name:''};
const ageOf=p=>clamp(new Date().getFullYear()-(p.born||1998),12,99);

/* ---------- weight log: [{d:'YYYY-MM-DD',kg}] sorted by day ---------- */
const getWeights=()=>LS.json('gr_weights',[]);
function logWeight(kg,d=dayKey()){
  const w=getWeights().filter(x=>x.d!==d);w.push({d,kg:Math.round(kg*100)/100});w.sort((a,b)=>a.d<b.d?-1:1);
  LS.setJson('gr_weights',w.slice(-2000));
}
function bodyWeight(){const w=getWeights();if(w.length)return w[w.length-1].kg;const p=getProfile();return p&&p.weight?p.weight:75}
const startWeight=()=>{const w=getWeights(),p=getProfile();return p&&p.startWeight?p.startWeight:(w.length?w[0].kg:bodyWeight())};
/* 7-day moving average ending at each entry (by calendar days, not entries) */
function weightTrend(w=getWeights()){
  return w.map((x,i)=>{const t=keyToDate(x.d).getTime(),win=w.slice(0,i+1).filter(y=>t-keyToDate(y.d).getTime()<7*MS_DAY);return{d:x.d,kg:x.kg,avg:win.reduce((s,y)=>s+y.kg,0)/win.length}});
}
/* kg per week over the last ~3 weeks of the trend; null when not enough data */
function weeklyRate(){
  const tr=weightTrend();if(tr.length<2)return null;
  const last=tr[tr.length-1],lt=keyToDate(last.d).getTime();
  let first=tr[0];for(const x of tr){if(lt-keyToDate(x.d).getTime()<=21*MS_DAY){first=x;break}}
  const days=(lt-keyToDate(first.d).getTime())/MS_DAY;if(days<5)return null;
  return (last.avg-first.avg)/days*7;
}

/* ---------- daily maps ---------- */
const getSteps=()=>LS.json('gr_steps',{});
const stepsOn=(d=dayKey())=>getSteps()[d]||0;
function setSteps(n,d=dayKey()){const s=getSteps();if(n>0)s[d]=Math.round(n);else delete s[d];LS.setJson('gr_steps',s)}
const getWater=()=>LS.json('gr_water',{});
const waterOn=(d=dayKey())=>getWater()[d]||0;
function setWater(ml,d=dayKey()){const s=getWater();s[d]=Math.max(0,Math.round(ml));LS.setJson('gr_water',s)}

/* ---------- food log: [{id,d,meal,name,kcal,p,c,f,g?,food?}] ---------- */
const MEALS=['breakfast','lunch','dinner','snack'];
const getFood=()=>LS.json('gr_food',[]);
const saveFood=f=>LS.setJson('gr_food',f.slice(-4000));
const foodOn=(d=dayKey())=>getFood().filter(x=>x.d===d);
function foodTotals(list){return list.reduce((s,x)=>({kcal:s.kcal+(x.kcal||0),p:s.p+(x.p||0),c:s.c+(x.c||0),f:s.f+(x.f||0)}),{kcal:0,p:0,c:0,f:0})}
const foodName=f=>LANG==='de'?f.de:LANG==='tr'?f.tr:f.en;
function foodFromDb(food,g){const k=g/100;return{name:foodName(food),food:food.id,g,kcal:Math.round(food.kcal*k),p:Math.round(food.p*k*10)/10,c:Math.round(food.c*k*10)/10,f:Math.round(food.f*k*10)/10}}
function recentFoods(){
  const seen=new Set(),out=[];
  for(const x of getFood().slice().reverse()){const key=(x.food||'')+'|'+x.name+'|'+(x.food?'':x.kcal);if(seen.has(key))continue;seen.add(key);out.push(x);if(out.length>=8)break}
  return out;
}

/* ---------- body measurements: [{d,waist,chest,arm,hip,thigh,neck,bf}] ---------- */
const MEASURES=['waist','chest','arm','hip','thigh','neck'];
const getMeasures=()=>LS.json('gr_measures',[]);
function saveMeasure(m){const all=getMeasures().filter(x=>x.d!==m.d);all.push(m);all.sort((a,b)=>a.d<b.d?-1:1);LS.setJson('gr_measures',all)}
/* US Navy body-fat estimate; needs waist + neck (+ hip for women) */
function navyBodyFat(m,p){
  if(!m||!p||!p.height||!m.waist||!m.neck)return null;
  const h=p.height,lg=Math.log10;
  if(p.sex==='f'){if(!m.hip||m.waist+m.hip-m.neck<=0)return null;return 495/(1.29579-.35004*lg(m.waist+m.hip-m.neck)+.221*lg(h))-450}
  if(m.waist-m.neck<=0)return null;
  return 495/(1.0324-.19077*lg(m.waist-m.neck)+.15456*lg(h))-450;
}
const bmiOf=(kg,cm)=>cm?kg/Math.pow(cm/100,2):null;

/* ---------- calorie calculator ---------- */
const ACTIVITY={sed:1.2,light:1.375,mod:1.55,high:1.725,ath:1.9};
const GOALS=['cut','bulk','maint','recomp'];
const PACE={cut:{slow:.1,normal:.2,fast:.25},bulk:{slow:.05,normal:.1,fast:.15}};
function bmrOf(p,kg){return 10*kg+6.25*(p.height||175)-5*ageOf(p)+(p.sex==='f'?-161:5)}
/* Full plan for a goal. Returns kcal target, the allowed range, macros and the expected weekly change. */
function planFor(p,goal=p.goal||'maint',pace=p.pace||'normal',kg=bodyWeight()){
  const bmr=bmrOf(p,kg),tdee=bmr*(ACTIVITY[p.activity]||1.375),floor=p.sex==='f'?1200:1500;
  let target=tdee,lo=tdee*.95,hi=tdee*1.05,protein=1.8,train=null,rest=null;
  if(goal==='cut'){const d=PACE.cut[pace]||.2;target=Math.max(floor,tdee*(1-d));lo=Math.max(floor,target-tdee*.05);hi=target+tdee*.05;protein=2.2}
  else if(goal==='bulk'){const s=PACE.bulk[pace]||.1;target=tdee*(1+s);lo=target-tdee*.04;hi=target+tdee*.04;protein=1.8}
  else if(goal==='recomp'){target=tdee*.95;train=tdee*1.05;rest=tdee*.85;lo=rest;hi=train;protein=2.2}
  const r=v=>Math.round(v/10)*10;
  const pG=Math.round(protein*kg),fG=Math.round(Math.max(.8*kg,target*.25/9)),cG=Math.max(0,Math.round((target-pG*4-fG*9)/4));
  return{goal,bmr:Math.round(bmr),tdee:r(tdee),target:r(target),lo:r(lo),hi:r(hi),train:train&&r(train),rest:rest&&r(rest),
    p:pG,c:cG,f:fG,weekly:(target-tdee)*7/7700,low:target<=floor+1};
}
const myPlan=()=>{const p=getProfile();return p?planFor(p):null};
/* Today's target: on recomp, training days get the higher number */
function todayTarget(pl=myPlan()){if(!pl)return 0;if(pl.goal==='recomp')return todayEntries().length?pl.train:pl.rest;return pl.target}
const waterGoal=()=>{const g=getProfile();return g&&g.waterGoal?g.waterGoal:Math.round(bodyWeight()*35/250)*250};
const stepGoal=()=>{const g=getProfile();return g&&g.stepGoal?g.stepGoal:10000};
const stepsKcal=n=>Math.round(n*.0005*bodyWeight());
/* date the goal weight is reached at the current rate, or null */
function goalEta(){
  const p=getProfile(),rate=weeklyRate();if(!p||!p.target||rate===null)return null;
  const diff=p.target-bodyWeight();if(Math.abs(diff)<.2)return 0;
  if(Math.sign(diff)!==Math.sign(rate)||Math.abs(rate)<.05)return null;
  return Date.now()+diff/rate*7*MS_DAY;
}

/* ---------- step reactions: what the app says to your steps ---------- */
function stepReaction(n){
  const goal=stepGoal(),y=stepsOn(dayKey(addDays(Date.now(),-1)));
  if(n<=0)return null;
  if(n>=25000)return{k:'stepsUltra',tone:'gold'};
  if(n>=15000)return{k:'stepsHow',tone:'gold'};
  if(n>=goal)return{k:y&&n>y*1.2?'stepsGoalMore':'stepsGoal',tone:'good'};
  if(n>=goal*.7)return{k:'stepsAlmost',tone:'accent',left:goal-n};
  if(n>=3000)return{k:'stepsMore',tone:'warn',left:goal-n};
  return{k:'stepsLow',tone:'bad',left:goal-n};
}
