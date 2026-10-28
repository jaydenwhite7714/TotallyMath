/* DOM-independent rules. Repaired/retained from the original game where applicable. */
(function (G) {
  'use strict';
  const SUITS=['♠','♥','♦','♣'];
  const RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const RNG = {
    unit() {
      if (globalThis.crypto?.getRandomValues) {
        const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]/4294967296;
      }
      return Math.random();
    },
    int(n) {
      if (!Number.isSafeInteger(n)||n<1) throw new RangeError('Invalid random range');
      // unit() is in [0,1); integer ranges in this simulator are small.
      return Math.floor(this.unit()*n);
    },
    pick(a) {return a[this.int(a.length)];},
    shuffle(a) {for(let i=a.length-1;i>0;i--){const j=this.int(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
  };
  function makeDeck(n=1) {
    const d=[];
    for(let k=0;k<n;k++)for(const s of SUITS)for(const r of RANKS)d.push({r,s,red:s==='♥'||s==='♦'});
    return RNG.shuffle(d);
  }
  const RV=r=>r==='A'?14:r==='K'?13:r==='Q'?12:r==='J'?11:+r;
  const cardVal=r=>r==='A'?11:['K','Q','J'].includes(r)?10:+r;
  function handVal(h){let t=0,a=0;for(const c of h){t+=cardVal(c.r);if(c.r==='A')a++;}while(t>21&&a>0){t-=10;a--;}return t;}
  function evalPoker(h) {
    if(h.length!==5)throw new RangeError('A poker hand needs five cards');
    const counts={};h.forEach(c=>counts[RV(c.r)]=(counts[RV(c.r)]||0)+1);
    const uniq=Object.keys(counts).map(Number).sort((a,b)=>b-a);
    const groups=Object.entries(counts).map(([v,c])=>[+v,c]).sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
    const flush=h.every(c=>c.s===h[0].s);
    const straight=uniq.length===5&&(uniq[0]-uniq[4]===4||uniq.join(',')==='14,5,4,3,2');
    const [g1,g2]=groups;
    // An A-2-3-4-5 straight flush is NOT a royal flush.
    if(straight&&flush)return uniq.join(',')==='14,13,12,11,10'?{key:'rf',name:'Royal Flush',pay:250}:{key:'sf',name:'Straight Flush',pay:50};
    if(g1[1]===4)return{key:'quad',name:'Four of a Kind',pay:25};
    if(g1[1]===3&&g2?.[1]===2)return{key:'fh',name:'Full House',pay:9};
    if(flush)return{key:'flush',name:'Flush',pay:6};
    if(straight)return{key:'straight',name:'Straight',pay:4};
    if(g1[1]===3)return{key:'trips',name:'Three of a Kind',pay:3};
    if(g1[1]===2&&g2?.[1]===2)return{key:'twopair',name:'Two Pair',pay:2};
    if(g1[1]===2&&g1[0]>=11)return{key:'job',name:'Jacks or Better',pay:1};
    return{key:null,name:'No qualifying hand',pay:0};
  }
  const WHEEL=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  const RL_RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  const numCls=n=>n===0?'zero':RL_RED.has(n)?'red':'blk';
  function rlPayout(key,n){
    if(key[0]==='n')return +key.slice(1)===n?36:0;
    if(n===0)return 0;
    switch(key){
      case'red':return RL_RED.has(n)?2:0;case'black':return!RL_RED.has(n)?2:0;
      case'odd':return n%2?2:0;case'even':return n%2?0:2;
      case'low':return n<=18?2:0;case'high':return n>=19?2:0;
      case'd1':return n<=12?3:0;case'd2':return n>=13&&n<=24?3:0;case'd3':return n>=25?3:0;
    }return 0;
  }
  const SYMS=[{t:'7',w:1},{t:'diamond',w:2},{t:'bell',w:3},{t:'BAR',w:4},{t:'cherry',w:5},{t:'lemon',w:5}];
  const SLOTS_PAY={'7':100,diamond:60,bell:30,BAR:20,cherry:12,lemon:10};
  function pickSym(){let r=RNG.unit()*20;for(const s of SYMS){if((r-=s.w)<0)return s;}return SYMS[5];}
  function evalSlots(out){
    const [a,b,c]=out.map(s=>typeof s==='string'?s:s.t);
    if(a===b&&b===c)return{pay:SLOTS_PAY[a],key:a,name:a==='7'?'Triple sevens':`Triple ${a}`};
    if([a,b,c].filter(s=>s==='7').length===2)return{pay:5,key:'two7',name:'Two sevens'};
    if(a===b||b===c||a===c)return{pay:2,key:'pair',name:'A matching pair'};
    return{pay:0,key:null,name:'No matching line'};
  }
  const PL_MULT=[50,12,5,2,1,.5,.3,.5,1,2,5,12,50];
  const baccaratValue=h=>h.reduce((n,c)=>n+(c.r==='A'?1:['10','J','Q','K'].includes(c.r)?0:+c.r),0)%10;
  function bankerDraws(b,pThird){
    if(pThird===null)return b<=5;
    if(b<=2)return true;
    if(b===3)return pThird!==8;
    if(b===4)return pThird>=2&&pThird<=7;
    if(b===5)return pThird>=4&&pThird<=7;
    if(b===6)return pThird===6||pThird===7;
    return false;
  }
  function baccaratDeal(deck) {
    const player=[deck.pop()],banker=[deck.pop()];player.push(deck.pop());banker.push(deck.pop());
    let p=baccaratValue(player),b=baccaratValue(banker);
    const natural=p>=8||b>=8;
    if(!natural){
      let third=null;
      if(p<=5){const c=deck.pop();player.push(c);third=baccaratValue([c]);}
      if(bankerDraws(b,third))banker.push(deck.pop());
    }
    p=baccaratValue(player);b=baccaratValue(banker);
    return{player,banker,p,b,natural,winner:p===b?'tie':p>b?'player':'banker'};
  }
  function baccaratReturn(selection,result){
    if(result.winner==='tie')return selection==='tie'?9:1;
    if(selection!==result.winner)return 0;
    return selection==='banker'?1.95:2;
  }
  // Hi-Lo uses an independent 52-card draw each prediction: A low; ties push.
  const lowRank=c=>c.r==='A'?1:RV(c.r);
  function hiLoChance(card,direction){const r=lowRank(card);return(direction==='higher'?13-r:r-1)/12;}
  function hiLoFactor(card,direction){const p=hiLoChance(card,direction);return p>0?Math.max(1,.97/p):0;}
  const DICE_COUNTS=[0,0,1,2,3,4,5,6,5,4,3,2,1];
  const diceWins=(a,b,target,mode)=>mode==='under'?a+b<target:a+b>target;
  function diceChance(target,mode){let win=0;for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)if(diceWins(a,b,target,mode))win++;return win/36;}
  function diceMultiplier(target,mode){const p=diceChance(target,mode);return p?Math.floor(349200/Math.round(p*36))/10000:0;}
  function minesMultiplier(total,mines,revealed){
    if(!Number.isInteger(total)||!Number.isInteger(mines)||mines<1||mines>=total||revealed<0||revealed>total-mines)throw new RangeError('Invalid Mines configuration');
    if(revealed===0)return 1;
    let m=.97;for(let i=0;i<revealed;i++)m*=((total-i)/(total-mines-i));
    return Math.min(G.CONFIG.maxPayoutMultiplier,m);
  }
  function minesLayout(total,mines,favorable=false){
    const indices=Array.from({length:total},(_,i)=>i);
    // A precommitted lower-right mine cluster for explicit developer demonstrations.
    // This never moves mines after a click or guarantees arbitrary safe selections.
    return new Set(favorable?indices.slice(-mines):RNG.shuffle(indices).slice(0,mines));
  }
  function crashPoint(){return Math.min(1000,Math.max(1,Math.floor(100*.97/(1-RNG.unit()))/100));}
  const LUCKY_SEGMENTS=[0,2,.5,5,1,0,10,2,.5,20,1,3];
  // Weighted 1,000-part distribution across the 12 slices -> 96.75% RTP (3.25% house edge).
  const LUCKY_WEIGHTS=[220,55,145,28,95,185,12,55,100,5,65,35];
  function pickWheelSegment(){
    const guard=RNG.int(LUCKY_SEGMENTS.length);
    if(!Number.isInteger(guard)||guard<0||guard>=LUCKY_SEGMENTS.length)return guard;
    let r=RNG.unit()*1000;
    if(!Number.isFinite(r)||r<0)return 0;
    for(let i=0;i<LUCKY_WEIGHTS.length;i++){if((r-=LUCKY_WEIGHTS[i])<0)return i;}
    return LUCKY_WEIGHTS.length-1;
  }
  function returnCentsBig(stakeBig,multiplier,capBig){
    if(typeof stakeBig!=='bigint'||stakeBig<0n||!Number.isFinite(multiplier)||multiplier<0)throw new RangeError('Invalid payout');
    const scaled=BigInt(Math.round(Math.min(G.CONFIG.maxPayoutMultiplier,multiplier)*1e9));
    const result=(stakeBig*scaled+500000000n)/1000000000n;
    return result>capBig?capBig:result;
  }
  // Clamp and round using BigInt fixed-point. No overflow even with demo rewards.
  function returnCents(stakeCents,multiplier,capCents){
    const sBig=typeof stakeCents==='bigint'?stakeCents:(Number.isSafeInteger(stakeCents)&&stakeCents>=0?BigInt(stakeCents):null);
    const cBig=typeof capCents==='bigint'?capCents:(Number.isFinite(capCents)&&capCents>=0?BigInt(Math.trunc(capCents)):null);
    if(sBig===null||cBig===null||!Number.isFinite(multiplier)||multiplier<0)throw new RangeError('Invalid payout');
    return Number(returnCentsBig(sBig,multiplier,cBig));
  }
  // A valid favorable opening is constructed from cards actually left in the shoe.
  function stackNext(deck,ranks) {
    const cards=[],working=deck.slice();
    for(const rank of ranks){const i=working.findIndex(c=>typeof rank==='string'?c.r===rank:rank(c));if(i<0)return false;cards.push(working.splice(i,1)[0]);}
    deck.splice(0,deck.length,...working,...cards.reverse());return true;
  }
  G.RNG=RNG;
  G.Rules={SUITS,RANKS,RV,cardVal,handVal,makeDeck,evalPoker,WHEEL,RL_RED,numCls,rlPayout,SYMS,SLOTS_PAY,pickSym,evalSlots,PL_MULT,baccaratValue,bankerDraws,baccaratDeal,baccaratReturn,lowRank,hiLoChance,hiLoFactor,DICE_COUNTS,diceWins,diceChance,diceMultiplier,minesMultiplier,minesLayout,crashPoint,LUCKY_SEGMENTS,LUCKY_WEIGHTS,pickWheelSegment,returnCents,returnCentsBig,stackNext};
})(window.GAR);
