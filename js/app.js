/* ============================================================
   NAVIGATION
   Phone: 5 tabs; library, history and settings open as sub pages from the profile
   (one back-stack entry, so the back gesture returns to the profile).
   Desktop: everything sits in the sidebar.
   ============================================================ */
const TABS=['train','food','body','progress','profile'];
const SUBS=['library','history','settings'];
const PAGES=TABS.concat(SUBS);
const SIDEBAR=['train','food','body','progress','library','history','profile','settings'];
const LEGACY={home:'train',exercises:'library',stats:'progress'};
const wide=()=>matchMedia('(min-width:960px)').matches;
let PAGE=null;const scrollMem={};let titleObs=null;
let subRelease=null,subParent='profile';
const RENDER={train:()=>renderTrain(),food:()=>renderFood(),body:()=>renderBody(),progress:()=>renderProgress(),profile:()=>renderProfile(),library:()=>renderLibrary(),history:()=>renderHistory(),settings:()=>renderSettings()};
function renderPage(p){RENDER[p]()}
function renderAll(){renderPage(PAGE||'train');if(PAGE!=='train')renderTrain()}
function go(p){
  p=LEGACY[p]||p;if(!PAGES.includes(p))p='train';
  if(p===PAGE){window.scrollTo({top:0,behavior:reduceMotion()?'auto':'smooth'});return}
  const sub=SUBS.includes(p)&&!wide();
  if(subRelease&&!SUBS.includes(p)){const r=subRelease;subRelease=null;r()}
  if(sub&&!subRelease){subParent=PAGE&&TABS.includes(PAGE)?PAGE:'profile';subRelease=BackStack.push('page',()=>{subRelease=null;show(subParent,-1)})}
  show(p,sub?1:0);
}
function show(p,dir){
  if(PAGE)scrollMem[PAGE]=scrollY;
  const prev=PAGE;PAGE=p;
  $$('.page').forEach(s=>s.classList.toggle('active',s.id==='page-'+p));
  const hl=SUBS.includes(p)&&!wide()?'profile':p;
  $$('.tab').forEach(b=>{const on=b.dataset.page===hl;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
  moveTabInd(true);
  renderPage(p);
  const el=$('#page-'+p);[...el.children].forEach((c,i)=>c.style.setProperty('--i',i));
  el.classList.remove('in','fwd','bwd');void el.offsetWidth;el.classList.add('in',dir>0?'fwd':dir<0?'bwd':'tabin');
  window.scrollTo(0,dir>0?0:(scrollMem[p]||0));
  // after a pending history.back() from a closing overlay has landed
  setTimeout(()=>{if(PAGE===p&&location.hash!=='#'+p)history.replaceState(history.state,'','#'+p)},160);
  $('#navbarTitle').textContent=t(el.dataset.title);
  if(titleObs){titleObs.disconnect();const tt=$('.ph-title',el);if(tt)titleObs.observe(tt)}
  requestAnimationFrame(syncSegs);
  if(prev&&prev!==p)haptic(4);
}
function moveTabInd(anim){
  const on=$$('.tab.on').find(b=>b.offsetWidth),ind=$('#tabInd');if(!on){ind.style.opacity='0';return}ind.style.opacity='';
  if(!anim)ind.style.transition='none';
  ind.style.width=on.offsetWidth+'px';ind.style.height=on.offsetHeight+'px';ind.style.transform=`translate(${on.offsetLeft}px,${on.offsetTop}px)`;
  if(!anim){void ind.offsetWidth;ind.style.transition=''}
}

/* ============================================================
   INIT
   ============================================================ */
function bindGlobal(){
  $('#tabbar').addEventListener('click',e=>{const b=e.target.closest('.tab');if(b)go(b.dataset.page)});
  $('#picker').addEventListener('click',openPicker);
  $('#btnLog').addEventListener('click',logSet);
  $('#recentRow').addEventListener('click',e=>{const c=e.target.closest('[data-ex]');if(c){haptic(5);selectEx(c.dataset.ex)}});
  $('#hero').addEventListener('click',openLadder);
  $('#hero').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openLadder()}});
  $('#streakPill').addEventListener('click',()=>{const s=liveStreak();toast(t('streakInfo',{n:s,best:getStreak().longest||0}),{icon:'flame',sub:t('streakRule')})});
  $$('.tool').forEach(b=>b.addEventListener('click',()=>({timer:openTimerSheet,plates:openPlates,orm:openOrm,skills:()=>{PROG='skills';LS.set('gr_progTab','skills');go('progress')}})[b.dataset.tool]()));
  $('#tpAdd').addEventListener('click',()=>{TMR.end+=30000;TMR.total+=30;LS.set('gr_tEnd',TMR.end);LS.set('gr_tTot',TMR.total);tickTimer();haptic(5)});
  $('#tpSkip').addEventListener('click',()=>{stopTimer();haptic(5)});
  $('#celBtn').addEventListener('click',closeCelebrate);
  $('#celebrate').addEventListener('click',e=>{if(e.target===e.currentTarget)closeCelebrate()});
  $('#histMore').addEventListener('click',()=>{histDays+=14;renderHistory()});
  // delegated actions across pages
  $('#main').addEventListener('click',e=>{
    if(e.target.closest('[data-back]')){history.back();return}
    const g=e.target.closest('[data-go]');if(g){go(g.dataset.go);return}
    const d=e.target.closest('[data-detail]');if(d){openExDetail(d.dataset.detail);return}
    const h=e.target.closest('.h-row[data-ts]');if(h){openSetSheet(parseInt(h.dataset.ts,10));return}
    const m=e.target.closest('[data-muscle]');if(m&&PAGE==='progress'){openMuscleSheet(m.dataset.muscle)}
  });
  $('#todayList').addEventListener('keydown',e=>{const d=e.target.closest('[data-detail]');if(d&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openExDetail(d.dataset.detail)}});
  document.addEventListener('keydown',e=>{
    const el=document.activeElement,typing=el&&(/INPUT|TEXTAREA|SELECT/.test(el.tagName)||el.isContentEditable);
    if(e.key==='Escape'&&!BackStack.canGoBack()){if($('#celebrate').classList.contains('show'))closeCelebrate();else if(SH.open)closeSheet();return}
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(PAGE!=='train')go('train');openPicker();return}
    if(typing){
      if(e.key==='Enter'&&el.id==='inWeight'){e.preventDefault();$('#inReps').focus()}
      else if(e.key==='Enter'&&el.id==='inReps'){e.preventDefault();logSet()}
      else if((e.key==='ArrowUp'||e.key==='ArrowDown')&&(el.id==='inWeight'||el.id==='inReps')){e.preventDefault();stepValue(el.id==='inWeight'?'w':'r',e.key==='ArrowUp'?1:-1)}
      return;
    }
    if(SH.open||e.metaKey||e.ctrlKey||e.altKey||$('#onboard'))return;
    if(e.key==='/'){e.preventDefault();if(PAGE!=='train')go('train');openPicker()}
    else if(/^[1-8]$/.test(e.key))go(SIDEBAR[parseInt(e.key,10)-1]);
    else if(e.key.toLowerCase()==='t'){TMR.end?stopTimer():startTimer()}
  });
  let rz;window.addEventListener('resize',()=>{moveTabInd(false);syncSegs();clearTimeout(rz);rz=setTimeout(()=>{if(PAGE==='progress'&&PROG==='overview')mountXpChart(getHistory());if(PAGE==='body')mountWeightChart()},200)});
  matchMedia('(prefers-color-scheme: light)').addEventListener('change',()=>{if(THEME()===document.documentElement.dataset.theme)return;applyTheme();if(PAGE==='settings')renderSettings()});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(PAGE==='settings')renderSettings()});
  window.addEventListener('languagechange',()=>{if(pref.lang==='system')applyLang()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible')return;const lost=applyDecay();if(lost>0)toast(t('laziness',{xp:fmtN(lost)}),{type:'bad',icon:'flame'});currentRankIndex=rankOf(totalXp);if(TMR.end)tickTimer();if(PAGE)renderPage(PAGE)});
  setInterval(()=>{if(PAGE==='train'&&!document.hidden)renderHero()},60000);
  titleObs=new IntersectionObserver(es=>es.forEach(en=>$('#navbar').classList.toggle('show',!en.isIntersecting&&en.boundingClientRect.top<0)),{rootMargin:'-44px 0px 0px 0px'});
}
function splash(){
  const s=$('#splash');let seen=false;try{seen=sessionStorage.getItem('gr_splash')}catch(e){}
  if(seen||reduceMotion()){s.remove();return}
  try{sessionStorage.setItem('gr_splash','1')}catch(e){}
  setTimeout(()=>{s.classList.add('out');setTimeout(()=>s.remove(),600)},1050);
}
function init(){
  migrateData();loadState();rebuildEx();
  LANG=resolveLang();buildFormatters();applyTheme();applyStatic();
  $('#brandLogo').innerHTML=logoSVG();
  BackStack.init({root:'train'});
  const prevRank=rankOf(totalXp),lost=applyDecay();currentRankIndex=rankOf(totalXp);
  initGame();
  initSheetDrag();initSteppers();initLibrary();initSettings();initFood();initBody();initProfile();bindGlobal();
  if(SEL&&getEx(SEL))fillFromLast(SEL);
  go(location.hash.slice(1)||'train');
  requestAnimationFrame(()=>moveTabInd(false));
  const te=parseInt(LS.get('gr_tEnd','0'),10);if(te>Date.now()){TMR.end=te;TMR.total=parseInt(LS.get('gr_tTot',pref.timer),10)||pref.timer;runTimer()}else LS.del('gr_tEnd');
  splash();
  if(!hasProfile())setTimeout(openOnboarding,splashDelay());
  else checkQuests();
  if(lost>0)setTimeout(()=>{toast(t('laziness',{xp:fmtN(lost)}),{type:'bad',icon:'flame',sub:t('decayRule'),dur:5000});if(currentRankIndex<prevRank)setTimeout(()=>toast(t('derank',{rank:rankName(currentRankIndex)}),{type:'bad',icon:'chart'}),600)},1300);
  if('serviceWorker' in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
const splashDelay=()=>$('#splash')?1300:200;
init();
