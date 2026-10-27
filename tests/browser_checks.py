"""Actual Chromium integration checks for the static application.
Run the app on port 8080, then: python tests/browser_checks.py
Test-only determinism is injected from DevTools, never shipped as an in-game feature.
"""
import json, os, time, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GAR_BASE_URL','http://127.0.0.1:8080/')
RESULTS=[]

def run(browser,name,fn,motion='reduce',mobile=False):
    context=browser.new_context(viewport={'width':390 if mobile else 1440,'height':844 if mobile else 1000},reduced_motion=motion,device_scale_factor=1,has_touch=mobile,is_mobile=mobile)
    page=context.new_page();errors=[];external=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda e:errors.append('console error: '+e.text) if e.type=='error' else None)
    page.on('request',lambda r:external.append(r.url) if r.url.startswith('http') and not r.url.startswith(BASE.split('/',3)[0]+'//'+BASE.split('/')[2]) else None)
    page.set_default_timeout(7000)
    started=time.monotonic()
    try:
        page.goto(BASE,wait_until='domcontentloaded');page.wait_for_function('window.GAR?.ready');page.evaluate('document.fonts.ready');page.evaluate('GAR.Wallet.setPreference("sound",false)')
        fn(page)
        assert not errors,errors
        assert not external,external
        RESULTS.append({'name':name,'status':'passed','seconds':round(time.monotonic()-started,2)})
        print('PASS',name)
    except Exception as e:
        # Never print the access code or form contents. Test names and exception types suffice.
        RESULTS.append({'name':name,'status':'failed','error_type':type(e).__name__,'errors':errors})
        print('FAIL',name,type(e).__name__)
        page.screenshot(path=str(ROOT/'tests/screenshots/test-failure.png'),full_page=True)
        raise
    finally:context.close()

def nav(page,game):
    page.evaluate('(id)=>GAR.showView(id)',game)
    assert page.evaluate('GAR.currentView')==game

def wait_idle(page):page.wait_for_function('!GAR.Wallet.hasActive()')
def balance(page):return page.evaluate('GAR.Wallet.balance')
def luck(page,game='all',reward=1):page.evaluate('([game,reward])=>GAR.Dev.apply(game,{luckEnabled:true,luck:1e16,reward})',[game,reward])
def reset_money(page):
    page.evaluate('GAR.Modal.close();GAR.Wallet.setBalance(10000);GAR.Wallet.resetStatistics()')
def click_many(page,selector,n=3):page.eval_on_selector(selector,'(el,n)=>{for(let i=0;i<n;i++)el.click()}',n)

def unlock(page):
    page.locator('#settingsBtn').click();page.locator('#settingsModal [data-open="redeemModal"]').click()
    page.evaluate('document.getElementById("redeemInput").value=GAR.CONFIG.adminCode')
    page.locator('#redeemSubmit').click()
    assert page.evaluate('GAR.currentView')=='admin'
    assert page.evaluate('!document.body.innerText.includes(GAR.CONFIG.adminCode)')

def lobby_navigation(page):
    assert page.locator('#gameGrid .gcard').count()==11
    assert page.evaluate('document.fonts.check("500 16px Outfit")&&document.fonts.check("500 16px Cinzel")')
    assert page.locator('#rl-wheel text').count()==37
    for game in page.evaluate('GAR.LIBRARY.map(g=>g.id)'):
        page.locator(f'#gameGrid [data-view="{game}"]').click()
        assert page.evaluate('GAR.currentView')==game
        page.locator(f'#view-{game} .gamebar [data-view="lobby"]').click()
        assert page.evaluate('GAR.currentView')=='lobby'
    page.locator('[data-filter="table"]').click();assert page.locator('#gameGrid .gcard:not(.hidden)').count()==5
    page.locator('[data-filter="instant"]').click();assert page.locator('#gameGrid .gcard:not(.hidden)').count()==6
    page.locator('[data-filter="all"]').click();page.locator('#gameSearch').fill('blackjack');assert page.locator('#gameGrid .gcard:not(.hidden)').count()==1
    page.locator('#gameSearch').fill('not-a-game');assert page.locator('#noGames').is_visible()
    page.locator('#gameSearch').fill('');assert page.locator('#gameGrid .gcard:not(.hidden)').count()==11
    assert not page.locator('#view-admin').is_visible()
    assert page.evaluate('GAR.showView("admin")') is False
    assert page.evaluate('document.documentElement.scrollWidth===innerWidth')

def blackjack(page):
    nav(page,'blackjack')
    cases=[
        (['A','9','K','7'],None,10037.5,6250,'bj'),
        (['A','A','K','Q'],None,10000,2500,'push'),
        (['10','8','9','8','10'],'stand',10025,5000,'win'),
        (['10','A','8','6'],'stand',10025,5000,'win'),
        (['10','8','9','7','K'],'hit',9975,0,'lose'),
        (['5','10','6','6','10','8'],'double',10050,10000,'win')]
    for ranks,action,expected,returned,reason in cases:
        if page.evaluate('GAR.games.blackjack.state.phase')=='done':page.locator('#bj-deal').click()
        reset_money(page)
        page.evaluate('(ranks)=>{const d=GAR.Rules.makeDeck(6);GAR.Rules.stackNext(d,ranks);GAR.games.blackjack.state.deck=d}',ranks)
        page.locator('#bj-chips [data-v="25"]').click();click_many(page,'#bj-deal')
        page.wait_for_function('GAR.games.blackjack.state.phase==="player"||GAR.games.blackjack.state.phase==="done"')
        if action:click_many(page,'#bj-'+action)
        wait_idle(page)
        assert balance(page)==expected,(ranks,balance(page))
        assert page.evaluate('GAR.Wallet.history[0].returnCents')==returned
        assert page.evaluate('GAR.Wallet.stats.plays')==1
        assert page.evaluate('GAR.Wallet.stats.resolved')==1
        assert page.locator('#bj-hit').is_disabled() and page.locator('#bj-double').is_disabled()
        corners=page.locator('#bj-player .corner b').all_text_contents()
        assert corners and all(v in ['A','2','3','4','5','6','7','8','9','10','J','Q','K'] for v in corners)
        assert page.evaluate('GAR.Wallet.history[0].reason')==reason
        if action=='double':assert page.evaluate('GAR.Wallet.stats.wageredCents')==5000
        if ranks==['10','A','8','6']:assert page.evaluate('GAR.games.blackjack.state.dealer.length')==2
    assert 'Returned 100 chips' in page.locator('#bj-msg').inner_text()

