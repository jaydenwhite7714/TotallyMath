/* Static-app composition. No backend, framework, CDN or runtime dependency. */
(function (G) {
  'use strict';
  const {$,$$}=G;
  G.Art.defs();
  $$('[data-icon]').forEach(el=>el.innerHTML=G.Art.icon(el.dataset.icon));
  $('#hero-art').innerHTML=G.Art.hero();
  const classics=['blackjack','roulette','slots','poker','plinko'];
  G.LIBRARY.forEach(game=>{
    const button=document.createElement('button');button.className='side-link';button.dataset.view=game.id;
    button.innerHTML=G.Art.icon(game.icon)+`<span>${game.short}</span>`+(game.isNew?'<span class="new-dot" aria-label="New game"></span>':'');
    $(classics.includes(game.id)?'#classic-nav':'#new-nav').append(button);
  });
  $('#gameGrid').innerHTML=G.LIBRARY.map(game=>`<button type="button" class="gcard art-${game.color}" data-view="${game.id}" data-category="${game.category}" data-name="${game.name.toLowerCase()}" aria-label="Play ${game.name}"><span class="gcard-art"><span class="card-collection">${game.label}</span>${game.isNew?'<span class="new-tag">NEW</span>':''}${G.Art.gameArt(game.id)}</span><span class="gcard-content"><span class="gcard-title">${game.name}${G.Art.icon('arrow')}</span><span class="gcard-desc">${game.desc}</span><span class="meta"><span>${game.tag}</span><span class="meta-label">PLAY FOR FUN</span></span></span></button>`).join('');
  let filter='all';
  function filterGames(){
    const query=$('#gameSearch').value.trim().toLowerCase();let count=0;
    $$('#gameGrid .gcard').forEach(card=>{const visible=(filter==='all'||card.dataset.category===filter)&&card.dataset.name.includes(query);card.classList.toggle('hidden',!visible);if(visible)count++;});
    $('#noGames').classList.toggle('hidden',count!==0);
    $$('#gameFilters button').forEach(button=>{button.classList.toggle('selected',button.dataset.filter===filter);button.setAttribute('aria-pressed',String(button.dataset.filter===filter));});
  }
  $('#gameFilters').addEventListener('click',e=>{const button=e.target.closest('[data-filter]');if(!button)return;filter=button.dataset.filter;filterGames();G.S.click();});
  $('#gameSearch').addEventListener('input',filterGames);filterGames();
  // Individual game modules register setup hooks; only one copy of each runs.
  G.hooks.originalInit();G.hooks.tableInit();G.hooks.arcadeInit();G.hooks.adminInit();
  // The only shared multiplier transform: losing awards remain zero, refunds are exact.
  function demoMultiplier(game,base){const s=G.Dev.snapshot(game);return base===0?0:Math.min(G.CONFIG.maxPayoutMultiplier,(s.customReturn===null?base:s.customReturn)*s.reward);}
  G.demoMultiplier=demoMultiplier;
  function showModifiedRules(){
    for(const game of G.LIBRARY){
      const view=$('#view-'+game.id),s=G.Dev.snapshot(game.id),luck=s.luckEnabled&&s.luck>1,returns=s.reward!==1||s.customReturn!==null,modified=luck||returns;
      let note=$('.game-modified-note',view);
      if(!note){note=document.createElement('div');note.className='game-modified-note hidden';note.setAttribute('role','status');$('.gamebar',view).after(note);}
      note.classList.toggle('hidden',!modified);
      if(modified){const details=[];if(luck)details.push(`${s.luck===10?'10× luck lock · ':''}${(G.Outcomes.probability(s)*100).toFixed(2)}% favorable outcome selection${game.id==='mines'?' (precommitted lower-right mines)':''}`);if(s.customReturn!==null)details.push(`positive base awards replaced by ${G.fmt(s.customReturn)}×`);if(s.reward!==1)details.push(`${G.fmt(s.reward)}× reward factor`);note.textContent='Modified local demo · '+details.join(' · ')+'. Pushes still refund only the stake.';}
      const card=$(`#gameGrid .gcard[data-view="${game.id}"] .gcard-art`);
      if(card){
        let badge=$('.gcard-mod-tag',card);
        if(!badge){badge=document.createElement('span');badge.className='gcard-mod-tag hidden';card.append(badge);}
        badge.classList.toggle('hidden',!modified);
        if(modified)badge.textContent=luck&&s.luck>=1e8?'MAX LUCK':luck?`${G.short(s.luck)}× LUCK`:`${G.short(s.reward)}× PAY`;
      }
      $$('.payrow b',view).forEach(el=>{if(!el.dataset.baseMultiplier)el.dataset.baseMultiplier=parseFloat(el.textContent);const base=+el.dataset.baseMultiplier;el.textContent=G.fmt(demoMultiplier(game.id,base))+'×';});
    }
    $$('#ba-sides button').forEach(button=>{const base=button.dataset.side==='player'?2:button.dataset.side==='tie'?9:1.95;const s=G.Dev.snapshot('baccarat'),changed=s.reward!==1||s.customReturn!==null;$('b',button).textContent=(demoMultiplier('baccarat',base)>=1000?G.short(demoMultiplier('baccarat',base)):demoMultiplier('baccarat',base).toFixed(2))+'×';$('small',button).textContent=changed?'Modified demo return':button.dataset.side==='player'?'Even-money win':button.dataset.side==='tie'?'8:1 profit':'5% win commission';});
    if(!G.games.wheel.state.busy){$('#lw-wheel').innerHTML=G.Art.prizeSvg(G.Rules.LUCKY_SEGMENTS.map(v=>demoMultiplier('wheel',v)));G.games.wheel.highlight();}
    $('.wheel-prizes>div:first-child>b').textContent=G.short(demoMultiplier('wheel',20))+'×';
    G.renderDeveloper();
  }
  G.on('developer',showModifiedRules);showModifiedRules();
  G.renderPreferences();G.renderWallet();G.renderDeveloper();
  const start=location.hash.slice(1)||'lobby';if(!G.showView(start,{fromHistory:true}))G.showView('lobby',{fromHistory:true});
  if(G.Wallet.recovered>0)G.toast(`Unfinished rounds refunded: ${G.fmt(G.Wallet.recovered)} chips.`, 'good');
  if(!G.Wallet.storageAvailable)G.toast('Browser storage is unavailable. Play works, but this session cannot be saved.');
  G.updateBrokeUI(true);G.ready=true;document.documentElement.dataset.ready='true';
})(window.GAR);
