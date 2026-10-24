/* One wallet, one ledger, immutable round settings; no presentation dependencies. */
(function (G) {
  'use strict';
  const C=G.CONFIG, CAP=Math.round(C.maxBalance*100), RETURN_CAP=Math.round(C.maxReturn*100);
  const events={};
  G.on=(name,fn)=>{(events[name]??=[]).push(fn);};
  G.emit=(name,payload)=>{(events[name]||[]).forEach(fn=>fn(payload));};
  const notice=(text,type='bad')=>G.emit('notice',{text,type});
  const validInt=(n,max=CAP)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0&&n<=max;
  const Storage={
    available:true,
    get(key){try{return localStorage.getItem(key);}catch(_){this.available=false;return null;}},
    set(key,value){try{localStorage.setItem(key,value);return true;}catch(_){this.available=false;return false;}}
  };
  const freshStats=()=>({plays:0,resolved:0,wins:0,losses:0,pushes:0,voids:0,biggestWinCents:0,wageredCents:0,returnedCents:0});
  function load(){
    let data=null;
    try{data=JSON.parse(Storage.get(C.storageKey));}catch(_){}
    const good=data&&data.version===3&&validInt(data.balanceCents);
    let legacy=Storage.get('gar_bal');
    legacy=legacy!==null&&legacy.trim()!==''?Number(legacy):C.startingBalance;
    const defaultCents=Number.isFinite(legacy)&&legacy>=0&&legacy<=C.maxBalance?Math.round(legacy*100):C.startingBalance*100;
    const out={version:3,balanceCents:good?data.balanceCents:defaultCents,stats:freshStats(),history:[],redeemed:[],pending:[],prefs:{sound:Storage.get('gar_snd')!=='off',reducedMotion:false,effects:true}};
    if(good){
      for(const key of Object.keys(out.stats))if(validInt(data.stats?.[key]))out.stats[key]=data.stats[key];
      out.stats.wins=Math.min(out.stats.wins,out.stats.resolved);
      out.history=Array.isArray(data.history)?data.history.filter(h=>h&&G.LIBRARY.some(g=>g.id===h.game)&&validInt(h.stakeCents)&&validInt(h.returnCents)&&Number.isSafeInteger(h.netCents)&&typeof h.at==='number').slice(0,40):[];
      out.redeemed=Array.isArray(data.redeemed)?data.redeemed.filter(x=>typeof x==='string').slice(0,200):[];
      for(const key of Object.keys(out.prefs))if(typeof data.prefs?.[key]==='boolean')out.prefs[key]=data.prefs[key];
      if(Array.isArray(data.pending))out.pending=data.pending.filter(p=>p&&validInt(p.stakeCents,C.maxStake*200)&&G.LIBRARY.some(g=>g.id===p.game)).slice(0,20);
    }
    return out;
  }
  const state=load(),active=new Map();
  let sequence=0,recovered=0;
  // A reload never consumes an unfinished wager. Recover only its committed stake.
  for(const p of state.pending){const refund=Math.min(p.stakeCents,CAP-state.balanceCents);state.balanceCents+=refund;recovered+=refund;state.stats.voids=Math.min(CAP,state.stats.voids+1);}
  state.pending=[];
  function save(){
    state.pending=[...active.values()].map(r=>({id:r.id,game:r.game,stakeCents:r.stakeCents}));
    Storage.set(C.storageKey,JSON.stringify(state));
    // Compatibility with the original stored balance, without rounding away fractions.
    Storage.set('gar_bal',String(state.balanceCents/100));
  }
  function changed(){save();G.emit('wallet',Wallet.snapshot());}
  const defaultGame=()=>({luckEnabled:false,luck:1,reward:1,customReturn:null});
  const developer=Object.fromEntries(G.LIBRARY.map(g=>[g.id,defaultGame()]));
  const Dev={
    snapshot(game){return Object.freeze({...developer[game]||defaultGame()});},
    all(){return Object.fromEntries(Object.entries(developer).map(([k,v])=>[k,{...v}]));},
    anyModified(){return Object.values(developer).some(v=>(v.luckEnabled&&v.luck>1)||v.reward!==1||v.customReturn!==null);},
    apply(scope,patch){
      if(Wallet.hasActive()){notice('Finish or collect your active rounds before changing demo settings.');return false;}
      const ids=scope==='all'?G.LIBRARY.map(g=>g.id):[scope];
      if(ids.some(id=>!developer[id]))return false;
      for(const id of ids){
        const n={...developer[id],...patch};
        if(typeof n.luckEnabled!=='boolean'||!Number.isFinite(n.luck)||n.luck<1||n.luck>C.maxLuck||!Number.isFinite(n.reward)||n.reward<.1||n.reward>100||(n.customReturn!==null&&(!Number.isFinite(n.customReturn)||n.customReturn<.1||n.customReturn>10000))){notice('Use luck 1–10¹⁶, reward 0.1–100, and custom return 0.1–10,000.');return false;}
      }
      for(const id of ids)developer[id]={...developer[id],...patch};
      G.emit('developer',Dev.all());return true;
    },
    reset(scope='all'){
      return this.apply(scope,defaultGame());
    }
  };
  const Outcomes={
    probability(settings){
      if(!settings?.luckEnabled||settings.luck<=1)return 0;
      if(settings.luck>=1e8)return 1;
      return 1-1/Math.sqrt(settings.luck);
    },
    shouldFavor(round){const p=this.probability(round.settings);return p>0&&G.RNG.unit()<p;},
    choose(round,normal,favorable){return this.shouldFavor(round)?favorable():normal();}
  };
  function effectiveMultiplier(round,base,refund=false){
    if(refund||base===0)return base;
    const s=round.settings;
    return Math.min(C.maxPayoutMultiplier,(s.customReturn===null?base:s.customReturn)*s.reward);
  }
  const Wallet={
    get balance(){return state.balanceCents/100;},
    get cents(){return state.balanceCents;},
    get prefs(){return {...state.prefs};},
    get stats(){return {...state.stats};},
    get history(){return state.history.map(h=>({...h}));},
    get recovered(){return recovered/100;},
    get storageAvailable(){return Storage.available;},
    snapshot(){return {balance:this.balance,cents:this.cents,stats:this.stats,active:this.activeRounds(),prefs:this.prefs};},
    hasActive(){return active.size>0;},
    activeRounds(){return [...active.values()].map(r=>({id:r.id,game:r.game,stake:r.stakeCents/100}));},
    validStake(amount){return typeof amount==='number'&&Number.isFinite(amount)&&amount>=C.minStake&&amount<=C.maxStake&&Number.isSafeInteger(Math.round(amount*100));},
    begin(game,amount){
      if(!G.LIBRARY.some(g=>g.id===game)||!this.validStake(amount)){notice(`Stake must be ${C.minStake.toLocaleString()}–${C.maxStake.toLocaleString()} chips.`);return null;}
      const pending=[...active.values()].filter(r=>r.game===game).length;
      if(pending>=(game==='plinko'?C.maxPlinkoBalls:1)){notice('That game already has a round in progress.');return null;}
      const stakeCents=Math.round(amount*100);
      if(stakeCents>state.balanceCents){notice('Not enough chips for this stake.');return null;}
      const settings=Dev.snapshot(game);
      const round={id:`${Date.now().toString(36)}-${++sequence}`,game,stakeCents,settings,status:'active',modified:(settings.luckEnabled&&settings.luck>1)||settings.reward!==1||settings.customReturn!==null};
      state.balanceCents-=stakeCents;
      state.stats.plays=Math.min(CAP,state.stats.plays+1);
      state.stats.wageredCents=Math.min(CAP,state.stats.wageredCents+stakeCents);
      active.set(round.id,round);changed();return round;
    },
    extend(round,amount){
      if(!round||active.get(round.id)!==round||round.status!=='active'||!this.validStake(amount))return false;
      const cents=Math.round(amount*100);
      if(cents>state.balanceCents||round.stakeCents+cents>C.maxStake*100){notice('Not enough chips or maximum total stake reached.');return false;}
      state.balanceCents-=cents;round.stakeCents+=cents;
      state.stats.wageredCents=Math.min(CAP,state.stats.wageredCents+cents);changed();return true;
    },
    quote(round,multiplier,{refund=false}={}){
      if(!round||!Number.isFinite(multiplier)||multiplier<0)return {amount:0,cents:0,multiplier:0,capped:false};
      const effective=effectiveMultiplier(round,multiplier,refund);
      const raw=G.Rules.returnCents(round.stakeCents,effective,RETURN_CAP);
      const headroom=typeof round.previewHeadroom==='number'?round.previewHeadroom:CAP-state.balanceCents;
      const cents=Math.min(raw,headroom);
      const uncapped=G.Rules.returnCents(round.stakeCents,effective,CAP);
      return {amount:cents/100,cents,multiplier:effective,capped:raw!==uncapped||cents!==raw};
    },
    preview(game,stake,multiplier,opts={}){
      const valid=this.validStake(stake),stakeCents=valid?Math.round(stake*100):0;
      const round={stakeCents,settings:Dev.snapshot(game),previewHeadroom:Math.min(CAP,CAP-state.balanceCents+Math.min(stakeCents,state.balanceCents))};
      return this.quote(round,multiplier,opts);
    },
    settle(round,multiplier,{refund=false,reason=''}={}){
      if(!round||active.get(round.id)!==round||round.status!=='active')return null;
      if(!Number.isFinite(multiplier)||multiplier<0){notice('Invalid return blocked. The round remains available.');return null;}
      const q=this.quote(round,multiplier,{refund});
      // Synchronous lock BEFORE any UI/sound/animation callbacks.
      round.status='settled';active.delete(round.id);state.balanceCents+=q.cents;
      const netCents=q.cents-round.stakeCents;
      const st=state.stats;st.resolved=Math.min(CAP,st.resolved+1);
      if(netCents>0)st.wins=Math.min(CAP,st.wins+1);else if(netCents<0)st.losses=Math.min(CAP,st.losses+1);else st.pushes=Math.min(CAP,st.pushes+1);
      st.biggestWinCents=Math.max(st.biggestWinCents,netCents);
      st.returnedCents=Math.min(CAP,st.returnedCents+q.cents);
      const record={id:round.id,game:round.game,stakeCents:round.stakeCents,returnCents:q.cents,netCents,modified:round.modified,at:Date.now(),reason:String(reason).slice(0,100)};
      state.history.unshift(record);state.history=state.history.slice(0,40);changed();
      const result={returned:q.amount,net:netCents/100,stake:round.stakeCents/100,capped:q.capped,multiplier:q.multiplier,record};
      G.emit('settled',result);return result;
    },
    setBalance(amount){
      if(this.hasActive()){notice('Finish or collect your active rounds before changing the wallet.');return false;}
      if(typeof amount!=='number'||!Number.isFinite(amount)||amount<0||amount>C.maxBalance){notice('Enter a finite balance between 0 and 9 trillion chips.');return false;}
      state.balanceCents=Math.round(amount*100);changed();return true;
    },
    grant(amount){
      if(this.hasActive()){notice('Finish your active rounds before claiming chips.');return null;}
      if(!Number.isFinite(amount)||amount<0||amount>C.maxBalance)return null;
      const cents=Math.min(Math.round(amount*100),CAP-state.balanceCents);
      state.balanceCents+=cents;changed();return cents/100;
    },
    refill(){
      if(this.hasActive()||this.balance>=C.refillThreshold)return null;
      return this.grant(C.refillChips);
    },
    redeem(code){
      if(this.hasActive()){notice('Finish your active rounds before redeeming a code.');return {ok:false,message:'Finish or collect your active rounds first.'};}
      const key=String(code).trim().toUpperCase(),reward=C.redeemCodes[key];
      if(!Object.prototype.hasOwnProperty.call(C.redeemCodes,key)||!reward)return {ok:false,message:'That code is not valid. Please try again.'};
      if(state.redeemed.includes(key))return {ok:false,message:'This code has already been redeemed on this device.'};
      state.redeemed.push(key);
      const amount=this.grant(reward.chips);
      return {ok:true,message:amount===reward.chips?reward.message:`${amount.toLocaleString()} chips credited (wallet limit).`,amount};
    },
    setPreference(key,value){if(Object.prototype.hasOwnProperty.call(state.prefs,key)&&typeof value==='boolean'){state.prefs[key]=value;changed();G.emit('preferences',this.prefs);}},
    resetStatistics(){
      if(this.hasActive()){notice('Finish your active rounds before resetting statistics.');return false;}
      state.stats=freshStats();state.history=[];changed();return true;
    }
  };
  G.Storage=Storage;G.Wallet=Wallet;G.Dev=Dev;G.Outcomes=Outcomes;
  save();
})(window.GAR);