def roulette(page):
    nav(page,'roulette');luck(page,'roulette')
    page.locator('#rl-board [data-key="n17"]').click();page.locator('#rl-board [data-key="n17"]').click();assert balance(page)==10000
    assert page.locator('#rl-total').inner_text()=='50'
    page.locator('#rl-undo').click();assert page.locator('#rl-total').inner_text()=='25' and balance(page)==10000
    click_many(page,'#rl-spin');assert page.locator('#rl-clear').is_disabled();wait_idle(page)
    assert balance(page)==10875
    last=page.evaluate('GAR.games.roulette.last');assert last['n']==17 and last['result']['returned']==900
    assert abs((last['rotation']+last['idx']*360/37)%360)<.001 or abs((last['rotation']+last['idx']*360/37)%360-360)<.001
    assert last['orbit']%360==0
    assert page.locator('#rl-history span').first.inner_text()=='17'
    assert page.evaluate('GAR.Wallet.stats.plays')==1
    page.locator('#rl-board [data-key="red"]').click();page.locator('#rl-clear').click();assert balance(page)==10875 and page.locator('#rl-total').inner_text()=='0'

def slots(page):
    nav(page,'slots');luck(page,'slots');click_many(page,'#sl-spin');assert balance(page)==9975
    assert page.locator('#sl-chips [data-v="500"]').is_disabled()
    page.eval_on_selector('#sl-chips [data-v="500"]','el=>el.click()');wait_idle(page)
    assert balance(page)==12475 and page.evaluate('GAR.games.slots.bet')==25
    assert page.evaluate('GAR.Wallet.stats.plays')==1
    assert page.evaluate('GAR.games.slots.last.out.every(s=>s==="7")')
    assert page.evaluate('''[...document.querySelectorAll('#sl-reels .reel')].every(r=>{
      const symbol=r.querySelector('.strip').children[15],a=symbol.getBoundingClientRect(),b=r.getBoundingClientRect();
      return symbol.dataset.symbol==='7'&&Math.abs((a.top+a.height/2)-(b.top+b.height/2))<1;
    })''')

def responsive_slots(page):
    page.set_viewport_size({'width':390,'height':844});nav(page,'slots');luck(page,'slots');page.locator('#sl-spin').click()
    page.wait_for_timeout(350);page.set_viewport_size({'width':768,'height':900});page.wait_for_timeout(250);page.set_viewport_size({'width':390,'height':844});wait_idle(page)
    assert balance(page)==12475
    assert page.evaluate('''[...document.querySelectorAll('#sl-reels .reel')].every(r=>{const a=r.querySelector('.strip').children[15].getBoundingClientRect(),b=r.getBoundingClientRect();return Math.abs(a.top+a.height/2-b.top-b.height/2)<1;})''')

def poker(page):
    nav(page,'poker');luck(page,'poker');click_many(page,'#vp-deal');page.wait_for_function('GAR.games.poker.state.phase==="draw"&&!GAR.games.poker.state.busy')
    assert balance(page)==9975 and page.locator('#vp-chips [data-v="500"]').is_disabled()
    hand=page.evaluate('GAR.games.poker.state.hand.map(c=>c.r+c.s)')
    for i in range(5):page.locator('#vp-hand .pcard').nth(i).click()
    assert page.locator('#vp-hand .held').count()==5
    click_many(page,'#vp-deal');wait_idle(page)
    assert page.evaluate('GAR.games.poker.state.hand.map(c=>c.r+c.s)')==hand
    assert page.evaluate('GAR.games.poker.last.evaluation.key')=='rf'
    assert balance(page)==16225 and page.evaluate('GAR.Wallet.stats.plays')==1
    assert page.locator('#view-poker [data-k="rf"]').get_attribute('class').endswith('hit')
    page.locator('#vp-deal').click();page.wait_for_function('GAR.games.poker.state.phase==="draw"&&!GAR.games.poker.state.busy')
    first=page.evaluate('GAR.games.poker.state.hand[0].r+GAR.games.poker.state.hand[0].s')
    page.locator('#vp-hand .pcard').first.focus();page.keyboard.press('Enter');click_many(page,'#vp-deal');wait_idle(page)
    assert page.evaluate('GAR.games.poker.state.hand[0].r+GAR.games.poker.state.hand[0].s')==first
    assert page.evaluate('new Set(GAR.games.poker.state.hand.map(c=>c.r+c.s)).size')==5
    assert page.evaluate('GAR.Wallet.stats.plays')==2

def plinko(page):
    nav(page,'plinko');luck(page,'plinko');click_many(page,'#pl-drop',3)
    assert balance(page)==9925 and page.evaluate('GAR.Wallet.activeRounds().length')==3
    page.wait_for_timeout(450)
    assert page.evaluate('GAR.games.plinko.state.balls.every(b=>b.pts.every(p=>Number.isFinite(p[0])&&Number.isFinite(p[1])))')
    assert page.evaluate('GAR.games.plinko.state.balls.some(b=>b.seg>0)')
    assert page.evaluate('GAR.games.plinko.state.balls.every(b=>b.pts.slice(1,13).every((p,i)=>Number.isInteger((p[0]-280)/40+(i+2)/2)))')
    wait_idle(page);assert balance(page)==13675
    assert page.evaluate('GAR.Wallet.stats.plays')==3 and page.evaluate('GAR.Wallet.stats.resolved')==3
    page.wait_for_timeout(350);assert balance(page)==13675

def plinko_limit(page):
    nav(page,'plinko');click_many(page,'#pl-drop',12)
    assert page.evaluate('GAR.Wallet.stats.plays')==8
    wait_idle(page);assert page.evaluate('GAR.Wallet.stats.resolved')==8

def baccarat(page):
    nav(page,'baccarat');luck(page,'baccarat')
    for side,returned in [('player',50),('banker',48.75),('tie',225)]:
        reset_money(page);page.locator(f'#ba-sides [data-side="{side}"]').click();click_many(page,'#ba-start');wait_idle(page)
        assert page.evaluate('GAR.games.baccarat.state.last.winner')==side
        assert page.evaluate('GAR.Wallet.history[0].returnCents')==round(returned*100)
        assert balance(page)==10000-25+returned
    page.evaluate('GAR.Dev.reset("all");GAR.Rules.makeDeck=()=>["2","3","3","2","7","6"].map(r=>({r,s:"♠"})).reverse()')
    reset_money(page);page.locator('#ba-sides [data-side="player"]').click();page.locator('#ba-start').click();wait_idle(page)
    assert page.locator('#ba-player .card').count()==3 and page.locator('#ba-banker .card').count()==3
    assert page.locator('#ba-player-val').inner_text()=='2' and page.locator('#ba-banker-val').inner_text()=='1'
    assert balance(page)==10025
    page.evaluate('GAR.Rules.makeDeck=()=>["4","4","5","5"].map(r=>({r,s:"♠"})).reverse()')
    reset_money(page);page.locator('#ba-start').click();wait_idle(page)
    assert balance(page)==10000 and page.evaluate('GAR.Wallet.stats.pushes')==1

