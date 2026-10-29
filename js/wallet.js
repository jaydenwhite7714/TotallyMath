/* Authoritative local ledger, pure-JS SHA-256 account vault, BigInt high-roller engine & live floor sync. */
(function (G) {
  'use strict';
  const C = G.CONFIG;

  /* ─── Pure-JS SHA-256 & Base64URL (works in HTTPS, file://, sandboxed iframes & Node VM) ─── */
  const K256 = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ]);
  function utf8Bytes(str){
    const s=String(str),out=[];
    for(let i=0;i<s.length;i++){
      let c=s.charCodeAt(i);
      if(c>=0xd800&&c<=0xdbff&&i+1<s.length){const c2=s.charCodeAt(i+1);if(c2>=0xdc00&&c2<=0xdfff){c=0x10000+((c-0xd800)<<10)+(c2-0xdc00);i++;}}
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
    const msg=utf8Bytes(input),bitLen=msg.length*8;
    msg.push(0x80);
    while(msg.length%64!==56)msg.push(0);
    const hi=Math.floor(bitLen/4294967296),lo=bitLen>>>0;
    msg.push((hi>>>24)&255,(hi>>>16)&255,(hi>>>8)&255,hi&255,(lo>>>24)&255,(lo>>>16)&255,(lo>>>8)&255,lo&255);
    const H=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
    const Wd=new Uint32Array(64);
    for(let off=0;off<msg.length;off+=64){
      for(let i=0;i<16;i++){const j=off+i*4;Wd[i]=((msg[j]<<24)|(msg[j+1]<<16)|(msg[j+2]<<8)|msg[j+3])>>>0;}
      for(let i=16;i<64;i++){
        const s0=rotr(Wd[i-15],7)^rotr(Wd[i-15],18)^(Wd[i-15]>>>3);
        const s1=rotr(Wd[i-2],17)^rotr(Wd[i-2],19)^(Wd[i-2]>>>10);
        Wd[i]=(Wd[i-16]+s0+Wd[i-7]+s1)>>>0;
      }
      let [a,b,c,d,e,f,g,h]=H;
      for(let i=0;i<64;i++){
        const S1=rotr(e,6)^rotr(e,11)^rotr(e,25),ch=(e&f)^((~e)&g),t1=(h+S1+ch+K256[i]+Wd[i])>>>0;
        const S0=rotr(a,2)^rotr(a,13)^rotr(a,22),maj=(a&b)^(a&c)^(b&c),t2=(S0+maj)>>>0;
        h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
      }
      H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;
      H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;
    }
    return Array.from(H,v=>v.toString(16).padStart(8,'0')).join('');
  }
  function hashPassword(password,salt,rounds=1200){
    let h=sha256(`gar-vault-v1:${salt}:${password}`);
    for(let i=0;i<rounds;i++)h=sha256(`${h}:${salt}:${i}`);
    return h;
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
    const clean=String(str).replace(/[^A-Za-z0-9\-_]/g,'');const out=[];
    for(let i=0;i<clean.length;i+=4){
      const c0=B64.indexOf(clean[i]),c1=B64.indexOf(clean[i+1]);
      const c2=i+2<clean.length?B64.indexOf(clean[i+2]):-1,c3=i+3<clean.length?B64.indexOf(clean[i+3]):-1;
      if(c0<0||c1<0)throw new Error('Invalid code');
      const n=(c0<<18)|(c1<<12)|((c2<0?0:c2)<<6)|(c3<0?0:c3);
      out.push((n>>16)&255);if(c2>=0)out.push((n>>8)&255);if(c3>=0)out.push(n&255);
    }
    return utf8Decode(out);
  }
  G.Crypto = Object.freeze({sha256, hashPassword, b64UrlEncode, b64UrlDecode});

  /* ─── BigInt Cent Helpers (exact up to 9 Septillion chips = 9e26 cents) ─── */
  function numToCentsBig(n){
    if(typeof n!=='number'||!Number.isFinite(n)||n<0)return null;
    if(n===0)return 0n;
    if(n<=9e12)return BigInt(Math.round(n*100));
    const [mant,expStr]=n.toExponential().split('e');
    const exp=Number(expStr),[whole,frac='']=mant.split('.');
    const digits=whole+frac,shift=exp+2-frac.length;
    if(shift>=0)return BigInt(digits+'0'.repeat(shift));
    const cut=digits.length+shift;
    if(cut<=0)return 0n;
    return BigInt(Math.round(Number(digits.slice(0,cut)+'.'+digits.slice(cut))));
  }
  const CAP_BIG = numToCentsBig(C.maxBalance);
  const STAKE_CAP_BIG = numToCentsBig(C.maxStake);
  const RETURN_CAP_BIG = numToCentsBig(C.maxReturn);
  const CAP_NUM = Number(CAP_BIG);
  const COUNT_CAP = 900000000000000;
  const bigToChips = b => Number(b/100n) + Number(b%100n)/100;

  function formatCentsExact(centsBig){
    const neg=centsBig<0n,abs=neg?-centsBig:centsBig;
    const whole=abs/100n,rem=Number(abs%100n);
    const wholeStr=whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');
    const fracStr=rem===0?'':rem%10===0?'.'+String(rem/10):'.'+String(rem).padStart(2,'0');
    return (neg?'−':'')+wholeStr+fracStr;
  }

  const SUFFIX_EXP={K:3,M:6,B:9,T:12,QA:15,QI:18,SX:21,SP:24};
  function parseChips(raw){
    if(typeof raw==='number')return Number.isFinite(raw)?raw:NaN;
    const s=String(raw??'').trim().replace(/,/g,'').replace(/\s+/g,'');
    if(!s)return NaN;
    const m=/^([+-]?\d*(?:\.\d+)?(?:e[+-]?\d+)?)([a-zA-Z]{0,2})$/.exec(s);
    if(!m||!m[1]||m[1]==='+'||m[1]==='-')return NaN;
    const base=Number(m[1]),suf=m[2].toUpperCase();
    if(!Number.isFinite(base))return NaN;
    if(!suf)return base;
    if(!Object.prototype.hasOwnProperty.call(SUFFIX_EXP,suf))return NaN;
    const exp=SUFFIX_EXP[suf];
    return /e/i.test(m[1])?base*(10**exp):Number(m[1]+'e'+exp);
  }
  G.parseChips = parseChips;
  G.formatCentsExact = formatCentsExact;

  /* ─── Event Bus ─── */
  const listeners = new Map();
  G.on=(e,f)=>{if(!listeners.has(e))listeners.set(e,new Set());listeners.get(e).add(f);};
  G.emit=(e,d)=>(listeners.get(e)||[]).forEach(f=>{try{f(d);}catch(_){}});
  const notice=m=>G.emit('wallet-error',m);

  /* ─── Resilient Storage ─── */
  const Storage={
    available:true,
    get(k){try{return globalThis.localStorage?.getItem(k)??null;}catch(_){this.available=false;return null;}},
    set(k,v){try{globalThis.localStorage?.setItem(k,v);return true;}catch(_){this.available=false;return false;}},
    remove(k){try{globalThis.localStorage?.removeItem(k);}catch(_){this.available=false;}}
  };
  try{const t='__gar_test__';globalThis.localStorage?.setItem(t,'1');globalThis.localStorage?.removeItem(t);}catch(_){Storage.available=false;}

  const defaultAvatar=()=>({preset:'highroller',hat:'tophat',accessory:'cape',face:'classic',hair:'none',skin:'#f0c79e',difficulty:'normal'});
  const freshStats=()=>({plays:0,resolved:0,wins:0,losses:0,pushes:0,voids:0,biggestWinCents:0,biggestWinBig:'0',wageredCents:0,wageredBig:'0',returnedCents:0,returnedBig:'0',currentStreak:0,bestStreak:0});
  const freshState=()=>({
    version:4,
    balanceCents:C.startingBalance*100,
    balanceBig:String(C.startingBalance*100),
    stats:freshStats(),
    prefs:{sound:true,reducedMotion:false,effects:true},
    redeemed:[],
    achievements:[],
    daily:{lastClaim:0,streak:0},
    avatar:defaultAvatar(),
    history:[],
    pending:[]
  });

  const knownAch=new Set((C.achievements||[]).map(a=>a.id));
  const knownPresets=new Set((C.characters||[]).map(c=>c.id));
  const knownHats=new Set((C.hats||[]).map(h=>h.id));
  const knownAccessories=new Set((C.accessories||[]).map(x=>x.id));
  const knownFaces=new Set((C.faces||[]).map(f=>f.id));
  const validBigStr=(s,max=CAP_BIG)=>typeof s==='string'&&/^\d{1,30}$/.test(s)&&BigInt(s)<=max?BigInt(s):null;

  function sanitizeAvatar(a){
    const d=defaultAvatar();
    if(!a||typeof a!=='object')return d;
    return {
      preset:knownPresets.has(a.preset)?a.preset:d.preset,
      hat:knownHats.has(a.hat)?a.hat:d.hat,
      accessory:knownAccessories.has(a.accessory)?a.accessory:d.accessory,
      face:knownFaces.has(a.face)?a.face:d.face,
      hair:['none','short','long','afro','mohawk'].includes(a.hair)?a.hair:d.hair,
      skin:typeof a.skin==='string'&&/^#[0-9a-fA-F]{6}$/.test(a.skin)?a.skin:d.skin,
      difficulty:['normal','hard','expert'].includes(a.difficulty)?a.difficulty:'normal'
    };
  }

  function sanitizeState(data){
    const out=freshState();
    if(!data||typeof data!=='object'||Array.isArray(data))return null;
    if((data.version!==3&&data.version!==4)||typeof data.balanceCents!=='number'||!Number.isFinite(data.balanceCents)||data.balanceCents<0||data.balanceCents>CAP_NUM)return null;
    const bigBal=validBigStr(data.balanceBig,CAP_BIG)??numToCentsBig(data.balanceCents/100);
    if(bigBal===null||bigBal<0n)return null;
    out.balanceBig=bigBal.toString();
    out.balanceCents=Number(bigBal);
    const numCount=(v,fb=0)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=COUNT_CAP?v:fb;
    const bigStat=(numVal,strVal)=>{
      const b=validBigStr(strVal,CAP_BIG);
      if(b!==null)return b;
      if(typeof numVal==='number'&&Number.isFinite(numVal)&&numVal>=0)return numToCentsBig(Math.min(C.maxBalance,numVal/100))??0n;
      return 0n;
    };
    const st=data.stats||{};
    const bigWin=bigStat(st.biggestWinCents,st.biggestWinBig);
    const bigWag=bigStat(st.wageredCents,st.wageredBig);
    const bigRet=bigStat(st.returnedCents,st.returnedBig);
    out.stats={
      plays:numCount(st.plays),resolved:numCount(st.resolved),wins:numCount(st.wins),
      losses:numCount(st.losses),pushes:numCount(st.pushes),voids:numCount(st.voids),
      biggestWinCents:Number(bigWin),biggestWinBig:bigWin.toString(),
      wageredCents:Number(bigWag),wageredBig:bigWag.toString(),
      returnedCents:Number(bigRet),returnedBig:bigRet.toString(),
      currentStreak:numCount(st.currentStreak),bestStreak:numCount(st.bestStreak)
    };
    if(data.prefs&&typeof data.prefs==='object'){
      for(const k of ['sound','reducedMotion','effects'])if(typeof data.prefs[k]==='boolean')out.prefs[k]=data.prefs[k];
    }
    out.redeemed=Array.isArray(data.redeemed)?[...new Set(data.redeemed.filter(x=>typeof x==='string'&&x.length<=40))]:[];
    out.achievements=Array.isArray(data.achievements)?[...new Set(data.achievements.filter(x=>typeof x==='string'&&knownAch.has(x)))]:[];
    if(data.daily&&typeof data.daily==='object'){
      out.daily={lastClaim:numCount(data.daily.lastClaim),streak:Math.min(365,numCount(data.daily.streak))};
    }
    out.avatar=sanitizeAvatar(data.avatar);
    out.history=Array.isArray(data.history)?data.history.filter(h=>h&&typeof h==='object'&&typeof h.game==='string'&&Number.isFinite(h.stakeCents)&&Number.isFinite(h.returnCents)).slice(0,50):[];
    out.pending=Array.isArray(data.pending)?data.pending.filter(p=>p&&typeof p.id==='string'&&G.LIBRARY.some(g=>g.id===p.game)&&((typeof p.stakeBig==='string'&&/^\d{1,30}$/.test(p.stakeBig)&&BigInt(p.stakeBig)>=BigInt(C.minStake*100)&&BigInt(p.stakeBig)<=STAKE_CAP_BIG)||(Number.isFinite(p.stakeCents)&&p.stakeCents>=C.minStake*100&&p.stakeCents<=Number(STAKE_CAP_BIG)))).slice(0,16):[];
    return out;
  }

  function cloneState(s){return JSON.parse(JSON.stringify(s));}

  function loadGuestFromStorage(){
    for(const key of [C.guestKey,C.storageKey]){
      const raw=Storage.get(key);
      if(!raw)continue;
      try{const clean=sanitizeState(JSON.parse(raw));if(clean)return clean;}catch(_){}
    }
    const base=freshState();
    const oldBal=Storage.get('gar_bal'),oldSnd=Storage.get('gar_snd');
    if(oldBal!==null){const n=Number(oldBal);if(Number.isFinite(n)&&n>=0&&n<=9e12){const b=numToCentsBig(n)??0n;base.balanceBig=b.toString();base.balanceCents=Number(b);}}
    if(oldSnd==='off')base.prefs.sound=false;
    return base;
  }

  function loadAccountsVault(){
    const raw=Storage.get(C.accountsKey);
    if(!raw)return {};
    try{
      const parsed=JSON.parse(raw);
      if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return {};
      const vault={};
      for(const [k,v] of Object.entries(parsed)){
        if(!v||typeof v!=='object'||typeof v.username!=='string'||typeof v.salt!=='string'||typeof v.hash!=='string')continue;
        const st=sanitizeState(v.state);
        if(!st)continue;
        vault[k.toLowerCase()]={username:v.username.slice(0,24),salt:v.salt,hash:v.hash,createdAt:Number(v.createdAt)||Date.now(),lastLoginAt:Number(v.lastLoginAt)||Date.now(),state:st};
      }
      return vault;
    }catch(_){return {};}
  }

  function loadCustomCodes(){
    const raw=Storage.get(C.customCodesKey);
    if(!raw)return {};
    try{
      const parsed=JSON.parse(raw);
      if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return {};
      const out={};
      for(const [k,v] of Object.entries(parsed)){
        const key=String(k).trim().toUpperCase();
        if(!key||key===C.adminCode||Object.prototype.hasOwnProperty.call(C.redeemCodes,key))continue;
        if(v&&typeof v==='object'&&Number.isFinite(v.chips)&&v.chips>=1&&v.chips<=C.maxBalance){
          out[key]={chips:v.chips,message:typeof v.message==='string'&&v.message.trim()?v.message.slice(0,120):`Custom code redeemed! +${Number(v.chips).toLocaleString()} chips.`};
        }
      }
      return out;
    }catch(_){return {};}
  }

  let accountsVault=loadAccountsVault();
  let customCodes=loadCustomCodes();
  let activeAccountKey=String(Storage.get(C.activeAccountKey)||'').trim().toLowerCase();
  if(!Object.prototype.hasOwnProperty.call(accountsVault,activeAccountKey))activeAccountKey='';

  const active=new Map();
  let sequence=0,recoveredBig=0n;
  const getBalBig=s=>validBigStr(s.balanceBig,CAP_BIG)??(numToCentsBig((s.balanceCents||0)/100)??0n);
  const setBalBig=(s,b)=>{const clamped=b<0n?0n:b>CAP_BIG?CAP_BIG:b;s.balanceBig=clamped.toString();s.balanceCents=Number(clamped);};

  function recoverPending(s){
    let rec=0n,bal=getBalBig(s);
    for(const p of s.pending){
      const pBig=validBigStr(p.stakeBig,STAKE_CAP_BIG)??(numToCentsBig((p.stakeCents||0)/100)??0n);
      const refund=pBig<CAP_BIG-bal?pBig:CAP_BIG-bal;
      bal+=refund;rec+=refund;s.stats.voids=Math.min(COUNT_CAP,s.stats.voids+1);
    }
    setBalBig(s,bal);
    s.pending=[];
    return rec;
  }

  const initialState=activeAccountKey?cloneState(accountsVault[activeAccountKey].state):loadGuestFromStorage();
  recoveredBig=recoverPending(initialState);
  const state=initialState;

  function replaceLiveState(next){
    const rec=recoverPending(next);
    for(const k of Object.keys(state))delete state[k];
    Object.assign(state,next);
    return rec;
  }

  function saveVault(){Storage.set(C.accountsKey,JSON.stringify(accountsVault));}

  function save(){
    state.pending=[...active.values()].map(r=>({id:r.id,game:r.game,stakeCents:Number(r.stakeBig),stakeBig:r.stakeBig.toString()}));
    if(activeAccountKey&&accountsVault[activeAccountKey]){
      accountsVault[activeAccountKey].state=cloneState(state);
      saveVault();
      Storage.set(C.activeAccountKey,activeAccountKey);
    }else{
      Storage.remove(C.activeAccountKey);
      Storage.set(C.guestKey,JSON.stringify(state));
    }
    Storage.set(C.storageKey,JSON.stringify(state));
    Storage.set('gar_bal',String(Number(getBalBig(state))/100));
    Storage.set('gar_snd',state.prefs.sound?'on':'off');
  }

  function checkAchievements(roundInfo){
    const newly=[],balBig=getBalBig(state);
    const grantAch=id=>{if(knownAch.has(id)&&!state.achievements.includes(id)){state.achievements.push(id);newly.push(id);}};
    if(state.stats.resolved>=1)grantAch('first_play');
    if(state.stats.wins>=10)grantAch('ten_wins');
    if(roundInfo?.allIn)grantAch('all_in');
    if(roundInfo?.allIn&&roundInfo.netBig>0n)grantAch('all_in_win');
    if(roundInfo&&roundInfo.stakeBig>=1000000n)grantAch('high_roller');
    if(roundInfo&&roundInfo.netBig>=5000000n)grantAch('big_score');
    if(balBig>=100000000n)grantAch('millionaire');
    if(balBig>=100000000000n)grantAch('billionaire');
    if(balBig>=1000000000000000n)grantAch('quadrillionaire');
    return newly;
  }

  save();

  /* ─── Developer / Executive Controls & Optional Reload Persistence Lock ─── */
  const defaultGame=()=>({luckEnabled:false,luck:1,reward:1,customReturn:null});
  const developer=Object.fromEntries(G.LIBRARY.map(g=>[g.id,defaultGame()]));
  let persistLocked=false;
  (function loadPersistedDev(){
    const raw=Storage.get(C.devLockKey);
    if(!raw)return;
    try{
      const d=JSON.parse(raw);
      if(!d||d.locked!==true||typeof d.games!=='object')return;
      persistLocked=true;
      for(const id of G.LIBRARY.map(g=>g.id)){
        const g=d.games[id];
        if(g&&typeof g.luckEnabled==='boolean'&&Number.isFinite(g.luck)&&g.luck>=1&&g.luck<=C.maxLuck&&Number.isFinite(g.reward)&&g.reward>=.1&&g.reward<=100&&(g.customReturn===null||(Number.isFinite(g.customReturn)&&g.customReturn>=.1&&g.customReturn<=10000))){
          developer[id]={luckEnabled:g.luckEnabled,luck:g.luck,reward:g.reward,customReturn:g.customReturn};
        }
      }
    }catch(_){}
  })();

  function syncPersistedDev(){
    if(persistLocked)Storage.set(C.devLockKey,JSON.stringify({locked:true,games:developer}));
    else Storage.remove(C.devLockKey);
  }

  const Dev={
    get persistLocked(){return persistLocked;},
    setPersistLock(on){persistLocked=!!on;syncPersistedDev();G.emit('developer',Dev.all());return persistLocked;},
    snapshot(game){return Object.freeze({...developer[game]||defaultGame()});},
    all(){return Object.fromEntries(Object.entries(developer).map(([k,v])=>[k,{...v}]));},
    anyModified(){return Object.values(developer).some(v=>(v.luckEnabled&&v.luck>1)||v.reward!==1||v.customReturn!==null);},
    apply(scope,patch){
      if(Wallet.hasActive()){notice('Finish or collect your active rounds before changing demo settings.');return false;}
      const ids=scope==='all'?G.LIBRARY.map(g=>g.id):[scope];
      if(ids.some(id=>!developer[id]))return false;
      for(const id of ids){
        const n={...developer[id],...patch};
        if(typeof n.luckEnabled!=='boolean'||!Number.isFinite(n.luck)||n.luck<1||n.luck>C.maxLuck||!Number.isFinite(n.reward)||n.reward<.1||n.reward<=0||n.reward>100||(n.customReturn!==null&&(!Number.isFinite(n.customReturn)||n.customReturn<.1||n.customReturn>10000))){notice('Use luck 1–10¹⁶, reward 0.1–100, and custom return 0.1–10,000.');return false;}
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
      const amt=typeof chips==='number'?chips:parseChips(chips);
      if(!Number.isFinite(amt)||amt<1||amt>C.maxBalance)return {ok:false,message:'Enter a valid chip reward (1 to 9Sp).'};
      customCodes[key]={chips:amt,message:message.trim()||`Promo code ${key} redeemed! +${amt.toLocaleString()} chips.`};
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

  function changed(){
    save();
    Floor.publish();
    G.emit('wallet',Wallet.snapshot());
  }

  const Wallet={
    get balance(){return bigToChips(getBalBig(state));},
    get balanceBig(){return getBalBig(state);},
    get exactText(){return formatCentsExact(getBalBig(state));},
    get cents(){return Number(getBalBig(state));},
    get prefs(){return {...state.prefs};},
    get avatar(){return sanitizeAvatar(state.avatar);},
    get stats(){return {...state.stats};},
    get achievements(){return [...state.achievements];},
    get vip(){return vipFor(state.stats.wageredCents);},
    get history(){return state.history.map(h=>({...h}));},
    get recovered(){return bigToChips(recoveredBig);},
    get storageAvailable(){return Storage.available;},
    maxAffordableStake(){
      const bal=getBalBig(state);
      if(bal<BigInt(C.minStake*100))return 0;
      const maxS=bal<STAKE_CAP_BIG?bal:STAKE_CAP_BIG;
      return bigToChips(maxS);
    },
    snapshot(){return {balance:this.balance,balanceBig:this.balanceBig,exactText:this.exactText,cents:this.cents,stats:this.stats,active:this.activeRounds(),prefs:this.prefs,avatar:this.avatar,achievements:this.achievements,vip:this.vip};},
    hasActive(){return active.size>0;},
    activeRounds(){return [...active.values()].map(r=>({id:r.id,game:r.game,stake:Number(r.stakeBig)/100,allIn:!!r.allIn}));},
    validStake(amount){
      if(typeof amount!=='number'||!Number.isFinite(amount)||amount<C.minStake||amount>C.maxStake)return false;
      const b=numToCentsBig(amount);
      return b!==null&&b>=BigInt(C.minStake*100)&&b<=STAKE_CAP_BIG;
    },
    begin(game,amount){
      if(!G.LIBRARY.some(g=>g.id===game)||!this.validStake(amount)){notice(`Stake must be ${C.minStake.toLocaleString()}–9 Septillion chips.`);return null;}
      const pending=[...active.values()].filter(r=>r.game===game).length;
      if(pending>=(game==='plinko'?C.maxPlinkoBalls:1)){notice('That game already has a round in progress.');return null;}
      const bal=getBalBig(state);
      let stakeBig=numToCentsBig(amount);
      // Float representation near All-In at high magnitudes snaps cleanly to exact balance when within 0.0001%.
      if(stakeBig>bal&&bal>0n&&(stakeBig-bal)*1000000n<=bal)stakeBig=bal;
      if(stakeBig>bal){notice('Not enough chips for this stake.');return null;}
      const allIn=(stakeBig===bal||(bal-stakeBig)*100000n<=bal)&&stakeBig>=BigInt(C.minStake*100);
      if(allIn&&stakeBig>bal)stakeBig=bal;
      const settings=Dev.snapshot(game);
      const round={id:`${Date.now().toString(36)}-${++sequence}`,game,stakeBig,stakeCents:Number(stakeBig),allIn,settings,status:'active',modified:(settings.luckEnabled&&settings.luck>1)||settings.reward!==1||settings.customReturn!==null};
      setBalBig(state,bal-stakeBig);
      state.stats.plays=Math.min(COUNT_CAP,state.stats.plays+1);
      const nextWag=validBigStr(state.stats.wageredBig,CAP_BIG)??0n;
      const sumWag=nextWag+stakeBig>CAP_BIG?CAP_BIG:nextWag+stakeBig;
      state.stats.wageredBig=sumWag.toString();state.stats.wageredCents=Number(sumWag);
      active.set(round.id,round);changed();return round;
    },
    extend(round,amount){
      if(!round||active.get(round.id)!==round||round.status!=='active'||!this.validStake(amount))return false;
      const bal=getBalBig(state),centsBig=numToCentsBig(amount);
      if(centsBig===null||centsBig>bal||round.stakeBig+centsBig>STAKE_CAP_BIG){notice('Not enough chips or maximum total stake reached.');return false;}
      if(centsBig===bal)round.allIn=true;
      setBalBig(state,bal-centsBig);
      round.stakeBig+=centsBig;round.stakeCents=Number(round.stakeBig);
      const nextWag=(validBigStr(state.stats.wageredBig,CAP_BIG)??0n)+centsBig;
      const clampedWag=nextWag>CAP_BIG?CAP_BIG:nextWag;
      state.stats.wageredBig=clampedWag.toString();state.stats.wageredCents=Number(clampedWag);
      changed();return true;
    },
    quote(round,multiplier,{refund=false}={}){
      if(!round||!Number.isFinite(multiplier)||multiplier<0)return {amount:0,cents:0,centsBig:0n,multiplier:0,capped:false};
      const effective=effectiveMultiplier(round,multiplier,refund);
      const sBig=typeof round.stakeBig==='bigint'?round.stakeBig:(numToCentsBig((round.stakeCents||0)/100)??0n);
      const rawBig=G.Rules.returnCentsBig(sBig,effective,RETURN_CAP_BIG);
      const headroomBig=typeof round.previewHeadroomBig==='bigint'?round.previewHeadroomBig:(CAP_BIG-getBalBig(state));
      const centsBig=rawBig<headroomBig?rawBig:headroomBig;
      const uncappedBig=G.Rules.returnCentsBig(sBig,effective,CAP_BIG*1000000n);
      return {amount:bigToChips(centsBig),cents:Number(centsBig),centsBig,multiplier:effective,capped:rawBig!==uncappedBig||centsBig!==rawBig};
    },
    preview(game,stake,multiplier,opts={}){
      const valid=this.validStake(stake),sBig=valid?numToCentsBig(stake):0n,bal=getBalBig(state);
      const commit=sBig<bal?sBig:bal;
      const round={stakeBig:sBig,stakeCents:Number(sBig),settings:Dev.snapshot(game),previewHeadroomBig:CAP_BIG-bal+commit>CAP_BIG?CAP_BIG:CAP_BIG-bal+commit};
      return this.quote(round,multiplier,opts);
    },
    settle(round,multiplier,{refund=false,reason=''}={}){
      if(!round||active.get(round.id)!==round||round.status!=='active')return null;
      if(!Number.isFinite(multiplier)||multiplier<0){notice('Invalid return blocked. The round remains available.');return null;}
      const q=this.quote(round,multiplier,{refund});
      round.status='settled';active.delete(round.id);
      setBalBig(state,getBalBig(state)+q.centsBig);
      const netBig=q.centsBig-round.stakeBig,netNum=Number(netBig);
      const st=state.stats;st.resolved=Math.min(COUNT_CAP,st.resolved+1);
      if(netBig>0n){st.wins=Math.min(COUNT_CAP,st.wins+1);st.currentStreak=Math.min(COUNT_CAP,(st.currentStreak||0)+1);st.bestStreak=Math.max(st.bestStreak||0,st.currentStreak);}
      else if(netBig<0n){st.losses=Math.min(COUNT_CAP,st.losses+1);st.currentStreak=0;}
      else st.pushes=Math.min(COUNT_CAP,st.pushes+1);
      const prevBigWin=validBigStr(st.biggestWinBig,CAP_BIG)??0n;
      if(netBig>prevBigWin){st.biggestWinBig=netBig.toString();st.biggestWinCents=Number(netBig);}
      const prevRet=validBigStr(st.returnedBig,CAP_BIG)??0n;
      const nextRet=prevRet+q.centsBig>CAP_BIG?CAP_BIG:prevRet+q.centsBig;
      st.returnedBig=nextRet.toString();st.returnedCents=Number(nextRet);
      const unlocked=checkAchievements({allIn:round.allIn,netBig,stakeBig:round.stakeBig});
      const record={id:round.id,game:round.game,stakeCents:Number(round.stakeBig),returnCents:q.cents,netCents:netNum,allIn:!!round.allIn,modified:round.modified,at:Date.now(),reason:String(reason).slice(0,100)};
      state.history.unshift(record);state.history=state.history.slice(0,50);changed();
      unlocked.forEach(id=>{const meta=(C.achievements||[]).find(a=>a.id===id);if(meta)G.emit('achievement',meta);});
      const result={returned:q.amount,net:bigToChips(netBig),stake:bigToChips(round.stakeBig),allIn:!!round.allIn,capped:q.capped,multiplier:q.multiplier,record,unlocked};
      G.emit('settled',result);return result;
    },
    setBalance(amount){
      if(this.hasActive()){notice('Finish or collect your active rounds before changing the wallet.');return false;}
      if(typeof amount!=='number'||!Number.isFinite(amount)||amount<0||amount>C.maxBalance){notice('Enter a finite balance between 0 and 9 Septillion chips.');return false;}
      setBalBig(state,numToCentsBig(amount));
      const unlocked=checkAchievements(null);
      changed();
      unlocked.forEach(id=>{const meta=(C.achievements||[]).find(a=>a.id===id);if(meta)G.emit('achievement',meta);});
      return true;
    },
    grant(amount){
      if(this.hasActive()){notice('Finish or collect your active rounds before adding chips.');return null;}
      if(typeof amount!=='number'||!Number.isFinite(amount)||amount<=0||amount>C.maxBalance){notice('Enter a positive chip amount.');return null;}
      const bal=getBalBig(state),req=numToCentsBig(amount);
      const add=req<CAP_BIG-bal?req:CAP_BIG-bal;
      setBalBig(state,bal+add);
      const unlocked=checkAchievements(null);
      changed();
      unlocked.forEach(id=>{const meta=(C.achievements||[]).find(a=>a.id===id);if(meta)G.emit('achievement',meta);});
      return bigToChips(add);
    },
    deduct(amount){
      if(this.hasActive()){notice('Finish or collect your active rounds before removing chips.');return null;}
      if(typeof amount!=='number'||!Number.isFinite(amount)||amount<=0)return null;
      const bal=getBalBig(state),req=numToCentsBig(Math.min(C.maxBalance,amount))??bal;
      const sub=req<bal?req:bal;
      setBalBig(state,bal-sub);
      changed();
      return bigToChips(sub);
    },
    setAvatar(patch){
      state.avatar=sanitizeAvatar({...state.avatar,...(patch||{})});
      changed();
      G.emit('avatar',this.avatar);
      return this.avatar;
    },
    unlockAchievement(id){
      if(!knownAch.has(id)||state.achievements.includes(id))return false;
      state.achievements.push(id);changed();
      const meta=(C.achievements||[]).find(a=>a.id===id);
      if(meta)G.emit('achievement',meta);
      return true;
    },
    refill(){
      if(this.hasActive())return null;
      if(getBalBig(state)>=BigInt(C.refillThreshold*100))return null;
      return this.grant(C.refillChips);
    },
    dailyStatus(now=Date.now()){
      const cooldown=86400000,grace=172800000;
      const last=state.daily?.lastClaim||0,elapsed=now-last;
      const eligible=last===0||elapsed>=cooldown;
      const rewards=C.dailyRewards||[2500,5000,10000,20000,50000];
      const nextStreak=last===0||elapsed>grace?1:(state.daily?.streak||0)+1;
      const amount=rewards[Math.min(rewards.length-1,nextStreak-1)];
      return {eligible,streak:state.daily?.streak||0,nextStreak,amount,msRemaining:eligible?0:Math.max(0,cooldown-elapsed)};
    },
    claimDaily(now=Date.now()){
      if(this.hasActive()){notice('Finish your active rounds before claiming daily chips.');return {ok:false,message:'Finish or collect your active rounds first.'};}
      const st=this.dailyStatus(now);
      if(!st.eligible){const hrs=Math.ceil(st.msRemaining/3600000);return {ok:false,message:`Next daily house gift ready in ~${hrs}h.`};}
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

  /* ─── Live Floor Presence, Real-Time Leaderboard & Cross-Tab Sync ─── */
  const sessionId = `${Date.now().toString(36)}-${Math.floor(G.RNG.unit()*1e6).toString(36)}`;
  let worldPos = {x:0, z:18, view:'lobby'};
  let bc = null;
  try{if(typeof globalThis.BroadcastChannel==='function')bc=new BroadcastChannel(C.channelName||'gar_live_floor_v1');}catch(_){bc=null;}

  function loadPresenceMap(){
    const raw=Storage.get(C.presenceKey);
    if(!raw)return {};
    try{
      const parsed=JSON.parse(raw),now=Date.now(),out={};
      if(!parsed||typeof parsed!=='object')return {};
      for(const [sid,entry] of Object.entries(parsed)){
        if(entry&&typeof entry==='object'&&now-(Number(entry.ts)||0)<45000)out[sid]=entry;
      }
      return out;
    }catch(_){return {};}
  }

  function reloadFromStorageIfTarget(targetKey){
    if(Wallet.hasActive())return;
    accountsVault=loadAccountsVault();
    const myKey=activeAccountKey||'__guest__';
    if(targetKey&&targetKey!==myKey)return;
    const fresh=activeAccountKey&&accountsVault[activeAccountKey]?cloneState(accountsVault[activeAccountKey].state):loadGuestFromStorage();
    replaceLiveState(fresh);
    G.emit('wallet',Wallet.snapshot());
    G.emit('account',Accounts.current);
    G.emit('floor',Floor.leaderboard());
  }

  if(bc){
    bc.onmessage=ev=>{
      const msg=ev?.data;if(!msg||typeof msg!=='object')return;
      if(msg.type==='admin-sync')reloadFromStorageIfTarget(msg.targetKey);
      G.emit('floor',Floor.leaderboard());
    };
  }
  try{
    if(typeof globalThis.addEventListener==='function'){
      globalThis.addEventListener('storage',ev=>{
        if(!ev)return;
        if(ev.key===C.accountsKey||ev.key===C.guestKey||ev.key===C.storageKey)reloadFromStorageIfTarget(null);
        if(ev.key===C.presenceKey||ev.key===C.accountsKey)G.emit('floor',Floor.leaderboard());
      });
    }
  }catch(_){}

  const Floor={
    get sessionId(){return sessionId;},
    setWorldPos(x,z,view){
      if(Number.isFinite(x))worldPos.x=Math.round(x*10)/10;
      if(Number.isFinite(z))worldPos.z=Math.round(z*10)/10;
      if(view)worldPos.view=String(view);
      this.publish();
    },
    publish(){
      const map=loadPresenceMap();
      const curKey=activeAccountKey||'__guest__';
      const username=activeAccountKey&&accountsVault[activeAccountKey]?accountsVault[activeAccountKey].username:'Guest';
      map[sessionId]={
        sid:sessionId,
        key:curKey,
        username,
        loggedIn:!!activeAccountKey,
        balance:Wallet.balance,
        balanceBig:getBalBig(state).toString(),
        exactText:Wallet.exactText,
        biggestWin:(validBigStr(state.stats.biggestWinBig,CAP_BIG)??0n).toString(),
        wins:state.stats.wins||0,
        plays:state.stats.plays||0,
        vip:Wallet.vip.tier.name,
        avatar:Wallet.avatar,
        view:G.currentView||worldPos.view||'lobby',
        x:worldPos.x,
        z:worldPos.z,
        ts:Date.now()
      };
      Storage.set(C.presenceKey,JSON.stringify(map));
      try{bc?.postMessage({type:'presence',sid:sessionId});}catch(_){}
    },
    onlineSessions(){
      const map=loadPresenceMap();
      if(!map[sessionId]){
        const curKey=activeAccountKey||'__guest__';
        const username=activeAccountKey&&accountsVault[activeAccountKey]?accountsVault[activeAccountKey].username:'Guest';
        map[sessionId]={sid:sessionId,key:curKey,username,loggedIn:!!activeAccountKey,balance:Wallet.balance,avatar:Wallet.avatar,view:G.currentView||worldPos.view||'lobby',x:worldPos.x,z:worldPos.z,ts:Date.now()};
      }
      return Object.values(map).sort((a,b)=>b.ts-a.ts);
    },
    leaderboard(sortBy='balance'){
      accountsVault=loadAccountsVault();
      const presence=Object.values(loadPresenceMap());
      const rows=new Map();
      // 1. All registered accounts
      for(const [k,v] of Object.entries(accountsVault)){
        const isCurrent=activeAccountKey===k;
        const st=isCurrent?state:v.state;
        const balBig=getBalBig(st);
        const bigWin=validBigStr(st.stats?.biggestWinBig,CAP_BIG)??0n;
        const onlineHit=presence.find(p=>p.key===k);
        rows.set(k,{
          key:k,
          username:v.username,
          isGuest:false,
          activeHere:isCurrent,
          online:isCurrent||!!onlineHit,
          location:isCurrent?(G.currentView||'lobby'):(onlineHit?.view||'offline'),
          x:onlineHit?.x??0,
          z:onlineHit?.z??16,
          vip:vipFor(st.stats?.wageredCents||0).tier.name,
          avatar:sanitizeAvatar(st.avatar),
          balance:bigToChips(balBig),
          balanceBig:balBig,
          exactText:formatCentsExact(balBig),
          biggestWin:bigToChips(bigWin),
          biggestWinBig:bigWin,
          wins:st.stats?.wins||0,
          plays:st.stats?.plays||0
        });
      }
      // 2. Guest profile (always visible so everybody on the site appears!)
      const guestState=!activeAccountKey?state:loadGuestFromStorage();
      const gBal=getBalBig(guestState);
      const gWin=validBigStr(guestState.stats?.biggestWinBig,CAP_BIG)??0n;
      const guestOnline=!activeAccountKey||presence.some(p=>p.key==='__guest__');
      const guestPres=presence.find(p=>p.key==='__guest__');
      rows.set('__guest__',{
        key:'__guest__',
        username:'Guest Player',
        isGuest:true,
        activeHere:!activeAccountKey,
        online:guestOnline,
        location:!activeAccountKey?(G.currentView||'lobby'):(guestPres?.view||'lobby'),
        x:guestPres?.x??0,
        z:guestPres?.z??18,
        vip:vipFor(guestState.stats?.wageredCents||0).tier.name,
        avatar:sanitizeAvatar(guestState.avatar),
        balance:bigToChips(gBal),
        balanceBig:gBal,
        exactText:formatCentsExact(gBal),
        biggestWin:bigToChips(gWin),
        biggestWinBig:gWin,
        wins:guestState.stats?.wins||0,
        plays:guestState.stats?.plays||0
      });
      const list=[...rows.values()];
      list.sort((a,b)=>{
        if(sortBy==='biggest'){if(b.biggestWinBig!==a.biggestWinBig)return b.biggestWinBig>a.biggestWinBig?1:-1;}
        else if(sortBy==='wins'){if(b.wins!==a.wins)return b.wins-a.wins;}
        if(b.balanceBig!==a.balanceBig)return b.balanceBig>a.balanceBig?1:-1;
        return b.plays-a.plays;
      });
      return list.map((item,idx)=>({...item,rank:idx+1}));
    }
  };

  /* ─── Local Player Account Vault & Executive Player Moderation ─── */
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
        return {loggedIn:true,username:acc.username,key:activeAccountKey,createdAt:acc.createdAt,lastLoginAt:acc.lastLoginAt,vip:Wallet.vip,avatar:Wallet.avatar,achievements:Wallet.achievements};
      }
      return {loggedIn:false,username:'Guest',key:'',createdAt:null,lastLoginAt:null,vip:Wallet.vip,avatar:Wallet.avatar,achievements:Wallet.achievements};
    },
    count(){return Object.keys(accountsVault).length;},
    listSummary(){
      return Floor.leaderboard('balance');
    },
    register(usernameRaw,password,adoptGuest=true){
      if(Wallet.hasActive())return {ok:false,message:'Finish or collect your active rounds before switching accounts.'};
      const username=validUsername(usernameRaw);
      if(!username)return {ok:false,message:'Username must be 2–24 characters (letters, numbers, spaces, _ . -).'};
      const key=username.toLowerCase();
      if(key==='__guest__'||key==='guest')return {ok:false,message:'That name is reserved for Guest mode.'};
      accountsVault=loadAccountsVault();
      if(Object.prototype.hasOwnProperty.call(accountsVault,key))return {ok:false,message:'That username is already taken. Sign in instead.'};
      const pass=String(password||'');
      if(pass.length<4||pass.length>128)return {ok:false,message:'Password must be at least 4 characters.'};
      const salt=sha256(`${Date.now()}:${G.RNG.unit()}:${key}`).slice(0,24);
      const hash=hashPassword(pass,salt);
      const initial=!activeAccountKey&&adoptGuest?cloneState(state):freshState();
      if(!activeAccountKey&&adoptGuest){Storage.set(C.guestKey,JSON.stringify(freshState()));}
      const now=Date.now();
      accountsVault[key]={username,salt,hash,createdAt:now,lastLoginAt:now,state:initial};
      activeAccountKey=key;
      replaceLiveState(cloneState(initial));
      checkAchievements(null);
      save();Floor.publish();
      G.emit('account',this.current);
      G.emit('preferences',Wallet.prefs);
      G.emit('avatar',Wallet.avatar);
      G.emit('wallet',Wallet.snapshot());
      G.emit('floor',Floor.leaderboard());
      return {ok:true,username,message:`Account "${username}" created and signed in!`};
    },
    login(usernameRaw,password){
      if(Wallet.hasActive())return {ok:false,message:'Finish or collect your active rounds before switching accounts.'};
      const key=String(usernameRaw||'').trim().replace(/\s+/g,' ').toLowerCase();
      accountsVault=loadAccountsVault();
      const acc=accountsVault[key];
      if(!acc)return {ok:false,message:'No account found with that username.'};
      const hash=hashPassword(String(password||''),acc.salt);
      if(hash!==acc.hash)return {ok:false,message:'Incorrect password. Please try again.'};
      if(!activeAccountKey){Storage.set(C.guestKey,JSON.stringify(state));}
      activeAccountKey=key;
      acc.lastLoginAt=Date.now();
      const rec=replaceLiveState(cloneState(acc.state));
      checkAchievements(null);
      save();Floor.publish();
      G.emit('account',this.current);
      G.emit('preferences',Wallet.prefs);
      G.emit('avatar',Wallet.avatar);
      G.emit('wallet',Wallet.snapshot());
      G.emit('floor',Floor.leaderboard());
      return {ok:true,username:acc.username,recovered:Number(rec)/100,message:`Welcome back, ${acc.username}!`};
    },
    logout(){
      if(Wallet.hasActive())return {ok:false,message:'Finish or collect your active rounds before signing out.'};
      if(!activeAccountKey)return {ok:false,message:'Already playing as Guest.'};
      save();
      const prev=accountsVault[activeAccountKey]?.username||'Account';
      activeAccountKey='';
      Storage.remove(C.activeAccountKey);
      const guestRaw=Storage.get(C.guestKey);
      let guest=null;
      if(guestRaw){try{guest=sanitizeState(JSON.parse(guestRaw));}catch(_){}}
      replaceLiveState(guest||freshState());
      save();Floor.publish();
      G.emit('account',this.current);
      G.emit('preferences',Wallet.prefs);
      G.emit('avatar',Wallet.avatar);
      G.emit('wallet',Wallet.snapshot());
      G.emit('floor',Floor.leaderboard());
      return {ok:true,message:`Signed out of ${prev}. Your progress is safely saved.`};
    },
    changePassword(currentPass,newPass){
      if(!activeAccountKey||!accountsVault[activeAccountKey])return {ok:false,message:'Sign in to an account first.'};
      const acc=accountsVault[activeAccountKey];
      if(hashPassword(String(currentPass||''),acc.salt)!==acc.hash)return {ok:false,message:'Current password is incorrect.'};
      const np=String(newPass||'');
      if(np.length<4||np.length>128)return {ok:false,message:'New password must be at least 4 characters.'};
      acc.salt=sha256(`${Date.now()}:${G.RNG.unit()}:${activeAccountKey}`).slice(0,24);
      acc.hash=hashPassword(np,acc.salt);
      saveVault();
      return {ok:true,message:'Password updated.'};
    },
    exportBackup(){
      if(!activeAccountKey||!accountsVault[activeAccountKey])return {ok:false,message:'Sign in to export an account backup.'};
      save();
      const acc=accountsVault[activeAccountKey];
      const payload=JSON.stringify({garBackup:1,account:{username:acc.username,salt:acc.salt,hash:acc.hash,createdAt:acc.createdAt,state:acc.state}});
      const sig=sha256(`gar-backup-integrity:${payload}`).slice(0,16);
      return {ok:true,code:`GAR1.${sig}.${b64UrlEncode(payload)}`};
    },
    importBackup(codeRaw){
      if(Wallet.hasActive())return {ok:false,message:'Finish or collect your active rounds first.'};
      const parts=String(codeRaw||'').trim().split('.');
      if(parts.length!==3||parts[0]!=='GAR1')return {ok:false,message:'Invalid backup code format.'};
      try{
        const json=b64UrlDecode(parts[2]);
        if(sha256(`gar-backup-integrity:${json}`).slice(0,16)!==parts[1])return {ok:false,message:'Backup code checksum mismatch.'};
        const data=JSON.parse(json);
        if(!data||data.garBackup!==1||!data.account)return {ok:false,message:'Unsupported backup version.'};
        const a=data.account,username=validUsername(a.username);
        const st=sanitizeState(a.state);
        if(!username||!st||typeof a.salt!=='string'||typeof a.hash!=='string')return {ok:false,message:'Corrupted account payload.'};
        const key=username.toLowerCase();
        accountsVault=loadAccountsVault();
        accountsVault[key]={username,salt:a.salt,hash:a.hash,createdAt:Number(a.createdAt)||Date.now(),lastLoginAt:Date.now(),state:st};
        activeAccountKey=key;
        replaceLiveState(cloneState(st));
        save();Floor.publish();
        G.emit('account',this.current);
        G.emit('preferences',Wallet.prefs);
        G.emit('avatar',Wallet.avatar);
        G.emit('wallet',Wallet.snapshot());
        G.emit('floor',Floor.leaderboard());
        return {ok:true,username,message:`Imported and signed into "${username}"!`};
      }catch(_){return {ok:false,message:'Could not decode backup key.'};}
    },
    adminModifyPlayer(targetKeyRaw,mode,amountRaw=0){
      const key=String(targetKeyRaw||'').toLowerCase();
      accountsVault=loadAccountsVault();
      const isGuest=key==='__guest__';
      if(!isGuest&&!accountsVault[key])return {ok:false,message:'Player profile not found.'};
      const isActiveHere=(isGuest&&!activeAccountKey)||(!isGuest&&activeAccountKey===key);
      if(isActiveHere&&Wallet.hasActive())return {ok:false,message:'Finish active rounds before modifying the active player.'};
      const amtNum=typeof amountRaw==='number'?amountRaw:parseChips(amountRaw);
      if(['add','remove','set'].includes(mode)&&(!Number.isFinite(amtNum)||amtNum<0||amtNum>C.maxBalance)){
        return {ok:false,message:'Enter a valid amount (0 to 9Sp, e.g. 500M, 10T, 5Qa).'};
      }
      const amtBig=['add','remove','set'].includes(mode)?(numToCentsBig(amtNum)??0n):0n;
      const targetState=isActiveHere?state:isGuest?loadGuestFromStorage():accountsVault[key].state;
      const curBig=getBalBig(targetState);
      let nextBig=curBig;
      if(mode==='add')nextBig=curBig+amtBig>CAP_BIG?CAP_BIG:curBig+amtBig;
      else if(mode==='remove')nextBig=amtBig>=curBig?0n:curBig-amtBig;
      else if(mode==='half')nextBig=curBig/2n;
      else if(mode==='wipe')nextBig=0n;
      else if(mode==='set')nextBig=amtBig>CAP_BIG?CAP_BIG:amtBig;
      else return {ok:false,message:'Unknown balance operation.'};
      setBalBig(targetState,nextBig);
      const username=isGuest?'Guest Player':accountsVault[key].username;
      if(isActiveHere){
        checkAchievements(null);
        changed();
      }else if(isGuest){
        Storage.set(C.guestKey,JSON.stringify(targetState));
      }else{
        accountsVault[key].state=targetState;
        saveVault();
      }
      try{bc?.postMessage({type:'admin-sync',targetKey:key});}catch(_){}
      G.emit('account',this.current);
      G.emit('floor',Floor.leaderboard());
      return {ok:true,username,balance:bigToChips(nextBig),exactText:formatCentsExact(nextBig),delta:Number(nextBig-curBig)/100};
    },
    adminGrantToAccount(key,amount){
      const res=this.adminModifyPlayer(key,'add',amount);
      return res.ok?{...res,amount:Number(amount)}:{ok:false,message:res.message};
    },
    adminUnlockAllAchievements(){
      if(Wallet.hasActive())return false;
      state.achievements=(C.achievements||[]).map(a=>a.id);
      changed();
      return true;
    }
  };

  Floor.publish();
  G.Dev=Dev;G.Outcomes=Outcomes;G.Wallet=Wallet;G.Accounts=Accounts;G.Floor=Floor;
})(window.GAR);
