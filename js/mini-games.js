/* Mini-games: quick-play replay games (Coin Flip · Odds or Evens · Red or Black).
   All play-money, instant resolution, All-In supported via the shared stake UI. */
(function (G) {
  'use strict';
  const {$, $$, sleep, fmt, S, toast} = G, W = G.Wallet, R = G.Rules;
  const MG = {};

  function sideGlyph(side){return side==='h'?'<span data-icon="crown"></span> Heads':'<span data-icon="chip"></span> Tails';}
  function pickBtn(prefix,cls){return $('#'+prefix+' .'+cls+'.selected');}

  /* ─── Coin Flip ─── */
  function cfRender(side){
    const coin=$('#cf-coin');if(!coin)return;
    coin.style.transition='none';coin.style.transform='rotateX(0) rotateY(0)';
    coin.innerHTML=sideGlyph(side);
    coin.style.color=side==='h'?'#e3c884':'#9fcbaf';
    void coin.offsetHeight;
    coin.style.transition='transform .5s ease';
  }
  function cfSpin(side,onDone){
    const coin=$('#cf-coin');if(!coin){onDone();return;}
    let steps=0;const total=14;
    const iv=setInterval(()=>{
      steps++;
      coin.style.transform=`rotateX(${ (steps%2?60:-60) }deg) rotateY(${ steps*55 }deg)`;
      coin.innerHTML=sideGlyph(steps%2? (Math.random()<.5?'h':'t') : side);
      if(steps>=total){clearInterval(iv);coin.style.transform=`rotateX(0) rotateY(${side==='h'?0:180}deg)`;coin.innerHTML=sideGlyph(side);onDone();}
    },45);
  }
  $('#cf-start')?.addEventListener('click',async()=>{
    const stake=G.getBet('cf');
    if(!W.validStake(stake)){toast('Enter a valid stake.','bad');return;}
    const round=W.begin('coinflip',stake);if(!round)return;
    G.lockBet('cf',true);$('#cf-start').disabled=true;
    const pick=$('#cf-call .cf-pill.selected')?.dataset.call||'h';
    cfRender(pick);
    await sleep(400);
    const side=Math.random()<.5?'h':'t';
    cfSpin(side,()=>{
      const win=side===pick;const r=W.settle(round,win?2:0);
      setResult('cf',win?'CORRECT CALL — WIN':'Wrong call — loss',r);
      S.chip(r.net>0);
      G.lockBet('cf',false);$('#cf-start').disabled=false;
    });
  });
  G.setupBet('cf',()=>{},()=>false);

  /* ─── Odds or Evens ─── */
  function osDraw(a,b){
    const box=$('#os-dice');if(!box)return;
    box.innerHTML=`<svg viewBox="0 0 220 120" aria-hidden="true">${G.Art.diceFace(a,8,14,52,0)}${G.Art.diceFace(b,122,14,60,10)}</svg>`;
    box.setAttribute('aria-label',`Two dice: ${a} and ${b}, total ${a+b}`);
  }
  function osRoll(a,b,onDone){
    const box=$('#os-dice');if(!box){onDone();return;}
    let steps=0;const total=12;
    const iv=setInterval(()=>{
      steps++;
      osDraw(1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6));
      if(steps>=total){clearInterval(iv);osDraw(a,b);onDone();}
    },50);
  }
  $('#os-start')?.addEventListener('click',async()=>{
    const stake=G.getBet('os');
    if(!W.validStake(stake)){toast('Enter a valid stake.','bad');return;}
    const round=W.begin('oddseven',stake);if(!round)return;
    G.lockBet('os',true);$('#os-start').disabled=true;
    const pick=$('#os-stage .os-pill.selected')?.dataset.pick||'even';
    await sleep(300);
    const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);
    const total=a+b,even=total%2===0,win=(pick==='even')===even;
    osRoll(a,b,()=>{
      const r=W.settle(round,win?2:0);
      setResult('os',win?`Rolled ${a}+${b}=${total} — ${pick.toUpperCase()} WIN:`:`Rolled ${a}+${b}=${total} — not ${pick}`,r);
      S.chip(r.net>0);
      G.lockBet('os',false);$('#os-start').disabled=false;
    });
  });
  G.setupBet('os',()=>{},()=>false);

  /* ─── Red or Black ─── */
  function rbDraw(rank,suit){
    const box=$('#rb-card');if(!box)return;
    box.innerHTML='<svg viewBox="0 0 94 136" width="62" height="86" aria-hidden="true">'+G.Art.card(rank,suit)+'</svg>';
    box.setAttribute('aria-label',`Card ${rank} of ${suit}`);
  }
  function rbFlip(rank,suit,onDone){
    const box=$('#rb-card');if(!box){onDone();return;}
    box.style.transition='transform .22s ease';
    box.style.transform='scaleX(0)';
    setTimeout(()=>{
      rbDraw(rank,suit);
      box.style.transform='scaleX(1)';
      setTimeout(onDone,220);
    },220);
  }
  $('#rb-start')?.addEventListener('click',async()=>{
    const stake=G.getBet('rb');
    if(!W.validStake(stake)){toast('Enter a valid stake.','bad');return;}
    const round=W.begin('redblack',stake);if(!round)return;
    G.lockBet('rb',true);$('#rb-start').disabled=true;
    const pick=$('#rb-stage .rb-pill.selected')?.dataset.pick||'red';
    rbDraw('?','♠');
    box=$('#rb-card');if(box){box.style.opacity='.55';}
    await sleep(400);
    const rank=R.RANKS[R.RNG.int(R.RANKS.length)],suit=R.SUITS[R.RNG.int(R.SUITS.length)];
    const red=['♥','♦'].includes(suit),win=(pick==='red')===red;
    rbFlip(rank,suit,()=>{
      const r=W.settle(round,win?2:0);
      setResult('rb',win?`${rank}${suit} is ${red?'RED':'BLACK'} — WIN!`:`${rank}${suit} is ${red?'RED':'BLACK'} — loss`,r);
      $('#rb-card').style.opacity='';
      S.chip(r.net>0);
      G.lockBet('rb',false);$('#rb-start').disabled=false;
    });
  });
  G.setupBet('rb',()=>{},()=>false);

  Object.assign(G,{MG});
})(window.GAR);