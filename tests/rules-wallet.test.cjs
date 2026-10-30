/* Run: node tests/rules-wallet.test.cjs [--exhaustive]
   No npm dependencies. Tests real production rule and wallet files in isolated VMs. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let assertions=0;const groups=[];
const check=(condition,label)=>{assert.ok(condition,label);assertions++;};
const eq=(a,b,label)=>{assert.equal(a,b,label);assertions++;};
const near=(a,b,label,tol=1e-8)=>check(Math.abs(a-b)<tol,label);
function env(saved={},broken=false){
  const map=new Map(Object.entries(saved));const sandbox={console,Date,Math,JSON,Number,Map,Set,BigInt,Uint32Array,RangeError,Object,Array,String,Infinity,NaN};sandbox.window=sandbox;sandbox.globalThis=sandbox;
  sandbox.localStorage={getItem(k){if(broken)throw Error('Storage blocked');return map.has(k)?map.get(k):null;},setItem(k,v){if(broken)throw Error('Storage blocked');map.set(k,String(v));}};
  const c=vm.createContext(sandbox);for(const file of ['config.js','rules.js','wallet.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),c,{filename:file});
  let seed=123456789;c.GAR.RNG.unit=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
  return {G:c.GAR,map};
}
function group(name,fn){const before=assertions;fn();groups.push({name,assertions:assertions-before});console.log('PASS',name,`(${assertions-before} assertions)`);}
const card=(r,s='♠')=>({r:String(r),s,red:s==='♥'||s==='♦'});
group('Blackjack values / six-deck shoe',()=>{
  const {G}=env(),R=G.Rules,d=R.makeDeck(6);eq(d.length,312,'six decks');
  for(const s of R.SUITS)for(const r of R.RANKS)eq(d.filter(c=>c.r===r&&c.s===s).length,6,'six copies');
  eq(R.handVal([card('A'),card('K')]),21,'natural');eq(R.handVal([card('A'),card('A'),card('9')]),21,'soft aces');eq(R.handVal([card('A'),card('6'),card('K')]),17,'soft17 turns hard');eq(R.handVal([card('K'),card('Q'),card('2')]),22,'bust');
  const small=[card('A'),card('2')],before=JSON.stringify(small);eq(R.stackNext(small,['A','K']),false,'unavailable favorable shoe rejected');eq(JSON.stringify(small),before,'failed stack is atomic');
  check(R.stackNext(d,['A',c=>R.cardVal(c.r)<8,c=>R.cardVal(c.r)===10,c=>R.cardVal(c.r)<8]),'valid stacked opening');const sequence=Array.from({length:4},()=>d.pop());eq(R.handVal([sequence[0],sequence[2]]),21,'valid natural from remaining cards');
});
group('All 37 roulette pockets and bet types',()=>{
  const {G}=env(),R=G.Rules;eq(new Set(R.WHEEL).size,37,'unique pockets');eq(R.RL_RED.size,18,'18 red pockets');
  for(let n=0;n<37;n++){
    for(let bet=0;bet<37;bet++)eq(R.rlPayout('n'+bet,n),n===bet?36:0,'straight-up');
    eq(R.rlPayout('red',n),n&&R.RL_RED.has(n)?2:0,'red');eq(R.rlPayout('black',n),n&&!R.RL_RED.has(n)?2:0,'black');eq(R.rlPayout('even',n),n&&n%2===0?2:0,'even');eq(R.rlPayout('odd',n),n%2?2:0,'odd');eq(R.rlPayout('low',n),n>0&&n<=18?2:0,'low');eq(R.rlPayout('high',n),n>=19?2:0,'high');
    for(let k=1;k<=3;k++)eq(R.rlPayout('d'+k,n),n>12*(k-1)&&n<=12*k?3:0,'dozen');
  }
});
group('Slots paytable and independent weighted symbols',()=>{
  const {G}=env(),R=G.Rules;
  for(const s of R.SYMS)eq(R.evalSlots([s,s,s]).pay,R.SLOTS_PAY[s.t],'triple');
  eq(R.evalSlots(['7','lemon','7']).pay,5,'two sevens');eq(R.evalSlots(['bell','lemon','bell']).pay,2,'pair');eq(R.evalSlots(['7','diamond','lemon']).pay,0,'no line');
  const counts={};for(let i=0;i<100000;i++){const t=R.pickSym().t;counts[t]=(counts[t]||0)+1;}
  for(const s of R.SYMS)check(Math.abs(counts[s.t]/100000-s.w/20)<.007,'symbol frequency '+s.t);
});
group('Poker hand evaluation regressions',()=>{
  const {G}=env(),R=G.Rules;
  eq(R.evalPoker(['10','J','Q','K','A'].map(r=>card(r))).key,'rf','royal');
  eq(R.evalPoker(['A','2','3','4','5'].map(r=>card(r))).key,'sf','low straight flush is not royal');
  eq(R.evalPoker(['9','10','J','Q','K'].map(r=>card(r))).key,'sf','king-high straight flush');
  eq(R.evalPoker([card('A','♠'),card('2','♥'),card('3','♦'),card('4','♣'),card('5','♠')]).key,'straight','wheel straight');
  const make=(ranks,suits)=>ranks.map((r,i)=>card(r,suits[i]));
  for(const [ranks,suits,key]of[[['A','A','A','A','2'],R.SUITS.concat('♠'),'quad'],[['K','K','K','4','4'],['♠','♥','♦','♠','♥'],'fh'],[['2','5','8','J','K'],Array(5).fill('♥'),'flush'],[['8','8','8','2','5'],['♠','♥','♦','♠','♥'],'trips'],[['J','J','3','3','7'],['♠','♥','♦','♠','♥'],'twopair'],[['J','J','3','4','7'],['♠','♥','♦','♠','♥'],'job'],[['10','10','3','4','7'],['♠','♥','♦','♠','♥'],null]])eq(R.evalPoker(make(ranks,suits)).key,key,'poker group');
});
group('Baccarat third-card chart and naturals (1,000 combinations)',()=>{
  const {G}=env(),R=G.Rules,valueCard=v=>card(v===0?'10':v===1?'A':v);
  const chart=(b,p)=>b<=2||b===3&&p!==8||b===4&&p>=2&&p<=7||b===5&&p>=4&&p<=7||b===6&&(p===6||p===7);
  for(let p=0;p<10;p++)for(let b=0;b<10;b++)for(let third=0;third<10;third++){
    const natural=p>=8||b>=8,pDraw=!natural&&p<=5,bDraw=!natural&&(pDraw?chart(b,third):b<=5),bankThird=pDraw?6:third;
    const cards=[valueCard(p),valueCard(b),valueCard(0),valueCard(0),valueCard(third),valueCard(6)];
    const out=R.baccaratDeal(cards.reverse());eq(out.natural,natural,'natural');eq(out.player.length,pDraw?3:2,'player draw');eq(out.banker.length,bDraw?3:2,'banker draw');eq(out.p,pDraw?(p+third)%10:p,'player value');eq(out.b,bDraw?(b+bankThird)%10:b,'banker value');eq(out.winner,out.p===out.b?'tie':out.p>out.b?'player':'banker','winner');
  }
  eq(R.baccaratReturn('banker',{winner:'banker'}),1.95,'commission');eq(R.baccaratReturn('player',{winner:'tie'}),1,'player tie push');eq(R.baccaratReturn('banker',{winner:'tie'}),1,'banker tie push');eq(R.baccaratReturn('tie',{winner:'tie'}),9,'tie return');eq(R.baccaratReturn('tie',{winner:'player'}),0,'losing tie');
});
group('Hi-Lo ranks, ties pricing, Dice exact 36-outcome probabilities',()=>{
  const {G}=env(),R=G.Rules;eq(R.lowRank(card('A')),1,'ace low');eq(R.lowRank(card('K')),13,'king high');eq(R.hiLoChance(card('A'),'lower'),0,'impossible lower');eq(R.hiLoFactor(card('A'),'higher'),1,'certain direction no return increase');near(R.hiLoFactor(card('7'),'higher'),1.94,'half decisive ranks');
  for(let t=2;t<=12;t++)for(const mode of ['under','over']){
    let wins=0;for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)if(mode==='under'?a+b<t:a+b>t)wins++;
    near(R.diceChance(t,mode),wins/36,'exact winning probability');if(wins)near(R.diceMultiplier(t,mode),Math.floor(349200/wins)/10000,'inverse payout');else eq(R.diceMultiplier(t,mode),0,'no impossible award');
  }
  near(R.diceChance(7,'under'),15/36,'under seven');eq(R.diceWins(3,4,7,'under'),false,'equality loses');
});
group('Mines committed layouts / combinatorial pricing; Plinko all 4,096 paths',()=>{
  const {G}=env(),R=G.Rules;
  for(const n of [16,25,36])for(const m of [1,3,n-1]){
    const mines=R.minesLayout(n,m);eq(mines.size,m,'mine count');check([...mines].every(i=>i>=0&&i<n),'valid locations');eq(R.minesLayout(n,m,true).size,m,'demo layout count');
    const favorable=R.minesLayout(n,m,true);check([...favorable].every(i=>i>=n-m),'precommitted lower-right cluster');
    for(let k=1;k<=Math.min(5,n-m);k++){let numerator=1,denominator=1;for(let i=0;i<k;i++){numerator*=n-i;denominator*=n-m-i;}near(R.minesMultiplier(n,m,k),Math.min(1e6,.97*numerator/denominator),'combinatorial return');}
  }
  const counts=Array(13).fill(0);for(let mask=0;mask<4096;mask++){let right=0;for(let row=0;row<12;row++)right+=(mask>>row)&1;counts[right]++;}
  const expected=[1,12,66,220,495,792,924,792,495,220,66,12,1];eq(JSON.stringify(counts),JSON.stringify(expected),'12 independent decisions');eq(R.PL_MULT.length,13,'13 multiplier buckets');eq(R.PL_MULT[0],50,'left edge');eq(R.PL_MULT[12],50,'right edge');
});
group('Wallet exactly-once stake/return, doubles, push and net stats',()=>{
  const {G}=env(),W=G.Wallet;eq(W.balance,10000,'starting balance');
  const r=W.begin('blackjack',25);eq(W.balance,9975,'one deduction');eq(W.begin('blackjack',25),null,'duplicate blocked');eq(W.stats.plays,1,'one play');
  check(W.extend(r,25),'matching double');eq(W.balance,9950,'extra double stake');eq(W.stats.plays,1,'double not another play');eq(r.stakeCents,5000,'doubled committed stake');
  const win=W.settle(r,2);eq(win.returned,100,'full return');eq(win.net,50,'net profit');eq(W.balance,10050,'correct wallet');eq(W.settle(r,2),null,'duplicate settlement blocked');eq(W.balance,10050,'no duplicate credit');
  const p=W.begin('blackjack',25);const push=W.settle(p,1,{refund:true});eq(push.returned,25,'whole stake returned');eq(W.balance,10050,'push is neutral');eq(W.stats.wins,1,'net wins only');eq(W.stats.pushes,1,'push count');eq(W.stats.biggestWinCents,5000,'biggest win is net');
  const n=W.begin('blackjack',25);eq(W.settle(n,2.5).returned,62.5,'natural return');eq(W.balance,10087.5,'natural profit');
  const loss=W.begin('slots',25);W.settle(loss,0);eq(W.balance,10062.5,'loss');eq(W.stats.losses,1,'loss counted');eq(W.stats.resolved,4,'resolved rounds');
});
group('Invalid inputs, max values, fractional persistence, no Infinity/NaN',()=>{
  const {G,map}=env(),W=G.Wallet;
  for(const value of [-1,NaN,Infinity,-Infinity,'25',null]){eq(W.begin('dice',value),null,'invalid stake rejected');eq(W.setBalance(value),false,'invalid balance rejected');}
  eq(W.begin('dice',9.99),null,'minimum stake');
  W.setBalance(1234.56);eq(JSON.parse(map.get(G.CONFIG.storageKey)).balanceCents,123456,'hundredths persist');eq(map.get('gar_bal'),'1234.56','legacy key keeps fraction');
  W.setBalance(1e15);const huge=W.begin('slots',1e6),result=W.settle(huge,1e6);eq(W.balance,1000999999000000,'no cap with infinite vault');eq(result.returned,1e12,'1e6× return credited');check(!result.capped,'no cap with infinite vault');check(Number.isFinite(result.returned),'finite return');
  eq(G.Rules.returnCents(100000000,1000000,100000000000000),100000000000000,'BigInt payout cap');
});
group('Refill eligibility, codes, active-round locks, reload recovery',()=>{
  const {G,map}=env(),W=G.Wallet;W.setBalance(0);eq(W.refill(),5000,'refill');eq(W.refill(),null,'repeat refill rejected');eq(W.balance,5000,'one grant only');
  eq(W.redeem('invalid').ok,false,'invalid reward');eq(W.redeem('welcomeace').ok,true,'valid normalized reward');eq(W.redeem('WELCOMEACE').ok,false,'code one time');eq(W.stats.plays,0,'grants not plays');
  W.setBalance(10000);const round=W.begin('poker',25);eq(W.setBalance(1),false,'reset/change active blocked');eq(W.grant(1),null,'grant active blocked');eq(W.refill(),null,'refill active blocked');eq(G.Dev.apply('all',{reward:2}),false,'configuration active blocked');
  const restored=env(Object.fromEntries(map));eq(restored.G.Wallet.balance,10000,'unfinished stake refunded');eq(restored.G.Wallet.stats.voids,1,'refund tracked separately');eq(restored.G.Wallet.stats.resolved,0,'no fabricated win');
  W.settle(round,0);const before=W.balance;check(W.resetStatistics(),'reset stats');eq(W.balance,before,'stats reset leaves wallet');eq(W.stats.plays,0,'stats reset');
});
group('Developer probability selection, scope, reward snapshots, exact refunds',()=>{
  const {G}=env(),W=G.Wallet,O=G.Outcomes,D=G.Dev;eq(O.probability({luckEnabled:false,luck:1e16}),0,'disabled normal');eq(O.probability({luckEnabled:true,luck:1}),0,'normal multiplier');near(O.probability({luckEnabled:true,luck:4}),.5,'increased chance');eq(O.probability({luckEnabled:true,luck:1e16}),1,'absurd valid favorable selection');
  check(D.apply('slots',{luckEnabled:true,luck:1e16,reward:3}),'valid config');eq(D.snapshot('dice').reward,1,'scope untouched');eq(D.snapshot('slots').reward,3,'scope reward applied');
  const r=W.begin('slots',25);check(O.shouldFavor(r),'favor actually selected');eq(O.choose(r,()=>0,()=>100),100,'actual favorable outcome layer');eq(W.settle(r,100).returned,7500,'real boosted payout');
  check(D.apply('blackjack',{reward:100,customReturn:500}),'custom payout');const push=W.begin('blackjack',25);eq(W.quote(push,1,{refund:true}).amount,25,'exact preview refund');eq(W.settle(push,1,{refund:true}).returned,25,'exact actual refund');
  check(D.reset('all'),'normal reset');eq(D.anyModified(),false,'no residual configuration');const normal=W.begin('dice',25);for(let i=0;i<100;i++)eq(O.shouldFavor(normal),false,'normal outcome behavior');W.settle(normal,0);
  eq(D.apply('all',{luck:Infinity}),false,'no infinite luck');eq(D.apply('all',{reward:101}),false,'reward bounded');eq(D.apply('all',{customReturn:-1}),false,'custom bounded');
});
group('Invalid/outdated storage and blocked localStorage',()=>{
  for(const raw of ['{broken','null','[]',JSON.stringify({version:999,balanceCents:-1}),JSON.stringify({version:3,balanceCents:'1000000'})])eq(env({'gar_state_v3':raw}).G.Wallet.balance,10000,'corrupt save recovered');
  const legacy=env({'gar_bal':'125.55','gar_snd':'off'});eq(legacy.G.Wallet.balance,125.55,'legacy fraction migrated');eq(legacy.G.Wallet.prefs.sound,false,'original mute migrated');
  for(const bad of ['Infinity','NaN','-55','999999999999999999999'])eq(env({'gar_bal':bad}).G.Wallet.balance,10000,'bad legacy recovered');
  const blocked=env({},true);eq(blocked.G.Wallet.storageAvailable,false,'storage unavailable reported');const r=blocked.G.Wallet.begin('slots',25);eq(blocked.G.Wallet.settle(r,2).returned,50,'play works without storage');
});
group('Phase 2: TIMMY123, SHA-256 vectors, All-In trillion stakes, Accounts, Daily, Custom Promos & Persist Lock',()=>{
  const {G,map}=env(),W=G.Wallet,A=G.Accounts,D=G.Dev;
  eq(G.CONFIG.adminCode,'LEBRONJAMES123','admin code updated to LEBRONJAMES123');
  eq(G.Crypto.sha256(''),'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855','SHA-256 empty vector');
  eq(G.Crypto.sha256('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad','SHA-256 abc vector');
  // All-In full-balance staking above the old 1M cap
  W.setBalance(25000000);eq(W.maxAffordableStake(),25000000,'full multi-million wallet affordable');
  const allInRound=W.begin('blackjack',25000000);check(allInRound&&allInRound.allIn===true,'25M All-In round flagged');eq(W.balance,0,'entire balance staked');
  const settled=W.settle(allInRound,2);eq(settled.returned,50000000,'50M All-In payout');eq(W.balance,50000000,'50M credited');
  check(W.achievements.includes('all_in'),'All-In achievement unlocked');
  check(W.achievements.includes('millionaire'),'Millionaire achievement unlocked');
  // Accounts: register, login, wrong password, logout isolation, reload persistence, backup & admin gift
  const reg=A.register('TimmyKing','SuperSecret99');check(reg.ok,'account registered');eq(A.current.username,'TimmyKing','logged into TimmyKing');
  eq(W.balance,50000000,'guest progress adopted into new account');
  check(W.redeem('HIGHROLLER').ok,'promo redeemed on account');const savedBal=W.balance;
  eq(A.register('timmyking','OtherPass1').ok,false,'duplicate username case-insensitive rejected');
  check(A.logout().ok,'logged out to guest');eq(A.current.loggedIn,false,'now guest');eq(W.balance,10000,'fresh isolated guest balance');
  eq(A.login('TimmyKing','WrongPass').ok,false,'wrong password rejected');eq(A.current.loggedIn,false,'still guest');
  check(A.login('timmyking','SuperSecret99').ok,'case-insensitive login succeeds');eq(W.balance,savedBal,'exact account balance restored');
  eq(W.redeem('HIGHROLLER').ok,false,'account redeemed codes persisted');
  // Reload VM while signed in
  const reloaded=env(Object.fromEntries(map));
  eq(reloaded.G.Accounts.current.username,'TimmyKing','session stays signed in across reload');
  eq(reloaded.G.Wallet.balance,savedBal,'balance persists across reload');
  // Password change + backup export/import
  check(A.changePassword('SuperSecret99','NewVaultKey88').ok,'password changed');
  eq(A.login('TimmyKing','SuperSecret99').ok,false,'old password invalidated');
  check(A.login('TimmyKing','NewVaultKey88').ok,'new password works');
  const backup=A.exportBackup();check(backup.ok&&backup.code.startsWith('GAR1.'),'portable backup exported');
  const freshEnv=env();check(freshEnv.G.Accounts.importBackup(backup.code).ok,'backup imported on new browser');
  eq(freshEnv.G.Wallet.balance,savedBal,'imported account balance matches');
  check(A.adminGrantToAccount('timmyking',100000).ok,'admin account gift succeeds');eq(W.balance,savedBal+100000,'gift reflected immediately');
  // Daily house gift & 24h cooldown
  check(W.dailyStatus().eligible,'daily available initially');const d1=W.claimDaily();check(d1.ok&&d1.amount>=2500,'daily claimed');
  eq(W.claimDaily().ok,false,'24h cooldown enforced');
  // Custom promo forge & adminCode collision guard
  eq(D.addPromoCode('LEBRONJAMES123',5000).ok,false,'cannot collide with adminCode');
  check(D.addPromoCode('VIPDROP',77777).ok,'custom promo forged');
  check(W.redeem('vipdrop').ok,'custom promo redeemed');
  check(D.removePromoCode('VIPDROP'),'custom promo removed');
  // Persist lock across reload
  check(D.apply('all',{luckEnabled:true,luck:10}),'10x luck applied');
  check(D.setPersistLock(true),'persist lock enabled');
  const lockedReload=env(Object.fromEntries(map));
  check(lockedReload.G.Dev.persistLocked,'persist lock restored on reload');
  eq(lockedReload.G.Dev.snapshot('roulette').luck,10,'10x luck persisted across reload');
});
group('Phase 3: Lucky Wheel 96.75% RTP fix, Beyond-9T Quadrillion/Septillion BigInt wallet, Admin add/remove/wipe & Live Floor',()=>{
  const {G}=env(),W=G.Wallet,R=G.Rules,A=G.Accounts,F=G.Floor;
  // 1. Lucky Wheel exact weighted RTP === 96.75% (not 375%)
  const sumW=R.LUCKY_WEIGHTS.reduce((a,b)=>a+b,0);
  eq(sumW,1000,'Lucky Wheel weights sum to 1000');
  const expectedReturn=R.LUCKY_SEGMENTS.reduce((s,m,i)=>s+m*R.LUCKY_WEIGHTS[i],0)/sumW;
  eq(expectedReturn,0.9675,'Lucky Wheel exact RTP is 96.75%');
  // 2. Shorthand chip parser & >9T quadrillion / quintillion / septillion BigInt settlement
  eq(G.parseChips('50T'),5e13,'parse 50T');
  eq(G.parseChips('2.5Qa'),2.5e15,'parse 2.5Qa');
  eq(G.parseChips('1Qi'),1e18,'parse 1Qi');
  eq(G.parseChips('9Sp'),9e24,'parse 9Sp max');
  check(W.setBalance(5e15),'set 5 Quadrillion balance');
  eq(W.balance,5e15,'5Qa balance stored');
  check(W.achievements.includes('quadrillionaire'),'quadrillionaire achievement unlocked');
  const qaRound=W.begin('blackjack',5e15);
  check(qaRound&&qaRound.allIn===true,'5Qa All-In round started');
  eq(W.balance,0,'5Qa deducted cleanly');
  const qaWin=W.settle(qaRound,2.5);
  eq(qaWin.returned,1.25e16,'12.5Qa blackjack payout settled without 9T cap');
  eq(W.balance,1.25e16,'wallet holds 12.5 Quadrillion');
  // 3. Avatar customization + Obby Master achievement
  const av=W.setAvatar({preset:'cyber',hat:'crown',skin:'#8a5837',difficulty:'expert'});
  eq(av.preset,'cyber','avatar preset saved');
  eq(av.hat,'crown','avatar hat saved');
  eq(av.difficulty,'expert','avatar obby difficulty saved');
  check(W.unlockAchievement('obby_master'),'obby_master unlocked');
  check(W.achievements.includes('obby_master'),'obby_master in achievements');
  // 4. Admin add / remove / half / wipe / set across multiple accounts + Guest
  check(A.register('PlayerOne','Pass1234',false).ok,'registered PlayerOne');
  W.setBalance(1000000);
  check(A.logout().ok,'back to guest');
  check(A.register('WhaleTwo','Pass1234',false).ok,'registered WhaleTwo');
  W.setBalance(8e15);
  // Moderate PlayerOne while signed into WhaleTwo
  const rAdd=A.adminModifyPlayer('playerone','add','500K');
  check(rAdd.ok&&rAdd.balance===1500000,'admin added 500K to PlayerOne');
  const rRem=A.adminModifyPlayer('playerone','remove','300000');
  check(rRem.ok&&rRem.balance===1200000,'admin removed 300K from PlayerOne');
  const rHalf=A.adminModifyPlayer('playerone','half');
  check(rHalf.ok&&rHalf.balance===600000,'admin halved PlayerOne balance');
  const rWipe=A.adminModifyPlayer('playerone','wipe');
  check(rWipe.ok&&rWipe.balance===0,'admin wiped PlayerOne balance to 0');
  const rSet=A.adminModifyPlayer('playerone','set','2Qa');
  check(rSet.ok&&rSet.balance===2e15,'admin set PlayerOne to 2 Quadrillion');
  // Moderate Guest vault too
  const gSet=A.adminModifyPlayer('__guest__','set','75000');
  check(gSet.ok&&gSet.balance===75000,'admin modified Guest vault');
  // Live Floor & Leaderboard includes WhaleTwo, PlayerOne, and Guest
  const lb=F.leaderboard('balance');
  check(lb.length>=3,'leaderboard lists active + saved vaults + guest');
  eq(lb[0].username,'WhaleTwo','WhaleTwo ranked #1 with 8Qa');
  eq(lb[1].username,'PlayerOne','PlayerOne ranked #2 with 2Qa');
});
if(process.argv.includes('--exhaustive'))group('Exhaustive evaluation of all 2,598,960 five-card poker hands',()=>{
  const {G}=env(),R=G.Rules,d=R.makeDeck(1),counts={};let total=0;
  for(let a=0;a<48;a++)for(let b=a+1;b<49;b++)for(let c=b+1;c<50;c++)for(let e=c+1;e<51;e++)for(let f=e+1;f<52;f++){const key=R.evalPoker([d[a],d[b],d[c],d[e],d[f]]).key||'none';counts[key]=(counts[key]||0)+1;total++;}
  eq(total,2598960,'all combinations');for(const [key,count]of Object.entries({rf:4,sf:36,quad:624,fh:3744,flush:5108,straight:10200,trips:54912,twopair:123552,job:337920,none:2062860}))eq(counts[key],count,'exact poker count '+key);
});
const summary={status:'passed',assertions,groups,exhaustive:process.argv.includes('--exhaustive')};
fs.writeFileSync(path.join(__dirname,'rules-wallet-results.json'),JSON.stringify(summary,null,2));console.log(`\n${assertions} assertions passed.`);
