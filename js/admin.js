/* Hidden local-demo developer & executive controls. Client-side concealment is NOT authentication. */
(function (G) {
  'use strict';
  const {$,$$,fmt,compact,short,escapeHtml,W}=Object.assign({},G,{W:G.Wallet});
  G.adminUnlocked=false;
  let returnView='lobby';
  G.on('view',id=>{if(id!=='admin')returnView=id;});
  const scope=()=>$('#admin-scope').value;
  function idle(){if(W.hasActive()){G.toast('Finish or collect all active rounds before changing demo controls.','bad');return false;}return true;}

  function probabilityPreview(){
    const luck=Number($('#admin-luck').value),enabled=$('#admin-luck-enabled').checked,p=G.Outcomes.probability({luckEnabled:enabled,luck:Number.isFinite(luck)?luck:1});
    if($('#admin-prob-bar'))$('#admin-prob-bar').style.width=`${Math.round(p*100)}%`;
    $('#admin-probability').textContent=p===0?'0% favorable selection. Normal random outcomes.':`${(p*100).toFixed(p===1?0:2)}% favorable selection in eligible rounds. ${p===1?'Valid favorable outcomes guaranteed where the rules allow.':'Otherwise the normal distribution is used.'}`;
  }

  function loadScope(){
    const selected=scope()==='all'?'blackjack':scope(),s=G.Dev.snapshot(selected);
    $('#admin-luck-enabled').checked=s.luckEnabled;$('#admin-luck').value=String(s.luck);$('#admin-reward').value=s.reward;$('#admin-custom-return').value=s.customReturn===null?'':s.customReturn;
    const known=['1','2','4','10','50','100','1000','10000000000000000'];
    $('#admin-luck-preset').value=known.includes(String(s.luck))?String(s.luck):'custom';
    probabilityPreview();
    if(scope()==='all'){
      const values=Object.values(G.Dev.all()).map(v=>JSON.stringify(v));
      if(new Set(values).size>1)$('#admin-probability').textContent+=' Tables currently differ; Apply overwrites all 11.';
    }
  }

  function renderMatrix(){
    const box=$('#admin-game-matrix');if(!box)return;
    const locked=W.hasActive();
    box.innerHTML=G.LIBRARY.map(g=>{
      const s=G.Dev.snapshot(g.id),p=G.Outcomes.probability(s),mod=(s.luckEnabled&&s.luck>1)||s.reward!==1||s.customReturn!==null;
      const badge=!mod?'FAIR 1×':p>=1?'GOD 100%':s.luckEnabled&&s.luck===10?'10× LOCKED':s.luckEnabled&&s.luck>1?`${short(s.luck)}× (${Math.round(p*100)}%)`:'PAY BOOST';
      const rewardNote=s.reward!==1||s.customReturn!==null?` · ${s.customReturn!==null?short(s.customReturn)+'× base × ':''}${s.reward}× pay`:'';
      const active10=s.luckEnabled&&s.luck===10,activeGod=s.luckEnabled&&s.luck>=1e8,activeFair=!mod;
      return `<div class="matrix-card ${mod?'is-mod':''}">
        <div class="matrix-top">${G.Art.icon(g.icon)}<div class="matrix-title"><b>${escapeHtml(g.short)}</b><small>${escapeHtml(badge+rewardNote)}</small></div><button type="button" class="matrix-launch" data-matrix-launch="${g.id}" title="Open ${escapeHtml(g.name)}">Play ↗</button></div>
        <div class="matrix-btns">
          <button type="button" class="${activeFair?'on':''}" data-matrix-game="${g.id}" data-matrix-mode="fair" ${locked?'disabled':''}>Fair</button>
          <button type="button" class="${active10?'on':''}" data-matrix-game="${g.id}" data-matrix-mode="10x" ${locked?'disabled':''}>10× Lock</button>
          <button type="button" class="${activeGod?'on':''}" data-matrix-game="${g.id}" data-matrix-mode="god" ${locked?'disabled':''}>MAX</button>
        </div>
      </div>`;
    }).join('');
  }

  function renderAccountsRegistry(){
    const box=$('#admin-accounts-list');if(!box)return;
    const list=G.Floor?G.Floor.leaderboard('balance'):G.Accounts.listSummary();
    const locked=W.hasActive();
    if($('#admin-player-count'))$('#admin-player-count').textContent=`${list.filter(p=>p.online).length} online · ${list.length} total`;
    const existing=new Map($$('[data-player-row]',box).map(el=>[el.dataset.playerRow,el]));
    const seen=new Set();
    for(const a of list){
      seen.add(a.key);
      const label=a.isGuest?'Guest Player':'@'+a.username;
      const loc=a.location==='world'?'3D World':a.location==='lobby'?'Lobby':a.location==='offline'?'Saved Vault':(G.LIBRARY.find(g=>g.id===a.location)?.short||a.location);
      const infoHtml=`<b><i class="presence-dot ${a.online?'on':''}"></i>${escapeHtml(label)} ${a.activeHere?'<span class="acc-live-tag">YOU</span>':''}</b>
        <small title="${escapeHtml(a.exactText)} chips">${escapeHtml(loc)} · ${escapeHtml(a.vip)} · <strong>${escapeHtml(compact(a.balance))}</strong> chips (${fmt(a.plays)} rounds)</small>`;
      let row=existing.get(a.key);
      if(!row){
        row=document.createElement('div');
        row.dataset.playerRow=a.key;
        row.innerHTML=`<div class="admin-acc-info">${infoHtml}</div>
          <div class="admin-acc-controls">
            <input type="text" class="admin-acc-input" data-acc-input="${escapeHtml(a.key)}" placeholder="Amt (e.g. 5T, 1Qa)" value="1000000" aria-label="Chip amount for ${escapeHtml(label)}">
            <button type="button" class="mini-bet-btn allin-pill" data-acc-op="add" data-acc-key="${escapeHtml(a.key)}">+ Add</button>
            <button type="button" class="mini-bet-btn" data-acc-op="remove" data-acc-key="${escapeHtml(a.key)}">− Remove</button>
            <button type="button" class="mini-bet-btn" data-acc-op="set" data-acc-key="${escapeHtml(a.key)}">Set</button>
            <button type="button" class="mini-bet-btn" data-acc-op="quick-add" data-acc-amt="1e15" data-acc-key="${escapeHtml(a.key)}">+1Qa</button>
            <button type="button" class="mini-bet-btn" data-acc-op="half" data-acc-key="${escapeHtml(a.key)}">−50%</button>
            <button type="button" class="mini-bet-btn danger-pill" data-acc-op="wipe" data-acc-key="${escapeHtml(a.key)}">Wipe 0</button>
          </div>`;
        box.append(row);
      }else{
        const infoEl=$('.admin-acc-info',row);
        if(infoEl&&infoEl.innerHTML!==infoHtml)infoEl.innerHTML=infoHtml;
      }
      row.className=`admin-acc-row ${a.activeHere?'is-active':''}`;
      const dis=!!(a.activeHere&&locked);
      $$('input,button',row).forEach(el=>{if(el.disabled!==dis)el.disabled=dis;});
    }
    for(const [k,el] of existing)if(!seen.has(k))el.remove();
  }

  function renderPromoCodes(){
    const box=$('#admin-promo-list');if(!box)return;
    const codes=G.Dev.customCodes(),entries=Object.entries(codes),locked=W.hasActive();
    const builtIn=Object.entries(G.CONFIG.redeemCodes).map(([k,v])=>`<span class="promo-chip builtin" title="Built-in promo code">${escapeHtml(k)} · +${compact(v.chips)}</span>`).join('');
    const custom=entries.map(([k,v])=>`<span class="promo-chip">${escapeHtml(k)} · +${compact(v.chips)} <button type="button" data-del-promo="${escapeHtml(k)}" aria-label="Remove code ${escapeHtml(k)}" ${locked?'disabled':''}>×</button></span>`).join('');
    box.innerHTML=`<div class="promo-chips-wrap">${builtIn}${custom}</div>`;
  }

  function renderAdmin(){
    const s=W.stats,modified=G.Dev.anyModified(),acc=G.Accounts.current;
    $('#admin-balance').textContent=W.balance>=1e15?`${compact(W.balance)} (${W.exactText})`:W.exactText;
    $('#admin-plays').textContent=fmt(s.plays);
    $('#admin-resolved').textContent=fmt(s.resolved);
    $('#admin-wins').textContent=fmt(s.wins);
    $('#admin-biggest').textContent=compact(s.biggestWinCents/100);
    $('#admin-losses').textContent=`${fmt(s.losses)} / ${fmt(s.pushes)}`;
    $('#admin-voids').textContent=fmt(s.voids);
    if($('#admin-wagered'))$('#admin-wagered').textContent=compact(s.wageredCents/100);
    const net=(s.returnedCents-s.wageredCents)/100;
    if($('#admin-net'))$('#admin-net').textContent=(net>=0?'+':'−')+compact(Math.abs(net));
    if($('#admin-profile-pill'))$('#admin-profile-pill').textContent=acc.loggedIn?`@${acc.username} · ${acc.vip.tier.name}`:'Guest session';
    if($('#admin-rtp-pill'))$('#admin-rtp-pill').textContent=s.wageredCents>0?`RTP ${((s.returnedCents/s.wageredCents)*100).toFixed(1)}%`:'RTP —';
    $('#admin-mode').textContent=modified?(G.Dev.persistLocked?'MODIFIED & LOCKED ACROSS RELOAD':'MODIFIED LOCAL-DEMO SETTINGS'):'NORMAL RANDOMNESS & GAME RULES';
    $('.admin-status .status-dot').style.background=modified?'#d6b66b':'#a0bc8d';
    $('#admin-active').textContent=W.hasActive()?`${W.activeRounds().length} round(s) in play · changes locked`:'No active rounds';
    $('#admin-effects').checked=W.prefs.effects;
    if($('#admin-persist-lock'))$('#admin-persist-lock').checked=G.Dev.persistLocked;
    renderMatrix();
    renderAccountsRegistry();
    renderPromoCodes();
    const active=W.hasActive();
    $$('#view-admin .admin-section input:not(.admin-acc-input),#view-admin .admin-section select,#view-admin .admin-section button:not([data-matrix-launch]):not([data-open]):not([data-acc-op]),#view-admin .admin-macros button,#admin-persist-lock').forEach(el=>el.disabled=active);
  }

  $('#redeemForm').addEventListener('submit',e=>{
    e.preventDefault();if(G.Modal.active?.id!=='redeemModal')return;
    const input=$('#redeemInput'),value=input.value,feedback=$('#redeemFeedback');
    if(value===G.CONFIG.adminCode){
      input.value='';feedback.textContent='';G.adminUnlocked=true;G.Modal.close(false);G.showView('admin');return;
    }
    const response=W.redeem(value);feedback.textContent=response.message;feedback.className='form-feedback '+(response.ok?'good':'bad');
    G.animateUI(feedback,[{opacity:.5,transform:'translateY(2px)'},{opacity:1,transform:'translateY(0)'}],{duration:160});
    if(response.ok){input.value='';G.S.win();G.toast(response.message,'good');}else{input.setAttribute('aria-invalid','true');input.focus();}
  });
  $('#redeemInput').addEventListener('input',()=>$('#redeemInput').removeAttribute('aria-invalid'));
  $('#admin-close').addEventListener('click',()=>G.showView(returnView));
  $('#admin-scope').addEventListener('change',loadScope);
  $('#admin-luck-preset').addEventListener('change',()=>{const value=$('#admin-luck-preset').value;if(value==='custom')$('#admin-luck').focus();else $('#admin-luck').value=value;probabilityPreview();});
  $('#admin-luck').addEventListener('input',()=>{if($('#admin-luck').value!==$('#admin-luck-preset').value)$('#admin-luck-preset').value='custom';probabilityPreview();});
  $('#admin-luck-enabled').addEventListener('change',probabilityPreview);

  $('#admin-persist-lock')?.addEventListener('change',()=>{
    if(!idle()){$('#admin-persist-lock').checked=G.Dev.persistLocked;return;}
    const on=G.Dev.setPersistLock($('#admin-persist-lock').checked);
    G.toast(on?'Admin luck & payout settings locked across page reloads.':'Reload lock disabled — settings apply to this session only.','good');
    renderAdmin();
  });

  function applyGlobalMacro(patch,msg,celebrate=false){
    if(!idle())return;
    if(G.Dev.apply('all',patch)){
      loadScope();renderAdmin();
      celebrate?G.S.big():G.S.win();
      if(celebrate)G.confetti();
      G.toast(msg,'good');
    }
  }
  $('#admin-macro-10x')?.addEventListener('click',()=>applyGlobalMacro({luckEnabled:true,luck:10,reward:1,customReturn:null},'10× Luck locked on all 11 games!'));
  $('#admin-macro-100x')?.addEventListener('click',()=>applyGlobalMacro({luckEnabled:true,luck:100,reward:1,customReturn:null},'100× Hot Streak locked on all 11 games!'));
  $('#admin-macro-god')?.addEventListener('click',()=>applyGlobalMacro({luckEnabled:true,luck:1e16,reward:1,customReturn:null},'God Mode (100% favorable selection) active on all 11 games!',true));
  $('#admin-macro-hyper')?.addEventListener('click',()=>applyGlobalMacro({luckEnabled:true,luck:1e16,reward:10,customReturn:null},'Hyper Jackpot active: 100% favor + 10× payouts on all games!',true));
  $('#admin-macro-fair')?.addEventListener('click',()=>{if(!idle())return;if(G.Dev.reset('all')){loadScope();renderAdmin();G.S.click();G.toast('100% fair rules restored across all 11 games.','good');}});

  $('#admin-matrix-10x')?.addEventListener('click',()=>applyGlobalMacro({luckEnabled:true,luck:10},'10× Luck locked across every table!'));
  $('#admin-matrix-god')?.addEventListener('click',()=>applyGlobalMacro({luckEnabled:true,luck:1e16},'MAX God Luck locked across every table!',true));
  $('#admin-matrix-fair')?.addEventListener('click',()=>{if(!idle())return;if(G.Dev.reset('all')){loadScope();renderAdmin();G.toast('All 11 tables set to fair 1× RNG.','good');}});

  $('#admin-game-matrix')?.addEventListener('click',e=>{
    const launch=e.target.closest('[data-matrix-launch]');
    if(launch){G.showView(launch.dataset.matrixLaunch);return;}
    const btn=e.target.closest('[data-matrix-game]');
    if(!btn||!idle())return;
    const game=btn.dataset.matrixGame,mode=btn.dataset.matrixMode;
    const name=G.LIBRARY.find(g=>g.id===game)?.short||game;
    const ok=mode==='fair'?G.Dev.reset(game):mode==='10x'?G.Dev.apply(game,{luckEnabled:true,luck:10}):G.Dev.apply(game,{luckEnabled:true,luck:1e16});
    if(ok){loadScope();renderAdmin();G.S.chip();G.toast(`${name}: ${mode==='fair'?'Fair 1× restored':mode==='10x'?'10× Luck locked':'MAX God Luck locked'}.`,'good');}
  });

  $('#admin-apply').addEventListener('click',()=>{
    if(!idle())return;const custom=$('#admin-custom-return').value.trim();
    const patch={luckEnabled:$('#admin-luck-enabled').checked,luck:Number($('#admin-luck').value),reward:Number($('#admin-reward').value),customReturn:custom===''?null:Number(custom)};
    if(G.Dev.apply(scope(),patch)){G.toast('Local-demo settings applied. All modified tables are explicitly labeled.','good');loadScope();renderAdmin();}
  });
  $('#admin-reset-game').addEventListener('click',()=>{if(!idle())return;G.Modal.confirm('Reset selected game settings?',`Restore the normal outcome distribution and default paytable for ${scope()==='all'?'all eleven games':G.LIBRARY.find(g=>g.id===scope()).name}. The wallet and statistics stay unchanged.`,()=>{if(G.Dev.reset(scope())){loadScope();renderAdmin();G.toast('Selected game settings restored.','good');}});});
  $('#admin-normal').addEventListener('click',()=>{if(!idle())return;G.Modal.confirm('Restore normal randomness?', 'Disable modified luck at every table. Custom reward factors and return overrides, if any, stay as configured; use Restore normal casino to clear those too.',()=>{if(G.Dev.apply('all',{luckEnabled:false,luck:1})){loadScope();renderAdmin();G.toast('Normal randomness restored everywhere.','good');}});});

  function amount(){
    const raw=$('#admin-amount').value.trim(),n=raw===''?NaN:G.parseChips(raw);
    if(!Number.isFinite(n)||n<0||n>G.CONFIG.maxBalance){G.toast('Enter an amount from 0 to 9 Septillion (e.g. 50T, 10Qa, 1Qi).','bad');return null;}
    return n<=9e12?Math.round(n*100)/100:n;
  }
  function grant(n,label='Chips granted'){
    const actual=W.grant(n);if(actual!==null){G.toast(`${label}: +${compact(actual)} chips${actual<n?' (vault limit)':''}.`,'good');G.S.chip();renderAdmin();}
  }

  $$('[data-admin-grant]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!idle())return;
    grant(G.parseChips(btn.dataset.adminGrant),'Executive mint');
  }));
  $('#admin-double-wallet')?.addEventListener('click',()=>{
    if(!idle())return;
    if(W.balance<=0){grant(10000,'Starter mint');return;}
    grant(W.balance,'Wallet doubled');
  });
  $('#admin-max-vault')?.addEventListener('click',()=>{
    if(!idle())return;
    G.Modal.confirm('Fill 9-Septillion max vault?','Set your play-money balance to 9,000,000,000,000,000,000,000,000 (9 Sp) chips.',()=>{if(W.setBalance(G.CONFIG.maxBalance)){G.S.big();G.confetti();G.toast('Vault filled to 9 Septillion (9Sp) chips!','good');renderAdmin();}});
  });

  $('#admin-add').addEventListener('click',()=>{if(!idle())return;const n=amount();if(n===null)return;if(n>1000000)G.Modal.confirm('Add a large chip grant?',`Add up to ${compact(n)} play-money chips to the shared wallet.`,()=>grant(n));else grant(n);});
  $('#admin-remove').addEventListener('click',()=>{if(!idle())return;const n=amount();if(n===null)return;G.Modal.confirm('Remove play-money chips?',`Deduct up to ${compact(n)} chips from the active wallet (floors at 0).`,()=>{if(n===0||W.deduct(n)!==null){G.toast(`Balance is now ${compact(W.balance)} chips.`,'good');renderAdmin();}});});
  $('#admin-set').addEventListener('click',()=>{if(!idle())return;const n=amount();if(n===null)return;G.Modal.confirm('Set a custom balance?',`Replace the current wallet with ${compact(n)} play-money chips.`,()=>{if(W.setBalance(n)){G.toast(`Balance set to ${compact(W.balance)} chips.`,'good');renderAdmin();}});});
  $('#admin-rich').addEventListener('click',()=>{if(idle())G.Modal.confirm('A trillion, on the house?', 'Grant 1,000,000,000,000 local play-money chips. Chips have no cash value.',()=>grant(1e12,'Trillion-chip grant'));});
  $('#admin-reset-wallet').addEventListener('click',()=>{if(idle())G.Modal.open('resetModal');});
  $('#admin-reset-stats').addEventListener('click',()=>{if(idle())G.Modal.confirm('Reset your local play record?', 'Clear round counts, wins, biggest net win and recent round history. Keep your balance, preferences and redeemed codes.',()=>{if(W.resetStatistics())G.toast('Play record cleared. Wallet unchanged.','good');});});
  $('#admin-effects').addEventListener('change',()=>W.setPreference('effects',$('#admin-effects').checked));
  $('#admin-bonus').addEventListener('click',()=>{if(idle())grant(50000,'Developer bonus');});
  $('#admin-test-fx')?.addEventListener('click',()=>{W.setPreference('effects',true);G.S.big();G.confetti();G.toast('Royal celebration triggered!','good');renderAdmin();});
  $('#admin-restore').addEventListener('click',()=>{if(idle())G.Modal.confirm('Restore the normal casino?', 'Restore normal randomness, standard returns and win celebrations in every game. Your wallet, play record, sound preference and redeemed codes stay unchanged.',()=>{if(G.Dev.reset('all')){W.setPreference('effects',true);loadScope();renderAdmin();G.toast('Normal casino configuration restored.','good');}});});

  $('#admin-accounts-list')?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-acc-op]');if(!btn)return;
    const key=btn.dataset.accKey,op=btn.dataset.accOp;
    const inp=$(`[data-acc-input="${CSS.escape(key)}"]`,$('#admin-accounts-list'));
    const rawVal=op==='quick-add'?btn.dataset.accAmt:(inp?inp.value:'0');
    const mode=op==='quick-add'?'add':op;
    const res=G.Accounts.adminModifyPlayer(key,mode,rawVal);
    if(res.ok){
      op==='wipe'||op==='remove'||op==='half'?G.S.click():G.S.win();
      G.toast(`${res.username}: balance is now ${compact(res.balance)} chips.`,'good');
      renderAdmin();
    }else G.toast(res.message,'bad');
  });
  $('#admin-unlock-ach')?.addEventListener('click',()=>{
    if(!idle())return;
    if(G.Accounts.adminUnlockAllAchievements()){G.S.big();G.confetti();G.toast(`All ${(G.CONFIG.achievements||[]).length} Royale achievements unlocked!`,'good');renderAdmin();}
  });

  $('#admin-promo-create')?.addEventListener('click',()=>{
    if(!idle())return;
    const res=G.Dev.addPromoCode($('#admin-promo-code').value,$('#admin-promo-chips').value);
    if(res.ok){$('#admin-promo-code').value='';G.S.win();G.toast(`Promo code ${res.code} created (+${compact(res.chips)} chips)!`,'good');renderAdmin();}
    else G.toast(res.message,'bad');
  });
  $('#admin-promo-list')?.addEventListener('click',e=>{
    const del=e.target.closest('[data-del-promo]');if(!del||!idle())return;
    if(G.Dev.removePromoCode(del.dataset.delPromo)){G.S.click();G.toast(`Removed promo code ${del.dataset.delPromo}.`,'info');renderAdmin();}
  });

  G.renderAdmin=renderAdmin;G.games.admin={enter:()=>{loadScope();renderAdmin();}};
  G.on('developer',renderAdmin);G.on('preferences',renderAdmin);G.on('account',renderAdmin);
  G.on('floor',()=>{if(G.currentView==='admin'&&!document.activeElement?.classList?.contains('admin-acc-input'))renderAccountsRegistry();});
  G.hooks.adminInit=()=>{
    const select=$('#admin-scope');G.LIBRARY.forEach(game=>{const option=document.createElement('option');option.value=game.id;option.textContent=game.name;select.append(option);});loadScope();renderAdmin();
  };
})(window.GAR);
