/* Shared presentation, synthesized audio and accessible interactions.
   Sound/card/confetti/router patterns are retained from the original implementation. */
(function (G) {
  'use strict';
  const $=(s,root=document)=>s?root.querySelector(s):null,$$=(s,root=document)=>[...root.querySelectorAll(s)];
  const numberFormat=new Intl.NumberFormat('en-US',{maximumFractionDigits:2});
  const compactFormat=new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2});
  const fmt=n=>numberFormat.format(Number.isFinite(n)?n:0);
  const compact=n=>Math.abs(n)>=1e7?compactFormat.format(n):fmt(n);
  const short=n=>Math.abs(n)>=1000?compactFormat.format(n):fmt(n);
  const osMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const motion=()=>G.Wallet.prefs.reducedMotion||osMotion.matches;
  const duration=ms=>motion()?Math.min(70,ms):ms;
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,duration(ms)));
  const S={ctx:null,master:null,on:G.Wallet.prefs.sound,
    init(){if(!this.on)return;
      if(!this.ctx){try{this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=this.on?.8:0;this.master.connect(this.ctx.destination);}catch(_){return;}}
      if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
    },
    set(on){this.on=on;if(on&&(this.ctx||navigator.userActivation?.hasBeenActive))this.init();if(this.master&&this.ctx)this.master.gain.setTargetAtTime(on?.8:0,this.ctx.currentTime,.02);},
    tone(f,d=.1,type='sine',v=.12,delay=0){if(!this.on||!this.ctx||this.ctx.state!=='running')return;
      const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=f;
      g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(this.master);o.start(t);o.stop(t+d+.02);
      o.onended=()=>{o.disconnect();g.disconnect();};
    },
    click(){this.tone(620,.045,'triangle',.035);},
    chip(){this.tone(1350,.04,'square',.018);this.tone(1750,.04,'square',.014,.025);},
    card(){this.tone(290,.05,'triangle',.045);this.tone(95,.07,'sine',.045);},
    win(){[523,659,784,1047].forEach((f,i)=>this.tone(f,.16,'triangle',.055,i*.085));},
    big(){[523,659,784,1047,1319,1568].forEach((f,i)=>this.tone(f,.21,'triangle',.06,i*.09));},
    lose(){this.tone(210,.16,'triangle',.035);this.tone(150,.22,'triangle',.03,.14);},
    spin(){this.tone(220,.35,'sine',.03);}
  };
  document.addEventListener('pointerdown',()=>S.init());
  document.addEventListener('keydown',()=>S.init(),{once:true});
  // Presentation only: no random draws, chip changes or settlement callbacks here.
  const UI_EASE='cubic-bezier(.22,.8,.24,1)',uiAnimations=new WeakMap(),liveUI=new Set(),liveSpins=new Set();
  function animateUI(el,frames,options={}){
    if(!el)return null;uiAnimations.get(el)?.cancel();
    if(motion()||document.hidden||typeof el.animate!=='function')return null;
    try{
      const a=el.animate(frames,{duration:220,easing:UI_EASE,...options,fill:'none'});
      uiAnimations.set(el,a);liveUI.add(a);
      const clean=()=>{liveUI.delete(a);if(uiAnimations.get(el)===a)uiAnimations.delete(el);};
      a.finished.then(clean,clean);return a;
    }catch(_){return null;}
  }
  function setNumber(el,value,format=compact){
    const text=format(value);if(el.textContent===text)return;
    // The number is ALWAYS the current ledger value, never an interpolated fake balance.
    el.textContent=text;animateUI(el,[{opacity:.55,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:240});
  }
  function spinWheel({wheel,from,to,step,pointer,companions=[],milliseconds=4200}){
    return new Promise(resolve=>{
      let done=false,raf=0,timer=0,animation=null,lastTick=-Infinity;
      const view=wheel?.closest('.view'),entries=[{el:wheel,from,to},...companions],animations=[];
      let boundary=Math.floor((from+step/2)/step);
      const visual={finish,wake};
      function finish(){
        if(done)return;done=true;clearTimeout(timer);cancelAnimationFrame(raf);liveSpins.delete(visual);
        for(const entry of entries)if(entry.el){entry.el.style.transition='none';entry.el.style.transform=`rotate(${entry.to}deg)`;entry.el.style.willChange='';}
        animations.forEach(a=>a.cancel());if(pointer)uiAnimations.get(pointer)?.cancel();
        if(wheel){wheel.dataset.spinning='false';wheel.closest('.prize-stage,.rl-stage')?.classList.remove('is-spinning');}
        resolve();
      }
      function tick(now){
        raf=0;if(done||!animation||document.hidden||view&&!view.classList.contains('active'))return;
        const progress=animation.effect.getComputedTiming().progress;
        const angle=from+(to-from)*(progress??0),current=Math.floor((angle+step/2)/step);
        if(current!==boundary){
          boundary=current;
          if(now-lastTick>=45){
            lastTick=now;S.tone(810,.022,'triangle',.014);
            animateUI(pointer,[{transform:'translateX(-50%) rotate(-9deg)'},{transform:'translateX(-50%) rotate(0deg)'}],{duration:95,easing:'ease-out'});
          }
        }
        raf=requestAnimationFrame(tick);
      }
      function wake(){if(!done&&animation&&!raf&&!document.hidden&&(!view||view.classList.contains('active')))raf=requestAnimationFrame(tick);}
      liveSpins.add(visual);
      if(wheel){wheel.dataset.spinning='true';wheel.closest('.prize-stage,.rl-stage')?.classList.add('is-spinning');}
      // Underlying final transforms are set first: cancellation or a missing API snaps
      // to the SAME preselected result, never a new draw. The controller pays once.
      try{
        for(const entry of entries)if(entry.el){entry.el.style.transition='none';entry.el.style.transform=`rotate(${entry.to}deg)`;entry.el.style.willChange='transform';}
        if(!wheel||motion()||document.hidden||typeof wheel.animate!=='function'){finish();return;}
        for(const entry of entries)if(entry.el){
          const a=entry.el.animate([{transform:`rotate(${entry.from}deg)`},{transform:`rotate(${entry.to}deg)`}],{duration:milliseconds,easing:'cubic-bezier(.18,0,.12,1)',fill:'none'});
          animations.push(a);a.finished.catch(()=>{});
        }
        animation=animations[0];animation.finished.then(finish,finish);
        // Also recover from interrupted effects / missed completion events.
        timer=setTimeout(finish,milliseconds+180);wake();
      }catch(_){finish();}
    });
  }
  G.on('view',()=>liveSpins.forEach(v=>v.wake()));
  let leavingDocument=false;
  // Navigation/reload must keep the original persisted-stake refund policy.
  // pagehide precedes the navigation's visibilitychange; ordinary tab hiding does not.
  window.addEventListener('pagehide',()=>{leavingDocument=true;});
  window.addEventListener('pageshow',()=>{leavingDocument=false;liveSpins.forEach(v=>v.wake());});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(!leavingDocument)liveSpins.forEach(v=>v.finish());liveUI.forEach(a=>a.cancel());}
  });
  function toast(msg,type='info'){
    const el=document.createElement('div');el.className='toast '+type;el.textContent=msg;
    $('#toasts').append(el);while($('#toasts').children.length>4)$('#toasts').firstChild.remove();
    setTimeout(()=>el.classList.add('out'),3100);setTimeout(()=>el.remove(),3450);
  }
  G.on('notice',({text,type})=>toast(text,type));
  // Confetti retains the original particle system, with bounded particles and motion/effects preferences.
  const cCvs=$('#confetti'),cCtx=cCvs.getContext('2d');let confs=[],confRAF=0;
  function confetti(){
    if(motion()||!G.Wallet.prefs.effects)return;
    cCvs.width=innerWidth;cCvs.height=innerHeight;
    const cols=['#e4cc94','#b49a5e','#f6eacb','#a9bc83','#6c9373'];
    for(let i=0;i<85;i++)confs.push({x:Math.random()*innerWidth,y:-30-Math.random()*innerHeight*.4,vx:(Math.random()-.5)*3,vy:2+Math.random()*4,w:4+Math.random()*5,h:6+Math.random()*6,r:Math.random()*Math.PI,vr:(Math.random()-.5)*.2,c:cols[i%5]});
    confs=confs.slice(-170);if(!confRAF)confLoop();
  }
  function clearConfetti(){confs=[];cancelAnimationFrame(confRAF);confRAF=0;cCtx.clearRect(0,0,cCvs.width,cCvs.height);}
  function confLoop(){
    cCtx.clearRect(0,0,cCvs.width,cCvs.height);
    confs.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.04;p.r+=p.vr;cCtx.save();cCtx.translate(p.x,p.y);cCtx.rotate(p.r);cCtx.fillStyle=p.c;cCtx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cCtx.restore();});
    confs=confs.filter(p=>p.y<cCvs.height+40);
    confRAF=confs.length?requestAnimationFrame(confLoop):(cCtx.clearRect(0,0,cCvs.width,cCvs.height),0);
  }
  function cardEl(c,down=false){
    const el=document.createElement('div');const isRed=c.s==='♥'||c.s==='♦',court=['J','Q','K'].includes(c.r);
    el.className='card deal-anim'+(down?' down':'')+(isRed?' red':'')+(court?' court':'');
    el.setAttribute('role','img');el.setAttribute('aria-label',down?'Face-down Golden Ace card':`${c.r} of ${G.Art.suitName(c.s)}s`);el.dataset.rank=c.r;el.dataset.suit=c.s;
    el.innerHTML=`<div class="card-inner"><div class="face front"><div class="corner tl"><b>${c.r}</b>${G.Art.suit(c.s)}</div>${court?'<div class="court-frame"></div>':''}<div class="pip">${G.Art.suit(c.s)}</div><div class="corner br"><b>${c.r}</b>${G.Art.suit(c.s)}</div></div><div class="face back"><svg viewBox="0 0 94 136" class="back-art" aria-hidden="true">${G.Art.card('A','♠',true)}</svg></div></div>`;
    return el;
  }
  function revealCard(el,c){el.classList.remove('down');el.setAttribute('aria-label',`${c.r} of ${G.Art.suitName(c.s)}s`);}
  function rackInit(sel,onPick,canPick=()=>true){
    $$(sel+' .chip').forEach(ch=>ch.addEventListener('click',()=>{
      if(ch.disabled||!canPick())return;
      $$(sel+' .chip').forEach(x=>x.classList.toggle('sel',x===ch));ch.setAttribute('aria-pressed','true');
      $$(sel+' .chip').filter(x=>x!==ch).forEach(x=>x.setAttribute('aria-pressed','false'));S.chip();onPick(+ch.dataset.v);
    }));
  }
  function setupBet(prefix,onChange=()=>{},isLocked=()=>false){
    const module=$('#'+prefix+'-bet-module'),input=$('#'+prefix+'-stake');
    const update=()=>{const v=Number(input.value);$$('[data-stake]',module).forEach(b=>b.classList.toggle('selected',+b.dataset.stake===v));onChange();};
    module.addEventListener('click',e=>{
      const button=e.target.closest('button');if(!button||button.disabled||isLocked())return;
      let value=Number(input.value)||25;
      if(button.dataset.stake)value=+button.dataset.stake;
      if(button.dataset.adjust==='half')value/=2;
      if(button.dataset.adjust==='double')value*=2;
      input.value=Math.min(G.CONFIG.maxStake,Math.max(G.CONFIG.minStake,Math.round(value*100)/100));update();S.chip();
    });
    input.addEventListener('input',update);
    input.addEventListener('change',()=>{if(isLocked())return;const v=Number(input.value);if(G.Wallet.validStake(v))input.value=Math.round(v*100)/100;update();});
  }
  function getBet(prefix){const val=$('#'+prefix+'-stake').value;return val.trim()===''?NaN:Number(val);}
  function lockBet(prefix,locked){$$('input,button',$('#'+prefix+'-bet-module')).forEach(el=>el.disabled=locked);}
  function resultMarkup(label,r){
    // All labels passed here are internal rule strings, not user-entered HTML.
    const sign=r.net>0?'+':r.net<0?'−':'';
    return `<span class="result-main">${label}</span><span class="result-detail">Returned ${fmt(r.returned)} chips · net ${sign}${fmt(Math.abs(r.net))}</span>${r.capped?'<span class="capped-note">Return capped at the simulator / wallet limit.</span>':''}`;
  }
  function setResult(prefix,label,r){const el=$('#'+prefix+'-result');el.className='round-message '+(r.net>0?'good':r.net<0?'bad':'');el.innerHTML=resultMarkup(label,r);}
  function feedback(r,big=false){
    if(!r)return;
    const ids={blackjack:'bj-msg',roulette:'rl-result',slots:'sl-result',poker:'vp-msg',plinko:'pl-status',baccarat:'ba-result',crash:'cr-result',hilo:'hl-result',dice:'di-result',mines:'mn-result',wheel:'lw-result'};
    const result=document.getElementById(ids[r.record?.game]);
    if(r.record?.game==='slots')animateUI(result,[{opacity:.45},{opacity:1}]);
    else animateUI(result,[{opacity:.55,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}]);
    if(r.net>0){big?S.big():S.win();if(big)confetti();toast(`Returned ${fmt(r.returned)} chips · net +${fmt(r.net)}`,'good');}
    else if(r.net<0)S.lose();else S.click();
  }
  let activeModal=null,previousFocus=null,confirmAction=null,closingModal=null,finishClosing=null,modalVersion=0;
  function inertBackground(on){
    $('#main').inert=on;$('.topbar').inert=on;
    const sidebar=$('#sidebar');sidebar.inert=on||(mobileNav.matches&&!sidebar.classList.contains('show'));sidebar.setAttribute('aria-hidden',String(sidebar.inert));
  }
  const Modal={
    get active(){return activeModal;},
    open(id){
      const modal=document.getElementById(id);if(!modal||activeModal===modal)return;
      const chain=!!(activeModal||closingModal);finishClosing?.(false);
      if(activeModal){uiAnimations.get(activeModal)?.cancel();activeModal.classList.add('hidden');activeModal.inert=true;activeModal.setAttribute('aria-hidden','true');}
      if(!chain)previousFocus=document.activeElement;
      if(id!=='confirmModal')confirmAction=null;
      const version=++modalVersion;activeModal=modal;modal.inert=false;modal.removeAttribute('aria-hidden');modal.classList.remove('hidden');
      $('.modal-box',modal).style.animation='';document.body.classList.add('modal-open');inertBackground(true);
      if(id==='statsModal')renderStats();
      if(id==='settingsModal')renderPreferences();
      if(id==='rewardsModal')updateBrokeUI(false);
      if(id==='redeemModal'){$('#redeemInput').value='';$('#redeemInput').removeAttribute('aria-invalid');$('#redeemFeedback').textContent='';$('#redeemFeedback').className='form-feedback';}
      animateUI(modal,[{opacity:0},{opacity:1}],{duration:160});
      requestAnimationFrame(()=>{
        if(activeModal!==modal||version!==modalVersion)return;
        const focus=$('input:not(:disabled),button:not(.modal-close):not(:disabled),[tabindex="0"]',modal)||$('button',modal)||$('.modal-box',modal);focus?.focus({preventScroll:true});
      });
    },
    close(restore=true){
      if(!activeModal){if(!restore)finishClosing?.(false);return;}
      const modal=activeModal,box=$('.modal-box',modal),version=++modalVersion;
      activeModal=null;confirmAction=null;closingModal=modal;modal.inert=true;modal.setAttribute('aria-hidden','true');
      let timer=0,exit=null,boxExit=null;
      const complete=(shouldRestore=restore)=>{
        if(version!==modalVersion)return;clearTimeout(timer);closingModal=null;finishClosing=null;
        modal.classList.add('hidden');exit?.cancel();boxExit?.cancel();document.body.classList.remove('modal-open');inertBackground(false);
        if(shouldRestore&&previousFocus?.isConnected&&!previousFocus.closest('.hidden,[inert]'))previousFocus.focus({preventScroll:true});
      };
      finishClosing=complete;
      if(!restore||motion()||document.hidden){complete();return;}
      const style=getComputedStyle(box),transform=style.transform,opacity=Number(style.opacity)*Number(getComputedStyle(modal).opacity);
      box.style.animation='none';
      exit=animateUI(modal,[{opacity},{opacity:0}],{duration:140});
      boxExit=animateUI(box,[{transform},{transform:'translateY(6px) scale(.985)'}],{duration:140});
      if(!exit){complete();return;}exit.finished.then(()=>complete(),()=>complete());timer=setTimeout(()=>complete(),190);
    },
    confirm(title,text,action){
      $('#confirmTitle').textContent=title;$('#confirmText').textContent=text;
      this.open('confirmModal');confirmAction=action;
    }
  };
  $('#confirmYes').addEventListener('click',()=>{if(activeModal?.id!=='confirmModal'||!confirmAction)return;const action=confirmAction;confirmAction=null;Modal.close();action();});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-close]')){Modal.close();return;}
    const open=e.target.closest('[data-open]');if(open){S.click();Modal.open(open.dataset.open);return;}
    if(e.target.classList.contains('modal')&&e.target.id!=='confirmModal'){Modal.close();return;}
    const view=e.target.closest('[data-view]');if(view){showView(view.dataset.view);return;}
    const browse=e.target.closest('[data-action="browse"]');if(browse){showView('lobby');requestAnimationFrame(()=>$('#games').scrollIntoView({behavior:motion()?'instant':'smooth',block:'start'}));return;}
    const rules=e.target.closest('[data-rules]');if(rules)showRules(rules.dataset.rules);
  });
  document.addEventListener('keydown',e=>{
    if(activeModal){
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();Modal.close();return;}
      if(e.key==='Tab'){
        const focusable=$$('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]',activeModal).filter(x=>x.getClientRects().length);
        const first=focusable[0],last=focusable.at(-1);
        if(e.shiftKey&&(document.activeElement===first||!activeModal.contains(document.activeElement))){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }return;
    }
    if(closingModal){e.preventDefault();if(e.key==='Escape')finishClosing?.();return;}
    const target=e.target,typing=target.closest('input,select,textarea,[contenteditable=true]');
    if(e.key==='Escape'){e.preventDefault();if($('#sidebar').classList.contains('show'))toggleMenu(false);else showView('lobby');return;}
    if(typing||e.repeat)return;
    if(e.key==='/'&&G.currentView==='lobby'){e.preventDefault();$('#gameSearch').focus();return;}
    if(e.code==='Space'&&!target.closest('button,a')){
      const map={blackjack:'#bj-deal',roulette:'#rl-spin',slots:'#sl-spin',poker:'#vp-deal',plinko:'#pl-drop',baccarat:'#ba-start',crash:'#cr-start',hilo:'#hl-start',dice:'#di-start',mines:'#mn-start',wheel:'#lw-start'};
      const button=$(map[G.currentView]);if(button&&!button.disabled){e.preventDefault();button.click();}
    }
  });
  const mobileNav=matchMedia('(max-width:960px)');
  function toggleMenu(on=!$('#sidebar').classList.contains('show')){
    const sidebar=$('#sidebar'),restoreFocus=!on&&mobileNav.matches&&sidebar.contains(document.activeElement);
    sidebar.classList.toggle('show',on);sidebar.inert=!!(activeModal||closingModal)||(mobileNav.matches&&!on);sidebar.setAttribute('aria-hidden',String(sidebar.inert));
    $('#navBackdrop').classList.toggle('hidden',!on);$('#menuBtn').setAttribute('aria-expanded',String(on));$('#menuBtn').setAttribute('aria-label',on?'Close game navigation':'Open game navigation');
    if(on&&mobileNav.matches)$('.side-link.active',sidebar)?.focus();else if(restoreFocus)$('#menuBtn').focus();
  }
  mobileNav.addEventListener('change',()=>toggleMenu(false));toggleMenu(false);
  $('#menuBtn').addEventListener('click',()=>toggleMenu());$('#navBackdrop').addEventListener('click',()=>toggleMenu(false));
  function showView(id,{fromHistory=false}={}){
    if(id==='admin'&&!G.adminUnlocked)return false;
    const view=document.getElementById('view-'+id);if(!view)return false;
    Modal.close(false);toggleMenu(false);
    $$('.view').forEach(v=>v.classList.toggle('active',v===view));G.currentView=id;
    $$('.side-link[data-view]').forEach(b=>{const on=b.dataset.view===id;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    const floor=$('.topnav [data-view="lobby"]');floor?.classList.toggle('active',id!=='admin');
    if(!fromHistory&&location.hash!=='#'+id){try{history.pushState({view:id},'', '#'+id);}catch(_){}}
    window.scrollTo({top:0,behavior:'instant'});S.click();G.games[id]?.enter?.();G.emit('view',id);renderWallet();renderDeveloper();
    const heading=$('h2',view);if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
    return true;
  }
  window.addEventListener('popstate',()=>{const id=location.hash.slice(1)||'lobby';if(!showView(id,{fromHistory:true}))showView('lobby',{fromHistory:true});});
  function renderWallet(){
    const W=G.Wallet,st=W.stats;
    setNumber($('#balance'),W.balance);$('#balance').title=fmt(W.balance)+' play-money chips';$('#balance').setAttribute('aria-label',fmt(W.balance)+' play-money chips');
    setNumber($('#statBal'),W.balance);$('#statBal').title=fmt(W.balance);setNumber($('#statWin'),st.biggestWinCents/100);$('#statWin').title=fmt(st.biggestWinCents/100)+' net chips';$('#statPlays').textContent=fmt(st.plays);$('#statWins').textContent=fmt(st.wins);
    const rounds=W.activeRounds(),away=rounds.filter(r=>r.game!==G.currentView);
    $$('.side-link[data-view]').forEach(b=>b.classList.toggle('in-play',rounds.some(r=>r.game===b.dataset.view)));
    $('#inplayBar').classList.toggle('hidden',!away.length);
    if(away.length){const first=away[0],name=G.LIBRARY.find(g=>g.id===first.game)?.short;$('#inplayText').textContent=away.length===1?`${name} is still in play · ${fmt(first.stake)} chips at stake`:`${away.length} rounds are still in play`;$('#returnToRound').dataset.target=first.game;}
    updateBrokeUI(false);
    if(G.currentView==='admin')G.renderAdmin?.();
    if(Modal.active?.id==='statsModal')renderStats();
    G.games.blackjack?.buttons?.();
  }
  $('#returnToRound').addEventListener('click',()=>showView($('#returnToRound').dataset.target));
  function updateBrokeUI(allowModal=true){
    const eligible=G.Wallet.balance<G.CONFIG.refillThreshold&&!G.Wallet.hasActive();
    $('#freeChipsBtn').classList.toggle('hidden',!eligible);$('#rewardClaim').disabled=!eligible;
    $('#rewardFeedback').textContent=eligible?'Your complimentary chips are ready.':G.Wallet.hasActive()?'Finish or collect your active rounds first.':'Available when your balance is below 100 chips.';
    if(allowModal&&G.Wallet.balance<10&&!G.Wallet.hasActive()&&!Modal.active)Modal.open('brokeModal');
  }
  function claimRefill(){
    const amount=G.Wallet.refill();if(amount===null){toast('Complimentary chips are available below 100 chips, with no active rounds.');return;}
    Modal.close();S.win();toast(`+${fmt(amount)} complimentary chips. On the house.`,'good');
  }
  ['freeChipsBtn','claimBtn','rewardClaim'].forEach(id=>$('#'+id).addEventListener('click',claimRefill));
  function renderPreferences(){
    const p=G.Wallet.prefs;S.set(p.sound);document.body.classList.toggle('reduce-motion',p.reducedMotion||osMotion.matches);
    $('#soundBtn').innerHTML=G.Art.icon(p.sound?'sound':'mute');$('#soundBtn').setAttribute('aria-label',p.sound?'Mute sound':'Enable sound');$('#soundBtn').title=p.sound?'Mute sound':'Enable sound';
    $('#settingsSound').setAttribute('aria-checked',String(p.sound));$('#settingsMotion').setAttribute('aria-checked',String(p.reducedMotion||osMotion.matches));$('#settingsEffects').setAttribute('aria-checked',String(p.effects));
    if(!p.effects||motion())clearConfetti();
    if(motion()){finishClosing?.();liveSpins.forEach(v=>v.finish());liveUI.forEach(a=>a.cancel());}
  }
  $('#soundBtn').addEventListener('click',()=>{G.Wallet.setPreference('sound',!G.Wallet.prefs.sound);if(G.Wallet.prefs.sound)S.click();});
  $('#settingsSound').addEventListener('click',()=>G.Wallet.setPreference('sound',!G.Wallet.prefs.sound));
  $('#settingsMotion').addEventListener('click',()=>{if(osMotion.matches){toast('Your device already requests reduced motion. It stays respected.');return;}G.Wallet.setPreference('reducedMotion',!G.Wallet.prefs.reducedMotion);});
  $('#settingsEffects').addEventListener('click',()=>G.Wallet.setPreference('effects',!G.Wallet.prefs.effects));
  osMotion.addEventListener('change',renderPreferences);
  $('#resetBtn').addEventListener('click',()=>{if(G.Wallet.hasActive()){toast('Finish or collect your active rounds before resetting.','bad');return;}Modal.open('resetModal');});
  $('#resetNo').addEventListener('click',()=>Modal.close());
  $('#resetYes').addEventListener('click',()=>{if(Modal.active?.id!=='resetModal')return;if(G.Wallet.setBalance(G.CONFIG.startingBalance)){Modal.close();G.emit('wallet-reset');toast('Balance reset to 10,000 chips. Your record stays saved.','good');}});
  function renderStats(){
    const st=G.Wallet.stats;
    $('#recordStats').innerHTML=[['CHIP BALANCE',G.Wallet.balance],['ROUNDS STARTED',st.plays],['NET WINS',st.wins],['BIGGEST NET WIN',st.biggestWinCents/100]].map(([label,n])=>`<div><span>${label}</span><b title="${fmt(n)}">${compact(n)}</b></div>`).join('');
    const history=G.Wallet.history;
    $('#roundHistory').innerHTML='<div class="history-row heading"><span>GAME / STAKE</span><span>RETURNED</span><span>NET RESULT</span></div>'+(history.length?history.map(h=>{const game=G.LIBRARY.find(g=>g.id===h.game);const net=h.netCents/100;return`<div class="history-row"><span>${game.short}<small>${fmt(h.stakeCents/100)} chips${h.modified?' · demo modified':''}</small></span><span>${fmt(h.returnCents/100)}</span><span class="${net>0?'net-good':net<0?'net-bad':''}">${net>0?'+':net<0?'−':''}${fmt(Math.abs(net))}</span></div>`;}).join(''):'<p class="small muted" style="padding:20px 0">Your first story is waiting. Choose a table to begin.</p>');
  }
  function renderDeveloper(){
    const any=G.Dev.anyModified();$('#demoBanner').classList.toggle('hidden',!any);
    if(any){const current=G.Dev.snapshot(G.currentView),modified=(current.luckEnabled&&current.luck>1)||current.reward!==1||current.customReturn!==null;
      $('#demoBanner>span:nth-child(2)').textContent=G.LIBRARY.some(g=>g.id===G.currentView)?`Local demo: ${modified?'this game uses modified outcomes or rewards.':'other tables have modified settings; this game uses normal rules.'}`:'Local demo: modified outcomes or rewards are enabled.';
    }
  }
  $('#demoDetails').addEventListener('click',()=>showView('admin'));
  const rules={
    blackjack:{intro:'Beat the dealer without going over 21. Add chips to your wager, then Deal. Aces count as 1 or 11; face cards count as 10.',items:['A two-card natural pays 3:2 profit (2.5× total return); a normal win returns 2× your stake. Equal hands push and return the whole stake.','Dealer stands on every 17, including soft 17. A six-deck shoe is reshuffled when fewer than 52 cards remain.','Hit draws a card. Stand completes the dealer hand. Double is allowed on your first two cards: commit one extra matching stake, receive one card and stand.','No splits, insurance or surrender in this simulator. Hit, Stand and Double are locked while dealing.']},
    roulette:{intro:'Select a chip, then tap a number or an outside bet. Chips on the board are a wager plan: your balance is deducted only when you press Spin.',items:['European single-zero wheel: 37 equally likely pockets in normal mode. The ball and the pocket at the top pointer identify the same result.','A straight-up win pays 35:1 profit (36× return). Dozens return 3×; red/black, odd/even and low/high return 2×. Zero loses all outside bets.','Undo removes the last planned chip. Clear removes all planned bets. These do not change your wallet because the stake is not yet committed.','Multiple winning bets are summed into one return and one settlement. Scroll the board horizontally on a small screen.']},
    slots:{intro:'Three weighted reels, one center payline. The final symbols on that line determine the return, never the animated filler symbols.',items:['Each reel independently samples weights: seven 1, diamond 2, bell 3, BAR 4, cherry 5, lemon 5 (20 total).','Three identical: sevens 100×, diamonds 60×, bells 30×, BARs 20×, cherries 12×, lemons 10×.','Exactly two sevens return 5×. Any other pair returns 2×. Only the highest matching paytable award is used.','Your stake is locked during the spin. The reels stop separately and scale their exact positions to the current screen size.']},
    poker:{intro:'Jacks or Better with a freshly shuffled 52-card deck each round. Deal five, select cards to hold, then Draw once to replace the rest.',items:['Royal flush 250×; straight flush 50×; four of a kind 25×; full house 9×; flush 6×; straight 4×; three of a kind 3×; two pair 2×; Jacks-or-Better pair 1×.','These are total returns. A qualifying high pair returns your stake, not a net win.','A-2-3-4-5 is a valid low straight; a suited low straight pays 50×, not the 250× royal. A royal must be 10-J-Q-K-A of one suit.','Tap a card or focus it and press Space/Enter to hold. Held cards never change. Your stake cannot change between Deal and Draw.']},
    plinko:{intro:'Drop a golden ball through 12 rows. Twelve independent left/right decisions select one of 13 buckets before the animation begins.',items:['Bucket returns from left to right: 50, 12, 5, 2, 1, 0.5, 0.3, 0.5, 1, 2, 5, 12, 50× your stake.','In normal mode, every decision is a fair coin flip. Bucket probabilities follow the 12-trial binomial distribution; edges are much rarer than the center.','Up to eight balls may be active. Each ball has its own immutable stake and exactly-once settlement. Changing the chip affects only subsequent balls.','The path visibly meets the pegs. This is a preselected-path animation, not a physics engine determining random payouts.']},
    baccarat:{intro:'Choose Player, Banker or Tie. The hand nearest nine wins. Aces are 1, 2–9 keep their value, tens/faces are 0; only the last digit of the total counts.',items:['Player win returns 2×; Banker win returns 1.95× after a 5% commission on profit. Tie win returns 9×.','When the hands tie, Player and Banker bets push: the whole stake is returned without reward modifiers.','A natural 8 or 9 in either opening hand stops the deal. Otherwise Player draws on 0–5 and stands on 6–7.','If Player stands, Banker draws on 0–5. If Player draws: Banker 0–2 always draws; 3 draws except against Player third-card 8; 4 draws against 2–7; 5 against 4–7; 6 against 6–7; 7 stands.','An eight-deck pack is freshly shuffled each round. All third-card decisions are computed before the animated reveal.']},
    crash:{intro:'Start a personal simulated round and watch the multiplier rise. Collect before the predetermined crash to receive the displayed multiplier × your stake.',items:['Normal crash point is floor(100 × 0.97 / (1 − U)) / 100, clamped to 1.00–1,000×, with U uniform in [0,1). Immediate 1.00× crashes can happen.','The crash deadline uses elapsed wall-clock time, not animation frames. A late click cannot collect even if the graph has not repainted yet.','Optional Auto collect: set 1.05–1,000× before starting. It succeeds only if strictly below the crash point. Equality crashes.','A successful collection ends your personal round immediately; the history labels it collected, not a fabricated future crash. The wallet is credited once.','Switching screens does not pause the round. Reduced motion simplifies the graph without changing deadlines or odds.']},
    hilo:{intro:'Reveal a starting card, then predict strictly higher or lower. Ace is low (1); King is high (13). Each call draws from an independent full 52-card distribution.',items:['A tie is a push for that prediction: no lost stake, no added streak and no multiplier increase.','The shown chance is conditional on a non-tie (12 ranks). A risky correct prediction multiplies the running return by 0.97 / conditional probability. A certain direction at Ace/King uses 1×.','A wrong call loses the entire round. You may collect the current return at any time between predictions; collecting before any success refunds the stake.','Twenty successes or 1,000,000× automatically collects. Impossible predictions are disabled. No extra stake is deducted for later predictions.']},
    dice:{intro:'Roll two independent six-sided dice. Choose a target 2–12 and either strictly under or strictly over. A total equal to the target loses.',items:['There are 36 equiprobable ordered rolls in normal mode. The displayed chance counts exactly the outcomes in your selected range.','Return multiplier is 0.97 ÷ win probability, rounded down to four decimal places. Potential return rounds to the same hundredth-of-a-chip calculation as the wallet.','An impossible target/range disables Roll. Configuration and stake lock until both dice stop.','The final displayed dice always sum to the result used for settlement.']},
    mines:{intro:'Choose a 4×4, 5×5 or 6×6 grid and a mine count. Start commits the entire mine layout before the first reveal.',items:['Each safe tile increases the total return multiplier: 0.97 × C(total tiles, reveals) / C(safe tiles, reveals). Before the first reveal the return is 1×.','Collect between reveals to end the round. A mine loses the stake. All remaining tiles are shown when the round ends.','Revealing every safe tile or reaching 1,000,000× automatically collects.','Normal mine placement is uniform without replacement. Developer-favorable layouts precommit a lower-right cluster; mines are never moved after you start.','Grid size, mine count and stake cannot change mid-round. A brief tile-resolution lock prevents overlapping clicks and collection.']},
    wheel:{intro:'Choose a stake and spin the custom twelve-segment prize wheel. The center of the selected segment finishes beneath the fixed top pointer.',items:['Clockwise segments: 0, 2, 0.5, 5, 1, 0, 10, 2, 0.5, 20, 1, 3×. Each segment has probability 1/12 in normal mode.','Values are total returns: 0× loses the stake, 0.5× returns half, 1× returns the stake, 20× returns twenty times the stake.','The result is selected once before the animation. A spin cannot be started or paid more than once.']}
  };
  function showRules(id){const info=rules[id],game=G.LIBRARY.find(g=>g.id===id);if(!info||!game)return;$('#rulesTitle').textContent=game.name;$('#rulesContent').innerHTML=`<p>${info.intro}</p><ul>${info.items.map(item=>`<li>${item}</li>`).join('')}</ul><p class="rules-note">Play-money only. All × awards are total returns, including your stake. Payouts are rounded to 0.01 chip and capped at 1 trillion per round / 9 trillion in the wallet. Developer modifications, if enabled, are explicitly labeled and may alter normal outcomes or rewards.</p>`;Modal.open('rulesModal');}
  G.on('wallet',renderWallet);G.on('settled',()=>updateBrokeUI(true));G.on('preferences',renderPreferences);G.on('developer',renderDeveloper);G.on('view',renderDeveloper);
  Object.assign(G,{$,$$,fmt,compact,short,sleep,duration,motion,animateUI,spinWheel,S,toast,confetti,cardEl,revealCard,rackInit,setupBet,getBet,lockBet,resultMarkup,setResult,feedback,Modal,showView,renderWallet,renderPreferences,renderStats,showRules,renderDeveloper,updateBrokeUI});
})(window.GAR);
