/* Hidden local-demo developer controls. Client-side concealment is NOT authentication. */
(function (G) {
  'use strict';
  const {$,$$,fmt,W}=Object.assign({},G,{W:G.Wallet});
  G.adminUnlocked=false;
  let returnView='lobby';
  G.on('view',id=>{if(id!=='admin')returnView=id;});
  const scope=()=>$('#admin-scope').value;
  function idle(){if(W.hasActive()){G.toast('Finish or collect all active rounds before changing demo controls.','bad');return false;}return true;}
  function probabilityPreview(){
    const luck=Number($('#admin-luck').value),enabled=$('#admin-luck-enabled').checked,p=G.Outcomes.probability({luckEnabled:enabled,luck:Number.isFinite(luck)?luck:1});
    $('#admin-probability').textContent=p===0?'0% favorable selection. Normal random outcomes.':`${(p*100).toFixed(p===1?0:3)}% favorable selection in eligible rounds. ${p===1?'Valid favorable outcomes guaranteed where the rules allow.':'Otherwise the normal distribution is used.'}`;
  }
  function loadScope(){
    const selected=scope()==='all'?'blackjack':scope(),s=G.Dev.snapshot(selected);
    $('#admin-luck-enabled').checked=s.luckEnabled;$('#admin-luck').value=String(s.luck);$('#admin-reward').value=s.reward;$('#admin-custom-return').value=s.customReturn===null?'':s.customReturn;
    const known=['1','4','1000','10000000000000000'];$('#admin-luck-preset').value=known.includes(String(s.luck))?String(s.luck):'custom';probabilityPreview();
    if(scope()==='all'){const values=Object.values(G.Dev.all()).map(v=>JSON.stringify(v));if(new Set(values).size>1)$('#admin-probability').textContent+=' Selected tables differ; Apply will overwrite them with these values.';}
  }
  function renderAdmin(){
    const s=W.stats,modified=G.Dev.anyModified();$('#admin-balance').textContent=fmt(W.balance);$('#admin-plays').textContent=fmt(s.plays);$('#admin-resolved').textContent=fmt(s.resolved);$('#admin-wins').textContent=fmt(s.wins);$('#admin-biggest').textContent=fmt(s.biggestWinCents/100);$('#admin-losses').textContent=`${fmt(s.losses)} / ${fmt(s.pushes)}`;$('#admin-voids').textContent=fmt(s.voids);
    $('#admin-mode').textContent=modified?'MODIFIED LOCAL-DEMO SETTINGS':'NORMAL RANDOMNESS & GAME RULES';$('.admin-status .status-dot').style.background=modified?'#d6b66b':'#a0bc8d';$('#admin-active').textContent=W.hasActive()?`${W.activeRounds().length} round(s) in play · changes locked`:'No active rounds';$('#admin-effects').checked=W.prefs.effects;
    $$('#view-admin .admin-section input,#view-admin .admin-section select,#view-admin .admin-section button').forEach(el=>el.disabled=W.hasActive());
  }
  $('#redeemForm').addEventListener('submit',e=>{
    e.preventDefault();if(G.Modal.active?.id!=='redeemModal')return;
    const input=$('#redeemInput'),value=input.value,feedback=$('#redeemFeedback');
    if(value===G.CONFIG.adminCode){
      // No secret is printed, persisted, placed in history or included in feedback.
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
  $('#admin-apply').addEventListener('click',()=>{
    if(!idle())return;const custom=$('#admin-custom-return').value.trim();
    const patch={luckEnabled:$('#admin-luck-enabled').checked,luck:Number($('#admin-luck').value),reward:Number($('#admin-reward').value),customReturn:custom===''?null:Number(custom)};
    if(G.Dev.apply(scope(),patch)){G.toast('Local-demo settings applied. All modified tables are explicitly labeled.','good');loadScope();renderAdmin();}
  });
  $('#admin-reset-game').addEventListener('click',()=>{if(!idle())return;G.Modal.confirm('Reset selected game settings?',`Restore the normal outcome distribution and default paytable for ${scope()==='all'?'all eleven games':G.LIBRARY.find(g=>g.id===scope()).name}. The wallet and statistics stay unchanged.`,()=>{if(G.Dev.reset(scope())){loadScope();renderAdmin();G.toast('Selected game settings restored.','good');}});});
  $('#admin-normal').addEventListener('click',()=>{if(!idle())return;G.Modal.confirm('Restore normal randomness?', 'Disable modified luck at every table. Custom reward factors and return overrides, if any, stay as configured; use Restore normal casino to clear those too.',()=>{if(G.Dev.apply('all',{luckEnabled:false,luck:1})){loadScope();renderAdmin();G.toast('Normal randomness restored everywhere.','good');}});});
  function amount(){const raw=$('#admin-amount').value.trim(),n=raw===''?NaN:Number(raw);if(!Number.isFinite(n)||n<0||n>G.CONFIG.maxBalance){G.toast('Enter an amount between 0 and 9 trillion chips.','bad');return null;}return Math.round(n*100)/100;}
  function grant(n,label='Chips granted'){
    const actual=W.grant(n);if(actual!==null){G.toast(`${label}: +${fmt(actual)} chips${actual<n?' (wallet limit)':''}.`,'good');G.S.chip();renderAdmin();}
  }
  $('#admin-add').addEventListener('click',()=>{if(!idle())return;const n=amount();if(n===null)return;if(n>1000000)G.Modal.confirm('Add a large chip grant?',`Add up to ${fmt(n)} play-money chips to the shared wallet, subject to its 9-trillion limit.`,()=>grant(n));else grant(n);});
  $('#admin-remove').addEventListener('click',()=>{if(!idle())return;const n=amount();if(n===null)return;const result=Math.max(0,W.balance-n);G.Modal.confirm('Remove play-money chips?',`Set the shared wallet to ${fmt(result)} chips. The balance will never become negative.`,()=>{if(W.setBalance(result))G.toast(`Balance is now ${fmt(W.balance)} chips.`,'good');});});
  $('#admin-set').addEventListener('click',()=>{if(!idle())return;const n=amount();if(n===null)return;G.Modal.confirm('Set a custom balance?',`Replace the current wallet with exactly ${fmt(n)} play-money chips. This does not reset statistics.`,()=>{if(W.setBalance(n))G.toast(`Balance set to ${fmt(W.balance)} chips.`,'good');});});
  $('#admin-rich').addEventListener('click',()=>{if(idle())G.Modal.confirm('A trillion, on the house?', 'Grant 1,000,000,000,000 local play-money chips. Chips have no cash value; the wallet limit still applies.',()=>grant(1e12,'Trillion-chip grant'));});
  $('#admin-reset-wallet').addEventListener('click',()=>{if(idle())G.Modal.open('resetModal');});
  $('#admin-reset-stats').addEventListener('click',()=>{if(idle())G.Modal.confirm('Reset your local play record?', 'Clear round counts, wins, biggest net win and recent round history. Keep your balance, preferences and redeemed codes.',()=>{if(W.resetStatistics())G.toast('Play record cleared. Wallet unchanged.','good');});});
  $('#admin-effects').addEventListener('change',()=>W.setPreference('effects',$('#admin-effects').checked));
  $('#admin-bonus').addEventListener('click',()=>{if(idle())grant(50000,'Developer bonus');});
  $('#admin-restore').addEventListener('click',()=>{if(idle())G.Modal.confirm('Restore the normal casino?', 'Restore normal randomness, standard returns and win celebrations in every game. Your wallet, play record, sound preference and redeemed codes stay unchanged.',()=>{if(G.Dev.reset('all')){W.setPreference('effects',true);loadScope();renderAdmin();G.toast('Normal casino configuration restored.','good');}});});
  G.renderAdmin=renderAdmin;G.games.admin={enter:()=>{loadScope();renderAdmin();}};
  G.on('developer',renderAdmin);G.on('preferences',renderAdmin);
  G.hooks.adminInit=()=>{
    const select=$('#admin-scope');G.LIBRARY.forEach(game=>{const option=document.createElement('option');option.value=game.id;option.textContent=game.name;select.append(option);});loadScope();renderAdmin();
  };
})(window.GAR);
