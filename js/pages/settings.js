/* ============================================================
   SETTINGS
   ============================================================ */
const LANG_NAMES={de:'Deutsch',en:'English',tr:'Türkçe'};
function renderSettings(){
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  const li=(c,icon,title,sub,right,attrs='')=>`<div class="li"${attrs}><span class="li-ico" style="--c:${c}">${ico(icon)}</span><span class="li-main"><div class="li-title">${esc(title)}</div>${sub?`<div class="li-sub">${sub}</div>`:''}</span>${right||''}</div>`;
  const btn=(act,c,icon,title,sub,cls='')=>`<button class="li ${cls}" data-act="${act}"><span class="li-ico" style="--c:${c}">${ico(icon)}</span><span class="li-main"><div class="li-title">${esc(title)}</div>${sub?`<div class="li-sub">${esc(sub)}</div>`:''}</span><svg class="ico sm li-chev"><use href="#i-chev-r"/></svg></button>`;
  const sw=(k,on,dis)=>`<label class="switch"><input type="checkbox" data-pref="${k}"${on?' checked':''}${dis?' disabled':''} aria-label="${k}"><span></span></label>`;
  const segH=(id,opts)=>`<div class="seg" id="${id}">${opts.map(([v,l,i])=>`<button data-v="${v}" title="${esc(l)}">${i?ico(i,'xs'):''}${esc(l)}</button>`).join('')}</div>`;
  const devLang=LANG_NAMES[device.lang()],devTheme=t(device.theme()==='dark'?'dark':'light');
  $('#settingsView').innerHTML=`
  <div class="sec" style="margin-top:4px"><span>${esc(t('general'))}</span></div>
  <div class="list">
    <div class="li stacked"><span class="li-ico" style="--c:#0a84ff">${ico('globe')}</span><span class="li-main"><div class="li-title">${esc(t('language'))}</div><div class="li-sub">${esc(t('deviceSays',{v:devLang}))}</div></span>${segH('segLang',[['system',t('auto')],['de','DE'],['en','EN'],['tr','TR']])}</div>
    <div class="li stacked"><span class="li-ico" style="--c:#5e5ce6">${ico('auto')}</span><span class="li-main"><div class="li-title">${esc(t('appearance'))}</div><div class="li-sub">${esc(t('deviceSays',{v:devTheme}))}</div></span>${segH('segTheme',[['system',t('auto'),'auto'],['light',t('light'),'sun'],['dark',t('dark'),'moon']])}</div>
    <div class="li stacked"><span class="li-ico" style="--c:#30b0c7">${ico('scale')}</span><span class="li-main"><div class="li-title">${esc(t('weightUnit'))}</div><div class="li-sub">${esc(t('deviceSays',{v:device.unit()}))}</div></span>${segH('segUnit',[['system',t('auto')],['kg','kg'],['lbs','lbs']])}</div>
  </div>
  <p class="set-note">${esc(t('autoNote'))}</p>
  <div class="detect"><span class="pill neutral">${ico('globe','xs')}${esc(LANG_NAMES[LANG])}</span><span class="pill neutral">${ico(THEME()==='dark'?'moon':'sun','xs')}${esc(t(THEME()))}</span><span class="pill neutral">${ico('scale','xs')}${esc(UNIT())}</span><span class="pill neutral">${esc(t(reduceMotion()?'motionReduced':'motionFull'))}</span></div>

  <div class="sec"><span>${esc(t('training'))}</span></div>
  <div class="list">
    ${li('#ff9f0a','timer',t('autoTimer'),esc(t('autoTimerSub')),sw('autoTimer',pref.autoTimer))}
    <div class="li stacked"><span class="li-ico" style="--c:#ff9f0a">${ico('timer')}</span><span class="li-main"><div class="li-title">${esc(t('restDuration'))}</div></span>${segH('segTimer',[30,60,90,120,180].map(s=>[String(s),s<120?s+'s':(s/60)+' min']))}</div>
    <div class="li stacked"><span class="li-ico" style="--c:#ff375f">${ico('target')}</span><span class="li-main"><div class="li-title">${esc(t('dailyGoal'))}</div><div class="li-sub">${esc(t('dailyGoalSub'))}</div></span>${segH('segGoal',[[ '0',t('off')],['10','10'],['15','15'],['20','20'],['30','30']])}</div>
  </div>

  <div class="sec"><span>${esc(t('goalsSec'))}</span></div>
  <div class="list">
    ${btn('profile','#30d158','user',t('editProfile'),t('editProfileSub'))}
    <div class="li stacked"><span class="li-ico" style="--c:#64d2ff">${ico('steps')}</span><span class="li-main"><div class="li-title">${esc(t('stepGoal'))}</div></span>${segH('segSteps',[6000,8000,10000,12000,15000].map(v=>[String(v),NF.format(v/1000)+'k']))}</div>
    <div class="li stacked"><span class="li-ico" style="--c:#0a84ff">${ico('drop')}</span><span class="li-main"><div class="li-title">${esc(t('waterGoal'))}</div></span>${segH('segWater',[['0',t('auto')],['2000','2 L'],['2500','2,5 L'],['3000','3 L'],['3500','3,5 L']].map(([v,l])=>[v,LANG==='en'?l.replace(',','.'):l]))}</div>
  </div>

  <div class="sec"><span>${esc(t('feedback'))}</span></div>
  <div class="list">
    ${li('#34c759','vibrate',t('vibration'),navigator.vibrate?'':esc(t('notSupported')),sw('vib',pref.vib,!navigator.vibrate))}
    ${li('#ff2d55','sound',t('sound'),esc(t('soundSub')),sw('sound',pref.sound))}
  </div>

  <div class="sec"><span>App</span></div>
  <div class="list">
    ${standalone?li('#0a84ff','phone',t('installApp'),esc(t('installed')),`<span class="li-val">${ico('check','sm')}</span>`):btn('install','#0a84ff','phone',t('installApp'),t('installSub'))}
    ${finePointer()?btn('keys','#8e8e93','keyboard',t('shortcuts'),t('shortcutsSub')):''}
  </div>

  <div class="sec"><span>${esc(t('data'))}</span></div>
  <div class="list">
    ${btn('backup','#5856d6','key',t('backupCode'),t('backupCodeSub'))}
    ${btn('import','#5856d6','upload',t('importCode'),t('importCodeSub'))}
    ${btn('exportFile','#32ade6','download',t('exportFile'),t('exportFileSub'))}
    ${btn('importFile','#32ade6','file',t('importFile'),t('importFileSub'))}
    ${btn('csv','#34c759','table',t('exportCsv'),t('exportCsvSub'))}
    ${btn('reset','#ff3b30','skull',t('resetAll'),t('resetAllSub'),'danger')}
  </div>
  <div class="about">${logoSVG()}<b style="color:var(--text)">Gym Ranker</b> · Hardcore Edition · v${VERSION}<br>${esc(t('localOnly'))}<br><a href="https://github.com/Emre1001/Gym-Ranker" target="_blank" rel="noopener">GitHub</a></div>`;
  seg($('#segLang'),pref.lang==='system'||!I18N[pref.lang]?'system':pref.lang,v=>{setPref('lang',v);fadeSwap(applyLang)});
  seg($('#segTheme'),pref.theme==='light'||pref.theme==='dark'?pref.theme:'system',(v,e)=>themeSwitch(v,e));
  seg($('#segUnit'),pref.unit==='kg'||pref.unit==='lbs'?pref.unit:'system',v=>{setPref('unit',v);renderSettings();toast(t('unitSet',{u:UNIT()}),{icon:'scale'})});
  seg($('#segTimer'),String([30,60,90,120,180].includes(pref.timer)?pref.timer:90),v=>{setPref('timer',parseInt(v,10))});
  seg($('#segGoal'),String([0,10,15,20,30].includes(pref.goal)?pref.goal:0),v=>{setPref('goal',parseInt(v,10))});
  const pf=getProfile()||{};
  seg($('#segSteps'),String([6000,8000,10000,12000,15000].includes(pf.stepGoal)?pf.stepGoal:10000),v=>{const p=getProfile();if(p){p.stepGoal=parseInt(v,10);saveProfile(p)}});
  seg($('#segWater'),String([2000,2500,3000,3500].includes(pf.waterGoal)?pf.waterGoal:0),v=>{const p=getProfile();if(p){p.waterGoal=parseInt(v,10)||0;saveProfile(p)}});
}
function initSettings(){
  const v=$('#settingsView');
  v.addEventListener('change',e=>{const i=e.target.closest('[data-pref]');if(!i)return;setPref(i.dataset.pref,i.checked);haptic(8);if(i.dataset.pref==='sound'&&i.checked)SFX.pr()});
  v.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;({profile:()=>openOnboarding(true),install:installApp,keys:openShortcuts,backup:openBackup,import:openImport,exportFile,importFile:()=>$('#fileImport').click(),csv:exportCSV,reset:resetAll})[b.dataset.act]()});
  $('#fileImport').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{importAny(await f.text())}catch(err){toast(t('invalidCode'),{type:'bad'})}});
}
function fadeSwap(fn){const m=$('#main');if(reduceMotion()||!m.animate)return fn();m.animate([{opacity:1},{opacity:0}],{duration:140,easing:'ease-in'}).onfinish=()=>{fn();m.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:380,easing:'cubic-bezier(.22,1,.36,1)'})}}
function themeSwitch(v,e){
  const run=()=>{setPref('theme',v);applyTheme()};
  if(!document.startViewTransition||reduceMotion())return run();
  const x=e&&e.clientX!=null?e.clientX:innerWidth/2,y=e&&e.clientY!=null?e.clientY:innerHeight/2,r=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  const vt=document.startViewTransition(run);
  vt.ready.then(()=>document.documentElement.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${r}px at ${x}px ${y}px)`]},{duration:650,easing:'cubic-bezier(.22,1,.36,1)',pseudoElement:'::view-transition-new(root)'})).catch(()=>{});
}
function applyTheme(){
  const th=THEME();document.documentElement.dataset.theme=th;
  const m=$('meta[name="theme-color"]');if(m)m.setAttribute('content',th==='dark'?'#000000':'#f2f2f6');
  if(PAGE==='settings'){const p=$('.detect');if(p)renderSettings()}
}
function applyStatic(){
  document.documentElement.lang=LANG;
  $$('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  $$('[data-i18n-ph]').forEach(el=>el.placeholder=t(el.dataset.i18nPh));
  $$('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nAria)));
  $('#sideFoot').innerHTML=`<div><kbd>/</kbd>${esc(t('kbSearch'))}</div><div><kbd>1–8</kbd>${esc(t('kbTabs'))}</div><div style="margin-top:8px">v${VERSION}</div>`;
}
function applyLang(){LANG=resolveLang();buildFormatters();applyStatic();renderAll();requestAnimationFrame(()=>{moveTabInd(false);syncSegs()})}

/* ---------- Data import/export ---------- */
const b64e=s=>btoa(unescape(encodeURIComponent(s)));
const b64d=s=>decodeURIComponent(escape(atob(String(s).replace(/\s+/g,''))));
const EXTRA_KEYS=['gr_profile','gr_weights','gr_steps','gr_water','gr_food','gr_measures','gr_xplog','gr_quests','gr_wquests','gr_ach','gr_skills','gr_qcount','gr_chests'];
function backupData(){const extra={};EXTRA_KEYS.forEach(k=>{const v=LS.get(k);if(v!==null)extra[k]=v});return{v:4,extra,xp:totalXp,lw:lastWorkoutTime,ld:lastDecayTime,h:getHistory(),pr:getPRs(),fav:getFavs(),str:getStreak(),rec:getRecent(),custom:CUSTOM,lang:pref.lang,theme:pref.theme,timer:pref.timer,autoTimer:pref.autoTimer,vib:pref.vib,sound:pref.sound,wUnit:pref.unit,goal:pref.goal}}
function importData(d){
  if(!d||typeof d!=='object'||d.xp===undefined||d.lw===undefined)throw new Error('bad');
  totalXp=parseFloat(d.xp)||0;lastWorkoutTime=parseInt(d.lw,10)||Date.now();lastDecayTime=parseInt(d.ld||d.lw,10)||Date.now();saveState();
  if(d.v>=2){
    if(Array.isArray(d.h))saveHistory(d.h);if(d.pr)savePRs(d.pr);if(Array.isArray(d.fav))saveFavs(d.fav);if(d.str)saveStreak(d.str);
    if(Array.isArray(d.rec))LS.setJson('gr_recent',d.rec);if(Array.isArray(d.custom)){CUSTOM=d.custom;saveCustom()}
    if(d.lang)setPref('lang',d.lang);if(d.theme)setPref('theme',d.theme);if(d.timer)setPref('timer',parseInt(d.timer,10)||90);
    if(d.autoTimer!==undefined)setPref('autoTimer',!!d.autoTimer);if(d.vib!==undefined)setPref('vib',!!d.vib);if(d.sound!==undefined)setPref('sound',!!d.sound);
    if(d.wUnit)setPref('unit',d.wUnit);if(d.goal!==undefined)setPref('goal',parseInt(d.goal,10)||0);
  }
  if(d.extra&&typeof d.extra==='object')EXTRA_KEYS.forEach(k=>{if(typeof d.extra[k]==='string')LS.set(k,d.extra[k])});
  currentRankIndex=rankOf(totalXp);applyTheme();applyLang();
  toast(t('loadSuccess'),{type:'good',sub:rankName(currentRankIndex)+' · '+fmtN(totalXp)+' XP'});
}
function importAny(text){text=String(text).trim();if(!text){toast(t('noCode'),{type:'bad'});return}let d;try{d=JSON.parse(text)}catch(e){d=JSON.parse(b64d(text))}importData(d)}
function download(name,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function openBackup(){
  const code=b64e(JSON.stringify(backupData()));
  const b=openSheet({title:t('backupCode'),body:`<p class="sheet-text">${esc(t('backupText'))}</p><textarea class="input" readonly id="bkCode">${esc(code)}</textarea><div class="sheet-actions">${navigator.share?`<button class="btn btn-secondary" data-a="share">${ico('share','xs')}${esc(t('share'))}</button>`:''}<button class="btn btn-primary" data-a="copy">${ico('copy','xs')}${esc(t('copy'))}</button></div>`});
  b.onclick=async e=>{const a=e.target.closest('[data-a]');if(!a)return;
    if(a.dataset.a==='share'){try{await navigator.share({title:'Gym Ranker Backup',text:code})}catch(err){}return}
    try{await navigator.clipboard.writeText(code);toast(t('codeCopied'),{type:'good'});closeSheet()}catch(err){const ta=$('#bkCode',b);ta.select();try{document.execCommand('copy');toast(t('codeCopied'),{type:'good'});closeSheet()}catch(x){toast(t('copyManual'),{type:'bad'})}}};
}
function openImport(){
  const b=openSheet({title:t('importCode'),body:`<p class="sheet-text">${esc(t('importText'))}</p><textarea class="input" id="imCode" placeholder="${esc(t('importPh'))}"></textarea><div class="sheet-actions"><button class="btn btn-secondary" data-a="no">${esc(t('cancel'))}</button><button class="btn btn-primary" data-a="yes">${esc(t('load'))}</button></div>`});
  if(finePointer())setTimeout(()=>$('#imCode',b).focus(),250);
  b.onclick=e=>{const a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='no')return closeSheet();try{const v=$('#imCode',b).value;if(!v.trim())return toast(t('noCode'),{type:'bad'});importAny(v);closeSheet()}catch(err){toast(t('invalidCode'),{type:'bad'})}};
}
function exportFile(){download('gym-ranker-backup-'+dayKey()+'.json',JSON.stringify(backupData(),null,1),'application/json');toast(t('fileSaved'),{type:'good'})}
function exportCSV(){
  const h=getHistory();if(!h.length)return toast(t('noData'),{type:'bad'});
  const f=UNIT()==='lbs'?LBS:1;let csv='﻿Date,Time,Exercise,Muscle,Weight ('+UNIT()+'),Reps,Seconds,Bodyweight ('+UNIT()+'),XP\n';
  h.forEach(e=>{const ex=getEx(e.exId),d=new Date(e.ts);csv+=`${dayKey(e.ts)},${pad2(d.getHours())}:${pad2(d.getMinutes())},"${(ex?exName(ex):e.exId).replace(/"/g,'""')}",${ex?t(ex.muscle):''},${Math.round(e.weight*f*10)/10},${e.reps},${e.s!=null?e.s:''},${e.bw?Math.round(e.bw*f*10)/10:''},${Math.floor(e.xp)}\n`});
  download('gym-ranker-export.csv',csv,'text/csv;charset=utf-8');toast(t('csvExported'),{type:'good'});
}
async function resetAll(){
  if(!await confirmSheet({title:t('resetTitle'),text:t('resetText'),ok:t('yesDelete'),danger:true}))return;
  try{localStorage.clear()}catch(e){}LS.set('gr_migrated','true');sessionStorage.setItem('gr_splash','1');location.reload();
}
let deferredInstall=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});
function installApp(){
  if(deferredInstall){deferredInstall.prompt();deferredInstall.userChoice.finally(()=>{deferredInstall=null});return}
  const ua=navigator.userAgent;
  openSheet({title:t('installApp'),body:`<p class="sheet-text">${esc(/iPad|iPhone|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)?t('installIos'):/android/i.test(ua)?t('installAndroid'):t('installDesktop'))}</p><div class="sheet-actions"><button class="btn btn-primary" onclick="closeSheet()">${esc(t('gotIt'))}</button></div>`});
}
function openShortcuts(){
  const k=(keys,label)=>`<div class="sess"><span style="text-transform:none">${esc(label)}</span><span>${keys.map(x=>`<kbd style="font:600 12px/1 var(--font);border:1px solid var(--line-2);border-radius:6px;padding:4px 7px;margin-left:4px">${x}</kbd>`).join('')}</span></div>`;
  openSheet({title:t('shortcuts'),body:`<div>${k(['/'],t('kbSearch'))}${k(['⌘','K'],t('kbSearch'))}${k(['Enter'],t('kbLog'))}${k(['1','–','8'],t('kbTabs'))}${k(['T'],t('kbTimer'))}${k(['Esc'],t('kbClose'))}</div>`});
}

