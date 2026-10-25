/* ============================================================
   NAVIGATION
   ============================================================ */
const PAGES=['train','library','history','progress','settings'];
const LEGACY={home:'train',exercises:'library',stats:'progress',body:'progress'};
let PAGE=null;const scrollMem={};let titleObs=null;
function renderPage(p){({train:renderTrain,library:renderLibrary,history:renderHistory,progress:renderProgress,settings:renderSettings})[p]()}
function renderAll(){renderPage(PAGE||'train');if(PAGE!=='train')renderTrain()}
function go(p){
  p=LEGACY[p]||p;if(!PAGES.includes(p))p='train';
  if(p===PAGE){window.scrollTo({top:0,behavior:reduceMotion()?'auto':'smooth'});return}
  if(PAGE)scrollMem[PAGE]=scrollY;
  PAGE=p;
  $$('.page').forEach(s=>s.classList.toggle('active',s.id==='page-'+p));
  $$('.tab').forEach(b=>{const on=b.dataset.page===p;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
  moveTabInd(true);
  renderPage(p);
  const el=$('#page-'+p);[...el.children].forEach((c,i)=>c.style.setProperty('--i',i));
  el.classList.remove('in');void el.offsetWidth;el.classList.add('in');
  window.scrollTo(0,scrollMem[p]||0);
  if(location.hash!=='#'+p)history.replaceState(null,'','#'+p);
  $('#navbarTitle').textContent=t(el.dataset.title);
  if(titleObs){titleObs.disconnect();titleObs.observe($('.ph-title',el))}
  requestAnimationFrame(syncSegs);
}
function moveTabInd(anim){
  const on=$('.tab.on'),ind=$('#tabInd');if(!on||!on.offsetWidth)return;
  if(!anim)ind.style.transition='none';
  ind.style.width=on.offsetWidth+'px';ind.style.height=on.offsetHeight+'px';ind.style.transform=`translate(${on.offsetLeft}px,${on.offsetTop}px)`;
  if(!anim){void ind.offsetWidth;ind.style.transition=''}
}

/* ============================================================
   INIT
   ============================================================ */
function bindGlobal(){
  $('#tabbar').addEventListener('click',e=>{const b=e.target.closest('.tab');if(b){haptic(4);go(b.dataset.page)}});
  $('#picker').addEventListener('click',openPicker);
  $('#btnLog').addEventListener('click',logSet);
  $('#recentRow').addEventListener('click',e=>{const c=e.target.closest('[data-ex]');if(c){haptic(5);selectEx(c.dataset.ex)}});
  $('#hero').addEventListener('click',openLadder);
  $('#hero').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openLadder()}});
  $('#streakPill').addEventListener('click',()=>{const s=liveStreak();toast(t('streakInfo',{n:s,best:getStreak().longest||0}),{icon:'flame',sub:t('streakRule')})});
  $$('.tool').forEach(b=>b.addEventListener('click',()=>({timer:openTimerSheet,plates:openPlates,orm:openOrm})[b.dataset.tool]()));
  $('#tpAdd').addEventListener('click',()=>{TMR.end+=30000;TMR.total+=30;LS.set('gr_tEnd',TMR.end);LS.set('gr_tTot',TMR.total);tickTimer();haptic(5)});
  $('#tpSkip').addEventListener('click',()=>{stopTimer();haptic(5)});
  $('#celBtn').addEventListener('click',closeCelebrate);
  $('#celebrate').addEventListener('click',e=>{if(e.target===e.currentTarget)closeCelebrate()});
  $('#histMore').addEventListener('click',()=>{histDays+=14;renderHistory()});
  // delegated actions across pages
  $('#main').addEventListener('click',e=>{
    const g=e.target.closest('[data-go]');if(g){go(g.dataset.go);return}
    const d=e.target.closest('[data-detail]');if(d){openExDetail(d.dataset.detail);return}
    const h=e.target.closest('.h-row[data-ts]');if(h){openSetSheet(parseInt(h.dataset.ts,10));return}
    const m=e.target.closest('[data-muscle]');if(m&&PAGE==='progress'){openMuscleSheet(m.dataset.muscle)}
  });
  $('#todayList').addEventListener('keydown',e=>{const d=e.target.closest('[data-detail]');if(d&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openExDetail(d.dataset.detail)}});
  document.addEventListener('keydown',e=>{
    const el=document.activeElement,typing=el&&(/INPUT|TEXTAREA|SELECT/.test(el.tagName)||el.isContentEditable);
    if(e.key==='Escape'){if($('#celebrate').classList.contains('show'))closeCelebrate();else if(SH.open)closeSheet();return}
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(PAGE!=='train')go('train');openPicker();return}
    if(typing){
      if(e.key==='Enter'&&el.id==='inWeight'){e.preventDefault();$('#inReps').focus()}
      else if(e.key==='Enter'&&el.id==='inReps'){e.preventDefault();logSet()}
      else if((e.key==='ArrowUp'||e.key==='ArrowDown')&&(el.id==='inWeight'||el.id==='inReps')){e.preventDefault();stepValue(el.id==='inWeight'?'w':'r',e.key==='ArrowUp'?1:-1)}
      return;
    }
    if(SH.open||e.metaKey||e.ctrlKey||e.altKey)return;
    if(e.key==='/'){e.preventDefault();if(PAGE!=='train')go('train');openPicker()}
    else if(/^[1-5]$/.test(e.key))go(PAGES[parseInt(e.key,10)-1]);
    else if(e.key.toLowerCase()==='t'){TMR.end?stopTimer():startTimer()}
  });
  window.addEventListener('hashchange',()=>go(location.hash.slice(1)));
  let rz;window.addEventListener('resize',()=>{moveTabInd(false);syncSegs();clearTimeout(rz);rz=setTimeout(()=>{if(PAGE==='progress'&&PROG==='overview')mountXpChart(getHistory())},200)});
  matchMedia('(prefers-color-scheme: light)').addEventListener('change',()=>{if(THEME()===document.documentElement.dataset.theme)return;applyTheme();if(PAGE==='settings')renderSettings()});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(PAGE==='settings')renderSettings()});
  window.addEventListener('languagechange',()=>{if(pref.lang==='system')applyLang()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible')return;const lost=applyDecay();if(lost>0)toast(t('laziness',{xp:fmtN(lost)}),{type:'bad',icon:'flame'});currentRankIndex=rankOf(totalXp);if(TMR.end)tickTimer();if(PAGE==='train')renderTrain()});
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
  const prevRank=rankOf(totalXp),lost=applyDecay();currentRankIndex=rankOf(totalXp);
  initSheetDrag();initSteppers();initLibrary();initSettings();bindGlobal();
  if(SEL&&getEx(SEL)){const last=lastSet(SEL);if(last){$('#inWeight').value=fmtInput(toDisp(last.weight));$('#inReps').value=last.reps}}
  go(location.hash.slice(1)||'train');
  requestAnimationFrame(()=>moveTabInd(false));
  const te=parseInt(LS.get('gr_tEnd','0'),10);if(te>Date.now()){TMR.end=te;TMR.total=parseInt(LS.get('gr_tTot',pref.timer),10)||pref.timer;runTimer()}else LS.del('gr_tEnd');
  splash();
  if(lost>0)setTimeout(()=>{toast(t('laziness',{xp:fmtN(lost)}),{type:'bad',icon:'flame',sub:t('decayRule'),dur:5000});if(currentRankIndex<prevRank)setTimeout(()=>toast(t('derank',{rank:rankName(currentRankIndex)}),{type:'bad',icon:'chart'}),600)},1300);
  if('serviceWorker' in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
init();
