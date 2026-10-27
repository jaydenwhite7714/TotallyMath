/* One wallet, one ledger, local player accounts, immutable round settings; no presentation dependencies. */
(function (G) {
  'use strict';
  const C=G.CONFIG, CAP=Math.round(C.maxBalance*100), RETURN_CAP=Math.round(C.maxReturn*100);
  const events={};
  G.on=(name,fn)=>{(events[name]??=[]).push(fn);};
  G.emit=(name,payload)=>{(events[name]||[]).forEach(fn=>fn(payload));};
  const notice=(text,type='bad')=>G.emit('notice',{text,type});
  const validInt=(n,max=CAP)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0&&n<=max;

  /* Pure-JS NIST SHA-256 + Base64url (works in HTTPS, HTTP, file://, sandboxed iframes & Node VM) */
  const K256=[
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  function utf8Bytes(str){
    const s=String(str),out=[];
    for(let i=0;i<s.length;i++){
      let c=s.charCodeAt(i);
      if(c>=0xd800&&c<=0xdbff&&i+1<s.length){const lo=s.charCodeAt(i+1);if(lo>=0xdc00&&lo<=0xdfff){c=((c-0xd800)<<10)+(lo-0xdc00)+0x10000;i++;}}
      if(c<0x80)out.push(c);
      else if(c<0x800)out.push(0xc0|(c>>6),0x80|(c&63));
      else if(c<0x10000)out.push(0xe0|(c>>12),0x80|((c>>6)&63),0x80|(c&63));
      else out.push(0xf0|(c>>18),0x80|((c>>12)&63),0x80|((c>>6)&63),0x80|(c&63));
    }
    return out;
  }
  function utf8Decode(bytes){
    let out='',i=0;
    while(i<bytes.length){
      const b0=bytes[i++];
      if(b0<0x80)out+=String.fromCharCode(b0);
      else if((b0&0xe0)===0xc0)out+=String.fromCharCode(((b0&31)<<6)|(bytes[i++]&63));
      else if((b0&0xf0)===0xe0)out+=String.fromCharCode(((b0&15)<<12)|((bytes[i++]&63)<<6)|(bytes[i++]&63));
      else{const cp=((b0&7)<<18)|((bytes[i++]&63)<<12)|((bytes[i++]&63)<<6)|(bytes[i++]&63)-0x10000;out+=String.fromCharCode(0xd800+(cp>>10),0xdc00+(cp&1023));}
    }
    return out;
  }
  const rotr=(x,n)=>(x>>>n)|(x<<(32-n));
  function sha256(input){
    const bytes=utf8Bytes(input),bitLen=bytes.length*8;
    bytes.push(0x80);
    while((bytes.length%64)!==56)bytes.push(0);
    const hi=Math.floor(bitLen/4294967296),lo=bitLen>>>0;
    bytes.push((hi>>>24)&255,(hi>>>16)&255,(hi>>>8)&255,hi&255,(lo>>>24)&255,(lo>>>16)&255,(lo>>>8)&255,lo&255);
    let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;
    const w=new Array(64);
    for(let i=0;i<bytes.length;i+=64){
      for(let j=0;j<16;j++)w[j]=((bytes[i+j*4]<<24)|(bytes[i+j*4+1]<<16)|(bytes[i+j*4+2]<<8)|bytes[i+j*4+3])>>>0;
      for(let j=16;j<64;j++){
        const s0=rotr(w[j-15],7)^rotr(w[j-15],18)^(w[j-15]>>>3);
        const s1=rotr(w[j-2],17)^rotr(w[j-2],19)^(w[j-2]>>>10);
        w[j]=(w[j-16]+s0+w[j-7]+s1)>>>0;
      }
      let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
      for(let j=0;j<64;j++){
        const S1=rotr(e,6)^rotr(e,11)^rotr(e,25),ch=(e&f)^((~e)&g),t1=(h+S1+ch+K256[j]+w[j])>>>0;
        const S0=rotr(a,2)^rotr(a,13)^rotr(a,22),maj=(a&b)^(a&c)^(b&c),t2=(S0+maj)>>>0;
        h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
      }
      h0=(h0+a)>>>0;h1=(h1+b)>>>0;h2=(h2+c)>>>0;h3=(h3+d)>>>0;
      h4=(h4+e)>>>0;h5=(h5+f)>>>0;h6=(h6+g)>>>0;h7=(h7+h)>>>0;
    }
    return [h0,h1,h2,h3,h4,h5,h6,h7].map(v=>v.toString(16).padStart(8,'0')).join('');
  }
  const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function b64UrlEncode(str){
    const b=utf8Bytes(str);let out='';
    for(let i=0;i<b.length;i+=3){
      const n=(b[i]<<16)|((b[i+1]||0)<<8)|(b[i+2]||0);
      out+=B64[(n>>18)&63]+B64[(n>>12)&63]+(i+1<b.length?B64[(n>>6)&63]:'')+(i+2<b.length?B64[n&63]:'');
    }
    return out;
  }
  function b64UrlDecode(str){
    const clean=String(str).replace(/[^A-Za-z0-9\-_]/g,''),bytes=[];
    for(let i=0;i<clean.length;i+=4){
      const c0=B64.indexOf(clean[i]),c1=B64.indexOf(clean[i+1]);
      const c2=i+2<clean.length?B64.indexOf(clean[i+2]):-1,c3=i+3<clean.length?B64.indexOf(clean[i+3]):-1;
      if(c0<0||c1<0)throw new RangeError('Invalid backup encoding');
      const n=(c0<<18)|(c1<<12)|(Math.max(0,c2)<<6)|Math.max(0,c3);
      bytes.push((n>>16)&255);if(c2>=0)bytes.push((n>>8)&255);if(c3>=0)bytes.push(n&255);
    }
    return utf8Decode(bytes);
  }
  function randomHex(bytes=16){
    let s='';for(let i=0;i<bytes;i++)s+=G.RNG.int(256).toString(16).padStart(2,'0');return s;
  }
  function hashPassword(password,salt){
    let h=sha256(`gar-auth-v1:${salt}:${password}`);
    for(let i=0;i<200;i++)h=sha256(`${salt}:${i}:${h}:${password}`);
    return h;
  }

  const Storage={
    available:true,
    get(key){try{return localStorage.getItem(key);}catch(_){this.available=false;return null;}},
    set(key,value){try{localStorage.setItem(key,value);return true;}catch(_){this.available=false;return false;}},
    remove(key){try{localStorage.removeItem?.(key);}catch(_){}}
  };

  const freshStats=()=>({plays:0,resolved:0,wins:0,losses:0,pushes:0,voids:0,biggestWinCents:0,wageredCents:0,returnedCents:0,currentStreak:0,bestStreak:0});
  const freshState=(balanceCents=C.startingBalance*100,sound=true)=>({
    version:3,
    balanceCents,
    stats:freshStats(),
    history:[],
    redeemed:[],
    pending:[],
    achievements:[],
    daily:{lastClaim:0,streak:0},
    prefs:{sound,reducedMotion:false,effects:true}
  });

  const knownAch=new Set((C.achievements||[]).map(a=>a.id));
  function sanitizeState(data,defaultCents=C.startingBalance*100,defaultSound=true){
    const good=data&&data.version===3&&validInt(data.balanceCents);
    const out=freshState(good?data.balanceCents:defaultCents,defaultSound);
    if(good){
      for(const key of Object.keys(out.stats))if(validInt(data.stats?.[key]))out.stats[key]=data.stats[key];
      out.stats.wins=Math.min(out.stats.wins,out.stats.resolved);
      out.stats.bestStreak=Math.max(out.stats.bestStreak,out.stats.currentStreak);
      out.history=Array.isArray(data.history)?data.history.filter(h=>h&&G.LIBRARY.some(g=>g.id===h.game)&&validInt(h.stakeCents)&&validInt(h.returnCents)&&Number.isSafeInteger(h.netCents)&&typeof h.at==='number').slice(0,50):[];
      out.redeemed=Array.isArray(data.redeemed)?data.redeemed.filter(x=>typeof x==='string').slice(0,250):[];
      out.achievements=Array.isArray(data.achievements)?[...new Set(data.achievements.filter(x=>typeof x==='string'&&knownAch.has(x)))]:[];
      if(data.daily&&typeof data.daily==='object'){
        if(validInt(data.daily.lastClaim,9e15))out.daily.lastClaim=data.daily.lastClaim;
        if(validInt(data.daily.streak,10000))out.daily.streak=data.daily.streak;
      }
      for(const key of Object.keys(out.prefs))if(typeof data.prefs?.[key]==='boolean')out.prefs[key]=data.prefs[key];
      if(Array.isArray(data.pending))out.pending=data.pending.filter(p=>p&&validInt(p.stakeCents,CAP)&&G.LIBRARY.some(g=>g.id===p.game)).slice(0,20);
    }
    return out;
  }

  function cloneState(s){return JSON.parse(JSON.stringify(s));}

  function loadAccountsVault(){
    let raw=null;
    try{raw=JSON.parse(Storage.get(C.accountsKey));}catch(_){}
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
    const vault={};
    for(const [k,v] of Object.entries(raw)){
      if(!v||typeof v!=='object'||typeof v.username!=='string'||typeof v.salt!=='string'||typeof v.passwordHash!=='string')continue;
      const key=k.toLowerCase();
      vault[key]={
        username:v.username.slice(0,24),
        salt:v.salt,
        passwordHash:v.passwordHash,
        createdAt:typeof v.createdAt==='number'?v.createdAt:Date.now(),
        lastLoginAt:typeof v.lastLoginAt==='number'?v.lastLoginAt:Date.now(),
        state:sanitizeState(v.state,C.startingBalance*100,true)
      };
    }
    return vault;
  }

  function loadGuestFromStorage(){
    let data=null;
    try{data=JSON.parse(Storage.get(C.storageKey));}catch(_){}
    let legacy=Storage.get('gar_bal');
    legacy=legacy!==null&&legacy.trim()!==''?Number(legacy):C.startingBalance;
    const defaultCents=Number.isFinite(legacy)&&legacy>=0&&legacy<=C.maxBalance?Math.round(legacy*100):C.startingBalance*100;
    return sanitizeState(data,defaultCents,Storage.get('gar_snd')!=='off');
  }

  function loadCustomCodes(){
    let raw=null;
    try{raw=JSON.parse(Storage.get(C.customCodesKey));}catch(_){}
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
    const out={};
    for(const [k,v] of Object.entries(raw)){
      const key=String(k).trim().toUpperCase();
      if(!key||key===C.adminCode||Object.prototype.hasOwnProperty.call(C.redeemCodes,key))continue;
      if(v&&typeof v==='object'&&Number.isFinite(v.chips)&&v.chips>=1&&v.chips<=C.maxBalance){
        out[key]={chips:Math.round(v.chips*100)/100,message:typeof v.message==='string'&&v.message.trim()?v.message.slice(0,120):`Custom code redeemed! +${Number(v.chips).toLocaleString()} chips.`};
      }
    }
    return out;
  }

  const accountsVault=loadAccountsVault();
  let customCodes=loadCustomCodes();
  let activeAccountKey=String(Storage.get(C.activeAccountKey)||'').trim().toLowerCase();
  if(!Object.prototype.hasOwnProperty.call(accountsVault,activeAccountKey))activeAccountKey='';

  const active=new Map();
  let sequence=0,recovered=0;

  function recoverPending(s){
    let rec=0;
    for(const p of s.pending){
      const refund=Math.min(p.stakeCents,CAP-s.balanceCents);
      s.balanceCents+=refund;rec+=refund;s.stats.voids=Math.min(CAP,s.stats.voids+1);
    }
    s.pending=[];
    return rec;
  }

  const initialState=activeAccountKey?cloneState(accountsVault[activeAccountKey].state):loadGuestFromStorage();
  recovered=recoverPending(initialState);
  const state=initialState;

  function replaceLiveState(next){
    const rec=recoverPending(next);
    for(const k of Object.keys(state))delete state[k];
    Object.assign(state,next);
    return rec;
  }

  function saveVault(){
    Storage.set(C.accountsKey,JSON.stringify(accountsVault));
  }

  function save(){
    state.pending=[...active.values()].map(r=>({id:r.id,game:r.game,stakeCents:r.stakeCents}));
    const serialized=JSON.stringify(state);
    if(activeAccountKey&&accountsVault[activeAccountKey]){
      accountsVault[activeAccountKey].state=cloneState(state);
      saveVault();
      Storage.set(C.activeAccountKey,activeAccountKey);
    }else{
      Storage.set(C.guestKey,serialized);
    }
    Storage.set(C.storageKey,serialized);
    // Compatibility with the original stored balance, without rounding away fractions.
    Storage.set('gar_bal',String(state.balanceCents/100));
  }

  function checkAchievements({allIn=false,netCents=0,stakeCents=0}={}){
    const newly=[];
    const grantAch=id=>{if(knownAch.has(id)&&!state.achievements.includes(id)){state.achievements.push(id);newly.push(id);}};
    if(state.stats.resolved>=1)grantAch('first_play');
    if(state.stats.wins>=10)grantAch('ten_wins');
    if(allIn)grantAch('all_in');
    if(allIn&&netCents>0)grantAch('all_in_win');
    if(stakeCents>=10000*100)grantAch('high_roller');
    if(netCents>=50000*100)grantAch('big_score');
    if(state.balanceCents>=1000000*100)grantAch('millionaire');
    if(state.balanceCents>=1000000000*100)grantAch('billionaire');
    return newly;
  }

  function changed(){
    save();
    G.emit('wallet',Wallet.snapshot());
    if(activeAccountKey)G.emit('account',Accounts.current);
  }

  const defaultGame=()=>({luckEnabled:false,luck:1,reward:1,customReturn:null});
  const developer=Object.fromEntries(G.LIBRARY.map(g=>[g.id,defaultGame()]));
  let persistLocked=false;
  (function loadPersistedDev(){
    let saved=null;
    try{saved=JSON.parse(Storage.get(C.devLockKey));}catch(_){}
    if(saved&&saved.locked===true&&saved.games&&typeof saved.games==='object'){
      persistLocked=true;
      for(const g of G.LIBRARY){
        const s=saved.games[g.id];
        if(s&&typeof s.luckEnabled==='boolean'&&Number.isFinite(s.luck)&&s.luck>=1&&s.luck<=C.maxLuck&&Number.isFinite(s.reward)&&s.reward>=.1&&s.reward<=100&&(s.customReturn===null||(Number.isFinite(s.customReturn)&&s.customReturn>=.1&&s.customReturn<=10000))){
          developer[g.id]={luckEnabled:s.luckEnabled,luck:s.luck,reward:s.reward,customReturn:s.customReturn};
        }
      }
    }
  })();

  function syncPersistedDev(){
    if(persistLocked)Storage.set(C.devLockKey,JSON.stringify({locked:true,games:developer}));
    else Storage.remove(C.devLockKey);
  }

  const Dev={
    get persistLocked(){return persistLocked;},
    setPersistLock(on){
      persistLocked=!!on;
      syncPersistedDev();
      G.emit('developer',Dev.all());
      return persistLocked;
    },
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
      syncPersistedDev();
      G.emit('developer',Dev.all());return true;
    },
    reset(scope='all'){
      const ok=this.apply(scope,defaultGame());
      if(ok&&scope==='all'&&!this.anyModified()){persistLocked=false;syncPersistedDev();}
      return ok;
    },
    customCodes(){return Object.fromEntries(Object.entries(customCodes).map(([k,v])=>[k,{...v}]));},
    addPromoCode(code,chips,message=''){
      const key=String(code||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'');
      if(key.length<3||key.length>24)return {ok:false,message:'Code must be 3–24 letters or numbers.'};
      if(key===C.adminCode||Object.prototype.hasOwnProperty.call(C.redeemCodes,key))return {ok:false,message:'That code is reserved.'};
      const amt=Number(chips);
      if(!Number.isFinite(amt)||amt<1||amt>C.maxBalance)return {ok:false,message:'Enter a valid chip reward (1 to 9T).'};
      customCodes[key]={chips:Math.round(amt*100)/100,message:message.trim()||`Promo code ${key} redeemed! +${Math.round(amt).toLocaleString()} chips.`};
      Storage.set(C.customCodesKey,JSON.stringify(customCodes));
      G.emit('developer',Dev.all());
      return {ok:true,code:key,chips:customCodes[key].chips};
    },
    removePromoCode(code){
      const key=String(code||'').trim().toUpperCase();
      if(!Object.prototype.hasOwnProperty.call(customCodes,key))return false;
      delete customCodes[key];
      Storage.set(C.customCodesKey,JSON.stringify(customCodes));
      G.emit('developer',Dev.all());
      return true;
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

  function vipFor(wageredCents=state.stats.wageredCents){
    const wagered=wageredCents/100,tiers=C.vipTiers||[{id:'member',name:'Club Member',minWagered:0}];
    let idx=0;
    for(let i=0;i<tiers.length;i++)if(wagered>=tiers[i].minWagered)idx=i;
    const current=tiers[idx],next=tiers[idx+1]||null;
    const progress=next?Math.min(1,Math.max(0,(wagered-current.minWagered)/(next.minWagered-current.minWagered))):1;
    return {tier:current,next,progress,wagered,level:idx+1,maxLevel:tiers.length};
  }

  const Wallet={
    get balance(){return state.balanceCents/100;},
    get cents(){return state.balanceCents;},
    get prefs(){return {...state.prefs};},
    get stats(){return {...state.stats};},
    get achievements(){return [...state.achievements];},
    get vip(){return vipFor(state.stats.wageredCents);},
    get history(){return state.history.map(h=>({...h}));},
    get recovered(){return recovered/100;},
    get storageAvailable(){return Storage.available;},
    maxAffordableStake(){
      if(state.balanceCents<C.minStake*100)return 0;
      return Math.min(C.maxStake,state.balanceCents/100);
    },
    snapshot(){return {balance:this.balance,cents:this.cents,stats:this.stats,active:this.activeRounds(),prefs:this.prefs,achievements:this.achievements,vip:this.vip};},
    hasActive(){return active.size>0;},
    activeRounds(){return [...active.values()].map(r=>({id:r.id,game:r.game,stake:r.stakeCents/100,allIn:!!r.allIn}));},
    validStake(amount){return typeof amount==='number'&&Number.isFinite(amount)&&amount>=C.minStake&&amount<=C.maxStake&&Number.isSafeInteger(Math.round(amount*100));},
    begin(game,amount){
      if(!G.LIBRARY.some(g=>g.id===game)||!this.validStake(amount)){notice(`Stake must be ${C.minStake.toLocaleString()}–${C.maxStake.toLocaleString()} chips.`);return null;}
      const pending=[...active.values()].filter(r=>r.game===game).length;
      if(pending>=(game==='plinko'?C.maxPlinkoBalls:1)){notice('That game already has a round in progress.');return null;}
      const stakeCents=Math.round(amount*100);
      if(stakeCents>state.balanceCents){notice('Not enough chips for this stake.');return null;}
      const allIn=stakeCents===state.balanceCents&&stakeCents>=C.minStake*100;
      const settings=Dev.snapshot(game);
      const round={id:`${Date.now().toString(36)}-${++sequence}`,game,stakeCents,allIn,settings,status:'active',modified:(settings.luckEnabled&&settings.luck>1)||settings.reward!==1||settings.customReturn!==null};
      state.balanceCents-=stakeCents;
      state.stats.plays=Math.min(CAP,state.stats.plays+1);
      state.stats.wageredCents=Math.min(CAP,state.stats.wageredCents+stakeCents);
      active.set(round.id,round);changed();return round;
    },
    extend(round,amount){
      if(!round||active.get(round.id)!==round||round.status!=='active'||!this.validStake(amount))return false;
      const cents=Math.round(amount*100);
      if(cents>state.balanceCents||round.stakeCents+cents>C.maxStake*100){notice('Not enough chips or maximum total stake reached.');return false;}
      if(cents===state.balanceCents)round.allIn=true;
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
      if(netCents>0){st.wins=Math.min(CAP,st.wins+1);st.currentStreak=Math.min(CAP,(st.currentStreak||0)+1);st.bestStreak=Math.max(st.bestStreak||0,st.currentStreak);}
      else if(netCents<0){st.losses=Math.min(CAP,st.losses+1);st.currentStreak=0;}
      else st.pushes=Math.min(CAP,st.pushes+1);
      st.biggestWinCents=Math.max(st.biggestWinCents,netCents);
      st.returnedCents=Math.min(CAP,st.returnedCents+q.cents);
      const unlocked=checkAchievements({allIn:round.allIn,netCents,stakeCents:round.stakeCents});
      const record={id:round.id,game:round.game,stakeCents:round.stakeCents,returnCents:q.cents,netCents,allIn:!!round.allIn,modified:round.modified,at:Date.now(),reason:String(reason).slice(0,100)};
      state.history.unshift(record);state.history=state.history.slice(0,50);changed();
      unlocked.forEach(id=>{const meta=(C.achievements||[]).find(a=>a.id===id);if(meta)G.emit('achievement',meta);});
      const result={returned:q.amount,net:netCents/100,stake:round.stakeCents/100,allIn:!!round.allIn,capped:q.capped,multiplier:q.multiplier,record,unlocked};
      G.emit('settled',result);return result;
    },
    setBalance(amount){
      if(this.hasActive()){notice('Finish or collect your active rounds before changing the wallet.');return false;}
      if(typeof amount!=='number'||!Number.isFinite(amount)||amount<0||amount>C.maxBalance){notice('Enter a finite balance between 0 and 9 trillion chips.');return false;}
      state.balanceCents=Math.round(amount*100);
      const unlocked=checkAchievements();
      changed();
      unlocked.forEach(id=>{const meta=(C.achievements||[]).find(a=>a.id===id);if(meta)G.emit('achievement',meta);});
      return true;
    },
    grant(amount){
      if(this.hasActive()){notice('Finish your active rounds before claiming chips.');return null;}
      if(!Number.isFinite(amount)||amount<0||amount>C.maxBalance)return null;
      const cents=Math.min(Math.round(amount*100),CAP-state.balanceCents);
      state.balanceCents+=cents;
      const unlocked=checkAchievements();
      changed();
      unlocked.forEach(id=>{const meta=(C.achievements||[]).find(a=>a.id===id);if(meta)G.emit('achievement',meta);});
      return cents/100;
    },
    refill(){
      if(this.hasActive()||this.balance>=C.refillThreshold)return null;
      return this.grant(C.refillChips);
    },
    dailyStatus(now=Date.now()){
      const rewards=C.dailyRewards||[2500,5000,10000,20000,50000];
      const cooldown=24*60*60*1000,grace=48*60*60*1000;
      const last=state.daily?.lastClaim||0,elapsed=now-last;
      const eligible=last===0||elapsed>=cooldown;
      const nextStreak=last===0||elapsed>grace?1:(state.daily?.streak||0)+1;
      const amount=rewards[Math.min(rewards.length-1,nextStreak-1)];
      return {eligible,streak:state.daily?.streak||0,nextStreak,amount,msRemaining:eligible?0:Math.max(0,cooldown-elapsed)};
    },
    claimDaily(now=Date.now()){
      if(this.hasActive()){notice('Finish your active rounds before claiming daily chips.');return {ok:false,message:'Finish or collect your active rounds first.'};}
      const st=this.dailyStatus(now);
      if(!st.eligible){
        const hrs=Math.ceil(st.msRemaining/3600000);
        return {ok:false,message:`Next daily house gift ready in ~${hrs}h.`};
      }
      state.daily={lastClaim:now,streak:st.nextStreak};
      const granted=this.grant(st.amount);
      if(granted===null)return {ok:false,message:'Could not credit daily gift right now.'};
      return {ok:true,amount:granted,streak:st.nextStreak,message:`Day ${st.nextStreak} house gift: +${granted.toLocaleString()} chips!`};
    },
    redeem(code){
      if(this.hasActive()){notice('Finish your active rounds before redeeming a code.');return {ok:false,message:'Finish or collect your active rounds first.'};}
      const key=String(code).trim().toUpperCase();
      const reward=Object.prototype.hasOwnProperty.call(C.redeemCodes,key)?C.redeemCodes[key]:Object.prototype.hasOwnProperty.call(customCodes,key)?customCodes[key]:null;
      if(!reward)return {ok:false,message:'That code is not valid. Please try again.'};
      if(state.redeemed.includes(key))return {ok:false,message:'This code has already been redeemed on this profile.'};
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

  /* Local Player Account Vault — salted SHA-256 authentication & persistent per-user state */
  function validUsername(raw){
    const trimmed=String(raw||'').trim().replace(/\s+/g,' ');
    if(trimmed.length<2||trimmed.length>24)return null;
    if(!/^[A-Za-z0-9_.\- ]+$/.test(trimmed))return null;
    return trimmed;
  }

  const Accounts={
    get current(){
      if(activeAccountKey&&accountsVault[activeAccountKey]){
        const acc=accountsVault[activeAccountKey];
        return {loggedIn:true,username:acc.username,key:activeAccountKey,createdAt:acc.createdAt,lastLoginAt:acc.lastLoginAt,vip:Wallet.vip,achievements:Wallet.achievements};
      }
      return {loggedIn:false,username:'Guest',key:'',createdAt:null,lastLoginAt:null,vip:Wallet.vip,achievements:Wallet.achievements};
    },
    count(){return Object.keys(accountsVault).length;},
    listSummary(){
      return Object.entries(accountsVault).map(([key,acc])=>{
        const st=key===activeAccountKey?state:acc.state;
        return {
          key,
          username:acc.username,
          active:key===activeAccountKey,
          balance:st.balanceCents/100,
          plays:st.stats.plays,
          wins:st.stats.wins,
          vip:vipFor(st.stats.wageredCents).tier.name,
          createdAt:acc.createdAt,
          lastLoginAt:acc.lastLoginAt
        };
      }).sort((a,b)=>(b.active-a.active)||(b.balance-a.balance));
    },
    register(username,password,{transferGuest=true}={}){
      if(Wallet.hasActive())return {ok:false,message:'Finish or collect your active rounds before switching accounts.'};
      const cleanName=validUsername(username);
      if(!cleanName)return {ok:false,message:'Username must be 2–24 characters (letters, numbers, spaces, _ . -).'};
      if(typeof password!=='string'||password.length<4||password.length>128)return {ok:false,message:'Password must be at least 4 characters.'};
      const key=cleanName.toLowerCase();
      if(Object.prototype.hasOwnProperty.call(accountsVault,key))return {ok:false,message:'That username already exists here. Sign in with your password instead.'};
      if(activeAccountKey&&accountsVault[activeAccountKey])accountsVault[activeAccountKey].state=cloneState(state);
      const useGuest=!activeAccountKey&&transferGuest;
      const acctState=useGuest?cloneState(state):freshState(C.startingBalance*100,state.prefs.sound);
      acctState.prefs={...state.prefs};
      if(useGuest)Storage.set(C.guestKey,JSON.stringify(freshState(C.startingBalance*100,state.prefs.sound)));
      const salt=randomHex(16),now=Date.now();
      accountsVault[key]={username:cleanName,salt,passwordHash:hashPassword(password,salt),createdAt:now,lastLoginAt:now,state:acctState};
      activeAccountKey=key;
      Storage.set(C.activeAccountKey,key);
      replaceLiveState(cloneState(acctState));
      save();
      G.emit('preferences',Wallet.prefs);
      G.emit('wallet',Wallet.snapshot());
      G.emit('account',this.current);
      return {ok:true,username:cleanName,balance:Wallet.balance,message:`Account @${cleanName} created! Your ${Wallet.balance.toLocaleString()} chips are saved.`};
    },
    login(username,password){
      if(Wallet.hasActive())return {ok:false,message:'Finish or collect your active rounds before signing in.'};
      const cleanName=String(username||'').trim().replace(/\s+/g,' ');
      const key=cleanName.toLowerCase();
      if(!key||!Object.prototype.hasOwnProperty.call(accountsVault,key))return {ok:false,message:'Account not found on this browser. Check your username or create an account.'};
      const entry=accountsVault[key];
      if(typeof password!=='string'||hashPassword(password,entry.salt)!==entry.passwordHash)return {ok:false,message:'Incorrect password. Please try again.'};
      if(activeAccountKey&&accountsVault[activeAccountKey])accountsVault[activeAccountKey].state=cloneState(state);
      else Storage.set(C.guestKey,JSON.stringify(state));
      activeAccountKey=key;
      entry.lastLoginAt=Date.now();
      Storage.set(C.activeAccountKey,key);
      replaceLiveState(cloneState(entry.state));
      save();
      G.emit('preferences',Wallet.prefs);
      G.emit('wallet',Wallet.snapshot());
      G.emit('account',this.current);
      return {ok:true,username:entry.username,balance:Wallet.balance,message:`Welcome back, @${entry.username}! ${Wallet.balance.toLocaleString()} chips loaded.`};
    },
    logout(){
      if(Wallet.hasActive())return {ok:false,message:'Finish or collect your active rounds before signing out.'};
      if(!activeAccountKey)return {ok:false,message:'You are already playing as Guest.'};
      const prevName=accountsVault[activeAccountKey]?.username||'player';
      if(accountsVault[activeAccountKey])accountsVault[activeAccountKey].state=cloneState(state);
      saveVault();
      activeAccountKey='';
      Storage.set(C.activeAccountKey,'');
      let guestRaw=null;
      try{guestRaw=JSON.parse(Storage.get(C.guestKey));}catch(_){}
      replaceLiveState(sanitizeState(guestRaw,C.startingBalance*100,state.prefs.sound));
      save();
      G.emit('preferences',Wallet.prefs);
      G.emit('wallet',Wallet.snapshot());
      G.emit('account',this.current);
      return {ok:true,message:`Signed out of @${prevName}. Your chips remain safely saved in your account.`};
    },
    changePassword(currentPassword,newPassword){
      if(!activeAccountKey||!accountsVault[activeAccountKey])return {ok:false,message:'Sign in to an account first.'};
      const entry=accountsVault[activeAccountKey];
      if(typeof currentPassword!=='string'||hashPassword(currentPassword,entry.salt)!==entry.passwordHash)return {ok:false,message:'Current password is incorrect.'};
      if(typeof newPassword!=='string'||newPassword.length<4||newPassword.length>128)return {ok:false,message:'New password must be at least 4 characters.'};
      entry.salt=randomHex(16);
      entry.passwordHash=hashPassword(newPassword,entry.salt);
      saveVault();
      return {ok:true,message:'Password updated for @'+entry.username+'.'};
    },
    exportBackup(){
      if(!activeAccountKey||!accountsVault[activeAccountKey])return {ok:false,message:'Sign in to an account to export a backup key.'};
      if(Wallet.hasActive())return {ok:false,message:'Finish active rounds before exporting.'};
      const entry=accountsVault[activeAccountKey];
      const payload=JSON.stringify({v:1,u:entry.username,s:entry.salt,h:entry.passwordHash,c:entry.createdAt,st:state});
      const encoded=b64UrlEncode(payload);
      const tag=sha256('gar-backup-v1:'+encoded).slice(0,12);
      return {ok:true,code:`GAR1.${encoded}.${tag}`,username:entry.username};
    },
    importBackup(code){
      if(Wallet.hasActive())return {ok:false,message:'Finish or collect active rounds before importing an account.'};
      const parts=String(code||'').trim().split('.');
      if(parts.length!==3||parts[0]!=='GAR1')return {ok:false,message:'Invalid backup key format (expected GAR1...).'};
      const [,encoded,tag]=parts;
      if(sha256('gar-backup-v1:'+encoded).slice(0,12)!==tag)return {ok:false,message:'Backup key checksum failed. Check that the entire code was copied.'};
      let parsed=null;
      try{parsed=JSON.parse(b64UrlDecode(encoded));}catch(_){return {ok:false,message:'Backup key could not be decoded.'};}
      const cleanName=validUsername(parsed?.u);
      if(!cleanName||typeof parsed.s!=='string'||typeof parsed.h!=='string'||parsed.h.length!==64)return {ok:false,message:'Backup key metadata is invalid.'};
      if(activeAccountKey&&accountsVault[activeAccountKey])accountsVault[activeAccountKey].state=cloneState(state);
      else Storage.set(C.guestKey,JSON.stringify(state));
      const key=cleanName.toLowerCase(),restored=sanitizeState(parsed.st,C.startingBalance*100,true);
      accountsVault[key]={username:cleanName,salt:parsed.s,passwordHash:parsed.h,createdAt:typeof parsed.c==='number'?parsed.c:Date.now(),lastLoginAt:Date.now(),state:restored};
      activeAccountKey=key;
      Storage.set(C.activeAccountKey,key);
      replaceLiveState(cloneState(restored));
      save();
      G.emit('preferences',Wallet.prefs);
      G.emit('wallet',Wallet.snapshot());
      G.emit('account',this.current);
      return {ok:true,username:cleanName,balance:Wallet.balance,message:`Account @${cleanName} imported (${Wallet.balance.toLocaleString()} chips)!`};
    },
    adminGrantToAccount(key,amount){
      if(Wallet.hasActive())return {ok:false,message:'Finish active rounds first.'};
      const k=String(key||'').toLowerCase();
      if(!Object.prototype.hasOwnProperty.call(accountsVault,k))return {ok:false,message:'Account not found.'};
      if(!Number.isFinite(amount)||amount<=0||amount>C.maxBalance)return {ok:false,message:'Invalid grant amount.'};
      if(k===activeAccountKey){
        const granted=Wallet.grant(amount);
        return {ok:granted!==null,amount:granted,username:accountsVault[k].username};
      }
      const acc=accountsVault[k],cents=Math.min(Math.round(amount*100),CAP-acc.state.balanceCents);
      acc.state.balanceCents+=cents;
      saveVault();
      G.emit('account',this.current);
      return {ok:true,amount:cents/100,username:acc.username};
    },
    adminUnlockAllAchievements(){
      if(Wallet.hasActive())return false;
      state.achievements=(C.achievements||[]).map(a=>a.id);
      changed();
      return true;
    }
  };

  G.Crypto={sha256,hashPassword,b64UrlEncode,b64UrlDecode};
  G.Storage=Storage;G.Wallet=Wallet;G.Accounts=Accounts;G.Dev=Dev;G.Outcomes=Outcomes;
  save();
})(window.GAR);