def hilo(page):
    nav(page,'hilo');page.evaluate('GAR.RNG.unit=()=>.5');click_many(page,'#hl-start')
    page.wait_for_function('GAR.games.hilo.state.phase==="active"&&!GAR.games.hilo.state.busy')
    assert page.evaluate('GAR.games.hilo.state.current.r')=='7'
    click_many(page,'#hl-higher');page.wait_for_function('!GAR.games.hilo.state.busy')
    assert page.evaluate('GAR.games.hilo.state.streak')==0 and balance(page)==9975
    page.evaluate('GAR.RNG.unit=()=>.99');click_many(page,'#hl-higher');page.wait_for_function('!GAR.games.hilo.state.busy')
    assert page.evaluate('GAR.games.hilo.state.streak')==1
    assert page.locator('#hl-higher').is_disabled()
    click_many(page,'#hl-collect');wait_idle(page);assert balance(page)==10023.5
    assert page.evaluate('GAR.Wallet.stats.plays')==1
    page.evaluate('GAR.RNG.unit=()=>.5');page.locator('#hl-start').click();page.wait_for_function('!GAR.games.hilo.state.busy')
    page.evaluate('GAR.RNG.unit=()=>.99');page.locator('#hl-lower').click();wait_idle(page)
    assert page.evaluate('GAR.Wallet.history[0].returnCents')==0

def dice(page):
    nav(page,'dice');assert page.locator('#di-chance').inner_text()=='41.67%';assert page.locator('#di-mult').inner_text()=='2.3280×'
    page.evaluate('GAR.RNG.unit=()=>0');click_many(page,'#di-start');wait_idle(page)
    assert page.locator('#di-total').inner_text()=='2' and balance(page)==10033.2
    assert page.evaluate('GAR.Wallet.stats.plays')==1
    # One and six: equality must lose.
    page.evaluate('let k=0;GAR.RNG.unit=()=>[0,.99][(k++)%2]');page.locator('#di-start').click();wait_idle(page)
    assert page.locator('#di-total').inner_text()=='7' and page.evaluate('GAR.Wallet.history[0].returnCents')==0
    page.locator('#di-target').fill('2');page.locator('#di-target').dispatch_event('input');assert page.locator('#di-start').is_disabled()
    # Extreme text input must not throw during preview or start a bet.
    page.locator('#di-stake').fill('1e100');page.locator('#di-stake').dispatch_event('input');assert page.locator('#di-potential').inner_text()=='0 chips'

def mines(page):
    nav(page,'mines');luck(page,'mines');click_many(page,'#mn-start');assert balance(page)==9975
    layout=page.evaluate('[...GAR.games.mines.state.layout]');assert layout==[22,23,24]
    click_many(page,'#mn-grid [data-index="0"]');page.eval_on_selector('#mn-collect','el=>el.click()');page.wait_for_function('!GAR.games.mines.state.busy')
    assert page.evaluate('GAR.games.mines.state.revealed.size')==1
    assert page.evaluate('[...GAR.games.mines.state.layout]')==layout
    assert balance(page)==9975
    click_many(page,'#mn-collect');wait_idle(page);assert balance(page)==10002.56
    page.locator('#mn-start').click();page.locator('#mn-grid [data-index="24"]').click();wait_idle(page)
    assert page.evaluate('GAR.Wallet.history[0].returnCents')==0 and page.locator('#mn-grid .mine').count()==3
    page.locator('#mn-size').select_option('4');page.locator('#mn-count').fill('15');page.locator('#mn-count').dispatch_event('input');page.locator('#mn-start').click();page.locator('#mn-grid [data-index="0"]').click();wait_idle(page)
    assert page.evaluate('GAR.games.mines.state.phase')=='collected'
    assert page.evaluate('GAR.Wallet.history[0].returnCents')==38800
    page.locator('#mn-count').fill('0');page.locator('#mn-count').dispatch_event('input');assert page.locator('#mn-start').is_disabled()

def wheel(page):
    nav(page,'wheel');luck(page,'wheel',2);click_many(page,'#lw-start');wait_idle(page)
    last=page.evaluate('GAR.games.wheel.state.last');assert last['multiplier']==20 and last['result']['returned']==1000
    assert (last['rotation']+last['index']*30)%360==0
    assert '40×' in page.locator('#lw-wheel').inner_text()
    page.evaluate('GAR.Dev.reset("all");GAR.RNG.unit=()=>0');page.locator('#lw-start').click();wait_idle(page);assert page.evaluate('GAR.Wallet.history[0].returnCents')==0
    page.evaluate('GAR.RNG.unit=()=>.175');page.locator('#lw-start').click();wait_idle(page);assert page.evaluate('GAR.Wallet.history[0].returnCents')==1250

def crash(page):
    nav(page,'crash');page.clock.install()
    # Controlled U=.5 -> crash at 1.94x. Manual collect at a real pre-crash deadline.
    page.evaluate('GAR.RNG.unit=()=>.5;document.getElementById("cr-start").click()')
    page.clock.run_for(600);assert page.evaluate('GAR.games.crash.state.phase')=='active'
    page.evaluate('document.getElementById("cr-cash").click();document.getElementById("cr-cash").click()')
    assert page.evaluate('GAR.Wallet.stats.resolved')==1 and page.evaluate('GAR.Wallet.history[0].returnCents')>2500
    before=balance(page)
    # Let a second round crash, then try a stale collect; no payout can be credited.
    page.evaluate('document.getElementById("cr-start").click()');page.clock.run_for(4000)
    assert page.evaluate('GAR.games.crash.state.phase')=='crashed'
    at_crash=balance(page);page.evaluate('document.getElementById("cr-cash").click()');assert balance(page)==at_crash==before-25
    # Auto collects at exactly its crossing when that crossing is strictly before crash.
    page.evaluate('GAR.Dev.apply("crash",{luckEnabled:true,luck:1e16});document.getElementById("cr-auto").checked=true;document.getElementById("cr-auto-target").value="2";document.getElementById("cr-start").click()')
    page.clock.run_for(3300)
    assert page.evaluate('GAR.games.crash.state.phase')=='collected'
    assert page.evaluate('GAR.Wallet.history[0].returnCents')==5000
    # Equal thresholds lose, not auto-collect.
    page.evaluate('GAR.Dev.reset("all");GAR.RNG.unit=()=>.5;document.getElementById("cr-auto-target").value="1.94";document.getElementById("cr-start").click()')
    page.clock.run_for(4000);assert page.evaluate('GAR.games.crash.state.phase')=='crashed'
    assert page.evaluate('GAR.Wallet.history[0].returnCents')==0

