/* ============================================================
   PROFILE — who you are, rank, achievements, links to the rest
   ============================================================ */
function renderProfile(){
  const p=getProfile()||{},i=rankOf(totalXp),r=RANKS[i],col=tierColor(r.tier),got=getAch(),m=achMetrics();
  const nm=p.name||'?',ini=nm.trim().slice(0,1).toUpperCase();
  $('#profEyebrow').textContent=t('memberSince',{d:fmtDate(p.created||Date.now(),{month:'long',year:'numeric'})});
  const unlocked=ACHIEVEMENTS.filter(a=>got[a.id]).length;
  const head=`<div class="card prof-card span" style="--tier:${col}">
    <div class="prof-top"><div class="avatar"><span>${esc(ini)}</span><i>${emblem(i)}</i></div>
      <div class="prof-main"><div class="prof-name">${esc(t('hello',{name:nm}))}</div><div class="prof-rank${r.tier===10?' tier-fire':''}">${esc(rankName(i))} · <span class="num">${fmtN(totalXp)} XP</span></div>
      <div class="prof-facts">${p.height?`<span class="pill neutral">${ageOf(p)} ${esc(t('yearsShort'))}</span><span class="pill neutral num">${p.height} cm</span><span class="pill neutral num">${fmtW(bodyWeight())}</span>`:''}${p.goal?`<span class="pill accent">${ico(GOAL_ICONS[p.goal],'xs')}${esc(t('goal_'+p.goal))}</span>`:''}</div></div></div>
    <div class="prof-stats"><div class="kv"><b class="num">${liveStreak()}</b><span>${esc(t('streak'))}</span></div><div class="kv"><b class="num">${unlocked}<small>/${ACHIEVEMENTS.length}</small></b><span>${esc(t('achievements'))}</span></div><div class="kv"><b class="num">${skillCount()}<small>/${skillTotal()}</small></b><span>${esc(t('skills'))}</span></div><div class="kv"><b class="num">${fmtN(m.days)}</b><span>${esc(t('trainingDays'))}</span></div></div>
  </div>`;
  const links=`<div class="list">
    ${navRow('library','library','#ff9f0a',t('navLibrary'),t('exCountShort',{n:fmtN(allEx().length)}))}
    ${navRow('history','history','#0a84ff',t('navHistory'),t('histSummary',{sets:fmtN(getHistory().length),days:fmtN(m.days)}))}
    <button class="li" data-act="editProfile"><span class="li-ico" style="--c:#30d158">${ico('user')}</span><span class="li-main"><div class="li-title">${esc(t('editProfile'))}</div><div class="li-sub">${esc(t('editProfileSub'))}</div></span>${ico('chev-r','sm li-chev')}</button>
    ${navRow('settings','sliders','#8e8e93',t('navSettings'),t('settingsSub'))}
  </div>`;
  const order=ACHIEVEMENTS.slice().sort((a,b)=>(!!got[b.id]-!!got[a.id])||((m[b.m]/b.goal)-(m[a.m]/a.goal)));
  const badges=`<div class="card span"><div class="card-head"><h3 class="card-title">${esc(t('achievements'))}</h3><span class="card-sub num">${unlocked} / ${ACHIEVEMENTS.length}</span></div><div class="ach-grid">${order.map((a,k)=>{const on=!!got[a.id],pct=clamp(m[a.m]/a.goal,0,1);return `<button class="ach${on?' on':''}" data-ach="${a.id}" style="--i:${k}"><span class="ach-badge">${ico(a.icon)}</span><span class="ach-name">${esc(t('a_'+a.id))}</span>${on?'':`<span class="ach-bar"><i style="width:${pct*100}%"></i></span>`}</button>`}).join('')}</div></div>`;
  $('#profileView').innerHTML=`<div class="grid-2">${head}<div class="col"><div class="sec" style="margin-top:4px"><span>${esc(t('more'))}</span></div>${links}</div><div class="col">${xpSourcesCard()}</div>${badges}</div>`;
}
const navRow=(page,icon,c,title,sub)=>`<button class="li" data-go="${page}"><span class="li-ico" style="--c:${c}">${ico(icon)}</span><span class="li-main"><div class="li-title">${esc(title)}</div><div class="li-sub">${esc(sub)}</div></span>${ico('chev-r','sm li-chev')}</button>`;
/* where your XP came from: sets vs quests, skills, achievements */
function xpSourcesCard(){
  const sets=getHistory().reduce((s,e)=>s+entryXp(e),0),log=getXpLog(),by={};log.forEach(x=>{const k=x.k==='chest'?'quest':x.k;by[k]=(by[k]||0)+x.xp});
  const rows=[['sets',sets,'#ff4d2e'],['quest',(by.quest||0)+(by.wquest||0),'#ffc83d'],['skill',by.skill||0,'#14bfc2'],['ach',by.ach||0,'#a27bff']];
  const tot=Math.max(1,rows.reduce((s,r)=>s+r[1],0));
  return `<div class="sec" style="margin-top:4px"><span>${esc(t('xpSources'))}</span></div><div class="card">${rows.map(([k,v,c],i)=>`<div class="dist-row" style="--c:${c}"><span class="dn">${esc(t('src_'+k))}</span><span class="dt"><i style="width:${v/tot*100}%;--i:${i}"></i></span><span class="dv num">${fmtNC(v)}</span></div>`).join('')}</div>`;
}
function openAch(id){
  const a=ACHIEVEMENTS.find(x=>x.id===id);if(!a)return;
  const got=getAch()[id],m=achMetrics(),cur=Math.min(m[a.m],a.goal);
  openSheet({title:t('achievement'),body:`<div class="ach-detail${got?' on':''}"><span class="ach-badge xl">${ico(a.icon,'lg')}</span><h4>${esc(t('a_'+a.id))}</h4><p>${esc(t('m_'+a.m,{n:fmtAchGoal(a)}))}</p>
    ${got?`<span class="pill good">${ico('check','xs')}${esc(t('unlockedOn',{d:fmtDate(got,{day:'numeric',month:'long',year:'numeric'})}))}</span>`:`<div class="bar" style="--tier:var(--accent)"><i style="width:${cur/a.goal*100}%"></i></div><p class="num">${fmtAchVal(a,cur)} / ${fmtAchGoal(a)}</p>`}
    <div class="pill gold" style="margin-top:12px">+${fmtN(a.xp)} XP</div></div>`});
}
const fmtAchGoal=a=>a.m==='volume'?fmtVol(a.goal):a.m==='moved'?fmtW(a.goal):a.m==='rank'?rankName(a.goal):fmtN(a.goal);
const fmtAchVal=(a,v)=>a.m==='volume'?fmtVol(v):a.m==='moved'?fmtW(v):a.m==='rank'?rankName(v):fmtN(v);
function initProfile(){
  $('#profileView').addEventListener('click',e=>{
    const a=e.target.closest('[data-ach]');if(a){openAch(a.dataset.ach);return}
    const act=e.target.closest('[data-act]');if(act&&act.dataset.act==='editProfile')openOnboarding(true);
  });
}
