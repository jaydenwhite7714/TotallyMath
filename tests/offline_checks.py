"""Supplementary actual Chromium checks: audio, normal motion, file:// and opaque preview.
Run while the modular app is served on port 8080. No runtime test hooks are shipped.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, html
ROOT=Path(__file__).resolve().parents[1]
checks=[]
with sync_playwright() as p:
    browser=p.chromium.launch(args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:8080/');page.wait_for_function('GAR.ready');page.evaluate('document.fonts.ready')
    assert page.evaluate('GAR.S.ctx===null'),'No forced audio initialization on page load'
    checks.append('AudioContext is not forced before user interaction')
    page.locator('#settingsBtn').click()
    page.wait_for_function('GAR.S.ctx?.state==="running"')
    # Keep an oscillator alive: a dormant AudioNode may report its intrinsic, not rendered, gain.
    page.evaluate('GAR.S.tone(440,2,"sine",.1)');page.wait_for_timeout(50)
    page.locator('#settingsSound').click();page.wait_for_timeout(250)
    assert page.evaluate('GAR.S.on===false&&GAR.S.master.gain.value<0.001')
    page.keyboard.press('Escape')
    checks.append('A genuine click starts the synth; master mute silences an already-playing tone')
    assert page.evaluate('(()=>{const ids=[...document.querySelectorAll("[id]")].map(x=>x.id);return ids.length===new Set(ids).size})()')
    checks.append('No duplicate runtime element or SVG definition IDs')
    page.evaluate('GAR.showView("lobby")');page.wait_for_timeout(350)
    page.screenshot(path=str(ROOT/'tests/screenshots/lobby-desktop.png'),full_page=True)
    for game in ['blackjack','roulette','baccarat','mines','crash']:
        page.evaluate('(id)=>GAR.showView(id)',game);page.wait_for_timeout(220)
        page.screenshot(path=str(ROOT/f'tests/screenshots/{game}-desktop.png'),full_page=True)
    # Normal motion and real time: supplements virtual-clock deadline regressions.
    page.evaluate('GAR.Dev.apply("crash",{luckEnabled:true,luck:1e16});document.getElementById("cr-start").click()')
    page.wait_for_timeout(950)
    assert page.evaluate('GAR.games.crash.state.phase==="active"&&GAR.games.crash.state.multiplier>1.1')
    page.locator('#cr-cash').click();assert page.evaluate('GAR.Wallet.stats.resolved===1')
    checks.append('Real-time Crash graph climbs and manual cash-out settles')
    page.evaluate('GAR.Dev.reset("all");GAR.Dev.apply("slots",{luckEnabled:true,luck:1e16});GAR.showView("slots")')
    page.locator('#sl-spin').click();page.wait_for_function('!GAR.Wallet.hasActive()');page.wait_for_timeout(500)
    page.screenshot(path=str(ROOT/'tests/screenshots/slots-jackpot.png'),full_page=True)
    assert page.locator('.jackpot-label').inner_text().strip()=='THE GOLDEN JACKPOT'
    assert page.evaluate('GAR.games.slots.last.out.every(s=>s==="7")')
    checks.append('Jackpot receipt, final visible sevens and celebration render')
    assert not errors,errors
    page.close()
    # Downloaded standalone with every HTTP(S) request blocked; data:/file: remain local.
    offline=browser.new_page(viewport={'width':1280,'height':900},reduced_motion='reduce')
    network=[]
    def only_local(route):
        if route.request.url.startswith(('http:','https:','ws:','wss:')):
            network.append(route.request.url);route.abort()
        else:route.continue_()
    offline.route('**/*',only_local)
    offline_errors=[];offline.on('pageerror',lambda e:offline_errors.append(str(e)))
    offline.goto((ROOT/'Golden-Ace-Royale.html').as_uri());offline.wait_for_function('GAR.ready');offline.evaluate('document.fonts.ready')
    assert offline.evaluate('document.fonts.check("500 16px Cinzel")&&document.fonts.check("500 16px Outfit")')
    offline.locator('#gameGrid [data-view="dice"]').click();offline.locator('#di-start').click();offline.wait_for_function('!GAR.Wallet.hasActive()')
    assert offline.evaluate('GAR.Wallet.stats.plays===1&&GAR.Wallet.stats.resolved===1')
    assert not offline_errors,offline_errors
    assert not network,network
    checks.append('Standalone file:// edition plays offline; embedded fonts load; zero network requests')
    offline.close()
    # Same-origin is NOT allowed: this recreates the viewer's storage-denied preview.
    outer=browser.new_page(viewport={'width':1280,'height':900},reduced_motion='reduce')
    outer.route('**/*',only_local)
    sandbox_errors=[];outer.on('pageerror',lambda e:sandbox_errors.append(str(e)))
    source=(ROOT/'Golden-Ace-Royale.html').read_text()
    outer.set_content('<iframe id="game" sandbox="allow-scripts" style="border:0;width:1200px;height:850px" srcdoc="'+html.escape(source,quote=True)+'"></iframe>')
    frame=outer.frames[1];frame.wait_for_function('window.GAR?.ready');frame.evaluate('document.fonts.ready')
    assert frame.evaluate('GAR.Wallet.storageAvailable===false')
    assert frame.evaluate('document.fonts.check("500 16px Cinzel")')
    frame.locator('#gameGrid [data-view="wheel"]').click();frame.locator('#lw-start').click();frame.wait_for_function('!GAR.Wallet.hasActive()')
    assert frame.evaluate('GAR.Wallet.stats.plays===1&&GAR.Wallet.stats.resolved===1')
    assert not sandbox_errors,sandbox_errors
    assert not network,network
    checks.append('Opaque allow-scripts sandbox preview plays with storage denied and no network')
    browser.close()
(ROOT/'tests/offline-audio-results.json').write_text(json.dumps({'status':'passed','checks':checks,'unexpected_page_errors':[],'network_requests':[]},indent=2))
for check in checks:print('PASS',check)