def admin(page):
    assert page.evaluate('GAR.showView("admin")') is False
    page.locator('#settingsBtn').click();page.locator('#settingsModal [data-open="redeemModal"]').click();page.locator('#redeemInput').fill('NOT-A-VALID-INVITATION');page.locator('#redeemSubmit').click()
    assert 'not valid' in page.locator('#redeemFeedback').inner_text() and page.evaluate('!GAR.adminUnlocked')
    page.evaluate('document.getElementById("redeemInput").value=GAR.CONFIG.adminCode');page.locator('#redeemSubmit').click()
    assert page.evaluate('GAR.currentView')=='admin'
    assert page.evaluate('!document.body.innerText.includes(GAR.CONFIG.adminCode)')
    assert page.locator('#redeemInput').input_value()==''
    page.locator('#admin-scope').select_option('slots');page.locator('#admin-luck-enabled').check();page.locator('#admin-luck-preset').select_option('10000000000000000');page.locator('#admin-reward').fill('3');page.locator('#admin-apply').click()
    assert page.evaluate('GAR.Dev.snapshot("slots").luck')==1e16 and page.evaluate('GAR.Dev.snapshot("dice").luck')==1
    page.locator('#admin-amount').fill('12345.67');page.locator('#admin-set').click();assert balance(page)==10000
    page.locator('#confirmYes').click();assert balance(page)==12345.67
    page.locator('.sidebar [data-view="slots"]').click();page.locator('#sl-spin').click();wait_idle(page)
    assert page.evaluate('GAR.Wallet.history[0].returnCents')==750000
    assert page.locator('#demoBanner').is_visible()
    page.locator('#demoDetails').click();page.locator('#admin-normal').click();page.locator('#confirmYes').click()
    assert page.evaluate('GAR.Dev.snapshot("slots").luckEnabled') is False
    assert page.evaluate('GAR.Dev.snapshot("slots").reward')==3
    page.locator('#admin-restore').click();page.locator('#confirmYes').click();assert page.evaluate('GAR.Dev.anyModified()') is False
    page.locator('.sidebar [data-view="slots"]').click();page.evaluate('GAR.RNG.unit=()=>.99');page.locator('#sl-spin').click();wait_idle(page)
    assert page.evaluate('GAR.games.slots.last.out')==['lemon','lemon','lemon']
    assert page.evaluate('GAR.Wallet.history[0].returnCents')==25000

def admin_wallet(page):
    unlock(page)
    page.locator('#admin-amount').fill('100');page.locator('#admin-add').click();assert balance(page)==10100
    page.locator('#admin-remove').click();page.locator('#confirmModal [data-close]').last.click();assert balance(page)==10100
    page.locator('#admin-remove').click();page.locator('#confirmYes').click();assert balance(page)==10000
    page.locator('#admin-rich').click();assert balance(page)==10000;page.locator('#confirmYes').click();assert balance(page)==1000000010000
    assert 'T' in page.locator('#balance').inner_text() and '1,000,000,010,000' in page.locator('#balance').get_attribute('title')
    page.locator('#admin-bonus').click();assert balance(page)==1000000060000
    page.locator('#admin-effects').uncheck();assert page.evaluate('GAR.Wallet.prefs.effects') is False
    page.locator('#admin-reset-wallet').click();page.locator('#resetNo').click();assert balance(page)==1000000060000
    page.locator('#admin-reset-wallet').click();page.locator('#resetYes').click();assert balance(page)==10000
    page.locator('#admin-reset-stats').click();page.locator('#confirmYes').click();assert balance(page)==10000 and page.evaluate('GAR.Wallet.stats.plays')==0
    page.locator('#admin-close').click();assert page.evaluate('GAR.currentView')=='lobby'

def wallet_modals_persistence(page):
    # One reward code, even with repeated submits.
    page.locator('#settingsBtn').click();page.locator('#settingsModal [data-open="redeemModal"]').click();page.locator('#redeemInput').fill('WELCOMEACE');page.locator('#redeemSubmit').click();assert balance(page)==12500
    page.locator('#redeemInput').fill('WELCOMEACE');page.locator('#redeemSubmit').click();assert balance(page)==12500
    page.keyboard.press('Escape');assert page.evaluate('GAR.Modal.active') is None
    # A modal's Escape closes it, not the game view; focus remains trapped while open.
    nav(page,'dice');page.locator('#settingsBtn').click()
    for _ in range(12):
        page.keyboard.press('Tab');assert page.evaluate('document.activeElement.closest("#settingsModal")!==null')
    page.keyboard.press('Escape');assert page.evaluate('GAR.currentView')=='dice'
    # Active round is retained across navigation; reset and free grants are unavailable.
    nav(page,'mines');page.locator('#mn-start').click();stake_balance=balance(page);nav(page,'lobby');assert page.locator('#inplayBar').is_visible()
    page.locator('#settingsBtn').click();page.locator('#resetBtn').click();assert not page.locator('#resetModal').is_visible() and balance(page)==stake_balance
    page.keyboard.press('Escape');page.locator('#returnToRound').click();page.locator('#mn-collect').click();wait_idle(page);assert balance(page)==12500
    # Sound and cents persist. Reset confirmation keeps statistics.
    page.evaluate('GAR.Wallet.setBalance(123.45);GAR.Wallet.setPreference("sound",false)');page.reload();page.wait_for_function('GAR.ready')
    assert balance(page)==123.45 and page.evaluate('GAR.S.on') is False
    page.locator('#settingsBtn').click();page.locator('#resetBtn').click();page.locator('#resetNo').click();assert balance(page)==123.45
    page.locator('#settingsBtn').click();page.locator('#resetBtn').click();page.locator('#resetYes').click();assert balance(page)==10000
    # Refill dispatch cannot double-credit.
    page.evaluate('GAR.Wallet.setBalance(0);document.getElementById("freeChipsBtn").click();document.getElementById("claimBtn").click()');assert balance(page)==5000
    # An unfinished interactive wager is refunded on reload, exactly once.
    nav(page,'mines');page.locator('#mn-start').click();assert balance(page)==4975
    page.reload();page.wait_for_function('GAR.ready');assert balance(page)==5000 and page.evaluate('GAR.Wallet.stats.voids')==1
    page.reload();page.wait_for_function('GAR.ready');assert balance(page)==5000

def layout_mobile(page):
    assert page.locator('#menuBtn').is_visible();assert page.locator('#sidebar').evaluate('(e)=>e.inert')
    page.locator('#menuBtn').tap();assert page.locator('#sidebar').get_attribute('class').endswith('show')
    assert not page.locator('#sidebar').evaluate('(e)=>e.inert')
    page.keyboard.press('Escape');assert page.locator('#menuBtn').evaluate('(e)=>e===document.activeElement')
    assert page.locator('#sidebar').evaluate('(e)=>e.inert')
    page.locator('#menuBtn').tap();page.locator('.sidebar [data-view="baccarat"]').tap();assert page.evaluate('GAR.currentView')=='baccarat'
    assert page.locator('#menuBtn').get_attribute('aria-expanded')=='false'
    for width,height in [(320,760),(375,812),(390,844),(768,1024),(1024,768),(1440,1000)]:
        page.set_viewport_size({'width':width,'height':height})
        for game in ['lobby']+page.evaluate('GAR.LIBRARY.map(g=>g.id)'):
            nav(page,game)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,game)
    page.set_viewport_size({'width':390,'height':844});nav(page,'lobby');page.screenshot(path=str(ROOT/'tests/screenshots/lobby-mobile.png'),full_page=True)
    for game in ['blackjack','baccarat','mines','roulette']:
        nav(page,game);page.screenshot(path=str(ROOT/f'tests/screenshots/{game}-mobile.png'),full_page=True)

