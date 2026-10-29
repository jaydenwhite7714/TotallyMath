/* Shared presentation, synthesized audio, account modal and accessible interactions.
   Sound/card/confetti/router patterns are retained from the original implementation. */
(function (G) {
  'use strict';
  const $=(s,root=document)=>s?root.querySelector(s):null,$$=(s,root=document)=>[...root.querySelectorAll(s)];
  const numberFormat=new Intl.NumberFormat('en-US',{maximumFractionDigits:2});
  const compactFormat=new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2});
  const HIGH_TIERS=[[1e24,'Sp'],[1e21,'Sx'],[1e18,'Qi'],[1e15,'Qa']];
  const fmt=n=>numberFormat.format(Number.isFinite(n)?n:0);
  function compact(n){
    if(!Number.isFinite(n))return '0';
    const abs=Math.abs(n);
    for(const [unit,suf] of HIGH_TIERS){
      if(abs>=unit){const v=n/unit;return (Math.abs(v)>=100?v.toFixed(0):v.toFixed(2).replace(/\.?0+$/,''))+suf;}
    }
    return abs>=1e7?compactFormat.format(n):fmt(n);
  }
  const short=n=>Math.abs(n)>=1e15?compact(n):Math.abs(n)>=1000?compactFormat.format(n):fmt(n);
  const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
    allIn(){[440,554,659,880].forEach((f,i)=>this.tone(f,.11,'triangle',.045,i*.045));},
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
      try{
        for(const entry of entries)if(entry.el){entry.el.style.transition='none';entry.el.style.transform=`rotate(${entry.to}deg)`;entry.el.style.willChange='transform';}
        if(!wheel||motion()||document.hidden||typeof wheel.animate!=='function'){finish();return;}
        for(const entry of entries)if(entry.el){
          const a=entry.el.animate([{transform:`rotate(${entry.from}deg)`},{transform:`rotate(${entry.to}deg)`}],{duration:milliseconds,easing:'cubic-bezier(.18,0,.12,1)',fill:'none'});
          animations.push(a);a.finished.catch(()=>{});
        }
        animation=animations[0];animation.finished.then(finish,finish);
        timer=setTimeout(finish,milliseconds+180);wake();
      }catch(_){finish();}
    });
  }
  G.on('view',()=>liveSpins.forEach(v=>v.wake()));
  let leavingDocument=false;
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
  G.on('achievement',meta=>toast(`Milestone unlocked: ${meta.name}!`,'good'));

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
    $$(sel+' .chip[data-v]').forEach(ch=>ch.addEventListener('click',()=>{
      if(ch.disabled||!canPick())return;
      $$(sel+' .chip').forEach(x=>x.classList.toggle('sel',x===ch));ch.setAttribute('aria-pressed','true');
      $$(sel+' .chip').filter(x=>x!==ch).forEach(x=>x.setAttribute('aria-pressed','false'));S.chip();onPick(+ch.dataset.v);
    }));
  }
  function setupBet(prefix,onChange=()=>{},isLocked=()=>false){
    const module=$('#'+prefix+'-bet-module'),input=$('#'+prefix+'-stake');
    const syncButtons=()=>{
      const v=G.parseChips(input.value);
      const bal=G.Wallet.balance;
      const isAllIn=Number.isFinite(v)&&bal>=G.CONFIG.minStake&&Math.abs(v-bal)<=Math.max(.005,bal*1e-12);
      $$('[data-stake]',module).forEach(b=>b.classList.toggle('selected',!isAllIn&&+b.dataset.stake===v));
      $$('[data-allin]',module).forEach(b=>b.classList.toggle('selected',isAllIn));
      module.classList.toggle('is-allin',isAllIn);
    };
    const update=()=>{syncButtons();onChange();};
    module.addEventListener('click',e=>{
      const button=e.target.closest('button');if(!button||button.disabled||isLocked())return;
      const maxBet=G.Wallet.maxAffordableStake();
      if(button.dataset.allin||button.dataset.adjust==='max'){
        if(maxBet<=0){
          toast('You need at least 10 chips to go All-In — claim free house chips!','bad');
          if(G.Wallet.balance<10&&!G.Wallet.hasActive()&&!Modal.active)Modal.open('brokeModal');
          return;
        }
        input.value=maxBet;update();S.allIn();return;
      }
      let value=G.parseChips(input.value)||25;
      if(button.dataset.stake)value=+button.dataset.stake;
      else if(button.dataset.pct){
        if(maxBet<=0){toast('Need at least 10 chips to wager.','bad');return;}
        const rawPct=G.Wallet.balance*Number(button.dataset.pct);
        value=Math.max(G.CONFIG.minStake,rawPct<=9e12?Math.floor(rawPct*100)/100:rawPct);
      }
      else if(button.dataset.adjust==='half')value/=2;
      else if(button.dataset.adjust==='double'){
        const cap=maxBet>0?maxBet:G.CONFIG.maxStake;
        value=Math.min(cap,value*2);
      }
      const rounded=value<=9e12?Math.round(value*100)/100:value;
      input.value=Math.min(G.CONFIG.maxStake,Math.max(G.CONFIG.minStake,rounded));update();S.chip();
    });
    input.addEventListener('input',update);
    input.addEventListener('change',()=>{if(isLocked())return;const v=G.parseChips(input.value);if(G.Wallet.validStake(v))input.value=v<=9e12?Math.round(v*100)/100:v;update();});
    G.on('wallet',syncButtons);
    syncButtons();
  }
  function getBet(prefix){const val=$('#'+prefix+'-stake').value;return val.trim()===''?NaN:G.parseChips(val);}
  function lockBet(prefix,locked){$$('input,button',$('#'+prefix+'-bet-module')).forEach(el=>el.disabled=locked);}
  function resultMarkup(label,r){
    const sign=r.net>0?'+':r.net<0?'−':'';
    const allInTag=r.allIn?'<span class="allin-result-tag">ALL IN</span> ':'';
    return `<span class="result-main">${allInTag}${label}</span><span class="result-detail">Returned ${fmt(r.returned)} chips · net ${sign}${fmt(Math.abs(r.net))}</span>${r.capped?'<span class="capped-note">Return capped at the simulator / wallet limit.</span>':''}`;
  }
  function setResult(prefix,label,r){const el=$('#'+prefix+'-result');el.className='round-message '+(r.net>0?'good':r.net<0?'bad':'');el.innerHTML=resultMarkup(label,r);}
  function feedback(r,big=false){
    if(!r)return;
    const ids={blackjack:'bj-msg',roulette:'rl-result',slots:'sl-result',poker:'vp-msg',plinko:'pl-status',baccarat:'ba-result',crash:'cr-result',hilo:'hl-result',dice:'di-result',mines:'mn-result',wheel:'lw-result'};
    const result=document.getElementById(ids[r.record?.game]);
    if(r.record?.game==='slots')animateUI(result,[{opacity:.45},{opacity:1}]);
    else animateUI(result,[{opacity:.55,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}]);
    const celebrate=big||(r.allIn&&r.net>0);
    if(r.net>0){celebrate?S.big():S.win();if(celebrate)confetti();toast(`${r.allIn?'ALL-IN WIN! ':''}Returned ${fmt(r.returned)} chips · net +${fmt(r.net)}`,'good');}
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
      if(id==='accountModal')renderAccountModal();
      if(id==='leaderboardModal')renderLeaderboard();
      if(id==='characterModal')renderCharacterModal();
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
    if(e.key==='Escape'){e.preventDefault();if($('#sidebar').classList.contains('show'))toggleMenu(false);else showView(enteredFromWorld&&G.LIBRARY.some(g=>g.id===G.currentView)?'world':'lobby');return;}
    if(typing||e.repeat||e.metaKey||e.ctrlKey||e.altKey)return;
    if(e.key==='/'&&G.currentView==='lobby'){e.preventDefault();$('#gameSearch').focus();return;}
    if(e.code==='Space'&&!target.closest('button,a')){
      const map={blackjack:'#bj-deal',roulette:'#rl-spin',slots:'#sl-spin',poker:'#vp-deal',plinko:'#pl-drop',baccarat:'#ba-start',crash:'#cr-start',hilo:'#hl-start',dice:'#di-start',mines:'#mn-start',wheel:'#lw-start'};
      const button=$(map[G.currentView]);if(button&&!button.disabled){e.preventDefault();button.click();}return;
    }
    if(G.currentView==='blackjack'){
      const bjKey={KeyH:'#bj-hit',KeyS:'#bj-stand',KeyD:'#bj-double'}[e.code];
      if(bjKey&&!$(bjKey).disabled){e.preventDefault();$(bjKey).click();}
    }else if(G.currentView==='crash'&&e.code==='KeyC'&&!$('#cr-cash').disabled){
      e.preventDefault();$('#cr-cash').click();
    }else if(G.currentView==='mines'&&e.code==='KeyC'&&!$('#mn-collect').disabled){
      e.preventDefault();$('#mn-collect').click();
    }else if(G.currentView==='hilo'){
      if(e.code==='ArrowUp'&&!$('#hl-higher').disabled){e.preventDefault();$('#hl-higher').click();}
      else if(e.code==='ArrowDown'&&!$('#hl-lower').disabled){e.preventDefault();$('#hl-lower').click();}
      else if(e.code==='KeyC'&&!$('#hl-collect').disabled){e.preventDefault();$('#hl-collect').click();}
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
  let enteredFromWorld=false;
  function syncWorldBackButtons(){
    $$('.gamebar > button[data-back-nav]').forEach(btn=>{
      btn.dataset.view=enteredFromWorld?'world':'lobby';
      btn.innerHTML=G.Art.icon('back')+(enteredFromWorld?' 3D World':' Lobby');
    });
  }
  function showView(id,{fromHistory=false}={}){
    if(id==='admin'&&!G.adminUnlocked)return false;
    const view=document.getElementById('view-'+id);if(!view)return false;
    const prev=G.currentView;
    if(prev==='world'&&G.LIBRARY.some(g=>g.id===id))enteredFromWorld=true;
    else if(id==='lobby')enteredFromWorld=false;
    Modal.close(false);toggleMenu(false);
    if(prev&&prev!==id)G.games[prev]?.leave?.();
    $$('.view').forEach(v=>v.classList.toggle('active',v===view));G.currentView=id;
    syncWorldBackButtons();
    $$('.side-link[data-view]').forEach(b=>{const on=b.dataset.view===id;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    const floor=$('.topnav [data-view="lobby"]');floor?.classList.toggle('active',id!=='admin'&&id!=='world');
    $('.topnav [data-view="world"]')?.classList.toggle('active',id==='world');
    if(!fromHistory&&location.hash!=='#'+id){try{history.pushState({view:id},'', '#'+id);}catch(_){}}
    window.scrollTo({top:0,behavior:'instant'});S.click();
    G.Floor?.setWorldPos(undefined,undefined,id);
    G.games[id]?.enter?.();G.emit('view',id);renderWallet();renderDeveloper();
    if(id==='stocks')renderStocks();
    const heading=$('h2',view);if(heading&&id!=='world'){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
    return true;
  }
  window.addEventListener('popstate',()=>{const id=location.hash.slice(1)||'lobby';if(!showView(id,{fromHistory:true}))showView('lobby',{fromHistory:true});});

  function renderAccountHeader(){
    const acc=G.Accounts.current;
    $('#accountBtnText').textContent=acc.loggedIn?acc.username:'Sign in';
    $('#accountBtn').classList.toggle('signed-in',acc.loggedIn);
    $('#accountBtn').title=acc.loggedIn?`Signed in as @${acc.username} (${acc.vip.tier.name})`:'Sign in or create a local player account';
    if($('#lobbyWelcome'))$('#lobbyWelcome').textContent=acc.loggedIn?`Welcome back, ${acc.username}.`:'Welcome to the Royale.';
    if($('#lobbyAccountStatus'))$('#lobbyAccountStatus').textContent=acc.loggedIn?`@${acc.username} · ${acc.vip.tier.name} · Vault auto-saving`:'Guest session · Create account to lock your vault';
  }

  function achievementsMarkup(unlockedIds){
    const set=new Set(unlockedIds);
    return (G.CONFIG.achievements||[]).map(a=>{
      const on=set.has(a.id);
      return `<div class="ach-badge ${on?'unlocked':''}" title="${escapeHtml(a.desc)}">${G.Art.icon(on?'trophy':'lock')}<div><b>${escapeHtml(a.name)}</b><small>${escapeHtml(a.desc)}</small></div></div>`;
    }).join('');
  }

  function renderAccountModal(){
    const acc=G.Accounts.current,st=G.Wallet.stats,vip=acc.vip;
    $('#accountGuestSection').classList.toggle('hidden',acc.loggedIn);
    $('#accountProfileSection').classList.toggle('hidden',!acc.loggedIn);
    $('#loginFeedback').textContent='';$('#registerFeedback').textContent='';$('#importFeedback').textContent='';$('#passChangeFeedback').textContent='';
    $('#backupBox').classList.add('hidden');$('#changePassForm').classList.add('hidden');
    if(!acc.loggedIn){
      const hasAccounts=G.Accounts.count()>0;
      switchAuthTab(hasAccounts?'login':'register',false);
      return;
    }
    $('#profVipTier').textContent=`VIP LEVEL ${vip.level} · ${vip.tier.name.toUpperCase()}`;
    $('#profUsername').textContent='@'+acc.username;
    $('#profVipFill').style.width=`${Math.round(vip.progress*100)}%`;
    $('#profVipProgress').textContent=vip.next?`${compact(vip.wagered)} / ${compact(vip.next.minWagered)} chips wagered toward ${vip.next.name}`:'Maximum Royale Sovereign tier achieved';
    const net=(st.returnedCents-st.wageredCents)/100,winRate=st.resolved?((st.wins/st.resolved)*100).toFixed(1)+'%':'0.0%';
    $('#profStatsGrid').innerHTML=[
      ['SAVED BALANCE',compact(G.Wallet.balance),fmt(G.Wallet.balance)+' chips'],
      ['SESSION NET P/L',(net>=0?'+':'−')+compact(Math.abs(net)),(net>=0?'+':'−')+fmt(Math.abs(net))+' chips'],
      ['WIN RATE',winRate,`${fmt(st.wins)} wins / ${fmt(st.resolved)} resolved`],
      ['BEST WIN STREAK',fmt(st.bestStreak||0),`Current streak: ${fmt(st.currentStreak||0)}`]
    ].map(([l,v,t])=>`<div><span>${l}</span><b title="${escapeHtml(t)}">${v}</b></div>`).join('');
    $('#profAchCount').textContent=`${acc.achievements.length} / ${(G.CONFIG.achievements||[]).length}`;
    $('#profAchGrid').innerHTML=achievementsMarkup(acc.achievements);
  }

  function switchAuthTab(tab,focusInput=true){
    $$('#authTabs button').forEach(b=>{const on=b.dataset.authTab===tab;b.classList.toggle('selected',on);b.setAttribute('aria-selected',String(on));});
    $('#loginForm').classList.toggle('hidden',tab!=='login');
    $('#registerForm').classList.toggle('hidden',tab!=='register');
    $('#importForm').classList.toggle('hidden',tab!=='import');
    if(focusInput){
      const first=tab==='login'?$('#loginUsername'):tab==='register'?$('#regUsername'):$('#importCodeInput');
      first?.focus();
    }
  }
  $('#authTabs').addEventListener('click',e=>{const b=e.target.closest('[data-auth-tab]');if(!b)return;S.click();switchAuthTab(b.dataset.authTab);});
  $('#loginForm').addEventListener('submit',e=>{
    e.preventDefault();
    const res=G.Accounts.login($('#loginUsername').value,$('#loginPassword').value);
    const fb=$('#loginFeedback');fb.textContent=res.message;fb.className='form-feedback '+(res.ok?'good':'bad');
    if(res.ok){$('#loginUsername').value='';$('#loginPassword').value='';S.win();toast(res.message,'good');renderAccountModal();}
    else $('#loginPassword').focus();
  });
  $('#registerForm').addEventListener('submit',e=>{
    e.preventDefault();
    const res=G.Accounts.register($('#regUsername').value,$('#regPassword').value,{transferGuest:$('#regTransfer').checked});
    const fb=$('#registerFeedback');fb.textContent=res.message;fb.className='form-feedback '+(res.ok?'good':'bad');
    if(res.ok){$('#regUsername').value='';$('#regPassword').value='';S.big();confetti();toast(res.message,'good');renderAccountModal();}
  });
  $('#importForm').addEventListener('submit',e=>{
    e.preventDefault();
    const res=G.Accounts.importBackup($('#importCodeInput').value);
    const fb=$('#importFeedback');fb.textContent=res.message;fb.className='form-feedback '+(res.ok?'good':'bad');
    if(res.ok){$('#importCodeInput').value='';S.win();toast(res.message,'good');renderAccountModal();}
  });
  $('#logoutBtn').addEventListener('click',()=>{
    const res=G.Accounts.logout();
    if(!res.ok){toast(res.message,'bad');return;}
    S.click();toast(res.message,'info');renderAccountModal();
  });
  $('#exportBackupBtn').addEventListener('click',()=>{
    const res=G.Accounts.exportBackup();
    if(!res.ok){toast(res.message,'bad');return;}
    $('#backupOutput').value=res.code;$('#backupBox').classList.remove('hidden');
    $('#backupOutput').focus();$('#backupOutput').select();
    navigator.clipboard?.writeText?.(res.code).catch(()=>{});
    toast('Portable backup key generated & selected!','good');
  });
  $('#togglePassFormBtn').addEventListener('click',()=>{
    $('#changePassForm').classList.toggle('hidden');
    if(!$('#changePassForm').classList.contains('hidden'))$('#curPassInput').focus();
  });
  $('#changePassForm').addEventListener('submit',e=>{
    e.preventDefault();
    const res=G.Accounts.changePassword($('#curPassInput').value,$('#newPassInput').value);
    const fb=$('#passChangeFeedback');fb.textContent=res.message;fb.className='form-feedback '+(res.ok?'good':'bad');
    if(res.ok){$('#curPassInput').value='';$('#newPassInput').value='';S.win();toast(res.message,'good');}
  });

  function renderWallet(){
    const W=G.Wallet,st=W.stats;
    setNumber($('#balance'),W.balance);$('#balance').title=W.exactText+' play-money chips';$('#balance').setAttribute('aria-label',W.exactText+' play-money chips');
    setNumber($('#statBal'),W.balance);$('#statBal').title=W.exactText;setNumber($('#statWin'),st.biggestWinCents/100);$('#statWin').title=fmt(st.biggestWinCents/100)+' net chips';$('#statPlays').textContent=fmt(st.plays);$('#statWins').textContent=fmt(st.wins);
    const rounds=W.activeRounds(),away=rounds.filter(r=>r.game!==G.currentView);
    $$('.side-link[data-view]').forEach(b=>b.classList.toggle('in-play',rounds.some(r=>r.game===b.dataset.view)));
    $('#inplayBar').classList.toggle('hidden',!away.length);
    if(away.length){const first=away[0],name=G.LIBRARY.find(g=>g.id===first.game)?.short;$('#inplayText').textContent=away.length===1?`${name} is still in play · ${fmt(first.stake)} chips at stake`:`${away.length} rounds are still in play`;$('#returnToRound').dataset.target=first.game;}
    renderAccountHeader();
    updateLiveFloorBadge();
    updateBrokeUI(false);
    if(G.currentView==='admin')G.renderAdmin?.();
    if(Modal.active?.id==='statsModal')renderStats();
    if(Modal.active?.id==='accountModal')renderAccountModal();
    if(Modal.active?.id==='leaderboardModal')renderLeaderboard();
    G.games.blackjack?.buttons?.();
  }
  $('#returnToRound').addEventListener('click',()=>showView($('#returnToRound').dataset.target));

  function updateBrokeUI(allowModal=true){
    const eligible=G.Wallet.balance<G.CONFIG.refillThreshold&&!G.Wallet.hasActive();
    $('#freeChipsBtn').classList.toggle('hidden',!eligible);$('#rewardClaim').disabled=!eligible;
    $('#rewardFeedback').textContent=eligible?'Your complimentary 5,000-chip refill is ready.':G.Wallet.hasActive()?'Finish or collect your active rounds first.':'5,000-chip refill unlocks whenever your balance drops below 100 chips.';
    const daily=G.Wallet.dailyStatus();
    if($('#dailyAmountLabel')){
      $('#dailyAmountLabel').textContent=`+${fmt(daily.amount)} chips`;
      $('#dailyStreakLabel').textContent=daily.eligible?`Day ${daily.nextStreak} house streak ready to collect`:`Claimed today · Day ${daily.streak} streak active (~${Math.ceil(daily.msRemaining/3600000)}h left)`;
      $('#dailyClaimBtn').disabled=!daily.eligible||G.Wallet.hasActive();
    }
    if(allowModal&&G.Wallet.balance<10&&!G.Wallet.hasActive()&&!Modal.active)Modal.open('brokeModal');
  }
  function claimRefill(){
    const amount=G.Wallet.refill();if(amount===null){toast('Complimentary refill is available below 100 chips, with no active rounds.');return;}
    Modal.close();S.win();toast(`+${fmt(amount)} complimentary chips. On the house.`,'good');
  }
  ['freeChipsBtn','claimBtn','rewardClaim'].forEach(id=>$('#'+id).addEventListener('click',claimRefill));
  $('#dailyClaimBtn').addEventListener('click',()=>{
    const res=G.Wallet.claimDaily();
    if(!res.ok){toast(res.message,'bad');return;}
    S.big();confetti();toast(res.message,'good');updateBrokeUI(false);
  });

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
    const st=G.Wallet.stats,vip=G.Wallet.vip,acc=G.Accounts.current;
    const winRate=st.resolved?((st.wins/st.resolved)*100).toFixed(1)+'%':'0.0%';
    if($('#statsVipStrip')){
      $('#statsVipStrip').innerHTML=`<div><span class="eyebrow">${acc.loggedIn?'@'+escapeHtml(acc.username):'GUEST SESSION'} · VIP LEVEL ${vip.level}</span><b>${escapeHtml(vip.tier.name)}</b></div><div class="vip-strip-right"><span>${vip.next?`Next: ${escapeHtml(vip.next.name)} (${Math.round(vip.progress*100)}%)`:'Top Tier Achieved'}</span><div class="vip-bar-wrap"><div class="vip-bar-fill" style="width:${Math.round(vip.progress*100)}%"></div></div></div>`;
    }
    $('#recordStats').innerHTML=[
      ['CHIP BALANCE',compact(G.Wallet.balance),fmt(G.Wallet.balance)],
      ['ROUNDS STARTED',compact(st.plays),fmt(st.plays)],
      ['NET WINS',compact(st.wins),`${fmt(st.wins)} (${winRate})`],
      ['BIGGEST NET WIN',compact(st.biggestWinCents/100),fmt(st.biggestWinCents/100)],
      ['TOTAL WAGERED',compact(st.wageredCents/100),fmt(st.wageredCents/100)],
      ['WIN RATE',winRate,`${fmt(st.wins)} of ${fmt(st.resolved)}`],
      ['BEST STREAK',fmt(st.bestStreak||0),`Current: ${fmt(st.currentStreak||0)}`],
      ['ACHIEVEMENTS',`${G.Wallet.achievements.length}/${(G.CONFIG.achievements||[]).length}`,'Milestones unlocked']
    ].map(([label,val,full])=>`<div><span>${label}</span><b title="${escapeHtml(full)}">${val}</b></div>`).join('');
    if($('#statsAchGrid'))$('#statsAchGrid').innerHTML=achievementsMarkup(G.Wallet.achievements);
    const history=G.Wallet.history;
    $('#roundHistory').innerHTML='<div class="history-row heading"><span>GAME / STAKE</span><span>RETURNED</span><span>NET RESULT</span></div>'+(history.length?history.map(h=>{const game=G.LIBRARY.find(g=>g.id===h.game);const net=h.netCents/100;return`<div class="history-row"><span>${game.short}<small>${fmt(h.stakeCents/100)} chips${h.allIn?' · ALL IN':''}${h.modified?' · demo modified':''}</small></span><span>${fmt(h.returnCents/100)}</span><span class="${net>0?'net-good':net<0?'net-bad':''}">${net>0?'+':net<0?'−':''}${fmt(Math.abs(net))}</span></div>`;}).join(''):'<p class="small muted" style="padding:20px 0">Your first story is waiting. Choose a table to begin.</p>');
  }

  function renderDeveloper(){
    const any=G.Dev.anyModified();$('#demoBanner').classList.toggle('hidden',!any);
    if(any){const current=G.Dev.snapshot(G.currentView),modified=(current.luckEnabled&&current.luck>1)||current.reward!==1||current.customReturn!==null;
      $('#demoBanner>span:nth-child(2)').textContent=G.LIBRARY.some(g=>g.id===G.currentView)?`Local demo: ${modified?'this game uses modified outcomes or rewards.':'other tables have modified settings; this game uses normal rules.'}${G.Dev.persistLocked?' (Locked)':''}`:`Local demo: modified outcomes or rewards are enabled.${G.Dev.persistLocked?' (Locked across reload)':''}`;
    }
  }
  $('#demoDetails').addEventListener('click',()=>showView('admin'));

  const rules={
    blackjack:{intro:'Beat the dealer without going over 21. Add chips, enter a custom stake, or click ALL IN to put every token on the hand.',items:['A two-card natural pays 3:2 profit (2.5× total return); a normal win returns 2× your stake. Equal hands push and return the whole stake.','Dealer stands on every 17, including soft 17. A six-deck shoe is reshuffled when fewer than 52 cards remain.','Hit draws a card. Stand completes the dealer hand. Double is allowed on your first two cards when your remaining balance covers a matching stake.','Keyboard shortcuts: Space deals, H hits, S stands, D doubles.']},
    roulette:{intro:'Select a chip (including the ALL chip to place your entire remaining stack on one spot) and tap any number or outside bet.',items:['European single-zero wheel: 37 equally likely pockets in normal mode. The ball and the pocket at the top pointer identify the same result.','A straight-up win pays 35:1 profit (36× return). Dozens return 3×; red/black, odd/even and low/high return 2×. Zero loses all outside bets.','Use 2× Bets to double your board, Rebet to repeat your previous spin, Undo to step back, or Clear to reset planned bets.','Multiple winning bets are summed into one return and one settlement.']},
    slots:{intro:'Three weighted reels, one center payline. Choose a chip, enter any custom wager, or press ALL IN to spin your entire stack.',items:['Each reel independently samples weights: seven 1, diamond 2, bell 3, BAR 4, cherry 5, lemon 5 (20 total).','Three identical: sevens 100×, diamonds 60×, bells 30×, BARs 20×, cherries 12×, lemons 10×.','Exactly two sevens return 5×. Any other pair returns 2×. Only the highest matching paytable award is used.','Your stake is locked during the spin.']},
    poker:{intro:'Jacks or Better with a freshly shuffled 52-card deck each round. Set any stake or press ALL IN, deal five, hold your favorites, and draw once.',items:['Royal flush 250×; straight flush 50×; four of a kind 25×; full house 9×; flush 6×; straight 4×; three of a kind 3×; two pair 2×; Jacks-or-Better pair 1×.','These are total returns. A qualifying high pair returns your stake, not a net win.','A-2-3-4-5 is a valid low straight; a suited low straight pays 50×, not the 250× royal. A royal must be 10-J-Q-K-A of one suit.','Tap a card or focus it and press Space/Enter to hold.']},
    plinko:{intro:'Drop golden balls through 12 rows. Set per-ball stake, go ALL IN on a single ball, or fire a Burst ×5 cascade.',items:['Bucket returns from left to right: 50, 12, 5, 2, 1, 0.5, 0.3, 0.5, 1, 2, 5, 12, 50× your stake.','In normal mode, every decision is a fair coin flip. Bucket probabilities follow the 12-trial binomial distribution.','Up to eight balls may be active concurrently. Each ball locks its own stake and settles once.']},
    baccarat:{intro:'Choose Player, Banker or Tie, set any stake up to your full ALL-IN balance, and deal.',items:['Player win returns 2×; Banker win returns 1.95× after a 5% commission on profit. Tie win returns 9×.','When the hands tie, Player and Banker bets push: the whole stake is returned without reward modifiers.','Standard third-card drawing rules apply automatically on an eight-deck shoe.']},
    crash:{intro:'Start a personal simulated round — including full ALL-IN stakes — and cash out before the predetermined crash.',items:['Normal crash point is floor(100 × 0.97 / (1 − U)) / 100, clamped to 1.00–1,000×. Immediate 1.00× crashes can happen.','The crash deadline uses elapsed wall-clock time. Press C or Cash out before the crash to lock your multiplier.','Optional Auto collect: set 1.05–1,000× before starting. It succeeds only if strictly below the crash point.']},
    hilo:{intro:'Reveal a starting card, then predict strictly higher (↑) or lower (↓). Ace is low (1); King is high (13).',items:['A tie pushes that prediction without losing your streak or stake.','Each risky correct call multiplies your running return by 0.97 ÷ conditional probability.','Press C or Collect anytime between predictions to bank your return.']},
    dice:{intro:'Roll two independent six-sided dice. Choose a target 2–12, under or over, and any wager up to ALL IN.',items:['There are 36 equiprobable ordered rolls in normal mode. Equality loses.','Return multiplier is 0.97 ÷ win probability, rounded down to four decimal places.','The final displayed dice always sum to the settled total.']},
    mines:{intro:'Choose a 4×4, 5×5 or 6×6 grid, mine count, and any stake up to ALL IN. Start commits the layout before any click.',items:['Each safe gem increases your return multiplier: 0.97 × C(total, reveals) / C(safe, reveals).','Press C or Collect between reveals to bank your gold. Hitting a mine loses the stake.']},
    wheel:{intro:'Set any stake up to ALL IN and spin the twelve-segment prize wheel.',items:['Clockwise segments: 0, 2, 0.5, 5, 1, 0, 10, 2, 0.5, 20, 1, 3× with house-calibrated casino probability weights (~96.75% RTP).','Values are total returns: 0× loses the stake, 0.5× returns half, 1× returns the stake, 20× returns twenty times the stake.']},
    stocks:{intro:'Buy and sell shares of 8 simulated companies. Prices tick randomly based on each stock\'s volatility. Buy low, sell high, and grow your portfolio.',items:['Each stock has a base price and volatility. Prices drift up or down over time — check back often for good entry points.','Use Buy to purchase shares (chips are deducted from your balance). Use Sell to liquidate shares (proceeds return to your balance).','Your portfolio value and unrealized P/L update live as prices move. Day P/L shows gains/losses since you opened the app.','All trading is play-money simulation. Stocks and balances persist with your vault.']}
  };
  function showRules(id){const info=rules[id],game=G.LIBRARY.find(g=>g.id===id);if(!info||!game)return;$('#rulesTitle').textContent=game.name;$('#rulesContent').innerHTML=`<p>${info.intro}</p><ul>${info.items.map(item=>`<li>${item}</li>`).join('')}</ul><p class="rules-note">Play-money only. All × awards are total returns, including your stake. Payouts use exact BigInt cent math up to the 9-septillion vault limit. Developer modifications, if enabled, are explicitly labeled.</p>`;Modal.open('rulesModal');}

  let lbSort='balance';
  function locLabel(loc){
    if(!loc||loc==='offline')return 'Offline · Saved Vault';
    if(loc==='lobby')return 'Casino Lobby';
    if(loc==='world')return '3D Royale World';
    if(loc==='admin')return 'Executive Deck';
    return 'Playing '+(G.LIBRARY.find(g=>g.id===loc)?.short||loc);
  }
  function updateLiveFloorBadge(){
    const list=G.Floor?G.Floor.leaderboard('balance'):[];
    const online=list.filter(p=>p.online).length;
    if($('#liveOnlineCount'))$('#liveOnlineCount').textContent=String(Math.max(1,online));
    if($('#sidePlayerCount'))$('#sidePlayerCount').textContent=String(list.length);
  }
  function renderLeaderboard(){
    const box=$('#leaderboardList');if(!box||!G.Floor)return;
    const rows=G.Floor.leaderboard(lbSort);
    const onlineCount=rows.filter(r=>r.online).length;
    if($('#lbOnlineSummary'))$('#lbOnlineSummary').textContent=`${onlineCount} online now · ${rows.length} total player vault${rows.length===1?'':'s'} on this floor`;
    $$('#lbSortTabs button').forEach(b=>{const on=b.dataset.lbSort===lbSort;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});
    box.innerHTML=rows.map(r=>{
      const preset=(G.CONFIG.characters||[]).find(c=>c.id===r.avatar?.preset)||G.CONFIG.characters?.[0]||{torso:'#1c4d35',trim:'#e2c67f'};
      const metric=lbSort==='biggest'?compact(r.biggestWin)+' best':lbSort==='wins'?fmt(r.wins)+' wins':compact(r.balance)+' chips';
      const subMetric=lbSort==='balance'?`Best win: ${compact(r.biggestWin)} · ${fmt(r.wins)}W / ${fmt(r.plays)}P`:`Balance: ${compact(r.balance)} chips`;
      const medal=r.rank===1?'rank-1':r.rank===2?'rank-2':r.rank===3?'rank-3':'';
      const npcTag=r.isNPC?'<span style="font-size:7px;color:#8ea180;background:#1a2e24;border:1px solid #3a4a33;border-radius:3px;padding:1px 5px;margin-left:5px">NPC</span>':'';
      const nameText=r.isNPC?escapeHtml(r.username):(r.isGuest?'Guest Player':'@'+escapeHtml(r.username));
      return `<div class="lb-row ${r.activeHere?'is-you':''} ${r.isNPC?'lb-npc':''} ${medal}">
        <span class="lb-rank">#${r.rank}</span>
        <span class="lb-avatar-dot" style="background:${preset.torso};border-color:${preset.trim}"></span>
        <div class="lb-meta">
          <b>${nameText}${npcTag} ${r.activeHere?'<span class="acc-live-tag">YOU</span>':''}</b>
          <small><i class="presence-dot ${r.online?'on':''}"></i>${escapeHtml(locLabel(r.location))} · ${escapeHtml(r.vip)}</small>
        </div>
        <div class="lb-val" title="${escapeHtml(r.exactText)} chips">
          <b>${escapeHtml(metric)}</b>
          <small>${escapeHtml(subMetric)}</small>
        </div>
      </div>`;
    }).join('');
  }
  $('#lbSortTabs')?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-lb-sort]');if(!btn)return;
    lbSort=btn.dataset.lbSort;S.click();renderLeaderboard();
  });

  function renderCharacterModal(){
    const box=$('#charPresetGrid');if(!box)return;
    const av=G.Wallet.avatar;
    box.innerHTML=(G.CONFIG.characters||[]).map(c=>{
      const on=av.preset===c.id;
      return `<button type="button" class="char-card ${on?'selected':''}" data-char-preset="${c.id}">
        <span class="char-swatch" style="--c-torso:${c.torso};--c-trim:${c.trim};--c-skin:${c.skin}"><i></i><b></b></span>
        <div class="char-card-copy"><b>${escapeHtml(c.name)}</b><small>${escapeHtml(c.role)}</small></div>
      </button>`;
    }).join('');
    if($('#charHatRow')){
      $('#charHatRow').innerHTML=(G.CONFIG.hats||[]).map(h=>`<button type="button" class="mini-bet-btn ${av.hat===h.id?'allin-pill':''}" data-char-hat="${h.id}">${escapeHtml(h.name)}</button>`).join('');
    }
    if($('#charSkinRow')){
      $('#charSkinRow').innerHTML=(G.CONFIG.skins||[]).map(sk=>`<button type="button" class="skin-dot ${av.skin.toLowerCase()===sk.toLowerCase()?'selected':''}" style="background:${sk}" data-char-skin="${sk}" aria-label="Skin tone ${sk}"></button>`).join('');
    }
    if($('#charDiffRow')){
      $('#charDiffRow').innerHTML=[['normal','Normal · +25K Obby'],['hard','Hard · +250K Obby'],['expert','Expert · +2.5M Obby']].map(([id,lbl])=>`<button type="button" class="mini-bet-btn ${av.difficulty===id?'allin-pill':''}" data-char-diff="${id}">${lbl}</button>`).join('');
    }
    G.World3D?.renderPreview?.($('#charPreviewCanvas'));
  }
  $('#characterModal')?.addEventListener('click',e=>{
    const p=e.target.closest('[data-char-preset]');
    if(p){
      const found=(G.CONFIG.characters||[]).find(c=>c.id===p.dataset.charPreset);
      if(found){G.Wallet.setAvatar({preset:found.id,hat:found.hat,skin:found.skin});S.chip();renderCharacterModal();}
      return;
    }
    const h=e.target.closest('[data-char-hat]');
    if(h){G.Wallet.setAvatar({hat:h.dataset.charHat});S.click();renderCharacterModal();return;}
    const sk=e.target.closest('[data-char-skin]');
    if(sk){G.Wallet.setAvatar({skin:sk.dataset.charSkin});S.click();renderCharacterModal();return;}
    const df=e.target.closest('[data-char-diff]');
    if(df){G.Wallet.setAvatar({difficulty:df.dataset.charDiff});S.click();renderCharacterModal();return;}
    if(e.target.closest('#enterWorldFromChar')){
      Modal.close(false);showView('world');
    }
  });

  /* ─── Stocks & Day Trading UI ─── */
  function stockChangeClass(d){return d>0?'stock-up':d<0?'stock-down':'stock-flat';}
  function renderStocks(){
    const box=$('#stocksList');if(!box)return;
    const snap=G.Wallet.getStocksSnapshot();
    const port=snap.filter(s=>s.shares>0);
    const portValue=port.reduce((t,s)=>t+s.marketValue,0);
    const dayPnl=snap.reduce((t,s)=>t+s.dayChange*s.shares,0);
    const bal=G.Wallet.balance;
    const totalValue=bal+portValue;
    box.innerHTML=`
      <div class="stocks-header">
        <div><b>TRADING BALANCE</b><span>${G.fmt(bal)} chips</span></div>
        <div><b>PORTFOLIO VALUE</b><span>${G.fmt(portValue)} chips</span></div>
        <div><b>TOTAL EQUITY</b><span>${G.fmt(totalValue)} chips</span></div>
        <div><b>TODAY'S P/L</b><span class="${stockChangeClass(dayPnl)}">${dayPnl>=0?'+':''}${G.fmt(dayPnl)} chips</span></div>
      </div>
      <div class="stocks-table">
        <div class="stocks-table-head">
          <div>SYMBOL</div><div>NAME</div><div>PRICE</div><div>CHANGE</div><div>SHARES</div><div>MKT VALUE</div><div class="stocks-actions">TRADE</div>
        </div>
        ${snap.map(s=>{
          const chgCls=stockChangeClass(s.dayChange);
          const chgSign=s.dayChange>=0?'+':'';
          const ownCls=s.shares>0?'stock-owned':'';
          return `<div class="stocks-table-row ${ownCls}" data-symbol="${s.symbol}">
            <div><b>${escapeHtml(s.symbol)}</b></div>
            <div>${escapeHtml(s.name)}</div>
            <div>${G.fmt(s.price)}</div>
            <div class="${chgCls}">${chgSign}${G.fmt(Math.abs(s.dayChange))} (${chgSign}${s.dayChangePct.toFixed(2)}%)</div>
            <div>${G.fmt(s.shares)}</div>
            <div>${G.fmt(s.marketValue)}</div>
            <div class="stocks-actions">
              <button type="button" class="stock-buy btn sm" data-symbol="${s.symbol}">Buy</button>
              <button type="button" class="stock-sell btn sm ${s.shares>0?'':'hidden'}" data-symbol="${s.symbol}">Sell</button>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="stocks-portfolio">
        <h4>Your Portfolio${port.length?'': ' — empty'}</h4>
        ${port.map(s=>`<div class="stock-pos">
          <div><b>${escapeHtml(s.symbol)}</b><small>${escapeHtml(s.name)}</small></div>
          <div>${G.fmt(s.shares)} shares @ ${G.fmt(s.avgCost)} avg · ${G.fmt(s.marketValue)} value</div>
          <div style="font-size:10px;color:${s.unrealized>=0?'#9fcbaf':'#e08a8b'}">${s.unrealized>=0?'+':''}${G.fmt(s.unrealized)} unrealized</div>
        </div>`).join('')}
        ${!port.length?'<p class="small muted">No positions yet. Buy your first stock to start trading.</p>':''}
      </div>
    `;
    box.querySelectorAll('.stock-buy').forEach(btn=>{
      btn.onclick=()=>{const sym=btn.dataset.symbol;const amt=prompt('How many shares of '+sym+'?');if(amt){const res=G.Wallet.buyStock(sym,amt);if(res.ok){S.chip();toast(res.message,'good');renderStocks();}else{toast(res.message,'bad');}}};
    });
    box.querySelectorAll('.stock-sell').forEach(btn=>{
      btn.onclick=()=>{const sym=btn.dataset.symbol;const s=snap.find(x=>x.symbol===sym);const amt=prompt('How many shares of '+sym+' to sell? (own '+G.fmt(s.shares)+')');if(amt){const res=G.Wallet.sellStock(sym,amt);if(res.ok){S.chip();toast(res.message,'good');renderStocks();}else{toast(res.message,'bad');}}};
    });
  }

  G.on('wallet',renderWallet);
  G.on('account',()=>{renderAccountHeader();updateLiveFloorBadge();});
  G.on('floor',()=>{updateLiveFloorBadge();if(Modal.active?.id==='leaderboardModal')renderLeaderboard();if(G.currentView==='admin')G.renderAdmin?.();});
  G.on('settled',()=>updateBrokeUI(true));
  G.on('preferences',renderPreferences);
  G.on('developer',renderDeveloper);
  G.on('view',renderDeveloper);

  Object.assign(G,{$,$$,fmt,compact,short,escapeHtml,sleep,duration,motion,animateUI,spinWheel,S,toast,confetti,cardEl,revealCard,rackInit,setupBet,getBet,lockBet,resultMarkup,setResult,feedback,Modal,showView,renderWallet,renderAccountHeader,renderAccountModal,renderLeaderboard,renderCharacterModal,renderStocks,renderPreferences,renderStats,showRules,renderDeveloper,updateBrokeUI});
})(window.GAR);
