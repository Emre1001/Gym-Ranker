/* ---------- Tween ---------- */
function tween(el,to,fmt=fmtN,dur=1100){
  if(!el)return;const from=el._v==null?0:el._v;el._v=to;cancelAnimationFrame(el._raf);
  if(reduceMotion()||Math.abs(from-to)<1){el.textContent=fmt(to);return}
  const t0=performance.now();
  const f=now=>{const p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,4);el.textContent=fmt(from+(to-from)*e);if(p<1)el._raf=requestAnimationFrame(f)};
  el._raf=requestAnimationFrame(f);
}

/* ---------- Toasts ---------- */
function toast(msg,o={}){
  const type=o.type||'info',box=$('#toasts'),el=document.createElement('div');
  el.className='toast '+type;
  const ic=o.icon||({good:'check',bad:'x',pr:'trophy',rank:'bolt',info:'info'})[type]||'info';
  el.innerHTML=`<span class="t-ic">${ico(ic)}</span><span class="t-msg">${esc(msg)}${o.sub?`<small>${esc(o.sub)}</small>`:''}</span>${o.action?`<button class="t-act">${esc(o.action.label)}</button>`:''}`;
  let timer;
  const kill=()=>{clearTimeout(timer);if(el._dead)return;el._dead=1;el.classList.add('hide');setTimeout(()=>el.remove(),400)};
  if(o.action)el.querySelector('.t-act').addEventListener('click',e=>{e.stopPropagation();o.action.fn();kill()});
  el.addEventListener('click',kill);
  box.prepend(el);
  while(box.children.length>3){const last=box.lastElementChild;last.remove()}
  requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show')));
  timer=setTimeout(kill,o.dur||3200);
  return kill;
}

/* ---------- Sheet ---------- */
const SH={open:false,onClose:null,last:null};
function openSheet({title='',body='',tall=false,onClose=null}){
  const s=$('#sheet'),b=$('#sheetBody');
  if(SH.open&&SH.onClose){const cb=SH.onClose;SH.onClose=null;cb()}
  $('#sheetTitle').textContent=title;
  b.onclick=b.oninput=b.onchange=b.onkeydown=null;
  b.innerHTML='';
  if(typeof body==='string')b.innerHTML=body;else b.appendChild(body);
  [...b.children].forEach((c,i)=>c.style.setProperty('--i',i));
  b.scrollTop=0;SH.onClose=onClose;
  s.classList.toggle('tall',tall);s.style.transform='';
  if(!SH.open){
    SH.last=document.activeElement;
    $('#main').style.transformOrigin='50% '+(scrollY+innerHeight/2)+'px';
    document.body.classList.add('sheet-open','locked');
    requestAnimationFrame(()=>{s.classList.add('show');$('#sheetBackdrop').classList.add('show')});
    SH.release=BackStack.push('sheet',()=>closeSheet(true));
    setTimeout(()=>{if(SH.open&&!s.contains(document.activeElement))s.focus({preventScroll:true})},60);
  }
  SH.open=true;haptic(6);
  return b;
}
function closeSheet(fromBack){
  if(!SH.open)return;SH.open=false;
  const rel=SH.release;SH.release=null;if(rel&&fromBack!==true)rel();
  const s=$('#sheet');s.classList.remove('show');s.style.transform='';
  $('#sheetBackdrop').classList.remove('show');$('#sheetBackdrop').style.opacity='';
  document.body.classList.remove('sheet-open','locked');
  const cb=SH.onClose;SH.onClose=null;if(cb)cb();
  if(SH.last&&SH.last.focus&&finePointer())try{SH.last.focus({preventScroll:true})}catch(e){}
}
function initSheetDrag(){
  const g=$('#sheetGrab'),s=$('#sheet'),bd=$('#sheetBackdrop');let y0=null,dy=0,t0=0;
  g.addEventListener('pointerdown',e=>{if(innerWidth>=720||e.target.closest('button'))return;y0=e.clientY;dy=0;t0=performance.now();s.classList.add('dragging');g.setPointerCapture(e.pointerId)});
  g.addEventListener('pointermove',e=>{if(y0===null)return;dy=Math.max(0,e.clientY-y0);s.style.transform=`translateY(${dy}px)`;bd.style.opacity=String(Math.max(0,1-dy/400))});
  const end=()=>{if(y0===null)return;s.classList.remove('dragging');const v=dy/Math.max(1,performance.now()-t0);y0=null;bd.style.opacity='';if(dy>110||(v>.55&&dy>30))closeSheet();else s.style.transform=''};
  g.addEventListener('pointerup',end);g.addEventListener('pointercancel',end);
  bd.addEventListener('click',closeSheet);$('#sheetClose').addEventListener('click',closeSheet);
}
function confirmSheet({title,text,ok,danger=false}){
  return new Promise(res=>{
    let done=false;
    const b=openSheet({title,body:`<p class="sheet-text">${esc(text)}</p><div class="sheet-actions"><button class="btn btn-secondary" data-a="no">${esc(t('cancel'))}</button><button class="btn ${danger?'btn-danger':'btn-primary'}" data-a="yes">${esc(ok)}</button></div>`,onClose:()=>{if(!done){done=true;res(false)}}});
    b.onclick=e=>{const a=e.target.closest('[data-a]');if(!a)return;done=true;closeSheet();res(a.dataset.a==='yes')};
  });
}

/* ---------- Segmented control ---------- */
function seg(el,value,onChange){
  let ind=el.querySelector('.seg-ind');if(!ind){ind=document.createElement('span');ind.className='seg-ind';el.prepend(ind)}
  const place=anim=>{const btn=el.querySelector(`button[data-v="${CSS.escape(String(el.dataset.cur))}"]`);if(!btn)return;$$('button',el).forEach(b=>{b.classList.toggle('on',b===btn);b.setAttribute('aria-pressed',b===btn)});if(!btn.offsetWidth)return;if(!anim)ind.style.transition='none';ind.style.width=btn.offsetWidth+'px';ind.style.transform=`translateX(${btn.offsetLeft}px)`;if(!anim){void ind.offsetWidth;ind.style.transition=''}};
  el.dataset.cur=value;el._place=place;
  el.onclick=e=>{const b=e.target.closest('button[data-v]');if(!b||b.dataset.v===el.dataset.cur)return;el.dataset.cur=b.dataset.v;place(true);haptic(5);onChange&&onChange(b.dataset.v,e)};
  place(false);requestAnimationFrame(()=>place(false));
}
const syncSegs=()=>$$('.seg').forEach(s=>s._place&&s._place(false));