def large_demo_returns(page):
    page.set_viewport_size({'width':320,'height':760})
    for value in [999999.99,9999999.99,9e12]:
        page.evaluate('(n)=>GAR.Wallet.setBalance(n)',value)
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.evaluate('GAR.Dev.apply("all",{luckEnabled:true,luck:1e16,reward:100,customReturn:10000})')
    for game,prefix in [('mines','mn'),('dice','di'),('wheel','lw')]:
        page.evaluate('GAR.Wallet.setBalance(8e12)');nav(page,game)
        page.locator('#'+prefix+'-stake').fill('1000000');page.locator('#'+prefix+'-start').click()
        if game=='mines':
            page.locator('#mn-grid [data-index="0"]').click();page.wait_for_function('!GAR.games.mines.state.busy');page.locator('#mn-collect').click()
        wait_idle(page)
        assert page.evaluate('GAR.Wallet.history[0].returnCents')==100000000000000
        assert balance(page)==8999999000000
        assert 'Returned 1,000,000,000,000 chips' in page.locator('#'+prefix+'-result').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.locator('#menuBtn').click();page.locator('.mobile-record').click()
    assert page.locator('#statsModal').is_visible()
    assert page.locator('#statsModal .modal-box').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert page.locator('#roundHistory').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    assert '1,000,000,000,000' in page.locator('#roundHistory').inner_text()
    page.screenshot(path=str(ROOT/'tests/screenshots/huge-record-mobile.png'),full_page=True)
    page.keyboard.press('Escape')
    page.evaluate('GAR.adminUnlocked=true;GAR.showView("admin")')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert page.locator('#admin-luck').input_value()=='10000000000000000'
    page.screenshot(path=str(ROOT/'tests/screenshots/admin-mobile.png'),full_page=True)


def polish_feedback(page):
    assert page.locator('.creator-credit').count()==0
    assert page.locator('footer .footer-credit').count()==1
    assert page.locator('footer .footer-credit').inner_text()=='Made by Jayden White'
    for width in [1440,1024,768,390,320]:
        page.set_viewport_size({'width':width,'height':900})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert page.evaluate('''(()=>{const f=document.querySelector('footer .footer-credit').getBoundingClientRect(),foot=document.querySelector('footer').getBoundingClientRect(),b=document.querySelector('.brand').getBoundingClientRect(),w=document.querySelector('.wallet').getBoundingClientRect(),a=document.querySelector('#accountBtn').getBoundingClientRect(),h=document.querySelector('.topbar').getBoundingClientRect();return f.width>0&&f.right<=foot.right+1&&b.right<=w.left&&a.top>=h.top&&a.bottom<=h.bottom})()''')
    page.set_viewport_size({'width':1440,'height':1000})
    page.evaluate('GAR.Wallet.setBalance(13500.25)')
    assert page.locator('#balance').inner_text()=='13,500.25' and balance(page)==13500.25
    assert page.locator('#balance').evaluate('(el)=>el.getAnimations().length')>0
    # Await the actual finished state, not wall-clock time under parallel browser load.
    page.wait_for_function('document.getElementById("balance").getAnimations().length===0',timeout=2000)
    nav(page,'plinko');page.wait_for_function('!GAR.games.plinko.state.running')
    assert balance(page)==13500.25
    nav(page,'lobby');page.wait_for_timeout(350)
    page.locator('.hero [data-view="blackjack"]').hover();page.wait_for_timeout(220)
    assert page.locator('.hero [data-view="blackjack"]').evaluate('(el)=>new DOMMatrix(getComputedStyle(el).transform).m42')<0
    page.locator('.hero [data-view="blackjack"]').click();page.wait_for_timeout(350)
    assert page.locator('#view-blackjack').evaluate('(el)=>getComputedStyle(el).opacity')=='1'
    assert balance(page)==13500.25


def polish_modals(page):
    nav(page,'dice');page.locator('#settingsBtn').click()
    assert page.evaluate('document.getElementById("main").inert')
    page.keyboard.press('Escape');assert page.evaluate('GAR.Modal.active===null')
    # A closing animation cannot leak the main Space action through the backdrop.
    page.keyboard.press('Space');assert page.evaluate('GAR.Wallet.stats.plays')==0
    page.locator('#settingsModal').wait_for(state='hidden')
    assert not page.evaluate('document.getElementById("main").inert||document.body.classList.contains("modal-open")')
    page.evaluate('GAR.Modal.open("settingsModal");GAR.Modal.close();GAR.Modal.open("settingsModal");GAR.Modal.close();GAR.Modal.open("redeemModal")')
    page.wait_for_timeout(300)
    assert page.evaluate('GAR.Modal.active.id')=='redeemModal'
    assert page.locator('.modal:not(.hidden)').count()==1
    assert page.locator('#redeemModal').evaluate('(e)=>!e.inert')
    page.keyboard.press('Escape')
    page.evaluate('document.getElementById("redeemModal").getAnimations().forEach(a=>a.cancel())')
    page.locator('#redeemModal').wait_for(state='hidden')
    assert not page.evaluate('document.getElementById("main").inert||document.querySelector(".topbar").inert')
    page.set_viewport_size({'width':390,'height':844})
    page.locator('#settingsBtn').click();page.keyboard.press('Escape');page.locator('#settingsModal').wait_for(state='hidden')
    assert page.locator('#sidebar').evaluate('(e)=>e.inert')
    page.emulate_media(reduced_motion='reduce')
    page.locator('#settingsBtn').click();page.keyboard.press('Escape')
    assert page.locator('#settingsModal').evaluate('(e)=>e.classList.contains("hidden")')


def polish_admin_exact(page):
    nav(page,'dice');before=balance(page)
    assert page.evaluate('GAR.CONFIG.adminCode==="TIMMY123"')
    page.locator('#settingsBtn').click();page.locator('#settingsModal [data-open="redeemModal"]').click()
    assert page.locator('#redeemInput').get_attribute('type')=='password'
    for wrong in ['timmy123','TIMMY12',' TIMMY123','TIMMY123 ','TIMMY 123','JAYDEN123','']:
        page.locator('#redeemInput').fill(wrong);page.locator('#redeemSubmit').click()
        assert not page.evaluate('GAR.adminUnlocked')
        assert page.locator('#redeemFeedback').inner_text() and page.locator('#redeemInput').get_attribute('aria-invalid')=='true'
        assert balance(page)==before
    page.locator('#redeemInput').fill('TIMMY123');click_many(page,'#redeemSubmit',8)
    assert page.evaluate('GAR.currentView')=='admin' and page.locator('#view-admin').count()==1
    assert page.locator('.modal:not(.hidden)').count()==0
    assert page.locator('#redeemInput').input_value()==''
    assert page.evaluate('!document.body.innerText.includes(GAR.CONFIG.adminCode)')
    page.locator('#admin-amount').fill('-1');page.locator('#admin-add').click();assert balance(page)==before
    page.locator('#admin-close').click();assert page.evaluate('GAR.currentView')=='dice'
    assert balance(page)==before


