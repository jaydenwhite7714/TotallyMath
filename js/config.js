/* Golden Ace Royale — local play-money configuration. No real-money use. */
window.GAR = {games: {}, hooks: {}, currentView: 'lobby'};
(function (G) {
  'use strict';
  G.CONFIG = Object.freeze({
    // Intentionally public DEMO access code; NOT secure authentication.
    // Trusted privileges, balances or rewards require server-side authorization.
    // Anyone inspecting this static application can read or bypass this value.
    adminCode: 'TIMMY123',
    redeemCodes: {
      WELCOMEACE: {chips: 2500, message: 'Welcome to the club. 2,500 chips are yours.'},
      GOLDENHOUR: {chips: 5000, message: 'A golden little extra. Enjoy 5,000 chips.'},
      ROYALFLUSH: {chips: 10000, message: 'A royal welcome. 10,000 chips credited.'},
      HIGHROLLER: {chips: 25000, message: 'High-roller table unlocked. 25,000 chips added.'},
      JACKPOT777: {chips: 77700, message: 'Triple sevens smile on you. 77,700 chips credited.'}
    },
    dailyRewards: [2500, 5000, 10000, 20000, 50000],
    vipTiers: [
      {id: 'member', name: 'Club Member', minWagered: 0},
      {id: 'silver', name: 'Silver Ace', minWagered: 5000},
      {id: 'gold', name: 'Golden Circle', minWagered: 50000},
      {id: 'platinum', name: 'Platinum High Roller', minWagered: 500000},
      {id: 'diamond', name: 'Diamond Reserve', minWagered: 10000000},
      {id: 'sovereign', name: 'Royale Sovereign', minWagered: 1000000000}
    ],
    achievements: [
      {id: 'first_play', name: 'First Seat', desc: 'Complete your first casino round'},
      {id: 'ten_wins', name: 'Hot Streak', desc: 'Win 10 resolved rounds'},
      {id: 'all_in', name: 'All On The Line', desc: 'Put 100% of your tokens in on a single bet'},
      {id: 'all_in_win', name: 'Fortune Favors The Bold', desc: 'Win an All-In wager'},
      {id: 'high_roller', name: 'High Roller', desc: 'Stake 10,000+ chips on a single round'},
      {id: 'big_score', name: 'Golden Moment', desc: 'Score 50,000+ net chips on one round'},
      {id: 'millionaire', name: 'Seven Figures', desc: 'Reach a 1,000,000 chip balance'},
      {id: 'billionaire', name: 'Vault Tycoon', desc: 'Reach a 1,000,000,000 chip balance'}
    ],
    startingBalance: 10000,
    refillChips: 5000,
    refillThreshold: 100,
    minStake: 10,
    maxStake: 9000000000000,
    maxBalance: 9000000000000,
    maxReturn: 9000000000000,
    maxPayoutMultiplier: 1000000,
    maxLuck: 10000000000000000,
    maxPlinkoBalls: 8,
    storageKey: 'gar_state_v3',
    accountsKey: 'gar_accounts_v1',
    activeAccountKey: 'gar_active_account_v1',
    guestKey: 'gar_guest_v3',
    devLockKey: 'gar_dev_lock_v1',
    customCodesKey: 'gar_custom_codes_v1'
  });
  G.LIBRARY = [
    {id:'blackjack',name:'Blackjack',short:'Blackjack',icon:'cards',category:'table',label:'THE CLASSICS',tag:'3:2 natural',desc:'A little strategy. A perfect twenty-one.',color:'emerald'},
    {id:'roulette',name:'European Roulette',short:'Roulette',icon:'roulette',category:'table',label:'SINGLE ZERO',tag:'35:1 straight-up',desc:'One wheel. Thirty-seven possibilities.',color:'burgundy'},
    {id:'slots',name:'Golden 777',short:'Golden 777',icon:'slots',category:'instant',label:'SIGNATURE SLOTS',tag:'100× top return',desc:'Three reels. One golden moment.',color:'amber'},
    {id:'baccarat',name:'Baccarat',short:'Baccarat',icon:'baccarat',category:'table',label:'THE CROWN ROOM',tag:'Player · Banker · Tie',desc:'The timeless game of the high rollers.',color:'teal',isNew:true},
    {id:'poker',name:'Video Poker',short:'Video Poker',icon:'spade',category:'table',label:'JACKS OR BETTER',tag:'250× royal flush',desc:'Know what to hold. Know when to draw.',color:'blue'},
    {id:'plinko',name:'Plinko',short:'Plinko',icon:'plinko',category:'instant',label:'FOLLOW THE BOUNCE',tag:'50× edge buckets',desc:'A golden drop with a different destiny.',color:'plum'},
    {id:'crash',name:'Crash',short:'Crash',icon:'chart',category:'instant',label:'TIMING IS EVERYTHING',tag:'Collect before the crash',desc:'How far will you let it ride?',color:'emerald',isNew:true},
    {id:'hilo',name:'Hi-Lo',short:'Hi-Lo',icon:'hilo',category:'table',label:'TRUST YOUR INSTINCT',tag:'Higher or lower?',desc:'Read the next card. Build your streak.',color:'burgundy',isNew:true},
    {id:'dice',name:'Dice',short:'Dice',icon:'dice',category:'instant',label:'MAKE YOUR OWN ODDS',tag:'Two dice · your target',desc:'Pick your number. Take your chance.',color:'blue',isNew:true},
    {id:'mines',name:'Mines',short:'Mines',icon:'diamond',category:'instant',label:'A CALCULATED RISK',tag:'Reveal · risk · collect',desc:'Find the gems. Leave with the gold.',color:'teal',isNew:true},
    {id:'wheel',name:'Lucky Wheel',short:'Lucky Wheel',icon:'wheel',category:'instant',label:'A TURN OF FORTUNE',tag:'12 prize segments',desc:'A little spin can change everything.',color:'amber',isNew:true}
  ];
})(window.GAR);
