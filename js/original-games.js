/* Upgraded original game controllers. Existing state machines, wheel layout,
   weighted slots, hold/draw flow and preselected-path Plinko are intentionally retained,
   upgraded with full All-In wagering, custom stakes, Rebet, and multi-ball burst. */
(function (G) {
  'use strict';
  const {$,$$,sleep,fmt,compact,S,toast,cardEl,revealCard,rackInit}=G,W=G.Wallet,O=G.Outcomes,R=G.Rules;
  const {makeDeck,cardVal,handVal,WHEEL,RL_RED,numCls,rlPayout,pickSym,evalPoker}=R;

  function roundCents(n){return Math.round(n*100)/100;}

  /* ═══════════ BLACKJACK ═══════════ */
  const bj={deck:[],player:[],dealer:[],bet:0,lastBet:0,phase:'bet',busy:false,holeHidden:false,round:null};
  let bjHoleEl=null;
  function bjMsg(t,cls=''){const m=$('#bj-msg');m.textContent=t;m.className='bj-msg '+cls;}
  function bjRenderBet(){
    $('#bj-bet').textContent=compact(bj.bet);
    $('#bj-bet').title=fmt(bj.bet)+' chips';
    const inp=$('#bj-stake-input');
    if(inp&&document.activeElement!==inp)inp.value=bj.bet>0?bj.bet:'';
    const isAllIn=bj.bet>0&&W.cents>=G.CONFIG.minStake*100&&Math.round(bj.bet*100)===W.cents;
    $('#bj-allin')?.classList.toggle('selected',isAllIn);
  }
  function setButtons(){
    const inPlay=bj.phase==='player',canBet=bj.phase==='bet'&&!bj.busy;
    $('#bj-hit').disabled=!inPlay||bj.busy;
    $('#bj-stand').disabled=!inPlay||bj.busy;
    $('#bj-double').disabled=!(inPlay&&!bj.busy&&bj.player.length===2&&W.balance>=bj.bet&&bj.bet*2<=G.CONFIG.maxStake);
    $('#bj-deal').disabled=bj.busy||!(bj.phase==='done'||(bj.phase==='bet'&&bj.bet>=G.CONFIG.minStake));
    $('#bj-deal').textContent=bj.phase==='done'?'New hand':'Deal hand';
    $('#bj-clear').disabled=!canBet||!bj.bet;
    $$('#bj-chips .chip').forEach(ch=>ch.disabled=!canBet);
    $$('#bj-tools input,#bj-tools button').forEach(el=>el.disabled=!canBet);
    if($('#bj-rebet')&&canBet)$('#bj-rebet').disabled=!(bj.lastBet>=G.CONFIG.minStake&&W.balance>=G.CONFIG.minStake);
    bjRenderBet();
  }
  function bjVals(){
    const pEl=$('#bj-player-val'),dEl=$('#bj-dealer-val');
    pEl.textContent=bj.player.length?handVal(bj.player)+(handVal(bj.player)>21?' · BUST':''):'–';
    if(!bj.dealer.length)dEl.textContent='–';
    else if(bj.holeHidden)dEl.textContent=handVal([bj.dealer[0]])+' + ?';
    else dEl.textContent=handVal(bj.dealer);
  }
  async function dealTo(hand,sel,down=false){
    if(!bj.deck.length)bj.deck=makeDeck(6);
    const c=bj.deck.pop();hand.push(c);
    const el=cardEl(c,down);if(down)bjHoleEl=el;
    $(sel).appendChild(el);S.card();await sleep(260);return el;
  }
  async function bjReveal(){
    if(!bj.holeHidden)return;bj.holeHidden=false;
    if(bjHoleEl)revealCard(bjHoleEl,bj.dealer[1]);
    S.card();await sleep(360);bjVals();
  }
  function bjSetBet(val,sound='chip'){
    if(bj.phase!=='bet'||bj.busy)return;
    const max=W.maxAffordableStake();
    if(max<=0){
      toast('Need at least 10 chips to bet — claim free house chips!','bad');
      if(W.balance<10&&!W.hasActive()&&!G.Modal.active)G.Modal.open('brokeModal');
      return;
    }
    bj.bet=roundCents(Math.min(max,Math.max(0,val)));
    if(sound==='allin')S.allIn();else S.chip();
    bjRenderBet();setButtons();
  }
  $$('#bj-chips .chip').forEach(ch=>ch.addEventListener('click',()=>{
    if(bj.phase!=='bet'||bj.busy)return;
    const v=+ch.dataset.v;
    if(bj.bet+v>W.balance||bj.bet+v>G.CONFIG.maxStake){toast('Not enough chips or maximum stake reached.','bad');return;}
    bj.bet=roundCents(bj.bet+v);S.chip();bjRenderBet();setButtons();
  }));
  $('#bj-stake-input')?.addEventListener('input',()=>{
    if(bj.phase!=='bet'||bj.busy)return;
    const raw=$('#bj-stake-input').value.trim();
    const n=raw===''?0:Number(raw);
    if(Number.isFinite(n)&&n>=0)bj.bet=roundCents(Math.min(G.CONFIG.maxStake,n));
    $('#bj-bet').textContent=compact(bj.bet);
    setButtons();
  });
  $('#bj-half')?.addEventListener('click',()=>bjSetBet(bj.bet>=G.CONFIG.minStake*2?bj.bet/2:G.CONFIG.minStake));
  $('#bj-2x')?.addEventListener('click',()=>bjSetBet((bj.bet||25)*2));
  $('#bj-50pct')?.addEventListener('click',()=>bjSetBet(Math.max(G.CONFIG.minStake,Math.floor(W.balance*50)/100)));
  $('#bj-allin')?.addEventListener('click',()=>bjSetBet(W.maxAffordableStake(),'allin'));
  $('#bj-rebet')?.addEventListener('click',()=>{if(bj.lastBet>0)bjSetBet(bj.lastBet);});
  $('#bj-clear').addEventListener('click',()=>{if(bj.phase!=='bet'||bj.busy)return;bj.bet=0;bjRenderBet();setButtons();});
  $('#bj-deal').addEventListener('click',()=>{if(bj.busy)return;if(bj.phase==='done'){bjResetTable();return;}bjDeal();});
  function bjResetTable(){
    if(bj.round?.status==='active')return;
    bj.phase='bet';bj.bet=0;bj.holeHidden=false;bjHoleEl=null;bj.player=[];bj.dealer=[];bj.round=null;
    $('#bj-player').replaceChildren(cardEl({r:'A',s:'♠'},true),cardEl({r:'K',s:'♥'},true));
    $('#bj-dealer').replaceChildren(cardEl({r:'A',s:'♠'},true),cardEl({r:'K',s:'♥'},true));
    bjVals();bjRenderBet();bjMsg('Add chips or press ALL IN to take your seat.');setButtons();
  }
  async function bjDeal(){
    if(bj.phase!=='bet'||bj.busy||bj.bet<=0)return;
    bj.busy=true;setButtons();
    const round=W.begin('blackjack',bj.bet);if(!round){bj.busy=false;setButtons();return;}
    bj.round=round;bj.lastBet=bj.bet;
    bj.phase='dealing';bj.holeHidden=true;bjHoleEl=null;
    $('#bj-player').innerHTML='';$('#bj-dealer').innerHTML='';bjMsg('Dealing your hand…');setButtons();
    if(bj.deck.length<52)bj.deck=makeDeck(6);
    if(O.shouldFavor(round))R.stackNext(bj.deck,['A',c=>cardVal(c.r)>=2&&cardVal(c.r)<=7,c=>cardVal(c.r)===10,c=>cardVal(c.r)>=2&&cardVal(c.r)<=7]);
    bj.player=[];bj.dealer=[];
    await dealTo(bj.player,'#bj-player');await dealTo(bj.dealer,'#bj-dealer');
    await dealTo(bj.player,'#bj-player');await dealTo(bj.dealer,'#bj-dealer',true);bjVals();
    const pBJ=handVal(bj.player)===21,dealerNat=handVal(bj.dealer)===21;
    if(pBJ||dealerNat){
      await sleep(250);await bjReveal();
      if(pBJ&&dealerNat)bjEnd('push','Two naturals. A perfect push.');
      else if(pBJ)bjEnd('bj','Blackjack. Beautifully played.');
      else bjEnd('lose','Dealer has blackjack.');return;
    }
    bj.phase='player';bj.busy=false;bjMsg('Your move. Hit or stand?');setButtons();
  }
  $('#bj-hit').addEventListener('click',async()=>{
    if(bj.phase!=='player'||bj.busy)return;
    bj.busy=true;setButtons();await dealTo(bj.player,'#bj-player');bjVals();
    if(handVal(bj.player)>21){await bjReveal();bjEnd('lose','Bust. The house takes this one.');}
    else if(handVal(bj.player)===21)await bjDealerPlay();
    else{bj.busy=false;bjMsg('Your move. Hit or stand?');setButtons();}
  });
  $('#bj-stand').addEventListener('click',async()=>{if(bj.phase!=='player'||bj.busy)return;bj.busy=true;setButtons();await bjDealerPlay();});
  $('#bj-double').addEventListener('click',async()=>{
    if(!(bj.phase==='player'&&!bj.busy&&bj.player.length===2&&W.balance>=bj.bet))return;
    bj.busy=true;setButtons();
    if(!W.extend(bj.round,bj.bet)){bj.busy=false;setButtons();return;}
    bj.bet=bj.round.stakeCents/100;bjRenderBet();
    await dealTo(bj.player,'#bj-player');bjVals();
    if(handVal(bj.player)>21){await bjReveal();bjEnd('lose','Double down. A little too far.');}
    else await bjDealerPlay();
  });
  async function bjDealerPlay(){
    bj.phase='dealer';setButtons();await bjReveal();bjMsg('The dealer plays…');
    while(handVal(bj.dealer)<17){await sleep(340);await dealTo(bj.dealer,'#bj-dealer');bjVals();}
    await sleep(290);const p=handVal(bj.player),d=handVal(bj.dealer);
    if(d>21)bjEnd('win','Dealer busts. The hand is yours.');
    else if(p>d)bjEnd('win',`${p} beats ${d}. Well played.`);
    else if(p<d)bjEnd('lose',`${d} beats ${p}. The house wins.`);
    else bjEnd('push','Even hands. Stake returned.');
  }
  function bjEnd(type,text){
    if(bj.round?.status!=='active')return;
    bj.phase='done';bj.busy=false;
    const mult=type==='win'?2:type==='bj'?2.5:type==='push'?1:0;
    const r=W.settle(bj.round,mult,{refund:type==='push',reason:type});if(!r)return;
    const m=$('#bj-msg');m.className='bj-msg '+(r.net<0?'bad':r.net===0?'push':'good');m.innerHTML=G.resultMarkup(text,r);
    G.feedback(r,type==='bj');bjRenderBet();setButtons();
  }
  G.games.blackjack={state:bj,buttons:setButtons,reset:bjResetTable,enter:setButtons};

  /* ═══════════ ROULETTE ═══════════ */
  const SEG=360/37;
  let rlBets={},rlLastBets=null,rlUndo=[],rlSpinning=false,rlRot=0,rlOrbit=0,activeChip=25,rlAllInMode=false;
  function buildWheel(){$('#rl-wheel').innerHTML=G.Art.rouletteSvg();}
  function rlCell(cls,label,key){
    const d=document.createElement('button');d.type='button';d.className='rcell '+cls;d.dataset.key=key;
    d.setAttribute('aria-label',`Bet on ${label}`);d.innerHTML=`<span>${label}</span><span class="bet-chip" aria-hidden="true"></span>`;
    d.addEventListener('click',()=>rlPlace(key));return d;
  }
  function buildBoard(){
    const b=$('#rl-board');b.innerHTML='';
    const zero=rlCell('zero','0','n0');zero.style.gridArea='1 / 1 / 4 / 2';b.appendChild(zero);
    for(let n=1;n<=36;n++){const c=rlCell(numCls(n),n,'n'+n);c.style.gridRow=String(3-((n-1)%3));c.style.gridColumn=String(Math.ceil(n/3)+1);b.appendChild(c);}
    const dozens=[['1st 12','d1','4 / 2 / 5 / 6'],['2nd 12','d2','4 / 6 / 5 / 10'],['3rd 12','d3','4 / 10 / 5 / 14']];
    dozens.forEach(([l,k,a])=>{const c=rlCell('out',l,k);c.style.gridArea=a;b.appendChild(c);});
    const outs=[['1–18','low','5 / 2 / 6 / 4'],['EVEN','even','5 / 4 / 6 / 6'],['RED','red','5 / 6 / 6 / 8'],['BLACK','black','5 / 8 / 6 / 10'],['ODD','odd','5 / 10 / 6 / 12'],['19–36','high','5 / 12 / 6 / 14']];
    outs.forEach(([l,k,a])=>{const c=rlCell('out',l,k);c.style.gridArea=a;b.appendChild(c);});
  }
  function rlMark(key){const cell=$(`.rcell[data-key="${key}"]`);if(!cell)return;const amt=rlBets[key]||0;$('.bet-chip',cell).textContent=compact(amt);cell.classList.toggle('on',!!amt);cell.title=amt?fmt(amt)+' planned chips':'';}
  const rlTotal=()=>roundCents(Object.values(rlBets).reduce((a,b)=>a+b,0));
  function rlTotals(){
    const tot=rlTotal();
    $('#rl-total').textContent=compact(tot);
    $('#rl-total').title=fmt(tot)+' chips';
    $('#rl-spin').disabled=rlSpinning||tot<G.CONFIG.minStake;
    $('#rl-undo').disabled=rlSpinning||!rlUndo.length;
    $('#rl-clear').disabled=rlSpinning||!tot;
    if($('#rl-double'))$('#rl-double').disabled=rlSpinning||!tot||tot>=W.balance;
    if($('#rl-rebet'))$('#rl-rebet').disabled=rlSpinning||!rlLastBets||W.balance<G.CONFIG.minStake;
  }
  function rlPlace(key){
    if(rlSpinning)return;
    const currentTotal=rlTotal();
    if(rlAllInMode){
      const remaining=roundCents(Math.min(G.CONFIG.maxStake,W.balance)-currentTotal);
      if(remaining<=0||(currentTotal===0&&remaining<G.CONFIG.minStake)){
        toast(W.balance<G.CONFIG.minStake?'Need at least 10 chips to bet — claim free house chips!':'All available chips are already placed on the board.','bad');
        return;
      }
      rlBets[key]=roundCents((rlBets[key]||0)+remaining);
      rlUndo.push([key,remaining]);
      S.allIn();rlMark(key);rlTotals();
      return;
    }
    if(currentTotal+activeChip>W.balance||currentTotal+activeChip>G.CONFIG.maxStake){toast('Not enough chips or maximum planned stake reached.','bad');return;}
    rlBets[key]=roundCents((rlBets[key]||0)+activeChip);rlUndo.push([key,activeChip]);S.chip();rlMark(key);rlTotals();
  }
  rackInit('#rl-chips',v=>{rlAllInMode=false;activeChip=v;},()=>!rlSpinning);
  $('#rl-allin-chip')?.addEventListener('click',()=>{
    if(rlSpinning||$('#rl-allin-chip').disabled)return;
    rlAllInMode=true;
    $$('#rl-chips .chip').forEach(x=>{const on=x.id==='rl-allin-chip';x.classList.toggle('sel',on);x.setAttribute('aria-pressed',String(on));});
    S.allIn();toast('ALL-IN chip active: tap any number or outside bet to place all remaining tokens!','info');
  });
  $('#rl-double')?.addEventListener('click',()=>{
    if(rlSpinning)return;
    const entries=Object.entries(rlBets),tot=rlTotal();
    if(!entries.length||tot>=W.balance)return;
    const avail=roundCents(Math.min(G.CONFIG.maxStake,W.balance)-tot);
    const ratio=Math.min(1,avail/tot);
    let addedAny=false;
    for(const [k,amt] of entries){
      const add=roundCents(amt*ratio);
      if(add>0){rlBets[k]=roundCents(rlBets[k]+add);rlUndo.push([k,add]);rlMark(k);addedAny=true;}
    }
    if(addedAny){ratio<1?S.allIn():S.chip();rlTotals();}
  });
  $('#rl-rebet')?.addEventListener('click',()=>{
    if(rlSpinning||!rlLastBets)return;
    const savedTotal=roundCents(Object.values(rlLastBets).reduce((a,b)=>a+b,0));
    if(savedTotal<=0)return;
    const cap=W.maxAffordableStake();
    if(cap<=0){toast('Need at least 10 chips to rebet.','bad');return;}
    rlClear();
    const scale=savedTotal>cap?cap/savedTotal:1;
    for(const [k,amt] of Object.entries(rlLastBets)){
      const v=roundCents(amt*scale);
      if(v>0){rlBets[k]=v;rlUndo.push([k,v]);rlMark(k);}
    }
    S.chip();rlTotals();
  });
  $('#rl-undo').addEventListener('click',()=>{if(rlSpinning||!rlUndo.length)return;const[key,amt]=rlUndo.pop();rlBets[key]=roundCents(rlBets[key]-amt);if(rlBets[key]<=0)delete rlBets[key];S.chip();rlMark(key);rlTotals();});
  function rlClear(){if(rlSpinning)return;rlBets={};rlUndo=[];$$('.rcell.on').forEach(c=>c.classList.remove('on'));rlTotals();}
  $('#rl-clear').addEventListener('click',rlClear);
  $('#rl-spin').addEventListener('click',async()=>{
    if(rlSpinning)return;const total=rlTotal();if(total<=0){toast('Place your chips first.');return;}
    rlSpinning=true;rlTotals();const round=W.begin('roulette',total);if(!round){rlSpinning=false;rlTotals();return;}
    const bets={...rlBets};rlLastBets={...rlBets};
    $('#rl-board').classList.add('locked');$$('#rl-board button,#rl-chips button').forEach(b=>b.disabled=true);$('#rl-result').innerHTML='';$$('.rcell.won').forEach(c=>c.classList.remove('won'));S.spin();
    const returns=n=>Object.entries(bets).reduce((sum,[key,amt])=>sum+amt*rlPayout(key,n),0);
    const n=O.choose(round,()=>G.RNG.int(37),()=>{const best=Math.max(...WHEEL.map(returns));return G.RNG.pick(WHEEL.filter(n=>returns(n)===best));});
    const idx=WHEEL.indexOf(n),targetMod=((-idx*SEG)%360+360)%360;
    const from=rlRot,orbitFrom=rlOrbit;
    rlRot+=1800+((targetMod-rlRot%360+360)%360);rlOrbit-=1440;
    $$('#rl-wheel .is-selected').forEach(p=>p.classList.remove('is-selected'));
    await G.spinWheel({wheel:$('#rl-wheel'),from,to:rlRot,step:SEG,pointer:$('.rl-stage .rl-pointer'),companions:[{el:$('#rl-orbit'),from:orbitFrom,to:rlOrbit}]});
    $(`#rl-wheel [data-pocket="${n}"]`).classList.add('is-selected');
    const r=W.settle(round,returns(n)/total,{reason:`Pocket ${n}`});
    const cell=$(`.rcell[data-key="n${n}"]`);cell.classList.add('won');setTimeout(()=>cell.classList.remove('won'),2400);
    const h=$('#rl-history'),b=document.createElement('span');b.className=numCls(n);b.textContent=n;h.prepend(b);while(h.children.length>14)h.lastChild.remove();
    $('#rl-result').innerHTML=`<span class="rbadge ${numCls(n)}">${n}</span><div>${G.resultMarkup(r.returned>0?'A golden turn.':'The next turn awaits.',r)}</div>`;
    G.feedback(r,r.net>=total*9);rlSpinning=false;rlClear();$('#rl-board').classList.remove('locked');$$('#rl-board button,#rl-chips button').forEach(b=>b.disabled=false);rlTotals();
    G.games.roulette.last={n,idx,rotation:rlRot,orbit:rlOrbit,bets,result:r};
  });
  G.games.roulette={enter:rlTotals,clear:rlClear,get bets(){return {...rlBets};},get spinning(){return rlSpinning;}};
  G.on('wallet',()=>{if(!rlSpinning)rlTotals();});

  /* Shared classic stake binder for Slots, Video Poker & Plinko */
  function bindClassicStake({prefix,rackSel,betElSel,getVal,setVal,isLocked}){
    const input=$('#'+prefix+'-stake-input'),tools=$('#'+prefix+'-tools'),betEl=$(betElSel);
    function syncUI(){
      const v=getVal();
      betEl.textContent=compact(v);
      betEl.title=fmt(v)+' chips';
      if(input&&document.activeElement!==input)input.value=v;
      const isAllIn=Number.isFinite(v)&&W.cents>=G.CONFIG.minStake*100&&Math.round(v*100)===W.cents;
      $$(rackSel+' .chip[data-v]').forEach(ch=>{const on=!isAllIn&&+ch.dataset.v===v;ch.classList.toggle('sel',on);ch.setAttribute('aria-pressed',String(on));});
      $$('[data-classic-adj="allin"]',tools).forEach(b=>b.classList.toggle('selected',isAllIn));
    }
    rackInit(rackSel,v=>{setVal(v);syncUI();},()=>!isLocked());
    input?.addEventListener('input',()=>{
      if(isLocked())return;
      const n=Number(input.value);
      if(Number.isFinite(n)&&n>0)setVal(roundCents(Math.min(G.CONFIG.maxStake,n)));
      syncUI();
    });
    input?.addEventListener('change',()=>{
      if(isLocked())return;
      const n=Number(input.value);
      setVal(roundCents(Math.min(G.CONFIG.maxStake,Math.max(G.CONFIG.minStake,Number.isFinite(n)?n:25))));
      syncUI();
    });
    tools?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-classic-adj]');if(!btn||btn.disabled||isLocked())return;
      const mode=btn.dataset.classicAdj,maxBet=W.maxAffordableStake();
      if(mode==='allin'){
        if(maxBet<=0){
          toast('Need at least 10 chips to go All-In — claim free house chips!','bad');
          if(W.balance<10&&!W.hasActive()&&!G.Modal.active)G.Modal.open('brokeModal');
          return;
        }
        setVal(maxBet);syncUI();S.allIn();return;
      }
      let next=getVal()||25;
      if(mode==='half')next=Math.max(G.CONFIG.minStake,next/2);
      else if(mode==='double')next=Math.min(maxBet>0?maxBet:G.CONFIG.maxStake,next*2);
      else if(mode==='halfbal'){
        if(maxBet<=0){toast('Need at least 10 chips to wager.','bad');return;}
        next=Math.max(G.CONFIG.minStake,Math.floor(W.balance*50)/100);
      }
      setVal(roundCents(Math.min(G.CONFIG.maxStake,Math.max(G.CONFIG.minStake,next))));
      syncUI();S.chip();
    });
    G.on('wallet',syncUI);
    return {syncUI,lock(locked){$$('input,button',tools).forEach(el=>el.disabled=locked);}};
  }

  /* ═══════════ SLOTS ═══════════ */
  let slBet=25,slBusy=false;
  const symHTML=s=>`<div class="sym" data-symbol="${s.t}">${G.Art.slotSymbol(s.t)}</div>`;
  function reelHeight(reel){return parseFloat(getComputedStyle(reel.closest('.slot-machine')).getPropertyValue('--sym-h'))||88;}
  function slotInit(){
    $$('#sl-reels .reel').forEach((r,i)=>{const st=$('.strip',r);st.style.transition='none';const syms=Array.from({length:22},()=>pickSym());syms[4]=R.SYMS[i===0?0:i===1?1:2];st.innerHTML=syms.map(symHTML).join('');r.dataset.centerIndex='4';st.style.transform=`translateY(${-3*reelHeight(r)}px)`;});
  }
  function spinReel(reel,target,dur){
    const st=$('.strip',reel),syms=Array.from({length:22},()=>pickSym());syms[15]=target;reel.dataset.centerIndex='15';reel.dataset.finalSymbol=target.t;
    reel.classList.add('blur');st.style.transition='none';st.innerHTML=syms.map(symHTML).join('');st.style.transform=`translateY(${-3*reelHeight(reel)}px)`;st.getBoundingClientRect();
    st.style.transition=`transform ${G.duration(dur)}ms cubic-bezier(.15,.72,.22,1)`;st.style.transform=`translateY(${-14*reelHeight(reel)}px)`;
    setTimeout(()=>{reel.classList.remove('blur');S.tone(520,.045,'triangle',.03);},Math.max(0,G.duration(dur)-100));
  }
  function snapReels(){
    $$('#sl-reels .reel').forEach(r=>{const st=$('.strip',r);st.style.transition='none';st.style.transform=`translateY(${-(Number(r.dataset.centerIndex)-1)*reelHeight(r)}px)`;});
  }
  window.addEventListener('resize',snapReels);
  const slStakeCtrl=bindClassicStake({prefix:'sl',rackSel:'#sl-chips',betElSel:'#sl-bet',getVal:()=>slBet,setVal:v=>{slBet=v;},isLocked:()=>slBusy});
  $('#sl-spin').addEventListener('click',async()=>{
    if(slBusy)return;slBusy=true;$('#sl-spin').disabled=true;
    const round=W.begin('slots',slBet);if(!round){slBusy=false;$('#sl-spin').disabled=false;return;}
    $$('#sl-chips .chip').forEach(ch=>ch.disabled=true);slStakeCtrl.lock(true);
    $('.slot-machine').classList.add('spinning');$('.slot-machine').classList.remove('jackpot');
    const res=$('#sl-result');res.textContent='A golden moment in the making…';res.classList.remove('pop');$$('#view-slots .payrow').forEach(r=>r.classList.remove('hit'));
    const out=O.choose(round,()=>[pickSym(),pickSym(),pickSym()],()=>[R.SYMS[0],R.SYMS[0],R.SYMS[0]]);
    $$('#sl-reels .reel').forEach((r,i)=>spinReel(r,out[i],1000+i*360));await sleep(1860);snapReels();
    const ev=R.evalSlots(out),r=W.settle(round,ev.pay,{reason:ev.name});
    $$(`#view-slots .payrow`).forEach(row=>row.classList.toggle('hit',row.dataset.k===ev.key));
    res.innerHTML=ev.key==='7'?`<span class="jackpot-label">${G.Art.icon('crown')} THE GOLDEN JACKPOT</span><span class="jackpot-amount">${fmt(r.returned)} <small>chips returned</small></span><span class="result-detail">Net ${r.net>=0?'+':'−'}${fmt(Math.abs(r.net))} chips${r.capped?' · capped at wallet limit':''}</span>`:G.resultMarkup(ev.pay?ev.name+'. A lovely line.':'No matching line. One more golden chance?',r);$('.slot-machine').classList.toggle('jackpot',ev.key==='7');res.classList.add('pop');G.feedback(r,ev.pay>=30);
    slBusy=false;$('.slot-machine').classList.remove('spinning');$('#sl-spin').disabled=false;$$('#sl-chips .chip').forEach(ch=>ch.disabled=false);slStakeCtrl.lock(false);slStakeCtrl.syncUI();
    G.games.slots.last={out:out.map(s=>s.t),evaluation:ev,result:r};
  });
  G.games.slots={get busy(){return slBusy;},get bet(){return slBet;},enter:()=>{snapReels();slStakeCtrl.syncUI();}};

  /* ═══════════ VIDEO POKER ═══════════ */
  const vp={bet:25,phase:'bet',hand:[],held:[],deck:[],round:null,busy:false};
  const vpStakeCtrl=bindClassicStake({prefix:'vp',rackSel:'#vp-chips',betElSel:'#vp-bet',getVal:()=>vp.bet,setVal:v=>{vp.bet=v;},isLocked:()=>vp.busy||vp.phase==='draw'});
  function vpMsg(t,cls=''){const m=$('#vp-msg');m.textContent=t;m.className='vp-msg '+cls;}
  function vpRender(){
    const box=$('#vp-hand');box.innerHTML='';
    vp.hand.forEach((c,i)=>{
      const w=document.createElement('button');w.type='button';w.className='pcard'+(vp.held[i]?' held':'');w.disabled=vp.phase!=='draw'||vp.busy;
      w.setAttribute('aria-pressed',String(!!vp.held[i]));w.setAttribute('aria-label',`${vp.held[i]?'Release':'Hold'} ${c.r} of ${G.Art.suitName(c.s)}s`);w.appendChild(cardEl(c));
      const h=document.createElement('div');h.className='hold';h.textContent=vp.held[i]?'HELD':'HOLD';w.appendChild(h);
      w.addEventListener('click',()=>{if(vp.phase!=='draw'||vp.busy)return;vp.held[i]=!vp.held[i];w.classList.toggle('held',vp.held[i]);w.setAttribute('aria-pressed',String(vp.held[i]));w.setAttribute('aria-label',`${vp.held[i]?'Release':'Hold'} ${c.r} of ${G.Art.suitName(c.s)}s`);h.textContent=vp.held[i]?'HELD':'HOLD';S.click();});
      box.appendChild(w);
    });
  }
  function vpButtons(){
    const locked=vp.busy||vp.phase==='draw';
    $('#vp-deal').disabled=vp.busy;$('#vp-deal').textContent=vp.busy?'Dealing…':vp.phase==='draw'?'Draw cards':vp.phase==='done'?'Deal again':'Deal hand';
    $$('#vp-chips .chip').forEach(ch=>ch.disabled=locked);
    vpStakeCtrl.lock(locked);vpStakeCtrl.syncUI();
  }
  $('#vp-deal').addEventListener('click',async()=>{
    if(vp.busy)return;vp.busy=true;
    if(vp.phase==='draw'){
      vp.phase='resolving';vpButtons();for(let i=0;i<5;i++)if(!vp.held[i])vp.hand[i]=vp.deck.pop();vpRender();S.card();await sleep(480);
      const ev=evalPoker(vp.hand);$$('#view-poker .payrow').forEach(row=>row.classList.toggle('hit',row.dataset.k===ev.key));
      const r=W.settle(vp.round,ev.pay,{reason:ev.name});const m=$('#vp-msg');m.className='vp-msg '+(r.net>0?'good':r.net<0?'bad':'');m.innerHTML=G.resultMarkup(ev.name,r);G.feedback(r,ev.pay>=50);
      vp.phase='done';vp.busy=false;vpButtons();G.games.poker.last={evaluation:ev,result:r};return;
    }
    vpButtons();const round=W.begin('poker',vp.bet);if(!round){vp.busy=false;vpButtons();return;}vp.round=round;
    vp.deck=makeDeck(1);
    if(O.shouldFavor(round)){const suit=G.RNG.pick(R.SUITS);vp.hand=['10','J','Q','K','A'].map(r=>vp.deck.splice(vp.deck.findIndex(c=>c.r===r&&c.s===suit),1)[0]);}
    else vp.hand=vp.deck.splice(0,5);
    vp.held=[false,false,false,false,false];$$('#view-poker .payrow').forEach(row=>row.classList.remove('hit'));vp.phase='dealing';vpRender();S.card();await sleep(400);
    vp.phase='draw';vp.busy=false;vpRender();vpMsg('Hold what you love. Draw what comes next.');vpButtons();
  });
  G.games.poker={state:vp,enter:vpButtons};

  /* ═══════════ PLINKO — retained precomputed path / animation architecture ═══════════ */
  const PL={ROWS:12,SP:40,TOP:70,GAP:42,CX:280,W:560,H:640,bet:25,balls:[],hits:[],floats:[],bflash:Array(13).fill(0),MULT:R.PL_MULT,running:false};
  const plCanvas=$('#pl-canvas'),pctx=plCanvas.getContext('2d'),rowY=i=>PL.TOP+i*PL.GAP;
  function plSetup(){const dpr=Math.min(2,window.devicePixelRatio||1);plCanvas.width=PL.W*dpr;plCanvas.height=PL.H*dpr;pctx.setTransform(dpr,0,0,dpr,0,0);}
  function mCol(m){return m>=50?'#b97371':m>=12?'#b49568':m>=5?'#c2ad79':m>=2?'#c3c194':m>=1?'#9ab28c':m>=.5?'#708f7d':'#536f5e';}
  function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
  const plStakeCtrl=bindClassicStake({prefix:'pl',rackSel:'#pl-chips',betElSel:'#pl-bet',getVal:()=>PL.bet,setVal:v=>{PL.bet=v;},isLocked:()=>false});
  function plDrop(){
    if(PL.balls.filter(b=>!b.done).length>=G.CONFIG.maxPlinkoBalls)return false;
    const round=W.begin('plinko',PL.bet);if(!round)return false;
    const dirs=O.choose(round,()=>Array.from({length:12},()=>G.RNG.unit()<.5?-1:1),()=>Array(12).fill(G.RNG.unit()<.5?-1:1));
    const m=[0];dirs.forEach(d=>m.push(m[m.length-1]+d));const pts=[[PL.CX,36]];
    for(let i=0;i<12;i++)pts.push([PL.CX+m[i]*PL.SP/2,rowY(i)]);pts.push([PL.CX+m[12]*PL.SP/2,566]);
    const b={pts,seg:0,t:0,bet:round.stakeCents/100,round,dur:140+Math.random()*25,done:false,finalM:m[12],reduced:G.motion()};
    PL.balls.push(b);S.chip();startPlinko();
    const activeCount=PL.balls.filter(x=>!x.done).length;
    $('#pl-drop').disabled=activeCount>=G.CONFIG.maxPlinkoBalls;
    if($('#pl-burst'))$('#pl-burst').disabled=activeCount>=G.CONFIG.maxPlinkoBalls;
    b.timer=setTimeout(()=>plLand(b),b.reduced?G.duration(200):b.dur*13+100);
    $('#pl-status').textContent=`${activeCount} ${activeCount===1?'ball':'balls'} in play`;
    return true;
  }
  function plPos(b){const k=Math.min(b.seg,12),P0=b.pts[k],P1=b.pts[k+1],t=Math.min(1,b.t);return{x:P0[0]*(1-t)*(1-t)+P1[0]*(2*t-t*t),y:P0[1]*(1-t*t)+P1[1]*t*t};}
  function plUpdate(dt){
    PL.balls.forEach(b=>{if(b.done||b.reduced)return;b.t+=dt/b.dur;
      while(b.t>=1&&!b.done){b.t-=1;b.seg++;if(b.seg===13){plLand(b);break;}const P=b.pts[b.seg];PL.hits.push({x:P[0],y:P[1],t:1});S.tone(650+Math.random()*250,.025,'triangle',.018);}});
    PL.balls=PL.balls.filter(b=>!b.done);
  }
  function plLand(b){
    if(b.done)return;b.done=true;clearTimeout(b.timer);
    const k=b.finalM/2+6,mult=PL.MULT[k],r=W.settle(b.round,mult,{reason:`Bucket ${k+1} · ${mult}×`});if(!r)return;
    PL.bflash[k]=G.motion()?0:1;if(!G.motion())PL.floats.push({x:PL.CX+(k-6)*PL.SP,y:560,txt:compact(r.returned),color:r.net>=0?'#e7d49e':'#96ad8e',t:1.2});
    $('#pl-status').innerHTML=G.resultMarkup(`${G.short(r.multiplier)}× bucket`,r);G.feedback(r,mult>=12);
    $('#pl-drop').disabled=false;if($('#pl-burst'))$('#pl-burst').disabled=false;
    G.games.plinko.last={bucket:k,multiplier:mult,result:r,points:b.pts};
  }
  function plDraw(){
    pctx.clearRect(0,0,PL.W,PL.H);pctx.fillStyle='#b9c3a1';
    for(let i=0;i<PL.ROWS;i++){const n=i+3;for(let j=0;j<n;j++){pctx.beginPath();pctx.arc(PL.CX+(j-(n-1)/2)*PL.SP,rowY(i),3.2,0,Math.PI*2);pctx.fill();}}
    PL.hits=PL.hits.filter(h=>h.t>0);PL.hits.forEach(h=>{h.t-=.05;pctx.beginPath();pctx.arc(h.x,h.y,4+10*(1-h.t),0,Math.PI*2);pctx.strokeStyle=`rgba(225,205,149,${Math.max(0,h.t)*.7})`;pctx.lineWidth=1;pctx.stroke();});
    pctx.textAlign='center';pctx.textBaseline='middle';
    for(let k=0;k<13;k++){const m=PL.MULT[k],x=PL.CX+(k-6)*PL.SP,y=578;PL.bflash[k]=Math.max(0,PL.bflash[k]-.03);rr(pctx,x-18,y,36,37,5);pctx.fillStyle=PL.bflash[k]>0?'#e8deb9':mCol(m);pctx.fill();pctx.fillStyle='#13251a';pctx.font='500 11px Outfit, sans-serif';const displayed=G.demoMultiplier?G.demoMultiplier('plinko',m):m;pctx.fillText(G.short(displayed)+'×',x,y+19);}
    PL.balls.filter(b=>!b.done).forEach(b=>{const p=plPos(b);const gradient=pctx.createRadialGradient(p.x-2,p.y-3,1,p.x,p.y,7);gradient.addColorStop(0,'#fff0b9');gradient.addColorStop(.45,'#dcc181');gradient.addColorStop(1,'#a08142');pctx.beginPath();pctx.arc(p.x,p.y,6.6,0,Math.PI*2);pctx.fillStyle=gradient;pctx.shadowColor='#dec88b';pctx.shadowBlur=9;pctx.fill();pctx.shadowBlur=0;});
    PL.floats=PL.floats.filter(f=>f.t>0);PL.floats.forEach(f=>{f.t-=.016;f.y-=.65;pctx.globalAlpha=Math.max(0,Math.min(1,f.t));pctx.fillStyle=f.color;pctx.font='500 14px Outfit, sans-serif';pctx.fillText(f.txt,f.x,f.y);pctx.globalAlpha=1;});
  }
  let plLast=0;
  function plLoop(ts){
    const dt=Math.min(60,ts-plLast||16);plLast=ts;plUpdate(dt);plDraw();
    if(PL.balls.length||PL.hits.length||PL.floats.length||PL.bflash.some(v=>v>0))requestAnimationFrame(plLoop);else PL.running=false;
  }
  function startPlinko(){if(PL.running)return;PL.running=true;plLast=performance.now();requestAnimationFrame(plLoop);}
  $('#pl-drop').addEventListener('click',()=>plDrop());
  $('#pl-burst')?.addEventListener('click',async()=>{
    for(let i=0;i<5;i++){
      if(PL.balls.filter(b=>!b.done).length>=G.CONFIG.maxPlinkoBalls||W.balance<PL.bet)break;
      if(!plDrop())break;
      await sleep(85);
    }
  });
  G.games.plinko={state:PL,enter:()=>{startPlinko();plStakeCtrl.syncUI();},setup:plSetup,draw:plDraw};
  G.on('wallet-reset',()=>{bjResetTable();rlClear();});
  G.hooks.originalInit=()=>{
    buildWheel();buildBoard();rlTotals();$('#rl-result').textContent='Place your chips or tap ALL to spin your stack.';slotInit();bjResetTable();vpButtons();
    const placeholder={r:'A',s:'♠'};$('#vp-hand').replaceChildren(...Array.from({length:5},()=>cardEl(placeholder,true)));
    const status=document.createElement('div');status.id='pl-status';status.className='pl-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.textContent='A different destiny in every drop.';$('.pl-note').after(status);
    const keys=['7','diamond','bell','BAR','cherry','lemon','two7','pair'];$$('#view-slots .payrow').forEach((row,i)=>row.dataset.k=keys[i]);
    $$('[data-pay-symbol]').forEach(el=>el.innerHTML=Array(3).fill(G.Art.slotSymbol(el.dataset.paySymbol)).join(''));
    plSetup();plDraw();document.fonts.ready.then(plDraw);
  };
})(window.GAR);