def polish_all_segments(page):
    nav(page,'wheel');start=balance(page);values=page.evaluate('GAR.Rules.LUCKY_SEGMENTS')
    initial=page.locator('.prize-stage .rl-pointer').bounding_box()
    for index,mult in enumerate(values):
        page.evaluate('(u)=>GAR.RNG.unit=()=>u',(index+.25)/12)
        click_many(page,'#lw-start',8);wait_idle(page)
        last=page.evaluate('GAR.games.wheel.state.last')
        start=round(start-25+25*mult,2)
        assert last['index']==index and last['multiplier']==mult and balance(page)==start
        assert page.locator('#lw-wheel .is-selected').count()==1
        assert page.locator('#lw-wheel .is-selected').get_attribute('data-segment')==str(index)
        assert (last['rotation']+index*30)%360==0
        assert page.evaluate('''(()=>{const m=new DOMMatrix(getComputedStyle(document.getElementById('lw-wheel')).transform),a=(Math.atan2(m.b,m.a)*180/Math.PI+360)%360,t=((-GAR.games.wheel.state.last.index*30)%360+360)%360;return Math.min(Math.abs(a-t),360-Math.abs(a-t))<.01})()''')
        assert page.evaluate('GAR.Wallet.stats.resolved')==index+1
        assert page.locator('#lw-wheel').evaluate('(e)=>e.getAnimations().length')==0
    final=page.locator('.prize-stage .rl-pointer').bounding_box()
    assert abs(initial['x']-final['x'])<.01 and abs(initial['y']-final['y'])<.01
    assert balance(page)==10825 and page.evaluate('GAR.Wallet.stats.plays')==12


def polish_real_wheels(page):
    nav(page,'wheel')
    page.evaluate('''GAR.RNG.unit=()=>.8;window.chooseCount=0;const choose=GAR.Outcomes.choose.bind(GAR.Outcomes);GAR.Outcomes.choose=(...args)=>{window.chooseCount++;return choose(...args)};window.pointerTicks=0;const p=document.querySelector('.prize-stage .rl-pointer'),native=p.animate.bind(p);p.animate=(...args)=>{window.pointerTicks++;return native(...args)}''')
    click_many(page,'#lw-start',6)
    assert balance(page)==9975 and page.locator('#lw-start').is_disabled()
    assert page.locator('#lw-start').get_attribute('aria-busy')=='true'
    assert page.evaluate('GAR.games.wheel.state.index')==9
    samples=[]
    for delay in [80,220,450,2350,800]:
        page.wait_for_timeout(delay)
        sample=page.locator('#lw-wheel').evaluate('(e)=>{const a=e.getAnimations()[0];return a?{t:a.currentTime/1000,p:a.effect.getComputedTiming().progress}:null}')
        if sample:samples.append(sample)
    assert len(samples)>=4
    rate=lambda a,b:(b['p']-a['p'])/(b['t']-a['t'])
    assert rate(samples[1],samples[2])>rate(samples[0],samples[1])
    assert rate(samples[-2],samples[-1])<rate(samples[1],samples[2])*.2
    wait_idle(page)
    assert page.evaluate('window.chooseCount')==1 and page.evaluate('window.pointerTicks')>12
    last=page.evaluate('GAR.games.wheel.state.last');assert last['index']==9 and last['rotation']>=1800 and last['result']['returned']==500
    assert balance(page)==10475 and page.evaluate('GAR.Wallet.stats.resolved')==1
    page.wait_for_timeout(300);page.screenshot(path=str(ROOT/'tests/screenshots/wheel-polished-desktop.png'),full_page=True)
    # Roulette keeps its original 37-pocket ordering and counter-rotating ball.
    nav(page,'roulette');page.evaluate('GAR.RNG.unit=()=>.5')
    page.locator('#rl-board [data-key="n18"]').click();click_many(page,'#rl-spin')
    page.wait_for_timeout(400)
    assert page.locator('#rl-wheel').evaluate('(e)=>e.getAnimations().length')==1
    assert page.locator('#rl-orbit').evaluate('(e)=>e.getAnimations().length')==1
    wait_idle(page);last=page.evaluate('GAR.games.roulette.last')
    assert last['n']==18 and last['result']['returned']==900 and balance(page)==11350
    assert abs((last['rotation']+last['idx']*360/37)%360)<.001 or abs((last['rotation']+last['idx']*360/37)%360-360)<.001
    assert last['orbit']%360==0 and page.evaluate('window.chooseCount')==2
    assert page.locator('#rl-wheel .is-selected').get_attribute('data-pocket')=='18'
    assert page.evaluate('GAR.Wallet.stats.plays===2&&GAR.Wallet.stats.resolved===2')


def polish_interruptions(page):
    nav(page,'wheel');page.evaluate('GAR.RNG.unit=()=>.26');page.locator('#lw-start').click();page.wait_for_timeout(180)
    selected=page.evaluate('GAR.games.wheel.state.index');assert selected==3
    page.locator('#lw-wheel').evaluate('(e)=>e.getAnimations().forEach(a=>a.cancel())');wait_idle(page)
    assert balance(page)==10100 and page.evaluate('GAR.games.wheel.state.last.index')==selected
    # A second real spin overlaps the old cancelled spin's completion deadline.
    page.evaluate('GAR.RNG.unit=()=>0');click_many(page,'#lw-start',8)
    page.set_viewport_size({'width':390,'height':844});nav(page,'lobby');page.wait_for_timeout(250);nav(page,'wheel')
    wait_idle(page);assert balance(page)==10075 and page.evaluate('GAR.Wallet.stats.resolved')==2
    assert page.locator('#lw-wheel .is-selected').get_attribute('data-segment')=='0'
    page.wait_for_timeout(350);assert balance(page)==10075
    # An unavailable native animation API still resolves the selected half-return.
    page.evaluate('document.getElementById("lw-wheel").animate=()=>{throw new Error("Test-only unavailable animation")};GAR.RNG.unit=()=>.175')
    page.locator('#lw-start').click();wait_idle(page)
    assert balance(page)==10062.5 and page.evaluate('GAR.games.wheel.state.last.index')==2
    assert page.locator('#lw-start').is_enabled()
    # Invalid selection refunds exactly the stake, even with large demo overrides.
    page.evaluate('GAR.Dev.apply("wheel",{reward:3,customReturn:10000});GAR.RNG.int=()=>99')
    before=balance(page);page.locator('#lw-start').click();wait_idle(page)
    assert balance(page)==before and page.evaluate('GAR.Wallet.history[0].returnCents')==2500
    assert page.evaluate('GAR.Wallet.stats.plays===4&&GAR.Wallet.stats.resolved===4')
    assert 'stake was returned' in page.locator('#lw-result').inner_text().lower()
    assert page.locator('#lw-wheel').evaluate('(e)=>!e.getAnimations().length&&e.style.willChange===""')


