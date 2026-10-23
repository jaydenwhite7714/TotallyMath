/* Baccarat, Hi-Lo and Dice: independent controllers on the shared rules/ledger. */
(function (G) {
  'use strict';
  const {$,$$,sleep,S,fmt,cardEl,revealCard}=G,W=G.Wallet,R=G.Rules,O=G.Outcomes;
  const title=s=>s[0].toUpperCase()+s.slice(1);
  /* ═══════════ BACCARAT ═══════════ */
  const BA={selection:'player',busy:false,round:null,last:null};
  function baRefresh(){
    const base=BA.selection==='player'?2:BA.selection==='banker'?1.95:9;
    $('#ba-potential').textContent=fmt(W.preview('baccarat',G.getBet('ba'),base).amount)+' chips';$('#ba-selection').textContent=title(BA.selection);
    $('#ba-start').disabled=BA.busy;G.lockBet('ba',BA.busy);
    $$('#ba-sides button').forEach(b=>{b.disabled=BA.busy;b.classList.toggle('selected',b.dataset.side===BA.selection);b.setAttribute('aria-pressed',String(b.dataset.side===BA.selection));});
  }
  $('#ba-sides').addEventListener('click',e=>{const b=e.target.closest('[data-side]');if(!b||BA.busy||b.disabled)return;BA.selection=b.dataset.side;S.chip();baRefresh();});
  G.setupBet('ba',baRefresh,()=>BA.busy);
  $('#ba-start').addEventListener('click',async()=>{
    if(BA.busy)return;BA.busy=true;baRefresh();const round=W.begin('baccarat',G.getBet('ba'));if(!round){BA.busy=false;baRefresh();return;}BA.round=round;
    const selection=BA.selection,deck=R.makeDeck(8);
    if(O.shouldFavor(round))R.stackNext(deck,selection==='player'?['4','3','5','4']:selection==='banker'?['3','4','4','5']:['4','4','5','5']);
    const outcome=R.baccaratDeal(deck);BA.last={...outcome,selection};
    $('#ba-player').innerHTML='';$('#ba-banker').innerHTML='';$('#ba-player-val').textContent='–';$('#ba-banker-val').textContent='–';$('#ba-result').className='round-message';$('#ba-result').textContent='A little anticipation. A little destiny…';
    const visible={player:[],banker:[]};
    async function deal(side,index){const c=outcome[side][index],el=cardEl(c,true);$('#ba-'+side).append(el);await sleep(140);revealCard(el,c);S.card();visible[side].push(c);$('#ba-'+side+'-val').textContent=R.baccaratValue(visible[side]);await sleep(190);}
    await deal('player',0);await deal('banker',0);await deal('player',1);await deal('banker',1);
    if(outcome.player.length===3)await deal('player',2);if(outcome.banker.length===3)await deal('banker',2);
    const push=outcome.winner==='tie'&&selection!=='tie',mult=R.baccaratReturn(selection,outcome);
    const r=W.settle(round,mult,{refund:push,reason:`${outcome.winner} ${outcome.p}–${outcome.b}`});
    const label=outcome.winner==='tie'?`${outcome.p}–${outcome.b}. A perfect tie${push?' — your stake returns.':'.'}`:`${title(outcome.winner)} wins · ${outcome.p}–${outcome.b}${outcome.natural?' · natural':''}`;
    G.setResult('ba',label,r);G.feedback(r,mult===9);BA.last.result=r;BA.busy=false;baRefresh();
  });
  G.games.baccarat={state:BA,enter:baRefresh};
  /* ═══════════ HI-LO ═══════════ */
  const HL={phase:'idle',round:null,current:null,previous:null,multiplier:1,streak:0,busy:false,outcome:null};
  function freshCard(ranks=R.RANKS){const r=G.RNG.pick(ranks),s=G.RNG.pick(R.SUITS);return{r,s,red:s==='♥'||s==='♦'};}
  function hlCards(down=false){
    if(HL.previous)$('#hl-previous').replaceChildren(cardEl(HL.previous));else $('#hl-previous').innerHTML='';
    $('#hl-current').replaceChildren(cardEl(HL.current||{r:'A',s:'♠'},!HL.current||down));$('#hl-next').replaceChildren(cardEl({r:'A',s:'♠'},true));
  }
  function hlRefresh(){
    const active=HL.phase==='active',locked=active||HL.busy;$('#hl-start').disabled=locked;G.lockBet('hl',locked);$('#hl-collect').disabled=!active||HL.busy;
    $('#hl-streak').textContent=HL.streak;const displayed=HL.outcome==='loss'?0:HL.round?W.quote(HL.round,HL.multiplier,{refund:HL.streak===0}).multiplier:HL.multiplier;$('#hl-mult').textContent=(displayed>=1000?G.short(displayed):displayed.toFixed(4))+'×';
    const q=HL.round&&active?W.quote(HL.round,HL.multiplier,{refund:HL.streak===0}):null;$('#hl-collect-amount').textContent=q?fmt(q.amount)+' chips':'–';
    for(const d of ['higher','lower']){
      const p=HL.current?R.hiLoChance(HL.current,d):0,factor=HL.current?R.hiLoFactor(HL.current,d):0;
      $('#hl-'+d).disabled=!active||HL.busy||p===0;
      const bias=active?O.probability(HL.round.settings):0,success=p*12/13,conditional=p===0?0:bias?(bias+(1-bias)*success)/(1-(1-bias)/13):p;
      $('#hl-'+(d==='higher'?'high':'low')+'-odds').textContent=HL.current?`${(conditional*100).toFixed(1)}% · ${factor.toFixed(2)}×`:'–';
    }
  }
  G.setupBet('hl',hlRefresh,()=>HL.phase==='active'||HL.busy);
  $('#hl-start').addEventListener('click',async()=>{
    if(HL.phase==='active'||HL.busy)return;HL.busy=true;hlRefresh();const round=W.begin('hilo',G.getBet('hl'));if(!round){HL.busy=false;hlRefresh();return;}
    HL.round=round;HL.phase='active';HL.outcome=null;HL.current=freshCard();HL.previous=null;HL.streak=0;HL.multiplier=1;hlCards(true);$('#hl-result').className='round-message';$('#hl-result').textContent='Your first card. Your next instinct.';S.card();await sleep(290);revealCard($('#hl-current .card'),HL.current);HL.busy=false;hlRefresh();
  });
  function hlCollect(auto=false){
    if(HL.phase!=='active'||HL.busy)return;HL.busy=true;hlRefresh();
    const r=W.settle(HL.round,HL.multiplier,{refund:HL.streak===0,reason:`Collected after ${HL.streak} calls`});
    HL.phase='done';HL.outcome='collect';HL.busy=false;G.setResult('hl',auto?'A fine streak. Automatically collected.':'A good time to leave the table.',r);G.feedback(r,HL.multiplier>=10);hlRefresh();
  }
  $('#hl-collect').addEventListener('click',()=>hlCollect());
  async function hlPredict(direction){
    if(HL.phase!=='active'||HL.busy||R.hiLoChance(HL.current,direction)===0)return;
    HL.busy=true;hlRefresh();const prior=HL.current,factor=R.hiLoFactor(prior,direction),rank=R.lowRank(prior);
    const next=O.choose(HL.round,()=>freshCard(),()=>freshCard(R.RANKS.filter(r=>direction==='higher'?R.lowRank({r})>rank:R.lowRank({r})<rank)));
    HL.previous=prior;HL.current=next;hlCards(true);S.card();await sleep(310);revealCard($('#hl-current .card'),next);await sleep(130);
    const cmp=R.lowRank(next)-rank,correct=direction==='higher'?cmp>0:cmp<0;
    if(cmp===0){$('#hl-result').className='round-message';$('#hl-result').textContent='A tie. Your streak and return stay in play.';HL.busy=false;hlRefresh();return;}
    if(!correct){const r=W.settle(HL.round,0,{reason:`Incorrect ${direction} call`});HL.phase='done';HL.outcome='loss';HL.busy=false;G.setResult('hl',`${next.r} was ${cmp>0?'higher':'lower'}. The streak ends here.`,r);G.feedback(r);hlRefresh();return;}
    HL.multiplier=Math.min(G.CONFIG.maxPayoutMultiplier,Math.round(Math.min(G.CONFIG.maxPayoutMultiplier,HL.multiplier*factor)*1e9)/1e9);HL.streak++;HL.busy=false;
    $('#hl-result').className='round-message good';$('#hl-result').textContent=`A good call. ${HL.streak} ${HL.streak===1?'success':'successes'} in a row. Collect or keep going.`;S.chip();hlRefresh();
    if(HL.streak>=20||HL.multiplier>=G.CONFIG.maxPayoutMultiplier)hlCollect(true);
  }
  $('#hl-higher').addEventListener('click',()=>hlPredict('higher'));$('#hl-lower').addEventListener('click',()=>hlPredict('lower'));
  G.games.hilo={state:HL,enter:hlRefresh};
  /* ═══════════ DICE ═══════════ */
  const DI={target:7,mode:'under',busy:false,round:null,last:null};
  function diDraw(a,b){$('#di-dice').innerHTML=`<svg viewBox="0 0 270 180" aria-hidden="true">${G.Art.diceFace(a,28,49,81,-13)}${G.Art.diceFace(b,157,28,86,14)}</svg>`;$('#di-dice').setAttribute('aria-label',`Dice ${a} and ${b}, total ${a+b}`);}
  function diRefresh(){
    const p=R.diceChance(DI.target,DI.mode),base=R.diceMultiplier(DI.target,DI.mode),settings=G.Dev.snapshot('dice'),bias=O.probability(settings),effectiveP=p?p+(1-p)*bias:0;
    $('#di-condition').textContent=`ROLL ${DI.mode.toUpperCase()} ${DI.target}`;$('#di-target-value').textContent=DI.target;
    $('#di-chance').textContent=(effectiveP*100).toFixed(2)+'%';$('.dice-metrics>div>span').textContent=bias?'WIN CHANCE · DEMO':'WIN CHANCE';
    const q=W.preview('dice',G.getBet('di'),base);$('#di-mult').textContent=(q.multiplier>=1000?G.short(q.multiplier):q.multiplier.toFixed(4))+'×';$('#di-potential').textContent=fmt(q.amount)+' chips';
    $('#di-target').disabled=DI.busy;$$('#di-modes button').forEach(b=>{b.disabled=DI.busy;b.classList.toggle('selected',b.dataset.mode===DI.mode);b.setAttribute('aria-pressed',String(b.dataset.mode===DI.mode));});
    $('#di-start').disabled=DI.busy||!p;G.lockBet('di',DI.busy);
  }
  $('#di-target').addEventListener('input',()=>{if(DI.busy)return;DI.target=Number($('#di-target').value);diRefresh();});
  $('#di-modes').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(!b||DI.busy)return;DI.mode=b.dataset.mode;diRefresh();S.click();});
  G.setupBet('di',diRefresh,()=>DI.busy);
  $('#di-start').addEventListener('click',async()=>{
    if(DI.busy||!R.diceChance(DI.target,DI.mode))return;DI.busy=true;diRefresh();const round=W.begin('dice',G.getBet('di'));if(!round){DI.busy=false;diRefresh();return;}DI.round=round;
    const target=DI.target,mode=DI.mode,mult=R.diceMultiplier(target,mode);
    const [a,b]=O.choose(round,()=>[G.RNG.int(6)+1,G.RNG.int(6)+1],()=>{const wins=[];for(let x=1;x<=6;x++)for(let y=1;y<=6;y++)if(R.diceWins(x,y,target,mode))wins.push([x,y]);return G.RNG.pick(wins);});
    $('#di-dice').classList.add('rolling');$('#di-total').textContent='…';$('#di-result').className='round-message';$('#di-result').textContent='Let the dice do the talking.';S.chip();
    const animation=G.motion()?null:setInterval(()=>diDraw(1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)),95);
    await sleep(900);if(animation)clearInterval(animation);$('#di-dice').classList.remove('rolling');diDraw(a,b);$('#di-total').textContent=a+b;
    const won=R.diceWins(a,b,target,mode),r=W.settle(round,won?mult:0,{reason:`${a}+${b} ${mode} ${target}`});
    const label=won?`${a+b}. ${title(mode)} ${target}. A winning roll.`:a+b===target?`${a+b}. Equality loses this roll.`:`${a+b}. Outside your winning range.`;
    G.setResult('di',label,r);G.feedback(r,mult>=10&&won);DI.last={a,b,sum:a+b,won,multiplier:mult,result:r};DI.busy=false;diRefresh();
  });
  G.games.dice={state:DI,enter:diRefresh};
  G.on('developer',()=>{baRefresh();diRefresh();hlRefresh();});
  G.hooks.tableInit=()=>{baRefresh();hlCards();hlRefresh();diDraw(5,3);diRefresh();};
})(window.GAR);
