/* Crash / Mines / Lucky Wheel. The outcome is committed before any animation. */
(function (G) {
  'use strict';
  const {$,$$,sleep,S,fmt}=G,W=G.Wallet,R=G.Rules,O=G.Outcomes;
  /* ═══════════ CRASH — wall-clock deadlines, not animation-frame outcomes ═══════════ */
  const CR={phase:'idle',round:null,startedAt:0,crashAt:0,crashMultiplier:1,autoTarget:null,autoAt:null,multiplier:1,raf:0,timer:0,lastPaint:0,history:[],growth:.22,last:null};
  const currentMultiplier=now=>Math.exp((now-CR.startedAt)/1000*CR.growth);
  function crRefresh(){
    const active=CR.phase==='active';$('#cr-start').disabled=active;$('#cr-cash').disabled=!active;G.lockBet('cr',active);$('#cr-auto').disabled=active;$('#cr-auto-target').disabled=active;
    if(active)$('#cr-collect-amount').textContent=fmt(W.quote(CR.round,CR.multiplier).amount)+' chips';else $('#cr-collect-amount').textContent='–';
  }
  function crGraph(elapsed,mult){
    const span=Math.max(8,elapsed*1.25),top=Math.max(2,mult*1.45),pts=[];
    for(let i=0;i<=45;i++){const t=elapsed*i/45,m=Math.exp(t*CR.growth),x=45+620*t/span,y=350-300*(m-1)/(top-1);pts.push([x,y]);}
    const line=pts.map((p,i)=>(i?'L':'M')+p.map(n=>n.toFixed(2)).join(' ')).join(' '),last=pts.at(-1);
    $('#cr-line').setAttribute('d',line);$('#cr-area').setAttribute('d',`${line}L${last[0]} 350L45 350Z`);$('#cr-dot').setAttribute('cx',last[0]);$('#cr-dot').setAttribute('cy',last[1]);$('#cr-time').textContent=elapsed.toFixed(1)+'s';
  }
  function crPaint(now){
    CR.multiplier=Math.max(1,Math.floor(Math.min(CR.crashMultiplier,currentMultiplier(now))*100)/100);
    $('#cr-mult').textContent=CR.multiplier.toFixed(2);$('#cr-collect-amount').textContent=fmt(W.quote(CR.round,CR.multiplier).amount)+' chips';crGraph(Math.max(0,(now-CR.startedAt)/1000),CR.multiplier);
  }
  function crHistory(kind,m,r){
    CR.history.unshift({kind,m,returned:r.returned});CR.history=CR.history.slice(0,10);
    $('#cr-history').innerHTML=CR.history.map(h=>`<span class="${h.kind==='crash'?'crash':'collected'}" title="${h.kind==='crash'?'Crashed':'Collected'} · returned ${fmt(h.returned)} chips">${h.kind==='collect'?'↑ ':''}${h.m.toFixed(2)}×</span>`).join('');
  }
  function crStop(){cancelAnimationFrame(CR.raf);clearTimeout(CR.timer);CR.raf=0;CR.timer=0;}
  function crCollect(mult,auto=false){
    if(CR.phase!=='active')return;CR.phase='collected';crStop();
    const r=W.settle(CR.round,mult,{reason:`${auto?'Auto collected':'Collected'} ${mult.toFixed(2)}×`});if(!r)return;
    CR.multiplier=mult;$('#cr-mult').textContent=mult.toFixed(2);$('#cr-status').textContent='RETURN COLLECTED';$('#cr-caption').textContent='A good time to make your exit.';
    $('.crash-stage').classList.add('collected');G.setResult('cr',`${auto?'Auto collected':'Collected'} at ${mult.toFixed(2)}×`,r);G.feedback(r,mult>=10);crHistory('collect',mult,r);crRefresh();CR.last={kind:'collect',mult,result:r};
  }
  function crCrash(){
    if(CR.phase!=='active')return;CR.phase='crashed';crStop();CR.multiplier=CR.crashMultiplier;
    crGraph(Math.log(CR.crashMultiplier)/CR.growth,CR.crashMultiplier);$('#cr-mult').textContent=CR.crashMultiplier.toFixed(2);$('#cr-status').textContent='CRASHED';$('#cr-caption').textContent='That was the limit. A new round awaits.';$('.crash-stage').classList.add('crashed');
    const r=W.settle(CR.round,0,{reason:`Crashed ${CR.crashMultiplier.toFixed(2)}×`});G.setResult('cr',`Crashed at ${CR.crashMultiplier.toFixed(2)}×`,r);G.feedback(r);crHistory('crash',CR.crashMultiplier,r);crRefresh();CR.last={kind:'crash',mult:CR.crashMultiplier,result:r};
  }
  function crDue(now){
    if(CR.phase!=='active')return true;
    // Automatic collection belongs to its predetermined crossing, even if a background
    // tab's timer wakes late. Strictly equal auto/crash thresholds always crash.
    if(CR.autoTarget!==null&&CR.autoTarget<CR.crashMultiplier&&now>=CR.autoAt){crGraph(Math.log(CR.autoTarget)/CR.growth,CR.autoTarget);crCollect(CR.autoTarget,true);return true;}
    if(now>=CR.crashAt){crCrash();return true;}return false;
  }
  function crDeadline(){
    const now=performance.now();if(crDue(now))return;
    const due=CR.autoTarget!==null&&CR.autoTarget<CR.crashMultiplier?Math.min(CR.autoAt,CR.crashAt):CR.crashAt;
    CR.timer=setTimeout(crDeadline,Math.max(1,due-now));
  }
  function crTick(now){
    if(crDue(now))return;
    if(!G.motion()||now-CR.lastPaint>180){crPaint(now);CR.lastPaint=now;}
    CR.raf=requestAnimationFrame(crTick);
  }
  G.setupBet('cr',()=>{},()=>CR.phase==='active');
  $('#cr-start').addEventListener('click',()=>{
    if(CR.phase==='active')return;
    const auto=$('#cr-auto').checked?Number($('#cr-auto-target').value):null;
    if(auto!==null&&(!Number.isFinite(auto)||auto<1.05||auto>1000)){G.toast('Auto collect must be 1.05–1,000×.','bad');return;}
    CR.phase='active';crRefresh();const round=W.begin('crash',G.getBet('cr'));if(!round){CR.phase='idle';crRefresh();return;}CR.round=round;
    CR.crashMultiplier=O.choose(round,()=>R.crashPoint(),()=>1000);CR.startedAt=performance.now();CR.crashAt=CR.startedAt+Math.log(CR.crashMultiplier)/CR.growth*1000;CR.autoTarget=auto;CR.autoAt=auto===null?null:CR.startedAt+Math.log(auto)/CR.growth*1000;CR.multiplier=1;CR.lastPaint=0;
    $('.crash-stage').classList.remove('crashed','collected');$('#cr-status').textContent='ROUND IN PLAY';$('#cr-caption').textContent='Higher it goes. Your move.';$('#cr-result').className='round-message';$('#cr-result').textContent='Collect before the crash.';$('#cr-mult').textContent='1.00';S.spin();crRefresh();crGraph(0,1);
    if(crDue(performance.now()))return;crDeadline();CR.raf=requestAnimationFrame(crTick);
  });
  $('#cr-cash').addEventListener('click',()=>{
    if(CR.phase!=='active')return;const now=performance.now();
    // No post-crash payout, even if the last visible frame showed a lower value.
    if(crDue(now))return;crPaint(now);crCollect(CR.multiplier);
  });
  G.games.crash={state:CR,enter:crRefresh};
  /* ═══════════ MINES — layout is precommitted, never adjusted after a click ═══════════ */
  const MN={size:5,mines:3,total:25,phase:'idle',round:null,layout:new Set(),revealed:new Set(),busy:false,hit:null,multiplier:1,last:null};
  const mnActive=()=>MN.phase==='active';
  function mnConfig(){const size=Number($('#mn-size').value),mines=Number($('#mn-count').value),total=size*size;return{size,mines,total,valid:[4,5,6].includes(size)&&Number.isInteger(mines)&&mines>=1&&mines<total};}
  function mnBoard(){
    const grid=$('#mn-grid'),terminal=['lost','collected'].includes(MN.phase);grid.style.setProperty('--cols',String(MN.size));
    grid.innerHTML=Array.from({length:MN.total},(_,i)=>{
      const visible=MN.revealed.has(i)||terminal,isMine=visible&&MN.layout.has(i),safe=visible&&!isMine;
      const cls='mine-tile '+(isMine?'mine':safe?'safe':'hidden-tile')+(terminal&&!MN.revealed.has(i)&&i!==MN.hit?' dim':'');
      const row=Math.floor(i/MN.size)+1,col=i%MN.size+1,label=`Tile ${row}, ${col}: ${visible?(isMine?'mine':'safe gem'):'unrevealed'}`;
      return `<button type="button" class="${cls}" data-index="${i}" aria-label="${label}" ${!mnActive()||MN.busy||MN.revealed.has(i)?'disabled':''}>${G.Art.icon(isMine?'mine':'diamond')}</button>`;
    }).join('');
  }
  function mnRefresh(){
    const active=mnActive(),config=mnConfig(),locked=active||MN.busy;
    $('#mn-size').disabled=locked;$('#mn-count').disabled=locked;$('#mn-count').max=(config.total-1);G.lockBet('mn',locked);$('#mn-start').disabled=locked||!config.valid;$('#mn-collect').disabled=!active||MN.busy;
    $('#mn-safe-count').textContent=MN.revealed.size;const displayed=MN.phase==='lost'?0:MN.round?W.quote(MN.round,MN.multiplier,{refund:!MN.revealed.size}).multiplier:MN.multiplier;$('#mn-mult').textContent=(displayed>=1000?G.short(displayed):displayed.toFixed(4))+'×';
    $('#mn-collect-amount').textContent=active?fmt(W.quote(MN.round,MN.multiplier,{refund:!MN.revealed.size}).amount)+' chips':'–';
    const total=active?MN.total:config.total,mines=active?MN.mines:config.mines,k=active?MN.revealed.size:0;
    const next=config.valid&&k<total-mines?R.minesMultiplier(total,mines,k+1):null;
    $('#mn-next').textContent=next===null?'–':fmt(active?W.quote(MN.round,next).amount:W.preview('mines',G.getBet('mn'),next).amount)+' chips';
    $$('#mn-grid button').forEach(b=>b.disabled=!active||MN.busy||MN.revealed.has(+b.dataset.index));
  }
  function mnConfigure(){
    if(mnActive()||MN.busy)return;const config=mnConfig();
    if(MN.size!==config.size){MN.size=config.size;MN.total=config.total;MN.revealed=new Set();MN.layout=new Set();MN.phase='idle';MN.multiplier=1;}
    if(config.valid)MN.mines=config.mines;
    mnBoard();mnRefresh();
    if(!config.valid){$('#mn-result').className='round-message bad';$('#mn-result').textContent=`Choose a whole number of mines from 1 to ${config.total-1}.`;}
    else if(MN.phase==='idle'){$('#mn-result').className='round-message';$('#mn-result').textContent='Choose your grid and start exploring.';}
  }
  $('#mn-size').addEventListener('change',()=>{if(mnActive())return;const max=Number($('#mn-size').value)**2-1;if(Number($('#mn-count').value)>max)$('#mn-count').value=max;mnConfigure();});
  $('#mn-count').addEventListener('input',mnConfigure);G.setupBet('mn',mnRefresh,()=>mnActive()||MN.busy);
  $('#mn-start').addEventListener('click',()=>{
    const c=mnConfig();if(mnActive()||MN.busy||!c.valid)return;MN.busy=true;mnRefresh();const round=W.begin('mines',G.getBet('mn'));if(!round){MN.busy=false;mnRefresh();return;}
    MN.round=round;MN.size=c.size;MN.mines=c.mines;MN.total=c.total;MN.layout=R.minesLayout(c.total,c.mines,O.shouldFavor(round));MN.revealed=new Set();MN.hit=null;MN.multiplier=1;MN.phase='active';MN.busy=false;
    $('#mn-result').className='round-message';$('#mn-result').textContent=`${MN.total-MN.mines} gems. ${MN.mines} mines. Your first move.`;S.chip();mnBoard();mnRefresh();
  });
  function mnCollect(auto=false){
    if(!mnActive()||MN.busy)return;MN.busy=true;mnRefresh();
    const r=W.settle(MN.round,MN.multiplier,{refund:!MN.revealed.size,reason:`Collected ${MN.revealed.size} safe tiles`});MN.phase='collected';MN.busy=false;G.setResult('mn',auto?'A full pocket of gold. Automatically collected.':'Leave with the gold. A fine choice.',r);G.feedback(r,MN.multiplier>=10);mnBoard();mnRefresh();MN.last={kind:'collect',result:r,revealed:MN.revealed.size};
  }
  $('#mn-collect').addEventListener('click',()=>mnCollect());
  $('#mn-grid').addEventListener('click',async e=>{
    const button=e.target.closest('[data-index]');if(!button||button.disabled||!mnActive()||MN.busy)return;const i=+button.dataset.index;if(MN.revealed.has(i))return;
    MN.busy=true;mnRefresh();const mine=MN.layout.has(i);await sleep(170);
    if(mine){MN.hit=i;MN.phase='lost';const r=W.settle(MN.round,0,{reason:`Mine at tile ${i+1}`});MN.busy=false;G.setResult('mn','A hidden mine. This adventure ends here.',r);G.feedback(r);mnBoard();mnRefresh();MN.last={kind:'mine',index:i,result:r};return;}
    MN.revealed.add(i);MN.multiplier=R.minesMultiplier(MN.total,MN.mines,MN.revealed.size);MN.busy=false;S.chip();
    $('#mn-result').className='round-message good';$('#mn-result').textContent=`A golden find. ${fmt(W.quote(MN.round,MN.multiplier).amount)} chips ready to collect.`;mnBoard();mnRefresh();
    if(MN.revealed.size===MN.total-MN.mines||MN.multiplier>=G.CONFIG.maxPayoutMultiplier)mnCollect(true);
  });
  G.games.mines={state:MN,enter:mnRefresh};
  /* ═══════════ LUCKY WHEEL ═══════════ */
  const LW={busy:false,round:null,rotation:0,index:null,last:null};
  function lwRefresh(){
    const button=$('#lw-start');button.disabled=LW.busy;button.setAttribute('aria-busy',String(LW.busy));
    button.innerHTML=(LW.busy?'Spinning… ':'Spin the wheel ')+G.Art.icon(LW.busy?'wheel':'arrow');
    $('.lucky-stage').setAttribute('aria-busy',String(LW.busy));G.lockBet('lw',LW.busy);
  }
  function lwHighlight(index=LW.last?.index){
    $$('#lw-wheel [data-segment]').forEach(segment=>segment.classList.toggle('is-selected',index!=null&&Number(segment.dataset.segment)===index));
  }
  G.setupBet('lw',lwRefresh,()=>LW.busy);
  $('#lw-start').addEventListener('click',async()=>{
    if(LW.busy)return;LW.busy=true;lwRefresh();const round=W.begin('wheel',G.getBet('lw'));if(!round){LW.busy=false;lwRefresh();return;}LW.round=round;
    let index=null,base=null;
    LW.index=null;lwHighlight(null);$('.lucky-stage').classList.remove('has-win');$('#lw-result').className='round-message';$('#lw-result').textContent='A little turn of fortune…';
    try{
      const values=R.LUCKY_SEGMENTS;
      index=O.choose(round,()=>G.RNG.int(values.length),()=>{const max=Math.max(...values);return G.RNG.pick(values.map((v,i)=>v===max?i:-1).filter(i=>i>=0));});
      if(!Number.isInteger(index)||index<0||index>=values.length)throw new RangeError('Invalid wheel segment');
      LW.index=index;base=values[index];const step=360/values.length,from=LW.rotation;
      const target=(((-index*step)%360)+360)%360;LW.rotation+=1800+((target-LW.rotation%360+360)%360);
      $('.prize-stage').setAttribute('aria-label','Lucky Wheel spinning');S.spin();
      await G.spinWheel({wheel:$('#lw-wheel'),from,to:LW.rotation,step,pointer:$('.prize-stage .rl-pointer')});
      const r=W.settle(round,base,{reason:`Segment ${index+1} · ${base}×`});if(!r)return;
      LW.last={index,multiplier:base,rotation:LW.rotation,result:r};lwHighlight(index);
      $('.prize-stage').setAttribute('aria-label',`Wheel result: segment ${index+1}, ${fmt(r.returned)} play-money chips returned.`);
      $('.lucky-stage').classList.toggle('has-win',r.net>0&&W.prefs.effects);
      G.setResult('lw',r.multiplier>=10?`${G.short(r.multiplier)}×. A truly golden spin.`:r.net>0?`${G.short(r.multiplier)}×. Fortune paid a visit.`:r.net===0?'1×. Right back where you started.':`${G.short(r.multiplier)}×. Another turn awaits.`,r);
      // A quiet rim / segment highlight replaces a screenful of wheel confetti.
      G.feedback(r);
    }catch(_){
      // Never re-draw a result after an animation problem. If selection itself
      // failed, return exactly the committed stake, ignoring demo reward boosts.
      if(round.status==='active'){
        const selected=Number.isInteger(index)&&base!==null;
        const r=W.settle(round,selected?base:1,{refund:!selected,reason:selected?`Segment ${index+1} · animation recovery`:'Spin could not start · stake refunded'});
        if(r){
          if(selected){$('#lw-wheel').style.transform=`rotate(${LW.rotation}deg)`;LW.last={index,multiplier:base,rotation:LW.rotation,result:r};lwHighlight(index);}
          G.setResult('lw',selected?'Your selected segment. Return credited.':'Spin could not start. Your stake was returned.',r);
        }
      }
    }finally{LW.busy=false;lwRefresh();}
  });
  G.games.wheel={state:LW,enter:lwRefresh,highlight:lwHighlight};
  G.on('developer',()=>{mnRefresh();lwRefresh();});
  G.hooks.arcadeInit=()=>{crGraph(0,1);crRefresh();mnConfigure();$('#lw-wheel').innerHTML=G.Art.prizeSvg();lwRefresh();};
})(window.GAR);