def polish_reduce_reload(page):
    nav(page,'wheel');page.evaluate('GAR.RNG.unit=()=>.6');page.locator('#lw-start').click();page.wait_for_timeout(120)
    page.locator('#settingsBtn').click();page.locator('#settingsMotion').click();wait_idle(page)
    assert page.evaluate('GAR.Wallet.prefs.reducedMotion') and balance(page)==10025
    assert page.evaluate('GAR.games.wheel.state.last.index')==7
    page.keyboard.press('Escape')
    page.evaluate('GAR.Wallet.setPreference("reducedMotion",false);GAR.RNG.unit=()=>.8')
    page.locator('#lw-start').click();assert balance(page)==10000
    page.reload();page.wait_for_function('GAR.ready');assert balance(page)==10025 and page.evaluate('GAR.Wallet.stats.voids')==1
    page.reload();page.wait_for_function('GAR.ready');assert balance(page)==10025 and page.evaluate('GAR.Wallet.stats.voids')==1
    page.emulate_media(reduced_motion='reduce');page.evaluate('GAR.RNG.unit=()=>.175')
    page.locator('#lw-start').click();wait_idle(page);assert balance(page)==10012.5
    assert page.locator('#lw-wheel').evaluate('(e)=>!e.getAnimations().length')
    # Controlled visibility-change event checks the browser-background recovery path.
    page.emulate_media(reduced_motion='no-preference');page.evaluate('GAR.RNG.unit=()=>.8')
    page.locator('#lw-start').click();page.wait_for_timeout(120)
    page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))')
    wait_idle(page);assert balance(page)==10487.5 and page.evaluate('GAR.Wallet.stats.resolved')==3
    assert page.locator('#lw-wheel').evaluate('(e)=>!e.getAnimations().length&&e.dataset.spinning==="false"')
    page.evaluate('delete document.hidden')


def phase2_allin_every_game(page):
    page.evaluate('GAR.Dev.apply("all",{luckEnabled:true,luck:1e16})')
    # 1. Blackjack 1-click All-In at 2,500,000 chips (above legacy 1M limit)
    page.evaluate('GAR.Wallet.setBalance(2500000)');nav(page,'blackjack')
    page.locator('#bj-allin').click();assert page.locator('#bj-bet').inner_text()=='2,500,000'
    page.locator('#bj-deal').click()
    if not page.locator('#bj-stand').is_disabled():page.locator('#bj-stand').click()
    wait_idle(page);assert page.evaluate('GAR.Wallet.history[0].allIn===true&&GAR.Wallet.history[0].stakeCents===250000000')
    # 2. Roulette 1-click All-In chip
    page.evaluate('GAR.Wallet.setBalance(3000000)');nav(page,'roulette')
    page.locator('#rl-allin-chip').click();page.locator('#rl-board [data-key="red"]').click()
    assert page.locator('#rl-total').inner_text()=='3,000,000'
    page.locator('#rl-spin').click();wait_idle(page)
    assert page.evaluate('GAR.Wallet.history[0].allIn===true&&GAR.Wallet.history[0].stakeCents===300000000')
    # 3. Slots, Video Poker, Plinko 1-click All-In
    for gid,btn,go in [('slots','#sl-allin','#sl-spin'),('poker','#vp-allin','#vp-deal'),('plinko','#pl-allin','#pl-drop')]:
        page.evaluate('GAR.Wallet.setBalance(1750000)');nav(page,gid)
        page.locator(btn).click();page.locator(go).click()
        if gid=='poker':
            page.wait_for_function('GAR.games.poker.state.phase==="draw"&&!GAR.games.poker.state.busy')
            page.locator('#vp-deal').click()
        wait_idle(page)
        assert page.evaluate('GAR.Wallet.history[0].allIn===true&&GAR.Wallet.history[0].stakeCents===175000000')
    # 4. All six setupBet games 1-click All-In / MAX
    for gid,mod,stake_in,go in [
        ('baccarat','#ba-bet-module','#ba-stake','#ba-start'),
        ('hilo','#hl-bet-module','#hl-stake','#hl-start'),
        ('dice','#di-bet-module','#di-stake','#di-start'),
        ('mines','#mn-bet-module','#mn-stake','#mn-start'),
        ('crash','#cr-bet-module','#cr-stake','#cr-start'),
        ('wheel','#lw-bet-module','#lw-stake','#lw-start')
    ]:
        page.evaluate('GAR.Wallet.setBalance(4200000)');nav(page,gid)
        page.locator(f'{mod} [data-allin]').click()
        assert float(page.locator(stake_in).input_value())==4200000
        page.locator(go).click()
        if gid=='hilo':
            page.locator('#hl-higher').click();page.locator('#hl-collect').click()
        elif gid=='mines':
            page.locator('#mn-grid [data-index="0"]').click();page.wait_for_function('!GAR.games.mines.state.busy');page.locator('#mn-collect').click()
        elif gid=='crash':
            page.wait_for_function('GAR.games.crash.state.phase==="active"');page.locator('#cr-cash').click()
        wait_idle(page)
        assert page.evaluate('GAR.Wallet.history[0].allIn===true&&GAR.Wallet.history[0].stakeCents===420000000')


def phase2_accounts_and_daily(page):
    # Open Account modal, create account, claim daily bonus, logout to Guest, reload, login back
    page.locator('#accountBtn').click();assert page.locator('#accountModal').is_visible()
    page.locator('#authTabs [data-auth-tab="register"]').click()
    page.locator('#regUsername').fill('TimmyVault');page.locator('#regPassword').fill('Crown999!');page.locator('#registerSubmit').click()
    assert page.evaluate('GAR.Accounts.current.loggedIn&&GAR.Accounts.current.username==="TimmyVault"')
    assert page.locator('#accountBtnText').inner_text()=='TimmyVault'
    page.keyboard.press('Escape');page.locator('#accountModal').wait_for(state='hidden')
    # Claim Daily Royale Gift
    page.locator('.wallet-plus').click();assert page.locator('#rewardsModal').is_visible()
    before=balance(page);page.locator('#dailyClaimBtn').click()
    assert balance(page)==before+2500 and page.locator('#dailyClaimBtn').is_disabled()
    page.keyboard.press('Escape');page.locator('#rewardsModal').wait_for(state='hidden')
    # Play one winning Dice round so stats & balance are unique
    nav(page,'dice');page.evaluate('GAR.Dev.apply("dice",{luckEnabled:true,luck:1e16})')
    page.locator('#di-bet-module [data-allin]').click();page.locator('#di-start').click();wait_idle(page)
    saved_bal=balance(page);assert saved_bal>12500
    # Sign out -> isolated Guest session at 10,000
    page.locator('#accountBtn').click();page.locator('#logoutBtn').click()
    assert not page.evaluate('GAR.Accounts.current.loggedIn') and balance(page)==10000
    # Wrong password rejected
    page.locator('#loginUsername').fill('TimmyVault');page.locator('#loginPassword').fill('Wrong123!');page.locator('#loginSubmit').click()
    assert not page.evaluate('GAR.Accounts.current.loggedIn') and balance(page)==10000
    # Reload browser & sign back in
    page.reload();page.wait_for_function('GAR.ready')
    page.locator('#accountBtn').click()
    page.locator('#loginUsername').fill('timmyvault');page.locator('#loginPassword').fill('Crown999!');page.locator('#loginSubmit').click()
    assert page.evaluate('GAR.Accounts.current.loggedIn&&GAR.Accounts.current.username==="TimmyVault"')
    assert balance(page)==saved_bal and page.evaluate('GAR.Wallet.stats.plays===1')
    # Export backup code and verify layout at 320px
    page.set_viewport_size({'width':320,'height':780})
    assert page.locator('#accountModal .modal-box').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    page.screenshot(path=str(ROOT/'tests/screenshots/account-vault-mobile.png'),full_page=True)


def phase2_executive_admin(page):
    page.locator('#settingsBtn').click();page.locator('#settingsModal [data-open="redeemModal"]').click()
    page.locator('#redeemInput').fill('TIMMY123');page.locator('#redeemSubmit').click()
    assert page.evaluate('GAR.currentView==="admin"')
    assert page.evaluate('!document.body.innerText.includes(GAR.CONFIG.adminCode)')
    # 1-click 10x Luck macro across all 11 games
    page.locator('#admin-macro-10x').click()
    assert page.locator('#admin-game-matrix .matrix-card.is-mod').count()==11
    # Executive treasury mints
    before=balance(page);page.locator('[data-admin-grant="1000000"]').click();assert balance(page)==before+1000000
    page.locator('#admin-double-wallet').click();assert balance(page)==(before+1000000)*2
    # Promo Code Forge
    page.locator('#admin-promo-code').fill('ROYALE77');page.locator('#admin-promo-chips').fill('50000');page.locator('#admin-promo-create').click()
    assert 'ROYALE77' in page.locator('#admin-promo-list').inner_text()
    # Persist lock across full page reload
    page.locator('#admin-persist-lock').check()
    page.screenshot(path=str(ROOT/'tests/screenshots/admin-executive-desktop.png'),full_page=True)
    page.reload();page.wait_for_function('GAR.ready')
    assert page.evaluate('GAR.Dev.persistLocked&&GAR.Dev.snapshot("roulette").luck===10')
    assert page.locator('#gameGrid .gcard-mod-tag:not(.hidden)').count()==11
    # Redeem forged custom promo code
    before2=balance(page);page.locator('#settingsBtn').click();page.locator('#settingsModal [data-open="redeemModal"]').click()
    page.locator('#redeemInput').fill('royale77');page.locator('#redeemSubmit').click()
    assert balance(page)==before2+50000
    page.keyboard.press('Escape');page.locator('#redeemModal').wait_for(state='hidden')
    # Check 320px narrow responsive fit on Executive Control Deck
    page.evaluate('GAR.adminUnlocked=true;GAR.showView("admin")')
    page.set_viewport_size({'width':320,'height':800})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')


with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    cases=[('Lobby, original/custom graphics, filters and all eleven navigation routes',lobby_navigation),('Blackjack naturals, push, soft 17, hit/bust and double',blackjack),('Roulette planned chips, undo/clear, pocket geometry and exact return',roulette),('Slots exactly-once spin, stake lock and visible center payline',slots),('Slots resize during real animation',responsive_slots,'no-preference'),('Video Poker keyboard holds, actual royal return and replacement integrity',poker),('Plinko visible peg paths and three concurrent independent settlements',plinko,'no-preference'),('Plinko eight-ball admission limit',plinko_limit),('Baccarat Player/Banker/Tie, commission, third cards and push',baccarat),('Hi-Lo ties, success, rank extremes, collect and loss',hilo),('Dice 36-outcome probability, exact award, equality loss and invalid input',dice),('Mines precommitted layout, resolution lock, collect, mine and auto-collect',mines),('Lucky Wheel prize/pointer alignment and zero/half/boosted returns',wheel),('Crash predeadline cash-out, crash rejection, auto collection and equality',crash),('Hidden admin invalid/valid code, scoped luck, rewards and normal restoration',admin),('Admin wallet confirmations, huge balances, bonus, reset and effects',admin_wallet),('Modals/focus, redeem/refill, active-round locks and persisted recovery',wallet_modals_persistence),('Responsive layout across six viewport sizes and touch navigation',layout_mobile,'reduce',True),('Maximum demo multipliers, trillion-chip returns and narrow admin layout',large_demo_returns)]
    cases += [('Polish: creator branding, authoritative wallet reveal, screen feedback and idle Plinko',polish_feedback,'no-preference'),('Polish: animated modal exits, rapid reopen, cancellation and mobile inertness',polish_modals,'no-preference'),('Polish: exact demo admin code, rejected variants, repeated submissions and return route',polish_admin_exact),('Polish: every wheel segment, actual transform, selected highlight and exactly-once return',polish_all_segments),('Polish: real accelerating/decelerating Lucky Wheel and counter-rotating Roulette',polish_real_wheels,'no-preference'),('Polish: cancelled/failed animation, resize/navigation and safe stake refund',polish_interruptions,'no-preference'),('Polish: live reduced-motion changes, interrupted reload and controlled visibility recovery',polish_reduce_reload,'no-preference'),('Phase 2: 1-click All-In and multi-million stakes across all 11 games',phase2_allin_every_game),('Phase 2: local player accounts, password auth, guest isolation and daily gift',phase2_accounts_and_daily),('Phase 2: TIMMY123 Executive Control Deck, 10x matrix lock, reload lock and promo forge',phase2_executive_admin)]
    if os.environ.get('GAR_TEST_FILTER'):
        cases=[c for c in cases if os.environ['GAR_TEST_FILTER'].lower() in c[0].lower()]
    try:
        for case in cases:run(browser,*case)
    finally:
        browser.close()
        (ROOT/'tests'/os.environ.get('GAR_RESULT_FILE','browser-results.json')).write_text(json.dumps({'status':'passed' if RESULTS and all(r['status']=='passed' for r in RESULTS) and len(RESULTS)==len(cases) else 'incomplete or failed','browser':'Playwright Chromium','base_url':BASE,'tests':RESULTS},indent=2))
    print(f'\n{len(RESULTS)} browser integration groups passed.')
